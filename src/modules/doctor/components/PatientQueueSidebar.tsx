import React from 'react';
import { User, Loader2, Clock } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import type { PatientEMR, PatientWorkflowState } from '../types';

interface PatientQueueSidebarProps {
  patients: Record<string, PatientEMR>;
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  isLoading: boolean;
  patientWorkflowStates: Record<string, PatientWorkflowState>;
}

export const PatientQueueSidebar: React.FC<PatientQueueSidebarProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  isLoading,
  patientWorkflowStates,
}) => {
  const patientList = Object.values(patients);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">
          Hàng chờ Khám của Bác sĩ
        </h3>
        <Badge variant="info" size="sm">
          {String(patientList.length).padStart(2, '0')} Ca khám
        </Badge>
      </div>

      <div className="space-y-2.5">
        {isLoading ? (
          <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Đang tải danh sách hàng chờ...</span>
          </div>
        ) : patientList.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-1.5">
            <User className="w-6 h-6 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-500">Chưa có bệnh nhân trong hàng chờ</p>
            <p className="text-[10px]">Các ca khám tiếp nhận tại Lễ tân sẽ tự động hiển thị tại đây.</p>
          </div>
        ) : (
          patientList.map((p) => {
            const workflowState = patientWorkflowStates[p.id] || 'initial';
            const isSelected = selectedPatientId === p.id;
            const timeStr = formatTime(p.arrivedAt);

            return (
              <div
                key={p.id}
                onClick={() => onSelectPatient(p.id)}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex justify-between items-center ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300'
                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-slate-800">{p.name}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    {p.encounterCode ? (
                      <span className="text-blue-700 font-extrabold font-mono">{p.encounterCode}</span>
                    ) : (
                      <span className="text-blue-700 font-extrabold font-mono">{p.id}</span>
                    )}
                    {p.patientCode && <span className="text-slate-400 font-normal">({p.patientCode})</span>}
                  </div>
                  {timeStr && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Tiếp nhận: {timeStr}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      p.status === 'in_progress'
                        ? 'bg-emerald-600 text-white'
                        : isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {p.status === 'in_progress' || isSelected ? 'Đang khám' : 'Chờ vào'}
                  </span>
                  {workflowState === 'ordered' && (
                    <span className="text-[8px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                      Chờ đóng phí
                    </span>
                  )}
                  {workflowState === 'paid' && (
                    <span className="text-[8px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded border border-blue-200">
                      Đã đóng phí • Chờ Lab
                    </span>
                  )}
                  {workflowState === 'completed' && (
                    <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                      Đã có kết quả Lab
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
