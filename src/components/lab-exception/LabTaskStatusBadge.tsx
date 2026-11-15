import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FlaskConical,
  PauseCircle,
  XCircle,
} from 'lucide-react';
import type { LabTaskItem } from '../../services/lab/lab-task.service';
import type { LabTaskExceptionReason } from '../../types/lab-exception';
import {
  EXCEPTION_REASONS_CONFIG,
  getLabTaskStatusMeta,
  type LabTaskStatusKey,
} from '../../utils/labTaskStatus';

interface LabTaskStatusBadgeProps {
  status?: string | null;
  task?: LabTaskItem | null;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
  showTooltip?: boolean;
}

export const LabTaskStatusBadge: React.FC<LabTaskStatusBadgeProps> = ({
  status,
  task,
  size = 'md',
  pulse = false,
  className = '',
  showTooltip = true,
}) => {
  const [showTip, setShowTip] = useState(false);
  const normalizedStatus = (status || task?.status || 'ready') as LabTaskStatusKey;
  const meta = getLabTaskStatusMeta(normalizedStatus);

  const getStatusIcon = () => {
    switch (normalizedStatus) {
      case 'on_hold':
        return <PauseCircle className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />;
      case 'completed':
        return <CheckCircle2 className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />;
      case 'in_progress':
        return <FlaskConical className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />;
      case 'cancelled':
        return <XCircle className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />;
      case 'payment_pending':
        return <Clock className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />;
      case 'ready':
      default:
        return <Clock className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />;
    }
  };

  const isHold = normalizedStatus === 'on_hold';
  const isKnownReason =
    task?.exceptionReasonCode && task.exceptionReasonCode in EXCEPTION_REASONS_CONFIG;
  const reasonConfig = isKnownReason
    ? EXCEPTION_REASONS_CONFIG[task!.exceptionReasonCode as LabTaskExceptionReason]
    : null;
  const reasonTitle = reasonConfig?.title || task?.exceptionReasonCode || 'Sự cố phòng xét nghiệm';
  const reporter = task?.exceptionReportedByName || 'KTV phòng xét nghiệm';
  const reportedTime = task?.exceptionReportedAt
    ? new Date(task.exceptionReportedAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      })
    : null;

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-all ${
          meta.badgeBg
        } ${meta.badgeText} ${meta.badgeBorder} ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } ${pulse ? 'animate-pulse ring-2 ring-amber-400/50' : ''} ${className}`}
      >
        {getStatusIcon()}
        <span>{meta.label}</span>
      </span>

      {/* Tooltip on hold status */}
      {showTooltip && isHold && showTip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-900/95 text-white text-xs rounded-xl shadow-xl z-50 pointer-events-none backdrop-blur-sm border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-1.5 font-semibold text-amber-300 pb-1 border-b border-slate-700/80 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Chi tiết sự cố</span>
          </div>
          <p className="font-medium text-slate-100">{reasonTitle}</p>
          {task?.exceptionDetail && (
            <p className="text-slate-300 text-[11px] mt-0.5 line-clamp-2 italic">
              &quot;{task.exceptionDetail}&quot;
            </p>
          )}
          <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
            <span>Báo bởi: {reporter}</span>
            {reportedTime && <span>{reportedTime}</span>}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
        </div>
      )}
    </div>
  );
};
