import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  Stethoscope,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Printer,
  CheckCircle2,
  Ticket,
  Loader2,
  XCircle,
  CalendarClock,
  Copy,
  Check,
  History,
  HeartPulse,
  ClipboardList,
  Info
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
import { formatTicketCode, getQueueStatusLabel, getLocalDateString } from '../../../utils/booking.utils';

interface AppointmentDetailModalProps {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onCancelRequest?: (appointment: AppointmentItem) => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointmentId,
  isOpen,
  onClose,
  onCancelRequest,
}) => {
  const [appointment, setAppointment] = useState<AppointmentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Source Encounter details for Follow-up appointments
  const [sourceEncounter, setSourceEncounter] = useState<EncounterItem | null>(null);
  const [sourceDiagnoses, setSourceDiagnoses] = useState<DiagnosisConclusionItem[]>([]);
  const [sourceTreatment, setSourceTreatment] = useState<TreatmentConsultationItem | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);

  // Copy code state
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Reschedule state
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !appointmentId) return;

    setShowReschedule(false);
    setRescheduleDate('');
    setRescheduleReason('');
    setRescheduleError(null);
    setSourceEncounter(null);
    setSourceDiagnoses([]);
    setSourceTreatment(null);

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await appointmentService.getAppointmentById(appointmentId);
        setAppointment(data);

        // Fetch source encounter details if this is a follow-up appointment
        const sourceEncId = (data as any)?.sourceEncounterId || (data as any)?.sourceEncounter?.encounterId;
        if (sourceEncId) {
          setLoadingSource(true);
          Promise.allSettled([
            encounterService.getEncounterById(sourceEncId),
            postTestConsultationService.getDiagnosisConclusions(sourceEncId),
            postTestConsultationService.getTreatmentConsultation(sourceEncId),
          ])
            .then(([encRes, diagRes, treatRes]) => {
              if (encRes.status === 'fulfilled') setSourceEncounter(encRes.value);
              if (diagRes.status === 'fulfilled') setSourceDiagnoses(diagRes.value || []);
              if (treatRes.status === 'fulfilled') setSourceTreatment(treatRes.value);
            })
            .catch((err) => {
              console.error('Không thể tải chi tiết ca khám gốc:', err);
            })
            .finally(() => {
              setLoadingSource(false);
            });
        }
      } catch (err: any) {
        setError(err?.message || 'Không thể tải chi tiết lịch hẹn');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, appointmentId]);

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment || !rescheduleDate) return;
    setIsRescheduling(true);
    setRescheduleError(null);
    try {
      const updated = await appointmentService.rescheduleAppointment(appointment.appointmentId, {
        appointmentDate: rescheduleDate,
        reason: rescheduleReason.trim() || undefined,
      });
      setAppointment(updated);
      setShowReschedule(false);
      setRescheduleDate('');
      setRescheduleReason('');
    } catch (err: any) {
      setRescheduleError(err?.message || 'Không thể đổi lịch tái khám.');
    } finally {
      setIsRescheduling(false);
    }
  };

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
        return <Badge variant="success" size="md">Đã check-in</Badge>;
      case 'in_progress':
        return <Badge variant="info" size="md">Đang khám</Badge>;
      case 'completed':
        return <Badge variant="success" size="md">Đã hoàn thành</Badge>;
      case 'cancelled':
        return <Badge variant="neutral" size="md">Đã hủy</Badge>;
      case 'no_show':
        return <Badge variant="critical" size="md">Vắng mặt</Badge>;
      default:
        return <Badge variant="neutral" size="md">{status || 'N/A'}</Badge>;
    }
  };

  const isCancellable = appointment?.status === 'pending' || appointment?.status === 'confirmed';

  // Timeline step active indicator
  const steps = [
    { key: 'pending', label: 'Đã đặt lịch' },
    { key: 'confirmed', label: 'Lễ tân xác nhận' },
    { key: 'checked_in', label: 'Check-in tại viện' },
    { key: 'in_progress', label: 'Bác sĩ khám' },
    { key: 'completed', label: 'Hoàn thành' },
  ];

  const getStepIndex = (status?: string) => {
    if (status === 'pending') return 0;
    if (status === 'confirmed') return 1;
    if (status === 'checked_in') return 2;
    if (status === 'in_progress') return 3;
    if (status === 'completed') return 4;
    return -1;
  };

  const currentStep = getStepIndex(appointment?.status);

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

  const renderQueueTicketCard = (isMobileView = false) => {
    if (!appointment?.queueTicket) return null;

    return (
      <div
        className={`bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center shadow-lg space-y-2 ${isMobileView ? 'rounded-2xl p-4' : 'rounded-3xl p-5'
          }`}
      >
        <div className="flex items-center justify-center gap-1.5 text-blue-200 text-xs font-semibold">
          <Ticket className="w-4 h-4" />
          <span>Số Thứ Tự Hàng Đợi</span>
        </div>
        <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider py-1 text-amber-300">
          {formatTicketCode(appointment.queueTicket)}
        </div>
        <span className="inline-block px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-medium">
          Trạng thái: {getQueueStatusLabel(appointment.queueTicket.status || appointment.queueTicket.queueStatus)}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 md:p-8 shadow-2xl border border-slate-100 my-auto space-y-5 sm:space-y-6 max-h-[92vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                {isFollowUp ? (
                  <>
                    <Stethoscope className="w-5 h-5 text-purple-600" />
                    <span>Chi Tiết Lịch Tái Khám</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5 text-sky-600" />
                    <span>Chi Tiết Lịch Hẹn Khám</span>
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
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>Mã lịch hẹn:</span>
                <span
                  onClick={() => handleCopyCode(appointment.appointmentCode)}
                  className="font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 cursor-pointer transition-colors border border-blue-200/60"
                  title="Bấm để sao chép mã lịch hẹn"
                >
                  <span>{appointment.appointmentCode}</span>
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-blue-400 hover:text-blue-600" />
                  )}
                </span>
                {copiedCode && (
                  <span className="text-[11px] text-emerald-600 font-bold animate-in fade-in">
                    (Đã chép)
                  </span>
                )}
                <span className="text-slate-300">•</span>
                <span>
                  Kênh:{' '}
                  <strong className="text-slate-700 inline-flex items-center gap-1 align-middle ml-1">
                    {appointment.bookingChannel === 'online' ? (
                      <>
                        <img src="/images/online_icon.png" alt="Online" className="w-3.5 h-3.5 object-contain" />
                        <span>Trực tuyến (Online)</span>
                      </>
                    ) : appointment.bookingChannel === 'doctor_follow_up' ? (
                      <>
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-purple-700 font-bold">Bác sĩ chỉ định hẹn tái khám</span>
                      </>
                    ) : (
                      <>
                        <img src="/images/counter_icon.png" alt="Tại quầy" className="w-3.5 h-3.5 object-contain" />
                        <span>Tại quầy</span>
                      </>
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
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Đang tải chi tiết hồ sơ lịch hẹn...</p>
          </div>
        ) : error || !appointment ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error || 'Không tìm thấy thông tin lịch hẹn'}</p>
          </div>
        ) : (
          <>
            {/* TIMELINE STEPPER (Only for non-cancelled/no_show) */}
            {appointment.status !== 'cancelled' && appointment.status !== 'no_show' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Tiến trình lịch khám</p>
                <div className="grid grid-cols-5 gap-2 relative">
                  {steps.map((step, idx) => {
                    const isDone = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={step.key} className="flex flex-col items-center text-center space-y-1.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isDone
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] leading-tight font-semibold ${isCurrent ? 'text-blue-700 font-bold' : isDone ? 'text-slate-800' : 'text-slate-400'
                            }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CANCELLED BANNER */}
            {appointment.status === 'cancelled' && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-900">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Lịch hẹn này đã bị hủy</span>
                </div>
                {appointment.cancelReason && (
                  <p className="text-rose-700">Lý do hủy: <strong>{appointment.cancelReason}</strong></p>
                )}
                {appointment.cancelledAt && (
                  <p className="text-[11px] text-rose-500">
                    Thời gian hủy: {new Date(appointment.cancelledAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            )}

            {/* MOBILE ONLY: SỐ THỨ TỰ HÀNG ĐỢI */}
            {appointment.queueTicket && (
              <div className="block md:hidden">
                {renderQueueTicketCard(true)}
              </div>
            )}

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* LEFT 2 COLUMNS: CLINICAL & PATIENT DETAILS */}
              <div className="md:col-span-2 space-y-4 text-xs">

                {/* 1. HỒ SƠ BỆNH NHÂN (ĐẦY ĐỦ) */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <User className="w-4 h-4 text-blue-600" />
                      <span>Hồ Sơ Bệnh Nhân</span>
                    </div>
                    {appointment.patient?.identityVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Đã xác thực CCCD
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Họ và tên:</span>
                      <strong className="text-slate-900 text-sm">{appointment.patient?.fullName || 'Bệnh nhân'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Mã hồ sơ BN:</span>
                      <strong className="font-mono text-blue-700">{appointment.patient?.patientCode || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Ngày sinh:</span>
                      <span>
                        {appointment.patient?.dateOfBirth
                          ? new Date(appointment.patient.dateOfBirth).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Giới tính:</span>
                      <span>
                        {appointment.patient?.gender === 'male'
                          ? 'Nam'
                          : appointment.patient?.gender === 'female'
                            ? 'Nữ'
                            : 'Khác'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Số điện thoại:</span>
                      <span className="font-medium text-slate-800">{appointment.patient?.phoneNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Số CCCD / CMND:</span>
                      <span className="font-mono text-slate-800">{appointment.patient?.identityNumber || 'N/A'}</span>
                    </div>
                    {appointment.patient?.insuranceNumber && (
                      <div>
                        <span className="text-slate-400 block text-[11px]">Mã thẻ BHYT:</span>
                        <span className="font-mono text-emerald-700 font-bold">{appointment.patient.insuranceNumber}</span>
                      </div>
                    )}
                    {appointment.patient?.email && (
                      <div>
                        <span className="text-slate-400 block text-[11px]">Email:</span>
                        <span className="text-slate-800 truncate block" title={appointment.patient.email}>
                          {appointment.patient.email}
                        </span>
                      </div>
                    )}
                    {appointment.patient?.ethnicity && (
                      <div>
                        <span className="text-slate-400 block text-[11px]">Dân tộc:</span>
                        <span>{appointment.patient.ethnicity}</span>
                      </div>
                    )}
                    {appointment.patient?.address && (
                      <div className="col-span-2 sm:col-span-3">
                        <span className="text-slate-400 block text-[11px]">Địa chỉ thường trú:</span>
                        <span className="text-slate-800 font-medium">{appointment.patient.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. THÔNG TIN LỊCH HẸN KHÁM HIỆN TẠI */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Thông Tin Ca Khám {isFollowUp ? 'Tái Khám' : 'Đăng Ký'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Bác sĩ phụ trách:</span>
                      <strong className="text-blue-900 text-sm">
                        {appointment.doctor?.fullName || appointment.doctor?.user?.fullName || 'Bác sĩ chuyên khoa Tim mạch'}
                      </strong>
                    </div>
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
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">Khung giờ slot tiếp đón:</span>
                      <strong className="text-blue-800 text-sm">
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
                  </div>

                  {/* Lý do khám đăng ký ban đầu */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[11px] mb-1">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      <span>{isFollowUp ? 'Lý do đăng ký / Ghi chú ca tái khám:' : 'Mô tả triệu chứng / Lý do đến khám:'}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {appointment.reasonForVisit ||
                        (isFollowUp ? 'Tái khám theo chỉ định của Bác sĩ chuyên khoa' : 'Khám bệnh tổng quát theo yêu cầu')}
                    </p>
                  </div>
                </div>

                {/* 3. ĐỐI VỚI LỊCH TÁI KHÁM: HIỂN THỊ CHI TIẾT LƯỢT KHÁM BAN ĐẦU ĐẦY ĐỦ */}
                {isFollowUp && (
                  <div className="p-4 bg-gradient-to-br from-purple-50/60 to-indigo-50/40 rounded-2xl border-2 border-purple-200/90 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between border-b border-purple-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-purple-700" />
                        <span className="font-extrabold text-purple-950 text-xs sm:text-sm">
                          Hồ Sơ Lượt Khám Ban Đầu (Cơ Sở Chỉ Định Tái Khám)
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
                      <div className="space-y-3 text-xs">
                        {/* A. Bác sĩ & Thời gian ca khám ban đầu */}
                        <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-purple-100">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Bác sĩ khám ban đầu:</span>
                            <strong className="text-slate-800">
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

                        {/* B. Kết luận chẩn đoán chính thức */}
                        {sourceDiagnoses.length > 0 && (
                          <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-2">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                              <ClipboardList className="w-3.5 h-3.5 text-purple-600" />
                              <span>Kết luận chẩn đoán của Bác sĩ:</span>
                            </span>
                            <div className="space-y-1.5">
                              {sourceDiagnoses.map((diag) => (
                                <div
                                  key={diag.diagnosisId}
                                  className="flex items-start gap-2 bg-purple-50/50 p-2 rounded-lg border border-purple-100 text-xs"
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

                        {/* C. Chỉ định & Kế hoạch điều trị từ bác sĩ */}
                        {sourceTreatment && (
                          <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-2">
                            {sourceTreatment.followUpRequired && (
                              <div className="p-2 bg-purple-100/60 rounded-lg border border-purple-200">
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
                                <span className="text-slate-400 block text-[11px] font-medium">Giải thích bệnh học & tình trạng:</span>
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
                                      Chế độ dinh dưỡng:
                                    </span>
                                    <p className="text-slate-700 mt-0.5 text-[11px]">{sourceTreatment.nutritionAdvice}</p>
                                  </div>
                                )}
                                {sourceTreatment.lifestyleAdvice && (
                                  <div className="p-2 bg-sky-50/70 rounded-lg border border-sky-100">
                                    <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                                      Chế độ vận động & lối sống:
                                    </span>
                                    <p className="text-slate-700 mt-0.5 text-[11px]">{sourceTreatment.lifestyleAdvice}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* D. Sinh hiệu ghi nhận ở ca khám ban đầu */}
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
                        <span>
                          Lịch tái khám được chỉ định theo đơn và bệnh án điện tử từ đợt khám trước của Bác sĩ. Vui lòng mang theo kết quả khám bệnh hoặc sổ khám trước đó khi đến viện.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: APPOINTMENT SUMMARY & QUEUE TICKET */}
              <div className="space-y-4 flex flex-col justify-between">

                {/* DESKTOP ONLY: SỐ THỨ TỰ HÀNG ĐỢI */}
                {appointment.queueTicket && (
                  <div className="hidden md:block">
                    {renderQueueTicketCard(false)}
                  </div>
                )}

                {/* GUIDANCE CARD */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-[11px] text-blue-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lưu ý khi đi khám:</span>
                  </p>
                  <p className="leading-relaxed text-blue-800">
                    Vui lòng có mặt tại viện trước giờ hẹn <strong>15 phút</strong> và mang theo CCCD/BHYT gốc cùng các kết quả cận lâm sàng của lần khám trước để đối chiếu.
                  </p>
                </div>

                {/* MODAL BOTTOM ACTIONS */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handlePrint}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In phiếu hẹn khám</span>
                  </button>

                  {/* Tự đổi lịch hẹn tái khám (dành cho ca tái khám follow_up) */}
                  {appointment?.appointmentType === 'follow_up' && (appointment?.status === 'pending' || appointment?.status === 'confirmed') && (
                    <div className="space-y-2">
                      {!showReschedule ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowReschedule(true);
                            setRescheduleDate(appointment.appointmentDate?.slice(0, 10) || getLocalDateString());
                          }}
                          className="w-full py-2.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <CalendarClock className="w-3.5 h-3.5 text-teal-600" />
                          <span>Đổi ngày hẹn tái khám</span>
                        </button>
                      ) : (
                        <form onSubmit={handleRescheduleSubmit} className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2.5 text-xs text-left">
                          <div className="font-bold text-teal-900 flex items-center gap-1.5">
                            <CalendarClock className="w-4 h-4 text-teal-600" />
                            <span>Đổi lịch hẹn tái khám:</span>
                          </div>

                          {rescheduleError && (
                            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px]">
                              {rescheduleError}
                            </div>
                          )}

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Chọn ngày hẹn tái khám mới:
                            </label>
                            <input
                              type="date"
                              min={getLocalDateString()}
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                              required
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Lý do đổi lịch (tùy chọn):
                            </label>
                            <input
                              type="text"
                              value={rescheduleReason}
                              onChange={(e) => setRescheduleReason(e.target.value)}
                              placeholder="Bận công việc, trùng lịch..."
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowReschedule(false)}
                              disabled={isRescheduling}
                              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              disabled={isRescheduling}
                              className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                            >
                              {isRescheduling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Xác nhận</span>}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {isCancellable && onCancelRequest && (
                    <button
                      onClick={() => onCancelRequest(appointment)}
                      className="w-full py-2.5 px-4 border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Hủy lịch hẹn này</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          </>
        )}

        {/* MODAL FOOTER */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-slate-900/10"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
