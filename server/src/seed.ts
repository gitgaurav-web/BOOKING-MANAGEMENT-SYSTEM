import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // 1. Departments
  const departmentsData = [
    { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science & Engineering' },
    { name: 'Artificial Intelligence & Machine Learning', code: 'AIML', description: 'Department of AI & Data Science' },
    { name: 'Information Science & Engineering', code: 'ISE', description: 'Department of Information Science' },
    { name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of Electronics & Communication' },
    { name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mechanical Engineering' },
    { name: 'Civil Engineering', code: 'CIVIL', description: 'Department of Civil Engineering' },
    { name: 'Department of Management Studies', code: 'MBA', description: 'MBA and Executive Education' },
  ];

  const departments: Record<string, any> = {};
  for (const dept of departmentsData) {
    const created = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
    departments[dept.code] = created;
  }

  // 2. Users (Admin, Super Admin, Faculty)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);
  const superPasswordHash = await bcrypt.hash('superadmin123', salt);
  const facultyPasswordHash = await bcrypt.hash('faculty123', salt);

  const admin = await prisma.user.upsert({
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

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@college.edu' },
    update: {},
    create: {
      name: 'Registrar & Chief Administrator',
      email: 'superadmin@college.edu',
      passwordHash: superPasswordHash,
      phone: '+91 98765 00000',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  const facultyUser = await prisma.user.upsert({
    where: { email: 'faculty@college.edu' },
    update: {},
    create: {
      name: 'Dr. Ramesh Kumar',
      email: 'faculty@college.edu',
      passwordHash: facultyPasswordHash,
      phone: '+91 98765 11112',
      departmentId: departments['CSE'].id,
      role: 'FACULTY',
      status: 'ACTIVE',
    },
  });

  const aimlFaculty = await prisma.user.upsert({
    where: { email: 'aiml.hod@college.edu' },
    update: {},
    create: {
      name: 'Prof. Ananya Sen',
      email: 'aiml.hod@college.edu',
      passwordHash: facultyPasswordHash,
      phone: '+91 98765 22223',
      departmentId: departments['AIML'].id,
      role: 'FACULTY',
      status: 'ACTIVE',
    },
  });

  // 3. Halls (Seminar Hall & AV Hall)
  const seminarHall = await prisma.hall.upsert({
    where: { code: 'SEMINAR-HALL-01' },
    update: {},
    create: {
      name: 'Seminar Hall',
      code: 'SEMINAR-HALL-01',
      description: 'Grand modern auditorium hall equipped for national conferences, keynote addresses, academic symposiums, and faculty development programs. Features tiered acoustic design.',
      location: 'Main Academic Block, 2nd Floor (Room 204)',
      capacity: 200, // Informational only
      image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
      facilities: JSON.stringify([
        'Full HD Ceiling Projector',
        'Podium & Wireless Lapel Mics',
        'Central High-Capacity AC',
        'Stage Lighting System',
        'Surround Sound Audio',
        'High-Speed Wi-Fi',
        'Live Video Recording Setup',
      ]),
      status: 'ACTIVE',
    },
  });

  const avHall = await prisma.hall.upsert({
    where: { code: 'AV-HALL-01' },
    update: {},
    create: {
      name: 'AV Hall',
      code: 'AV-HALL-01',
      description: 'Audio Visual Hall outfitted with interactive smart boards, surround audio, and video conference telepresence gear. Perfect for workshops, webinars, and thesis defenses.',
      location: 'Science & Technology Block, Ground Floor (Room 012)',
      capacity: 120, // Informational only
      image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
      facilities: JSON.stringify([
        'Dual Interactive Touch Smartboards',
        'Video Conferencing PTZ Camera',
        'Dolby 5.1 Acoustic Setup',
        'Split Climate Control AC',
        'High-Speed Dedicated Fiber Wi-Fi',
        'Microphone Array',
      ]),
      status: 'ACTIVE',
    },
  });

  // 4. Sample Bookings (Around Current Date and October 2026)
  // Determine current date formatted YYYY-MM-DD
  const todayObj = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];

  const d1 = new Date(todayObj);
  d1.setDate(d1.getDate() + 1);

  const d2 = new Date(todayObj);
  d2.setDate(d2.getDate() + 3);

  const d3 = new Date(todayObj);
  d3.setDate(d3.getDate() + 5);

  const d4 = new Date(todayObj);
  d4.setDate(d4.getDate() + 7);

  const d5 = new Date(todayObj);
  d5.setDate(d5.getDate() + 9);

  // Today booking for Seminar Hall
  await prisma.booking.upsert({
    where: { bookingId: 'HB-2026-0001' },
    update: {},
    create: {
      bookingId: 'HB-2026-0001',
      userId: facultyUser.id,
      hallId: seminarHall.id,
      departmentId: departments['CSE'].id,
      eventName: 'Faculty Development Program on Cloud Computing',
      description: 'Week-long national level FDP for faculty and research scholars.',
      purpose: 'Faculty Training & Skill Enrichment',
      requestedBy: 'Dr. Ramesh Kumar',
      coordinatorName: 'Dr. Ramesh Kumar (CSE HOD)',
      contactNumber: '+91 98765 11112',
      email: 'faculty@college.edu',
      bookingDate: formatYMD(todayObj),
      bookingType: 'FULL_DAY',
      startTime: '09:30',
      endTime: '16:30',
      participantCount: 150,
      specialRequirements: JSON.stringify(['Projector', 'Microphone', 'AC', 'Internet', 'Recording']),
      additionalNotes: 'Need podium microphones checked prior to 09:00 AM.',
      status: 'APPROVED',
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  });

  // Upcoming Approved Booking for AV Hall
  await prisma.booking.upsert({
    where: { bookingId: 'HB-2026-0002' },
    update: {},
    create: {
      bookingId: 'HB-2026-0002',
      userId: aimlFaculty.id,
      hallId: avHall.id,
      departmentId: departments['AIML'].id,
      eventName: 'Workshop on Generative AI & Deep Learning Models',
      description: 'Hands-on practical session for 3rd and 4th year undergraduate students.',
      purpose: 'Student Technical Workshop',
      requestedBy: 'Prof. Ananya Sen',
      coordinatorName: 'Prof. Ananya Sen',
      contactNumber: '+91 98765 22223',
      email: 'aiml.hod@college.edu',
      bookingDate: formatYMD(d1),
      bookingType: 'FULL_DAY',
      startTime: '10:00',
      endTime: '16:00',
      participantCount: 85,
      specialRequirements: JSON.stringify(['Projector', 'Audio System', 'AC', 'Internet']),
      additionalNotes: 'High-speed internet required for cloud GPU clusters.',
      status: 'APPROVED',
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  });

  // Pending Booking for Seminar Hall
  await prisma.booking.upsert({
    where: { bookingId: 'HB-2026-0003' },
    update: {},
    create: {
      bookingId: 'HB-2026-0003',
      userId: facultyUser.id,
      hallId: seminarHall.id,
      departmentId: departments['MBA'].id,
      eventName: 'Executive Leadership Colloquium 2026',
      description: 'Panel discussion by industry leaders from Fortune 500 companies.',
      purpose: 'Industry-Academia Conclave',
      requestedBy: 'Prof. Rajesh Sharma',
      coordinatorName: 'Prof. Rajesh Sharma (Dean MBA)',
      contactNumber: '+91 98765 33334',
      email: 'mba.dean@college.edu',
      bookingDate: formatYMD(d2),
      bookingType: 'MORNING',
      startTime: '09:00',
      endTime: '13:00',
      participantCount: 180,
      specialRequirements: JSON.stringify(['Projector', 'Microphone', 'AC', 'Recording']),
      additionalNotes: 'VIP parking arrangements requested.',
      status: 'PENDING',
    },
  });

  // Upcoming Approved Booking for Seminar Hall
  await prisma.booking.upsert({
    where: { bookingId: 'HB-2026-0004' },
    update: {},
    create: {
      bookingId: 'HB-2026-0004',
      userId: aimlFaculty.id,
      hallId: seminarHall.id,
      departmentId: departments['ECE'].id,
      eventName: 'International Symposium on VLSI & Embedded Systems',
      description: 'Keynote address by IEEE Fellows.',
      purpose: 'International Academic Conference',
      requestedBy: 'Dr. K. S. Rao',
      coordinatorName: 'Dr. K. S. Rao',
      contactNumber: '+91 98765 44445',
      email: 'ece.hod@college.edu',
      bookingDate: formatYMD(d4),
      bookingType: 'FULL_DAY',
      startTime: '09:00',
      endTime: '17:00',
      participantCount: 200,
      specialRequirements: JSON.stringify(['Projector', 'Microphone', 'Audio System', 'AC', 'Recording']),
      status: 'APPROVED',
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  });

  // 5. Blocked Dates (e.g. End Semester Exams)
  const blockStart = new Date(todayObj);
  blockStart.setDate(blockStart.getDate() + 12);
  const blockEnd = new Date(todayObj);
  blockEnd.setDate(blockEnd.getDate() + 14);

  await prisma.blockedDate.create({
    data: {
      hallId: null, // All halls
      startDate: formatYMD(blockStart),
      endDate: formatYMD(blockEnd),
      reason: 'EXAMINATION',
      description: 'Mid-term centralized university examinations. All halls reserved for paper evaluation and exam control.',
      createdById: admin.id,
    },
  });

  // 6. Maintenance (e.g. AV Hall acoustic upgrade)
  const maintStart = new Date(todayObj);
  maintStart.setDate(maintStart.getDate() + 6);
  const maintEnd = new Date(todayObj);
  maintEnd.setDate(maintEnd.getDate() + 7);

  await prisma.maintenance.create({
    data: {
      hallId: avHall.id,
      startDate: formatYMD(maintStart),
      endDate: formatYMD(maintEnd),
      reason: 'Audio-Visual Rigging & Projector Calibration',
      notes: 'Quarterly sound servicing, firmware upgrades, and lens alignment.',
      responsiblePerson: 'Mr. Arvind Gupta (Head AV Technician)',
    },
  });

  // 7. Institutional Holiday
  const holidayDate = new Date(todayObj);
  holidayDate.setDate(holidayDate.getDate() + 18);

  await prisma.holiday.create({
    data: {
      name: 'College Founder Day Celebration',
      date: formatYMD(holidayDate),
      description: 'Annual commemoration holiday across all campus departments.',
      hallScope: 'ALL',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
