import assert from 'node:assert';
import test from 'node:test';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { app } from '../index';
import { checkBookingConflict } from '../routes/bookings';
import { isValidStrictIsoDate } from '../utils/dateValidation';
import { getJwtSecret } from '../utils/jwt';

test('Strict Calendar Validation: Rejects impossible dates like 2026-02-31', () => {
  assert.strictEqual(isValidStrictIsoDate('2026-02-31'), false, '2026-02-31 must be rejected');
  assert.strictEqual(isValidStrictIsoDate('2026-04-31'), false, '2026-04-31 must be rejected');
  assert.strictEqual(isValidStrictIsoDate('2026-02-29'), false, 'Non-leap year 2026-02-29 must be rejected');
  assert.strictEqual(isValidStrictIsoDate('2024-02-29'), true, 'Leap year 2024-02-29 must be accepted');
  assert.strictEqual(isValidStrictIsoDate('2026-10-15'), true, 'Valid date must be accepted');
  assert.strictEqual(isValidStrictIsoDate('invalid-string'), false, 'Invalid string must be rejected');
});

test('Production Conflict Checker Function: Verifies direct slot and time collisions', async () => {
  const hall = await prisma.hall.findFirst();
  const user = await prisma.user.findFirst();

  if (!hall || !user) {
    console.log('Skipping conflict checker test: database not seeded.');
    return;
  }

  const testDate = '2028-12-10';

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

  const testDate = '2028-12-15';

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

test('Live Express API: Availability date range validation and security gates', async () => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Invalid date (rollover date)
    const resInvalid = await fetch(`${baseUrl}/api/availability?startDate=2026-02-31`);
    assert.strictEqual(resInvalid.status, 400, 'Rollover date in availability must return 400');

    // 2. Huge date range (> 180 days)
    const resLarge = await fetch(`${baseUrl}/api/availability?startDate=2026-01-01&endDate=2026-12-31`);
    assert.strictEqual(resLarge.status, 400, 'Range > 180 days in availability must return 400');

    // 3. Reversed date range
    const resReversed = await fetch(`${baseUrl}/api/availability?startDate=2026-10-01&endDate=2026-09-01`);
    assert.strictEqual(resReversed.status, 400, 'Reversed dates in availability must return 400');

    // 4. Protected uploads access without authentication
    const resUploadAnon = await fetch(`${baseUrl}/uploads/sensitive_letter.pdf`);
    assert.strictEqual(resUploadAnon.status, 401, 'Anonymous request to /uploads must return 401');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
