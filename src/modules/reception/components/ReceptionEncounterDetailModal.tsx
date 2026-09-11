import React, { useState, useEffect } from 'react';
import {
  User,
  Activity,
  FileText,
  Stethoscope,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Building2,
  CheckCircle2,
  XCircle,
  Phone,
  CreditCard,
  Printer,
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Badge } from '../../../components/common/Badge';
import {
  encounterService,
  type EncounterItem,
  type EncounterVitalSession,
} from '../../../services/encounter/encounter.service';

interface ReceptionEncounterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  encounterId: string | null;
}

export const ReceptionEncounterDetailModal: React.FC<ReceptionEncounterDetailModalProps> = ({
  isOpen,
  onClose,
  encounterId,
}) => {
  const [encounter, setEncounter] = useState<EncounterItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && encounterId) {
      setIsLoading(true);
      setError(null);
      encounterService
        .getEncounterById(encounterId)
        .then((data) => {
          setEncounter(data);
        })
        .catch((err: any) => {
          console.error('Lỗi khi tải chi tiết ca khám (Lễ tân):', err);
          setError(err.message || 'Không thể tải chi tiết ca khám');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setEncounter(null);
    }
  }, [isOpen, encounterId]);

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const calculateAge = (dob?: string): number | string => {
    if (!dob) return '---';
    try {
      const birthYear = new Date(dob).getFullYear();
      const currentYear = new Date().getFullYear();
      return currentYear - birthYear;
    } catch {
      return '---';
    }
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'arrived':
        return <Badge variant="warning" size="sm">Vừa tiếp nhận (Arrived)</Badge>;
      case 'registered':
        return <Badge variant="info" size="sm">Đã đăng ký (Registered)</Badge>;
      case 'waiting_for_doctor':
        return <Badge variant="neutral" size="sm">Chờ khám bác sĩ</Badge>;
      case 'in_progress':
        return <Badge variant="info" size="sm">Đang khám (In Progress)</Badge>;
      case 'finished':
        return <Badge variant="success" size="sm">Đã hoàn tất (Finished)</Badge>;
      case 'cancelled':
        return <Badge variant="critical" size="sm">Đã hủy</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status || '---'}</Badge>;
    }
  };

  const latestVitalSession: EncounterVitalSession | undefined =
    encounter?.vitalSignSessions && encounter.vitalSignSessions.length > 0
      ? encounter.vitalSignSessions[0]
      : undefined;

  const getObservationValue = (...codes: string[]): string | number | undefined => {
    if (!latestVitalSession) return undefined;
    const obs = latestVitalSession.observations?.find((o) =>
      o.item?.itemCode && codes.some((c) => c.toLowerCase() === o.item?.itemCode?.toLowerCase())
    );
    return obs?.observationValue;
  };

  const hasVitals = !!latestVitalSession;
  const pulse = getObservationValue('HR', 'PULSE');
  const bpSys = getObservationValue('SBP', 'BP_SYS', 'BP_SYSTOLIC');
  const bpDia = getObservationValue('DBP', 'BP_DIA', 'BP_DIASTOLIC');
  const temp = getObservationValue('TEMP', 'TEMPERATURE');
  const spo2 = getObservationValue('SPO2');
  const resp = getObservationValue('RR', 'RESP', 'RESPIRATORY_RATE');
  const height = getObservationValue('HEIGHT');
  const weight = getObservationValue('WEIGHT');
  const bmi = getObservationValue('BMI');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-700 flex items-center justify-center text-white shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Chi Tiết Hồ Sơ Ca Khám (Lễ Tân)</h3>
            <p className="text-xs text-slate-500 font-normal">
              Mã ca: <span className="font-bold text-indigo-700">{encounter?.encounterCode || '---'}</span>
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-400">
            Tiếp nhận lúc: {formatDateTime(encounter?.arrivedAt)}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>In thông tin</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer transition"
            >
              Đóng
            </button>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          <span>Đang tải thông tin chi tiết ca khám...</span>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-600 text-xs flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
      ) : !encounter ? null : (
        <div className="space-y-5 text-xs text-slate-700">
          {/* Header Bệnh Nhân Banner */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-sm shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {encounter.patient?.fullName || 'Bệnh nhân'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    {encounter.patientType === 'new' ? 'Bệnh nhân mới' : 'Tái khám'}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5 space-x-2">
                  <span>Mã BN: <strong className="text-slate-700">{encounter.patient?.patientCode || encounter.patientId.slice(0, 8)}</strong></span>
                  <span>•</span>
                  <span>{calculateAge(encounter.patient?.dateOfBirth)} tuổi ({encounter.patient?.gender === 'male' ? 'Nam' : encounter.patient?.gender === 'female' ? 'Nữ' : '---'})</span>
                  <span>•</span>
                  <span>SĐT: <strong className="text-slate-700">{encounter.patient?.phoneNumber || 'Chưa có'}</strong></span>
                </div>
              </div>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="text-[10px] text-slate-400 block mb-1">Trạng thái ca khám</span>
              {renderStatusBadge(encounter.status)}
            </div>
          </div>

          {/* KHỐI 1: Lý do khám & Triệu chứng ban đầu (Chief Complaint) */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>Tiếp Đón Lâm Sàng (Chief Complaint):</span>
              </span>
              {typeof encounter.chiefComplaint?.painLevel === 'number' && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    encounter.chiefComplaint.painLevel >= 7
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : encounter.chiefComplaint.painLevel >= 4
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  🔥 Mức đau: {encounter.chiefComplaint.painLevel}/10
                </span>
              )}
            </div>

            {encounter.chiefComplaint ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-slate-800">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block">Lý do đến khám:</span>
                  <span className="text-sm font-bold text-slate-900">
                    {encounter.chiefComplaint.reasonForVisit || 'Khám bệnh'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 block">Ngày bắt đầu triệu chứng:</span>
                  <span className="font-semibold text-slate-800">
                    {encounter.chiefComplaint.symptomOnsetDate
                      ? encounter.chiefComplaint.symptomOnsetDate.slice(0, 10)
                      : 'Chưa ghi nhận'}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[11px] font-bold text-slate-500 block">Triệu chứng lâm sàng mô tả:</span>
                  <p className="mt-0.5 p-2 bg-white/80 rounded-xl border border-amber-200/60 font-medium text-slate-800 leading-relaxed">
                    {encounter.chiefComplaint.symptoms || 'Không có ghi chú triệu chứng đặc biệt.'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-800/80 italic py-1">
                Ca khám này chưa được ghi nhận lý do khám lâm sàng (Chief Complaint).
              </p>
            )}
          </div>

          {/* KHỐI 2: Khoa phòng & Bác sĩ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Khoa phụ trách:</span>
              </span>
              <p className="font-bold text-slate-900 text-xs">
                {encounter.department?.departmentName || '---'}
              </p>
              {encounter.department?.roomLocation && (
                <p className="text-[10px] text-slate-400">
                  Vị trí: {encounter.department.roomLocation}
                </p>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                <span>Bác sĩ phụ trách:</span>
              </span>
              <p className="font-bold text-slate-900 text-xs">
                {encounter.doctor?.fullName
                  ? `${encounter.doctor.title ? `${encounter.doctor.title} ` : ''}${encounter.doctor.fullName}`
                  : 'Bác sĩ trực chuyên khoa'}
              </p>
              {encounter.doctor?.specialization && (
                <p className="text-[10px] text-slate-400">
                  Chuyên môn: {encounter.doctor.specialization}
                </p>
              )}
            </div>
          </div>

          {/* KHỐI 3: Chỉ số sinh hiệu đo gần nhất (Vital Signs) */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Kết quả đo sinh hiệu gần nhất từ Điều dưỡng:</span>
              </span>
              {hasVitals ? (
                <span className="text-[10px] text-slate-400 font-medium">
                  Đo lúc: {formatDateTime(latestVitalSession?.measuredAt || latestVitalSession?.createdAt)}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Chưa đo sinh hiệu
                </span>
              )}
            </div>

            {hasVitals ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {/* Huyết áp */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 font-medium block">Huyết áp</span>
                  <span className="text-sm font-extrabold text-blue-900">
                    {bpSys && bpDia ? `${bpSys}/${bpDia}` : '---'}{' '}
                    <span className="text-[10px] font-normal text-slate-400">mmHg</span>
                  </span>
                </div>

                {/* Nhịp tim / Mạch */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 font-medium block">Mạch (Nhịp tim)</span>
                  <span className="text-sm font-extrabold text-rose-700">
                    {pulse ?? '---'}{' '}
                    <span className="text-[10px] font-normal text-slate-400">bpm</span>
                  </span>
                </div>

                {/* Thân nhiệt */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 font-medium block">Thân nhiệt</span>
                  <span className="text-sm font-extrabold text-amber-700">
                    {temp ?? '---'}{' '}
                    <span className="text-[10px] font-normal text-slate-400">°C</span>
                  </span>
                </div>

                {/* SpO2 */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 font-medium block">SpO2 (Oxy máu)</span>
                  <span className={`text-sm font-extrabold ${spo2 && Number(spo2) < 95 ? 'text-rose-600' : 'text-teal-700'}`}>
                    {spo2 ?? '---'}{' '}
                    <span className="text-[10px] font-normal text-slate-400">%</span>
                  </span>
                </div>

                {/* Chiều cao & Cân nặng */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 font-medium block">Chiều cao</span>
                  <span className="text-xs font-bold text-slate-800">
                    {height ?? '---'} <span className="text-[10px] font-normal text-slate-400">cm</span>
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 font-medium block">Cân nặng</span>
                  <span className="text-xs font-bold text-slate-800">
                    {weight ?? '---'} <span className="text-[10px] font-normal text-slate-400">kg</span>
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 font-medium block">Chỉ số BMI</span>
                  <span className="text-xs font-bold text-slate-800">
                    {bmi ?? '---'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 font-medium block">Nhịp thở</span>
                  <span className="text-xs font-bold text-slate-800">
                    {resp ?? '---'} <span className="text-[10px] font-normal text-slate-400">lần/phút</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                Bệnh nhân chưa thực hiện đo sinh hiệu cho lượt khám này.
              </div>
            )}
          </div>

          {/* KHỐI 4: Xác thực danh tính */}
          {encounter.identityVerifications && encounter.identityVerifications.length > 0 && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Lịch sử xác minh giấy tờ danh tính (Lễ tân đối chiếu):</span>
              </span>
              <div className="space-y-1.5">
                {encounter.identityVerifications.map((iv) => (
                  <div key={iv.verificationId} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200/60 text-[11px]">
                    <span className="font-semibold text-slate-700">
                      Phương thức: <strong className="uppercase">{iv.verificationMethod.replace(/_/g, ' ')}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{formatDateTime(iv.verifiedAt)}</span>
                      {iv.verificationStatus === 'verified' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Đã xác thực
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3" /> Không khớp
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
