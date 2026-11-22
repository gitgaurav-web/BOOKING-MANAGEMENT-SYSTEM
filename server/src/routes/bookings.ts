import { Router, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity, createNotification } from '../utils/helpers';
import { isValidStrictIsoDate, getLocalIsoDate, getLocalTime, isValidStrictTime } from '../utils/dateValidation';
import { sendBookingNotificationEmail } from '../utils/emailService';
import { sendDriverTripAssignmentSmsWhatsApp } from '../utils/smsWhatsAppService';
import { apiMutationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

export type DbClient = Prisma.TransactionClient | PrismaClient;

// Helper: Check if booking date is strictly in the past
export function isBookingDatePast(bookingDate: string, endDate?: string | null): boolean {
  const effectiveEnd = endDate || bookingDate;
  const today = getLocalIsoDate();
  return effectiveEnd < today;
}

// Helper to check for conflict before creating/approving across single or multi-day range
export async function checkBookingConflict(
  client: DbClient,
  vehicleId: string,
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  options?: {
    excludeBookingId?: string;
    allowHolidayBookings?: boolean;
  }
): Promise<{ hasConflict: boolean; reason: string }> {
  // 1. Check Maintenance
  const maintenance = await client.maintenance.findFirst({
    where: {
      vehicleId,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
  if (maintenance) {
    return { hasConflict: true, reason: `Vehicle is in garage maintenance: ${maintenance.reason}` };
  }

  // 2. Check Blocked Dates
  const blocked = await client.blockedDate.findFirst({
    where: {
      OR: [{ vehicleId }, { vehicleId: null }],
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
  if (blocked) {
    return { hasConflict: true, reason: `Campus vehicle is blocked: ${blocked.reason}` };
  }

  // 3. Check Holidays
  if (!options?.allowHolidayBookings) {
    const vehicle = await client.vehicle.findUnique({ where: { id: vehicleId } });
    const holiday = await client.holiday.findFirst({
      where: {
        date: { gte: startDate, lte: endDate },
        OR: [
          { vehicleScope: 'ALL' },
          { hallScope: 'ALL' },
          { vehicleScope: vehicle?.name || '' },
        ],
      },
    });
    if (holiday) {
      return { hasConflict: true, reason: `Institutional Holiday on ${holiday.date}: ${holiday.name}` };
    }
  }

  // 4. Check Approved Booking overlapping dates
  const existingApproved = await client.booking.findMany({
    where: {
      vehicleId,
      status: 'APPROVED',
      bookingDate: { lte: endDate },
      ...(options?.excludeBookingId ? { id: { not: options.excludeBookingId } } : {}),
    },
  });

  for (const b of existingApproved) {
    const bEnd = b.endDate || b.bookingDate;
    if (startDate <= bEnd && b.bookingDate <= endDate) {
      if (startDate !== endDate || b.bookingDate !== bEnd || b.bookingType === 'FULL_DAY') {
        return {
          hasConflict: true,
          reason: `Vehicle is already reserved from ${b.bookingDate} to ${bEnd} by ${b.requestedBy} (${b.eventName})`,
        };
      }
      if (startTime < b.endTime && endTime > b.startTime) {
        return {
          hasConflict: true,
          reason: `Time slot conflict on ${b.bookingDate}: ${b.startTime}-${b.endTime} reserved by ${b.requestedBy} (${b.eventName})`,
        };
      }
    }
  }

  return { hasConflict: false, reason: '' };
}

// POST /api/bookings - Submit vehicle reservation request
router.post('/', authenticate, apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      vehicleId,
      hallId,
      eventName,
      tripTitle,
      description,
      purpose,
      departmentId,
      bookingDate,
      startDate,
      endDate,
      bookingType = 'FULL_DAY',
      startTime = '08:30',
      endTime = '17:30',
      departureTime,
      returnTime,
      passengerCount,
      participantCount,
      guestCount = 0,
      mementoCount = 0,
      coordinatorName,
      contactNumber,
      email,
      specialRequirements,
      tollPaymentRequired = false,
      pickupLocation,
      dropLocation,
      estimatedKilometers = 0,
      attachmentUrl,
      additionalNotes,
    } = req.body;

    const targetVehicleId = vehicleId || hallId;
    const resolvedEventName = (eventName || tripTitle || '').trim();
    const resolvedPurpose = (purpose || req.body.tripPurpose || 'INDUSTRIAL_VISIT').trim();
    const resolvedStartDate = bookingDate || startDate;
    const resolvedStartTime = departureTime || startTime || '08:30';
    const resolvedEndTime = returnTime || endTime || '17:30';
    const resolvedPassengers = parseInt(String(passengerCount || participantCount || 1), 10);
    const resolvedContactNumber = (contactNumber || req.body.coordinatorPhone || req.body.phone || '').trim();
    const resolvedEmail = (email || user.email || '').trim();

    const missingFields: Record<string, string> = {};
    if (!targetVehicleId) missingFields.vehicleId = 'Please select a campus vehicle from the fleet.';
    if (!resolvedEventName) missingFields.tripTitle = 'Trip title / destination purpose is required.';
    if (!resolvedStartDate) missingFields.startDate = 'Departure date is required.';
    if (!resolvedContactNumber) missingFields.coordinatorPhone = 'Coordinator mobile number is required.';
    if (!resolvedEmail) missingFields.email = 'Notification email is required.';

    if (Object.keys(missingFields).length > 0) {
      res.status(400).json({
        error: 'Please fill in all required trip fields highlighted in red below.',
        fieldErrors: missingFields,
      });
      return;
    }

    if (!isValidStrictIsoDate(resolvedStartDate)) {
      res.status(400).json({ error: 'Invalid start date format. Must be YYYY-MM-DD.' });
      return;
    }

    const todayStr = getLocalIsoDate();
    if (resolvedStartDate < todayStr) {
      res.status(400).json({ error: 'Past dates cannot be reserved.' });
      return;
    }

    const effectiveEnd = (endDate && endDate >= resolvedStartDate) ? endDate : resolvedStartDate;
    if (endDate && !isValidStrictIsoDate(endDate)) {
      res.status(400).json({ error: 'Invalid end date format. Must be YYYY-MM-DD.' });
      return;
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: targetVehicleId } });
    if (!vehicle || vehicle.status !== 'ACTIVE') {
      res.status(400).json({ error: 'Selected vehicle is inactive or does not exist.' });
      return;
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
    const requireApprovalSetting = await prisma.systemSetting.findUnique({ where: { key: 'requireAdminApproval' } });
    const requireAdminApproval = requireApprovalSetting?.value !== 'false';
    const initialStatus = isAdmin ? 'APPROVED' : (requireAdminApproval ? 'PENDING' : 'APPROVED');

    // Create Booking inside transaction with atomic ID generation
    const booking = await prisma.$transaction(async (tx) => {
      const holidaySetting = await tx.systemSetting.findUnique({ where: { key: 'allowHolidayBookings' } });
      const allowHolidays = holidaySetting?.value === 'true';

      const conflict = await checkBookingConflict(
        tx,
        targetVehicleId,
        resolvedStartDate,
        effectiveEnd,
        resolvedStartTime,
        resolvedEndTime,
        { allowHolidayBookings: allowHolidays }
      );

      if (conflict.hasConflict && initialStatus === 'APPROVED') {
        throw new Error(`CONFLICT: ${conflict.reason}`);
      }

      // Generate atomic ID: [VEHICLE_TYPE]-[MONTH][YY]-[NUM]
      const vType = (vehicle.vehicleType || 'VEH').toUpperCase();
      const [bYearFull, bMonthNumStr] = resolvedStartDate.split('-');
      const bYear = (bYearFull || String(new Date().getFullYear())).slice(-2);
      const monthIndex = Math.max(0, Math.min(11, parseInt(bMonthNumStr || '1', 10) - 1));
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const bMonth = monthNames[monthIndex] || 'NOV';
      const prefixPattern = `${vType}-${bMonth}${bYear}-`;

      const latestBookingForMonth = await tx.booking.findFirst({
        where: { bookingId: { startsWith: prefixPattern } },
        orderBy: { bookingId: 'desc' },
        select: { bookingId: true },
      });

      let nextSeq = 1;
      if (latestBookingForMonth) {
        const parts = latestBookingForMonth.bookingId.split('-');
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) nextSeq = lastNum + 1;
      }

      const generatedBookingId = `${prefixPattern}${String(nextSeq).padStart(3, '0')}`;

      const created = await tx.booking.create({
        data: {
          bookingId: generatedBookingId,
          userId: user.id,
          vehicleId: targetVehicleId,
          departmentId: departmentId || user.departmentId || null,
          eventName: resolvedEventName,
          purpose,
          description: description || null,
          requestedBy: coordinatorName || user.name,
          coordinatorName: coordinatorName || user.name,
          contactNumber,
          email,
          pickupLocation: pickupLocation || 'College Campus Gate 1',
          dropLocation: dropLocation || null,
          passengerCount: resolvedPassengers,
          participantCount: resolvedPassengers,
          guestCount: Number(guestCount) || 0,
          mementoCount: Number(mementoCount) || 0,
          estimatedKilometers: Number(estimatedKilometers) || 0,
          bookingDate: resolvedStartDate,
          endDate: effectiveEnd !== resolvedStartDate ? effectiveEnd : null,
          bookingType,
          startTime: resolvedStartTime,
          endTime: resolvedEndTime,
          tollPaymentRequired: Boolean(tollPaymentRequired),
          specialRequirements: typeof specialRequirements === 'string'
            ? specialRequirements
            : JSON.stringify(specialRequirements || []),
          attachmentUrl: attachmentUrl || null,
          additionalNotes: additionalNotes || null,
          status: initialStatus,
          assignedDriverName: vehicle.driverName || null,
          assignedDriverPhone: vehicle.driverPhone || null,
          approvedById: initialStatus === 'APPROVED' ? user.id : null,
          approvedAt: initialStatus === 'APPROVED' ? new Date() : null,
        },
        include: { vehicle: true, department: true },
      });

      return created;
    });

    await logActivity(
      user.id,
      'CREATE_BOOKING',
      'BOOKING',
      booking.id,
      `Vehicle requisition ${booking.bookingId} submitted for ${booking.vehicle.name} on ${resolvedStartDate} (${initialStatus}).`
    );

    await createNotification(
      user.id,
      initialStatus === 'APPROVED' ? 'Vehicle Booking Confirmed!' : 'Requisition Submitted',
      initialStatus === 'APPROVED'
        ? `Your trip requisition ${booking.bookingId} for ${booking.vehicle.name} on ${resolvedStartDate} is confirmed.`
        : `Your vehicle request ${booking.bookingId} for ${booking.vehicle.name} on ${resolvedStartDate} is submitted and awaiting approval.`,
      initialStatus === 'APPROVED' ? 'SUCCESS' : 'INFO'
    );

    // Email notification
    sendBookingNotificationEmail({
      to: booking.email || user.email,
      facultyEmail: user.email,
      recipientName: booking.coordinatorName || booking.requestedBy || user.name,
      bookingId: booking.bookingId,
      eventName: booking.eventName,
      tripTitle: booking.eventName,
      hallName: booking.vehicle.name,
      vehicleName: booking.vehicle.name,
      vehicleRegistrationNo: booking.vehicle.registrationNo,
      pickupLocation: booking.pickupLocation || undefined,
      dropLocation: booking.dropLocation || undefined,
      departmentName: booking.department?.name,
      bookingDate: booking.bookingDate,
      endDate: booking.endDate,
      timeSlot: `${booking.startTime} - ${booking.endTime}`,
      startTime: booking.startTime,
      endTime: booking.endTime,
      bookingType: booking.bookingType,
      status: initialStatus as any,
      coordinatorName: booking.coordinatorName || user.name,
      contactNumber: booking.contactNumber,
      email: booking.email,
      passengerCount: booking.passengerCount,
      participantCount: booking.passengerCount,
      purpose: booking.purpose,
      description: booking.description || undefined,
      specialRequirements: booking.specialRequirements || undefined,
      adminNotes: booking.adminNotes || undefined,
    }).catch((err) => console.error('Outbound email error:', err));

    // Automated Driver WhatsApp & SMS Dispatch
    let driverDispatchResult: any = null;
    const driverPhone = booking.assignedDriverPhone || booking.vehicle?.driverPhone;
    const driverName = booking.assignedDriverName || booking.vehicle?.driverName || 'Staff Driver';

    if (driverPhone) {
      sendDriverTripAssignmentSmsWhatsApp({
        driverName,
        driverPhone,
        bookingId: booking.bookingId,
        vehicleName: booking.vehicle.name,
        vehicleRegistrationNo: booking.vehicle.registrationNo,
        tripTitle: booking.eventName,
        startDate: booking.bookingDate,
        endDate: booking.endDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        pickupLocation: booking.pickupLocation || 'College Campus Gate 1',
        dropLocation: booking.dropLocation || 'Destination',
        passengerCount: booking.passengerCount,
        coordinatorName: booking.coordinatorName || user.name,
        coordinatorPhone: booking.contactNumber,
      })
        .then((res) => {
          driverDispatchResult = res;
          prisma.booking.update({
            where: { id: booking.id },
            data: { driverNotifiedAt: new Date(), driverNotifyMethod: 'WHATSAPP_SMS' },
          }).catch(() => {});
        })
        .catch((err) => console.error('Driver dispatch error on booking create:', err));
    }

    res.status(201).json({
      ...booking,
      hall: booking.vehicle,
      hallId: booking.vehicleId,
      specialRequirements: JSON.parse(booking.specialRequirements || '[]'),
      driverDispatchResult,
      message: isAdmin
        ? 'Vehicle requisition confirmed successfully. Driver trip assignment dispatched via WhatsApp/SMS.'
        : 'Vehicle reservation request submitted successfully. Waiting for Transport Admin approval.',
    });
  } catch (error: any) {
    if (error.message && error.message.startsWith('CONFLICT:')) {
      res.status(409).json({ error: error.message.replace('CONFLICT:', '').trim() });
      return;
    }
    console.error('Create booking error:', error);
    res.status(500).json({ error: error.message || 'Failed to create booking request.' });
  }
});

// GET /api/bookings/upcoming - Public / Campus Display Boards
router.get('/upcoming', async (_req, res: Response): Promise<void> => {
  try {
    const today = getLocalIsoDate();
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { bookingDate: { gte: today } },
          { endDate: { gte: today } },
        ],
      },
      include: {
        vehicle: true,
        department: true,
      },
      orderBy: { bookingDate: 'asc' },
      take: 10,
    });

    const sanitized = bookings.map((b) => ({
      id: b.id,
      bookingId: b.bookingId,
      eventName: b.eventName,
      tripTitle: b.eventName,
      bookingDate: b.bookingDate,
      startDate: b.bookingDate,
      endDate: b.endDate,
      startTime: b.startTime,
      endTime: b.endTime,
      departureTime: b.startTime,
      returnTime: b.endTime,
      pickupLocation: b.pickupLocation,
      dropLocation: b.dropLocation,
      passengerCount: b.passengerCount,
      status: b.status,
      vehicle: b.vehicle,
      hall: b.vehicle,
      department: b.department,
    }));

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve upcoming bookings.' });
  }
});

