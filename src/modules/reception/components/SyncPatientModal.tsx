import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, ShieldCheck, UserCheck, Phone, CreditCard, User } from 'lucide-react';
import {
  appointmentService,
  type AppointmentItem,
  type PatientDetail,
} from '../../../services/appointment/appointment.service';

interface SyncPatientModalProps {
  isOpen: boolean;
  appointment: AppointmentItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SyncPatientModal: React.FC<SyncPatientModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onSuccess,
}) => {
  const [suggestedPatient, setSuggestedPatient] = useState<PatientDetail | null>(null);
  const [isLoadingSuggested, setIsLoadingSuggested] = useState<boolean>(false);

  const [fullName, setFullName] = useState<string>('');
  const [identityNumber, setIdentityNumber] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Khi modal mở, nếu có suggestedPatientId thì tải thông tin hồ sơ gợi ý
  useEffect(() => {
    if (!isOpen || !appointment?.suggestedPatientId) {
      setSuggestedPatient(null);
      setFullName('');
      setIdentityNumber('');
      setPhoneNumber('');
      setErrorMessage(null);
      return;
    }

    let isMounted = true;
    const fetchSuggestedPatient = async () => {
      try {
        setIsLoadingSuggested(true);
        setErrorMessage(null);
        const data = await appointmentService.getPatientById(appointment.suggestedPatientId!);
        if (isMounted) {
          setSuggestedPatient(data);
          // Điền trước thông tin hồ sơ gợi ý để lễ tân tiện kiểm tra/đối chiếu
          setFullName(data.fullName || '');
          setIdentityNumber(data.identityNumber || '');
          setPhoneNumber(data.phoneNumber || '');
        }
      } catch (err: any) {
        console.error('Lỗi khi tải thông tin hồ sơ gợi ý:', err);
        if (isMounted) {
          setErrorMessage('Không thể tải thông tin hồ sơ gợi ý từ hệ thống.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSuggested(false);
        }
      }
    };

    fetchSuggestedPatient();

    return () => {
      isMounted = false;
    };
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên bệnh nhân');
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

      await appointmentService.syncPatient({
        appointmentId: appointment.appointmentId,
        fullName: fullName.trim(),
        identityNumber: identityNumber.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi đồng bộ hồ sơ bệnh nhân:', err);
      setErrorMessage(
        err.message ||
          'Thông tin Họ tên, CCCD hoặc SĐT không khớp với hồ sơ bệnh nhân được gợi ý. Vui lòng kiểm tra lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Đối Chiếu CCCD & Đồng Bộ Hồ Sơ</h3>
              <p className="text-xs text-amber-100 font-medium">
                Mã lịch hẹn: <span className="font-mono font-bold text-white">{appointment.appointmentCode}</span>
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
          {/* Alert Hướng dẫn */}
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-amber-900 leading-relaxed">
              <strong className="block font-bold">Lịch hẹn khách vãng lai (Trùng khớp CCCD & SĐT)</strong>
              Người bệnh đặt lịch qua luồng khách vãng lai nhưng hệ thống phát hiện thông tin trùng khớp với một hồ sơ
              chính thức có sẵn. Vui lòng <strong>kiểm tra thẻ CCCD/CMND gốc</strong> của bệnh nhân tại quầy trước khi
              xác nhận đồng bộ.
            </div>
          </div>

          {/* Hồ sơ gợi ý từ hệ thống */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                Hồ sơ gợi ý trên hệ thống
              </span>
              {suggestedPatient?.status && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Hồ sơ chính thức (Main)
                </span>
              )}
            </div>

            {isLoadingSuggested ? (
              <div className="py-4 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Đang tải thông tin hồ sơ...</span>
              </div>
            ) : suggestedPatient ? (
              <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Họ và tên:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{suggestedPatient.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Mã bệnh nhân:</span>
                  <span className="font-mono font-bold text-blue-700">{suggestedPatient.patientCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Số CCCD/CMND:</span>
                  <span className="font-mono font-semibold">{suggestedPatient.identityNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Số điện thoại:</span>
                  <span className="font-mono font-semibold">{suggestedPatient.phoneNumber}</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 py-1 italic">
                ID gợi ý: <span className="font-mono">{appointment.suggestedPatientId}</span>
              </div>
            )}
          </div>

          {/* Form Đối chiếu của Lễ tân */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="text-[11px] font-bold uppercase text-slate-700">
              Thông tin đối chiếu từ giấy tờ gốc của bệnh nhân:
            </div>

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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-xs font-semibold"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Số CCCD/CMND <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
                placeholder="Nhập đủ 12 số CCCD"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-xs font-mono font-semibold"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Số điện thoại liên hệ <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ví dụ: 0901234567"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-xs font-mono font-semibold"
                disabled={isSubmitting}
                required
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
                disabled={isSubmitting || isLoadingSuggested}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 border-none cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đối chiếu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác Nhận Trùng Khớp & Đồng Bộ</span>
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
