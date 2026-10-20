import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

export interface BookingPdfData {
  bookingId: string;
  eventName: string;
  hallName: string;
  hallLocation?: string;
  departmentName?: string;
  bookingDate: string;
  endDate?: string | null;
  startTime: string;
  endTime: string;
  bookingType: string;
  status: string;
  coordinatorName: string;
  contactNumber: string;
  email: string;
  participantCount?: number;
  guestCount?: number;
  mementoCount?: number;
  purpose?: string;
  description?: string;
  specialRequirements?: string | string[];
  adminNotes?: string;
  rejectionReason?: string;
}

// Convert 24h time '13:30' -> '01:30 PM'
function formatTimeTo12Hour(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24;
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

// Format '2026-10-26' -> 'Mon, 26 Oct 2026'
function formatDateReadable(isoDate: string): string {
  if (!isoDate || !isoDate.includes('-')) return isoDate;
  try {
    const parts = isoDate.split('-').map(Number);
    if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return isoDate;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

// Format booking type tag
function formatBookingType(bt: string): string {
  switch (bt?.toUpperCase()) {
    case 'FULL_DAY':
      return 'FULL DAY SESSION';
    case 'MORNING':
      return 'MORNING SESSION';
    case 'AFTERNOON':
      return 'AFTERNOON SESSION';
    case 'CUSTOM':
      return 'CUSTOM TIMING SLOT';
    default:
      return bt ? bt.replace('_', ' ').toUpperCase() : 'STANDARD RESERVATION';
  }
}

export async function generateBookingPdfBuffer(data: BookingPdfData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 24,
        info: {
          Title: `Facility Gate Pass & Ticket - ${data.bookingId}`,
          Author: 'Sri Sairam College of Engineering',
          Subject: `Campus Hall Reservation: ${data.eventName}`,
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 24;
      const contentWidth = pageWidth - margin * 2;
      const totalCardHeight = pageHeight - margin * 2;

      // Outer Main Ticket Card (Clean rounded container)
      doc
        .roundedRect(margin, margin, contentWidth, totalCardHeight, 10)
        .lineWidth(1)
        .strokeColor('#cbd5e1')
        .stroke();

      // ==========================================
      // 1. TOP HEADER BRANDING BANNER
      // ==========================================
      const headerHeight = 58;
      doc
        .roundedRect(margin, margin, contentWidth, headerHeight, 10)
        .fillColor('#0f2b5c')
        .fill();
      // Square off bottom corners of header
      doc.rect(margin, margin + headerHeight - 10, contentWidth, 10).fillColor('#0f2b5c').fill();

      // College Logo
      const logoPath = path.join(__dirname, '../../assets/logo.png');
      if (fs.existsSync(logoPath)) {
        doc
          .roundedRect(margin + 8, margin + 8, 76, 42, 4)
          .fillColor('#ffffff')
          .fill();
        try {
          doc.image(logoPath, margin + 10, margin + 10, { width: 72, height: 38 });
        } catch (e) {
          console.warn('Failed to draw logo image:', e);
        }
      }

      // College Header Typography
      const headerTextX = margin + 92;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#ffffff')
        .text('SRI SAIRAM COLLEGE OF ENGINEERING', headerTextX, margin + 12);

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#93c5fd')
        .text('ESTD. 1997 • AUTONOMOUS INSTITUTION • AFFILIATED TO VTU • ACCREDITED BY NAAC \'A+\'', headerTextX, margin + 27);

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#e0f2fe')
        .text('CENTRAL FACILITIES OFFICE  •  OFFICIAL FACILITY GATE PASS & RESERVATION VOUCHER', headerTextX, margin + 38);

      let currentY = margin + headerHeight;

      // ==========================================
      // 2. TICKET STUB / VERIFICATION STRIP
      // ==========================================
      const stubHeight = 74;
      doc
        .rect(margin, currentY, contentWidth, stubHeight)
        .fillColor('#f8fafc')
        .fill();

      const isApproved = data.status === 'APPROVED';
      const isCancelled = data.status === 'CANCELLED';
      const isRejected = data.status === 'REJECTED';

      const statusBg = isApproved ? '#ecfdf5' : isCancelled || isRejected ? '#fef2f2' : '#fffbeb';
      const statusBorder = isApproved ? '#a7f3d0' : isCancelled || isRejected ? '#fecaca' : '#fde68a';
      const statusText = isApproved ? '#047857' : isCancelled || isRejected ? '#b91c1c' : '#b45309';
      const statusLabel = isApproved ? 'CONFIRMED / APPROVED' : data.status === 'PENDING' ? 'PENDING REVIEW' : data.status;

      // Status Badge
      const statusBadgeW = 130;
      doc
        .roundedRect(margin + 12, currentY + 9, statusBadgeW, 17, 3)
        .fillColor(statusBg)
        .strokeColor(statusBorder)
        .lineWidth(0.8)
        .fillAndStroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(statusText)
        .text(statusLabel, margin + 12, currentY + 14, { width: statusBadgeW, align: 'center' });

      // Pass ID Label & Value
      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor('#64748b')
        .text('OFFICIAL TICKET / PASS REFERENCE:', margin + 12, currentY + 31);

      doc
        .font('Courier-Bold')
        .fontSize(16.5)
        .fillColor('#1d4ed8')
        .text(data.bookingId, margin + 12, currentY + 40);

      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#94a3b8')
        .text('Present digital QR or physical gate pass at campus security & hall reception.', margin + 12, currentY + 58);

      // Barcode simulation on ticket stub
      const barcodeX = margin + 175;
      const barcodeY = currentY + 15;
      const barcodeW = 145;
      const barcodeH = 26;

      doc.save();
      doc.fillColor('#1e293b');
      const barPattern = [1.2, 2.4, 0.8, 3.2, 1.6, 0.8, 2.4, 1.2, 0.8, 2.8, 1.2, 3.2, 0.8, 1.6, 2.4, 0.8, 2.8, 1.2, 3.2, 1.6, 0.8, 2.4, 1.2, 0.8, 2.8, 1.2, 3.2, 0.8, 1.6];
      let bX = barcodeX;
      for (let i = 0; i < barPattern.length && bX < barcodeX + barcodeW - 4; i++) {
        const w = barPattern[i];
        if (i % 2 === 0) {
          doc.rect(bX, barcodeY, w, barcodeH).fill();
        }
        bX += w + (i % 2 === 0 ? 0.9 : 0.6);
      }
      doc.restore();

      doc
        .font('Courier-Bold')
        .fontSize(7)
        .fillColor('#475569')
        .text(`* ${data.bookingId} *`, barcodeX, barcodeY + barcodeH + 3, { width: barcodeW, align: 'center' });

      // High-Resolution QR Code Block (Right)
      const qrBoxSize = 62;
      const qrBoxX = margin + contentWidth - qrBoxSize - 12;
      const qrBoxY = currentY + 6;

      doc
        .roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 4)
        .fillColor('#ffffff')
        .strokeColor('#cbd5e1')
        .lineWidth(0.8)
        .fillAndStroke();

      const qrDateText = data.endDate && data.endDate !== data.bookingDate
        ? `${data.bookingDate} to ${data.endDate}`
        : data.bookingDate;
      const qrTimeText = `${data.startTime} - ${data.endTime} (${data.bookingType.replace('_', ' ')})`;

      const qrData = [
        'SRI SAIRAM COLLEGE OF ENGINEERING',
        'OFFICIAL FACILITY GATE PASS & RESERVATION',
        '----------------------------------------',
        `Booking ID  : ${data.bookingId}`,
        `Status      : ${statusLabel}`,
        `Facility    : ${data.hallName}${data.hallLocation ? ` (${data.hallLocation})` : ''}`,
        `Event       : ${data.eventName}`,
        `Date        : ${qrDateText}`,
        `Time Slot   : ${qrTimeText}`,
        `Department  : ${data.departmentName || 'Academic Unit'}`,
        `Coordinator : ${data.coordinatorName}`,
        `Contact     : ${data.contactNumber}`,
        `Email       : ${data.email}`,
        `Attendees   : ${data.participantCount || 0} Persons`,
        `VIP Guests  : ${data.guestCount || 0} Dignitaries`,
        '----------------------------------------',
        'Authority: Facilities Committee & Dean Academics',
      ].join('\n');

      try {
        const qrBuffer = await QRCode.toBuffer(qrData, {
          width: 320,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#0f2b5c',
            light: '#ffffff',
          },
        });
        doc.image(qrBuffer, qrBoxX + 2, qrBoxY + 2, { width: qrBoxSize - 4, height: qrBoxSize - 4 });
      } catch (err) {
        console.error('QR code generation error:', err);
      }

      currentY += stubHeight;

      // ==========================================
      // 3. PHYSICAL TICKET PERFORATION (CUTOUT NOTCHES)
      // ==========================================
      const notchRadius = 7;
      const notchY = currentY;

      // Dashed Perforation Line
      doc.save();
      doc
        .moveTo(margin + notchRadius, notchY)
        .lineTo(margin + contentWidth - notchRadius, notchY)
        .dash(4, { space: 3 })
        .lineWidth(0.8)
        .strokeColor('#94a3b8')
        .stroke();
      doc.restore();

      // Left circular notch (punch-out)
      doc.save();
      doc.circle(margin, notchY, notchRadius).fillColor('#ffffff').fill();
      doc.circle(margin, notchY, notchRadius).lineWidth(1).strokeColor('#cbd5e1').stroke();

      // Right circular notch (punch-out)
      doc.circle(margin + contentWidth, notchY, notchRadius).fillColor('#ffffff').fill();
      doc.circle(margin + contentWidth, notchY, notchRadius).lineWidth(1).strokeColor('#cbd5e1').stroke();
      doc.restore();

      currentY += 8;

      // ==========================================
      // 4. EVENT TITLE & PURPOSE (DYNAMIC AUTO-HEIGHT, NO OVERLAP!)
      // ==========================================
      const eventBoxX = margin + 10;
      const eventBoxW = contentWidth - 20;

      doc.font('Helvetica-Bold').fontSize(11);
      const titleHeight = doc.heightOfString(data.eventName, { width: eventBoxW - 18 });
      const purposeText = data.purpose ? `Purpose / Objective: ${data.purpose}` : '';
      doc.font('Helvetica').fontSize(7.5);
      const purposeHeight = purposeText ? doc.heightOfString(purposeText, { width: eventBoxW - 18 }) : 0;

      const eventCardH = Math.max(38, 14 + titleHeight + (purposeText ? purposeHeight + 5 : 0) + 4);

      doc
        .roundedRect(eventBoxX, currentY, eventBoxW, eventCardH, 5)
        .fillColor('#f8fafc')
        .strokeColor('#cbd5e1')
        .lineWidth(0.8)
        .fillAndStroke();

      // Category Pill Tag
      doc
        .roundedRect(eventBoxX + 9, currentY + 5, 88, 12, 2)
        .fillColor('#eff6ff')
        .strokeColor('#bfdbfe')
        .lineWidth(0.6)
        .fillAndStroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(6)
        .fillColor('#1d4ed8')
        .text('CAMPUS EVENT PASS', eventBoxX + 9, currentY + 7.5, { width: 88, align: 'center' });

      // Title Text (wrapped cleanly)
      let textCursorY = currentY + 20;
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#0f172a')
        .text(data.eventName, eventBoxX + 9, textCursorY, { width: eventBoxW - 18 });

      textCursorY += titleHeight + 2;

      // Purpose Text (guaranteed strictly below the title!)
      if (purposeText) {
        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#475569')
          .text(purposeText, eventBoxX + 9, textCursorY, { width: eventBoxW - 18 });
      }

      currentY += eventCardH + 7;

      // ==========================================
      // 5. EVENT COORDINATES (DATE & VENUE IN 2 BALANCED COLUMNS)
      // ==========================================
      const colW = (contentWidth - 28) / 2;
      const col1X = margin + 10;
      const col2X = margin + 18 + colW;
      const gridRow1H = 50;

      // Left Column: Date & Schedule
      doc
        .roundedRect(col1X, currentY, colW, gridRow1H, 5)
        .fillColor('#f8fafc')
        .strokeColor('#e2e8f0')
        .lineWidth(0.8)
        .fillAndStroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .fillColor('#64748b')
        .text('DATE & TIME SCHEDULE', col1X + 8, currentY + 6);

      const readableStart = formatDateReadable(data.bookingDate);
      const isMultiDay = data.endDate && data.endDate !== data.bookingDate;
      const dateLine = isMultiDay
        ? `${readableStart} to ${formatDateReadable(data.endDate!)}`
        : readableStart;

      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor('#0f172a')
        .text(dateLine, col1X + 8, currentY + 16, { width: colW - 16, lineBreak: false });

      const time12Slot = `${data.startTime} - ${data.endTime} (${formatTimeTo12Hour(data.startTime)} - ${formatTimeTo12Hour(data.endTime)})`;
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#334155')
        .text(time12Slot, col1X + 8, currentY + 28, { width: colW - 16, lineBreak: false });

      doc
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .fillColor('#2563eb')
        .text(`[ ${formatBookingType(data.bookingType)} ]`, col1X + 8, currentY + 39);

      // Right Column: Reserved Facility & Location
      doc
        .roundedRect(col2X, currentY, colW, gridRow1H, 5)
        .fillColor('#f8fafc')
        .strokeColor('#e2e8f0')
        .lineWidth(0.8)
        .fillAndStroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .fillColor('#64748b')
        .text('RESERVED FACILITY & LOCATION', col2X + 8, currentY + 6);

      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor('#0f172a')
        .text(data.hallName, col2X + 8, currentY + 16, { width: colW - 16, lineBreak: false });

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#475569')
        .text(data.hallLocation || 'Campus Main Block', col2X + 8, currentY + 28, { width: colW - 16, lineBreak: false });

      doc
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .fillColor('#059669')
        .text('[ CENTRAL AMENITIES & AV EQUIPPED ]', col2X + 8, currentY + 39);

      currentY += gridRow1H + 7;

      // ==========================================
      // 6. HOST DEPARTMENT & COORDINATOR DETAILS (2 COLUMNS)
      // ==========================================
      const gridRow2H = 44;

      // Left: Host Department
      doc
        .roundedRect(col1X, currentY, colW, gridRow2H, 5)
        .fillColor('#f8fafc')
        .strokeColor('#e2e8f0')
        .lineWidth(0.8)
        .fillAndStroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .fillColor('#64748b')
        .text('HOST DEPARTMENT / UNIT', col1X + 8, currentY + 6);

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#0f172a')
        .text(data.departmentName || 'Academic Unit', col1X + 8, currentY + 16, { width: colW - 16, lineBreak: false });

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#475569')
        .text('Sri Sairam College of Engineering', col1X + 8, currentY + 28);

      // Right: Faculty Coordinator Contact
      doc
        .roundedRect(col2X, currentY, colW, gridRow2H, 5)
        .fillColor('#f8fafc')
        .strokeColor('#e2e8f0')
        .lineWidth(0.8)
        .fillAndStroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .fillColor('#64748b')
        .text('FACULTY COORDINATOR / IN-CHARGE', col2X + 8, currentY + 6);

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#0f172a')
        .text(data.coordinatorName || 'Faculty In-Charge', col2X + 8, currentY + 16, { width: colW - 16, lineBreak: false });

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#334155')
        .text(`Phone: ${data.contactNumber || 'N/A'}  •  Email: ${data.email || 'N/A'}`, col2X + 8, currentY + 28, { width: colW - 16, lineBreak: false });

      currentY += gridRow2H + 7;

      // ==========================================
      // 7. AUDIENCE & VIP SCALE (3 MINI TILES)
      // ==========================================
      const col3W = (contentWidth - 36) / 3;
      const tileH = 34;

      const drawMetricTile = (x: number, title: string, countVal: string, sub: string) => {
        doc
          .roundedRect(x, currentY, col3W, tileH, 5)
          .fillColor('#f8fafc')
          .strokeColor('#e2e8f0')
          .lineWidth(0.8)
          .fillAndStroke();

        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#64748b').text(title, x + 8, currentY + 5);
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text(countVal, x + 8, currentY + 14);
        doc.font('Helvetica').fontSize(6.5).fillColor('#64748b').text(sub, x + 8, currentY + 24);
      };

      drawMetricTile(margin + 10, 'EXPECTED ATTENDEES', `${data.participantCount || 0} Persons`, 'Total Audience Capacity');
      drawMetricTile(margin + 18 + col3W, 'VIP GUESTS COUNT', `${data.guestCount || 0} Dignitaries`, 'Chief Guests & Dignitaries');
      drawMetricTile(margin + 26 + col3W * 2, 'MEMENTOS / SHAWLS', `${data.mementoCount || 0} Units`, 'Stores Requisition Needed');

      currentY += tileH + 7;

      // ==========================================
      // 8. TECHNICAL AV & ESTATE REQUISITIONS (TAGS/BADGES)
      // ==========================================
      let reqList: string[] = [];
      if (Array.isArray(data.specialRequirements)) {
        reqList = data.specialRequirements;
      } else if (typeof data.specialRequirements === 'string') {
        try {
          const parsed = JSON.parse(data.specialRequirements);
          if (Array.isArray(parsed)) reqList = parsed;
          else reqList = [data.specialRequirements];
        } catch {
          reqList = data.specialRequirements ? [data.specialRequirements] : [];
        }
      }

      if (reqList.length > 0) {
        const reqCardH = 32;
        doc
          .roundedRect(margin + 10, currentY, contentWidth - 20, reqCardH, 5)
          .fillColor('#eff6ff')
          .strokeColor('#bfdbfe')
          .lineWidth(0.8)
          .fillAndStroke();

        doc
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .fillColor('#1d4ed8')
          .text('TECHNICAL AV & EQUIPMENT REQUISITIONS FOR STORES / ESTATE:', margin + 18, currentY + 5);

        // Render neat tags / pills
        let tagX = margin + 18;
        const tagY = currentY + 14;
        doc.font('Helvetica-Bold').fontSize(7);

        reqList.forEach((reqItem) => {
          const cleanItem = String(reqItem).trim();
          if (!cleanItem) return;
          const tagW = doc.widthOfString(cleanItem) + 12;

          if (tagX + tagW < margin + contentWidth - 24) {
            doc
              .roundedRect(tagX, tagY, tagW, 13, 3)
              .fillColor('#ffffff')
              .strokeColor('#93c5fd')
              .lineWidth(0.6)
              .fillAndStroke();

            doc.fillColor('#1e40af').text(cleanItem, tagX + 6, tagY + 3);
            tagX += tagW + 6;
          }
        });

        currentY += reqCardH + 6;
      }

      // ==========================================
      // 9. EVENT DESCRIPTION (IF PRESENT)
      // ==========================================
      if (data.description && data.description.trim()) {
        const descCardH = 28;
        doc
          .roundedRect(margin + 10, currentY, contentWidth - 20, descCardH, 5)
          .fillColor('#f8fafc')
          .strokeColor('#e2e8f0')
          .lineWidth(0.8)
          .fillAndStroke();

        doc
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .fillColor('#64748b')
          .text('EVENT DESCRIPTION & PROTOCOL SYNOPSIS:', margin + 18, currentY + 5);

        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#334155')
          .text(data.description.substring(0, 160), margin + 18, currentY + 14, { width: contentWidth - 36, lineBreak: false });

        currentY += descCardH + 6;
      }

      // ==========================================
      // 10. OFFICIAL ADMIN NOTICE / INSTRUCTION (IF PRESENT)
      // ==========================================
      if (data.adminNotes && data.adminNotes.trim()) {
        const noticeH = 28;
        doc
          .roundedRect(margin + 10, currentY, contentWidth - 20, noticeH, 5)
          .fillColor('#fffbeb')
          .strokeColor('#fde68a')
          .lineWidth(0.8)
          .fillAndStroke();

        doc
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .fillColor('#b45309')
          .text('OFFICIAL ADMIN INSTRUCTION / SPECIAL NOTICE FOR STORE & FACULTY:', margin + 18, currentY + 5);

        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#78350f')
          .text(data.adminNotes, margin + 18, currentY + 14, { width: contentWidth - 36, lineBreak: false });

        currentY += noticeH + 6;
      }

      if (data.rejectionReason && data.rejectionReason.trim()) {
        const rejectH = 28;
        doc
          .roundedRect(margin + 10, currentY, contentWidth - 20, rejectH, 5)
          .fillColor('#fef2f2')
          .strokeColor('#fecaca')
          .lineWidth(0.8)
          .fillAndStroke();

        doc
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .fillColor('#b91c1c')
          .text('OFFICIAL REJECTION / CANCELLATION REASON:', margin + 18, currentY + 5);

        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#7f1d1d')
          .text(data.rejectionReason, margin + 18, currentY + 14, { width: contentWidth - 36, lineBreak: false });

        currentY += rejectH + 6;
      }

      // ==========================================
      // 11. MANDATORY TERMS & REGULATIONS (CLEAN 2 COLUMNS)
      // ==========================================
      const footerH = 46;
      const termsBoxH = 112;
      // Anchor terms box gracefully above the bottom footer to balance page height
      const termsBoxY = Math.max(currentY + 10, pageHeight - margin - footerH - termsBoxH - 8);
      const termsBoxW = contentWidth - 20;

      doc
        .roundedRect(margin + 10, termsBoxY, termsBoxW, termsBoxH, 5)
        .fillColor('#f8fafc')
        .strokeColor('#cbd5e1')
        .lineWidth(0.8)
        .fillAndStroke();

      // Top Header for Terms
      doc
        .roundedRect(margin + 10, termsBoxY, termsBoxW, 16, 5)
        .fillColor('#0f2b5c')
        .fill();
      doc.rect(margin + 10, termsBoxY + 10, termsBoxW, 6).fillColor('#0f2b5c').fill();

      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor('#ffffff')
        .text('MANDATORY FACILITY USAGE TERMS & CONDITIONS (STRICT COMPLIANCE REQUIRED)', margin + 16, termsBoxY + 4.5);

      const rulesLeft = [
        '1. Sticking posters, banners, or notices on walls is strictly prohibited.',
        '2. Use of double-sided tape, adhesive glue, or nails on walls/furniture is banned.',
        '3. Any damage caused to facilities or equipment must be borne by hosting unit.',
        '4. Furniture must be handled carefully & returned to original stage setup.',
        '5. Audio-visual and projector equipment requires authorized operator only.',
      ];

      const rulesRight = [
        '6. Food, outside snacks, and colored beverages are not permitted inside.',
        '7. Lights, AC units, and projectors must be powered off immediately after use.',
        '8. The facility hall must be vacated punctually as per allotted schedule.',
        '9. Any technical fault or broken item must be reported instantly to Estate Office.',
        '10. Coordinator is solely accountable for decorum, security & equipment safety.',
      ];

      const termsColW = (termsBoxW - 24) / 2;
      let rLeftY = termsBoxY + 20;
      doc.font('Helvetica').fontSize(6.2).fillColor('#334155');

      rulesLeft.forEach((rule) => {
        doc.text(rule, margin + 16, rLeftY, { width: termsColW, lineGap: 1.2 });
        rLeftY += 14.5;
      });

      let rRightY = termsBoxY + 20;
      rulesRight.forEach((rule) => {
        doc.text(rule, margin + 20 + termsColW, rRightY, { width: termsColW, lineGap: 1.2 });
        rRightY += 14.5;
      });

      doc
        .font('Helvetica-Oblique')
        .fontSize(5.8)
        .fillColor('#64748b')
        .text(
          '* Acceptance of this gate pass implies formal agreement by faculty coordinator & department to abide by all university regulations.',
          margin + 16,
          termsBoxY + termsBoxH - 11,
          { width: termsBoxW - 24 }
        );

      // ==========================================
      // 12. BOTTOM SECURITY FOOTER & AUTHORIZED SIGNATURE
      // ==========================================
      const bottomFooterY = pageHeight - margin - 40;

      // Dashed divider line
      doc.save();
      doc
        .moveTo(margin + 10, bottomFooterY)
        .lineTo(margin + contentWidth - 10, bottomFooterY)
        .dash(3, { space: 3 })
        .lineWidth(0.8)
        .strokeColor('#cbd5e1')
        .stroke();
      doc.restore();

      // Seal Image
      const sealPath = path.join(__dirname, '../../assets/seal.png');
      if (fs.existsSync(sealPath)) {
        try {
          doc.image(sealPath, pageWidth - margin - 195, bottomFooterY + 3, { width: 34, height: 34 });
        } catch (e) {
          console.warn('Failed to draw seal image:', e);
        }
      }

      // Security verification string & system date
      const printDateStr = `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#64748b')
        .text(`System Generated Gate Pass • Verified via Central Portal • Generated: ${printDateStr}`, margin + 10, bottomFooterY + 8);

      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#94a3b8')
        .text('Central Facilities Management & Dean Academics | Helpdesk: facilities@sairamce.edu.in', margin + 10, bottomFooterY + 18);

      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor('#334155')
        .text('[ Official Stamp / Authorized Signature ]', pageWidth - margin - 156, bottomFooterY + 16);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