// GET /api/bookings/user & /api/bookings/my-bookings - User personal bookings
router.get(['/user', '/my-bookings'], authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user!.id },
      include: { vehicle: true, department: true },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = bookings.map((b) => ({
      ...b,
      hall: b.vehicle,
      hallId: b.vehicleId,
      tripTitle: b.eventName,
      tripPurpose: b.purpose,
      startDate: b.bookingDate,
      departureTime: b.startTime,
      returnTime: b.endTime,
      coordinatorPhone: b.contactNumber,
      specialRequirements: JSON.parse(b.specialRequirements || '[]'),
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user bookings.' });
  }
});

// GET /api/bookings - Admin list with search and filters
router.get('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId, hallId, status, departmentId, search } = req.query as {
      vehicleId?: string;
      hallId?: string;
      status?: string;
      departmentId?: string;
      search?: string;
    };

    const targetVehicleId = vehicleId || hallId;
    const whereClause: any = {};

    if (targetVehicleId && targetVehicleId !== 'ALL') {
      whereClause.vehicleId = targetVehicleId;
    }
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }
    if (departmentId && departmentId !== 'ALL') {
      whereClause.departmentId = departmentId;
    }
    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { bookingId: { contains: q } },
        { eventName: { contains: q } },
        { requestedBy: { contains: q } },
        { coordinatorName: { contains: q } },
        { pickupLocation: { contains: q } },
        { dropLocation: { contains: q } },
        { user: { name: { contains: q } } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        vehicle: true,
        department: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = bookings.map((b) => ({
      ...b,
      hall: b.vehicle,
      hallId: b.vehicleId,
      specialRequirements: JSON.parse(b.specialRequirements || '[]'),
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve bookings.' });
  }
});

// GET /api/bookings/:id - Single booking
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vehicle: true,
        department: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role);
    if (!isAdmin && booking.userId !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized to view this booking.' });
      return;
    }

    res.json({
      ...booking,
      hall: booking.vehicle,
      hallId: booking.vehicleId,
      specialRequirements: JSON.parse(booking.specialRequirements || '[]'),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve booking details.' });
  }
});

