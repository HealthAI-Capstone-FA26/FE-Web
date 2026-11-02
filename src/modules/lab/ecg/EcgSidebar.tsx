import React from 'react';
import { Check, Plus, Trash2, Layers } from 'lucide-react';
import type { EcgAnomalyEvent, EcgRecording, EcgRecordingType } from '../../../types/ecg';
import { STANDARD_12_LEADS } from '../../../types/ecg';

export type EcgViewMode = 'live' | 'anomaly' | 'review';

interface EcgSidebarProps {
  viewMode: EcgViewMode;
  onChangeViewMode: (mode: EcgViewMode) => void;
  recordings: EcgRecording[];
  selectedRecordingId: string | null;
  onSelectRecording: (id: string) => void;
  availableLeads: string[];
  selectedLeads: string[];
  multiLead: boolean;
  onToggleMultiLead: () => void;
  onToggleLead: (lead: string) => void;
  onSelectAll12Leads: () => void;
  anomalies: EcgAnomalyEvent[];
  canUpload: boolean;
  onOpenUpload: () => void;
  onCancelRecording?: (id: string) => void;
}

const RECORDING_TYPE_LABEL: Record<EcgRecordingType, string> = {
  resting_12_lead: '12 đạo trình nghỉ',
  continuous_monitoring: 'Theo dõi liên tục',
  holter: 'Holter 24h',
  rhythm_strip: 'Dải nhịp (Lead II)',
};

export const EcgSidebar: React.FC<EcgSidebarProps> = ({
  viewMode,
  onChangeViewMode,
  recordings,
  selectedRecordingId,
  onSelectRecording,
  availableLeads,
  selectedLeads,
  multiLead,
  onToggleMultiLead,
  onToggleLead,
  onSelectAll12Leads,
  anomalies,
  canUpload,
  onOpenUpload,
  onCancelRecording,
}) => {
  const affectedSet = React.useMemo(() => {
    const s = new Set<string>();
    for (const ev of anomalies) {
      if (ev.reviewVerdict !== 'false_positive') {
        for (const l of ev.affectedLeads) s.add(l);
      }
    }
    return s;
  }, [anomalies]);

  const leadsToRender = availableLeads.length > 0 ? availableLeads : STANDARD_12_LEADS;

  return (
    <aside className="w-full xl:w-[240px] shrink-0 space-y-5">
      {/* NHÓM 1: VIEW MODE (giống "TASK" trong ảnh mẫu) */}
      <div className="glass-card !rounded-[18px] p-3.5 space-y-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Chế độ hiển thị
        </div>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100/90 border border-slate-200/70">
          {(
            [
              { id: 'live', label: 'Live' },
              { id: 'anomaly', label: 'AI Anomaly' },
              { id: 'review', label: 'Review' },
            ] as const
          ).map((item) => {
            const active = viewMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeViewMode(item.id)}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer truncate ${
                  active
                    ? 'bg-white text-blue-600 border border-[#3B82F6] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 border border-transparent'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* NHÓM 2: RECORDINGS (giống "SELECT DATASET" trong ảnh mẫu) */}
      <div className="glass-card !rounded-[18px] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Bản ghi ECG ({recordings.length})
          </span>
          {canUpload && (
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3" />
              <span>Tải lên</span>
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-0.5">
          {recordings.length === 0 ? (
            <div className="py-5 text-center text-xs text-slate-400">Chưa có bản ghi nào</div>
          ) : (
            recordings.map((rec, idx) => {
              const isSelected = rec.id === selectedRecordingId;
              const aStatus = rec.latestAnalysis?.status;
              const dotClass =
                rec.status === 'failed' || aStatus === 'failed'
                  ? 'bg-red-500'
                  : rec.status === 'analyzing' || aStatus === 'queued' || aStatus === 'running'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-emerald-500';
              const timeStr = new Date(rec.startedAt ?? rec.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={rec.id}
                  onClick={() => onSelectRecording(rec.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectRecording(rec.id);
                    }
                  }}
                  className={`group relative flex items-center justify-between gap-2 p-2.5 rounded-xl transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/95 border-[1.5px] border-[#3B82F6] shadow-2xs'
                      : 'bg-white/80 hover:bg-slate-50 border border-slate-200/80'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                      <span
                        className={`text-xs font-semibold truncate ${
                          isSelected ? 'text-blue-950' : 'text-slate-800'
                        }`}
                      >
                        {rec.fileName ?? `Bản ghi #${idx + 1}`}
                      </span>
                    </div>
                    <div className="mt-0.5 pl-3.5 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span>{RECORDING_TYPE_LABEL[rec.recordingType]}</span>
                      <span>·</span>
                      <span className="tabular-nums">{timeStr}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {canUpload && onCancelRecording && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelRecording(rec.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Huỷ bản ghi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* NHÓM 3: LEADS (12 Đạo trình) */}
      <div className="glass-card !rounded-[18px] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Đạo trình (Leads)
          </span>
          <button
            type="button"
            onClick={onToggleMultiLead}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition cursor-pointer ${
              multiLead
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700'
            }`}
            title="Chọn nhiều đạo trình để xếp chồng"
          >
            <Layers className="w-3 h-3" />
            <span>{multiLead ? 'Đa dải' : '1 dải'}</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {leadsToRender.map((lead) => {
            const active = selectedLeads.includes(lead);
            const hasAnomaly = affectedSet.has(lead);
            return (
              <button
                key={lead}
                type="button"
                onClick={() => onToggleLead(lead)}
                className={`relative py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                }`}
              >
                <span>{lead}</span>
                {hasAnomaly && (
                  <span
                    className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                      active ? 'bg-amber-300' : 'bg-red-500'
                    }`}
                    title={`Đạo trình ${lead} có sự kiện bất thường`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {leadsToRender.length >= 6 && (
          <button
            type="button"
            onClick={onSelectAll12Leads}
            className="w-full py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:text-blue-700 bg-slate-100/80 hover:bg-blue-50/70 border border-slate-200/80 transition cursor-pointer"
          >
            Xem đủ 12 đạo trình
          </button>
        )}
      </div>
    </aside>
  );
};

