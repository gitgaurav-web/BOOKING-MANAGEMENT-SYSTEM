import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, optionalAuth, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/helpers';
import { apiMutationRateLimiter } from '../middleware/rateLimiter';
import { getLocalIsoDate } from '../utils/dateValidation';

const router = Router();

// Public / Semi-Authenticated: Get all active vehicles with live availability & upcoming schedule
router.get('/', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = getLocalIsoDate();
    const isAuthenticated = !!req.user;

    const [vehicles, todayBookings, todayBlocked, todayMaintenance, upcomingBookings] = await Promise.all([
      prisma.vehicle.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.booking.findMany({
        where: {
          status: 'APPROVED',
          bookingDate: { lte: today },
          OR: [
            { endDate: { gte: today } },
            { endDate: null, bookingDate: today },
          ],
        },
        include: { department: true },
      }),
      prisma.blockedDate.findMany({
        where: {
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
      prisma.maintenance.findMany({
        where: {
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
      prisma.booking.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { bookingDate: { gte: today } },
            { endDate: { gte: today } },
          ],
        },
        include: { department: true },
        orderBy: { bookingDate: 'asc' },
      }),
    ]);

    const parsed = vehicles.map((v) => {
      const vTodayBooking = todayBookings.find((b) => b.vehicleId === v.id);
      const vBlocked = todayBlocked.find((b) => b.vehicleId === v.id || b.vehicleId === null);
      const vMaintenance = todayMaintenance.find((m) => m.vehicleId === v.id);

      let todayStatus: 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE' | 'BLOCKED' = 'AVAILABLE';
      if (vMaintenance) todayStatus = 'MAINTENANCE';
      else if (vBlocked) todayStatus = 'BLOCKED';
      else if (vTodayBooking) todayStatus = 'BOOKED';

      const vUpcoming = upcomingBookings
        .filter((b) => b.vehicleId === v.id)
        .slice(0, 5)
        .map((b) => ({
          id: b.id,
          bookingId: b.bookingId,
          eventName: isAuthenticated ? b.eventName : 'Reserved Transport Trip',
          tripTitle: isAuthenticated ? b.eventName : 'Reserved Transport Trip',
          bookingDate: b.bookingDate,
          startDate: b.bookingDate,
          endDate: b.endDate,
          startTime: b.startTime,
          endTime: b.endTime,
          departureTime: b.startTime,
          returnTime: b.endTime,
          dropLocation: b.dropLocation,
          department: isAuthenticated ? (b.department?.name || 'Department') : 'Academic Department',
        }));

      return {
        ...v,
        features: JSON.parse(v.features || '[]'),
        facilities: JSON.parse(v.facilities || '[]'),
        todayStatus,
        todayBooking: vTodayBooking
          ? {
              eventName: isAuthenticated ? vTodayBooking.eventName : 'Reserved Trip',
              tripTitle: isAuthenticated ? vTodayBooking.eventName : 'Reserved Trip',
              startTime: vTodayBooking.startTime,
              endTime: vTodayBooking.endTime,
              departureTime: vTodayBooking.startTime,
              returnTime: vTodayBooking.endTime,
              dropLocation: vTodayBooking.dropLocation,
              department: isAuthenticated ? (vTodayBooking.department?.name || 'Department') : 'Academic Department',
            }
          : null,
        upcomingBookings: vUpcoming,
      };
    });

    res.json(parsed);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles.' });
  }
});

