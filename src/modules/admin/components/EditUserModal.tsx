import React, { useState, useEffect } from 'react';
import { Edit3, X, Loader2, Save, AlertCircle, Upload, Shield, User, Phone, Mail } from 'lucide-react';
import { userService, type UserItemResponse, type UpdateProfileData } from '../../../services/user/user.service';
import { getAvatarUrl } from '../../../services/api';

interface EditUserModalProps {
  user: UserItemResponse | null;
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

const AVAILABLE_ROLES = [
  { value: 'PATIENT', label: 'Bệnh nhân (PATIENT)', desc: 'Đặt lịch, xem hồ sơ bệnh án cá nhân' },
  { value: 'DOCTOR', label: 'Bác sĩ (DOCTOR)', desc: 'Khám bệnh, chẩn đoán ICD-10, kê đơn thuốc' },
  { value: 'NURSE', label: 'Điều dưỡng (NURSE)', desc: 'Đo sinh hiệu, phân luồng hàng đợi khám' },
  { value: 'RECEPTION', label: 'Lễ tân / Thu ngân (RECEPTION)', desc: 'Tiếp đón tại quầy, cấp số thứ tự, thu phí' },
  { value: 'LAB', label: 'Kỹ thuật viên Lab (LAB)', desc: 'Quản lý xét nghiệm & ảnh DICOM' },
  { value: 'ADMIN', label: 'Quản trị hệ thống (ADMIN)', desc: 'Toàn quyền cấu hình và quản trị' },
];

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [actorRole, setActorRole] = useState<string>('PATIENT');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
      setActorRole(user.actorRole || 'PATIENT');
      setAvatarFile(null);
      setAvatarPreview(user.avatarUrl ? getAvatarUrl(user.avatarUrl) : null);
      setFormError(null);
    }
  }, [user]);

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên tài khoản');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload: UpdateProfileData = {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        actorRole: actorRole,
        avatarFile: avatarFile || undefined,
      };

      await userService.updateUserById(user.userId, payload);
      onSuccess(`Đã cập nhật thành công tài khoản ${fullName.trim()}!`);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Cập nhật tài khoản thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100/80 text-blue-700">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Chỉnh Sửa Tài Khoản Người Dùng</h3>
              <p className="text-xs text-slate-500">
                Cập nhật thông tin profile và vai trò hệ thống cho user
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-5 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* User Basic Info Header (Readonly) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xl">
                  {fullName ? fullName.charAt(0).toUpperCase() : <User className="w-8 h-8 text-slate-400" />}
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 p-1 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-xs">
                <Upload className="w-3 h-3" />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold text-slate-900 truncate">ID: {user.userId}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-800">{user.email}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Tạo lúc: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>

          {/* Edit Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên người dùng <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Ví dụ: 0901 234 567"
                  className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vai trò đăng nhập hệ thống (Actor Role) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={actorRole}
                  onChange={(e) => setActorRole(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <Shield className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {AVAILABLE_ROLES.find((r) => r.value === actorRole)?.desc}
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border-none cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm border-none cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Cập Nhật</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
