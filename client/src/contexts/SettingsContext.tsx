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
