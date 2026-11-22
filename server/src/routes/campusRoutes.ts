import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/helpers';
import { apiMutationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

export interface RouteStopItem {
  id?: string;
  name: string;
  timeMorning: string;
  timeEvening: string;
  latitude: number;
  longitude: number;
  stopOrder?: number;
  isCollege?: boolean;
}

export const SEED_CAMPUS_ROUTES = [
  {
    routeNumber: 'Route 101',
    routeName: 'Majestic & Silk Board Express Corridor',
    origin: 'Kempegowda Bus Station (Majestic)',
    destination: 'Sri Sairam College Campus Gate 1',
    vehicleType: 'BUS',
    vehicleName: 'Ashok Leyland Viking College Bus 01',
    registrationNo: 'KA-51-E-1001',
    acAvailable: false,
    totalSeats: 55,
    availableSeats: 12,
    driverName: 'Muniswamy K.',
    driverPhone: '+91 98450 12345',
    status: 'ON_TIME',
    currentSpeedKmH: 48,
    distanceKm: 42,
    estimatedDurationMins: 95,
    stops: [
      { name: 'Majestic TTMC', timeMorning: '06:45 AM', timeEvening: '06:30 PM', latitude: 12.9767, longitude: 77.5713 },
      { name: 'Corporation Circle', timeMorning: '06:55 AM', timeEvening: '06:15 PM', latitude: 12.9663, longitude: 77.5872 },
      { name: 'Dairy Circle (NIMHANS)', timeMorning: '07:10 AM', timeEvening: '06:00 PM', latitude: 12.9372, longitude: 77.5996 },
      { name: 'Silk Board Junction', timeMorning: '07:25 AM', timeEvening: '05:45 PM', latitude: 12.9176, longitude: 77.6238 },
      { name: 'Bommanahalli', timeMorning: '07:35 AM', timeEvening: '05:35 PM', latitude: 12.9054, longitude: 77.6253 },
      { name: 'Electronic City Toll (Phase 1)', timeMorning: '07:50 AM', timeEvening: '05:20 PM', latitude: 12.8399, longitude: 77.6770 },
      { name: 'Chandapura Junction', timeMorning: '08:05 AM', timeEvening: '05:05 PM', latitude: 12.7937, longitude: 77.7027 },
      { name: 'Anekal Town Bus Stand', timeMorning: '08:18 AM', timeEvening: '04:52 PM', latitude: 12.7118, longitude: 77.6961 },
      { name: 'Sri Sairam College Campus Gate 1', timeMorning: '08:25 AM', timeEvening: '04:45 PM', latitude: 12.7105, longitude: 77.6974, isCollege: true },
    ],
  },
  {
    routeNumber: 'Route 102',
    routeName: 'Banashankari & JP Nagar Deluxe Corridor',
    origin: 'Banashankari TTMC',
    destination: 'Sri Sairam College Campus Gate 1',
    vehicleType: 'BUS',
    vehicleName: 'Eicher Skyline Pro College Bus 02 (Deluxe)',
    registrationNo: 'KA-51-E-1002',
    acAvailable: true,
    totalSeats: 55,
    availableSeats: 8,
    driverName: 'Ramesh Kumar S.',
    driverPhone: '+91 98450 23456',
    status: 'BOARDING',
    currentSpeedKmH: 0,
    distanceKm: 38,
    estimatedDurationMins: 90,
    stops: [
      { name: 'Banashankari TTMC', timeMorning: '06:50 AM', timeEvening: '06:20 PM', latitude: 12.9255, longitude: 77.5468 },
      { name: 'JP Nagar 6th Phase (Sarakki)', timeMorning: '07:05 AM', timeEvening: '06:05 PM', latitude: 12.9081, longitude: 77.5855 },
      { name: 'Jayadeva Hospital Flyover', timeMorning: '07:15 AM', timeEvening: '05:55 PM', latitude: 12.9184, longitude: 77.5978 },
      { name: 'BTM Layout (Udupi Garden)', timeMorning: '07:25 AM', timeEvening: '05:45 PM', latitude: 12.9166, longitude: 77.6101 },
      { name: 'Hosa Road Junction', timeMorning: '07:45 AM', timeEvening: '05:25 PM', latitude: 12.8687, longitude: 77.6534 },
      { name: 'Electronic City Phase 2', timeMorning: '07:55 AM', timeEvening: '05:15 PM', latitude: 12.8452, longitude: 77.6602 },
      { name: 'Jigani Industrial Hub', timeMorning: '08:10 AM', timeEvening: '05:00 PM', latitude: 12.7828, longitude: 77.6416 },
      { name: 'Sri Sairam College Campus Gate 1', timeMorning: '08:25 AM', timeEvening: '04:45 PM', latitude: 12.7105, longitude: 77.6974, isCollege: true },
    ],
  },
  {
    routeNumber: 'Route 103',
    routeName: 'Hosur Interstate Rapid Transit',
    origin: 'Hosur Central Bus Stand (Tamil Nadu)',
    destination: 'Sri Sairam College Campus Gate 1',
    vehicleType: 'BUS',
    vehicleName: 'Tata Starbus Ultra College Bus 03',
    registrationNo: 'TN-70-H-1003',
    acAvailable: false,
    totalSeats: 55,
    availableSeats: 18,
    driverName: 'Senthil Nathan P.',
    driverPhone: '+91 94430 34567',
    status: 'ON_TIME',
    currentSpeedKmH: 52,
    distanceKm: 26,
    estimatedDurationMins: 55,
    stops: [
      { name: 'Hosur Central Bus Stand', timeMorning: '07:10 AM', timeEvening: '05:50 PM', latitude: 12.7409, longitude: 77.8253 },
      { name: 'Mookandapalli Sipcot Ring', timeMorning: '07:22 AM', timeEvening: '05:38 PM', latitude: 12.7538, longitude: 77.7972 },
      { name: 'Zuzuvadi Border Checkpost', timeMorning: '07:35 AM', timeEvening: '05:25 PM', latitude: 12.7712, longitude: 77.7731 },
      { name: 'Attibele Toll Gate Junction', timeMorning: '07:48 AM', timeEvening: '05:15 PM', latitude: 12.7801, longitude: 77.7661 },
      { name: 'Anekal Railway Station Cross', timeMorning: '08:12 AM', timeEvening: '04:55 PM', latitude: 12.7198, longitude: 77.7082 },
      { name: 'Sri Sairam College Campus Gate 1', timeMorning: '08:25 AM', timeEvening: '04:45 PM', latitude: 12.7105, longitude: 77.6974, isCollege: true },
    ],
  },
  {
    routeNumber: 'Route 104',
    routeName: 'Whitefield & Marathahalli Tech Express',
    origin: 'Whitefield TTMC (Vydehi Hospital)',
    destination: 'Sri Sairam College Campus Gate 1',
    vehicleType: 'BUS',
    vehicleName: 'Ashok Leyland Oyster College Bus 04',
    registrationNo: 'KA-51-E-1004',
    acAvailable: true,
    totalSeats: 48,
    availableSeats: 6,
    driverName: 'Govindappa M.',
    driverPhone: '+91 98450 45678',
    status: 'DELAYED_10M',
    currentSpeedKmH: 34,
    distanceKm: 46,
    estimatedDurationMins: 105,
    stops: [
      { name: 'Whitefield TTMC', timeMorning: '06:35 AM', timeEvening: '06:35 PM', latitude: 12.9698, longitude: 77.7499 },
      { name: 'Kundalahalli Gate', timeMorning: '06:50 AM', timeEvening: '06:20 PM', latitude: 12.9647, longitude: 77.7181 },
      { name: 'Marathahalli Multiplex', timeMorning: '07:05 AM', timeEvening: '06:05 PM', latitude: 12.9562, longitude: 77.7011 },
      { name: 'Bellandur EcoSpace Tech Park', timeMorning: '07:20 AM', timeEvening: '05:50 PM', latitude: 12.9260, longitude: 77.6762 },
      { name: 'Sarjapur Wipro Gate', timeMorning: '07:40 AM', timeEvening: '05:30 PM', latitude: 12.9121, longitude: 77.6835 },
      { name: 'Muthanallur Cross', timeMorning: '07:58 AM', timeEvening: '05:12 PM', latitude: 12.8344, longitude: 77.7441 },
      { name: 'Anekal Old Post Office Road', timeMorning: '08:15 AM', timeEvening: '04:55 PM', latitude: 12.7142, longitude: 77.6985 },
      { name: 'Sri Sairam College Campus Gate 1', timeMorning: '08:25 AM', timeEvening: '04:45 PM', latitude: 12.7105, longitude: 77.6974, isCollege: true },
    ],
  },
  {
    routeNumber: 'Route 105',
    routeName: 'Kengeri & Kanakapura Road Corridor',
    origin: 'Kengeri Satellite Town (Metro Hub)',
    destination: 'Sri Sairam College Campus Gate 1',
    vehicleType: 'BUS',
    vehicleName: 'Eicher Starline 50-Seater Bus 05',
    registrationNo: 'KA-51-E-1005',
    acAvailable: false,
    totalSeats: 50,
    availableSeats: 15,
    driverName: 'Manjunatha B.',
    driverPhone: '+91 98450 56789',
    status: 'ON_TIME',
    currentSpeedKmH: 45,
    distanceKm: 44,
    estimatedDurationMins: 95,
    stops: [
      { name: 'Kengeri Bus Terminal', timeMorning: '06:40 AM', timeEvening: '06:25 PM', latitude: 12.9101, longitude: 77.4839 },
      { name: 'Uttarahalli Main Road', timeMorning: '06:58 AM', timeEvening: '06:08 PM', latitude: 12.9064, longitude: 77.5332 },
      { name: 'Konanakunte Cross (Metro)', timeMorning: '07:12 AM', timeEvening: '05:54 PM', latitude: 12.8893, longitude: 77.5739 },
      { name: 'Art of Living Ashram Gate', timeMorning: '07:28 AM', timeEvening: '05:38 PM', latitude: 12.8122, longitude: 77.5381 },
      { name: 'Harohalli Industrial Hub', timeMorning: '07:50 AM', timeEvening: '05:18 PM', latitude: 12.6738, longitude: 77.4641 },
      { name: 'Bannerghatta National Park Circle', timeMorning: '08:08 AM', timeEvening: '05:02 PM', latitude: 12.8009, longitude: 77.5777 },
      { name: 'Sri Sairam College Campus Gate 1', timeMorning: '08:25 AM', timeEvening: '04:45 PM', latitude: 12.7105, longitude: 77.6974, isCollege: true },
    ],
  },
  {
    routeNumber: 'Route 106',
    routeName: 'Faculty & Executive Shuttler (Innova/Van)',
    origin: 'Jayanagar 4th Block Complex',
    destination: 'Sri Sairam College Campus Gate 1',
    vehicleType: 'VAN',
    vehicleName: 'Force Traveller Executive Van 06',
    registrationNo: 'KA-51-E-1006',
    acAvailable: true,
    totalSeats: 18,
    availableSeats: 4,
    driverName: 'Venkatesh Rao H.',
    driverPhone: '+91 98450 67890',
    status: 'ON_TIME',
    currentSpeedKmH: 56,
    distanceKm: 36,
    estimatedDurationMins: 75,
    stops: [
      { name: 'Jayanagar 4th Block Complex', timeMorning: '07:00 AM', timeEvening: '06:10 PM', latitude: 12.9299, longitude: 77.5833 },
      { name: 'South End Circle (Metro)', timeMorning: '07:10 AM', timeEvening: '06:00 PM', latitude: 12.9366, longitude: 77.5786 },
      { name: 'Bannerghatta Road (Vega City Mall)', timeMorning: '07:25 AM', timeEvening: '05:45 PM', latitude: 12.9081, longitude: 77.5997 },
      { name: 'Gottigere Lake Junction', timeMorning: '07:42 AM', timeEvening: '05:28 PM', latitude: 12.8598, longitude: 77.5862 },
      { name: 'Jigani Phase 1 Circle', timeMorning: '08:05 AM', timeEvening: '05:05 PM', latitude: 12.7842, longitude: 77.6433 },
      { name: 'Sri Sairam College Campus Gate 1', timeMorning: '08:25 AM', timeEvening: '04:45 PM', latitude: 12.7105, longitude: 77.6974, isCollege: true },
    ],
  },
];

/**
 * Ensures seed routes exist in SQLite database
 */
async function ensureSeedRoutesInDb() {
  try {
    const count = await prisma.campusRoute.count();
    if (count === 0) {
      console.log('Seeding initial campus transit routes into SQLite database...');
      for (const route of SEED_CAMPUS_ROUTES) {
        const { stops, ...routeData } = route;
        await prisma.campusRoute.create({
          data: {
            ...routeData,
            stops: {
              create: stops.map((s, idx) => ({
                name: s.name,
                timeMorning: s.timeMorning,
                timeEvening: s.timeEvening,
                latitude: s.latitude,
                longitude: s.longitude,
                stopOrder: idx,
                isCollege: Boolean(s.isCollege),
              })),
            },
          },
        });
      }
      console.log('Campus routes successfully seeded into database.');
    }
  } catch (err) {
    console.error('Error seeding campus routes:', err);
  }
}

// Ensure seed routes are present upon file evaluation
ensureSeedRoutesInDb();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// GET /api/routes - List all active campus bus routes with stops
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const fromQuery = (req.query.from as string || '').toLowerCase().trim();
    const toQuery = (req.query.to as string || '').toLowerCase().trim();
    const vehicleType = req.query.vehicleType as string;

    const whereClause: any = { isActive: true };
    if (vehicleType && ['BUS', 'VAN', 'CAR'].includes(vehicleType.toUpperCase())) {
      whereClause.vehicleType = vehicleType.toUpperCase();
    }

    let routes = await prisma.campusRoute.findMany({
      where: whereClause,
      include: {
        stops: {
          orderBy: { stopOrder: 'asc' },
        },
      },
      orderBy: { routeNumber: 'asc' },
    });

    if (routes.length === 0) {
      await ensureSeedRoutesInDb();
      routes = await prisma.campusRoute.findMany({
        where: whereClause,
        include: { stops: { orderBy: { stopOrder: 'asc' } } },
        orderBy: { routeNumber: 'asc' },
      });
    }

    // Filter by stop or origin/destination if query provided
    let results = routes;
    if (fromQuery) {
      results = results.filter((route) => {
        const matchOrigin = route.origin.toLowerCase().includes(fromQuery);
        const matchStops = route.stops.some((s) => s.name.toLowerCase().includes(fromQuery));
        return matchOrigin || matchStops;
      });
    }

    if (toQuery) {
      results = results.filter((route) => {
        const matchDest = route.destination.toLowerCase().includes(toQuery);
        const matchStops = route.stops.some((s) => s.name.toLowerCase().includes(toQuery));
        return matchDest || matchStops;
      });
    }

    res.json(results);
  } catch (error: any) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch campus routes.' });
  }
});

