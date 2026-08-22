import React from 'react';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';

interface RegisterFormProps {
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  avatarUrl: string;
  setAvatarUrl: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (val: boolean) => void;
  error: string;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  fullName,
  setFullName,
  email,
  setEmail,
  phoneNumber,
  setPhoneNumber,
  avatarUrl,
  setAvatarUrl,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  error,
  isSubmitting,
  onSubmit,
  onSwitchToLogin,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
        <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
          Đăng ký tài khoản Bệnh nhân mới
        </span>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">Họ và tên *</label>
        <input
          type="text"
          placeholder="Nhập họ và tên bệnh nhân"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">Email của bạn *</label>
        <input
          type="email"
          placeholder="vd: patient@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">Số điện thoại</label>
        <input
          type="text"
          placeholder="vd: 0901234567"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">Đường dẫn ảnh đại diện (avatarUrl)</label>
        <input
          type="text"
          placeholder="vd: https://minio.domain.com/app-uploads/avatars/user.jpg"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">Mật khẩu</label>
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

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">Xác nhận mật khẩu</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white text-slate-800 font-semibold py-2 pl-3.5 pr-10 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f]"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer border-none bg-transparent"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
          <span>Đăng ký (Gửi mã OTP)</span>
        )}
      </button>

      <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-500">
        Đã có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[#0b3c8f] hover:underline font-bold cursor-pointer border-none bg-transparent"
        >
          Đăng nhập ngay
        </button>
      </div>
    </form>
  );
};
