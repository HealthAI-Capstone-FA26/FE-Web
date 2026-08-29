import React from 'react';
import { Users, Activity, Sparkles, ShieldCheck } from 'lucide-react';

export const AdminRealtimeMonitorView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Giám Sát Real-time 7 Bước
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Theo dõi thời gian thực tiến trình bệnh nhân, thời gian chờ trung bình và vận hành hệ thống.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-bold flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Realtime</span>
        </div>
      </div>

      {/* Realtime 7-Step Workflow Monitor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Step 1 & 3 Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            <span>BƯỚC 1 & 3: CHECK-IN</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">18 Bệnh nhân</div>
          <div className="text-[11px] text-emerald-600 font-bold">
            TG chờ trung bình: 6.5 phút
          </div>
        </div>

        {/* Step 4 Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            <span>BƯỚC 4: SINH HIỆU</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">12 Bệnh nhân</div>
          <div className="text-[11px] text-emerald-600 font-bold">
            TG chờ trung bình: 4.2 phút
          </div>
        </div>

        {/* Step 7 Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            <span>BƯỚC 7: XÉT NGHIỆM LAB</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">09 Ca chỉ định</div>
          <div className="text-[11px] text-purple-600 font-bold">
            AI Processing Avg: 1.8 phút
          </div>
        </div>

        {/* Step 9 Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            <span>BƯỚC 9: HOÀN TẤT HSBA</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">45 Ca hoàn thành</div>
          <div className="text-[11px] text-emerald-600 font-bold">
            Tỷ lệ xuất PDF thành công: 100%
          </div>
        </div>
      </div>
    </div>
  );
};
