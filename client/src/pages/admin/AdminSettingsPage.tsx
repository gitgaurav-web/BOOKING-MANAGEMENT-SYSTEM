import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import {
  Settings,
  Save,
  CheckCircle2,
  Plus,
  X,
  Trash2,
  FileText,
  Edit2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Lock,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useSettings, DEFAULT_BOOKING_TERMS, parseBookingTerms } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

export const AdminSettingsPage: React.FC = () => {
  const { refreshSettings } = useSettings();
  const { isSuperAdmin } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newEquipmentInput, setNewEquipmentInput] = useState('');

  // Facility Terms & Conditions State (Super Admin Exclusive)
  const [newTermInput, setNewTermInput] = useState('');
  const [editingTermIndex, setEditingTermIndex] = useState<number | null>(null);
  const [editingTermValue, setEditingTermValue] = useState('');

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

  const currentEquipmentList = (settings.customEquipmentCatalog || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const handleAddEquipment = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = newEquipmentInput.trim();
    if (!trimmed) return;
    if (currentEquipmentList.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setNewEquipmentInput('');
      return;
    }
    const updated = [...currentEquipmentList, trimmed].join(', ');
    handleChange('customEquipmentCatalog', updated);
    setNewEquipmentInput('');
  };

  const handleDeleteEquipment = (itemToDelete: string) => {
    const updated = currentEquipmentList
      .filter((item) => item.toLowerCase() !== itemToDelete.toLowerCase())
      .join(', ');
    handleChange('customEquipmentCatalog', updated);
  };

  // Terms and Conditions Management Handlers (Super Admin Only)
  const currentTermsList = parseBookingTerms(settings.bookingTermsAndConditions);

  const handleAddTerm = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTermInput.trim();
    if (!trimmed) return;
    const updated = [...currentTermsList, trimmed];
    handleChange('bookingTermsAndConditions', JSON.stringify(updated));
    setNewTermInput('');
  };

  const handleDeleteTerm = (index: number) => {
    if (currentTermsList.length <= 1) {
      alert('At least one term and condition is required.');
      return;
    }
    const updated = currentTermsList.filter((_, idx) => idx !== index);
    handleChange('bookingTermsAndConditions', JSON.stringify(updated));
    if (editingTermIndex === index) {
      setEditingTermIndex(null);
    }
  };

  const handleStartEditTerm = (index: number, val: string) => {
    setEditingTermIndex(index);
    setEditingTermValue(val);
  };

  const handleSaveEditTerm = (index: number) => {
    const trimmed = editingTermValue.trim();
    if (!trimmed) return;
    const updated = [...currentTermsList];
    updated[index] = trimmed;
    handleChange('bookingTermsAndConditions', JSON.stringify(updated));
    setEditingTermIndex(null);
    setEditingTermValue('');
  };

  const handleCancelEditTerm = () => {
    setEditingTermIndex(null);
    setEditingTermValue('');
  };

  const handleMoveTerm = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentTermsList.length) return;
    const updated = [...currentTermsList];
    const [removed] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, removed);
    handleChange('bookingTermsAndConditions', JSON.stringify(updated));
  };

  const handleResetTerms = () => {
    if (window.confirm('Are you sure you want to restore the official default institutional Terms & Conditions?')) {
      handleChange('bookingTermsAndConditions', JSON.stringify(DEFAULT_BOOKING_TERMS));
      setEditingTermIndex(null);
    }
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

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Academic Session
              </label>
              <input
                type="text"
                placeholder="e.g. Academic Session 2026-27"
                value={settings.academicSession || ''}
                onChange={(e) => handleChange('academicSession', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Accreditation &amp; Affiliation Claims
              </label>
              <input
                type="text"
                placeholder="e.g. Approved by AICTE · Affiliated to VTU Belagavi · NAAC Accredited"
                value={settings.accreditationText || ''}
                onChange={(e) => handleChange('accreditationText', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Restricted Email Domain (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. sairamce.edu.in (leave empty to allow all domains)"
                value={settings.allowedEmailDomain || ''}
                onChange={(e) => handleChange('allowedEmailDomain', e.target.value)}
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
                value={settings.minAdvanceNoticeDays ?? '0'}
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
                Enable In-App &amp; Email Dispatch Notifications for Approvals &amp; Cancellations
              </label>
            </div>

            {/* Automated Dispatch Email Recipients */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  IQAC Requisition Alert Email
                </label>
                <input
                  type="email"
                  placeholder="iqac@sairamce.edu.in"
                  value={settings.iqacNotificationEmail !== undefined ? settings.iqacNotificationEmail : 'iqac@sairamce.edu.in'}
                  onChange={(e) => handleChange('iqacNotificationEmail', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Receives automated copy of all new requisitions, approved bookings, and cancellation slips + PDF pass.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Store &amp; Logistics Setup Email
                </label>
                <input
                  type="email"
                  placeholder="store@sairamce.edu.in"
                  value={settings.storeNotificationEmail !== undefined ? settings.storeNotificationEmail : 'store@sairamce.edu.in'}
                  onChange={(e) => handleChange('storeNotificationEmail', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Receives approved booking logistics (mementos count, VIP guests, AV equipment) &amp; cancellation alerts.
                </p>
              </div>
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

        {/* Section 3: Technical Equipment & Facilities Catalog */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>⚙️ 3. Technical Equipment &amp; Facilities Catalog</span>
            </span>
            <span className="text-[11px] font-normal text-slate-500">
              {currentEquipmentList.length} item{currentEquipmentList.length === 1 ? '' : 's'} configured
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Super Admin can add new equipment/facility options or delete existing ones. Items added here will automatically appear on the faculty booking form for one-click selection.
          </p>

          {/* Add New Item Input Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs">
              Add New Equipment / Facility Option
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Wireless Clicker, Stage Return Monitors, VIP Water Dispenser..."
                value={newEquipmentInput}
                onChange={(e) => setNewEquipmentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEquipment(e);
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddEquipment}
                disabled={!newEquipmentInput.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Type the item name and click <strong>Add Item</strong> (or press Enter). Don't forget to click <strong>Save Settings</strong> below to persist changes.
            </p>
          </div>

          {/* Current Active Equipment List with Delete Buttons */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2 text-xs">
              Active Catalog Items ({currentEquipmentList.length})
            </label>
            {currentEquipmentList.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                No custom equipment added yet. Type an item name above and click "Add Item".
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentEquipmentList.map((item) => (
                  <div
                    key={item}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 text-blue-800 dark:text-blue-200 text-xs font-medium shadow-2xs group transition"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteEquipment(item)}
                      title={`Delete "${item}"`}
                      className="p-0.5 rounded text-blue-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950/60 dark:hover:text-red-400 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bulk Edit Fallback Details */}
          <details className="text-xs text-slate-500 pt-1">
            <summary className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 font-medium">
              Advanced: Bulk Edit (Comma-Separated)
            </summary>
            <div className="mt-2 space-y-1">
              <textarea
                rows={2}
                value={settings.customEquipmentCatalog || ''}
                onChange={(e) => handleChange('customEquipmentCatalog', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400">
                You can also paste a raw comma-separated list here directly.
              </p>
            </div>
          </details>
        </div>

        {/* Section 4: Facility Booking Terms & Conditions (Super Admin Exclusive) */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  4. Facility Booking Terms &amp; Conditions
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-700 flex items-center gap-1">
                  <span>👑 Super Admin Exclusive</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Institutional compliance rules shown on the booking request form and printed on confirmation pass PDFs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                {currentTermsList.length} Rules Active
              </span>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={handleResetTerms}
                  title="Restore Default Terms"
                  className="px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>Reset Default</span>
                </button>
              )}
            </div>
          </div>

          {!isSuperAdmin && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2.5 shadow-2xs">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Read-Only Access:</strong> Only the <strong>Super Admin (IQAC)</strong> has authorization to modify institutional terms &amp; conditions.
              </span>
            </div>
          )}

          {/* Add New Rule Input (Super Admin Only) */}
          {isSuperAdmin && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs">
                Add New Compliance Rule / Regulation
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Outside catering is strictly prohibited without prior written approval..."
                  value={newTermInput}
                  onChange={(e) => setNewTermInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTerm(e);
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddTerm}
                  disabled={!newTermInput.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Type the rule description and click <strong>Add Rule</strong>. Remember to click <strong>Save Settings</strong> below to persist your changes.
              </p>
            </div>
          )}

          {/* Active Rules List */}
          <div className="space-y-2">
            {currentTermsList.map((term, index) => {
              const isEditing = editingTermIndex === index;
              return (
                <div
                  key={index}
                  className={`p-3 rounded-xl border transition flex items-start justify-between gap-3 ${
                    isEditing
                      ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 shadow-xs'
                      : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center mt-0.5">
                      {index + 1}
                    </span>

                    {isEditing ? (
                      <div className="flex-1 space-y-2">
                        <textarea
                          rows={2}
                          value={editingTermValue}
                          onChange={(e) => setEditingTermValue(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEditTerm(index)}
                            disabled={!editingTermValue.trim()}
                            className="px-3 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditTerm}
                            className="px-3 py-1 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed pt-0.5">
                        {term}
                      </p>
                    )}
                  </div>

                  {isSuperAdmin && !isEditing && (
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleMoveTerm(index, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 transition cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveTerm(index, 'down')}
                        disabled={index === currentTermsList.length - 1}
                        title="Move Down"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 transition cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEditTerm(index, term)}
                        title="Edit Rule"
                        className="p-1 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTerm(index)}
                        title="Delete Rule"
                        className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
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
