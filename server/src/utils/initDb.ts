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

    await prisma.user.upsert({
      where: { email: 'admin@college.edu' },
      update: {},
      create: {
        name: 'Campus Facilities Admin',
        email: 'admin@college.edu',
        passwordHash,
        phone: '+91 98765 00001',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    await prisma.user.upsert({
      where: { email: 'coo@sairamce.edu.in' },
      update: {},
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
      where: { email: 'faculty@college.edu' },
      update: {},
      create: {
        name: 'Dr. Ramesh Kumar',
        email: 'faculty@college.edu',
        passwordHash: facultyPasswordHash,
        phone: '+91 98765 11112',
        departmentId: departments['CSE']?.id,
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
