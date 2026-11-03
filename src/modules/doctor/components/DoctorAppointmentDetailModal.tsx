import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  CreditCard,
  Stethoscope,
  FileText,
  Ticket,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  History,
  HeartPulse,
  ClipboardList,
  Pill,
  ShieldCheck,
  Mail,
  MapPin,
  Printer,
  Info,
  CalendarDays
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { appointmentService, type AppointmentItem } from '../../../services/appointment/appointment.service';
import {
  encounterService,
  type EncounterItem,
  type EncounterVitalSession,
} from '../../../services/encounter/encounter.service';
import {
  postTestConsultationService,
  type DiagnosisConclusionItem,
  type TreatmentConsultationItem,
} from '../../../services/doctor/post-test-consultation.service';
import {
  prescriptionService,
  type PrescriptionDetail,
} from '../../../services/prescription/prescription.service';
import { formatTicketCode, getQueueStatusLabel } from '../../../utils/booking.utils';

interface DoctorAppointmentDetailModalProps {
  isOpen: boolean;
  appointmentId: string | null;
  onClose: () => void;
}

export const DoctorAppointmentDetailModal: React.FC<DoctorAppointmentDetailModalProps> = ({
  isOpen,
  appointmentId,
  onClose,
}) => {
  const [appointment, setAppointment] = useState<AppointmentItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Source Encounter details for Follow-up appointments
  const [sourceEncounter, setSourceEncounter] = useState<EncounterItem | null>(null);
  const [sourceDiagnoses, setSourceDiagnoses] = useState<DiagnosisConclusionItem[]>([]);
  const [sourceTreatment, setSourceTreatment] = useState<TreatmentConsultationItem | null>(null);
  const [sourcePrescriptions, setSourcePrescriptions] = useState<PrescriptionDetail[]>([]);
  const [loadingSource, setLoadingSource] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !appointmentId) {
      setAppointment(null);
      setSourceEncounter(null);
      setSourceDiagnoses([]);
      setSourceTreatment(null);
      setSourcePrescriptions([]);
      return;
    }

    let isCancelled = false;

    const fetchAppointmentAndSource = async () => {
      try {
        setLoading(true);
        setError(null);
        setSourceEncounter(null);
        setSourceDiagnoses([]);
        setSourceTreatment(null);
        setSourcePrescriptions([]);

        const data = await appointmentService.getAppointmentById(appointmentId);
        if (isCancelled) return;
        setAppointment(data);

        const sourceEncId = (data as any)?.sourceEncounterId || (data as any)?.sourceEncounter?.encounterId;
        if (sourceEncId) {
          setLoadingSource(true);
          Promise.allSettled([
            encounterService.getEncounterById(sourceEncId),
            postTestConsultationService.getDiagnosisConclusions(sourceEncId),
            postTestConsultationService.getTreatmentConsultation(sourceEncId),
            prescriptionService.findMany({ encounterId: sourceEncId }),
          ])
            .then(([encRes, diagRes, treatRes, presRes]) => {
              if (isCancelled) return;
              if (encRes.status === 'fulfilled') setSourceEncounter(encRes.value);
              if (diagRes.status === 'fulfilled') setSourceDiagnoses(diagRes.value || []);
              if (treatRes.status === 'fulfilled') setSourceTreatment(treatRes.value);
              if (presRes.status === 'fulfilled') setSourcePrescriptions(presRes.value || []);
            })
            .catch((err) => {
              console.error('Không thể tải chi tiết ca khám gốc:', err);
            })
            .finally(() => {
              if (!isCancelled) setLoadingSource(false);
            });
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err?.message || 'Không thể tải chi tiết lịch hẹn');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchAppointmentAndSource();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, appointmentId]);

  if (!isOpen) return null;

  const isFollowUp =
    appointment?.appointmentType === 'follow_up' ||
    appointment?.bookingChannel === 'doctor_follow_up' ||
    !!appointment?.sourceEncounterId;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" size="md">Chờ xác nhận</Badge>;
      case 'confirmed':
        return <Badge variant="info" size="md">Đã xác nhận</Badge>;
      case 'checked_in':
        return <Badge variant="success" size="md">Đã đến viện (Check-in)</Badge>;
      case 'in_progress':
        return <Badge variant="info" size="md">Đang khám</Badge>;
      case 'completed':
        return <Badge variant="success" size="md">Đã hoàn thành</Badge>;
      case 'cancelled':
        return <Badge variant="neutral" size="md">Đã hủy</Badge>;
      case 'no_show':
        return <Badge variant="critical" size="md">Vắng mặt</Badge>;
      default:
        return <Badge variant="neutral" size="md">{status || 'Chờ tiếp đón'}</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper extracting observations from vital sessions
  const latestVitalSession: EncounterVitalSession | undefined =
    sourceEncounter?.vitalSignSessions && sourceEncounter.vitalSignSessions.length > 0
      ? sourceEncounter.vitalSignSessions[0]
      : undefined;

  const getObservationValue = (...codes: string[]): string | number | undefined => {
    if (!latestVitalSession) return undefined;
    const obs = latestVitalSession.observations?.find((o) =>
      o.item?.itemCode && codes.some((c) => c.toLowerCase() === o.item?.itemCode?.toLowerCase())
    );
    return obs?.observationValue;
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-auto space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* HEADER MODAL */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                {isFollowUp ? (
                  <>
                    <Stethoscope className="w-5 h-5 text-purple-600" />
                    <span>Hồ Sơ Lịch Tái Khám & Kết Quả Đã Khám</span>
                  </>
                ) : (
                  <>
                    <CalendarDays className="w-5 h-5 text-teal-600" />
                    <span>Hồ Sơ Bệnh Nhân & Chi Tiết Lịch Hẹn</span>
                  </>
                )}
              </h2>
              {isFollowUp ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-purple-700 bg-purple-100/90 border border-purple-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                  Lịch tái khám
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-sky-700 bg-sky-100/90 border border-sky-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                  Lịch hẹn
                </span>
              )}
              {appointment && getStatusBadge(appointment.status)}
            </div>

            {appointment && (
              <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                <span>Mã lịch hẹn:</span>
                <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                  {appointment.appointmentCode}
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  Kênh đăng ký:{' '}
                  <strong className="text-slate-800 font-semibold">
                    {appointment.bookingChannel === 'doctor_follow_up' ? (
                      <span className="text-purple-700">Bác sĩ chỉ định hẹn tái khám</span>
                    ) : appointment.bookingChannel === 'online' ? (
                      <span className="text-sky-700">Trực tuyến (Online)</span>
                    ) : (
                      <span className="text-slate-700">Tại quầy</span>
                    )}
                  </strong>
                </span>
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOADING & ERROR */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Đang tải chi tiết hồ sơ bệnh nhân...</p>
          </div>
        ) : error || !appointment ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error || 'Không tìm thấy thông tin lịch hẹn'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* PHẦN 1: HỒ SƠ CHI TIẾT BỆNH NHÂN */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <User className="w-4 h-4 text-teal-600" />
                  <span>Hồ Sơ Hành Chính Bệnh Nhân</span>
                </div>
                {appointment.patient?.identityVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Đã xác thực CCCD
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[11px]">Họ và tên:</span>
                  <strong className="text-slate-900 text-sm">{appointment.patient?.fullName || 'Khách vãng lai'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mã hồ sơ BN:</span>
                  <strong className="font-mono text-teal-700 font-bold text-sm">
                    {appointment.patient?.patientCode || 'Chưa gán mã'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngày sinh:</span>
                  <span className="font-semibold text-slate-800">
                    {appointment.patient?.dateOfBirth
                      ? new Date(appointment.patient.dateOfBirth).toLocaleDateString('vi-VN')
                      : '---'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Giới tính:</span>
                  <span className="font-semibold text-slate-800">
                    {appointment.patient?.gender === 'male'
                      ? 'Nam'
                      : appointment.patient?.gender === 'female'
                      ? 'Nữ'
                      : 'Khác'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Số điện thoại:</span>
                  <span className="font-medium text-slate-800">{appointment.patient?.phoneNumber || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Số CCCD / CMND:</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {appointment.patient?.identityNumber || 'Chưa cập nhật'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mã thẻ BHYT:</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {appointment.patient?.insuranceNumber || 'Không có BHYT'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Dân tộc:</span>
                  <span className="text-slate-800">{appointment.patient?.ethnicity || 'Kinh'}</span>
                </div>

                {appointment.patient?.email && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Email liên hệ:</span>
                    <span className="text-slate-800 truncate block">{appointment.patient.email}</span>
                  </div>
                )}
                {appointment.patient?.address && (
                  <div className="col-span-2 sm:col-span-4">
                    <span className="text-slate-400 block text-[11px]">Địa chỉ thường trú:</span>
                    <span className="text-slate-800 font-medium">{appointment.patient.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* PHẦN 2: THÔNG TIN LỊCH HẸN KHÁM */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Thông Tin Lịch Khám Đã Đặt</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngày hẹn khám:</span>
                  <strong className="text-emerald-800 text-sm">
                    {new Date(appointment.appointmentDate).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Khung giờ slot tiếp đón:</span>
                  <strong className="text-blue-800 text-sm font-mono">
                    {new Date(appointment.appointmentTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'UTC',
                    })}
                    {appointment.slot
                      ? ` - ${new Date(appointment.slot.slotEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}`
                      : ''}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mức độ ưu tiên:</span>
                  <span className="font-bold uppercase text-slate-800">
                    {appointment.priority === 'emergency'
                      ? '🚨 Cấp cứu'
                      : appointment.priority === 'urgent'
                      ? '⚡ Ưu tiên'
                      : 'Bình thường'}
                  </span>
                </div>
              </div>

              {/* Mô tả triệu chứng / Lý do khám */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[11px] mb-1">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isFollowUp ? 'Ghi chú / Lý do ca tái khám:' : 'Lý do khám / Triệu chứng đăng ký:'}</span>
                </div>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {appointment.reasonForVisit ||
                    (isFollowUp ? 'Tái khám theo chỉ định của Bác sĩ chuyên khoa' : 'Khám bệnh theo yêu cầu')}
                </p>
              </div>
            </div>

            {/* PHẦN 3: ĐỐI VỚI LỊCH TÁI KHÁM -> CHI TIẾT KẾT QUẢ ĐÃ KHÁM CỦA LƯỢT KHÁM BAN ĐẦU */}
            {isFollowUp && (
              <div className="p-4 bg-gradient-to-br from-purple-50/70 to-indigo-50/40 rounded-2xl border-2 border-purple-200 shadow-xs space-y-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-purple-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-700" />
                    <span className="font-extrabold text-purple-950 text-sm">
                      Chi Tiết Kết Quả Đã Khám Ở Lượt Khám Ban Đầu (Cơ Sở Chỉ Định Tái Khám)
                    </span>
                  </div>
                  {sourceEncounter && (
                    <span className="font-mono text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                      Mã ca: {sourceEncounter.encounterCode}
                    </span>
                  )}
                </div>

                {loadingSource ? (
                  <div className="py-8 text-center space-y-2">
                    <Loader2 className="w-6 h-6 text-purple-600 animate-spin mx-auto" />
                    <p className="text-[11px] text-purple-700 font-medium">Đang tải hồ sơ lượt khám ban đầu...</p>
                  </div>
                ) : sourceEncounter ? (
                  <div className="space-y-3">
                    {/* Bác sĩ & Thời gian khám trước */}
                    <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-purple-100">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Bác sĩ khám ban đầu:</span>
                        <strong className="text-slate-900 font-bold">
                          {sourceEncounter.doctor?.fullName || 'Bác sĩ chuyên khoa'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Thời gian ca khám:</span>
                        <span className="text-slate-800 font-medium">
                          {sourceEncounter.arrivedAt
                            ? new Date(sourceEncounter.arrivedAt).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : '---'}
                        </span>
                      </div>
                    </div>

                    {/* Kết luận chẩn đoán chính thức (ICD-10) */}
                    {sourceDiagnoses.length > 0 && (
                      <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-2">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <ClipboardList className="w-3.5 h-3.5 text-purple-600" />
                          <span>Chẩn đoán kết luận từ Bác sĩ (ICD-10):</span>
                        </span>
                        <div className="space-y-1.5">
                          {sourceDiagnoses.map((diag) => (
                            <div
                              key={diag.diagnosisId}
                              className="flex items-start gap-2 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100"
                            >
                              <span className="font-mono font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200 shrink-0">
                                {diag.icd10Code}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">{diag.diagnosisName}</span>
                                  {diag.isPrimary && (
                                    <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.2 rounded">
                                      Chính
                                    </span>
                                  )}
                                </div>
                                {diag.notes && <p className="text-[11px] text-slate-500 mt-0.5">{diag.notes}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Kế hoạch điều trị & Lời dặn từ Bác sĩ */}
                    {sourceTreatment && (
                      <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-2">
                        {sourceTreatment.followUpRequired && (
                          <div className="p-2.5 bg-purple-100/70 rounded-lg border border-purple-200">
                            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                              Chỉ định tái khám từ Bác sĩ:
                            </span>
                            <p className="text-purple-950 font-bold text-xs mt-0.5">
                              Bác sĩ yêu cầu tái khám theo dõi
                              {sourceTreatment.followUpIntervalDays
                                ? ` sau ${sourceTreatment.followUpIntervalDays} ngày`
                                : ''}
                            </p>
                          </div>
                        )}

                        {sourceTreatment.treatmentPlan && (
                          <div>
                            <span className="text-slate-400 block text-[11px] font-medium">Kế hoạch điều trị:</span>
                            <p className="text-slate-800 leading-relaxed font-medium bg-slate-50 p-2 rounded-lg border border-slate-100 mt-0.5">
                              {sourceTreatment.treatmentPlan}
                            </p>
                          </div>
                        )}

                        {sourceTreatment.conditionExplanation && (
                          <div>
                            <span className="text-slate-400 block text-[11px] font-medium">Giải thích bệnh lý:</span>
                            <p className="text-slate-700 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 mt-0.5">
                              {sourceTreatment.conditionExplanation}
                            </p>
                          </div>
                        )}

                        {(sourceTreatment.nutritionAdvice || sourceTreatment.lifestyleAdvice) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {sourceTreatment.nutritionAdvice && (
                              <div className="p-2 bg-emerald-50/70 rounded-lg border border-emerald-100">
                                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                                  Lời dặn dinh dưỡng:
                                </span>
                                <p className="text-slate-700 mt-0.5 text-[11px]">{sourceTreatment.nutritionAdvice}</p>
                              </div>
                            )}
                            {sourceTreatment.lifestyleAdvice && (
                              <div className="p-2 bg-sky-50/70 rounded-lg border border-sky-100">
                                <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                                  Lời dặn vận động & lối sống:
                                </span>
                                <p className="text-slate-700 mt-0.5 text-[11px]">{sourceTreatment.lifestyleAdvice}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Đơn thuốc đã cấp ở lần khám ban đầu */}
                    {sourcePrescriptions.length > 0 && sourcePrescriptions.some((p) => p.items?.length > 0) && (
                      <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-2">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-teal-600" />
                          <span>Đơn thuốc đã cấp tại lần khám ban đầu:</span>
                        </span>
                        <div className="space-y-1.5">
                          {sourcePrescriptions.map((pres) =>
                            pres.items?.map((item) => (
                              <div
                                key={item.prescriptionItemId}
                                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px]"
                              >
                                <div>
                                  <strong className="text-slate-900 text-xs">
                                    {(item as any).drug?.brandName || (item as any).drug?.genericName || 'Thuốc'}
                                  </strong>
                                  <span className="text-slate-500 ml-2">
                                    {item.dosage} • {item.frequency}
                                  </span>
                                  {item.instruction && (
                                    <p className="text-slate-400 text-[10px] italic">{item.instruction}</p>
                                  )}
                                </div>
                                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                  SL: {item.quantity}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sinh hiệu đã ghi nhận ở đợt khám ban đầu */}
                    {(pulse || bpSys || temp || spo2) && (
                      <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                          <span>Sinh hiệu ghi nhận tại đợt khám ban đầu:</span>
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          {bpSys && (
                            <div className="p-2 bg-slate-50 rounded-lg text-center border border-slate-100">
                              <span className="text-[10px] text-slate-400 block">Huyết áp</span>
                              <strong className="text-slate-800 text-xs font-mono">
                                {bpSys}/{bpDia || '--'} mmHg
                              </strong>
                            </div>
                          )}
                          {pulse && (
                            <div className="p-2 bg-slate-50 rounded-lg text-center border border-slate-100">
                              <span className="text-[10px] text-slate-400 block">Mạch</span>
                              <strong className="text-slate-800 text-xs font-mono">{pulse} bpm</strong>
                            </div>
                          )}
                          {spo2 && (
                            <div className="p-2 bg-slate-50 rounded-lg text-center border border-slate-100">
                              <span className="text-[10px] text-slate-400 block">SpO2</span>
                              <strong className="text-slate-800 text-xs font-mono">{spo2}%</strong>
                            </div>
                          )}
                          {temp && (
                            <div className="p-2 bg-slate-50 rounded-lg text-center border border-slate-100">
                              <span className="text-[10px] text-slate-400 block">Thân nhiệt</span>
                              <strong className="text-slate-800 text-xs font-mono">{temp}°C</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-purple-100 text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Lịch tái khám được chỉ định theo đơn và bệnh án điện tử từ đợt khám trước của Bác sĩ.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In thông tin phiếu hẹn</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-md shadow-slate-900/10"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

