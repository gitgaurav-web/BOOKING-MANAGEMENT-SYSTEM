import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { isValidStrictIsoDate, getLocalIsoDate } from '../utils/dateValidation';

function calculateFreeTimeWindows(
  events: Array<{ startTime: string; endTime: string }>,
  dayStart = '09:00',
  dayEnd = '18:00'
): Array<{ start: string; end: string }> {
  if (events.length === 0) {
    return [{ start: dayStart, end: dayEnd }];
  }
  const sorted = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const merged: Array<{ start: string; end: string }> = [];
  for (const ev of sorted) {
    const s = ev.startTime < dayStart ? dayStart : ev.startTime;
    const e = ev.endTime > dayEnd ? dayEnd : ev.endTime;
    if (s >= e) continue;
    if (merged.length === 0) {
      merged.push({ start: s, end: e });
    } else {
      const last = merged[merged.length - 1];
      if (s <= last.end) {
        if (e > last.end) last.end = e;
      } else {
        merged.push({ start: s, end: e });
      }
    }
  }

  const free: Array<{ start: string; end: string }> = [];
  let cur = dayStart;
  for (const block of merged) {
    if (block.start > cur) {
      free.push({ start: cur, end: block.start });
    }
    if (block.end > cur) {
      cur = block.end;
    }
  }
  if (cur < dayEnd) {
    free.push({ start: cur, end: dayEnd });
  }
  return free;
}

const router = Router();

