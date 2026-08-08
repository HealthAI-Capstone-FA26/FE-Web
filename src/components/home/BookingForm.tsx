import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, User, ChevronDown, Check, Activity, ShieldAlert, Award, ChevronLeft, ChevronRight, Sun, Sunrise, Sunset } from 'lucide-react';

/*
 * DESIGN READ:
 * Component: BookingForm (Đăng ký khám bệnh)
 * Vibe: High-trust, professional, responsive, interactive, highly accessible
 * Change: Styled the tab selectors and radio container to have solid white backgrounds, 
 *         dark slate text for inactive states, and deep blue backgrounds for active states,
 *         matching the template screenshot exactly.
 */

const locations = [
  "BVĐK 4AM Hà Nội",
  "Phòng khám ĐK 4AM Cầu Giấy",
  "BVĐK 4AM TP. HCM",
  "BVĐK 4AM Q8",
  "Phòng khám ĐK 4AM Q7"
];

const specialties = [
  "CK Tiêu hóa",
  "CK Tim mạch & Lồng ngực",
  "Khoa Xạ trị - Ung bướu",
  "Khoa Ngoại Nhi",
  "Kiểm soát cân nặng & Béo phì",
  "Khoa Ngoại Thần kinh - Cột sống",
  "Trung tâm Hỗ trợ sinh sản (IVF)",
  "Trung tâm Mắt Công nghệ cao",
  "Khoa Ngoại Tổng hợp",
  "Trung tâm Khoa học Thần kinh"
];

const doctors = [
  "BS.CKI Nguyễn Hữu Trí (CK Tiêu hóa)",
  "GS.TS.BS. Nguyễn Hữu Ước (Tim mạch)",
  "PGS.TS.BS. Lê Hoàng (IVF/Sản khoa)",
  "TS.BS. Nguyễn Việt Hoa (Ngoại Nhi)",
  "BS.CKII. Trần Minh Thắng (Béo phì)",
  "TS.BS. Nguyễn Anh Tuấn (Ngoại Thần kinh)",
  "ThS.BS. Nguyễn Thị Vân Anh (Mắt)",
  "PGS.TS.BS. Nguyễn Anh Dũng (Ngoại Tổng hợp)",
  "PGS.TS.BS. Nguyễn Văn Liệu (Thần kinh)"
];

