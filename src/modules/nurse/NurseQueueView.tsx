import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Activity,
  Play,
  Clock,
  UserCheck,
  RefreshCw,
  Loader2,
  FileText,
  Filter,
} from 'lucide-react';
import {
  encounterService,
  type EncounterItem,
  type NursePatientRow,
  type ParsedVitals,
} from '../../services/encounter/encounter.service';
import {
  triageQueueService,
  type TriageQueueEntryItem,
} from '../../services/triage/triage-queue.service';
import { useAuth } from '../../context/AuthContext';
import { NurseStatsHeader } from './components/NurseStatsHeader';
import { NurseQueueTable } from './components/NurseQueueTable';
import { NurseVitalModal } from './components/NurseVitalModal';
import { NurseVitalHistoryModal } from './components/NurseVitalHistoryModal';
import { EncounterDetailModal } from './components/EncounterDetailModal';
import { NurseAllergyModal } from './components/NurseAllergyModal';
import { ChangeEncounterDepartmentModal } from './components/ChangeEncounterDepartmentModal';

export const NurseQueueView: React.FC = () => {
  const { user } = useAuth();

  const [triageEntries, setTriageEntries] = useState<TriageQueueEntryItem[]>([]);
  const [encounters, setEncounters] = useState<EncounterItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTakingNext, setIsTakingNext] = useState<boolean>(false);
  const [filterTab, setFilterTab] = useState<'my_waiting' | 'all_waiting' | 'done' | 'all'>('my_waiting');

  // State các Modal
  const [selectedRow, setSelectedRow] = useState<NursePatientRow | null>(null);
  const [isInputModalOpen, setIsInputModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState<boolean>(false);
  const [isChangeDeptModalOpen, setIsChangeDeptModalOpen] = useState<boolean>(false);
  const [selectedDetailEncounterId, setSelectedDetailEncounterId] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Tải dữ liệu Hàng đợi Triage & Ca khám
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [triageRes, encRes] = await Promise.all([
        triageQueueService.getTriageQueue().catch((err) => {
          console.warn('Lỗi lấy triage queue:', err);
          return [] as TriageQueueEntryItem[];
        }),
        encounterService.getEncounters().catch((err) => {
          console.warn('Lỗi lấy encounters:', err);
          return [] as EncounterItem[];
        }),
      ]);

      setTriageEntries(Array.isArray(triageRes) ? triageRes : []);
      setEncounters(Array.isArray(encRes) ? encRes : []);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu hàng đợi điều dưỡng:', err);
      showToast(err.message || 'Không thể tải dữ liệu hàng đợi từ hệ thống', 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Tự động làm mới mỗi 15 giây để cập nhật ca mới từ Lễ tân
    const interval = setInterval(() => {
      fetchData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Parse tuổi từ ngày sinh
  const calculateAge = (dob?: string): number | string => {
    if (!dob) return '---';
    try {
      const birthYear = new Date(dob).getFullYear();
      const currentYear = new Date().getFullYear();
      const diff = currentYear - birthYear;
      return diff > 0 && diff < 130 ? diff : '---';
    } catch {
      return '---';
    }
  };

  // Parse chỉ số từ phiên đo gần nhất của Encounter
  const parseSessionVitals = (encounter: EncounterItem): { vitals?: ParsedVitals; vitalSessionId?: string } => {
    const sessions = encounter.vitalSignSessions;
    if (!sessions || sessions.length === 0) return {};

    const latest = sessions[0];
    const observations = latest.observations || [];

    const getVal = (...codes: string[]): number | undefined => {
      const obs = observations.find((o) => o.item && codes.includes(o.item.itemCode));
      return obs ? Number(obs.observationValue) : undefined;
    };

    const pulse = getVal('HR', 'PULSE');
    const bpSystolic = getVal('SBP', 'BP_SYSTOLIC');
    const bpDiastolic = getVal('DBP', 'BP_DIASTOLIC');
    const temp = getVal('TEMP');
    const respiratoryRate = getVal('RR', 'RESP_RATE');
    const spo2 = getVal('SPO2');
    const height = getVal('HEIGHT');
    const weight = getVal('WEIGHT');

    const hM = height && height > 0 ? height / 100 : 0;
    const bmi = hM > 0 && weight && weight > 0 ? parseFloat((weight / (hM * hM)).toFixed(1)) : undefined;

    const isAbnormal =
      (bpSystolic !== undefined && (bpSystolic >= 140 || bpSystolic <= 90)) ||
      (temp !== undefined && (temp >= 38.0 || temp <= 35.5)) ||
      (spo2 !== undefined && spo2 < 95) ||
      (pulse !== undefined && (pulse >= 100 || pulse <= 50)) ||
      observations.some((o) => o.isAbnormal);

    return {
      vitalSessionId: latest.vitalSessionId,
      vitals: {
        pulse,
        bpSystolic,
        bpDiastolic,
        temp,
        respiratoryRate,
        spo2,
        height,
        weight,
        bmi,
        isAbnormal,
      },
    };
  };

  // Trọng số ưu tiên (Cấp cứu > Khẩn cấp > Thường)
  const getPriorityWeight = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'emergency':
        return 3;
      case 'urgent':
        return 2;
      default:
        return 1;
    }
  };

  // Chuẩn hóa và sắp xếp dữ liệu:
  // 1. Ca chưa đo (Pending) xếp trước ca đã đo (Measured)
  // 2. Ca ưu tiên cao hơn (Emergency > Urgent > Normal) xếp trước
  // 3. Cùng mức ưu tiên thì ai đến trước xếp trước (queueOrder / arrivedAt)
  const tableData: NursePatientRow[] = useMemo(() => {
    const encMap = new Map<string, EncounterItem>();
    encounters.forEach((e) => encMap.set(e.encounterId, e));

    const rowsFromTriage: NursePatientRow[] = triageEntries.map((entry) => {
      const enc = encMap.get(entry.encounterId) || (entry.encounter as any) || {};
      const { vitals, vitalSessionId } = parseSessionVitals(enc);
      const isMeasured = entry.status === 'done' || !!vitals;

      const p = enc.patient || entry.encounter?.patient;
      const dept = enc.department || entry.encounter?.department;

      return {
        encounterId: entry.encounterId,
        encounterCode: enc.encounterCode || entry.encounter?.encounterCode || entry.encounterId.slice(0, 8),
        patientId: enc.patientId || entry.encounter?.patientId || '',
        name: p?.fullName || 'Bệnh nhân',
        age: calculateAge(p?.dateOfBirth),
        gender:
          p?.gender === 'male'
            ? 'Nam'
            : p?.gender === 'female'
            ? 'Nữ'
            : p?.gender || '---',
        phone: p?.phoneNumber || 'Chưa cập nhật',
        departmentName: dept?.departmentName || 'Khoa khám bệnh',
        doctorName: enc.doctor?.fullName
          ? `${enc.doctor.title ? `${enc.doctor.title} ` : ''}${enc.doctor.fullName}`
          : 'Bác sĩ trực',
        arrivedAt: enc.arrivedAt || entry.createdAt,
        status: isMeasured ? 'Measured' : 'Pending',
        vitalSessionId,
        vitals,
        chiefComplaint: enc.chiefComplaint || entry.encounter?.chiefComplaint,
        queueEntryId: entry.queueEntryId,
        priority: entry.priority,
        queueOrder: entry.queueOrder,
        triageStatus: entry.status,
        assignedNurseUserId: entry.assignedNurseUserId,
      };
    });

    // Chỉ hiển thị các bệnh nhân ĐÃ ĐƯỢC LỄ TÂN HOÀN TẤT ĐĂNG KÝ (có TriageQueueEntry & STT chính thức)
    const all = rowsFromTriage;

    return all.sort((a, b) => {
      // 1. Chưa đo xếp trước đã đo
      if (a.status !== b.status) {
        return a.status === 'Pending' ? -1 : 1;
      }

      // 2. Mức độ ưu tiên cao xếp trước (Cấp cứu > Khẩn cấp > Thường)
      const prioDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      if (prioDiff !== 0) return prioDiff;

      // 3. Thứ tự xếp hàng queueOrder tăng dần
      if (a.queueOrder !== undefined && b.queueOrder !== undefined) {
        return a.queueOrder - b.queueOrder;
      }
      if (a.queueOrder !== undefined) return -1;
      if (b.queueOrder !== undefined) return 1;

      // 4. Ai đến trước xếp trước (arrivedAt)
      const timeA = new Date(a.arrivedAt || 0).getTime();
      const timeB = new Date(b.arrivedAt || 0).getTime();
      return timeA - timeB;
    });
  }, [triageEntries, encounters]);

  // Bộ lọc dữ liệu hiển thị theo Tab
  const filteredData = useMemo(() => {
    const currentUserId = user?.id;
    switch (filterTab) {
      case 'my_waiting':
        return tableData.filter(
          (r) =>
            r.assignedNurseUserId === currentUserId &&
            (r.triageStatus === 'waiting' || r.triageStatus === 'called' || r.triageStatus === 'in_progress')
        );
      case 'all_waiting':
        return tableData.filter(
          (r) =>
            r.triageStatus === 'waiting' ||
            r.triageStatus === 'called' ||
            r.triageStatus === 'in_progress' ||
            r.status === 'Pending'
        );
      case 'done':
        return tableData.filter((r) => r.triageStatus === 'done' || r.status === 'Measured');
      default:
        return tableData;
    }
  }, [tableData, filterTab, user?.id]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = tableData.length;
    const myWaiting = tableData.filter(
      (r) =>
        r.assignedNurseUserId === user?.id &&
        (r.triageStatus === 'waiting' || r.triageStatus === 'called' || r.triageStatus === 'in_progress')
    ).length;
    const pending = tableData.filter((r) => r.status === 'Pending' || r.triageStatus === 'waiting').length;
    const measured = tableData.filter((r) => r.status === 'Measured' || r.triageStatus === 'done').length;
    const abnormal = tableData.filter((r) => r.vitals?.isAbnormal).length;
    return { total, myWaiting, pending, measured, abnormal };
  }, [tableData, user?.id]);

  // HÀNH ĐỘNG: "LẤY HỒ SƠ TIẾP THEO" (Chỉ bấm là lấy đúng ca tiếp theo theo thứ tự và mở form đo ngay)
  const handleTakeNextPatient = async () => {
    setIsTakingNext(true);
    try {
      // 1. Lấy ca tiếp theo theo thứ tự ưu tiên được phân bổ cho điều dưỡng này
      const calledEntry = await triageQueueService.dequeue();
      const enc = calledEntry.encounter;
      const p = enc?.patient;
      const dept = enc?.department;

      // 2. Kích hoạt trạng thái in_progress để đo
      try {
        await triageQueueService.startProcessing(calledEntry.queueEntryId);
      } catch (startErr) {
        console.warn('Could not mark started, keeping called status:', startErr);
      }

      // 3. Mở form nhập sinh hiệu cho bệnh nhân này ngay lập tức
      const { vitals, vitalSessionId } = parseSessionVitals((enc as any) || {});

      const targetRow: NursePatientRow = {
        encounterId: calledEntry.encounterId,
        encounterCode: enc?.encounterCode || calledEntry.encounterId.slice(0, 8),
        patientId: enc?.patientId || p?.patientId || '',
        name: p?.fullName || 'Bệnh nhân',
        age: calculateAge(p?.dateOfBirth),
        gender: p?.gender === 'male' ? 'Nam' : p?.gender === 'female' ? 'Nữ' : p?.gender || '---',
        phone: p?.phoneNumber || 'Chưa cập nhật',
        departmentName: dept?.departmentName || 'Khoa khám bệnh',
        doctorName: 'Bác sĩ trực',
        arrivedAt: calledEntry.createdAt,
        status: 'Pending',
        queueEntryId: calledEntry.queueEntryId,
        priority: calledEntry.priority,
        queueOrder: calledEntry.queueOrder,
        triageStatus: 'in_progress',
        vitals,
        vitalSessionId,
        chiefComplaint: enc?.chiefComplaint,
      };

      setSelectedRow(targetRow);
      setIsInputModalOpen(true);
      showToast(`Đã tiếp nhận hồ sơ STT #${calledEntry.queueOrder} - ${p?.fullName || 'Bệnh nhân'}`, 'success');
      await fetchData(true);
    } catch (err: any) {
      console.warn('Lỗi lấy hồ sơ tiếp theo:', err);
      showToast(err.message || 'Hàng đợi của bạn hiện không có bệnh nhân nào đang chờ.', 'error');
    } finally {
      setIsTakingNext(false);
    }
  };

  // Mở modal đo sinh hiệu từ nút trên dòng bảng
  const handleOpenMeasure = async (row: NursePatientRow) => {
    // Nếu ca đang ở trạng thái waiting hoặc called, chuyển sang in_progress để bắt đầu đo
    if (row.queueEntryId && (row.triageStatus === 'waiting' || row.triageStatus === 'called')) {
      try {
        await triageQueueService.startProcessing(row.queueEntryId);
        row.triageStatus = 'in_progress';
      } catch (e) {
        console.warn('Lỗi start processing:', e);
      }
    }
    setSelectedRow(row);
    setIsInputModalOpen(true);
  };

  // Xử lý mở Modal Chi tiết ca khám (Encounter Detail)
  const handleOpenDetail = (row: NursePatientRow) => {
    setSelectedDetailEncounterId(row.encounterId);
  };

  // Xử lý mở Modal Lịch sử đo
  const handleOpenHistory = (row: NursePatientRow) => {
    setSelectedRow(row);
    setIsHistoryModalOpen(true);
  };

  // Xử lý mở Modal Dị ứng
  const handleOpenAllergy = (row: NursePatientRow) => {
    setSelectedRow(row);
    setIsAllergyModalOpen(true);
  };

  // Xử lý mở Modal Đổi khoa khám
  const handleOpenChangeDept = (row: NursePatientRow) => {
    setSelectedRow(row);
    setIsChangeDeptModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium transition-all duration-300 animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-rose-600 text-white shadow-rose-500/20'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Thẻ thống kê */}
      <NurseStatsHeader
        totalCount={stats.total}
        pendingCount={stats.pending}
        measuredCount={stats.measured}
        abnormalCount={stats.abnormal}
        isLoading={isLoading}
        onRefresh={() => fetchData()}
      />

      {/* THANH THAO TÁC TIẾP NHẬN HỒ SƠ & BỘ LỌC DANH SÁCH */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4 flex-wrap">
        {/* Nút chính: Lấy hồ sơ tiếp theo theo thứ tự */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTakeNextPatient}
            disabled={isTakingNext}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Tự động bốc hồ sơ bệnh nhân tiếp theo theo đúng thứ tự ưu tiên"
          >
            {isTakingNext ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lấy hồ sơ...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>TIẾP NHẬN CA TIẾP THEO</span>
              </>
            )}
          </button>

          <span className="text-xs text-slate-500 hidden md:inline">
            Tự động lấy hồ sơ theo thứ tự ưu tiên (Cấp cứu &rarr; Khẩn cấp &rarr; Đến trước đo trước)
          </span>
        </div>

        {/* Tab lọc danh sách & Nút làm mới */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterTab('my_waiting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'my_waiting'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hàng đợi của tôi ({stats.myWaiting})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('all_waiting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'all_waiting'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả đang chờ ({stats.pending})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('done')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'done'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã đo xong ({stats.measured})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({stats.total})
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchData()}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu danh sách ca khám sắp xếp theo đúng thứ tự */}
      <NurseQueueTable
        data={filteredData}
        isLoading={isLoading}
        onOpenMeasure={handleOpenMeasure}
        onOpenHistory={handleOpenHistory}
        onOpenDetail={handleOpenDetail}
        onOpenAllergy={handleOpenAllergy}
        onOpenChangeDept={handleOpenChangeDept}
      />

      {/* Modal Chi tiết ca khám (Encounter Detail) */}
      <EncounterDetailModal
        isOpen={!!selectedDetailEncounterId}
        encounterId={selectedDetailEncounterId}
        onClose={() => setSelectedDetailEncounterId(null)}
        onOpenMeasure={(encId) => {
          const row = tableData.find((r) => r.encounterId === encId);
          if (row) {
            handleOpenMeasure(row);
          }
        }}
      />

      {/* Modal Khai báo & Quản lý dị ứng */}
      <NurseAllergyModal
        isOpen={isAllergyModalOpen}
        onClose={() => {
          setIsAllergyModalOpen(false);
          setSelectedRow(null);
        }}
        patientRow={selectedRow}
        onSuccess={(msg) => showToast(msg, 'success')}
        onError={(err) => showToast(err, 'error')}
      />

      {/* Modal Đo / Cập nhật sinh hiệu */}
      <NurseVitalModal
        isOpen={isInputModalOpen}
        onClose={() => {
          setIsInputModalOpen(false);
          setSelectedRow(null);
        }}
        patientRow={selectedRow}
        currentUserId={user?.id}
        onSuccess={(msg) => {
          showToast(msg, 'success');
          fetchData(true);
        }}
        onError={(err) => showToast(err, 'error')}
      />

      {/* Modal Lịch sử các lần đo & quét cảnh báo AI */}
      <NurseVitalHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedRow(null);
        }}
        patientRow={selectedRow}
      />

      {/* Modal Đổi khoa khám & Tự động xếp bác sĩ (PATCH /api/v1/encounters/:id/department) */}
      <ChangeEncounterDepartmentModal
        isOpen={isChangeDeptModalOpen}
        onClose={() => {
          setIsChangeDeptModalOpen(false);
          setSelectedRow(null);
        }}
        encounterId={selectedRow?.encounterId || null}
        patientName={selectedRow?.name}
        currentDepartmentName={selectedRow?.departmentName}
        onSuccess={(msg) => {
          showToast(msg, 'success');
          fetchData(true);
        }}
      />
    </div>
  );
};

export default NurseQueueView;
