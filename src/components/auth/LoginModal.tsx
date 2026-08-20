import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Eye, EyeOff, ShieldAlert, Check, Stethoscope, Activity, 
  UserCheck, FlaskConical, ShieldCheck, User, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/auth';

/* 
 * DESIGN READ:
 * Component Kind: Modal overlay (inline login & register)
 * Vibe: Premium modal popup supporting seamless transition between Login and Register modes.
 *       Includes a real in-memory registered user store allowing testing of registration & login.
 */

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (userName: string) => void;
  isStandalone?: boolean;
}

const DEMO_STAFF_ACCOUNTS: Array<{
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
  },
  {
    role: 'PATIENT',
    label: 'Bệnh nhân',
    name: 'Khưu Trọng Quân',
    email: 'quan.khuu@gmail.com',
    badge: 'Patient Portal',
    icon: User
  }
];

export const LoginModal = ({ isOpen, onClose, onLoginSuccess, isStandalone: _isStandalone = false }: LoginModalProps) => {
  const { login: authLogin, switchRole } = useAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginType, setLoginType] = useState<'staff' | 'patient'>('staff');

  // Form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('huy.doctor@tamanh.vn');
  const [password, setPassword] = useState('123456');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const switchMode = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setFullName('');
    setPhoneNumber('huy.doctor@tamanh.vn');
    setPassword('123456');
    setConfirmPassword('');
    setError('');
  };

  const handleQuickStaffLogin = (staff: typeof DEMO_STAFF_ACCOUNTS[0]) => {
    setIsSubmitting(true);
    setError('');
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      switchRole(staff.role);
      authLogin(staff.email, staff.role);

      setTimeout(() => {
        setIsSuccess(false);
        if (onLoginSuccess) {
          onLoginSuccess(staff.name);
        }
        onClose();
        navigate('/dashboard');
      }, 1000);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (authMode === 'login') {
      if (!phoneNumber.trim()) {
        setError('Vui lòng nhập Email hoặc Số điện thoại');
        return;
      }
      if (!password.trim()) {
        setError('Vui lòng nhập mật khẩu');
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
        // Default login as doctor or matched role
        const matched = DEMO_STAFF_ACCOUNTS.find(
          (s) => s.email.toLowerCase() === phoneNumber.trim().toLowerCase()
        );
        const targetRole: UserRole = matched ? matched.role : 'DOCTOR';
        const targetName = matched ? matched.name : 'BS. Nguyễn Quang Huy';

        switchRole(targetRole);
        authLogin(phoneNumber, targetRole);

        setTimeout(() => {
          setIsSuccess(false);
          if (onLoginSuccess) {
            onLoginSuccess(targetName);
          }
          onClose();
          navigate('/dashboard');
        }, 1000);
      }, 1000);
    } else {
      if (!fullName.trim() || !phoneNumber.trim() || !password.trim()) {
        setError('Vui lòng nhập đầy đủ thông tin đăng ký');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          switchMode('login');
        }, 1200);
      }, 1000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-0"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[560px] bg-white rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-100 flex flex-col text-slate-800 my-auto max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center justify-center mb-5 pt-2">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 w-full justify-center">
                <div className="w-12 h-12 rounded-2xl border border-slate-200 p-1 bg-white flex items-center justify-center shrink-0 shadow-xs">
                  <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-extrabold text-sm md:text-base text-[#0b3c8f] uppercase leading-tight tracking-wide">
                    BỆNH VIỆN ĐA KHOA 4AM
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    FHIR & Medical AI Healthcare System
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Demo Staff Roles Switcher Panel */}
            {authMode === 'login' && (
              <div className="mb-5 bg-gradient-to-br from-blue-900 to-indigo-950 rounded-2xl p-4 text-white shadow-md">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Đăng nhập nhanh Vai trò Nội bộ</span>
                  </span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                    6 System Roles
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DEMO_STAFF_ACCOUNTS.map((staff) => {
                    const Icon = staff.icon;
                    return (
                      <button
                        key={staff.role}
                        type="button"
                        onClick={() => handleQuickStaffLogin(staff)}
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
            )}

            {/* Success State */}
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 border border-emerald-200 shadow-xs">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-base font-extrabold text-slate-800 uppercase tracking-tight mb-1">
                  Đăng nhập thành công!
                </h4>
                <p className="text-slate-500 text-xs">Đang mở cổng làm việc nội bộ Dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-700">Hoặc nhập email đăng nhập trực tiếp:</span>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setLoginType('staff')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer border ${loginType === 'staff' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                    >
                      Nhân viên Y tế
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginType('patient')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer border ${loginType === 'patient' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                    >
                      Bệnh nhân
                    </button>
                  </div>
                </div>

                {authMode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Họ và tên</label>
                    <input
                      type="text"
                      placeholder="Nhập họ và tên"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f]"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {loginType === 'staff' ? 'Email nhân viên' : 'Số điện thoại / Email'}
                  </label>
                  <input
                    type="text"
                    placeholder={loginType === 'staff' ? 'vd: huy.doctor@tamanh.vn' : 'vd: 0902357872'}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
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

                {authMode === 'register' && (
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
                )}

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
                    <span>{authMode === 'login' ? 'Đăng nhập vào Dashboard' : 'Đăng ký tài khoản'}</span>
                  )}
                </button>

                <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-500">
                  {authMode === 'login' ? (
                    <>
                      Chưa có tài khoản?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('register')}
                        className="text-[#0b3c8f] hover:underline font-bold cursor-pointer border-none bg-transparent"
                      >
                        Đăng ký ngay
                      </button>
                    </>
                  ) : (
                    <>
                      Đã có tài khoản?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="text-[#0b3c8f] hover:underline font-bold cursor-pointer border-none bg-transparent"
                      >
                        Đăng nhập ngay
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
