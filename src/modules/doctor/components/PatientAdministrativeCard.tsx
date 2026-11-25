import React, { useState, useEffect } from 'react';
import {
  User, ShieldAlert, Heart, Thermometer, Activity,
  AlertTriangle, Loader2, PlayCircle, CheckCircle2, RefreshCw,
  History, ChevronDown, ChevronUp, Calendar, Stethoscope,
  ArrowRight
} from 'lucide-react';
import type { PatientEMR } from '../types';
import type { CaseOverviewData } from '../../../services/doctor';
import {
  type PatientAllergyItem,
  parseAllergyText,
  parseAllergiesFromText,
} from '../../../services/patient/patient-allergy.service';
import type { EncounterItem } from '../../../services/encounter/encounter.service';
import { getPatientEncounterHistory } from '../../../services/encounter/encounter.service';
import type { AppointmentItem } from '../../../services/appointment/appointment.service';
import { testOrderService } from '../../../services/doctor';
import {
  invoiceService,
  resolveEncounterLabPaymentState,
  type LabWorkflowPaymentState,
} from '../../../services/payment/invoice.service';

interface PatientAdministrativeCardProps {
  currentPatient: PatientEMR | null;
  caseOverview: CaseOverviewData | null;
  selectedEncounterDetail: EncounterItem | null;
  currentAppointment?: AppointmentItem | null;
  isStartingAppointment?: boolean;
  onStartConsultation?: () => void;
  onRefreshEncounter?: () => void;
  onOpenMedicalHistory?: () => void;
  onNavigateToDiagnosis?: () => void;
  onNavigateToPrescription?: () => void;

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
  onRefreshEncounter,
  onOpenMedicalHistory,
  onNavigateToDiagnosis,
  onNavigateToPrescription,
  activeAllergies,
  isLoadingAllergies,
  isLoadingOverview,
  displayBp,
  displayHr,
  displaySpo2,
  displayTemp,
  hasMeasuredVitals,
}) => {

  const activeFilteredAllergies = activeAllergies.filter((a) => a.status === 'active');
  const hasDrugAllergy = activeFilteredAllergies.some((a) => {
    const parsed = parseAllergyText((a as any).allergyText);
    return parsed.drug.length > 0 || (a as any).allergyType === 'drug';
  });

  // Khóa an toàn dữ liệu: Chỉ dùng caseOverview và encounterDetail nếu trùng khớp 100% với bệnh nhân đang chọn
  const isOverviewMatching = Boolean(
    caseOverview &&
    currentPatient &&
    ((caseOverview.encounter?.encounterId && caseOverview.encounter.encounterId === currentPatient.encounterId) ||
      (caseOverview.patient?.patientId && caseOverview.patient.patientId === currentPatient.patientId))
  );
  const safeOverview = isOverviewMatching ? caseOverview : null;

  const isEncounterMatching = Boolean(
    selectedEncounterDetail &&
    currentPatient &&
    (selectedEncounterDetail.encounterId === currentPatient.encounterId ||
      selectedEncounterDetail.patientId === currentPatient.patientId)
  );
  const safeEncounterDetail = isEncounterMatching ? selectedEncounterDetail : null;

  // Trích xuất đầy đủ sinh hiệu từ phiên đo gần nhất (đồng bộ 8 chỉ số với Điều dưỡng)
  const vitalSession =
    safeOverview?.latestVitalSession ||
    (safeEncounterDetail?.vitalSignSessions && safeEncounterDetail.vitalSignSessions.length > 0
      ? safeEncounterDetail.vitalSignSessions[0]
      : undefined);

  const findVitalObs = (...codes: string[]) => {
    if (!vitalSession?.observations) return undefined;
    return vitalSession.observations.find(
      (o) => o.item?.itemCode && codes.some((code) => code.toLowerCase() === o.item?.itemCode?.toLowerCase())
    );
  };

  const bpSysObs = findVitalObs('SBP', 'BP_SYS', 'BP_SYSTOLIC');
  const bpDiaObs = findVitalObs('DBP', 'BP_DIA', 'BP_DIASTOLIC');
  const hrObs = findVitalObs('HR', 'PULSE');
  const tempObs = findVitalObs('TEMP', 'TEMPERATURE');
  const spo2Obs = findVitalObs('SPO2');
  const respObs = findVitalObs('RR', 'RESP', 'RESPIRATORY_RATE');
  const heightObs = findVitalObs('HEIGHT');
  const weightObs = findVitalObs('WEIGHT');
  const bmiObs = findVitalObs('BMI');

  const bpValue =
    bpSysObs?.observationValue !== undefined && bpDiaObs?.observationValue !== undefined
      ? `${bpSysObs.observationValue}/${bpDiaObs.observationValue}`
      : bpSysObs?.observationValue !== undefined
        ? `${bpSysObs.observationValue}`
        : displayBp
          ? displayBp.replace(/\s*mmHg$/i, '')
          : undefined;
  const hrValue = hrObs?.observationValue ?? displayHr;
  const tempValue =
    tempObs?.observationValue ?? (displayTemp ? displayTemp.replace(/\s*°C$/i, '') : undefined);
  const spo2Value =
    spo2Obs?.observationValue ?? (displaySpo2 ? displaySpo2.replace(/\s*%$/i, '') : undefined);
  const respValue = respObs?.observationValue;
  const heightValue = heightObs?.observationValue;
  const weightValue = weightObs?.observationValue;
  const bmiValue =
    bmiObs?.observationValue !== undefined
      ? bmiObs.observationValue
      : heightValue !== undefined && weightValue !== undefined && Number(heightValue) > 0 && Number(weightValue) > 0
        ? (Number(weightValue) / Math.pow(Number(heightValue) / 100, 2)).toFixed(2)
        : undefined;

  const isBpAbnormal = Boolean(bpSysObs?.isAbnormal || bpDiaObs?.isAbnormal);
  const isHrAbnormal = Boolean(hrObs?.isAbnormal);
  const isTempAbnormal = Boolean(tempObs?.isAbnormal);
  const isSpo2Abnormal = Boolean(spo2Obs?.isAbnormal || (spo2Value !== undefined && Number(spo2Value) < 95));
  const isRespAbnormal = Boolean(respObs?.isAbnormal);
  const isBmiAbnormal = Boolean(bmiObs?.isAbnormal);

  const vitalMeasuredRaw = vitalSession?.measuredAt || vitalSession?.createdAt;
  const vitalMeasuredTimeText = (() => {
    if (!vitalMeasuredRaw) return '';
    const d = new Date(vitalMeasuredRaw);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  })();
  const vitalNotes = vitalSession?.notes;
  const effectiveHasVitals = Boolean(
    hasMeasuredVitals || (vitalSession?.observations && vitalSession.observations.length > 0)
  );

  // Thông tin Tiếp đón lâm sàng (Chief Complaint) từ Điều dưỡng
  const reasonForVisit =
    safeEncounterDetail?.chiefComplaint?.reasonForVisit ||
    safeOverview?.chiefComplaint?.reasonForVisit;
  const symptomOnsetDate = (
    safeEncounterDetail?.chiefComplaint?.symptomOnsetDate ||
    safeOverview?.chiefComplaint?.symptomOnsetDate ||
    ''
  ).slice(0, 10);
  const painLevel =
    typeof safeEncounterDetail?.chiefComplaint?.painLevel === 'number'
      ? safeEncounterDetail.chiefComplaint.painLevel
      : typeof safeOverview?.chiefComplaint?.painLevel === 'number'
        ? safeOverview.chiefComplaint.painLevel
        : undefined;
  const symptomsDescription =
    safeEncounterDetail?.chiefComplaint?.symptoms ||
    safeOverview?.chiefComplaint?.symptoms ||
    currentPatient?.symptoms;

  // Lịch sử các ca khám cũ của bệnh nhân (GET /api/v1/encounters?patientId=UUID)
  const realPatientId =
    safeOverview?.patient?.patientId ||
    safeEncounterDetail?.patientId ||
    safeEncounterDetail?.patient?.patientId ||
    currentPatient?.patientId;

  const [encounterHistory, setEncounterHistory] = useState<EncounterItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyLabStates, setHistoryLabStates] = useState<Record<string, LabWorkflowPaymentState | null>>({});

  useEffect(() => {
    setHistoryLabStates({});
  }, [realPatientId]);

  useEffect(() => {
    if (!isHistoryOpen || encounterHistory.length === 0) return;
    let isMounted = true;

    encounterHistory.forEach(async (enc) => {
      if (enc.encounterId in historyLabStates) return;
      try {
        const [orders, invoices] = await Promise.all([
          testOrderService.getTestOrdersByEncounter(enc.encounterId).catch(() => []),
          invoiceService.findMany({ encounterId: enc.encounterId }).catch(() => []),
        ]);
        const state = resolveEncounterLabPaymentState(orders, invoices);
        if (isMounted) {
          setHistoryLabStates((prev) => ({
            ...prev,
            [enc.encounterId]: state,
          }));
        }
      } catch {
        if (isMounted) {
          setHistoryLabStates((prev) => ({
            ...prev,
            [enc.encounterId]: null,
          }));
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isHistoryOpen, encounterHistory, historyLabStates]);

  useEffect(() => {
    if (!realPatientId) {
      setEncounterHistory([]);
      return;
    }
    let isMounted = true;
    setIsLoadingHistory(true);
    getPatientEncounterHistory(realPatientId)
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setEncounterHistory(data);
        }
      })
      .catch((err) => {
        console.warn('Không thể lấy lịch sử lượt khám cho bác sĩ:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [realPatientId]);

  const formatDateDdMmYyyy = (val?: string | null) => {
    if (!val || val === '---') return '---';
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(val.trim());
    return m ? `${m[3]}/${m[2]}/${m[1]}` : val;
  };

  const formatEncounterStatus = (status: string) => {
    switch (status) {
      case 'finished': return 'Đã hoàn thành';
      case 'in_progress': return 'Đang khám';
      case 'registered': return 'Đã tiếp nhận';
      case 'arrived': return 'Mới tới';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <User className="w-5 h-5 text-blue-700" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Thông tin cá nhân
              </span>
              {onRefreshEncounter && (
                <button
                  type="button"
                  onClick={onRefreshEncounter}
                  disabled={isLoadingOverview}
                  className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
                  title="Tải lại dữ liệu mới nhất cho ca khám này"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingOverview ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              )}
              {isLoadingOverview && !safeOverview && (
                <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Đang cập nhật...
                </span>
              )}
            </div>
            <div className="text-sm font-extrabold text-slate-900 truncate">
              {safeOverview?.patient?.fullName || safeEncounterDetail?.patient?.fullName || currentPatient?.name}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              <span>
                <strong className="text-slate-700">Tuổi/Giới:</strong> {currentPatient?.age} tuổi (
                {safeOverview?.patient?.gender === 'female' || safeEncounterDetail?.patient?.gender === 'female'
                  ? 'Nữ'
                  : safeOverview?.patient?.gender === 'male' || safeEncounterDetail?.patient?.gender === 'male'
                    ? 'Nam'
                    : currentPatient?.gender}
                )
              </span>
              <span className="text-slate-300">•</span>
              <span>
                <strong className="text-slate-700">Ngày sinh:</strong>{' '}
                {formatDateDdMmYyyy(safeOverview?.patient?.dateOfBirth || safeEncounterDetail?.patient?.dateOfBirth || currentPatient?.dob)}
              </span>
              <span className="text-slate-300">•</span>
              <span>
                <strong className="text-slate-700">Nhóm máu:</strong>{' '}
                <span className="font-bold text-slate-800">
                  {safeOverview?.patient?.bloodType || safeEncounterDetail?.patient?.bloodType || currentPatient?.bloodType}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Bắt đầu khám / Trạng thái phiên khám / Điều hướng */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {safeEncounterDetail?.status === 'awaiting_review' ? (
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>Đã có KQ CLS</span>
              </span>
              {onNavigateToDiagnosis && (
                <button
                  type="button"
                  onClick={onNavigateToDiagnosis}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-98 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer"
                  title="Xem kết quả cận lâm sàng và kết luận chẩn đoán tại Tab 2"
                >
                  <span>Xem KQ CLS & Kết luận</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : currentAppointment?.status === 'in_progress' || safeEncounterDetail?.status === 'in_progress' ? (
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Đang khám</span>
              </span>
              {onNavigateToPrescription && (
                <button
                  type="button"
                  onClick={onNavigateToPrescription}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  title="Ca khám nhẹ không cần CLS, chuyển thẳng sang kê đơn thuốc (Tab 3)"
                >
                  <span>Bỏ qua CLS → Kê đơn ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : currentAppointment?.status === 'completed' || safeEncounterDetail?.status === 'finished' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Đã hoàn tất khám</span>
            </span>
          ) : onStartConsultation ? (
            <button
              type="button"
              onClick={onStartConsultation}
              disabled={isStartingAppointment || (!safeEncounterDetail?.encounterId && !currentPatient?.encounterId && !safeEncounterDetail?.appointmentId && !currentAppointment?.appointmentId)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Bác sĩ bắt đầu phiên khám lâm sàng (POST /doctor-examination/encounters/:id/start)"
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
          ) : null}
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* 1. Clinical History, Allergies & Chief Complaint */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Tiền sử, Dị ứng & Tiếp đón lâm sàng
            </span>
            {isLoadingAllergies && !safeOverview && activeFilteredAllergies.length === 0 && (
              <Loader2 className="w-3.5 h-3.5 text-rose-600 animate-spin" />
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <strong className="text-slate-800 text-[11px]">Dị ứng ghi nhận:</strong>
              </div>

              {isLoadingAllergies && !safeOverview && activeFilteredAllergies.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">Đang tải dị ứng bệnh nhân...</span>
              ) : activeFilteredAllergies.length > 0 ? (
                <div className="space-y-1.5 pt-0.5">
                  {activeFilteredAllergies.map((item) => {
                    const parsedItems = parseAllergiesFromText((item as any).allergyText);

                    return (
                      <div
                        key={item.allergyId}
                        className="p-2 rounded-xl bg-white border border-rose-200/80 shadow-2xs space-y-1"
                      >
                        {parsedItems.length === 0 ? (
                          <div className="text-[11px] font-extrabold text-rose-900">
                            {(item as any).allergenName || (item as any).allergyText || 'Chưa rõ dị ứng'}
                          </div>
                        ) : (
                          parsedItems.map((p, idx) => (
                            <div key={idx} className="space-y-0.5">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <div className="text-[11px] flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                    {p.typeLabel}
                                  </span>
                                  <span className="font-extrabold text-rose-900">{p.name}</span>
                                </div>
                                {p.severity && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                    {p.severityLabel || p.severity}
                                  </span>
                                )}
                              </div>
                              {p.reaction && (
                                <p className="text-[10px] text-slate-500 italic pl-1 leading-snug">
                                  Phản ứng: {p.reaction}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}

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
              <div className="flex items-center justify-between">
                <strong className="text-slate-700">Tiền sử bệnh:</strong>
                {onOpenMedicalHistory && (
                  <button
                    type="button"
                    onClick={onOpenMedicalHistory}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors"
                  >
                    <History className="w-3 h-3" />
                    <span>Quản lý tiền sử</span>
                  </button>
                )}
              </div>
              <p>
                {safeOverview?.medicalHistories && safeOverview.medicalHistories.length > 0 ? (
                  <span className="text-slate-800 font-semibold">
                    {safeOverview.medicalHistories.map((h) => h.conditionName).join(', ')}
                  </span>
                ) : (
                  <span className="text-slate-500">
                    {currentPatient?.history || 'Chưa ghi nhận tiền sử bệnh'}
                  </span>
                )}
              </p>
            </div>

            {/* Tiếp đón lâm sàng (Chief Complaint) */}
            <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <strong className="text-slate-700 text-[11px]">Tiếp đón lâm sàng:</strong>
                {painLevel !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      painLevel >= 7
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : painLevel >= 4
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    Mức đau: {painLevel}/10
                  </span>
                )}
              </div>

              <div className="space-y-1 text-[11px]">
                <div>
                  <span className="text-slate-500">Lý do đến khám: </span>
                  <span className="font-bold text-slate-800">{reasonForVisit || 'Chưa ghi nhận'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Khởi phát triệu chứng: </span>
                  <span className="font-semibold text-slate-800">{symptomOnsetDate ? formatDateDdMmYyyy(symptomOnsetDate) : 'Chưa ghi nhận'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[11px]">Triệu chứng mô tả: </span>
                <span className="font-semibold text-slate-800 text-[11px]">
                  {symptomsDescription || 'Không có ghi chú triệu chứng đặc biệt'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Vital Signs from Nurse / Reception (Full 8 indicators) */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Chỉ số sinh hiệu lúc đón tiếp
            </span>
            <div className="flex items-center gap-2">
              {vitalMeasuredTimeText && (
                <span className="text-[10px] text-slate-500 font-medium">
                  Đo lúc: <strong className="text-slate-700 font-mono">{vitalMeasuredTimeText}</strong>
                </span>
              )}
              {isLoadingOverview && !safeOverview && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
            </div>
          </div>

          {effectiveHasVitals ? (
            <div className="space-y-2 pt-0.5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. Huyết áp */}
                <div
                  className={`bg-white p-2.5 rounded-xl border shadow-2xs space-y-0.5 ${
                    isBpAbnormal ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center gap-1 text-emerald-600">
                    <Activity className="w-3 h-3 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-500">Huyết áp</span>
                  </div>
                  <div className={`text-xs font-mono font-extrabold ${isBpAbnormal ? 'text-rose-700' : 'text-blue-900'}`}>
                    {bpValue ?? '---'}{' '}
                    <span className="text-[10px] font-sans font-normal text-slate-400">mmHg</span>
                  </div>
                </div>

                {/* 2. Mạch / Nhịp tim */}
                <div
                  className={`bg-white p-2.5 rounded-xl border shadow-2xs space-y-0.5 ${
                    isHrAbnormal ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center gap-1 text-rose-500">
                    <Heart className="w-3 h-3 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-500">Mạch / Nhịp tim</span>
                  </div>
                  <div className="text-xs font-mono font-extrabold text-rose-700">
                    {hrValue ?? '---'}{' '}
                    <span className="text-[10px] font-sans font-normal text-slate-400">bpm</span>
                  </div>
                </div>

                {/* 3. Thân nhiệt */}
                <div
                  className={`bg-white p-2.5 rounded-xl border shadow-2xs space-y-0.5 ${
                    isTempAbnormal ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center gap-1 text-amber-500">
                    <Thermometer className="w-3 h-3 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-500">Thân nhiệt</span>
                  </div>
                  <div className={`text-xs font-mono font-extrabold ${isTempAbnormal ? 'text-rose-700' : 'text-amber-700'}`}>
                    {tempValue ?? '---'}{' '}
                    <span className="text-[10px] font-sans font-normal text-slate-400">°C</span>
                  </div>
                </div>

                {/* 4. SpO2 */}
                <div
                  className={`bg-white p-2.5 rounded-xl border shadow-2xs space-y-0.5 ${
                    isSpo2Abnormal ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center gap-1 text-blue-600">
                    <Activity className="w-3 h-3 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-500">SpO2 (Oxy máu)</span>
                  </div>
                  <div className={`text-xs font-mono font-extrabold ${isSpo2Abnormal ? 'text-rose-600' : 'text-teal-700'}`}>
                    {spo2Value ?? '---'}{' '}
                    <span className="text-[10px] font-sans font-normal text-slate-400">%</span>
                  </div>
                </div>

                {/* 5. Nhịp thở */}
                <div
                  className={`bg-white p-2.5 rounded-xl border shadow-2xs space-y-0.5 ${
                    isRespAbnormal ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200/70'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-500 block">Nhịp thở</span>
                  <div className={`text-xs font-mono font-extrabold ${isRespAbnormal ? 'text-rose-700' : 'text-slate-800'}`}>
                    {respValue ?? '---'}{' '}
                    <span className="text-[10px] font-sans font-normal text-slate-400">lần/phút</span>
                  </div>
                </div>

                {/* 6. Chiều cao */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 block">Chiều cao</span>
                  <div className="text-xs font-mono font-extrabold text-slate-800">
                    {heightValue ?? '---'}{' '}
                    <span className="text-[10px] font-sans font-normal text-slate-400">cm</span>
                  </div>
                </div>

                {/* 7. Cân nặng */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 block">Cân nặng</span>
                  <div className="text-xs font-mono font-extrabold text-slate-800">
                    {weightValue ?? '---'}{' '}
                    <span className="text-[10px] font-sans font-normal text-slate-400">kg</span>
                  </div>
                </div>

                {/* 8. Chỉ số BMI */}
                <div
                  className={`bg-white p-2.5 rounded-xl border shadow-2xs space-y-0.5 ${
                    isBmiAbnormal ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200/70'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-500 block">Chỉ số BMI</span>
                  <div className={`text-xs font-mono font-extrabold ${isBmiAbnormal ? 'text-rose-700' : 'text-slate-800'}`}>
                    {bmiValue ?? '---'}
                  </div>
                </div>
              </div>

              {vitalNotes && (
                <div className="p-2 bg-white rounded-xl border border-slate-200/70 text-[11px] text-slate-600">
                  <strong className="text-slate-700">Ghi chú đo sinh hiệu:</strong> {vitalNotes}
                </div>
              )}
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

      {/* 4. Lịch Sử Các Ca Khám Cũ Đã Thực Hiện (Dành cho Bác sĩ) */}
      <div className="pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/80 transition-all text-xs font-bold text-slate-800 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <span>Lịch Sử Các Ca Khám Cũ Đã Thực Hiện</span>
            {encounterHistory.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-extrabold">
                {encounterHistory.length} lượt
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium">
            {isLoadingHistory && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
            <span>{isHistoryOpen ? 'Thu gọn' : 'Xem chi tiết'}</span>
            {isHistoryOpen ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
          </div>
        </button>

        {isHistoryOpen && (
          <div className="mt-3 space-y-2.5 text-xs animate-in fade-in duration-150">
            {isLoadingHistory ? (
              <div className="p-4 text-center text-slate-400 italic font-semibold">
                Đang tải lịch sử ca khám từ hệ thống...
              </div>
            ) : encounterHistory.length === 0 ? (
              <div className="p-4 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200/60">
                Chưa ghi nhận lịch sử ca khám cũ nào cho bệnh nhân này.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1">
                {encounterHistory.map((enc) => (
                  <div
                    key={enc.encounterId}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-indigo-300 transition-all shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-extrabold">
                        {enc.encounterCode}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {historyLabStates[enc.encounterId] === 'ordered' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Chờ đóng phí Lab
                          </span>
                        )}
                        {historyLabStates[enc.encounterId] === 'paid' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Đã đóng phí • Chờ Lab
                          </span>
                        )}
                        {historyLabStates[enc.encounterId] === 'completed' && enc.status !== 'finished' && enc.status !== 'completed' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Đã có KQ Lab
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700">
                          {formatEncounterStatus(enc.status)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{enc.doctor?.fullName || 'BS. Trực chuyên khoa'}</span>
                        </span>
                        {enc.doctor?.title && (
                          <span className="text-[10px] text-slate-500 font-medium">{enc.doctor.title}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Thời gian đến: <strong className="text-slate-700 font-mono">{enc.arrivedAt ? new Date(enc.arrivedAt).toLocaleString('vi-VN') : '---'}</strong></span>
                      </div>
                      {enc.chiefComplaint?.reasonForVisit && (
                        <div className="mt-1 p-2 bg-white rounded-lg border border-slate-200/80 text-[10px] text-slate-700 font-medium">
                          <strong className="text-indigo-900 font-bold">Lý do khám:</strong> {enc.chiefComplaint.reasonForVisit}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
