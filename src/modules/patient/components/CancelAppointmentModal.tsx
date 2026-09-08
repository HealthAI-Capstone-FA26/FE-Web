import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { appointmentService, type AppointmentItem } from '../../../services/appointment/appointment.service';

interface CancelAppointmentModalProps {
  appointment: AppointmentItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setError('Vui lòng nhập lý do hủy lịch hẹn');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await appointmentService.cancelAppointment(appointment.appointmentId, cancelReason.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="p-2 bg-rose-50 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Xác nhận hủy lịch khám</h3>
              <p className="text-xs text-slate-500 font-mono">Mã LH: {appointment.appointmentCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
          <p className="font-semibold">Lưu ý khi hủy lịch hẹn:</p>
          <p className="text-amber-800 leading-relaxed">
            Khung giờ khám đã giữ chỗ sẽ được giải phóng cho bệnh nhân khác. Nếu muốn đổi lịch, bạn có thể thực hiện đăng ký một lịch khám mới.
          </p>
        </div>

        <form onSubmit={handleCancel} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lý do hủy lịch <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="VD: Có việc bận đột xuất, muốn đổi bác sĩ/ngày khác..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
            />
            {error && <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Giữ lại lịch
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Đang xử lý...' : 'Xác nhận hủy'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