// GET /api/routes/:id - Single route by ID or Route Number
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const route = await prisma.campusRoute.findFirst({
      where: {
        OR: [{ id }, { routeNumber: id }],
      },
      include: {
        stops: { orderBy: { stopOrder: 'asc' } },
      },
    });

    if (!route) {
      res.status(404).json({ error: 'Campus route not found.' });
      return;
    }

    res.json(route);
  } catch (error: any) {
    console.error('Error fetching route details:', error);
    res.status(500).json({ error: 'Failed to fetch route details.' });
  }
});

// ==========================================
// ADMIN MANAGEMENT ROUTES
// ==========================================

// POST /api/routes - Create new route (Admin only)
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  apiMutationRateLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        routeNumber,
        routeName,
        origin,
        destination = 'Sri Sairam College Campus Gate 1',
        vehicleType = 'BUS',
        vehicleName,
        registrationNo,
        acAvailable = false,
        totalSeats = 55,
        availableSeats = 15,
        driverName,
        driverPhone,
        status = 'ON_TIME',
        currentSpeedKmH = 0,
        distanceKm = 40,
        estimatedDurationMins = 90,
        stops = [],
      } = req.body;

      if (!routeNumber || !routeName || !origin) {
        res.status(400).json({ error: 'Route Number, Route Name, and Origin are required.' });
        return;
      }

      const existing = await prisma.campusRoute.findUnique({
        where: { routeNumber: routeNumber.trim() },
      });
      if (existing) {
        res.status(409).json({ error: `Route number "${routeNumber}" already exists.` });
        return;
      }

      const created = await prisma.campusRoute.create({
        data: {
          routeNumber: routeNumber.trim(),
          routeName: routeName.trim(),
          origin: origin.trim(),
          destination: destination.trim(),
          vehicleType,
          vehicleName: vehicleName?.trim() || null,
          registrationNo: registrationNo?.trim() || null,
          acAvailable: Boolean(acAvailable),
          totalSeats: Number(totalSeats) || 55,
          availableSeats: Number(availableSeats) || 15,
          driverName: driverName?.trim() || null,
          driverPhone: driverPhone?.trim() || null,
          status,
          currentSpeedKmH: Number(currentSpeedKmH) || 0,
          distanceKm: Number(distanceKm) || 40,
          estimatedDurationMins: Number(estimatedDurationMins) || 90,
          stops: {
            create: (stops as RouteStopItem[]).map((s, idx) => ({
              name: s.name.trim(),
              timeMorning: s.timeMorning || '07:00 AM',
              timeEvening: s.timeEvening || '05:30 PM',
              latitude: Number(s.latitude) || 12.7105,
              longitude: Number(s.longitude) || 77.6974,
              stopOrder: s.stopOrder !== undefined ? s.stopOrder : idx,
              isCollege: Boolean(s.isCollege),
            })),
          },
        },
        include: { stops: { orderBy: { stopOrder: 'asc' } } },
      });

      await logActivity(
        req.user!.id,
        'CREATE_ROUTE',
        'ROUTE',
        created.id,
        `Added new bus corridor ${created.routeNumber} (${created.routeName}).`
      );

      res.status(201).json(created);
    } catch (error: any) {
      console.error('Create route error:', error);
      res.status(500).json({ error: error.message || 'Failed to create campus route.' });
    }
  }
);

