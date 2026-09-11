import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  UserCheck,
  XCircle,
  Eye,
  Ticket,
  Phone,
  Building2,
  Stethoscope,
  UserX,
  AlertTriangle,
  Loader2,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  appointmentService,
  type AppointmentItem,
} from '../../services/appointment/appointment.service';
import { ReceptionAppointmentDetailModal } from './components/ReceptionAppointmentDetailModal';
import { ReceptionCancelAppointmentModal } from './components/ReceptionCancelAppointmentModal';
import { SyncPatientModal } from './components/SyncPatientModal';
import { ConfirmMainPatientModal } from './components/ConfirmMainPatientModal';

type DatePreset = 'today' | 'tomorrow' | 'this_week' | 'all' | 'custom';

export const ReceptionAppointmentsView: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customFromDate, setCustomFromDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [customToDate, setCustomToDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Modals & Action States
  const [selectedAppointmentForDetail, setSelectedAppointmentForDetail] =
    useState<AppointmentItem | null>(null);
  const [selectedAppointmentForCancel, setSelectedAppointmentForCancel] =
    useState<AppointmentItem | null>(null);
  const [selectedAppointmentForSync, setSelectedAppointmentForSync] =
    useState<AppointmentItem | null>(null);
  const [selectedAppointmentForConfirmMain, setSelectedAppointmentForConfirmMain] =
    useState<AppointmentItem | null>(null);
  const [isProcessingActionId, setIsProcessingActionId] = useState<string | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper compute dates for query
  const getDateRange = useCallback((): { from?: string; to?: string } => {
    const today = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (datePreset === 'today') {
      const dStr = formatDate(today);
      return { from: dStr, to: dStr };
    }
    if (datePreset === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const dStr = formatDate(tomorrow);
      return { from: dStr, to: dStr };
    }
    if (datePreset === 'this_week') {
      const curr = new Date(today);
      const first = curr.getDate() - curr.getDay() + 1; // Monday
      const last = first + 6; // Sunday
      const monday = new Date(new Date(curr).setDate(first));
      const sunday = new Date(new Date(curr).setDate(last));
      return { from: formatDate(monday), to: formatDate(sunday) };
    }
    if (datePreset === 'custom') {
      return { from: customFromDate, to: customToDate };
    }
    // 'all'
    return {};
  }, [datePreset, customFromDate, customToDate]);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const dateRange = getDateRange();
      const data = await appointmentService.getAppointments({
        from: dateRange.from,
        to: dateRange.to,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      });
      setAppointments(data);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách lịch hẹn:', err);
      setError(err.message || 'Không thể tải danh sách lịch hẹn từ máy chủ');
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange, selectedStatus]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Filtered appointments on client side (for search and channel)
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Channel filter
      if (selectedChannel !== 'ALL' && app.bookingChannel !== selectedChannel) {
        return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const patientName = app.patient?.fullName?.toLowerCase() || '';
        const patientCode = app.patient?.patientCode?.toLowerCase() || '';
        const phone = app.patient?.phoneNumber || '';
        const cccd = app.patient?.identityNumber || '';
        const appCode = app.appointmentCode?.toLowerCase() || '';
        const doctorName = app.doctor?.fullName?.toLowerCase() || '';
        const deptName = app.department?.departmentName?.toLowerCase() || '';
        const ticketNum = app.queueTicket?.ticketNumber?.toLowerCase() || '';

        const match =
          patientName.includes(query) ||
          patientCode.includes(query) ||
          phone.includes(query) ||
          cccd.includes(query) ||
          appCode.includes(query) ||
          doctorName.includes(query) ||
          deptName.includes(query) ||
          ticketNum.includes(query);

        if (!match) return false;
      }

      return true;
    });
  }, [appointments, selectedChannel, searchTerm]);

  // Metric stats
  const stats = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((a) => a.status === 'pending').length;
    const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
    const checkedIn = appointments.filter((a) => a.status === 'checked_in').length;
    const inProgress = appointments.filter((a) => a.status === 'in_progress').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
    const noShow = appointments.filter((a) => a.status === 'no_show').length;

    return {
      total,
      pending,
      confirmed,
      checkedIn,
      inProgress,
      activeIntake: checkedIn + inProgress,
      completed,
      cancelled,
      noShow,
    };
  }, [appointments]);

  // Quick action: Confirm Appointment (pending -> confirmed)
  const handleConfirmAppointment = async (app: AppointmentItem) => {
    try {
      setIsProcessingActionId(app.appointmentId);
      await appointmentService.confirmAppointment(app.appointmentId);
      showToast(`Đã xác nhận lịch hẹn ${app.appointmentCode} thành công!`);
      fetchAppointments();
    } catch (err: any) {
      console.error('Lỗi khi xác nhận lịch hẹn:', err);
      showToast(err.message || 'Không thể xác nhận lịch hẹn', 'error');
    } finally {
      setIsProcessingActionId(null);
    }
  };

  // Quick action: Check-in Appointment (confirmed -> checked_in + issue QueueTicket)
  const handleCheckInAppointment = async (app: AppointmentItem) => {
    try {
      setIsProcessingActionId(app.appointmentId);
      const res = await appointmentService.checkInAppointment(app.appointmentId);
      const ticketNumber = res.queueTicket?.ticketNumber || 'A...';
      showToast(
        `Tiếp nhận thành công cho ${app.patient?.fullName || 'bệnh nhân'}! Số phiếu khám: ${ticketNumber}`
      );
      fetchAppointments();
    } catch (err: any) {
      console.error('Lỗi khi tiếp nhận/check-in:', err);
      showToast(err.message || 'Không thể tiếp nhận/check-in lịch hẹn', 'error');
    } finally {
      setIsProcessingActionId(null);
    }
  };

  // Quick action: No-show (confirmed -> no_show)
  const handleNoShowAppointment = async (app: AppointmentItem) => {
    if (
      !window.confirm(
        `Xác nhận đánh dấu bệnh nhân "${app.patient?.fullName || app.appointmentCode}" vắng mặt?`
      )
    ) {
      return;
    }

    try {
      setIsProcessingActionId(app.appointmentId);
      await appointmentService.markNoShowAppointment(app.appointmentId);
      showToast(`Đã ghi nhận vắng mặt cho lịch hẹn ${app.appointmentCode}`);
      fetchAppointments();
    } catch (err: any) {
      console.error('Lỗi khi báo vắng mặt:', err);
      showToast(err.message || 'Không thể ghi nhận vắng mặt', 'error');
    } finally {
      setIsProcessingActionId(null);
    }
  };

  // Format date helper (Timezone-safe)
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '---';
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const cleanDate = dateStr.slice(0, 10);
      const [y, m, d] = cleanDate.split('-');
      if (y && m && d && y.length === 4) {
        return `${d}/${m}/${y}`;
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', {
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

  const formatSlotTime = (startTime?: string, endTime?: string) => {
    if (!startTime) return '---';
    const s = formatSingleTime(startTime);
    const e = formatSingleTime(endTime);
    return e ? `${s} - ${e}` : s;
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Chờ xác nhận
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Check className="w-3 h-3 text-blue-600" />
            Đã xác nhận
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Đã check-in
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Stethoscope className="w-3 h-3 text-purple-600" />
            Đang khám
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-600" />
            Hoàn tất
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            Đã hủy
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
            <UserX className="w-3 h-3 text-slate-500" />
            Vắng mặt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Danh Sách Lịch Hẹn & Tiếp Nhận</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              Quầy Lễ Tân
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Theo dõi danh sách bệnh nhân đặt khám online & tại quầy, xác nhận lịch hẹn và check-in phát số thứ tự khám tự động.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAppointments}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 border-none cursor-pointer disabled:opacity-50"
            title="Tải lại dữ liệu mới nhất"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block">Tổng lịch hẹn</span>
          <div className="text-xl font-black text-slate-900 mt-1 flex items-center justify-between">
            <span>{stats.total}</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
            Trong phạm vi ngày đã chọn
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/40 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-800 block">Chờ xác nhận</span>
          <div className="text-xl font-black text-amber-700 mt-1 flex items-center justify-between">
            <span>{stats.pending}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-[10px] text-amber-600 font-medium block mt-0.5">
            Cần lễ tân kiểm tra & duyệt
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-blue-200/80 bg-blue-50/40 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-800 block">Đã xác nhận</span>
          <div className="text-xl font-black text-blue-700 mt-1 flex items-center justify-between">
            <span>{stats.confirmed}</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-[10px] text-blue-600 font-medium block mt-0.5">
            Sẵn sàng check-in khi BN đến
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 block">Đã cấp số / Đang khám</span>
          <div className="text-xl font-black text-emerald-700 mt-1 flex items-center justify-between">
            <span>{stats.activeIntake}</span>
            <Ticket className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
            {stats.checkedIn} chờ khám • {stats.inProgress} đang khám
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Thời gian:</span>
            </span>

            {(
              [
                { id: 'today', label: 'Hôm nay' },
                { id: 'tomorrow', label: 'Ngày mai' },
                { id: 'this_week', label: 'Tuần này' },
                { id: 'all', label: 'Tất cả' },
                { id: 'custom', label: 'Tùy chọn' },
              ] as { id: DatePreset; label: string }[]
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDatePreset(preset.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${datePreset === preset.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên BN, CCCD, SĐT, mã lịch hẹn, số phiếu..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary filters row (Custom date range + Status + Channel) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status dropdown filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-bold">Trạng thái:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="pending">⏳ Chờ xác nhận (pending)</option>
                <option value="confirmed">✅ Đã xác nhận (confirmed)</option>
                <option value="checked_in">🎫 Đã check-in (checked_in)</option>
                <option value="in_progress">🩺 Đang khám (in_progress)</option>
                <option value="completed">🎉 Đã hoàn tất (completed)</option>
                <option value="cancelled">❌ Đã hủy (cancelled)</option>
                <option value="no_show">🚫 Vắng mặt (no_show)</option>
              </select>
            </div>

            {/* Channel filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-bold">Kênh đặt:</span>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">Tất cả kênh</option>
                <option value="online">📱 Đặt Online</option>
                <option value="at_hospital">🏥 Trực tiếp tại quầy</option>
              </select>
            </div>
          </div>

          {/* Custom Date Inputs if preset == custom */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Từ:</span>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
              />
              <span className="text-slate-500 font-medium">Đến:</span>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Appointments Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-bold">Đang tải danh sách lịch hẹn từ máy chủ...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600 space-y-2">
            <AlertTriangle className="w-8 h-8 mx-auto text-rose-500" />
            <div className="text-sm font-bold">{error}</div>
            <button
              onClick={fetchAppointments}
              className="mt-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer border-none"
            >
              Thử lại
            </button>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-16 text-center space-y-2 text-slate-400">
            <Calendar className="w-10 h-10 mx-auto text-slate-300" />
            <div className="text-sm font-extrabold text-slate-600">
              Không tìm thấy lịch hẹn nào phù hợp
            </div>
            <p className="text-xs text-slate-400">
              {searchTerm
                ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.'
                : 'Chưa có lịch hẹn nào được ghi nhận trong khoảng thời gian này.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Mã Lịch Hẹn</th>
                  <th className="py-3.5 px-4">Bệnh Nhân</th>
                  <th className="py-3.5 px-4">Chuyên Khoa & Bác Sĩ</th>
                  <th className="py-3.5 px-4">Thời Gian Hẹn</th>
                  <th className="py-3.5 px-4 text-center">Số Phiếu (STT)</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAppointments.map((app) => {
                  const isPending = app.status === 'pending';
                  const isConfirmed = app.status === 'confirmed';
                  const isProcessing = isProcessingActionId === app.appointmentId;

                  return (
                    <tr
                      key={app.appointmentId}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Appointment Code & Channel */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-extrabold font-mono text-blue-950">
                          {app.appointmentCode}
                        </div>
                        <div className="mt-0.5">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${app.bookingChannel === 'online'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                          >
                            {app.bookingChannel === 'online' ? '📱 Online' : '🏥 Tại quầy'}
                          </span>
                        </div>
                      </td>

                      {/* Patient Info */}
                      <td className="py-3.5 px-4">
                        {!app.patientId && app.suggestedPatientId ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Cần đối chiếu CCCD
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 font-semibold">
                              Khách vãng lai trùng hồ sơ cũ
                            </div>
                            <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                              Chờ đối chiếu thẻ bản cứng tại quầy
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <span>{app.patient?.fullName || '---'}</span>
                              {app.patient?.status === 'draft' && (
                                <span
                                  className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-yellow-100 text-yellow-800 border border-yellow-300"
                                  title="Hồ sơ tạm (Draft) tạo từ đặt lịch guest - cần xác nhận thành main"
                                >
                                  Draft
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                              {app.patient?.patientCode && (
                                <span className="font-mono text-blue-700 font-bold">
                                  {app.patient.patientCode}
                                </span>
                              )}
                              {app.patient?.phoneNumber && (
                                <span className="flex items-center gap-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {app.patient.phoneNumber}
                                </span>
                              )}
                            </div>
                            {app.patient?.identityNumber && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                CCCD: {app.patient.identityNumber}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Department & Doctor */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{app.department?.departmentName || 'Khoa khám'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {app.doctor?.fullName ? (
                            <span>
                              {app.doctor.title ? `${app.doctor.title} ` : ''}
                              {app.doctor.fullName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Bác sĩ trực chuyên khoa</span>
                          )}
                        </div>
                        {app.department?.roomLocation && (
                          <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                            Phòng: {app.department.roomLocation}
                          </div>
                        )}
                      </td>

                      {/* Appointment Time & Slot */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{formatDateDisplay(app.appointmentDate)}</span>
                        </div>
                        <div className="text-[11px] font-bold text-teal-700 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-teal-500 shrink-0" />
                          <span>
                            {app.bookingChannel === 'at_hospital'
                              ? 'Đăng ký tại quầy'
                              : formatSlotTime(
                                app.slot?.slotStartTime || app.appointmentTime,
                                app.slot?.slotEndTime
                              )}
                          </span>
                        </div>
                      </td>

                      {/* Queue Ticket Number (Phân biệt rõ Phiếu A và Phiếu B) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {app.queueTicket ? (
                          (() => {
                            const prefix =
                              app.queueTicket.ticketPrefix ||
                              (app.bookingChannel === 'at_hospital' ? 'B' : 'A');
                            const numStr = String(app.queueTicket.ticketNumber || 1).padStart(3, '0');
                            const isPrefixA = prefix === 'A';

                            return (
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black font-mono shadow-2xs border ${isPrefixA
                                    ? 'bg-teal-50 text-teal-800 border-teal-300'
                                    : 'bg-amber-50 text-amber-900 border-amber-300'
                                  }`}
                                title={
                                  isPrefixA
                                    ? 'Phiếu A: Lịch đặt Online đã check-in'
                                    : 'Phiếu B: Đăng ký khám trực tiếp tại quầy'
                                }
                              >
                                <Ticket
                                  className={`w-3.5 h-3.5 ${isPrefixA ? 'text-teal-600' : 'text-amber-600'
                                    }`}
                                />
                                <span>
                                  {prefix}
                                  {numStr}
                                </span>
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-[11px] text-slate-400 italic font-normal">
                            Chưa cấp số
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatusBadge(app.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="w-[244px] mx-auto grid grid-cols-[32px_130px_32px_32px] gap-1.5 items-center">
                          {/* Cột 1: Nút xem chi tiết (Cố định 32px) */}
                          <button
                            type="button"
                            onClick={() => setSelectedAppointmentForDetail(app)}
                            className="w-8 h-8 flex items-center justify-center p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200 cursor-pointer bg-white"
                            title="Xem chi tiết lịch hẹn"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Cột 2: Nút hành động chính (Cố định 130px) */}
                          {!app.patientId && app.suggestedPatientId ? (
                            <button
                              type="button"
                              onClick={() => setSelectedAppointmentForSync(app)}
                              className="w-[130px] h-8 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 border-none cursor-pointer"
                              title="Đối chiếu thẻ CCCD của khách và đồng bộ vào hồ sơ có sẵn"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Đối chiếu CCCD</span>
                            </button>
                          ) : app.patient?.status === 'draft' ? (
                            <button
                              type="button"
                              onClick={() => setSelectedAppointmentForConfirmMain(app)}
                              className="w-[130px] h-8 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              title="Kiểm tra giấy tờ và chuyển hồ sơ bệnh nhân từ Draft sang Main"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Xác thực HS</span>
                            </button>
                          ) : isPending && app.patientId ? (
                            <button
                              type="button"
                              onClick={() => handleConfirmAppointment(app)}
                              disabled={isProcessing}
                              className="w-[130px] h-8 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 border-none cursor-pointer disabled:opacity-50"
                              title="Xác nhận lịch hẹn khám"
                            >
                              {isProcessing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Xác nhận</span>
                            </button>
                          ) : isConfirmed && app.patientId && !app.queueTicket ? (
                            <button
                              type="button"
                              onClick={() => handleCheckInAppointment(app)}
                              disabled={isProcessing}
                              className="w-[130px] h-8 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 border-none cursor-pointer disabled:opacity-50"
                              title="Tiếp nhận bệnh nhân & cấp số thứ tự vào hàng chờ khám"
                            >
                              {isProcessing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                              <span>Check-in</span>
                            </button>
                          ) : app.queueTicket ? (
                            <div className="w-[130px] h-8 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đã check-in</span>
                            </div>
                          ) : (
                            <div className="w-[130px] h-8" />
                          )}

                          {/* Cột 3: Nút hủy lịch hẹn (Cố định 32px, liền kề nút chính) */}
                          {isPending || isConfirmed ? (
                            <button
                              type="button"
                              onClick={() => setSelectedAppointmentForCancel(app)}
                              disabled={isProcessing}
                              className="w-8 h-8 flex items-center justify-center p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 cursor-pointer bg-white"
                              title="Hủy lịch hẹn"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="w-8 h-8" />
                          )}

                          {/* Cột 4: Nút báo vắng mặt (Cố định 32px, ngoài cùng bên phải) */}
                          {isConfirmed ? (
                            <button
                              type="button"
                              onClick={() => handleNoShowAppointment(app)}
                              disabled={isProcessing}
                              className="w-8 h-8 flex items-center justify-center p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer bg-white"
                              title="Báo bệnh nhân vắng mặt / không đến"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="w-8 h-8" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <ReceptionAppointmentDetailModal
        isOpen={!!selectedAppointmentForDetail}
        appointment={selectedAppointmentForDetail}
        onClose={() => setSelectedAppointmentForDetail(null)}
        onConfirm={(app) => {
          handleConfirmAppointment(app);
          setSelectedAppointmentForDetail(null);
        }}
        onCheckIn={(app) => {
          handleCheckInAppointment(app);
          setSelectedAppointmentForDetail(null);
        }}
        onNoShow={(app) => {
          handleNoShowAppointment(app);
          setSelectedAppointmentForDetail(null);
        }}
        onCancel={(app) => {
          setSelectedAppointmentForDetail(null);
          setSelectedAppointmentForCancel(app);
        }}
        onSync={(app) => {
          setSelectedAppointmentForDetail(null);
          setSelectedAppointmentForSync(app);
        }}
        onConfirmMain={(app) => {
          setSelectedAppointmentForDetail(null);
          setSelectedAppointmentForConfirmMain(app);
        }}
      />

      {/* Cancel Modal */}
      <ReceptionCancelAppointmentModal
        isOpen={!!selectedAppointmentForCancel}
        appointment={selectedAppointmentForCancel}
        onClose={() => setSelectedAppointmentForCancel(null)}
        onSuccess={() => {
          showToast('Đã hủy lịch hẹn thành công!');
          fetchAppointments();
        }}
      />

      {/* Sync Patient Modal (TH1: Khách vãng lai trùng khớp hồ sơ cũ) */}
      <SyncPatientModal
        isOpen={!!selectedAppointmentForSync}
        appointment={selectedAppointmentForSync}
        onClose={() => setSelectedAppointmentForSync(null)}
        onSuccess={() => {
          showToast('Đã đối chiếu và đồng bộ hồ sơ bệnh nhân thành công!');
          fetchAppointments();
        }}
      />

      {/* Confirm Main Patient Modal (TH2 & 3: Xác thực hồ sơ draft sang main) */}
      <ConfirmMainPatientModal
        isOpen={!!selectedAppointmentForConfirmMain}
        patient={selectedAppointmentForConfirmMain?.patient || null}
        appointmentCode={selectedAppointmentForConfirmMain?.appointmentCode}
        onClose={() => setSelectedAppointmentForConfirmMain(null)}
        onSuccess={() => {
          showToast('Đã xác thực hồ sơ bệnh nhân chính thức (Main) thành công!');
          fetchAppointments();
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-5 text-white ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-100" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
