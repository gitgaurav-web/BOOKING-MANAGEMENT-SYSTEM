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
}

const defaultSettings: SystemSettings = {
  siteName: 'Sri Sairam College Facility Booking Portal',
  institutionName: 'Sri Sairam College of Engineering',
  contactEmail: 'info@sairamce.edu.in',
  contactPhone: '080-27830221',
  address: 'Sai Leo Nagar, Guddanahalli Village, Samandur Post, Anekal, Bengaluru, Karnataka - 562106',
  academicSession: 'Academic Session 2026-27',
  accreditationText: 'Approved by AICTE · Affiliated to VTU Belagavi · NAAC Accredited',
  allowedEmailDomain: '',
  minAdvanceNoticeDays: '1',
  maxAdvanceNoticeDays: '90',
  requireAdminApproval: 'true',
  requireUserApproval: 'true',
  allowWeekendBookings: 'true',
  allowHolidayBookings: 'false',
  emailNotificationsEnabled: 'true',
  publicUpcomingDisplay: 'EVENT_TITLE',
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
