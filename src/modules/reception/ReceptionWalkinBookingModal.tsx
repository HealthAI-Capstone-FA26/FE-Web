import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarPlus, CheckCircle2, Search, Printer, RotateCcw,
  Phone, Shield, FileText, Loader2, ArrowRight, UserCheck,
  AlertCircle, Clock, X, Stethoscope, HeartPulse, UserPlus
} from 'lucide-react';
import { patientService } from '../../services/patient/patient.service';
import { doctorService, type DoctorResponse } from '../../services/doctor/doctor.service';
import { appointmentService } from '../../services/appointment/appointment.service';
import { queueTicketService } from '../../services/queue/queue-ticket.service';

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

export interface ReceptionWalkinBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPatient?: PatientOption | null;
  onSuccess?: (result: { appointment: any; queueTicket: any }) => void;
  onOpenCreatePatientModal?: () => void;
}

export const ReceptionWalkinBookingModal: React.FC<ReceptionWalkinBookingModalProps> = ({
  isOpen,
  onClose,
  initialPatient,
  onSuccess,
  onOpenCreatePatientModal,
}) => {
  // Patient Search & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [patientResults, setPatientResults] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(initialPatient || null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Reason & Priority
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'emergency'>('normal');

  // Doctors
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  // Submission & Result States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    appointment: any;
    queueTicket: any;
  } | null>(null);

  // Quick symptom chips for cardiology
  const quickSymptoms = [
    'Khám Tim mạch tổng quát',
    'Đau thắt ngực / nặng ngực',
    'Khó thở khi gắng sức',
    'Hồi hộp, tim đập nhanh',
    'Tăng huyết áp khó kiểm soát',
    'Tái khám sau can thiệp / đặt stent',
    'Chóng mặt, choáng váng',
    'Phù hai chi dưới',
  ];

  // Sync initial patient when modal opens or initialPatient changes
  useEffect(() => {
    if (isOpen) {
      setSelectedPatient(initialPatient || null);
      setReasonForVisit('');
      setPriority('normal');
      setErrorMsg(null);
      setSuccessResult(null);
      setSearchQuery('');
      setPatientResults([]);
      setShowPatientDropdown(false);

      doctorService.getDoctors({ isActive: true })
        .then((res) => {
          const docs = Array.isArray(res) ? res : [];
          setDoctors(docs);
          if (docs.length > 0) {
            setSelectedDoctorId((prev) => prev || docs[0].doctorId);
          }
        })
        .catch((err) => console.error('Lỗi nạp danh sách bác sĩ:', err));
    }
  }, [isOpen, initialPatient]);

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

  // Compute Age
  const patientAge = useMemo(() => {
    if (!selectedPatient?.dateOfBirth) return null;
    const year = new Date(selectedPatient.dateOfBirth).getFullYear();
    return isNaN(year) ? null : new Date().getFullYear() - year;
  }, [selectedPatient]);

  const handleSelectPatient = (p: PatientOption) => {
    setSelectedPatient(p);
    setShowPatientDropdown(false);
    setSearchQuery('');
    setErrorMsg(null);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedPatient?.patientId) {
      setErrorMsg('Vui lòng chọn hoặc tìm kiếm hồ sơ bệnh nhân trước khi đăng ký.');
      return;
    }

    if (!selectedDoctorId) {
      setErrorMsg('Vui lòng chọn bác sĩ phụ trách ca khám.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Cấp số thứ tự vãng lai
      const newTicket = await queueTicketService.issueAtHospitalTicket();
      // 2. Chuyển sang called
      await queueTicketService.callTicket(newTicket.ticketId, '01');
      // 3. Hoàn tất tiếp nhận gắn thông tin bệnh nhân & bác sĩ
      const doneRes = await queueTicketService.serveDoneTicket(newTicket.ticketId, {
        doctorId: selectedDoctorId,
        patientId: selectedPatient.patientId,
        reasonForVisit: reasonForVisit.trim() || undefined,
        priority: priority as any,
      });

      const result = {
        appointment: doneRes.appointment,
        queueTicket: doneRes.queueTicket || newTicket,
        invoice: doneRes.invoice,
      };
      setSuccessResult(result);
      if (onSuccess) {
        onSuccess(result);
      }
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
    if (!initialPatient) {
      setSelectedPatient(null);
    }
    setSearchQuery('');
    setReasonForVisit('');
    setPriority('normal');
    setErrorMsg(null);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 px-6 py-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-xs shrink-0">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  Đăng Ký Khám Trực Tiếp Tại Quầy
                </h3>
                <span className="text-[10px] font-extrabold uppercase bg-amber-400 text-blue-950 px-2 py-0.5 rounded-full shadow-2xs">
                  Số B • Walk-in
                </span>
              </div>
              <p className="text-[11px] text-blue-100/80 font-medium mt-0.5">
                Cấp số thứ tự khám Tim Mạch và đưa bệnh nhân vào hàng chờ tiếp nhận
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border-none shrink-0 relative z-10"
            title="Đóng modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* SUCCESS SCREEN: TICKET ISSUED */}
          {successResult ? (
            <div className="space-y-5 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Tiếp nhận & Cấp số thứ tự thành công
                </span>
                <h3 className="text-xl font-black text-slate-900 pt-1">Phiếu Khám Bệnh Tại Quầy</h3>
                <p className="text-xs text-slate-500">
                  Mã lịch hẹn: <span className="font-mono font-bold text-blue-700">{successResult.appointment?.appointmentCode}</span>
                </p>
              </div>

              {/* Printable Ticket Card */}
              <div
                id="printable-ticket"
                className="max-w-md mx-auto bg-gradient-to-b from-blue-50/70 to-slate-50 border-2 border-dashed border-blue-300 rounded-2xl p-5 text-center space-y-3.5 shadow-xs"
              >
                <div className="border-b border-blue-200 pb-2.5">
                  <div className="text-[11px] font-black text-blue-800 uppercase tracking-wider">
                    PHÒNG KHÁM TIM MẠCH 4AM HEALTHCARE
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Phiếu Khám Bệnh - Đăng Ký Tại Quầy</div>
                </div>

                {/* Queue Number */}
                <div className="py-1 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Số Thứ Tự Của Bạn</span>
                  <div className="text-5xl font-black text-blue-700 font-mono tracking-widest">
                    {successResult.queueTicket?.ticketPrefix || 'B'}
                    {String(successResult.queueTicket?.ticketNumber || '001').padStart(3, '0')}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    <Clock className="w-3 h-3" />
                    <span>Trạng thái: Đang chờ gọi vào phòng khám</span>
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="bg-white rounded-xl p-3.5 border border-blue-100 text-left text-xs space-y-2">
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Bệnh nhân:</span>
                    <span className="font-bold text-slate-900">{selectedPatient?.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Mã BN:</span>
                    <span className="font-mono font-bold text-blue-700">{selectedPatient?.patientCode}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Chuyên khoa khám:</span>
                    <span className="font-bold text-blue-900">Phòng khám Tim Mạch 4AM</span>
                  </div>
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Mức độ ưu tiên:</span>
                    <span className="font-bold capitalize text-slate-800">
                      {priority === 'emergency' ? '🚨 Cấp cứu' : priority === 'urgent' ? '⚡ Ưu tiên' : 'Thường'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                    <span>Thời gian phát:</span>
                    <span>{new Date().toLocaleTimeString('vi-VN')} • {new Date().toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 italic">
                  * Bệnh nhân vui lòng theo dõi bảng điện tử hoặc loa thông báo tại sảnh để vào khám.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>In phiếu tiếp nhận</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Đăng ký ca tiếp theo</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer border-none"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn tất & Đóng</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Banner */}
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">Lỗi:</span>
                    <p className="leading-relaxed">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* SECTION 1: CHỌN / XÁC NHẬN BỆNH NHÂN */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                      1
                    </div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                      Thông Tin Bệnh Nhân
                    </span>
                  </div>
                </div>

                {!selectedPatient ? (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Tra cứu hồ sơ bệnh nhân (*):
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => {
                          if (patientResults.length > 0) setShowPatientDropdown(true);
                        }}
                        placeholder="Nhập Họ tên, Số CCCD, SĐT hoặc Mã BN (BN...)..."
                        className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      {isSearchingPatient && (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-3 top-3" />
                      )}

                      {/* Dropdown Results */}
                      {showPatientDropdown && patientResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                          {patientResults.map((p) => (
                            <button
                              key={p.patientId}
                              type="button"
                              onClick={() => handleSelectPatient(p)}
                              className="w-full p-2.5 text-left hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-2 text-xs cursor-pointer border-none bg-transparent"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                  <span>{p.fullName}</span>
                                  <span className="font-mono text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded border border-blue-200">
                                    {p.patientCode}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-x-2.5">
                                  {p.phoneNumber && <span>SĐT: {p.phoneNumber}</span>}
                                  {p.identityNumber && <span>CCCD: {p.identityNumber}</span>}
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-blue-600 shrink-0 flex items-center gap-0.5">
                                <span>Chọn</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {showPatientDropdown && searchQuery.trim() && patientResults.length === 0 && !isSearchingPatient && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-4 text-center text-xs text-slate-500 space-y-1.5">
                          <p>Không tìm thấy hồ sơ bệnh nhân nào khớp với "{searchQuery}".</p>
                          {onOpenCreatePatientModal && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenCreatePatientModal();
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all cursor-pointer border-none"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Tạo hồ sơ bệnh nhân mới</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Selected Patient Card */
                  <div className="bg-white border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                        {selectedPatient.fullName?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900">{selectedPatient.fullName}</span>
                          <span className="font-mono text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded">
                            {selectedPatient.patientCode}
                          </span>
                          {patientAge !== null && (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {patientAge} tuổi ({selectedPatient.gender === 'male' || selectedPatient.gender === 'Nam' ? 'Nam' : 'Nữ'})
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                          {selectedPatient.phoneNumber && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {selectedPatient.phoneNumber}
                            </span>
                          )}
                          {selectedPatient.identityNumber && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3 text-slate-400" /> CCCD: {selectedPatient.identityNumber}
                            </span>
                          )}
                          {selectedPatient.insuranceNumber && (
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-slate-400" /> BHYT: {selectedPatient.insuranceNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      <UserCheck className="w-3 h-3 text-emerald-600" />
                      <span>Đã khớp</span>
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION 2: LÝ DO KHÁM & TRIỆU CHỨNG */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                      2
                    </div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                      Lý Do Khám & Triệu Chứng Ban Đầu
                    </span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    Phòng khám Tim Mạch 4AM
                  </span>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={2.5}
                    value={reasonForVisit}
                    onChange={(e) => setReasonForVisit(e.target.value)}
                    placeholder="Ví dụ: Đau tức ngực trái khi gắng sức, hồi hộp khó thở, huyết áp tăng cao, tái khám theo hẹn..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white font-medium resize-none"
                    maxLength={500}
                  />

                  {/* Triệu chứng tim mạch gợi ý */}
                  <div className="flex items-start gap-1.5 text-[10.5px] text-blue-900 bg-blue-50/70 rounded-xl p-2.5 border border-blue-200/70 leading-relaxed">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-950">Triệu chứng tim mạch thường gặp: </span>
                      <span className="text-blue-800">
                        Đau thắt ngực, khó thở khi gắng sức/khi nằm, hồi hộp đánh trống ngực, phù chi dưới, huyết áp bất thường, tái khám stent.
                      </span>
                    </div>
                  </div>

                  {/* Quick chips */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {quickSymptoms.map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => {
                          setReasonForVisit((prev) => (prev ? `${prev}, ${sym.toLowerCase()}` : sym));
                        }}
                        className="text-[10px] font-semibold bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-2 py-0.5 rounded-lg transition-colors border border-slate-200/80 cursor-pointer shadow-2xs"
                      >
                        + {sym}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner tiếp nhận Tim mạch SE01 */}
                <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-blue-950">Tiếp Nhận & Khám Tim Mạch 4AM (SE01)</div>
                      <div className="text-[10px] text-blue-700 font-medium">Bệnh nhân vãng lai tự động cấp số thứ tự vào hàng chờ (Queue Ticket Prefix B)</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-full shrink-0">
                    Sẵn sàng
                  </span>
                </div>
              </div>

              {/* SECTION: BÁC SĨ PHỤ TRÁCH CA KHÁM */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    <Stethoscope className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                    Bác Sĩ Phụ Trách Ca Khám <span className="text-rose-500">*</span>
                  </span>
                </div>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="" disabled>-- Chọn bác sĩ phụ trách ca khám --</option>
                  {doctors.map((doc) => (
                    <option key={doc.doctorId} value={doc.doctorId}>
                      {doc.title ? `${doc.title} ` : 'BS. '}{doc.fullName} ({doc.specialization || 'Khoa Tim Mạch'})
                    </option>
                  ))}
                </select>
              </div>

              {/* SECTION 3: MỨC ĐỘ ƯU TIÊN */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                    Mức Độ Ưu Tiên Tiếp Nhận
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'normal', label: 'Khám thường', desc: 'Triệu chứng nhẹ, định kỳ', color: 'emerald' },
                    { id: 'urgent', label: 'Ưu tiên', desc: 'Cao tuổi >75t, thai phụ', color: 'amber' },
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
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${colors[p.color]}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{p.label}</span>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${dotColors[p.color]}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MODAL FOOTER ACTIONS */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border-none"
                >
                  Hủy & Đóng
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedPatient}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer border-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo phiếu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác nhận & Cấp số thứ tự (Số B)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
