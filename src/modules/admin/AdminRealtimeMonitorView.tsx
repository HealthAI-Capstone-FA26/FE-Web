import React from 'react';
import { Users, Activity, Sparkles, ShieldCheck } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const AdminRealtimeMonitorView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Giám Sát Real-time 7 Bước
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi thời gian thực tiến trình bệnh nhân, thời gian chờ trung bình và vận hành hệ thống.
          </p>
        </div>
        <Badge variant="ai" size="sm">
          Realtime
        </Badge>
      </div>

      {/* Realtime 7-Step Workflow Monitor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
            <span>Bước 1 & 3: Check-in</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">18 Bệnh nhân</div>
          <span className="text-[11px] text-emerald-600 font-bold">TG chờ trung bình: 6.5 phút</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
            <span>Bước 4: Sinh hiệu</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">12 Bệnh nhân</div>
          <span className="text-[11px] text-emerald-600 font-bold">TG chờ trung bình: 4.2 phút</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
            <span>Bước 7: Xét nghiệm Lab</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">09 Ca chỉ định</div>
          <span className="text-[11px] text-purple-600 font-bold">AI Processing Avg: 1.8 phút</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
            <span>Bước 9: Hoàn tất HSBA</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">45 Ca hoàn thành</div>
          <span className="text-[11px] text-emerald-600 font-bold">Tỷ lệ xuất PDF thành công: 100%</span>
        </div>
      </div>
    </div>
  );
};
