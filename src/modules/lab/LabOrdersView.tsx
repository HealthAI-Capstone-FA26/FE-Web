import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWorkspaceRefresh } from '../../components/common/WorkspaceContainer';
import { 
  FlaskConical, CheckCircle2, Sparkles, Upload, 
  Lock, FileText, Loader2,
  Building2, RefreshCw, Search, AlertCircle, Eye,
  ChevronDown, MapPin, Pencil, AlertTriangle, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Info, Check, ShieldCheck, X,
  Calendar, Clock, CalendarDays, Image as ImageIcon, ExternalLink, Download, PauseCircle, Trash2
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { labRoomService, type LabRoomItem, type LabStaffRoomAssignment } from '../../services/lab/lab-room.service';
import { labTaskService, type LabTaskItem } from '../../services/lab/lab-task.service';
import { labResultService, resolveAttachmentUrl, type LabResultDetail } from '../../services/lab/lab-result.service';
import { useCan } from '../../hooks/useCan';
import {
  LabTaskStatusBadge,
  ReportExceptionModal,
  ExceptionTimelineDrawer,
} from '../../components/lab-exception';

export type LabDateFilterMode = 'today' | 'yesterday' | '7days' | 'all' | 'custom';


export interface ThresholdAlertSummaryItem {
  parameterId: string;
  parameterCode: string;
  parameterName: string;
  measuredValue: string | number;
  unit: string;
  rangeMin?: number;
  rangeMax?: number;
  isAbnormal: boolean;
  deviationText: string;
  riskLevel?: 'normal' | 'low' | 'medium' | 'high' | 'critical';
}

export interface ThresholdAlertSummary {
  task: LabTaskItem;
  labResultId: string;
  totalParameters: number;
  abnormalCount: number;
  items: ThresholdAlertSummaryItem[];
}

export type RiskLevelKey = 'normal' | 'low' | 'medium' | 'high' | 'critical';

export interface ApplicableThresholdBand {
  labThresholdId?: string;
  riskLevel: RiskLevelKey;
  rangeMin?: number;
  rangeMax?: number;
  gender?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
}

const RISK_LEVEL_META: Record<
  RiskLevelKey,
  { label: string; shortLabel: string; badgeCls: string; pillCls: string }
> = {
  normal: {
    label: 'Bình thường (Normal)',
    shortLabel: 'Bình thường',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pillCls: 'bg-emerald-50/90 text-emerald-800 border-emerald-200',
  },
  low: {
    label: 'Thấp / Dưới ngưỡng (Low)',
    shortLabel: 'Thấp',
    badgeCls: 'bg-amber-50 text-amber-800 border-amber-300',
    pillCls: 'bg-amber-50/80 text-amber-800 border-amber-200',
  },
  medium: {
    label: 'Trung bình / Cận cao (Medium)',
    shortLabel: 'Trung bình',
    badgeCls: 'bg-orange-50 text-orange-800 border-orange-300',
    pillCls: 'bg-orange-50/80 text-orange-800 border-orange-200',
  },
  high: {
    label: 'Vượt ngưỡng cao (High)',
    shortLabel: 'Cao',
    badgeCls: 'bg-rose-50 text-rose-700 border-rose-300',
    pillCls: 'bg-rose-50/80 text-rose-700 border-rose-200',
  },
  critical: {
    label: 'Báo động đỏ / Nguy kịch (Critical)',
    shortLabel: 'Nguy kịch',
    badgeCls: 'bg-rose-100 text-rose-900 border-rose-400 font-extrabold',
    pillCls: 'bg-rose-100/90 text-rose-900 border-rose-300',
  },
};

function calculatePatientAge(dateOfBirth?: string | null, atDate?: Date): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const at = atDate ?? new Date();
  let age = at.getFullYear() - dob.getFullYear();
  const m = at.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

function normalizePatientGender(gender?: string | null): 'male' | 'female' | null {
  if (!gender) return null;
  const g = gender.toLowerCase().trim();
  if (g === 'male' || g === 'nam' || g === 'm') return 'male';
  if (g === 'female' || g === 'nữ' || g === 'nu' || g === 'f') return 'female';
  return null;
}

/**
 * Lọc các ngưỡng tham chiếu áp dụng đúng theo Tuổi + Giới tính của bệnh nhân
 * (đồng bộ 100% với ResultThresholdResolver ở Backend — tuyệt đối không fallback sang độ tuổi khác).
 */
function resolveApplicableThresholdBands(
  rawThresholds: any[] | undefined | null,
  patient?: { dateOfBirth?: string | null; gender?: string | null } | null,
): ApplicableThresholdBand[] {
  if (!Array.isArray(rawThresholds) || rawThresholds.length === 0) return [];
  const age = calculatePatientAge(patient?.dateOfBirth);
  const gender = normalizePatientGender(patient?.gender);

  const active = rawThresholds.filter((t) => t && t.isActive !== false);
  const poolByAge = active.filter((t) => {
    if (age === null) return true;
    const minOk = t.ageMin === null || t.ageMin === undefined || Number(t.ageMin) <= age;
    const maxOk = t.ageMax === null || t.ageMax === undefined || Number(t.ageMax) >= age;
    return minOk && maxOk;
  });

  // Nếu không có ngưỡng nào khớp độ tuổi của bệnh nhân -> trả về rỗng (giống Backend ResultThresholdResolver)
  if (poolByAge.length === 0) return [];

  // Ưu tiên dòng khớp đúng giới tính > dòng không phân biệt giới tính (gender == null)
  const exactGenderRows = gender
    ? poolByAge.filter((t) => normalizePatientGender(t.gender) === gender)
    : [];
  const neutralGenderRows = poolByAge.filter((t) => !t.gender);
  const genderPool =
    exactGenderRows.length > 0
      ? exactGenderRows
      : neutralGenderRows;

  if (genderPool.length === 0) return [];

  // Nếu có nhiều nhóm tuổi lồng nhau cùng chứa tuổi bệnh nhân, ưu tiên nhóm tuổi hẹp nhất (cụ thể nhất)
  let specificPool = genderPool;
  if (age !== null && genderPool.length > 1) {
    const spans = genderPool.map((t) => {
      const min = t.ageMin !== null && t.ageMin !== undefined ? Number(t.ageMin) : 0;
      const max = t.ageMax !== null && t.ageMax !== undefined ? Number(t.ageMax) : 200;
      return max - min;
    });
    const minSpan = Math.min(...spans);
    specificPool = genderPool.filter((t) => {
      const min = t.ageMin !== null && t.ageMin !== undefined ? Number(t.ageMin) : 0;
      const max = t.ageMax !== null && t.ageMax !== undefined ? Number(t.ageMax) : 200;
      return max - min === minSpan;
    });
  }

  const seen = new Set<string>();
  const bands: ApplicableThresholdBand[] = [];
  for (const t of specificPool) {
    const riskLevel = (t.riskLevel || 'normal') as RiskLevelKey;
    const rangeMin =
      t.rangeMin !== null && t.rangeMin !== undefined && t.rangeMin !== '' ? Number(t.rangeMin) : undefined;
    const rangeMax =
      t.rangeMax !== null && t.rangeMax !== undefined && t.rangeMax !== '' ? Number(t.rangeMax) : undefined;
    const key = `${riskLevel}:${rangeMin ?? 'null'}:${rangeMax ?? 'null'}`;
    if (seen.has(key)) continue;
    seen.add(key);
    bands.push({
      labThresholdId: t.labThresholdId || t.thresholdId,
      riskLevel,
      rangeMin,
      rangeMax,
      gender: t.gender,
      ageMin: t.ageMin,
      ageMax: t.ageMax,
    });
  }

  // Sắp xếp các dải tăng dần theo cận dưới (rangeMin)
  bands.sort((a, b) => {
    const aMin = a.rangeMin ?? -Infinity;
    const bMin = b.rangeMin ?? -Infinity;
    if (aMin !== bMin) return aMin - bMin;
    const aMax = a.rangeMax ?? Infinity;
    const bMax = b.rangeMax ?? Infinity;
    return aMax - bMax;
  });

  return bands;
}

function formatBandRange(band?: { rangeMin?: number; rangeMax?: number } | null): string {
  if (!band) return 'Chưa có thông tin';
  const { rangeMin: min, rangeMax: max } = band;
  if (min !== undefined && max !== undefined) return `${min} – ${max}`;
  if (min !== undefined) return `≥ ${min}`;
  if (max !== undefined) return `≤ ${max}`;
  return 'Chưa có thông tin';
}

function evaluateNumericAgainstBands(
  value: number | undefined,
  bands: ApplicableThresholdBand[],
): {
  matchedBand: ApplicableThresholdBand | null;
  normalBand: ApplicableThresholdBand | null;
  isAbnormal: boolean;
  riskLevel: RiskLevelKey;
} {
  const normalBand = bands.find((b) => b.riskLevel === 'normal') ?? bands[0] ?? null;
  if (value === undefined || Number.isNaN(value)) {
    return { matchedBand: null, normalBand, isAbnormal: false, riskLevel: 'normal' };
  }

  const matchedBand =
    bands.find((b) => {
      const min = b.rangeMin ?? -Infinity;
      const max = b.rangeMax ?? Infinity;
      return value >= min && value <= max;
    }) ?? null;

  if (matchedBand) {
    const isAbnormal = matchedBand.riskLevel !== 'normal';
    return {
      matchedBand,
      normalBand,
      isAbnormal,
      riskLevel: matchedBand.riskLevel,
    };
  }

  // Fallback nếu giá trị nằm ngoài khoảng normalBand nhưng không khớp dải nào khác
  if (normalBand) {
    const min = normalBand.rangeMin;
    const max = normalBand.rangeMax;
    if (min !== undefined && value < min) {
      return { matchedBand: null, normalBand, isAbnormal: true, riskLevel: 'low' };
    }
    if (max !== undefined && value > max) {
      return { matchedBand: null, normalBand, isAbnormal: true, riskLevel: 'high' };
    }
  }

  return { matchedBand: null, normalBand, isAbnormal: false, riskLevel: 'normal' };
}

export const LabOrdersView: React.FC = () => {
  const { hasRole } = useCan();
  const isLabStaff = hasRole('LAB') || hasRole('ADMIN');

  // Exception Modal & Drawer State
  const [exceptionModalTask, setExceptionModalTask] = useState<LabTaskItem | null>(null);
  const [timelineDrawerTask, setTimelineDrawerTask] = useState<LabTaskItem | null>(null);

  // Lab Rooms State
  const [labRooms, setLabRooms] = useState<LabRoomItem[]>([]);
  const [myAssignments, setMyAssignments] = useState<LabStaffRoomAssignment[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(true);

  // Tasks List State (Tải 1 lần tất cả ca để chuyển phòng tức thì 0ms không phải load lại)
  const [allTasks, setAllTasks] = useState<LabTaskItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Date Filtering State
  const [dateFilterMode, setDateFilterMode] = useState<LabDateFilterMode>('today');
  const [customDate, setCustomDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Action Loading States
  const [receivingTaskId, setReceivingTaskId] = useState<string | null>(null);

  // Modal 1: Nhập kết quả lần đầu (in_progress)
  const [selectedTask, setSelectedTask] = useState<LabTaskItem | null>(null);
  const [isInputModalOpen, setIsInputModalOpen] = useState<boolean>(false);
  const [paramValues, setParamValues] = useState<Record<string, { valueNumeric?: number; valueText?: string }>>({});
  const [overallConclusion, setOverallConclusion] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [isSubmittingResult, setIsSubmittingResult] = useState<boolean>(false);

  // Modal 2: Xem & Bổ sung / Chỉnh sửa kết quả EMR (completed)
  const [viewingResult, setViewingResult] = useState<LabResultDetail | null>(null);
  const [isViewResultModalOpen, setIsViewResultModalOpen] = useState<boolean>(false);
  const [isLoadingResultDetail, setIsLoadingResultDetail] = useState<boolean>(false);
  const [isEditingInViewModal, setIsEditingInViewModal] = useState<boolean>(false);
  const [editParamValues, setEditParamValues] = useState<Record<string, { valueNumeric?: number; valueText?: string }>>({});
  const [editConclusion, setEditConclusion] = useState<string>('');
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editAttachedFileName, setEditAttachedFileName] = useState<string>('');
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);

  // Modal 3: Thông báo tổng kết đối soát ngưỡng ngay sau khi Lưu
  const [alertSummary, setAlertSummary] = useState<ThresholdAlertSummary | null>(null);
  const [isAlertSummaryModalOpen, setIsAlertSummaryModalOpen] = useState<boolean>(false);

  // Modal Error states (Hiển thị trực tiếp bên trong Modal)
  const [modalError, setModalError] = useState<string | null>(null);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [inputModalTab, setInputModalTab] = useState<'entry' | 'thresholds'>('entry');
  const [viewModalTab, setViewModalTab] = useState<'result' | 'thresholds'>('result');

  // Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // 1. Load danh sách phòng Lab và phòng của KTV hiện tại
  useEffect(() => {
    let isMounted = true;
    const fetchRooms = async () => {
      setIsLoadingRooms(true);
      try {
        const [allRooms, myAssigned] = await Promise.all([
          labRoomService.getLabRooms().catch(() => []),
          labRoomService.getMyAssignments().catch(() => []),
        ]);

        if (!isMounted) return;

        setLabRooms(Array.isArray(allRooms) ? allRooms : []);
        setMyAssignments(Array.isArray(myAssigned) ? myAssigned : []);

        // Mặc định chọn phòng chính của KTV, hoặc phòng được gán đầu tiên, hoặc phòng đầu tiên trong danh mục
        if (myAssigned.length > 0) {
          const primaryRoom = myAssigned.find((a) => a.isPrimary);
          setSelectedRoomId(primaryRoom ? primaryRoom.labRoomId : myAssigned[0].labRoomId);
        } else if (allRooms.length > 0) {
          setSelectedRoomId(allRooms[0].labRoomId);
        }
      } catch (err: any) {
        console.error('Lỗi tải danh mục phòng Lab:', err);
        if (isMounted) showToast('Không thể tải danh mục phòng Lab', 'error');
      } finally {
        if (isMounted) setIsLoadingRooms(false);
      }
    };

    fetchRooms();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load toàn bộ Tasks (1 request duy nhất, không cần reload lại khi đổi phòng)
  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingTasks(true);
    setTaskError(null);
    try {
      const data = await labTaskService.getLabTasks({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setAllTasks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Lỗi tải danh sách chỉ định xét nghiệm:', err);
      setTaskError(err?.message || 'Không thể kết nối máy chủ để tải danh sách xét nghiệm.');
    } finally {
      if (!silent) setIsLoadingTasks(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useWorkspaceRefresh(() => fetchTasks());

  const formatLocalDate = (d: Date | string | undefined | null): string => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTaskDateStr = (task: LabTaskItem): string => {
    return formatLocalDate(task.orderItem?.order?.orderedAt || task.createdAt);
  };

  const getTaskTimestamp = (task: LabTaskItem): number => {
    const raw = task.orderItem?.order?.orderedAt || task.createdAt;
    const time = new Date(raw).getTime();
    return isNaN(time) ? 0 : time;
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const sevenDaysAgoTime = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  // Lọc tức thì trong RAM theo phòng Lab đang chọn (0ms, không tốn request mạng)
  const tasksForRoom = useMemo(() => {
    if (!selectedRoomId || selectedRoomId === 'ALL') {
      return allTasks;
    }
    return allTasks.filter((t) => t.labRoomId === selectedRoomId);
  }, [allTasks, selectedRoomId]);

  // Thống kê số lượng ca theo mốc ngày
  const dateStats = useMemo(() => {
    let todayCount = 0;
    let yesterdayCount = 0;
    let sevenDaysCount = 0;

    tasksForRoom.forEach((t) => {
      const dStr = getTaskDateStr(t);
      const time = getTaskTimestamp(t);
      if (dStr === todayStr) todayCount++;
      if (dStr === yesterdayStr) yesterdayCount++;
      if (time >= sevenDaysAgoTime) sevenDaysCount++;
    });

    return {
      today: todayCount,
      yesterday: yesterdayCount,
      sevenDays: sevenDaysCount,
      all: tasksForRoom.length,
    };
  }, [tasksForRoom, todayStr, yesterdayStr, sevenDaysAgoTime]);

  // Lọc danh sách theo ngày
  const tasksForDate = useMemo(() => {
    if (dateFilterMode === 'all') return tasksForRoom;

    return tasksForRoom.filter((t) => {
      const dStr = getTaskDateStr(t);
      const time = getTaskTimestamp(t);

      if (dateFilterMode === 'today') {
        return dStr === todayStr;
      }
      if (dateFilterMode === 'yesterday') {
        return dStr === yesterdayStr;
      }
      if (dateFilterMode === '7days') {
        return time >= sevenDaysAgoTime;
      }
      if (dateFilterMode === 'custom') {
        return dStr === customDate;
      }
      return true;
    });
  }, [tasksForRoom, dateFilterMode, customDate, todayStr, yesterdayStr, sevenDaysAgoTime]);

  // Thống kê nhanh theo phạm vi ngày đang chọn
  const activeDateStats = useMemo(() => {
    const total = tasksForDate.length;
    const ready = tasksForDate.filter((t) => t.status === 'ready').length;
    const inProgress = tasksForDate.filter((t) => t.status === 'in_progress').length;
    const completed = tasksForDate.filter((t) => t.status === 'completed').length;
    const paymentPending = tasksForDate.filter((t) => !t.paymentVerified || t.status === 'payment_pending').length;

    const onHold = tasksForDate.filter((t) => t.status === 'on_hold').length;
    return { total, ready, inProgress, completed, paymentPending, onHold };
  }, [tasksForDate]);

  // Lọc theo search box
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasksForDate;
    const term = searchQuery.toLowerCase().trim();
    return tasksForDate.filter((t) => {
      const patientName = t.orderItem?.order?.encounter?.patient?.fullName?.toLowerCase() || '';
      const patientCode = t.orderItem?.order?.encounter?.patient?.patientCode?.toLowerCase() || '';
      const testName = t.orderItem?.testType?.testName?.toLowerCase() || '';
      const orderCode = t.orderItem?.order?.orderCode?.toLowerCase() || '';
      const doctorName = t.orderItem?.order?.orderedByUser?.profile?.fullName?.toLowerCase() || '';
      return (
        patientName.includes(term) ||
        patientCode.includes(term) ||
        testName.includes(term) ||
        orderCode.includes(term) ||
        doctorName.includes(term)
      );
    });
  }, [tasksForDate, searchQuery]);

  // Thao tác: KTV tiếp nhận mẫu xét nghiệm
  const handleReceiveTask = async (task: LabTaskItem) => {
    setReceivingTaskId(task.labTaskId);
    try {
      await labTaskService.receiveLabTask(task.labTaskId);
      showToast(`Đã tiếp nhận mẫu xét nghiệm thành công cho bệnh nhân ${task.orderItem?.order?.encounter?.patient?.fullName || ''}!`, 'success');
      fetchTasks(true);
    } catch (err: any) {
      showToast(err?.message || 'Tiếp nhận mẫu thất bại. Vui lòng kiểm tra phân công phòng.', 'error');
    } finally {
      setReceivingTaskId(null);
    }
  };

  // Mở modal nhập kết quả ban đầu (khi ca đang in_progress)
  const handleOpenInputModal = (task: LabTaskItem) => {
    setSelectedTask(task);
    setModalError(null);
    const existingResult = task.labResult;
    const initialParams: Record<string, { valueNumeric?: number; valueText?: string }> = {};
    const parameters = task.orderItem?.testType?.labResultParameters || [];
    parameters.forEach((p) => {
      const isPositiveNegative = p.dataType === 'positive_negative';
      initialParams[p.parameterId] = {
        valueNumeric: undefined,
        valueText: isPositiveNegative ? 'Âm tính (-)' : '',
      };
    });

    if (existingResult?.values && Array.isArray(existingResult.values)) {
      existingResult.values.forEach((v: any) => {
        if (v.parameterId) {
          initialParams[v.parameterId] = {
            valueNumeric: v.valueNumeric !== null && v.valueNumeric !== undefined ? Number(v.valueNumeric) : undefined,
            valueText: v.valueText || (v.parameter?.dataType === 'positive_negative' ? 'Âm tính (-)' : ''),
          };
        }
      });
    }

    setParamValues(initialParams);
    setOverallConclusion(existingResult?.overallConclusion || existingResult?.findings || '');
    setSelectedFile(null);
    setAttachedFileName('');
    setInputModalTab('entry');
    setIsInputModalOpen(true);
  };

  // Nạp dữ liệu vào form chỉnh sửa / bổ sung trong Modal Xem kết quả
  const populateEditData = (task: LabTaskItem, result: LabResultDetail) => {
    setEditModalError(null);
    const initialParams: Record<string, { valueNumeric?: number; valueText?: string }> = {};
    const parameters = task.orderItem?.testType?.labResultParameters || [];
    parameters.forEach((p) => {
      const isPositiveNegative = p.dataType === 'positive_negative';
      initialParams[p.parameterId] = {
        valueNumeric: undefined,
        valueText: isPositiveNegative ? 'Âm tính (-)' : '',
      };
    });

    if (result.values && result.values.length > 0) {
      result.values.forEach((v) => {
        if (v.parameterId) {
          initialParams[v.parameterId] = {
            valueNumeric: v.valueNumeric !== null && v.valueNumeric !== undefined ? Number(v.valueNumeric) : undefined,
            valueText: v.valueText || (v.parameter?.dataType === 'positive_negative' ? 'Âm tính (-)' : ''),
          };
        }
      });
    }

    setEditParamValues(initialParams);
    setEditConclusion(result.overallConclusion || '');
  };

  // Mở modal xem kết quả (có thể mở ở chế độ xem hoặc chế độ bổ sung ngay)
  const handleViewResult = async (task: LabTaskItem, startInEditMode = false) => {
    setSelectedTask(task);
    setIsLoadingResultDetail(true);
    setIsEditingInViewModal(startInEditMode);
    setEditSelectedFile(null);
    setEditAttachedFileName('');
    setViewModalTab('result');
    setIsViewResultModalOpen(true);
    try {
      const result = await labResultService.getLabResultByTaskId(task.labTaskId);
      setViewingResult(result);
      populateEditData(task, result);
    } catch (err: any) {
      showToast(err?.message || 'Không thể tải chi tiết kết quả xét nghiệm', 'error');
      setIsViewResultModalOpen(false);
    } finally {
      setIsLoadingResultDetail(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!viewingResult?.labResultId) return;
    setDeletingAttachmentId(attachmentId);
    setEditModalError(null);
    try {
      await labResultService.deleteAttachment(attachmentId);
      const refreshed = await labResultService.getLabResultById(viewingResult.labResultId).catch(() => null);
      if (refreshed) {
        setViewingResult(refreshed);
        if (selectedTask) populateEditData(selectedTask, refreshed);
      } else {
        setViewingResult((prev) =>
          prev
            ? { ...prev, attachments: (prev.attachments || []).filter((a) => a.attachmentId !== attachmentId) }
            : prev
        );
      }
      showToast('Đã xoá tệp đính kèm.', 'success');
      await fetchTasks(true);
    } catch (err: any) {
      const msg = err?.message || 'Không thể xoá tệp đính kèm.';
      setEditModalError(msg);
      showToast(msg, 'error');
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  // Lưu chỉnh sửa / bổ sung trực tiếp trong Modal Xem kết quả
  const handleSaveEditInViewModal = async () => {
    if (!selectedTask || !viewingResult) return;
    setEditModalError(null);

    const parameters = selectedTask.orderItem?.testType?.labResultParameters || [];
    const valuesPayload = parameters.map((p) => {
      const val = editParamValues[p.parameterId];
      const dataType = p.dataType ?? 'numeric';
      const isNumeric = dataType === 'numeric';
      let valueText = val?.valueText?.trim();
      if (!isNumeric && !valueText && dataType === 'positive_negative') {
        valueText = 'Âm tính (-)';
      }
      return {
        parameterId: p.parameterId,
        valueNumeric: isNumeric ? (val?.valueNumeric !== undefined ? Number(val.valueNumeric) : undefined) : undefined,
        valueText: !isNumeric ? (valueText || undefined) : undefined,
      };
    });

    if (parameters.length > 0 && valuesPayload.every((v) => v.valueNumeric === undefined && !v.valueText)) {
      const err = 'Vui lòng nhập ít nhất một chỉ số đo đạc';
      setEditModalError(err);
      showToast(err, 'error');
      return;
    }

    const filteredValues = valuesPayload.filter(
      (v) => v.valueNumeric !== undefined || (v.valueText && v.valueText.trim() !== '')
    );

    if (filteredValues.length === 0 && !editSelectedFile) {
      const err = 'Vui lòng nhập ít nhất một chỉ số hoặc chọn tệp đính kèm bổ sung';
      setEditModalError(err);
      showToast(err, 'error');
      return;
    }

    setIsSavingEdit(true);
    try {
      let updated: LabResultDetail = viewingResult;
      if (filteredValues.length > 0) {
        updated = await labResultService.updateLabResult(viewingResult.labResultId, {
          values: filteredValues,
          overallConclusion: editConclusion.trim() || undefined,
        });
      }

      // Nếu có tệp đính kèm bổ sung được chọn, upload luôn vào ca kết quả
      if (editSelectedFile && viewingResult.labResultId) {
        const isEditPdf =
          editSelectedFile.type === 'application/pdf' || editSelectedFile.name.toLowerCase().endsWith('.pdf');
        await labResultService.uploadAttachment(
          viewingResult.labResultId,
          editSelectedFile,
          isEditPdf ? 'pdf' : 'image',
          isEditPdf ? 'Phiếu kết quả PDF bổ sung' : 'Phiếu in kết quả máy bổ sung'
        ).catch(() => {});
        // Refresh lại chi tiết kết quả để lấy attachments mới
        const refreshed = await labResultService.getLabResultById(viewingResult.labResultId).catch(() => null);
        if (refreshed) {
          setViewingResult(refreshed);
          populateEditData(selectedTask, refreshed);
        } else {
          setViewingResult(updated);
          populateEditData(selectedTask, updated);
        }
      } else {
        setViewingResult(updated);
        populateEditData(selectedTask, updated);
      }

      setEditSelectedFile(null);
      setEditAttachedFileName('');
      setIsEditingInViewModal(false);
      showToast('Đã cập nhật và bổ sung kết quả xét nghiệm EMR thành công!', 'success');
      fetchTasks(true);
    } catch (err: any) {
      const errMessage = err?.message || 'Không thể cập nhật kết quả xét nghiệm. Vui lòng thử lại.';
      setEditModalError(errMessage);
      showToast(errMessage, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Lưu và xác nhận kết quả xét nghiệm lần đầu (khi ca đang in_progress)
  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setModalError(null);

    const parameters = selectedTask.orderItem?.testType?.labResultParameters || [];
    const valuesPayload = parameters.map((p) => {
      const val = paramValues[p.parameterId];
      const dataType = p.dataType ?? 'numeric';
      const isNumeric = dataType === 'numeric';
      let valueText = val?.valueText?.trim();
      if (!isNumeric && !valueText && dataType === 'positive_negative') {
        valueText = 'Âm tính (-)';
      }
      return {
        parameterId: p.parameterId,
        valueNumeric: isNumeric ? (val?.valueNumeric !== undefined ? Number(val.valueNumeric) : undefined) : undefined,
        valueText: !isNumeric ? (valueText || undefined) : undefined,
      };
    });

    if (parameters.length > 0 && valuesPayload.every((v) => v.valueNumeric === undefined && !v.valueText)) {
      const err = 'Vui lòng nhập ít nhất một chỉ số đo đạc';
      setModalError(err);
      showToast(err, 'error');
      return;
    }

    setIsSubmittingResult(true);
    try {
      const existingResultId = selectedTask.labResult?.labResultId || selectedTask.labResult?.resultId;
      let result: LabResultDetail;
      const filteredValues = valuesPayload.filter(
        (v) => v.valueNumeric !== undefined || (v.valueText && v.valueText.trim() !== '')
      );

      if (existingResultId) {
        result = await labResultService.updateLabResult(existingResultId, {
          values: filteredValues,
          overallConclusion: overallConclusion.trim() || undefined,
          resultStatus: 'final',
        });
      } else {
        try {
          result = await labResultService.submitLabResult(selectedTask.labTaskId, {
            values: filteredValues,
            overallConclusion: overallConclusion.trim() || undefined,
            resultStatus: 'final',
          });
        } catch (submitErr: any) {
          // Trường hợp kết quả đã tồn tại trên server nhưng worklist trong RAM chưa đồng bộ
          const existing = await labResultService.getLabResultByTaskId(selectedTask.labTaskId).catch(() => null);
          if (existing?.labResultId) {
            result = await labResultService.updateLabResult(existing.labResultId, {
              values: filteredValues,
              overallConclusion: overallConclusion.trim() || undefined,
              resultStatus: 'final',
            });
          } else {
            throw submitErr;
          }
        }
      }

      // Nếu có đính kèm file, upload đính kèm luôn
      let hasUploadedAttachment = Boolean(result.attachments && result.attachments.length > 0);
      if (selectedFile && result.labResultId) {
        const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
        const uploaded = await labResultService
          .uploadAttachment(
            result.labResultId,
            selectedFile,
            isPdf ? 'pdf' : 'image',
            isPdf ? 'Phiếu kết quả PDF đính kèm' : 'Hình ảnh xét nghiệm đính kèm'
          )
          .catch(() => null);
        if (uploaded) hasUploadedAttachment = true;
      }

      // Đối với dịch vụ báo cáo hình ảnh (image_report: X-quang, Siêu âm tim), backend giữ task ở 'in_progress'
      // cho tới khi gọi POST /lab-results/:id/complete để chuyển task sang 'completed' và báo kết quả cho Bác sĩ.
      if (result.labResultId) {
        try {
          await labResultService.completeLabResult(
            result.labResultId,
            hasUploadedAttachment
              ? {}
              : {
                  noImageReason:
                    overallConclusion.trim().length >= 10
                      ? overallConclusion.trim().slice(0, 200)
                      : 'Hoàn tất nhập chỉ số và kết luận chuyên môn trên hệ thống EMR',
                }
          );
        } catch (completeErr: any) {
          const msg = String(completeErr?.message || '');
          // Nếu dịch vụ không phải image_report (đã tự động hoàn tất ở submitLabResult) thì bỏ qua
          if (!msg.includes('báo cáo hình ảnh') && !msg.includes('đã được hoàn tất')) {
            throw completeErr;
          }
        }
      }

      // Kích hoạt phát hiện bất thường từ backend để lấy phân loại nguy cơ chuẩn y tế
      let alertData: any = null;
      if (result.labResultId) {
        alertData = await labResultService.detectAlerts(result.labResultId).catch(() => null);
      }

      // Tổng hợp dữ liệu đối soát ngưỡng cho từng chỉ số (lọc đúng theo Tuổi + Giới tính bệnh nhân)
      const currentPatient = selectedTask.orderItem?.order?.encounter?.patient;
      const summaryItems: ThresholdAlertSummaryItem[] = parameters.map((param) => {
        const val = paramValues[param.parameterId];
        const bands = resolveApplicableThresholdBands(param.labParameterThresholds, currentPatient);
        const dataType = param.dataType || 'numeric';
        const numVal = val?.valueNumeric;
        const textVal = val?.valueText || (dataType === 'positive_negative' ? 'Âm tính (-)' : '');

        const isPositiveNegative = dataType === 'positive_negative';
        const isText = dataType === 'text';
        const isNumeric = !isPositiveNegative && !isText;

        const isPositive = isPositiveNegative && (
          textVal.toLowerCase().includes('dương tính') ||
          textVal.toLowerCase().includes('positive') ||
          textVal.includes('+')
        );

        const evalRes = evaluateNumericAgainstBands(numVal, bands);
        const min = evalRes.normalBand?.rangeMin;
        const max = evalRes.normalBand?.rangeMax;

        const matchedServerAlert = alertData?.results?.find((r: any) => r.parameterId === param.parameterId);
        const isServerAbnormal = matchedServerAlert?.isAbnormal === true;
        const serverRisk = matchedServerAlert?.riskLevel as RiskLevelKey | undefined;

        const isClientOutOfRange = isNumeric ? evalRes.isAbnormal : isPositive;
        const isAbnormal = isServerAbnormal || isClientOutOfRange;
        const finalRisk: RiskLevelKey = serverRisk || (isNumeric ? evalRes.riskLevel : isPositive ? 'high' : 'normal');

        let deviationText = RISK_LEVEL_META[finalRisk]?.label || 'Bình thường';
        if (isPositiveNegative) {
          deviationText = isPositive ? 'Dương tính (Bất thường)' : 'Âm tính (Bình thường)';
        }

        return {
          parameterId: param.parameterId,
          parameterCode: param.parameterCode,
          parameterName: param.parameterName || param.parameterCode,
          measuredValue: isNumeric ? (numVal !== undefined ? numVal : '-') : (textVal || '-'),
          unit: param.unit || '-',
          rangeMin: min,
          rangeMax: max,
          isAbnormal,
          deviationText,
          riskLevel: finalRisk,
        };
      });

      const abnormalCount = summaryItems.filter((i) => i.isAbnormal).length;
      
      setAlertSummary({
        task: selectedTask,
        labResultId: result.labResultId,
        totalParameters: summaryItems.length,
        abnormalCount,
        items: summaryItems,
      });

      setIsInputModalOpen(false);
      setIsAlertSummaryModalOpen(true);
      showToast(`Đã lưu kết quả EMR cho ca ${selectedTask.orderItem?.testType?.testName || ''}!`, 'success');
      await fetchTasks(true);
    } catch (err: any) {
      const errMessage = err?.message || 'Không thể lưu kết quả xét nghiệm. Vui lòng thử lại.';
      setModalError(errMessage);
      showToast(errMessage, 'error');
    } finally {
      setIsSubmittingResult(false);
    }
  };

  // Render bảng danh sách
  const columns: Column<LabTaskItem>[] = [
    {
      header: 'Mã Chỉ Định',
      accessorKey: 'labTaskId',
      cell: (row) => {
        const orderCode = row.orderItem?.order?.orderCode || row.labTaskId.slice(0, 8).toUpperCase();
        const rawDate = row.orderItem?.order?.orderedAt || row.createdAt;
        const dStr = formatLocalDate(rawDate);
        const timeStr = new Date(rawDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const isToday = dStr === todayStr;
        const isYesterday = dStr === yesterdayStr;

        return (
          <div className="font-extrabold text-blue-900 whitespace-nowrap space-y-1">
            <div className="text-xs font-mono font-bold tracking-tight text-blue-950">{orderCode}</div>
            <div>
              {isToday ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Hôm nay, {timeStr}
                </span>
              ) : isYesterday ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-2.5 h-2.5 text-amber-600" />
                  Hôm qua, {timeStr}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  <Calendar className="w-2.5 h-2.5 text-slate-400" />
                  {new Date(rawDate).toLocaleDateString('vi-VN')}, {timeStr}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Bệnh Nhân',
      cell: (row) => {
        const p = row.orderItem?.order?.encounter?.patient;
        return (
          <div className="min-w-40 whitespace-nowrap">
            <div className="font-bold text-slate-900 text-xs truncate max-w-[200px]">{p?.fullName || 'Khách vãng lai'}</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600">
                {p?.patientCode || 'BN-N/A'}
              </span>
              <span>•</span>
              <span>{p?.gender === 'male' ? 'Nam' : p?.gender === 'female' ? 'Nữ' : 'Khác'}</span>
              {p?.dateOfBirth && (
                <>
                  <span>•</span>
                  <span>{new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()} tuổi</span>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Xét Nghiệm Y Cầu',
      cell: (row) => {
        const t = row.orderItem?.testType;
        return (
          <div className="min-w-48 max-w-sm">
            <div className="font-bold text-slate-800 text-xs leading-tight whitespace-nowrap truncate max-w-[240px]" title={t?.testName}>
              {t?.testName || 'Xét nghiệm'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 whitespace-nowrap">
              <span className="uppercase px-1.5 py-0.2 bg-blue-50 text-blue-700 font-bold rounded shrink-0">
                {t?.category || 'Lab'}
              </span>
              {t?.specimenType && (
                <span className="truncate max-w-[200px]" title={`Mẫu: ${t.specimenType}`}>
                  Mẫu: {t.specimenType}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Bác Sĩ & Khoa Khám',
      cell: (row) => {
        const doc = row.orderItem?.order?.orderedByUser;
        const dept = row.orderItem?.order?.encounter?.department;
        return (
          <div className="text-xs whitespace-nowrap min-w-40">
            <div className="font-bold text-slate-800 truncate max-w-[180px]">
              {doc?.profile?.fullName || doc?.email || 'Bác sĩ phụ trách'}
            </div>
            {dept?.departmentName && (
              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                <span className="truncate max-w-[170px]" title={dept.departmentName}>{dept.departmentName}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Thanh Toán',
      cell: (row) => (
        <div className="whitespace-nowrap">
          <Badge variant={row.paymentVerified ? 'normal' : 'critical'} size="sm" className="whitespace-nowrap">
            {row.paymentVerified ? 'Đã thanh toán' : 'Chưa thanh toán'}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Trạng Thái',
      cell: (row) => <LabTaskStatusBadge status={row.status} task={row} />,
    },
    {
      header: 'Thao Tác KTV',
      cell: (row) => {
        const isReceiving = receivingTaskId === row.labTaskId;

        // 1. Chưa thanh toán -> Khóa
        if (!row.paymentVerified) {
          return (
            <button
              disabled
              className="px-3 py-1.5 font-bold text-xs rounded-xl bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Chờ thu ngân</span>
            </button>
          );
        }

        // 2. Chờ lấy mẫu (ready) -> Nút Tiếp nhận mẫu + Báo sự cố
        if (row.status === 'ready') {
          const isTaskExecutable = !myAssignments.length || myAssignments.some((a) => a.labRoomId === row.labRoomId);
          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <button
                onClick={() => handleReceiveTask(row)}
                disabled={isReceiving || !isTaskExecutable}
                title={!isTaskExecutable ? 'Bạn không được phân công phụ trách phòng xét nghiệm này' : 'Tiếp nhận mẫu bệnh phẩm'}
                className="px-3.5 py-1.5 font-bold text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {isReceiving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Đang nhận...</span>
                  </>
                ) : (
                  <>
                    <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                    <span>Tiếp nhận mẫu</span>
                  </>
                )}
              </button>
              {isLabStaff && (
                <button
                  type="button"
                  onClick={() => setExceptionModalTask(row)}
                  title="Báo cáo sự cố mẫu bệnh phẩm"
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span>Báo sự cố</span>
                </button>
              )}
            </div>
          );
        }

        // 3. Đang thực hiện (in_progress) -> Nút Nhập kết quả + Báo sự cố
        if (row.status === 'in_progress') {
          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <button
                onClick={() => handleOpenInputModal(row)}
                className="px-3.5 py-1.5 font-bold text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer border-none whitespace-nowrap shrink-0"
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>Nhập kết quả & AI</span>
              </button>
              {isLabStaff && (
                <button
                  type="button"
                  onClick={() => setExceptionModalTask(row)}
                  title="Báo cáo sự cố trong quá trình thực hiện"
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span>Báo sự cố</span>
                </button>
              )}
            </div>
          );
        }

        // 4. Đã hoàn tất (completed) -> Nút Xem kết quả EMR
        if (row.status === 'completed') {
          return (
            <button
              onClick={() => handleViewResult(row, false)}
              className="px-3.5 py-1.5 font-bold text-xs rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>Xem kết quả EMR</span>
            </button>
          );
        }

        // 5. Chờ xử lý sự cố (on_hold) -> Text xám + Xem chi tiết
        if (row.status === 'on_hold') {
          return (
            <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
              <span className="text-[11px] text-amber-700 italic font-medium">Đang chờ bác sĩ quyết định</span>
              <button
                type="button"
                onClick={() => setTimelineDrawerTask(row)}
                className="px-2.5 py-1 text-xs font-bold rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem chi tiết</span>
              </button>
            </div>
          );
        }

        // 6. Đã huỷ (cancelled)
        if (row.status === 'cancelled') {
          return (
            <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
              <span className="text-[11px] text-slate-400 italic">Đã huỷ</span>
              <button
                type="button"
                onClick={() => setTimelineDrawerTask(row)}
                className="px-2.5 py-1 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1 cursor-pointer border border-slate-200"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem chi tiết</span>
              </button>
            </div>
          );
        }

        return null;
      },
    },
  ];

  const currentRoomInfo = labRooms.find((r) => r.labRoomId === selectedRoomId);

  return (
    <div className="w-full space-y-6 text-slate-800 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold text-white animate-in slide-in-from-bottom-5 ${
            toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner & Room Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-blue-700" />
              <span>Bàn Làm Việc Kỹ Thuật Viên Xét Nghiệm (Lab Worklist)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tiếp nhận mẫu bệnh phẩm đã thanh toán, thực hiện xét nghiệm, nhập chỉ số kỹ thuật và trả kết quả EMR
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTasks(false)}
              disabled={isLoadingTasks}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTasks ? 'animate-spin text-blue-600' : ''}`} />
              <span>Làm mới danh sách</span>
            </button>
          </div>
        </div>

        {/* Thanh chọn phòng Lab đang làm việc (Dropdown Menu) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <label htmlFor="lab-room-dropdown" className="text-xs font-bold text-slate-600 shrink-0 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Phòng Lab đang làm việc:</span>
            </label>

            {isLoadingRooms ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Đang tải danh mục phòng...</span>
              </div>
            ) : labRooms.length === 0 ? (
              <span className="text-xs text-slate-400 font-medium">Chưa có phòng Lab nào</span>
            ) : (
              <div className="relative min-w-[260px] sm:min-w-[340px]">
                <select
                  id="lab-room-dropdown"
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full appearance-none bg-white hover:bg-slate-50 border border-slate-300 hover:border-blue-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl pl-3.5 pr-9 py-2 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-xs outline-none"
                >
                  <option value="ALL">🌐 Tất cả phòng xét nghiệm ({allTasks.length} ca)</option>
                  {myAssignments.length > 0 ? (
                    <>
                      <optgroup label="⭐ Phòng bạn được phân công">
                        {labRooms
                          .filter((r) => myAssignments.some((a) => a.labRoomId === r.labRoomId))
                          .map((room) => {
                            const isPrimary = myAssignments.find((a) => a.labRoomId === room.labRoomId)?.isPrimary;
                            const count = allTasks.filter((t) => t.labRoomId === room.labRoomId).length;
                            return (
                              <option key={room.labRoomId} value={room.labRoomId}>
                                {room.labRoomName} {isPrimary ? '— (Phòng chính)' : '— (Phân công)'} ({count} ca)
                              </option>
                            );
                          })}
                      </optgroup>
                      {labRooms.some((r) => !myAssignments.some((a) => a.labRoomId === r.labRoomId)) && (
                        <optgroup label="🏢 Các phòng xét nghiệm khác">
                          {labRooms
                            .filter((r) => !myAssignments.some((a) => a.labRoomId === r.labRoomId))
                            .map((room) => {
                              const count = allTasks.filter((t) => t.labRoomId === room.labRoomId).length;
                              return (
                                <option key={room.labRoomId} value={room.labRoomId}>
                                  {room.labRoomName} ({count} ca)
                                </option>
                              );
                            })}
                        </optgroup>
                      )}
                    </>
                  ) : (
                    labRooms.map((room) => {
                      const count = allTasks.filter((t) => t.labRoomId === room.labRoomId).length;
                      return (
                        <option key={room.labRoomId} value={room.labRoomId}>
                          {room.labRoomName} ({count} ca)
                        </option>
                      );
                    })
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* Status badge for the selected room */}
            {(() => {
              if (selectedRoomId === 'ALL') {
                return (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                    <Building2 className="w-3 h-3 text-indigo-600" />
                    Toàn viện
                  </span>
                );
              }
              const currentAssignment = myAssignments.find((a) => a.labRoomId === selectedRoomId);
              if (currentAssignment?.isPrimary) {
                return (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    Phòng chính của bạn
                  </span>
                );
              } else if (currentAssignment) {
                return (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Được phân công
                  </span>
                );
              } else if (selectedRoomId && myAssignments.length > 0) {
                return (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    <Eye className="w-3 h-3 text-slate-500" />
                    Đang xem phòng khác
                  </span>
                );
              }
              return null;
            })()}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Vị trí:</span>
            <span className="font-semibold text-slate-700">
              {selectedRoomId === 'ALL' ? 'Tất cả các phòng chuyên môn' : (currentRoomInfo?.location || 'Khu xét nghiệm tập trung')}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block">Tổng số ca</span>
          <div className="text-xl font-black text-slate-900 mt-1 flex items-center justify-between">
            <span>{activeDateStats.total}</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
            {dateFilterMode === 'today' ? 'Trong ca trực hôm nay' : dateFilterMode === 'yesterday' ? 'Hôm qua' : dateFilterMode === '7days' ? '7 ngày gần đây' : 'Phạm vi ngày đã chọn'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/40 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-800 block">Chờ lấy mẫu</span>
          <div className="text-xl font-black text-amber-700 mt-1 flex items-center justify-between">
            <span>{activeDateStats.ready}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-[10px] text-amber-600 font-medium block mt-0.5">
            Cần KTV tiếp nhận mẫu
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-blue-200/80 bg-blue-50/40 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-800 block">Đang xét nghiệm</span>
          <div className="text-xl font-black text-blue-700 mt-1 flex items-center justify-between">
            <span>{activeDateStats.inProgress}</span>
            <FlaskConical className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-[10px] text-blue-600 font-medium block mt-0.5">
            Đang đo chỉ số & nhập EMR
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 block">Đã có kết quả EMR</span>
          <div className="text-xl font-black text-emerald-700 mt-1 flex items-center justify-between">
            <span>{activeDateStats.completed}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
            Đã hoàn tất & lưu hồ sơ
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-amber-300/80 bg-amber-50/70 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-900 block">Chờ bác sĩ xử lý</span>
          <div className="text-xl font-black text-amber-700 mt-1 flex items-center justify-between">
            <span>{activeDateStats.onHold}</span>
            <PauseCircle className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
            Sự cố chờ quyết định lâm sàng
          </span>
        </div>
      </div>

      {/* Date Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        {/* Row 1: Date Filter Presets + Custom Date Input + Search Box */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 mr-1">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span>Thời gian:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'today', label: 'Hôm nay', count: dateStats.today },
                { key: 'yesterday', label: 'Hôm qua', count: dateStats.yesterday },
                { key: '7days', label: '7 ngày qua', count: dateStats.sevenDays },
                { key: 'all', label: 'Tất cả các ngày', count: dateStats.all },
                { key: 'custom', label: 'Tùy chọn ngày', count: null },
              ].map((tab) => {
                const isActive = dateFilterMode === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setDateFilterMode(tab.key as LabDateFilterMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                          isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Date picker input when custom is selected */}
            {dateFilterMode === 'custom' && (
              <div className="flex items-center gap-1.5 pl-1 animate-in fade-in">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-white border border-blue-400 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72 shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên BN, mã BN, xét nghiệm..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
          <span className="text-xs font-bold text-slate-500 shrink-0 mr-1">Trạng thái:</span>
          {[
            { key: 'ALL', label: 'Tất cả ca' },
            { key: 'ready', label: '📥 Chờ tiếp nhận mẫu' },
            { key: 'in_progress', label: '⚙️ Đang thực hiện' },
            { key: 'on_hold', label: `⏸ Chờ xử lý sự cố${activeDateStats.onHold > 0 ? ` (${activeDateStats.onHold})` : ''}` },
            { key: 'completed', label: '✅ Đã có kết quả EMR' },
            { key: 'payment_pending', label: '⏳ Chờ thanh toán' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.2 text-xs font-bold rounded-xl transition-all shrink-0 border cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Thông báo nếu hôm nay chưa có ca xét nghiệm */}
      {dateFilterMode === 'today' && dateStats.today === 0 && dateStats.all > 0 && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Hôm nay chưa phát sinh ca xét nghiệm mới nào. Hiện có <strong>{dateStats.all}</strong> ca xét nghiệm từ các ngày trước đó cần theo dõi.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDateFilterMode('all')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer border-none shadow-2xs shrink-0 transition-all"
          >
            Xem tất cả ({dateStats.all} ca)
          </button>
        </div>
      )}

      {/* Main Worklist Table */}
      {taskError ? (
        <div className="p-10 bg-white rounded-2xl border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <div className="text-xs font-bold text-rose-700">{taskError}</div>
          <button
            onClick={() => fetchTasks(false)}
            className="mt-2 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold border-none cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          rowClassName={(row) =>
            row.status === 'on_hold'
              ? 'bg-amber-50/40 border-l-[3px] border-l-amber-500'
              : row.status === 'cancelled'
              ? 'bg-slate-50/50 opacity-75'
              : ''
          }
          data={filteredTasks}
          pageSize={10}
          searchPlaceholder="Lọc nhanh danh sách đang hiển thị..."
        />
      )}

      {/* MODAL 1: NHẬP KẾT QUẢ XÉT NGHIỆM LẦN ĐẦU (CHO CA IN_PROGRESS) */}
      {selectedTask && (
        <Modal
          isOpen={isInputModalOpen}
          onClose={() => setIsInputModalOpen(false)}
          title={`Nhập kết quả xét nghiệm: ${selectedTask.orderItem?.testType?.testName || 'Xét nghiệm'}`}
          subtitle={`Bệnh nhân: ${selectedTask.orderItem?.order?.encounter?.patient?.fullName || 'N/A'} (Mã BN: ${
            selectedTask.orderItem?.order?.encounter?.patient?.patientCode || 'N/A'
          }) • Bác sĩ: ${selectedTask.orderItem?.order?.orderedByUser?.profile?.fullName || 'N/A'}${
            selectedTask.orderItem?.order?.encounter?.department?.departmentName
              ? ` — ${selectedTask.orderItem.order.encounter.department.departmentName}`
              : ''
          }`}
          maxWidth="4xl"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsInputModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
              >
                Đóng lại
              </button>
              <button
                type="button"
                onClick={handleSubmitResult}
                disabled={isSubmittingResult}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
              >
                {isSubmittingResult ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu EMR...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lưu & Hoàn Tất Kết Quả EMR</span>
                  </>
                )}
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs text-slate-800">
            {/* Input parameters */}
            <div className="space-y-4">
              {/* Cảnh báo lỗi trực tiếp trên Modal */}
              {modalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 shadow-sm animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-extrabold text-rose-900">Không thể lưu kết quả EMR:</div>
                    <div className="text-[11px] mt-0.5 text-rose-700 font-medium">{modalError}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalError(null)}
                    className="text-rose-400 hover:text-rose-600 p-0.5 cursor-pointer border-none bg-transparent"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-blue-950">
                <div className="flex flex-wrap items-center gap-3">
                  <span>Phòng xét nghiệm: <strong className="text-blue-700">{currentRoomInfo?.labRoomName}</strong></span>
                  {(() => {
                    const p = selectedTask.orderItem?.order?.encounter?.patient;
                    const age = calculatePatientAge(p?.dateOfBirth);
                    const g = normalizePatientGender(p?.gender);
                    const gLabel = g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Chung';
                    return (
                      <span className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-800 font-bold">
                        Hệ quy chiếu ngưỡng: {gLabel}{age !== null ? ` • ${age} tuổi` : ''}
                      </span>
                    );
                  })()}
                </div>
                <span className="text-emerald-700 font-bold">✓ Đã xác nhận thanh toán</span>
              </div>

              {/* Thanh chuyển Tab trong Modal 1: Nhập chỉ số vs Bảng ngưỡng phân độ */}
              {selectedTask.orderItem?.testType?.labResultParameters &&
                selectedTask.orderItem.testType.labResultParameters.length > 0 && (
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200/80 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setInputModalTab('entry')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
                        inputModalTab === 'entry'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'bg-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      1. Nhập chỉ số & Đánh giá tức thời
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputModalTab('thresholds')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
                        inputModalTab === 'thresholds'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'bg-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      2. Bảng ngưỡng phân độ theo Tuổi & Giới tính
                    </button>
                  </div>
                )}

              {inputModalTab === 'thresholds' &&
              selectedTask.orderItem?.testType?.labResultParameters &&
              selectedTask.orderItem.testType.labResultParameters.length > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
                    <span>
                      Bảng tra cứu toàn bộ các dải ngưỡng theo từng mức độ nguy cơ (Thấp / Bình thường / Trung bình / Cao / Nguy kịch) áp dụng riêng cho độ tuổi và giới tính của bệnh nhân này.
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 w-64">Chỉ số xét nghiệm</th>
                          <th className="p-2.5 w-20">Đơn vị</th>
                          <th className="p-2.5 w-32">Khoảng chuẩn</th>
                          <th className="p-2.5">Phân độ các ngưỡng theo mức độ nguy cơ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedTask.orderItem.testType.labResultParameters.map((param) => {
                          const patient = selectedTask.orderItem?.order?.encounter?.patient;
                          const bands = resolveApplicableThresholdBands(param.labParameterThresholds, patient);
                          const numVal = paramValues[param.parameterId]?.valueNumeric;
                          const evalRes = evaluateNumericAgainstBands(numVal, bands);
                          const isPositiveNegative = param.dataType === 'positive_negative';

                          return (
                            <tr key={param.parameterId}>
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900">{param.parameterName || param.parameterCode}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{param.parameterCode}</div>
                              </td>
                              <td className="p-2.5 text-slate-500 font-mono text-[11px]">{param.unit || '-'}</td>
                              <td className="p-2.5 text-slate-700 font-mono font-semibold text-[11px]">
                                {isPositiveNegative ? 'Âm tính (-)' : formatBandRange(evalRes.normalBand)}
                              </td>
                              <td className="p-2.5">
                                {isPositiveNegative ? (
                                  <span className="text-[11px] text-emerald-700 font-semibold">Âm tính (-): Bình thường • Dương tính (+): Bất thường</span>
                                ) : bands.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {bands.map((b, idx) => {
                                      const meta = RISK_LEVEL_META[b.riskLevel] || RISK_LEVEL_META.normal;
                                      const isMatched =
                                        numVal !== undefined &&
                                        evalRes.matchedBand &&
                                        evalRes.matchedBand.riskLevel === b.riskLevel &&
                                        evalRes.matchedBand.rangeMin === b.rangeMin &&
                                        evalRes.matchedBand.rangeMax === b.rangeMax;
                                      return (
                                        <span
                                          key={`${b.riskLevel}-${idx}`}
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono ${
                                            meta.pillCls
                                          } ${isMatched ? 'ring-2 ring-slate-900/70 font-extrabold' : ''}`}
                                        >
                                          <span className="font-sans font-bold">{meta.shortLabel}:</span>
                                          <span>{formatBandRange(b)}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">Chưa có thông tin</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <>
                  {/* Form các tham số đo đạc kỹ thuật (Gọn: Chỉ số, Giá trị đo, Đơn vị, Khoảng chuẩn, Đánh giá tức thời) */}
                  <div className="space-y-3">
                    <label className="block font-extrabold text-slate-800 text-xs">
                      Danh mục chỉ số đo đạc kỹ thuật (*):
                    </label>

                    {selectedTask.orderItem?.testType?.labResultParameters &&
                    selectedTask.orderItem.testType.labResultParameters.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2.5">Chỉ số</th>
                              <th className="p-2.5 w-36">Giá trị đo</th>
                              <th className="p-2.5 w-20">Đơn vị</th>
                              <th className="p-2.5 w-36">Khoảng chuẩn</th>
                              <th className="p-2.5 w-48">Đánh giá tức thời</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {selectedTask.orderItem.testType.labResultParameters.map((param) => {
                              const val = paramValues[param.parameterId];
                              const patient = selectedTask.orderItem?.order?.encounter?.patient;
                              const bands = resolveApplicableThresholdBands(param.labParameterThresholds, patient);
                              const dataType = param.dataType || 'numeric';
                              
                              const numVal = val?.valueNumeric;
                              const textVal = val?.valueText ?? (dataType === 'positive_negative' ? 'Âm tính (-)' : '');

                              const isPositiveNegative = dataType === 'positive_negative';
                              const isText = dataType === 'text';
                              const isNumeric = !isPositiveNegative && !isText;

                              const isPositive = isPositiveNegative && (
                                textVal.toLowerCase().includes('dương tính') ||
                                textVal.toLowerCase().includes('positive') ||
                                textVal.includes('+')
                              );

                              const evalRes = evaluateNumericAgainstBands(numVal, bands);
                              const isOutOfRange = isNumeric ? evalRes.isAbnormal : isPositive;
                              const currentRisk: RiskLevelKey = isNumeric
                                ? evalRes.riskLevel
                                : isPositive
                                ? 'high'
                                : 'normal';

                              return (
                                <tr key={param.parameterId} className={isOutOfRange ? 'bg-rose-50/40' : ''}>
                                  <td className="p-2.5">
                                    <div className="font-bold text-slate-900">{param.parameterName || param.parameterCode}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {param.parameterCode} {isPositiveNegative ? '• (Âm/Dương)' : isText ? '• (Chữ)' : ''}
                                    </div>
                                  </td>
                                  <td className="p-2.5">
                                    {isPositiveNegative ? (
                                      <select
                                        value={textVal}
                                        onChange={(e) => {
                                          setModalError(null);
                                          setParamValues((prev) => ({
                                            ...prev,
                                            [param.parameterId]: { ...prev[param.parameterId], valueText: e.target.value },
                                          }));
                                        }}
                                        className={`w-full px-2.5 py-1 text-xs font-bold rounded-lg border outline-none focus:border-blue-600 bg-white cursor-pointer ${
                                          isPositive ? 'border-rose-400 bg-rose-50 text-rose-700 font-extrabold' : 'border-slate-300 text-slate-900'
                                        }`}
                                      >
                                        <option value="Âm tính (-)">Âm tính (-)</option>
                                        <option value="Vết (Trace)">Vết (Trace)</option>
                                        <option value="Dương tính 1+ (+)">Dương tính 1+ (+)</option>
                                        <option value="Dương tính 2+ (++)">Dương tính 2+ (++)</option>
                                        <option value="Dương tính 3+ (+++)">Dương tính 3+ (+++)</option>
                                        <option value="Dương tính 4+ (++++)">Dương tính 4+ (++++)</option>
                                      </select>
                                    ) : isText ? (
                                      <input
                                        type="text"
                                        value={textVal}
                                        onChange={(e) => {
                                          setModalError(null);
                                          setParamValues((prev) => ({
                                            ...prev,
                                            [param.parameterId]: { ...prev[param.parameterId], valueText: e.target.value },
                                          }));
                                        }}
                                        placeholder="Nhập kết quả..."
                                        className="w-full px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:border-blue-600"
                                      />
                                    ) : (
                                      <input
                                        type="number"
                                        step="any"
                                        value={val?.valueNumeric !== undefined ? val.valueNumeric : ''}
                                        onChange={(e) => {
                                          setModalError(null);
                                          const v = e.target.value === '' ? undefined : Number(e.target.value);
                                          setParamValues((prev) => ({
                                            ...prev,
                                            [param.parameterId]: { ...prev[param.parameterId], valueNumeric: v },
                                          }));
                                        }}
                                        placeholder="Nhập số..."
                                        className={`w-full px-2.5 py-1 text-xs font-bold rounded-lg border outline-none focus:border-blue-600 ${
                                          isOutOfRange ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300 bg-white text-slate-900'
                                        }`}
                                      />
                                    )}
                                  </td>
                                  <td className="p-2.5 text-slate-500 font-mono text-[11px]">{param.unit || '-'}</td>
                                  <td className="p-2.5 text-slate-700 font-mono font-semibold text-[11px]">
                                    {isPositiveNegative ? (
                                      <span className="text-emerald-700">Âm tính (-)</span>
                                    ) : evalRes.normalBand ? (
                                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                        {formatBandRange(evalRes.normalBand)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic font-sans font-normal">Chưa có thông tin</span>
                                    )}
                                  </td>
                                  <td className="p-2.5">
                                    {isNumeric ? (
                                      bands.length === 0 ? (
                                        <span className="text-[11px] text-slate-400 italic">Chưa có thông tin</span>
                                      ) : numVal === undefined ? (
                                        <span className="text-[11px] text-slate-400 italic">Chưa nhập số</span>
                                      ) : (
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                            RISK_LEVEL_META[currentRisk]?.badgeCls || RISK_LEVEL_META.normal.badgeCls
                                          }`}
                                        >
                                          {currentRisk === 'normal' ? (
                                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                                          ) : currentRisk === 'critical' ? (
                                            <ShieldAlert className="w-3 h-3 shrink-0" />
                                          ) : (
                                            <AlertTriangle className="w-3 h-3 shrink-0" />
                                          )}
                                          <span>{RISK_LEVEL_META[currentRisk]?.label || 'Bình thường'}</span>
                                        </span>
                                      )
                                    ) : isPositiveNegative ? (
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                          isPositive
                                            ? RISK_LEVEL_META.high.badgeCls
                                            : RISK_LEVEL_META.normal.badgeCls
                                        }`}
                                      >
                                        <span>{isPositive ? '⚠️ Dương tính (Vượt ngưỡng)' : '✓ Âm tính (Bình thường)'}</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">Định tính</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Xét nghiệm này không có danh mục chỉ số cố định. Hãy ghi kết luận mô tả vào ô bên dưới.
                      </p>
                    )}
                  </div>

                  {/* Ô kết luận tổng quát */}
                  <div className="space-y-1.5">
                    <label className="block font-extrabold text-slate-800 text-xs">
                      Kết luận tổng quát / Nhận xét của KTV:
                    </label>
                    <textarea
                      rows={3}
                      value={overallConclusion}
                      onChange={(e) => setOverallConclusion(e.target.value)}
                      placeholder="Ghi chú kết luận hoặc nhận xét chuyên môn của kỹ thuật viên..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 bg-white"
                    />
                  </div>

                  {/* Tải tệp hình ảnh đính kèm */}
                  <div className="space-y-2">
                    <label className="block font-extrabold text-slate-800 text-xs">
                      {selectedTask.orderItem?.testType?.category === 'imaging'
                        ? 'Ảnh chụp phim X-quang / Siêu âm / DICOM:'
                        : 'Tệp đính kèm / Phiếu in kết quả máy (Tùy chọn):'}
                    </label>
                    <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition-all bg-slate-50 flex flex-col items-center justify-center gap-1 block">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedFile(e.target.files[0]);
                            setAttachedFileName(e.target.files[0].name);
                          }
                        }}
                      />
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="font-bold text-slate-700 text-xs">
                        {attachedFileName ? attachedFileName : 'Nhấp để chọn tệp tin tải lên'}
                      </span>
                      <span className="text-[10px] text-slate-400">PNG, JPG, PDF tối đa 20MB</span>
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: XEM VÀ CHỈNH SỬA / BỔ SUNG KẾT QUẢ EMR TẠI CHỖ */}
      <Modal
        isOpen={isViewResultModalOpen}
        onClose={() => {
          setIsViewResultModalOpen(false);
          setIsEditingInViewModal(false);
        }}
        title={
          isEditingInViewModal
            ? `Chỉnh sửa & Bổ sung kết quả: ${selectedTask?.orderItem?.testType?.testName || 'Xét nghiệm'}`
            : 'Chi tiết kết quả xét nghiệm EMR'
        }
        subtitle={
          isEditingInViewModal
            ? `Bệnh nhân: ${selectedTask?.orderItem?.order?.encounter?.patient?.fullName || 'N/A'} (Mã BN: ${
                selectedTask?.orderItem?.order?.encounter?.patient?.patientCode || 'N/A'
              }) • Chế độ đính chính / bổ sung EMR`
            : 'Hồ sơ kết quả chính thức đã lưu trên hệ thống'
        }
        maxWidth="4xl"
        footer={
          isEditingInViewModal ? (
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setIsEditingInViewModal(false)}
                disabled={isSavingEdit}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveEditInViewModal}
                disabled={isSavingEdit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang cập nhật EMR...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lưu & Cập Nhật Kết Quả EMR</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="text-slate-400 text-[11px] italic">
                {viewingResult?.resultStatus === 'final'
                  ? 'Hồ sơ đã phát hành (FINAL).'
                  : viewingResult?.resultStatus === 'corrected'
                  ? 'Hồ sơ đã được đính chính/bổ sung (CORRECTED).'
                  : ''}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsViewResultModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer border-none"
                >
                  Đóng
                </button>
                {selectedTask && viewingResult && (
                  <button
                    onClick={() => setIsEditingInViewModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer border-none flex items-center gap-1.5 shadow-xs"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa / Bổ sung kết quả</span>
                  </button>
                )}
              </div>
            </div>
          )
        }
      >
        {isLoadingResultDetail ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Đang tải dữ liệu kết quả...</span>
          </div>
        ) : viewingResult ? (
          <div className="space-y-4 text-xs">
            {/* Thanh thông tin trạng thái & thời gian */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-slate-400 text-[10px] block">Trạng thái kết quả</span>
                  <span className={`font-bold uppercase ${
                    viewingResult.resultStatus === 'corrected' ? 'text-indigo-700' : 'text-emerald-700'
                  }`}>
                    {viewingResult.resultStatus === 'corrected' ? 'CORRECTED (Đã bổ sung)' : viewingResult.resultStatus}
                  </span>
                </div>
                {(() => {
                  const p = selectedTask?.orderItem?.order?.encounter?.patient;
                  const age = calculatePatientAge(p?.dateOfBirth);
                  const g = normalizePatientGender(p?.gender);
                  const gLabel = g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Chung';
                  return (
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold">
                      Hệ quy chiếu ngưỡng: {gLabel}{age !== null ? ` • ${age} tuổi` : ''}
                    </span>
                  );
                })()}
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Thời gian cập nhật</span>
                <span className="font-bold text-slate-800">
                  {new Date(viewingResult.resultedAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Thanh chuyển Tab trong Modal 2: Kết quả/Chỉnh sửa vs Bảng ngưỡng phân độ */}
            {((selectedTask?.orderItem?.testType?.labResultParameters &&
              selectedTask.orderItem.testType.labResultParameters.length > 0) ||
              (viewingResult.values && viewingResult.values.length > 0)) && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200/80 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setViewModalTab('result')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
                    viewModalTab === 'result'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'bg-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isEditingInViewModal ? '1. Chỉnh sửa chỉ số & Đánh giá tức thời' : '1. Kết quả đo & Đánh giá'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewModalTab('thresholds')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
                    viewModalTab === 'thresholds'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'bg-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2. Bảng ngưỡng phân độ theo Tuổi & Giới tính
                </button>
              </div>
            )}

            {viewModalTab === 'thresholds' ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                  Bảng tra cứu các dải ngưỡng theo từng mức độ nguy cơ (Thấp / Bình thường / Trung bình / Cao / Nguy kịch) áp dụng riêng cho độ tuổi và giới tính của bệnh nhân này. Dải ngưỡng có viền đậm là mức độ tương ứng với giá trị đo hiện tại.
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-60">Chỉ số xét nghiệm</th>
                        <th className="p-2.5 w-24">Giá trị hiện tại</th>
                        <th className="p-2.5 w-20">Đơn vị</th>
                        <th className="p-2.5 w-28">Khoảng chuẩn</th>
                        <th className="p-2.5">Phân độ các ngưỡng theo mức độ nguy cơ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(selectedTask?.orderItem?.testType?.labResultParameters &&
                      selectedTask.orderItem.testType.labResultParameters.length > 0
                        ? selectedTask.orderItem.testType.labResultParameters
                        : (viewingResult.values || []).map((v) => ({
                            parameterId: v.parameterId,
                            parameterCode: v.parameter?.parameterCode || '',
                            parameterName: v.parameter?.parameterName || v.parameter?.parameterCode || 'Chỉ số',
                            unit: v.parameter?.unit,
                            dataType: (v.parameter?.dataType as any) || 'numeric',
                            labParameterThresholds: v.parameter?.labParameterThresholds || [],
                          }))
                      ).map((param) => {
                        const patient = selectedTask?.orderItem?.order?.encounter?.patient;
                        const savedVal = viewingResult.values?.find((v) => v.parameterId === param.parameterId);
                        const rawThresholds =
                          param.labParameterThresholds && param.labParameterThresholds.length > 0
                            ? param.labParameterThresholds
                            : savedVal?.parameter?.labParameterThresholds || [];
                        const bands = resolveApplicableThresholdBands(rawThresholds, patient);

                        const numVal = isEditingInViewModal
                          ? editParamValues[param.parameterId]?.valueNumeric
                          : savedVal?.valueNumeric !== null && savedVal?.valueNumeric !== undefined
                          ? Number(savedVal.valueNumeric)
                          : undefined;
                        const evalRes = evaluateNumericAgainstBands(numVal, bands);
                        const isPositiveNegative = param.dataType === 'positive_negative';

                        return (
                          <tr key={param.parameterId}>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{param.parameterName || param.parameterCode}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{param.parameterCode}</div>
                            </td>
                            <td className="p-2.5 font-mono font-bold">
                              <span className={evalRes.isAbnormal ? 'text-rose-700 font-extrabold' : 'text-blue-900'}>
                                {numVal !== undefined ? numVal : savedVal?.valueText || '-'}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500 font-mono text-[11px]">{param.unit || '-'}</td>
                            <td className="p-2.5 text-slate-700 font-mono font-semibold text-[11px]">
                              {isPositiveNegative ? 'Âm tính (-)' : formatBandRange(evalRes.normalBand)}
                            </td>
                            <td className="p-2.5">
                              {isPositiveNegative ? (
                                <span className="text-[11px] text-emerald-700 font-semibold">
                                  Âm tính (-): Bình thường • Dương tính (+): Bất thường
                                </span>
                              ) : bands.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {bands.map((b, idx) => {
                                    const meta = RISK_LEVEL_META[b.riskLevel] || RISK_LEVEL_META.normal;
                                    const isMatched =
                                      numVal !== undefined &&
                                      evalRes.matchedBand &&
                                      evalRes.matchedBand.riskLevel === b.riskLevel &&
                                      evalRes.matchedBand.rangeMin === b.rangeMin &&
                                      evalRes.matchedBand.rangeMax === b.rangeMax;
                                    return (
                                      <span
                                        key={`${b.riskLevel}-${idx}`}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono ${
                                          meta.pillCls
                                        } ${isMatched ? 'ring-2 ring-slate-900/70 font-extrabold' : ''}`}
                                      >
                                        <span className="font-sans font-bold">{meta.shortLabel}:</span>
                                        <span>{formatBandRange(b)}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Chưa có thông tin</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : isEditingInViewModal ? (
              <div className="space-y-4">
                {/* Cảnh báo lỗi cập nhật trực tiếp trên Modal */}
                {editModalError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 shadow-sm animate-in fade-in">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-extrabold text-rose-900">Không thể cập nhật kết quả EMR:</div>
                      <div className="text-[11px] mt-0.5 text-rose-700 font-medium">{editModalError}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditModalError(null)}
                      className="text-rose-400 hover:text-rose-600 p-0.5 cursor-pointer border-none bg-transparent"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-[11px] font-semibold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Chế độ hiệu chỉnh/bổ sung: Nhập bổ sung các chỉ số đo đạc còn thiếu hoặc sửa giá trị và ghi chú. Khi lưu, hệ thống tự động ghi nhận đính chính (CORRECTED) theo chuẩn EMR.
                  </span>
                </div>

                {/* Bảng nhập toàn bộ danh mục chỉ số */}
                <div className="space-y-2">
                  <label className="block font-extrabold text-slate-800 text-xs">
                    Danh mục chỉ số đo đạc kỹ thuật (*):
                  </label>

                  {selectedTask?.orderItem?.testType?.labResultParameters &&
                  selectedTask.orderItem.testType.labResultParameters.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Chỉ số</th>
                            <th className="p-2.5 w-36">Giá trị đo</th>
                            <th className="p-2.5 w-20">Đơn vị</th>
                            <th className="p-2.5 w-36">Khoảng chuẩn</th>
                            <th className="p-2.5 w-48">Đánh giá tức thời</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {selectedTask.orderItem.testType.labResultParameters.map((param) => {
                            const val = editParamValues[param.parameterId];
                            const patient = selectedTask.orderItem?.order?.encounter?.patient;
                            const bands = resolveApplicableThresholdBands(param.labParameterThresholds, patient);
                            const dataType = param.dataType || 'numeric';

                            const numVal = val?.valueNumeric;
                            const textVal = val?.valueText ?? (dataType === 'positive_negative' ? 'Âm tính (-)' : '');

                            const isPositiveNegative = dataType === 'positive_negative';
                            const isText = dataType === 'text';
                            const isNumeric = !isPositiveNegative && !isText;

                            const isPositive = isPositiveNegative && (
                              textVal.toLowerCase().includes('dương tính') ||
                              textVal.toLowerCase().includes('positive') ||
                              textVal.includes('+')
                            );

                            const evalRes = evaluateNumericAgainstBands(numVal, bands);
                            const isOutOfRange = isNumeric ? evalRes.isAbnormal : isPositive;
                            const currentRisk: RiskLevelKey = isNumeric
                              ? evalRes.riskLevel
                              : isPositive
                              ? 'high'
                              : 'normal';

                            return (
                              <tr key={param.parameterId} className={isOutOfRange ? 'bg-rose-50/40' : ''}>
                                <td className="p-2.5">
                                  <div className="font-bold text-slate-900">{param.parameterName || param.parameterCode}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {param.parameterCode} {isPositiveNegative ? '• (Âm/Dương)' : isText ? '• (Chữ)' : ''}
                                  </div>
                                </td>
                                <td className="p-2.5">
                                  {isPositiveNegative ? (
                                    <select
                                      value={textVal}
                                      onChange={(e) => {
                                        setEditModalError(null);
                                        setEditParamValues((prev) => ({
                                          ...prev,
                                          [param.parameterId]: { ...prev[param.parameterId], valueText: e.target.value },
                                        }));
                                      }}
                                      className={`w-full px-2.5 py-1 text-xs font-bold rounded-lg border outline-none focus:border-indigo-600 bg-white cursor-pointer ${
                                        isPositive ? 'border-rose-400 bg-rose-50 text-rose-700 font-extrabold' : 'border-slate-300 text-slate-900'
                                      }`}
                                    >
                                      <option value="Âm tính (-)">Âm tính (-)</option>
                                      <option value="Vết (Trace)">Vết (Trace)</option>
                                      <option value="Dương tính 1+ (+)">Dương tính 1+ (+)</option>
                                      <option value="Dương tính 2+ (++)">Dương tính 2+ (++)</option>
                                      <option value="Dương tính 3+ (+++)">Dương tính 3+ (+++)</option>
                                      <option value="Dương tính 4+ (++++)">Dương tính 4+ (++++)</option>
                                    </select>
                                  ) : isText ? (
                                    <input
                                      type="text"
                                      value={textVal}
                                      onChange={(e) => {
                                        setEditModalError(null);
                                        setEditParamValues((prev) => ({
                                          ...prev,
                                          [param.parameterId]: { ...prev[param.parameterId], valueText: e.target.value },
                                        }));
                                      }}
                                      placeholder="Nhập kết quả..."
                                      className="w-full px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:border-indigo-600"
                                    />
                                  ) : (
                                    <input
                                      type="number"
                                      step="any"
                                      value={val?.valueNumeric !== undefined ? val.valueNumeric : ''}
                                      onChange={(e) => {
                                        setEditModalError(null);
                                        const v = e.target.value === '' ? undefined : Number(e.target.value);
                                        setEditParamValues((prev) => ({
                                          ...prev,
                                          [param.parameterId]: { ...prev[param.parameterId], valueNumeric: v },
                                        }));
                                      }}
                                      placeholder="Nhập số..."
                                      className={`w-full px-2.5 py-1 text-xs font-bold rounded-lg border outline-none focus:border-indigo-600 ${
                                        isOutOfRange ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300 bg-white text-slate-900'
                                      }`}
                                    />
                                  )}
                                </td>
                                <td className="p-2.5 text-slate-500 font-mono text-[11px]">{param.unit || '-'}</td>
                                <td className="p-2.5 text-slate-700 font-mono font-semibold text-[11px]">
                                  {isPositiveNegative ? (
                                    <span className="text-emerald-700">Âm tính (-)</span>
                                  ) : evalRes.normalBand ? (
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                      {formatBandRange(evalRes.normalBand)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic font-sans font-normal">Chưa có thông tin</span>
                                  )}
                                </td>
                                <td className="p-2.5">
                                  {isNumeric ? (
                                    bands.length === 0 ? (
                                      <span className="text-[11px] text-slate-400 italic">Chưa có thông tin</span>
                                    ) : numVal === undefined ? (
                                      <span className="text-[11px] text-slate-400 italic">Chưa nhập số</span>
                                    ) : (
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                          RISK_LEVEL_META[currentRisk]?.badgeCls || RISK_LEVEL_META.normal.badgeCls
                                        }`}
                                      >
                                        {currentRisk === 'normal' ? (
                                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                                        ) : currentRisk === 'critical' ? (
                                          <ShieldAlert className="w-3 h-3 shrink-0" />
                                        ) : (
                                          <AlertTriangle className="w-3 h-3 shrink-0" />
                                        )}
                                        <span>{RISK_LEVEL_META[currentRisk]?.label || 'Bình thường'}</span>
                                      </span>
                                    )
                                  ) : isPositiveNegative ? (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        isPositive
                                          ? RISK_LEVEL_META.high.badgeCls
                                          : RISK_LEVEL_META.normal.badgeCls
                                      }`}
                                    >
                                      <span>{isPositive ? '⚠️ Dương tính (Vượt ngưỡng)' : '✓ Âm tính (Bình thường)'}</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">Định tính</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Xét nghiệm này không có danh mục chỉ số cố định. Hãy ghi kết luận mô tả vào ô bên dưới.
                    </p>
                  )}
                </div>

                {/* Ô kết luận tổng quát / nhận xét */}
                <div className="space-y-1.5">
                  <label className="block font-extrabold text-slate-800 text-xs">
                    Kết luận tổng quát / Nhận xét của KTV:
                  </label>
                  <textarea
                    rows={3}
                    value={editConclusion}
                    onChange={(e) => setEditConclusion(e.target.value)}
                    placeholder="Ghi chú kết luận hoặc nhận xét chuyên môn của kỹ thuật viên..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 bg-white"
                  />
                </div>

                {/* Tệp đính kèm hiện có & Tải bổ sung */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  {viewingResult.attachments && viewingResult.attachments.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-extrabold text-slate-700 block">
                        Tệp đính kèm hiện có ({viewingResult.attachments.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {viewingResult.attachments.map((att) => {
                          const isImg = att.fileType === 'image' || att.fileUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)/i);
                          const resolvedUrl = resolveAttachmentUrl(att.fileUrl);
                          return (
                            <div
                              key={att.attachmentId}
                              className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {isImg ? (
                                  <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                                ) : (
                                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                )}
                                <span className="font-semibold text-slate-800 truncate text-[11px]">
                                  {att.description || 'Phiếu in kết quả máy'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewModalUrl(resolvedUrl)}
                                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  Xem
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingAttachmentId === att.attachmentId}
                                  onClick={() => void handleDeleteAttachment(att.attachmentId)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors disabled:opacity-50"
                                  title="Xoá tệp đính kèm này"
                                >
                                  {deletingAttachmentId === att.attachmentId ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                  <span>Xoá</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Khung tải thêm tệp đính kèm / phiếu in máy */}
                  <div className="space-y-1.5">
                    <label className="block font-extrabold text-slate-800 text-xs">
                      Tải bổ sung tệp đính kèm / Phiếu in kết quả máy (Tùy chọn):
                    </label>
                    <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-3.5 text-center cursor-pointer transition-all bg-slate-50 flex flex-col items-center justify-center gap-1 block">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setEditSelectedFile(e.target.files[0]);
                            setEditAttachedFileName(e.target.files[0].name);
                          }
                        }}
                      />
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-700 text-xs">
                        {editAttachedFileName ? editAttachedFileName : 'Nhấp để chọn tệp tin tải bổ sung'}
                      </span>
                      <span className="text-[10px] text-slate-400">PNG, JPG, PDF tối đa 20MB</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* CHẾ ĐỘ 2: XEM KẾT QUẢ CHÍNH THỨC */
              <div className="space-y-4">
                {/* Thông báo đánh giá tổng thể các chỉ số */}
                {viewingResult.values && viewingResult.values.length > 0 && (() => {
                  const abnormalItems = viewingResult.values.filter((v) => {
                    const alertItem = v.labResultAlerts?.[0];
                    const thresholds = v.parameter?.labParameterThresholds || [];
                    const defaultThreshold = thresholds[0];
                    const min = defaultThreshold?.rangeMin !== undefined && defaultThreshold?.rangeMin !== null 
                      ? Number(defaultThreshold.rangeMin) 
                      : alertItem?.expectedMin !== undefined && alertItem?.expectedMin !== null 
                      ? Number(alertItem.expectedMin) 
                      : undefined;
                    const max = defaultThreshold?.rangeMax !== undefined && defaultThreshold?.rangeMax !== null 
                      ? Number(defaultThreshold.rangeMax) 
                      : alertItem?.expectedMax !== undefined && alertItem?.expectedMax !== null 
                      ? Number(alertItem.expectedMax) 
                      : undefined;
                    const numVal = v.valueNumeric !== null && v.valueNumeric !== undefined ? Number(v.valueNumeric) : undefined;
                    const isOutOfRange = numVal !== undefined && ((min !== undefined && numVal < min) || (max !== undefined && numVal > max));
                    return v.isAbnormal || isOutOfRange || Boolean(alertItem);
                  });

                  if (abnormalItems.length > 0) {
                    return (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-rose-800">
                            Phát hiện {abnormalItems.length}/{viewingResult.values.length} chỉ số xét nghiệm vượt ngưỡng tham chiếu sinh học
                          </div>
                          <div className="text-[11px] text-rose-700 mt-0.5">
                            Hệ thống đã tự động ghi nhận cảnh báo EMR để Bác sĩ lưu ý khi chẩn đoán và chỉ định điều trị.
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">
                        Tất cả {viewingResult.values.length} chỉ số đo đạc đều nằm trong khoảng tham chiếu sinh học an toàn.
                      </span>
                    </div>
                  );
                })()}

                {/* Bảng chỉ số đã nhập (Chuẩn Y Tế 5 cột: Chỉ số, Giá trị, Đơn vị, Khoảng chuẩn, Đánh giá) */}
                {viewingResult.values && viewingResult.values.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Chỉ số xét nghiệm</th>
                          <th className="p-2.5 w-24">Giá trị đo</th>
                          <th className="p-2.5 w-20">Đơn vị</th>
                          <th className="p-2.5 w-36">Khoảng tham chiếu chuẩn</th>
                          <th className="p-2.5 w-48">Đánh giá / Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {viewingResult.values.map((v) => {
                          const alertItem = v.labResultAlerts?.[0];
                          const patient = selectedTask?.orderItem?.order?.encounter?.patient;
                          const taskParam = selectedTask?.orderItem?.testType?.labResultParameters?.find(
                            (p) => p.parameterId === v.parameterId || p.parameterCode === v.parameter?.parameterCode
                          );
                          const rawThresholds =
                            v.parameter?.labParameterThresholds && v.parameter.labParameterThresholds.length > 0
                              ? v.parameter.labParameterThresholds
                              : taskParam?.labParameterThresholds || [];

                          const bands = resolveApplicableThresholdBands(rawThresholds, patient);
                          const numVal = v.valueNumeric !== null && v.valueNumeric !== undefined ? Number(v.valueNumeric) : undefined;
                          const evalRes = evaluateNumericAgainstBands(numVal, bands);

                          const min = evalRes.normalBand?.rangeMin !== undefined
                            ? evalRes.normalBand.rangeMin
                            : alertItem?.expectedMin !== undefined && alertItem?.expectedMin !== null
                            ? Number(alertItem.expectedMin)
                            : undefined;

                          const max = evalRes.normalBand?.rangeMax !== undefined
                            ? evalRes.normalBand.rangeMax
                            : alertItem?.expectedMax !== undefined && alertItem?.expectedMax !== null
                            ? Number(alertItem.expectedMax)
                            : undefined;

                          const isAbnormal = v.isAbnormal || evalRes.isAbnormal || Boolean(alertItem);
                          const riskLevel: RiskLevelKey =
                            (alertItem?.riskLevel as RiskLevelKey) ||
                            (evalRes.isAbnormal ? evalRes.riskLevel : isAbnormal ? 'high' : 'normal');

                          return (
                            <tr key={v.resultValueId} className={isAbnormal ? 'bg-rose-50/40' : ''}>
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900">{v.parameter?.parameterName || taskParam?.parameterName || v.parameter?.parameterCode || 'Chỉ số'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{v.parameter?.parameterCode || taskParam?.parameterCode}</div>
                              </td>
                              <td className="p-2.5 font-mono font-bold text-slate-900">
                                <span className={isAbnormal ? 'text-rose-700 font-extrabold' : 'text-blue-900'}>
                                  {v.valueNumeric !== null && v.valueNumeric !== undefined ? v.valueNumeric : v.valueText || '-'}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-500 font-mono text-[11px]">{v.parameter?.unit || taskParam?.unit || '-'}</td>
                              <td className="p-2.5 text-slate-600 text-[11px] font-mono">
                                {min !== undefined || max !== undefined ? (
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                                    {formatBandRange({ rangeMin: min, rangeMax: max })}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic font-sans">Chưa có thông tin</span>
                                )}
                              </td>
                              <td className="p-2.5">
                                {bands.length === 0 && !isAbnormal ? (
                                  <span className="text-[11px] text-slate-400 italic">Chưa có thông tin</span>
                                ) : (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      RISK_LEVEL_META[riskLevel]?.badgeCls || RISK_LEVEL_META.normal.badgeCls
                                    }`}
                                  >
                                    {riskLevel === 'normal' && !isAbnormal ? (
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    ) : riskLevel === 'critical' ? (
                                      <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                                    ) : (
                                      <AlertTriangle className="w-3 h-3 shrink-0" />
                                    )}
                                    <span>
                                      {isAbnormal
                                        ? RISK_LEVEL_META[riskLevel === 'normal' ? 'high' : riskLevel]?.label
                                        : RISK_LEVEL_META.normal.label}
                                    </span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 italic text-center">
                    Chưa có chỉ số đo đạc nào được lưu
                  </div>
                )}

                {/* Kết luận tổng quát */}
                {viewingResult.overallConclusion ? (
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                    <span className="text-[10px] font-extrabold text-blue-800 uppercase block mb-1">Kết luận tổng quát / Ghi chú:</span>
                    <p className="text-slate-800 font-medium">{viewingResult.overallConclusion}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 italic text-[11px]">
                    Chưa có ghi chú / kết luận tổng quát của KTV
                  </div>
                )}

                {/* Tệp đính kèm / Phiếu in kết quả máy */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tệp đính kèm / Phiếu in kết quả máy ({viewingResult.attachments?.length || 0})</span>
                    </span>
                  </div>

                  {viewingResult.attachments && viewingResult.attachments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {viewingResult.attachments.map((att) => {
                        const isImg = att.fileType === 'image' || att.fileUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)/i);
                        const resolvedUrl = resolveAttachmentUrl(att.fileUrl);
                        return (
                          <div
                            key={att.attachmentId}
                            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                                {isImg ? (
                                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                                ) : (
                                  <FileText className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate text-[11px]">
                                  {att.description || (isImg ? 'Ảnh phiếu in kết quả máy' : 'Tệp kết quả PDF')}
                                </p>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {att.uploadedAt ? new Date(att.uploadedAt).toLocaleString('vi-VN') : 'Đã đính kèm'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewModalUrl(resolvedUrl)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer border-none shadow-2xs"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Xem tệp</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 italic text-[11px] flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Chưa có tệp đính kèm hoặc phiếu in máy cho kết quả này.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">Không tìm thấy thông tin kết quả</div>
        )}
      </Modal>

      {/* MODAL 3: TỔNG KẾT ĐỐI SOÁT CHỈ SỐ XÉT NGHIỆM VÀ NGƯỠNG SAU KHI LƯU */}
      {alertSummary && (
        <Modal
          isOpen={isAlertSummaryModalOpen}
          onClose={() => setIsAlertSummaryModalOpen(false)}
          title="Tổng kết đối soát chỉ số xét nghiệm & Ngưỡng sinh học"
          subtitle={`Ca: ${alertSummary.task.orderItem?.testType?.testName || 'Xét nghiệm'} • Bệnh nhân: ${
            alertSummary.task.orderItem?.order?.encounter?.patient?.fullName || 'N/A'
          } (Mã BN: ${alertSummary.task.orderItem?.order?.encounter?.patient?.patientCode || 'N/A'})`}
          maxWidth="4xl"
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dữ liệu đã được lưu chính thức vào bệnh án điện tử EMR</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAlertSummaryModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Đóng lại
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAlertSummaryModalOpen(false);
                    handleViewResult(alertSummary.task);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 cursor-pointer border-none"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem phiếu kết quả EMR</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Thẻ thống kê nhanh */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Tổng số chỉ số</div>
                <div className="text-xl font-extrabold text-slate-800 mt-0.5">{alertSummary.totalParameters}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Thông số kỹ thuật đo đạc</div>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <div className="text-[10px] text-emerald-700 font-bold uppercase">Trong ngưỡng chuẩn</div>
                <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                  {alertSummary.totalParameters - alertSummary.abnormalCount}
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Chỉ số an toàn bình thường</div>
              </div>

              <div className={`p-3 rounded-xl border ${
                alertSummary.abnormalCount > 0 ? 'bg-rose-50/80 border-rose-200' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`text-[10px] font-bold uppercase ${
                  alertSummary.abnormalCount > 0 ? 'text-rose-700' : 'text-slate-500'
                }`}>
                  Vượt ngưỡng cảnh báo
                </div>
                <div className={`text-xl font-extrabold mt-0.5 ${
                  alertSummary.abnormalCount > 0 ? 'text-rose-700' : 'text-slate-800'
                }`}>
                  {alertSummary.abnormalCount}
                </div>
                <div className={`text-[10px] mt-0.5 ${
                  alertSummary.abnormalCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'
                }`}>
                  {alertSummary.abnormalCount > 0 ? 'Cần Bác sĩ chú ý đặc biệt' : 'Không có bất thường'}
                </div>
              </div>
            </div>

            {/* Thông điệp đánh giá */}
            {alertSummary.abnormalCount > 0 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-extrabold text-rose-800 text-xs">
                    Cảnh báo: Có {alertSummary.abnormalCount} chỉ số xét nghiệm lệch khỏi ngưỡng tham chiếu sinh học!
                  </div>
                  <div className="text-[11px] text-rose-700">
                    Hệ thống đã tự động lưu dấu cảnh báo bất thường vào hồ sơ EMR để hỗ trợ Bác sĩ khám ra quyết định lâm sàng chính xác.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">
                  Hoàn hảo! Toàn bộ {alertSummary.totalParameters} chỉ số đo đạc đều nằm trong ngưỡng sinh học tiêu chuẩn.
                </span>
              </div>
            )}

            {/* Bảng chi tiết từng thông số và ngưỡng */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Chỉ số xét nghiệm</th>
                    <th className="p-2.5">Kết quả đo</th>
                    <th className="p-2.5">Đơn vị</th>
                    <th className="p-2.5">Khoảng chuẩn (Value Range)</th>
                    <th className="p-2.5">Đánh giá ngưỡng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {alertSummary.items.map((item) => (
                    <tr key={item.parameterId} className={item.isAbnormal ? 'bg-rose-50/40' : ''}>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{item.parameterName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.parameterCode}</div>
                      </td>
                      <td className="p-2.5 font-mono font-bold text-slate-900">
                        <span className={item.isAbnormal ? 'text-rose-700 font-extrabold' : 'text-blue-900'}>
                          {item.measuredValue}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-500 font-mono text-[11px]">{item.unit}</td>
                      <td className="p-2.5 text-slate-600 text-[11px] font-mono">
                        {item.rangeMin !== undefined && item.rangeMax !== undefined ? (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                            {item.rangeMin} – {item.rangeMax}
                          </span>
                        ) : item.rangeMin !== undefined ? (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                            &ge; {item.rangeMin}
                          </span>
                        ) : item.rangeMax !== undefined ? (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                            &le; {item.rangeMax}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Bình thường</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {item.isAbnormal ? (
                          item.riskLevel === 'critical' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>Báo động đỏ (Critical)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>{item.deviationText}</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Bình thường</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL PHÓNG TO / XEM TỆP ĐÍNH KÈM / PHIẾU IN KẾT QUẢ MÁY */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-white">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-extrabold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Xem tệp đính kèm / Phiếu in kết quả máy</span>
              </h4>
              <div className="flex items-center gap-2">
                <a
                  href={previewModalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors no-underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở tab mới</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalUrl(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/40 min-h-[300px]">
              {(() => {
                const cleanUrl = previewModalUrl.split('?')[0].split('#')[0];
                if (/\.pdf$/i.test(cleanUrl)) {
                  return (
                    <iframe
                      src={previewModalUrl}
                      title="Xem tệp PDF kết quả cận lâm sàng"
                      className="w-full h-[72vh] rounded-xl bg-white border border-slate-700"
                    />
                  );
                }
                if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(cleanUrl)) {
                  return (
                    <img
                      src={previewModalUrl}
                      alt="Tệp kết quả cận lâm sàng"
                      className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg border border-slate-800"
                    />
                  );
                }
                return (
                  <div className="text-center space-y-3 p-8">
                    <FileText className="w-12 h-12 mx-auto text-indigo-400" />
                    <p className="text-xs text-slate-300">Tệp tài liệu (PDF / Báo cáo xuất từ máy)</p>
                    <a
                      href={previewModalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors no-underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Tải về hoặc Xem trong tab mới</span>
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal Báo cáo sự cố nhiệm vụ (Lab Staff - Hình 3.62) */}
      <ReportExceptionModal
        isOpen={!!exceptionModalTask}
        task={exceptionModalTask}
        onClose={() => setExceptionModalTask(null)}
        onToast={(type, msg) => showToast(msg, type === 'warning' ? 'info' : type)}
        onSuccess={(updated) => {
          setAllTasks((prev) =>
            prev.map((t) => (t.id === updated.id || t.labTaskId === updated.labTaskId ? updated : t)),
          );
          if (selectedTask?.id === updated.id || selectedTask?.labTaskId === updated.labTaskId) {
            setIsInputModalOpen(false);
          }
        }}
      />

      {/* Drawer: Chi tiết tiến trình sự cố nhiệm vụ */}
      <ExceptionTimelineDrawer
        isOpen={!!timelineDrawerTask}
        task={timelineDrawerTask}
        onClose={() => setTimelineDrawerTask(null)}
      />

    </div>
  );
};
