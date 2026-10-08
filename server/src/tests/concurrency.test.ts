import assert from 'node:assert';
import test from 'node:test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { app } from '../index';
import { checkBookingConflict } from '../routes/bookings';
import { isValidStrictIsoDate, isValidStrictTime } from '../utils/dateValidation';
import { escapeHtml } from '../utils/emailService';
import { getJwtSecret } from '../utils/jwt';

// Helper for dynamic future test dates with zero CI/dev collision
function getDynamicFutureDate(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toISOString().split('T')[0];
}

test('Strict Calendar Validation: Rejects impossible dates like 2026-02-31', () => {
  assert.strictEqual(isValidStrictIsoDate('2026-02-31'), false, '2026-02-31 must be rejected');
  assert.strictEqual(isValidStrictIsoDate('2026-04-31'), false, '2026-04-31 must be rejected');
  assert.strictEqual(isValidStrictIsoDate('2026-02-29'), false, 'Non-leap year 2026-02-29 must be rejected');
  assert.strictEqual(isValidStrictIsoDate('2024-02-29'), true, 'Leap year 2024-02-29 must be accepted');
  assert.strictEqual(isValidStrictIsoDate('2026-10-15'), true, 'Valid date must be accepted');
  assert.strictEqual(isValidStrictIsoDate('invalid-string'), false, 'Invalid string must be rejected');
});

test('Email HTML Escaping: Sanitizes user strings to prevent markup/XSS injection', () => {
  const malicious = '<script>alert("XSS")</script>&\'hello"';
  const clean = escapeHtml(malicious);
  assert.strictEqual(
    clean,
    '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;&amp;&#39;hello&quot;',
    'Must encode <, >, &, ", and \''
  );
  assert.strictEqual(escapeHtml(null), '');
  assert.strictEqual(escapeHtml(undefined), '');
});

test('Production Conflict Checker Function: Verifies direct slot and time collisions', async () => {
  const hall = await prisma.hall.findFirst();
  const user = await prisma.user.findFirst();

  if (!hall || !user) {
    console.log('Skipping conflict checker test: database not seeded.');
    return;
  }

  const testDate = getDynamicFutureDate(700);

  // Clean any previous test bookings
  await prisma.booking.deleteMany({ where: { bookingDate: testDate, hallId: hall.id } });

  // Create an approved morning booking (09:00 - 13:00)
  const baseBooking = await prisma.booking.create({
    data: {
      bookingId: `TEST-BASE-${Date.now()}`,
      userId: user.id,
      hallId: hall.id,
      eventName: 'Base Morning Session',
      purpose: 'Testing production conflict detection',
      bookingDate: testDate,
      bookingType: 'MORNING',
      startTime: '09:00',
      endTime: '13:00',
      participantCount: 50,
      requestedBy: user.name,
      contactNumber: '+91 9999999999',
      email: user.email,
      status: 'APPROVED',
    },
  });

  try {
    // 1. Same-slot conflict: requesting 10:00 - 12:00 must conflict
    const conflictResult = await checkBookingConflict(
      prisma,
      hall.id,
      testDate,
      testDate,
      '10:00',
      '12:00'
    );
    assert.strictEqual(conflictResult.hasConflict, true, 'Production checker must flag overlapping morning time');
    assert.match(conflictResult.reason, /Time conflict with existing booking/);

    // 2. Non-overlapping afternoon slot: requesting 14:00 - 18:00 must be ALLOWED
    const afternoonResult = await checkBookingConflict(
      prisma,
      hall.id,
      testDate,
      testDate,
      '14:00',
      '18:00'
    );
    assert.strictEqual(afternoonResult.hasConflict, false, 'Production checker must permit free afternoon slot');

    // 3. Multi-day / Full day overlap: requesting full day must conflict
    const fullDayResult = await checkBookingConflict(
      prisma,
      hall.id,
      testDate,
      testDate,
      '09:00',
      '17:00'
    );
    assert.strictEqual(fullDayResult.hasConflict, true, 'Production checker must flag full day collision');
  } finally {
    await prisma.booking.delete({ where: { id: baseBooking.id } });
  }
});

