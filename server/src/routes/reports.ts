import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { getLocalIsoDate, isValidStrictIsoDate } from '../utils/dateValidation';
import { getUploadDirectory } from './upload';
import { logActivity } from '../utils/helpers';
import { apiMutationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// GET /api/reports/summary
router.get('/summary', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = getLocalIsoDate();

    // Counts
    const totalHalls = await prisma.hall.count();
    const pendingBookings = await prisma.booking.count({ where: { status: 'PENDING' } });
    const approvedBookings = await prisma.booking.count({ where: { status: 'APPROVED' } });
    const rejectedBookings = await prisma.booking.count({ where: { status: 'REJECTED' } });
    const cancelledBookings = await prisma.booking.count({ where: { status: 'CANCELLED' } });
    const blockedDatesCount = await prisma.blockedDate.count();
    const maintenanceCount = await prisma.maintenance.count();

    // Today status (accounting for multi-day ranges)
    const activeTodayBookings = await prisma.booking.findMany({
      where: {
        status: 'APPROVED',
        bookingDate: { lte: today },
      },
      select: { hallId: true, bookingDate: true, endDate: true },
    });

    const activeHallsToday = new Set<string>();
    for (const b of activeTodayBookings) {
      const bEnd = b.endDate || b.bookingDate;
      if (bEnd >= today) {
        activeHallsToday.add(b.hallId);
      }
    }

    const bookedToday = activeHallsToday.size;
    const availableToday = Math.max(0, totalHalls - bookedToday);

    // Upcoming bookings (including multi-day bookings ongoing or future)
    const allApprovedBookings = await prisma.booking.findMany({
      where: { status: 'APPROVED' },
      select: { bookingDate: true, endDate: true },
    });
    const upcomingBookings = allApprovedBookings.filter(b => (b.endDate || b.bookingDate) >= today).length;

    // Hall usage stats with actual utilized hours
    const halls = await prisma.hall.findMany();
    const hallUsage = await Promise.all(
      halls.map(async (h) => {
        const bookings = await prisma.booking.findMany({
          where: { hallId: h.id, status: 'APPROVED' },
          select: { bookingDate: true, endDate: true, startTime: true, endTime: true, bookingType: true },
        });

        let totalHours = 0;
        for (const b of bookings) {
          const bEnd = b.endDate || b.bookingDate;
          if (b.bookingDate !== bEnd) {
            const startD = new Date(b.bookingDate).getTime();
            const endD = new Date(bEnd).getTime();
            const days = Math.max(1, Math.round((endD - startD) / (1000 * 3600 * 24)) + 1);
            totalHours += days * 8;
          } else if (b.bookingType === 'FULL_DAY') {
            totalHours += 8;
          } else {
            const [sh, sm] = b.startTime.split(':').map(Number);
            const [eh, em] = b.endTime.split(':').map(Number);
            const duration = (eh * 60 + em - (sh * 60 + sm)) / 60;
            totalHours += Math.max(0, duration);
          }
        }

        return {
          id: h.id,
          name: h.name,
          bookingsCount: bookings.length,
          totalHours: Math.round(totalHours * 10) / 10,
        };
      })
    );

    // Department-wise bookings
    const departments = await prisma.department.findMany();
    const deptUsage = await Promise.all(
      departments.map(async (d) => {
        const count = await prisma.booking.count({
          where: { departmentId: d.id, status: 'APPROVED' },
        });
        return {
          id: d.id,
          name: d.name,
          code: d.code,
          bookingsCount: count,
        };
      })
    );

    // Monthly bookings distribution (Sample / Aggregate)
    const allApproved = await prisma.booking.findMany({
      where: { status: 'APPROVED' },
      select: { bookingDate: true, hall: { select: { name: true } } },
    });

    const monthlyMap: Record<string, { month: string; seminarHall: number; avHall: number; total: number }> = {};
    for (const b of allApproved) {
      const monthKey = b.bookingDate.substring(0, 7); // YYYY-MM
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, seminarHall: 0, avHall: 0, total: 0 };
      }
      monthlyMap[monthKey].total += 1;
      if (b.hall.name.toLowerCase().includes('seminar')) {
        monthlyMap[monthKey].seminarHall += 1;
      } else {
        monthlyMap[monthKey].avHall += 1;
      }
    }

    const monthlyTrends = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      metrics: {
        totalHalls,
        availableToday,
        bookedToday,
        pendingBookings,
        upcomingBookings,
        blockedDatesCount,
        cancelledBookings,
        rejectedBookings,
        approvedBookings,
        maintenanceCount,
      },
      hallUsage,
      deptUsage: deptUsage.filter(d => d.bookingsCount > 0),
      monthlyTrends,
      statusDistribution: [
        { name: 'Approved', count: approvedBookings, color: '#10B981' },
        { name: 'Pending', count: pendingBookings, color: '#F59E0B' },
        { name: 'Cancelled', count: cancelledBookings, color: '#EF4444' },
        { name: 'Rejected', count: rejectedBookings, color: '#6B7280' },
      ],
    });
  } catch (error) {
    console.error('Reports summary error:', error);
    res.status(500).json({ error: 'Failed to generate report summary.' });
  }
});

