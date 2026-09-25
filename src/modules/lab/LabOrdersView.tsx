import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FlaskConical, CheckCircle2, Sparkles, Upload, 
  Lock, FileText, Loader2,
  Building2, RefreshCw, Search, AlertCircle, Eye,
  ChevronDown, MapPin, Pencil, AlertTriangle, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Info, Check, ShieldCheck, X,
  Calendar, Clock, CalendarDays
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { labRoomService, type LabRoomItem, type LabStaffRoomAssignment } from '../../services/lab/lab-room.service';
import { labTaskService, type LabTaskItem } from '../../services/lab/lab-task.service';
import { labResultService, type LabResultDetail } from '../../services/lab/lab-result.service';

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

export const LabOrdersView: React.FC = () => {

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
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Modal 3: Thông báo tổng kết đối soát ngưỡng ngay sau khi Lưu
  const [alertSummary, setAlertSummary] = useState<ThresholdAlertSummary | null>(null);
  const [isAlertSummaryModalOpen, setIsAlertSummaryModalOpen] = useState<boolean>(false);

  // AI analysis states
  const [isAIScanning, setIsAIScanning] = useState<boolean>(false);
  const [isAIAnalyzed, setIsAIAnalyzed] = useState<boolean>(false);

  // Modal Error states (Hiển thị trực tiếp bên trong Modal)
  const [modalError, setModalError] = useState<string | null>(null);
  const [editModalError, setEditModalError] = useState<string | null>(null);

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

    return { total, ready, inProgress, completed, paymentPending };
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
    const initialParams: Record<string, { valueNumeric?: number; valueText?: string }> = {};
    const parameters = task.orderItem?.testType?.labResultParameters || [];
    parameters.forEach((p) => {
      const isPositiveNegative = p.dataType === 'positive_negative';
      initialParams[p.parameterId] = {
        valueNumeric: undefined,
        valueText: isPositiveNegative ? 'Âm tính (-)' : '',
      };
    });
    setParamValues(initialParams);
    setOverallConclusion('');
    setSelectedFile(null);
    setAttachedFileName('');
    setIsAIAnalyzed(false);
    setIsAIScanning(false);
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

    setIsSavingEdit(true);
    try {
      const updated = await labResultService.updateLabResult(viewingResult.labResultId, {
        values: valuesPayload.filter((v) => v.valueNumeric !== undefined || (v.valueText && v.valueText.trim() !== '')),
        overallConclusion: editConclusion.trim() || undefined,
      });

      setViewingResult(updated);
      populateEditData(selectedTask, updated);
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

  // AI Scanning giả lập
  const handleRunAI = () => {
    setIsAIScanning(true);
    setTimeout(() => {
      setIsAIScanning(false);
      setIsAIAnalyzed(true);
      showToast('Đã hoàn tất quét AI tự động đối soát chỉ số & phát hiện tổn thương', 'info');
    }, 1800);
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
      const result = await labResultService.submitLabResult(selectedTask.labTaskId, {
        values: valuesPayload.filter((v) => v.valueNumeric !== undefined || (v.valueText && v.valueText.trim() !== '')),
        overallConclusion: overallConclusion.trim() || undefined,
        resultStatus: 'final',
      });

      // Nếu có đính kèm file, upload đính kèm luôn
      if (selectedFile && result.labResultId) {
        await labResultService.uploadAttachment(result.labResultId, selectedFile, 'image', 'Hình ảnh xét nghiệm đính kèm').catch(() => {});
      }

      // Kích hoạt phát hiện bất thường từ backend để lấy phân loại nguy cơ chuẩn y tế
      let alertData: any = null;
      if (result.labResultId) {
        alertData = await labResultService.detectAlerts(result.labResultId).catch(() => null);
      }

      // Tổng hợp dữ liệu đối soát ngưỡng cho từng chỉ số
      const summaryItems: ThresholdAlertSummaryItem[] = parameters.map((param) => {
        const val = paramValues[param.parameterId];
        const threshold = param.labParameterThresholds?.[0];
        const min = threshold?.rangeMin !== undefined && threshold?.rangeMin !== null ? Number(threshold.rangeMin) : undefined;
        const max = threshold?.rangeMax !== undefined && threshold?.rangeMax !== null ? Number(threshold.rangeMax) : undefined;
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

        const matchedServerAlert = alertData?.results?.find((r: any) => r.parameterId === param.parameterId);
        const isServerAbnormal = matchedServerAlert?.isAbnormal === true;
        const serverRisk = matchedServerAlert?.riskLevel;

        const isClientOutOfRange = isNumeric
          ? (numVal !== undefined && ((min !== undefined && numVal < min) || (max !== undefined && numVal > max)))
          : isPositive;

        const isAbnormal = isServerAbnormal || isClientOutOfRange;
        let deviationText = 'Bình thường';
        if (isNumeric) {
          if (numVal !== undefined && max !== undefined && numVal > max) {
            deviationText = 'Vượt ngưỡng cao (Tăng)';
          } else if (numVal !== undefined && min !== undefined && numVal < min) {
            deviationText = 'Dưới ngưỡng chuẩn (Giảm)';
          } else if (isAbnormal) {
            deviationText = 'Bất thường';
          }
        } else if (isPositiveNegative) {
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
          riskLevel: serverRisk || (isAbnormal ? 'high' : 'normal'),
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
      fetchTasks(true);
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
      cell: (row) => {
        if (row.status === 'ready') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
              <span>Chờ lấy mẫu</span>
            </span>
          );
        }
        if (row.status === 'in_progress') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-spin shrink-0"></span>
              <span>Đang xét nghiệm</span>
            </span>
          );
        }
        if (row.status === 'completed') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Đã có kết quả</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 whitespace-nowrap shrink-0">
            {row.status === 'payment_pending' ? 'Chờ thanh toán' : row.status}
          </span>
        );
      },
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

        // 2. Chờ lấy mẫu (ready) -> Nút Tiếp nhận mẫu
        if (row.status === 'ready') {
          const isTaskExecutable = !myAssignments.length || myAssignments.some((a) => a.labRoomId === row.labRoomId);
          return (
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
          );
        }

        // 3. Đang thực hiện (in_progress) -> Nút Nhập kết quả
        if (row.status === 'in_progress') {
          return (
            <button
              onClick={() => handleOpenInputModal(row)}
              className="px-3.5 py-1.5 font-bold text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer border-none whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Nhập kết quả & AI</span>
            </button>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs text-slate-800">
            {/* Left: Input parameters */}
            <div className="lg:col-span-7 space-y-4">
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

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-[11px] font-semibold text-blue-950">
                <span>Phòng xét nghiệm: <strong className="text-blue-700">{currentRoomInfo?.labRoomName}</strong></span>
                <span className="text-emerald-700 font-bold">✓ Đã xác nhận thanh toán</span>
              </div>

              {/* Form các tham số đo đạc kỹ thuật */}
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
                          <th className="p-2.5 w-40">Giá trị đo</th>
                          <th className="p-2.5">Đơn vị</th>
                          <th className="p-2.5">Khoảng chuẩn</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedTask.orderItem.testType.labResultParameters.map((param) => {
                          const val = paramValues[param.parameterId];
                          const threshold = param.labParameterThresholds?.[0];
                          const min = threshold?.rangeMin !== undefined && threshold?.rangeMin !== null ? Number(threshold.rangeMin) : undefined;
                          const max = threshold?.rangeMax !== undefined && threshold?.rangeMax !== null ? Number(threshold.rangeMax) : undefined;
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

                          const isOutOfRange = isNumeric
                            ? (numVal !== undefined && ((min !== undefined && numVal < min) || (max !== undefined && numVal > max)))
                            : isPositive;

                          return (
                            <tr key={param.parameterId} className={isOutOfRange ? 'bg-rose-50/50' : ''}>
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
                              <td className="p-2.5 text-slate-500 text-[11px]">
                                {isPositiveNegative ? (
                                  <span className="font-semibold text-emerald-700">Âm tính (-)</span>
                                ) : min !== undefined && max !== undefined ? (
                                  <span>{min} - {max}</span>
                                ) : (
                                  <span>Bình thường</span>
                                )}
                                {isOutOfRange && (
                                  <span className="ml-1 text-rose-600 font-bold text-[10px] block">
                                    {isPositive ? '⚠️ Dương tính (Vượt ngưỡng)!' : '⚠️ Vượt ngưỡng!'}
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
            </div>

            {/* Right: AI Scanner & Visualizer */}
            <div className="lg:col-span-5 space-y-4">
              <button
                type="button"
                onClick={handleRunAI}
                disabled={isAIScanning}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-none cursor-pointer bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-sm hover:shadow-md"
              >
                {isAIScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
                    <span>AI đang phân tích dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Kích hoạt AI đối soát kết quả</span>
                  </>
                )}
              </button>

              <div className="bg-slate-950 text-white border border-slate-900 rounded-2xl p-4 min-h-[220px] flex flex-col justify-center relative overflow-hidden text-center">
                <span className="text-[9px] font-bold text-slate-500 absolute top-2 left-3 uppercase font-mono">
                  AI Medical Assistant
                </span>

                {isAIScanning ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <span className="text-xs text-indigo-200 font-bold">Đang phân tích các chỉ số...</span>
                  </div>
                ) : isAIAnalyzed ? (
                  <div className="space-y-3 text-left font-mono text-[11px] p-2">
                    <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold px-2 py-0.5 rounded-full inline-block">
                      ✓ Đã hoàn tất đối soát AI
                    </span>
                    <p className="text-slate-300">
                      • Tự động đối soát các ngưỡng sinh học chuẩn theo độ tuổi & giới tính của bệnh nhân.
                    </p>
                    <p className="text-slate-300">
                      • Sẵn sàng đồng bộ kết quả vào hồ sơ EMR để bác sĩ thăm khám tiếp tục chẩn đoán.
                    </p>
                  </div>
                ) : (
                  <div className="text-slate-400 space-y-1.5 p-4">
                    <FlaskConical className="w-8 h-8 mx-auto text-slate-500" />
                    <div className="font-bold text-xs">Chưa chạy phân tích AI</div>
                    <p className="text-[10px] text-slate-500">
                      Nhập các thông số kỹ thuật và bấm nút kích hoạt để AI hỗ trợ phát hiện các giá trị bất thường.
                    </p>
                  </div>
                )}
              </div>
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
        maxWidth={isEditingInViewModal ? '4xl' : '2xl'}
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
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] block">Trạng thái kết quả</span>
                <span className={`font-bold uppercase ${
                  viewingResult.resultStatus === 'corrected' ? 'text-indigo-700' : 'text-emerald-700'
                }`}>
                  {viewingResult.resultStatus === 'corrected' ? 'CORRECTED (Đã bổ sung)' : viewingResult.resultStatus}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Thời gian cập nhật</span>
                <span className="font-bold text-slate-800">
                  {new Date(viewingResult.resultedAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {/* CHẾ ĐỘ 1: ĐANG CHỈNH SỬA / BỔ SUNG TRỰC TIẾP TRONG MODAL NÀY */}
            {isEditingInViewModal ? (
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
                            <th className="p-2.5 w-40">Giá trị đo</th>
                            <th className="p-2.5">Đơn vị</th>
                            <th className="p-2.5">Khoảng chuẩn</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {selectedTask.orderItem.testType.labResultParameters.map((param) => {
                            const val = editParamValues[param.parameterId];
                            const threshold = param.labParameterThresholds?.[0];
                            const min = threshold?.rangeMin !== undefined && threshold?.rangeMin !== null ? Number(threshold.rangeMin) : undefined;
                            const max = threshold?.rangeMax !== undefined && threshold?.rangeMax !== null ? Number(threshold.rangeMax) : undefined;
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

                            const isOutOfRange = isNumeric
                              ? (numVal !== undefined && ((min !== undefined && numVal < min) || (max !== undefined && numVal > max)))
                              : isPositive;

                            return (
                              <tr key={param.parameterId} className={isOutOfRange ? 'bg-rose-50/50' : ''}>
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
                                <td className="p-2.5 text-slate-500 text-[11px]">
                                  {isPositiveNegative ? (
                                    <span className="font-semibold text-emerald-700">Âm tính (-)</span>
                                  ) : min !== undefined && max !== undefined ? (
                                    <span>{min} - {max}</span>
                                  ) : (
                                    <span>Bình thường</span>
                                  )}
                                  {isOutOfRange && (
                                    <span className="ml-1 text-rose-600 font-bold text-[10px] block">
                                      {isPositive ? '⚠️ Dương tính (Vượt ngưỡng)!' : '⚠️ Vượt ngưỡng!'}
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
                          <th className="p-2.5">Giá trị đo</th>
                          <th className="p-2.5">Đơn vị</th>
                          <th className="p-2.5">Khoảng tham chiếu chuẩn</th>
                          <th className="p-2.5">Đánh giá / Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {viewingResult.values.map((v) => {
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
                          const isOutOfRange = numVal !== undefined && (
                            (min !== undefined && numVal < min) ||
                            (max !== undefined && numVal > max)
                          );
                          const isAbnormal = v.isAbnormal || isOutOfRange || Boolean(alertItem);
                          const riskLevel = alertItem?.riskLevel || (isAbnormal ? 'high' : 'normal');

                          return (
                            <tr key={v.resultValueId} className={isAbnormal ? 'bg-rose-50/40' : ''}>
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900">{v.parameter?.parameterName || v.parameter?.parameterCode || 'Chỉ số'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{v.parameter?.parameterCode}</div>
                              </td>
                              <td className="p-2.5 font-mono font-bold text-slate-900">
                                <span className={isAbnormal ? 'text-rose-700 font-extrabold' : 'text-blue-900'}>
                                  {v.valueNumeric !== null && v.valueNumeric !== undefined ? v.valueNumeric : v.valueText || '-'}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-500 font-mono text-[11px]">{v.parameter?.unit || '-'}</td>
                              <td className="p-2.5 text-slate-600 text-[11px] font-mono">
                                {min !== undefined && max !== undefined ? (
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                                    {min} – {max}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Bình thường</span>
                                )}
                              </td>
                              <td className="p-2.5">
                                {isAbnormal ? (
                                  riskLevel === 'critical' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                                      <span>Báo động đỏ (Critical)</span>
                                    </span>
                                  ) : riskLevel === 'high' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                                      <span>{numVal !== undefined && max !== undefined && numVal > max ? 'Vượt ngưỡng cao' : 'Vượt ngưỡng'}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      <AlertCircle className="w-3 h-3 text-amber-600" />
                                      <span>{numVal !== undefined && min !== undefined && numVal < min ? 'Dưới ngưỡng chuẩn' : 'Cảnh báo lệch ngưỡng'}</span>
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

    </div>
  );
};
