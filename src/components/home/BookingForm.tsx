import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  User,
  Check,
  Activity,
  ShieldAlert,
  Award,
  ChevronDown,
  Stethoscope,
  Building2,
  Clock,
  Sparkles,
  Loader2,
  ShieldCheck,
  Mail,
  Phone,
  CreditCard,
  KeyRound,
  RefreshCw,
  Plus
} from 'lucide-react';
import { doctorService, type DepartmentResponse, type DoctorResponse } from '../../services/doctor/doctor.service';
import { appointmentService, type AppointmentSlotResponse, type AppointmentItem } from '../../services/appointment/appointment.service';

export const BookingForm = () => {
  // Dynamic API Lists
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [slots, setSlots] = useState<AppointmentSlotResponse[]>([]);

  // Selection State
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [serviceLevel, setServiceLevel] = useState<'tieu-chuan' | 'vip'>('tieu-chuan');
  const [reasonForVisit, setReasonForVisit] = useState<string>('');

  // Guest Patient Info State (No login required)
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [identityNumber, setIdentityNumber] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('1995-01-01');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [verifyMethod, setVerifyMethod] = useState<'email' | 'sms'>('email');

  // OTP Step State
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [otp, setOtp] = useState<string>('');
  const [otpNotice, setOtpNotice] = useState<string>('');

  // Loading & Error States
  const [loadingInit, setLoadingInit] = useState<boolean>(true);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successBooking, setSuccessBooking] = useState<AppointmentItem | null>(null);

  // 1. Fetch initial Departments & Doctors
  useEffect(() => {
    const fetchInit = async () => {
      try {
        setLoadingInit(true);
        const [deptList, docList] = await Promise.all([
          doctorService.getDepartments(),
          doctorService.getDoctors(),
        ]);

        const activeDepts = deptList.filter((d) => d.isActive);
        setDepartments(activeDepts);
        if (activeDepts.length > 0) {
          setSelectedDeptId(activeDepts[0].departmentId);
        }

        const activeDocs = docList.filter((d) => d.isActive);
        setDoctors(activeDocs);
      } catch (err) {
        console.error('Failed to load init data for booking form:', err);
      } finally {
        setLoadingInit(false);
      }
    };
    fetchInit();
  }, []);

  // Filter Doctors by selected Department
  const filteredDoctors = doctors.filter((doc) => {
    if (!selectedDeptId) return true;
    return doc.doctorDepartments?.some((dd) => dd.departmentId === selectedDeptId);
  });

  // Auto select first doctor when department changes
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

  // Load free slots when doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setSlots([]);
      setSelectedSlotId('');
      return;
    }

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setSelectedSlotId('');
        const freeSlots = await appointmentService.getFreeSlots(selectedDoctorId, selectedDate);
        setSlots(freeSlots);
        if (freeSlots.length > 0) {
          setSelectedSlotId(freeSlots[0].slotId);
        }
      } catch (err) {
        setSlots([]);
        setSelectedSlotId('');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  // Form Validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên';
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{9,11}$/.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ (9-11 chữ số)';
    }

    if (verifyMethod === 'email' && !email.trim()) {
      newErrors.email = 'Vui lòng nhập email để nhận mã OTP';
    } else if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Địa chỉ email không đúng định dạng';
    }

    if (!identityNumber.trim()) {
      newErrors.identityNumber = 'Vui lòng nhập số CCCD / CMND';
    } else if (identityNumber.trim().length < 9) {
      newErrors.identityNumber = 'Số CCCD/CMND tối thiểu 9 chữ số';
    }

    if (!selectedDeptId) newErrors.selectedDeptId = 'Vui lòng chọn chuyên khoa';
    if (!selectedDoctorId) newErrors.selectedDoctorId = 'Vui lòng chọn bác sĩ';
    if (!selectedSlotId) newErrors.selectedSlotId = 'Vui lòng chọn khung giờ khám còn trống';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1: Submit Form -> Call Request OTP
  const handleRequestOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setErrors({});

      const priority = serviceLevel === 'vip' ? 'urgent' : 'normal';

      const res = await appointmentService.guestRequestOtp({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        identityNumber: identityNumber.trim(),
        dateOfBirth,
        gender,
        departmentId: selectedDeptId,
        doctorId: selectedDoctorId,
        slotId: selectedSlotId,
        reasonForVisit: reasonForVisit.trim()
          ? `${serviceLevel === 'vip' ? '[Khám VIP] ' : ''}${reasonForVisit.trim()}`
          : (serviceLevel === 'vip' ? 'Khám VIP' : undefined),
        priority,
        verifyMethod,
      });

      setOtpNotice(res?.message || `Mã OTP đã được gửi đến ${verifyMethod === 'email' ? email : phoneNumber}`);
      setStep('otp');
    } catch (err: any) {
      setErrors({ submit: err?.message || 'Không thể gửi yêu cầu đặt lịch. Vui lòng kiểm tra lại thông tin.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setErrors({ otp: 'Vui lòng nhập mã OTP gồm đúng 6 chữ số' });
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      const res = await appointmentService.guestVerifyOtp({
        phoneNumber: phoneNumber.trim(),
        otp: otp.trim(),
        email: email.trim() || undefined,
      });

      setSuccessBooking(res);
      setStep('success');
    } catch (err: any) {
      setErrors({ otp: err?.message || 'Mã OTP không chính xác hoặc đã hết hạn. Vui lòng thử lại.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setOtp('');
    setSuccessBooking(null);
    setErrors({});
    setReasonForVisit('');
    setSelectedSlotId('');
  };

  const currentDept = departments.find((d) => d.departmentId === selectedDeptId);
  const currentDoctor = doctors.find((d) => d.doctorId === selectedDoctorId);
  const currentSlot = slots.find((s) => s.slotId === selectedSlotId);

  return (
    <div className="bg-slate-100/60 p-3 rounded-[2rem] border border-slate-200/50 shadow-md w-full max-w-xl mx-auto relative">
      <div className="text-white rounded-[calc(2rem-0.625rem)] flex flex-col h-auto relative z-10">
        {/* Glowing background */}
        <div className="absolute inset-0 rounded-[calc(2rem-0.625rem)] overflow-hidden pointer-events-none z-0 bg-[#0b3c8f]">
          <div className="absolute inset-[2px] rounded-[calc(2rem-0.625rem-2px)] bg-gradient-to-b from-blue-600 to-blue-700 z-[1]" />
          <div className="absolute w-[280px] h-[250px] bg-white blur-[50px] -left-16 -top-16 opacity-35 z-[2] animate-pulse" />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col w-full h-full">
          {/* Form Title Header */}
          <div className="bg-[#0b3c8f]/95 py-4 px-6 border-b border-blue-500/20 text-center rounded-t-[calc(2rem-0.625rem)]">
            <h3 className="font-bold text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-300" />
              <span>Đăng ký khám bệnh trực tuyến</span>
            </h3>
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: FORM GUEST BOOKING */}
            {step === 'form' && (
              <motion.form
                key="guest-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleRequestOtpSubmit}
                className="p-6 space-y-4 flex flex-col"
              >
                {errors.submit && (
                  <div className="p-3 bg-yellow-400/20 border border-yellow-300/40 rounded-xl flex items-center gap-2 text-yellow-200 text-xs">
                    <ShieldAlert className="w-4 h-4 text-yellow-300 shrink-0" />
                    <span>{errors.submit}</span>
                  </div>
                )}

                {/* KHUNG 1: THÔNG TIN KHÁCH HÀNG (GUEST) */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                  <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                    * 1. Thông tin người đăng ký (Không cần đăng nhập)
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-blue-100 mb-1">Họ và tên *</label>
                      <input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`w-full bg-white text-slate-800 font-semibold py-2 px-3 rounded-lg text-xs outline-none border ${
                          errors.fullName ? 'border-yellow-400' : 'border-transparent'
                        }`}
                      />
                      {errors.fullName && <span className="text-[10px] text-yellow-300 block mt-0.5">{errors.fullName}</span>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-blue-100 mb-1">Số điện thoại *</label>
                      <input
                        type="tel"
                        placeholder="0901234567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className={`w-full bg-white text-slate-800 font-semibold py-2 px-3 rounded-lg text-xs outline-none border ${
                          errors.phoneNumber ? 'border-yellow-400' : 'border-transparent'
                        }`}
                      />
                      {errors.phoneNumber && <span className="text-[10px] text-yellow-300 block mt-0.5">{errors.phoneNumber}</span>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-blue-100 mb-1">Số CCCD / CMND *</label>
                      <input
                        type="text"
                        placeholder="079090001234"
                        value={identityNumber}
                        onChange={(e) => setIdentityNumber(e.target.value)}
                        className={`w-full bg-white text-slate-800 font-semibold py-2 px-3 rounded-lg text-xs outline-none border ${
                          errors.identityNumber ? 'border-yellow-400' : 'border-transparent'
                        }`}
                      />
                      {errors.identityNumber && <span className="text-[10px] text-yellow-300 block mt-0.5">{errors.identityNumber}</span>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-blue-100 mb-1">Email nhận thông báo</label>
                      <input
                        type="email"
                        placeholder="guest@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full bg-white text-slate-800 font-semibold py-2 px-3 rounded-lg text-xs outline-none border ${
                          errors.email ? 'border-yellow-400' : 'border-transparent'
                        }`}
                      />
                      {errors.email && <span className="text-[10px] text-yellow-300 block mt-0.5">{errors.email}</span>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-blue-100 mb-1">Ngày sinh *</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full bg-white text-slate-800 font-semibold py-2 px-3 rounded-lg text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-blue-100 mb-1">Giới tính *</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full bg-white text-slate-800 font-semibold py-2 px-3 rounded-lg text-xs outline-none"
                      >
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                  </div>

                  {/* Kênh nhận mã OTP */}
                  <div className="pt-1">
                    <span className="block text-[10px] font-bold uppercase text-blue-100 mb-1">Kênh nhận mã OTP xác nhận *</span>
                    <div className="grid grid-cols-2 bg-white p-1 rounded-lg text-center font-bold">
                      <button
                        type="button"
                        onClick={() => setVerifyMethod('email')}
                        className={`py-1.5 rounded text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          verifyMethod === 'email' ? 'bg-[#0b3c8f] text-white shadow-xs' : 'text-slate-700'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" /> Email
                      </button>
                      <button
                        type="button"
                        onClick={() => setVerifyMethod('sms')}
                        className={`py-1.5 rounded text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          verifyMethod === 'sms' ? 'bg-[#0b3c8f] text-white shadow-xs' : 'text-slate-700'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" /> SMS / SĐT
                      </button>
                    </div>
                  </div>
                </div>

                {/* KHUNG 2: DỊCH VỤ & BÁC SĨ KHÁM */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3 font-sans">
                  {/* Chọn loại hình khám */}
                  <div className="space-y-1">
                    <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                      * 2. Chọn loại hình & chuyên khoa khám
                    </span>
                    <div className="grid grid-cols-2 bg-white p-1 rounded-lg text-center font-bold">
                      <button
                        type="button"
                        onClick={() => setServiceLevel('tieu-chuan')}
                        className={`py-1.5 rounded text-xs flex items-center justify-center gap-1 cursor-pointer ${
                          serviceLevel === 'tieu-chuan' ? 'bg-[#0b3c8f] text-white' : 'text-slate-700'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5" /> Khám Tiêu Chuẩn
                      </button>
                      <button
                        type="button"
                        onClick={() => setServiceLevel('vip')}
                        className={`py-1.5 rounded text-xs flex items-center justify-center gap-1 cursor-pointer ${
                          serviceLevel === 'vip' ? 'bg-[#0b3c8f] text-white' : 'text-slate-700'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" /> Khám VIP
                      </button>
                    </div>
                  </div>

                  {/* Chuyên khoa */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-blue-100 mb-1">Chuyên khoa *</label>
                    <div className="relative">
                      <select
                        value={selectedDeptId}
                        onChange={(e) => setSelectedDeptId(e.target.value)}
                        className="w-full bg-white text-slate-800 font-semibold py-2 pl-3 pr-8 rounded-lg text-xs outline-none appearance-none"
                      >
                        {departments.map((d) => (
                          <option key={d.departmentId} value={d.departmentId}>
                            {d.departmentName} ({d.departmentCode})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Bác sĩ */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-blue-100 mb-1">Bác sĩ phụ trách *</label>
                    <div className="relative">
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        disabled={filteredDoctors.length === 0}
                        className="w-full bg-white text-slate-800 font-semibold py-2 pl-3 pr-8 rounded-lg text-xs outline-none appearance-none disabled:bg-white/80"
                      >
                        {filteredDoctors.length === 0 ? (
                          <option value="">Chưa có bác sĩ thuộc khoa này</option>
                        ) : (
                          filteredDoctors.map((doc) => (
                            <option key={doc.doctorId} value={doc.doctorId}>
                              {doc.title ? `${doc.title}. ` : ''}{doc.fullName} {doc.specialization ? `(${doc.specialization})` : ''}
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Ngày & Slot */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-blue-100 mb-1">Ngày & Khung giờ khám *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="date"
                        value={selectedDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-white text-slate-800 font-semibold py-2 px-2.5 rounded-lg text-xs outline-none"
                      />
                      <div className="sm:col-span-2">
                        {loadingSlots ? (
                          <div className="bg-white/80 p-2 rounded-lg text-slate-600 text-xs text-center flex items-center justify-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0b3c8f]" /> Tải khung giờ...
                          </div>
                        ) : slots.length === 0 ? (
                          <div className="bg-white/80 p-2 rounded-lg text-slate-500 text-[11px] text-center">
                            Không có slot trống ngày này
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1 max-h-28 overflow-y-auto pr-1">
                            {slots.map((s) => {
                              const startTime = new Date(s.slotStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                              const endTime = new Date(s.slotEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                              const isSelected = selectedSlotId === s.slotId;
                              return (
                                <button
                                  key={s.slotId}
                                  type="button"
                                  onClick={() => setSelectedSlotId(s.slotId)}
                                  className={`py-1 px-2 rounded text-[11px] font-bold transition-all flex items-center justify-between border cursor-pointer ${
                                    isSelected
                                      ? 'bg-white text-[#0b3c8f] border-white shadow-xs'
                                      : 'bg-white/20 text-white border-white/20 hover:bg-white/30'
                                  }`}
                                >
                                  <span>{startTime}-{endTime}</span>
                                  <span className="text-[9px] opacity-80 font-normal">({s.capacity - s.bookedCount})</span>
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
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1">
                  <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                    * 3. Vấn đề sức khỏe cần khám
                  </span>
                  <textarea
                    placeholder="Mô tả triệu chứng bệnh hoặc nhu cầu khám..."
                    rows={2}
                    value={reasonForVisit}
                    onChange={(e) => setReasonForVisit(e.target.value)}
                    className="w-full bg-white text-slate-800 font-semibold p-2.5 rounded-lg text-xs outline-none resize-none"
                  />
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedSlotId}
                    className="w-full bg-[#0b3c8f] hover:bg-[#072a6b] text-white font-bold py-3.5 rounded-xl uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-blue-500/20 text-xs md:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span>Nhận mã OTP xác nhận đăng ký →</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 2: ENTER OTP */}
            {step === 'otp' && (
              <motion.form
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtpSubmit}
                className="p-6 space-y-6 flex flex-col text-center"
              >
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20">
                  <KeyRound className="w-7 h-7 text-yellow-400" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-lg font-bold text-white uppercase tracking-tight">Xác thực mã OTP</h4>
                  <p className="text-xs text-blue-100 max-w-sm mx-auto leading-relaxed">
                    {otpNotice}
                  </p>
                </div>

                <div className="bg-white/10 p-5 rounded-2xl border border-white/15 space-y-4 max-w-xs mx-auto w-full">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black bg-white text-slate-900 py-3 rounded-xl outline-none focus:ring-4 focus:ring-yellow-400/40"
                  />

                  {errors.otp && (
                    <span className="text-xs text-yellow-300 font-semibold block">{errors.otp}</span>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || otp.length !== 6}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black py-3 rounded-xl uppercase tracking-wider text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-950" />
                    ) : (
                      <span>Xác nhận & Hoàn tất đặt lịch</span>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-blue-100 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="hover:underline font-semibold text-white cursor-pointer"
                  >
                    ← Quay lại sửa thông tin
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestOtpSubmit}
                    disabled={isSubmitting}
                    className="hover:underline font-semibold text-yellow-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Gửi lại mã
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 3: SUCCESS VIEW */}
            {step === 'success' && successBooking && (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center space-y-5"
              >
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20">
                  <Check className="w-8 h-8 text-yellow-400 stroke-[3]" />
                </div>

                <div>
                  <h4 className="text-xl font-bold uppercase tracking-tight mb-1 text-white">Đăng ký khám thành công</h4>
                  <p className="text-blue-100 text-xs max-w-sm mx-auto">
                    Mã số lịch hẹn của bạn là:
                    <strong className="text-yellow-400 font-mono text-xl block mt-1 tracking-wider">{successBooking.appointmentCode}</strong>
                  </p>
                </div>

                <div className="space-y-2.5 text-left bg-white/10 p-5 rounded-2xl border border-white/15 text-xs text-blue-50">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="opacity-75">Khách hàng:</span>
                    <span className="font-bold text-white">{fullName} ({phoneNumber})</span>
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
                    <span className="opacity-75">Kênh xác thực:</span>
                    <span className="font-bold text-white uppercase">{verifyMethod}</span>
                  </div>
                </div>

                <div className="bg-white/10 p-4 rounded-xl text-left border border-white/15 flex items-start gap-3 text-xs text-blue-100">
                  <ShieldCheck className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <p>
                    Quý khách vui lòng đến trước giờ hẹn <strong>15 phút</strong> và xuất trình mã <strong>{successBooking.appointmentCode}</strong> tại quầy Lễ tân để nhận thẻ thứ tự ưu tiên.
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="bg-white text-blue-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-400 hover:text-blue-950 transition-all uppercase tracking-wider text-xs active:scale-95 shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Đăng ký lịch khám mới</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
