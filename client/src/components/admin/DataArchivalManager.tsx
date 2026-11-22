import React, { useState, useEffect } from 'react';
import { apiRequest, downloadFile } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Archive,
  Trash2,
  Download,
  AlertTriangle,
  HardDrive,
  FileSpreadsheet,
  FileCode,
  ShieldAlert,
  Calendar,
  Filter,
  CheckCircle2,
  RefreshCw,
  FolderArchive,
  Layers,
  Sparkles,
  Info,
  X,
  FileText,
} from 'lucide-react';

interface StorageMetrics {
  totalBookings: number;
  oldestBookingDate: string | null;
  newestBookingDate: string | null;
  statusBreakdown: {
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
  storage: {
    totalFiles: number;
    totalBytes: number;
    formattedSize: string;
    orphanFilesCount: number;
    orphanBytes: number;
    formattedOrphanSize: string;
  };
}

interface RangePreview {
  matchingCount: number;
  withAttachmentsCount: number;
  estimatedBytes: number;
  formattedEstimatedSize: string;
  samples: Array<{
    bookingId: string;
    eventName: string;
    bookingDate: string;
    status: string;
    requestedBy: string;
    attachmentUrl?: string | null;
  }>;
}

interface DataArchivalManagerProps {
  onDataPurged?: () => void;
}

export const DataArchivalManager: React.FC<DataArchivalManagerProps> = ({ onDataPurged }) => {
  const { isSuperAdmin } = useAuth();

  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Range Selection
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activePreset, setActivePreset] = useState<string>('6_MONTHS');

