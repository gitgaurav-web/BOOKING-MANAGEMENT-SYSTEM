import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export interface SystemSettings {
  siteName: string;
  institutionName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  academicSession: string;
  accreditationText: string;
  allowedEmailDomain: string;
  minAdvanceNoticeDays: string;
  maxAdvanceNoticeDays: string;
  requireAdminApproval: string;
  requireUserApproval: string;
  allowWeekendBookings: string;
  allowHolidayBookings: string;
  emailNotificationsEnabled: string;
  publicUpcomingDisplay: string;
  transportOfficerEmail?: string;
  gateSecurityPhone?: string;
  bookingTermsAndConditions?: string;
  // Super Admin Email Customization
  emailHeaderTitle?: string;
  emailHeaderSubtitle?: string;
  emailApprovedHeadline?: string;
  emailApprovedMessage?: string;
  emailPendingHeadline?: string;
  emailPendingMessage?: string;
  emailRejectedHeadline?: string;
  emailRejectedMessage?: string;
  emailCancelledHeadline?: string;
  emailCancelledMessage?: string;
  emailGuidelinesTitle?: string;
  emailFacultyGuidelines?: string;
  emailFooterLine1?: string;
  emailFooterLine2?: string;
}

export const DEFAULT_BOOKING_TERMS: string[] = [
  'Institutional vehicles (Cars, Buses, Vans) are exclusively for authorized academic, research, sports, or official college visits.',
  'Only official requests forwarded with HOD approval and faculty coordinator undertaking will be confirmed by Transport Office.',
  'Drivers must NOT be instructed to exceed speed governor limits (Max 40-60 km/h as per campus and state RTO regulations).',
  'Smoking, consumption of alcohol, or hazardous items inside campus vehicles is strictly prohibited and subject to disciplinary action.',
  'Faculty coordinator traveling must verify passenger headcount before departure and upon return at Campus Security Gate 1.',
  'Toll receipts, parking vouchers, and fuel slips must be certified by the Faculty Coordinator and submitted to Accounts within 48 hours.',
  'Night halts require prior written sanction from the Principal / Transport Officer during booking requisition.',
  'In the event of road breakdown or emergency, immediately notify the Central Transport Helpdesk and Security Gate Control.',
];

export const DEFAULT_EMAIL_GUIDELINES: string[] = [
  'Security Gate Pass: Present the digital or printed QR Gate Pass at College Gate 1 security before vehicle departure.',
  'Driver Trip Sheet: Faculty coordinator must verify start and closing odometer readings on the driver trip log.',
  'Student List: Submit a signed student nominal roll with guardian contact numbers to Campus Security before boarding.',
  'Emergency Helpline: College Central Security: 080-27830221 / Transport Officer: +91 98765 00014.',
];

export const DEFAULT_EMAIL_SETTINGS = {
  emailHeaderTitle: 'SRI SAIRAM COLLEGE OF ENGINEERING',
  emailHeaderSubtitle: 'Central Transport Office • Institutional Fleet & Vehicle Portal',
  emailApprovedHeadline: 'Your Vehicle Reservation & Gate Pass is Approved!',
  emailApprovedMessage: 'Great news! Your campus vehicle booking for {vehicleName} has been approved by the Transport Office. Your official Transport Security Gate Pass & Driver Trip Sheet is attached.',
  emailPendingHeadline: 'Vehicle Requisition Received & Under Review',
  emailPendingMessage: 'Thank you for submitting your transport requisition. Your booking request for {vehicleName} has been received and is currently under review by the Central Transport Desk.',
  emailRejectedHeadline: 'Vehicle Requisition Could Not Be Approved',
  emailRejectedMessage: 'We regret to inform you that your vehicle requisition for {vehicleName} on {bookingDate} could not be approved at this time.',
  emailCancelledHeadline: 'Vehicle Reservation Cancelled',
  emailCancelledMessage: 'This is to inform you that your reservation for {vehicleName} on {bookingDate} has been cancelled. The vehicle has been restored to the active fleet roster.',
  emailGuidelinesTitle: 'Important Guidelines for Traveling Coordinator:',
  emailFacultyGuidelines: JSON.stringify(DEFAULT_EMAIL_GUIDELINES),
  emailFooterLine1: 'Central Transport Logistics Office • Sri Sairam College of Engineering',
  emailFooterLine2: 'Sai Leo Nagar, Guddanahalli Village, Anekal, Bengaluru, Karnataka • Transport Desk: transport@sairamce.edu.in',
};

export const parseBookingTerms = (termsString?: string): string[] => {
  if (!termsString) return DEFAULT_BOOKING_TERMS;
  try {
    const parsed = JSON.parse(termsString);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const cleaned = parsed.map((item) => String(item).trim()).filter(Boolean);
      if (cleaned.length > 0) return cleaned;
    }
  } catch {
    const lines = termsString.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) return lines;
  }
  return DEFAULT_BOOKING_TERMS;
};

export const parseEmailGuidelines = (raw?: string): string[] => {
  if (!raw) return DEFAULT_EMAIL_GUIDELINES;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const cleaned = parsed.map((item) => String(item).trim()).filter(Boolean);
      if (cleaned.length > 0) return cleaned;
    }
  } catch {
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) return lines;
  }
  return DEFAULT_EMAIL_GUIDELINES;
};

const defaultSettings: SystemSettings = {
  siteName: 'Sri Sairam College Transport & Vehicle Portal',
  institutionName: 'Sri Sairam College of Engineering',
  contactEmail: 'transport@sairamce.edu.in',
  contactPhone: '080-27830221',
  address: 'Sai Leo Nagar, Guddanahalli Village, Samandur Post, Anekal, Bengaluru, Karnataka - 562106',
  academicSession: 'Academic Session 2026-27',
  accreditationText: 'Approved by AICTE · Affiliated to VTU Belagavi · NAAC Accredited',
  allowedEmailDomain: 'sairamce.edu.in',
  minAdvanceNoticeDays: '0',
  maxAdvanceNoticeDays: '90',
  requireAdminApproval: 'true',
  requireUserApproval: 'true',
  allowWeekendBookings: 'true',
  allowHolidayBookings: 'false',
  emailNotificationsEnabled: 'true',
  publicUpcomingDisplay: 'EVENT_TITLE',
  transportOfficerEmail: 'transport@sairamce.edu.in',
  gateSecurityPhone: '+91 98765 00019',
  bookingTermsAndConditions: JSON.stringify(DEFAULT_BOOKING_TERMS),
  ...DEFAULT_EMAIL_SETTINGS,
};

interface SettingsContextType {
  settings: SystemSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSettings = async () => {
    try {
      const data = await apiRequest<Record<string, string>>('/settings');
      if (data && typeof data === 'object') {
        setSettings((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch {
      // Use fallback defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
