import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/helpers';
import { apiMutationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Get all blocked dates
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.blockedDate.findMany({
      include: { vehicle: true },
      orderBy: { startDate: 'desc' },
    });
    // Add backward compatible hall alias
    const mapped = list.map((item) => ({
      ...item,
      hall: item.vehicle,
      hallId: item.vehicleId,
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blocked dates.' });
  }
});

// Admin: Create blocked date
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId, hallId, startDate, endDate, reason, description } = req.body;
    const resolvedVehicleId = vehicleId || hallId || null;

    if (!startDate || !endDate || !reason) {
      res.status(400).json({ error: 'Start date, end date, and reason are required.' });
      return;
    }

    const blocked = await prisma.blockedDate.create({
      data: {
        vehicleId: resolvedVehicleId,
        startDate,
        endDate,
        reason,
        description,
        createdById: req.user!.id,
      },
      include: { vehicle: true },
    });

    await logActivity(
      req.user!.id,
      'BLOCK_DATE',
      'BLOCKED_DATE',
      blocked.id,
      `Blocked ${blocked.vehicle?.name || 'All Campus Fleet Vehicles'} from ${startDate} to ${endDate} (${reason})`
    );

    res.status(201).json({
      ...blocked,
      hall: blocked.vehicle,
      hallId: blocked.vehicleId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create blocked date.' });
  }
});

// Admin: Delete/Unblock date
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.blockedDate.findUnique({ where: { id }, include: { vehicle: true } });
    if (!existing) {
      res.status(404).json({ error: 'Blocked date entry not found.' });
      return;
    }

    await prisma.blockedDate.delete({ where: { id } });
    await logActivity(
      req.user!.id,
      'UNBLOCK_DATE',
      'BLOCKED_DATE',
      id,
      `Unblocked ${existing.vehicle?.name || 'All Campus Vehicles'} (${existing.startDate} - ${existing.endDate})`
    );

    res.json({ message: 'Date successfully unblocked.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove blocked date.' });
  }
});

export default router;
