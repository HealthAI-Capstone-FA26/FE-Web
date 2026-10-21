import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  FileText,
  Sparkles,
  Check,
  ChevronDown,
  Activity,
  Award,
  ShieldAlert,
  Plus,
  X,
} from 'lucide-react';
import { patientService, type PatientResponse } from '../../../services/patient/patient.service';
import {
  doctorService,
  type DoctorResponse,
  getSpecializationLabel,
  CARDIOLOGY_SPECIALIZATIONS,
} from '../../../services/doctor/doctor.service';
import {
  appointmentService,
  type AppointmentSlotResponse,
  type AppointmentItem,
} from '../../../services/appointment/appointment.service';
import { getLocalDateString, isSlotPassed } from '../../../utils/booking.utils';

interface PatientBookingFormProps {
  onSuccess?: (newAppointment: AppointmentItem) => void;
}

export const PatientBookingForm: React.FC<PatientBookingFormProps> = ({ onSuccess }) => {
  // Data lists
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [slots, setSlots] = useState<AppointmentSlotResponse[]>([]);

  // Selected state
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getLocalDateString(tomorrow);
  });
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [reasonForVisit, setReasonForVisit] = useState<string>('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [serviceLevel, setServiceLevel] = useState<'tieu-chuan' | 'vip'>('tieu-chuan');

  // Loading & error states
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<AppointmentItem | null>(null);

  // Load initial patients & doctors
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        setLoadingInitial(true);
        setErrorMsg(null);
        const [myPatients, docList] = await Promise.all([
          patientService.getMyPatients().catch((err) => {
            console.warn('Lỗi getMyPatients:', err);
            return [];
          }),
          doctorService.getDoctors().catch((err) => {
            console.warn('Lỗi getDoctors:', err);
            return [];
          }),
        ]);

        const finalPatients = Array.isArray(myPatients) ? myPatients : [];
        setPatients(finalPatients);
        if (finalPatients.length > 0) {
          setSelectedPatientId(finalPatients[0].patientId);
        }

        const activeDocs = Array.isArray(docList) ? docList.filter((d) => d.isActive) : [];
        setDoctors(activeDocs);
      } catch (err: any) {
        console.error('Lỗi khởi tạo form đặt lịch:', err);
        setErrorMsg('Không thể tải dữ liệu ban đầu. Vui lòng thử lại sau.');
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchInitData();
  }, []);

  // Filter doctors by selected cardiology specialization
  const filteredDoctors = doctors.filter((doc) => {
    if (selectedSpecialization === 'all') return true;
    return doc.specialization === selectedSpecialization;
  });

  // Auto-select first doctor when specialization filter changes
  useEffect(() => {
    if (filteredDoctors.length > 0) {
      if (!filteredDoctors.some((d) => d.doctorId === selectedDoctorId)) {
        setSelectedDoctorId(filteredDoctors[0].doctorId);
      }
    } else {
      setSelectedDoctorId('');
      setSlots([]);
      setSelectedSlotId('');
    }
  }, [selectedSpecialization, doctors, filteredDoctors]);

  // Load slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setSlots([]);
      setSelectedSlotId('');
      return;
    }

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setErrorMsg(null);
        setSelectedSlotId('');
        const freeSlots = await appointmentService.getFreeSlots(selectedDoctorId, selectedDate);
        setSlots(Array.isArray(freeSlots) ? freeSlots : []);
      } catch (err: any) {
        setSlots([]);
        setSelectedSlotId('');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  // Handle submit appointment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setErrorMsg('Vui lòng chọn hồ sơ bệnh nhân khám');
      return;
    }
    if (!selectedDoctorId) {
      setErrorMsg('Vui lòng chọn bác sĩ Tim mạch phụ trách');
      return;
    }
    if (!selectedSlotId) {
      setErrorMsg('Vui lòng chọn khung giờ khám còn trống');
      return;
    }

    const chosenSlot = slots.find((s) => s.slotId === selectedSlotId);
    if (!chosenSlot || isSlotPassed(chosenSlot.slotStartTime, selectedDate)) {
      setErrorMsg('Khung giờ bạn chọn đã kết thúc, vui lòng chọn khung giờ khác');
      return;
    }

    const patientObj = patients.find((p) => p.patientId === selectedPatientId);
    let rel = patientObj?.relationship || 'self';
    if (rel === 'Bản thân') rel = 'self';
    else if (rel === 'Con cái') rel = 'child';
    else if (rel === 'Bố/Mẹ' || rel === 'Cha mẹ') rel = 'parent';
    else if (rel === 'Vợ/Chồng') rel = 'spouse';

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await appointmentService.createOnlineAppointment({
        patientId: selectedPatientId,
        relationship: rel,
        doctorId: selectedDoctorId,
        slotId: selectedSlotId,
        reasonForVisit: reasonForVisit.trim() || undefined,
      });

      setSuccessBooking(res);
      if (onSuccess) onSuccess(res);
    } catch (err: any) {
      const isConflict =
        err?.status === 409 ||
        err?.message?.toLowerCase()?.includes('đầy') ||
        err?.message?.toLowerCase()?.includes('đã được đặt');
      if (isConflict && selectedDoctorId && selectedDate) {
        setSelectedSlotId('');
        appointmentService
          .getFreeSlots(selectedDoctorId, selectedDate)
          .then((s) => setSlots(Array.isArray(s) ? s : []))
          .catch(() => {});
      }
      setErrorMsg(err?.message || 'Đặt lịch không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessBooking(null);
    setReasonForVisit('');
    setSelectedSlotId('');
  };



  if (loadingInitial) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-xs flex flex-col items-center justify-center space-y-3 max-w-2xl mx-auto">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Đang tải dữ liệu đăng ký khám bệnh...</p>
      </div>
    );
  }

  const currentPatient = patients.find((p) => p.patientId === selectedPatientId);
  const currentDoctor = doctors.find((d) => d.doctorId === selectedDoctorId);
  const currentSlot = slots.find((s) => s.slotId === selectedSlotId);

  // Success view
  if (successBooking) {
    return (
      <div className="bg-slate-100/60 p-3 rounded-[2rem] border border-slate-200/50 shadow-md w-full max-w-2xl mx-auto relative animate-in zoom-in-95 duration-300">
        <div className="text-white rounded-[calc(2rem-0.625rem)] flex flex-col relative z-10 overflow-hidden bg-[#0b3c8f]">
          <div className="bg-gradient-to-b from-blue-600 to-blue-700 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20">
              <Check className="w-8 h-8 text-yellow-400 stroke-[3]" />
            </div>
            <div>
              <h4 className="text-xl font-bold uppercase tracking-tight mb-1 text-white">Đăng ký khám thành công</h4>
              <p className="text-blue-100 text-xs max-w-sm mx-auto">
                Mã số đặt lịch của bạn là:
                <strong className="text-yellow-400 font-mono text-lg block mt-1 tracking-wider">{successBooking.appointmentCode}</strong>
              </p>
            </div>

            <div className="space-y-2.5 text-left bg-white/10 p-5 rounded-2xl border border-white/15 text-xs text-blue-50">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="opacity-75">Bệnh nhân:</span>
                <span className="font-bold text-white">{currentPatient?.fullName} ({currentPatient?.patientCode})</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="opacity-75">Chuyên khoa:</span>
                <span className="font-bold text-white">Phòng khám Chuyên khoa Tim Mạch</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="opacity-75">Bác sĩ khám:</span>
                <span className="font-bold text-white">
                  {currentDoctor ? `${currentDoctor.title ? currentDoctor.title + '. ' : ''}${currentDoctor.fullName} (${getSpecializationLabel(currentDoctor.specialization)})` : 'Bác sĩ Tim mạch trực'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="opacity-75">Ngày khám:</span>
                <span className="font-bold text-white">
                  {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="opacity-75">Khung giờ hẹn:</span>
                <span className="font-bold text-yellow-300">
                  {currentSlot
                    ? `${new Date(currentSlot.slotStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} - ${new Date(currentSlot.slotEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}`
                    : 'Theo khung giờ đã chọn'}
                </span>
              </div>
            </div>

            {/* Timeline hướng dẫn tiếp theo */}
            <div className="bg-black/15 p-4 rounded-2xl border border-white/10 space-y-2.5 text-left">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                📋 Các bước tiếp theo:
              </span>
              <div className="space-y-2 text-[11px] text-blue-100">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
                  <span><strong>Chờ xác nhận:</strong> Nhân viên tiếp đón sẽ kiểm tra và xác nhận lịch hẹn của bạn.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
                  <span><strong>Đến quầy Tiếp đón:</strong> Có mặt trước 15 phút, xuất trình CCCD/BHYT để check-in và đo sinh hiệu ban đầu.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">3</span>
                  <span><strong>Nhận số thứ tự A:</strong> Nhận phiếu khám và di chuyển đến phòng khám chuyên khoa theo hướng dẫn.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="bg-white hover:bg-slate-50 text-[#0b3c8f] font-bold px-6 py-2.5 rounded-xl uppercase tracking-wider text-xs shadow-md transition-all active:scale-95 cursor-pointer border-none"
            >
              Đặt thêm lịch khám khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100/60 p-3 rounded-[2rem] border border-slate-200/50 shadow-md w-full max-w-2xl mx-auto relative animate-in fade-in duration-300">
      <div className="text-white rounded-[calc(2rem-0.625rem)] flex flex-col relative z-10 overflow-hidden bg-[#0b3c8f]">

        {/* HEADER */}
        <div className="p-6 md:p-8 space-y-2 text-center border-b border-white/10">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto border border-white/20 mb-3">
            <HeartPulse className="w-6 h-6 text-yellow-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold tracking-tight uppercase text-white">
            Đăng Ký Khám Bệnh Tim Mạch
          </h3>
          <p className="text-xs text-blue-100 font-sans max-w-md mx-auto">
            Hệ thống đặt lịch chuyên khoa Tim mạch 4AM — Khám trực tiếp cùng các chuyên gia hàng đầu
          </p>
        </div>

        {/* BODY FORM */}
        <div className="p-5 md:p-7 space-y-6">

          {/* Alert Error */}
          {errorMsg && (
            <div className="bg-rose-500/20 border border-rose-400/50 text-rose-100 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* KHUNG 1: CHỌN HỒ SƠ BỆNH NHÂN */}
            <div className="bg-white/5 p-4.5 rounded-xl border border-white/10 space-y-3 font-sans">
              <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                * 1. Chọn hồ sơ bệnh nhân khám
              </span>

              {patients.length === 0 ? (
                <div className="p-3 bg-white/10 rounded-xl text-xs text-blue-100 flex items-center justify-between">
                  <span>Chưa có hồ sơ bệnh nhân gắn với tài khoản.</span>
                  <a href="/benh-nhan/ho-so" className="text-yellow-300 underline font-semibold hover:text-white">
                    Cập nhật hồ sơ cá nhân →
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {patients.map((p) => {
                    const isSelected = selectedPatientId === p.patientId;
                    const isSelf = p.relationship === 'self' || p.relationship === 'Bản thân' || !p.relationship;
                    return (
                      <label
                        key={p.patientId}
                        onClick={() => setSelectedPatientId(p.patientId)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-white text-[#0b3c8f] font-bold border-white shadow-md'
                            : 'bg-white/90 text-slate-700 hover:bg-white border-transparent'
                        }`}
                      >
                        <input
                          type="radio"
                          name="patientProfile"
                          checked={isSelected}
                          onChange={() => setSelectedPatientId(p.patientId)}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                            isSelected ? 'border-[#0b3c8f] bg-[#0b3c8f] text-white' : 'border-slate-300 bg-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3] text-white" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate">{p.fullName}</span>
                          <span className="text-[10px] opacity-75 font-mono">
                            Mã BN: {p.patientCode}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* KHUNG 2: VẤN ĐỀ SỨC KHỎE CẦN KHÁM */}
            <div className="bg-white/5 p-4.5 rounded-xl border border-white/10 space-y-3 font-sans">
              <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                * 2. Vấn đề sức khỏe cần khám
              </span>

              <textarea
                placeholder="Mô tả triệu chứng hoặc lý do khám... (VD: Đau tức ngực trái khi gắng sức, hồi hộp khó thở, huyết áp tăng cao, tái khám sau can thiệp stent...)"
                rows={2.5}
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
                className="w-full bg-white text-slate-800 font-semibold p-3.5 rounded-lg border border-transparent focus:ring-2 focus:ring-yellow-400 outline-none resize-none text-xs md:text-[13px]"
              />

              {/* Gợi ý triệu chứng tim mạch */}
              <div className="flex items-start gap-1.5 text-[10.5px] text-blue-100/90 bg-blue-950/40 rounded-lg px-2.5 py-1.5 border border-blue-400/20 leading-relaxed">
                <HeartPulse className="w-3.5 h-3.5 text-rose-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-300">Triệu chứng tim mạch gợi ý: </span>
                  Đau thắt ngực, khó thở khi gắng sức hoặc khi nằm, hồi hộp đánh trống ngực, phù chân, tăng huyết áp khó kiểm soát, hoặc tái khám định kỳ sau đặt stent.
                </div>
              </div>
            </div>

            {/* KHUNG 3: THÔNG TIN LOẠI HÌNH & BÁC SĨ TIM MẠCH */}
            <div className="bg-white/5 p-4.5 rounded-xl border border-white/10 space-y-4 font-sans">
              {/* Chọn loại hình khám (Tiêu chuẩn / VIP) */}
              <div className="space-y-2">
                <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                  * 3. Chọn loại hình khám
                </span>
                <div className="grid grid-cols-2 bg-white p-1 rounded-xl border border-slate-200/50 text-center font-bold shadow-inner">
                  {[
                    { id: 'tieu-chuan', label: 'Khám tiêu chuẩn', icon: Activity },
                    { id: 'vip', label: 'Khám VIP', icon: Award },
                  ].map((tab, idx) => {
                    const isActive = serviceLevel === tab.id;
                    const Icon = tab.icon;
                    return (
                      <div key={tab.id} className="relative flex items-center w-full">
                        {idx > 0 && !isActive && (
                          <div className="absolute left-0 h-4 w-[1px] bg-slate-200/80" />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setServiceLevel(tab.id as any);
                            if (tab.id === 'vip') setPriority('urgent');
                            else setPriority('normal');
                          }}
                          className={`py-2 rounded-lg w-full flex items-center justify-center gap-1.5 transition-all duration-300 uppercase tracking-tight text-xs cursor-pointer font-bold ${
                            isActive
                              ? 'bg-[#0b3c8f] text-white shadow-md'
                              : 'text-slate-700 hover:text-[#0b3c8f] hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {tab.label}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lọc theo phân nhánh chuyên môn Tim mạch */}
              <div className="space-y-2">
                <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                  Phân nhánh chuyên khoa Tim mạch
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Tất cả bác sĩ' },
                    { id: 'general_cardiology', label: 'Nội Tim Mạch' },
                    { id: 'interventional', label: 'Can Thiệp Mạch Vành' },
                    { id: 'electrophysiology', label: 'Rối Loạn Nhịp' },
                    { id: 'echocardiography', label: 'Siêu Âm & Cận Lâm Sàng' },
                  ].map((spec) => {
                    const isSpecActive = selectedSpecialization === spec.id;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => setSelectedSpecialization(spec.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                          isSpecActive
                            ? 'bg-yellow-400 text-blue-950 font-bold border-yellow-300 shadow-sm'
                            : 'bg-white/10 text-blue-100 border-white/15 hover:bg-white/20'
                        }`}
                      >
                        {spec.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chọn bác sĩ tim mạch */}
              <div className="space-y-2">
                <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                  * Chọn bác sĩ Tim mạch phụ trách
                </span>
                <div className="relative">
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    disabled={filteredDoctors.length === 0}
                    className="w-full bg-white text-slate-800 font-semibold py-2.5 pl-4 pr-10 rounded-lg border border-transparent focus:ring-2 focus:ring-yellow-400 outline-none appearance-none cursor-pointer text-xs md:text-[13px] disabled:bg-white/90 disabled:text-slate-400"
                  >
                    {filteredDoctors.length === 0 ? (
                      <option value="">Không có bác sĩ trong phân nhánh này</option>
                    ) : (
                      filteredDoctors.map((doc) => (
                        <option key={doc.doctorId} value={doc.doctorId} className="text-slate-800">
                          {doc.title ? `${doc.title}. ` : ''}{doc.fullName} — {getSpecializationLabel(doc.specialization)} ({doc.doctorCode})
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Chọn ngày & Khung giờ khám */}
              <div className="space-y-2">
                <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                  * Chọn ngày & Khung giờ khám
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedDate}
                      min={getLocalDateString()}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-white text-slate-800 font-semibold py-2.5 px-3 rounded-lg border border-transparent focus:ring-2 focus:ring-yellow-400 outline-none text-xs cursor-pointer"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    {loadingSlots ? (
                      <div className="bg-white/90 p-2.5 rounded-lg text-slate-600 text-xs flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0b3c8f]" />
                        <span>Tải khung giờ...</span>
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="bg-white/90 p-2.5 rounded-lg text-slate-500 text-[11px] text-center">
                        Không có slot trống ngày này
                      </div>
                    ) : (
                      <div>
                        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {slots.map((s) => {
                            const startTime = new Date(s.slotStartTime).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'UTC',
                            });
                            const endTime = new Date(s.slotEndTime).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'UTC',
                            });
                            const isPassed = isSlotPassed(s.slotStartTime, selectedDate);
                            const isSelected = selectedSlotId === s.slotId;

                            if (isPassed) {
                              return (
                                <div
                                  key={s.slotId}
                                  title="Khung giờ này đã qua hoặc đã hết thời gian tiếp nhận"
                                  className="py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between border bg-white/10 text-white/40 border-white/10 cursor-not-allowed select-none opacity-50"
                                >
                                  <span className="line-through decoration-white/30">{startTime} - {endTime}</span>
                                  <span className="text-[10px] text-white/50 uppercase font-semibold">Hết giờ</span>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={s.slotId}
                                type="button"
                                onClick={() => setSelectedSlotId(s.slotId)}
                                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                                  isSelected
                                    ? 'bg-white text-[#0b3c8f] border-white shadow-md'
                                    : 'bg-white/20 text-white border-white/20 hover:bg-white/30'
                                }`}
                              >
                                <span>{startTime} - {endTime}</span>
                                <span className="text-[10px] opacity-80 font-normal">({s.capacity - s.bookedCount})</span>
                              </button>
                            );
                          })}
                        </div>
                        {slots.length > 0 && slots.every((s) => isSlotPassed(s.slotStartTime, selectedDate)) && (
                          <p className="text-[10px] text-yellow-300 mt-1.5 italic">
                            Các khung giờ hôm nay đã kết thúc, vui lòng chọn ngày tiếp theo.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !selectedSlotId || !selectedPatientId}
                className="w-full bg-[#0b3c8f] hover:bg-[#072a6b] text-white font-bold py-3.5 rounded-xl uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-blue-500/20 text-xs md:text-sm disabled:bg-slate-400/50 disabled:text-blue-100/50 disabled:border-transparent disabled:shadow-none"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span>Xác Nhận Đăng Ký Khám →</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
