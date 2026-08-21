import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { X, Eye, EyeOff, ShieldAlert, Check } from 'lucide-react';

/* 
 * DESIGN READ:
 * Page Kind: Login Modal Screen (Đăng nhập) for a Premium Medical Brand
 * Audience: Patients and staff logging into 4AM Care portal
 * Vibe: Match the screenshot exactly - clean white floating modal, medical collage blurred backdrop, 
 *       responsive inputs, interactive show/hide password toggle, and close route back.
 * 
 * Design Dials:
 * - DESIGN_VARIANCE: 4 (Clean symmetric login card alignment)
 * - MOTION_INTENSITY: 5 (Soft modal slide up transition, scale feedback on hover)
 * - VISUAL_DENSITY: 5 (Standard spacing, high legibility)
 */

export const LoginPage = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClose = () => {
    navigate('/'); // Go back to Home
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setIsSubmitting(true);
    // Mock login call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/'); // Route back to home on success
      }, 1500);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden font-sans">

      {/* 1. Backdrop Collage of Medical Photos (Matching UMC Screenshot) */}
      <div className="absolute inset-0 z-0 grid grid-cols-2 md:grid-cols-4 gap-2 p-2 bg-slate-900">
        {[

        ].map((img, idx) => (
          <div key={idx} className="w-full h-full min-h-[25vh] overflow-hidden rounded-lg">
            <img
              src={img}
              alt="Medical background"
              className="w-full h-full object-cover opacity-30 grayscale"
            />
          </div>
        ))}
        {/* Dark Tint & Blur Overlay */}
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[5px] z-10" />
      </div>

      {/* 2. Floating Login Modal Wrapper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-[500px] mx-4 bg-white rounded-2xl shadow-2xl p-6 md:p-10 border border-slate-100 flex flex-col text-slate-800"
      >

        {/* Close Button X (Top-Right) */}
        <button
          onClick={handleClose}
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
            Vui lòng đăng nhập bằng tài khoản <strong className="text-[#0b3c8f]">4AM Care</strong> để sử dụng.

          </p>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100 shadow-sm">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight mb-1">Đăng nhập thành công</h4>
            <p className="text-slate-500 text-xs">Đang chuyển hướng về trang chủ...</p>
          </div>
        ) : (
          /* Form Inputs */
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Input 1: Phone Number */}
            <div className="space-y-2">
              <label className="block text-xs md:text-sm font-bold text-slate-700 tracking-wide">
                Số điện thoại
              </label>
              <input
                type="text"
                placeholder="Nhập số điện thoại"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={`w-full bg-white text-slate-800 font-semibold py-2.5 px-4 rounded-lg border text-xs md:text-sm outline-none transition-all focus:ring-2 ${error && !phoneNumber ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-[#0b3c8f] focus:ring-[#0b3c8f]/10'
                  }`}
              />
            </div>

            {/* Input 2: Password */}
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
                  className={`w-full bg-white text-slate-800 font-semibold py-2.5 pl-4 pr-10 rounded-lg border text-xs md:text-sm outline-none transition-all focus:ring-2 ${error && !password ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-[#0b3c8f] focus:ring-[#0b3c8f]/10'
                    }`}
                />
                {/* Eye icon show/hide toggle */}
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
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0b3c8f] hover:bg-[#082a69] text-white font-bold py-3 rounded-lg text-xs md:text-sm uppercase tracking-wider shadow hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Đăng nhập</span>
                )}
              </button>
            </div>

          </form>
        )}

      </motion.div>
    </div>
  );
};
