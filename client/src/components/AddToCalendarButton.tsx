import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarPlus,
  Calendar,
  Download,
  ExternalLink,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Booking } from '../types';
import {
  CalendarEventPayload,
  extractEventPayload,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  downloadIcsFile,
} from '../utils/calendarSync';

interface AddToCalendarButtonProps {
  booking?: Partial<Booking>;
  eventPayload?: CalendarEventPayload;
  variant?: 'primary' | 'outline' | 'compact' | 'ghost';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const AddToCalendarButton: React.FC<AddToCalendarButtonProps> = ({
  booking,
  eventPayload,
  variant = 'outline',
  size = 'sm',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const payload: CalendarEventPayload =
    eventPayload || (booking ? extractEventPayload(booking) : extractEventPayload({}));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleGoogleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getGoogleCalendarUrl(payload);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleOutlookWeb = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getOutlookCalendarUrl(payload);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleDownloadIcs = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadIcsFile(payload);
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      setIsOpen(false);
    }, 1200);
  };

  // Base button styles
  const sizeClasses = {
    xs: 'px-2.5 py-1 text-[11px] gap-1.5 rounded-lg',
    sm: 'px-3.5 py-2 text-xs gap-2 rounded-xl',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-xl font-semibold',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold shadow-sm',
    outline:
      'border border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium shadow-xs',
    compact:
      'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/60',
    ghost:
      'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium',
  }[variant];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center justify-center transition-all active:scale-[0.98] ${sizeClasses} ${variantClasses}`}
        title="Add approved event to your calendar"
      >
        <CalendarPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Add to Calendar</span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-1.5 w-60 origin-top-right rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 shadow-xl transition focus:outline-none"
          role="menu"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Sync Institutional Event
          </div>

          <div className="py-1 space-y-0.5">
            {/* Google Calendar */}
            <button
              type="button"
              onClick={handleGoogleCalendar}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition group"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Calendar className="w-3.5 h-3.5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white leading-tight">Google Calendar</p>
                  <p className="text-[10px] text-slate-500">1-click browser sync</p>
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
            </button>

            {/* Apple / Outlook / Mobile (.ics) */}
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition group"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  {downloadSuccess ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                    {downloadSuccess ? 'Downloaded!' : 'iCal (.ics File)'}
                  </p>
                  <p className="text-[10px] text-slate-500">Apple Calendar &amp; Outlook</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                .ics
              </span>
            </button>

            {/* Outlook Web / 365 */}
            <button
              type="button"
              onClick={handleOutlookWeb}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition group"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  <Calendar className="w-3.5 h-3.5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white leading-tight">Outlook Web / 365</p>
                  <p className="text-[10px] text-slate-500">Microsoft Office account</p>
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-sky-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
