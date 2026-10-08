import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity, createNotification } from '../utils/helpers';

const router = Router();

// Helper to generate unique booking ID (e.g., HB-2026-0042)
async function generateBookingId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.booking.count();
  const num = String(count + 1).padStart(4, '0');
  return `HB-${year}-${num}`;
}

// Helper to check for conflict before creating/approving across single or multi-day range
async function checkBookingConflict(
  hallId: string,
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<{ hasConflict: boolean; reason: string }> {
  // 1. Check Maintenance
  const maintenance = await prisma.maintenance.findFirst({
    where: {
      hallId,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
  if (maintenance) {
    return { hasConflict: true, reason: `Hall is under maintenance: ${maintenance.reason}` };
  }

  // 2. Check Blocked Dates
  const blocked = await prisma.blockedDate.findFirst({
    where: {
      OR: [{ hallId }, { hallId: null }],
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
  if (blocked) {
    return { hasConflict: true, reason: `Date is blocked: ${blocked.reason}` };
  }

  // 3. Check Holidays
  const hall = await prisma.hall.findUnique({ where: { id: hallId } });
  const holiday = await prisma.holiday.findFirst({
    where: {
      date: { gte: startDate, lte: endDate },
      OR: [{ hallScope: 'ALL' }, { hallScope: hall?.name || '' }],
    },
  });
  if (holiday) {
    return { hasConflict: true, reason: `Institutional Holiday on ${holiday.date}: ${holiday.name}` };
  }

  // 4. Check Approved Booking overlapping dates
  const existingApproved = await prisma.booking.findMany({
    where: {
      hallId,
      status: 'APPROVED',
      bookingDate: { lte: endDate },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
  });

  for (const b of existingApproved) {
    const bEnd = b.endDate || b.bookingDate;
    // Overlapping date intervals: startDate <= bEnd && b.bookingDate <= endDate
    if (startDate <= bEnd && b.bookingDate <= endDate) {
      // If multi-day or full day
      if (b.bookingType === 'FULL_DAY' || b.bookingDate !== bEnd || startDate !== endDate) {
        return {
          hasConflict: true,
          reason: `Hall is already booked from ${b.bookingDate} to ${bEnd} by ${b.requestedBy} (${b.eventName})`,
        };
      }
      // Same-day slot check:
      if (startTime < b.endTime && b.startTime < endTime) {
        return {
          hasConflict: true,
          reason: `Time conflict with existing booking '${b.eventName}' (${b.startTime} - ${b.endTime}) on ${b.bookingDate}`,
        };
      }
    }
  }

  return { hasConflict: false, reason: '' };
}

// Create Booking Request
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      hallId,
      eventName,
      description,
      purpose,
      departmentId,
      bookingDate,
      endDate,
      bookingType = 'FULL_DAY',
      startTime = '09:00',
      endTime = '17:00',
      participantCount = 0,
      coordinatorName,
      contactNumber,
      email,
      specialRequirements,
      attachmentUrl,
      additionalNotes,
    } = req.body;

    if (!hallId || !eventName || !purpose || !bookingDate || !contactNumber || !email) {
      res.status(400).json({ error: 'Please provide all mandatory booking fields.' });
      return;
    }

    const effectiveEnd = endDate && endDate >= bookingDate ? endDate : bookingDate;

    // Load active system settings
    const settingsList = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {
      minAdvanceNoticeDays: '1',
      maxAdvanceNoticeDays: '90',
      allowWeekendBookings: 'true',
      allowHolidayBookings: 'false',
    };
    for (const s of settingsList) {
      settingsMap[s.key] = s.value;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const requestedStart = new Date(bookingDate + 'T00:00:00');
    const todayDate = new Date(todayStr + 'T00:00:00');
    const diffDays = Math.round((requestedStart.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    const minNotice = parseInt(settingsMap.minAdvanceNoticeDays || '1', 10);
    const maxNotice = parseInt(settingsMap.maxAdvanceNoticeDays || '90', 10);

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role);

    if (!isAdmin) {
      if (diffDays < minNotice) {
        res.status(400).json({
          error: `Minimum advance booking notice required is ${minNotice} day(s). Cannot book dates in the past or on short notice.`,
        });
        return;
      }
      if (diffDays > maxNotice) {
        res.status(400).json({
          error: `Booking exceeds maximum advance reservation window of ${maxNotice} days.`,
        });
        return;
      }

      // Check Weekend policy
      if (settingsMap.allowWeekendBookings === 'false') {
        const startDay = requestedStart.getDay(); // 0 is Sunday, 6 is Saturday
        const endDay = new Date(effectiveEnd + 'T00:00:00').getDay();
        if (startDay === 0 || startDay === 6 || endDay === 0 || endDay === 6) {
          res.status(400).json({ error: 'Institutional policy restricts weekend facility reservations.' });
          return;
        }
      }
    }

    // Department ownership and authorization check
    let finalDepartmentId: string | null = null;
    if (isAdmin) {
      finalDepartmentId = departmentId || null;
    } else {
      if (req.user!.departmentId) {
        finalDepartmentId = req.user!.departmentId;
      } else if (departmentId) {
        const deptExists = await prisma.department.findUnique({ where: { id: departmentId } });
        finalDepartmentId = deptExists ? deptExists.id : null;
      }
    }

    // Atomic transaction to avoid race conditions during concurrent bookings
    const user = req.user!;
    const initialStatus = isAdmin ? 'APPROVED' : 'PENDING';

    const booking = await prisma.$transaction(async (tx) => {
      // Re-evaluate conflict inside transaction lock
      const conflict = await checkBookingConflict(hallId, bookingDate, effectiveEnd, startTime, endTime);
      if (conflict.hasConflict) {
        throw new Error(`CONFLICT: ${conflict.reason}`);
      }

      const bookingId = await generateBookingId();

      return await tx.booking.create({
        data: {
          bookingId,
          userId: user.id,
          hallId,
          eventName,
          description,
          purpose,
          departmentId: finalDepartmentId,
          bookingDate,
          endDate: effectiveEnd !== bookingDate ? effectiveEnd : null,
          bookingType,
          startTime,
          endTime,
          participantCount: Number(participantCount) || 0,
          requestedBy: user.name,
          coordinatorName: coordinatorName || user.name,
          contactNumber,
          email,
          specialRequirements: typeof specialRequirements === 'string' ? specialRequirements : JSON.stringify(specialRequirements || []),
          attachmentUrl: attachmentUrl || null,
          additionalNotes,
          status: initialStatus,
          approvedById: isAdmin ? user.id : null,
          approvedAt: isAdmin ? new Date() : null,
        },
        include: { hall: true, department: true },
      });
    });

    await logActivity(
      user.id,
      'CREATE_BOOKING',
      'BOOKING',
      booking.id,
      `Booking request ${booking.bookingId} submitted for ${booking.hall.name} on ${bookingDate} (${initialStatus}).`
    );

    // Notify user
    await createNotification(
      user.id,
      isAdmin ? 'Booking Confirmed' : 'Booking Request Submitted',
      isAdmin
        ? `Your booking ${booking.bookingId} for ${booking.hall.name} on ${bookingDate} is confirmed.`
        : `Your booking request ${booking.bookingId} for ${booking.hall.name} on ${bookingDate} is submitted and awaiting admin approval.`,
      isAdmin ? 'SUCCESS' : 'INFO'
    );

    // Notify admins if created by normal user
    if (!isAdmin) {
      const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } });
      for (const adm of admins) {
        await createNotification(
          adm.id,
          'New Booking Request',
          `New request ${booking.bookingId} by ${user.name} for ${booking.hall.name} on ${bookingDate}.`,
          'ALERT'
        );
      }
    }

    res.status(201).json({
      ...booking,
      specialRequirements: JSON.parse(booking.specialRequirements || '[]'),
      message: isAdmin 
        ? 'Booking created and confirmed successfully.'
        : 'Booking request submitted successfully. Waiting for admin approval.',
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking request.' });
  }
});

// Get user's own bookings
router.get('/my-bookings', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user!.id },
      include: { hall: true, department: true },
      orderBy: { createdAt: 'desc' },
    });

    const parsed = bookings.map(b => ({
      ...b,
      specialRequirements: JSON.parse(b.specialRequirements || '[]'),
    }));

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve bookings.' });
  }
});

