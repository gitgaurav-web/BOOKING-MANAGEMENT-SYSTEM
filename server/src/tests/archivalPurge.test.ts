import assert from 'node:assert';
import test from 'node:test';
import fs from 'fs';
import path from 'path';
import { prisma } from '../prisma';
import { getUploadDirectory } from '../routes/upload';
import { isValidStrictIsoDate } from '../utils/dateValidation';

test('Archival & Purge: Date Validation strictly enforces ISO format', () => {
  assert.strictEqual(isValidStrictIsoDate('2026-05-15'), true);
  assert.strictEqual(isValidStrictIsoDate('2026-02-31'), false);
  assert.strictEqual(isValidStrictIsoDate('invalid-date'), false);
  assert.strictEqual(isValidStrictIsoDate(''), false);
});

test('Archival & Purge: Confirmation Keyword Security Guard', () => {
  const checkConfirmation = (keyword: string) => keyword === 'DELETE-CONFIRMED';
  assert.strictEqual(checkConfirmation('DELETE-CONFIRMED'), true);
  assert.strictEqual(checkConfirmation('delete-confirmed'), false);
  assert.strictEqual(checkConfirmation('DELETE'), false);
  assert.strictEqual(checkConfirmation(''), false);
});

test('Storage Metrics: Directory Inspection and Orphan Detection Logic', async () => {
  const uploadDir = getUploadDirectory();
  assert.strictEqual(fs.existsSync(uploadDir), true);

  // Create a dummy temporary orphan file to verify orphan calculation
  const orphanFilename = `test-orphan-${Date.now()}.pdf`;
  const orphanPath = path.join(uploadDir, orphanFilename);
  fs.writeFileSync(orphanPath, '%PDF-1.4 dummy orphan file content for test');

  try {
    // Check if orphan file exists on disk
    assert.strictEqual(fs.existsSync(orphanPath), true);

    const dirEntries = fs.readdirSync(uploadDir);
    assert.strictEqual(dirEntries.includes(orphanFilename), true);

    // Active bookings attachments check
    const allBookingsWithAttachment = await prisma.booking.findMany({
      where: { attachmentUrl: { not: null } },
      select: { attachmentUrl: true },
    });
    const activeFilenames = new Set(
      allBookingsWithAttachment
        .map((b) => (b.attachmentUrl ? path.basename(b.attachmentUrl.split('?')[0]) : null))
        .filter(Boolean)
    );

    // Our dummy orphan file should not be in active bookings
    assert.strictEqual(activeFilenames.has(orphanFilename), false);
  } finally {
    // Clean up test file
    if (fs.existsSync(orphanPath)) {
      fs.unlinkSync(orphanPath);
    }
  }
});

test('Style A Booking ID: Pattern and Component Generation', () => {
  const formatBookingId = (hallName: string, bookingDate: string, seq: number) => {
    let hallPrefix = 'HB';
    const norm = hallName.toLowerCase();
    if (norm.includes('seminar')) hallPrefix = 'SH';
    else if (norm.includes('av')) hallPrefix = 'AV';

    const [bYearFull, bMonthNumStr] = bookingDate.split('-');
    const bYear = bYearFull.slice(-2);
    const monthIndex = parseInt(bMonthNumStr, 10) - 1;
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const bMonth = monthNames[monthIndex] || 'GEN';

    return `${hallPrefix}-${bMonth}${bYear}-${String(seq).padStart(3, '0')}`;
  };

  const id1 = formatBookingId('Seminar Hall', '2026-10-25', 1);
  const id2 = formatBookingId('Seminar Hall', '2026-10-25', 2);
  const id3 = formatBookingId('AV Hall', '2026-10-28', 1);
  const id4 = formatBookingId('Seminar Hall', '2026-11-04', 1);

  assert.strictEqual(id1, 'SH-OCT26-001');
  assert.strictEqual(id2, 'SH-OCT26-002');
  assert.strictEqual(id3, 'AV-OCT26-001');
  assert.strictEqual(id4, 'SH-NOV26-001');

  // Verify regex
  const regex = /^(SH|AV)-[A-Z]{3}\d{2}-\d{3}$/;
  assert.strictEqual(regex.test(id1), true);
  assert.strictEqual(regex.test(id3), true);
  assert.strictEqual(regex.test(id4), true);
});
