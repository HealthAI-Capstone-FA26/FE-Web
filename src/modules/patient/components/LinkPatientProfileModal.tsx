import React, { useState, useEffect } from 'react';
import {
  Link2,
  Search,
  ShieldCheck,
  UserCheck,
  Phone,
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  User,
} from 'lucide-react';
import { patientService, type MatchSuggestionResult } from '../../../services/patient/patient.service';

interface LinkPatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPhone?: string;
  userEmail?: string;
  hasSelfProfile: boolean;
  initialSuggestion?: MatchSuggestionResult['patient'] | null;
  onSuccess: (message?: string, patientId?: string) => void;
}

export const LinkPatientProfileModal: React.FC<LinkPatientProfileModalProps> = ({
  isOpen,
  onClose,
  userPhone = '',
  hasSelfProfile,
  initialSuggestion = null,
  onSuccess,
}) => {
  // Self profile search state
  const [selfCccd, setSelfCccd] = useState<string>('');
  const [selfBhyt, setSelfBhyt] = useState<string>('');
  const [selfPhone, setSelfPhone] = useState<string>(userPhone || '');
  const [isSearchingSelf, setIsSearchingSelf] = useState<boolean>(false);
  const [matchedProfile, setMatchedProfile] = useState<MatchSuggestionResult['patient'] | null>(initialSuggestion);
  const [hasSearchedSelf, setHasSearchedSelf] = useState<boolean>(false);
  const [isLinkingSelf, setIsLinkingSelf] = useState<boolean>(false);

  // General feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessInfo(null);
      setSelfPhone(userPhone || '');
      if (initialSuggestion) {
        setMatchedProfile(initialSuggestion);
        setHasSearchedSelf(true);
      }
    }
  }, [isOpen, userPhone, initialSuggestion]);

  if (!isOpen) return null;

  const handleSearchSelf = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    const cleanCccd = selfCccd.trim();
    const cleanBhyt = selfBhyt.trim();
    const cleanPhone = selfPhone.trim().replace(/\D/g, '');

    if (!cleanCccd && !cleanBhyt && !cleanPhone) {
      setErrorMessage('Vui lòng nhập ít nhất Số CCCD/CMND, Số thẻ BHYT hoặc Số điện thoại để tra cứu');
      return;
    }

    setIsSearchingSelf(true);
    setHasSearchedSelf(true);
    try {
      const res = await patientService.findMatchSuggestion({
        identityNumber: cleanCccd || undefined,
        insuranceNumber: cleanBhyt || undefined,
        phoneNumber: cleanPhone || undefined,
      });

      if (res?.matched && res.patient) {
        setMatchedProfile(res.patient);
      } else {
        setMatchedProfile(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lỗi khi tra cứu hồ sơ tại bệnh viện');
      setMatchedProfile(null);
    } finally {
      setIsSearchingSelf(false);
    }
  };

  const handleConfirmLinkSelf = async () => {
    if (!matchedProfile?.patientId) return;
    setIsLinkingSelf(true);
    setErrorMessage(null);
    try {
      await patientService.linkUser(matchedProfile.patientId);
      onSuccess(
        `Liên kết hồ sơ thành công! Đã kết nối hồ sơ ${matchedProfile.fullName || ''} với tài khoản của bạn.`,
        matchedProfile.patientId,
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể liên kết hồ sơ này. Vui lòng kiểm tra lại.');
    } finally {
      setIsLinkingSelf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Tra Cứu & Liên Kết Hồ Sơ Bệnh Nhân</h3>
              <p className="text-xs text-blue-100/80 mt-0.5">
                Kết nối hồ sơ khám bệnh cũ tại viện vào tài khoản cá nhân của bạn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Error / Alert banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-medium animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successInfo && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-700 text-xs font-medium animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successInfo}</span>
            </div>
          )}

          <div className="space-y-4">
            {hasSelfProfile && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Tài khoản của bạn đã được liên kết với 1 hồ sơ bệnh nhân. Mỗi tài khoản chỉ quản lý 1 hồ sơ chính chủ duy nhất.
                </span>
              </div>
            )}

            <form onSubmit={handleSearchSelf} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số CCCD / CMND</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={selfCccd}
                      onChange={(e) => setSelfCccd(e.target.value)}
                      placeholder="Ví dụ: 079204012699"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Thẻ BHYT (tùy chọn)</label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={selfBhyt}
                      onChange={(e) => setSelfBhyt(e.target.value)}
                      placeholder="Ví dụ: DN4791234567890"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại Khai Báo Tại Viện</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={selfPhone}
                    onChange={(e) => setSelfPhone(e.target.value)}
                    placeholder="Ví dụ: 0901234567"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSearchingSelf}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
                >
                  {isSearchingSelf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tìm kiếm...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Tìm Kiếm Hồ Sơ</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Matched Profile Card */}
            {hasSearchedSelf && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {matchedProfile ? (
                  <div className="p-4 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-blue-50/60 border border-emerald-200/90 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Đã tìm thấy hồ sơ khớp tại bệnh viện
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Mã BN: <strong className="text-slate-800">{matchedProfile.patientCode}</strong>
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        {matchedProfile.fullName ? (
                          matchedProfile.fullName.charAt(0).toUpperCase()
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-sm text-slate-900">{matchedProfile.fullName}</h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                          {matchedProfile.dateOfBirth && (
                            <span>
                              Ngày sinh: <strong>{new Date(matchedProfile.dateOfBirth).toLocaleDateString('vi-VN')}</strong>
                            </span>
                          )}
                          {matchedProfile.maskedIdentityNumber && (
                            <span>
                              CCCD: <strong>{matchedProfile.maskedIdentityNumber}</strong>
                            </span>
                          )}
                          {matchedProfile.maskedPhoneNumber && (
                            <span>
                              SĐT: <strong>{matchedProfile.maskedPhoneNumber}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-blue-100 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-slate-600 italic">
                        Xác nhận để liên kết toàn bộ lịch sử khám bệnh và đơn thuốc về tài khoản này.
                      </p>
                      <button
                        type="button"
                        onClick={handleConfirmLinkSelf}
                        disabled={isLinkingSelf || hasSelfProfile}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border-none disabled:opacity-50"
                      >
                        {isLinkingSelf ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang liên kết...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Xác Nhận Liên Kết</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Không tìm thấy hồ sơ khớp</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Vui lòng kiểm tra lại số CCCD/SĐT hoặc nếu bạn chưa từng đến khám tại viện, hãy sử dụng tính năng{' '}
                      <strong>&quot;Khai Báo Hồ Sơ Bản Thân&quot;</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
