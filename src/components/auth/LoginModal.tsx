import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, EyeOff, ShieldAlert, Check } from 'lucide-react';

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

export const LoginModal = ({ isOpen, onClose, onLoginSuccess, isStandalone = false }: LoginModalProps) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // In-memory user store initialized with default mock account
  const [registeredUsers, setRegisteredUsers] = useState<Array<{phone: string, pass: string, name: string}>>([
    { phone: '0987654321', pass: '123456', name: 'Nguyễn Văn A' }
  ]);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
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
    setPhoneNumber('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (authMode === 'login') {
      // Login validation
      if (!phoneNumber.trim()) {
        setError('Vui lòng nhập số điện thoại');
        return;
      }
      if (!password.trim()) {
        setError('Vui lòng nhập mật khẩu');
        return;
      }

      // Check if credentials exist in our mock state
      const userExists = registeredUsers.find(u => u.phone === phoneNumber && u.pass === password);
      if (!userExists) {
        setError('Số điện thoại hoặc mật khẩu không chính xác. Hãy nhập tài khoản mẫu ở khung xanh bên trên.');
        return;
      }

      setIsSubmitting(true);
      // Mock login call
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setPhoneNumber('');
          setPassword('');
          if (onLoginSuccess) {
            onLoginSuccess(userExists.name);
          }
          onClose(); // Close modal on success
        }, 1500);
      }, 1500);
    } else {
      // Register validation
      if (!fullName.trim()) {
        setError('Vui lòng nhập họ và tên');
        return;
      }
      if (!phoneNumber.trim()) {
        setError('Vui lòng nhập số điện thoại');
        return;
      }
      if (!password.trim()) {
        setError('Vui lòng nhập mật khẩu');
        return;
      }
      if (password.length < 6) {
        setError('Mật khẩu phải chứa ít nhất 6 ký tự');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }

      setIsSubmitting(true);
      // Mock registration call
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
        
        // Add new registered user to in-memory array
        setRegisteredUsers(prev => [...prev, { phone: phoneNumber, pass: password, name: fullName }]);
        
        setTimeout(() => {
          setIsSuccess(false);
          switchMode('login'); // Switch to login screen on success
        }, 1500);
      }, 1500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* 1. Backdrop Overlay (with blur and smooth fade) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-0"
          />

          {/* 2. Floating Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[480px] bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-100 flex flex-col text-slate-800"
          >
            
            {/* Close Button X (Top-Right) */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header: Logo + Hospital Info */}
            <div className="flex flex-col items-center justify-center mb-6 pt-4">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5 w-full justify-center">
                {/* Logo */}
                <div className="w-14 h-14 rounded-full border border-slate-100 p-1 bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                {/* Name & Motto */}
                <div className="flex flex-col text-left">
                  <span className="font-extrabold text-sm md:text-[15px] text-[#0b3c8f] uppercase leading-tight tracking-wide">
                    BỆNH VIỆN ĐA KHOA 4AM
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-1">
                    4AM MEDICAL CENTER
                  </span>
                  <span className="text-[9px] text-[#0b3c8f] font-semibold tracking-wider italic mt-1">
                    Hệ thống Y tế uy tín
                  </span>
                </div>
              </div>

              {/* Description Instructions */}
              <p className="text-center text-slate-500 text-xs leading-relaxed mt-5 px-2">
                {authMode === 'login' 
                  ? <>Vui lòng đăng nhập bằng tài khoản <strong className="text-[#0b3c8f]">4AM</strong> để sử dụng.</>
                  : <>Đăng ký tài khoản <strong className="text-[#0b3c8f]">4AM</strong> để bắt đầu sử dụng dịch vụ.</>}
              </p>
            </div>

            {/* Success State */}
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100 shadow-sm">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight mb-1">
                  {authMode === 'login' ? 'Đăng nhập thành công' : 'Đăng ký thành công'}
                </h4>
                <p className="text-slate-500 text-xs">
                  {authMode === 'login' ? 'Cổng kết nối đã được thiết lập.' : 'Đang chuyển hướng về màn hình đăng nhập...'}
                </p>
              </div>
            ) : (
              /* Form Inputs */
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Mock Account Hint (Only for Login Mode) */}
                {authMode === 'login' && (
                  <div className="bg-blue-50/70 border border-blue-100/60 rounded-xl p-3.5 text-xs text-[#0b3c8f] leading-relaxed mb-2">
                    <span className="font-bold flex items-center gap-1">💡 Tài khoản thử nghiệm hệ thống:</span>
                    <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px] font-medium">
                      <div>SĐT: <strong className="font-mono text-slate-700 select-all">0987654321</strong></div>
                      <div>Mật khẩu: <strong className="font-mono text-slate-700 select-all">123456</strong></div>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 font-normal leading-normal italic">
                      *Hoặc bạn có thể click Đăng ký bên dưới và đăng nhập bằng tài khoản tự tạo.
                    </div>
                  </div>
                )}

                {/* Register Only Field: Full Name */}
                {authMode === 'register' && (
                  <div className="space-y-2">
                    <label className="block text-xs md:text-sm font-bold text-slate-700 tracking-wide">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập họ và tên"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full bg-white text-slate-800 font-semibold py-2.5 px-4 rounded-lg border text-xs md:text-sm outline-none transition-all focus:ring-2 ${
                        error && !fullName ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-[#0b3c8f] focus:ring-[#0b3c8f]/10'
                      }`}
                    />
                  </div>
                )}

                {/* Input: Phone Number (Shared) */}
                <div className="space-y-2">
                  <label className="block text-xs md:text-sm font-bold text-slate-700 tracking-wide">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập số điện thoại"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`w-full bg-white text-slate-800 font-semibold py-2.5 px-4 rounded-lg border text-xs md:text-sm outline-none transition-all focus:ring-2 ${
                      error && !phoneNumber ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-[#0b3c8f] focus:ring-[#0b3c8f]/10'
                    }`}
                  />
                </div>

                {/* Input: Password (Shared) */}
                <div className="space-y-2">
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

                {/* Register Only Field: Confirm Password */}
                {authMode === 'register' && (
                  <div className="space-y-2">
                    <label className="block text-xs md:text-sm font-bold text-slate-700 tracking-wide">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Nhập lại mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full bg-white text-slate-800 font-semibold py-2.5 pl-4 pr-10 rounded-lg border text-xs md:text-sm outline-none transition-all focus:ring-2 ${
                          error && !confirmPassword ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-[#0b3c8f] focus:ring-[#0b3c8f]/10'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="text-xs text-red-500 font-semibold flex items-center gap-1.5 bg-red-50 p-2.5 rounded-lg border border-red-100">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0b3c8f] hover:bg-[#082a69] text-white font-bold py-3 rounded-lg text-xs md:text-sm uppercase tracking-wider shadow hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span>{authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</span>
                    )}
                  </button>
                </div>

                {/* Switch Modes Link */}
                <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-500">
                  {authMode === 'login' ? (
                    <>
                      Chưa có tài khoản?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('register')}
                        className="text-[#0b3c8f] hover:underline font-bold cursor-pointer bg-transparent border-none outline-none"
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
                        className="text-[#0b3c8f] hover:underline font-bold cursor-pointer bg-transparent border-none outline-none"
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