// PATCH /api/bookings/:id/approve - Approve Booking & Assign Driver
router.patch('/:id/approve', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { adminNotes, assignedDriverName, assignedDriverPhone, odometerStart } = req.body;

    const existing = await prisma.booking.findUnique({ where: { id }, include: { vehicle: true } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    if (isBookingDatePast(existing.bookingDate, existing.endDate)) {
      res.status(400).json({ error: 'Cannot approve a past booking.' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const holidaySetting = await tx.systemSetting.findUnique({ where: { key: 'allowHolidayBookings' } });
      const allowHolidays = holidaySetting?.value === 'true';

      const conflict = await checkBookingConflict(
        tx,
        existing.vehicleId,
        existing.bookingDate,
        existing.endDate || existing.bookingDate,
        existing.startTime,
        existing.endTime,
        {
          excludeBookingId: existing.id,
          allowHolidayBookings: allowHolidays,
        }
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
          assignedDriverName: assignedDriverName || existing.assignedDriverName || existing.vehicle?.driverName,
          assignedDriverPhone: assignedDriverPhone || existing.assignedDriverPhone || existing.vehicle?.driverPhone,
          odometerStart: odometerStart !== undefined ? Number(odometerStart) : existing.odometerStart,
        },
        include: { vehicle: true, department: true, user: true },
      });
    });

    await logActivity(
      req.user!.id,
      'APPROVE_BOOKING',
      'BOOKING',
      id,
      `Approved booking ${existing.bookingId} for ${existing.vehicle.name} on ${existing.bookingDate}.`
    );

    await createNotification(
      existing.userId,
      'Trip Requisition Approved!',
      `Great news! Your trip request ${existing.bookingId} for ${existing.vehicle.name} on ${existing.bookingDate} has been confirmed. Security Gate Pass generated.`,
      'SUCCESS'
    );

    sendBookingNotificationEmail({
      to: updated.email || updated.user?.email,
      facultyEmail: updated.user?.email,
      recipientName: updated.coordinatorName || updated.requestedBy || updated.user?.name,
      bookingId: updated.bookingId,
      eventName: updated.eventName,
      tripTitle: updated.eventName,
      hallName: updated.vehicle.name,
      vehicleName: updated.vehicle.name,
      vehicleRegistrationNo: updated.vehicle.registrationNo,
      pickupLocation: updated.pickupLocation || undefined,
      dropLocation: updated.dropLocation || undefined,
      departmentName: updated.department?.name,
      bookingDate: updated.bookingDate,
      endDate: updated.endDate,
      timeSlot: `${updated.startTime} - ${updated.endTime}`,
      startTime: updated.startTime,
      endTime: updated.endTime,
      bookingType: updated.bookingType,
      status: 'APPROVED',
      coordinatorName: updated.coordinatorName || updated.requestedBy,
      contactNumber: updated.contactNumber,
      email: updated.email,
      passengerCount: updated.passengerCount,
      participantCount: updated.passengerCount,
      purpose: updated.purpose,
      description: updated.description || undefined,
      specialRequirements: updated.specialRequirements || undefined,
      adminNotes: updated.adminNotes || undefined,
    }).catch((err) => console.error('Approval email error:', err));

    // Automated Driver WhatsApp & SMS Dispatch upon Approval
    let driverDispatchResult: any = null;
    const driverPhone = updated.assignedDriverPhone || updated.vehicle?.driverPhone;
    const driverName = updated.assignedDriverName || updated.vehicle?.driverName || 'Staff Driver';

    if (driverPhone) {
      try {
        driverDispatchResult = await sendDriverTripAssignmentSmsWhatsApp({
          driverName,
          driverPhone,
          bookingId: updated.bookingId,
          vehicleName: updated.vehicle.name,
          vehicleRegistrationNo: updated.vehicle.registrationNo,
          tripTitle: updated.eventName,
          startDate: updated.bookingDate,
          endDate: updated.endDate,
          startTime: updated.startTime,
          endTime: updated.endTime,
          pickupLocation: updated.pickupLocation || 'Campus Gate 1',
          dropLocation: updated.dropLocation || 'Destination',
          passengerCount: updated.passengerCount,
          coordinatorName: updated.coordinatorName || updated.requestedBy,
          coordinatorPhone: updated.contactNumber,
        });

        await prisma.booking.update({
          where: { id: updated.id },
          data: {
            driverNotifiedAt: new Date(),
            driverNotifyMethod: 'WHATSAPP_SMS',
          },
        });
      } catch (dErr) {
        console.error('Driver dispatch error upon approval:', dErr);
      }
    }

    res.json({
      ...updated,
      hall: updated.vehicle,
      hallId: updated.vehicleId,
      specialRequirements: JSON.parse(updated.specialRequirements || '[]'),
      driverDispatchResult,
      message: 'Trip reservation approved. Driver trip assignment dispatched via WhatsApp/SMS, and Gate Pass issued.',
    });
  } catch (error: any) {
    if (error.message && error.message.startsWith('CONFLICT:')) {
      res.status(409).json({ error: error.message.replace('CONFLICT:', '').trim() });
      return;
    }
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve booking.' });
  }
});

