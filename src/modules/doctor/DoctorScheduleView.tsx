import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarDays,
  Clock,
  Building2,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Filter,
  X,
  Sunrise,
  Sun,
  Moon,
  Stethoscope,
  Info,
  User,
  Ticket,
  FileText,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { Mascot } from 'page-mascot';
import { useAuth } from '../../context/AuthContext';
import {
  doctorScheduleService,
  type DoctorScheduleResponse,
  type AppointmentSlotResponse,
  type SlotAppointmentInfo,
  type ScheduleSession,
  SESSION_CONFIG,
} from '../../services/doctor/doctor-schedule.service';
import {
  doctorService,
  type DoctorResponse,
} from '../../services/doctor/doctor.service';

// Helper tính ngày đầu tuần (Thứ Hai)
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Format ngày YYYY-MM-DD
function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper format giờ:phút từ chuỗi ISO (vd "1970-01-01T07:30:00.000Z" hoặc "2026-09-23T07:30:00.000Z" -> "07:30")
function formatTimeHHmm(timeStr?: string | null, fallback = '--:--'): string {
  if (!timeStr) return fallback;
  if (timeStr.includes('T')) {
    const afterT = timeStr.split('T')[1];
    return afterT.slice(0, 5);
  }
  return timeStr.slice(0, 5);
}

// Helper tính tuổi từ ngày sinh
function calcAge(dobStr?: string): string {
  if (!dobStr) return '';
  try {
    const dob = new Date(dobStr);
    if (isNaN(dob.getTime())) return '';
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
      age--;
    }
    return age > 0 ? `${age} tuổi` : 'Dưới 1 tuổi';
  } catch {
    return '';
  }
}

const DAY_NAMES = [
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
  'Chủ Nhật',
];

const SESSION_STYLES: Record<
  ScheduleSession,
  {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    timeRange: string;
  }
> = {
  morning: {
    bg: 'bg-gradient-to-br from-amber-50/70 to-orange-50/40',
    border: 'border-amber-200/90 hover:border-amber-400',
    text: 'text-amber-800',
    badgeBg: 'bg-amber-100/90 text-amber-900 border-amber-200',
    icon: Sunrise,
    label: 'Ca Sáng',
    timeRange: '07:30 - 11:30',
  },
  afternoon: {
    bg: 'bg-gradient-to-br from-sky-50/70 to-blue-50/40',
    border: 'border-sky-200/90 hover:border-sky-400',
    text: 'text-sky-800',
    badgeBg: 'bg-sky-100/90 text-sky-900 border-sky-200',
    icon: Sun,
    label: 'Ca Chiều',
    timeRange: '13:00 - 17:00',
  },
  evening: {
    bg: 'bg-gradient-to-br from-purple-50/70 to-indigo-50/40',
    border: 'border-purple-200/90 hover:border-purple-400',
    text: 'text-purple-800',
    badgeBg: 'bg-purple-100/90 text-purple-900 border-purple-200',
    icon: Moon,
    label: 'Ca Tối',
    timeRange: '17:30 - 20:30',
  },
};

