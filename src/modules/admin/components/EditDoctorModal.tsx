import React, { useState, useEffect } from 'react';
import { Edit3, X, Loader2, Save, AlertCircle } from 'lucide-react';
import { doctorService, type DoctorResponse, type CreateDoctorData } from '../../../services/doctor/doctor.service';

interface EditDoctorModalProps {
  doctor: DoctorResponse | null;
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

export const EditDoctorModal: React.FC<EditDoctorModalProps> = ({
  doctor,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateDoctorData>({
    fullName: '',
    title: '',
    licenseNumber: '',
    specialization: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (doctor) {
      setFormData({
        fullName: doctor.fullName,
        title: doctor.title || '',
        licenseNumber: doctor.licenseNumber || '',
        specialization: doctor.specialization || '',
        isActive: doctor.isActive,
      });
      setFormError(null);
    }
  }, [doctor]);

  if (!doctor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên bác sĩ');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await doctorService.updateDoctor(doctor.doctorId, formData);
      onSuccess(`Đã cập nhật thành công thông tin bác sĩ ${formData.fullName}!`);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Cập nhật bác sĩ thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-600" />
            <span>Chỉnh Sửa Thông Tin Bác Sĩ ({doctor.doctorCode})</span>
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
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold">Số Giấy phép hành nghề (License Number)</label>
            <input
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 accent-blue-900 rounded cursor-pointer"
            />
            <label htmlFor="editIsActive" className="text-slate-800 font-bold cursor-pointer">
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
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Cập Nhật Bác Sĩ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
