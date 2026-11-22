import { prisma } from '../prisma';

export interface DriverNotificationPayload {
  driverName: string;
  driverPhone: string;
  bookingId: string;
  vehicleName: string;
  vehicleRegistrationNo: string;
  tripTitle: string;
  startDate: string;
  endDate?: string | null;
  startTime: string;
  endTime: string;
  pickupLocation: string;
  dropLocation: string;
  passengerCount: number;
  coordinatorName: string;
  coordinatorPhone: string;
  purpose?: string;
}

export interface DriverNotificationResult {
  success: boolean;
  driverPhone: string;
  driverName: string;
  waMeUrl: string;
  message: string;
  smsDispatched: boolean;
  whatsappDispatched: boolean;
}

/**
 * Format clean Indian mobile number (e.g., "9845012345" or "+91 98450 12345" -> "919845012345")
 */
export function formatCleanPhone(rawPhone: string): string {
  const digitsOnly = rawPhone.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly;
  }
  return digitsOnly;
}

/**
 * Compose official collegiate Sri Sairam College driver trip assignment text
 */
export function composeDriverTripMessage(payload: DriverNotificationPayload): string {
  const dateStr = payload.endDate && payload.endDate !== payload.startDate
    ? `${payload.startDate} to ${payload.endDate}`
    : payload.startDate;

  return `🚌 *SRI SAIRAM COLLEGE OF ENGINEERING*
📍 *Central Transport Desk — Driver Trip Assignment*

Dear Driver *${payload.driverName || 'Staff Driver'}*,
You have been assigned for an official campus trip requisition:

🔖 *Requisition ID:* ${payload.bookingId}
🚍 *Assigned Vehicle:* ${payload.vehicleName} (${payload.vehicleRegistrationNo})
🎯 *Trip / Purpose:* ${payload.tripTitle}
📅 *Date of Travel:* ${dateStr}
⏰ *Shift Timings:* ${payload.startTime} to ${payload.endTime}
📍 *Pickup Location:* ${payload.pickupLocation}
🏁 *Destination Drop:* ${payload.dropLocation}
👥 *Passenger Headcount:* ${payload.passengerCount} Passengers
👤 *Faculty Coordinator:* ${payload.coordinatorName}
📞 *Coordinator Contact:* ${payload.coordinatorPhone}

⚠️ *Driver Instruction:* Please report to Campus Main Gate 1 Transport Bay at least 15 minutes before departure. Ensure tire pressure, fuel check, and official trip logbook are verified before passenger boarding.`;
}

/**
 * Send SMS and generate instant WhatsApp Click-to-Chat URL for driver
 */
export async function sendDriverTripAssignmentSmsWhatsApp(
  payload: DriverNotificationPayload
): Promise<DriverNotificationResult> {
  const cleanPhone = formatCleanPhone(payload.driverPhone);
  const message = composeDriverTripMessage(payload);
  const waMeUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  let smsDispatched = false;
  let whatsappDispatched = false;

  // 1. External SMS / WhatsApp Gateway Integration
  const smsGatewayUrl = process.env.SMS_GATEWAY_URL;
  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const whatsappToken = process.env.WHATSAPP_API_TOKEN;

  if (whatsappApiUrl && whatsappToken) {
    try {
      const waResponse = await fetch(whatsappApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${whatsappToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: message },
        }),
      });
      whatsappDispatched = waResponse.ok;
    } catch (waErr) {
      console.warn('Direct WhatsApp Cloud API dispatch warning:', waErr);
    }
  }

  if (smsGatewayUrl) {
    try {
      const smsResponse = await fetch(smsGatewayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cleanPhone,
          message: message.replace(/\*/g, ''), // Strip markdown stars for plain SMS
          senderId: 'SAIRAM',
        }),
      });
      smsDispatched = smsResponse.ok;
    } catch (smsErr) {
      console.warn('Direct SMS gateway dispatch warning:', smsErr);
    }
  }

  // Always mark logged in development/production console
  console.log(`[DRIVER DISPATCH NOTIFICATION] Generated for ${payload.driverName} (${payload.driverPhone})`);
  console.log(`[WHATSAPP LINK] ${waMeUrl}`);

  return {
    success: true,
    driverPhone: payload.driverPhone,
    driverName: payload.driverName,
    waMeUrl,
    message,
    smsDispatched,
    whatsappDispatched,
  };
}