// POST /api/bookings/:id/notify-driver - Manually trigger / re-send Driver WhatsApp & SMS Duty Slip
router.post(
  '/:id/notify-driver',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  apiMutationRateLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { vehicle: true, department: true },
      });

      if (!booking) {
        res.status(404).json({ error: 'Booking not found.' });
        return;
      }

      const driverPhone = req.body.driverPhone || booking.assignedDriverPhone || booking.vehicle.driverPhone;
      const driverName = req.body.driverName || booking.assignedDriverName || booking.vehicle.driverName || 'Staff Driver';

      if (!driverPhone) {
        res.status(400).json({ error: 'No driver phone number registered for this vehicle/booking.' });
        return;
      }

      const dispatchResult = await sendDriverTripAssignmentSmsWhatsApp({
        driverName,
        driverPhone,
        bookingId: booking.bookingId,
        vehicleName: booking.vehicle.name,
        vehicleRegistrationNo: booking.vehicle.registrationNo,
        tripTitle: booking.eventName,
        startDate: booking.bookingDate,
        endDate: booking.endDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        pickupLocation: booking.pickupLocation || 'Campus Gate 1',
        dropLocation: booking.dropLocation || 'Destination',
        passengerCount: booking.passengerCount,
        coordinatorName: booking.coordinatorName || booking.requestedBy,
        coordinatorPhone: booking.contactNumber,
      });

      await prisma.booking.update({
        where: { id },
        data: {
          assignedDriverName: driverName,
          assignedDriverPhone: driverPhone,
          driverNotifiedAt: new Date(),
          driverNotifyMethod: 'WHATSAPP_SMS',
        },
      });

      await logActivity(
        req.user!.id,
        'NOTIFY_DRIVER',
        'BOOKING',
        id,
        `Dispatched trip assignment WhatsApp/SMS to driver ${driverName} (${driverPhone}) for booking ${booking.bookingId}.`
      );

      res.json({
        ...dispatchResult,
        assignedBookingId: booking.bookingId,
      });
    } catch (err: any) {
      console.error('Manual driver notify error:', err);
      res.status(500).json({ error: err.message || 'Failed to dispatch driver notification.' });
    }
  }
);

