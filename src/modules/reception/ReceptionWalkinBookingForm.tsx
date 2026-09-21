import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, CheckCircle2, Search, Building2, Printer,
  RotateCcw, Sparkles, Phone, Shield, FileText, Loader2, ArrowRight,
  UserCheck, AlertCircle, Info, Clock, Wand2, ShieldAlert, X, ChevronDown, ChevronUp,
  Baby,
} from 'lucide-react';
import { patientService } from '../../services/patient/patient.service';
import { doctorService, type DepartmentResponse } from '../../services/doctor/doctor.service';
import { appointmentService } from '../../services/appointment/appointment.service';
import {
  departmentSuggestionService,
  calcPatientAgeYears,
  confidenceLabel,
  type DepartmentSuggestionResult,
} from '../../services/department/department-suggestion.service';

export interface PatientOption {
  patientId: string;
  patientCode: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  identityNumber?: string;
  insuranceNumber?: string;
  email?: string;
  address?: string;
}

export interface ReceptionWalkinBookingFormProps {
  initialPatient?: PatientOption | null;
  onNavigateToTab?: (tabId: string) => void;
  onOpenCreatePatientModal?: () => void;
}

export const ReceptionWalkinBookingForm: React.FC<ReceptionWalkinBookingFormProps> = ({
  initialPatient,
  onOpenCreatePatientModal,
}) => {
  const navigate = useNavigate();

  // Patient Search & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [patientResults, setPatientResults] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(initialPatient || null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Departments (Instantly populated from preloaded cache on login)
  const [departments, setDepartments] = useState<DepartmentResponse[]>(() => {
    const cached = doctorService.getCachedDepartments();
    return cached ? cached.filter((d) => d.isActive !== false) : [];
  });
  const [isLoadingDepartments, setIsLoadingDepartments] = useState<boolean>(() => {
    return !doctorService.getCachedDepartments();
  });
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(() => {
    const cached = doctorService.getCachedDepartments();
    const active = cached ? cached.filter((d) => d.isActive !== false) : [];
    return active.length > 0 ? active[0].departmentId : '';
  });

  // Reason & Priority
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'emergency'>('normal');

  // AI Department Suggestion State
  const [aiSuggestions, setAiSuggestions] = useState<DepartmentSuggestionResult[]>([]);
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [emergencyAdvice, setEmergencyAdvice] = useState<string>('');
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Submission & Result States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    appointment: any;
    queueTicket: any;
  } | null>(null);

  // Update selected patient if initialPatient changes from parent
  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
    }
  }, [initialPatient]);

  // Load Departments on mount (fast resolve if preloaded)
  useEffect(() => {
    const fetchDepartments = async () => {
      const hasCached = !!doctorService.getCachedDepartments();
      if (!hasCached) {
        setIsLoadingDepartments(true);
      }
      try {
        const data = await doctorService.getDepartments();
        const activeDeps = (data || []).filter((d) => d.isActive !== false);
        setDepartments(activeDeps);
        setSelectedDepartmentId((prev) => {
          if (prev && activeDeps.some((d) => d.departmentId === prev)) return prev;
          return activeDeps.length > 0 ? activeDeps[0].departmentId : '';
        });
      } catch (err: any) {
        console.error('Lỗi tải danh sách khoa phòng:', err);
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  // Debounced Patient Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setPatientResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPatient(true);
      try {
        const results = await patientService.getAllPatients(searchQuery.trim());
        const mapped: PatientOption[] = (results || []).map((p: any) => ({
          patientId: p.patientId || p.id,
          patientCode: p.patientCode || p.patientId,
          fullName: p.fullName,
          dateOfBirth: p.dateOfBirth,
          gender: p.gender,
          phoneNumber: p.phoneNumber,
          identityNumber: p.identityNumber,
          insuranceNumber: p.insuranceNumber,
          email: p.email,
          address: p.address,
        }));
        setPatientResults(mapped);
        setShowPatientDropdown(true);
      } catch (err) {
        console.error('Lỗi tìm kiếm bệnh nhân:', err);
      } finally {
        setIsSearchingPatient(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Quick symptom chips
  const quickSymptoms = [
    'Khám tổng quát',
    'Đau đầu, chóng mặt',
    'Sốt cao, ho kéo dài',
    'Đau bụng, rối loạn tiêu hóa',
    'Đau ngực, khó thở',
    'Tái khám theo hẹn',
    'Đau nhức xương khớp',
    'Kiểm tra huyết áp',
    'Trẻ sơ sinh (≤ 28 ngày)',
    'Bé sốt ho (< 16 tuổi)',
  ];

  const handleSelectPatient = (p: PatientOption) => {
    setSelectedPatient(p);
    setShowPatientDropdown(false);
    setSearchQuery('');
    setErrorMsg(null);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setSearchQuery('');
    setPatientResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedPatient?.patientId) {
      setErrorMsg('Vui lòng chọn hoặc tìm kiếm hồ sơ bệnh nhân trước khi đăng ký.');
      return;
    }

    if (!selectedDepartmentId) {
      setErrorMsg('Vui lòng chọn chuyên khoa tiếp nhận khám.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await appointmentService.createAtHospitalAppointment({
        patientId: selectedPatient.patientId,
        departmentId: selectedDepartmentId,
        reasonForVisit: reasonForVisit.trim() || undefined,
        priority: priority,
      });

      setSuccessResult({
        appointment: res.appointment,
        queueTicket: res.queueTicket,
      });
    } catch (err: any) {
      console.error('Lỗi tạo lịch khám tại quầy:', err);
      setErrorMsg(
        err?.message || 'Không thể tạo phiếu khám tại quầy. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessResult(null);
    setSelectedPatient(null);
    setSearchQuery('');
    setReasonForVisit('');
    setPriority('normal');
    setErrorMsg(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedDepartment = useMemo(() => {
    return departments.find((d) => d.departmentId === selectedDepartmentId);
  }, [departments, selectedDepartmentId]);

  // Compute Age
  const patientAge = useMemo(() => {
    if (!selectedPatient?.dateOfBirth) return null;
    const year = new Date(selectedPatient.dateOfBirth).getFullYear();
    return isNaN(year) ? null : new Date().getFullYear() - year;
  }, [selectedPatient]);

  // AI Department Suggestion
  const handleAISuggest = useCallback(async () => {
    const symptomText = reasonForVisit.trim();
    if (symptomText.length < 3) {
      setAiError('Vui lòng nhập ít nhất 3 ký tự mô tả triệu chứng để AI gợi ý chuyên khoa.');
      return;
    }
    setIsAISuggesting(true);
    setAiError(null);
    setAiSuggestions([]);
    setShowAIPanel(true);
    try {
      const patientAgeYears = calcPatientAgeYears(selectedPatient?.dateOfBirth);
      const results = await departmentSuggestionService.suggest({ symptoms: symptomText, patientAgeYears });
      setAiSuggestions(results ?? []);

      // Kiểm tra cảnh báo cấp cứu
      const emergency = results?.find((r) => r.isEmergency);
      if (emergency) {
        setEmergencyAdvice(emergency.advice ?? 'Vui lòng hướng dẫn bệnh nhân đến ngay Khoa Cấp Cứu hoặc gọi 115.');
        setShowEmergencyAlert(true);
        // Tự động chọn khoa cấp cứu
        if (emergency.departmentId) setSelectedDepartmentId(emergency.departmentId);
        return;
      }

      // Tự động chọn khoa có điểm cao nhất nếu confidence >= medium
      const best = results?.[0];
      if (best && (best.confidence === 'high' || best.confidence === 'medium')) {
        setSelectedDepartmentId(best.departmentId);
      }
    } catch (err: any) {
      setAiError(err?.message ?? 'Không thể kết nối dịch vụ gợi ý AI. Vui lòng chọn chuyên khoa thủ công.');
    } finally {
      setIsAISuggesting(false);
    }
  }, [reasonForVisit, selectedPatient?.dateOfBirth]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 text-xs font-bold mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Tiếp Nhận & Đăng Ký Khám Bệnh Tại Quầy</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Đăng Ký Khám Trực Tiếp (Walk-in)
            </h2>
            <p className="text-blue-100/80 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Dành cho bệnh nhân vãng lai đến khám trực tiếp. Hệ thống sẽ tự động gán vào hàng chờ của khoa và phát số thứ tự hàng đợi (Số B).
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 font-black text-lg">
              B
            </div>
            <div>
              <div className="text-[10px] uppercase font-extrabold text-blue-200">Phiếu Hàng Đợi</div>
              <div className="text-xs font-bold text-white">Tiền tố B • Tự động</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUCCESS SCREEN: TICKET ISSUED */}
      {successResult ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-8 md:p-10 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Tiếp nhận & Cấp số thứ tự thành công
              </span>
              <h3 className="text-2xl font-black text-slate-900 pt-2">Phiếu Khám Bệnh Tại Quầy</h3>
              <p className="text-xs text-slate-500">
                Mã lịch hẹn: <span className="font-mono font-bold text-blue-700">{successResult.appointment?.appointmentCode}</span>
              </p>
            </div>

            {/* Ticket Card Component for Print / Display */}
            <div
              id="printable-ticket"
              className="max-w-md mx-auto bg-gradient-to-b from-blue-50/70 to-slate-50 border-2 border-dashed border-blue-300 rounded-3xl p-6 text-center space-y-4 shadow-sm"
            >
              <div className="border-b border-blue-200 pb-3">
                <div className="text-[11px] font-black text-blue-800 uppercase tracking-wider">
                  BỆNH VIỆN ĐA KHOA 4AM HEALTHCARE
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Phiếu Khám Bệnh - Đăng Ký Tại Quầy</div>
              </div>

              {/* Huge Queue Number */}
              <div className="py-2 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Số Thứ Tự Của Bạn</span>
                <div className="text-5xl font-black text-blue-700 font-mono tracking-widest">
                  {successResult.queueTicket?.ticketPrefix || 'B'}
                  {String(successResult.queueTicket?.ticketNumber || '001').padStart(3, '0')}
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                  <Clock className="w-3 h-3" />
                  <span>Trạng thái: Đang chờ gọi vào phòng khám</span>
                </div>
              </div>

              {/* Details Info */}
              <div className="bg-white rounded-2xl p-4 border border-blue-100/80 text-left text-xs space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Bệnh nhân:</span>
                  <span className="font-bold text-slate-900">{selectedPatient?.fullName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Mã hồ sơ BN:</span>
                  <span className="font-mono font-bold text-blue-700">{selectedPatient?.patientCode}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Chuyên khoa khám:</span>
                  <span className="font-bold text-indigo-700">{selectedDepartment?.departmentName}</span>
                </div>
                {selectedDepartment?.roomLocation && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Phòng khám:</span>
                    <span className="font-bold text-slate-800">{selectedDepartment.roomLocation}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Mức độ ưu tiên:</span>
                  <span className="font-bold capitalize text-slate-800">
                    {priority === 'emergency' ? '🚨 Cấp cứu' : priority === 'urgent' ? '⚡ Ưu tiên' : 'Thường'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <span>Thời gian phát phiếu:</span>
                  <span>{new Date().toLocaleTimeString('vi-VN')} - {new Date().toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 italic">
                * Quý khách vui lòng theo dõi bảng điện tử hoặc loa thông báo tại sảnh khoa để vào khám.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer border-none"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tiếp tục tiếp nhận bệnh nhân tiếp theo</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>In phiếu tiếp nhận</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/tiep-nhan/danh-sach-cho?tab=appointments-checkin')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-slate-200 shadow-xs"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Xem danh sách hồ sơ lịch khám</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. MAIN FORM */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Banner */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-start gap-3 text-xs animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Đã xảy ra lỗi:</span>
                <p className="leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* STEP 1: CHOOSE PATIENT */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center border border-blue-200">
                  1
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Thông Tin Bệnh Nhân
                </h3>
              </div>

              {selectedPatient && (
                <button
                  type="button"
                  onClick={handleClearPatient}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all border border-rose-200 cursor-pointer"
                >
                  Đổi bệnh nhân khác
                </button>
              )}
            </div>

            {!selectedPatient ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Tra cứu hồ sơ bệnh nhân (*):
                </label>

                {/* Patient Search Input */}
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (patientResults.length > 0) setShowPatientDropdown(true);
                      }}
                      placeholder="Nhập Họ tên, Số CCCD/CMND, Số điện thoại hoặc Mã BN (BN...)..."
                      className="w-full pl-10 pr-10 py-3 text-xs font-semibold rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    {isSearchingPatient && (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-3.5 top-3.5" />
                    )}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showPatientDropdown && patientResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {patientResults.map((p) => (
                        <button
                          key={p.patientId}
                          type="button"
                          onClick={() => handleSelectPatient(p)}
                          className="w-full p-3.5 text-left hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer border-none bg-transparent"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-slate-900 truncate flex items-center gap-2">
                              <span>{p.fullName}</span>
                              <span className="font-mono text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-200">
                                {p.patientCode}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              {p.phoneNumber && <span>SĐT: {p.phoneNumber}</span>}
                              {p.identityNumber && <span>CCCD: {p.identityNumber}</span>}
                              {p.insuranceNumber && <span>BHYT: {p.insuranceNumber}</span>}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-blue-600 shrink-0 flex items-center gap-1">
                            <span>Chọn</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showPatientDropdown && searchQuery.trim() && patientResults.length === 0 && !isSearchingPatient && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-6 text-center text-xs text-slate-500 space-y-2">
                      <p>Không tìm thấy bệnh nhân nào khớp với từ khóa "{searchQuery}".</p>
                      {onOpenCreatePatientModal && (
                        <button
                          type="button"
                          onClick={onOpenCreatePatientModal}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer border-none"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Tạo hồ sơ bệnh nhân mới ngay</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Chưa có hồ sơ trên hệ thống?</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenCreatePatientModal) {
                        onOpenCreatePatientModal();
                      } else {
                        navigate('/tiep-nhan/danh-sach-cho?tab=create-profile');
                      }
                    }}
                    className="font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Tiếp nhận & Tạo hồ sơ bệnh nhân mới</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Selected Patient Summary Card */
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                    {selectedPatient.fullName?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-slate-900">{selectedPatient.fullName}</h4>
                      <span className="font-mono text-[11px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-md">
                        {selectedPatient.patientCode}
                      </span>
                      {patientAge !== null && (
                        <span className="text-[11px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                          {patientAge} tuổi ({selectedPatient.gender === 'male' || selectedPatient.gender === 'Nam' ? 'Nam' : 'Nữ'})
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{selectedPatient.phoneNumber || 'Chưa cập nhật SĐT'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>CCCD: {selectedPatient.identityNumber || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>BHYT: {selectedPatient.insuranceNumber || 'Không có BHYT'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã khớp hồ sơ</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: LÝ DO KHÁM + AI GỢI Ý + CHỌN CHUYÊN KHOA */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center border border-blue-200">
                  2
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Triệu Chứng & Chọn Chuyên Khoa
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {departments.length} chuyên khoa đang hoạt động
              </span>
            </div>

            {/* ── Nhập triệu chứng + AI suggest ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Lý do đến khám / Triệu chứng ban đầu:
                </label>
                {reasonForVisit.trim().length >= 3 && (
                  <span className="text-[10px] text-slate-400">{reasonForVisit.trim().length}/500 ký tự</span>
                )}
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={reasonForVisit}
                  onChange={(e) => { setReasonForVisit(e.target.value); setAiSuggestions([]); setAiError(null); }}
                  placeholder="Ví dụ: Đau đầu 2 ngày nay, hoặc 'bé 3 tuổi sốt cao', 'trẻ sơ sinh 10 ngày bú kém'... AI sẽ gợi ý chuyên khoa phù hợp."
                  className="w-full p-3 pr-4 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium leading-relaxed resize-none"
                  maxLength={500}
                />
              </div>

              {/* Hint Box: Hướng dẫn phân khoa Trẻ em & Sơ sinh */}
              <div className="flex items-start gap-2 text-xs text-slate-600 bg-amber-50/80 rounded-2xl p-3 border border-amber-200/80 leading-relaxed">
                <Baby className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900">Gợi ý phân khoa trẻ em: </span>
                  <span>
                    Nhập <strong className="text-slate-900">&quot;trẻ sơ sinh&quot;</strong> + lý do (ưu tiên <strong className="text-blue-700">Khoa Sơ sinh</strong>); nhập <strong className="text-slate-900">&quot;bé&quot; + lý do</strong> hoặc <strong className="text-slate-900">số tuổi</strong> (ưu tiên <strong className="text-blue-700">Khoa Nhi</strong>).
                  </span>
                </div>
              </div>

              {/* Quick tags */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {quickSymptoms.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => {
                      setReasonForVisit((prev) => prev ? `${prev}, ${sym.toLowerCase()}` : sym);
                      setAiSuggestions([]);
                    }}
                    className="text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-2.5 py-1 rounded-xl transition-colors border border-slate-200/80 cursor-pointer"
                  >
                    + {sym}
                  </button>
                ))}
              </div>

              {/* AI Suggest Button */}
              <button
                type="button"
                onClick={handleAISuggest}
                disabled={isAISuggesting || reasonForVisit.trim().length < 3}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-bold transition-all border cursor-pointer
                  bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700
                  disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed
                  text-white shadow-md shadow-violet-500/20 disabled:shadow-none"
              >
                {isAISuggesting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>AI đang phân tích triệu chứng...</span></>
                ) : (
                  <><Wand2 className="w-4 h-4" /><span>✨ Gợi ý Chuyên khoa bằng AI</span></>
                )}
              </button>

              {/* AI Error */}
              {aiError && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}
            </div>

            {/* ── AI Results Panel ── */}
            {showAIPanel && aiSuggestions.length > 0 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-3.5 h-3.5 text-violet-600" />
                    <span className="text-xs font-bold text-violet-800">Gợi ý chuyên khoa từ AI</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAIPanel(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer border-none bg-transparent"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {aiSuggestions.slice(0, 3).map((s, idx) => {
                    const isAutoSelected = selectedDepartmentId === s.departmentId;
                    const confidenceColor =
                      s.confidence === 'high'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : s.confidence === 'medium'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200';
                    return (
                      <button
                        key={s.departmentId}
                        type="button"
                        onClick={() => setSelectedDepartmentId(s.departmentId)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isAutoSelected
                            ? 'bg-violet-50 border-violet-500 ring-2 ring-violet-500/20'
                            : 'bg-white border-slate-200 hover:border-violet-300 hover:bg-violet-50/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className={`text-xs font-black ${ isAutoSelected ? 'text-violet-900' : 'text-slate-800'}`}>
                            {idx === 0 && <span className="mr-1">🏆</span>}
                            {s.departmentName}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${confidenceColor}`}>
                            {confidenceLabel(s.confidence)}
                          </span>
                        </div>
                        {s.matchedKeywords.length > 0 && (
                          <p className="text-[10px] text-slate-500 line-clamp-2">
                            Khớp: {s.matchedKeywords.slice(0, 3).map((k) => `"${k}"`).join(', ')}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Điểm: {(s.score * 100).toFixed(0)}%</span>
                          {isAutoSelected && (
                            <span className="text-[10px] font-bold text-violet-700 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Đã chọn
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 italic pl-1">
                  * Đây là gợi ý tham khảo từ AI. Lễ tân có thể chọn khoa khác bên dưới nếu cần.
                </p>
              </div>
            )}

            {/* ── Lưới chọn chuyên khoa ── */}
            {isLoadingDepartments ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span>Đang tải danh sách khoa phòng...</span>
              </div>
            ) : departments.length === 0 ? (
              <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl text-xs">
                Không tìm thấy danh sách chuyên khoa. Vui lòng kiểm tra lại hệ thống.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {departments.map((dep) => {
                  const isSelected = selectedDepartmentId === dep.departmentId;
                  const aiMatch = aiSuggestions.findIndex((s) => s.departmentId === dep.departmentId);
                  return (
                    <button
                      key={dep.departmentId}
                      type="button"
                      onClick={() => setSelectedDepartmentId(dep.departmentId)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                          : aiMatch === 0
                          ? 'bg-violet-50/50 border-violet-300 hover:border-violet-400'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {aiMatch >= 0 && !isSelected && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-violet-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-sm">
                          {aiMatch + 1}
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className={`font-bold text-xs ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                            {dep.departmentName}
                          </div>
                          {dep.roomLocation && (
                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{dep.roomLocation}</span>
                            </div>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 3: PRIORITY */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center border border-blue-200">
                3
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Mức Độ Ưu Tiên
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[
                { id: 'normal', label: 'Khám thường', desc: 'Triệu chứng nhẹ, không cấp bách', color: 'emerald' },
                { id: 'urgent', label: 'Ưu tiên', desc: 'Cao tuổi >75t, trẻ <6t, thai phụ', color: 'amber' },
                { id: 'emergency', label: 'Khẩn cấp', desc: 'Cần bác sĩ xử trí ngay', color: 'rose' },
              ].map((p) => {
                const isSelected = priority === p.id;
                const colors: Record<string, string> = {
                  emerald: isSelected ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:border-emerald-300',
                  amber: isSelected ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white border-slate-200 hover:border-amber-300',
                  rose: isSelected ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20' : 'bg-white border-slate-200 hover:border-rose-300',
                };
                const dotColors: Record<string, string> = {
                  emerald: isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300',
                  amber: isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-300',
                  rose: isSelected ? 'bg-rose-600 border-rose-600' : 'border-slate-300',
                };
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${colors[p.color]}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{p.label}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${dotColors[p.color]}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUBMIT BUTTON BAR */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Sau khi xác nhận, hệ thống sẽ tự động cấp số thứ tự khám (Số B) và đưa vào hàng chờ của khoa.
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResetForm}
                disabled={isSubmitting}
                className="px-4 py-3 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border-none"
              >
                Nhập lại
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !selectedPatient}
                className="flex-1 sm:flex-initial px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tạo phiếu & cấp số thứ tự...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Xác nhận Đăng Ký & Cấp Số Thứ Tự</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Emergency Alert Modal ── */}
      {showEmergencyAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-200">
            {/* Red header */}
            <div className="bg-gradient-to-r from-rose-600 to-red-700 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-200">Cảnh báo khẩn cấp</div>
                  <h3 className="text-lg font-black text-white">Phát hiện dấu hiệu nguy kịch!</h3>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-rose-800 leading-relaxed">
                🚨 AI phát hiện triệu chứng của bệnh nhân có thể là tình trạng cấp cứu nguy hiểm tính mạng.
              </p>
              {emergencyAdvice && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-900 leading-relaxed font-medium">
                  {emergencyAdvice}
                </div>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Nếu bệnh nhân đang trong tình trạng nguy kịch, vui lòng <strong>hướng dẫn đến ngay Khoa Cấp Cứu</strong> hoặc gọi <strong>115</strong> thay vì tiếp tục đặt lịch khám thường.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowEmergencyAlert(false)}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all cursor-pointer border-none shadow-lg shadow-rose-600/30"
              >
                Đã hiểu — Hướng dẫn bệnh nhân tới Khoa Cấp Cứu
              </button>
              <button
                type="button"
                onClick={() => setShowEmergencyAlert(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer border border-slate-200"
              >
                Bỏ qua — Tiếp tục đăng ký thường
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
