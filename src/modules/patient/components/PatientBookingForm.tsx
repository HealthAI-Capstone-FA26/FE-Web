import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Stethoscope,
  Building2,
  ShieldCheck,
  FileText,
  Sparkles,
  Check,
  ChevronDown,
  Activity,
  Award,
  ShieldAlert,
  Plus
} from 'lucide-react';
import { patientService, type PatientResponse } from '../../../services/patient/patient.service';
import { doctorService, type DepartmentResponse, type DoctorResponse } from '../../../services/doctor/doctor.service';
import { appointmentService, type AppointmentSlotResponse, type AppointmentItem } from '../../../services/appointment/appointment.service';

interface PatientBookingFormProps {
  onSuccess?: (newAppointment: AppointmentItem) => void;
}

export const PatientBookingForm: React.FC<PatientBookingFormProps> = ({ onSuccess }) => {
  // Data lists
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [slots, setSlots] = useState<AppointmentSlotResponse[]>([]);

  // Selected state
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
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

  // Load initial patients, departments, doctors
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        setLoadingInitial(true);
        const [patientList, deptList, docList] = await Promise.all([
          patientService.getMyPatients(),
          doctorService.getDepartments(),
          doctorService.getDoctors(),
        ]);

        setPatients(patientList);
        if (patientList.length > 0) {
          setSelectedPatientId(patientList[0].patientId);
        }

        const activeDepts = deptList.filter((d) => d.isActive);
        setDepartments(activeDepts);
        if (activeDepts.length > 0) {
          setSelectedDeptId(activeDepts[0].departmentId);
        }

        const activeDocs = docList.filter((d) => d.isActive);
        setDoctors(activeDocs);
      } catch (err: any) {
        setErrorMsg('Không thể tải dữ liệu ban đầu. Vui lòng thử lại sau.');
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchInitData();
  }, []);

  // Filter doctors by selected department
  const filteredDoctors = doctors.filter((doc) => {
    if (!selectedDeptId) return true;
    return doc.doctorDepartments?.some((dd) => dd.departmentId === selectedDeptId);
  });

  // Auto-select first doctor when department changes
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
  }, [selectedDeptId, doctors]);

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
        setSlots(freeSlots);
        if (freeSlots.length > 0) {
          setSelectedSlotId(freeSlots[0].slotId);
        }
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
    if (!selectedDeptId) {
      setErrorMsg('Vui lòng chọn chuyên khoa khám');
      return;
    }
    if (!selectedDoctorId) {
      setErrorMsg('Vui lòng chọn bác sĩ khám');
      return;
    }
    if (!selectedSlotId) {
      setErrorMsg('Vui lòng chọn khung giờ khám còn trống');
      return;
    }

    const patientObj = patients.find((p) => p.patientId === selectedPatientId);
    let rel = patientObj?.relationship || 'self';
    if (rel === 'Bản thân') rel = 'self';
    else if (rel === 'Con cái') rel = 'child';
    else if (rel === 'Bố/Mẹ' || rel === 'Cha mẹ') rel = 'parent';
    else if (rel === 'Vợ/Chồng') rel = 'spouse';

    const finalPriority = serviceLevel === 'vip' ? 'urgent' : priority;

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await appointmentService.createOnlineAppointment({
        patientId: selectedPatientId,
        relationship: rel,
        departmentId: selectedDeptId,
        doctorId: selectedDoctorId,
        slotId: selectedSlotId,
        reasonForVisit: reasonForVisit.trim()
          ? `${serviceLevel === 'vip' ? '[Khám VIP] ' : ''}${reasonForVisit.trim()}`
          : (serviceLevel === 'vip' ? 'Khám VIP' : undefined),
        priority: finalPriority,
      });

      setSuccessBooking(res);
      if (onSuccess) onSuccess(res);
    } catch (err: any) {
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
  const currentDept = departments.find((d) => d.departmentId === selectedDeptId);
  const currentDoctor = doctors.find((d) => d.doctorId === selectedDoctorId);
  const currentSlot = slots.find((s) => s.slotId === selectedSlotId);

  // Success view styled like home page card
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
                <span className="font-bold text-white">{currentDept?.departmentName}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="opacity-75">Bác sĩ khám:</span>
                <span className="font-bold text-white">
                  {currentDoctor ? `${currentDoctor.title ? currentDoctor.title + '. ' : ''}${currentDoctor.fullName}` : 'Bác sĩ trực khoa'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="opacity-75">Thời gian hẹn:</span>
                <span className="font-bold text-yellow-300">
                  {currentSlot
                    ? `${new Date(currentSlot.slotStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} - ${new Date(currentSlot.slotEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}, ${new Date(selectedDate).toLocaleDateString('vi-VN')}`
                    : selectedDate}
                </span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="opacity-75">Loại hình khám:</span>
                <span className="font-bold text-white">{serviceLevel === 'vip' ? 'Khám VIP' : 'Khám Tiêu Chuẩn'}</span>
              </div>
            </div>

            <div className="bg-white/10 p-4 rounded-xl text-left border border-white/15 flex items-start gap-3 text-xs text-blue-100">
              <ShieldCheck className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <p>
                Quý khách vui lòng đến trước giờ hẹn <strong>15 phút</strong> và xuất trình mã <strong>{successBooking.appointmentCode}</strong> tại quầy tiếp đón để được hỗ trợ ưu tiên.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="bg-white text-blue-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-400 hover:text-blue-950 transition-all uppercase tracking-wider text-xs active:scale-95 shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng ký lịch khám mới</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100/60 p-3 rounded-[2rem] border border-slate-200/50 shadow-md w-full max-w-2xl mx-auto relative">
      {/* Inner Core Container with glowing border sweep background */}
      <div className="text-white rounded-[calc(2rem-0.625rem)] flex flex-col h-auto relative z-10">
        
        {/* Glowing background */}
        <div className="absolute inset-0 rounded-[calc(2rem-0.625rem)] overflow-hidden pointer-events-none z-0 bg-[#0b3c8f]">
          <div className="absolute inset-[2px] rounded-[calc(2rem-0.625rem-2px)] bg-gradient-to-b from-blue-600 to-blue-700 z-[1]" />
          <div className="absolute w-[280px] h-[250px] bg-white blur-[50px] -left-16 -top-16 opacity-35 z-[2] animate-pulse" />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col w-full h-full">
          {/* Header Bar */}
          <div className="bg-[#0b3c8f]/95 py-4 px-6 border-b border-blue-500/20 text-center rounded-t-[calc(2rem-0.625rem)]">
            <h3 className="font-bold text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-300" />
              <span>ĐĂNG KÝ KHÁM BỆNH</span>
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 flex flex-col">
            {errorMsg && (
              <div className="p-3.5 bg-yellow-400/20 border border-yellow-300/40 rounded-xl flex items-center gap-2.5 text-yellow-200 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 text-yellow-300 shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* KHUNG 1: CHỌN HỒ SƠ BỆNH NHÂN KHÁM */}
            <div className="bg-white/5 p-4.5 rounded-xl border border-white/10 space-y-3">
              <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                * 1. Chọn Hồ sơ Bệnh nhân khám
              </span>
              
              {patients.length === 0 ? (
                <div className="p-3 bg-white/10 rounded-xl text-xs text-blue-100">
                  Chưa có hồ sơ bệnh nhân. Vui lòng cập nhật hồ sơ cá nhân.
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
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected ? 'border-[#0b3c8f] bg-[#0b3c8f] text-white' : 'border-slate-300 bg-transparent'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3] text-white" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate">{p.fullName}</span>
                          <span className="text-[10px] opacity-75 font-mono">
                            Mã BN: {p.patientCode} • ({isSelf ? 'Bản thân' : p.relationship || 'Người thân'})
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* KHUNG 2: THÔNG TIN CHUYÊN KHOA & BÁC SĨ */}
            <div className="bg-white/5 p-4.5 rounded-xl border border-white/10 space-y-4 font-sans">
              {/* Chọn loại hình khám (Tiêu chuẩn / VIP) */}
              <div className="space-y-2">
                <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                  * Chọn loại hình khám
                </span>
                <div className="grid grid-cols-2 bg-white p-1 rounded-xl border border-slate-200/50 text-center font-bold shadow-inner">
                  {[
                    { id: 'tieu-chuan', label: 'Khám tiêu chuẩn', icon: Activity },
                    { id: 'vip', label: 'Khám VIP', icon: Award }
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

              {/* Chọn chuyên khoa */}
              <div className="space-y-2">
                <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                  * Chọn chuyên khoa
                </span>
                <div className="relative">
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full bg-white text-slate-800 font-semibold py-2.5 pl-4 pr-10 rounded-lg border border-transparent focus:ring-2 focus:ring-yellow-400 outline-none appearance-none cursor-pointer text-xs md:text-[13px]"
                  >
                    {departments.map((d) => (
                      <option key={d.departmentId} value={d.departmentId} className="text-slate-800">
                        {d.departmentName} ({d.departmentCode})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Chọn bác sĩ */}
              <div className="space-y-2">
                <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                  * Chọn bác sĩ phụ trách
                </span>
                <div className="relative">
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    disabled={filteredDoctors.length === 0}
                    className="w-full bg-white text-slate-800 font-semibold py-2.5 pl-4 pr-10 rounded-lg border border-transparent focus:ring-2 focus:ring-yellow-400 outline-none appearance-none cursor-pointer text-xs md:text-[13px] disabled:bg-white/90 disabled:text-slate-400"
                  >
                    {filteredDoctors.length === 0 ? (
                      <option value="">Chưa có bác sĩ thuộc khoa này</option>
                    ) : (
                      filteredDoctors.map((doc) => (
                        <option key={doc.doctorId} value={doc.doctorId} className="text-slate-800">
                          {doc.title ? `${doc.title}. ` : ''}{doc.fullName} {doc.specialization ? `(${doc.specialization})` : ''}
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
                      min={new Date().toISOString().split('T')[0]}
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
                      <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {slots.map((s) => {
                          const startTime = new Date(s.slotStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                          const endTime = new Date(s.slotEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                          const isSelected = selectedSlotId === s.slotId;
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
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* KHUNG 3: LÝ DO KHÁM */}
            <div className="bg-white/5 p-4.5 rounded-xl border border-white/10 space-y-2">
              <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                * Nhập vấn đề sức khỏe cần khám
              </span>
              <textarea
                placeholder="Mô tả ngắn gọn triệu chứng hoặc nhu cầu khám bệnh của bạn..."
                rows={2.5}
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
                className="w-full bg-white text-slate-800 font-semibold p-3.5 rounded-lg border border-transparent focus:ring-2 focus:ring-yellow-400 outline-none resize-none text-xs md:text-[13px]"
              />
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

