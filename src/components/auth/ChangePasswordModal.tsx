import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, EyeOff, ShieldAlert, Check, Lock } from 'lucide-react';
import { authService } from '../../services/auth/auth.service';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setIsSuccess(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
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
            onClick={handleClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-0"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[480px] bg-white rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-100 flex flex-col text-slate-800 my-auto"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0b3c8f] flex items-center justify-center shrink-0 border border-blue-100">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-extrabold text-sm text-[#0b3c8f] uppercase tracking-wide">
                  Đổi mật khẩu tài khoản
                </h3>
                <span className="text-[11px] text-slate-500">Cập nhật mật khẩu bảo mật cá nhân</span>
              </div>
            </div>

            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 border border-emerald-200 shadow-xs">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-base font-extrabold text-slate-800 uppercase tracking-tight mb-1">
                  Đổi mật khẩu thành công!
                </h4>
                <p className="text-slate-500 text-xs">Mật khẩu mới đã được cập nhật an toàn.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Mật khẩu hiện tại</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu hiện tại"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-white text-slate-800 font-semibold py-2 pl-3.5 pr-10 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer border-none bg-transparent"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Mật khẩu mới (Tối thiểu 8 ký tự)</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white text-slate-800 font-semibold py-2 pl-3.5 pr-10 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer border-none bg-transparent"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu mới"
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
                    <span>Lưu mật khẩu mới</span>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