// PUT /api/routes/:id - Update route & stops (Admin only)
router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  apiMutationRateLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const {
        routeNumber,
        routeName,
        origin,
        destination,
        vehicleType,
        vehicleName,
        registrationNo,
        acAvailable,
        totalSeats,
        availableSeats,
        driverName,
        driverPhone,
        status,
        currentSpeedKmH,
        distanceKm,
        estimatedDurationMins,
        isActive,
        stops,
      } = req.body;

      const existing = await prisma.campusRoute.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Campus route not found.' });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        // If stops array is passed, replace them
        if (Array.isArray(stops)) {
          await tx.routeStop.deleteMany({ where: { routeId: id } });
          await tx.routeStop.createMany({
            data: stops.map((s: RouteStopItem, idx: number) => ({
              routeId: id,
              name: s.name.trim(),
              timeMorning: s.timeMorning || '07:00 AM',
              timeEvening: s.timeEvening || '05:30 PM',
              latitude: Number(s.latitude) || 12.7105,
              longitude: Number(s.longitude) || 77.6974,
              stopOrder: s.stopOrder !== undefined ? s.stopOrder : idx,
              isCollege: Boolean(s.isCollege),
            })),
          });
        }

        return await tx.campusRoute.update({
          where: { id },
          data: {
            routeNumber: routeNumber !== undefined ? routeNumber.trim() : existing.routeNumber,
            routeName: routeName !== undefined ? routeName.trim() : existing.routeName,
            origin: origin !== undefined ? origin.trim() : existing.origin,
            destination: destination !== undefined ? destination.trim() : existing.destination,
            vehicleType: vehicleType !== undefined ? vehicleType : existing.vehicleType,
            vehicleName: vehicleName !== undefined ? vehicleName : existing.vehicleName,
            registrationNo: registrationNo !== undefined ? registrationNo : existing.registrationNo,
            acAvailable: acAvailable !== undefined ? Boolean(acAvailable) : existing.acAvailable,
            totalSeats: totalSeats !== undefined ? Number(totalSeats) : existing.totalSeats,
            availableSeats: availableSeats !== undefined ? Number(availableSeats) : existing.availableSeats,
            driverName: driverName !== undefined ? driverName : existing.driverName,
            driverPhone: driverPhone !== undefined ? driverPhone : existing.driverPhone,
            status: status !== undefined ? status : existing.status,
            currentSpeedKmH: currentSpeedKmH !== undefined ? Number(currentSpeedKmH) : existing.currentSpeedKmH,
            distanceKm: distanceKm !== undefined ? Number(distanceKm) : existing.distanceKm,
            estimatedDurationMins:
              estimatedDurationMins !== undefined
                ? Number(estimatedDurationMins)
                : existing.estimatedDurationMins,
            isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
          },
          include: { stops: { orderBy: { stopOrder: 'asc' } } },
        });
      });

      await logActivity(
        req.user!.id,
        'UPDATE_ROUTE',
        'ROUTE',
        id,
        `Updated bus corridor ${updated.routeNumber} (${updated.routeName}).`
      );

      res.json(updated);
    } catch (error: any) {
      console.error('Update route error:', error);
      res.status(500).json({ error: error.message || 'Failed to update campus route.' });
    }
  }
);

// DELETE /api/routes/:id - Delete route (Admin only)
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  apiMutationRateLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const existing = await prisma.campusRoute.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Campus route not found.' });
        return;
      }

      await prisma.campusRoute.delete({ where: { id } });

      await logActivity(
        req.user!.id,
        'DELETE_ROUTE',
        'ROUTE',
        id,
        `Deleted bus corridor ${existing.routeNumber} (${existing.routeName}).`
      );

      res.json({ message: `Route ${existing.routeNumber} deleted successfully.` });
    } catch (error: any) {
      console.error('Delete route error:', error);
      res.status(500).json({ error: 'Failed to delete campus route.' });
    }
  }
);

export default router;
