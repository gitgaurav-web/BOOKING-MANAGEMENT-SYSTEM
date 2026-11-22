import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function ensureDatabaseInitialized(): Promise<void> {
  try {
    const hallCount = await prisma.hall.count();
    if (hallCount > 0) {
      console.log(`[DATABASE] Ready with ${hallCount} campus halls configured.`);
      return;
    }

    console.log('[DATABASE] Empty database detected. Auto-initializing campus halls, departments, and administrative accounts...');

    // 1. Departments
    const departmentsData = [
      { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science & Engineering' },
      { name: 'Artificial Intelligence & Machine Learning', code: 'AIML', description: 'Department of AI & Data Science' },
      { name: 'Information Science & Engineering', code: 'ISE', description: 'Department of Information Science & Engineering' },
      { name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of Electronics & Communication' },
      { name: 'Electrical & Electronics Engineering', code: 'EEE', description: 'Department of Electrical & Electronics' },
      { name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mechanical Engineering' },
      { name: 'CSE (IoT & CyberSecurity with Blockchain)', code: 'CSE-CY', description: 'Department of Cyber Security and IoT' },
    ];

    const departments: Record<string, any> = {};
    for (const dept of departmentsData) {
      const created = await prisma.department.upsert({
        where: { code: dept.code },
        update: { name: dept.name, description: dept.description },
        create: dept,
      });
      departments[dept.code] = created;
    }

    // 2. Default Administrative and Faculty Accounts
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
    const superAdminPassword = process.env.SEED_SUPERADMIN_PASSWORD || 'superadmin123';
    const facultyPassword = process.env.SEED_FACULTY_PASSWORD || 'faculty123';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    const superPasswordHash = await bcrypt.hash(superAdminPassword, salt);
    const facultyPasswordHash = await bcrypt.hash(facultyPassword, salt);

    // Official Sri Sairam Institutional Accounts
    await prisma.user.upsert({
      where: { email: 'coo@sairamce.edu.in' },
      update: {
        name: 'Dr. B. Shadaksharappa',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
      create: {
        name: 'Dr. B. Shadaksharappa',
        email: 'coo@sairamce.edu.in',
        passwordHash: superPasswordHash,
        phone: '+91 98765 00010',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });

    await prisma.user.upsert({
      where: { email: 'iqac@sairamce.edu.in' },
      update: {
        name: 'IQAC Cell',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
      create: {
        name: 'IQAC Cell',
        email: 'iqac@sairamce.edu.in',
        passwordHash: superPasswordHash,
        phone: '+91 78451 25999',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });

    await prisma.user.upsert({
      where: { email: 'estate.admin@sairamce.edu.in' },
      update: {
        name: 'Campus Estate Manager',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      create: {
        name: 'Campus Estate Manager',
        email: 'estate.admin@sairamce.edu.in',
        passwordHash,
        phone: '+91 98765 00011',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    await prisma.user.upsert({
      where: { email: 'hod.cse@sairamce.edu.in' },
      update: {
        name: 'Dr. C. Valarmathi',
        role: 'FACULTY',
        status: 'ACTIVE',
        departmentId: departments['CSE']?.id,
      },
      create: {
        name: 'Dr. C. Valarmathi',
        email: 'hod.cse@sairamce.edu.in',
        passwordHash: facultyPasswordHash,
        phone: '+91 98765 00012',
        departmentId: departments['CSE']?.id,
        role: 'FACULTY',
        status: 'ACTIVE',
      },
    });

    await prisma.user.upsert({
      where: { email: 'faculty.ece@sairamce.edu.in' },
      update: {
        name: 'Prof. R. Anand',
        role: 'FACULTY',
        status: 'ACTIVE',
        departmentId: departments['ECE']?.id,
      },
      create: {
        name: 'Prof. R. Anand',
        email: 'faculty.ece@sairamce.edu.in',
        passwordHash: facultyPasswordHash,
        phone: '+91 98765 00013',
        departmentId: departments['ECE']?.id,
        role: 'FACULTY',
        status: 'ACTIVE',
      },
    });

    // 3. Featured Campus Halls
    await prisma.hall.upsert({
      where: { code: 'SEMINAR-HALL-01' },
      update: {},
      create: {
        name: 'Leo Muthu Central Seminar Hall',
        code: 'SEMINAR-HALL-01',
        location: 'Administrative & Academic Block, 2nd Floor',
        description: 'Well-acoustic premier auditorium named in honor of Founder Chairman MJF. Ln. Leo Muthu. Outfitted for state and national conferences, convocations, project expos, and academic symposiums.',
        capacity: 350,
        image: '/images/seminar-hall-stage.jpg',
        facilities: JSON.stringify([
          'Acoustic Audio System',
          'Dual Laser HD Projectors',
          'Central Air Conditioning (HVAC)',
          'Stage Lighting & Podium',
          'Motorized Drop-down Screens',
          'Dedicated Green Room',
          'High-Speed Wi-Fi',
          'Audio-Visual Control Booth',
          'Wireless Handheld & Collar Mics',
          'DG Generator Backup',
        ]),
        status: 'ACTIVE',
      },
    });

    await prisma.hall.upsert({
      where: { code: 'AV-HALL-02' },
      update: {},
      create: {
        name: 'Sir M. Visvesvaraya AV Hall',
        code: 'AV-HALL-02',
        location: 'Engineering Media Center, Ground Floor',
        description: 'Advanced multimedia presentation and interactive lecture theatre equipped with smart displays, acoustic baffling, and hybrid video conferencing infrastructure.',
        capacity: 150,
        image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
        facilities: JSON.stringify([
          'Interactive Smart Display / 4K Screen',
          'Dolby Digital Surround Speakers',
          'Full Split Climate Control',
          'Video Conferencing Rig',
          'Hybrid Classroom Webcams',
          'Smart Presentation Podium',
          'High-Speed Wi-Fi',
          'Wireless Presentation Clicker',
          'Uninterrupted UPS Power',
        ]),
        status: 'ACTIVE',
      },
    });

    // 3b. Sairam Campus Transport Fleet (CTVRP)
    await prisma.vehicle.upsert({
      where: { registrationNo: 'KA-51-E-7707' },
      update: {},
      create: {
        name: 'Leo Muthu Deluxe Campus Bus (Bus 07)',
        registrationNo: 'KA-51-E-7707',
        vehicleType: 'BUS',
        capacity: 55,
        fuelType: 'DIESEL',
        acAvailable: true,
        image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
        features: JSON.stringify([
          'High-Back Pushback Seats',
          'Central HVAC Air Conditioning',
          'Dual Front & Cabin Dashcams',
          'First Aid Emergency Kit',
          'PA Announcement Audio System',
          'Speed Governor 60 km/h',
          'Fire Extinguisher',
        ]),
        status: 'ACTIVE',
        driverName: 'Mr. Murugan R',
        driverPhone: '+91 98451 22301',
      },
    });

    await prisma.vehicle.upsert({
      where: { registrationNo: 'KA-51-M-2026' },
      update: {},
      create: {
        name: 'Executive Official Staff Car (Innova Crysta)',
        registrationNo: 'KA-51-M-2026',
        vehicleType: 'CAR',
        capacity: 7,
        fuelType: 'DIESEL',
        acAvailable: true,
        image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
        features: JSON.stringify([
          'Captain Leather Seats',
          'Automatic Climate Control',
          'Fastag Enabled',
          'Dash Camera & Reverse Sensor',
          'Spacious Luggage Boot',
          'GPS Real-Time Tracking',
        ]),
        status: 'ACTIVE',
        driverName: 'Mr. Venkatesh K',
        driverPhone: '+91 98451 22302',
      },
    });

    await prisma.vehicle.upsert({
      where: { registrationNo: 'KA-51-T-1414' },
      update: {},
      create: {
        name: 'Department Field & Project Van (Force Traveller)',
        registrationNo: 'KA-51-T-1414',
        vehicleType: 'VAN',
        capacity: 14,
        fuelType: 'DIESEL',
        acAvailable: true,
        image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
        features: JSON.stringify([
          'Individual Reclining Seats',
          'First Aid Kit',
          'Roof Luggage Carrier',
          'Emergency Glass Breaker',
          'Dual AC Blowers',
        ]),
        status: 'ACTIVE',
        driverName: 'Mr. Shankar G',
        driverPhone: '+91 98451 22303',
      },
    });

    // 4. Default Settings
    const defaultSettings: Record<string, string> = {
      siteName: 'Sri Sairam College Facility Booking Portal',
      institutionName: 'Sri Sairam College of Engineering',
      contactEmail: 'info@sairamce.edu.in',
      contactPhone: '080-27830221',
      address: 'Sai Leo Nagar, Guddanahalli Village, Samandur Post, Anekal, Bengaluru, Karnataka - 562106',
      academicSession: 'Academic Session 2026-27',
      accreditationText: 'Approved by AICTE · Affiliated to VTU Belagavi · NAAC Accredited',
      requireAdminApproval: 'true',
      requireUserApproval: 'true',
      allowWeekendBookings: 'true',
      allowHolidayBookings: 'false',
      emailNotificationsEnabled: 'true',
      publicUpcomingDisplay: 'EVENT_TITLE',
      minAdvanceNoticeDays: '0',
      maxAdvanceNoticeDays: '90',
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    console.log('[DATABASE] Campus halls, departments, accounts, and institutional settings auto-initialized successfully.');
  } catch (error) {
    console.error('[DATABASE INIT WARNING]: Could not auto-seed database:', error);
  }
}
