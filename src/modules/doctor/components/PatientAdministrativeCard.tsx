import React from 'react';
import {
  FileText, ShieldAlert, Heart, Thermometer, Activity,
  AlertTriangle, Loader2, PlayCircle, CheckCircle2
} from 'lucide-react';
import type { PatientEMR } from '../types';
import type { CaseOverviewData } from '../../../services/doctor';
import type { PatientAllergyItem, AllergyType, AllergySeverity } from '../../../services/patient/patient-allergy.service';
import type { EncounterItem } from '../../../services/encounter/encounter.service';
import type { AppointmentItem } from '../../../services/appointment/appointment.service';

interface PatientAdministrativeCardProps {
  currentPatient: PatientEMR | null;
  caseOverview: CaseOverviewData | null;
  selectedEncounterDetail: EncounterItem | null;
  currentAppointment?: AppointmentItem | null;
  isStartingAppointment?: boolean;
  onStartConsultation?: () => void;
  activeAllergies: Array<PatientAllergyItem | {
    allergyId: string;
    allergyType: string;
    allergenName: string;
    severity: string;
    reactionDescription?: string;
    status: string;
  }>;
  isLoadingAllergies: boolean;
  isLoadingOverview: boolean;
  displayBp?: string;
  displayHr?: number | string;
  displaySpo2?: string;
  displayTemp?: string;
  hasMeasuredVitals: boolean;
}

