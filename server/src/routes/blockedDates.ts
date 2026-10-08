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
      include: { hall: true },
      orderBy: { startDate: 'desc' },
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blocked dates.' });
  }
});

// Admin: Create blocked date
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hallId, startDate, endDate, reason, description } = req.body;

    if (!startDate || !endDate || !reason) {
      res.status(400).json({ error: 'Start date, end date, and reason are required.' });
      return;
    }

    const blocked = await prisma.blockedDate.create({
      data: {
        hallId: hallId || null,
        startDate,
        endDate,
        reason,
        description,
        createdById: req.user!.id,
      },
      include: { hall: true },
    });

    await logActivity(
      req.user!.id,
      'BLOCK_DATE',
      'BLOCKED_DATE',
      blocked.id,
      `Blocked ${blocked.hall?.name || 'All Halls'} from ${startDate} to ${endDate} (${reason})`
    );

    res.status(201).json(blocked);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create blocked date.' });
  }
});

// Admin: Delete/Unblock date
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.blockedDate.findUnique({ where: { id }, include: { hall: true } });
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
      `Unblocked ${existing.hall?.name || 'All Halls'} (${existing.startDate} - ${existing.endDate})`
    );

    res.json({ message: 'Date successfully unblocked.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove blocked date.' });
  }
});

export default router;
