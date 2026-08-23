import React, { useState } from 'react';
import { User, Mail, Phone, ShieldCheck, AlertTriangle, UserPlus, Calendar, CheckCircle2, ArrowRight, Edit, Save, X, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/user/user.service';
import { Badge } from '../../components/common/Badge';

interface AccountInfoViewProps {
  onNavigateToProfile?: () => void;
  onNavigateToBooking?: () => void;
}

export const AccountInfoView: React.FC<AccountInfoViewProps> = ({
  onNavigateToProfile,
  onNavigateToBooking
}) => {
  const { user, updateUserProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const initialAvatar = user?.avatar && !user.avatar.includes('unsplash.com') ? user.avatar : null;
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatar);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // State simulating whether this account has an attached patient medical record
  const [hasRegisteredPatientRecord, setHasRegisteredPatientRecord] = useState(false);

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
      setSuccessMessage('Cập nhật thông tin profile thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Cập nhật profile thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-700" />
            <span>Thông Tin Tài Khoản Đăng Nhập</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý tài khoản truy cập trực tuyến và kiểm tra trạng thái liên kết hồ sơ khám bệnh tại Bệnh viện 4AM.
          </p>
        </div>
        <Badge variant="normal" size="sm">
          Account Status: Active
        </Badge>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-bold">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Account Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={user?.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-xs shrink-0">
                <User className="w-10 h-10 text-slate-400" />
              </div>
            )}

            {isEditing && (
              <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg font-black text-slate-900">{user?.name}</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Tài khoản Online đã xác thực
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
            <p className="text-xs text-slate-600 font-bold">Số điện thoại: {user?.phone || 'Chưa cập nhật'}</p>
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
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Chỉnh sửa Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hủy</span>
              </button>
            )}
          </div>
        </div>

        {/* Edit Form or Read-only Display */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
              Cập Nhật Thông Tin Cá Nhân
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f]"
                  placeholder="Nhập họ và tên đầy đủ"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Số điện thoại liên hệ</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border text-xs outline-none border-slate-200 focus:border-[#0b3c8f]"
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm border-none cursor-pointer"
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
        ) : null}

        {/* Status Box: Registered Patient Medical Record vs New Online Account */}
        {!hasRegisteredPatientRecord ? (
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-amber-950">
                  Tài khoản chưa đăng ký Hồ sơ Bệnh nhân (Mã BN) tại Bệnh viện 4AM
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Bạn hiện mới tạo **Tài khoản Đăng nhập trực tuyến**. Để có thể đặt lịch khám trực tuyến, theo dõi tiền sử y tế, nhận đơn thuốc và xem kết quả xét nghiệm, bạn cần cập nhật **Profile Bệnh nhân** chính thức.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setHasRegisteredPatientRecord(true);
                  if (onNavigateToProfile) onNavigateToProfile();
                }}
                className="px-4 py-2.5 bg-blue-600 text-white text-xs font-extrabold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm border-none cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tạo Profile Bệnh Nhân Ngay</span>
              </button>

              <button
                type="button"
                onClick={onNavigateToBooking}
                className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-extrabold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm border-none cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Đăng Ký Đặt Lịch Khám</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-extrabold text-emerald-950">
                  Đã liên kết Hồ sơ Bệnh nhân thành công
                </h4>
              </div>
              <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-lg">
                Mã BN: BN-2026-088
              </span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              Tài khoản của bạn đã được kết nối với Hồ sơ Bệnh án điện tử chính thức. Bạn có thể tra cứu đơn thuốc, tiền sử bệnh và kết quả cận lâm sàng HL7 FHIR bất cứ lúc nào.
            </p>
          </div>
        )}

        {/* Account Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email liên hệ đăng nhập</div>
            <div className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{user?.email}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số điện thoại xác thực</div>
            <div className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{user?.phone || 'Chưa cập nhật'}</span>
            </div>
          </div>
        </div>

        {/* Quick Demo Switch State Button */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => setHasRegisteredPatientRecord(!hasRegisteredPatientRecord)}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-1 cursor-pointer"
          >
            <span>[Demo Mẫu] Chuyển đổi trạng thái: {hasRegisteredPatientRecord ? 'Đã có Hồ sơ BN' : 'Chưa có Hồ sơ BN'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