// PATCH /api/bookings/:id/reject - Reject Booking
router.patch('/:id/reject', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { rejectionReason, adminNotes } = req.body;

    const existing = await prisma.booking.findUnique({ where: { id }, include: { vehicle: true } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    if (isBookingDatePast(existing.bookingDate, existing.endDate)) {
      res.status(400).json({ error: 'Cannot reject past events.' });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Request rejected by Transport Administration.',
        adminNotes: adminNotes || existing.adminNotes,
      },
      include: { vehicle: true, department: true, user: true },
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
      'Trip Requisition Rejected',
      `Your trip request ${existing.bookingId} for ${existing.vehicle.name} on ${existing.bookingDate} was not approved. Reason: ${rejectionReason || 'Vehicle unavailable.'}`,
      'ALERT'
    );

    res.json({
      ...updated,
      hall: updated.vehicle,
      hallId: updated.vehicleId,
      message: 'Booking request rejected.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject booking.' });
  }
});

// PATCH /api/bookings/:id/cancel - Cancel Booking
router.patch('/:id/cancel', authenticate, apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason, adminNotes } = req.body;
    const effectiveReason = reason || adminNotes || 'Reservation cancelled upon request.';

    const existing = await prisma.booking.findUnique({ where: { id }, include: { vehicle: true } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    if (isBookingDatePast(existing.bookingDate, existing.endDate)) {
      res.status(400).json({ error: 'Cannot cancel a past event.' });
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
        adminNotes: adminNotes !== undefined ? adminNotes : (reason ? `Cancelled: ${reason}` : existing.adminNotes),
      },
      include: { vehicle: true, department: true, user: true },
    });

    await logActivity(
      req.user!.id,
      'CANCEL_BOOKING',
      'BOOKING',
      id,
      `Booking ${existing.bookingId} for ${existing.vehicle.name} was cancelled by ${req.user!.name}.`
    );

    res.json({
      ...updated,
      hall: updated.vehicle,
      hallId: updated.vehicleId,
      message: 'Booking cancelled successfully. The vehicle is now available for other requisitions.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking.' });
  }
});