export const BookingForm = () => {
  // Form State
  const [location, setLocation] = useState<string | null>(null); // Start unselected
  const [serviceType, setServiceType] = useState<string | null>(null); // Start unselected
  const [specialty, setSpecialty] = useState(''); // Start with empty placeholder
  const [serviceLevel, setServiceLevel] = useState('tieu-chuan');
  const [bookingType, setBookingType] = useState('bac-si');
  const [doctor, setDoctor] = useState(''); // Start with empty placeholder
  const [dateSlot, setDateSlot] = useState('');
  const [healthConcern, setHealthConcern] = useState('');
  
  // Custom Date Picker Popover State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(6); // 6 = July (0-indexed)
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null); // 'sang', 'trua', 'chieu'
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close calendar popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!specialty) newErrors.specialty = "Vui lòng chọn chuyên khoa khám";
    if (bookingType === 'bac-si' && !doctor) newErrors.doctor = "Vui lòng chọn bác sĩ khám";
    if (!dateSlot) newErrors.dateSlot = "Vui lòng chọn ngày và khung giờ khám";
    if (!healthConcern.trim()) newErrors.healthConcern = "Vui lòng mô tả vấn đề sức khỏe";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setLocation(null);
    setServiceType(null); // Reset serviceType
    setSpecialty(''); // Reset specialty
    setDoctor(''); // Reset doctor
    setDateSlot('');
    setSelectedDay(null);
    setSelectedTimeSlot(null);
    setHealthConcern('');
  };

  const isLocationSelected = location !== null;
  const isServiceTypeSelected = serviceType !== null;
  const isDoctorEnabled = isServiceTypeSelected && bookingType === 'bac-si';

  // Calendar Helper functions
  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m: number, y: number) => {
    // JS: 0=Sunday, 1=Monday ... 6=Saturday
    // Desired: 0=T2, 1=T3, 2=T4, 3=T5, 4=T6, 5=T7, 6=CN
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null); // Clear selected day
    setSelectedTimeSlot(null); // Reset selected time slot
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null); // Clear selected day
    setSelectedTimeSlot(null); // Reset selected time slot
  };

  // Doctors work every day except Sundays
  const isDayAvailable = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.getDay() !== 0; // 0 = Sunday
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayIndex = getFirstDayOfMonth(currentMonth, currentYear);
  
  // Create arrays for calendar grid
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const handleConfirmDateTime = () => {
    if (selectedDay && selectedTimeSlot) {
      const slotText = selectedTimeSlot === 'sang' ? 'Sáng' : selectedTimeSlot === 'trua' ? 'Trưa' : 'Chiều';
      const formattedDate = `${selectedDay}/${currentMonth + 1}/${currentYear}, Buổi ${slotText}`;
      setDateSlot(formattedDate);
      setShowDatePicker(false);
      
      // Clear error if set
      if (errors.dateSlot) {
        const updatedErrors = { ...errors };
        delete updatedErrors.dateSlot;
        setErrors(updatedErrors);
      }
    }
  };

  return (
    <div className="bg-slate-100/60 p-3 rounded-[2rem] border border-slate-200/50 shadow-md w-full max-w-xl mx-auto relative">
      
      {/* Inner Core Container with absolute glowing border sweep background */}
      <div className="text-white rounded-[calc(2rem-0.625rem)] flex flex-col h-auto relative z-10">
        
        {/* Glowing border sweep background layout */}
        <div className="absolute inset-0 rounded-[calc(2rem-0.625rem)] overflow-hidden pointer-events-none z-0 bg-[#0b3c8f]">
          {/* Inner solid background card */}
          <div className="absolute inset-[2px] rounded-[calc(2rem-0.625rem-2px)] bg-gradient-to-b from-blue-600 to-blue-700 z-[1]" />
          {/* Glowing blurred sweep light blob */}
          <div className="absolute w-[280px] h-[250px] bg-white blur-[50px] -left-16 -top-16 opacity-35 z-[2] animate-pulse" />
        </div>

        {/* Content Wrapper sitting on top of background */}
        <div className="relative z-10 flex flex-col w-full h-full">
          
          {/* Form Title Header */}
          <div className="bg-[#0b3c8f]/95 py-4 px-6 border-b border-blue-500/20 text-center rounded-t-[calc(2rem-0.625rem)]">
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">Đăng ký khám bệnh</h3>
          </div>

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="p-6 space-y-5 flex flex-col"
              >
                
                {/* KHUNG 1: ĐỊA ĐIỂM & DỊCH VỤ KHÁM (Luôn hiển thị) */}
                <div className="bg-white/5 p-4.5 rounded-xl border border-white/10 space-y-4">
                  
                  {/* 1. Chọn địa điểm khám */}
                  <div className="space-y-2">
                    <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                      * Chọn địa điểm khám
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200/50 shadow-inner">
                      {locations.map((loc) => {
                        const isSelected = location === loc;
                        return (
                          <label 
                            key={loc} 
                            className={`flex items-center gap-2.5 py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50 text-[#0b3c8f] font-bold' : 'text-slate-700 hover:text-[#0b3c8f] hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="location"
                              value={loc}
                              checked={isSelected}
                              onChange={() => setLocation(loc)}
                              className="sr-only"
                            />
                            <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                              isSelected ? 'border-[#0b3c8f] bg-[#0b3c8f] text-white' : 'border-slate-300 bg-transparent'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3] text-white" />}
                            </div>
                            <span className="text-xs md:text-[13px] truncate font-medium">{loc}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Chọn loại dịch vụ khám */}
                  <div className={`space-y-2 transition-all duration-300 ${
                    !isLocationSelected ? 'opacity-35 pointer-events-none select-none' : 'opacity-100'
                  }`}>
                    <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                      * Chọn loại dịch vụ khám
                    </span>
                    <div className="grid grid-cols-3 bg-white p-1 rounded-xl border border-slate-200/50 text-center font-bold shadow-inner">
                      {[
                        { id: 'trong-gio', label: 'Khám trong giờ' },
                        { id: 'ngoai-gio', label: 'Khám ngoài giờ' },
                        { id: 'online', label: 'Khám online' }
                      ].map((tab, idx) => {
                        const isActive = serviceType === tab.id;
                        return (
                          <div key={tab.id} className="relative flex items-center w-full">
                            {/* Thin vertical divider line */}
                            {idx > 0 && !isActive && serviceType !== [
                              { id: 'trong-gio', label: 'Khám trong giờ' },
                              { id: 'ngoai-gio', label: 'Khám ngoài giờ' },
                              { id: 'online', label: 'Khám online' }
                            ][idx - 1].id && (
                              <div className="absolute left-0 h-4 w-[1px] bg-slate-200/80" />
                            )}
                            <button
                              type="button"
                              disabled={!isLocationSelected}
                              onClick={() => setServiceType(tab.id)}
                              className={`py-2 rounded-lg w-full transition-all duration-300 uppercase tracking-tight text-xs cursor-pointer font-bold ${
                                isActive 
                                  ? 'bg-[#0b3c8f] text-white shadow-md' 
                                  : 'text-slate-700 hover:text-[#0b3c8f] hover:bg-slate-50'
                              }`}
                            >
                              {tab.label}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Faded/Disabled Wrapper for downstream panels */}
                <div className={`space-y-5 transition-all duration-300 ${
                  !isServiceTypeSelected ? 'opacity-35 pointer-events-none select-none' : 'opacity-100'
                }`}>
                  
                  {/* KHUNG 2: THÔNG TIN CHUYÊN MÔN & LỊCH HẸN */}
                  <div className="bg-white/5 p-4.5 rounded-xl border border-white/10 space-y-4.5 font-sans">
                    
                    {/* 4. Chọn gói khám */}
                    <div className="space-y-2">
                      <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px] font-sans">
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
                              {idx > 0 && !isActive && serviceLevel !== ['tieu-chuan', 'vip'][idx - 1] && (
                                <div className="absolute left-0 h-4 w-[1px] bg-slate-200/80" />
                              )}
                              <button
                                type="button"
                                disabled={!isServiceTypeSelected}
                                onClick={() => setServiceLevel(tab.id)}
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

                    {/* 3. Chọn chuyên khoa */}
                    <div className="space-y-2">
                      <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                        * Chọn chuyên khoa
                      </span>
                      <div className="relative">
                        <select
                          value={specialty}
                          disabled={!isServiceTypeSelected}
                          onChange={(e) => setSpecialty(e.target.value)}
                          className={`w-full bg-white text-slate-800 font-semibold py-2.5 pl-4 pr-10 rounded-lg border ${
                            errors.specialty ? 'border-yellow-400 focus:ring-yellow-500' : 'border-transparent focus:ring-yellow-400'
                          } focus:ring-2 focus:border-transparent outline-none appearance-none cursor-pointer text-xs md:text-[13px] disabled:bg-white/90 disabled:text-slate-400`}
                        >
                          <option value="" disabled className="text-slate-400">Chọn chuyên khoa</option>
                          {specialties.map((spec) => (
                            <option key={spec} value={spec} className="text-slate-800">{spec}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {errors.specialty && (
                        <span className="text-xs text-yellow-300 flex items-center gap-1.5 font-semibold mt-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> {errors.specialty}
                        </span>
                      )}
                    </div>

                    {/* 5. Đặt lịch khám */}
                    <div className="space-y-2">
                      <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                        * Đặt lịch khám
                      </span>
                      <div className="grid grid-cols-2 bg-white p-1 rounded-xl border border-slate-200/50 text-center font-bold shadow-inner">
                        {[
                          { id: 'bac-si', label: 'Theo bác sĩ', icon: User },
                          { id: 'ngay', label: 'Theo ngày', icon: Calendar }
                        ].map((tab, idx) => {
                          const isActive = bookingType === tab.id;
                          const Icon = tab.icon;
                          return (
                            <div key={tab.id} className="relative flex items-center w-full">
                              {idx > 0 && !isActive && bookingType !== ['bac-si', 'ngay'][idx - 1] && (
                                <div className="absolute left-0 h-4 w-[1px] bg-slate-200/80" />
                              )}
                              <button
                                type="button"
                                disabled={!isServiceTypeSelected}
                                onClick={() => setBookingType(tab.id)}
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

                    {/* 6. Chọn bác sĩ - Always visible, disabled if bookingType is 'ngay' */}
                    <div className={`space-y-2 transition-all duration-300 ${
                      !isDoctorEnabled ? 'opacity-35 pointer-events-none select-none' : 'opacity-100'
                    }`}>
                      <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                        * Chọn bác sĩ
                      </span>
                      <div className="relative">
                        <select
                          value={bookingType === 'bac-si' ? doctor : 'Theo lịch khoa'}
                          disabled={!isDoctorEnabled}
                          onChange={(e) => setDoctor(e.target.value)}
                          className={`w-full bg-white text-slate-800 font-semibold py-2.5 pl-4 pr-10 rounded-lg border ${
                            errors.doctor && bookingType === 'bac-si' ? 'border-yellow-400 focus:ring-yellow-500' : 'border-transparent focus:ring-yellow-400'
                          } focus:ring-2 focus:border-transparent outline-none appearance-none cursor-pointer text-xs md:text-[13px] disabled:bg-white/90 disabled:text-slate-400`}
                        >
                          {bookingType === 'bac-si' ? (
                            <>
                              <option value="" disabled className="text-slate-400">Chọn bác sĩ</option>
                              {doctors.map((doc) => (
                                <option key={doc} value={doc} className="text-slate-800">{doc}</option>
                              ))}
                            </>
                          ) : (
                            <option value="Theo lịch khoa" className="text-slate-800">
                              Bác sĩ trực khoa (Theo lịch phân công)
                            </option>
                          )}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {errors.doctor && bookingType === 'bac-si' && (
                        <span className="text-xs text-yellow-300 flex items-center gap-1.5 font-semibold mt-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> {errors.doctor}
                        </span>
                      )}
                    </div>

                    {/* 7. Chọn ngày - khung giờ muốn khám (With Custom Calendar Popover) */}
                    <div className="space-y-2 relative" ref={popoverRef}>
                      <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                        * Chọn ngày - khung giờ muốn khám
                      </span>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          disabled={!isServiceTypeSelected}
                          placeholder="Chọn ngày - khung giờ muốn khám"
                          value={dateSlot}
                          onClick={() => isServiceTypeSelected && setShowDatePicker(!showDatePicker)}
                          className={`w-full bg-white text-slate-800 font-semibold py-2.5 pl-4 pr-10 rounded-lg border ${
                            errors.dateSlot ? 'border-yellow-400 focus:ring-yellow-500' : 'border-transparent focus:ring-yellow-400'
                          } focus:ring-2 focus:border-transparent outline-none text-xs md:text-[13px] cursor-pointer disabled:bg-white/90 disabled:text-slate-400 disabled:cursor-not-allowed`}
                        />
                        <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {errors.dateSlot && (
                        <span className="text-xs text-yellow-300 flex items-center gap-1.5 font-semibold mt-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> {errors.dateSlot}
                        </span>
                      )}

                      {/* CUSTOM CALENDAR POPOVER POPUP */}
                      <AnimatePresence>
                        {showDatePicker && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 z-20 text-slate-800 font-sans"
                          >
                            {/* Calendar Month Header */}
                            <div className="flex justify-between items-center mb-4">
                              <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors cursor-pointer"
                              >
                                <ChevronLeft className="w-5 h-5 text-blue-900" />
                              </button>
                              <span className="font-bold text-slate-800 text-sm">
                                Tháng {currentMonth + 1} / {currentYear}
                              </span>
                              <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors cursor-pointer"
                              >
                                <ChevronRight className="w-5 h-5 text-blue-900" />
                              </button>
                            </div>

                            {/* Weekdays Headers */}
                            <div className="grid grid-cols-7 text-center font-bold text-slate-500 mb-2 text-xs">
                              <span>T2</span>
                              <span>T3</span>
                              <span>T4</span>
                              <span>T5</span>
                              <span>T6</span>
                              <span>T7</span>
                              <span>CN</span>
                            </div>

                            {/* Calendar Days Grid */}
                            <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
                              {calendarCells.map((day, index) => {
                                if (day === null) {
                                  return <div key={`empty-${index}`} className="py-2"></div>;
                                }

                                const available = isDayAvailable(day);
                                const isSelected = selectedDay === day;

                                return (
                                  <button
                                    key={`day-${day}`}
                                    type="button"
                                    onClick={() => {
                                      if (available) {
                                        setSelectedDay(day);
                                        setSelectedTimeSlot(null); // Reset time slot when changing day
                                      }
                                    }}
                                    className={`py-1.5 relative w-8 h-8 mx-auto rounded-full flex flex-col items-center justify-center transition-all ${
                                      isSelected 
                                        ? 'bg-blue-900 text-white font-bold' 
                                        : available 
                                          ? 'hover:bg-slate-100 text-slate-800 font-medium cursor-pointer' 
                                          : 'text-slate-300 cursor-not-allowed'
                                    }`}
                                  >
                                    <span>{day}</span>
                                    {/* Small indicator dot for available days (not selected) */}
                                    {available && !isSelected && (
                                      <span className="absolute bottom-1 w-1 h-1 bg-blue-900 rounded-full"></span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-4 pb-3 border-b border-slate-100">
                              <span className="w-2.5 h-2.5 bg-blue-900 rounded-full inline-block"></span>
                              <span className="font-semibold">Ngày bác sĩ có lịch khám</span>
                            </div>

                            {/* Time Slots Selector - Dimmed & Locked until day is selected */}
                            <div className={`mt-4 space-y-2.5 transition-all duration-300 ${
                              !selectedDay ? 'opacity-35 pointer-events-none select-none' : 'opacity-100'
                            }`}>
                              <h4 className="font-bold text-slate-800 text-xs">Chọn khung giờ khám</h4>
                              
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { id: 'sang', label: 'Sáng', icon: Sunrise },
                                  { id: 'trua', label: 'Trưa', icon: Sun },
                                  { id: 'chieu', label: 'Chiều', icon: Sunset }
                                ].map((slot) => {
                                  const SlotIcon = slot.icon;
                                  const isSlotSelected = selectedTimeSlot === slot.id;
                                  return (
                                    <button
                                      key={slot.id}
                                      type="button"
                                      disabled={!selectedDay}
                                      onClick={() => setSelectedTimeSlot(slot.id)}
                                      className={`py-2 px-1 border rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                                        isSlotSelected 
                                          ? 'bg-blue-900 border-blue-900 text-white' 
                                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                                      }`}
                                    >
                                      <SlotIcon className="w-3.5 h-3.5 shrink-0" />
                                      <span>{slot.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Confirm Button */}
                            <div className="mt-5">
                              <button
                                type="button"
                                onClick={handleConfirmDateTime}
                                disabled={!selectedDay || !selectedTimeSlot}
                                className={`w-full py-2.5 rounded-lg text-center text-[11px] uppercase tracking-wider font-bold transition-colors ${
                                  selectedDay && selectedTimeSlot 
                                    ? 'bg-[#0b3c8f] text-white hover:bg-blue-950 cursor-pointer shadow-md' 
                                    : 'bg-blue-900/60 text-white/70 cursor-not-allowed'
                                }`}
                              >
                                {selectedDay && selectedTimeSlot 
                                  ? `Chọn ngày ${selectedDay}/${currentMonth + 1}/${currentYear} - ${selectedTimeSlot === 'sang' ? 'Sáng' : selectedTimeSlot === 'trua' ? 'Trưa' : 'Chiều'} →` 
                                  : 'Vui lòng chọn ngày và khung giờ khám'}
                              </button>
                            </div>

                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>

                  {/* KHUNG 3: TÌNH TRẠNG SỨC KHỎE */}
                  <div className="bg-white/5 p-4.5 rounded-xl border border-white/10 space-y-4">
                    
                    {/* 8. Nhập vấn đề sức khỏe cần khám */}
                    <div className="space-y-2">
                      <span className="font-bold text-blue-100 uppercase tracking-wider block text-[11px]">
                        * Nhập vấn đề sức khỏe cần khám
                      </span>
                      <textarea
                        disabled={!isServiceTypeSelected}
                        placeholder="Mô tả ngắn gọn triệu chứng bệnh hoặc nhu cầu khám..."
                        rows={2.5}
                        value={healthConcern}
                        onChange={(e) => setHealthConcern(e.target.value)}
                        className={`w-full bg-white text-slate-800 font-semibold p-4 rounded-lg border ${
                          errors.healthConcern ? 'border-yellow-400 focus:ring-yellow-500' : 'border-transparent focus:ring-yellow-400'
                        } focus:ring-2 focus:border-transparent outline-none resize-none text-xs md:text-[13px] disabled:bg-white/90 disabled:text-slate-400`}
                      />
                      {errors.healthConcern && (
                        <span className="text-xs text-yellow-300 flex items-center gap-1.5 font-semibold mt-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> {errors.healthConcern}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Submit Button (Outside boxes, at form footer) */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!isServiceTypeSelected || isSubmitting}
                      className="w-full bg-[#0b3c8f] hover:bg-[#072a6b] text-white font-bold py-3.5 rounded-xl uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-blue-500/20 text-xs md:text-sm disabled:bg-slate-400/50 disabled:text-blue-100/50 disabled:border-transparent disabled:shadow-none"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span>Tiếp theo →</span>
                      )}
                    </button>
                  </div>

                </div>

              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-grow flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 border border-white/20">
                  <Check className="w-8 h-8 text-yellow-400 stroke-[3]" />
                </div>
                <h4 className="text-xl font-bold uppercase tracking-tight mb-2 text-white">Đăng ký thành công</h4>
                <p className="text-blue-100 text-xs md:text-sm max-w-sm leading-relaxed mb-6 font-sans">
                  Cảm ơn bạn đã lựa chọn Bệnh viện Đa khoa 4AM. Mã số đặt lịch của bạn là:
                  <strong className="text-yellow-400 font-mono text-base md:text-lg block mt-1 tracking-wider">4AM-{(Math.floor(100000 + Math.random() * 900000))}</strong>
                </p>
                
                <div className="space-y-3 w-full max-w-xs text-left bg-white/5 p-4 rounded-xl border border-white/10 mb-6 text-xs text-blue-50 font-sans">
                  <div className="flex justify-between border-b border-white/10 pb-1.5">
                    <span className="opacity-70">Địa điểm:</span>
                    <span className="font-bold truncate max-w-[150px]">{location}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-1.5">
                    <span className="opacity-70">Dịch vụ:</span>
                    <span className="font-bold">{serviceType === 'trong-gio' ? 'Khám trong giờ' : serviceType === 'ngoai-gio' ? 'Khám ngoài giờ' : 'Khám online'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-1.5">
                    <span className="opacity-70">Khoa khám:</span>
                    <span className="font-bold truncate max-w-[150px]">{specialty}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-1.5">
                    <span className="opacity-70">Bác sĩ:</span>
                    <span className="font-bold truncate max-w-[150px]">{bookingType === 'bac-si' ? doctor.split(' (')[0] : 'Theo lịch khoa'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Thời gian:</span>
                    <span className="font-bold text-yellow-400 truncate max-w-[150px]">{dateSlot}</span>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="bg-white text-blue-900 font-bold px-8 py-2.5 rounded-full hover:bg-yellow-400 hover:text-blue-950 transition-all uppercase tracking-wider text-xs active:scale-95 shadow-md cursor-pointer"
                >
                  Đặt lịch mới
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
        
      </div>
    </div>
  );
};
