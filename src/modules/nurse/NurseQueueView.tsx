import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import {
  encounterService,
  type EncounterItem,
  type NursePatientRow,
  type ParsedVitals,
} from '../../services/encounter/encounter.service';
import { useAuth } from '../../context/AuthContext';
import { NurseStatsHeader } from './components/NurseStatsHeader';
import { NurseQueueTable } from './components/NurseQueueTable';
import { NurseVitalModal } from './components/NurseVitalModal';
import { NurseVitalHistoryModal } from './components/NurseVitalHistoryModal';
import { EncounterDetailModal } from './components/EncounterDetailModal';

export const NurseQueueView: React.FC = () => {
  const { user } = useAuth();

  const [encounters, setEncounters] = useState<EncounterItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRow, setSelectedRow] = useState<NursePatientRow | null>(null);
  const [isInputModalOpen, setIsInputModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [selectedDetailEncounterId, setSelectedDetailEncounterId] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Tải danh sách ca khám từ API
  const fetchEncounters = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await encounterService.getEncounters();
      setEncounters(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách ca khám điều dưỡng:', err);
      showToast(err.message || 'Không thể tải danh sách ca khám từ hệ thống', 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEncounters();
    // Tự động làm mới mỗi 20 giây để cập nhật ca mới từ quầy lễ tân
    const interval = setInterval(() => {
      fetchEncounters(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchEncounters]);

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

  // Chuẩn hóa dữ liệu sang cấu trúc hàng hiển thị
  const tableData: NursePatientRow[] = useMemo(() => {
    return encounters.map((enc) => {
      const { vitals, vitalSessionId } = parseSessionVitals(enc);
      const isMeasured = !!vitals || enc.status === 'registered' || enc.status === 'waiting_for_doctor';

      return {
        encounterId: enc.encounterId,
        encounterCode: enc.encounterCode || enc.encounterId.slice(0, 8),
        patientId: enc.patientId,
        name: enc.patient?.fullName || 'Bệnh nhân',
        age: calculateAge(enc.patient?.dateOfBirth),
        gender:
          enc.patient?.gender === 'male'
            ? 'Nam'
            : enc.patient?.gender === 'female'
            ? 'Nữ'
            : enc.patient?.gender || '---',
        phone: enc.patient?.phoneNumber || 'Chưa cập nhật',
        departmentName: enc.department?.departmentName || 'Khoa khám bệnh',
        doctorName: enc.doctor?.fullName
          ? `${enc.doctor.title ? `${enc.doctor.title} ` : ''}${enc.doctor.fullName}`
          : 'Bác sĩ trực',
        arrivedAt: enc.arrivedAt,
        status: isMeasured ? 'Measured' : 'Pending',
        vitalSessionId,
        vitals,
        chiefComplaint: enc.chiefComplaint,
      };
    });
  }, [encounters]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = tableData.length;
    const pending = tableData.filter((r) => r.status === 'Pending').length;
    const measured = tableData.filter((r) => r.status === 'Measured').length;
    const abnormal = tableData.filter((r) => r.vitals?.isAbnormal).length;
    return { total, pending, measured, abnormal };
  }, [tableData]);

  // Xử lý mở Modal Chi tiết ca khám (Encounter Detail)
  const handleOpenDetail = (row: NursePatientRow) => {
    setSelectedDetailEncounterId(row.encounterId);
  };

  // Xử lý mở Modal Đo / Cập nhật sinh hiệu
  const handleOpenMeasure = (row: NursePatientRow) => {
    setSelectedRow(row);
    setIsInputModalOpen(true);
  };

  // Xử lý mở Modal Lịch sử đo
  const handleOpenHistory = (row: NursePatientRow) => {
    setSelectedRow(row);
    setIsHistoryModalOpen(true);
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
        onRefresh={() => fetchEncounters()}
      />

      {/* Bảng dữ liệu danh sách ca khám */}
      <NurseQueueTable
        data={tableData}
        isLoading={isLoading}
        onOpenMeasure={handleOpenMeasure}
        onOpenHistory={handleOpenHistory}
        onOpenDetail={handleOpenDetail}
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
          fetchEncounters(true);
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
    </div>
  );
};
export default NurseQueueView;