// Get all bookings (with search & filters) - for Admin or general directory
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hallId, status, departmentId, dateRange, search } = req.query as {
      hallId?: string;
      status?: string;
      departmentId?: string;
      dateRange?: string;
      search?: string;
    };

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role);

    // Filter conditions
    const whereClause: any = {};

    if (!isAdmin) {
      // Normal user only sees their own or public confirmed ones
      whereClause.OR = [
        { userId: req.user!.id },
        { status: 'APPROVED' },
      ];
    }

    if (hallId && hallId !== 'ALL') {
      whereClause.hallId = hallId;
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (departmentId && departmentId !== 'ALL') {
      whereClause.departmentId = departmentId;
    }

    if (search) {
      whereClause.OR = [
        { eventName: { contains: search } },
        { bookingId: { contains: search } },
        { requestedBy: { contains: search } },
        { purpose: { contains: search } },
      ];
    }

    const today = new Date().toISOString().split('T')[0];
    if (dateRange === 'TODAY') {
      whereClause.bookingDate = today;
    } else if (dateRange === 'UPCOMING') {
      whereClause.bookingDate = { gte: today };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        hall: true,
        department: true,
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { bookingDate: 'desc' },
    });

    const parsed = bookings.map(b => {
      const isOwner = b.userId === req.user!.id;
      const showPrivate = isAdmin || isOwner;
      return {
        ...b,
        contactNumber: showPrivate ? b.contactNumber : 'Protected',
        email: showPrivate ? b.email : 'Protected',
        attachmentUrl: showPrivate ? b.attachmentUrl : null,
        user: showPrivate ? b.user : { name: b.requestedBy, email: 'Protected', phone: 'Protected' },
        specialRequirements: JSON.parse(b.specialRequirements || '[]'),
      };
    });

    res.json(parsed);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// Get single booking by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        hall: true,
        department: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role);
    if (!isAdmin && booking.userId !== req.user!.id && booking.status !== 'APPROVED') {
      res.status(403).json({ error: 'Unauthorized to view this booking.' });
      return;
    }

    res.json({
      ...booking,
      specialRequirements: JSON.parse(booking.specialRequirements || '[]'),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve booking.' });
  }
});