export const DoctorScheduleView: React.FC = () => {
  const { user } = useAuth();

  // Khởi tạo thông tin bác sĩ từ cache nếu có sẵn để hiển thị ngay lập tức (0ms)
  const [currentDoctor, setCurrentDoctor] = useState<DoctorResponse | null>(() => {
    try {
      const saved = localStorage.getItem('4am_cached_doctor');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.doctorId || parsed.doctorCode)) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [loadingDoctor, setLoadingDoctor] = useState<boolean>(() => !currentDoctor);
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => getMonday(new Date()));

  // Khởi tạo lịch trực từ sessionStorage cache của tuần này để hiển thị ngay lập tức (0ms)
  const [schedules, setSchedules] = useState<DoctorScheduleResponse[]>(() => {
    try {
      const mondayStr = toDateStr(getMonday(new Date()));
      const saved =
        sessionStorage.getItem(`4am_cached_schedules_${user?.doctorId}_${mondayStr}`) ||
        sessionStorage.getItem(`4am_cached_schedules_${mondayStr}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [loadingSchedules, setLoadingSchedules] = useState<boolean>(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');
  const [selectedScheduleForDetail, setSelectedScheduleForDetail] = useState<DoctorScheduleResponse | null>(null);

  // Tab điều hướng: 'schedule' (Lịch ca trực) | 'appointments' (Lịch hẹn đã đặt)
  const [activeTab, setActiveTab] = useState<'schedule' | 'appointments'>('schedule');
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState<string>('');
  const [appointmentDateFilter, setAppointmentDateFilter] = useState<string>('all');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<string>('all');

  // 1. Nhận diện Bác sĩ đăng nhập
  useEffect(() => {
    let isMounted = true;
    async function loadDoctorInfo() {
      if (!currentDoctor) {
        setLoadingDoctor(true);
      }
      try {
        let foundDoctor: DoctorResponse | null = null;

        // Ưu tiên 1: Tra cứu trực tiếp bằng doctorId nếu user profile đã có
        if (user?.doctorId) {
          try {
            foundDoctor = await doctorService.getDoctorById(user.doctorId);
          } catch {}
        }

        // Ưu tiên 2: Tra cứu hồ sơ bác sĩ theo userId
        if (!foundDoctor && user?.id) {
          try {
            foundDoctor = await doctorService.getDoctorByUserId(user.id);
          } catch {}
        }

        // Fallback: nếu chưa tìm thấy, lấy theo tên hoặc danh sách chung
        if (!foundDoctor) {
          const allDocs = await doctorService.getDoctors();
          foundDoctor =
            allDocs.find((d) => d.fullName?.toLowerCase().includes(user?.name?.toLowerCase() || '')) ||
            allDocs.find((d) => d.doctorDepartments && d.doctorDepartments.length > 0) ||
            allDocs[0] ||
            null;
        }

        if (isMounted && foundDoctor) {
          setCurrentDoctor(foundDoctor);
          try {
            localStorage.setItem('4am_cached_doctor', JSON.stringify(foundDoctor));
          } catch {}
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin bác sĩ:', err);
      } finally {
        if (isMounted) setLoadingDoctor(false);
      }
    }

    loadDoctorInfo();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // 2. Tải lịch ca trực của tuần đang chọn (chạy ngay lập tức với doctorId đã biết, không chờ loadDoctorInfo)
  const fetchSchedules = useCallback(async () => {
    let docId = currentDoctor?.doctorId || user?.doctorId;
    if (!docId) {
      try {
        const saved = localStorage.getItem('4am_cached_doctor');
        if (saved) {
          const parsed = JSON.parse(saved);
          docId = parsed?.doctorId;
        }
      } catch {}
    }
    if (!docId) return;

    const fromDate = toDateStr(currentWeekMonday);
    const sundayDate = new Date(currentWeekMonday);
    sundayDate.setDate(sundayDate.getDate() + 6);
    const toDate = toDateStr(sundayDate);
    const cacheKey = `4am_cached_schedules_${docId}_${fromDate}`;

    // Kiểm tra sessionStorage cache cho tuần này để hiển thị ngay
    const cachedStr = sessionStorage.getItem(cacheKey) || sessionStorage.getItem(`4am_cached_schedules_${fromDate}`);
    if (cachedStr) {
      try {
        const cachedList = JSON.parse(cachedStr);
        setSchedules(cachedList);
      } catch {}
    } else if (schedules.length === 0) {
      setLoadingSchedules(true);
    }

    try {
      const res = await doctorScheduleService.getSchedules({
        doctorId: docId,
        from: fromDate,
        to: toDate,
      });

      const list = res || [];
      setSchedules(list);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(list));
        sessionStorage.setItem(`4am_cached_schedules_${fromDate}`, JSON.stringify(list));
      } catch {}
    } catch (err) {
      console.error('Lỗi khi tải lịch làm việc của bác sĩ:', err);
    } finally {
      setLoadingSchedules(false);
    }
  }, [currentDoctor?.doctorId, user?.doctorId, currentWeekMonday]);

  useEffect(() => {
    fetchSchedules();
    const handleWorkspaceRefresh = () => fetchSchedules();
    window.addEventListener('workspace-refresh', handleWorkspaceRefresh);
    return () => window.removeEventListener('workspace-refresh', handleWorkspaceRefresh);
  }, [fetchSchedules]);

  // Điều hướng tuần
  const handlePrevWeek = () => {
    setCurrentWeekMonday((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekMonday((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleCurrentWeek = () => {
    setCurrentWeekMonday(getMonday(new Date()));
  };

  const isCurrentWeek = useMemo(() => {
    return toDateStr(currentWeekMonday) === toDateStr(getMonday(new Date()));
  }, [currentWeekMonday]);

  // Tính 7 ngày trong tuần được chọn
  const weekDays = useMemo(() => {
    const days: { date: Date; dateStr: string; dayName: string; isToday: boolean }[] = [];
    const todayStr = toDateStr(new Date());

    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekMonday);
      d.setDate(d.getDate() + i);
      const dStr = toDateStr(d);
      days.push({
        date: d,
        dateStr: dStr,
        dayName: DAY_NAMES[i],
        isToday: dStr === todayStr,
      });
    }
    return days;
  }, [currentWeekMonday]);

  // Danh sách các khoa mà bác sĩ đảm nhận
  const assignedDepartments = useMemo(() => {
    return currentDoctor?.doctorDepartments || [];
  }, [currentDoctor]);

  // Lọc ca trực theo khoa được chọn
  const filteredSchedules = useMemo(() => {
    if (selectedDepartmentId === 'all') return schedules;
    return schedules.filter((s) => s.departmentId === selectedDepartmentId);
  }, [schedules, selectedDepartmentId]);

  // Gom ca trực theo từng ngày trong tuần
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, DoctorScheduleResponse[]>();
    weekDays.forEach((w) => map.set(w.dateStr, []));

    filteredSchedules.forEach((sch) => {
      const dateKey = sch.workDate ? sch.workDate.slice(0, 10) : '';
      if (map.has(dateKey)) {
        map.get(dateKey)!.push(sch);
      }
    });

    // Sắp xếp ca trực trong ngày: Sáng -> Chiều -> Tối
    const sessionOrder: Record<ScheduleSession, number> = {
      morning: 1,
      afternoon: 2,
      evening: 3,
    };
    map.forEach((list) => {
      list.sort((a, b) => (sessionOrder[a.session] || 0) - (sessionOrder[b.session] || 0));
    });

    return map;
  }, [filteredSchedules, weekDays]);

  // Thống kê nhanh trong tuần
  const weeklyStats = useMemo(() => {
    const totalShifts = filteredSchedules.length;
    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;
    let totalCapacity = 0;
    let totalBooked = 0;

    filteredSchedules.forEach((s) => {
      if (s.session === 'morning') morningCount++;
      if (s.session === 'afternoon') afternoonCount++;
      if (s.session === 'evening') eveningCount++;

      if (s.appointmentSlots && s.appointmentSlots.length > 0) {
        s.appointmentSlots.forEach((slot) => {
          totalCapacity += slot.capacity || 1;
          totalBooked += slot.bookedCount || 0;
        });
      } else {
        totalCapacity += (s.maxPatientsPerSlot || 1) * 8;
      }
    });

    return {
      totalShifts,
      morningCount,
      afternoonCount,
      eveningCount,
      totalCapacity,
      totalBooked,
    };
  }, [filteredSchedules]);

  const sundayOfCurrentWeek = useMemo(() => {
    const s = new Date(currentWeekMonday);
    s.setDate(s.getDate() + 6);
    return s;
  }, [currentWeekMonday]);

  // Tổng hợp tất cả các lịch hẹn đã đặt trong tuần từ danh sách ca trực đang hiển thị
  const allBookedAppointments = useMemo(() => {
    const list: {
      appointment: SlotAppointmentInfo;
      slot: AppointmentSlotResponse;
      schedule: DoctorScheduleResponse;
    }[] = [];

    filteredSchedules.forEach((sch) => {
      sch.appointmentSlots?.forEach((slot) => {
        slot.appointments?.forEach((appt) => {
          list.push({
            appointment: appt,
            slot,
            schedule: sch,
          });
        });
      });
    });

    return list.sort((a, b) => {
      const timeA = new Date(a.slot.slotStartTime).getTime();
      const timeB = new Date(b.slot.slotStartTime).getTime();
      return timeA - timeB;
    });
  }, [filteredSchedules]);

  // Lọc danh sách lịch hẹn theo ô tìm kiếm, ngày và trạng thái
  const filteredBookedAppointments = useMemo(() => {
    return allBookedAppointments.filter((item) => {
      const { appointment, schedule } = item;
      const pat = appointment.patient || appointment.suggestedPatient;

      // Lọc theo ngày
      if (appointmentDateFilter !== 'all') {
        const schDate = toDateStr(new Date(schedule.workDate));
        if (schDate !== appointmentDateFilter) return false;
      }

      // Lọc theo trạng thái
      if (appointmentStatusFilter !== 'all') {
        if (appointment.status !== appointmentStatusFilter) return false;
      }

      // Lọc theo tìm kiếm
      if (appointmentSearchTerm.trim()) {
        const q = appointmentSearchTerm.trim().toLowerCase();
        const nameMatch = pat?.fullName?.toLowerCase().includes(q);
        const phoneMatch = pat?.phoneNumber?.includes(q);
        const codeMatch = appointment.appointmentCode?.toLowerCase().includes(q);
        const reasonMatch = appointment.reasonForVisit?.toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !codeMatch && !reasonMatch) return false;
      }

      return true;
    });
  }, [allBookedAppointments, appointmentDateFilter, appointmentStatusFilter, appointmentSearchTerm]);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. THẺ THÔNG TIN BÁC SĨ & PHÂN CÔNG CHUYÊN KHOA */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold shadow-sm shadow-teal-500/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {currentDoctor?.fullName || user?.name || 'Bác sĩ phụ trách'}
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                {currentDoctor?.doctorCode || user?.doctorId || (loadingDoctor ? 'Đang đồng bộ...' : 'BS-CLINICAL')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Học vị: <strong className="text-slate-700">{currentDoctor?.title || (loadingDoctor ? 'Đang đồng bộ...' : 'Bác sĩ chuyên khoa')}</strong></span>
              <span>•</span>
              <span>Chứng chỉ hành nghề: <strong className="text-slate-700">{currentDoctor?.licenseNumber || '---'}</strong></span>
            </p>
          </div>
        </div>

        {/* Danh sách các khoa đảm nhận */}
        <div className="flex flex-col sm:items-end gap-1.5">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Khoa / Trung tâm được phân công:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {assignedDepartments.length > 0 ? (
              assignedDepartments.map((rel) => (
                <span
                  key={rel.departmentId}
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl border ${rel.isPrimary
                      ? 'bg-teal-50 text-teal-800 border-teal-200 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                >
                  <Building2 className="w-3 h-3 text-teal-600 shrink-0" />
                  <span>{rel.department?.departmentName || 'Chuyên khoa'}</span>
                  {rel.isPrimary && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-200/80 text-teal-900 font-extrabold uppercase ml-0.5">
                      Chính
                    </span>
                  )}
                </span>
              ))
            ) : loadingDoctor ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl bg-slate-100 text-slate-400 animate-pulse font-medium">
                Đang cập nhật khoa trực...
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">Đang cập nhật khoa trực thuộc</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. CHUYỂN ĐỔI TAB: LỊCH CA TRỰC vs LỊCH HẸN ĐÃ ĐẶT */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'schedule'
              ? 'bg-teal-600 text-white shadow-xs shadow-teal-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Lịch Ca Trực Tuần</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'schedule' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {filteredSchedules.length} ca
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-teal-600 text-white shadow-xs shadow-teal-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Lịch Hẹn Đã Đặt</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'appointments'
                ? 'bg-amber-400 text-teal-950 shadow-2xs'
                : allBookedAppointments.length > 0
                ? 'bg-teal-100 text-teal-800'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {allBookedAppointments.length}
          </span>
        </button>
      </div>

      {/* 3. THANH CÔNG CỤ: CHUYỂN TUẦN & BỘ LỌC CHUYÊN KHOA */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Điều hướng tuần: Back - Next */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden bg-slate-50/70 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="px-2.5 py-1.5 hover:bg-white hover:text-teal-700 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1"
              title="Quay lại tuần trước (Back)"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <button
              type="button"
              onClick={handleNextWeek}
              className="px-2.5 py-1.5 hover:bg-white hover:text-teal-700 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1"
              title="Chuyển sang tuần sau (Next)"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {!isCurrentWeek && (
            <button
              type="button"
              onClick={handleCurrentWeek}
              className="px-2.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Quay về tuần hiện tại"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
              <span>Về tuần này</span>
            </button>
          )}

          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
            <CalendarDays className="w-4 h-4 text-teal-600" />
            <span>
              {currentWeekMonday.toLocaleDateString('vi-VN')} – {sundayOfCurrentWeek.toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>

        {/* Bộ lọc Khoa (khi bác sĩ kiêm nhiệm nhiều khoa) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Khoa trực:</span>
          </span>
          <select
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition cursor-pointer"
          >
            <option value="all">Tất cả các khoa ({assignedDepartments.length || 1})</option>
            {assignedDepartments.map((rel) => (
              <option key={rel.departmentId} value={rel.departmentId}>
                {rel.department?.departmentName || rel.departmentId} {rel.isPrimary ? '(Khoa chính)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* NỘI DUNG THEO TAB */}
      {activeTab === 'schedule' ? (
        <>
          {/* 3. THẺ THỐNG KÊ NHANH TRONG TUẦN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Tổng ca trực */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{isCurrentWeek ? 'Tổng ca tuần này' : 'Tổng ca trong tuần'}</span>
            <CalendarDays className="w-4 h-4 text-teal-600" />
          </div>
          {loadingSchedules && schedules.length === 0 ? (
            <div className="h-7 w-12 bg-slate-100 rounded-md animate-pulse mt-1" />
          ) : (
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              {weeklyStats.totalShifts} <span className="text-xs font-medium text-slate-400">ca</span>
            </div>
          )}
          <div className="text-[10px] text-teal-700 font-semibold mt-0.5">
            Được phân công
          </div>
        </div>

        {/* Ca Sáng */}
        <div className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>Ca Sáng (07:30 - 11:30)</span>
            <Sunrise className="w-4 h-4 text-amber-600" />
          </div>
          {loadingSchedules && schedules.length === 0 ? (
            <div className="h-7 w-12 bg-amber-50 rounded-md animate-pulse mt-1" />
          ) : (
            <div className="text-xl font-extrabold text-amber-900 mt-1">
              {weeklyStats.morningCount} <span className="text-xs font-medium text-amber-600/70">buổi</span>
            </div>
          )}
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            Khám ban ngày
          </div>
        </div>

        {/* Ca Chiều */}
        <div className="bg-white p-3.5 rounded-2xl border border-sky-100 shadow-2xs">
          <div className="flex items-center justify-between text-sky-700 text-xs font-semibold">
            <span>Ca Chiều (13:00 - 17:00)</span>
            <Sun className="w-4 h-4 text-sky-600" />
          </div>
          {loadingSchedules && schedules.length === 0 ? (
            <div className="h-7 w-12 bg-sky-50 rounded-md animate-pulse mt-1" />
          ) : (
            <div className="text-xl font-extrabold text-sky-900 mt-1">
              {weeklyStats.afternoonCount} <span className="text-xs font-medium text-sky-600/70">buổi</span>
            </div>
          )}
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            Khám buổi chiều
          </div>
        </div>

        {/* Ca Tối */}
        <div className="bg-white p-3.5 rounded-2xl border border-purple-100 shadow-2xs">
          <div className="flex items-center justify-between text-purple-700 text-xs font-semibold">
            <span>Ca Tối (17:30 - 20:30)</span>
            <Moon className="w-4 h-4 text-purple-600" />
          </div>
          {loadingSchedules && schedules.length === 0 ? (
            <div className="h-7 w-12 bg-purple-50 rounded-md animate-pulse mt-1" />
          ) : (
            <div className="text-xl font-extrabold text-purple-900 mt-1">
              {weeklyStats.eveningCount} <span className="text-xs font-medium text-purple-600/70">buổi</span>
            </div>
          )}
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            Khám ngoài giờ
          </div>
        </div>
      </div>

      {/* 4. LƯỚI LỊCH TUẦN 7 NGÀY (WEEKLY SCHEDULE GRID) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Chi Tiết Lịch Trực Theo Ngày Trong Tuần
            </h3>
          </div>
          <span className="text-xs text-slate-400 italic">
            💡 Nhấp vào ca trực bất kỳ để xem danh sách các slot khám và số lượng bệnh nhân
          </span>
        </div>

        {loadingSchedules && schedules.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100 min-h-[420px]">
            {weekDays.map((day) => (
              <div key={day.dateStr} className="flex flex-col p-3 space-y-3">
                <div className="pb-2.5 border-b border-slate-100 text-center">
                  <div className="h-4 w-16 bg-slate-100 rounded mx-auto animate-pulse" />
                  <div className="h-3 w-10 bg-slate-100 rounded mx-auto animate-pulse mt-1" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="h-20 bg-slate-50 border border-slate-100 rounded-xl animate-pulse" />
                  <div className="h-20 bg-slate-50 border border-slate-100 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100 min-h-[420px]">
            {weekDays.map((day) => {
              const daySchedules = schedulesByDate.get(day.dateStr) || [];
              return (
                <div
                  key={day.dateStr}
                  className={`flex flex-col p-3 transition-colors ${day.isToday ? 'bg-teal-50/20' : 'hover:bg-slate-50/40'
                    }`}
                >
                  {/* Header ngày */}
                  <div
                    className={`pb-2.5 mb-2.5 border-b text-center ${day.isToday
                        ? 'border-teal-300 text-teal-800'
                        : 'border-slate-100 text-slate-700'
                      }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-center gap-1">
                      <span>{day.dayName}</span>
                      {day.isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                      )}
                    </div>
                    <div
                      className={`text-[11px] font-mono mt-0.5 ${day.isToday
                          ? 'font-extrabold text-teal-700'
                          : 'text-slate-400 font-medium'
                        }`}
                    >
                      {day.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>

                  {/* Danh sách ca trực trong ngày */}
                  <div className="space-y-2 flex-1">
                    {daySchedules.length > 0 ? (
                      daySchedules.map((sch) => {
                        const style = SESSION_STYLES[sch.session] || SESSION_STYLES.morning;
                        const SessionIcon = style.icon;
                        const booked = sch.appointmentSlots?.reduce((acc, s) => acc + (s.bookedCount || 0), 0) || 0;
                        const capacity = sch.appointmentSlots?.reduce((acc, s) => acc + (s.capacity || 1), 0) || (sch.maxPatientsPerSlot * 8);

                        return (
                          <div
                            key={sch.scheduleId}
                            onClick={() => setSelectedScheduleForDetail(sch)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs group ${style.bg} ${style.border}`}
                          >
                            {/* Ca & Giờ */}
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${style.badgeBg}`}
                              >
                                <SessionIcon className="w-3 h-3" />
                                <span>{style.label}</span>
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-600">
                                {formatTimeHHmm(sch.startTime, style.timeRange.split(' - ')[0])} – {formatTimeHHmm(sch.endTime, style.timeRange.split(' - ')[1])}
                              </span>
                            </div>

                            {/* Tên Khoa (Quan trọng khi bác sĩ nhiều khoa) */}
                            <div className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-teal-700 transition-colors flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-teal-600 shrink-0" />
                              <span title={sch.department?.departmentName || 'Khoa khám'}>
                                {sch.department?.departmentName || 'Khoa khám'}
                              </span>
                            </div>

                            {/* Vị trí phòng khám */}
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {sch.department?.roomLocation || 'Phòng khám đa khoa'}
                              </span>
                            </div>

                            {/* Số lượng bệnh nhân */}
                            <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 font-medium flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span>Đã đặt:</span>
                              </span>
                              <span className="font-bold text-slate-800 font-mono">
                                {booked} / {capacity}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full min-h-[90px] rounded-xl border border-dashed border-slate-200/80 flex flex-col items-center justify-center text-slate-300 text-[11px] select-none p-2 text-center">
                        <span>Không có ca trực</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      ) : (
        /* TAB 2: DANH SÁCH LỊCH HẸN ĐÃ ĐẶT */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
          {/* Header & Bộ lọc nhanh */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Danh Sách Lịch Hẹn Đã Đặt Trong Tuần</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {filteredBookedAppointments.length} / {allBookedAppointments.length} lịch hẹn
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Danh sách bệnh nhân đã đặt trước qua hệ thống trực tuyến (Online & Guest) theo các ca trực của bạn.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Ô tìm kiếm */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm tên, SĐT, mã hẹn..."
                  value={appointmentSearchTerm}
                  onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white w-48 transition"
                />
                {appointmentSearchTerm && (
                  <button
                    onClick={() => setAppointmentSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Lọc theo ngày */}
              <select
                value={appointmentDateFilter}
                onChange={(e) => setAppointmentDateFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="all">Tất cả các ngày</option>
                {weekDays.map((d) => (
                  <option key={d.dateStr} value={d.dateStr}>
                    {d.dayName} ({d.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})
                  </option>
                ))}
              </select>

              {/* Lọc theo trạng thái */}
              <select
                value={appointmentStatusFilter}
                onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ đến viện tiếp đón</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="checked_in">Đã có mặt tại viện</option>
              </select>
            </div>
          </div>

          {/* Danh sách thẻ lịch hẹn */}
          {filteredBookedAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredBookedAppointments.map((item) => {
                const { appointment, slot, schedule } = item;
                const pat = appointment.patient || appointment.suggestedPatient;
                const fullName = pat?.fullName || 'Khách vãng lai';
                const phone = pat?.phoneNumber || '---';
                const genderText = pat?.gender === 'male' ? 'Nam' : pat?.gender === 'female' ? 'Nữ' : pat?.gender ? 'Khác' : '';
                const ageText = calcAge(pat?.dateOfBirth);
                const patientType = pat?.patientCode ? `Mã BN: ${pat.patientCode}` : 'Khách vãng lai (Mới)';

                let priorityLabel = 'Bình thường';
                let priorityBadge = 'bg-slate-100 text-slate-600 border-slate-200';
                if (appointment.priority === 'urgent') {
                  priorityLabel = 'Ưu tiên';
                  priorityBadge = 'bg-amber-100 text-amber-800 border-amber-300';
                } else if (appointment.priority === 'emergency') {
                  priorityLabel = 'Cấp cứu';
                  priorityBadge = 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
                }

                let statusLabel = 'Chờ đến viện tiếp đón';
                let statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
                if (appointment.status === 'confirmed') {
                  statusLabel = 'Đã xác nhận';
                  statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
                } else if (appointment.status === 'checked_in') {
                  statusLabel = 'Đã có mặt tại viện';
                  statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                }

                const workDateObj = new Date(schedule.workDate);
                const dateStr = workDateObj.toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });

                const sessionStyle = SESSION_STYLES[schedule.session] || SESSION_STYLES.morning;

                return (
                  <div
                    key={appointment.appointmentId || appointment.appointmentCode}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition space-y-3"
                  >
                    {/* Header card: Thời gian & Khoa ca */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 capitalize">
                          <CalendarDays className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="text-[11px] font-mono font-bold text-teal-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-teal-600" />
                          <span>{formatTimeHHmm(slot.slotStartTime)} – {formatTimeHHmm(slot.slotEndTime)}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-semibold border ml-1 ${sessionStyle.badgeBg}`}>
                            {sessionStyle.label}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${priorityBadge}`}>
                        {priorityLabel}
                      </span>
                    </div>

                    {/* Thông tin Bệnh nhân */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                          <User className="w-4 h-4 text-teal-600 shrink-0" />
                          <span>{fullName}</span>
                          {(genderText || ageText) && (
                            <span className="text-xs font-normal text-slate-500">
                              ({[genderText, ageText].filter(Boolean).join(', ')})
                            </span>
                          )}
                        </div>

                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusColor}`}>
                          <Clock className="w-2.5 h-2.5" />
                          <span>{statusLabel}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {phone && phone !== '---' && (
                          <span className="font-mono text-slate-700 font-semibold flex items-center gap-1">
                            📞 {phone}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                          <Ticket className="w-3 h-3 text-teal-600" />
                          <span>Mã hẹn: <strong className="text-slate-900">{appointment.appointmentCode}</strong></span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {patientType}
                        </span>
                      </div>
                    </div>

                    {/* Địa điểm khám & Lý do khám */}
                    <div className="pt-2 border-t border-slate-100/80 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{schedule.department?.departmentName || 'Khoa khám'}</span>
                        <span>•</span>
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{schedule.department?.roomLocation || 'Phòng khám'}</span>
                      </div>

                      <div className="flex items-start gap-1.5 text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs mt-1">
                        <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          <strong className="text-slate-800">Lý do khám:</strong> {appointment.reasonForVisit || 'Khám bệnh theo yêu cầu'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Mascot
                directions="/mascots/mydoctor-directions.png"
                reactions="/mascots/mydoctor-reactions.png"
                size={100}
              />
              <div className="space-y-1 max-w-sm">
                <p className="text-sm font-bold text-slate-700">
                  {allBookedAppointments.length === 0
                    ? isCurrentWeek
                      ? 'Chưa có lịch hẹn nào được đặt trước trong tuần này'
                      : 'Chưa có lịch hẹn nào được đặt trước trong tuần được chọn'
                    : 'Không tìm thấy lịch hẹn phù hợp với bộ lọc'}
                </p>
                <p className="text-xs text-slate-400">
                  {allBookedAppointments.length === 0
                    ? 'Khi có bệnh nhân đăng ký khám trực tuyến vào các ca trực của bạn, thông tin sẽ tự động hiển thị tại đây.'
                    : 'Thử xóa ô tìm kiếm hoặc chuyển điều kiện lọc ngày / trạng thái khác.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MODAL XEM CHI TIẾT CA TRỰC & DANH SÁCH SLOT KHÁM (VIEW-ONLY) */}
      {selectedScheduleForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Chi Tiết Ca Trực Bác Sĩ (Chỉ Xem)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ngày:{' '}
                    <strong className="text-slate-700">
                      {new Date(selectedScheduleForDetail.workDate).toLocaleDateString('vi-VN')}
                    </strong>{' '}
                    • {SESSION_CONFIG[selectedScheduleForDetail.session]?.label || selectedScheduleForDetail.session}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScheduleForDetail(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-200/70 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              {/* Box thông tin ca */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Khoa công tác:</span>
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>{selectedScheduleForDetail.department?.departmentName || '---'}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Vị trí phòng khám:</span>
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span>{selectedScheduleForDetail.department?.roomLocation || 'Phòng khám'}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Khung giờ ca trực:</span>
                  <span className="font-semibold text-slate-800 text-xs flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      {formatTimeHHmm(selectedScheduleForDetail.startTime, '07:30')} –{' '}
                      {formatTimeHHmm(selectedScheduleForDetail.endTime, '11:30')}
                    </span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Thời lượng mỗi slot:</span>
                  <span className="font-semibold text-slate-800 text-xs flex items-center gap-1 mt-0.5">
                    <span>{selectedScheduleForDetail.slotDurationMins || 15} phút / bệnh nhân</span>
                  </span>
                </div>
              </div>

              {/* Danh sách các slot cụ thể */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    <span>Danh sách khung giờ slot khám ({selectedScheduleForDetail.appointmentSlots?.length || 0} slots):</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Tự động phân bổ</span>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {selectedScheduleForDetail.appointmentSlots && selectedScheduleForDetail.appointmentSlots.length > 0 ? (
                    selectedScheduleForDetail.appointmentSlots.map((slot, idx) => {
                      const isBooked = (slot.bookedCount || 0) > 0;
                      return (
                        <div
                          key={slot.slotId || idx}
                          className={`rounded-xl border transition text-xs overflow-hidden ${
                            isBooked
                              ? 'border-teal-300 bg-teal-50/15 shadow-2xs'
                              : 'border-slate-200/80 bg-white hover:bg-slate-50/50'
                          }`}
                        >
                          {/* Slot Header */}
                          <div className="flex items-center justify-between p-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="font-mono font-bold text-slate-700">
                                {formatTimeHHmm(slot.slotStartTime)} – {formatTimeHHmm(slot.slotEndTime)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500">
                                Đã nhận: <strong className="text-slate-800">{slot.bookedCount || 0}/{slot.capacity || 1}</strong>
                              </span>
                              {slot.status === 'blocked' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  Đã khóa
                                </span>
                              ) : isBooked ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-teal-700" />
                                  <span>Đã có lịch hẹn</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
                                  Còn trống
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Thông tin chi tiết các bệnh nhân đã đặt nếu slot này isBooked */}
                          {isBooked && (
                            <div className="border-t border-teal-100 bg-teal-50/40 p-2.5 space-y-2">
                              {slot.appointments && slot.appointments.length > 0 ? (
                                slot.appointments.map((appt) => {
                                  const pat = appt.patient || appt.suggestedPatient;
                                  const fullName = pat?.fullName || 'Khách vãng lai';
                                  const phone = pat?.phoneNumber || '---';
                                  const genderText = pat?.gender === 'male' ? 'Nam' : pat?.gender === 'female' ? 'Nữ' : pat?.gender ? 'Khác' : '';
                                  const ageText = calcAge(pat?.dateOfBirth);
                                  const patientType = pat?.patientCode ? `Mã BN: ${pat.patientCode}` : 'Khách vãng lai (Mới)';

                                  let priorityLabel = 'Bình thường';
                                  let priorityBadge = 'bg-slate-100 text-slate-600 border-slate-200';
                                  if (appt.priority === 'urgent') {
                                    priorityLabel = 'Ưu tiên';
                                    priorityBadge = 'bg-amber-100 text-amber-800 border-amber-300';
                                  } else if (appt.priority === 'emergency') {
                                    priorityLabel = 'Cấp cứu';
                                    priorityBadge = 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
                                  }

                                  let statusLabel = 'Chờ đến viện tiếp đón';
                                  let statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
                                  if (appt.status === 'confirmed') {
                                    statusLabel = 'Đã xác nhận';
                                    statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
                                  } else if (appt.status === 'checked_in') {
                                    statusLabel = 'Đã có mặt tại viện';
                                    statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                                  }

                                  return (
                                    <div
                                      key={appt.appointmentId || appt.appointmentCode}
                                      className="bg-white rounded-xl p-2.5 border border-teal-200/80 shadow-2xs space-y-1.5"
                                    >
                                      {/* Hàng 1: Họ tên + Giới tính/Tuổi + SĐT + Mức độ ưu tiên */}
                                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                                          <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                          <span className="text-teal-950 font-bold">{fullName}</span>
                                          {(genderText || ageText) && (
                                            <span className="text-[11px] font-normal text-slate-500">
                                              • {[genderText, ageText].filter(Boolean).join(', ')}
                                            </span>
                                          )}
                                          {phone && phone !== '---' && (
                                            <span className="text-[11px] font-mono font-medium text-slate-600">
                                              ({phone})
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${priorityBadge}`}>
                                            {priorityLabel}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Hàng 2: Mã lịch hẹn + Phân loại bệnh nhân + Trạng thái */}
                                      <div className="flex items-center justify-between text-[11px] flex-wrap gap-1.5 text-slate-500 pt-0.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                                            <Ticket className="w-3 h-3 text-teal-600" />
                                            <span>Mã hẹn: <strong className="text-slate-900">{appt.appointmentCode}</strong></span>
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-medium">
                                            {patientType}
                                          </span>
                                        </div>

                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusColor}`}>
                                          <Clock className="w-2.5 h-2.5" />
                                          <span>{statusLabel}</span>
                                        </span>
                                      </div>

                                      {/* Hàng 3: Lý do khám / Triệu chứng */}
                                      <div className="flex items-start gap-1 text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100 mt-1">
                                        <FileText className="w-3 h-3 text-teal-600 shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">
                                          <strong className="text-slate-700">Lý do khám:</strong> {appt.reasonForVisit || 'Khám bệnh theo yêu cầu'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-[11px] text-teal-800 italic flex items-center gap-1.5 bg-white p-2 rounded-lg border border-teal-100">
                                  <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                  <span>Slot đã được đặt chỗ thành công qua hệ thống trực tuyến.</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Chưa có slot chi tiết cho ca này
                    </div>
                  )}
                </div>
              </div>

              {/* Ghi chú nghiệp vụ */}
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-teal-900 text-[11px] flex items-start gap-2">
                <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  Lịch ca trực này được quản lý và phân công bởi Ban Quản lý Bệnh viện / Trưởng khoa. Bác sĩ xem lịch để nắm vị trí phòng và chuẩn bị ca trực tương ứng.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedScheduleForDetail(null)}
                className="px-4 py-2 bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