// Vehicle by ID with upcoming bookings and next available date
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found.' });
      return;
    }

    const today = getLocalIsoDate();
    const isAuthenticated = !!req.user;

    // Upcoming approved bookings
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        vehicleId: id,
        OR: [
          { bookingDate: { gte: today } },
          { endDate: { gte: today } },
        ],
        status: 'APPROVED',
      },
      include: { department: true },
      orderBy: { bookingDate: 'asc' },
      take: 5,
    });

    // Today's status (including multi-day bookings covering today)
    const todayBooking = await prisma.booking.findFirst({
      where: {
        vehicleId: id,
        bookingDate: { lte: today },
        OR: [
          { endDate: { gte: today } },
          { endDate: null, bookingDate: today },
        ],
        status: 'APPROVED',
      },
      include: { department: true },
    });

    const todayBlocked = await prisma.blockedDate.findFirst({
      where: {
        OR: [{ vehicleId: id }, { vehicleId: null }],
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    const todayMaintenance = await prisma.maintenance.findFirst({
      where: {
        vehicleId: id,
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    let todayStatus = 'AVAILABLE';
    if (todayMaintenance) todayStatus = 'MAINTENANCE';
    else if (todayBlocked) todayStatus = 'BLOCKED';
    else if (todayBooking) todayStatus = 'BOOKED';

    res.json({
      ...vehicle,
      features: JSON.parse(vehicle.features || '[]'),
      facilities: JSON.parse(vehicle.facilities || '[]'),
      todayStatus,
      todayBooking: todayBooking
        ? {
            eventName: isAuthenticated ? todayBooking.eventName : 'Reserved Trip',
            tripTitle: isAuthenticated ? todayBooking.eventName : 'Reserved Trip',
            startTime: todayBooking.startTime,
            endTime: todayBooking.endTime,
            departureTime: todayBooking.startTime,
            returnTime: todayBooking.endTime,
            dropLocation: todayBooking.dropLocation,
            department: isAuthenticated ? (todayBooking.department?.name || 'Department') : 'Academic Department',
          }
        : null,
      upcomingBookings: upcomingBookings.map((b) => ({
        id: b.id,
        bookingId: b.bookingId,
        eventName: isAuthenticated ? b.eventName : 'Reserved Transport Trip',
        tripTitle: isAuthenticated ? b.eventName : 'Reserved Transport Trip',
        bookingDate: b.bookingDate,
        startDate: b.bookingDate,
        startTime: b.startTime,
        endTime: b.endTime,
        departureTime: b.startTime,
        returnTime: b.endTime,
        dropLocation: b.dropLocation,
        department: isAuthenticated ? (b.department?.name || 'Department') : 'Academic Department',
      })),
    });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle details.' });
  }
});

// Admin: Update vehicle details
router.put('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, code, registrationNo, vehicleType, location, capacity, fuelType, acAvailable, features, facilities, image, status, driverName, driverPhone, description } = req.body;

    const feats = typeof features === 'string' ? features : JSON.stringify(features || []);
    const facs = typeof facilities === 'string' ? facilities : JSON.stringify(facilities || features || []);

    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(code ? { code } : {}),
        ...(registrationNo ? { registrationNo } : {}),
        ...(vehicleType ? { vehicleType } : {}),
        ...(location ? { location } : {}),
        ...(capacity !== undefined ? { capacity: Number(capacity) } : {}),
        ...(fuelType ? { fuelType } : {}),
        ...(acAvailable !== undefined ? { acAvailable: Boolean(acAvailable) } : {}),
        ...(description ? { description } : {}),
        features: feats,
        facilities: facs,
        ...(image !== undefined ? { image } : {}),
        ...(status ? { status } : {}),
        ...(driverName !== undefined ? { driverName } : {}),
        ...(driverPhone !== undefined ? { driverPhone } : {}),
      },
    });

    await logActivity(req.user!.id, 'UPDATE_VEHICLE', 'VEHICLE', id, `Updated vehicle details for ${updated.name}`);

    res.json({
      ...updated,
      features: JSON.parse(updated.features || '[]'),
      facilities: JSON.parse(updated.facilities || '[]'),
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Failed to update vehicle.' });
  }
});

// Admin: Create new vehicle
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, registrationNo, vehicleType, location, capacity, fuelType, acAvailable, features, facilities, image, status, driverName, driverPhone, description } = req.body;

    const feats = typeof features === 'string' ? features : JSON.stringify(features || ['GPS Tracking', 'First Aid Box']);
    const facs = typeof facilities === 'string' ? facilities : JSON.stringify(facilities || features || ['GPS Tracking', 'First Aid Box']);
    const genCode = code || `VEH-${Date.now().toString().slice(-4)}`;

    const created = await prisma.vehicle.create({
      data: {
        name,
        code: genCode,
        registrationNo,
        vehicleType: vehicleType || 'CAR',
        location: location || 'Campus Main Gate 1 Transport Bay',
        description: description || 'Institutional transport vehicle for Sri Sairam College of Engineering.',
        capacity: Number(capacity) || 7,
        fuelType: fuelType || 'DIESEL',
        acAvailable: acAvailable !== undefined ? Boolean(acAvailable) : true,
        features: feats,
        facilities: facs,
        image: image || null,
        status: status || 'ACTIVE',
        driverName: driverName || null,
        driverPhone: driverPhone || null,
      },
    });

    await logActivity(req.user!.id, 'CREATE_VEHICLE', 'VEHICLE', created.id, `Created vehicle ${created.name}`);

    res.status(201).json({
      ...created,
      features: JSON.parse(created.features || '[]'),
      facilities: JSON.parse(created.facilities || '[]'),
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to create vehicle.' });
  }
});

// Admin: Delete or archive vehicle
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.vehicle.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });

    if (!existing) {
      res.status(404).json({ error: 'Vehicle not found.' });
      return;
    }

    if (existing._count.bookings > 0) {
      const archived = await prisma.vehicle.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      await logActivity(req.user!.id, 'ARCHIVE_VEHICLE', 'VEHICLE', id, `Deactivated vehicle ${archived.name} due to existing history`);
      res.json({ message: 'Vehicle has active booking history. Safely marked as INACTIVE to preserve audit records.', status: 'INACTIVE' });
      return;
    }

    await prisma.vehicle.delete({ where: { id } });
    await logActivity(req.user!.id, 'DELETE_VEHICLE', 'VEHICLE', id, `Permanently deleted vehicle ${existing.name}`);
    res.json({ message: 'Vehicle deleted successfully.' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Failed to delete vehicle.' });
  }
});

export default router;
