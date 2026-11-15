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
    <div className="space-y-4 max-w-3xl mx-auto pb-4 animate-in fade-in duration-200">
      {/* Header tối giản, đồng bộ nền sáng */}
      <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 flex items-center gap-3.5 shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0">
          <User className="w-4.5 h-4.5 stroke-[1.8]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">
            Thông tin tài khoản
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý hồ sơ đăng nhập, thông tin liên hệ và bảo mật tài khoản.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="px-4 py-3 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs font-medium animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Thẻ thông tin cá nhân */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div className="relative shrink-0 self-center sm:self-auto">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={user?.name}
                className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-lg shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-6 h-6 text-slate-400" />}
              </div>
            )}

            {isEditing && (
              <label
                title="Tải ảnh đại diện mới"
                className="absolute -bottom-0.5 -right-0.5 p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full cursor-pointer transition shadow-sm active:scale-95 border border-white"
              >
                <Upload className="w-3 h-3" />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight truncate">
                {user?.name || user?.email}
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Đã xác thực
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {user?.email}
            </p>
          </div>

          <div className="flex justify-center sm:justify-end">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setFullName(user?.name || '');
                  setPhoneNumber(user?.phone || '');
                  setIsEditing(true);
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hủy</span>
              </button>
            )}
          </div>
        </div>

        {/* Form chỉnh sửa hoặc hiển thị thông tin */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                <span>Cập nhật thông tin cá nhân</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white text-slate-900 font-medium py-2 px-3 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition-all text-xs outline-none"
                  placeholder="Nhập họ và tên đầy đủ"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-white text-slate-900 font-medium py-2 px-3 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition-all text-xs outline-none tabular-nums"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-medium text-slate-700">Email đăng nhập</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-100 text-slate-500 font-medium py-2 px-3 rounded-xl border border-slate-200 text-xs cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400">
                  Email được dùng làm định danh đăng nhập cố định.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Lưới thông tin đơn giản, phẳng và đồng bộ */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl px-4 py-3 space-y-1">
              <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email đăng nhập</span>
              </div>
              <div className="text-sm font-medium text-slate-900 truncate">
                {user?.email}
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl px-4 py-3 space-y-1">
              <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Số điện thoại xác thực</span>
              </div>
              <div className="text-sm font-medium text-slate-900 tabular-nums">
                {user?.phone || 'Chưa cập nhật'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thẻ Bảo mật & Đổi mật khẩu */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0">
              <Lock className="w-4.5 h-4.5 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Bảo mật & mật khẩu
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Đổi mật khẩu định kỳ để giữ an toàn cho tài khoản.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className={`self-start sm:self-auto px-3.5 py-2 font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98] ${
              showPasswordSection
                ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{showPasswordSection ? 'Đóng' : 'Đổi mật khẩu'}</span>
          </button>
        </div>

        {passSuccessMsg && (
          <div className="px-4 py-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passSuccessMsg}</span>
          </div>
        )}

        {passErrorMsg && (
          <div className="px-4 py-3 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs font-medium animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{passErrorMsg}</span>
          </div>
        )}

        {showPasswordSection && (
          <form onSubmit={handleChangePassword} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3.5 animate-in fade-in duration-200">
            <div className="space-y-3.5">
              {/* Mật khẩu hiện tại */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">Mật khẩu hiện tại *</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white text-slate-900 font-medium py-2 pl-3 pr-9 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition-all text-xs outline-none"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1"
                  >
                    {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Mật khẩu mới & Xác nhận */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">Mật khẩu mới *</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white text-slate-900 font-medium py-2 pl-3 pr-9 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition-all text-xs outline-none"
                      placeholder="Ít nhất 8 ký tự"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">Xác nhận mật khẩu mới *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white text-slate-900 font-medium py-2 pl-3 pr-9 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 transition-all text-xs outline-none"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1"
                    >
                      {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isChangingPass}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isChangingPass ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Cập nhật mật khẩu</span>
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
