import assert from 'node:assert';
import test from 'node:test';
import { prisma } from '../prisma';
import { isValidStrictIsoDate } from '../utils/dateValidation';

test('Strict Calendar Validation: Rejects impossible dates like 2026-02-31', () => {
  assert.strictEqual(isValidStrictIsoDate('2026-02-31'), false, '2026-02-31 must be rejected');
  assert.strictEqual(isValidStrictIsoDate('2026-04-31'), false, '2026-04-31 must be rejected');
  assert.strictEqual(isValidStrictIsoDate('2026-02-29'), false, 'Non-leap year 2026-02-29 must be rejected');
  assert.strictEqual(isValidStrictIsoDate('2024-02-29'), true, 'Leap year 2024-02-29 must be accepted');
  assert.strictEqual(isValidStrictIsoDate('2026-10-15'), true, 'Valid date must be accepted');
  assert.strictEqual(isValidStrictIsoDate('invalid-string'), false, 'Invalid string must be rejected');
});

test('Concurrent Booking Race Condition Protection against SQLite Database', async () => {
  const hall = await prisma.hall.findFirst();
  const user = await prisma.user.findFirst();

  if (!hall || !user) {
    console.log('Skipping DB concurrency test: database not seeded.');
    return;
  }

  const testDate = '2028-11-20';
  const startTime = '10:00';
  const endTime = '14:00';

  // Clean any leftovers from past runs
  await prisma.booking.deleteMany({ where: { bookingDate: testDate, hallId: hall.id } });

  // Function simulating atomic transaction
  async function attemptBooking(tag: string) {
    return prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          hallId: hall.id,
          status: 'APPROVED',
          bookingDate: testDate,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });

      if (conflict) {
        throw new Error(`CONFLICT: Hall already booked (${conflict.eventName})`);
      }

      return await tx.booking.create({
        data: {
          bookingId: `TEST-${tag}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          userId: user.id,
          hallId: hall.id,
          eventName: `Concurrent Test ${tag}`,
          purpose: 'Testing concurrency',
          bookingDate: testDate,
          bookingType: 'CUSTOM',
          startTime,
          endTime,
          participantCount: 50,
          requestedBy: user.name,
          contactNumber: '+91 9999999999',
          email: user.email,
          status: 'APPROVED',
        },
      });
    });
  }

  // Fire competing simultaneous booking requests
  const results = await Promise.allSettled([
    attemptBooking('REQ-A'),
    attemptBooking('REQ-B'),
  ]);

  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');

  assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent booking must succeed');
  assert.strictEqual(rejected.length, 1, 'Competing booking must be rejected with conflict');

  // Clean up test records
  await prisma.booking.deleteMany({ where: { bookingDate: testDate, hallId: hall.id } });
});
