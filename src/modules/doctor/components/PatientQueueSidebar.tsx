import React, { useState, useMemo } from 'react';
import { User, Loader2, Clock, Search, X } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'in_progress' | 'awaiting_review' | 'finished'>('all');
  const patientList = Object.values(patients);

  // Thống kê số lượng theo từng nhóm trạng thái
  const counts = useMemo(() => {
    return {
      all: patientList.length,
      waiting: patientList.filter(p => !p.status || p.status === 'waiting_for_doctor' || p.status === 'arrived' || p.status === 'pending').length,
      in_progress: patientList.filter(p => p.status === 'in_progress' || p.status === 'awaiting_diagnostics' || p.status === 'diagnostics_in_progress').length,
      awaiting_review: patientList.filter(p => p.status === 'awaiting_review').length,
      finished: patientList.filter(p => p.status === 'finished' || p.status === 'completed').length,
    };
  }, [patientList]);

  const filteredPatients = useMemo(() => {
    let result = patientList;

    // Lọc theo Segmented Pills
    if (statusFilter === 'waiting') {
      result = result.filter(p => !p.status || p.status === 'waiting_for_doctor' || p.status === 'arrived' || p.status === 'pending');
    } else if (statusFilter === 'in_progress') {
      result = result.filter(p => p.status === 'in_progress' || p.status === 'awaiting_diagnostics' || p.status === 'diagnostics_in_progress');
    } else if (statusFilter === 'awaiting_review') {
      result = result.filter(p => p.status === 'awaiting_review');
    } else if (statusFilter === 'finished') {
      result = result.filter(p => p.status === 'finished' || p.status === 'completed');
    }

    const term = searchTerm.trim().toLowerCase();
    if (!term) return result;
    return result.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(term);
      const encCodeMatch = p.encounterCode?.toLowerCase().includes(term);
      const patCodeMatch = p.patientCode?.toLowerCase().includes(term);
      const phoneMatch = p.phone?.toLowerCase().includes(term);
      const idMatch = p.id?.toLowerCase().includes(term);
      return Boolean(nameMatch || encCodeMatch || patCodeMatch || phoneMatch || idMatch);
    });
  }, [patientList, statusFilter, searchTerm]);

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
          {searchTerm
            ? `${filteredPatients.length}/${patientList.length} Ca`
            : `${String(patientList.length).padStart(2, '0')} Ca khám`}
        </Badge>
      </div>

      {/* Ô tìm kiếm bệnh nhân nhanh */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm tên, mã LK, mã BN, SĐT..."
          className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-all cursor-pointer"
            title="Xóa tìm kiếm"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Bộ lọc nhanh trạng thái hàng chờ (Segmented Status Pills) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
        {[
          { key: 'all', label: 'Tất cả', count: counts.all },
          { key: 'waiting', label: 'Chờ khám', count: counts.waiting },
          { key: 'in_progress', label: 'Đang khám', count: counts.in_progress },
          { key: 'awaiting_review', label: 'Đã có KQ', count: counts.awaiting_review, highlight: true },
          { key: 'finished', label: 'Đã xong', count: counts.finished },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key as any)}
              className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border shrink-0 ${
                isActive
                  ? tab.highlight
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : tab.highlight && tab.count > 0
                  ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 font-black animate-pulse'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-slate-200/70 text-slate-700'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
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
        ) : filteredPatients.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-2">
            <Search className="w-5 h-5 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">Không tìm thấy ca khám nào</p>
            <p className="text-[11px] text-slate-400">
              Không có kết quả khớp với điều kiện lọc hiện tại
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="text-[11px] text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>
        ) : (
          filteredPatients.map((p) => {
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
                  {p.status === 'awaiting_review' ? (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-purple-600 text-white animate-pulse shadow-xs">
                      Đã có KQ CLS
                    </span>
                  ) : p.status === 'in_progress' ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                      Đang khám
                    </span>
                  ) : p.status === 'awaiting_diagnostics' || p.status === 'diagnostics_in_progress' ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-500 text-white">
                      Chờ CLS
                    </span>
                  ) : p.status === 'finished' || p.status === 'completed' ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      Đã xong
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      Chờ khám
                    </span>
                  )}
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
                  {workflowState === 'completed' && p.status !== 'awaiting_review' && (
                    <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                      Đã có KQ Lab
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

