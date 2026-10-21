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
  customEquipmentCatalog?: string;
  iqacNotificationEmail?: string;
  storeNotificationEmail?: string;
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
  'Sticking posters or notices on walls is strictly prohibited.',
  'Use of double-sided tape, glue, nails, or any adhesive on walls is not allowed.',
  'Any damage to walls, furniture, equipment, or other facilities must be repaired at the cost of the hosting department.',
  'Furniture must be handled carefully and returned to its original arrangement after use.',
  'All audio-visual equipment must be handled carefully. Unauthorised operation is not permitted.',
  'Food and beverages are not permitted inside.',
  'Any decorations or banners must be approved in advance.',
  'Lights, AC, projectors, and other equipment must be switched off after use.',
  'The hall must be vacated on time and left in proper condition.',
  'Any damage or technical issues must be reported to the concerned authority immediately.',
  'The hosting department is responsible for ensuring that all participants follow these rules.',
];

export const DEFAULT_EMAIL_GUIDELINES: string[] = [
  'Entry Pass: Please present the attached PDF Gate Pass at the campus security gate and hall entrance.',
  'Keys & AV Setup: Collect the hall key and verify equipment with the Store & Estate Office before your program starts.',
  'Hall Decorum: Food, colored beverages, and sticking adhesive tapes or nails on walls/furniture are strictly prohibited.',
  'Post-Event Checklist: Ensure all lights, projectors, and air conditioning units are switched off immediately upon conclusion.',
];

export const DEFAULT_EMAIL_SETTINGS = {
  emailHeaderTitle: 'SRI SAIRAM COLLEGE OF ENGINEERING',
  emailHeaderSubtitle: 'Central Facilities Office • Official Campus Reservation Service',
  emailApprovedHeadline: 'Your Facility Reservation is Confirmed!',
  emailApprovedMessage: 'Great news! Your booking request for {hallName} has been approved by the administration. Your official Event Gate Pass & Entry Ticket is attached to this email as a PDF.',
  emailPendingHeadline: 'Booking Request Received & Under Review',
  emailPendingMessage: 'Thank you for submitting your booking request. Your reservation for {hallName} has been received and is currently under review by the Central Facilities Office. You will receive a confirmation once it is approved.',
  emailRejectedHeadline: 'Booking Request Could Not Be Approved',
  emailRejectedMessage: 'We regret to inform you that your reservation request for {hallName} on {bookingDate} could not be approved at this time.',
  emailCancelledHeadline: 'Facility Reservation Cancelled',
  emailCancelledMessage: 'This is to inform you that your reservation for {hallName} on {bookingDate} has been cancelled. The facility has been released and is open for other campus events.',
  emailGuidelinesTitle: 'Important Guidelines for Faculty Coordinator:',
  emailFacultyGuidelines: JSON.stringify(DEFAULT_EMAIL_GUIDELINES),
  emailFooterLine1: 'Central Facilities Office • Sri Sairam College of Engineering',
  emailFooterLine2: 'Sai Leo Nagar, Guddanahalli Village, Anekal, Bengaluru, Karnataka • Helpdesk: facilities@sairamce.edu.in',
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
  siteName: 'Sri Sairam College Facility Booking Portal',
  institutionName: 'Sri Sairam College of Engineering',
  contactEmail: 'info@sairamce.edu.in',
  contactPhone: '080-27830221',
  address: 'Sai Leo Nagar, Guddanahalli Village, Samandur Post, Anekal, Bengaluru, Karnataka - 562106',
  academicSession: 'Academic Session 2026-27',
  accreditationText: 'Approved by AICTE · Affiliated to VTU Belagavi · NAAC Accredited',
  allowedEmailDomain: '',
  minAdvanceNoticeDays: '0',
  maxAdvanceNoticeDays: '90',
  requireAdminApproval: 'true',
  requireUserApproval: 'true',
  allowWeekendBookings: 'true',
  allowHolidayBookings: 'false',
  emailNotificationsEnabled: 'true',
  publicUpcomingDisplay: 'EVENT_TITLE',
  customEquipmentCatalog: '',
  iqacNotificationEmail: 'iqac@sairamce.edu.in',
  storeNotificationEmail: 'store@sairamce.edu.in',
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