// PATCH /api/bookings/:id/pending - Revert to Pending
router.patch('/:id/pending', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { adminNotes } = req.body;

    const existing = await prisma.booking.findUnique({ where: { id }, include: { vehicle: true } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'PENDING',
        approvedById: null,
        approvedAt: null,
        rejectionReason: null,
        adminNotes: adminNotes !== undefined ? adminNotes : existing.adminNotes,
      },
      include: { vehicle: true, department: true, user: true },
    });

    res.json({
      ...updated,
      hall: updated.vehicle,
      hallId: updated.vehicleId,
      message: 'Booking successfully reverted back to Pending Review status.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revert booking to pending review.' });
  }
});

// PATCH /api/bookings/:id/notes - Update Driver / Admin Notes / Odometer
router.patch('/:id/notes', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { adminNotes, assignedDriverName, assignedDriverPhone, odometerStart, odometerEnd } = req.body;

    const existing = await prisma.booking.findUnique({ where: { id }, include: { vehicle: true } });
    if (!existing) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        ...(assignedDriverName !== undefined ? { assignedDriverName } : {}),
        ...(assignedDriverPhone !== undefined ? { assignedDriverPhone } : {}),
        ...(odometerStart !== undefined ? { odometerStart: Number(odometerStart) } : {}),
        ...(odometerEnd !== undefined ? { odometerEnd: Number(odometerEnd) } : {}),
      },
      include: { vehicle: true, department: true },
    });

    res.json({
      ...updated,
      hall: updated.vehicle,
      hallId: updated.vehicleId,
      message: 'Driver logistics and notes updated successfully.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update admin notes.' });
  }
});

