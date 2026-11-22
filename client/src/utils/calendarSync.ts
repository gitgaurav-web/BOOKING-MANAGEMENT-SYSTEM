import { Booking } from '../types';

export function parseIstToUtc(dateStr: string, timeStr: string): Date {
  const [year, month, day] = (dateStr || '').split('-').map(Number);
  const [hour, minute] = (timeStr || '08:30').split(':').map(Number);
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const localUtcBase = Date.UTC(year || 2026, (month || 1) - 1, day || 1, hour || 8, minute || 30, 0);
  return new Date(localUtcBase - istOffsetMs);
}

export function formatCalendarUtc(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    dt.getUTCFullYear() +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    'T' +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    pad(dt.getUTCSeconds()) +
    'Z'
  );
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n');
}

export interface CalendarEventPayload {
  eventName: string;
  vehicleName?: string;
  hallName?: string;
  hallLocation?: string;
  registrationNo?: string;
  destination?: string;
  bookingDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  bookingId?: string;
  departmentName?: string;
  coordinatorName?: string;
  contactNumber?: string;
  purpose?: string;
  driverName?: string;
}

export function extractEventPayload(booking: Partial<Booking>): CalendarEventPayload {
  return {
    eventName: booking.tripTitle || 'Campus Vehicle Trip',
    vehicleName: booking.vehicle?.name || 'College Vehicle',
    registrationNo: booking.vehicle?.registrationNo || 'KA-51',
    destination: booking.dropLocation || 'Bengaluru',
    bookingDate: booking.startDate || new Date().toISOString().slice(0, 10),
    endDate: booking.endDate || booking.startDate,
    startTime: booking.departureTime || '08:30',
    endTime: booking.returnTime || '18:00',
    bookingId: booking.bookingId || 'TRIP-PASS',
    departmentName: booking.department?.name || 'Department',
    coordinatorName: booking.coordinatorName || 'Faculty Coordinator',
    contactNumber: booking.coordinatorPhone || '',
    purpose: booking.tripPurpose || 'Official Travel',
    driverName: booking.assignedDriverName || booking.vehicle?.driverName || 'Designated Driver',
  };
}

export function generateIcsContent(data: CalendarEventPayload): string {
  const startDate = parseIstToUtc(data.bookingDate, data.startTime);
  const endDate = parseIstToUtc(data.endDate || data.bookingDate, data.endTime);
  const dtStamp = formatCalendarUtc(new Date());
  const dtStart = formatCalendarUtc(startDate);
  const dtEnd = formatCalendarUtc(endDate);

  const title = `[Sri Sairam Transport] ${data.eventName} (${data.vehicleName})`;
  const location = `${data.destination} (Pickup: Campus Gate 1)`;
  const description = [
    `SRI SAIRAM COLLEGE OF ENGINEERING - CENTRAL TRANSPORT TRIP PASS`,
    `Trip: ${data.eventName}`,
    `Vehicle: ${data.vehicleName} [${data.registrationNo}]`,
    `Destination: ${data.destination}`,
    `Driver: ${data.driverName}`,
    `Booking Ref: ${data.bookingId}`,
    `Coordinator: ${data.coordinatorName} (${data.contactNumber})`,
    `Official Portal: https://sairamce.edu.in`,
  ].join('\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sri Sairam College of Engineering//Fleet Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${data.bookingId || Date.now()}@sairamce.edu.in`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcsFile(data: CalendarEventPayload): void {
  const icsText = generateIcsContent(data);
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeName = (data.eventName || 'Trip').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 25);
  anchor.href = url;
  anchor.download = `Sairam-Trip-${safeName}-${data.bookingDate}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(data: CalendarEventPayload): string {
  const startDate = parseIstToUtc(data.bookingDate, data.startTime);
  const endDate = parseIstToUtc(data.endDate || data.bookingDate, data.endTime);
  const dtStart = formatCalendarUtc(startDate);
  const dtEnd = formatCalendarUtc(endDate);

  const title = `[Sri Sairam] ${data.eventName} (${data.vehicleName})`;
  const location = `${data.destination} (Pickup: Campus Gate 1)`;
  const details = [
    `Sri Sairam College of Engineering - Vehicle Requisition`,
    `• Trip ID: ${data.bookingId}`,
    `• Vehicle: ${data.vehicleName} (${data.registrationNo})`,
    `• Driver: ${data.driverName}`,
    `• Coordinator: ${data.coordinatorName}`,
    `• Destination: ${data.destination}`,
  ].join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${dtStart}/${dtEnd}`,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getOutlookCalendarUrl(data: CalendarEventPayload): string {
  const startDate = parseIstToUtc(data.bookingDate, data.startTime);
  const endDate = parseIstToUtc(data.endDate || data.bookingDate, data.endTime);

  const title = `[Sri Sairam] ${data.eventName} (${data.vehicleName})`;
  const location = `${data.destination} (Campus Gate 1)`;
  const body = `Trip ID: ${data.bookingId}\nVehicle: ${data.vehicleName}\nDriver: ${data.driverName}\nCoordinator: ${data.coordinatorName}`;

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: body,
    location: location,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
