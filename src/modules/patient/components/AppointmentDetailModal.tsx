import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Building2,
  Stethoscope,
  Phone,
  CreditCard,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Printer,
  CheckCircle2,
  Hourglass,
  Activity,
  Ticket,
  Loader2,
  XCircle
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { appointmentService, type AppointmentItem } from '../../../services/appointment/appointment.service';

interface AppointmentDetailModalProps {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onCancelRequest?: (appointment: AppointmentItem) => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointmentId,
  isOpen,
  onClose,
  onCancelRequest,
}) => {
  const [appointment, setAppointment] = useState<AppointmentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !appointmentId) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await appointmentService.getAppointmentById(appointmentId);
        setAppointment(data);
      } catch (err: any) {
        setError(err?.message || 'Không thể tải chi tiết lịch hẹn');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, appointmentId]);

  if (!isOpen) return null;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" size="md">Chờ xác nhận</Badge>;
      case 'confirmed':
        return <Badge variant="info" size="md">Đã xác nhận</Badge>;
      case 'checked_in':
        return <Badge variant="success" size="md">Đã check-in</Badge>;
      case 'in_progress':
        return <Badge variant="info" size="md">Đang khám</Badge>;
      case 'completed':
        return <Badge variant="success" size="md">Đã hoàn thành</Badge>;
      case 'cancelled':
        return <Badge variant="neutral" size="md">Đã hủy</Badge>;
      case 'no_show':
        return <Badge variant="critical" size="md">Vắng mặt</Badge>;
      default:
        return <Badge variant="neutral" size="md">{status || 'N/A'}</Badge>;
    }
  };

  const isCancellable = appointment?.status === 'pending' || appointment?.status === 'confirmed';

  // Timeline step active indicator
  const steps = [
    { key: 'pending', label: 'Đã đặt lịch' },
    { key: 'confirmed', label: 'Lễ tân xác nhận' },
    { key: 'checked_in', label: 'Check-in tại viện' },
    { key: 'in_progress', label: 'Bác sĩ khám' },
    { key: 'completed', label: 'Hoàn thành' },
  ];

  const getStepIndex = (status?: string) => {
    if (status === 'pending') return 0;
    if (status === 'confirmed') return 1;
    if (status === 'checked_in') return 2;
    if (status === 'in_progress') return 3;
    if (status === 'completed') return 4;
    return -1;
  };

  const currentStep = getStepIndex(appointment?.status);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-auto space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* HEADER */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">Chi Tiết Hồ Sơ Lịch Hẹn</h2>
              {appointment && getStatusBadge(appointment.status)}
            </div>
            {appointment && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>Mã lịch hẹn:</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  {appointment.appointmentCode}
                </span>
                <span className="text-slate-300">•</span>
                <span>Kênh: <strong className="text-slate-700">{appointment.bookingChannel === 'online' ? 'Trực tuyến (Online)' : 'Tại quầy'}</strong></span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOADING & ERROR */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Đang tải chi tiết hồ sơ lịch hẹn...</p>
          </div>
        ) : error || !appointment ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error || 'Không tìm thấy thông tin lịch hẹn'}</p>
          </div>
        ) : (
          <>
            {/* TIMELINE STEPPER (Only for non-cancelled/no_show) */}
            {appointment.status !== 'cancelled' && appointment.status !== 'no_show' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Tiến trình lịch khám</p>
                <div className="grid grid-cols-5 gap-2 relative">
                  {steps.map((step, idx) => {
                    const isDone = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={step.key} className="flex flex-col items-center text-center space-y-1.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] leading-tight font-semibold ${
                            isCurrent ? 'text-blue-700 font-bold' : isDone ? 'text-slate-800' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CANCELLED BANNER */}
            {appointment.status === 'cancelled' && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-900">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Lịch hẹn này đã bị hủy</span>
                </div>
                {appointment.cancelReason && (
                  <p className="text-rose-700">Lý do hủy: <strong>{appointment.cancelReason}</strong></p>
                )}
                {appointment.cancelledAt && (
                  <p className="text-[11px] text-rose-500">
                    Thời gian hủy: {new Date(appointment.cancelledAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            )}

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* LEFT 2 COLUMNS: CLINICAL & PATIENT DETAILS */}
              <div className="md:col-span-2 space-y-4 text-xs">
                
                {/* 1. Thông tin Bệnh nhân */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Thông tin Bệnh nhân</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Họ và tên:</span>
                      <strong className="text-slate-900 text-sm">{appointment.patient?.fullName || 'Bệnh nhân'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Mã bệnh nhân:</span>
                      <strong className="font-mono text-blue-700">{appointment.patient?.patientCode || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Ngày sinh:</span>
                      <span>
                        {appointment.patient?.dateOfBirth
                          ? new Date(appointment.patient.dateOfBirth).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Giới tính:</span>
                      <span>
                        {appointment.patient?.gender === 'male'
                          ? 'Nam'
                          : appointment.patient?.gender === 'female'
                          ? 'Nữ'
                          : 'Khác'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Số điện thoại:</span>
                      <span>{appointment.patient?.phoneNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Số CCCD / BHYT:</span>
                      <span>{appointment.patient?.identityNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Thông tin Chuyên khoa & Bác sĩ */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span>Chuyên Khoa & Bác Sĩ Phụ Trách</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Chuyên khoa:</span>
                      <strong className="text-slate-900">{appointment.department?.departmentName || 'Chuyên khoa tổng hợp'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Vị trí phòng khám:</span>
                      <span className="text-slate-800 font-medium">
                        {appointment.department?.roomLocation || appointment.department?.location || 'Phòng Khám Ngoại Trú'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">Bác sĩ phụ trách:</span>
                      <strong className="text-blue-900 text-sm">
                        {appointment.doctor?.title ? `${appointment.doctor.title}. ` : appointment.doctor?.academicRank ? `${appointment.doctor.academicRank}. ` : ''}
                        {appointment.doctor?.fullName || appointment.doctor?.user?.fullName || 'Bác sĩ phụ trách chuyên khoa'}
                        {appointment.doctor?.specialization ? ` (${appointment.doctor.specialization})` : ''}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3. Thời gian & Khung giờ Slot */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Thời Gian & Khung Giờ Khám</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Ngày khám:</span>
                      <strong className="text-emerald-800 text-sm">
                        {new Date(appointment.appointmentDate).toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Khung giờ slot:</span>
                      <strong className="text-blue-800 text-sm">
                        {new Date(appointment.appointmentTime).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'UTC',
                        })}
                        {appointment.slot
                          ? ` - ${new Date(appointment.slot.slotEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}`
                          : ''}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 4. Triệu chứng & Lý do khám */}
                {appointment.reasonForVisit && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px]">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Mô tả triệu chứng / Lý do đến khám:</span>
                    </div>
                    <p className="text-slate-800 text-xs leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                      {appointment.reasonForVisit}
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: APPOINTMENT SUMMARY & QUEUE TICKET */}
              <div className="space-y-4 flex flex-col justify-between">
                
                {/* QUEUE TICKET (If issued) */}
                {appointment.queueTicket ? (
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white text-center shadow-lg space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-blue-200 text-xs font-semibold">
                      <Ticket className="w-4 h-4" />
                      <span>Số Thứ Tự Hàng Đợi</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider py-1 text-amber-300">
                      {appointment.queueTicket.ticketNumber}
                    </div>
                    <span className="inline-block px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-medium">
                      Trạng thái: {appointment.queueTicket.queueStatus}
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-900 rounded-3xl p-5 text-white text-center shadow-lg space-y-3">
                    <span className="text-xs font-bold text-amber-300 block">Mã Tiếp Nhận Khám</span>
                    <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700 space-y-1">
                      <span className="text-[11px] text-slate-400 block font-medium">Mã đặt lịch:</span>
                      <span className="text-lg font-mono font-black text-blue-300 block tracking-wider">
                        {appointment.appointmentCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Vui lòng đọc mã này tại quầy Tiếp đón hoặc nhập vào Kiosk tự phục vụ khi đến bệnh viện.
                    </p>
                  </div>
                )}

                {/* GUIDANCE CARD */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-[11px] text-blue-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lưu ý khi đi khám:</span>
                  </p>
                  <p className="leading-relaxed text-blue-800">
                    Vui lòng có mặt tại viện trước giờ hẹn <strong>15 phút</strong> và mang theo CCCD/BHYT gốc để đối chiếu.
                  </p>
                </div>

                {/* MODAL BOTTOM ACTIONS */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handlePrint}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In phiếu hẹn khám</span>
                  </button>

                  {isCancellable && onCancelRequest && (
                    <button
                      onClick={() => onCancelRequest(appointment)}
                      className="w-full py-2.5 px-4 border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Hủy lịch hẹn này</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          </>
        )}

        {/* MODAL FOOTER */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-slate-900/10"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
