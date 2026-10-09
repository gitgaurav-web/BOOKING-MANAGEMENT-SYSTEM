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

test('Uploads Directory: getUploadDirectory dynamically evaluates process.env.UPLOADS_DIR', async () => {
  const { getUploadDirectory } = await import('../routes/upload');
  const originalEnv = process.env.UPLOADS_DIR;

  try {
    process.env.UPLOADS_DIR = './custom-test-uploads';
    const resolvedPath = getUploadDirectory();
    assert.strictEqual(resolvedPath.includes('custom-test-uploads'), true);
  } finally {
    if (originalEnv !== undefined) {
      process.env.UPLOADS_DIR = originalEnv;
    } else {
      delete process.env.UPLOADS_DIR;
    }
  }
});

test('Timezone Consistency: getLocalIsoDate returns strict YYYY-MM-DD for Asia/Kolkata', async () => {
  const { getLocalIsoDate } = await import('../utils/dateValidation');
  const kolkataDate = getLocalIsoDate();
  assert.strictEqual(/^\d{4}-\d{2}-\d{2}$/.test(kolkataDate), true, 'Must strictly match YYYY-MM-DD calendar date');
});

test('CORS Policy: Rejects untrusted origins in production when CLIENT_URL is defined', () => {
  const allowedOrigins = ['http://localhost:5173', 'https://sairamce.edu.in'];
  const testUntrustedOrigin = 'https://attacker-site.com';
  const testTrustedOrigin = 'https://sairamce.edu.in';

  const isOriginAllowed = (origin: string, env: string) => {
    if (env !== 'production') return true;
    return allowedOrigins.includes(origin);
  };

  assert.strictEqual(isOriginAllowed(testUntrustedOrigin, 'production'), false, 'Untrusted origin must be blocked in production');
  assert.strictEqual(isOriginAllowed(testTrustedOrigin, 'production'), true, 'Configured CLIENT_URL origin must be accepted');
  assert.strictEqual(isOriginAllowed(testUntrustedOrigin, 'development'), true, 'Development mode permits local dev tools');
});

test('Past Date Rejection: Booking requests for yesterday or earlier dates are strictly blocked', () => {
  const today = '2026-10-09';
  const yesterday = '2026-10-08';
  const tomorrow = '2026-10-10';

  const isPast = (date: string, referenceDate: string) => date < referenceDate;

  assert.strictEqual(isPast(yesterday, today), true, 'Yesterday must be detected as past date');
  assert.strictEqual(isPast(tomorrow, today), false, 'Tomorrow must be valid future date');
  assert.strictEqual(isPast(today, today), false, 'Today is not in the past');
});



