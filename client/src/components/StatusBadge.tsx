import React from 'react';
import { CheckCircle2, Clock, XCircle, Ban, Wrench, Calendar as CalendarIcon, Car, Bus } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const norm = status?.toUpperCase() || 'UNKNOWN';

  let bgClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  let label = status;
  let Icon: any = Clock;

  switch (norm) {
    case 'AVAILABLE':
    case 'ACTIVE':
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      label = 'Available';
      Icon = CheckCircle2;
      break;
    case 'PARTIAL':
      bgClass = 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700';
      label = 'Partial (Slots Open)';
      Icon = Clock;
      break;
    case 'BOOKED':
    case 'APPROVED':
      bgClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      label = 'Reserved / Dispatched';
      Icon = CheckCircle2;
      break;
    case 'IN_TRANSIT':
      bgClass = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      label = 'On Road / In Transit';
      Icon = Car;
      break;
    case 'COMPLETED':
      bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800';
      label = 'Completed';
      Icon = CheckCircle2;
      break;
    case 'PENDING':
      bgClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      label = 'Pending Approval';
      Icon = Clock;
      break;
    case 'BLOCKED':
      bgClass = 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      label = 'Blocked / Exam Duty';
      Icon = Ban;
      break;
    case 'MAINTENANCE':
      bgClass = 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
      label = 'Garage Service / RTO';
      Icon = Wrench;
      break;
    case 'HOLIDAY':
      bgClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
      label = 'Holiday';
      Icon = CalendarIcon;
      break;
    case 'CANCELLED':
      bgClass = 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900';
      label = 'Cancelled';
      Icon = XCircle;
      break;
    case 'REJECTED':
      bgClass = 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
      label = 'Rejected';
      Icon = XCircle;
      break;
    default:
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all duration-150 ${sizeClasses} ${bgClass}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{label}</span>
    </span>
  );
};
