import React from 'react';
import { RefreshCw, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Mascot } from 'page-mascot';
import { Badge } from '../../../components/common/Badge';

interface NurseStatsHeaderProps {
  totalCount: number;
  pendingCount: number;
  measuredCount: number;
  abnormalCount: number;
  isLoading: boolean;
  onRefresh: () => void;
}

export const NurseStatsHeader: React.FC<NurseStatsHeaderProps> = ({
  totalCount,
  pendingCount,
  measuredCount,
  abnormalCount,
  isLoading,
  onRefresh,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <Mascot
            directions="/mascots/nurse-directions.webp"
            reactions="/mascots/nurse-reactions.webp"
            size={120}
            className="shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-slate-900">
                Trạm Điều Dưỡng — Tiếp Nhận & Đo Sinh Hiệu
              </h2>
              <Badge variant="warning" size="sm">
                Mô-đun 4
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Bệnh nhân sau khi được Lễ tân tiếp nhận sẽ hiển thị tại trạm đo sinh hiệu (Huyết áp, Mạch, Nhiệt độ, SpO2, Chiều cao, Cân nặng, BMI) trước khi chuyển vào khám Bác sĩ.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* 4 Thẻ Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tổng ca tiếp nhận</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Chờ đo sinh hiệu</span>
            <div className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Đã hoàn tất đo</span>
            <div className="text-2xl font-black text-emerald-900 mt-1">{measuredCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Cảnh báo bất thường</span>
            <div className="text-2xl font-black text-rose-900 mt-1">{abnormalCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
