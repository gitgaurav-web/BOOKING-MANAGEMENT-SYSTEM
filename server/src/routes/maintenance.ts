import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/helpers';
import { apiMutationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Get all maintenance schedules
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.maintenance.findMany({
      include: { vehicle: true },
      orderBy: { startDate: 'desc' },
    });
    const mapped = list.map((item) => ({
      ...item,
      hall: item.vehicle,
      hallId: item.vehicleId,
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch maintenance schedules.' });
  }
});

// Admin: Schedule maintenance
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId, hallId, startDate, endDate, reason, maintenanceType, notes, description, garageName, cost, responsiblePerson } = req.body;
    const targetVehicleId = vehicleId || hallId;

    if (!targetVehicleId || !startDate || !endDate || !reason) {
      res.status(400).json({ error: 'Vehicle, start date, end date, and reason are required.' });
      return;
    }

    const item = await prisma.maintenance.create({
      data: {
        vehicleId: targetVehicleId,
        startDate,
        endDate,
        maintenanceType: maintenanceType || 'REGULAR_SERVICE',
        reason,
        description: description || notes || '',
        notes: notes || null,
        garageName: garageName || null,
        cost: cost ? parseFloat(cost) : 0,
        responsiblePerson: responsiblePerson || null,
      },
      include: { vehicle: true },
    });

    await logActivity(
      req.user!.id,
      'SCHEDULE_MAINTENANCE',
      'MAINTENANCE',
      item.id,
      `Scheduled maintenance for ${item.vehicle.name} from ${startDate} to ${endDate}`
    );

    res.status(201).json({
      ...item,
      hall: item.vehicle,
      hallId: item.vehicleId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule maintenance.' });
  }
});

// Admin: Delete maintenance schedule
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.maintenance.findUnique({ where: { id }, include: { vehicle: true } });
    if (!existing) {
      res.status(404).json({ error: 'Maintenance entry not found.' });
      return;
    }

    await prisma.maintenance.delete({ where: { id } });
    await logActivity(
      req.user!.id,
      'REMOVE_MAINTENANCE',
      'MAINTENANCE',
      id,
      `Removed maintenance schedule for ${existing.vehicle.name}`
    );

    res.json({ message: 'Maintenance record removed.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete maintenance entry.' });
  }
});

export default router;
