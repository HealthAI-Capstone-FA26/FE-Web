import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { appointmentService, type AppointmentItem } from '../../../services/appointment/appointment.service';

interface RescheduleAppointmentModalProps {
  appointment: AppointmentItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RescheduleAppointmentModal: React.FC<RescheduleAppointmentModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const currentDateFormatted = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toISOString().slice(0, 10)
    : '';

  const [newDate, setNewDate] = useState<string>(currentDateFormatted);
  const [newTime, setNewTime] = useState<string>(appointment.appointmentTime ? appointment.appointmentTime.slice(0, 5) : '09:00');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      setErrorMsg('Vui lòng chọn ngày hẹn mới');
      return;
    }
    if (newDate < today) {
      setErrorMsg('Ngày hẹn mới không thể trong quá khứ');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await appointmentService.rescheduleAppointment(appointment.appointmentId, {
        appointmentDate: newDate,
        appointmentTime: newTime ? `${newTime}:00` : undefined,
        reason: reason.trim() || 'Bệnh nhân xin đổi ngày tái khám qua cổng thông tin',
      });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể đổi lịch hẹn, vui lòng thử lại sau');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đổi Lịch Hẹn Tái Khám"
      subtitle={`Mã lịch hẹn: ${appointment.appointmentCode} • Bác sĩ: ${appointment.doctor?.fullName || 'Bác sĩ phụ trách'}`}
    >
      <form onSubmit={handleReschedule} className="space-y-4 text-xs font-semibold">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-snug">{errorMsg}</div>
          </div>
        )}

        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
          <div className="text-[11px] text-blue-900 font-extrabold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Lịch hẹn hiện tại:</span>
          </div>
          <div className="text-slate-700 text-xs font-bold pl-5">
            {new Date(appointment.appointmentDate).toLocaleDateString('vi-VN')} {appointment.appointmentTime ? `• Giờ: ${appointment.appointmentTime.slice(0, 5)}` : ''}
          </div>
          {appointment.reasonForVisit && (
            <div className="text-[11px] text-slate-500 pl-5">
              Nội dung: {appointment.reasonForVisit}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-slate-700 font-bold">
              Ngày hẹn mới (*):
            </label>
            <input
              type="date"
              min={today}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-700 font-bold">
              Khung giờ mong muốn:
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-blue-600 bg-white"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-slate-700 font-bold">
            Lý do xin dời lịch:
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="vd: Bận công tác đột xuất, có việc gia đình..."
            className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 outline-none focus:border-blue-600 bg-white"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer border-none"
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Xác Nhận Đổi Lịch</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
