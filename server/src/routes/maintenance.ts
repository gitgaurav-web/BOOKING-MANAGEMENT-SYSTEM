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
      include: { hall: true },
      orderBy: { startDate: 'desc' },
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch maintenance schedules.' });
  }
});

// Admin: Schedule maintenance
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hallId, startDate, endDate, reason, notes, responsiblePerson } = req.body;

    if (!hallId || !startDate || !endDate || !reason) {
      res.status(400).json({ error: 'Hall, start date, end date, and reason are required.' });
      return;
    }

    const item = await prisma.maintenance.create({
      data: {
        hallId,
        startDate,
        endDate,
        reason,
        notes,
        responsiblePerson,
      },
      include: { hall: true },
    });

    await logActivity(
      req.user!.id,
      'SCHEDULE_MAINTENANCE',
      'MAINTENANCE',
      item.id,
      `Scheduled maintenance for ${item.hall.name} from ${startDate} to ${endDate}`
    );

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule maintenance.' });
  }
});

// Admin: Delete maintenance schedule
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.maintenance.findUnique({ where: { id }, include: { hall: true } });
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
      `Removed maintenance schedule for ${existing.hall.name}`
    );

    res.json({ message: 'Maintenance record removed.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete maintenance entry.' });
  }
});

export default router;
