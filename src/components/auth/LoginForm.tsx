import React from 'react';
import { Eye, EyeOff, ShieldAlert, Sparkles, Stethoscope, Activity, UserCheck, FlaskConical, ShieldCheck } from 'lucide-react';
import type { UserRole } from '../../types/auth';

export const DEMO_STAFF_ACCOUNTS: Array<{
  role: UserRole;
  label: string;
  name: string;
  email: string;
  badge: string;
  icon: any;
}> = [
  {
    role: 'DOCTOR',
    label: 'Bác sĩ khám',
    name: 'BS. CKII. Nguyễn Quang Huy',
    email: 'huy.doctor@tamanh.vn',
    badge: 'Mô-đun 5, 8, 9',
    icon: Stethoscope
  },
  {
    role: 'NURSE',
    label: 'Điều dưỡng',
    name: 'Trần Thị Mai',
    email: 'mai.nurse@tamanh.vn',
    badge: 'Mô-đun 4 (Sinh hiệu)',
    icon: Activity
  },
  {
    role: 'RECEPTION',
    label: 'Lễ tân / Thu ngân',
    name: 'Nguyễn Văn Minh',
    email: 'minh.reception@tamanh.vn',
    badge: 'Mô-đun 2, 3, 6',
    icon: UserCheck
  },
  {
    role: 'LAB',
    label: 'KTV Phòng Lab',
    name: 'KTV. Trương Lê Danh Thái',
    email: 'thai.lab@tamanh.vn',
    badge: 'Mô-đun 7 (Lab & AI)',
    icon: FlaskConical
  },
  {
    role: 'ADMIN',
    label: 'Quản trị viên',
    name: 'Nguyễn Bá Anh Nguyên',
    email: 'nguyen.admin@tamanh.vn',
    badge: 'Mô-đun 10 & 11',
    icon: ShieldCheck
  }
];

interface LoginFormProps {
  emailOrPhone: string;
  setEmailOrPhone: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  loginType: 'staff' | 'patient';
  setLoginType: (val: 'staff' | 'patient') => void;
  error: string;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onQuickStaffLogin: (staff: typeof DEMO_STAFF_ACCOUNTS[0]) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  emailOrPhone,
  setEmailOrPhone,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loginType,
  setLoginType,
  error,
  isSubmitting,
  onSubmit,
  onSwitchToRegister,
  onSwitchToForgotPassword,
  onQuickStaffLogin,
}) => {
  return (
    <div className="space-y-4">
      {/* Quick Staff Roles Panel */}
      <div className="mb-5 bg-gradient-to-br from-blue-900 to-indigo-950 rounded-2xl p-4 text-white shadow-md">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Đăng nhập nhanh Vai trò Nội bộ</span>
          </span>
          <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
            Demo Mode
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DEMO_STAFF_ACCOUNTS.map((staff) => {
            const Icon = staff.icon;
            return (
              <button
                key={staff.role}
                type="button"
                onClick={() => onQuickStaffLogin(staff)}
                className="flex flex-col p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-left transition-all cursor-pointer group hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon className="w-4 h-4 text-blue-300 group-hover:text-white" />
                  <span className="text-[9px] bg-blue-500/40 text-blue-100 px-1.5 py-0.5 rounded font-medium">
                    {staff.role}
                  </span>
                </div>
                <span className="text-xs font-bold text-white line-clamp-1">{staff.label}</span>
                <span className="text-[10px] text-blue-200/80 line-clamp-1">{staff.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
          <span className="font-bold text-slate-700">Hoặc nhập thông tin tài khoản:</span>
          <div className="flex gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setLoginType('staff')}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer border ${
                loginType === 'staff'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Nhân viên Y tế
            </button>
            <button
              type="button"
              onClick={() => setLoginType('patient')}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer border ${
                loginType === 'patient'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Bệnh nhân
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            {loginType === 'staff' ? 'Email nhân viên' : 'Email của bạn'}
          </label>
          <input
            type="email"
            placeholder={loginType === 'staff' ? 'vd: doctor@tamanh.vn' : 'vd: patient@gmail.com'}
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
            <span>Đăng nhập (Gửi mã OTP)</span>
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
