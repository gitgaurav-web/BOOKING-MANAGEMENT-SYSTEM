export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'FACULTY' | 'ADMIN' | 'SUPER_ADMIN';
  phone?: string;
  department?: string;
  departmentId?: string;
  status?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  _count?: { users: number; bookings: number };
}

export interface Hall {
  id: string;
  name: string;
  code: string;
  description: string;
  location: string;
  capacity: number; // Informational only
  image?: string;
  facilities: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  todayStatus?: 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE' | 'BLOCKED';
  todayBooking?: {
    eventName: string;
    startTime: string;
    endTime: string;
    department?: string;
  } | null;
  upcomingBookings?: {
    id: string;
    bookingId: string;
    eventName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    department?: string;
  }[];
}

export interface Booking {
  id: string;
  bookingId: string;
  userId: string;
  hallId: string;
  hall?: Hall;
  departmentId?: string;
  department?: Department;
  eventName: string;
  description?: string;
  purpose: string;
  requestedBy: string;
  coordinatorName?: string;
  contactNumber: string;
  email: string;
  bookingDate: string;
  endDate?: string;
  bookingType: 'FULL_DAY' | 'MORNING' | 'AFTERNOON' | 'CUSTOM';
  startTime: string;
  endTime: string;
  participantCount: number;
  specialRequirements: string[];
  attachmentUrl?: string;
  additionalNotes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  adminNotes?: string;
  rejectionReason?: string;
  approvedById?: string;
  approvedAt?: string;
  createdAt: string;
  user?: { name: string; email: string; phone?: string };
}

export interface BlockedDate {
  id: string;
  hallId?: string | null;
  hall?: Hall | null;
  startDate: string;
  endDate: string;
  reason: string;
  description?: string;
  createdAt: string;
}

export interface Maintenance {
  id: string;
  hallId: string;
  hall?: Hall;
  startDate: string;
  endDate: string;
  reason: string;
  notes?: string;
  responsiblePerson?: string;
  createdAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description?: string;
  hallScope: 'ALL' | 'SEMINAR_HALL' | 'AV_HALL' | string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  userId?: string;
  user?: { name: string; email: string; role: string };
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  createdAt: string;
}

export interface AvailabilitySlotEvent {
  bookingId: string;
  eventName: string;
  status: 'APPROVED' | 'PENDING';
  bookingType: string;
  startTime: string;
  endTime: string;
  department?: string;
  bookedBy?: string;
  purpose?: string;
}

export interface AvailabilityDayInfo {
  hallId: string;
  hallName: string;
  date: string;
  status: 'AVAILABLE' | 'BOOKED' | 'PENDING' | 'BLOCKED' | 'MAINTENANCE' | 'HOLIDAY';
  reason?: string;
  bookingId?: string;
  eventName?: string;
  bookingType?: string;
  startTime?: string;
  endTime?: string;
  department?: string;
  bookedBy?: string;
  purpose?: string;
  details?: Record<string, any>;
  events?: AvailabilitySlotEvent[];
  hasPending?: boolean;
  hasApproved?: boolean;
}
