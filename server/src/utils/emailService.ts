import nodemailer, { Transporter } from 'nodemailer';
import { prisma } from '../prisma';
import { generateBookingPdfBuffer, BookingPdfData } from './pdfGenerator';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: {
        user,
        pass,
      },
    });
    return transporter;
  }

  return null;
}

async function isEmailNotificationsEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'emailNotificationsEnabled' },
    });
    if (!setting) return true;
    return setting.value === 'true';
  } catch {
    return true;
  }
}

async function getDesignatedNotificationEmails(): Promise<{ iqacEmail: string; storeEmail: string }> {
  try {
    const [iqacSetting, storeSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: 'iqacNotificationEmail' } }),
      prisma.systemSetting.findUnique({ where: { key: 'storeNotificationEmail' } }),
    ]);

    return {
      iqacEmail: iqacSetting?.value?.trim() || 'iqac@sairamce.edu.in',
      storeEmail: storeSetting?.value?.trim() || 'store@sairamce.edu.in',
    };
  } catch {
    return {
      iqacEmail: 'iqac@sairamce.edu.in',
      storeEmail: 'store@sairamce.edu.in',
    };
  }
}

export interface BookingEmailPayload {
  to: string;
  recipientName: string;
  bookingId: string;
  eventName: string;
  hallName: string;
  hallLocation?: string;
  departmentName?: string;
  bookingDate: string;
  endDate?: string | null;
  timeSlot: string;
  startTime?: string;
  endTime?: string;
  bookingType?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string;
  coordinatorName?: string;
  contactNumber?: string;
  email?: string;
  participantCount?: number;
  guestCount?: number;
  mementoCount?: number;
  purpose?: string;
  description?: string;
  specialRequirements?: string | string[];
  adminNotes?: string;
  pdfBuffer?: Buffer;
  facultyEmail?: string;
}

