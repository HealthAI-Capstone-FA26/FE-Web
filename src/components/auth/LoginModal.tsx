import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth/auth.service';
import { LoginForm, DEMO_STAFF_ACCOUNTS } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { OtpVerificationStep } from './OtpVerificationStep';
import { ResetPasswordStep } from './ResetPasswordStep';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (userName: string) => void;
  isStandalone?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  isStandalone: _isStandalone = false,
}) => {
  const { login: authLogin, loginWithTokens, switchRole } = useAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password'>('login');

  // Step flow state: 'form' -> 'otp' -> 'reset-password'
  const [step, setStep] = useState<'form' | 'otp' | 'reset-password'>('form');
  const [otpFlow, setOtpFlow] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetFormState = () => {
    setFullName('');
    setEmailOrPhone('');
    setPhoneNumber('');
    setAvatarUrl('');
    setPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setResetToken('');
    setError('');
    setInfoMessage('');
    setStep('form');
  };

  const switchMode = (mode: 'login' | 'register' | 'forgot-password') => {
    setAuthMode(mode);
    resetFormState();
  };

  // Quick staff login for offline/demo testing
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

  // Resend OTP handler
  const handleResendOtp = async () => {
    setError('');
    setIsResending(true);
    try {
      if (otpFlow === 'register') {
        const res = await authService.register({
          email: emailOrPhone.trim(),
          password: password,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
        });
        setInfoMessage(res.message || 'Đã gửi lại mã OTP mới tới email của bạn.');
      } else if (otpFlow === 'login') {
        const res = await authService.login({
          email: emailOrPhone.trim(),
          password: password,
        });
        setInfoMessage(res.message || 'Đã gửi lại mã OTP mới tới email của bạn.');
      } else if (otpFlow === 'forgot-password') {
        const res = await authService.forgotPassword(emailOrPhone.trim());
        setInfoMessage(res.message || 'Đã gửi lại mã OTP mới tới email của bạn.');
      }
    } catch (err: any) {
      setError(err.message || 'Gửi lại OTP thất bại, vui lòng thử lại.');
    } finally {
      setIsResending(false);
    }
  };

  // Step 1: Submit Login, Register, or Forgot Password Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (authMode === 'login') {
      if (!emailOrPhone.trim()) {
        setError('Vui lòng nhập Email');
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
        setInfoMessage(res.message || 'Đăng nhập thành công!');

        loginWithTokens(res.accessToken, res.refreshToken, res.user);

        setTimeout(() => {
          setIsSuccess(false);
          if (onLoginSuccess) {
            onLoginSuccess(res.user.fullName || res.user.email);
          }
          onClose();
          navigate('/dashboard');
        }, 1000);
      } catch (err: any) {
        setIsSubmitting(false);
        setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email & mật khẩu.');
      }
    } else if (authMode === 'register') {
      if (!fullName.trim() || !emailOrPhone.trim() || !password.trim()) {
        setError('Vui lòng nhập đầy đủ thông tin đăng ký');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await authService.register({
          email: emailOrPhone.trim(),
          password: password,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
        });
        setIsSubmitting(false);
        setOtpFlow('register');
        setStep('otp');
        setInfoMessage(res.message || 'Mã OTP xác thực đã được gửi tới email của bạn.');
      } catch (err: any) {
        setIsSubmitting(false);
        setError(err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } else if (authMode === 'forgot-password') {
      if (!emailOrPhone.trim()) {
        setError('Vui lòng nhập Email khôi phục mật khẩu');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await authService.forgotPassword(emailOrPhone.trim());
        setIsSubmitting(false);
        setOtpFlow('forgot-password');
        setStep('otp');
        setInfoMessage(res.message || 'Đã gửi mã OTP khôi phục mật khẩu tới email của bạn.');
      } catch (err: any) {
        setIsSubmitting(false);
        setError(err.message || 'Không thể gửi yêu cầu quên mật khẩu. Vui lòng thử lại.');
      }
    }
  };

  // Step 2: Submit OTP Verification
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
          email: emailOrPhone.trim(),
          otp: otpCode.trim(),
        });
        setIsSubmitting(false);
        setIsSuccess(true);
        setInfoMessage('Đăng ký thành công! Đang chuyển sang màn hình đăng nhập...');
        setTimeout(() => {
          setIsSuccess(false);
          setStep('form');
          setAuthMode('login');
          setPassword('');
          setOtpCode('');
        }, 1500);
      } else if (otpFlow === 'login') {
        const res = await authService.verifyLoginOtp({
          email: emailOrPhone.trim(),
          otp: otpCode.trim(),
        });
        setIsSubmitting(false);
        setIsSuccess(true);

        loginWithTokens(res.accessToken, res.refreshToken, res.user);

        setTimeout(() => {
          setIsSuccess(false);
          if (onLoginSuccess) {
            onLoginSuccess(res.user.fullName || res.user.email);
          }
          onClose();
          navigate('/dashboard');
        }, 1000);
      } else if (otpFlow === 'forgot-password') {
        const res = await authService.verifyForgotPasswordOtp(emailOrPhone.trim(), otpCode.trim());
        setIsSubmitting(false);
        setResetToken(res.resetToken);
        setStep('reset-password');
        setInfoMessage('Xác thực OTP thành công. Vui lòng nhập mật khẩu mới.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    }
  };

  // Step 3: Submit Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim() || password.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(resetToken, password, confirmPassword);
      setIsSubmitting(false);
      setIsSuccess(true);
      setInfoMessage('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
      setTimeout(() => {
        setIsSuccess(false);
        resetFormState();
        setAuthMode('login');
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
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
            exit={{ opacity: 0, scale: 1, y: 0 }}
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

            {/* Success State */}
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 border border-emerald-200 shadow-xs">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-base font-extrabold text-slate-800 uppercase tracking-tight mb-1">
                  Thao tác thành công!
                </h4>
                <p className="text-slate-500 text-xs">{infoMessage || 'Đang xử lý...'}</p>
              </div>
            ) : step === 'otp' ? (
              <OtpVerificationStep
                email={emailOrPhone}
                otpCode={otpCode}
                setOtpCode={setOtpCode}
                infoMessage={infoMessage}
                error={error}
                isSubmitting={isSubmitting}
                isResending={isResending}
                onSubmit={handleVerifyOtp}
                onResendOtp={handleResendOtp}
                onBack={() => setStep('form')}
              />
            ) : step === 'reset-password' ? (
              <ResetPasswordStep
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                error={error}
                isSubmitting={isSubmitting}
                onSubmit={handleResetPassword}
                onBack={() => switchMode('login')}
              />
            ) : authMode === 'register' ? (
              <RegisterForm
                fullName={fullName}
                setFullName={setFullName}
                email={emailOrPhone}
                setEmail={setEmailOrPhone}
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                avatarUrl={avatarUrl}
                setAvatarUrl={setAvatarUrl}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                error={error}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onSwitchToLogin={() => switchMode('login')}
              />
            ) : authMode === 'forgot-password' ? (
              <ForgotPasswordForm
                email={emailOrPhone}
                setEmail={setEmailOrPhone}
                error={error}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onBackToLogin={() => switchMode('login')}
              />
            ) : (
              <LoginForm
                emailOrPhone={emailOrPhone}
                setEmailOrPhone={setEmailOrPhone}
                password={password}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                error={error}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onSwitchToRegister={() => switchMode('register')}
                onSwitchToForgotPassword={() => switchMode('forgot-password')}
                onQuickStaffLogin={handleQuickStaffLogin}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
