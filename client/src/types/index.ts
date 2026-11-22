export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'FACULTY' | 'ADMIN' | 'SUPER_ADMIN';
  phone?: string;
  department?: Department | string | null;
  departmentId?: string | null;
  status?: string;
  createdAt?: string;
  _count?: { bookings: number };
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  _count?: { users: number; bookings: number };
}

export interface Vehicle {
  id: string;
  name: string; // e.g., Ashok Leyland College Bus 12, Toyota Innova Staff Car, Force Traveller Van
  registrationNo: string; // e.g., KA-51-E-1234
  code?: string; // Optional code (e.g., CAR-01, BUS-12)
  vehicleType: string; // BUS, CAR, VAN, AMBULANCE
  location?: string; // Campus Main Bay / Portico
  description?: string;
  capacity: number; // Passenger seats
  fuelType: string; // DIESEL, PETROL, EV, CNG
  acAvailable: boolean;
  image?: string;
  features: string[]; // JSON array
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  driverName?: string | null;
  driverPhone?: string | null;
  todayStatus?: 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE' | 'BLOCKED';
  todayBooking?: {
    eventName?: string;
    tripTitle?: string;
    startTime?: string;
    endTime?: string;
    departureTime?: string;
    returnTime?: string;
    department?: string;
  } | null;
  upcomingBookings?: {
    id: string;
    bookingId: string;
    eventName?: string;
    tripTitle?: string;
    bookingDate?: string;
    startDate?: string;
    startTime?: string;
    endTime?: string;
    departureTime?: string;
    returnTime?: string;
    department?: string;
  }[];
}

export type Hall = Vehicle;

export interface Booking {
  id: string;
  bookingId: string; // e.g. BUS-NOV26-001, CAR-NOV26-002
  userId: string;
  vehicleId: string;
  vehicle?: Vehicle;
  hallId?: string; // Hall alias
  hall?: Vehicle; // Hall alias
  departmentId?: string;
  department?: Department;

  // Event & Trip Information (Unified for Hall and Vehicle)
  eventName: string; // Trip title or Event name
  tripTitle?: string;
  description?: string;
  purpose: string;
  tripPurpose?: string;
  requestedBy: string;
  coordinatorName: string;
  contactNumber: string;
  coordinatorPhone?: string;
  email: string;

  // Schedule & Route
  bookingDate: string; // YYYY-MM-DD
  startDate?: string; // Alias
  endDate?: string; // YYYY-MM-DD
  bookingType: string; // FULL_DAY, MORNING, AFTERNOON, CUSTOM
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  departureTime?: string;
  returnTime?: string;

  // Logistics & Passengers
  pickupLocation?: string;
  dropLocation?: string;
  passengerCount: number;
  participantCount?: number;
  guestCount?: number;
  mementoCount?: number;
  estimatedKilometers?: number;
  tollPaymentRequired?: boolean;

  // Requisitions & Attachments
  specialRequirements: string[];
  attachmentUrl?: string;
  additionalNotes?: string;

  // Workflow & Dispatch
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  driverNotifiedAt?: string;
  driverNotifyMethod?: string;
  adminNotes?: string;
  rejectionReason?: string;
  approvedById?: string;
  approvedAt?: string;
  odometerStart?: number;
  odometerEnd?: number;
  createdAt: string;
  user?: { name: string; email: string; phone?: string };
}

export interface BlockedDate {
  id: string;
  vehicleId?: string | null;
  vehicle?: Vehicle | null;
  hallId?: string | null;
  hall?: Vehicle | null;
  startDate: string;
  endDate: string;
  reason: string;
  description?: string;
  createdAt: string;
}

export interface Maintenance {
  id: string;
  vehicleId?: string;
  vehicle?: Vehicle;
  hallId?: string;
  hall?: Vehicle;
  startDate: string;
  endDate: string;
  reason: string;
  notes?: string;
  responsiblePerson?: string;
  maintenanceType?: string;
  garageName?: string;
  cost?: number;
  createdAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description?: string;
  hallScope?: string;
  vehicleScope?: string;
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
  tripTitle?: string;
  status: 'APPROVED' | 'PENDING';
  bookingType: string;
  startTime: string;
  endTime: string;
  departureTime?: string;
  returnTime?: string;
  department?: string;
  bookedBy?: string;
  purpose?: string;
  participantCount?: number;
  passengerCount?: number;
}

export interface AvailabilityDayInfo {
  vehicleId?: string;
  vehicleName?: string;
  hallId: string;
  hallName: string;
  date: string;
  status: 'AVAILABLE' | 'BOOKED' | 'PENDING' | 'BLOCKED' | 'MAINTENANCE' | 'HOLIDAY' | 'PARTIAL';
  reason?: string;
  bookingId?: string;
  eventName?: string;
  tripTitle?: string;
  bookingType?: string;
  startTime?: string;
  endTime?: string;
  departureTime?: string;
  returnTime?: string;
  department?: string;
  bookedBy?: string;
  purpose?: string;
  participantCount?: number;
  passengerCount?: number;
  details?: Record<string, any>;
  events?: AvailabilitySlotEvent[];
  hasPending?: boolean;
  hasApproved?: boolean;
  freeSlots?: string[];
  occupiedSlots?: string[];
  freeWindows?: Array<{ start: string; end: string }>;
}

export interface RouteStop {
  id: string;
  name: string;
  timeMorning: string;
  timeEvening: string;
  latitude: number;
  longitude: number;
  isCollege?: boolean;
}

export interface CampusRoute {
  id: string;
  routeNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  vehicleType: 'BUS' | 'VAN' | 'CAR';
  vehicleName: string;
  registrationNo: string;
  acAvailable: boolean;
  totalSeats: number;
  availableSeats: number;
  driverName: string;
  driverPhone: string;
  status: 'ON_TIME' | 'DELAYED_10M' | 'BOARDING' | 'MAINTENANCE';
  currentSpeedKmH: number;
  distanceKm: number;
  estimatedDurationMins: number;
  stops: RouteStop[];
  matchedStop?: RouteStop;
}
