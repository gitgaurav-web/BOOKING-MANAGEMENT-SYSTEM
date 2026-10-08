import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, optionalAuth, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/helpers';
import { apiMutationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public: Get all active halls
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const halls = await prisma.hall.findMany({
      orderBy: { name: 'asc' },
    });

    const parsedHalls = halls.map(hall => ({
      ...hall,
      facilities: JSON.parse(hall.facilities || '[]'),
    }));

    res.json(parsedHalls);
  } catch (error) {
    console.error('Error fetching halls:', error);
    res.status(500).json({ error: 'Failed to fetch halls.' });
  }
});

// Hall by ID with upcoming bookings and next available date (with standardized privacy)
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const hall = await prisma.hall.findUnique({
      where: { id },
    });

    if (!hall) {
      res.status(404).json({ error: 'Hall not found.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const isAuthenticated = !!req.user;

    // Upcoming approved bookings
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        hallId: id,
        bookingDate: { gte: today },
        status: 'APPROVED',
      },
      include: { department: true },
      orderBy: { bookingDate: 'asc' },
      take: 5,
    });

    // Today's status
    const todayBooking = await prisma.booking.findFirst({
      where: {
        hallId: id,
        bookingDate: today,
        status: 'APPROVED',
      },
      include: { department: true },
    });

    const todayBlocked = await prisma.blockedDate.findFirst({
      where: {
        OR: [{ hallId: id }, { hallId: null }],
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    const todayMaintenance = await prisma.maintenance.findFirst({
      where: {
        hallId: id,
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    let todayStatus = 'AVAILABLE';
    if (todayMaintenance) todayStatus = 'MAINTENANCE';
    else if (todayBlocked) todayStatus = 'BLOCKED';
    else if (todayBooking) todayStatus = 'BOOKED';

    res.json({
      ...hall,
      facilities: JSON.parse(hall.facilities || '[]'),
      todayStatus,
      todayBooking: todayBooking ? {
        eventName: isAuthenticated ? todayBooking.eventName : 'Reserved Event',
        startTime: todayBooking.startTime,
        endTime: todayBooking.endTime,
        department: isAuthenticated ? (todayBooking.department?.name || 'Department') : 'Academic Department',
      } : null,
      upcomingBookings: upcomingBookings.map(b => ({
        id: b.id,
        bookingId: b.bookingId,
        eventName: isAuthenticated ? b.eventName : 'Reserved Facility Event',
        bookingDate: b.bookingDate,
        startTime: b.startTime,
        endTime: b.endTime,
        department: isAuthenticated ? (b.department?.name || 'Department') : 'Academic Department',
      })),
    });
  } catch (error) {
    console.error('Error fetching hall details:', error);
    res.status(500).json({ error: 'Failed to fetch hall details.' });
  }
});

// Admin: Update hall details
router.put('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, code, description, location, capacity, facilities, image, status } = req.body;

    const updated = await prisma.hall.update({
      where: { id },
      data: {
        name,
        code,
        description,
        location,
        capacity: Number(capacity),
        facilities: typeof facilities === 'string' ? facilities : JSON.stringify(facilities),
        image,
        status,
      },
    });

    await logActivity(req.user!.id, 'UPDATE_HALL', 'HALL', id, `Updated hall details for ${updated.name}`);

    res.json({
      ...updated,
      facilities: JSON.parse(updated.facilities || '[]'),
    });
  } catch (error) {
    console.error('Error updating hall:', error);
    res.status(500).json({ error: 'Failed to update hall.' });
  }
});

// Admin: Create new hall (optional extra facility)
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), apiMutationRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, description, location, capacity, facilities, image, status } = req.body;

    const created = await prisma.hall.create({
      data: {
        name,
        code,
        description,
        location,
        capacity: Number(capacity) || 100,
        facilities: typeof facilities === 'string' ? facilities : JSON.stringify(facilities || []),
        image: image || null,
        status: status || 'ACTIVE',
      },
    });

    await logActivity(req.user!.id, 'CREATE_HALL', 'HALL', created.id, `Created hall ${created.name}`);

    res.status(201).json({
      ...created,
      facilities: JSON.parse(created.facilities || '[]'),
    });
  } catch (error) {
    console.error('Error creating hall:', error);
    res.status(500).json({ error: 'Failed to create hall.' });
  }
});

export default router;