// Admin: Approve Booking
router.patch('/:id/approve', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const existing = await prisma.booking.findUnique({ where: { id }, include: { hall: true } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    // Check conflict and update inside transaction to prevent race conditions
    const updated = await prisma.$transaction(async (tx) => {
      const conflict = await checkBookingConflict(
        existing.hallId,
        existing.bookingDate,
        existing.endDate || existing.bookingDate,
        existing.startTime,
        existing.endTime,
        existing.id
      );

      if (conflict.hasConflict) {
        throw new Error(`CONFLICT: ${conflict.reason}`);
      }

      return await tx.booking.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: req.user!.id,
          approvedAt: new Date(),
          adminNotes: adminNotes || existing.adminNotes,
        },
        include: { hall: true, department: true },
      });
    });

    await logActivity(
      req.user!.id,
      'APPROVE_BOOKING',
      'BOOKING',
      id,
      `Approved booking ${existing.bookingId} for ${existing.hall.name} on ${existing.bookingDate}.`
    );

    await createNotification(
      existing.userId,
      'Booking Request Approved!',
      `Great news! Your booking request ${existing.bookingId} for ${existing.hall.name} on ${existing.bookingDate} has been confirmed.`,
      'SUCCESS'
    );

    res.json({
      ...updated,
      specialRequirements: JSON.parse(updated.specialRequirements || '[]'),
      message: 'Booking confirmed successfully.',
    });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve booking.' });
  }
});

