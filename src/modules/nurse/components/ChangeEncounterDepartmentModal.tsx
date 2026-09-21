import React, { useState, useEffect } from 'react';
import {
  Building2,
  GitFork,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Stethoscope,
  X,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import {
  staffDepartmentService,
  type DepartmentItem,
} from '../../../services/staff-department/staff-department.service';
import { encounterService } from '../../../services/encounter/encounter.service';

interface ChangeEncounterDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  encounterId: string | null;
  patientName?: string;
  currentDepartmentName?: string;
  currentDepartmentId?: string;
  onSuccess?: (message: string) => void;
}

export const ChangeEncounterDepartmentModal: React.FC<ChangeEncounterDepartmentModalProps> = ({
  isOpen,
  onClose,
  encounterId,
  patientName,
  currentDepartmentName,
  currentDepartmentId,
  onSuccess,
}) => {
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [isLoadingDepts, setIsLoadingDepts] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingDepts(true);
      setError(null);
      setResult(null);
      setSelectedDeptId('');

      staffDepartmentService
        .getAllDepartments()
        .then((depts) => {
          // Lọc các khoa active và khác khoa hiện tại
          const activeDepts = depts.filter(
            (d) => d.status !== 'inactive' && d.departmentId !== currentDepartmentId
          );
          setDepartments(activeDepts);
        })
        .catch((err) => {
          console.warn('Lỗi khi tải danh sách khoa:', err);
          setError('Không thể tải danh sách các khoa khám bệnh.');
        })
        .finally(() => setIsLoadingDepts(false));
    }
  }, [isOpen, currentDepartmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encounterId || !selectedDeptId) {
      setError('Vui lòng chọn khoa khám cần chuyển tới');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await encounterService.changeEncounterDepartment(encounterId, selectedDeptId);
      setResult(res);

      const doctorName = res.current?.doctor?.fullName || 'Bác sĩ chuyên khoa';
      const newDeptName = res.current?.departmentName || 'Khoa mới';
      const msg = `Đã chuyển bệnh nhân sang "${newDeptName}" và tự động phân công cho ${doctorName}!`;

      if (onSuccess) {
        onSuccess(msg);
      }
    } catch (err: any) {
      console.error('Lỗi khi đổi khoa khám:', err);
      setError(err?.message || 'Không thể chuyển khoa khám cho bệnh nhân.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDepartmentObj = departments.find((d) => d.departmentId === selectedDeptId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Điều Chuyển Khoa Khám Bệnh</h3>
            <p className="text-xs text-slate-500 font-normal">
              Bệnh nhân: <strong className="text-slate-800">{patientName || '---'}</strong>
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none transition-colors"
          >
            {result ? 'Đóng' : 'Hủy bỏ'}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedDeptId}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xếp bác sĩ...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Xác Nhận Đổi Khoa & Phân Bác Sĩ</span>
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Kết quả sau khi đổi khoa thành công */}
        {result ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Điều chuyển khoa & Phân công bác sĩ thành công!</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-200/60 space-y-2 text-slate-700">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Khoa công tác mới:</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  {result.current?.departmentName}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Bác sĩ được phân công:</span>
                <span className="font-bold text-blue-700 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                  {result.current?.doctor?.title ? `${result.current.doctor.title} ` : ''}
                  {result.current?.doctor?.fullName}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Số STT trong hàng đợi bác sĩ:</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  #{result.queueEntry?.queueOrder || '---'}
                </span>
              </div>

              {result.assignment && (
                <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                  <span>Chiến lược cân bằng tải:</span>
                  <span className="font-medium text-slate-600">
                    Tải bác sĩ trước gán: <strong>{result.assignment.queueLoadBefore} ca</strong>
                    {result.assignment.tiedCandidates > 1 && (
                      <span className="ml-1 text-blue-600">(Hòa {result.assignment.tiedCandidates} BS - Chọn ngẫu nhiên)</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl font-bold border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Thông tin Khoa hiện tại */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Khoa hiện tại của ca khám:</span>
              <span className="font-bold text-slate-800 bg-slate-200 px-2.5 py-1 rounded-lg">
                {currentDepartmentName || 'Chưa phân khoa'}
              </span>
            </div>

            {/* Chọn Khoa mới */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Chọn Khoa Khám Mới Muốn Chuyển Tới <span className="text-rose-500">*</span>
              </label>

              {isLoadingDepts ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Đang tải danh sách các khoa...</span>
                </div>
              ) : (
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                >
                  <option value="">-- Chọn khoa khám cần chuyển --</option>
                  {departments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.departmentName} [{d.departmentCode}]
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Chú thích thông minh */}
            <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl space-y-1 text-slate-700">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Thuật toán Tự Động Phân Bổ Bác Sĩ (Least-Loaded):</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Sau khi xác nhận đổi khoa, hệ thống sẽ tự động tìm các Bác sĩ <strong>đang trong ca trực</strong> của khoa mới và tự chọn bác sĩ có <strong>số ca chờ ít nhất</strong> để phân công, giúp cân bằng tải công việc và giảm thời gian chờ của bệnh nhân.
              </p>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
