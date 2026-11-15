import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { labTaskService, type LabTaskItem } from '../../services/lab/lab-task.service';
import type { LabTaskExceptionReason } from '../../types/lab-exception';
import { EXCEPTION_MESSAGES, getLabTaskStatusMeta } from '../../utils/labTaskStatus';
import { ExceptionReasonCards } from './ExceptionReasonCards';
import { LabTaskStatusBadge } from './LabTaskStatusBadge';

interface ReportExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: LabTaskItem | null;
  onSuccess: (updatedTask: LabTaskItem) => void;
  onToast?: (type: 'success' | 'error' | 'warning', message: string) => void;
}

export const ReportExceptionModal: React.FC<ReportExceptionModalProps> = ({
  isOpen,
  onClose,
  task,
  onSuccess,
  onToast,
}) => {
  const [reasonCode, setReasonCode] = useState<LabTaskExceptionReason | null>(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setReasonCode(null);
      setDetail('');
      setErrorMessage(null);
      setSubmitting(false);
    }
  }, [isOpen, task?.labTaskId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
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
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !task) return null;

  const handleChipSelect = (chipText: string) => {
    setDetail((prev) => {
      if (!prev.trim()) return chipText;
      if (prev.includes(chipText)) return prev;
      return `${prev.trim()}; ${chipText}`;
    });
    setErrorMessage(null);
  };

  const isOtherMissingDetail = reasonCode === 'other' && !detail.trim();
  const isTooLong = detail.length > 255;
  const isSubmitDisabled = !reasonCode || isOtherMissingDetail || isTooLong || submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonCode) {
      setErrorMessage(EXCEPTION_MESSAGES.MISSING_REASON);
      return;
    }
    if (isOtherMissingDetail) {
      setErrorMessage(EXCEPTION_MESSAGES.OTHER_MISSING_DETAIL);
      textareaRef.current?.focus();
      return;
    }
    if (isTooLong) {
      setErrorMessage(EXCEPTION_MESSAGES.MAX_LENGTH_255);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      const taskId = task.labTaskId;
      const updated = await labTaskService.reportException(taskId, reasonCode, detail.trim() || undefined);
      onToast?.('success', 'Đã báo cáo sự cố. Nhiệm vụ chuyển sang Chờ bác sĩ xử lý.');
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const statusMeta = getLabTaskStatusMeta(task.status);
      const msg =
        err instanceof Error
          ? err.message
          : EXCEPTION_MESSAGES.REPORT_INVALID_STATE(statusMeta.label);
      setErrorMessage(msg);
      onToast?.('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const patient = task.orderItem?.order?.encounter?.patient;
  const patientName = patient?.fullName || 'Bệnh nhân';
  const patientCode = patient?.patientCode || '—';
  const patientGender = patient?.gender === 'female' ? 'Nữ' : patient?.gender === 'male' ? 'Nam' : '—';
  const patientDob = patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('vi-VN') : '';
  const testName = task.orderItem?.testType?.testName || 'Xét nghiệm cận lâm sàng';
  const testCode = task.orderItem?.testType?.testCode || '';
  const orderCode = task.orderItem?.order?.orderCode || '—';
  const doctorName = task.orderItem?.order?.orderedByUser?.profile?.fullName || 'Bác sĩ điều trị';
  const roomName = task.labRoom?.labRoomName || 'Phòng xét nghiệm';
  const barcode = task.specimenCode;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-exception-modal-title"
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
          <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-red-50/40">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-600 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 id="report-exception-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
                  Báo cáo sự cố nhiệm vụ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhiệm vụ sẽ tạm dừng và chuyển cho bác sĩ chỉ định quyết định.
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
            {/* Read-only Task Summary */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <div>
                  <span className="font-semibold text-slate-900 text-sm">{patientName}</span>
                  <span className="text-slate-500 ml-2">
                    ({patientCode}) · {patientGender} {patientDob ? `· ${patientDob}` : ''}
                  </span>
                </div>
                <LabTaskStatusBadge status={task.status} task={task} size="sm" showTooltip={false} />
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600">
                <div>
                  <span className="text-slate-400">Xét nghiệm:</span>{' '}
                  <span className="font-medium text-slate-900">
                    {testName} {testCode ? `(${testCode})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Mã chỉ định:</span>{' '}
                  <span className="font-mono font-medium text-slate-800">{orderCode}</span>
                </div>
                <div>
                  <span className="text-slate-400">Bác sĩ chỉ định:</span>{' '}
                  <span className="font-medium text-slate-800">{doctorName}</span>
                </div>
                <div>
                  <span className="text-slate-400">Phòng thực hiện:</span>{' '}
                  <span className="font-medium text-slate-800">{roomName}</span>
                </div>
                {barcode && (
                  <div className="col-span-2">
                    <span className="text-slate-400">Mã ống mẫu:</span>{' '}
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                      {barcode}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Error banner inside modal */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Exception Reason Selector */}
            <ExceptionReasonCards
              selectedReason={reasonCode}
              onSelectReason={(code) => {
                setReasonCode(code);
                setErrorMessage(null);
              }}
              onSelectChip={handleChipSelect}
              disabled={submitting}
            />

            {/* Detail Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="exception-detail-input" className="font-semibold text-slate-800">
                  Mô tả chi tiết sự cố {reasonCode === 'other' && <span className="text-red-500">* (bắt buộc)</span>}
                </label>
                <span className={`text-[11px] ${detail.length > 255 ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                  {detail.length}/255
                </span>
              </div>
              <textarea
                id="exception-detail-input"
                ref={textareaRef}
                rows={3}
                value={detail}
                maxLength={300}
                onChange={(e) => {
                  setDetail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={submitting}
                placeholder="Mô tả cụ thể (VD: Ống nghiệm bị vỡ khi vận chuyển; bệnh nhân xin về sớm...)"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-400/30 focus:border-red-500 transition-colors placeholder:text-slate-400 resize-none"
              />
              {detail.length > 255 && (
                <p className="text-[11px] text-red-600 font-medium">Vượt quá độ dài tối đa 255 ký tự.</p>
              )}
            </div>

            {/* Warning Banner (BR-32) */}
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Sau khi báo cáo, bạn <strong>không thể tiếp tục thao tác</strong> trên nhiệm vụ này cho đến khi bác sĩ
                quyết định. Phòng xét nghiệm <strong>không có quyền huỷ chỉ định (BR-32)</strong>.
              </span>
            </div>

            {/* Hidden submit trigger */}
            <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/60">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer border-none bg-transparent disabled:opacity-50"
            >
              Huỷ bỏ
            </button>
            <button
              type="button"
              disabled={isSubmitDisabled}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi báo cáo...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Gửi báo cáo</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
