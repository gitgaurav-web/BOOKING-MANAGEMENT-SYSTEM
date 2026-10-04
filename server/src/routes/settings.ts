import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/helpers';

const router = Router();

// GET /api/settings - retrieve public/configured settings
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {
      siteName: 'College Facility Management System',
      institutionName: 'Apex Institute of Technology & Sciences',
      contactEmail: 'facilities@apex.edu',
      contactPhone: '+91 98765 43210',
      address: 'Main Academic Campus, Knowledge Park IV',
      minAdvanceNoticeDays: '1',
      maxAdvanceNoticeDays: '90',
      requireAdminApproval: 'true',
      allowWeekendBookings: 'true',
      allowHolidayBookings: 'false',
      emailNotificationsEnabled: 'true',
    };

    for (const item of list) {
      settingsMap[item.key] = item.value;
    }

    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
});

// PUT /api/settings - update settings (Admin only)
router.put('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updates = req.body as Record<string, string>;

    for (const [key, value] of Object.entries(updates)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    await logActivity(req.user!.id, 'UPDATE_SETTINGS', 'SYSTEM_SETTING', null, 'Updated system settings');

    res.json({ message: 'Settings updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

export default router;
