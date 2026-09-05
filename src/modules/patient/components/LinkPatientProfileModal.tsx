import React, { useState, useEffect } from 'react';
import {
  Link2,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  Phone,
  CreditCard,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  KeyRound,
  Mail,
  User,
} from 'lucide-react';
import { DobInput } from '../../../components/common/DobInput';
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
  userEmail = '',
  hasSelfProfile,
  initialSuggestion = null,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'self' | 'relative'>(hasSelfProfile ? 'relative' : 'self');

  // Tab 1: Self profile search state
  const [selfCccd, setSelfCccd] = useState<string>('');
  const [selfBhyt, setSelfBhyt] = useState<string>('');
  const [selfPhone, setSelfPhone] = useState<string>(userPhone || '');
  const [isSearchingSelf, setIsSearchingSelf] = useState<boolean>(false);
  const [matchedProfile, setMatchedProfile] = useState<MatchSuggestionResult['patient'] | null>(initialSuggestion);
  const [hasSearchedSelf, setHasSearchedSelf] = useState<boolean>(false);
  const [isLinkingSelf, setIsLinkingSelf] = useState<boolean>(false);

  // Tab 2: Relative profile (with OTP) state
  const [relativeFullName, setRelativeFullName] = useState<string>('');
  const [relativeDob, setRelativeDob] = useState<string>('');
  const [relativeCccd, setRelativeCccd] = useState<string>('');
  const [relativePhone, setRelativePhone] = useState<string>('');
  const [relativeEmail, setRelativeEmail] = useState<string>('');
  const [relationship, setRelationship] = useState<'parent' | 'child' | 'spouse' | 'guardian' | 'other'>('parent');
  const [verifyMethod, setVerifyMethod] = useState<'email' | 'sms'>('sms');

  const [relativeStep, setRelativeStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  // General feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

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

  // --- Handlers for Tab 1 (Self) ---
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
      onSuccess(`Liên kết hồ sơ thành công! Đã kết nối hồ sơ ${matchedProfile.fullName || ''} với tài khoản của bạn.`, matchedProfile.patientId);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể liên kết hồ sơ này. Vui lòng kiểm tra lại.');
    } finally {
      setIsLinkingSelf(false);
    }
  };

  // --- Handlers for Tab 2 (Relative OTP) ---
  const handleSendRelativeOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!relativeFullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của người thân');
      return;
    }
    if (!relativeDob) {
      setErrorMessage('Vui lòng chọn ngày sinh');
      return;
    }
    if (!relativeCccd.trim()) {
      setErrorMessage('Vui lòng nhập số CCCD/CMND của người thân');
      return;
    }
    if (!relativePhone.trim()) {
      setErrorMessage('Vui lòng nhập số điện thoại của người thân');
      return;
    }
    if (verifyMethod === 'email' && !relativeEmail.trim()) {
      setErrorMessage('Vui lòng nhập email đã khai báo trong hồ sơ của người thân');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await patientService.createContactRequest({
        fullName: relativeFullName.trim(),
        dateOfBirth: relativeDob,
        identityNumber: relativeCccd.trim(),
        phoneNumber: relativePhone.trim().replace(/\D/g, ''),
        relationship: relationship,
        verifyMethod: verifyMethod,
        email: verifyMethod === 'email' ? relativeEmail.trim() : undefined,
      });

      setSuccessInfo(res.message || 'Mã OTP xác thực đã được gửi đến bệnh nhân.');
      setRelativeStep('otp');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Thông tin không khớp với hồ sơ bệnh nhân tại viện hoặc đã liên kết.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyRelativeOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setErrorMessage('Vui lòng nhập mã OTP xác thực');
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMessage(null);
    try {
      await patientService.verifyContactRequestOtp({
        otp: otpCode.trim(),
      });

      onSuccess(`Liên kết người thân thành công! Đã kết nối hồ sơ ${relativeFullName} vào danh sách quản lý.`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-inner">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Tra Cứu & Liên Kết Hồ Sơ Bệnh Nhân</h3>
              <p className="text-xs text-blue-100 mt-0.5">
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

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('self');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border-none ${
              activeTab === 'self'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-white/50 bg-transparent'
            }`}
          >
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Hồ Sơ Của Tôi (Chính chủ)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('relative');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border-none ${
              activeTab === 'relative'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-white/50 bg-transparent'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Hồ Sơ Người Thân (Xác thực OTP)</span>
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

          {/* TAB 1: SELF PROFILE LINKING */}
          {activeTab === 'self' && (
            <div className="space-y-4">
              {hasSelfProfile && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Tài khoản của bạn đã có 1 hồ sơ Bản thân. Nếu muốn thêm người khác, vui lòng chọn tab &quot;Hồ Sơ Người Thân&quot;.</span>
                </div>
              )}

              <form onSubmit={handleSearchSelf} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số CCCD / CMND
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={selfCccd}
                        onChange={(e) => setSelfCccd(e.target.value)}
                        placeholder="Ví dụ: 079203001234"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số Thẻ BHYT (tùy chọn)
                    </label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Điện Thoại Khai Báo Tại Viện
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={selfPhone}
                      onChange={(e) => setSelfPhone(e.target.value)}
                      placeholder="0987654321"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSearchingSelf}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
                  >
                    {isSearchingSelf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tra cứu hồ sơ...</span>
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

              {/* SEARCH RESULT CARD */}
              {hasSearchedSelf && (
                <div className="pt-2 border-t border-slate-100">
                  {isSearchingSelf ? (
                    <div className="py-8 flex flex-col items-center justify-center text-slate-500 gap-2.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl animate-in fade-in duration-150">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                      <span className="text-xs font-bold text-slate-700">Đang quét tìm hồ sơ tại bệnh viện...</span>
                      <span className="text-[11px] text-slate-400">Vui lòng đợi trong giây lát</span>
                    </div>
                  ) : matchedProfile ? (
                    <div className="p-4 bg-linear-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl space-y-3 animate-in zoom-in-95 duration-200">
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
                          {matchedProfile.fullName ? matchedProfile.fullName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-sm text-slate-900">
                            {matchedProfile.fullName}
                          </h4>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                            {matchedProfile.dateOfBirth && (
                              <span>Ngày sinh: <strong>{new Date(matchedProfile.dateOfBirth).toLocaleDateString('vi-VN')}</strong></span>
                            )}
                            {matchedProfile.maskedIdentityNumber && (
                              <span>CCCD: <strong>{matchedProfile.maskedIdentityNumber}</strong></span>
                            )}
                            {matchedProfile.maskedPhoneNumber && (
                              <span>SĐT: <strong>{matchedProfile.maskedPhoneNumber}</strong></span>
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
                        Vui lòng kiểm tra lại số CCCD/SĐT hoặc nếu bạn chưa từng đến khám tại viện, hãy sử dụng tính năng <strong>&quot;Tạo Hồ Sơ Bệnh Nhân Mới&quot;</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RELATIVE PROFILE LINKING (WITH OTP) */}
          {activeTab === 'relative' && (
            <div className="space-y-4">
              {relativeStep === 'form' ? (
                <form onSubmit={handleSendRelativeOtp} className="space-y-3">
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl text-indigo-900 text-xs flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      Để bảo mật bệnh án của người thân, hệ thống sẽ gửi mã <strong>OTP xác thực</strong> đến Số điện thoại hoặc Email đã lưu trong hồ sơ bệnh nhân của người đó.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Họ và Tên Người Thân <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={relativeFullName}
                        onChange={(e) => setRelativeFullName(e.target.value)}
                        placeholder="Ví dụ: NGUYỄN THỊ B"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ngày Sinh <span className="text-rose-500">*</span>
                      </label>
                      <DobInput
                        value={relativeDob}
                        onChange={setRelativeDob}
                        className="w-full text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số CCCD / CMND <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={relativeCccd}
                        onChange={(e) => setRelativeCccd(e.target.value)}
                        placeholder="Số CCCD của người thân"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Quan Hệ Với Bạn <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 font-medium bg-white"
                      >
                        <option value="parent">Bố / Mẹ (Parent)</option>
                        <option value="child">Con cái (Child)</option>
                        <option value="spouse">Vợ / Chồng (Spouse)</option>
                        <option value="guardian">Người giám hộ (Guardian)</option>
                        <option value="other">Khác (Other)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số Điện Thoại Trong Hồ Sơ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={relativePhone}
                        onChange={(e) => setRelativePhone(e.target.value)}
                        placeholder="SĐT đã đăng ký tại viện"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phương Thức Nhận OTP
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setVerifyMethod('sms')}
                          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                            verifyMethod === 'sms'
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Qua SMS</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVerifyMethod('email')}
                          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                            verifyMethod === 'email'
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Qua Email</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {verifyMethod === 'email' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Đã Lưu Trong Hồ Sơ Người Thân <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={relativeEmail}
                        onChange={(e) => setRelativeEmail(e.target.value)}
                        placeholder="email.nguoithan@example.com"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 font-medium"
                      />
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang kiểm tra & gửi OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Gửi Mã Xác Thực OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* STEP 2: OTP VERIFICATION */
                <form onSubmit={handleVerifyRelativeOtp} className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                      <KeyRound className="w-4 h-4 text-indigo-600" />
                      <span>Nhập Mã Xác Thực OTP</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Mã OTP 6 chữ số đã được gửi tới{' '}
                      <strong>{verifyMethod === 'sms' ? `SĐT ${relativePhone}` : `Email ${relativeEmail}`}</strong> của bệnh nhân{' '}
                      <strong>{relativeFullName}</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã OTP (6 số)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full pl-9 pr-3 py-2.5 text-center tracking-widest text-sm font-bold rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setRelativeStep('form')}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer border-none bg-transparent"
                    >
                      ← Nhập lại thông tin
                    </button>

                    <button
                      type="submit"
                      disabled={isVerifyingOtp || otpCode.length < 4}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang xác thực...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Hoàn Tất Liên Kết</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