export function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendBookingNotificationEmail(payload: BookingEmailPayload): Promise<boolean> {
  const enabled = await isEmailNotificationsEnabled();
  if (!enabled) {
    return false;
  }

  const {
    to,
    recipientName,
    bookingId,
    eventName,
    hallName,
    hallLocation,
    departmentName,
    bookingDate,
    endDate,
    timeSlot,
    startTime = '09:00',
    endTime = '17:00',
    bookingType = 'FULL_DAY',
    status,
    rejectionReason,
    coordinatorName,
    contactNumber = '',
    email = '',
    participantCount = 0,
    guestCount = 0,
    mementoCount = 0,
    purpose = '',
    description = '',
    specialRequirements = [],
    adminNotes,
    facultyEmail,
  } = payload;

  const { iqacEmail, storeEmail } = await getDesignatedNotificationEmails();

  // Generate official PDF Gate Pass Buffer
  let pdfBuffer: Buffer | null = payload.pdfBuffer || null;
  if (!pdfBuffer) {
    try {
      const pdfData: BookingPdfData = {
        bookingId,
        eventName,
        hallName,
        hallLocation,
        departmentName,
        bookingDate,
        endDate,
        startTime,
        endTime,
        bookingType,
        status,
        coordinatorName: coordinatorName || recipientName,
        contactNumber,
        email: email || to,
        participantCount,
        guestCount,
        mementoCount,
        purpose,
        description,
        specialRequirements,
        adminNotes,
        rejectionReason,
      };
      pdfBuffer = await generateBookingPdfBuffer(pdfData);
    } catch (err) {
      console.error(`[EmailService] Failed to generate PDF pass for ${bookingId}:`, err);
    }
  }

  // Determine recipients list
  // 1. Applicant / Coordinator email is always included
  const recipientList: { email: string; roleTag: string }[] = [];

  if (to && to.trim()) {
    recipientList.push({ email: to.trim(), roleTag: 'APPLICANT_COORDINATOR' });
  }

  // 1b. Registered Faculty user email (who submitted the request) is always included
  if (
    facultyEmail &&
    facultyEmail.trim() &&
    !recipientList.some((r) => r.email.toLowerCase() === facultyEmail.trim().toLowerCase())
  ) {
    recipientList.push({ email: facultyEmail.trim(), roleTag: 'FACULTY_USER' });
  }

  // 2. IQAC always receives notification for all requests (Pending, Approved, Rejected, Cancelled)
  if (iqacEmail && !recipientList.some((r) => r.email.toLowerCase() === iqacEmail.toLowerCase())) {
    recipientList.push({ email: iqacEmail, roleTag: 'IQAC_CELL' });
  }

  // 3. Store team receives approval setup requisition & cancellation alerts
  if (
    (status === 'APPROVED' || status === 'CANCELLED') &&
    storeEmail &&
    !recipientList.some((r) => r.email.toLowerCase() === storeEmail.toLowerCase())
  ) {
    recipientList.push({ email: storeEmail, roleTag: 'STORE_LOGISTICS' });
  }

  const fromAddress = process.env.SMTP_FROM || 'Seminar & AV Hall System <facilities@sairamce.edu.in>';

  let subject = `[${status}] Booking Request ${bookingId}: ${eventName}`;
  let headline = `Your Booking Request is ${status}`;
  let statusColor = '#3B82F6';

  if (status === 'APPROVED') {
    subject = `✅ Approved: Booking ${bookingId} - ${hallName} (${eventName})`;
    headline = 'Your Reservation Has Been Confirmed!';
    statusColor = '#10B981';
  } else if (status === 'REJECTED') {
    subject = `❌ Rejection Notice: Booking Request ${bookingId} - ${hallName}`;
    headline = 'Booking Request Could Not Be Approved';
    statusColor = '#EF4444';
  } else if (status === 'CANCELLED') {
    subject = `⚠️ Cancelled: Booking Request ${bookingId} - ${hallName}`;
    headline = 'Facility Booking Has Been Cancelled';
    statusColor = '#64748B';
  } else if (status === 'PENDING') {
    subject = `⏳ New Requisition: Booking Request ${bookingId} (${eventName})`;
    headline = 'Booking Request Submitted & Under Review';
    statusColor = '#F59E0B';
  }

  // Parse equipment list
  let reqItems: string[] = [];
  if (Array.isArray(specialRequirements)) {
    reqItems = specialRequirements;
  } else if (typeof specialRequirements === 'string') {
    try {
      const parsed = JSON.parse(specialRequirements);
      if (Array.isArray(parsed)) reqItems = parsed;
      else reqItems = [specialRequirements];
    } catch {
      reqItems = specialRequirements ? [specialRequirements] : [];
    }
  }

  const safeRecipient = escapeHtml(recipientName);
  const safeBookingId = escapeHtml(bookingId);
  const safeEventName = escapeHtml(eventName);
  const safeHallName = escapeHtml(hallName);
  const safeDate = escapeHtml(bookingDate + (endDate && endDate !== bookingDate ? ` to ${endDate}` : ''));
  const safeTimeSlot = escapeHtml(timeSlot);
  const safeStatus = escapeHtml(status);
  const safeReason = escapeHtml(rejectionReason);
  const safeCoordinator = escapeHtml(coordinatorName || recipientName);
  const safeContact = escapeHtml(contactNumber);
  const safeDept = escapeHtml(departmentName || 'Academic Unit');

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: ${statusColor}; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">SRI SAIRAM COLLEGE OF ENGINEERING</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">Central Facilities Office • AV & Seminar Hall Management</p>
      </div>

      <div style="padding: 26px;">
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 12px;">Dear <strong>${safeRecipient}</strong>,</p>
        <p style="font-size: 14px; color: #475569; margin: 0 0 20px; line-height: 1.5;">${headline} Please find the official confirmation details and attached PDF Gate Pass below.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; width: 160px;">Booking Reference:</td>
            <td style="padding: 9px 0; font-weight: 700; color: #2563eb; font-family: monospace; font-size: 14px;">${safeBookingId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b;">Event Name:</td>
            <td style="padding: 9px 0; font-weight: 600; color: #0f172a;">${safeEventName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b;">Reserved Hall:</td>
            <td style="padding: 9px 0; font-weight: 600; color: #0f172a;">${safeHallName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b;">Date(s) & Time Slot:</td>
            <td style="padding: 9px 0; font-weight: 600; color: #0f172a;">${safeDate} (${safeTimeSlot})</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b;">Host Department:</td>
            <td style="padding: 9px 0; font-weight: 600; color: #0f172a;">${safeDept}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b;">Coordinator In-charge:</td>
            <td style="padding: 9px 0; font-weight: 600; color: #0f172a;">${safeCoordinator} ${safeContact ? `(${safeContact})` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 9px 0; color: #64748b;">Status:</td>
            <td style="padding: 9px 0; font-weight: 700; color: ${statusColor}; font-size: 14px;">${safeStatus}</td>
          </tr>
        </table>

        <!-- Logistics Table for Store, IQAC and Coordinator -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 22px;">
          <h3 style="margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">
            📦 Event Scale &amp; Store Logistics Requisition
          </h3>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 50%;">Expected Attendees:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">👥 ${participantCount || 0} Persons</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">No. of VIP Guests / Dignitaries:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #b45309;">🎖️ ${guestCount || 0} Dignitaries</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">No. of Mementos (Momento):</td>
              <td style="padding: 6px 0; font-weight: 700; color: #7e22ce;">🏆 ${mementoCount || 0} Units</td>
            </tr>
            ${reqItems.length > 0 ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; vertical-align: top;">Requested Equipment / AV:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #1e40af;">🎙️ ${reqItems.map(escapeHtml).join(', ')}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${safeReason ? `
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 13px; color: #991b1b;">
          <strong>Notice / Reason:</strong> ${safeReason}
        </div>
        ` : ''}

        ${pdfBuffer ? `
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px; font-size: 12px; color: #065f46; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <span>📎 <strong>Official PDF Gate Pass</strong> has been generated and attached to this email.</span>
        </div>
        ` : ''}

        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px; font-size: 11.5px; color: #64748b; line-height: 1.4;">
          <strong>Security &amp; Logistics Notice:</strong> Present the attached official PDF Gate Pass at the facility entrance. For equipment requisition queries, coordinate with the Store &amp; Estate Office.
        </div>
      </div>

      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
        Central Facilities Office • Sri Sairam College of Engineering • Automated Dispatch
      </div>
    </div>
  `;

  const activeTransporter = getTransporter();
  const pdfAttachment = pdfBuffer
    ? [
        {
          filename: `Gate-Pass-${safeBookingId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ]
    : [];

  const recipientEmails = recipientList.map((r) => r.email).join(', ');

  if (activeTransporter) {
    try {
      await activeTransporter.sendMail({
        from: fromAddress,
        to: recipientEmails,
        subject,
        html: htmlContent,
        attachments: pdfAttachment,
      });
      console.log(`[EmailService] Dispatched ${status} email with PDF attachment to [${recipientEmails}] for booking ${bookingId}`);
      return true;
    } catch (err) {
      console.error(`[EmailService] Failed to send email via SMTP to [${recipientEmails}]:`, err);
      return false;
    }
  } else {
    // Development fallback / preview logging
    console.log(`[EmailService - Simulated Outbound Delivery with PDF Attachment]`);
    console.log(`  To: ${recipientEmails} (${recipientList.map(r => `${r.roleTag}: ${r.email}`).join(' | ')})`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Event: ${eventName} (${hallName})`);
    console.log(`  Status: ${status}`);
    console.log(`  PDF Attachment: Gate-Pass-${safeBookingId}.pdf (${pdfBuffer ? pdfBuffer.length : 0} bytes)`);
    console.log(`  Logistics: Attendees=${participantCount}, VIP Guests=${guestCount}, Mementos=${mementoCount}`);
    return true;
  }
}
