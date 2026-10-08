import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/helpers';
import { apiMutationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Get all holidays
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const holidays = await prisma.holiday.findMany({
      orderBy: { date: 'asc' },
    });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch holidays.' });
  }
});

// Admin: Add holiday
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, date, description, hallScope = 'ALL' } = req.body;

    if (!name || !date) {
      res.status(400).json({ error: 'Holiday name and date are required.' });
      return;
    }

    const item = await prisma.holiday.create({
      data: { name, date, description, hallScope },
    });

    await logActivity(
      req.user!.id,
      'CREATE_HOLIDAY',
      'HOLIDAY',
      item.id,
      `Added institutional holiday: ${name} (${date})`
    );

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add holiday.' });
  }
});

// Admin: Delete holiday
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Holiday not found.' });
      return;
    }

    await prisma.holiday.delete({ where: { id } });
    await logActivity(req.user!.id, 'DELETE_HOLIDAY', 'HOLIDAY', id, `Deleted holiday: ${existing.name}`);

    res.json({ message: 'Holiday deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete holiday.' });
  }
});

export default router;
