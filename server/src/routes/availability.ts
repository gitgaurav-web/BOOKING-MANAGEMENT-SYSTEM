import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

/**
 * GET /api/availability
 * Query parameters:
 *   hallId: (optional) ID of specific hall
 *   startDate: (required or defaults to start of current month) YYYY-MM-DD
 *   endDate: (required or defaults to end of current month) YYYY-MM-DD
 * 
 * Returns day-by-day availability status matrix:
 * Status values: 'AVAILABLE' | 'BOOKED' | 'PENDING' | 'BLOCKED' | 'MAINTENANCE' | 'HOLIDAY'
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
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
            details: { notes: maint.notes, responsiblePerson: maint.responsiblePerson },
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

        // 4. Check Approved Booking (BOOKED)
        const approvedBooking = bookings.find(
          b => {
            const bEnd = b.endDate || b.bookingDate;
            return b.hallId === hall.id && b.status === 'APPROVED' && b.bookingDate <= dateStr && bEnd >= dateStr;
          }
        );
        if (approvedBooking) {
          availabilityMap[dateStr][hall.id] = {
            hallId: hall.id,
            hallName: hall.name,
            date: dateStr,
            status: 'BOOKED',
            bookingId: approvedBooking.bookingId,
            eventName: approvedBooking.eventName,
            bookingType: approvedBooking.bookingType,
            startTime: approvedBooking.startTime,
            endTime: approvedBooking.endTime,
            department: approvedBooking.department?.name,
            bookedBy: approvedBooking.requestedBy,
            purpose: approvedBooking.purpose,
          };
          continue;
        }

        // 5. Check Pending Booking
        const pendingBooking = bookings.find(
          b => {
            const bEnd = b.endDate || b.bookingDate;
            return b.hallId === hall.id && b.status === 'PENDING' && b.bookingDate <= dateStr && bEnd >= dateStr;
          }
        );
        if (pendingBooking) {
          availabilityMap[dateStr][hall.id] = {
            hallId: hall.id,
            hallName: hall.name,
            date: dateStr,
            status: 'PENDING',
            bookingId: pendingBooking.bookingId,
            eventName: pendingBooking.eventName,
            department: pendingBooking.department?.name,
            startTime: pendingBooking.startTime,
            endTime: pendingBooking.endTime,
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
