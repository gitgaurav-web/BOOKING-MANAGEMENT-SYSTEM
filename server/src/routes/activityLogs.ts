import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/helpers';

const router = Router();

// GET /api/activity-logs (Admin only)
router.get('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await prisma.activityLog.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve activity logs.' });
  }
});

export default router;
