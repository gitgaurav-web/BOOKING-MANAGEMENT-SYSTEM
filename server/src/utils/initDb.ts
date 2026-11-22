import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function ensureDatabaseInitialized(): Promise<void> {
  try {
    const vehicleCount = await prisma.vehicle.count();
    if (vehicleCount > 0) {
      console.log(`[DATABASE] Ready with ${vehicleCount} campus vehicles configured.`);
      return;
    }

    console.log('[DATABASE] Initializing Sri Sairam College fleet, departments, and user accounts...');

    // 1. Academic & Administrative Departments
    const departmentsData = [
      { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science & Engineering' },
      { name: 'Artificial Intelligence & Machine Learning', code: 'AIML', description: 'Department of AI & Data Science' },
      { name: 'Information Science & Engineering', code: 'ISE', description: 'Department of Information Science & Engineering' },
      { name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of Electronics & Communication' },
      { name: 'Electrical & Electronics Engineering', code: 'EEE', description: 'Department of Electrical & Electronics' },
      { name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mechanical Engineering' },
      { name: 'Civil Engineering', code: 'CIVIL', description: 'Department of Civil Engineering' },
      { name: 'Science & Humanities', code: 'S&H', description: 'First Year Academic Studies' },
      { name: 'Central Transport & Logistics Cell', code: 'TRANSPORT', description: 'Fleet and Transport Administration' },
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

    // 2. Default Administrative & Faculty Accounts
    const salt = await bcrypt.genSalt(10);
    const superPasswordHash = await bcrypt.hash('superadmin123', salt);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);
    const facultyPasswordHash = await bcrypt.hash('faculty123', salt);

    // Official Sri Sairam Institutional Accounts
    await prisma.user.upsert({
      where: { email: 'coo@sairamce.edu.in' },
      update: { name: 'Dr. B. Shadaksharappa (COO)', role: 'SUPER_ADMIN', status: 'ACTIVE' },
      create: {
        name: 'Dr. B. Shadaksharappa (COO)',
        email: 'coo@sairamce.edu.in',
        passwordHash: superPasswordHash,
        phone: '+91 98765 00010',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });

    await prisma.user.upsert({
      where: { email: 'iqac@sairamce.edu.in' },
      update: { name: 'IQAC Cell', role: 'SUPER_ADMIN', status: 'ACTIVE' },
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
      update: { name: 'Campus Transport Manager', role: 'ADMIN', status: 'ACTIVE' },
      create: {
        name: 'Campus Transport Manager',
        email: 'estate.admin@sairamce.edu.in',
        passwordHash: adminPasswordHash,
        phone: '+91 98765 00011',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    await prisma.user.upsert({
      where: { email: 'hod.cse@sairamce.edu.in' },
      update: { name: 'Dr. C. Valarmathi (HOD CSE)', role: 'FACULTY', status: 'ACTIVE' },
      create: {
        name: 'Dr. C. Valarmathi (HOD CSE)',
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
      update: { name: 'Prof. R. Anand (ECE)', role: 'FACULTY', status: 'ACTIVE' },
      create: {
        name: 'Prof. R. Anand (ECE)',
        email: 'faculty.ece@sairamce.edu.in',
        passwordHash: facultyPasswordHash,
        phone: '+91 98765 00013',
        departmentId: departments['ECE']?.id,
        role: 'FACULTY',
        status: 'ACTIVE',
      },
    });

    // 3. Featured Campus Fleet (Cars, Buses, Vans)
    const vehiclesData = [
      {
        name: 'Toyota Innova Crysta Staff Car (KA-51-E-1234)',
        code: 'CAR-01',
        registrationNo: 'KA-51-E-1234',
        vehicleType: 'CAR',
        location: 'Administration Block Portico',
        description: 'Executive air-conditioned staff car for official guest pickup, airport transfers, university board meetings, and principal travel.',
        capacity: 7,
        fuelType: 'DIESEL',
        acAvailable: true,
        image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
        driverName: 'Ramesh Kumar',
        driverPhone: '+91 98765 11001',
        features: JSON.stringify(['Air Conditioned', 'GPS Live Tracking', 'Speed Governor (60 km/h)', 'First Aid Kit', 'FASTag Enabled']),
        facilities: JSON.stringify(['Air Conditioned', 'GPS Live Tracking', 'Speed Governor (60 km/h)', 'First Aid Kit', 'FASTag Enabled']),
        status: 'ACTIVE',
      },
      {
        name: 'Ashok Leyland Campus Tour Bus 12 (KA-51-E-4567)',
        code: 'BUS-12',
        registrationNo: 'KA-51-E-4567',
        vehicleType: 'BUS',
        location: 'Campus Main Gate 1 Transport Bay',
        description: 'Heavy passenger transit bus for departmental industrial visits, inter-college sports tournaments, and educational field trips.',
        capacity: 55,
        fuelType: 'DIESEL',
        acAvailable: false,
        image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
        driverName: 'Manjunath Gowda',
        driverPhone: '+91 98765 11002',
        features: JSON.stringify(['PA Sound System', 'Speed Governor (50 km/h)', 'First Aid Box', 'Emergency Fire Extinguisher', 'Overhead Luggage Racks']),
        facilities: JSON.stringify(['PA Sound System', 'Speed Governor (50 km/h)', 'First Aid Box', 'Emergency Fire Extinguisher', 'Overhead Luggage Racks']),
        status: 'ACTIVE',
      },
      {
        name: 'Force Traveller Academic Van 05 (KA-51-E-8901)',
        code: 'VAN-05',
        registrationNo: 'KA-51-E-8901',
        vehicleType: 'VAN',
        location: 'Departmental Parking Bay 2',
        description: 'Mid-size 18-seater van for faculty project teams, student hackathons, seminars, and placement drive logistics.',
        capacity: 18,
        fuelType: 'DIESEL',
        acAvailable: true,
        image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
        driverName: 'Suresh Babu',
        driverPhone: '+91 98765 11003',
        features: JSON.stringify(['Air Conditioned', 'High-Roof Seating', 'GPS Tracking', 'Mobile Charging Ports', 'First Aid Kit']),
        facilities: JSON.stringify(['Air Conditioned', 'High-Roof Seating', 'GPS Tracking', 'Mobile Charging Ports', 'First Aid Kit']),
        status: 'ACTIVE',
      },
      {
        name: 'Maruti Suzuki Ertiga Inspection Car (KA-51-E-9988)',
        code: 'CAR-02',
        registrationNo: 'KA-51-E-9988',
        vehicleType: 'CAR',
        location: 'Engineering Block Parking',
        description: '7-seater staff multi-utility vehicle for VTU examination duty, faculty coordination visits, and institutional errand runs.',
        capacity: 7,
        fuelType: 'PETROL',
        acAvailable: true,
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
        driverName: 'Anil Kumar',
        driverPhone: '+91 98765 11004',
        features: JSON.stringify(['Dual AC', 'GPS Navigation', 'First Aid Box', 'FASTag']),
        facilities: JSON.stringify(['Dual AC', 'GPS Navigation', 'First Aid Box', 'FASTag']),
        status: 'ACTIVE',
      },
    ];

    for (const v of vehiclesData) {
      await prisma.vehicle.upsert({
        where: { registrationNo: v.registrationNo },
        update: {},
        create: v,
      });
    }

    // 4. Default System Settings
    const defaultSettings: Record<string, string> = {
      siteName: 'Sri Sairam College Transport & Vehicle Portal',
      institutionName: 'Sri Sairam College of Engineering',
      contactEmail: 'transport@sairamce.edu.in',
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

    console.log('[DATABASE] Sri Sairam College fleet, accounts, and settings auto-initialized successfully.');
  } catch (error) {
    console.error('[DATABASE INIT ERROR]:', error);
  }
}
