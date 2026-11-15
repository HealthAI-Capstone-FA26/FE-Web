import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  Sparkles,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { labTaskService, type LabTaskItem } from '../../services/lab/lab-task.service';
import type {
  LabTaskExceptionDecision,
  LabTaskExceptionReason,
} from '../../types/lab-exception';
import {
  EXCEPTION_MESSAGES,
  EXCEPTION_REASONS_CONFIG,
} from '../../utils/labTaskStatus';
import { LabTaskStatusBadge } from './LabTaskStatusBadge';

interface ResolveExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: LabTaskItem | null;
  onSuccess: (updatedTask: LabTaskItem, decision: LabTaskExceptionDecision) => void;
  onRefetchRequired?: () => void;
  onToast?: (type: 'success' | 'error' | 'warning', message: string) => void;
}

export const ResolveExceptionModal: React.FC<ResolveExceptionModalProps> = ({
  isOpen,
  onClose,
  task,
  onSuccess,
  onRefetchRequired,
  onToast,
}) => {
  const [decision, setDecision] = useState<LabTaskExceptionDecision | null>(null);
  const [reasonNote, setReasonNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDecision(null);
      setReasonNote('');
      setErrorMessage(null);
      setSubmitting(false);
      setIsConfirmingCancel(false);
    }
  }, [isOpen, task?.labTaskId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        if (isConfirmingCancel) {
          setIsConfirmingCancel(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, submitting, isConfirmingCancel, onClose]);

  if (!isOpen || !task) return null;

  const reasonCode = task.exceptionReasonCode;
  const isKnownReason = reasonCode && reasonCode in EXCEPTION_REASONS_CONFIG;
  const reasonConfig = isKnownReason
    ? EXCEPTION_REASONS_CONFIG[reasonCode as LabTaskExceptionReason]
    : null;
  const suggestedDecision = reasonConfig?.suggestedDecision ?? null;

  const testName = task.orderItem?.testType?.testName || 'Xét nghiệm cận lâm sàng';
  const orderCode = task.orderItem?.order?.orderCode || '—';
  const roomName = task.labRoom?.labRoomName || 'Phòng xét nghiệm';
  const reporter = task.exceptionReportedByName || 'KTV phòng xét nghiệm';
  const reportedAt = task.exceptionReportedAt
    ? new Date(task.exceptionReportedAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      })
    : null;

  const isCancelMissingNote = decision === 'cancel' && !reasonNote.trim();
  const isTooLong = reasonNote.length > 255;
  const isSubmitDisabled = !decision || isCancelMissingNote || isTooLong || submitting;

  const executeResolve = async (confirmedDecision: LabTaskExceptionDecision) => {
    try {
      setSubmitting(true);
      setErrorMessage(null);
      const taskId = task.labTaskId;
      const updated = await labTaskService.resolveException(taskId, {
        decision: confirmedDecision,
        reason: reasonNote.trim() || undefined,
      });

      if (confirmedDecision === 'retry') {
        onToast?.('success', 'Đã chuyển chỉ định về hàng đợi phòng xét nghiệm.');
      } else {
        onToast?.('success', `Đã huỷ chỉ định ${testName}.`);
      }

      onSuccess(updated, confirmedDecision);
      onClose();
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : '';
      if (errText.includes('400') || errText.toLowerCase().includes('not on_hold') || errText.includes('trạng thái')) {
        const msg = EXCEPTION_MESSAGES.MSG25;
        setErrorMessage(msg);
        onToast?.('error', msg);
        onRefetchRequired?.();
        setTimeout(() => onClose(), 1500);
      } else if (errText.includes('409') || errText.toLowerCase().includes('conflict')) {
        const msg = EXCEPTION_MESSAGES.CONFLICT_ALREADY_RESOLVED;
        setErrorMessage(msg);
        onToast?.('error', msg);
        onRefetchRequired?.();
        setTimeout(() => onClose(), 1500);
      } else if (errText.includes('403')) {
        const msg = 'Chỉ bác sĩ mới có quyền xử lý sự cố.';
        setErrorMessage(msg);
        onToast?.('error', msg);
      } else {
        const msg = errText || 'Không thể xử lý sự cố. Vui lòng thử lại sau.';
        setErrorMessage(msg);
        onToast?.('error', msg);
      }
    } finally {
      setSubmitting(false);
      setIsConfirmingCancel(false);
    }
  };

  const handleInitialConfirm = () => {
    if (!decision) return;
    if (decision === 'cancel') {
      if (!reasonNote.trim()) {
        setErrorMessage(EXCEPTION_MESSAGES.CANCEL_MISSING_NOTE);
        noteRef.current?.focus();
        return;
      }
      setIsConfirmingCancel(true);
    } else {
      void executeResolve('retry');
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resolve-exception-modal-title"
      >
        <div className="fixed inset-0" onClick={() => !submitting && onClose()} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 my-4 sm:my-8 flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-amber-50/50">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 id="resolve-exception-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
                    Xử lý sự cố chỉ định cận lâm sàng
                  </h3>
                  <LabTaskStatusBadge status="on_hold" size="sm" showTooltip={false} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bác sĩ đưa ra quyết định lâm sàng: Thử lại (retry) hoặc Huỷ chỉ định (cancel).
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 p-1.5 rounded-full transition-colors cursor-pointer border-none bg-transparent disabled:opacity-50"
              aria-label="Đóng modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
            {/* Error banner inside modal */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Exception Info Block */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-start justify-between border-b border-amber-200/70 pb-2">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{testName}</span>
                  <div className="text-slate-600 mt-0.5">
                    Mã CĐ: <span className="font-mono font-medium text-slate-800">{orderCode}</span> · Phòng:{' '}
                    <span className="font-medium text-slate-800">{roomName}</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã thanh toán (giữ phí)
                </span>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0">Lý do báo cáo:</span>
                  <span className="font-semibold text-slate-900">
                    {reasonConfig ? reasonConfig.title : task.exceptionReasonCode || 'Chưa có dữ liệu (liên hệ phòng XN)'}
                  </span>
                </div>
                {task.exceptionDetail ? (
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500 shrink-0">Chi tiết từ KTV:</span>
                    <span className="text-slate-800 italic bg-white/70 px-2 py-1 rounded border border-amber-200/60 flex-1">
                      &quot;{task.exceptionDetail}&quot;
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic">
                    (Phòng xét nghiệm chưa đính kèm mô tả chi tiết, vui lòng liên hệ phòng nếu cần làm rõ)
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-amber-200/50">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    KTV: <strong className="text-slate-700">{reporter}</strong>
                  </span>
                  {reportedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {reportedAt}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Decision Radio Cards */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                Quyết định xử lý <span className="text-red-500">*</span>
              </label>

              <div role="radiogroup" aria-label="Quyết định xử lý sự cố" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* RETRY CARD */}
                <div
                  role="radio"
                  aria-checked={decision === 'retry'}
                  tabIndex={0}
                  onClick={() => {
                    setDecision('retry');
                    setErrorMessage(null);
                  }}
                  className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition-all select-none ${
                    decision === 'retry'
                      ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-400/30'
                      : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${decision === 'retry' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        <RotateCcw className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="font-bold text-sm text-slate-900">Thử lại</span>
                    </div>
                    {decision === 'retry' && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    Chuyển nhiệm vụ về hàng đợi phòng xét nghiệm để thực hiện lại (lấy lại mẫu…). Giữ nguyên thanh toán.
                  </p>
                  {suggestedDecision === 'retry' && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100/90 text-blue-800 text-[10px] font-semibold">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      Đề xuất cho sự cố này
                    </div>
                  )}
                </div>

                {/* CANCEL CARD */}
                <div
                  role="radio"
                  aria-checked={decision === 'cancel'}
                  tabIndex={0}
                  onClick={() => {
                    setDecision('cancel');
                    setErrorMessage(null);
                  }}
                  className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition-all select-none ${
                    decision === 'cancel'
                      ? 'border-red-500 bg-red-50/70 ring-2 ring-red-400/30'
                      : 'border-slate-200 bg-white hover:border-red-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${decision === 'cancel' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                        <XCircle className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="font-bold text-sm text-slate-900">Huỷ chỉ định</span>
                    </div>
                    {decision === 'cancel' && (
                      <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    Không thực hiện xét nghiệm này nữa. Chỉ định sẽ bị huỷ và không thể hoàn tác.
                  </p>
                  {suggestedDecision === 'cancel' && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100/90 text-red-800 text-[10px] font-semibold">
                      <Sparkles className="w-3 h-3 text-red-600" />
                      Đề xuất cho sự cố này
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Doctor Note */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="resolve-note-input" className="font-semibold text-slate-800">
                  Ghi chú của bác sĩ {decision === 'cancel' && <span className="text-red-500">* (bắt buộc khi huỷ)</span>}
                </label>
                <span className={`text-[11px] ${reasonNote.length > 255 ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                  {reasonNote.length}/255
                </span>
              </div>
              <textarea
                id="resolve-note-input"
                ref={noteRef}
                rows={3}
                value={reasonNote}
                maxLength={300}
                onChange={(e) => {
                  setReasonNote(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={submitting}
                placeholder={
                  decision === 'cancel'
                    ? 'Nhập lý do huỷ chỉ định (VD: Bệnh nhân đã ra viện / Đã thực hiện xét nghiệm tương đương)...'
                    : 'Ghi chú cho phòng xét nghiệm (VD: Lấy lại mẫu máu lúc đói sáng mai)...'
                }
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-400/30 focus:border-blue-500 transition-colors placeholder:text-slate-400 resize-none"
              />
              {reasonNote.length > 255 && (
                <p className="text-[11px] text-red-600 font-medium">Vượt quá độ dài tối đa 255 ký tự.</p>
              )}
            </div>

            {/* Second Step Confirm Dialog on Cancel */}
            {isConfirmingCancel && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-red-50 border border-red-300 rounded-xl space-y-2 text-xs text-red-900"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Xác nhận huỷ chỉ định:</span> Bạn có chắc chắn muốn huỷ{' '}
                    <strong>{testName}</strong> không? Thao tác này <strong>không thể hoàn tác</strong>.
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setIsConfirmingCancel(false)}
                    className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer font-medium text-xs"
                  >
                    Xem lại
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void executeResolve('cancel')}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer font-semibold text-xs inline-flex items-center gap-1.5"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Tôi chắc chắn muốn huỷ
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/60">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer border-none bg-transparent disabled:opacity-50"
            >
              Đóng
            </button>

            {!isConfirmingCancel && (
              <button
                type="button"
                disabled={isSubmitDisabled}
                onClick={handleInitialConfirm}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  decision === 'cancel'
                    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : decision === 'cancel' ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Xác nhận huỷ chỉ định</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Xác nhận thử lại</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
