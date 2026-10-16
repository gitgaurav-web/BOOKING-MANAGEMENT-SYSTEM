import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedExamples() {
  const admin = await prisma.user.findFirst({ where: { email: 'iqac@sairamce.edu.in' } });
  if (!admin) {
    console.log('Super Admin not found!');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const facultyPasswordHash = await bcrypt.hash('faculty123', salt);

  // Departments
  const cseDept = await prisma.department.findFirst({ where: { code: 'CSE' } });
  const aimlDept = await prisma.department.findFirst({ where: { code: 'AIML' } });
  const eceDept = await prisma.department.findFirst({ where: { code: 'ECE' } });
  const shDept = await prisma.department.findFirst({ where: { code: 'S&H ' } });

  // Faculty Users
  const faculty1 = await prisma.user.upsert({
    where: { email: 'hod.cse@sairamce.edu.in' },
    update: { name: 'Dr. C. Valarmathi', departmentId: cseDept ? cseDept.id : null, status: 'ACTIVE', role: 'FACULTY' },
    create: {
      name: 'Dr. C. Valarmathi',
      email: 'hod.cse@sairamce.edu.in',
      passwordHash: facultyPasswordHash,
      phone: '+91 98451 22334',
      departmentId: cseDept ? cseDept.id : null,
      role: 'FACULTY',
      status: 'ACTIVE',
    },
  });

  const faculty2 = await prisma.user.upsert({
    where: { email: 'faculty.ece@sairamce.edu.in' },
    update: { name: 'Prof. R. Anand', departmentId: eceDept ? eceDept.id : null, status: 'ACTIVE', role: 'FACULTY' },
    create: {
      name: 'Prof. R. Anand',
      email: 'faculty.ece@sairamce.edu.in',
      passwordHash: facultyPasswordHash,
      phone: '+91 97412 88765',
      departmentId: eceDept ? eceDept.id : null,
      role: 'FACULTY',
      status: 'ACTIVE',
    },
  });

  const faculty3 = await prisma.user.upsert({
    where: { email: 'aiml.hod@sairamce.edu.in' },
    update: { name: 'Dr. Ananya Sen', departmentId: aimlDept ? aimlDept.id : null, status: 'ACTIVE', role: 'FACULTY' },
    create: {
      name: 'Dr. Ananya Sen',
      email: 'aiml.hod@sairamce.edu.in',
      passwordHash: facultyPasswordHash,
      phone: '+91 94481 33456',
      departmentId: aimlDept ? aimlDept.id : null,
      role: 'FACULTY',
      status: 'ACTIVE',
    },
  });

  // Halls
  const seminarHall = await prisma.hall.findFirst({ where: { code: 'SEMINAR-HALL-01' } });
  const avHall = await prisma.hall.findFirst({ where: { code: 'AV-HALL-01' } });

  if (!seminarHall || !avHall) {
    console.log('Halls not found!');
    return;
  }

  // 1. Approved Bookings (Booking Management & Calendar Desk)
  await prisma.booking.upsert({
    where: { bookingId: 'HB-2026-0001' },
    update: { status: 'APPROVED' },
    create: {
      bookingId: 'HB-2026-0001',
      userId: faculty1.id,
      hallId: seminarHall.id,
      departmentId: cseDept ? cseDept.id : null,
      eventName: 'National Conference on Innovations in Computer Science (NCICS 2026)',
      description: 'National conference featuring paper presentations by research scholars and keynotes by industry experts.',
      purpose: 'Academic National Conference',
      requestedBy: 'Dr. C. Valarmathi',
      coordinatorName: 'Dr. C. Valarmathi (HOD CSE)',
      contactNumber: '+91 98451 22334',
      email: 'hod.cse@sairamce.edu.in',
      bookingDate: '2026-10-18',
      bookingType: 'FULL_DAY',
      startTime: '09:00',
      endTime: '17:00',
      participantCount: 250,
      specialRequirements: JSON.stringify(['Central AC', 'Ceiling Projector', 'Podium Wireless Mic', 'Stage Audio System', 'Live Recording']),
      additionalNotes: 'Require audio sound check at 8:30 AM before inauguration.',
      status: 'APPROVED',
      approvedById: admin.id,
      approvedAt: new Date('2026-10-14T10:00:00Z'),
    },
  });

  await prisma.booking.upsert({
    where: { bookingId: 'HB-2026-0002' },
    update: { status: 'APPROVED' },
    create: {
      bookingId: 'HB-2026-0002',
      userId: faculty2.id,
      hallId: avHall.id,
      departmentId: eceDept ? eceDept.id : null,
      eventName: 'Campus Placement Orientation & Technical Aptitude Drive',
      description: 'Orientation on upcoming Tier-1 campus recruitments and mock technical tests for final year students.',
      purpose: 'Training & Career Guidance',
      requestedBy: 'Prof. R. Anand',
      coordinatorName: 'Prof. R. Anand (Placement Officer)',
      contactNumber: '+91 97412 88765',
      email: 'faculty.ece@sairamce.edu.in',
      bookingDate: '2026-10-19',
      bookingType: 'FULL_DAY',
      startTime: '09:30',
      endTime: '16:30',
      participantCount: 120,
      specialRequirements: JSON.stringify(['Interactive Touch Smartboards', 'AC', '1Gbps Wi-Fi']),
      additionalNotes: 'Requires high-bandwidth Wi-Fi for online test simulation.',
      status: 'APPROVED',
      approvedById: admin.id,
      approvedAt: new Date('2026-10-15T11:30:00Z'),
    },
  });

  // 2. Pending Requests (Pending Requests Desk)
  await prisma.booking.upsert({
    where: { bookingId: 'HB-2026-0003' },
    update: { status: 'PENDING' },
    create: {
      bookingId: 'HB-2026-0003',
      userId: faculty3.id,
      hallId: seminarHall.id,
      departmentId: aimlDept ? aimlDept.id : null,
      eventName: 'AICTE Sponsored Faculty Development Program on GenAI & LLMs',
      description: 'One-day interactive workshop conducted by industry leaders from IBM and Intel for faculty members.',
      purpose: 'Faculty & Student Skill Enhancement',
      requestedBy: 'Dr. Ananya Sen',
      coordinatorName: 'Dr. Ananya Sen (AIML HOD)',
      contactNumber: '+91 94481 33456',
      email: 'aiml.hod@sairamce.edu.in',
      bookingDate: '2026-10-25',
      bookingType: 'FULL_DAY',
      startTime: '09:00',
      endTime: '16:00',
      participantCount: 160,
      guestCount: 3,
      mementoCount: 3,
      specialRequirements: JSON.stringify(['Ceiling Projector', 'Wireless Mics', 'AC', 'High Speed Wi-Fi', 'Recording']),
      additionalNotes: '3 VIP dignitary guest speakers attending. VIP front-row seating and dais arrangement needed.',
      status: 'PENDING',
    },
  });

  await prisma.booking.upsert({
    where: { bookingId: 'HB-2026-0004' },
    update: { status: 'PENDING' },
    create: {
      bookingId: 'HB-2026-0004',
      userId: faculty1.id,
      hallId: avHall.id,
      departmentId: cseDept ? cseDept.id : null,
      eventName: 'Hands-on Workshop on Cyber Security & Ethical Hacking',
      description: 'Hands-on practical session covering live vulnerability scanning and defensive security architectures.',
      purpose: 'Technical Student Workshop',
      requestedBy: 'Dr. C. Valarmathi',
      coordinatorName: 'Prof. Vignesh K.',
      contactNumber: '+91 98860 11223',
      email: 'hod.cse@sairamce.edu.in',
      bookingDate: '2026-10-26',
      bookingType: 'AFTERNOON',
      startTime: '13:30',
      endTime: '17:00',
      participantCount: 80,
      specialRequirements: JSON.stringify(['Interactive Touch Smartboards', '1Gbps Wi-Fi', 'AC']),
      status: 'PENDING',
    },
  });

  // 3. Past Completed Booking
  await prisma.booking.upsert({
    where: { bookingId: 'HB-2026-0005' },
    update: { status: 'APPROVED' },
    create: {
      bookingId: 'HB-2026-0005',
      userId: faculty1.id,
      hallId: seminarHall.id,
      departmentId: shDept ? shDept.id : null,
      eventName: 'Orientation Program for First Year B.E. Students 2026',
      description: 'Inaugural orientation for newly admitted first-year engineering students and their parents.',
      purpose: 'Student Induction Program',
      requestedBy: 'Dr. C. Valarmathi',
      coordinatorName: 'Dean Academics',
      contactNumber: '+91 98451 22334',
      email: 'hod.cse@sairamce.edu.in',
      bookingDate: '2026-10-10',
      bookingType: 'FULL_DAY',
      startTime: '09:30',
      endTime: '13:30',
      participantCount: 320,
      specialRequirements: JSON.stringify(['Central AC', 'Ceiling Projector', 'Stage Audio System']),
      status: 'APPROVED',
      approvedById: admin.id,
      approvedAt: new Date('2026-10-08T09:00:00Z'),
    },
  });

  // 4. Blocked Dates (All Halls blocked for VTU exams)
  const existingExamBlock = await prisma.blockedDate.findFirst({
    where: { reason: 'EXAMINATION', startDate: '2026-10-28' },
  });
  if (!existingExamBlock) {
    await prisma.blockedDate.create({
      data: {
        hallId: null, // All halls blocked
        startDate: '2026-10-28',
        endDate: '2026-10-30',
        reason: 'EXAMINATION',
        description: 'VTU Centralized Mid-Term Theory Examinations & Paper Custody Camp. All halls reserved for paper evaluation and exam control.',
        createdById: admin.id,
      },
    });
  }

  // 5. Holidays
  const existingRajyotsava = await prisma.holiday.findFirst({
    where: { date: '2026-11-01' },
  });
  if (!existingRajyotsava) {
    await prisma.holiday.create({
      data: {
        name: 'Kannada Rajyotsava',
        date: '2026-11-01',
        description: 'Karnataka State Formation Day. Gazetted Institutional Holiday.',
        hallScope: 'ALL',
      },
    });
  }

  console.log('Seeded successfully with realistic college examples!');
}

seedExamples()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
