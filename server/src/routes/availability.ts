import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hallId, startDate, endDate } = req.query as {
      hallId?: string;
      startDate?: string;
      endDate?: string;
    };

    const today = new Date();
    const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];

    const rangeStart = startDate || defaultStart;
    const rangeEnd = endDate || defaultEnd;

    // Fetch halls
    const halls = hallId 
      ? await prisma.hall.findMany({ where: { id: hallId } })
      : await prisma.hall.findMany({ where: { status: 'ACTIVE' } });

    // Fetch all bookings in range
    const bookings = await prisma.booking.findMany({
      where: {
        ...(hallId ? { hallId } : {}),
        bookingDate: { gte: rangeStart, lte: rangeEnd },
        status: { in: ['APPROVED', 'PENDING'] },
      },
      include: {
        department: true,
        user: { select: { name: true, email: true } },
      },
    });

    // Fetch blocked dates overlapping range
    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        ...(hallId ? { OR: [{ hallId }, { hallId: null }] } : {}),
        startDate: { lte: rangeEnd },
        endDate: { gte: rangeStart },
      },
    });

    // Fetch maintenances
    const maintenances = await prisma.maintenance.findMany({
      where: {
        ...(hallId ? { hallId } : {}),
        startDate: { lte: rangeEnd },
        endDate: { gte: rangeStart },
      },
    });

    // Fetch holidays
    const holidays = await prisma.holiday.findMany({
      where: {
        date: { gte: rangeStart, lte: rangeEnd },
      },
    });

    // Generate date map for each day and hall
    const currentIter = new Date(rangeStart);
    const endIter = new Date(rangeEnd);
    const availabilityMap: Record<string, Record<string, any>> = {};

    const isAuthenticated = !!req.user;

    while (currentIter <= endIter) {
      const dateStr = currentIter.toISOString().split('T')[0];
      availabilityMap[dateStr] = {};

      for (const hall of halls) {
        // 1. Check Maintenance
        const maint = maintenances.find(
          m => m.hallId === hall.id && m.startDate <= dateStr && m.endDate >= dateStr
        );
        if (maint) {
          availabilityMap[dateStr][hall.id] = {
            hallId: hall.id,
            hallName: hall.name,
            date: dateStr,
            status: 'MAINTENANCE',
            reason: maint.reason,
            details: isAuthenticated
              ? { notes: maint.notes, responsiblePerson: maint.responsiblePerson }
              : { description: 'Scheduled facility maintenance in progress.' },
          };
          continue;
        }

        // 2. Check Blocked Dates
        const block = blockedDates.find(
          b => (b.hallId === null || b.hallId === hall.id) && b.startDate <= dateStr && b.endDate >= dateStr
        );
        if (block) {
          availabilityMap[dateStr][hall.id] = {
            hallId: hall.id,
            hallName: hall.name,
            date: dateStr,
            status: 'BLOCKED',
            reason: block.reason,
            details: { description: block.description },
          };
          continue;
        }

        // 3. Check Holidays
        const hol = holidays.find(
          h => h.date === dateStr && (h.hallScope === 'ALL' || h.hallScope === hall.name)
        );
        if (hol) {
          availabilityMap[dateStr][hall.id] = {
            hallId: hall.id,
            hallName: hall.name,
            date: dateStr,
            status: 'HOLIDAY',
            reason: hol.name,
            details: { description: hol.description },
          };
          continue;
        }

        // 4. Check All Bookings (Approved & Pending) for this date & hall
        const matchingBookings = bookings.filter(b => {
          const bEnd = b.endDate || b.bookingDate;
          return b.hallId === hall.id && b.bookingDate <= dateStr && bEnd >= dateStr;
        });

        if (matchingBookings.length > 0) {
          const approved = matchingBookings.filter(b => b.status === 'APPROVED');
          const pending = matchingBookings.filter(b => b.status === 'PENDING');

          const primaryStatus = approved.length > 0 ? 'BOOKED' : 'PENDING';
          const primaryBooking = approved[0] || pending[0];

          const eventsList = matchingBookings.map(b => ({
            bookingId: isAuthenticated ? b.bookingId : (b.status === 'APPROVED' ? b.bookingId : 'HB-PENDING'),
            eventName: isAuthenticated ? b.eventName : (b.status === 'APPROVED' ? b.eventName : 'Pending Reservation'),
            status: b.status,
            bookingType: b.bookingType,
            startTime: b.startTime,
            endTime: b.endTime,
            department: isAuthenticated ? (b.department?.name || 'Department') : 'Academic Department',
            bookedBy: isAuthenticated ? b.requestedBy : undefined,
            purpose: isAuthenticated ? b.purpose : undefined,
          }));

          availabilityMap[dateStr][hall.id] = {
            hallId: hall.id,
            hallName: hall.name,
            date: dateStr,
            status: primaryStatus,
            hasApproved: approved.length > 0,
            hasPending: pending.length > 0,
            bookingId: primaryBooking.bookingId,
            eventName: primaryBooking.eventName,
            bookingType: primaryBooking.bookingType,
            startTime: primaryBooking.startTime,
            endTime: primaryBooking.endTime,
            department: primaryBooking.department?.name || 'Academic Dept',
            bookedBy: isAuthenticated ? primaryBooking.requestedBy : undefined,
            purpose: isAuthenticated ? primaryBooking.purpose : undefined,
            events: eventsList,
          };
          continue;
        }

        // 6. Otherwise Available
        availabilityMap[dateStr][hall.id] = {
          hallId: hall.id,
          hallName: hall.name,
          date: dateStr,
          status: 'AVAILABLE',
        };
      }

      currentIter.setDate(currentIter.getDate() + 1);
    }

    res.json({
      startDate: rangeStart,
      endDate: rangeEnd,
      halls: halls.map(h => ({ id: h.id, name: h.name, code: h.code, capacity: h.capacity, location: h.location })),
      availability: availabilityMap,
    });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({ error: 'Failed to retrieve availability.' });
  }
});

export default router;
