import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  X,
  Loader2,
  Plus,
  AlertCircle,
  Sun,
  Sunset,
  Moon,
  Calendar,
  Clock,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import {
  doctorScheduleService,
  SESSION_CONFIG,
  type ScheduleSession,
} from '../../../services/doctor/doctor-schedule.service';
import type { DoctorResponse, DepartmentResponse } from '../../../services/doctor/doctor.service';

interface CreateDoctorScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: DoctorResponse[];
  departments: DepartmentResponse[];
  defaultDoctorId?: string;
  defaultDate?: string; // YYYY-MM-DD
  onSuccess: (message?: string) => void;
}

const WEEKDAY_OPTIONS = [
  { dayIndex: 0, label: 'Thứ 2', short: 'T2' },
  { dayIndex: 1, label: 'Thứ 3', short: 'T3' },
  { dayIndex: 2, label: 'Thứ 4', short: 'T4' },
  { dayIndex: 3, label: 'Thứ 5', short: 'T5' },
  { dayIndex: 4, label: 'Thứ 6', short: 'T6' },
  { dayIndex: 5, label: 'Thứ 7', short: 'T7' },
  { dayIndex: 6, label: 'Chủ Nhật', short: 'CN' },
];

const SESSION_METADATA: {
  session: ScheduleSession;
  label: string;
  defaultStart: string;
  defaultEnd: string;
  icon: any;
  color: string;
}[] = [
  {
    session: 'morning',
    label: SESSION_CONFIG.morning.label,
    defaultStart: SESSION_CONFIG.morning.defaultStart,
    defaultEnd: SESSION_CONFIG.morning.defaultEnd,
    icon: Sun,
    color: 'border-amber-200 bg-amber-50/70 text-amber-900',
  },
  {
    session: 'afternoon',
    label: SESSION_CONFIG.afternoon.label,
    defaultStart: SESSION_CONFIG.afternoon.defaultStart,
    defaultEnd: SESSION_CONFIG.afternoon.defaultEnd,
    icon: Sunset,
    color: 'border-sky-200 bg-sky-50/70 text-sky-900',
  },
  {
    session: 'evening',
    label: SESSION_CONFIG.evening.label,
    defaultStart: SESSION_CONFIG.evening.defaultStart,
    defaultEnd: SESSION_CONFIG.evening.defaultEnd,
    icon: Moon,
    color: 'border-purple-200 bg-purple-50/70 text-purple-900',
  },
];

interface SessionTimeSetting {
  startTime: string;
  endTime: string;
}

const INITIAL_SESSION_TIMES: Record<ScheduleSession, SessionTimeSetting> = {
  morning: {
    startTime: SESSION_CONFIG.morning.defaultStart,
    endTime: SESSION_CONFIG.morning.defaultEnd,
  },
  afternoon: {
    startTime: SESSION_CONFIG.afternoon.defaultStart,
    endTime: SESSION_CONFIG.afternoon.defaultEnd,
  },
  evening: {
    startTime: SESSION_CONFIG.evening.defaultStart,
    endTime: SESSION_CONFIG.evening.defaultEnd,
  },
};

// Safe date formatter 'YYYY-MM-DD'
const safeFormatDate = (d?: Date | null): string => {
  if (!d || isNaN(d.getTime())) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Safe helper: Lấy Thứ Hai của tuần chứa ngày dateStr
const safeGetMonday = (dateStr?: string): string => {
  try {
    let date: Date;
    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-').map(Number);
      date = new Date(y, m - 1, d);
    } else if (dateStr) {
      date = new Date(dateStr);
    } else {
      date = new Date();
    }
    if (isNaN(date.getTime())) date = new Date();

    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    return safeFormatDate(date);
  } catch {
    return safeFormatDate(new Date());
  }
};

