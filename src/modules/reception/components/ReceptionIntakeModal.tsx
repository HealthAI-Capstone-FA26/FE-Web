import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { type QueueTicketItem, queueTicketService } from '../../../services/queue/queue-ticket.service';
import { type DoctorResponse } from '../../../services/doctor/doctor.service';
import { chiefComplaintService } from '../../../services/reception/chief-complaint.service';
import {
  encounterService,
  type VerificationMethod,
  type VerificationStatus,
} from '../../../services/encounter/encounter.service';

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

interface ReceptionIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: QueueTicketItem | null;
  doctors: DoctorResponse[];
  onSuccess: () => void;
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

  // State Xác Minh Danh Tính
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('national_id_card');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('verified');
  const [mismatchNotes, setMismatchNotes] = useState<string>('');
  const [isPediatricPatient, setIsPediatricPatient] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && ticket) {
      const deptDocs = doctors.filter((d) =>
        d.doctorDepartments?.some((dept) => dept.departmentId === ticket.departmentId)
      );
      setSelectedDoctorId(ticket.appointment?.doctorId || deptDocs[0]?.doctorId || doctors[0]?.doctorId || '');
      setReasonForVisit(ticket.appointment?.reasonForVisit || '');
      setSymptoms('');
      setSymptomOnsetDate(new Date().toISOString().slice(0, 10));
      setPainLevel(0);

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
    }
  }, [isOpen, ticket, doctors]);

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
    if (!selectedDoctorId) {
      showToast('Vui lòng chọn bác sĩ khám trước khi hoàn tất tiếp nhận', 'error');
      return;
    }

    if (verificationStatus === 'failed' && !mismatchNotes.trim()) {
      showToast('Vui lòng nhập lý do không khớp khi kết quả xác minh thất bại', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Chuyển trạng thái ticket -> done, appointment -> checked_in, tạo Encounter
      const res = await queueTicketService.serveDoneTicket(ticket.ticketId, {
        doctorId: selectedDoctorId,
      });

      const encounterId = res.encounter?.encounterId;
      const code = formatTicketCode(ticket);

      // 2. Ghi nhận Log Xác Minh Danh Tính (Chức năng 5: POST /encounters/:id/identity-verifications)
      if (encounterId) {
        try {
          const isBhyt = verificationMethod === 'health_insurance_card';
          const apiMethod = isBhyt ? 'manual' : verificationMethod;
          const prefix = isBhyt ? '[BHYT/VssID]' : '';
          const finalNotes = prefix
            ? (verificationStatus === 'failed' && mismatchNotes.trim()
                ? `${prefix} ${mismatchNotes.trim()}`
                : prefix)
            : (verificationStatus === 'failed' ? mismatchNotes.trim() : undefined);

          await encounterService.recordIdentityVerification(encounterId, {
            verificationMethod: apiMethod,
            verificationStatus,
            mismatchNotes: finalNotes,
          });
        } catch (idErr: any) {
          console.warn('Ghi nhận log xác minh danh tính thất bại:', idErr);
        }

        // 3. Ghi nhận Chief Complaint vào lượt khám Encounter
        try {
          const finalReason =
            reasonForVisit.trim() || ticket.appointment?.reasonForVisit?.trim() || 'Khám bệnh';
          await chiefComplaintService.upsert(encounterId, {
            reasonForVisit: finalReason,
            symptoms: symptoms.trim() || undefined,
            symptomOnsetDate: symptomOnsetDate || undefined,
            painLevel: painLevel,
            inputChannel: 'receptionist_assisted',
          });
        } catch (ccErr: any) {
          console.warn('Lưu Chief Complaint thất bại:', ccErr);
        }
      }

      showToast(
        `Đã tiếp nhận thành công số ${code}, lưu xác minh danh tính & chuyển khám!`,
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi hoàn tất tiếp nhận', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const patient = ticket.appointment?.patient;
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
          {/* THÔNG TIN HỒ SƠ BỆNH NHÂN ĐỂ ĐỐI CHIẾU TẠI QUẦY */}
          <div className="p-3.5 bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-2xl border border-teal-100/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-teal-950">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>Hồ sơ lưu trữ hệ thống (Dùng để đối chiếu giấy tờ thực tế):</span>
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
              {/* Số CCCD / CMND */}
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

              {/* Mã số thẻ BHYT */}
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

              {/* Ngày sinh / Tuổi */}
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

              {/* Giới tính & Số điện thoại */}
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
              {doctors
                .filter((d) =>
                  d.doctorDepartments?.some((dept) => dept.departmentId === ticket.departmentId)
                )
                .map((doc) => (
                  <option key={doc.doctorId} value={doc.doctorId}>
                    {doc.fullName} ({doc.title || 'Bác sĩ chuyên khoa'})
                  </option>
                ))}
            </select>
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