export const PatientAdministrativeCard: React.FC<PatientAdministrativeCardProps> = ({
  currentPatient,
  caseOverview,
  selectedEncounterDetail,
  currentAppointment,
  isStartingAppointment,
  onStartConsultation,
  activeAllergies,
  isLoadingAllergies,
  isLoadingOverview,
  displayBp,
  displayHr,
  displaySpo2,
  displayTemp,
  hasMeasuredVitals,
}) => {
  const getSeverityBadge = (sev: AllergySeverity | string) => {
    switch (sev) {
      case 'life_threatening':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
            🔥 Nguy hiểm tính mạng
          </span>
        );
      case 'severe':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
            ⚠️ Nặng
          </span>
        );
      case 'moderate':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
            🟡 Trung bình
          </span>
        );
      case 'mild':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <img src="/images/mild_icon.png" alt="Nhẹ" className="w-3 h-3 object-contain shrink-0" />
            <span>Nhẹ</span>
          </span>
        );
    }
  };

  const getTypeLabel = (type: AllergyType | string) => {
    switch (type) {
      case 'drug':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
            <img src="/images/drug_icon.png" alt="Thuốc" className="w-4 h-4 object-contain shrink-0 inline-block align-middle" />
            <span>Thuốc</span>
          </span>
        );
      case 'food':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
            <img src="/images/food_icon.png" alt="Thực phẩm" className="w-4 h-4 object-contain shrink-0 inline-block align-middle" />
            <span>Thực phẩm</span>
          </span>
        );
      case 'environmental':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
            <img src="/images/environmental_icon.png" alt="Môi trường" className="w-4 h-4 object-contain shrink-0 inline-block align-middle" />
            <span>Môi trường</span>
          </span>
        );
      case 'other':
      default:
        return (
          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
            <img src="/images/other_icon.png" alt="Khác" className="w-4 h-4 object-contain shrink-0 inline-block align-middle" />
            <span>Khác</span>
          </span>
        );
    }
  };

  const activeFilteredAllergies = activeAllergies.filter((a) => a.status === 'active');
  const hasDrugAllergy = activeFilteredAllergies.some((a) => a.allergyType === 'drug');

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-700" />
          <span>Hồ sơ Bệnh án Điện tử (EMR) - Thông tin Hành chính & Sinh hiệu</span>
        </h3>

        {/* Action Button: Bắt đầu khám / Trạng thái phiên khám */}
        {onStartConsultation && (
          <div className="flex items-center gap-2 shrink-0">
            {currentAppointment?.status === 'in_progress' || selectedEncounterDetail?.status === 'in_progress' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Đang khám</span>
              </span>
            ) : currentAppointment?.status === 'completed' || selectedEncounterDetail?.status === 'finished' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Đã hoàn tất khám</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={onStartConsultation}
                disabled={isStartingAppointment || (!selectedEncounterDetail?.appointmentId && !currentAppointment?.appointmentId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Bác sĩ bắt đầu phiên khám lâm sàng (PATCH /appointments/:id/start)"
              >
                {isStartingAppointment ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang kết nối...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Bắt đầu khám</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* 1. Personal Info */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Thông tin bệnh nhân
          </span>
          <div className="space-y-1">
            <p>
              <strong className="text-slate-700">Họ tên:</strong>{' '}
              {caseOverview?.patient?.fullName || selectedEncounterDetail?.patient?.fullName || currentPatient?.name}
            </p>
            <p>
              <strong className="text-slate-700">Tuổi/Giới:</strong> {currentPatient?.age} tuổi (
              {caseOverview?.patient?.gender === 'female' || selectedEncounterDetail?.patient?.gender === 'female'
                ? 'Nữ'
                : caseOverview?.patient?.gender === 'male' || selectedEncounterDetail?.patient?.gender === 'male'
                ? 'Nam'
                : currentPatient?.gender}
              )
            </p>
            <p>
              <strong className="text-slate-700">Ngày sinh:</strong>{' '}
              {caseOverview?.patient?.dateOfBirth?.slice(0, 10) || selectedEncounterDetail?.patient?.dateOfBirth?.slice(0, 10) || currentPatient?.dob}
            </p>
            <p>
              <strong className="text-slate-700">Nhóm máu:</strong>{' '}
              {caseOverview?.patient?.bloodType || selectedEncounterDetail?.patient?.bloodType || currentPatient?.bloodType}
            </p>
          </div>
        </div>

        {/* 2. Clinical History & Allergies */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Tiền sử & Dị ứng
            </span>
            {(isLoadingAllergies || isLoadingOverview) && (
              <Loader2 className="w-3.5 h-3.5 text-rose-600 animate-spin" />
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <strong className="text-slate-800 text-[11px]">Dị ứng ghi nhận:</strong>
              </div>

              {isLoadingAllergies && activeFilteredAllergies.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">Đang tải dị ứng bệnh nhân...</span>
              ) : activeFilteredAllergies.length > 0 ? (
                <div className="space-y-1.5 pt-0.5">
                  {activeFilteredAllergies.map((item) => (
                    <div
                      key={item.allergyId}
                      className="p-2 rounded-xl bg-white border border-rose-200/80 shadow-2xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-[11px] leading-tight flex items-center gap-1.5 flex-wrap">
                          {getTypeLabel(item.allergyType)}
                          <span className="font-extrabold text-rose-900">{item.allergenName}</span>
                        </div>
                        {getSeverityBadge(item.severity)}
                      </div>
                      {item.reactionDescription && (
                        <p className="text-[10px] text-slate-500 italic pl-1 leading-snug">
                          Triệu chứng: {item.reactionDescription}
                        </p>
                      )}
                    </div>
                  ))}

                  {hasDrugAllergy && (
                    <div className="mt-1 p-2 bg-rose-50 rounded-lg border border-rose-200 text-rose-800 text-[10px] font-bold flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>CẢNH BÁO KÊ ĐƠN: Bệnh nhân dị ứng kháng sinh/thuốc!</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 italic text-[11px] pt-0.5">
                  Chưa ghi nhận dị ứng (An toàn)
                </p>
              )}
            </div>

            <div className="pt-1.5 border-t border-slate-200/60 space-y-1">
              <p>
                <strong className="text-slate-700">Tiền sử bệnh:</strong>{' '}
                {caseOverview?.medicalHistories && caseOverview.medicalHistories.length > 0 ? (
                  <span className="text-slate-800 font-semibold">
                    {caseOverview.medicalHistories.map((h) => h.conditionName).join(', ')}
                  </span>
                ) : (
                  <span className="text-slate-500">
                    {currentPatient?.history || 'Chưa ghi nhận tiền sử bệnh'}
                  </span>
                )}
              </p>
              <p>
                <strong className="text-slate-700">Triệu chứng khai báo:</strong>{' '}
                <span className="text-slate-800 font-semibold">
                  {caseOverview?.chiefComplaint?.symptoms || selectedEncounterDetail?.chiefComplaint?.symptoms || currentPatient?.symptoms}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 3. Vital Signs from Reception */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Chỉ số sinh hiệu lúc đón tiếp
            </span>
            {isLoadingOverview && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
          </div>

          {hasMeasuredVitals ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* BP */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-0.5">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">HA</span>
                </div>
                <div className="text-xs font-mono font-extrabold text-slate-800">
                  {displayBp || '---'}
                </div>
              </div>

              {/* Heart rate */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-0.5">
                <div className="flex items-center gap-1.5 text-rose-500">
                  <Heart className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Nhịp tim</span>
                </div>
                <div className="text-xs font-mono font-extrabold text-slate-800">
                  {displayHr !== undefined ? `${displayHr} bpm` : '---'}
                </div>
              </div>

              {/* SpO2 */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-0.5">
                <div className="flex items-center gap-1.5 text-blue-600">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">SpO2</span>
                </div>
                <div className="text-xs font-mono font-extrabold text-slate-800">
                  {displaySpo2 || '---'}
                </div>
              </div>

              {/* Temp */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-0.5">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Thermometer className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Nhiệt độ</span>
                </div>
                <div className="text-xs font-mono font-extrabold text-slate-800">
                  {displayTemp || '---'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200/80 text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bệnh nhân chưa đo chỉ số sinh hiệu</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
