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
  Mail,
  Eye,
  Sparkles,
} from 'lucide-react';
import {
  useSettings,
  DEFAULT_BOOKING_TERMS,
  parseBookingTerms,
  DEFAULT_EMAIL_SETTINGS,
  parseEmailGuidelines,
} from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { DataArchivalManager } from '../../components/admin/DataArchivalManager';

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

  // Email Templates & Content State (Super Admin Exclusive)
  const [activeEmailTab, setActiveEmailTab] = useState<'APPROVED' | 'PENDING' | 'REJECTED' | 'CANCELLED'>('APPROVED');
  const [newEmailGuidelineInput, setNewEmailGuidelineInput] = useState('');
  const [editingGuidelineIndex, setEditingGuidelineIndex] = useState<number | null>(null);
  const [editingGuidelineValue, setEditingGuidelineValue] = useState('');
  const [showEmailPreview, setShowEmailPreview] = useState(true);

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

  // Email Guidelines Management Handlers (Super Admin Only)
  const currentGuidelinesList = parseEmailGuidelines(settings.emailFacultyGuidelines);

  const handleAddGuideline = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = newEmailGuidelineInput.trim();
    if (!trimmed) return;
    const updated = [...currentGuidelinesList, trimmed];
    handleChange('emailFacultyGuidelines', JSON.stringify(updated));
    setNewEmailGuidelineInput('');
  };

  const handleDeleteGuideline = (index: number) => {
    if (currentGuidelinesList.length <= 1) {
      alert('At least one coordinator guideline is required.');
      return;
    }
    const updated = currentGuidelinesList.filter((_, idx) => idx !== index);
    handleChange('emailFacultyGuidelines', JSON.stringify(updated));
    if (editingGuidelineIndex === index) {
      setEditingGuidelineIndex(null);
    }
  };

  const handleStartEditGuideline = (index: number, val: string) => {
    setEditingGuidelineIndex(index);
    setEditingGuidelineValue(val);
  };

  const handleSaveEditGuideline = (index: number) => {
    const trimmed = editingGuidelineValue.trim();
    if (!trimmed) return;
    const updated = [...currentGuidelinesList];
    updated[index] = trimmed;
    handleChange('emailFacultyGuidelines', JSON.stringify(updated));
    setEditingGuidelineIndex(null);
    setEditingGuidelineValue('');
  };

  const handleCancelEditGuideline = () => {
    setEditingGuidelineIndex(null);
    setEditingGuidelineValue('');
  };

  const handleMoveGuideline = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentGuidelinesList.length) return;
    const updated = [...currentGuidelinesList];
    const [removed] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, removed);
    handleChange('emailFacultyGuidelines', JSON.stringify(updated));
  };

  const handleResetEmailSettings = () => {
    if (window.confirm('Are you sure you want to restore the official default institutional Email Templates and Content?')) {
      for (const [key, value] of Object.entries(DEFAULT_EMAIL_SETTINGS)) {
        handleChange(key, value);
      }
      setEditingGuidelineIndex(null);
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

        {/* Section 5: Email Templates & Content Customization (Super Admin Exclusive) */}
        <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  5. Outbound Email Templates &amp; Content Customization
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-700 flex items-center gap-1">
                  <span>👑 Super Admin Exclusive</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Customize email header branding (with circular college seal), notification messages for all booking states, coordinator guidelines, and footer contact lines.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmailPreview((prev) => !prev)}
                className="px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3 text-blue-500" />
                <span>{showEmailPreview ? 'Hide Live Preview' : 'Show Live Preview'}</span>
              </button>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={handleResetEmailSettings}
                  title="Restore Default Email Templates"
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
                <strong>Read-Only Access:</strong> Only the <strong>Super Admin (IQAC)</strong> has authorization to modify outbound email templates and content.
              </span>
            </div>
          )}

          {/* 5A. Email Header Branding Banner & Circular Seal */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                <span>🏷️ Header Branding &amp; Circular Seal Logo</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                CID Inline Logo &bull; Displayed across all email clients
              </span>
            </div>

            {/* Live Visual Header Preview Box */}
            <div className="rounded-xl overflow-hidden shadow-xs border border-blue-950/20">
              <div className="bg-[#0f2b5c] p-4 text-white flex items-center gap-3.5">
                <img
                  src="/images/sairam-seal.png"
                  alt="Round Seal"
                  className="w-12 h-12 rounded-full border-2 border-white/90 bg-white object-contain p-0.5 shrink-0 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold tracking-wide text-white truncate">
                    {settings.emailHeaderTitle || DEFAULT_EMAIL_SETTINGS.emailHeaderTitle}
                  </h4>
                  <p className="text-[11px] text-blue-200 font-medium truncate mt-0.5">
                    {settings.emailHeaderSubtitle || DEFAULT_EMAIL_SETTINGS.emailHeaderSubtitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Header College Title
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.emailHeaderTitle ?? DEFAULT_EMAIL_SETTINGS.emailHeaderTitle}
                  onChange={(e) => handleChange('emailHeaderTitle', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Header Subtitle / Office Tagline
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.emailHeaderSubtitle ?? DEFAULT_EMAIL_SETTINGS.emailHeaderSubtitle}
                  onChange={(e) => handleChange('emailHeaderSubtitle', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 text-xs"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              💡 The official circular college seal logo (shown on the left) is automatically attached inline as <code className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">cid:college-seal-logo</code> so it displays reliably in Gmail, Outlook, Apple Mail, and mobile inboxes without remote image blocking.
            </p>
          </div>

          {/* 5B. Status Notification Messages (Approved, Pending, Rejected, Cancelled) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                <span>💬 Notification Messages by Status</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Click any status tab to edit headline and lead text
              </span>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveEmailTab('APPROVED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeEmailTab === 'APPROVED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                <span>Approved (Confirmed)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveEmailTab('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeEmailTab === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                <span>Pending Review</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveEmailTab('REJECTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeEmailTab === 'REJECTED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-300"></span>
                <span>Rejected</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveEmailTab('CANCELLED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeEmailTab === 'CANCELLED'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                <span>Cancelled</span>
              </button>
            </div>

            {/* Active Status Fields */}
            {activeEmailTab === 'APPROVED' && (
              <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                    Banner Headline (Green Bar)
                  </label>
                  <input
                    type="text"
                    disabled={!isSuperAdmin}
                    value={settings.emailApprovedHeadline ?? DEFAULT_EMAIL_SETTINGS.emailApprovedHeadline}
                    onChange={(e) => handleChange('emailApprovedHeadline', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                    Lead Message Body
                  </label>
                  <textarea
                    rows={3}
                    disabled={!isSuperAdmin}
                    value={settings.emailApprovedMessage ?? DEFAULT_EMAIL_SETTINGS.emailApprovedMessage}
                    onChange={(e) => handleChange('emailApprovedMessage', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {activeEmailTab === 'PENDING' && (
              <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                    Banner Headline (Amber Bar)
                  </label>
                  <input
                    type="text"
                    disabled={!isSuperAdmin}
                    value={settings.emailPendingHeadline ?? DEFAULT_EMAIL_SETTINGS.emailPendingHeadline}
                    onChange={(e) => handleChange('emailPendingHeadline', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                    Lead Message Body
                  </label>
                  <textarea
                    rows={3}
                    disabled={!isSuperAdmin}
                    value={settings.emailPendingMessage ?? DEFAULT_EMAIL_SETTINGS.emailPendingMessage}
                    onChange={(e) => handleChange('emailPendingMessage', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {activeEmailTab === 'REJECTED' && (
              <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                    Banner Headline (Red Bar)
                  </label>
                  <input
                    type="text"
                    disabled={!isSuperAdmin}
                    value={settings.emailRejectedHeadline ?? DEFAULT_EMAIL_SETTINGS.emailRejectedHeadline}
                    onChange={(e) => handleChange('emailRejectedHeadline', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                    Lead Message Body
                  </label>
                  <textarea
                    rows={3}
                    disabled={!isSuperAdmin}
                    value={settings.emailRejectedMessage ?? DEFAULT_EMAIL_SETTINGS.emailRejectedMessage}
                    onChange={(e) => handleChange('emailRejectedMessage', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {activeEmailTab === 'CANCELLED' && (
              <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                    Banner Headline (Dark Slate Bar)
                  </label>
                  <input
                    type="text"
                    disabled={!isSuperAdmin}
                    value={settings.emailCancelledHeadline ?? DEFAULT_EMAIL_SETTINGS.emailCancelledHeadline}
                    onChange={(e) => handleChange('emailCancelledHeadline', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                    Lead Message Body
                  </label>
                  <textarea
                    rows={3}
                    disabled={!isSuperAdmin}
                    value={settings.emailCancelledMessage ?? DEFAULT_EMAIL_SETTINGS.emailCancelledMessage}
                    onChange={(e) => handleChange('emailCancelledMessage', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* Variable Helper Chips */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                Available Dynamic Placeholders (Click to insert into message):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: '{hallName}', desc: 'Hall Name' },
                  { tag: '{bookingDate}', desc: 'Booking Date' },
                  { tag: '{bookingId}', desc: 'Booking Ref' },
                  { tag: '{eventName}', desc: 'Event Name' },
                  { tag: '{recipientName}', desc: 'Faculty/Coordinator' },
                  { tag: '{departmentName}', desc: 'Department' },
                ].map((ph) => (
                  <button
                    key={ph.tag}
                    type="button"
                    disabled={!isSuperAdmin}
                    onClick={() => {
                      const keyMap: Record<string, string> = {
                        APPROVED: 'emailApprovedMessage',
                        PENDING: 'emailPendingMessage',
                        REJECTED: 'emailRejectedMessage',
                        CANCELLED: 'emailCancelledMessage',
                      };
                      const key = keyMap[activeEmailTab];
                      const current = settings[key] ?? (DEFAULT_EMAIL_SETTINGS as any)[key];
                      handleChange(key, (current ? current + ' ' : '') + ph.tag);
                    }}
                    title={`Insert ${ph.tag} (${ph.desc})`}
                    className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-mono hover:bg-blue-100 dark:hover:bg-blue-900 transition cursor-pointer disabled:opacity-50"
                  >
                    <span>{ph.tag}</span>
                    <span className="text-[10px] text-blue-500 ml-1">({ph.desc})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5C. Important Guidelines for Faculty Coordinator (Itemized Rules) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                  <span>📋 Important Guidelines for Faculty Coordinator</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Institutional rules printed at the bottom of the notification email.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                {currentGuidelinesList.length} Guidelines Active
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                Guidelines Box Header Title
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.emailGuidelinesTitle ?? DEFAULT_EMAIL_SETTINGS.emailGuidelinesTitle}
                onChange={(e) => handleChange('emailGuidelinesTitle', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 text-xs"
              />
            </div>

            {/* Add New Guideline (Super Admin Only) */}
            {isSuperAdmin && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  Add New Coordinator Guideline Rule
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Ensure all microphones are returned to the AV control desk immediately..."
                    value={newEmailGuidelineInput}
                    onChange={(e) => setNewEmailGuidelineInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGuideline(e);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddGuideline}
                    disabled={!newEmailGuidelineInput.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-xs transition flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}

            {/* Guidelines List */}
            <div className="space-y-2">
              {currentGuidelinesList.map((guideline, index) => {
                const isEditing = editingGuidelineIndex === index;
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border transition flex items-start justify-between gap-3 ${
                      isEditing
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center mt-0.5">
                        {index + 1}
                      </span>

                      {isEditing ? (
                        <div className="flex-1 space-y-2">
                          <textarea
                            rows={2}
                            value={editingGuidelineValue}
                            onChange={(e) => setEditingGuidelineValue(e.target.value)}
                            className="w-full p-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEditGuideline(index)}
                              disabled={!editingGuidelineValue.trim()}
                              className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditGuideline}
                              className="px-2.5 py-1 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed pt-0.5">
                          {guideline}
                        </p>
                      )}
                    </div>

                    {isSuperAdmin && !isEditing && (
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveGuideline(index, 'up')}
                          disabled={index === 0}
                          title="Move Up"
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 transition cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveGuideline(index, 'down')}
                          disabled={index === currentGuidelinesList.length - 1}
                          title="Move Down"
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 transition cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditGuideline(index, guideline)}
                          title="Edit Guideline"
                          className="p-1 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGuideline(index)}
                          title="Delete Guideline"
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

          {/* 5D. Footer Information Lines */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
              <span>📌 Email Footer Sign-off Lines</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Footer Line 1 (Office &amp; College Name)
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.emailFooterLine1 ?? DEFAULT_EMAIL_SETTINGS.emailFooterLine1}
                  onChange={(e) => handleChange('emailFooterLine1', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Footer Line 2 (Campus Address &amp; Helpdesk Email)
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.emailFooterLine2 ?? DEFAULT_EMAIL_SETTINGS.emailFooterLine2}
                  onChange={(e) => handleChange('emailFooterLine2', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 text-xs"
                />
              </div>
            </div>
          </div>

          {/* 5E. Live Email Layout Preview Modal / Card */}
          {showEmailPreview && (
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Interactive Email Inbox Rendering (Live Preview)</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Showing active tab: <strong className="uppercase">{activeEmailTab}</strong>
                </span>
              </div>

              {/* Rendered Mock Email Container */}
              <div className="max-w-2xl mx-auto rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md overflow-hidden text-slate-800 dark:text-slate-100">
                {/* Header Banner */}
                <div className="bg-[#0f2b5c] p-4 text-white text-center">
                  <div className="inline-flex items-center gap-3.5 text-left">
                    <img
                      src="/images/sairam-seal.png"
                      alt="College Seal"
                      className="w-12 h-12 rounded-full border-2 border-white bg-white object-contain p-0.5 shrink-0 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <h4 className="text-sm font-extrabold tracking-wide text-white leading-tight">
                        {settings.emailHeaderTitle || DEFAULT_EMAIL_SETTINGS.emailHeaderTitle}
                      </h4>
                      <p className="text-[11px] text-blue-200 font-medium leading-tight mt-0.5">
                        {settings.emailHeaderSubtitle || DEFAULT_EMAIL_SETTINGS.emailHeaderSubtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div
                  className={`px-4 py-2 text-center text-white text-xs font-bold uppercase tracking-wider ${
                    activeEmailTab === 'APPROVED'
                      ? 'bg-emerald-600'
                      : activeEmailTab === 'PENDING'
                      ? 'bg-amber-600'
                      : activeEmailTab === 'REJECTED'
                      ? 'bg-rose-600'
                      : 'bg-slate-700'
                  }`}
                >
                  {activeEmailTab === 'APPROVED' && (settings.emailApprovedHeadline || DEFAULT_EMAIL_SETTINGS.emailApprovedHeadline)}
                  {activeEmailTab === 'PENDING' && (settings.emailPendingHeadline || DEFAULT_EMAIL_SETTINGS.emailPendingHeadline)}
                  {activeEmailTab === 'REJECTED' && (settings.emailRejectedHeadline || DEFAULT_EMAIL_SETTINGS.emailRejectedHeadline)}
                  {activeEmailTab === 'CANCELLED' && (settings.emailCancelledHeadline || DEFAULT_EMAIL_SETTINGS.emailCancelledHeadline)}
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Dear <strong>Dr. Priya Sharma</strong>,
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {(() => {
                      const raw =
                        activeEmailTab === 'APPROVED'
                          ? settings.emailApprovedMessage || DEFAULT_EMAIL_SETTINGS.emailApprovedMessage
                          : activeEmailTab === 'PENDING'
                          ? settings.emailPendingMessage || DEFAULT_EMAIL_SETTINGS.emailPendingMessage
                          : activeEmailTab === 'REJECTED'
                          ? settings.emailRejectedMessage || DEFAULT_EMAIL_SETTINGS.emailRejectedMessage
                          : settings.emailCancelledMessage || DEFAULT_EMAIL_SETTINGS.emailCancelledMessage;
                      return raw
                        .replace('{hallName}', 'Dr. APJ Abdul Kalam Auditorium')
                        .replace('{bookingDate}', 'Mon, 26 Oct 2026')
                        .replace('{bookingId}', 'BK-20261026-001')
                        .replace('{eventName}', 'National Robotics Workshop 2026')
                        .replace('{recipientName}', 'Dr. Priya Sharma')
                        .replace('{departmentName}', 'Computer Science & Engineering');
                    })()}
                  </p>

                  {/* Summary Table */}
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Booking Reference:</span>
                      <span className="font-bold text-blue-600">BK-20261026-001</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reserved Hall:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Dr. APJ Abdul Kalam Auditorium</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Event Date:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Mon, 26 Oct 2026 &bull; 09:00 AM - 05:00 PM</span>
                    </div>
                  </div>

                  {/* Guidelines Box */}
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                    <strong className="block text-[11px] font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wide">
                      📋 {settings.emailGuidelinesTitle || DEFAULT_EMAIL_SETTINGS.emailGuidelinesTitle}
                    </strong>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                      {currentGuidelinesList.map((g, idx) => (
                        <li key={idx}>{g}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Email Footer */}
                <div className="p-3 text-center border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {settings.emailFooterLine1 || DEFAULT_EMAIL_SETTINGS.emailFooterLine1}
                  </p>
                  <p>
                    {settings.emailFooterLine2 || DEFAULT_EMAIL_SETTINGS.emailFooterLine2}
                  </p>
                </div>
              </div>
            </div>
          )}
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

      {/* Super Admin Data Archival & Storage Retention Manager */}
      <DataArchivalManager />
    </div>
  );
};
