import React from 'react';
import { Eye, X } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import type { DoctorResponse } from '../../../services/doctor/doctor.service';

interface DetailDoctorModalProps {
  doctor: DoctorResponse | null;
  onClose: () => void;
}

export const DetailDoctorModal: React.FC<DetailDoctorModalProps> = ({ doctor, onClose }) => {
  if (!doctor) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-700" />
            <span>Chi Tiết Bác Sĩ</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-blue-950 text-sm">{doctor.doctorCode}</span>
              {doctor.isActive ? (
                <Badge variant="normal" size="sm">Đang hoạt động</Badge>
              ) : (
                <Badge variant="warning" size="sm">Tạm ngưng</Badge>
              )}
            </div>
            <div className="text-base font-black text-slate-900">
              {doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-700">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Chuyên Khoa</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{doctor.specialization || 'Chưa cập nhật'}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Giấy Phép Hành Nghề</span>
              <span className="font-mono font-bold text-emerald-700 mt-0.5 block">
                {doctor.licenseNumber || 'Chưa có'}
              </span>
            </div>
          </div>

          {doctor.doctorDepartments && doctor.doctorDepartments.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-extrabold text-slate-800 block">Các khoa trực thuộc:</span>
              <div className="space-y-1">
                {doctor.doctorDepartments.map((rel) => (
                  <div
                    key={rel.departmentId}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between"
                  >
                    <span className="font-bold text-slate-800">
                      {rel.department?.departmentName} ({rel.department?.departmentCode})
                    </span>
                    {rel.isPrimary && <Badge variant="info" size="sm">Khoa chính</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
