import nodemailer, { Transporter } from 'nodemailer';
import { prisma } from '../prisma';

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

export interface BookingEmailPayload {
  to: string;
  recipientName: string;
  bookingId: string;
  eventName: string;
  hallName: string;
  bookingDate: string;
  timeSlot: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string;
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

  const { to, recipientName, bookingId, eventName, hallName, bookingDate, timeSlot, status, rejectionReason } = payload;
  const fromAddress = process.env.SMTP_FROM || 'Seminar & AV Hall System <noreply@campus.edu>';

  let subject = `[${status}] Booking Request ${bookingId}: ${eventName}`;
  let headline = `Your Booking Request is ${status}`;
  let statusColor = '#3B82F6';

  if (status === 'APPROVED') {
    subject = `✅ Approved: Booking ${bookingId} - ${hallName}`;
    headline = 'Your Reservation Has Been Confirmed!';
    statusColor = '#10B981';
  } else if (status === 'REJECTED') {
    subject = `❌ Update: Booking Request ${bookingId} Rejected`;
    headline = 'Booking Request Could Not Be Approved';
    statusColor = '#EF4444';
  } else if (status === 'CANCELLED') {
    subject = `⚠️ Cancelled: Booking Request ${bookingId}`;
    headline = 'Facility Booking Has Been Cancelled';
    statusColor = '#64748B';
  } else if (status === 'PENDING') {
    subject = `⏳ Received: Booking Request ${bookingId} Under Review`;
    headline = 'Booking Request Submitted Successfully';
    statusColor = '#F59E0B';
  }

  // HTML escape all user inputs to prevent markup injection
  const safeRecipient = escapeHtml(recipientName);
  const safeBookingId = escapeHtml(bookingId);
  const safeEventName = escapeHtml(eventName);
  const safeHallName = escapeHtml(hallName);
  const safeBookingDate = escapeHtml(bookingDate);
  const safeTimeSlot = escapeHtml(timeSlot);
  const safeStatus = escapeHtml(status);
  const safeReason = escapeHtml(rejectionReason);

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: ${statusColor}; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Facility Booking System</h1>
        <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Seminar Hall & AV Hall Management</p>
      </div>
      <div style="padding: 28px;">
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px;">Dear <strong>${safeRecipient}</strong>,</p>
        <p style="font-size: 14px; color: #475569; margin: 0 0 20px;">${headline}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; width: 140px;">Booking Reference:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${safeBookingId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Event Name:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${safeEventName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Reserved Hall:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${safeHallName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Date & Slot:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${safeBookingDate} (${safeTimeSlot})</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b;">Current Status:</td>
            <td style="padding: 10px 0; font-weight: 700; color: ${statusColor};">${safeStatus}</td>
          </tr>
          ${safeReason ? `
          <tr style="border-top: 1px solid #fee2e2; background-color: #fef2f2;">
            <td style="padding: 10px 8px; color: #991b1b;">Reason / Notes:</td>
            <td style="padding: 10px 8px; font-weight: 600; color: #991b1b;">${safeReason}</td>
          </tr>
          ` : ''}
        </table>

        <div style="background-color: #f8fafc; border-radius: 8px; padding: 14px; font-size: 12px; color: #64748b;">
          Please retain this email as confirmation of your facility requisition. For changes or queries, contact the Facilities Administration Desk.
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
        Institutional AV & Seminar Hall Management System • Automated Notification
      </div>
    </div>
  `;

  const activeTransporter = getTransporter();

  if (activeTransporter) {
    try {
      await activeTransporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html: htmlContent,
      });
      console.log(`[EmailService] Dispatched ${status} email to ${to} for booking ${bookingId}`);
      return true;
    } catch (err) {
      console.error(`[EmailService] Failed to send email via SMTP to ${to}:`, err);
      return false;
    }
  } else {
    // Development fallback / preview logging
    console.log(`[EmailService - Simulated Outbound Delivery]`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Event: ${eventName} (${hallName})`);
    console.log(`  Status: ${status}`);
    return true;
  }
}
