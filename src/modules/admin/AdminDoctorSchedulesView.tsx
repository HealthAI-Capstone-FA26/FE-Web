import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Plus,
  Zap,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  XCircle,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import {
  doctorScheduleService,
  type DoctorScheduleResponse,
  type ScheduleSession,
} from '../../services/doctor/doctor-schedule.service';
import {
  doctorService,
  type DoctorResponse,
  type DepartmentResponse,
} from '../../services/doctor/doctor.service';
import { CreateDoctorScheduleModal } from './components/CreateDoctorScheduleModal';
import { DoctorScheduleDetailModal } from './components/DoctorScheduleDetailModal';

// Helper: Lấy ngày Thứ Hai của tuần chứa ngày d
const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setHours(0, 0, 0, 0);
  return new Date(date.setDate(diff));
};

// Helper: Format date thành 'YYYY-MM-DD'
const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Format hiển thị thứ
const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

export const AdminDoctorSchedulesView: React.FC = () => {
  // Current selected week Monday
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => getMonday(new Date()));

  // Data states
  const [schedules, setSchedules] = useState<DoctorScheduleResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('ALL');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('ALL');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<'ALL' | ScheduleSession>('ALL');

  // Modal & Toast states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createDefaultDoctorId, setCreateDefaultDoctorId] = useState<string>('');
  const [createDefaultDate, setCreateDefaultDate] = useState<string>('');
  const [isWeeklyGenerating, setIsWeeklyGenerating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Detail Modal state
  const [selectedScheduleForDetail, setSelectedScheduleForDetail] = useState<DoctorScheduleResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Generate 7 days in the week
  const weekDays = useMemo(() => {
    const monday = new Date(currentWeekMonday);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return day;
    });
  }, [currentWeekMonday]);

  const fromDateStr = formatDateKey(weekDays[0]);
  const toDateStr = formatDateKey(weekDays[6]);

  // Fetch doctors & departments on mount
  useEffect(() => {
    doctorService.getDoctors().then(setDoctors).catch(console.error);
    doctorService.getDepartments().then(setDepartments).catch(console.error);
  }, []);

  // Fetch schedules for current week
  const fetchSchedules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await doctorScheduleService.getSchedules({
        from: fromDateStr,
        to: toDateStr,
        doctorId: selectedDoctorFilter !== 'ALL' ? selectedDoctorFilter : undefined,
      });
      setSchedules(data);
    } catch (err: any) {
      console.error('Lỗi tải lịch làm việc:', err);
      setError(err?.message || 'Không thể tải danh sách lịch làm việc từ máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [fromDateStr, toDateStr, selectedDoctorFilter]);

  // Handle Create Modal
  const handleOpenCreateModal = (doctorId = '', date = '') => {
    setCreateDefaultDoctorId(doctorId);
    setCreateDefaultDate(date || fromDateStr);
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = (msg?: string) => {
    fetchSchedules();
    if (msg) showToast(msg);
  };

  // Handle Detail Modal
  const handleOpenDetailModal = (sch: DoctorScheduleResponse) => {
    setSelectedScheduleForDetail(sch);
    setIsDetailModalOpen(true);
  };

  const handleDetailScheduleUpdated = (msg?: string) => {
    fetchSchedules();
    if (msg) showToast(msg);
  };

  // Handle Trigger Weekly Generate
  const handleTriggerWeeklyGenerate = async () => {
    if (!window.confirm(`Bạn có chắc muốn tự động sinh lịch trực cho tất cả bác sĩ trong tuần ${fromDateStr} đến ${toDateStr}?`)) {
      return;
    }

    setIsWeeklyGenerating(true);
    try {
      const res = await doctorScheduleService.triggerWeeklyGenerate(fromDateStr);
      showToast(res.message || `Đã tự động sinh thành công ${res.generated} ca trực trong tuần!`);
      fetchSchedules();
    } catch (err: any) {
      alert(err?.message || 'Không thể sinh lịch tuần tự động.');
    } finally {
      setIsWeeklyGenerating(false);
    }
  };

  // Week navigation
  const handlePrevWeek = () => {
    setCurrentWeekMonday((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekMonday((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  const handleCurrentWeek = () => {
    setCurrentWeekMonday(getMonday(new Date()));
  };

  // Filtered schedules list
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchesDept =
        selectedDepartmentFilter === 'ALL' || s.departmentId === selectedDepartmentFilter;
      const matchesSession =
        selectedSessionFilter === 'ALL' || s.session === selectedSessionFilter;
      return matchesDept && matchesSession;
    });
  }, [schedules, selectedDepartmentFilter, selectedSessionFilter]);

  // Compute statistics (Chỉ tính các ca và khung giờ đang hoạt động, loại trừ ca đã hủy)
  const stats = useMemo(() => {
    const activeSchedules = filteredSchedules.filter((s) => s.status !== 'cancelled');
    const cancelledShifts = filteredSchedules.filter((s) => s.status === 'cancelled').length;

    const totalActiveShifts = activeSchedules.length;
    const morningShifts = activeSchedules.filter((s) => s.session === 'morning').length;
    const afternoonShifts = activeSchedules.filter((s) => s.session === 'afternoon').length;
    const eveningShifts = activeSchedules.filter((s) => s.session === 'evening').length;

    let activeSlots = 0;
    let bookedSlots = 0;
    let totalPatientsBooked = 0;
    let totalPatientsCapacity = 0;

    // Chỉ đếm các khung giờ khám khả dụng (không tính ca đã hủy và slot bị khóa)
    activeSchedules.forEach((s) => {
      if (s.appointmentSlots) {
        s.appointmentSlots.forEach((slot) => {
          if (slot.status !== 'blocked') {
            activeSlots += 1;
            totalPatientsCapacity += slot.capacity || s.maxPatientsPerSlot || 3;
          }
          if (slot.status === 'booked' || slot.status === 'full' || (slot.bookedCount && slot.bookedCount > 0)) {
            bookedSlots += 1;
          }
          totalPatientsBooked += slot.bookedCount || 0;
        });
      }
    });

    return {
      totalShifts: totalActiveShifts,
      allShiftsCount: filteredSchedules.length,
      morningShifts,
      afternoonShifts,
      eveningShifts,
      cancelledShifts,
      totalSlots: activeSlots,
      bookedSlots,
      totalPatientsBooked,
      totalPatientsCapacity,
    };
  }, [filteredSchedules]);

  // Session display priority order
  const SESSION_ORDER: Record<ScheduleSession, number> = {
    morning: 1,
    afternoon: 2,
    evening: 3,
  };

  // Group schedules by Doctor & Date key for Grid Matrix and sort by session order
  const scheduleMatrix = useMemo(() => {
    const map = new Map<string, Map<string, DoctorScheduleResponse[]>>();

    filteredSchedules.forEach((s) => {
      const docId = s.doctorId;
      const dateKey = s.workDate.slice(0, 10);

      if (!map.has(docId)) {
        map.set(docId, new Map());
      }
      const docDateMap = map.get(docId)!;
      if (!docDateMap.has(dateKey)) {
        docDateMap.set(dateKey, []);
      }
      docDateMap.get(dateKey)!.push(s);
    });

    // Sắp xếp các ca trong ngày theo thứ tự: Sáng (1) -> Chiều (2) -> Tối (3)
    map.forEach((dateMap) => {
      dateMap.forEach((list) => {
        list.sort((a, b) => (SESSION_ORDER[a.session] || 99) - (SESSION_ORDER[b.session] || 99));
      });
    });

    return map;
  }, [filteredSchedules]);

  // List of doctors to display in grid (filtered if selected)
  const displayDoctors = useMemo(() => {
    let list = doctors;
    if (selectedDoctorFilter !== 'ALL') {
      list = list.filter((d) => d.doctorId === selectedDoctorFilter);
    }
    if (selectedDepartmentFilter !== 'ALL') {
      list = list.filter((d) =>
        d.doctorDepartments?.some((dd) => dd.departmentId === selectedDepartmentFilter)
      );
    }
    return list;
  }, [doctors, selectedDoctorFilter, selectedDepartmentFilter]);

  // Session icon & label helper
  const getSessionBadge = (session: ScheduleSession, startTime?: string, endTime?: string) => {
    const formatTime = (t?: string) => {
      if (!t) return '';
      if (t.includes('T')) {
        const d = new Date(t);
        if (!isNaN(d.getTime())) {
          const hours = String(d.getUTCHours()).padStart(2, '0');
          const mins = String(d.getUTCMinutes()).padStart(2, '0');
          return `${hours}:${mins}`;
        }
      }
      return t.slice(0, 5);
    };

    const formattedStart = formatTime(startTime);
    const formattedEnd = formatTime(endTime);
    const timeRange = formattedStart && formattedEnd ? ` (${formattedStart} - ${formattedEnd})` : '';

    if (session === 'morning') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Sun className="w-3 h-3 text-amber-500" />
          <span>Sáng{timeRange}</span>
        </span>
      );
    }
    if (session === 'afternoon') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
          <Sunset className="w-3 h-3 text-sky-500" />
          <span>Chiều{timeRange}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
        <Moon className="w-3 h-3 text-purple-500" />
        <span>Tối{timeRange}</span>
      </span>
    );
  };

  const isToday = (date: Date) => {
    return formatDateKey(date) === formatDateKey(new Date());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-700" />
            <span>Quản Lý Lịch Làm Việc & Phân Ca Bác Sĩ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lịch biểu phân ca trực tuần, theo dõi các khung giờ khám và tỷ lệ lấp đầy lịch hẹn
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleTriggerWeeklyGenerate}
            disabled={isWeeklyGenerating}
            className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all flex items-center gap-1.5 border border-indigo-200 cursor-pointer disabled:opacity-50"
            title="Tự động sinh lịch tuần cho tất cả bác sĩ"
          >
            {isWeeklyGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>⚡ Tự Động Sinh Lịch Tuần</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 border-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Ca Trực</span>
          </button>

          <button
            onClick={fetchSchedules}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 border-none cursor-pointer"
            title="Tải lại dữ liệu"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Week Navigator & Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Week Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Tuần trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleCurrentWeek}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            Hôm nay
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-extrabold text-slate-800">
              {weekDays[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} —{' '}
              {weekDays[6].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>

          <button
            onClick={handleNextWeek}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Tuần sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter by Department */}
          <div className="relative">
            <select
              value={selectedDepartmentFilter}
              onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-blue-600 transition-all cursor-pointer"
            >
              <option value="ALL">-- Tất cả chuyên khoa --</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Doctor */}
          <div className="relative">
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-blue-600 transition-all cursor-pointer"
            >
              <option value="ALL">-- Tất cả bác sĩ --</option>
              {doctors.map((doc) => (
                <option key={doc.doctorId} value={doc.doctorId}>
                  [{doc.doctorCode}] {doc.title ? `${doc.title} ` : ''}{doc.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Session */}
          <div className="relative">
            <select
              value={selectedSessionFilter}
              onChange={(e) => setSelectedSessionFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-blue-600 transition-all cursor-pointer"
            >
              <option value="ALL">Tất cả ca</option>
              <option value="morning">☀️ Ca Sáng</option>
              <option value="afternoon">🌤️ Ca Chiều</option>
              <option value="evening">🌙 Ca Tối</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold text-slate-500 block">Tổng ca trực hoạt động</span>
          <div className="text-xl font-black text-slate-900 mt-1 flex items-center justify-between">
            <span>{stats.totalShifts} ca</span>
            <span className="text-[10px] font-semibold text-slate-400">
              {stats.morningShifts} sáng • {stats.afternoonShifts} chiều{stats.eveningShifts > 0 ? ` • ${stats.eveningShifts} tối` : ''}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold text-slate-500 block">Khung giờ mở khám (Slots)</span>
          <div className="text-xl font-black text-blue-600 mt-1 flex items-center justify-between">
            <span>{stats.totalSlots} slot</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold text-slate-500 block">Bệnh nhân đã đặt hẹn</span>
          <div className="text-xl font-black text-emerald-600 mt-1 flex items-center justify-between">
            <span>
              {stats.totalPatientsBooked} / {stats.totalPatientsCapacity} <span className="text-xs font-bold text-emerald-700">BN</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md" title={`${stats.bookedSlots}/${stats.totalSlots} slot có hẹn`}>
              {stats.totalPatientsCapacity > 0
                ? Math.round((stats.totalPatientsBooked / stats.totalPatientsCapacity) * 100)
                : 0}%
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold text-slate-500 block">Ca đã báo nghỉ / hủy</span>
          <div className="text-xl font-black text-rose-600 mt-1 flex items-center justify-between">
            <span>{stats.cancelledShifts} ca</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Weekly Schedule Grid Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Đang tải lịch làm việc tuần này...</span>
          </div>
        ) : error ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-rose-600">
            <AlertCircle className="w-8 h-8" />
            <span className="text-xs font-bold">{error}</span>
            <button
              onClick={fetchSchedules}
              className="mt-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl cursor-pointer border-none"
            >
              Thử lại
            </button>
          </div>
        ) : displayDoctors.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <Stethoscope className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <div className="text-xs font-bold text-slate-700">Không tìm thấy bác sĩ nào</div>
            <p className="text-[11px] text-slate-400">Hãy thử đổi tiêu chí lọc chuyên khoa hoặc bác sĩ.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              {/* Header 7 Days */}
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-4 w-52 font-bold uppercase text-[10px] tracking-wider text-slate-400 sticky left-0 bg-slate-50/95 z-10 border-r border-slate-200">
                    Bác sĩ
                  </th>
                  {weekDays.map((day, idx) => {
                    const isCurrentDay = isToday(day);
                    return (
                      <th
                        key={idx}
                        className={`py-3 px-3 font-bold text-center border-r border-slate-100 last:border-r-0 ${
                          isCurrentDay ? 'bg-blue-50/80 text-blue-700' : ''
                        }`}
                      >
                        <div className="text-[11px]">{DAY_NAMES[idx]}</div>
                        <div
                          className={`text-xs mt-0.5 ${
                            isCurrentDay ? 'font-black text-blue-700' : 'font-semibold text-slate-800'
                          }`}
                        >
                          {day.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Rows: Doctors */}
              <tbody className="divide-y divide-slate-100">
                {displayDoctors.map((doc) => {
                  const docDateMap = scheduleMatrix.get(doc.doctorId);
                  const primaryDept = doc.doctorDepartments?.find((d) => d.isPrimary)?.department?.departmentName;

                  return (
                    <tr key={doc.doctorId} className="hover:bg-slate-50/50 transition-colors">
                      {/* Doctor Column */}
                      <td className="py-3 px-4 sticky left-0 bg-white z-10 border-r border-slate-200">
                        <div className="font-bold text-slate-900 text-xs truncate">
                          {doc.title ? `${doc.title} ` : ''}{doc.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          {doc.doctorCode} {primaryDept ? `• ${primaryDept}` : ''}
                        </div>
                      </td>

                      {/* 7 Days Columns */}
                      {weekDays.map((day, dIdx) => {
                        const dateKey = formatDateKey(day);
                        const daySchedules = docDateMap?.get(dateKey) || [];
                        const isCurrentDay = isToday(day);

                        return (
                          <td
                            key={dIdx}
                            className={`py-2.5 px-2 align-top border-r border-slate-100 last:border-r-0 ${
                              isCurrentDay ? 'bg-blue-50/20' : ''
                            }`}
                          >
                            {daySchedules.length === 0 ? (
                              <button
                                type="button"
                                onClick={() => handleOpenCreateModal(doc.doctorId, dateKey)}
                                className="w-full h-14 rounded-xl border border-dashed border-slate-200/80 flex items-center justify-center text-slate-300 text-[10px] hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/40 transition-all cursor-pointer group bg-transparent"
                                title={`Tạo ca trực cho ${doc.fullName} vào ${day.toLocaleDateString('vi-VN')}`}
                              >
                                <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ) : (
                              <div className="space-y-1.5">
                                {daySchedules.map((sch) => {
                                  const isCancelled = sch.status === 'cancelled';
                                  const slots = sch.appointmentSlots || [];
                                  const totalBookedPatients = slots.reduce(
                                    (acc, s) => acc + (s.bookedCount || 0),
                                    0
                                  );
                                  const totalCapacity = slots.reduce(
                                    (acc, s) => acc + (s.capacity || sch.maxPatientsPerSlot || 3),
                                    0
                                  );
                                  const bookedSlotsCount = slots.filter(
                                    (s) => (s.bookedCount && s.bookedCount > 0) || s.status === 'booked' || s.status === 'full'
                                  ).length;
                                  const totalSlotsCount = slots.length;
                                  const isAllFull =
                                    totalCapacity > 0 && totalBookedPatients >= totalCapacity;

                                  return (
                                    <div
                                      key={sch.scheduleId}
                                      onClick={() => handleOpenDetailModal(sch)}
                                      className={`p-2 rounded-xl border text-[11px] transition-all shadow-2xs cursor-pointer group ${
                                        isCancelled
                                          ? 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
                                          : 'bg-white border-slate-200/90 text-slate-800 hover:border-blue-400 hover:shadow-md hover:scale-[1.02]'
                                      }`}
                                      title={`Ca trực có ${totalSlotsCount} khung giờ. Đã đặt: ${totalBookedPatients}/${totalCapacity} bệnh nhân (${bookedSlotsCount}/${totalSlotsCount} slot có hẹn)`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        {getSessionBadge(sch.session, sch.startTime, sch.endTime)}
                                      </div>

                                      <div className="text-[10px] text-slate-500 font-medium mt-1 truncate group-hover:text-blue-600 transition-colors">
                                        {sch.department?.departmentName || 'Khoa'}
                                      </div>

                                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 text-[10px]">
                                        <span className="font-bold text-slate-700" title={`${bookedSlotsCount}/${totalSlotsCount} slot có hẹn`}>
                                          {totalBookedPatients}/{totalCapacity} BN
                                        </span>
                                        {isCancelled ? (
                                          <span className="text-rose-600 font-bold">Hủy</span>
                                        ) : isAllFull ? (
                                          <span className="text-rose-600 font-bold">Đầy</span>
                                        ) : (
                                          <span className="text-emerald-600 font-bold">Còn</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CREATE DOCTOR SCHEDULE MODAL (SEPARATE COMPONENT) */}
      <CreateDoctorScheduleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        doctors={doctors}
        departments={departments}
        defaultDoctorId={createDefaultDoctorId}
        defaultDate={createDefaultDate}
        onSuccess={handleCreateSuccess}
      />

      {/* DOCTOR SCHEDULE DETAIL MODAL (SEPARATE COMPONENT) */}
      <DoctorScheduleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedScheduleForDetail(null);
        }}
        schedule={selectedScheduleForDetail}
        doctor={doctors.find((d) => d.doctorId === selectedScheduleForDetail?.doctorId)}
        onScheduleUpdated={handleDetailScheduleUpdated}
      />
    </div>
  );
};
