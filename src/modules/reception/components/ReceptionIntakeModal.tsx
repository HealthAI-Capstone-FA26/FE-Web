import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Stethoscope,
  ShieldCheck,
  CreditCard,
  Baby,
  User,
  FileCheck2,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  Flame,
  Check,
  RefreshCw,
  PenTool,
  Eraser,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import { type QueueTicketItem, queueTicketService } from '../../../services/queue/queue-ticket.service';
import { type DoctorResponse } from '../../../services/doctor/doctor.service';
import { chiefComplaintService } from '../../../services/reception/chief-complaint.service';
import {
  encounterService,
  type VerificationMethod,
  type VerificationStatus,
} from '../../../services/encounter/encounter.service';
import { consentService, type ConsentPolicyItem, type ConsentItem } from '../../../services/consent/consent.service';
import { patientService, type PatientResponse } from '../../../services/patient/patient.service';
import { appointmentService, type AppointmentItem } from '../../../services/appointment/appointment.service';
import { getLocalDateString } from '../../../utils/booking.utils';

const QUICK_SYMPTOM_TAGS = [
  'Đau đầu / Chóng mặt',
  'Sốt cao / Rét run',
  'Đau ngực / Khó thở',
  'Đau bụng âm ỉ',
  'Buồn nôn / Nôn',
  'Ho khan / Đau họng',
  'Mệt mỏi / Suy nhược',
  'Đau lưng / Mỏi khớp',
];

export interface IntakeData {
  patientId?: string;
  chiefComplaint: {
    reasonForVisit: string;
    symptoms?: string;
    symptomOnsetDate?: string;
    painLevel?: number;
    inputChannel: 'receptionist_assisted';
  };
  identityVerification: {
    verificationMethod: VerificationMethod;
    verificationStatus: VerificationStatus;
    mismatchNotes?: string;
  };
  consents: {
    policyIds: string[];
    signatureType: 'checkbox_click' | 'e_signature_draw';
    signatureDataUrl?: string;
    witnessedAtCounter: boolean;
  };
}

export interface IntakeSuccessResult {
  queueTicket?: QueueTicketItem;
  appointment?: any;
  invoice?: any;
  encounterId?: string;
  intakeData?: IntakeData;
}