export const CreateDoctorScheduleModal: React.FC<CreateDoctorScheduleModalProps> = ({
  isOpen,
  onClose,
  doctors = [],
  departments = [],
  defaultDoctorId = '',
  defaultDate = '',
  onSuccess,
}) => {
  // Mode: 'single' (1 ngày cụ thể) | 'batch' (Nhiều ngày trong tuần)
  const [mode, setMode] = useState<'single' | 'batch'>('single');

  // Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(defaultDoctorId);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');

  // Single mode state
  const [singleWorkDate, setSingleWorkDate] = useState<string>(() => {
    return defaultDate && /^\d{4}-\d{2}-\d{2}$/.test(defaultDate)
      ? defaultDate
      : safeFormatDate(new Date());
  });

  // Batch mode state
  const [weekMondayDate, setWeekMondayDate] = useState<string>(() => {
    return safeGetMonday(defaultDate || safeFormatDate(new Date()));
  });
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4]); // Mặc định T2 - T6

  // Selected sessions (hỗ trợ chọn nhiều ca: Sáng, Chiều, Tối)
  const [selectedSessions, setSelectedSessions] = useState<ScheduleSession[]>(['morning']);

  // Custom times per session (Cho phép Admin chỉnh sửa giờ bắt đầu & kết thúc tự do)
  const [customSessionTimes, setCustomSessionTimes] =
    useState<Record<ScheduleSession, SessionTimeSetting>>(INITIAL_SESSION_TIMES);

  // Slot duration & max patients
  const [slotDurationMins, setSlotDurationMins] = useState<number>(30);
  const [maxPatientsPerSlot, setMaxPatientsPerSlot] = useState<number>(1);

  // Submitting & status states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync default values when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDoctorId(defaultDoctorId);
      const targetDate =
        defaultDate && /^\d{4}-\d{2}-\d{2}$/.test(defaultDate)
          ? defaultDate
          : safeFormatDate(new Date());
      setSingleWorkDate(targetDate);
      setWeekMondayDate(safeGetMonday(targetDate));
      setSelectedSessions(['morning']);
      setCustomSessionTimes(INITIAL_SESSION_TIMES);
      setSlotDurationMins(30);
      setMaxPatientsPerSlot(1);
      setFormError(null);
      setMode('single');

      // Tự động gán khoa chính của bác sĩ nếu có
      if (defaultDoctorId) {
        const doc = (doctors || []).find((d) => d.doctorId === defaultDoctorId);
        const primaryDept = doc?.doctorDepartments?.find((dd) => dd.isPrimary);
        if (primaryDept) {
          setSelectedDepartmentId(primaryDept.departmentId);
        } else {
          setSelectedDepartmentId('');
        }
      } else {
        setSelectedDepartmentId('');
      }
    }
  }, [isOpen, defaultDoctorId, defaultDate, doctors]);

  // Khi thay đổi bác sĩ được chọn, tự động gợi ý Khoa chính của bác sĩ
  useEffect(() => {
    if (selectedDoctorId) {
      const doc = (doctors || []).find((d) => d.doctorId === selectedDoctorId);
      const primaryDept = doc?.doctorDepartments?.find((dd) => dd.isPrimary);
      if (primaryDept) {
        setSelectedDepartmentId(primaryDept.departmentId);
      }
    }
  }, [selectedDoctorId, doctors]);

  const selectedDoctor = (doctors || []).find((d) => d.doctorId === selectedDoctorId);
  const primaryDoctorDept = selectedDoctor?.doctorDepartments?.find((dd) => dd.isPrimary);
  const primaryDepartmentId = primaryDoctorDept?.departmentId;

  // Sắp xếp danh sách khoa: Khoa chính lên đầu (kèm nhãn ⭐), các khoa kiêm nhiệm kế tiếp, sau đó đến các khoa khác
  const sortedDepartments = useMemo(() => {
    if (!departments || departments.length === 0) return [];
    if (!selectedDoctor?.doctorDepartments) return departments;

    const assignedIds = new Set(selectedDoctor.doctorDepartments.map((dd) => dd.departmentId));

    return [...departments].sort((a, b) => {
      // Khoa chính lên đầu tiên
      if (a.departmentId === primaryDepartmentId) return -1;
      if (b.departmentId === primaryDepartmentId) return 1;

      // Các khoa đã gán cho bác sĩ lên tiếp theo
      const aAssigned = assignedIds.has(a.departmentId);
      const bAssigned = assignedIds.has(b.departmentId);
      if (aAssigned && !bAssigned) return -1;
      if (!aAssigned && bAssigned) return 1;

      return a.departmentName.localeCompare(b.departmentName, 'vi');
    });
  }, [departments, selectedDoctor, primaryDepartmentId]);

  // Toggle ca trực (Session)
  const toggleSession = (session: ScheduleSession) => {
    setSelectedSessions((prev) =>
      prev.includes(session)
        ? prev.length > 1
          ? prev.filter((s) => s !== session)
          : prev
        : [...prev, session]
    );
  };

  // Thay đổi giờ bắt đầu / giờ kết thúc của 1 ca cụ thể
  const handleTimeChange = (
    session: ScheduleSession,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setCustomSessionTimes((prev) => ({
      ...prev,
      [session]: {
        ...prev[session],
        [field]: value,
      },
    }));
  };

  // Khôi phục giờ mặc định cho 1 ca
  const handleResetSessionTime = (session: ScheduleSession) => {
    setCustomSessionTimes((prev) => ({
      ...prev,
      [session]: { ...INITIAL_SESSION_TIMES[session] },
    }));
  };

  // Toggle ngày trong tuần (Batch mode)
  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.length > 1
          ? prev.filter((d) => d !== dayIndex)
          : prev
        : [...prev, dayIndex].sort((a, b) => a - b)
    );
  };

  // Quick select day presets
  const handleSelectWorkdays = () => setSelectedDays([0, 1, 2, 3, 4]); // T2 - T6
  const handleSelectAllDays = () => setSelectedDays([0, 1, 2, 3, 4, 5, 6]); // Cả tuần
  const handleSelectWeekend = () => setSelectedDays([5, 6]); // T7, CN

  // Tính danh sách các ca trực sẽ được tạo (Target List)
  const targetShiftsToCreate = useMemo(() => {
    const list: {
      workDate: string;
      session: ScheduleSession;
      startTime: string;
      endTime: string;
    }[] = [];

    if (mode === 'single') {
      if (singleWorkDate && /^\d{4}-\d{2}-\d{2}$/.test(singleWorkDate)) {
        selectedSessions.forEach((session) => {
          const timeCfg = customSessionTimes[session] || INITIAL_SESSION_TIMES[session];
          list.push({
            workDate: singleWorkDate,
            session,
            startTime: timeCfg.startTime,
            endTime: timeCfg.endTime,
          });
        });
      }
    } else {
      if (weekMondayDate && /^\d{4}-\d{2}-\d{2}$/.test(weekMondayDate)) {
        const [y, m, d] = weekMondayDate.split('-').map(Number);
        const monday = new Date(y, m - 1, d);
        if (!isNaN(monday.getTime())) {
          selectedDays.forEach((dayIdx) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + dayIdx);
            const dateStr = safeFormatDate(date);

            selectedSessions.forEach((session) => {
              const timeCfg = customSessionTimes[session] || INITIAL_SESSION_TIMES[session];
              list.push({
                workDate: dateStr,
                session,
                startTime: timeCfg.startTime,
                endTime: timeCfg.endTime,
              });
            });
          });
        }
      }
    }

    return list;
  }, [mode, singleWorkDate, weekMondayDate, selectedDays, selectedSessions, customSessionTimes]);

  if (!isOpen) return null;

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setFormError('Vui lòng chọn Bác sĩ cần phân ca trực');
      return;
    }
    if (targetShiftsToCreate.length === 0) {
      setFormError('Vui lòng chọn ít nhất 1 ngày và 1 ca làm việc');
      return;
    }

    // Kiểm tra tính hợp lệ của giờ bắt đầu và giờ kết thúc
    for (const session of selectedSessions) {
      const timeCfg = customSessionTimes[session] || INITIAL_SESSION_TIMES[session];
      const meta = SESSION_METADATA.find((s) => s.session === session);
      const label = meta?.label || session;

      if (!timeCfg.startTime || !timeCfg.endTime) {
        setFormError(`Vui lòng nhập đầy đủ Giờ bắt đầu và Giờ kết thúc cho ${label}`);
        return;
      }
      if (timeCfg.startTime >= timeCfg.endTime) {
        setFormError(
          `Giờ bắt đầu (${timeCfg.startTime}) phải nhỏ hơn Giờ kết thúc (${timeCfg.endTime}) cho ${label}`
        );
        return;
      }
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      // Gửi đồng thời các ca đã chọn kèm startTime và endTime tùy chỉnh lên Backend
      const promises = targetShiftsToCreate.map((item) =>
        doctorScheduleService.createSchedule({
          doctorId: selectedDoctorId,
          departmentId: selectedDepartmentId || undefined,
          workDate: item.workDate,
          session: item.session,
          startTime: item.startTime,
          endTime: item.endTime,
          slotDurationMins,
          maxPatientsPerSlot,
        })
      );

      const results = await Promise.allSettled(promises);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      if (fulfilled.length === 0 && rejected.length > 0) {
        const firstReason = (rejected[0] as PromiseRejectedResult).reason;
        setFormError(firstReason?.message || 'Không thể tạo ca làm việc do bị trùng lịch.');
        return;
      }

      const docName = selectedDoctor ? selectedDoctor.fullName : 'Bác sĩ';
      let successMsg = `Đã tạo thành công ${fulfilled.length} ca làm việc cho ${docName}!`;
      if (rejected.length > 0) {
        successMsg += ` (${rejected.length} ca bị bỏ qua do đã có lịch trước đó)`;
      }

      onSuccess(successMsg);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Đã có lỗi xảy ra khi tạo ca làm việc.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-700" />
              <span>Tạo Ca Làm Việc & Lịch Trực Mới</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Phân ca trực cho bác sĩ, tự động băm nhỏ thành các khung giờ khám (slots)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* 1. Select Doctor */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold">Bác sĩ (*)</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-600 transition-all font-semibold cursor-pointer text-xs"
              required
            >
              <option value="">-- Chọn Bác Sĩ Cần Phân Ca --</option>
              {(doctors || []).map((doc) => (
                <option key={doc.doctorId} value={doc.doctorId}>
                  [{doc.doctorCode}] {doc.title ? `${doc.title} ` : ''}{doc.fullName}{' '}
                  {doc.specialization ? `— (${doc.specialization})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Select Department */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-slate-700 font-bold">
                Khoa phòng khám <span className="text-slate-400 font-normal">(để trống sẽ tự lấy Khoa chính)</span>
              </label>
              {primaryDoctorDept && (
                <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  ⭐ Khoa chính: {primaryDoctorDept.department?.departmentName || departments.find((d) => d.departmentId === primaryDepartmentId)?.departmentName}
                </span>
              )}
            </div>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-600 transition-all font-semibold cursor-pointer text-xs"
            >
              <option value="">
                -- Mặc định lấy Khoa chính {primaryDoctorDept ? `(${primaryDoctorDept.department?.departmentName || departments.find((d) => d.departmentId === primaryDepartmentId)?.departmentName})` : ''} --
              </option>
              {sortedDepartments.map((dept) => {
                const isPrimary = dept.departmentId === primaryDepartmentId;
                const isAssigned = selectedDoctor?.doctorDepartments?.some((dd) => dd.departmentId === dept.departmentId);

                return (
                  <option key={dept.departmentId} value={dept.departmentId}>
                    {isPrimary
                      ? `⭐ [KHOA CHÍNH] ${dept.departmentName} (${dept.departmentCode})`
                      : isAssigned
                      ? `✓ [Kiêm nhiệm] ${dept.departmentName} (${dept.departmentCode})`
                      : `${dept.departmentName} (${dept.departmentCode})`}
                    {dept.roomLocation ? ` - ${dept.roomLocation}` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 3. Mode Toggle: Single Date vs Multi-day Batch */}
          <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'single'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'bg-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Theo ngày cụ thể (1 Ngày)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('batch')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'batch'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'bg-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Xếp lịch tuần (Nhiều ngày)</span>
            </button>
          </div>

          {/* 4A. Date Input for Single Mode */}
          {mode === 'single' && (
            <div className="space-y-1.5 animate-in fade-in">
              <label className="block text-slate-700 font-bold">Ngày làm việc (*)</label>
              <input
                type="date"
                value={singleWorkDate}
                onChange={(e) => setSingleWorkDate(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-600 transition-all font-semibold text-xs"
                required
              />
            </div>
          )}

          {/* 4B. Multi-day selector for Batch Mode */}
          {mode === 'batch' && (
            <div className="space-y-2.5 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 animate-in fade-in">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Tuần làm việc (Chọn ngày Thứ Hai bắt đầu tuần)</label>
                <input
                  type="date"
                  value={weekMondayDate}
                  onChange={(e) => setWeekMondayDate(e.target.value)}
                  className="w-full bg-white text-slate-900 p-2 rounded-xl border border-slate-200 outline-none focus:border-blue-600 font-semibold text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">Chọn các ngày trong tuần:</span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={handleSelectWorkdays}
                      className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer font-bold"
                    >
                      T2 - T6
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleSelectAllDays}
                      className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer font-bold"
                    >
                      Cả tuần
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleSelectWeekend}
                      className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer font-bold"
                    >
                      T7, CN
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAY_OPTIONS.map((opt) => {
                    const isSelected = selectedDays.includes(opt.dayIndex);
                    return (
                      <button
                        key={opt.dayIndex}
                        type="button"
                        onClick={() => toggleDay(opt.dayIndex)}
                        className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-[10px]">{opt.short}</div>
                        <div className="text-[11px] font-bold mt-0.5">{opt.label.replace('Thứ ', 'T')}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 5. Session Selection (Ca Sáng, Chiều, Tối) */}
          <div className="space-y-2">
            <label className="block text-slate-700 font-bold">
              Chọn Ca Làm Việc (*) <span className="text-slate-400 font-normal">(có thể chọn nhiều ca)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SESSION_METADATA.map((opt) => {
                const isSelected = selectedSessions.includes(opt.session);
                const Icon = opt.icon;
                const currentTime = customSessionTimes[opt.session] || INITIAL_SESSION_TIMES[opt.session];

                return (
                  <button
                    key={opt.session}
                    type="button"
                    onClick={() => toggleSession(opt.session)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? `${opt.color} ring-2 ring-blue-500 shadow-xs font-bold`
                        : 'bg-slate-50/50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-bold text-xs">{opt.label}</span>
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5 font-medium">
                      {currentTime.startTime} - {currentTime.endTime}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 5B. Custom Time Editors per Selected Session */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tùy chỉnh khung giờ làm việc:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Tự động gợi ý, bạn có thể chỉnh lại</span>
              </div>

              <div className="space-y-2">
                {selectedSessions.map((session) => {
                  const meta = SESSION_METADATA.find((s) => s.session === session);
                  const currentTime = customSessionTimes[session] || INITIAL_SESSION_TIMES[session];
                  const Icon = meta?.icon || Clock;
                  const isModified =
                    currentTime.startTime !== meta?.defaultStart ||
                    currentTime.endTime !== meta?.defaultEnd;

                  return (
                    <div
                      key={session}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2.5 text-xs animate-in fade-in"
                    >
                      <div className="flex items-center gap-2 min-w-[90px]">
                        <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-bold text-slate-800">{meta?.label}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-medium text-slate-500">Từ</span>
                          <input
                            type="time"
                            value={currentTime.startTime}
                            onChange={(e) => handleTimeChange(session, 'startTime', e.target.value)}
                            className="text-xs font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer"
                            required
                          />
                        </div>

                        <span className="text-slate-400 font-bold">→</span>

                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-medium text-slate-500">Đến</span>
                          <input
                            type="time"
                            value={currentTime.endTime}
                            onChange={(e) => handleTimeChange(session, 'endTime', e.target.value)}
                            className="text-xs font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer"
                            required
                          />
                        </div>

                        {isModified && (
                          <button
                            type="button"
                            onClick={() => handleResetSessionTime(session)}
                            title="Khôi phục giờ chuẩn"
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Mặc định</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 6. Slot settings */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">Thời lượng mỗi lượt khám</label>
              <select
                value={slotDurationMins}
                onChange={(e) => setSlotDurationMins(Number(e.target.value))}
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-600 transition-all font-semibold text-xs cursor-pointer"
              >
                <option value={15}>15 phút / slot</option>
                <option value={20}>20 phút / slot</option>
                <option value={30}>30 phút / slot (Chuẩn)</option>
                <option value={45}>45 phút / slot</option>
                <option value={60}>60 phút / slot</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">Số bệnh nhân tối đa / slot</label>
              <select
                value={maxPatientsPerSlot}
                onChange={(e) => setMaxPatientsPerSlot(Number(e.target.value))}
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-600 transition-all font-semibold text-xs cursor-pointer"
              >
                <option value={1}>1 bệnh nhân / slot (Mặc định)</option>
                <option value={2}>2 bệnh nhân / slot</option>
                <option value={3}>3 bệnh nhân / slot</option>
              </select>
            </div>
          </div>

          {/* Preview & Submit Action */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-blue-900 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Dự kiến tạo: <strong className="text-blue-700 font-extrabold">{targetShiftsToCreate.length} ca trực</strong>
              </span>
            </div>
            <span className="text-[11px] text-blue-600 font-medium">Tự động sinh slot theo giờ đã chọn</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedDoctorId || targetShiftsToCreate.length === 0}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Tạo {targetShiftsToCreate.length} Ca Làm Việc</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