// GET /api/reports/export-csv
router.get('/export-csv', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { hall: true, department: true },
      orderBy: { bookingDate: 'desc' },
    });

    const headers = [
      'Booking ID',
      'Hall',
      'Event Name',
      'Booking Date',
      'Time Slot',
      'Booking Type',
      'Department',
      'Requested By',
      'Contact',
      'Email',
      'Status',
      'Created At',
    ];

    const rows = bookings.map(b => [
      `"${b.bookingId}"`,
      `"${b.hall.name}"`,
      `"${b.eventName.replace(/"/g, '""')}"`,
      `"${b.bookingDate}"`,
      `"${b.startTime} - ${b.endTime}"`,
      `"${b.bookingType}"`,
      `"${b.department?.name || 'N/A'}"`,
      `"${b.requestedBy}"`,
      `"${b.contactNumber}"`,
      `"${b.email}"`,
      `"${b.status}"`,
      `"${b.createdAt.toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="facility_bookings_report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV.' });
  }
});

// GET /api/reports/storage-metrics (Super Admin Only)
router.get('/storage-metrics', authenticate, requireRole('SUPER_ADMIN'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalBookings = await prisma.booking.count();
    const oldestBooking = await prisma.booking.findFirst({
      orderBy: { bookingDate: 'asc' },
      select: { bookingDate: true },
    });
    const newestBooking = await prisma.booking.findFirst({
      orderBy: { bookingDate: 'desc' },
      select: { bookingDate: true },
    });

    const [pendingCount, approvedCount, rejectedCount, cancelledCount] = await Promise.all([
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'APPROVED' } }),
      prisma.booking.count({ where: { status: 'REJECTED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
    ]);

    // Inspect upload directory
    const uploadDir = getUploadDirectory();
    let totalFiles = 0;
    let totalBytes = 0;
    let orphanFilesCount = 0;
    let orphanBytes = 0;

    if (fs.existsSync(uploadDir)) {
      const dirEntries = fs.readdirSync(uploadDir);
      const allBookingsWithAttachment = await prisma.booking.findMany({
        where: { attachmentUrl: { not: null } },
        select: { attachmentUrl: true },
      });

      const activeFilenames = new Set(
        allBookingsWithAttachment
          .map((b) => (b.attachmentUrl ? path.basename(b.attachmentUrl.split('?')[0]) : null))
          .filter(Boolean)
      );

      for (const entry of dirEntries) {
        try {
          const fullPath = path.join(uploadDir, entry);
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            totalFiles++;
            totalBytes += stat.size;
            if (!activeFilenames.has(entry)) {
              orphanFilesCount++;
              orphanBytes += stat.size;
            }
          }
        } catch {}
      }
    }

    res.json({
      totalBookings,
      oldestBookingDate: oldestBooking?.bookingDate || null,
      newestBookingDate: newestBooking?.bookingDate || null,
      statusBreakdown: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        cancelled: cancelledCount,
      },
      storage: {
        totalFiles,
        totalBytes,
        formattedSize: formatBytes(totalBytes),
        orphanFilesCount,
        orphanBytes,
        formattedOrphanSize: formatBytes(orphanBytes),
      },
    });
  } catch (error) {
    console.error('Storage metrics error:', error);
    res.status(500).json({ error: 'Failed to retrieve storage metrics.' });
  }
});

// GET /api/reports/range-preview (Super Admin Only)
router.get('/range-preview', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, status } = req.query as { startDate?: string; endDate?: string; status?: string };

    const filterWhere: any = {};
    if (startDate && isValidStrictIsoDate(startDate)) {
      filterWhere.bookingDate = { ...(filterWhere.bookingDate || {}), gte: startDate };
    }
    if (endDate && isValidStrictIsoDate(endDate)) {
      filterWhere.bookingDate = { ...(filterWhere.bookingDate || {}), lte: endDate };
    }
    if (status && status !== 'ALL') {
      filterWhere.status = status;
    }

    const count = await prisma.booking.count({ where: filterWhere });
    const bookingsWithAttachments = await prisma.booking.findMany({
      where: {
        ...filterWhere,
        attachmentUrl: { not: null },
      },
      select: {
        id: true,
        bookingId: true,
        attachmentUrl: true,
      },
    });

    let estimatedBytes = 0;
    const uploadDir = getUploadDirectory();
    for (const b of bookingsWithAttachments) {
      if (b.attachmentUrl) {
        try {
          const filename = path.basename(b.attachmentUrl.split('?')[0]);
          const fullPath = path.join(uploadDir, filename);
          if (fs.existsSync(fullPath)) {
            const stat = fs.statSync(fullPath);
            estimatedBytes += stat.size;
          }
        } catch {}
      }
    }

    const samples = await prisma.booking.findMany({
      where: filterWhere,
      take: 5,
      orderBy: { bookingDate: 'desc' },
      select: {
        bookingId: true,
        eventName: true,
        bookingDate: true,
        status: true,
        requestedBy: true,
        attachmentUrl: true,
      },
    });

    res.json({
      matchingCount: count,
      withAttachmentsCount: bookingsWithAttachments.length,
      estimatedBytes,
      formattedEstimatedSize: formatBytes(estimatedBytes),
      samples,
    });
  } catch (error) {
    console.error('Range preview error:', error);
    res.status(500).json({ error: 'Failed to preview range.' });
  }
});

// GET /api/reports/export-range (Super Admin Only)
router.get('/export-range', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, status, format = 'csv' } = req.query as {
      startDate?: string;
      endDate?: string;
      status?: string;
      format?: string;
    };

    const filterWhere: any = {};
    if (startDate && isValidStrictIsoDate(startDate)) {
      filterWhere.bookingDate = { ...(filterWhere.bookingDate || {}), gte: startDate };
    }
    if (endDate && isValidStrictIsoDate(endDate)) {
      filterWhere.bookingDate = { ...(filterWhere.bookingDate || {}), lte: endDate };
    }
    if (status && status !== 'ALL') {
      filterWhere.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where: filterWhere,
      include: {
        hall: { select: { name: true, code: true } },
        department: { select: { name: true, code: true } },
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { bookingDate: 'desc' },
    });

    const fileDateSuffix = `${startDate || 'start'}_to_${endDate || 'end'}`;

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="facility_bookings_archive_${fileDateSuffix}.json"`
      );
      res.status(200).send(JSON.stringify(bookings, null, 2));
      return;
    }

    const headers = [
      'Booking ID',
      'Event Name',
      'Hall Name',
      'Start Date',
      'End Date',
      'Time Slot',
      'Booking Type',
      'Department',
      'Requested By',
      'Contact Email',
      'Contact Number',
      'Status',
      'Purpose',
      'Participants',
      'VIP Guests',
      'Mementos',
      'Attachment URL',
      'Admin Notes',
      'Rejection Reason',
      'Created At',
    ];

    const rows = bookings.map((b) => [
      `"${b.bookingId}"`,
      `"${(b.eventName || '').replace(/"/g, '""')}"`,
      `"${(b.hall?.name || '').replace(/"/g, '""')}"`,
      `"${b.bookingDate}"`,
      `"${b.endDate || b.bookingDate}"`,
      `"${b.startTime} - ${b.endTime}"`,
      `"${b.bookingType}"`,
      `"${(b.department?.name || 'N/A').replace(/"/g, '""')}"`,
      `"${(b.requestedBy || '').replace(/"/g, '""')}"`,
      `"${b.email || ''}"`,
      `"${b.contactNumber || ''}"`,
      `"${b.status}"`,
      `"${(b.purpose || '').replace(/"/g, '""')}"`,
      `"${b.participantCount || 0}"`,
      `"${b.guestCount || 0}"`,
      `"${b.mementoCount || 0}"`,
      `"${b.attachmentUrl || ''}"`,
      `"${(b.adminNotes || '').replace(/"/g, '""')}"`,
      `"${(b.rejectionReason || '').replace(/"/g, '""')}"`,
      `"${b.createdAt.toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="facility_bookings_archive_${fileDateSuffix}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export range error:', error);
    res.status(500).json({ error: 'Failed to export booking archives.' });
  }
});

// POST /api/reports/purge-range (Super Admin Only - Safe Hard Deletion)
router.post('/purge-range', authenticate, requireRole('SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, status, confirmationKeyword } = req.body || {};

    if (confirmationKeyword !== 'DELETE-CONFIRMED') {
      res.status(400).json({
        error: 'Security verification failed: You must type DELETE-CONFIRMED exactly to execute data purge.',
      });
      return;
    }

    if (!startDate || !isValidStrictIsoDate(startDate) || !endDate || !isValidStrictIsoDate(endDate)) {
      res.status(400).json({
        error: 'Invalid date parameters. Both startDate and endDate must be valid YYYY-MM-DD dates.',
      });
      return;
    }

    if (startDate > endDate) {
      res.status(400).json({
        error: 'Start date cannot be after end date.',
      });
      return;
    }

    const filterWhere: any = {
      bookingDate: {
        gte: startDate,
        lte: endDate,
      },
    };
    if (status && status !== 'ALL') {
      filterWhere.status = status;
    }

    // 1. Fetch matching bookings to identify attachments
    const matchingBookings = await prisma.booking.findMany({
      where: filterWhere,
      select: {
        id: true,
        bookingId: true,
        attachmentUrl: true,
      },
    });

    if (matchingBookings.length === 0) {
      res.status(404).json({
        error: 'No bookings found matching the selected date range and criteria to purge.',
      });
      return;
    }

    // 2. Physical File Cleanup in uploads folder
    let deletedFilesCount = 0;
    let freedBytes = 0;
    const uploadDir = getUploadDirectory();

    for (const b of matchingBookings) {
      if (b.attachmentUrl) {
        try {
          const cleanFilename = path.basename(b.attachmentUrl.split('?')[0]);
          const filePath = path.join(uploadDir, cleanFilename);
          if (filePath.startsWith(uploadDir) && fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            freedBytes += stat.size;
            fs.unlinkSync(filePath);
            deletedFilesCount++;
          }
        } catch (fileErr) {
          console.error(`Failed to delete physical file for booking ${b.bookingId}:`, fileErr);
        }
      }
    }

    // 3. Delete database records
    const deleteResult = await prisma.booking.deleteMany({
      where: filterWhere,
    });

    // 4. Audit Log
    await logActivity(
      req.user?.id || null,
      'DATA_PURGE',
      'BOOKING_ARCHIVE',
      null,
      `Super Admin purged ${deleteResult.count} bookings (${startDate} to ${endDate}, filter: ${status || 'ALL'}). Cleaned ${deletedFilesCount} documents (${formatBytes(freedBytes)} disk space freed).`
    );

    res.json({
      success: true,
      deletedCount: deleteResult.count,
      deletedFilesCount,
      freedBytes,
      formattedFreedBytes: formatBytes(freedBytes),
      message: `Successfully purged ${deleteResult.count} bookings and cleaned up ${deletedFilesCount} associated files (${formatBytes(freedBytes)} freed).`,
    });
  } catch (error: any) {
    console.error('Purge range error:', error);
    res.status(500).json({ error: error.message || 'Failed to purge booking archives.' });
  }
});

// POST /api/reports/purge-orphans (Super Admin Only - Clean unreferenced uploads)
router.post('/purge-orphans', authenticate, requireRole('SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { confirmationKeyword } = req.body || {};

    if (confirmationKeyword !== 'DELETE-CONFIRMED') {
      res.status(400).json({
        error: 'Security verification failed: You must type DELETE-CONFIRMED to clean orphan files.',
      });
      return;
    }

    const uploadDir = getUploadDirectory();
    if (!fs.existsSync(uploadDir)) {
      res.json({ success: true, deletedCount: 0, freedBytes: 0, formattedFreedBytes: '0 Bytes' });
      return;
    }

    const dirEntries = fs.readdirSync(uploadDir);
    const allBookingsWithAttachment = await prisma.booking.findMany({
      where: { attachmentUrl: { not: null } },
      select: { attachmentUrl: true },
    });

    const activeFilenames = new Set(
      allBookingsWithAttachment
        .map((b) => (b.attachmentUrl ? path.basename(b.attachmentUrl.split('?')[0]) : null))
        .filter(Boolean)
    );

    let deletedOrphanCount = 0;
    let freedOrphanBytes = 0;

    for (const entry of dirEntries) {
      if (!activeFilenames.has(entry)) {
        try {
          const fullPath = path.join(uploadDir, entry);
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            freedOrphanBytes += stat.size;
            fs.unlinkSync(fullPath);
            deletedOrphanCount++;
          }
        } catch {}
      }
    }

    await logActivity(
      req.user?.id || null,
      'ORPHAN_PURGE',
      'STORAGE',
      null,
      `Super Admin purged ${deletedOrphanCount} orphan files (${formatBytes(freedOrphanBytes)} disk space freed).`
    );

    res.json({
      success: true,
      deletedCount: deletedOrphanCount,
      freedBytes: freedOrphanBytes,
      formattedFreedBytes: formatBytes(freedOrphanBytes),
      message: `Cleaned up ${deletedOrphanCount} orphan files, freeing ${formatBytes(freedOrphanBytes)} of server storage.`,
    });
  } catch (error: any) {
    console.error('Purge orphans error:', error);
    res.status(500).json({ error: error.message || 'Failed to clean orphan storage.' });
  }
});

export default router;
