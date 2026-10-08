import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export const AdminSettingsPage: React.FC = () => {
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/settings');
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      await refreshSettings();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          System Customization & Booking Rules
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure institutional identity, advance reservation window limits, and notification behavior.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>System configuration saved successfully!</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-8"
      >
        {/* Section 1: Institutional Identity */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            1. Institutional Branding
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                College / Organization Name
              </label>
              <input
                type="text"
                value={settings.institutionName || ''}
                onChange={(e) => handleChange('institutionName', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Facilities Helpdesk Email
              </label>
              <input
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Facilities Contact Phone
              </label>
              <input
                type="text"
                value={settings.contactPhone || ''}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Campus Location Address
              </label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Booking Rules */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            2. Booking Policies & Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Advance Booking Notice (Days)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={settings.minAdvanceNoticeDays || '1'}
                onChange={(e) => handleChange('minAdvanceNoticeDays', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Maximum Advance Booking Window (Days)
              </label>
              <input
                type="number"
                min="7"
                max="365"
                value={settings.maxAdvanceNoticeDays || '90'}
                onChange={(e) => handleChange('maxAdvanceNoticeDays', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="weekendPolicy"
                checked={settings.allowWeekendBookings === 'true'}
                onChange={(e) => handleChange('allowWeekendBookings', String(e.target.checked))}
                className="rounded text-blue-600 h-4 w-4"
              />
              <label htmlFor="weekendPolicy" className="text-slate-700 dark:text-slate-300 font-medium">
                Allow Weekend Bookings (Saturday & Sunday)
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="holidayPolicy"
                checked={settings.allowHolidayBookings === 'true'}
                onChange={(e) => handleChange('allowHolidayBookings', String(e.target.checked))}
                className="rounded text-blue-600 h-4 w-4"
              />
              <label htmlFor="holidayPolicy" className="text-slate-700 dark:text-slate-300 font-medium">
                Allow Bookings on Institutional Holidays
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="approvalPolicy"
                checked={settings.requireAdminApproval !== 'false'}
                onChange={(e) => handleChange('requireAdminApproval', String(e.target.checked))}
                className="rounded text-blue-600 h-4 w-4"
              />
              <label htmlFor="approvalPolicy" className="text-slate-700 dark:text-slate-300 font-medium">
                Require Admin Approval for All Requests (Disable for instant auto-approval)
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="userApprovalPolicy"
                checked={settings.requireUserApproval === 'true'}
                onChange={(e) => handleChange('requireUserApproval', String(e.target.checked))}
                className="rounded text-blue-600 h-4 w-4"
              />
              <label htmlFor="userApprovalPolicy" className="text-slate-700 dark:text-slate-300 font-medium">
                Require Admin Approval for New User Accounts (Accounts start as Inactive until verified)
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="emailNotif"
                checked={settings.emailNotificationsEnabled === 'true'}
                onChange={(e) => handleChange('emailNotificationsEnabled', String(e.target.checked))}
                className="rounded text-blue-600 h-4 w-4"
              />
              <label htmlFor="emailNotif" className="text-slate-700 dark:text-slate-300 font-medium">
                Enable In-App & Email Dispatch Notifications for Approvals & Cancellations
              </label>
            </div>

            {/* Public Upcoming Events Privacy Mode */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Public Upcoming Events Display Privacy (Homepage &amp; Campus Board)
              </label>
              <select
                value={settings.publicUpcomingDisplay || 'EVENT_TITLE'}
                onChange={(e) => handleChange('publicUpcomingDisplay', e.target.value)}
                className="w-full sm:w-80 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="EVENT_TITLE">Full Event Title (e.g. "Cloud Computing FDP")</option>
                <option value="DEPARTMENT_EVENT">Department Masked (e.g. "CSE Academic Event")</option>
                <option value="RESERVED_SLOT">Fully Anonymous (e.g. "Reserved Academic Session")</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Controls how approved events are presented to unauthenticated visitors on the public landing page.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
