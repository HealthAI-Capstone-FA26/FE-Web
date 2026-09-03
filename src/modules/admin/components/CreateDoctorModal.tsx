import React, { useState } from 'react';
import { Plus, X, Loader2, Save, AlertCircle, Mail, Lock, Phone } from 'lucide-react';
import { doctorService, type CreateDoctorData, type DepartmentResponse } from '../../../services/doctor/doctor.service';

interface CreateDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: DepartmentResponse[];
  onSuccess: (message?: string) => void;
}

export const CreateDoctorModal: React.FC<CreateDoctorModalProps> = ({
  isOpen,
  onClose,
  departments,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateDoctorData>({
    fullName: '',
    title: 'ThS.BS',
    licenseNumber: '',
    specialization: 'Tim mạch',
    email: '',
    password: '',
    phoneNumber: '',
    isActive: true,
  });
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên bác sĩ');
      return;
    }

    if (formData.email?.trim() && (!formData.password || formData.password.length < 8)) {
      setFormError('Khi nhập Email tạo tài khoản Bác sĩ, Mật khẩu là bắt buộc và phải có ít nhất 8 ký tự');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: CreateDoctorData = {
      fullName: formData.fullName.trim(),
      title: formData.title?.trim() || undefined,
      licenseNumber: formData.licenseNumber?.trim() || undefined,
      specialization: formData.specialization?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      password: formData.email?.trim() ? formData.password : undefined,
      phoneNumber: formData.phoneNumber?.trim() || undefined,
      isActive: formData.isActive,
    };

    try {
      const createdDoctor = await doctorService.createDoctor(payload);
      let assignedDeptName = '';
      if (selectedDepartmentId && createdDoctor?.doctorId) {
        const dept = departments.find((d) => d.departmentId === selectedDepartmentId);
        if (dept) assignedDeptName = dept.departmentName;
        await doctorService.assignDoctorDepartment(createdDoctor.doctorId, {
          departmentId: selectedDepartmentId,
          isPrimary: true,
        });
      }
      const successMsg = assignedDeptName
        ? `Đã tạo thành công bác sĩ ${createdDoctor.fullName} và gán vào ${assignedDeptName}!`
        : `Đã tạo thành công bác sĩ ${createdDoctor.fullName}!`;
      onSuccess(successMsg);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Tạo bác sĩ thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-700" />
            <span>Thêm Bác Sĩ Mới</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold">Họ và Tên bác sĩ (*)</label>
            <input
              type="text"
              placeholder="Ví dụ: Nguyễn Thị B"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">Chức danh học vị</label>
              <select
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
              >
                <option value="BS">BS. (Bác sĩ)</option>
                <option value="ThS.BS">ThS.BS (Thạc sĩ Bác sĩ)</option>
                <option value="BS.CKI">BS.CKI (Chuyên khoa I)</option>
                <option value="BS.CKII">BS.CKII (Chuyên khoa II)</option>
                <option value="TS.BS">TS.BS (Tiến sĩ Bác sĩ)</option>
                <option value="PGS.TS.BS">PGS.TS.BS (Phó Giáo sư)</option>
                <option value="GS.TS.BS">GS.TS.BS (Giáo sư)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">Chuyên khoa</label>
              <input
                type="text"
                placeholder="Ví dụ: Tim mạch, Nhi..."
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">Số Giấy phép hành nghề </label>
              <input
                type="text"
                placeholder="Ví dụ: VN-HN-001234"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">Số điện thoại liên hệ</label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="Ví dụ: 0901234567"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Account Creation Section */}
          <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
            <div className="text-xs font-black text-blue-950 flex items-center justify-between">
              <span>Tạo tài khoản đăng nhập Bác sĩ chính thức</span>
              <span className="text-[10px] text-slate-500 font-normal">(Bỏ trống nếu là Bác sĩ thỉnh giảng)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Email đăng nhập</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="bs.b@hospital.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-700 transition-all font-semibold"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Mật khẩu tài khoản</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Ít nhất 8 ký tự"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-white text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-700 transition-all font-semibold"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold flex items-center justify-between">
              <span>Khoa / Phòng ban trực thuộc</span>
              <span className="text-[10px] text-blue-600 font-medium"></span>
            </label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
            >
              <option value="">-- Chọn Khoa / Phòng ban (Không bắt buộc) --</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentName} ({dept.departmentCode}) - {dept.roomLocation || 'Chưa xếp phòng'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="createIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 accent-blue-900 rounded cursor-pointer"
            />
            <label htmlFor="createIsActive" className="text-slate-800 font-bold cursor-pointer">
              Trạng thái hoạt động (Kích hoạt bác sĩ)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Tạo Bác Sĩ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
