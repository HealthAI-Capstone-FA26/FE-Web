import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, ShieldAlert, Check, ArrowLeft, ShieldCheck, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth/auth.service';
import { ROLE_DEFAULT_PATHS } from '../types/dashboard';
import type { UserRole } from '../types/auth';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { OtpVerificationStep } from '../components/auth/OtpVerificationStep';
import { ResetPasswordStep } from '../components/auth/ResetPasswordStep';

interface LoginPageProps {
  initialMode?: 'login' | 'register' | 'forgot-password';
}

export const LoginPage = ({ initialMode = 'login' }: LoginPageProps): React.ReactElement => {
  const navigate = useNavigate();
  const { isLoggedIn, user, currentRole, loginWithTokens } = useAuth();

  // If already logged in, redirect to workspace
  useEffect(() => {
    if (isLoggedIn && user) {
      const defaultPath = ROLE_DEFAULT_PATHS[currentRole] || '/dashboard';
      navigate(defaultPath, { replace: true });
    }
  }, [isLoggedIn, user, currentRole, navigate]);

  // Auth Mode: 'login' | 'register' | 'forgot-password' | 'otp' | 'reset-password'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'otp' | 'reset-password'>(initialMode);
  const [otpFlow, setOtpFlow] = useState<'register' | 'forgot-password'>('register');

  // Login form fields
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form fields
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAvatarUrl, setRegAvatarUrl] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Forgot Password fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI status
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
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
      const res = await authService.login({
        email: emailOrPhone.trim(),
        password: password,
      });

      setIsSubmitting(false);
      setIsSuccess(true);
      setInfoMessage('Đăng nhập thành công! Đang chuyển hướng...');

      loginWithTokens(res.accessToken, res.refreshToken, res.user);

      let rawRole = (res.user.actorRole || 'PATIENT').toUpperCase().trim();
      if (rawRole === 'LAB_STAFF') rawRole = 'LAB';
      if (rawRole === 'RECEPTION') rawRole = 'RECEPTIONIST';
      const mappedRole = rawRole as UserRole;
      const targetPath = ROLE_DEFAULT_PATHS[mappedRole] || '/dashboard';

      setTimeout(() => {
        navigate(targetPath, { replace: true });
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.');
    }
  };

  // 2. Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!regFullName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu');
      return;
    }
    if (regPassword.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.register({
        email: regEmail.trim(),
        password: regPassword,
        fullName: regFullName.trim(),
        phoneNumber: regPhone.trim() || undefined,
        avatarUrl: regAvatarUrl.trim() || undefined,
      });
      setIsSubmitting(false);
      setOtpFlow('register');
      setMode('otp');
      setInfoMessage(res.message || 'Mã OTP xác thực đã được gửi tới email của bạn.');
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  // 3. Handle Request Forgot Password OTP
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!forgotEmail.trim()) {
      setError('Vui lòng nhập Email nhận mã xác thực');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.forgotPassword(forgotEmail.trim());
      setIsSubmitting(false);
      setOtpFlow('forgot-password');
      setMode('otp');
      setInfoMessage(res.message || 'Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn.');
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Không thể gửi yêu cầu quên mật khẩu. Vui lòng thử lại.');
    }
  };

  // 4. Handle Resend OTP
  const handleResendOtp = async () => {
    setError('');
    setIsResending(true);
    try {
      if (otpFlow === 'register') {
        const res = await authService.register({
          email: regEmail.trim(),
          password: regPassword,
          fullName: regFullName.trim(),
          phoneNumber: regPhone.trim() || undefined,
          avatarUrl: regAvatarUrl.trim() || undefined,
        });
        setInfoMessage(res.message || 'Đã gửi lại mã OTP mới tới email của bạn.');
      } else {
        const res = await authService.forgotPassword(forgotEmail.trim());
        setInfoMessage(res.message || 'Đã gửi lại mã OTP mới tới email của bạn.');
      }
    } catch (err: any) {
      setError(err?.message || 'Gửi lại OTP thất bại, vui lòng thử lại.');
    } finally {
      setIsResending(false);
    }
  };

  // 5. Handle Verify OTP (Register or Forgot Password)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Vui lòng nhập mã OTP gồm đúng 6 chữ số');
      return;
    }

    setIsSubmitting(true);
    try {
      if (otpFlow === 'register') {
        await authService.verifyRegisterOtp({
          email: regEmail.trim(),
          otp: otpCode.trim(),
        });
        setIsSubmitting(false);
        setIsSuccess(true);
        setInfoMessage('Đăng ký tài khoản thành công! Đang chuyển sang màn hình đăng nhập...');
        setTimeout(() => {
          setIsSuccess(false);
          setEmailOrPhone(regEmail);
          setMode('login');
          setOtpCode('');
        }, 1500);
      } else if (otpFlow === 'forgot-password') {
        const res = await authService.verifyForgotPasswordOtp(forgotEmail.trim(), otpCode.trim());
        setIsSubmitting(false);
        setResetToken(res.resetToken);
        setMode('reset-password');
        setInfoMessage('Xác thực OTP thành công. Vui lòng tạo mật khẩu mới.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Mã OTP không hợp lệ hoặc đã hết thời gian sử dụng.');
    }
  };

  // 6. Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword.trim() || newPassword.length < 8) {
      setError('Mật khẩu mới phải có tối thiểu 8 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(resetToken, newPassword, confirmPassword);
      setIsSubmitting(false);
      setIsSuccess(true);
      setInfoMessage('Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.');

      setTimeout(() => {
        setIsSuccess(false);
        setMode('login');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpCode('');
        setError('');
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Không thể thiết lập lại mật khẩu. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-y-auto font-sans bg-slate-950 p-4 py-8">
      {/* Background radial glow */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[500px] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.6),inset_0_1px_2px_rgba(255,255,255,0.9)] border border-white/90 p-6 md:p-8 flex flex-col text-slate-800 my-auto"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center mb-5 pt-1">
          <div className="flex items-center gap-3.5 border-b border-slate-200/70 pb-4 w-full justify-center">
            <div className="w-12 h-12 rounded-2xl border border-white/90 p-1 bg-white flex items-center justify-center shrink-0 shadow-sm">
              <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black text-sm md:text-base text-[#0b3c8f] uppercase leading-tight tracking-wide">
                Phòng khám Tim mạch 4AM
              </span>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                {mode === 'register' ? 'Đăng ký tài khoản bệnh nhân' : 'Cổng đăng nhập hệ thống nội bộ'}
              </span>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mt-4 grid grid-cols-2 bg-slate-100 p-1 rounded-2xl w-full border border-slate-200/70 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setInfoMessage('');
                  setMode('login');
                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-[#0b3c8f] shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setInfoMessage('');
                  setMode('register');
                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-[#0b3c8f] shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Đăng ký mới</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Flow */}
        <AnimatePresence mode="wait">
          {/* SUCCESS MESSAGE */}
          {isSuccess ? (
            <motion.div
              key="success-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 border border-emerald-200 shadow-xs">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <h4 className="text-base font-extrabold text-slate-800 uppercase tracking-tight mb-1">
                Thành công!
              </h4>
              <p className="text-slate-500 text-xs">{infoMessage || 'Đang xử lý chuyển hướng...'}</p>
            </motion.div>
          ) : mode === 'register' ? (
            /* REGISTER FORM */
            <motion.div
              key="register-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <RegisterForm
                fullName={regFullName}
                setFullName={setRegFullName}
                email={regEmail}
                setEmail={setRegEmail}
                phoneNumber={regPhone}
                setPhoneNumber={setRegPhone}
                avatarUrl={regAvatarUrl}
                setAvatarUrl={setRegAvatarUrl}
                password={regPassword}
                setPassword={setRegPassword}
                confirmPassword={regConfirmPassword}
                setConfirmPassword={setRegConfirmPassword}
                showPassword={showRegPassword}
                setShowPassword={setShowRegPassword}
                showConfirmPassword={showRegConfirmPassword}
                setShowConfirmPassword={setShowRegConfirmPassword}
                error={error}
                isSubmitting={isSubmitting}
                onSubmit={handleRegisterSubmit}
                onSwitchToLogin={() => {
                  setError('');
                  setInfoMessage('');
                  setMode('login');
                }}
              />
            </motion.div>
          ) : mode === 'otp' ? (
            /* OTP VERIFICATION STEP */
            <motion.div
              key="otp-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <OtpVerificationStep
                email={otpFlow === 'register' ? regEmail : forgotEmail}
                otpCode={otpCode}
                setOtpCode={setOtpCode}
                infoMessage={infoMessage}
                error={error}
                isSubmitting={isSubmitting}
                isResending={isResending}
                onSubmit={handleVerifyOtp}
                onResendOtp={handleResendOtp}
                onBack={() => {
                  setError('');
                  setMode(otpFlow);
                }}
              />
            </motion.div>
          ) : mode === 'forgot-password' ? (
            /* FORGOT PASSWORD FORM */
            <motion.div
              key="forgot-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ForgotPasswordForm
                email={forgotEmail}
                setEmail={setForgotEmail}
                error={error}
                isSubmitting={isSubmitting}
                onSubmit={handleRequestForgotOtp}
                onBackToLogin={() => {
                  setError('');
                  setMode('login');
                }}
              />
            </motion.div>
          ) : mode === 'reset-password' ? (
            /* RESET PASSWORD STEP */
            <motion.div
              key="reset-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResetPasswordStep
                password={newPassword}
                setPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                error={error}
                isSubmitting={isSubmitting}
                onSubmit={handleResetPasswordSubmit}
                onBack={() => {
                  setError('');
                  setMode('login');
                }}
              />
            </motion.div>
          ) : (
            /* LOGIN FORM */
            <motion.form
              key="login-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLoginSubmit}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 tracking-tight">
                  Email hoặc Tên tài khoản
                </label>
                <input
                  type="text"
                  placeholder="Nhập email (vd: benhnhan@gmail.com hoặc bacsi@4am.vn)"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  autoComplete="username"
                  className="w-full bg-white hover:bg-white text-slate-800 font-bold py-2.5 px-4 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f] focus:ring-2 focus:ring-blue-500/20 shadow-2xs transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-700 tracking-tight">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setForgotEmail(emailOrPhone);
                      setMode('forgot-password');
                    }}
                    className="text-[11.5px] text-[#0b3c8f] hover:underline font-extrabold cursor-pointer border-none bg-transparent"
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
                    autoComplete="current-password"
                    className="w-full bg-white hover:bg-white text-slate-800 font-bold py-2.5 pl-4 pr-10 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f] focus:ring-2 focus:ring-blue-500/20 shadow-2xs transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer border-none bg-transparent"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message Display */}
              {error && (
                <div className="text-xs text-rose-600 font-extrabold flex items-center gap-1.5 bg-rose-50 p-3 rounded-xl border border-rose-100 shadow-2xs">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#0b3c8f] to-blue-700 hover:from-[#082a69] hover:to-blue-800 text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-blue-900/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border-none flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Đăng nhập hệ thống</span>
                  </>
                )}
              </button>

              {/* Switch to Register link */}
              <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                Chưa có tài khoản bệnh nhân?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setInfoMessage('');
                    setMode('register');
                  }}
                  className="text-[#0b3c8f] hover:underline font-bold cursor-pointer border-none bg-transparent"
                >
                  Đăng ký ngay
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer Back link */}
        <div className="mt-5 pt-3 border-t border-slate-100 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0b3c8f] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
