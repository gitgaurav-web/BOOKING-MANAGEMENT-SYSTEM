import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[SSCE-SEED] Seeding institutional database with strict @sairamce.edu.in domain...');

  // Clear existing
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.systemSetting.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);
  const superPasswordHash = await bcrypt.hash('superadmin123', salt);

  // 1. Departments
  const deptCse = await prisma.department.create({
    data: {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      description: 'Department of Computer Science & Engineering',
      status: 'ACTIVE',
    },
  });

  const deptMech = await prisma.department.create({
    data: {
      name: 'Mechanical Engineering',
      code: 'MECH',
      description: 'Department of Mechanical Engineering',
      status: 'ACTIVE',
    },
  });

  const deptAiml = await prisma.department.create({
    data: {
      name: 'Artificial Intelligence & Machine Learning',
      code: 'AIML',
      description: 'Department of AI & Machine Learning',
      status: 'ACTIVE',
    },
  });

  const deptEce = await prisma.department.create({
    data: {
      name: 'Electronics & Communication Engineering',
      code: 'ECE',
      description: 'Department of Electronics & Communication',
      status: 'ACTIVE',
    },
  });

  const deptAdmin = await prisma.department.create({
    data: {
      name: 'Central Transport & Administration',
      code: 'ADMIN',
      description: 'Central Fleet & Campus Logistics Division',
      status: 'ACTIVE',
    },
  });

  console.log('[SSCE-SEED] Departments created.');

  // 2. Users (Strictly @sairamce.edu.in)
  const transportAdmin = await prisma.user.create({
    data: {
      name: 'Campus Transport Manager',
      email: 'estate.admin@sairamce.edu.in',
      passwordHash,
      phone: '9840112233',
      departmentId: deptAdmin.id,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Dr. B. Shadaksharappa (COO)',
      email: 'coo@sairamce.edu.in',
      passwordHash: superPasswordHash,
      phone: '9840998877',
      departmentId: deptAdmin.id,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  const facultyMech = await prisma.user.create({
    data: {
      name: 'Prof. K. Arunkumar',
      email: 'faculty.mech@sairamce.edu.in',
      passwordHash,
      phone: '9791443322',
      departmentId: deptMech.id,
      role: 'FACULTY',
      status: 'ACTIVE',
    },
  });

  const facultyCse = await prisma.user.create({
    data: {
      name: 'Dr. C. Valarmathi',
      email: 'hod.cse@sairamce.edu.in',
      passwordHash,
      phone: '9443221100',
      departmentId: deptCse.id,
      role: 'FACULTY',
      status: 'ACTIVE',
    },
  });

  const studentLead = await prisma.user.create({
    data: {
      name: 'Gaurav Sharma',
      email: 'student.lead@sairamce.edu.in',
      passwordHash,
      phone: '9876543210',
      departmentId: deptAiml.id,
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  console.log('[SSCE-SEED] Users created with strict @sairamce.edu.in domain.');

  // 3. Vehicles
  const bus1 = await prisma.vehicle.create({
    data: {
      name: 'Ashok Leyland Viking College Bus 01',
      code: 'BUS-01',
      registrationNo: 'KA-51-E-1001',
      vehicleType: 'BUS',
      location: 'Campus Main Gate 1 Transport Bay',
      description: 'Ashok Leyland 55-seater heavy passenger college transport bus',
      capacity: 55,
      fuelType: 'DIESEL',
      acAvailable: false,
      image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
      features: JSON.stringify(['Air Suspension', 'GPS Speed Governor (60 km/h)', 'First Aid Kit', 'PA Sound System']),
      facilities: JSON.stringify(['Air Suspension', 'GPS Speed Governor (60 km/h)', 'First Aid Kit', 'PA Sound System']),
      status: 'ACTIVE',
      driverName: 'Muniswamy K.',
      driverPhone: '9845012345',
    },
  });

  const bus2 = await prisma.vehicle.create({
    data: {
      name: 'Eicher Skyline Pro College Bus 02 (Deluxe)',
      code: 'BUS-02',
      registrationNo: 'KA-51-E-1002',
      vehicleType: 'BUS',
      location: 'Campus Main Gate 1 Transport Bay',
      description: 'Executive air-conditioned luxury bus for student industrial tours',
      capacity: 55,
      fuelType: 'DIESEL',
      acAvailable: true,
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
      features: JSON.stringify(['AC Executive', 'Luggage Compartment', 'Speed Governor', 'Fire Extinguisher']),
      facilities: JSON.stringify(['AC Executive', 'Luggage Compartment', 'Speed Governor', 'Fire Extinguisher']),
      status: 'ACTIVE',
      driverName: 'Ramesh Kumar S.',
      driverPhone: '9845023456',
    },
  });

  const van1 = await prisma.vehicle.create({
    data: {
      name: 'Force Traveller Royal College Van 01',
      code: 'VAN-01',
      registrationNo: 'KA-51-E-2001',
      vehicleType: 'VAN',
      location: 'Departmental Parking Bay 2',
      description: '18-seater mid-van for faculty travel and placement visits',
      capacity: 18,
      fuelType: 'DIESEL',
      acAvailable: true,
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
      features: JSON.stringify(['Push-back Seats', 'AC', 'Fastag Tag Enabled', 'Luggage Carrier']),
      facilities: JSON.stringify(['Push-back Seats', 'AC', 'Fastag Tag Enabled', 'Luggage Carrier']),
      status: 'ACTIVE',
      driverName: 'Venkatesh B.',
      driverPhone: '9845034567',
    },
  });

  const car1 = await prisma.vehicle.create({
    data: {
      name: 'Toyota Innova Crysta VIP Staff Car',
      code: 'CAR-01',
      registrationNo: 'KA-51-E-3001',
      vehicleType: 'CAR',
      location: 'Administration Block Portico',
      description: 'Executive air-conditioned VIP car for dignitaries and guests',
      capacity: 7,
      fuelType: 'DIESEL',
      acAvailable: true,
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
      features: JSON.stringify(['Captain Chairs', 'Automatic Climate Control', 'VIP Escort Ready', 'Fastag NETC']),
      facilities: JSON.stringify(['Captain Chairs', 'Automatic Climate Control', 'VIP Escort Ready', 'Fastag NETC']),
      status: 'ACTIVE',
      driverName: 'Suresh G.',
      driverPhone: '9845045678',
    },
  });

  const car2 = await prisma.vehicle.create({
    data: {
      name: 'Maruti Suzuki Dzire Official Staff Sedan',
      code: 'CAR-02',
      registrationNo: 'KA-51-E-3002',
      vehicleType: 'CAR',
      location: 'Staff Parking Ground',
      description: 'Official compact sedan for VTU and university exam visits',
      capacity: 4,
      fuelType: 'PETROL',
      acAvailable: true,
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
      features: JSON.stringify(['Sedan Comfort', 'VTU Confidential Trunk Lock', 'Fastag']),
      facilities: JSON.stringify(['Sedan Comfort', 'VTU Confidential Trunk Lock', 'Fastag']),
      status: 'ACTIVE',
      driverName: 'Anand Raj',
      driverPhone: '9845056789',
    },
  });

  const amb1 = await prisma.vehicle.create({
    data: {
      name: 'Force Motors Campus Life Support Ambulance',
      code: 'AMB-01',
      registrationNo: 'KA-51-E-9999',
      vehicleType: 'AMBULANCE',
      location: 'Campus Health Centre',
      description: 'Emergency medical vehicle equipped with oxygen support and stretcher',
      capacity: 4,
      fuelType: 'DIESEL',
      acAvailable: true,
      image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1200&q=80',
      features: JSON.stringify(['Oxygen Cylinder', 'Foldable Stretcher', 'AED Defibrillator', '24x7 Beacon Sirens']),
      facilities: JSON.stringify(['Oxygen Cylinder', 'Foldable Stretcher', 'AED Defibrillator', '24x7 Beacon Sirens']),
      status: 'ACTIVE',
      driverName: 'Nagaraj M.',
      driverPhone: '9845067890',
    },
  });

  console.log('[SSCE-SEED] Fleet vehicles created.');

  // 4. Sample Bookings conforming to [VEHICLE_TYPE]-[MONTH][YY]-[NUM]
  await prisma.booking.create({
    data: {
      bookingId: 'BUS-NOV26-001',
      userId: facultyCse.id,
      vehicleId: bus2.id,
      departmentId: deptCse.id,
      eventName: 'Infosys Mysore Campus Industrial Visit for 3rd Year CSE',
      purpose: 'Industrial Visit for CSE department students',
      description: 'Students visiting Infosys Development Center Mysore',
      requestedBy: 'Dr. C. Valarmathi',
      coordinatorName: 'Dr. C. Valarmathi',
      contactNumber: '9443221100',
      email: 'hod.cse@sairamce.edu.in',
      pickupLocation: 'Sri Sairam College Campus Gate 1',
      dropLocation: 'Infosys Limited, Hebbal Electronic City, Mysuru, Karnataka',
      passengerCount: 52,
      participantCount: 52,
      bookingDate: '2026-11-15',
      endDate: '2026-11-15',
      bookingType: 'FULL_DAY',
      startTime: '07:30',
      endTime: '20:30',
      estimatedKilometers: 320,
      tollPaymentRequired: true,
      specialRequirements: JSON.stringify(['AC Mandatory', 'Student Name List Attached', 'Speed Governor Verified']),
      status: 'APPROVED',
      assignedDriverName: 'Ramesh Kumar S.',
      assignedDriverPhone: '9845023456',
      adminNotes: 'HOD permission verified. Fastag tolls pre-authorized for Mysore Expressway.',
      approvedById: transportAdmin.id,
      approvedAt: new Date(),
      odometerStart: 38400,
    },
  });

  await prisma.booking.create({
    data: {
      bookingId: 'VAN-NOV26-002',
      userId: studentLead.id,
      vehicleId: van1.id,
      departmentId: deptAiml.id,
      eventName: 'VTU State Level Inter-Collegiate Robotics & AI Championship',
      purpose: 'Robotics team travel to tournament',
      description: 'College robotics team competing in VTU championship',
      requestedBy: 'Gaurav Sharma',
      coordinatorName: 'Gaurav Sharma',
      contactNumber: '9876543210',
      email: 'student.lead@sairamce.edu.in',
      pickupLocation: 'College Sports Pavilion',
      dropLocation: 'KSCA Cricket & Indoor Sports Complex, Alur, Bengaluru',
      passengerCount: 15,
      participantCount: 15,
      bookingDate: '2026-11-16',
      endDate: '2026-11-16',
      bookingType: 'FULL_DAY',
      startTime: '08:00',
      endTime: '18:00',
      estimatedKilometers: 90,
      tollPaymentRequired: true,
      specialRequirements: JSON.stringify(['Extra Luggage for Robotics Kits']),
      status: 'APPROVED',
      assignedDriverName: 'Venkatesh B.',
      assignedDriverPhone: '9845034567',
      adminNotes: 'Force Traveller van allocated with driver Venkatesh.',
      approvedById: transportAdmin.id,
      approvedAt: new Date(),
      odometerStart: 51200,
    },
  });

  await prisma.booking.create({
    data: {
      bookingId: 'BUS-NOV26-003',
      userId: facultyMech.id,
      vehicleId: bus1.id,
      departmentId: deptMech.id,
      eventName: 'HAL Aerospace Heritage Museum & Wind Tunnel Demonstration',
      purpose: 'Aerospace museum visit for mechanical engineers',
      description: 'Wind tunnel demonstration and aero systems visit',
      requestedBy: 'Prof. K. Arunkumar',
      coordinatorName: 'Prof. K. Arunkumar',
      contactNumber: '9791443322',
      email: 'faculty.mech@sairamce.edu.in',
      pickupLocation: 'Mechanical Engineering Block Porch',
      dropLocation: 'HAL Aerospace Heritage Centre, Old Airport Road, Bengaluru',
      passengerCount: 48,
      participantCount: 48,
      bookingDate: '2026-11-20',
      endDate: '2026-11-20',
      bookingType: 'FULL_DAY',
      startTime: '08:30',
      endTime: '17:30',
      estimatedKilometers: 85,
      status: 'PENDING',
      adminNotes: 'Awaiting Transport Admin final vehicle confirmation.',
    },
  });

  await prisma.booking.create({
    data: {
      bookingId: 'CAR-NOV26-004',
      userId: facultyMech.id,
      vehicleId: car1.id,
      departmentId: deptMech.id,
      eventName: 'Keynote Speaker Guest Pickup from Kempegowda Airport Terminal 2',
      purpose: 'Guest dignitary pickup',
      description: 'Chief guest pickup for International Conference on Green Energy',
      requestedBy: 'Prof. K. Arunkumar',
      coordinatorName: 'Prof. K. Arunkumar',
      contactNumber: '9791443322',
      email: 'faculty.mech@sairamce.edu.in',
      pickupLocation: 'Kempegowda International Airport (BLR) T2',
      dropLocation: 'Sri Sairam College Campus Guest House',
      passengerCount: 3,
      participantCount: 3,
      bookingDate: '2026-11-22',
      endDate: '2026-11-22',
      bookingType: 'AFTERNOON',
      startTime: '14:00',
      endTime: '19:00',
      estimatedKilometers: 110,
      status: 'PENDING',
    },
  });

  console.log('[SSCE-SEED] Sample bookings created with [TYPE]-[MONTH][YY]-[NUM] standard.');

  // 5. Maintenance Records
  await prisma.maintenance.create({
    data: {
      vehicleId: bus1.id,
      startDate: '2026-11-28',
      endDate: '2026-11-29',
      maintenanceType: 'REGULAR_SERVICE',
      reason: 'Scheduled 40,000 KM major maintenance',
      description: 'Engine oil change, air filter replacement, and brake inspection.',
      garageName: 'Ashok Leyland Authorized Service Centre - Electronic City',
      cost: 14500,
      responsiblePerson: 'Dr. R. Rajendran',
    },
  });

  // 6. Blocked Dates
  await prisma.blockedDate.create({
    data: {
      vehicleId: null, // Applies to all vehicles
      startDate: '2026-12-05',
      endDate: '2026-12-08',
      reason: 'UNIVERSITY_EXAMS_ONLY',
      description: 'Campus fleet reserved exclusively for VTU Semester Examination question paper collection and delivery.',
      createdById: superAdmin.id,
    },
  });

  // 7. Academic Holidays
  await prisma.holiday.create({
    data: {
      name: 'Kanakadasa Jayanthi (State Holiday)',
      date: '2026-11-27',
      description: 'Government of Karnataka Gazette Holiday. Fleet restricted to emergency transit only.',
      vehicleScope: 'ALL',
      hallScope: 'ALL',
    },
  });

  // 8. System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'INSTITUTION_NAME', value: 'Sri Sairam College of Engineering' },
      { key: 'RESTRICTED_DOMAIN', value: '@sairamce.edu.in' },
      { key: 'GATE_DISPATCH_ACTIVE', value: 'true' },
      { key: 'SPEED_LIMIT_KMH', value: '60' },
    ],
  });

  console.log('[SSCE-SEED] Institutional seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
