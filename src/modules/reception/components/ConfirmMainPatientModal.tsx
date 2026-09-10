import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, UserCheck, Calendar, Phone, CreditCard, User, ShieldAlert } from 'lucide-react';
import {
  appointmentService,
  type PatientDetail,
} from '../../../services/appointment/appointment.service';

interface ConfirmMainPatientModalProps {
  isOpen: boolean;
  patient: {
    patientId: string;
    patientCode?: string;
    fullName: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    identityNumber?: string;
    insuranceNumber?: string;
    status?: 'draft' | 'main';
  } | null;
  appointmentCode?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ConfirmMainPatientModal: React.FC<ConfirmMainPatientModalProps> = ({
  isOpen,
  patient,
  appointmentCode,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [identityNumber, setIdentityNumber] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [insuranceNumber, setInsuranceNumber] = useState<string>('');

  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !patient?.patientId) {
      setFullName('');
      setDateOfBirth('');
      setGender('male');
      setIdentityNumber('');
      setPhoneNumber('');
      setInsuranceNumber('');
      setErrorMessage(null);
      return;
    }

    let isMounted = true;
    const loadFullPatient = async () => {
      try {
        setIsLoadingDetail(true);
        setErrorMessage(null);
        const detail: PatientDetail = await appointmentService.getPatientById(patient.patientId);
        if (isMounted) {
          setFullName(detail.fullName || '');
          setDateOfBirth(detail.dateOfBirth ? detail.dateOfBirth.slice(0, 10) : '');
          setGender((detail.gender as any) || 'male');
          setIdentityNumber(detail.identityNumber || '');
          setPhoneNumber(detail.phoneNumber || '');
          setInsuranceNumber(detail.insuranceNumber || '');
        }
      } catch (err: any) {
        // Fallback dùng tạm dữ liệu từ prop nếu API getPatientById lỗi
        if (isMounted) {
          setFullName(patient.fullName || '');
          setDateOfBirth(patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '');
          setGender((patient.gender as any) || 'male');
          setIdentityNumber(patient.identityNumber || '');
          setPhoneNumber(patient.phoneNumber || '');
          setInsuranceNumber(patient.insuranceNumber || '');
        }
      } finally {
        if (isMounted) {
          setIsLoadingDetail(false);
        }
      }
    };

    loadFullPatient();

    return () => {
      isMounted = false;
    };
  }, [isOpen, patient]);

  if (!isOpen || !patient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên bệnh nhân');
      return;
    }
    if (!dateOfBirth) {
      setErrorMessage('Vui lòng chọn Ngày sinh');
      return;
    }
    if (!identityNumber.trim()) {
      setErrorMessage('Vui lòng nhập Số CCCD/CMND');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage('Vui lòng nhập Số điện thoại');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await appointmentService.confirmMainPatient(patient.patientId, {
        fullName: fullName.trim(),
        dateOfBirth,
        gender,
        identityNumber: identityNumber.trim(),
        phoneNumber: phoneNumber.trim(),
        insuranceNumber: insuranceNumber.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi xác nhận hồ sơ chính thức:', err);
      setErrorMessage(err.message || 'Không thể xác nhận hồ sơ bệnh nhân. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Xác Thực Hồ Sơ Chính Thức</h3>
              <p className="text-xs text-emerald-100 font-medium">
                {appointmentCode ? (
                  <>
                    Mã lịch hẹn: <span className="font-mono font-bold text-white">{appointmentCode}</span>
                  </>
                ) : (
                  <>Chuyển trạng thái hồ sơ từ Draft sang Main</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {/* Thông báo Draft */}
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-amber-900 leading-relaxed">
              <strong className="block font-bold">Hồ sơ tạm thời (Status: DRAFT)</strong>
              Hồ sơ này được tạo tự động khi khách vãng lai đặt lịch. Lễ tân vui lòng rà soát đối chiếu với giấy tờ tùy
              thân và xác nhận để chuyển thành hồ sơ chính thức (Main), tránh việc hồ sơ bị hệ thống tự động dọn dẹp sau
              thời gian lưu trữ.
            </div>
          </div>

          {isLoadingDetail ? (
            <div className="py-8 flex items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span>Đang tải thông tin hồ sơ...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Họ và tên bệnh nhân <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: NGUYỄN VĂN A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs font-semibold"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Ngày sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs font-semibold"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Giới tính <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs font-semibold bg-white"
                    disabled={isSubmitting}
                    required
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    Số CCCD/CMND <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(e.target.value)}
                    placeholder="12 số CCCD"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs font-mono font-semibold"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0901234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs font-mono font-semibold"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  Mã thẻ BHYT (nếu có)
                </label>
                <input
                  type="text"
                  value={insuranceNumber}
                  onChange={(e) => setInsuranceNumber(e.target.value)}
                  placeholder="Ví dụ: DN4791234567890 (không bắt buộc)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs font-mono"
                  disabled={isSubmitting}
                />
              </div>

              {/* Báo lỗi */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Nút hành động */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-all border-none bg-transparent cursor-pointer disabled:opacity-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 border-none cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác Nhận Hồ Sơ Chính Thức</span>
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
