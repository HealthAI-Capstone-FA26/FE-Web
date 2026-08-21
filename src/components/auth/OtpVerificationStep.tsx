import React from 'react';
import { ArrowLeft, KeyRound, RefreshCw, ShieldAlert } from 'lucide-react';

interface OtpVerificationStepProps {
  email: string;
  otpCode: string;
  setOtpCode: (val: string) => void;
  infoMessage: string;
  error: string;
  isSubmitting: boolean;
  isResending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onResendOtp: () => void;
  onBack: () => void;
}

export const OtpVerificationStep: React.FC<OtpVerificationStepProps> = ({
  email,
  otpCode,
  setOtpCode,
  infoMessage,
  error,
  isSubmitting,
  isResending,
  onSubmit,
  onResendOtp,
  onBack,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all border-none bg-transparent cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
          Xác thực mã OTP Email
        </span>
      </div>

      <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-center">
        <KeyRound className="w-8 h-8 text-[#0b3c8f] mx-auto mb-2" />
        <p className="text-xs font-medium text-slate-600 leading-relaxed">
          {infoMessage || `Mã OTP gồm 6 chữ số đã được gửi tới email:`}
        </p>
        <p className="text-xs font-extrabold text-[#0b3c8f] mt-1">{email}</p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 text-center">Nhập mã OTP 6 chữ số</label>
        <input
          type="text"
          maxLength={6}
          placeholder="123456"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
          className="w-full bg-white text-slate-800 font-extrabold text-center text-lg tracking-[0.4em] py-3 px-4 rounded-xl border outline-none border-slate-200 focus:border-[#0b3c8f]"
        />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onResendOtp}
          disabled={isResending}
          className="text-xs text-[#0b3c8f] hover:underline font-bold flex items-center gap-1 cursor-pointer border-none bg-transparent"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
          <span>Gửi lại mã OTP</span>
        </button>
      </div>

      {error && (
        <div className="text-xs text-rose-600 font-semibold flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#0b3c8f] hover:bg-[#082a69] text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer border-none flex items-center justify-center gap-2 mt-2"
      >
        {isSubmitting ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <span>Xác nhận OTP & Tiếp tục</span>
        )}
      </button>
    </form>
  );
};
