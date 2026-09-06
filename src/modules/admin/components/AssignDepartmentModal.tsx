import React, { useState, useEffect } from 'react';
import {
  Building2,
  X,
  Loader2,
  Plus,
  AlertCircle,
  Star,
  Trash2,
  CheckCircle2,
  User,
  AlertTriangle,
} from 'lucide-react';
import {
  doctorService,
  encodeDoctorDepartmentId,
  type DoctorResponse,
  type DepartmentResponse,
  type DoctorDepartmentRelation,
} from '../../../services/doctor/doctor.service';

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
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Modal xác nhận gỡ khoa state
  const [deletingDept, setDeletingDept] = useState<{ departmentId: string; departmentName: string } | null>(null);

  // Local state for doctor's departments to update instantly on UI
  const [currentDoctorDepts, setCurrentDoctorDepts] = useState<DoctorDepartmentRelation[]>([]);

  // Sync state on open or defaultDoctorId change
  useEffect(() => {
    if (isOpen) {
      setSelectedDoctorId(defaultDoctorId);
      setSelectedDepartmentId(defaultDepartmentId);
      setIsPrimary(false);
      setFormError(null);
      setFormSuccess(null);
      setActionLoadingId(null);
      setDeletingDept(null);
    }
  }, [isOpen, defaultDoctorId, defaultDepartmentId]);

  // Load selected doctor's departments
  useEffect(() => {
    if (selectedDoctorId) {
      const doc = doctors.find((d) => d.doctorId === selectedDoctorId);
      if (doc && doc.doctorDepartments) {
        setCurrentDoctorDepts(doc.doctorDepartments);
      } else {
        // Fetch fresh details if not present
        doctorService
          .getDoctorById(selectedDoctorId)
          .then((freshDoc) => {
            setCurrentDoctorDepts(freshDoc.doctorDepartments || []);
          })
          .catch(() => setCurrentDoctorDepts([]));
      }
    } else {
      setCurrentDoctorDepts([]);
    }
  }, [selectedDoctorId, doctors]);

  if (!isOpen) return null;

  const selectedDoctor = doctors.find((d) => d.doctorId === selectedDoctorId);

  // Filter out departments that the doctor already belongs to for the add dropdown
  const availableDepartmentsToAdd = departments.filter(
    (dept) => !currentDoctorDepts.some((dd) => dd.departmentId === dept.departmentId)
  );

  // 1. Action: Đổi Khoa chính (PATCH /doctor-departments/:id)
  const handleSetPrimary = async (departmentId: string) => {
    if (!selectedDoctorId) return;
    const compositeId = encodeDoctorDepartmentId(selectedDoctorId, departmentId);
    setActionLoadingId(`primary_${departmentId}`);
    setFormError(null);
    setFormSuccess(null);

    try {
      await doctorService.updateDoctorDepartment(compositeId, true);

      // Cập nhật UI ngay lập tức
      setCurrentDoctorDepts((prev) =>
        prev.map((item) => ({
          ...item,
          isPrimary: item.departmentId === departmentId,
        }))
      );

      const dept = departments.find((d) => d.departmentId === departmentId);
      const msg = `Đã đổi "${dept?.departmentName || 'Khoa'}" thành Khoa chính của bác sĩ!`;
      setFormSuccess(msg);
      onSuccess(msg);
    } catch (err: any) {
      setFormError(err?.message || 'Không thể đổi khoa chính. Vui lòng thử lại.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Action: Xác nhận Gỡ bác sĩ khỏi khoa (DELETE /doctor-departments/:id)
  const handleConfirmDelete = async () => {
    if (!selectedDoctorId || !deletingDept) return;
    const { departmentId, departmentName } = deletingDept;

    const compositeId = encodeDoctorDepartmentId(selectedDoctorId, departmentId);
    setActionLoadingId(`remove_${departmentId}`);
    setFormError(null);
    setFormSuccess(null);

    try {
      await doctorService.removeDoctorDepartment(compositeId);

      // Cập nhật UI ngay lập tức
      setCurrentDoctorDepts((prev) => prev.filter((item) => item.departmentId !== departmentId));

      const msg = `Đã gỡ bác sĩ khỏi "${departmentName}" thành công!`;
      setFormSuccess(msg);
      onSuccess(msg);
      setDeletingDept(null);
    } catch (err: any) {
      setFormError(err?.message || 'Không thể gỡ bác sĩ khỏi khoa. Vui lòng thử lại.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Action: Thêm / Gán vào khoa mới (POST /doctors/:id/departments)
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setFormError('Vui lòng chọn Bác sĩ');
      return;
    }
    if (!selectedDepartmentId) {
      setFormError('Vui lòng chọn Khoa / Phòng ban cần thêm');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await doctorService.assignDoctorDepartment(selectedDoctorId, {
        departmentId: selectedDepartmentId,
        isPrimary: isPrimary || currentDoctorDepts.length === 0, // Nếu chưa có khoa nào thì tự thành khoa chính
      });

      const dept = departments.find((d) => d.departmentId === selectedDepartmentId);
      const newRelation: DoctorDepartmentRelation = {
        doctorId: selectedDoctorId,
        departmentId: selectedDepartmentId,
        isPrimary: isPrimary || currentDoctorDepts.length === 0,
        department: dept,
      };

      // Cập nhật lại danh sách khoa trên UI
      setCurrentDoctorDepts((prev) => {
        const updated = isPrimary
          ? prev.map((item) => ({ ...item, isPrimary: false }))
          : [...prev];
        return [...updated, newRelation];
      });

      setSelectedDepartmentId('');
      setIsPrimary(false);

      const msg = `Đã thêm bác sĩ vào khoa "${dept?.departmentName || 'Khoa'}" thành công!`;
      setFormSuccess(msg);
      onSuccess(msg);
    } catch (err: any) {
      setFormError(err?.message || 'Gán bác sĩ vào khoa thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-700" />
              <span>Phân Công & Quản Lý Khoa Phòng</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chỉ định khoa chính, kiêm nhiệm hoặc gỡ bác sĩ khỏi chuyên khoa
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        {/* Doctor Selection */}
        <div className="space-y-1.5">
          <label className="block text-slate-700 font-bold text-xs">Bác sĩ (*)</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => {
              setSelectedDoctorId(e.target.value);
              setFormError(null);
              setFormSuccess(null);
            }}
            className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-600 transition-all font-semibold text-xs cursor-pointer"
            required
          >
            <option value="">-- Chọn Bác Sĩ Cần Phân Công --</option>
            {doctors.map((doc) => (
              <option key={doc.doctorId} value={doc.doctorId}>
                [{doc.doctorCode}] {doc.title ? `${doc.title} ` : ''}{doc.fullName}{' '}
                {doc.specialization ? `— ${doc.specialization}` : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedDoctor && (
          <div className="space-y-4 pt-1">
            {/* Section 1: Current Doctor Departments List */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Khoa trực thuộc hiện tại ({currentDoctorDepts.length})</span>
                </span>
                <span className="text-[10px] text-slate-400 italic">
                  * Mỗi bác sĩ có 1 Khoa chính
                </span>
              </div>

              {currentDoctorDepts.length === 0 ? (
                <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  Bác sĩ chưa được phân công vào khoa phòng nào.
                </div>
              ) : (
                <div className="space-y-2">
                  {currentDoctorDepts.map((rel) => {
                    const dept =
                      rel.department || departments.find((d) => d.departmentId === rel.departmentId);
                    const isPrimaryDept = rel.isPrimary;
                    const isSettingPrimary =
                      actionLoadingId === `primary_${rel.departmentId}`;
                    const isRemoving = actionLoadingId === `remove_${rel.departmentId}`;

                    return (
                      <div
                        key={rel.departmentId}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isPrimaryDept
                            ? 'bg-blue-50/70 border-blue-200 text-blue-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs truncate">
                              {dept?.departmentName || 'Khoa'}
                            </span>
                            {isPrimaryDept ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-2xs">
                                <Star className="w-3 h-3 fill-current" />
                                Khoa chính
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">
                                Kiêm nhiệm
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Mã: {dept?.departmentCode || rel.departmentId}
                            {dept?.roomLocation ? ` • Vị trí: ${dept.roomLocation}` : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Button Đặt làm khoa chính */}
                          {!isPrimaryDept && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(rel.departmentId)}
                              disabled={actionLoadingId !== null}
                              className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Chuyển thành khoa công tác chính của bác sĩ"
                            >
                              {isSettingPrimary ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Star className="w-3 h-3" />
                              )}
                              <span>Đặt làm chính</span>
                            </button>
                          )}

                          {/* Button Gỡ khỏi khoa */}
                          <button
                            type="button"
                            onClick={() =>
                              setDeletingDept({
                                departmentId: rel.departmentId,
                                departmentName: dept?.departmentName || 'Khoa',
                              })
                            }
                            disabled={actionLoadingId !== null}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
                            title="Gỡ bác sĩ khỏi khoa này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 2: Form Thêm vào khoa mới */}
            <form onSubmit={handleAddDepartment} className="space-y-3 pt-1 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Thêm Bác Sĩ Vào Khoa Khác</span>
              </span>

              <div className="space-y-1.5">
                <label className="block text-slate-600 font-semibold text-xs">
                  Chọn Khoa / Chuyên khoa cần phân công
                </label>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-600 transition-all font-semibold text-xs cursor-pointer"
                  disabled={availableDepartmentsToAdd.length === 0}
                >
                  <option value="">
                    {availableDepartmentsToAdd.length === 0
                      ? '-- Bác sĩ đã ở tất cả các khoa --'
                      : '-- Chọn Khoa Phòng Cần Thêm --'}
                  </option>
                  {availableDepartmentsToAdd.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.departmentName} ({dept.departmentCode}){' '}
                      {dept.roomLocation ? `- ${dept.roomLocation}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {availableDepartmentsToAdd.length > 0 && (
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="assignIsPrimaryNew"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="assignIsPrimaryNew"
                    className="text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    Đặt làm Khoa chính (chuyển khoa chính hiện tại thành khoa kiêm nhiệm)
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedDepartmentId || actionLoadingId !== null}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Thêm Vào Khoa</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors border-none"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal (Nested Dialog) */}
      {deletingDept && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Gỡ Bác Sĩ Khỏi Khoa
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Bạn có chắc chắn muốn gỡ bác sĩ{' '}
                  <strong className="text-slate-800 font-bold">
                    {selectedDoctor?.fullName}
                  </strong>{' '}
                  khỏi{' '}
                  <strong className="text-rose-600 font-bold">
                    "{deletingDept.departmentName}"
                  </strong>{' '}
                  không?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
                disabled={actionLoadingId !== null}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors bg-white"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoadingId !== null}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 border-none disabled:opacity-50"
              >
                {actionLoadingId === `remove_${deletingDept.departmentId}` ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Xác Nhận Gỡ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