router.get('/', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawHallId = req.query.hallId;
    const rawStart = req.query.startDate;
    const rawEnd = req.query.endDate;

    const hallId = Array.isArray(rawHallId) ? String(rawHallId[0]) : (rawHallId ? String(rawHallId) : undefined);
    const startDate = Array.isArray(rawStart) ? String(rawStart[0]) : (rawStart ? String(rawStart) : undefined);
    const endDate = Array.isArray(rawEnd) ? String(rawEnd[0]) : (rawEnd ? String(rawEnd) : undefined);

    if (hallId) {
      const hallExists = await prisma.hall.findUnique({ where: { id: hallId } });
      if (!hallExists) {
        res.status(404).json({ error: 'Specified hallId does not exist.' });
        return;
      }
    }

    if (startDate && !isValidStrictIsoDate(startDate)) {
      res.status(400).json({ error: 'Invalid startDate. Must be valid calendar date in YYYY-MM-DD format.' });
      return;
    }
    if (endDate && !isValidStrictIsoDate(endDate)) {
      res.status(400).json({ error: 'Invalid endDate. Must be valid calendar date in YYYY-MM-DD format.' });
      return;
    }

    const todayStr = getLocalIsoDate();
    const [tYear, tMonth] = todayStr.split('-').map(Number);
    // Format YYYY-MM-DD for the 1st of current month
    const defaultStart = `${tYear}-${String(tMonth).padStart(2, '0')}-01`;
    // Format end of next month
    const lastDayNextMonth = new Date(tYear, tMonth + 1, 0).getDate();
    const nextMonthYear = tMonth === 12 ? tYear + 1 : tYear;
    const nextMonthNum = tMonth === 12 ? 1 : tMonth + 1;
    const defaultEnd = `${nextMonthYear}-${String(nextMonthNum).padStart(2, '0')}-${String(lastDayNextMonth).padStart(2, '0')}`;

    const rangeStart = startDate || defaultStart;
    const rangeEnd = endDate || defaultEnd;

    if (rangeStart > rangeEnd) {
      res.status(400).json({ error: 'startDate must be earlier than or equal to endDate.' });
      return;
    }

    const diffDays = Math.round(
      (new Date(rangeEnd + 'T00:00:00Z').getTime() - new Date(rangeStart + 'T00:00:00Z').getTime()) /
        (1000 * 3600 * 24)
    );
    if (diffDays > 180) {
      res.status(400).json({ error: 'Date range cannot exceed 180 days (6 months).' });
      return;
    }

    // Fetch system settings
    const holidayPolicySetting = await prisma.systemSetting.findUnique({
      where: { key: 'allowHolidayBookings' },
    });
    const allowHolidayBookings = holidayPolicySetting?.value === 'true';

    const displaySetting = await prisma.systemSetting.findUnique({
      where: { key: 'publicUpcomingDisplay' },
    });
    const displayMode = displaySetting?.value || 'EVENT_TITLE'; // 'EVENT_TITLE' | 'DEPARTMENT_EVENT' | 'RESERVED_SLOT'

    const requester = req.user;
    const isRequesterAdmin = requester && ['ADMIN', 'SUPER_ADMIN'].includes(requester.role);

    // Fetch halls
    const halls = hallId 
      ? await prisma.hall.findMany({ where: { id: hallId } })
      : await prisma.hall.findMany({ where: { status: 'ACTIVE' } });

    // Fetch all bookings overlapping range (handles bookings starting before rangeStart but ending inside/after)
    const bookings = await prisma.booking.findMany({
      where: {
        ...(hallId ? { hallId } : {}),
        status: { in: ['APPROVED', 'PENDING'] },
        bookingDate: { lte: rangeEnd },
        OR: [
          { endDate: { gte: rangeStart } },
          { endDate: null, bookingDate: { gte: rangeStart } },
        ],
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

        // 3. Check Holidays (honoring system allowHolidayBookings policy)
        const hol = holidays.find(
          h => h.date === dateStr && (h.hallScope === 'ALL' || h.hallScope === hall.name)
        );
        if (hol && !allowHolidayBookings) {
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

          // Determine standard slot occupancies (Morning: 09:00-13:00, Afternoon: 13:00-17:00)
          const isMorningApproved = approved.some(b => {
            const bEnd = b.endDate || b.bookingDate;
            if (b.bookingType === 'FULL_DAY' || b.bookingDate !== bEnd) return true;
            return b.startTime < '13:00' && b.endTime > '09:00';
          });

          const isAfternoonApproved = approved.some(b => {
            const bEnd = b.endDate || b.bookingDate;
            if (b.bookingType === 'FULL_DAY' || b.bookingDate !== bEnd) return true;
            return b.startTime < '17:00' && b.endTime > '13:00';
          });

          const isFullDayApproved = approved.some(b => {
            const bEnd = b.endDate || b.bookingDate;
            return b.bookingType === 'FULL_DAY' || b.bookingDate !== bEnd || (b.startTime <= '09:30' && b.endTime >= '16:30');
          });

          const freeSlots: string[] = [];
          const occupiedSlots: string[] = [];
          let primaryStatus: 'BOOKED' | 'PARTIAL' | 'PENDING' = 'PENDING';

          if (isFullDayApproved || (isMorningApproved && isAfternoonApproved)) {
            primaryStatus = 'BOOKED';
            occupiedSlots.push('FULL_DAY', 'MORNING', 'AFTERNOON');
          } else if (isMorningApproved && !isAfternoonApproved) {
            primaryStatus = 'PARTIAL';
            occupiedSlots.push('MORNING');
            freeSlots.push('AFTERNOON');
          } else if (!isMorningApproved && isAfternoonApproved) {
            primaryStatus = 'PARTIAL';
            occupiedSlots.push('AFTERNOON');
            freeSlots.push('MORNING');
          } else if (approved.length > 0) {
            primaryStatus = 'PARTIAL';
          } else {
            primaryStatus = 'PENDING';
            const isMorningPending = pending.some(b => b.bookingType === 'FULL_DAY' || (b.startTime < '13:00' && b.endTime > '09:00'));
            const isAfternoonPending = pending.some(b => b.bookingType === 'FULL_DAY' || (b.startTime < '17:00' && b.endTime > '13:00'));
            if (!isMorningPending) freeSlots.push('MORNING');
            if (!isAfternoonPending) freeSlots.push('AFTERNOON');
          }

          const primaryBooking = approved[0] || pending[0];

          const sanitizeBookingForAvailability = (b: any) => {
            const isOwner = requester && requester.id === b.userId;
            const canSeePrivateDetails = isRequesterAdmin || isOwner;

            let sanitizedTitle: string;
            let sanitizedBookingId: string;
            let sanitizedDept: string | null = null;

            if (canSeePrivateDetails) {
              sanitizedTitle = b.eventName;
              sanitizedBookingId = b.bookingId;
              sanitizedDept = b.department?.name || 'Academic Dept';
            } else if (b.status === 'PENDING') {
              sanitizedTitle = 'Pending Reservation';
              sanitizedBookingId = 'HB-PENDING';
              sanitizedDept = displayMode === 'RESERVED_SLOT' ? null : 'Academic Department';
            } else {
              if (displayMode === 'RESERVED_SLOT') {
                sanitizedTitle = 'Reserved Academic Session';
                sanitizedBookingId = 'RESERVED';
                sanitizedDept = null;
              } else if (displayMode === 'DEPARTMENT_EVENT') {
                sanitizedTitle = b.department?.name ? `${b.department.name} Academic Event` : 'Department Academic Event';
                sanitizedBookingId = b.bookingId;
                sanitizedDept = b.department?.name || 'Academic Department';
              } else {
                sanitizedTitle = b.eventName;
                sanitizedBookingId = b.bookingId;
                sanitizedDept = b.department?.name || 'Academic Department';
              }
            }

            return {
              bookingId: sanitizedBookingId,
              eventName: sanitizedTitle,
              status: b.status,
              bookingType: b.bookingType,
              startTime: b.startTime,
              endTime: b.endTime,
              department: sanitizedDept,
              bookedBy: canSeePrivateDetails ? b.requestedBy : undefined,
              purpose: canSeePrivateDetails ? b.purpose : undefined,
            };
          };

          const eventsList = matchingBookings.map(b => sanitizeBookingForAvailability(b));
          const sanitizedPrimary = sanitizeBookingForAvailability(primaryBooking);

          const freeWindows = (primaryStatus === 'BOOKED' || isFullDayApproved)
            ? []
            : calculateFreeTimeWindows(
                approved.map(b => {
                  const bEnd = b.endDate || b.bookingDate;
                  if (b.bookingDate !== bEnd || b.bookingType === 'FULL_DAY') {
                    return { startTime: '09:00', endTime: '18:00' };
                  }
                  return { startTime: b.startTime, endTime: b.endTime };
                })
              );

          availabilityMap[dateStr][hall.id] = {
            hallId: hall.id,
            hallName: hall.name,
            date: dateStr,
            status: primaryStatus,
            hasApproved: approved.length > 0,
            hasPending: pending.length > 0,
            freeSlots,
            occupiedSlots,
            freeWindows,
            holidayName: hol?.name,
            isHoliday: Boolean(hol),
            bookingId: sanitizedPrimary.bookingId,
            eventName: sanitizedPrimary.eventName,
            bookingType: sanitizedPrimary.bookingType,
            startTime: sanitizedPrimary.startTime,
            endTime: sanitizedPrimary.endTime,
            department: sanitizedPrimary.department,
            bookedBy: sanitizedPrimary.bookedBy,
            purpose: sanitizedPrimary.purpose,
            events: eventsList,
          };
          continue;
        }

        // 5. Otherwise Available
        availabilityMap[dateStr][hall.id] = {
          hallId: hall.id,
          hallName: hall.name,
          date: dateStr,
          status: 'AVAILABLE',
          freeSlots: ['MORNING', 'AFTERNOON', 'FULL_DAY'],
          occupiedSlots: [],
          freeWindows: [{ start: '09:00', end: '18:00' }],
          holidayName: hol?.name,
          isHoliday: Boolean(hol),
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
