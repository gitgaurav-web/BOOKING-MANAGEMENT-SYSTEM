import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/helpers';
import { apiMutationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

export const ALLOWED_SETTING_KEYS = new Set([
  'siteName',
  'institutionName',
  'contactEmail',
  'contactPhone',
  'address',
  'academicSession',
  'accreditationText',
  'allowedEmailDomain',
  'minAdvanceNoticeDays',
  'maxAdvanceNoticeDays',
  'requireAdminApproval',
  'requireUserApproval',
  'allowWeekendBookings',
  'allowHolidayBookings',
  'emailNotificationsEnabled',
  'publicUpcomingDisplay',
]);

// GET /api/settings - retrieve public/configured settings
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {
      siteName: 'Sri Sairam College Facility Booking Portal',
      institutionName: 'Sri Sairam College of Engineering',
      contactEmail: 'info@sairamce.edu.in',
      contactPhone: '080-27830221',
      address: 'Sai Leo Nagar, Guddanahalli Village, Samandur Post, Anekal, Bengaluru, Karnataka - 562106',
      academicSession: 'Academic Session 2026-27',
      accreditationText: 'Approved by AICTE · Affiliated to VTU Belagavi · NAAC Accredited',
      allowedEmailDomain: '',
      minAdvanceNoticeDays: '0',
      maxAdvanceNoticeDays: '90',
      requireAdminApproval: 'true',
      requireUserApproval: 'true',
      allowWeekendBookings: 'true',
      allowHolidayBookings: 'false',
      emailNotificationsEnabled: 'true',
      publicUpcomingDisplay: 'EVENT_TITLE', // 'EVENT_TITLE' | 'DEPARTMENT_EVENT' | 'RESERVED_SLOT'
    };

    for (const item of list) {
      if (ALLOWED_SETTING_KEYS.has(item.key)) {
        settingsMap[item.key] = item.value;
      }
    }

    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
});

// PUT /api/settings - update settings (Admin only with strict allowlisting and validation)
router.put('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updates = req.body as Record<string, any>;

    if (!updates || typeof updates !== 'object') {
      res.status(400).json({ error: 'Invalid settings payload. Expected an object.' });
      return;
    }

    // 1. Validate keys against allowlist
    for (const key of Object.keys(updates)) {
      if (!ALLOWED_SETTING_KEYS.has(key)) {
        res.status(400).json({ error: `Invalid setting key '${key}'. Not in allowed configuration keys.` });
        return;
      }
    }

    // 2. Validate boolean settings strictly
    const booleanKeys = [
      'requireAdminApproval',
      'requireUserApproval',
      'allowWeekendBookings',
      'allowHolidayBookings',
      'emailNotificationsEnabled',
    ];
    for (const bKey of booleanKeys) {
      if (updates[bKey] !== undefined) {
        const valStr = String(updates[bKey]).trim().toLowerCase();
        if (valStr !== 'true' && valStr !== 'false') {
          res.status(400).json({ error: `${bKey} must be a boolean ('true' or 'false').` });
          return;
        }
        updates[bKey] = valStr;
      }
    }

    // 2.1 Validate public upcoming display privacy mode
    if (updates.publicUpcomingDisplay !== undefined) {
      const allowedModes = ['EVENT_TITLE', 'DEPARTMENT_EVENT', 'RESERVED_SLOT'];
      if (!allowedModes.includes(String(updates.publicUpcomingDisplay))) {
        res.status(400).json({
          error: `publicUpcomingDisplay must be one of: ${allowedModes.join(', ')}.`,
        });
        return;
      }
    }

    // 2.2 Validate academic session, accreditation, and domain restrictions
    if (updates.academicSession !== undefined) {
      const sessStr = String(updates.academicSession).trim();
      if (sessStr.length > 80) {
        res.status(400).json({ error: 'academicSession must be at most 80 characters.' });
        return;
      }
      updates.academicSession = sessStr;
    }

    if (updates.accreditationText !== undefined) {
      const accStr = String(updates.accreditationText).trim();
      if (accStr.length > 250) {
        res.status(400).json({ error: 'accreditationText must be at most 250 characters.' });
        return;
      }
      updates.accreditationText = accStr;
    }

    if (updates.allowedEmailDomain !== undefined) {
      const domStr = String(updates.allowedEmailDomain).trim().toLowerCase().replace(/^@/, '');
      if (domStr.length > 100) {
        res.status(400).json({ error: 'allowedEmailDomain must be at most 100 characters.' });
        return;
      }
      updates.allowedEmailDomain = domStr;
    }

    // 3. Validate notice day numerical ranges strictly (reject non-digits like '2abc')
    if (updates.minAdvanceNoticeDays !== undefined) {
      const minStr = String(updates.minAdvanceNoticeDays).trim();
      if (!/^\d+$/.test(minStr)) {
        res.status(400).json({ error: 'minAdvanceNoticeDays must be a non-negative integer between 0 and 365.' });
        return;
      }
      const minDays = parseInt(minStr, 10);
      if (minDays < 0 || minDays > 365) {
        res.status(400).json({ error: 'minAdvanceNoticeDays must be an integer between 0 and 365.' });
        return;
      }
      updates.minAdvanceNoticeDays = String(minDays);
    }

    if (updates.maxAdvanceNoticeDays !== undefined) {
      const maxStr = String(updates.maxAdvanceNoticeDays).trim();
      if (!/^\d+$/.test(maxStr)) {
        res.status(400).json({ error: 'maxAdvanceNoticeDays must be a positive integer between 1 and 730.' });
        return;
      }
      const maxDays = parseInt(maxStr, 10);
      if (maxDays < 1 || maxDays > 730) {
        res.status(400).json({ error: 'maxAdvanceNoticeDays must be an integer between 1 and 730.' });
        return;
      }
      updates.maxAdvanceNoticeDays = String(maxDays);
    }

    // 4. Validate relative relation (min <= max)
    if (updates.minAdvanceNoticeDays !== undefined || updates.maxAdvanceNoticeDays !== undefined) {
      const currentList = await prisma.systemSetting.findMany();
      const currentMap: Record<string, string> = { minAdvanceNoticeDays: '1', maxAdvanceNoticeDays: '90' };
      for (const item of currentList) currentMap[item.key] = item.value;

      const effectiveMin = parseInt(String(updates.minAdvanceNoticeDays ?? currentMap.minAdvanceNoticeDays), 10);
      const effectiveMax = parseInt(String(updates.maxAdvanceNoticeDays ?? currentMap.maxAdvanceNoticeDays), 10);

      if (effectiveMin > effectiveMax) {
        res.status(400).json({
          error: `minAdvanceNoticeDays (${effectiveMin}) cannot be greater than maxAdvanceNoticeDays (${effectiveMax}).`,
        });
        return;
      }
    }

    // 4. Upsert validated settings
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