// Admin: Reject Booking
router.patch('/:id/reject', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    const existing = await prisma.booking.findUnique({ where: { id }, include: { hall: true } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Request rejected by administration.',
        adminNotes: adminNotes || existing.adminNotes,
      },
      include: { hall: true },
    });

    await logActivity(
      req.user!.id,
      'REJECT_BOOKING',
      'BOOKING',
      id,
      `Rejected booking ${existing.bookingId}: ${rejectionReason}`
    );

    await createNotification(
      existing.userId,
      'Booking Request Rejected',
      `Your booking request ${existing.bookingId} for ${existing.hall.name} on ${existing.bookingDate} was not approved. Reason: ${rejectionReason || 'Facility unavailable.'}`,
      'ALERT'
    );

    res.json({
      ...updated,
      message: 'Booking request rejected.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject booking.' });
  }
});

// Cancel Booking (User can cancel their own pending/approved, Admin can cancel any)
router.patch('/:id/cancel', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const existing = await prisma.booking.findUnique({ where: { id }, include: { hall: true } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role);
    if (!isAdmin && existing.userId !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized to cancel this booking.' });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        adminNotes: reason ? `Cancelled with note: ${reason}` : existing.adminNotes,
      },
      include: { hall: true },
    });

    await logActivity(
      req.user!.id,
      'CANCEL_BOOKING',
      'BOOKING',
      id,
      `Booking ${existing.bookingId} for ${existing.hall.name} was cancelled by ${req.user!.name}.`
    );

    if (isAdmin && existing.userId !== req.user!.id) {
      await createNotification(
        existing.userId,
        'Booking Cancelled',
        `Your booking ${existing.bookingId} on ${existing.bookingDate} has been cancelled by administration. Reason: ${reason || 'Administrative re-allocation'}`,
        'ALERT'
      );
    }

    res.json({
      ...updated,
      message: 'Booking cancelled successfully. The hall is now available for other reservations.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking.' });
  }
});

// Admin: Edit Booking details
router.put('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      eventName,
      description,
      purpose,
      departmentId,
      bookingDate,
      bookingType,
      startTime,
      endTime,
      participantCount,
      coordinatorName,
      contactNumber,
      email,
      specialRequirements,
      adminNotes,
      status,
    } = req.body;

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    // Check conflict if changing date or times
    if (bookingDate !== existing.bookingDate || startTime !== existing.startTime || endTime !== existing.endTime) {
      const conflict = await checkBookingConflict(
        existing.hallId,
        bookingDate,
        existing.endDate || bookingDate,
        startTime,
        endTime,
        id
      );
      if (conflict.hasConflict) {
        res.status(409).json({ error: conflict.reason });
        return;
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        eventName,
        description,
        purpose,
        departmentId: departmentId || null,
        bookingDate,
        bookingType,
        startTime,
        endTime,
        participantCount: Number(participantCount) || 0,
        coordinatorName,
        contactNumber,
        email,
        specialRequirements: typeof specialRequirements === 'string' ? specialRequirements : JSON.stringify(specialRequirements || []),
        adminNotes,
        status,
      },
      include: { hall: true, department: true },
    });

    await logActivity(req.user!.id, 'EDIT_BOOKING', 'BOOKING', id, `Updated booking ${existing.bookingId}`);

    res.json({
      ...updated,
      specialRequirements: JSON.parse(updated.specialRequirements || '[]'),
    });
  } catch (error) {
    console.error('Edit booking error:', error);
    res.status(500).json({ error: 'Failed to update booking.' });
  }
});

// Admin: Delete Booking permanently
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    await prisma.booking.delete({ where: { id } });
    await logActivity(req.user!.id, 'DELETE_BOOKING', 'BOOKING', id, `Deleted booking record ${existing.bookingId}`);

    res.json({ message: `Booking ${existing.bookingId} deleted permanently.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete booking.' });
  }
});

export default router;
