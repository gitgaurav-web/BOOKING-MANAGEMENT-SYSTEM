import nodemailer, { Transporter } from 'nodemailer';
import path from 'path';
import fs from 'fs';
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

export function getSealImagePath(): string | null {
  const possiblePaths = [
    path.resolve(__dirname, '../../assets/seal.png'),
    path.resolve(process.cwd(), 'assets/seal.png'),
    path.resolve(process.cwd(), 'server/assets/seal.png'),
    path.resolve(__dirname, '../../../client/public/images/sairam-seal.png'),
    path.resolve(process.cwd(), 'client/public/images/sairam-seal.png'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export interface EmailConfig {
  headerTitle: string;
  headerSubtitle: string;
  approvedHeadline: string;
  approvedMessage: string;
  pendingHeadline: string;
  pendingMessage: string;
  rejectedHeadline: string;
  rejectedMessage: string;
  cancelledHeadline: string;
  cancelledMessage: string;
  guidelinesTitle: string;
  facultyGuidelines: string[];
  footerLine1: string;
  footerLine2: string;
}

export const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  headerTitle: 'SRI SAIRAM COLLEGE OF ENGINEERING',
  headerSubtitle: 'Central Facilities Office • Official Campus Reservation Service',
  approvedHeadline: 'Your Facility Reservation is Confirmed!',
  approvedMessage: 'Great news! Your booking request for {hallName} has been approved by the administration. Your official Event Gate Pass & Entry Ticket is attached to this email as a PDF.',
  pendingHeadline: 'Booking Request Received & Under Review',
  pendingMessage: 'Thank you for submitting your booking request. Your reservation for {hallName} has been received and is currently under review by the Central Facilities Office. You will receive a confirmation once it is approved.',
  rejectedHeadline: 'Booking Request Could Not Be Approved',
  rejectedMessage: 'We regret to inform you that your reservation request for {hallName} on {bookingDate} could not be approved at this time.',
  cancelledHeadline: 'Facility Reservation Cancelled',
  cancelledMessage: 'This is to inform you that your reservation for {hallName} on {bookingDate} has been cancelled. The facility has been released and is open for other campus events.',
  guidelinesTitle: 'Important Guidelines for Faculty Coordinator:',
  facultyGuidelines: [
    'Entry Pass: Please present the attached PDF Gate Pass at the campus security gate and hall entrance.',
    'Keys & AV Setup: Collect the hall key and verify equipment with the Store & Estate Office before your program starts.',
    'Hall Decorum: Food, colored beverages, and sticking adhesive tapes or nails on walls/furniture are strictly prohibited.',
    'Post-Event Checklist: Ensure all lights, projectors, and air conditioning units are switched off immediately upon conclusion.',
  ],
  footerLine1: 'Central Facilities Office • Sri Sairam College of Engineering',
  footerLine2: 'Sai Leo Nagar, Guddanahalli Village, Anekal, Bengaluru, Karnataka • Helpdesk: facilities@sairamce.edu.in',
};

export async function getEmailConfig(): Promise<EmailConfig> {
  try {
    const list = await prisma.systemSetting.findMany();
    const map: Record<string, string> = {};
    for (const item of list) {
      map[item.key] = item.value;
    }

    let guidelines = DEFAULT_EMAIL_CONFIG.facultyGuidelines;
    if (map.emailFacultyGuidelines) {
      try {
        const parsed = JSON.parse(map.emailFacultyGuidelines);
        if (Array.isArray(parsed) && parsed.length > 0) {
          guidelines = parsed.map((item: any) => String(item).trim()).filter(Boolean);
        }
      } catch {
        const lines = map.emailFacultyGuidelines.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length > 0) guidelines = lines;
      }
    }

    return {
      headerTitle: map.emailHeaderTitle || DEFAULT_EMAIL_CONFIG.headerTitle,
      headerSubtitle: map.emailHeaderSubtitle || DEFAULT_EMAIL_CONFIG.headerSubtitle,
      approvedHeadline: map.emailApprovedHeadline || DEFAULT_EMAIL_CONFIG.approvedHeadline,
      approvedMessage: map.emailApprovedMessage || DEFAULT_EMAIL_CONFIG.approvedMessage,
      pendingHeadline: map.emailPendingHeadline || DEFAULT_EMAIL_CONFIG.pendingHeadline,
      pendingMessage: map.emailPendingMessage || DEFAULT_EMAIL_CONFIG.pendingMessage,
      rejectedHeadline: map.emailRejectedHeadline || DEFAULT_EMAIL_CONFIG.rejectedHeadline,
      rejectedMessage: map.emailRejectedMessage || DEFAULT_EMAIL_CONFIG.rejectedMessage,
      cancelledHeadline: map.emailCancelledHeadline || DEFAULT_EMAIL_CONFIG.cancelledHeadline,
      cancelledMessage: map.emailCancelledMessage || DEFAULT_EMAIL_CONFIG.cancelledMessage,
      guidelinesTitle: map.emailGuidelinesTitle || DEFAULT_EMAIL_CONFIG.guidelinesTitle,
      facultyGuidelines: guidelines,
      footerLine1: map.emailFooterLine1 || DEFAULT_EMAIL_CONFIG.footerLine1,
      footerLine2: map.emailFooterLine2 || DEFAULT_EMAIL_CONFIG.footerLine2,
    };
  } catch {
    return DEFAULT_EMAIL_CONFIG;
  }
}

export function interpolateTemplate(template: string, vars: Record<string, string>): string {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
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
  const emailConfig = await getEmailConfig();

  const safeRecipient = escapeHtml(recipientName);
  const safeBookingId = escapeHtml(bookingId);
  const safeEventName = escapeHtml(eventName);
  const safeHallName = escapeHtml(hallName);
  const safeLocation = escapeHtml(hallLocation || 'Campus Main Block');
  const safeDate = escapeHtml(bookingDate + (endDate && endDate !== bookingDate ? ` to ${endDate}` : ''));
  const safeTimeSlot = escapeHtml(timeSlot);
  const safeStatus = escapeHtml(status);
  const safeReason = escapeHtml(rejectionReason);
  const safeAdminNotes = escapeHtml(adminNotes);
  const safeDescription = escapeHtml(description);
  const safePurpose = escapeHtml(purpose);
  const safeCoordinator = escapeHtml(coordinatorName || recipientName);
  const safeContact = escapeHtml(contactNumber);
  const safeDept = escapeHtml(departmentName || 'Academic Unit');

  const templateVars: Record<string, string> = {
    bookingId: safeBookingId,
    hallName: safeHallName,
    eventName: safeEventName,
    bookingDate: safeDate,
    recipientName: safeRecipient,
    departmentName: safeDept,
    status: safeStatus,
    coordinatorName: safeCoordinator,
  };

  let subject = `Booking Update: ${hallName} [${bookingId}]`;
  let headline = `Your Facility Booking Request`;
  let leadParagraph = `Please find the latest update regarding your facility reservation below.`;
  let statusColor = '#2563EB';

  if (status === 'APPROVED') {
    subject = `Booking Confirmed: ${hallName} on ${bookingDate} [${bookingId}]`;
    headline = interpolateTemplate(emailConfig.approvedHeadline, templateVars);
    leadParagraph = interpolateTemplate(emailConfig.approvedMessage, templateVars);
    statusColor = '#059669';
  } else if (status === 'PENDING') {
    subject = `Booking Request Received: ${hallName} on ${bookingDate} [${bookingId}]`;
    headline = interpolateTemplate(emailConfig.pendingHeadline, templateVars);
    leadParagraph = interpolateTemplate(emailConfig.pendingMessage, templateVars);
    statusColor = '#D97706';
  } else if (status === 'REJECTED') {
    subject = `Booking Request Update: ${hallName} [${bookingId}]`;
    headline = interpolateTemplate(emailConfig.rejectedHeadline, templateVars);
    leadParagraph = interpolateTemplate(emailConfig.rejectedMessage, templateVars);
    statusColor = '#DC2626';
  } else if (status === 'CANCELLED') {
    subject = `Booking Cancelled: ${hallName} on ${bookingDate} [${bookingId}]`;
    headline = interpolateTemplate(emailConfig.cancelledHeadline, templateVars);
    leadParagraph = interpolateTemplate(emailConfig.cancelledMessage, templateVars);
    statusColor = '#475569';
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

  const sealPath = getSealImagePath();

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 14px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <!-- Top Branding Header with Circular Seal Logo -->
      <div style="background-color: #0f2b5c; padding: 22px 20px; text-align: center; color: #ffffff;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto; text-align: left;">
          <tr>
            ${sealPath ? `
            <td style="vertical-align: middle; padding-right: 16px;">
              <img src="cid:college-seal-logo" alt="College Seal" width="56" height="56" style="display: block; width: 56px; height: 56px; border-radius: 50%; border: 2px solid #ffffff; background-color: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.25);" />
            </td>
            ` : ''}
            <td style="vertical-align: middle;">
              <h1 style="margin: 0; font-size: 19px; font-weight: 800; color: #ffffff; letter-spacing: 0.3px; line-height: 1.25;">
                ${escapeHtml(emailConfig.headerTitle)}
              </h1>
              <p style="margin: 4px 0 0; font-size: 12px; color: #93c5fd; letter-spacing: 0.3px; line-height: 1.2;">
                ${escapeHtml(emailConfig.headerSubtitle)}
              </p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Status Banner -->
      <div style="background-color: ${statusColor}; padding: 12px 24px; text-align: center; color: #ffffff;">
        <span style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${headline}</span>
      </div>

      <div style="padding: 28px 24px;">
        <p style="font-size: 15px; color: #0f172a; margin: 0 0 12px;">Dear <strong>${safeRecipient}</strong>,</p>
        <p style="font-size: 14px; color: #334155; margin: 0 0 22px; line-height: 1.6;">${leadParagraph}</p>

        <!-- Main Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; width: 160px; font-weight: 500;">Booking Reference:</td>
            <td style="padding: 10px 0; font-weight: 700; color: #1d4ed8; font-family: monospace; font-size: 15px;">${safeBookingId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Event Name:</td>
            <td style="padding: 10px 0; font-weight: 700; color: #0f172a; font-size: 14px;">${safeEventName}</td>
          </tr>
          ${safePurpose ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Purpose / Objective:</td>
            <td style="padding: 10px 0; color: #334155;">${safePurpose}</td>
          </tr>
          ` : ''}
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Reserved Facility:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${safeHallName} <span style="font-size: 12px; color: #64748b; font-weight: 400;">(${safeLocation})</span></td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Date & Schedule:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${safeDate} &bull; ${safeTimeSlot}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Host Department:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${safeDept}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Coordinator In-charge:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${safeCoordinator} ${safeContact ? `<span style="color: #64748b; font-weight: 400;">(&bull; Phone: ${safeContact})</span>` : ''}</td>
          </tr>
          ${safeDescription ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 500; vertical-align: top;">Event Description:</td>
            <td style="padding: 10px 0; color: #334155; line-height: 1.5;">${safeDescription}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Status:</td>
            <td style="padding: 10px 0; font-weight: 800; color: ${statusColor}; font-size: 14px;">${safeStatus}</td>
          </tr>
        </table>

        <!-- Logistics & Store Requisition Summary -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 22px;">
          <h3 style="margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #0f2b5c; text-transform: uppercase; letter-spacing: 0.5px;">
            📦 Event Scale &amp; Store Requisition Summary
          </h3>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; color: #64748b; width: 45%;">Expected Attendees:</td>
              <td style="padding: 5px 0; font-weight: 700; color: #0f172a;">👥 ${participantCount || 0} Persons</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Chief Guests & Dignitaries:</td>
              <td style="padding: 5px 0; font-weight: 700; color: #b45309;">🎖️ ${guestCount || 0} Dignitaries</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Mementos / Shawls:</td>
              <td style="padding: 5px 0; font-weight: 700; color: #7e22ce;">🏆 ${mementoCount || 0} Units</td>
            </tr>
            ${reqItems.length > 0 ? `
            <tr>
              <td style="padding: 5px 0; color: #64748b; vertical-align: top;">Requested AV & Equipment:</td>
              <td style="padding: 5px 0; font-weight: 600; color: #1d4ed8;">⚡ ${reqItems.map(escapeHtml).join(' &bull; ')}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <!-- Official Admin Notice / Notes (if present) -->
        ${safeAdminNotes ? `
        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 16px; margin-bottom: 22px; font-size: 13px; color: #92400e;">
          <strong style="display: block; margin-bottom: 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px;">📌 Official Admin Instructions / Store Notice:</strong>
          <span>${safeAdminNotes}</span>
        </div>
        ` : ''}

        <!-- Rejection / Cancellation Reason (if present) -->
        ${safeReason ? `
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 16px; margin-bottom: 22px; font-size: 13px; color: #991b1b;">
          <strong style="display: block; margin-bottom: 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px;">⚠️ Reason / Administrative Remarks:</strong>
          <span>${safeReason}</span>
        </div>
        ` : ''}

        ${pdfBuffer ? `
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px 16px; font-size: 13px; color: #065f46; margin-bottom: 22px;">
          <span>📎 <strong>Official PDF Gate Pass &amp; Entry Ticket Attached:</strong> Please download or print the attached gate pass. It contains the security QR code and verified admission details.</span>
        </div>
        ` : ''}

        <!-- Important Guidelines in Simple English -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; font-size: 12px; color: #475569; line-height: 1.5;">
          <strong style="display: block; color: #0f172a; margin-bottom: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px;">
            📋 ${escapeHtml(emailConfig.guidelinesTitle)}
          </strong>
          <ul style="margin: 0; padding-left: 18px;">
            ${emailConfig.facultyGuidelines.map((item) => `<li style="margin-bottom: 4px;">${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 20px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.4;">
        <span>${escapeHtml(emailConfig.footerLine1)}</span><br />
        <span style="color: #94a3b8;">${escapeHtml(emailConfig.footerLine2)}</span>
      </div>
    </div>
  `;

  const activeTransporter = getTransporter();
  const mailAttachments: any[] = [];

  if (sealPath) {
    mailAttachments.push({
      filename: 'sairam-seal.png',
      path: sealPath,
      cid: 'college-seal-logo',
    });
  }

  if (pdfBuffer) {
    mailAttachments.push({
      filename: `Gate-Pass-${safeBookingId}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  }

  const recipientEmails = recipientList.map((r) => r.email).join(', ');

  if (activeTransporter) {
    try {
      await activeTransporter.sendMail({
        from: fromAddress,
        to: recipientEmails,
        subject,
        html: htmlContent,
        attachments: mailAttachments,
      });
      console.log(`[EmailService] Dispatched ${status} email with attachments to [${recipientEmails}] for booking ${bookingId}`);
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
    console.log(`  Attachments: ${mailAttachments.map(a => a.filename).join(', ')}`);
    console.log(`  Logistics: Attendees=${participantCount}, VIP Guests=${guestCount}, Mementos=${mementoCount}`);
    return true;
  }
}
