import React from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (val: string) => void;
  error: string;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBackToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  email,
  setEmail,
  error,
  isSubmitting,
  onSubmit,
  onBackToLogin,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-1 border-b border-slate-100 pb-2">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all border-none bg-transparent cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
          Quên mật khẩu
        </span>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">Email nhận mã OTP khôi phục</label>
        <input
          type="email"
          placeholder="vd: patient@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f]"
        />
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
          <span>Gửi mã OTP khôi phục</span>
        )}
      </button>

      <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-500">
        Đã nhớ mật khẩu?{' '}
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-[#0b3c8f] hover:underline font-bold cursor-pointer border-none bg-transparent"
        >
          Đăng nhập ngay
        </button>
      </div>
    </form>
  );
};
