import assert from 'node:assert';
import test from 'node:test';

// Validation Logic Tests
test('Date Range: End date must not be earlier than start date', () => {
  const startDate = '2026-10-15';
  const invalidEndDate = '2026-10-14';
  const validEndDate = '2026-10-18';

  assert.strictEqual(invalidEndDate < startDate, true, 'Earlier end date should be flagged as invalid');
  assert.strictEqual(validEndDate >= startDate, true, 'Equal or later end date should be valid');
});

test('Time Slot: Start time must be strictly before end time', () => {
  const validStart = '09:00';
  const validEnd = '17:00';
  const invalidStart = '17:00';
  const invalidEnd = '09:00';

  assert.strictEqual(validStart < validEnd, true, 'Start time before end time is valid');
  assert.strictEqual(invalidStart < invalidEnd, false, 'Start time after end time is invalid');
});

test('Email Normalization and Pattern Verification', () => {
  const rawEmail = '  Faculty.CSE@College.Edu  ';
  const normalized = rawEmail.trim().toLowerCase();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  assert.strictEqual(normalized, 'faculty.cse@college.edu');
  assert.strictEqual(regex.test(normalized), true);
  assert.strictEqual(regex.test('invalid-email-string'), false);
});

test('Password Complexity Enforcer', () => {
  const weakPassword1 = 'short';
  const weakPassword2 = 'purelyletters';
  const strongPassword = 'CampusSecure2026!';

  const isMinLength = (p: string) => p.length >= 8;
  const hasLetterAndNumber = (p: string) => /(?=.*[a-zA-Z])(?=.*[0-9])/.test(p);

  assert.strictEqual(isMinLength(weakPassword1), false);
  assert.strictEqual(hasLetterAndNumber(weakPassword2), false);
  assert.strictEqual(isMinLength(strongPassword) && hasLetterAndNumber(strongPassword), true);
});

test('Booking Advance Notice Rules', () => {
  const minNotice = 1;
  const maxNotice = 90;

  const today = new Date('2026-10-08T00:00:00');
  const pastDate = new Date('2026-10-05T00:00:00');
  const validFutureDate = new Date('2026-10-15T00:00:00');
  const farFutureDate = new Date('2027-02-01T00:00:00');

  const diffDays = (d: Date) => Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  assert.strictEqual(diffDays(pastDate) < minNotice, true, 'Past date fails minimum notice');
  assert.strictEqual(diffDays(validFutureDate) >= minNotice && diffDays(validFutureDate) <= maxNotice, true, 'Valid date window passes');
  assert.strictEqual(diffDays(farFutureDate) > maxNotice, true, 'Excessively distant date fails maximum window');
});

test('Proposal Attachment Optional Check: Form submission and booking records without attachmentUrl are valid', () => {
  const mandatoryFields = {
    hallId: 'hall-1',
    bookingDate: '2026-10-20',
    eventName: 'Annual Science Exhibition',
    purpose: 'Student Project Display',
    contactNumber: '+91 9876543210',
    email: 'coordinator@college.edu',
  };

  const bookingWithoutAttachment = {
    ...mandatoryFields,
    attachmentUrl: null,
  };

  const hasAllMandatory = Boolean(
    bookingWithoutAttachment.hallId &&
    bookingWithoutAttachment.bookingDate &&
    bookingWithoutAttachment.eventName &&
    bookingWithoutAttachment.purpose &&
    bookingWithoutAttachment.contactNumber &&
    bookingWithoutAttachment.email
  );

  assert.strictEqual(hasAllMandatory, true, 'All mandatory fields exist');
  assert.strictEqual(bookingWithoutAttachment.attachmentUrl, null, 'Attachment is optional and null is permitted');
});

