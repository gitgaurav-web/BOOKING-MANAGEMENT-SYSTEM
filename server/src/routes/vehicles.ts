import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/helpers';
import { apiMutationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// GET /api/vehicles - List all active campus vehicles
router.get('/', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'asc' },
    });
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch campus transport vehicles.' });
  }
});

// GET /api/vehicles/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: { in: ['APPROVED', 'PENDING'] },
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found.' });
      return;
    }
    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle details.' });
  }
});

// POST /api/vehicles - Add new vehicle (Admin only)
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, registrationNo, vehicleType, capacity, fuelType, acAvailable, image, features, driverName, driverPhone } = req.body;
    if (!name || !registrationNo || !vehicleType || !capacity) {
      res.status(400).json({ error: 'Name, registration number, vehicle type, and capacity are required.' });
      return;
    }

    const created = await prisma.vehicle.create({
      data: {
        name: name.trim(),
        registrationNo: registrationNo.trim().toUpperCase(),
        vehicleType,
        capacity: Number(capacity),
        fuelType: fuelType || 'DIESEL',
        acAvailable: acAvailable === true || acAvailable === 'true',
        image: image || null,
        features: typeof features === 'string' ? features : JSON.stringify(features || []),
        driverName: driverName || null,
        driverPhone: driverPhone || null,
      },
    });

    await logActivity(req.user!.id, 'CREATE_VEHICLE', 'VEHICLE', created.id, `Added new vehicle: ${created.name} (${created.registrationNo})`);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: error.message || 'Failed to create vehicle.' });
  }
});

// GET /api/vehicles/bookings/all - List all vehicle bookings (Admin or faculty)
router.get('/bookings/all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    const whereClause: any = {};
    if (!isAdmin) {
      whereClause.userId = req.user!.id;
    }

    const bookings = await prisma.vehicleBooking.findMany({
      where: whereClause,
      include: {
        vehicle: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching vehicle bookings:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle bookings.' });
  }
});

// POST /api/vehicles/bookings - Create new vehicle reservation
router.post('/bookings', authenticate, apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      vehicleId,
      tripTitle,
      pickupLocation,
      dropLocation,
      passengerCount,
      tripPurpose,
      coordinatorName,
      coordinatorPhone,
      email,
      startDate,
      endDate,
      departureTime,
      returnTime,
      estimatedKilometers,
      tollPaymentRequired,
      specialRequirements,
      attachmentUrl,
      additionalNotes,
    } = req.body;

    if (!vehicleId || !tripTitle || !pickupLocation || !dropLocation || !startDate || !departureTime || !returnTime) {
      res.status(400).json({ error: 'Missing mandatory trip details. Please fill all required fields.' });
      return;
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      res.status(404).json({ error: 'Selected vehicle not found.' });
      return;
    }

    // Check collision on the same vehicle for approved trips
    const effectiveEnd = endDate || startDate;
    const existingConflict = await prisma.vehicleBooking.findFirst({
      where: {
        vehicleId,
        status: 'APPROVED',
        startDate: { lte: effectiveEnd },
        OR: [
          { endDate: { gte: startDate } },
          { endDate: null, startDate: { gte: startDate } },
        ],
      },
    });

    if (existingConflict) {
      res.status(409).json({ error: `Vehicle is already reserved for "${existingConflict.tripTitle}" during this schedule.` });
      return;
    }

    // Atomic Booking ID: [TYPE]-[MONTH][YY]-[NUM]
    const monthYear = new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase() + new Date().getFullYear().toString().slice(-2);
    const prefix = vehicle.vehicleType === 'BUS' ? 'BUS' : vehicle.vehicleType === 'CAR' ? 'CAR' : 'VAN';
    const totalCount = await prisma.vehicleBooking.count();
    const sequenceNum = String(totalCount + 1).padStart(3, '0');
    const bookingId = `${prefix}-${monthYear}-${sequenceNum}`;

    const newBooking = await prisma.vehicleBooking.create({
      data: {
        bookingId,
        userId: req.user!.id,
        vehicleId,
        departmentId: req.user!.departmentId || null,
        tripTitle: tripTitle.trim(),
        pickupLocation: pickupLocation.trim(),
        dropLocation: dropLocation.trim(),
        passengerCount: Number(passengerCount) || 1,
        tripPurpose: tripPurpose || 'OFFICIAL_VISIT',
        coordinatorName: coordinatorName || req.user!.name,
        coordinatorPhone: coordinatorPhone || '+91 98450 00000',
        email: email || req.user!.email,
        startDate,
        endDate: endDate || null,
        departureTime,
        returnTime,
        estimatedKilometers: Number(estimatedKilometers) || 0,
        tollPaymentRequired: tollPaymentRequired === true || tollPaymentRequired === 'true',
        specialRequirements: typeof specialRequirements === 'string' ? specialRequirements : JSON.stringify(specialRequirements || []),
        attachmentUrl: attachmentUrl || null,
        additionalNotes: additionalNotes || null,
        status: 'PENDING',
        assignedDriverName: vehicle.driverName,
        assignedDriverPhone: vehicle.driverPhone,
      },
    });

    await logActivity(req.user!.id, 'BOOK_VEHICLE', 'VEHICLE_BOOKING', newBooking.id, `Created trip requisition ${bookingId} for ${vehicle.name}`);
    res.status(201).json(newBooking);
  } catch (error: any) {
    console.error('Error booking vehicle:', error);
    res.status(500).json({ error: error.message || 'Failed to submit vehicle reservation.' });
  }
});

// PATCH /api/vehicles/bookings/:id/status - Approve or Reject (Admin only)
router.patch('/bookings/:id/status', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNotes, rejectionReason, assignedDriverName, assignedDriverPhone } = req.body;

    if (!['APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status update.' });
      return;
    }

    const updated = await prisma.vehicleBooking.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes || null,
        rejectionReason: rejectionReason || null,
        assignedDriverName: assignedDriverName || undefined,
        assignedDriverPhone: assignedDriverPhone || undefined,
        approvedById: status === 'APPROVED' ? req.user!.id : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
      },
    });

    await logActivity(req.user!.id, `TRIP_${status}`, 'VEHICLE_BOOKING', id, `Trip ${updated.bookingId} status changed to ${status}`);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating trip status:', error);
    res.status(500).json({ error: error.message || 'Failed to update trip status.' });
  }
});

// PATCH /api/vehicles/bookings/:id/cancel - User or Admin cancel trip
router.patch('/bookings/:id/cancel', authenticate, apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const booking = await prisma.vehicleBooking.findUnique({ where: { id } });
    if (!booking) {
      res.status(404).json({ error: 'Trip booking not found.' });
      return;
    }
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    if (!isAdmin && booking.userId !== req.user!.id) {
      res.status(403).json({ error: 'You are not authorized to cancel this booking.' });
      return;
    }
    const updated = await prisma.vehicleBooking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        rejectionReason: reason || 'Cancelled by user',
      },
    });
    await logActivity(req.user!.id, 'CANCEL_VEHICLE_BOOKING', 'VEHICLE_BOOKING', id, `Cancelled trip ${updated.bookingId}`);
    res.json(updated);
  } catch (error: any) {
    console.error('Error cancelling trip:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel trip.' });
  }
});

export default router;
