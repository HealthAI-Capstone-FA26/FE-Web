import React, { useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  RotateCcw,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { LabTaskItem } from '../../services/lab/lab-task.service';
import type { LabTaskExceptionReason } from '../../types/lab-exception';
import { EXCEPTION_REASONS_CONFIG } from '../../utils/labTaskStatus';
import { LabTaskStatusBadge } from './LabTaskStatusBadge';

interface ExceptionTimelineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: LabTaskItem | null;
}

export const ExceptionTimelineDrawer: React.FC<ExceptionTimelineDrawerProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const testName = task.orderItem?.testType?.testName || 'Xét nghiệm cận lâm sàng';
  const orderCode = task.orderItem?.order?.orderCode || '—';
  const doctorName = task.orderItem?.order?.orderedByUser?.profile?.fullName || 'Bác sĩ điều trị';
  const patient = task.orderItem?.order?.encounter?.patient;
  const patientName = patient?.fullName || 'Bệnh nhân';

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const isKnownReason =
    task.exceptionReasonCode && task.exceptionReasonCode in EXCEPTION_REASONS_CONFIG;
  const reasonConfig = isKnownReason
    ? EXCEPTION_REASONS_CONFIG[task.exceptionReasonCode as LabTaskExceptionReason]
    : null;
  const reasonTitle = reasonConfig?.title || task.exceptionReasonCode || 'Sự cố phòng xét nghiệm';

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end"
        role="dialog"
        aria-modal="true"
        aria-labelledby="timeline-drawer-title"
      >
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 id="timeline-drawer-title" className="text-base font-bold text-slate-900">
                  Chi tiết & Tiến trình sự cố
                </h3>
                <LabTaskStatusBadge status={task.status} task={task} size="sm" showTooltip={false} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {patientName} · {testName} ({orderCode})
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 p-1.5 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              aria-label="Đóng ngăn chi tiết"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timeline Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div className="relative border-l-2 border-slate-200 ml-3.5 space-y-6 pb-4">
              {/* Step 1: Tạo chỉ định */}
              <div className="relative pl-6">
                <div className="absolute -left-2.25 top-0.5 w-4.5 h-4.5 rounded-full bg-blue-100 border-2 border-blue-600 flex items-center justify-center text-blue-600">
                  <FileText className="w-2.5 h-2.5" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-slate-800">Tạo chỉ định</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Bác sĩ: <strong className="text-slate-700">{doctorName}</strong>
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(task.createdAt || task.orderItem?.order?.orderedAt)}
                  </div>
                </div>
              </div>

              {/* Step 2: Thanh toán */}
              <div className="relative pl-6">
                <div
                  className={`absolute -left-2.25 top-0.5 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${
                    task.paymentVerified
                      ? 'bg-emerald-100 border-emerald-600 text-emerald-700'
                      : 'bg-slate-100 border-slate-400 text-slate-500'
                  }`}
                >
                  <CreditCard className="w-2.5 h-2.5" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-slate-800">
                    {task.paymentVerified ? 'Đã xác nhận thanh toán' : 'Chưa thanh toán'}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {task.paymentVerified ? 'Thu ngân đã xác nhận (giữ nguyên khi thử lại)' : 'Chờ bệnh nhân thanh toán tại quầy'}
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    {task.createdAt ? formatDateTime(task.createdAt) : '—'}
                  </div>
                </div>
              </div>

              {/* Step 3: Tiếp nhận mẫu */}
              <div className="relative pl-6">
                <div
                  className={`absolute -left-2.25 top-0.5 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${
                    task.receivedAt
                      ? 'bg-blue-100 border-blue-600 text-blue-600'
                      : 'bg-slate-100 border-slate-300 text-slate-400'
                  }`}
                >
                  <User className="w-2.5 h-2.5" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-slate-800">Tiếp nhận mẫu xét nghiệm</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {task.assignedLabStaff ? (
                      <>
                        KTV tiếp nhận: <strong className="text-slate-700">{task.assignedLabStaff.profile?.fullName || task.assignedLabStaff.email}</strong>
                      </>
                    ) : (
                      'Chưa có KTV cố định'
                    )}
                    {task.specimenCode && (
                      <span className="block mt-0.5 font-mono text-[10px] text-slate-600">
                        Mã ống: {task.specimenCode}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    {task.receivedAt ? formatDateTime(task.receivedAt) : '—'}
                  </div>
                </div>
              </div>

              {/* Step 4: Báo cáo sự cố */}
              <div className="relative pl-6">
                <div className="absolute -left-2.25 top-0.5 w-4.5 h-4.5 rounded-full bg-amber-100 border-2 border-amber-600 flex items-center justify-center text-amber-700">
                  <AlertTriangle className="w-2.5 h-2.5" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <span>Báo cáo sự cố</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-200/70 text-amber-900 font-medium text-[10px]">
                      {reasonTitle}
                    </span>
                  </div>

                  <div className="mt-1.5 p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-slate-700 space-y-1">
                    {task.exceptionDetail ? (
                      <p className="italic text-[11px] text-slate-800">&quot;{task.exceptionDetail}&quot;</p>
                    ) : (
                      <p className="italic text-[11px] text-slate-500">Chưa có mô tả chi tiết từ phòng xét nghiệm.</p>
                    )}
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-amber-200/60 flex justify-between">
                      <span>Người báo: {task.exceptionReportedByName || 'KTV xét nghiệm'}</span>
                      <span>{formatDateTime(task.exceptionReportedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5: Bác sĩ xử lý */}
              <div className="relative pl-6">
                {task.status === 'on_hold' ? (
                  <>
                    <div className="absolute -left-2.25 top-0.5 w-4.5 h-4.5 rounded-full bg-amber-400 border-2 border-amber-500 flex items-center justify-center text-white animate-pulse">
                      <Clock className="w-2.5 h-2.5" />
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-amber-800">Đang chờ bác sĩ quyết định</div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Nhiệm vụ đang tạm dừng. Bác sĩ điều trị cần mở hồ sơ chỉ định để chọn Thử lại hoặc Huỷ.
                      </p>
                    </div>
                  </>
                ) : task.exceptionResolvedDecision === 'retry' ? (
                  <>
                    <div className="absolute -left-2.25 top-0.5 w-4.5 h-4.5 rounded-full bg-blue-100 border-2 border-blue-600 flex items-center justify-center text-blue-600">
                      <RotateCcw className="w-2.5 h-2.5" />
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-blue-800">Bác sĩ quyết định: Thử lại (Retry)</div>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Chuyển về hàng đợi sẵn sàng. Phí thanh toán được bảo lưu.
                      </p>
                      {task.exceptionResolveNote && (
                        <div className="mt-1 p-2 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] italic text-slate-800">
                          &quot;{task.exceptionResolveNote}&quot;
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                        <span>Bác sĩ: {task.exceptionResolvedByName || doctorName}</span>
                        <span>{formatDateTime(task.exceptionResolvedAt)}</span>
                      </div>
                    </div>
                  </>
                ) : task.exceptionResolvedDecision === 'cancel' || task.status === 'cancelled' ? (
                  <>
                    <div className="absolute -left-2.25 top-0.5 w-4.5 h-4.5 rounded-full bg-red-100 border-2 border-red-600 flex items-center justify-center text-red-600">
                      <XCircle className="w-2.5 h-2.5" />
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-red-800">Bác sĩ quyết định: Huỷ chỉ định</div>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Chỉ định đã được huỷ bỏ hoàn toàn theo ý kiến chuyên môn của bác sĩ.
                      </p>
                      {task.exceptionResolveNote && (
                        <div className="mt-1 p-2 bg-red-50/70 border border-red-200 rounded-lg text-[11px] italic text-slate-800">
                          &quot;{task.exceptionResolveNote}&quot;
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                        <span>Bác sĩ: {task.exceptionResolvedByName || doctorName}</span>
                        <span>{formatDateTime(task.exceptionResolvedAt)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute -left-2.25 top-0.5 w-4.5 h-4.5 rounded-full bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-emerald-800">Hoàn tất xử lý</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">
                        {formatDateTime(task.completedAt)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer border-none"
            >
              Đóng ngăn
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
