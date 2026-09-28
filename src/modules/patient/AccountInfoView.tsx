import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Save,
  X,
  Upload,
  Key,
  Lock,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth/auth.service';
import { userService } from '../../services/user/user.service';
import { getAvatarUrl } from '../../services/api';

interface AccountInfoViewProps {
  onNavigateToProfile?: () => void;
  onNavigateToBooking?: () => void;
}

export const AccountInfoView: React.FC<AccountInfoViewProps> = () => {
  const { user, updateUserProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const initialAvatar = user?.avatar ? getAvatarUrl(user.avatar) : null;
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatar);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Change Password State
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await userService.updateMyProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        avatarFile: avatarFile || undefined,
      });

      // Update AuthContext state
      updateUserProfile({
        name: res.fullName || fullName.trim(),
        phone: res.phoneNumber || phoneNumber.trim(),
        avatar: res.avatarUrl || avatarPreview || undefined,
      });

      setIsSubmitting(false);
      setIsEditing(false);
      setSuccessMessage('Cập nhật thông tin tài khoản thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Cập nhật profile thất bại. Vui lòng thử lại.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg('');
    setPassSuccessMsg('');

    if (!currentPassword) {
      setPassErrorMsg('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (newPassword.length < 8) {
      setPassErrorMsg('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (newPassword.length > 72) {
      setPassErrorMsg('Mật khẩu không được vượt quá 72 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassErrorMsg('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await authService.changePassword(currentPassword, newPassword, confirmPassword);
      setIsChangingPass(false);
      setPassSuccessMsg(res.message || 'Đổi mật khẩu thành công! Hãy dùng mật khẩu mới cho lần đăng nhập sau.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccessMsg(''), 4000);
    } catch (err: any) {
      setIsChangingPass(false);
      setPassErrorMsg(err.message || 'Đổi mật khẩu không thành công. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-4 animate-in fade-in duration-200">
      {/* Liquid Glass Header Banner */}
      <div className="glass-card-dark p-4.5 md:p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Ambient liquid glow element */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-inner shrink-0">
            <User className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Thông Tin Tài Khoản Đăng Nhập</span>
            </h2>
            <p className="text-[11px] text-blue-200/80 font-medium">
              Quản lý tài khoản truy cập trực tuyến, bảo mật và thông tin xác thực tại Bệnh viện 4AM.
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-400/30 backdrop-blur-md rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-400/30 backdrop-blur-md rounded-xl flex items-center gap-2.5 text-rose-800 text-xs font-bold animate-in fade-in shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Account Overview Glass Card */}
      <div className="glass-card p-4.5 md:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4.5 pb-4 border-b border-slate-200/60">
          <div className="relative shrink-0">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={user?.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-500/20 border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 ring-4 ring-blue-500/20 border-2 border-white flex items-center justify-center text-blue-700 shadow-md shrink-0 font-black text-xl">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-8 h-8 text-slate-400" />}
              </div>
            )}

            {isEditing && (
              <label className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full cursor-pointer transition-all shadow-md active:scale-95">
                <Upload className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{user?.name || user?.email}</h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-800 border border-emerald-300/60 backdrop-blur-xs shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Tài khoản Online đã xác thực
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium pt-0.5">
              {user?.email}
            </p>
          </div>

          <div>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setFullName(user?.name || '');
                  setPhoneNumber(user?.phone || '');
                  setIsEditing(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 border border-blue-400/30"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Chỉnh sửa Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hủy</span>
              </button>
            )}
          </div>
        </div>

        {/* Edit Form or Read-only Display Grid */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="p-5 bg-white/70 backdrop-blur-md rounded-2xl border border-white/90 shadow-inner space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Cập Nhật Thông Tin Cá Nhân</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Họ và tên tài khoản *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/90 backdrop-blur-sm text-slate-800 font-semibold py-2.5 px-3.5 rounded-xl border border-slate-200/90 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all text-xs outline-none shadow-xs"
                  placeholder="Nhập họ và tên đầy đủ"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-white/90 backdrop-blur-sm text-slate-800 font-semibold py-2.5 px-3.5 rounded-xl border border-slate-200/90 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all text-xs outline-none shadow-xs"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700">Email đăng nhập (Cố định)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-100/80 text-slate-500 font-semibold py-2.5 px-3.5 rounded-xl border text-xs cursor-not-allowed border-slate-200"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  * Email được dùng làm định danh đăng nhập tài khoản trực tuyến và không thể thay đổi trực tiếp.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 shadow-md shadow-blue-500/20 border-none cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Cập Nhật Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Detailed Account Info Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="glass-card p-4 hover:shadow-lg transition-all space-y-1.5">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>EMAIL LIÊN HỆ ĐĂNG NHẬP</span>
              </div>
              <div className="text-xs font-black text-slate-800 font-mono">
                {user?.email}
              </div>
            </div>

            <div className="glass-card p-4 hover:shadow-lg transition-all space-y-1.5">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>SỐ ĐIỆN THOẠI XÁC THỰC</span>
              </div>
              <div className="text-xs font-black text-slate-800 font-mono">
                {user?.phone || 'Chưa cập nhật'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security & Change Password Glass Section */}
      <div className="glass-card p-4.5 md:p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-200/50 backdrop-blur-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Bảo Mật & Mật Khẩu Đăng Nhập</h3>
              <p className="text-xs text-slate-500 font-medium">Đổi mật khẩu định kỳ để đảm bảo an toàn thông tin tài khoản.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md border border-white/20"
          >
            <Key className="w-3.5 h-3.5 text-blue-400" />
            <span>{showPasswordSection ? 'Ẩn Form Đổi Mật Khẩu' : 'Đổi Mật Khẩu'}</span>
          </button>
        </div>

        {passSuccessMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-400/30 backdrop-blur-md rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in shadow-xs">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            <span>{passSuccessMsg}</span>
          </div>
        )}

        {passErrorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-400/30 backdrop-blur-md rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-bold animate-in fade-in shadow-xs">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
            <span>{passErrorMsg}</span>
          </div>
        )}

        {showPasswordSection && (
          <form onSubmit={handleChangePassword} className="p-5 bg-slate-50/80 backdrop-blur-md rounded-2xl border border-slate-200/80 space-y-4 animate-in fade-in duration-200">
            <div className="space-y-4">
              {/* Row 1: Mật khẩu hiện tại (Full width) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Mật khẩu hiện tại *</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white text-slate-800 font-semibold py-2.5 pl-3.5 pr-10 rounded-xl border border-slate-200/90 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all text-xs outline-none shadow-xs"
                    placeholder="Nhập mật khẩu hiện tại của bạn"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Row 2: Mật khẩu mới & Xác nhận mật khẩu (2 cột rộng rãi) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Mật khẩu mới *</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white text-slate-800 font-semibold py-2.5 pl-3.5 pr-10 rounded-xl border border-slate-200/90 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all text-xs outline-none shadow-xs"
                      placeholder="Ít nhất 8 ký tự"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Xác nhận mật khẩu mới *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white text-slate-800 font-semibold py-2.5 pl-3.5 pr-10 rounded-xl border border-slate-200/90 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all text-xs outline-none shadow-xs"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isChangingPass}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 shadow-md shadow-blue-500/20 border-none cursor-pointer"
              >
                {isChangingPass ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Cập Nhật Mật Khẩu Mới</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
