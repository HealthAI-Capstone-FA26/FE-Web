import React from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  CreditCard,
  Building2,
  Stethoscope,
  FileText,
  Ticket,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Printer,
  ArrowRight,
  UserX,
} from 'lucide-react';
import { type AppointmentItem } from '../../../services/appointment/appointment.service';

interface ReceptionAppointmentDetailModalProps {
  isOpen: boolean;
  appointment: AppointmentItem | null;
  onClose: () => void;
  onConfirm?: (appointment: AppointmentItem) => void;
  onCheckIn?: (appointment: AppointmentItem) => void;
  onNoShow?: (appointment: AppointmentItem) => void;
  onCancel?: (appointment: AppointmentItem) => void;
}

export const ReceptionAppointmentDetailModal: React.FC<ReceptionAppointmentDetailModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onConfirm,
  onCheckIn,
  onNoShow,
  onCancel,
}) => {
  if (!isOpen || !appointment) return null;

  // Format date helper
  const formatDateVN = (dateStr?: string) => {
    if (!dateStr) return '---';
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const cleanDate = dateStr.slice(0, 10);
      const [y, m, d] = cleanDate.split('-');
      if (y && m && d && y.length === 4) {
        const localDate = new Date(Number(y), Number(m) - 1, Number(d));
        return localDate.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatSingleTime = (timeStr?: string): string => {
    if (!timeStr) return '';
    try {
      if (timeStr.includes('T')) {
        const d = new Date(timeStr);
        if (!isNaN(d.getTime())) {
          const hours = String(d.getUTCHours()).padStart(2, '0');
          const minutes = String(d.getUTCMinutes()).padStart(2, '0');
          return `${hours}:${minutes}`;
        }
      }
      if (timeStr.includes(':')) {
        return timeStr.slice(0, 5);
      }
    } catch {
      // ignore
    }
    return timeStr;
  };

  const formatTimeSlot = (startTime?: string, endTime?: string, bookingChannel?: string) => {
    if (bookingChannel === 'at_hospital') return 'Đăng ký tại quầy';
    if (!startTime) return 'Theo lịch hẹn';
    const s = formatSingleTime(startTime);
    const e = formatSingleTime(endTime);
    return e ? `${s} - ${e}` : s;
  };

  // Status mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Chờ xác nhận
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Đã xác nhận (Chờ đến viện)
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đã tiếp nhận (Đang chờ khám)
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
            Đang khám
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            Hoàn tất khám
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            Đã hủy
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
            <UserX className="w-3.5 h-3.5 text-slate-500" />
            Vắng mặt / Quá giờ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const handlePrintTicket = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-300 font-bold border border-white/10">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Chi Tiết Lịch Hẹn Khám</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 font-bold border border-blue-400/30">
                  {appointment.bookingChannel === 'online' ? '📱 Đặt Online' : '🏥 Tại quầy'}
                </span>
              </div>
              <p className="text-xs text-blue-200 font-mono mt-0.5">
                Mã lịch hẹn: <span className="font-bold text-white">{appointment.appointmentCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Status & Queue Ticket Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái lịch hẹn</div>
              <div className="mt-1.5">{getStatusBadge(appointment.status)}</div>
            </div>

            {appointment.queueTicket ? (
              (() => {
                const prefix =
                  appointment.queueTicket.ticketPrefix ||
                  (appointment.bookingChannel === 'at_hospital' ? 'B' : 'A');
                const numStr = String(appointment.queueTicket.ticketNumber || 1).padStart(3, '0');
                const isPrefixA = prefix === 'A';

                return (
                  <div
                    className={`p-2.5 px-4 rounded-2xl flex items-center gap-3 shadow-md ${
                      isPrefixA
                        ? 'bg-teal-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    <Ticket className="w-6 h-6 text-white/80" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                        {isPrefixA ? 'Phiếu Khám (Online)' : 'Phiếu Khám (Tại Quầy)'}
                      </div>
                      <div className="text-xl font-black font-mono leading-none tracking-tight">
                        {prefix}
                        {numStr}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : appointment.status === 'confirmed' ? (
              <div className="p-2.5 px-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Bệnh nhân đã xác nhận, sẵn sàng bấm Check-in để cấp số</span>
              </div>
            ) : null}
          </div>

          {/* Block 1: Patient Information */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Thông Tin Bệnh Nhân Tiếp Nhận</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 font-medium block">Họ và tên:</span>
                <span className="font-extrabold text-slate-900 text-sm">{appointment.patient?.fullName || '---'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Mã hồ sơ BN:</span>
                <span className="font-mono font-bold text-blue-700">{appointment.patient?.patientCode || '---'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Số điện thoại liên hệ:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {appointment.patient?.phoneNumber || 'Chưa cập nhật'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Số CCCD / Định danh:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  {appointment.patient?.identityNumber || 'Chưa có CCCD'}
                </span>
              </div>
            </div>
          </div>

          {/* Block 2: Department & Doctor */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Chuyên Khoa & Bác Sĩ Phụ Trách</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 font-medium block">Khoa phòng khám:</span>
                <span className="font-extrabold text-slate-900">
                  {appointment.department?.departmentName || 'Khoa khám tổng quát'}
                </span>
                {appointment.department?.roomLocation && (
                  <span className="text-[11px] text-indigo-600 font-semibold block mt-0.5">
                    Phòng: {appointment.department.roomLocation}
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Bác sĩ khám:</span>
                <span className="font-extrabold text-slate-900">
                  {appointment.doctor?.fullName
                    ? `${appointment.doctor.title ? `${appointment.doctor.title} ` : ''}${appointment.doctor.fullName}`
                    : 'Bác sĩ trực chuyên khoa'}
                </span>
                {appointment.doctor?.specialization && (
                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                    Chuyên khoa: {appointment.doctor.specialization}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Block 3: Appointment Date & Slot */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Thời Gian Khám Đã Đặt</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 font-medium block">Ngày hẹn khám:</span>
                <span className="font-extrabold text-slate-900 capitalize">
                  {formatDateVN(appointment.appointmentDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Khung giờ (Slot):</span>
                <span className="font-extrabold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 inline-block mt-0.5">
                  {formatTimeSlot(
                    appointment.slot?.slotStartTime,
                    appointment.slot?.slotEndTime,
                    appointment.bookingChannel
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Block 4: Chief Complaint / Reason for visit */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Lý Do Khám & Triệu Chứng Ban Đầu</span>
            </div>
            <p className="text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
              {appointment.reasonForVisit || 'Không có ghi chú triệu chứng trước.'}
            </p>
          </div>

          {/* Cancel Reason (if cancelled) */}
          {appointment.status === 'cancelled' && appointment.cancelReason && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
              <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Lý do hủy lịch:</span>
              </div>
              <p className="text-xs text-rose-700 font-medium">{appointment.cancelReason}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {appointment.queueTicket && (
              <button
                type="button"
                onClick={handlePrintTicket}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>In phiếu khám</span>
              </button>
            )}

            {(appointment.status === 'pending' || appointment.status === 'confirmed') && onCancel && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCancel(appointment);
                }}
                className="px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer"
              >
                Hủy lịch
              </button>
            )}

            {appointment.status === 'confirmed' && onNoShow && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNoShow(appointment);
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 border-none rounded-xl transition-all cursor-pointer"
              >
                Báo vắng mặt
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
            >
              Đóng
            </button>

            {appointment.status === 'pending' && onConfirm && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onConfirm(appointment);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 border-none cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác Nhận Lịch</span>
              </button>
            )}

            {appointment.status === 'confirmed' && !appointment.queueTicket && onCheckIn && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCheckIn(appointment);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 border-none cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Tiếp Nhận & Check-in (Cấp STT)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
