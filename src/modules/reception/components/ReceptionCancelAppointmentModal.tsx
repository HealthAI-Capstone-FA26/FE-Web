import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { appointmentService, type AppointmentItem } from '../../../services/appointment/appointment.service';

interface ReceptionCancelAppointmentModalProps {
  isOpen: boolean;
  appointment: AppointmentItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_CANCEL_REASONS = [
  'Bệnh nhân gọi điện yêu cầu hủy lịch',
  'Bệnh nhân đổi lịch sang ngày khác',
  'Bác sĩ có lịch công tác / cấp cứu đột xuất',
  'Thông tin đăng ký không chính xác / trùng lặp',
  'Lý do cá nhân của bệnh nhân',
];

export const ReceptionCancelAppointmentModal: React.FC<ReceptionCancelAppointmentModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onSuccess,
}) => {
  const [cancelReason, setCancelReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const finalReason = cancelReason === 'Lý do khác' ? customReason.trim() : cancelReason;

  const handleCancel = async () => {
    if (!finalReason) {
      setErrorMessage('Vui lòng chọn hoặc nhập lý do hủy lịch hẹn');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await appointmentService.cancelAppointment(appointment.appointmentId, finalReason);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi hủy lịch hẹn:', err);
      setErrorMessage(err.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-rose-950">Hủy Lịch Hẹn Khám</h3>
              <p className="text-xs text-rose-700 font-medium">
                Mã lịch: <span className="font-bold">{appointment.appointmentCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-white/60 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <div className="text-slate-500">
              Bệnh nhân: <span className="font-bold text-slate-800">{appointment.patient?.fullName || '---'}</span>
            </div>
            <div className="text-slate-500">
              Khoa khám: <span className="font-bold text-slate-800">{appointment.department?.departmentName || '---'}</span>
            </div>
            <div className="text-slate-500">
              Thời gian hẹn:{' '}
              <span className="font-bold text-slate-800">
                {new Date(appointment.appointmentDate).toLocaleDateString('vi-VN')}
                {appointment.slot ? ` (${appointment.slot.slotStartTime.slice(0, 5)} - ${appointment.slot.slotEndTime.slice(0, 5)})` : ''}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Lý do hủy lịch khám (*):</label>
            <div className="space-y-1.5">
              {COMMON_CANCEL_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    cancelReason === r
                      ? 'border-rose-400 bg-rose-50/60 text-rose-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <input
                    type="radio"
                    name="receptionCancelReason"
                    value={r}
                    checked={cancelReason === r}
                    onChange={() => setCancelReason(r)}
                    className="accent-rose-600"
                  />
                  <span>{r}</span>
                </label>
              ))}

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  cancelReason === 'Lý do khác'
                    ? 'border-rose-400 bg-rose-50/60 text-rose-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <input
                  type="radio"
                  name="receptionCancelReason"
                  value="Lý do khác"
                  checked={cancelReason === 'Lý do khác'}
                  onChange={() => setCancelReason('Lý do khác')}
                  className="accent-rose-600"
                />
                <span>Lý do khác...</span>
              </label>
            </div>

            {cancelReason === 'Lý do khác' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập chi tiết lý do hủy lịch hẹn..."
                rows={3}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-rose-500 font-medium text-xs text-slate-800"
              />
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting || !finalReason}
            className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 border-none cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang hủy...</span>
              </>
            ) : (
              <span>Xác Nhận Hủy Lịch</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
