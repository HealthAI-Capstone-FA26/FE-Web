import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { X, Eye, EyeOff, ShieldAlert, Check, Shield, Stethoscope, Activity, FlaskConical, Users, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth/auth.service';
import { ROLE_DEFAULT_PATHS } from '../types/dashboard';
import type { UserRole } from '../types/auth';

/* 
 * DESIGN READ:
 * Page Kind: Login Modal Screen (Đăng nhập) for a Premium Medical Brand
 * Audience: Patients and staff logging into 4AM Care portal
 */

export const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithTokens, switchRole } = useAuth();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClose = () => {
    navigate('/');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!emailOrPhone.trim()) {
      setError('Vui lòng nhập Email hoặc Số điện thoại');
      return;
    }
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Gọi API backend thực tế
      const res = await authService.login({
        email: emailOrPhone.trim(),
        password: password,
      });

      setIsSubmitting(false);
      setIsSuccess(true);

      // 2. Lưu token & update state người dùng
      loginWithTokens(res.accessToken, res.refreshToken, res.user);

      // 3. Chuyển hướng theo đúng role từ backend trả về
      const mappedRole = (res.user.actorRole || 'PATIENT').toUpperCase().trim() as UserRole;
      const targetPath = ROLE_DEFAULT_PATHS[mappedRole] || '/dashboard';

      setTimeout(() => {
        navigate(targetPath);
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu.';
      setError(msg);
    }
  };

  // Nút đăng nhập nhanh giả lập (dành cho Demo & Test UI)
  const handleQuickRoleLogin = (role: UserRole) => {
    switchRole(role);
    setIsSuccess(true);
    const targetPath = ROLE_DEFAULT_PATHS[role] || '/dashboard';
    setTimeout(() => {
      navigate(targetPath);
    }, 800);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden font-sans">
      {/* 1. Backdrop Collage */}
      <div className="absolute inset-0 z-0 bg-slate-950/80 backdrop-blur-[5px]" />

      {/* 2. Floating Login Modal Wrapper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-[500px] mx-4 bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-100 flex flex-col text-slate-800"
      >
        {/* Close Button X */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center justify-center mb-5 pt-2">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4 w-full justify-center">
            <div className="w-12 h-12 rounded-full border border-slate-100 p-1 bg-white flex items-center justify-center shrink-0 shadow-sm">
              <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-sm md:text-[15px] text-[#0b3c8f] uppercase leading-tight tracking-wide">
                BỆNH VIỆN ĐA KHOA 4AM
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-1">
                4AM MEDICAL CENTER
              </span>
            </div>
          </div>

          <p className="text-center text-slate-500 text-xs leading-relaxed mt-4 px-2">
            Vui lòng nhập tài khoản để sử dụng hệ thống.
          </p>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100 shadow-sm">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight mb-1">Đăng nhập thành công</h4>
            <p className="text-slate-500 text-xs">Đang chuyển hướng về giao diện làm việc...</p>
          </div>
        ) : (
          /* Form Inputs */
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Input 1: Email or Phone */}
            <div className="space-y-1.5">
              <label className="block text-xs md:text-sm font-bold text-slate-700 tracking-wide">
                Email hoặc Số điện thoại
              </label>
              <input
                type="text"
                placeholder="Nhập email hoặc sđt (vd: admin@gmail.com)"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className={`w-full bg-white text-slate-800 font-semibold py-2.5 px-4 rounded-lg border text-xs md:text-sm outline-none transition-all focus:ring-2 ${
                  error && !emailOrPhone ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-[#0b3c8f] focus:ring-[#0b3c8f]/10'
                }`}
              />
            </div>

            {/* Input 2: Password */}
            <div className="space-y-1.5">
              <label className="block text-xs md:text-sm font-bold text-slate-700 tracking-wide">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-white text-slate-800 font-semibold py-2.5 pl-4 pr-10 rounded-lg border text-xs md:text-sm outline-none transition-all focus:ring-2 ${
                    error && !password ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-[#0b3c8f] focus:ring-[#0b3c8f]/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-xs text-red-500 font-semibold flex items-center gap-1.5 bg-red-50 p-2.5 rounded-lg border border-red-100">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0b3c8f] hover:bg-[#082a69] text-white font-bold py-3 rounded-lg text-xs md:text-sm uppercase tracking-wider shadow hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Đăng nhập Backend API</span>
                )}
              </button>
            </div>

            {/* Quick Demo Switcher Section */}
            <div className="pt-3 border-t border-slate-100 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Đăng nhập nhanh theo Vai trò (Demo)
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('ADMIN')}
                  className="p-2 rounded-lg bg-slate-900 text-white font-semibold flex items-center justify-center gap-1 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('RECEPTIONIST')}
                  className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center justify-center gap-1 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Lễ tân</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('DOCTOR')}
                  className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Bác sĩ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('NURSE')}
                  className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold flex items-center justify-center gap-1 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Điều dưỡng</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('LAB')}
                  className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-semibold flex items-center justify-center gap-1 hover:bg-purple-100 transition-colors cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Lab AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin('PATIENT')}
                  className="p-2 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold flex items-center justify-center gap-1 hover:bg-cyan-100 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Bệnh nhân</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

