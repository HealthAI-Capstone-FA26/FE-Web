import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { type LabTaskItem } from '../../services/lab/lab-task.service';
import { EXCEPTION_REASONS_CONFIG } from '../../utils/labTaskStatus';
import { type LabTaskExceptionReason } from '../../types/lab-exception';

interface OnHoldBannerProps {
  count: number;
  tasks?: LabTaskItem[];
  targetPatientName?: string;
  isCurrentPatient?: boolean;
  onActionClick?: () => void;
  onResolveTask?: (task: LabTaskItem) => void;
  className?: string;
}

export const OnHoldBanner: React.FC<OnHoldBannerProps> = ({
  count,
  tasks = [],
  targetPatientName,
  isCurrentPatient = true,
  onActionClick,
  onResolveTask,
  className = '',
}) => {
  if (count <= 0) return null;

  const firstTask = tasks[0];
  const testName =
    firstTask?.orderItem?.testType?.testName || 'Chỉ định cận lâm sàng';
  const reasonCfg = firstTask?.exceptionReasonCode
    ? EXCEPTION_REASONS_CONFIG[firstTask.exceptionReasonCode as LabTaskExceptionReason]
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`p-3.5 sm:p-4 bg-gradient-to-r from-amber-50 via-amber-50/95 to-orange-50 border-2 border-amber-300 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-200/90 text-amber-900 shrink-0 shadow-2xs">
          <AlertTriangle className="w-5 h-5 stroke-[2.2] animate-pulse" />
        </div>
        <div className="text-xs sm:text-sm space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="font-extrabold text-amber-950">
              Có {count} chỉ định bị tạm dừng do sự cố
            </strong>
            {targetPatientName && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                BN: {targetPatientName}
              </span>
            )}
            {reasonCfg && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                {reasonCfg.title}
              </span>
            )}
          </div>
          <p className="text-amber-800 text-[11px] sm:text-xs">
            {testName} — Phòng xét nghiệm đang chờ bác sĩ đưa ra quyết định lâm sàng (Thử lại / Huỷ).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {onResolveTask && firstTask && (
          <button
            type="button"
            onClick={() => onResolveTask(firstTask)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Xử lý ngay</span>
          </button>
        )}

        {onActionClick && (
          <button
            type="button"
            onClick={onActionClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100/60 active:bg-amber-200/60 text-amber-900 border border-amber-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <span>{isCurrentPatient ? 'Xem danh sách phiếu' : 'Chuyển đến ca này'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
