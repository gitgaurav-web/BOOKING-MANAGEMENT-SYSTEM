import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/helpers';
import { apiMutationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

export const DEFAULT_BOOKING_TERMS = [
  'Sticking posters or notices on walls is strictly prohibited.',
  'Use of double-sided tape, glue, nails, or any adhesive on walls is not allowed.',
  'Any damage to walls, furniture, equipment, or other facilities must be repaired at the cost of the hosting department.',
  'Furniture must be handled carefully and returned to its original arrangement after use.',
  'All audio-visual equipment must be handled carefully. Unauthorised operation is not permitted.',
  'Food and beverages are not permitted inside.',
  'Any decorations or banners must be approved in advance.',
  'Lights, AC, projectors, and other equipment must be switched off after use.',
  'The hall must be vacated on time and left in proper condition.',
  'Any damage or technical issues must be reported to the concerned authority immediately.',
  'The hosting department is responsible for ensuring that all participants follow these rules.',
];

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
  'customEquipmentCatalog',
  'iqacNotificationEmail',
  'storeNotificationEmail',
  'bookingTermsAndConditions',
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
      customEquipmentCatalog: '',
      iqacNotificationEmail: 'iqac@sairamce.edu.in',
      storeNotificationEmail: 'store@sairamce.edu.in',
      bookingTermsAndConditions: JSON.stringify(DEFAULT_BOOKING_TERMS),
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

    // 1.1 Super Admin only permission check for bookingTermsAndConditions
    if (updates.bookingTermsAndConditions !== undefined) {
      if (req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          error: 'Permission Denied: Only Super Admin (IQAC) is authorized to modify Facility Booking Terms & Conditions.',
        });
        return;
      }

      try {
        const parsed = typeof updates.bookingTermsAndConditions === 'string'
          ? JSON.parse(updates.bookingTermsAndConditions)
          : updates.bookingTermsAndConditions;

        if (!Array.isArray(parsed) || parsed.length === 0) {
          res.status(400).json({ error: 'bookingTermsAndConditions must be a non-empty array of rules.' });
          return;
        }

        const cleaned = parsed.map((item: any) => String(item).trim()).filter(Boolean);
        if (cleaned.length === 0) {
          res.status(400).json({ error: 'At least one valid term or condition rule is required.' });
          return;
        }

        updates.bookingTermsAndConditions = JSON.stringify(cleaned);
      } catch {
        res.status(400).json({ error: 'Invalid format for bookingTermsAndConditions. Must be a valid JSON array of strings.' });
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