// PUT /api/bookings/:id - Admin Edit
router.put('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const {
      vehicleId,
      hallId,
      eventName,
      tripTitle,
      description,
      purpose,
      departmentId,
      bookingDate,
      startDate,
      endDate,
      bookingType = 'FULL_DAY',
      startTime = '08:30',
      endTime = '17:30',
      departureTime,
      returnTime,
      passengerCount,
      participantCount,
      pickupLocation,
      dropLocation,
      estimatedKilometers,
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

    const targetDate = bookingDate || startDate || existing.bookingDate;
    const targetEnd = endDate !== undefined ? endDate : existing.endDate;
    const effectiveEnd = targetEnd && targetEnd >= targetDate ? targetEnd : targetDate;
    const targetVehicleId = vehicleId || hallId || existing.vehicleId;
    const targetStatus = status || existing.status;
    const resolvedStartTime = departureTime || startTime || existing.startTime;
    const resolvedEndTime = returnTime || endTime || existing.endTime;

    const updated = await prisma.$transaction(async (tx) => {
      if (targetStatus === 'APPROVED') {
        const holidaySetting = await tx.systemSetting.findUnique({ where: { key: 'allowHolidayBookings' } });
        const allowHolidays = holidaySetting?.value === 'true';

        const conflict = await checkBookingConflict(
          tx,
          targetVehicleId,
          targetDate,
          effectiveEnd,
          resolvedStartTime,
          resolvedEndTime,
          {
            excludeBookingId: id,
            allowHolidayBookings: allowHolidays,
          }
        );

        if (conflict.hasConflict) {
          throw new Error(`CONFLICT: ${conflict.reason}`);
        }
      }

      return await tx.booking.update({
        where: { id },
        data: {
          vehicleId: targetVehicleId,
          eventName: eventName || tripTitle || existing.eventName,
          description: description !== undefined ? description : existing.description,
          purpose: purpose !== undefined ? purpose : existing.purpose,
          departmentId: departmentId !== undefined ? (departmentId || null) : existing.departmentId,
          bookingDate: targetDate,
          endDate: effectiveEnd !== targetDate ? effectiveEnd : null,
          bookingType,
          startTime: resolvedStartTime,
          endTime: resolvedEndTime,
          passengerCount: passengerCount !== undefined ? Number(passengerCount) : (participantCount !== undefined ? Number(participantCount) : existing.passengerCount),
          participantCount: passengerCount !== undefined ? Number(passengerCount) : (participantCount !== undefined ? Number(participantCount) : existing.passengerCount),
          pickupLocation: pickupLocation !== undefined ? pickupLocation : existing.pickupLocation,
          dropLocation: dropLocation !== undefined ? dropLocation : existing.dropLocation,
          estimatedKilometers: estimatedKilometers !== undefined ? Number(estimatedKilometers) : existing.estimatedKilometers,
          coordinatorName: coordinatorName !== undefined ? coordinatorName : existing.coordinatorName,
          contactNumber: contactNumber !== undefined ? contactNumber : existing.contactNumber,
          email: email !== undefined ? email : existing.email,
          specialRequirements: specialRequirements !== undefined
            ? (typeof specialRequirements === 'string' ? specialRequirements : JSON.stringify(specialRequirements || []))
            : existing.specialRequirements,
          adminNotes: adminNotes !== undefined ? adminNotes : existing.adminNotes,
          status: targetStatus,
          approvedById: (targetStatus === 'APPROVED' && !existing.approvedById) ? req.user!.id : existing.approvedById,
          approvedAt: (targetStatus === 'APPROVED' && !existing.approvedAt) ? new Date() : existing.approvedAt,
        },
        include: { vehicle: true, department: true },
      });
    });

    res.json({
      ...updated,
      hall: updated.vehicle,
      hallId: updated.vehicleId,
      specialRequirements: JSON.parse(updated.specialRequirements || '[]'),
    });
  } catch (error: any) {
    if (error.message && error.message.startsWith('CONFLICT:')) {
      res.status(409).json({ error: error.message.replace('CONFLICT:', '').trim() });
      return;
    }
    res.status(500).json({ error: 'Failed to update booking.' });
  }
});

// DELETE /api/bookings/:id - Admin Delete
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
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