test('Live Express API: Concurrent POST /api/bookings against real production endpoint', async () => {
  const hall = await prisma.hall.findFirst();
  const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } }) || await prisma.user.findFirst();

  if (!hall || !user) {
    console.log('Skipping live HTTP concurrency test: database not seeded.');
    return;
  }

  // Generate authentic JWT token for test user
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    getJwtSecret(),
    { expiresIn: '1h' }
  );

  // Spin up ephemeral test server on random free OS port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const testDate = getDynamicFutureDate(720);

  // Clean leftovers
  await prisma.booking.deleteMany({ where: { bookingDate: testDate, hallId: hall.id } });

  const payload = {
    hallId: hall.id,
    eventName: 'Live Concurrent Colloquium',
    purpose: 'Evaluating concurrency race resilience on production route',
    bookingDate: testDate,
    bookingType: 'MORNING',
    startTime: '09:00',
    endTime: '13:00',
    participantCount: 80,
    requestedBy: user.name,
    coordinatorName: user.name,
    contactNumber: '+91 9999999999',
    email: user.email,
  };

  try {
    // Dispatch simultaneous requests to the actual production /api/bookings route
    const [res1, res2] = await Promise.all([
      fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }),
      fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }),
    ]);

    const statuses = [res1.status, res2.status].sort();

    // Verify: One must succeed (201) and one must be rejected with 409 Conflict
    assert.deepStrictEqual(statuses, [201, 409], 'Live API must grant 201 to winner and 409 Conflict to concurrent loser');

    // Verify DB count
    const saved = await prisma.booking.findMany({
      where: { bookingDate: testDate, hallId: hall.id },
    });
    assert.strictEqual(saved.length, 1, 'Exactly one booking record must persist in database');
  } finally {
    await prisma.booking.deleteMany({ where: { bookingDate: testDate, hallId: hall.id } });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Live Express API: Multi-Day Overlap Query in Availability Calendar', async () => {
  const hall = await prisma.hall.findFirst();
  const user = await prisma.user.findFirst();

  if (!hall || !user) return;

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  // Booking starts at Day 730, ends at Day 735
  const bookingStart = getDynamicFutureDate(730);
  const bookingEnd = getDynamicFutureDate(735);

  // User queries a subrange starting on Day 732 (after bookingStart)
  const queryStart = getDynamicFutureDate(732);
  const queryEnd = getDynamicFutureDate(734);

  const testBooking = await prisma.booking.create({
    data: {
      bookingId: `TEST-MULTIDAY-${Date.now()}`,
      userId: user.id,
      hallId: hall.id,
      eventName: 'Multi-Day Academic Conference',
      purpose: 'Testing cross-boundary calendar query overlap',
      bookingDate: bookingStart,
      endDate: bookingEnd,
      bookingType: 'FULL_DAY',
      startTime: '09:00',
      endTime: '17:00',
      participantCount: 120,
      requestedBy: user.name,
      contactNumber: '+91 9999999999',
      email: user.email,
      status: 'APPROVED',
    },
  });

  try {
    const res = await fetch(`${baseUrl}/api/availability?startDate=${queryStart}&endDate=${queryEnd}&hallId=${hall.id}`);
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as any;

    // Day 732 must be marked as BOOKED because of the overlapping multi-day booking
    const dayInfo = data.availability[queryStart]?.[hall.id];
    assert.ok(dayInfo, 'Day within requested range must exist in availability map');
    assert.strictEqual(dayInfo.status, 'BOOKED', 'Multi-day booking starting prior to rangeStart must mark day BOOKED');
  } finally {
    await prisma.booking.delete({ where: { id: testBooking.id } });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Live Express API: Document Upload Ownership Authorization Protection', async () => {
  const userA = await prisma.user.findFirst({ where: { role: 'FACULTY' } }) || await prisma.user.findFirst();
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } }) || await prisma.user.findFirst();
  const hall = await prisma.hall.findFirst();

  if (!userA || !admin || !hall) return;

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  // Create a dummy physical file in uploads
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const testFileName = `test-doc-${Date.now()}.pdf`;
  const testFilePath = path.join(uploadDir, testFileName);
  fs.writeFileSync(testFilePath, 'DUMMY PDF CONTENT FOR TEST');

  // Create booking owned by userA
  const testBooking = await prisma.booking.create({
    data: {
      bookingId: `TEST-DOC-${Date.now()}`,
      userId: userA.id,
      hallId: hall.id,
      eventName: 'Confidential Event',
      purpose: 'Testing document authorization protection',
      bookingDate: getDynamicFutureDate(740),
      bookingType: 'MORNING',
      startTime: '09:00',
      endTime: '13:00',
      participantCount: 30,
      requestedBy: userA.name,
      contactNumber: '+91 9999999999',
      email: userA.email,
      attachmentUrl: `/uploads/${testFileName}`,
      status: 'APPROVED',
    },
  });

  const tokenUserA = jwt.sign(
    { id: userA.id, email: userA.email, role: userA.role, name: userA.name },
    getJwtSecret(),
    { expiresIn: '1h' }
  );

  const tokenUserB = jwt.sign(
    { id: 'another-user-999', email: 'other@campus.edu', role: 'FACULTY', name: 'Other User' },
    getJwtSecret(),
    { expiresIn: '1h' }
  );

  const tokenAdmin = jwt.sign(
    { id: admin.id, email: admin.email, role: 'ADMIN', name: admin.name },
    getJwtSecret(),
    { expiresIn: '1h' }
  );

  try {
    // 1. Anonymous request receives 401
    const resAnon = await fetch(`${baseUrl}/uploads/${testFileName}`);
    assert.strictEqual(resAnon.status, 401, 'Anonymous request must be rejected with 401');

    // 2. Unrelated User B receives 403 Forbidden
    const resUserB = await fetch(`${baseUrl}/uploads/${testFileName}`, {
      headers: { Authorization: `Bearer ${tokenUserB}` },
    });
    assert.strictEqual(resUserB.status, 403, 'Unrelated user must be rejected with 403 Forbidden');

    // 3. Document Owner User A receives 200 OK
    const resUserA = await fetch(`${baseUrl}/uploads/${testFileName}`, {
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    assert.strictEqual(resUserA.status, 200, 'Owner user must be permitted to download own document');

    // 4. Admin receives 200 OK
    const resAdmin = await fetch(`${baseUrl}/uploads/${testFileName}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.strictEqual(resAdmin.status, 200, 'Admin must be permitted to view any permission document');
  } finally {
    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
    await prisma.booking.delete({ where: { id: testBooking.id } });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Live Express API: Settings Endpoint Allowlisting and Relational Validation', async () => {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } }) || await prisma.user.findFirst();
  if (!admin) return;

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const adminToken = jwt.sign(
    { id: admin.id, email: admin.email, role: 'ADMIN', name: admin.name },
    getJwtSecret(),
    { expiresIn: '1h' }
  );

  try {
    // 1. Rejects unknown arbitrary keys
    const resUnknown = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ unknownHackedKey: 'exploit' }),
    });
    assert.strictEqual(resUnknown.status, 400, 'Unknown setting key must return 400 Bad Request');

    // 2. Rejects minAdvanceNotice > maxAdvanceNotice
    const resInvalidRelation = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ minAdvanceNoticeDays: '30', maxAdvanceNoticeDays: '10' }),
    });
    assert.strictEqual(resInvalidRelation.status, 400, 'minNotice > maxNotice must return 400 Bad Request');

    // 3. Accepts valid keys
    const resValid = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ minAdvanceNoticeDays: '2', maxAdvanceNoticeDays: '60' }),
    });
    assert.strictEqual(resValid.status, 200, 'Valid settings update must return 200 OK');

    // 4. Rejects non-digits like '2abc'
    const resNonDigit = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ minAdvanceNoticeDays: '2abc' }),
    });
    assert.strictEqual(resNonDigit.status, 400, 'minNotice with non-digits must return 400');

    // 5. Rejects invalid booleans like 'not-a-bool'
    const resInvalidBool = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ allowWeekendBookings: 'maybe' }),
    });
    assert.strictEqual(resInvalidBool.status, 400, 'Invalid boolean must return 400');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Search Privacy: Booking search never leaks other users pending bookings to regular users', async () => {
  const users = await prisma.user.findMany({ take: 2 });
  if (users.length < 2) return;
  const [userA, userB] = users;

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const tokenUserB = jwt.sign(
    { id: userB.id, email: userB.email, role: 'FACULTY', name: userB.name },
    getJwtSecret(),
    { expiresIn: '1h' }
  );

  const hall = await prisma.hall.findFirst();
  if (!hall) return;

  const secretKeyword = `SECRET_KEYWORD_${Date.now()}`;
  const pendingBookingA = await prisma.booking.create({
    data: {
      bookingId: `BK-TEST-PRIV-${Date.now()}`,
      userId: userA.id,
      hallId: hall.id,
      eventName: `Confidential Meeting ${secretKeyword}`,
      purpose: 'Faculty Discussion',
      bookingDate: getDynamicFutureDate(30),
      bookingType: 'MORNING',
      startTime: '09:00',
      endTime: '12:00',
      participantCount: 10,
      requestedBy: userA.name,
      contactNumber: '9876543210',
      email: userA.email,
      status: 'PENDING',
    },
  });

  try {
    // User B searches for User A's secret pending keyword
    const res = await fetch(`${baseUrl}/api/bookings?search=${encodeURIComponent(secretKeyword)}`, {
      headers: { Authorization: `Bearer ${tokenUserB}` },
    });
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as any[];
    const leaked = Array.isArray(data) && data.some((b) => b.id === pendingBookingA.id);
    assert.strictEqual(leaked, false, 'User B must not see User A pending booking even with search match');
  } finally {
    await prisma.booking.delete({ where: { id: pendingBookingA.id } });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Upload Authorization: Unattached files are restricted to uploader or admin', async () => {
  const users = await prisma.user.findMany({ take: 2 });
  if (users.length < 2) return;
  const [userA, userB] = users;

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const tokenUserB = jwt.sign(
    { id: userB.id, email: userB.email, role: 'FACULTY', name: userB.name },
    getJwtSecret(),
    { expiresIn: '1h' }
  );
  const tokenUserA = jwt.sign(
    { id: userA.id, email: userA.email, role: 'FACULTY', name: userA.name },
    getJwtSecret(),
    { expiresIn: '1h' }
  );

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const unattachedFile = `u-${userA.id}-${Date.now()}-abc.pdf`;
  const unattachedPath = path.join(uploadsDir, unattachedFile);
  fs.writeFileSync(unattachedPath, 'unattached permission note');

  try {
    // User B tries to download User A's unattached file -> 403 Forbidden
    const resB = await fetch(`${baseUrl}/uploads/${unattachedFile}`, {
      headers: { Authorization: `Bearer ${tokenUserB}` },
    });
    assert.strictEqual(resB.status, 403, 'User B must get 403 for User A unattached file');

    // User A downloads own unattached file -> 200 OK
    const resA = await fetch(`${baseUrl}/uploads/${unattachedFile}`, {
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    assert.strictEqual(resA.status, 200, 'User A must get 200 for own unattached file');
  } finally {
    if (fs.existsSync(unattachedPath)) fs.unlinkSync(unattachedPath);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('JWT Security: Rejects secrets shorter than 32 characters or known placeholders in production', () => {
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.JWT_SECRET;
  try {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'short_secret';
    assert.throws(() => getJwtSecret(), /FATAL: JWT_SECRET must be at least 32 characters in production/);

    // Known placeholder from .env.example
    process.env.JWT_SECRET = 'replace_with_your_generated_64_character_hex_secret_key_here';
    assert.throws(() => getJwtSecret(), /FATAL: Insecure JWT_SECRET detected/);

    // Development default
    process.env.JWT_SECRET = 'dev_campus_halls_jwt_secret_key_2026_secured';
    assert.throws(() => getJwtSecret(), /FATAL: Insecure JWT_SECRET detected/);

    process.env.JWT_SECRET = 'a_very_secure_long_secret_key_exceeding_32_characters';
    assert.strictEqual(getJwtSecret(), 'a_very_secure_long_secret_key_exceeding_32_characters');
  } finally {
    process.env.NODE_ENV = prevEnv;
    process.env.JWT_SECRET = prevSecret;
  }
});

test('Clock Time Validation: Enforces strict 24-hour HH:mm (hours 00-23, minutes 00-59)', () => {
  assert.strictEqual(isValidStrictTime('29:90'), false, '29:90 must be rejected');
  assert.strictEqual(isValidStrictTime('12:65'), false, '12:65 must be rejected');
  assert.strictEqual(isValidStrictTime('24:00'), false, '24:00 must be rejected');
  assert.strictEqual(isValidStrictTime('09:60'), false, '09:60 must be rejected');
  assert.strictEqual(isValidStrictTime('09:30'), true, '09:30 must be accepted');
  assert.strictEqual(isValidStrictTime('23:59'), true, '23:59 must be accepted');
  assert.strictEqual(isValidStrictTime('00:00'), true, '00:00 must be accepted');
  assert.strictEqual(isValidStrictTime('invalid'), false, 'invalid string must be rejected');
});

test('Public Upcoming Events API: Accessible without login and returns only approved bookings', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const res = await fetch(`${baseUrl}/api/bookings/upcoming`);
    assert.strictEqual(res.status, 200, 'Public upcoming endpoint must return 200 without Authorization');
    const data = (await res.json()) as any[];
    assert.strictEqual(Array.isArray(data), true, 'Response must be an array');
    for (const item of data) {
      assert.strictEqual(item.status, 'APPROVED', 'All items from /upcoming must have status APPROVED');
      assert.strictEqual(item.email, undefined, 'Private contact emails must be omitted');
      assert.strictEqual(item.contactNumber, undefined, 'Private phone numbers must be omitted');
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Public Upcoming Events Privacy Modes: Sanitizes event titles based on setting', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Set display policy to DEPARTMENT_EVENT
    await prisma.systemSetting.upsert({
      where: { key: 'publicUpcomingDisplay' },
      update: { value: 'DEPARTMENT_EVENT' },
      create: { key: 'publicUpcomingDisplay', value: 'DEPARTMENT_EVENT' },
    });

    const resDept = await fetch(`${baseUrl}/api/bookings/upcoming`);
    const dataDept = (await resDept.json()) as any[];
    if (dataDept.length > 0) {
      assert.match(dataDept[0].eventName, /Academic Event/, 'Should mask event title with Academic Event suffix');
    }

    // 2. Set display policy to RESERVED_SLOT
    await prisma.systemSetting.upsert({
      where: { key: 'publicUpcomingDisplay' },
      update: { value: 'RESERVED_SLOT' },
      create: { key: 'publicUpcomingDisplay', value: 'RESERVED_SLOT' },
    });

    const resSlot = await fetch(`${baseUrl}/api/bookings/upcoming`);
    const dataSlot = (await resSlot.json()) as any[];
    if (dataSlot.length > 0) {
      assert.strictEqual(dataSlot[0].eventName, 'Reserved Academic Session');
      assert.strictEqual(dataSlot[0].bookingId, 'RESERVED', 'Booking ID must be masked in RESERVED_SLOT mode');
      assert.strictEqual(dataSlot[0].department, null, 'Department must be null in RESERVED_SLOT mode');
    }
  } finally {
    // Restore default
    await prisma.systemSetting.upsert({
      where: { key: 'publicUpcomingDisplay' },
      update: { value: 'EVENT_TITLE' },
      create: { key: 'publicUpcomingDisplay', value: 'EVENT_TITLE' },
    });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Multi-Day Booking: Ongoing bookings spanning today are included in public upcoming events', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const hall = await prisma.hall.findFirst();
  const user = await prisma.user.findFirst();
  if (!hall || !user) return;

  const yesterday = getDynamicFutureDate(-1);
  const tomorrow = getDynamicFutureDate(2);

  const ongoingBooking = await prisma.booking.create({
    data: {
      bookingId: `BK-TEST-MULTI-${Date.now()}`,
      userId: user.id,
      hallId: hall.id,
      eventName: 'Live Multiday Colloquium Overlap',
      purpose: 'Ongoing Academic Event',
      bookingDate: yesterday,
      endDate: tomorrow,
      bookingType: 'FULL_DAY',
      startTime: '09:00',
      endTime: '17:00',
      participantCount: 50,
      requestedBy: 'Test Coordinator',
      contactNumber: '9876543210',
      email: 'test@college.edu',
      status: 'APPROVED',
    },
  });

  try {
    const res = await fetch(`${baseUrl}/api/bookings/upcoming`);
    const list = (await res.json()) as any[];
    const found = list.some((b) => b.id === ongoingBooking.id);
    assert.strictEqual(found, true, 'Ongoing booking starting yesterday and ending tomorrow must be included');
  } finally {
    await prisma.booking.delete({ where: { id: ongoingBooking.id } });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Registration Security: Faculty affiliation requests start as INACTIVE pending admin verification', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const dept = await prisma.department.findFirst();
  if (!dept) return;

  const testEmail = `pending.faculty.${Date.now()}@example.com`;
  let registeredUserId: string | null = null;

  try {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Prospective Faculty Applicant',
        email: testEmail,
        password: 'Password123!',
        departmentId: dept.id,
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = (await res.json()) as any;
    assert.strictEqual(data.user.status, 'INACTIVE', 'Faculty affiliation registrations must require admin activation');
    registeredUserId = data.user.id;
  } finally {
    if (registeredUserId) {
      await prisma.user.delete({ where: { id: registeredUserId } });
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
