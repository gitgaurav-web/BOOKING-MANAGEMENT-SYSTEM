import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { getLocalIsoDate } from '../utils/dateValidation';

const router = Router();

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

export default router;
