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

export async function generateBookingPdfBuffer(data: BookingPdfData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 28,
        info: {
          Title: `Facility Gate Pass - ${data.bookingId}`,
          Author: 'Sri Sairam College of Engineering',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 28;
      const contentWidth = pageWidth - margin * 2;

      // Outer border card
      doc
        .roundedRect(margin, margin, contentWidth, pageHeight - margin * 2, 8)
        .lineWidth(1)
        .strokeColor('#cbd5e1')
        .stroke();

      // Header Banner
      doc
        .roundedRect(margin, margin, contentWidth, 54, 8)
        .fillColor('#1e3a8a')
        .fill();
      doc.rect(margin, margin + 44, contentWidth, 10).fillColor('#1e3a8a').fill();

      // Official Logo (if exists)
      const logoPath = path.join(__dirname, '../../assets/logo.png');
      if (fs.existsSync(logoPath)) {
        doc
          .roundedRect(margin + 8, margin + 7, 76, 40, 4)
          .fillColor('#ffffff')
          .fill();
        doc.image(logoPath, margin + 10, margin + 9, { width: 72, height: 36 });
      }

      // Header Title
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12.5);
      doc.text('SRI SAIRAM COLLEGE OF ENGINEERING', margin + 94, margin + 14);
      doc.font('Helvetica').fontSize(8.5).fillColor('#bfdbfe');
      doc.text(
        'CENTRAL FACILITIES OFFICE • OFFICIAL FACILITY GATE PASS & REQUISITION',
        margin + 94,
        margin + 30
      );

      let currentY = margin + 64;

      // Status Badge & Reference Card
      const isApproved = data.status === 'APPROVED';
      const isCancelled = data.status === 'CANCELLED';
      const isRejected = data.status === 'REJECTED';

      const statusBg = isApproved ? '#dcfce7' : isCancelled || isRejected ? '#fee2e2' : '#fef3c7';
      const statusTextColor = isApproved ? '#166534' : isCancelled || isRejected ? '#991b1b' : '#92400e';
      const statusLabel = isApproved ? 'CONFIRMED / APPROVED' : data.status;

      // Reference Box (Left) + QR Code (Right)
      doc
        .roundedRect(margin + 8, currentY, contentWidth - 16, 68, 6)
        .fillColor('#f8fafc')
        .strokeColor('#e2e8f0')
        .lineWidth(0.8)
        .fillAndStroke();

      // Status Pill inside reference box
      doc
        .roundedRect(margin + 16, currentY + 8, 120, 16, 3)
        .fillColor(statusBg)
        .fill();
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(statusTextColor)
        .text(statusLabel, margin + 16, currentY + 12.5, { width: 120, align: 'center' });

      doc.font('Helvetica').fontSize(7.5).fillColor('#64748b').text('BOOKING REFERENCE ID:', margin + 16, currentY + 28);
      doc.font('Courier-Bold').fontSize(15).fillColor('#2563eb').text(data.bookingId, margin + 16, currentY + 38);
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#94a3b8')
        .text('Scan offline QR at hall entrance to verify reservation authorization.', margin + 16, currentY + 54);

      // QR Code Generation
      const qrData = JSON.stringify({
        id: data.bookingId,
        hall: data.hallName,
        date: data.bookingDate,
        time: `${data.startTime}-${data.endTime}`,
        status: data.status,
        faculty: data.coordinatorName,
      });

      try {
        const qrBuffer = await QRCode.toBuffer(qrData, { width: 140, margin: 1 });
        doc.image(qrBuffer, contentWidth - 48, currentY + 6, { width: 56, height: 56 });
      } catch (err) {
        console.error('QR code generation error:', err);
      }

      currentY += 76;

      // Helper function to draw info blocks
      const drawBlock = (x: number, y: number, w: number, h: number, label: string, val: string, sub?: string) => {
        doc
          .roundedRect(x, y, w, h, 4)
          .fillColor('#f8fafc')
          .strokeColor('#e2e8f0')
          .lineWidth(0.8)
          .fillAndStroke();

        doc.font('Helvetica-Bold').fontSize(7).fillColor('#64748b').text(label.toUpperCase(), x + 7, y + 6);
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text(val, x + 7, y + 15, { width: w - 14, lineBreak: false });
        if (sub) {
          doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(sub, x + 7, y + 26, { width: w - 14, lineBreak: false });
        }
      };

      const colW = (contentWidth - 24) / 2;

      // Row 1: Facility Hall & Timing
      const dateRange = data.endDate && data.endDate !== data.bookingDate
        ? `${data.bookingDate} to ${data.endDate}`
        : data.bookingDate;
      const timingSlot = `${data.startTime} - ${data.endTime} (${data.bookingType.replace('_', ' ')})`;

      drawBlock(margin + 8, currentY, colW, 36, 'Reserved Facility', data.hallName, data.hallLocation || 'Campus Main Block');
      drawBlock(margin + 16 + colW, currentY, colW, 36, 'Event Date(s) & Schedule', dateRange, timingSlot);

      currentY += 41;

      // Row 2: Event Title & Department
      drawBlock(margin + 8, currentY, colW, 36, 'Event Name / Title', data.eventName, data.purpose ? `Purpose: ${data.purpose}` : undefined);
      drawBlock(margin + 16 + colW, currentY, colW, 36, 'Host Department / Organization', data.departmentName || 'Academic Unit', 'Sri Sairam College of Engineering');

      currentY += 41;

      // Row 3: Event Logistics & Dignitary Scale (3 columns)
      const col3W = (contentWidth - 32) / 3;
      drawBlock(margin + 8, currentY, col3W, 32, 'Expected Attendees', `${data.participantCount || 0} Persons`, 'Total Audience Sizing');
      drawBlock(margin + 16 + col3W, currentY, col3W, 32, 'VIP Guests Count', `${data.guestCount || 0} Dignitaries`, 'Chief Guests & Dignitaries');
      drawBlock(margin + 24 + col3W * 2, currentY, col3W, 32, 'Mementos (Momento)', `${data.mementoCount || 0} Units`, 'Shawls / Momentos Needed');

      currentY += 37;

      // Row 4: Coordinator Details (Full Width)
      doc
        .roundedRect(margin + 8, currentY, contentWidth - 16, 28, 4)
        .fillColor('#f8fafc')
        .strokeColor('#e2e8f0')
        .lineWidth(0.8)
        .fillAndStroke();

      doc.font('Helvetica-Bold').fontSize(7).fillColor('#64748b').text('FACULTY COORDINATOR / APPLICANT CONTACT', margin + 16, currentY + 5);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#0f172a')
        .text(`${data.coordinatorName}  •  Phone: ${data.contactNumber}  •  Email: ${data.email}`, margin + 16, currentY + 15);

      currentY += 33;

      // Row 5: Technical Requirements & Equipment List
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
        doc
          .roundedRect(margin + 8, currentY, contentWidth - 16, 36, 4)
          .fillColor('#eff6ff')
          .strokeColor('#bfdbfe')
          .lineWidth(0.8)
          .fillAndStroke();

        doc.font('Helvetica-Bold').fontSize(7).fillColor('#1e40af').text('TECHNICAL AV & EQUIPMENT REQUISITIONS FOR STORE / ESTATE:', margin + 16, currentY + 5);
        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#1e3a8a')
          .text(reqList.join('   •   '), margin + 16, currentY + 14, { width: contentWidth - 32 });

        currentY += 41;
      }

      // Row 6: Description & Agenda / Dignitary Synopsis
      if (data.description && data.description.trim()) {
        doc
          .roundedRect(margin + 8, currentY, contentWidth - 16, 34, 4)
          .fillColor('#f8fafc')
          .strokeColor('#e2e8f0')
          .lineWidth(0.8)
          .fillAndStroke();

        doc.font('Helvetica-Bold').fontSize(7).fillColor('#64748b').text('EVENT DESCRIPTION & PROTOCOL SYNOPSIS:', margin + 16, currentY + 5);
        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#334155')
          .text(data.description.substring(0, 180), margin + 16, currentY + 14, { width: contentWidth - 32 });

        currentY += 39;
      }

      // Admin Notice / Rejection Reason (if any)
      if (data.adminNotes && data.adminNotes.trim()) {
        doc
          .roundedRect(margin + 8, currentY, contentWidth - 16, 28, 4)
          .fillColor('#fef3c7')
          .strokeColor('#fde68a')
          .lineWidth(0.8)
          .fillAndStroke();

        doc.font('Helvetica-Bold').fontSize(7).fillColor('#92400e').text('OFFICIAL ADMIN NOTICE / INSTRUCTION FOR STORE & FACULTY:', margin + 16, currentY + 5);
        doc.font('Helvetica').fontSize(7.5).fillColor('#78350f').text(data.adminNotes, margin + 16, currentY + 14, { width: contentWidth - 32 });
        currentY += 33;
      }

      if (data.rejectionReason && data.rejectionReason.trim()) {
        doc
          .roundedRect(margin + 8, currentY, contentWidth - 16, 28, 4)
          .fillColor('#fee2e2')
          .strokeColor('#fecaca')
          .lineWidth(0.8)
          .fillAndStroke();

        doc.font('Helvetica-Bold').fontSize(7).fillColor('#991b1b').text('OFFICIAL REJECTION / CANCELLATION REASON:', margin + 16, currentY + 5);
        doc.font('Helvetica').fontSize(7.5).fillColor('#7f1d1d').text(data.rejectionReason, margin + 16, currentY + 14, { width: contentWidth - 32 });
        currentY += 33;
      }

      // Footer divider & Authority Signatures
      const footerY = pageHeight - margin - 42;
      doc
        .moveTo(margin + 8, footerY)
        .lineTo(pageWidth - margin - 8, footerY)
        .dash(3, { space: 3 })
        .strokeColor('#cbd5e1')
        .stroke();

      const sealPath = path.join(__dirname, '../../assets/seal.png');
      if (fs.existsSync(sealPath)) {
        doc.image(sealPath, pageWidth - margin - 110, footerY - 26, { width: 36, height: 36 });
      }

      doc.undash();
      doc.font('Helvetica').fontSize(7).fillColor('#94a3b8');
      doc.text(`System Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin + 8, footerY + 8);
      doc.text('Authority: Central Facilities Committee & Dean Academics', margin + 8, footerY + 18);
      doc.text('For queries: facilities@sairamce.edu.in', margin + 8, footerY + 28);

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#475569');
      doc.text('[ Official Stamp / Authorized Signature ]', pageWidth - margin - 170, footerY + 18);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
