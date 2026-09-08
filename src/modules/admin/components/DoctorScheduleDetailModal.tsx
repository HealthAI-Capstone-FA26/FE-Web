import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  X,
  Clock,
  Building2,
  User,
  AlertTriangle,
  Loader2,
  XCircle,
  Sun,
  Sunset,
  Moon,
  Ban,
  Users,
  RefreshCw,
} from 'lucide-react';
import {
  doctorScheduleService,
  SESSION_CONFIG,
  type DoctorScheduleResponse,
} from '../../../services/doctor/doctor-schedule.service';
import type { DoctorResponse } from '../../../services/doctor/doctor.service';

interface DoctorScheduleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: DoctorScheduleResponse | null;
  doctor?: DoctorResponse;
  onScheduleUpdated: (message?: string) => void;
}

// Helper format time "HH:mm" from ISO string or Time string
const formatSlotTime = (isoString?: string): string => {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    // Fallback nếu chuỗi dạng "07:30"
    if (isoString.includes(':')) {
      return isoString.slice(0, 5);
    }
  } catch {
    // ignore
  }
  return '--:--';
};

// Helper format date "DD/MM/YYYY"
const formatDateVN = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  } catch {
    // ignore
  }
  return dateStr;
};

export const DoctorScheduleDetailModal: React.FC<DoctorScheduleDetailModalProps> = ({
  isOpen,
  onClose,
  schedule: initialSchedule,
  doctor,
  onScheduleUpdated,
}) => {
  // State chứa dữ liệu chi tiết ca trực được gọi từ API GET /doctor-schedules/:id
  const [scheduleData, setScheduleData] = useState<DoctorScheduleResponse | null>(initialSchedule);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // States cho việc Hủy ca trực
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Hàm gọi API GET /doctor-schedules/:id để lấy chi tiết mới nhất
  const fetchScheduleDetail = useCallback(async (scheduleId: string) => {
    setIsLoadingDetails(true);
    setFetchError(null);
    try {
      const freshData = await doctorScheduleService.getScheduleById(scheduleId);
      setScheduleData(freshData);
    } catch (err: any) {
      console.error('Lỗi khi gọi GET /doctor-schedules/:id:', err);
      setFetchError(err?.message || 'Không thể tải chi tiết ca trực từ máy chủ.');
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // Khi modal mở lên hoặc scheduleId thay đổi -> Gọi chính xác API GET /doctor-schedules/:id
  useEffect(() => {
    if (isOpen && initialSchedule?.scheduleId) {
      setScheduleData(initialSchedule);
      setShowCancelConfirm(false);
      setCancelReason('');
      setActionError(null);
      fetchScheduleDetail(initialSchedule.scheduleId);
    } else if (!isOpen) {
      setScheduleData(null);
      setFetchError(null);
    }
  }, [isOpen, initialSchedule, fetchScheduleDetail]);

  if (!isOpen) return null;

  const activeSchedule = scheduleData || initialSchedule;
  if (!activeSchedule) return null;

  const isCancelled = activeSchedule.status === 'cancelled';
  const slots = activeSchedule.appointmentSlots || [];

  // Thống kê các slot
  const freeSlots = slots.filter((s) => s.status === 'free' && (!s.bookedCount || s.bookedCount === 0));
  const bookedSlots = slots.filter((s) => s.status === 'booked' || s.status === 'full' || (s.bookedCount && s.bookedCount > 0));

  // Lấy icon và màu theo ca
  const sessionConfig = SESSION_CONFIG[activeSchedule.session] || {
    label: activeSchedule.session,
    defaultStart: '07:30',
    defaultEnd: '11:30',
  };

  const getSessionIcon = (sess: string) => {
    switch (sess) {
      case 'morning':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'afternoon':
        return <Sunset className="w-4 h-4 text-sky-500" />;
      case 'evening':
        return <Moon className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  // Xử lý Hủy ca trực / Báo nghỉ
  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    setActionError(null);

    try {
      const res = await doctorScheduleService.cancelSchedule(
        activeSchedule.scheduleId,
        cancelReason || 'Bác sĩ bận việc đột xuất'
      );
      const blockedCount = res.blockedFreeSlots || 0;
      const impactedCount = res.impactedBookedSlots || 0;

      let msg = `Đã hủy ca trực thành công! (${blockedCount} slot trống đã bị khóa`;
      if (impactedCount > 0) {
        msg += `, ${impactedCount} lịch hẹn của bệnh nhân cần được xử lý lại`;
      }
      msg += ')';

      onScheduleUpdated(msg);
      setShowCancelConfirm(false);
      onClose();
    } catch (err: any) {
      setActionError(err?.message || 'Không thể hủy ca trực. Vui lòng thử lại.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-700" />
                <span>Chi Tiết Ca Khám & Khung Giờ (Slots)</span>
              </h3>
              {isLoadingDetails ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Đang đồng bộ...
                </span>
              ) : isCancelled ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                  Đã Hủy / Nghỉ
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Đang Hoạt Động
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Dữ liệu chi tiết thời gian thực từ <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-mono text-slate-700">GET /doctor-schedules/{activeSchedule.scheduleId.slice(0, 8)}...</code>
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchScheduleDetail(activeSchedule.scheduleId)}
              disabled={isLoadingDetails}
              title="Tải lại dữ liệu mới nhất từ máy chủ"
              className="text-slate-400 hover:text-blue-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer border-none bg-transparent transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDetails ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer border-none bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fetch Error Notification */}
        {fetchError && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{fetchError} (Đang hiển thị dữ liệu đã lưu trữ tạm thời)</span>
          </div>
        )}

        {/* Action Error Alert */}
        {actionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Shift Overview Card */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Doctor Info */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-medium">Bác sĩ phụ trách</div>
              <div className="font-bold text-slate-900 truncate">
                {doctor ? `${doctor.title ? `${doctor.title} ` : ''}${doctor.fullName}` : 'Bác sĩ'}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                Mã BS: {doctor?.doctorCode || '---'} {doctor?.specialization ? `• ${doctor.specialization}` : ''}
              </div>
            </div>
          </div>

          {/* Department */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-medium">Khoa phòng khám</div>
              <div className="font-bold text-slate-900 truncate">
                {activeSchedule.department?.departmentName || 'Khoa khám bệnh'}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {activeSchedule.department?.roomLocation ? `Phòng: ${activeSchedule.department.roomLocation}` : 'Chưa xếp phòng'}
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
              {getSessionIcon(activeSchedule.session)}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-medium">Ngày & Ca trực</div>
              <div className="font-bold text-slate-900 truncate">
                {formatDateVN(activeSchedule.workDate)}
              </div>
              <div className="text-[10px] text-amber-800 font-semibold">
                {sessionConfig.label} ({formatSlotTime(activeSchedule.startTime)} - {formatSlotTime(activeSchedule.endTime)})
              </div>
            </div>
          </div>

          {/* Slot Settings & Capacity */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-medium">Cấu hình khung giờ (Slots)</div>
              <div className="font-bold text-slate-900">
                {activeSchedule.slotDurationMins} phút / slot • Max {activeSchedule.maxPatientsPerSlot} BN/slot
              </div>
              <div className="text-[10px] text-teal-800 font-semibold">
                Tổng cộng {slots.length} slots
              </div>
            </div>
          </div>
        </div>

        {/* Slot Statistics Summary Bar */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
            <div className="text-[10px] text-slate-500 font-medium">Tổng Khung Giờ</div>
            <div className="text-sm font-extrabold text-slate-900 mt-0.5">{slots.length} <span className="text-xs font-semibold text-slate-500">slots</span></div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="text-[10px] text-emerald-700 font-medium">Slot Trống (0 BN)</div>
            <div className="text-sm font-extrabold text-emerald-700 mt-0.5">{freeSlots.length} <span className="text-xs font-semibold text-emerald-600">slots</span></div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
            <div className="text-[10px] text-blue-700 font-medium">Slot Đang Có Hẹn</div>
            <div className="text-sm font-extrabold text-blue-700 mt-0.5">{bookedSlots.length} <span className="text-xs font-semibold text-blue-600">slots</span></div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900">
            <div className="text-[10px] text-purple-700 font-medium">Bệnh Nhân Đã Đặt</div>
            <div className="text-sm font-extrabold text-purple-700 mt-0.5">
              {slots.reduce((acc, s) => acc + (s.bookedCount || 0), 0)} / {slots.reduce((acc, s) => acc + (s.capacity || activeSchedule.maxPatientsPerSlot || 3), 0)} <span className="text-xs font-semibold text-purple-600">BN</span>
            </div>
          </div>
        </div>

        {/* Slot List Grid */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Danh Sách Các Khung Giờ Khám ({slots.length} Slots):</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Bệnh nhân đặt khám theo từng khung giờ này</span>
          </div>

          {slots.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-semibold">
              Chưa có slot khám nào được tạo cho ca này.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {slots.map((slot, index) => {
                const startTimeStr = formatSlotTime(slot.slotStartTime);
                const endTimeStr = formatSlotTime(slot.slotEndTime);
                const isFree = slot.status === 'free';
                const isBooked = slot.status === 'booked' || slot.status === 'full' || slot.bookedCount > 0;
                const isBlocked = slot.status === 'blocked';

                let cardStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                let badgeText = 'Trống';
                let badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';

                if (isBooked) {
                  cardStyle = 'bg-blue-50/70 border-blue-200 text-blue-900 font-semibold';
                  badgeText = `Đã đặt (${slot.bookedCount}/${slot.capacity})`;
                  badgeStyle = 'bg-blue-100 text-blue-800 border-blue-200';
                } else if (isBlocked || isCancelled) {
                  cardStyle = 'bg-rose-50/50 border-rose-200 text-rose-600 opacity-80';
                  badgeText = 'Khóa';
                  badgeStyle = 'bg-rose-100 text-rose-800 border-rose-200';
                } else if (isFree) {
                  cardStyle = 'bg-emerald-50/40 border-emerald-200/90 text-emerald-900';
                  badgeText = `Trống (0/${slot.capacity})`;
                  badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                }

                return (
                  <div
                    key={slot.slotId || index}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition-all text-xs ${cardStyle}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold">#{index + 1}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold border ${badgeStyle}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{startTimeStr} - {endTimeStr}</span>
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>Sức chứa:</span>
                      <span className="font-bold text-slate-700">{slot.capacity} BN</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cancel Confirmation Prompt */}
        {showCancelConfirm && !isCancelled && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
              <Ban className="w-4 h-4 text-rose-600" />
              <span>Xác nhận hủy ca trực & báo nghỉ</span>
            </div>
            <p className="text-[11px] text-rose-700 font-medium">
              Khi hủy ca trực, tất cả các slot còn trống sẽ tự động bị khóa (`blocked`). Nếu ca này đã có bệnh nhân đặt hẹn, hệ thống sẽ cảnh báo để chuyển dời lịch khám.
            </p>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-rose-900">Lý do hủy / Báo nghỉ:</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Bác sĩ bận công tác đột xuất, đi hội nghị..."
                className="w-full bg-white p-2 rounded-xl border border-rose-200 text-slate-900 outline-none focus:border-rose-500 font-semibold text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCancelling}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white font-bold cursor-pointer"
              >
                Không hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5 border-none disabled:opacity-50"
              >
                {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Xác Nhận Hủy Ca</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            {!isCancelled && !showCancelConfirm && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Hủy Ca Trực / Báo Nghỉ</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
