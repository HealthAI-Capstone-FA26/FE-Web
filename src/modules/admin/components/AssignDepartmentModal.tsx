import React, { useState, useEffect } from 'react';
import { Building2, X, Loader2, Save, AlertCircle } from 'lucide-react';
import { doctorService, type DoctorResponse, type DepartmentResponse } from '../../../services/doctor/doctor.service';

interface AssignDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: DoctorResponse[];
  departments: DepartmentResponse[];
  defaultDoctorId?: string;
  defaultDepartmentId?: string;
  onSuccess: (message?: string) => void;
}

export const AssignDepartmentModal: React.FC<AssignDepartmentModalProps> = ({
  isOpen,
  onClose,
  doctors,
  departments,
  defaultDoctorId = '',
  defaultDepartmentId = '',
  onSuccess,
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(defaultDoctorId);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(defaultDepartmentId);
  const [isPrimary, setIsPrimary] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDoctorId(defaultDoctorId);
      setSelectedDepartmentId(defaultDepartmentId);
      setIsPrimary(true);
      setFormError(null);
    }
  }, [isOpen, defaultDoctorId, defaultDepartmentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setFormError('Vui lòng chọn Bác sĩ');
      return;
    }
    if (!selectedDepartmentId) {
      setFormError('Vui lòng chọn Khoa / Phòng ban');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await doctorService.assignDoctorDepartment(selectedDoctorId, {
        departmentId: selectedDepartmentId,
        isPrimary,
      });
      const doc = doctors.find((d) => d.doctorId === selectedDoctorId);
      const dept = departments.find((d) => d.departmentId === selectedDepartmentId);
      const docName = doc ? doc.fullName : 'Bác sĩ';
      const deptName = dept ? dept.departmentName : 'Khoa';
      onSuccess(`Đã phân công bác sĩ ${docName} vào ${deptName} thành công!`);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Gán bác sĩ vào khoa thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-700" />
            <span>Phân Công Bác Sĩ</span>
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
            <label className="block text-slate-700 font-bold">Chọn Bác Sĩ (*)</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
              required
            >
              <option value="">-- Chọn Bác Sĩ --</option>
              {doctors.map((doc) => (
                <option key={doc.doctorId} value={doc.doctorId}>
                  [{doc.doctorCode}] {doc.title ? `${doc.title} ` : ''}{doc.fullName} {doc.specialization ? `(${doc.specialization})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold">Chọn Khoa / Phòng ban (*)</label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
              required
            >
              <option value="">-- Chọn Khoa / Phòng ban --</option>
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
              id="assignIsPrimary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 accent-blue-900 rounded cursor-pointer"
            />
            <label htmlFor="assignIsPrimary" className="text-slate-800 font-bold cursor-pointer">
              Đặt làm Khoa chính (Primary Department)
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
              <span>Xác Nhận Phân Công</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
