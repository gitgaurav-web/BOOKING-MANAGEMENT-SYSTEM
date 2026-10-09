import { Booking } from '../types';

/**
 * Parses date (YYYY-MM-DD) and time (HH:mm) assuming Indian Standard Time (IST, UTC+05:30)
 * and returns the exact corresponding UTC Date object.
 */
export function parseIstToUtc(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = (timeStr || '09:00').split(':').map(Number);
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const localUtcBase = Date.UTC(year, month - 1, day, hour, minute, 0);
  return new Date(localUtcBase - istOffsetMs);
}

/**
 * Formats a Date to iCal/Google timestamp format: YYYYMMDDTHHMMSSZ
 */
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

/**
 * Escapes special characters for iCalendar format according to RFC 5545
 */
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
  hallName: string;
  hallLocation?: string;
  bookingDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  bookingId?: string;
  departmentName?: string;
  coordinatorName?: string;
  contactNumber?: string;
  purpose?: string;
}

export function extractEventPayload(booking: Partial<Booking>): CalendarEventPayload {
  return {
    eventName: booking.eventName || 'Campus Facility Booking',
    hallName: booking.hall?.name || 'Seminar Hall',
    hallLocation: booking.hall?.location || 'Main Academic Block',
    bookingDate: booking.bookingDate || new Date().toISOString().slice(0, 10),
    endDate: booking.endDate || booking.bookingDate,
    startTime: booking.startTime || '09:00',
    endTime: booking.endTime || '17:00',
    bookingId: booking.bookingId || 'SB-PASS',
    departmentName: booking.department?.name || 'Academic Department',
    coordinatorName: booking.coordinatorName || booking.requestedBy || 'Faculty Coordinator',
    contactNumber: booking.contactNumber || '',
    purpose: booking.purpose || 'Institutional Event',
  };
}

/**
 * Builds standard RFC 5545 iCalendar (.ics) string
 */
export function generateIcsContent(data: CalendarEventPayload): string {
  const startDate = parseIstToUtc(data.bookingDate, data.startTime);
  const endDate = parseIstToUtc(data.endDate || data.bookingDate, data.endTime);
  const dtStamp = formatCalendarUtc(new Date());
  const dtStart = formatCalendarUtc(startDate);
  const dtEnd = formatCalendarUtc(endDate);

  const title = `[Sri Sairam] ${data.eventName} - ${data.hallName}`;
  const location = `${data.hallName}, Sri Sairam College of Engineering, Anekal, Bengaluru - 562106`;
  const description = [
    `SRI SAIRAM COLLEGE OF ENGINEERING - CENTRAL FACILITY PASS`,
    `Event: ${data.eventName}`,
    `Facility: ${data.hallName} (${data.hallLocation || 'Campus'})`,
    `Booking Reference: ${data.bookingId}`,
    `Department: ${data.departmentName}`,
    `Coordinator: ${data.coordinatorName}${data.contactNumber ? ` (${data.contactNumber})` : ''}`,
    `Purpose: ${data.purpose}`,
    `Official Portal: https://sairamce.edu.in`,
  ].join('\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sri Sairam College of Engineering//Facility Booking System//EN',
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

/**
 * Triggers a browser file download for the .ics calendar file
 */
export function downloadIcsFile(data: CalendarEventPayload): void {
  const icsText = generateIcsContent(data);
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeName = (data.eventName || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 25);
  anchor.href = url;
  anchor.download = `Sairam-${safeName}-${data.bookingDate}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Generates direct one-click Google Calendar web URL
 */
export function getGoogleCalendarUrl(data: CalendarEventPayload): string {
  const startDate = parseIstToUtc(data.bookingDate, data.startTime);
  const endDate = parseIstToUtc(data.endDate || data.bookingDate, data.endTime);
  const dtStart = formatCalendarUtc(startDate);
  const dtEnd = formatCalendarUtc(endDate);

  const title = `[Sri Sairam] ${data.eventName} (${data.hallName})`;
  const location = `${data.hallName}, Sri Sairam College of Engineering, Anekal, Bengaluru - 562106`;
  const details = [
    `Sri Sairam College of Engineering - Central Facility Reservation`,
    `• Booking ID: ${data.bookingId}`,
    `• Venue: ${data.hallName}`,
    `• Department: ${data.departmentName}`,
    `• Coordinator: ${data.coordinatorName}`,
    `• Purpose: ${data.purpose}`,
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

/**
 * Generates direct Outlook / Office 365 web calendar URL
 */
export function getOutlookCalendarUrl(data: CalendarEventPayload): string {
  const startDate = parseIstToUtc(data.bookingDate, data.startTime);
  const endDate = parseIstToUtc(data.endDate || data.bookingDate, data.endTime);

  const title = `[Sri Sairam] ${data.eventName} (${data.hallName})`;
  const location = `${data.hallName}, Sri Sairam College of Engineering, Anekal, Bengaluru`;
  const body = `Booking Ref: ${data.bookingId}\nVenue: ${data.hallName}\nDepartment: ${data.departmentName}\nCoordinator: ${data.coordinatorName}`;

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
