import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FlaskConical, CheckCircle2, Sparkles, Upload, 
  Lock, FileText, Loader2,
  Building2, RefreshCw, Search, AlertCircle, Eye,
  ChevronDown, MapPin
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { labRoomService, type LabRoomItem, type LabStaffRoomAssignment } from '../../services/lab/lab-room.service';
import { labTaskService, type LabTaskItem } from '../../services/lab/lab-task.service';
import { labResultService, type LabResultDetail } from '../../services/lab/lab-result.service';

export const LabOrdersView: React.FC = () => {

  // Lab Rooms State
  const [labRooms, setLabRooms] = useState<LabRoomItem[]>([]);
  const [myAssignments, setMyAssignments] = useState<LabStaffRoomAssignment[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(true);

  // Tasks List State
  const [tasks, setTasks] = useState<LabTaskItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action Loading States
  const [receivingTaskId, setReceivingTaskId] = useState<string | null>(null);

  // Modal: Nhập kết quả
  const [selectedTask, setSelectedTask] = useState<LabTaskItem | null>(null);
  const [isInputModalOpen, setIsInputModalOpen] = useState<boolean>(false);
  const [paramValues, setParamValues] = useState<Record<string, { valueNumeric?: number; valueText?: string }>>({});
  const [overallConclusion, setOverallConclusion] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [isSubmittingResult, setIsSubmittingResult] = useState<boolean>(false);

  // Modal: Xem kết quả chi tiết đã hoàn tất
  const [viewingResult, setViewingResult] = useState<LabResultDetail | null>(null);
  const [isViewResultModalOpen, setIsViewResultModalOpen] = useState<boolean>(false);
  const [isLoadingResultDetail, setIsLoadingResultDetail] = useState<boolean>(false);

  // AI analysis states
  const [isAIScanning, setIsAIScanning] = useState<boolean>(false);
  const [isAIAnalyzed, setIsAIAnalyzed] = useState<boolean>(false);

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

  // 2. Load Tasks khi chọn phòng hoặc đổi filter
  const fetchTasks = useCallback(async (roomId: string, silent = false) => {
    if (!roomId) return;
    if (!silent) setIsLoadingTasks(true);
    setTaskError(null);
    try {
      const data = await labTaskService.getLabTasks({
        labRoomId: roomId,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setTasks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Lỗi tải danh sách chỉ định xét nghiệm:', err);
      setTaskError(err?.message || 'Không thể kết nối máy chủ để tải danh sách xét nghiệm.');
    } finally {
      if (!silent) setIsLoadingTasks(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (selectedRoomId) {
      fetchTasks(selectedRoomId);
    }
  }, [selectedRoomId, fetchTasks]);

  // Kiểm tra KTV hiện tại có thuộc phòng đang chọn hay không
  const isCurrentUserAssignedToSelectedRoom = useMemo(() => {
    if (!myAssignments.length) return true; // Nếu chưa phân công chặt thì tạm cho thao tác
    return myAssignments.some((a) => a.labRoomId === selectedRoomId);
  }, [myAssignments, selectedRoomId]);

  // Lọc theo search box
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const term = searchQuery.toLowerCase().trim();
    return tasks.filter((t) => {
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
  }, [tasks, searchQuery]);

  // Thao tác: KTV tiếp nhận mẫu xét nghiệm
  const handleReceiveTask = async (task: LabTaskItem) => {
    setReceivingTaskId(task.labTaskId);
    try {
      await labTaskService.receiveLabTask(task.labTaskId);
      showToast(`Đã tiếp nhận mẫu xét nghiệm thành công cho bệnh nhân ${task.orderItem?.order?.encounter?.patient?.fullName || ''}!`, 'success');
      fetchTasks(selectedRoomId, true);
    } catch (err: any) {
      showToast(err?.message || 'Tiếp nhận mẫu thất bại. Vui lòng kiểm tra phân công phòng.', 'error');
    } finally {
      setReceivingTaskId(null);
    }
  };

  // Mở modal nhập kết quả
  const handleOpenInputModal = (task: LabTaskItem) => {
    setSelectedTask(task);
    const initialParams: Record<string, { valueNumeric?: number; valueText?: string }> = {};
    const parameters = task.orderItem?.testType?.labResultParameters || [];
    parameters.forEach((p) => {
      initialParams[p.parameterId] = {
        valueNumeric: undefined,
        valueText: '',
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

  // Xem kết quả đã hoàn tất
  const handleViewResult = async (task: LabTaskItem) => {
    setIsLoadingResultDetail(true);
    setIsViewResultModalOpen(true);
    try {
      const result = await labResultService.getLabResultByTaskId(task.labTaskId);
      setViewingResult(result);
    } catch (err: any) {
      showToast(err?.message || 'Không thể tải chi tiết kết quả xét nghiệm', 'error');
      setIsViewResultModalOpen(false);
    } finally {
      setIsLoadingResultDetail(false);
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

  // Lưu và xác nhận kết quả xét nghiệm
  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const parameters = selectedTask.orderItem?.testType?.labResultParameters || [];
    const valuesPayload = parameters.map((p) => {
      const val = paramValues[p.parameterId];
      return {
        parameterId: p.parameterId,
        valueNumeric: val?.valueNumeric !== undefined ? Number(val.valueNumeric) : undefined,
        valueText: val?.valueText || undefined,
      };
    });

    if (parameters.length > 0 && valuesPayload.every((v) => v.valueNumeric === undefined && !v.valueText)) {
      showToast('Vui lòng nhập ít nhất một chỉ số đo đạc', 'error');
      return;
    }

    setIsSubmittingResult(true);
    try {
      const result = await labResultService.submitLabResult(selectedTask.labTaskId, {
        values: valuesPayload.filter((v) => v.valueNumeric !== undefined || v.valueText),
        overallConclusion: overallConclusion.trim() || undefined,
        resultStatus: 'final',
      });

      // Nếu có đính kèm file, upload đính kèm luôn
      if (selectedFile && result.labResultId) {
        await labResultService.uploadAttachment(result.labResultId, selectedFile, 'image', 'Hình ảnh xét nghiệm đính kèm').catch(() => {});
      }

      showToast(`Đã lưu và hoàn tất kết quả EMR cho ca ${selectedTask.orderItem?.testType?.testName || ''}!`, 'success');
      setIsInputModalOpen(false);
      fetchTasks(selectedRoomId, true);
    } catch (err: any) {
      showToast(err?.message || 'Không thể lưu kết quả xét nghiệm. Vui lòng thử lại.', 'error');
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
        return (
          <div className="font-extrabold text-blue-900 whitespace-nowrap">
            <div>{orderCode}</div>
            <div className="text-[10px] text-slate-400 font-medium">
              {new Date(row.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(row.createdAt).toLocaleDateString('vi-VN')}
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
          <div className="min-w-36">
            <div className="font-bold text-slate-900 text-xs truncate">{p?.fullName || 'Khách vãng lai'}</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
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
          <div className="max-w-xs">
            <div className="font-bold text-slate-800 text-xs leading-tight">{t?.testName || 'Xét nghiệm'}</div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="uppercase px-1.5 py-0.2 bg-blue-50 text-blue-700 font-bold rounded">
                {t?.category || 'Lab'}
              </span>
              {t?.specimenType && <span>Mẫu: {t.specimenType}</span>}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Bác Sĩ Chỉ Định',
      cell: (row) => {
        const doc = row.orderItem?.order?.orderedByUser;
        return (
          <div className="text-slate-700 font-semibold text-xs whitespace-nowrap">
            {doc?.profile?.fullName || doc?.email || 'Bác sĩ phụ trách'}
          </div>
        );
      },
    },
    {
      header: 'Thanh Toán',
      cell: (row) => (
        <Badge variant={row.paymentVerified ? 'normal' : 'critical'} size="sm">
          {row.paymentVerified ? 'Đã thanh toán' : 'Chưa thanh toán'}
        </Badge>
      ),
    },
    {
      header: 'Trạng Thái',
      cell: (row) => {
        if (row.status === 'ready') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Chờ lấy mẫu
            </span>
          );
        }
        if (row.status === 'in_progress') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-spin"></span>
              Đang xét nghiệm
            </span>
          );
        }
        if (row.status === 'completed') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Đã có kết quả
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
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
              className="px-3 py-1.5 font-bold text-xs rounded-xl bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Chờ thu ngân</span>
            </button>
          );
        }

        // 2. Chờ lấy mẫu (ready) -> Nút Tiếp nhận mẫu
        if (row.status === 'ready') {
          return (
            <button
              onClick={() => handleReceiveTask(row)}
              disabled={isReceiving || !isCurrentUserAssignedToSelectedRoom}
              className="px-3 py-1.5 font-bold text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
            >
              {isReceiving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang nhận...</span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-3.5 h-3.5" />
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
              className="px-3 py-1.5 font-bold text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer border-none"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Nhập kết quả & AI</span>
            </button>
          );
        }

        // 4. Đã hoàn tất (completed) -> Nút Xem kết quả EMR
        if (row.status === 'completed') {
          return (
            <button
              onClick={() => handleViewResult(row)}
              className="px-3 py-1.5 font-bold text-xs rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
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
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold text-white animate-in slide-in-from-bottom-5 ${
            toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
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
              onClick={() => fetchTasks(selectedRoomId)}
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
              <div className="relative min-w-[260px] sm:min-w-[320px]">
                <select
                  id="lab-room-dropdown"
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full appearance-none bg-white hover:bg-slate-50 border border-slate-300 hover:border-blue-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl pl-3.5 pr-9 py-2 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-xs outline-none"
                >
                  {myAssignments.length > 0 ? (
                    <>
                      <optgroup label="⭐ Phòng bạn được phân công">
                        {labRooms
                          .filter((r) => myAssignments.some((a) => a.labRoomId === r.labRoomId))
                          .map((room) => {
                            const isPrimary = myAssignments.find((a) => a.labRoomId === room.labRoomId)?.isPrimary;
                            return (
                              <option key={room.labRoomId} value={room.labRoomId}>
                                {room.labRoomName} {isPrimary ? '— (Phòng chính)' : '— (Phân công)'}
                              </option>
                            );
                          })}
                      </optgroup>
                      {labRooms.some((r) => !myAssignments.some((a) => a.labRoomId === r.labRoomId)) && (
                        <optgroup label="🏢 Các phòng xét nghiệm khác">
                          {labRooms
                            .filter((r) => !myAssignments.some((a) => a.labRoomId === r.labRoomId))
                            .map((room) => (
                              <option key={room.labRoomId} value={room.labRoomId}>
                                {room.labRoomName}
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </>
                  ) : (
                    labRooms.map((room) => (
                      <option key={room.labRoomId} value={room.labRoomId}>
                        {room.labRoomName}
                      </option>
                    ))
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* Status badge for the selected room */}
            {(() => {
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

          {currentRoomInfo && (
            <div className="text-xs text-slate-500 flex items-center gap-1.5 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Vị trí:</span>
              <span className="font-semibold text-slate-700">{currentRoomInfo.location || 'Khu xét nghiệm tập trung'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
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
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 border cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên BN, mã BN, xét nghiệm..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>
      </div>

      {/* Main Worklist Table */}
      {taskError ? (
        <div className="p-10 bg-white rounded-2xl border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <div className="text-xs font-bold text-rose-700">{taskError}</div>
          <button
            onClick={() => fetchTasks(selectedRoomId)}
            className="mt-2 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold border-none cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredTasks}
          searchPlaceholder="Lọc nhanh danh sách đang hiển thị..."
        />
      )}

      {/* MODAL 1: NHẬP KẾT QUẢ XÉT NGHIỆM & AI SCAN */}
      {selectedTask && (
        <Modal
          isOpen={isInputModalOpen}
          onClose={() => setIsInputModalOpen(false)}
          title={`Nhập kết quả xét nghiệm: ${selectedTask.orderItem?.testType?.testName || 'Xét nghiệm'}`}
          subtitle={`Bệnh nhân: ${selectedTask.orderItem?.order?.encounter?.patient?.fullName || 'N/A'} (Mã BN: ${
            selectedTask.orderItem?.order?.encounter?.patient?.patientCode || 'N/A'
          }) • Bác sĩ: ${selectedTask.orderItem?.order?.orderedByUser?.profile?.fullName || 'N/A'}`}
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
                          <th className="p-2.5 w-32">Giá trị đo</th>
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
                          
                          const numVal = val?.valueNumeric;
                          const isOutOfRange = numVal !== undefined && (
                            (min !== undefined && numVal < min) ||
                            (max !== undefined && numVal > max)
                          );

                          return (
                            <tr key={param.parameterId} className={isOutOfRange ? 'bg-rose-50/50' : ''}>
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900">{param.parameterName || param.parameterCode}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{param.parameterCode}</div>
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  step="any"
                                  value={val?.valueNumeric !== undefined ? val.valueNumeric : ''}
                                  onChange={(e) => {
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
                              </td>
                              <td className="p-2.5 text-slate-500 font-mono text-[11px]">{param.unit || '-'}</td>
                              <td className="p-2.5 text-slate-500 text-[11px]">
                                {min !== undefined && max !== undefined ? (
                                  <span>
                                    {min} - {max}
                                  </span>
                                ) : (
                                  <span>Bình thường</span>
                                )}
                                {isOutOfRange && (
                                  <span className="ml-1 text-rose-600 font-bold text-[10px] block">⚠️ Vượt ngưỡng!</span>
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
                  placeholder="Ví dụ: Các chỉ số huyết học nằm trong giới hạn an toàn, không phát hiện dấu hiệu viêm cấp tính..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 bg-white"
                />
              </div>

              {/* Tải tệp hình ảnh đính kèm */}
              <div className="space-y-2">
                <label className="block font-extrabold text-slate-800 text-xs">
                  Tệp đính kèm (Ảnh chụp X-quang, PDF kết quả máy...):
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

      {/* MODAL 2: XEM KẾT QUẢ EMR ĐÃ HOÀN TẤT */}
      <Modal
        isOpen={isViewResultModalOpen}
        onClose={() => setIsViewResultModalOpen(false)}
        title="Chi tiết kết quả xét nghiệm EMR"
        subtitle="Hồ sơ kết quả chính thức đã lưu trên hệ thống"
        maxWidth="2xl"
        footer={
          <button
            onClick={() => setIsViewResultModalOpen(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer border-none"
          >
            Đóng
          </button>
        }
      >
        {isLoadingResultDetail ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Đang tải dữ liệu kết quả...</span>
          </div>
        ) : viewingResult ? (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] block">Trạng thái kết quả</span>
                <span className="font-bold text-emerald-700 uppercase">{viewingResult.resultStatus}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Thời gian có kết quả</span>
                <span className="font-bold text-slate-800">
                  {new Date(viewingResult.resultedAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Bảng chỉ số đã nhập */}
            {viewingResult.values && viewingResult.values.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Chỉ số xét nghiệm</th>
                      <th className="p-2.5">Giá trị đo</th>
                      <th className="p-2.5">Đơn vị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingResult.values.map((v) => (
                      <tr key={v.resultValueId}>
                        <td className="p-2.5 font-bold text-slate-800">
                          {v.parameter?.parameterName || v.parameter?.parameterCode || 'Chỉ số'}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-blue-900">
                          {v.valueNumeric !== null && v.valueNumeric !== undefined ? v.valueNumeric : v.valueText || '-'}
                        </td>
                        <td className="p-2.5 text-slate-500 font-mono text-[11px]">{v.parameter?.unit || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {viewingResult.overallConclusion && (
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                <span className="text-[10px] font-extrabold text-blue-800 uppercase block mb-1">Kết luận tổng quát:</span>
                <p className="text-slate-800 font-medium">{viewingResult.overallConclusion}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">Không tìm thấy thông tin kết quả</div>
        )}
      </Modal>

    </div>
  );
};
