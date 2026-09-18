import React from 'react';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';

interface LoginFormProps {
  emailOrPhone: string;
  setEmailOrPhone: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  error: string;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  emailOrPhone,
  setEmailOrPhone,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  error,
  isSubmitting,
  onSubmit,
  onSwitchToRegister,
  onSwitchToForgotPassword,
}) => {
  return (
    <div className="space-y-4">

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Email của bạn
          </label>
          <input
            type="email"
            placeholder="vd: patient@gmail.com hoặc staff@tamanh.vn"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            className="w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f]"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">Mật khẩu</label>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-[11px] text-[#0b3c8f] hover:underline font-bold cursor-pointer border-none bg-transparent"
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white text-slate-800 font-semibold py-2 pl-3.5 pr-10 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer border-none bg-transparent"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
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
            <span>Đăng nhập</span>
          )}
        </button>

        <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-500">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-[#0b3c8f] hover:underline font-bold cursor-pointer border-none bg-transparent"
          >
            Đăng ký ngay
          </button>
        </div>
      </form>
    </div>
  );
};
