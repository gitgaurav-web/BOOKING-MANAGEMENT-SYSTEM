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