interface ReceptionIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: QueueTicketItem | null;
  doctors: DoctorResponse[];
  onSuccess: (result: IntakeSuccessResult | string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const ReceptionIntakeModal: React.FC<ReceptionIntakeModalProps> = ({
  isOpen,
  onClose,
  ticket,
  doctors,
  onSuccess,
  showToast,
}) => {
  // State form
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [reasonForVisit, setReasonForVisit] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [symptomOnsetDate, setSymptomOnsetDate] = useState<string>('');
  const [painLevel, setPainLevel] = useState<number>(0);
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'emergency'>('normal');

  // Phân biệt lượt khám Online (Prefix A) hay Vãng lai (Prefix B / chưa có appointment)
  const isWalkIn = !ticket?.appointment || ticket.ticketPrefix === 'B';
  const [walkinMode, setWalkinMode] = useState<'search' | 'online_appointment' | 'create'>('search');
  const [searchPatientKeyword, setSearchPatientKeyword] = useState<string>('');
  const [searchResults, setSearchResults] = useState<PatientResponse[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState<boolean>(false);
  const [selectedWalkinPatient, setSelectedWalkinPatient] = useState<PatientResponse | null>(null);

  // Tìm kiếm Lịch hẹn Online đã đặt trước
  const [searchAppointmentKeyword, setSearchAppointmentKeyword] = useState<string>('');
  const [isSearchingAppointments, setIsSearchingAppointments] = useState<boolean>(false);
  const [appointmentResults, setAppointmentResults] = useState<AppointmentItem[]>([]);
  const [selectedOnlineAppointment, setSelectedOnlineAppointment] = useState<AppointmentItem | null>(null);

  // Form tạo nhanh bệnh nhân mới (Walk-in)
  const [newFullName, setNewFullName] = useState<string>('');
  const [newPhoneNumber, setNewPhoneNumber] = useState<string>('');
  const [newDateOfBirth, setNewDateOfBirth] = useState<string>('');
  const [newGender, setNewGender] = useState<'male' | 'female' | 'other'>('male');
  const [newIdentityNumber, setNewIdentityNumber] = useState<string>('');
  const [newInsuranceNumber, setNewInsuranceNumber] = useState<string>('');
  const [newAddress, setNewAddress] = useState<string>('');

  // State Xác Minh Danh Tính
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('national_id_card');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('verified');
  const [mismatchNotes, setMismatchNotes] = useState<string>('');
  const [isPediatricPatient, setIsPediatricPatient] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State Cam Kết Đồng Ý Y Tế (Consent)
  const [policies, setPolicies] = useState<ConsentPolicyItem[]>([]);
  const [activeConsents, setActiveConsents] = useState<ConsentItem[]>([]);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  const [signatureType, setSignatureType] = useState<'checkbox_click' | 'e_signature_draw'>('checkbox_click');
  const [witnessedAtCounter, setWitnessedAtCounter] = useState<boolean>(true);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Danh sách bác sĩ khả dụng
  const availableDoctors = useMemo(() => {
    const activeDocs = doctors.filter((d) => d.isActive !== false);
    if (ticket?.departmentId) {
      const byDept = activeDocs.filter((d) =>
        d.doctorDepartments?.some((dept) => dept.departmentId === ticket.departmentId)
      );
      if (byDept.length > 0) return byDept;
    }
    return activeDocs;
  }, [doctors, ticket?.departmentId]);

  useEffect(() => {
    if (isOpen && ticket) {
      setSelectedDoctorId(ticket.appointment?.doctorId || '');
      setPriority(ticket.appointment?.priority as any || 'normal');
      setReasonForVisit(ticket.appointment?.reasonForVisit || '');
      setSymptoms('');
      setSymptomOnsetDate(getLocalDateString());
      setPainLevel(0);
      setSignatureType('checkbox_click');
      setWitnessedAtCounter(true);
      setSignatureDataUrl('');

      // Reset walkin states
      setWalkinMode('search');
      setSearchPatientKeyword('');
      setSearchResults([]);
      setIsSearchingPatients(false);
      setSelectedWalkinPatient(null);
      setSearchAppointmentKeyword('');
      setAppointmentResults([]);
      setIsSearchingAppointments(false);
      setSelectedOnlineAppointment(null);
      setNewFullName('');
      setNewPhoneNumber('');
      setNewDateOfBirth('');
      setNewGender('male');
      setNewIdentityNumber('');
      setNewInsuranceNumber('');
      setNewAddress('');

      // Tính tuổi bệnh nhân để tự động nhận diện Bệnh Nhi nhỏ tuổi (< 15 tuổi)
      const dob = ticket.appointment?.patient?.dateOfBirth;
      let isChild = false;
      if (dob) {
        const birthYear = new Date(dob).getFullYear();
        const currentYear = new Date().getFullYear();
        if (!isNaN(birthYear)) {
          isChild = currentYear - birthYear < 15;
        }
      }
      setIsPediatricPatient(isChild);
      setVerificationMethod(isChild ? 'health_insurance_card' : 'national_id_card');
      setVerificationStatus('verified');
      setMismatchNotes('');

      // Nạp danh sách chính sách Consent
      consentService.getEffectivePolicies()
        .then((fetchedPolicies) => {
          setPolicies(fetchedPolicies);
          setSelectedPolicyIds(fetchedPolicies.map((p) => p.policyId));
        })
        .catch((err) => console.warn('Lỗi tải danh sách policy:', err));

      // Nạp active consent nếu đã có patientId
      const patientId = ticket.appointment?.patientId;
      if (patientId) {
        consentService.getConsents({ patientId, status: 'active' })
          .then((fetchedConsents) => {
            setActiveConsents(fetchedConsents);
          })
          .catch((err) => console.warn('Lỗi tải active consent:', err));
      }
    }
  }, [isOpen, ticket, doctors]);

  const handleSearchPatient = async () => {
    if (!searchPatientKeyword.trim()) {
      showToast('Vui lòng nhập SĐT, CCCD hoặc Tên bệnh nhân', 'info');
      return;
    }
    setIsSearchingPatients(true);
    try {
      const data = await patientService.getAllPatients(searchPatientKeyword.trim());
      setSearchResults(Array.isArray(data) ? data : []);
      if (!data || data.length === 0) {
        showToast('Không tìm thấy hồ sơ nào phù hợp', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi tìm kiếm bệnh nhân', 'error');
    } finally {
      setIsSearchingPatients(false);
    }
  };

  const handleSearchOnlineAppointment = async () => {
    if (!searchAppointmentKeyword.trim()) {
      showToast('Vui lòng nhập SĐT, CCCD, Họ tên hoặc Mã lịch hẹn (APP-...)', 'info');
      return;
    }
    setIsSearchingAppointments(true);
    try {
      const data = await appointmentService.getAppointments({
        search: searchAppointmentKeyword.trim(),
      }, true);
      const todayStr = getLocalDateString();
      const activeAppts = (Array.isArray(data) ? data : []).filter(
        (a) => (a.status === 'confirmed' || a.status === 'pending') && (a.appointmentDate || '').slice(0, 10) === todayStr
      );
      setAppointmentResults(activeAppts);
      if (activeAppts.length === 0) {
        showToast('Không tìm thấy lịch hẹn online nào trong ngày hôm nay (hoặc lịch đã hoàn tất/hủy)', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi tìm kiếm lịch hẹn online', 'error');
    } finally {
      setIsSearchingAppointments(false);
    }
  };

  const handleSelectOnlineAppointment = (appt: AppointmentItem) => {
    setSelectedOnlineAppointment(appt);
    setAppointmentResults([]);
    if (appt.doctorId) {
      setSelectedDoctorId(appt.doctorId);
    }
    if (appt.reasonForVisit) {
      setReasonForVisit(appt.reasonForVisit);
    }
    const dob = appt.patient?.dateOfBirth;
    let isChild = false;
    if (dob) {
      const birthYear = new Date(dob).getFullYear();
      const currentYear = new Date().getFullYear();
      if (!isNaN(birthYear)) {
        isChild = currentYear - birthYear < 15;
      }
    }
    setIsPediatricPatient(isChild);
    setVerificationMethod(isChild ? 'health_insurance_card' : 'national_id_card');

    const pid = appt.patientId || (appt as any).suggestedPatientId;
    if (pid) {
      consentService.getConsents({ patientId: pid, status: 'active' })
        .then((fetchedConsents) => setActiveConsents(fetchedConsents))
        .catch((err) => console.warn('Lỗi tải active consent:', err));
    }
  };

  // Xử lý vẽ chữ ký điện tử trên Canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f766e';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignatureDataUrl('');
  };

  if (!isOpen || !ticket) return null;

  const formatTicketCode = (t: QueueTicketItem) => {
    const num = String(t.ticketNumber).padStart(3, '0');
    return `${t.ticketPrefix}${num}`;
  };

  const handleToggleQuickSymptom = (tag: string) => {
    setSymptoms((prev) => {
      if (!prev) return tag;
      if (prev.includes(tag)) {
        return prev
          .replace(tag, '')
          .replace(/,\s*,/g, ', ')
          .replace(/^,\s*|,\s*$/g, '')
          .trim();
      }
      return `${prev}, ${tag}`;
    });
  };

  const handleConfirmIntakeAndServe = async () => {
    if (!ticket) return;

    // 1. Kiểm tra Bác sĩ khám
    if (!selectedDoctorId) {
      showToast('Vui lòng chọn bác sĩ khám trước khi hoàn tất tiếp nhận', 'error');
      return;
    }

    // 2. Kiểm tra Bệnh nhân đối với lượt khám vãng lai (Prefix B)
    if (isWalkIn) {
      if (walkinMode === 'online_appointment') {
        if (!selectedOnlineAppointment) {
          showToast('Vui lòng tìm và chọn một lịch hẹn online đã đặt', 'error');
          return;
        }
      } else if (walkinMode === 'search') {
        if (!selectedWalkinPatient) {
          showToast('Vui lòng tìm và chọn một hồ sơ bệnh nhân hoặc chuyển sang tab khác', 'error');
          return;
        }
      } else {
        if (!newFullName.trim()) {
          showToast('Vui lòng nhập họ tên bệnh nhân', 'error');
          return;
        }
        if (!newPhoneNumber.trim()) {
          showToast('Vui lòng nhập số điện thoại bệnh nhân', 'error');
          return;
        }
        if (!newDateOfBirth) {
          showToast('Vui lòng chọn ngày sinh bệnh nhân', 'error');
          return;
        }
      }
    }

    // 3. Kiểm tra Lý do khám (Chief Complaint)
    const finalReason = reasonForVisit.trim() || symptoms.trim() || ticket.appointment?.reasonForVisit?.trim() || 'Khám bệnh';

    setIsSubmitting(true);
    try {
      const payload: any = {
        doctorId: selectedDoctorId,
        reasonForVisit: finalReason,
        symptoms: symptoms.trim() || undefined,
        priority: priority,
      };

      if (isWalkIn) {
        if (walkinMode === 'online_appointment' && selectedOnlineAppointment) {
          payload.appointmentId = selectedOnlineAppointment.appointmentId;
          const pid = selectedOnlineAppointment.patientId || (selectedOnlineAppointment as any).suggestedPatientId;
          if (pid) {
            payload.patientId = pid;
          } else {
            showToast('Lịch hẹn online này chưa có hồ sơ bệnh nhân. Vui lòng tạo hồ sơ cho bệnh nhân trước!', 'error');
            setIsSubmitting(false);
            return;
          }
        } else if (walkinMode === 'search' && selectedWalkinPatient) {
          payload.patientId = selectedWalkinPatient.patientId;
        } else {
          payload.patient = {
            fullName: newFullName.trim(),
            phoneNumber: newPhoneNumber.trim(),
            dateOfBirth: newDateOfBirth,
            gender: newGender,
            identityNumber: newIdentityNumber.trim() || undefined,
            insuranceNumber: newInsuranceNumber.trim() || undefined,
            address: newAddress.trim() || undefined,
          };
        }
      }

      // 1. Chuyển trạng thái ticket -> done, tạo appointment & lập invoice phí khám
      const res = await queueTicketService.serveDoneTicket(ticket.ticketId, payload);
      const code = formatTicketCode(ticket);

      showToast(
        `Đã tiếp nhận hồ sơ số ${code}, vui lòng thu phí khám ban đầu!`,
        'success'
      );
      const intakeData: IntakeData = {
        patientId: res.appointment?.patientId || payload.patientId || patient?.patientId,
        chiefComplaint: {
          reasonForVisit: finalReason,
          symptoms: symptoms.trim() || undefined,
          symptomOnsetDate: symptomOnsetDate || undefined,
          painLevel: painLevel,
          inputChannel: 'receptionist_assisted',
        },
        identityVerification: {
          verificationMethod,
          verificationStatus,
          mismatchNotes: mismatchNotes.trim() || undefined,
        },
        consents: {
          policyIds: selectedPolicyIds,
          signatureType,
          signatureDataUrl: signatureDataUrl || undefined,
          witnessedAtCounter,
        },
      };

      onSuccess({
        queueTicket: res.queueTicket || ticket,
        appointment: res.appointment,
        invoice: res.invoice,
        encounterId: res.encounter?.encounterId,
        intakeData,
      });
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi hoàn tất tiếp nhận:', err);

      // Nếu tiếp nhận thất bại, lập tức hoàn tác đưa ticket về trạng thái 'called'
      if (ticket?.ticketId) {
        try {
          await queueTicketService.callTicket(ticket.ticketId, ticket.counterNumber || '01');
        } catch (callErr) {
          console.warn('Không thể hoàn tác ticket về trạng thái called:', callErr);
        }
      }

      const missingArr = err?.data?.missing || err?.response?.data?.missing;
      const errorMsg = Array.isArray(missingArr) && missingArr.length > 0
        ? `Thiếu thông tin: ${missingArr.join('; ')}`
        : (err.message || 'Lỗi khi hoàn tất tiếp nhận');
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const patient = isWalkIn
    ? (walkinMode === 'online_appointment'
        ? selectedOnlineAppointment?.patient
        : (walkinMode === 'search'
            ? selectedWalkinPatient
            : (newFullName ? { fullName: newFullName, phoneNumber: newPhoneNumber, dateOfBirth: newDateOfBirth, gender: newGender, identityNumber: newIdentityNumber, insuranceNumber: newInsuranceNumber, identityVerified: false } as any : null)))
    : ticket.appointment?.patient;
  const birthYear = patient?.dateOfBirth ? new Date(patient.dateOfBirth).getFullYear() : null;
  const age = birthYear && !isNaN(birthYear) ? new Date().getFullYear() - birthYear : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tiếp Nhận & Khai Báo Khám Bệnh
              </h3>
              <p className="text-xs text-slate-500">
                Số phiếu: <span className="font-bold text-teal-700">{formatTicketCode(ticket)}</span> • Bệnh nhân:{' '}
                <span className="font-bold text-slate-800">
                  {patient?.fullName || 'Chưa đặt tên'}
                </span>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            {ticket.department?.departmentName || 'Khoa khám'}
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
          {/* THÔNG TIN BỆNH NHÂN: VÃNG LAI (TÌM HOẶC TẠO MỚI) HOẶC ONLINE (ĐÃ CÓ SẴN) */}
          {isWalkIn ? (
            <div className="p-4 bg-gradient-to-br from-slate-50 to-teal-50/50 rounded-2xl border border-teal-200/90 space-y-3.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    Khách Vãng Lai / Bốc Số Tại Chỗ ({formatTicketCode(ticket)})
                  </span>
                </div>
                <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => { setWalkinMode('search'); }}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${walkinMode === 'search' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Tìm hồ sơ cũ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setWalkinMode('online_appointment'); }}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${walkinMode === 'online_appointment' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Đã đặt lịch Online</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setWalkinMode('create'); }}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${walkinMode === 'create' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Tạo hồ sơ mới</span>
                  </button>
                </div>
              </div>

              {walkinMode === 'online_appointment' ? (
                <div className="space-y-3">
                  {!selectedOnlineAppointment ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={searchAppointmentKeyword}
                            onChange={(e) => setSearchAppointmentKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchOnlineAppointment()}
                            placeholder="Nhập SĐT, CCCD, Họ tên hoặc Mã lịch hẹn (APP-...)"
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                          />
                          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                        <button
                          type="button"
                          onClick={handleSearchOnlineAppointment}
                          disabled={isSearchingAppointments}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSearchingAppointments ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                          <span>Tìm lịch hẹn</span>
                        </button>
                      </div>

                      {appointmentResults.length > 0 && (
                        <div className="max-h-56 overflow-y-auto space-y-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                          {appointmentResults.map((appt) => {
                            const pName = appt.patient?.fullName || 'Khách chưa đồng bộ';
                            const pPhone = appt.patient?.phoneNumber;
                            const dName = appt.doctor?.user?.fullName || appt.doctor?.fullName || 'Chưa gán bác sĩ';
                            const dateStr = appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString('vi-VN') : '';
                            const timeStr = appt.slot ? `${appt.slot.slotStartTime} - ${appt.slot.slotEndTime}` : appt.appointmentTime || '';

                            return (
                              <div
                                key={appt.appointmentId}
                                onClick={() => handleSelectOnlineAppointment(appt)}
                                className="p-3 hover:bg-teal-50/80 rounded-xl border border-slate-200 hover:border-teal-300 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-teal-800 text-xs px-2 py-0.5 rounded-md bg-teal-100/70 border border-teal-200">
                                      {appt.appointmentCode}
                                    </span>
                                    <span className="font-bold text-slate-900 text-xs">{pName}</span>
                                    {pPhone && <span className="text-[11px] text-slate-500">SĐT: {pPhone}</span>}
                                  </div>
                                  <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                    <span>Bác sĩ: <strong className="text-slate-800">{dName}</strong></span>
                                    {dateStr && <span>Ngày: <strong>{dateStr}</strong></span>}
                                    {timeStr && <span>Khung giờ: <strong>{timeStr}</strong></span>}
                                  </div>
                                  {appt.reasonForVisit && (
                                    <p className="text-[11px] text-slate-500 italic line-clamp-1">
                                      Lý do: "{appt.reasonForVisit}"
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="self-start sm:self-center text-xs font-bold text-teal-700 hover:text-white px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-600 border border-teal-300 transition shrink-0"
                                >
                                  Chọn lịch này
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 bg-emerald-50/90 rounded-xl border border-emerald-300 flex items-center justify-between shadow-2xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold text-emerald-900 text-xs">
                            Đã liên kết Lịch hẹn: {selectedOnlineAppointment.appointmentCode}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {selectedOnlineAppointment.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-800 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span>Bệnh nhân: <strong>{selectedOnlineAppointment.patient?.fullName || 'Chưa đồng bộ'}</strong></span>
                          <span>SĐT: <strong>{selectedOnlineAppointment.patient?.phoneNumber || 'N/A'}</strong></span>
                          <span>Bác sĩ: <strong>{selectedOnlineAppointment.doctor?.user?.fullName || selectedOnlineAppointment.doctor?.fullName || 'N/A'}</strong></span>
                        </div>
                        {selectedOnlineAppointment.reasonForVisit && (
                          <div className="text-[11px] text-emerald-700 italic">
                            Lý do khám: {selectedOnlineAppointment.reasonForVisit}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedOnlineAppointment(null)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer shrink-0 ml-2"
                        title="Hủy liên kết / Chọn lịch khác"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : walkinMode === 'search' ? (
                <div className="space-y-3">
                  {!selectedWalkinPatient ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={searchPatientKeyword}
                            onChange={(e) => setSearchPatientKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchPatient()}
                            placeholder="Nhập Số điện thoại, CCCD hoặc Họ tên bệnh nhân..."
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                          />
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                        <button
                          type="button"
                          onClick={handleSearchPatient}
                          disabled={isSearchingPatients}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSearchingPatients ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                          <span>Tìm kiếm</span>
                        </button>
                      </div>

                      {searchResults.length > 0 && (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                          {searchResults.map((p) => (
                            <div
                              key={p.patientId}
                              onClick={() => { setSelectedWalkinPatient(p); setSearchResults([]); }}
                              className="p-2.5 hover:bg-teal-50 rounded-lg border border-transparent hover:border-teal-200 transition cursor-pointer flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-slate-900 text-xs">{p.fullName}</span>
                                <span className="text-[11px] text-slate-500 ml-2">SĐT: {p.phoneNumber}</span>
                                {p.identityNumber && <span className="text-[11px] text-slate-500 ml-2">• CCCD: {p.identityNumber}</span>}
                              </div>
                              <span className="text-[10px] font-bold text-teal-600 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200">
                                Chọn
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-emerald-950 text-xs">{selectedWalkinPatient.fullName}</span>
                          <span className="text-[11px] text-emerald-700">({selectedWalkinPatient.gender === 'male' ? 'Nam' : 'Nữ'}, sinh {new Date(selectedWalkinPatient.dateOfBirth).toLocaleDateString('vi-VN')})</span>
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-3">
                          <span>SĐT: <strong>{selectedWalkinPatient.phoneNumber}</strong></span>
                          <span>CCCD: <strong>{selectedWalkinPatient.identityNumber || 'Chưa có'}</strong></span>
                          <span>Mã BN: <strong>{selectedWalkinPatient.patientCode}</strong></span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedWalkinPatient(null)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Chọn bệnh nhân khác"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* walkinMode === 'create' */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700">Họ và tên <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs mt-0.5 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700">Số điện thoại <span className="text-rose-500">*</span></label>
                    <input
                      type="tel"
                      value={newPhoneNumber}
                      onChange={(e) => setNewPhoneNumber(e.target.value)}
                      placeholder="0912345678"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs mt-0.5 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700">Ngày sinh <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      value={newDateOfBirth}
                      onChange={(e) => setNewDateOfBirth(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs mt-0.5 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700">Giới tính <span className="text-rose-500">*</span></label>
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs mt-0.5 focus:border-teal-500 focus:outline-none"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700">Số CCCD / Định danh</label>
                    <input
                      type="text"
                      value={newIdentityNumber}
                      onChange={(e) => setNewIdentityNumber(e.target.value)}
                      placeholder="12 chữ số"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs mt-0.5 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700">Mã thẻ BHYT</label>
                    <input
                      type="text"
                      value={newInsuranceNumber}
                      onChange={(e) => setNewInsuranceNumber(e.target.value)}
                      placeholder="VD: GD401..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs mt-0.5 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="text-[10px] font-bold text-slate-700">Địa chỉ cư trú</label>
                    <input
                      type="text"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="Số nhà, tên đường, phường/xã..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs mt-0.5 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* THÔNG TIN HỒ SƠ BỆNH NHÂN ĐẶT ONLINE ĐỂ ĐỐI CHIẾU TẠI QUẦY */
            <div className="p-3.5 bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-2xl border border-teal-100/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-teal-950">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span>Hồ sơ đặt hẹn Online (Dùng để đối chiếu giấy tờ thực tế):</span>
                </span>
                {patient?.identityVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Đã từng xác minh danh tính</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span>Chưa từng xác minh danh tính</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-blue-500" />
                    <span>Số CCCD / CMND</span>
                  </div>
                  <div className="font-mono font-bold text-slate-800 text-xs mt-1">
                    {patient?.identityNumber || (
                      <span className="text-slate-400 font-normal italic text-[11px]">Chưa cập nhật CCCD</span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <FileCheck2 className="w-3 h-3 text-emerald-500" />
                    <span>Mã Thẻ BHYT</span>
                  </div>
                  <div className="font-mono font-bold text-emerald-700 text-xs mt-1">
                    {patient?.insuranceNumber || (
                      <span className="text-slate-400 font-normal italic text-[11px]">Chưa đăng ký BHYT</span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-purple-500" />
                    <span>Ngày sinh & Tuổi</span>
                  </div>
                  <div className="font-semibold text-slate-800 text-xs mt-1">
                    {patient?.dateOfBirth ? (
                      <>
                        <span>{new Date(patient.dateOfBirth).toLocaleDateString('vi-VN')}</span>
                        {age !== null && (
                          <span className="text-slate-500 font-normal text-[11px] ml-1">
                            ({age} tuổi)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400 font-normal italic text-[11px]">Chưa có ngày sinh</span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Users className="w-3 h-3 text-amber-500" />
                    <span>Giới tính / SĐT</span>
                  </div>
                  <div className="font-semibold text-slate-800 text-xs mt-1">
                    <span>{patient?.gender === 'male' ? 'Nam' : patient?.gender === 'female' ? 'Nữ' : 'Khác'}</span>
                    <span className="text-slate-300 font-normal mx-1">•</span>
                    <span className="text-slate-600 font-mono text-[11px]">{patient?.phoneNumber || '---'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chọn Bác Sĩ */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>Bác sĩ phụ trách ca khám:</span>
              <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            >
              <option value="" disabled>-- Chọn bác sĩ --</option>
              {availableDoctors.map((doc) => (
                <option key={doc.doctorId} value={doc.doctorId}>
                  {doc.title ? `${doc.title} ` : 'BS. '}{doc.fullName} ({doc.specialization || 'Khoa Tim Mạch'})
                </option>
              ))}
            </select>
          </div>

          {/* Mức độ ưu tiên tiếp nhận */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>Mức độ ưu tiên khám:</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('normal')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  priority === 'normal'
                    ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Bình thường</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority('urgent')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  priority === 'urgent'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Ưu tiên (VIP/Người già)</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority('emergency')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  priority === 'emergency'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Cấp cứu</span>
              </button>
            </div>
          </div>

          {/* KHỐI XÁC MINH DANH TÍNH TẠI QUẦY (CCCD / BHYT / BỆNH NHI) */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Xác minh danh tính bệnh nhân tại quầy:</span>
                <span className="text-rose-500">*</span>
              </label>
              {isPediatricPatient ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <Baby className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bệnh nhi nhỏ tuổi (&lt; 15 tuổi)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Người lớn (CCCD / BHYT)</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Chọn phương thức */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 block">Phương thức đối chiếu:</span>
                <select
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value as VerificationMethod)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:outline-none focus:border-teal-500"
                >
                  <option value="national_id_card">CCCD gắn chip / Thẻ căn cước</option>
                  <option value="health_insurance_card">Thẻ BHYT (hoặc Thẻ BHYT Trẻ em)</option>
                  <option value="manual">Giấy khai sinh / Đối chiếu theo phụ huynh</option>
                  <option value="patient_card">Thẻ khám bệnh viện</option>
                  <option value="phone_otp">Xác thực qua OTP SMS</option>
                </select>
              </div>

              {/* Chọn kết quả */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 block">Kết quả đối chiếu:</span>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                  className={`w-full px-3 py-2 bg-white border rounded-xl font-bold text-xs focus:outline-none ${
                    verificationStatus === 'verified'
                      ? 'border-emerald-300 text-emerald-800 bg-emerald-50/30'
                      : 'border-rose-300 text-rose-800 bg-rose-50/30'
                  }`}
                >
                  <option value="verified">✓ Đã đối chiếu khớp thông tin (Verified)</option>
                  <option value="failed">✕ Không khớp / Nghi ngờ sai lệch (Failed)</option>
                  <option value="pending">⏳ Đang chờ xác minh bổ sung (Pending)</option>
                </select>
              </div>
            </div>

            {/* Nếu không khớp -> Bắt buộc nhập lý do */}
            {verificationStatus === 'failed' && (
              <div className="pt-1">
                <label className="text-[11px] font-bold text-rose-700 block mb-1">
                  Lý do không khớp / sai lệch giấy tờ: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={mismatchNotes}
                  onChange={(e) => setMismatchNotes(e.target.value)}
                  placeholder="Ví dụ: Khuôn mặt không khớp ảnh CCCD, Số CCCD lệch 1 chữ số..."
                  className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>
            )}

            {/* Gợi ý nghiệp vụ */}
            <div className="text-[10px] text-slate-400 italic">
              {isPediatricPatient
                ? '💡 Bệnh nhi chưa có CCCD: Đối chiếu Thẻ BHYT trẻ em (mã TE) hoặc Giấy khai sinh kèm CCCD của Phụ huynh / Người giám hộ đi cùng.'
                : '💡 Kiểm tra ảnh thẻ CCCD với khuôn mặt người đến khám. Sau khi xác nhận, hệ thống tự động gắn cờ "Đã xác minh danh tính" cho hồ sơ bệnh nhân.'}
            </div>
          </div>

          {/* KHỐI CAM KẾT ĐỒNG Ý Y TẾ & CHỮ KÝ ĐIỆN TỬ (CONSENT) */}
          <div className="p-3.5 bg-gradient-to-br from-teal-50/60 to-emerald-50/40 rounded-2xl border border-teal-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-teal-700" />
                <span className="font-bold text-slate-800 text-xs">
                  Giấy Cam Kết Đồng Ý Y Tế & Chữ Ký Điện Tử (Consent):
                </span>
                <span className="text-rose-500">*</span>
              </div>
              {activeConsents.length > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Đã có {activeConsents.length} cam kết còn hiệu lực</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span>Cần xác nhận ký tại quầy</span>
                </span>
              )}
            </div>

            {/* Danh sách các khoản cam kết */}
            <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                Chọn các khoản cam kết bệnh nhân đồng ý chấp thuận:
              </span>
              {policies.length === 0 ? (
                <div className="text-[11px] text-slate-400 italic py-1">Đang tải danh sách điều khoản y tế...</div>
              ) : (
                policies.map((p) => {
                  const isChecked = selectedPolicyIds.includes(p.policyId);
                  const hasActive = activeConsents.some(
                    (ac) => ac.policyId === p.policyId || ac.policy?.policyType === p.policyType
                  );

                  let labelText =
                    p.policyType === 'data_processing'
                      ? '1. Đồng ý thu thập, xử lý & bảo lưu dữ liệu cá nhân y tế (HL7 FHIR R4)'
                      : p.policyType === 'treatment_consent'
                      ? '2. Đồng ý chẩn đoán, xét nghiệm & thực hiện thủ thuật y tế tại viện'
                      : p.policyType === 'financial_responsibility'
                      ? '3. Cam kết nghĩa vụ tài chính & chi phí dịch vụ khám chữa bệnh'
                      : `${p.policyCode} (${p.version})`;

                  return (
                    <label key={p.policyId} className="flex items-start gap-2.5 cursor-pointer text-xs py-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPolicyIds((prev) => [...prev, p.policyId]);
                          } else {
                            setSelectedPolicyIds((prev) => prev.filter((id) => id !== p.policyId));
                          }
                        }}
                        className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <span className={`font-semibold ${isChecked ? 'text-slate-800' : 'text-slate-500'}`}>
                          {labelText}
                        </span>
                        {hasActive && (
                          <span className="ml-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                            ✓ Đã ký
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Lựa chọn hình thức ký */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>Phương thức ký xác nhận:</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="signatureType"
                      checked={signatureType === 'checkbox_click'}
                      onChange={() => setSignatureType('checkbox_click')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span>Xác nhận tại quầy (Counter Witness)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="signatureType"
                      checked={signatureType === 'e_signature_draw'}
                      onChange={() => setSignatureType('e_signature_draw')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="flex items-center gap-1">
                      <PenTool className="w-3 h-3 text-teal-600" />
                      <span>Ký chữ ký vẽ (Pad)</span>
                    </span>
                  </label>
                </div>
              </div>

              {signatureType === 'checkbox_click' ? (
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={witnessedAtCounter}
                      onChange={(e) => setWitnessedAtCounter(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>Lễ tân xác nhận bệnh nhân / người giám hộ đã được phổ biến & đồng ý ký tại quầy.</span>
                  </label>
                  <span className="text-[10px] text-teal-700 font-bold px-2 py-0.5 rounded bg-teal-50 border border-teal-200 shrink-0">
                    Witnessed
                  </span>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-semibold">Bệnh nhân ký tên bên dưới bằng chuột hoặc cảm ứng:</span>
                    <button
                      type="button"
                      onClick={handleClearCanvas}
                      className="text-slate-500 hover:text-rose-600 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                    >
                      <Eraser className="w-3 h-3" />
                      <span>Xóa chữ ký</span>
                    </button>
                  </div>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 p-1 flex justify-center">
                    <canvas
                      ref={canvasRef}
                      width={460}
                      height={100}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="bg-white rounded-lg cursor-crosshair shadow-2xs touch-none border border-slate-200"
                    />
                  </div>
                  {signatureDataUrl && (
                    <div className="text-[10px] text-emerald-600 font-bold text-right">
                      ✓ Đã ghi nhận bản vẽ chữ ký điện tử
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lý do đến khám (Chief Complaint - reasonForVisit) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Lý do đến khám chính thức:</span>
                <span className="text-rose-500">*</span>
              </span>
              {ticket.appointment?.reasonForVisit && (
                <span className="text-[10px] text-slate-400 font-normal">
                  (Đặt lịch: {ticket.appointment.reasonForVisit})
                </span>
              )}
            </label>
            <input
              type="text"
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="VD: Đau đầu kéo dài, Khám sức khỏe tổng quát, Tức ngực khó thở..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>

          {/* Mô tả triệu chứng (Symptoms) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                <span>Mô tả triệu chứng lâm sàng:</span>
              </label>
              <span className="text-[10px] text-slate-400">Chọn nhanh hoặc tự gõ</span>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SYMPTOM_TAGS.map((tag) => {
                const isSelected = symptoms.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleQuickSymptom(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                  </button>
                );
              })}
            </div>

            <textarea
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Nhập chi tiết các biểu hiện bất thường hoặc triệu chứng bệnh nhân đang gặp phải..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>

          {/* Grid 2 cột: Ngày khởi phát & Thang điểm đau */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Ngày khởi phát */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>Ngày bắt đầu xuất hiện:</span>
              </label>
              <input
                type="date"
                value={symptomOnsetDate}
                onChange={(e) => setSymptomOnsetDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>

            {/* Thang điểm đau (VAS Pain Scale 0 - 10) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mức độ đau (0 - 10):</span>
                </label>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    painLevel >= 7
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : painLevel >= 4
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : painLevel > 0
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {painLevel === 0
                    ? '0 - Không đau'
                    : painLevel < 4
                    ? `${painLevel} - Đau nhẹ`
                    : painLevel < 7
                    ? `${painLevel} - Đau vừa`
                    : `${painLevel} - Đau dữ dội`}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={painLevel}
                onChange={(e) => setPainLevel(parseInt(e.target.value, 10))}
                className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
                <span>0 (Êm dịu)</span>
                <span>5 (Đau vừa)</span>
                <span>10 (Dữ dội)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirmIntakeAndServe}
            disabled={isSubmitting || !selectedDoctorId}
            className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu hồ sơ...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Xác Nhận Tiếp Nhận & Chuyển Khám</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