  // Live Range Preview
  const [preview, setPreview] = useState<RangePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showSamples, setShowSamples] = useState(false);

  // Modals & Action States
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showOrphanModal, setShowOrphanModal] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [purging, setPurging] = useState(false);
  const [exporting, setExporting] = useState<'csv' | 'json' | null>(null);

  // Notifications
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      loadMetrics();
      applyPreset('6_MONTHS');
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (startDate && endDate) {
      loadRangePreview();
    }
  }, [startDate, endDate, statusFilter]);

  const loadMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const res = await apiRequest<StorageMetrics>('/reports/storage-metrics');
      setMetrics(res);
    } catch (err: any) {
      console.error('Failed to load storage metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    const today = new Date();
    const format = (d: Date) => d.toISOString().split('T')[0];

    if (preset === '3_MONTHS') {
      const past = new Date(today);
      past.setMonth(past.getMonth() - 3);
      setStartDate(format(new Date('2020-01-01')));
      setEndDate(format(past));
    } else if (preset === '6_MONTHS') {
      const past = new Date(today);
      past.setMonth(past.getMonth() - 6);
      setStartDate(format(new Date('2020-01-01')));
      setEndDate(format(past));
    } else if (preset === '1_YEAR') {
      const past = new Date(today);
      past.setFullYear(past.getFullYear() - 1);
      setStartDate(format(new Date('2020-01-01')));
      setEndDate(format(past));
    } else if (preset === 'ALL_PAST') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      setStartDate(format(new Date('2020-01-01')));
      setEndDate(format(yesterday));
    }
  };

  const loadRangePreview = async () => {
    try {
      setLoadingPreview(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
        status: statusFilter,
      });
      const res = await apiRequest<RangePreview>(`/reports/range-preview?${params.toString()}`);
      setPreview(res);
    } catch (err: any) {
      console.error('Failed to preview range:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setExporting(format);
      const params = new URLSearchParams({
        startDate,
        endDate,
        status: statusFilter,
        format,
      });
      const filename = `sairam_bookings_archive_${startDate}_to_${endDate}.${format}`;
      await downloadFile(`/reports/export-range?${params.toString()}`, filename);
      setFeedbackMessage({
        type: 'success',
        text: `Archive exported successfully as ${format.toUpperCase()} (${filename}). Keep this file safe for institutional compliance.`,
      });
      setTimeout(() => setFeedbackMessage(null), 8000);
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || `Failed to export ${format.toUpperCase()} archive.`,
      });
    } finally {
      setExporting(null);
    }
  };

  const handlePurgeRange = async () => {
    if (confirmationInput !== 'DELETE-CONFIRMED') {
      alert('Please type DELETE-CONFIRMED in exact uppercase to verify.');
      return;
    }

    try {
      setPurging(true);
      const res = await apiRequest<{
        success: boolean;
        deletedCount: number;
        deletedFilesCount: number;
        formattedFreedBytes: string;
        message: string;
      }>('/reports/purge-range', {
        method: 'POST',
        body: JSON.stringify({
          startDate,
          endDate,
          status: statusFilter,
          confirmationKeyword: confirmationInput,
        }),
      });

      setShowPurgeModal(false);
      setConfirmationInput('');
      setFeedbackMessage({
        type: 'success',
        text: res.message || `Successfully purged ${res.deletedCount} bookings and cleaned ${res.deletedFilesCount} documents.`,
      });

      // Refresh metrics, preview, and parent ledger
      await loadMetrics();
      await loadRangePreview();
      if (onDataPurged) onDataPurged();
    } catch (err: any) {
      alert(err.message || 'Failed to purge data.');
    } finally {
      setPurging(false);
    }
  };

  const handlePurgeOrphans = async () => {
    if (confirmationInput !== 'DELETE-CONFIRMED') {
      alert('Please type DELETE-CONFIRMED to clean orphan files.');
      return;
    }

    try {
      setPurging(true);
      const res = await apiRequest<{
        success: boolean;
        deletedCount: number;
        formattedFreedBytes: string;
        message: string;
      }>('/reports/purge-orphans', {
        method: 'POST',
        body: JSON.stringify({
          confirmationKeyword: confirmationInput,
        }),
      });

      setShowOrphanModal(false);
      setConfirmationInput('');
      setFeedbackMessage({
        type: 'success',
        text: res.message || `Orphan storage cleaned successfully (${res.formattedFreedBytes} freed).`,
      });

      await loadMetrics();
    } catch (err: any) {
      alert(err.message || 'Failed to clean orphan storage.');
    } finally {
      setPurging(false);
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="no-print space-y-6">
      {/* Alert / Notification Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-semibold">{feedbackMessage.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <FolderArchive className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                  Data Archival &amp; Storage Retention Manager
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-widest">
                  Super Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Export historical events for audit compliance (CSV &amp; JSON), download records across custom month/date ranges, and safely purge old database records &amp; physical uploaded letters to reclaim server hard drive storage.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              loadMetrics();
              if (startDate && endDate) loadRangePreview();
            }}
            disabled={loadingMetrics}
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition cursor-pointer border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Quick Storage Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Bookings in DB
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {metrics?.totalBookings ?? '...'}
              </span>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px] font-semibold text-slate-500">
                <span className="text-emerald-600">{metrics?.statusBreakdown.approved || 0} approved</span>
                <span>•</span>
                <span className="text-rose-600">{metrics?.statusBreakdown.rejected || 0} rejected</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Historical Span
              </span>
              <div className="mt-1 space-y-0.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block truncate">
                  From: {metrics?.oldestBookingDate || 'N/A'}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block truncate">
                  To: {metrics?.newestBookingDate || 'N/A'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Institutional archive timeline</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center justify-between">
                <span>Uploads Storage</span>
                <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
              </span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
                {metrics?.storage.formattedSize ?? '...'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                {metrics?.storage.totalFiles || 0} permission letters on disk
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Unlinked Orphan Files
              </span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                {metrics?.storage.orphanFilesCount ?? 0}
              </span>
              <div className="flex items-center justify-between mt-1 text-[10px]">
                <span className="text-slate-500 font-medium">({metrics?.storage.formattedOrphanSize || '0 Bytes'})</span>
                {metrics && metrics.storage.orphanFilesCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmationInput('');
                      setShowOrphanModal(true);
                    }}
                    className="text-amber-600 hover:text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                  >
                    Clean &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Range Selection Controls */}
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Target Range &amp; Criteria
                </span>
              </div>
              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Presets:</span>
                {[
                  { id: '3_MONTHS', label: 'Older than 3 Mo' },
                  { id: '6_MONTHS', label: 'Older than 6 Mo' },
                  { id: '1_YEAR', label: 'Older than 1 Yr' },
                  { id: 'ALL_PAST', label: 'All Past Events' },
                  { id: 'CUSTOM', label: 'Custom' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      if (preset.id !== 'CUSTOM') {
                        applyPreset(preset.id);
                      } else {
                        setActivePreset('CUSTOM');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activePreset === preset.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs: Start Date, End Date, Status Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  From Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setActivePreset('CUSTOM');
                      setStartDate(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  To Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setActivePreset('CUSTOM');
                      setEndDate(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Booking Status Scope
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Records (Approved, Pending, Rejected, Cancelled)</option>
                  <option value="REJECTED">Only Rejected Requests</option>
                  <option value="CANCELLED">Only Cancelled Requests</option>
                  <option value="APPROVED">Only Approved Historical Events</option>
                  <option value="PENDING">Only Pending Requests</option>
                </select>
              </div>
            </div>

            {/* Live Range Impact Preview Box */}
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200">
                    Live Impact Analysis:
                  </span>
                  {loadingPreview && (
                    <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Target selection contains{' '}
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {preview?.matchingCount ?? 0} bookings
                  </span>{' '}
                  with{' '}
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    {preview?.withAttachmentsCount ?? 0} uploaded documents
                  </span>{' '}
                  (consuming approx{' '}
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    {preview?.formattedEstimatedSize ?? '0 Bytes'}
                  </span>{' '}
                  storage).
                </p>
              </div>

              {preview && preview.samples.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSamples(!showSamples)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showSamples ? 'Hide Sample Records' : 'Preview Sample Records (5)'}</span>
                </button>
              )}
            </div>

            {/* Expandable Preview Table */}
            {showSamples && preview && preview.samples.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 font-bold text-slate-700 dark:text-slate-300">
                  Recent Sample Records in Selected Range:
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {preview.samples.map((s) => (
                    <div
                      key={s.bookingId}
                      className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {s.bookingId}
                        </span>
                        <span className="text-slate-900 dark:text-white font-medium">{s.eventName}</span>
                        <span className="text-[10px] text-slate-400">({s.requestedBy})</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-500">{s.bookingDate}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                            s.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : s.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Hub: Export vs Purge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            {/* Step 1: Export Actions */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Step 1: Institutional Archive / Export
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  disabled={exporting !== null || !preview || preview.matchingCount === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{exporting === 'csv' ? 'Exporting CSV...' : 'Download CSV Archive'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  disabled={exporting !== null || !preview || preview.matchingCount === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <FileCode className="w-4 h-4" />
                  <span>{exporting === 'json' ? 'Exporting JSON...' : 'Download JSON Backup'}</span>
                </button>
              </div>
            </div>

            {/* Step 2: Safe Hard Deletion */}
            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">
                Step 2: Hard Purge &amp; File Cleanup
              </span>
              <button
                type="button"
                onClick={() => {
                  setConfirmationInput('');
                  setShowPurgeModal(true);
                }}
                disabled={!preview || preview.matchingCount === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Purge Range</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: Safe Hard Purge Confirmation
      ========================================================================= */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border-2 border-rose-500/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-rose-600 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-base font-extrabold tracking-tight">
                  Permanent Data Purge Confirmation
                </h4>
                <p className="text-xs text-rose-100">Zero recovery danger zone</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-2">
                <p className="font-bold">
                  ⚠️ You are about to permanently delete{' '}
                  <span className="underline font-black">{preview?.matchingCount || 0} bookings</span>{' '}
                  and erase{' '}
                  <span className="underline font-black">{preview?.withAttachmentsCount || 0} attached files</span>{' '}
                  ({preview?.formattedEstimatedSize || '0 Bytes'}) from disk.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] opacity-90">
                  <li>Date Range: <strong>{startDate}</strong> to <strong>{endDate}</strong></li>
                  <li>Scope: <strong>{statusFilter}</strong> bookings</li>
                  <li>This action permanently deletes records from the database.</li>
                  <li>Associated uploaded PDF letters will be permanently erased to free disk space.</li>
                  <li>An immutable audit log will record this action under your Super Admin identity.</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Type <span className="font-mono text-rose-600 font-extrabold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">DELETE-CONFIRMED</span> to proceed:
                </label>
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="Type DELETE-CONFIRMED"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPurgeModal(false);
                    setConfirmationInput('');
                  }}
                  disabled={purging}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePurgeRange}
                  disabled={confirmationInput !== 'DELETE-CONFIRMED' || purging}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{purging ? 'Purging & Freeing Space...' : 'Execute Permanent Purge'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: Orphan Files Cleanup Confirmation
      ========================================================================= */}
      {showOrphanModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border-2 border-amber-500/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-amber-600 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <HardDrive className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-base font-extrabold tracking-tight">
                  Clean Unlinked Orphan Storage Files
                </h4>
                <p className="text-xs text-amber-100">Reclaim wasted hard drive space</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <p className="font-bold">
                  There are {metrics?.storage.orphanFilesCount} files ({metrics?.storage.formattedOrphanSize}) on disk that do not belong to any current booking record.
                </p>
                <p className="text-[11px] opacity-90">
                  These files were likely uploaded during incomplete submissions or orphaned when events were previously modified. Deleting them is completely safe and frees storage.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Type <span className="font-mono text-amber-600 font-extrabold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">DELETE-CONFIRMED</span> to clean:
                </label>
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="Type DELETE-CONFIRMED"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOrphanModal(false);
                    setConfirmationInput('');
                  }}
                  disabled={purging}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePurgeOrphans}
                  disabled={confirmationInput !== 'DELETE-CONFIRMED' || purging}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-md shadow-amber-600/30 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{purging ? 'Cleaning Files...' : 'Clean Orphan Files'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
