import React from 'react';
import { Check, CheckCheck, Filter } from 'lucide-react';
import type {
  EcgAlertStatus,
  EcgAnomalyEvent,
  EcgAnomalyFilter,
  EcgReviewVerdict,
  EcgSeverity,
} from '../../../types/ecg';
import { formatTimeMs, getAnomalyLabel, SEVERITY_LABEL_VI, VERDICT_LABEL_VI } from './ecgMeta';

interface EcgEventsTableProps {
  events: EcgAnomalyEvent[];
  filter: EcgAnomalyFilter;
  onChangeFilter: (next: EcgAnomalyFilter) => void;
  selectedEventId: string | null;
  onSelectEvent: (event: EcgAnomalyEvent) => void;
  canAcknowledge: boolean;
  onAcknowledge: (event: EcgAnomalyEvent) => void;
  onResolve: (event: EcgAnomalyEvent) => void;
  busyEventId: string | null;
}

const ALERT_STATUS_LABEL: Record<EcgAlertStatus, { label: string; cls: string }> = {
  active: { label: 'Đang kích hoạt', cls: 'bg-red-50 text-red-700 border-red-200' },
  acknowledged: { label: 'Đã tiếp nhận', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolved: { label: 'Đã đóng', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  auto_dismissed: { label: 'Tự động bỏ qua', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const SEVERITY_BADGE: Record<EcgSeverity, string> = {
  low: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  high: 'bg-orange-50 text-orange-800 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200 font-semibold',
};

const VERDICT_BADGE: Record<EcgReviewVerdict, string> = {
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  true_positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  false_positive: 'bg-red-50 text-red-700 border-red-200',
  uncertain: 'bg-amber-50 text-amber-800 border-amber-200',
};

export const EcgEventsTable: React.FC<EcgEventsTableProps> = ({
  events,
  filter,
  onChangeFilter,
  selectedEventId,
  onSelectEvent,
  canAcknowledge,
  onAcknowledge,
  onResolve,
  busyEventId,
}) => {
  return (
    <section className="glass-card !rounded-[20px] p-4 space-y-3 flex flex-col">
      {/* Header + Filter chips */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-semibold text-slate-900">
            Danh sách sự kiện bất thường ({events.length})
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-0.5" />

          {/* Filter Trạng thái cảnh báo */}
          <select
            value={filter.alertStatus ?? ''}
            onChange={(e) =>
              onChangeFilter({
                ...filter,
                alertStatus: (e.target.value || undefined) as EcgAlertStatus | undefined,
              })
            }
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
          >
            <option value="">Mọi trạng thái</option>
            <option value="active">Đang kích hoạt</option>
            <option value="acknowledged">Đã tiếp nhận</option>
            <option value="resolved">Đã đóng</option>
            <option value="auto_dismissed">Tự động bỏ qua</option>
          </select>

          {/* Filter Mức độ */}
          <select
            value={filter.severity ?? ''}
            onChange={(e) =>
              onChangeFilter({
                ...filter,
                severity: (e.target.value || undefined) as EcgSeverity | undefined,
              })
            }
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
          >
            <option value="">Mọi mức độ</option>
            <option value="critical">Nguy cấp</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>

          {/* Filter Đánh giá của Bác sĩ */}
          <select
            value={filter.reviewVerdict ?? ''}
            onChange={(e) =>
              onChangeFilter({
                ...filter,
                reviewVerdict: (e.target.value || undefined) as EcgReviewVerdict | undefined,
              })
            }
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
          >
            <option value="">Mọi kết luận</option>
            <option value="pending">Chờ đánh giá</option>
            <option value="true_positive">AI đúng</option>
            <option value="false_positive">AI báo nhầm</option>
            <option value="uncertain">Chưa chắc</option>
          </select>

          {(filter.alertStatus || filter.severity || filter.reviewVerdict) && (
            <button
              type="button"
              onClick={() => onChangeFilter({})}
              className="px-2 py-1 rounded-full text-[11px] font-medium text-blue-600 hover:bg-blue-50 cursor-pointer"
            >
              Xoá lọc
            </button>
          )}
        </div>
      </div>

      {/* Bảng dữ liệu có thể điều hướng bằng bàn phím */}
      <div className="overflow-x-auto custom-scrollbar -mx-1 px-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 text-[11px] font-medium text-slate-500">
              <th className="py-2 px-2.5">Thời gian</th>
              <th className="py-2 px-2.5">Loại bất thường</th>
              <th className="py-2 px-2.5">Mức độ</th>
              <th className="py-2 px-2.5">Điểm AI</th>
              <th className="py-2 px-2.5">Đạo trình</th>
              <th className="py-2 px-2.5">HR</th>
              <th className="py-2 px-2.5">Cảnh báo</th>
              <th className="py-2 px-2.5">Đánh giá BS</th>
              {canAcknowledge && <th className="py-2 px-2.5 text-right">Hành động</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {events.length === 0 ? (
              <tr>
                <td colSpan={canAcknowledge ? 9 : 8} className="py-8 text-center text-slate-400">
                  Không có sự kiện bất thường nào khớp bộ lọc.
                </td>
              </tr>
            ) : (
              events.map((ev) => {
                const isSelected = ev.id === selectedEventId;
                const isActiveCritical = ev.alertStatus === 'active' && ev.severity === 'critical';
                const statusMeta = ALERT_STATUS_LABEL[ev.alertStatus];
                const isBusy = busyEventId === ev.id;

                return (
                  <tr
                    key={ev.id}
                    tabIndex={0}
                    onClick={() => onSelectEvent(ev)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectEvent(ev);
                      }
                    }}
                    className={`transition cursor-pointer ${
                      isSelected ? 'bg-blue-50/90' : 'hover:bg-slate-50/90'
                    } ${isActiveCritical ? 'border-l-[3px] border-l-red-600' : ''}`}
                  >
                    <td className="py-2.5 px-2.5 font-medium text-slate-800 tabular-nums whitespace-nowrap">
                      {formatTimeMs(ev.startOffsetMs)} – {formatTimeMs(ev.endOffsetMs)}
                    </td>

                    <td className="py-2.5 px-2.5 font-semibold text-slate-900">
                      {getAnomalyLabel(ev.anomalyType)}
                    </td>

                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] border ${SEVERITY_BADGE[ev.severity]}`}
                      >
                        {SEVERITY_LABEL_VI[ev.severity]}
                      </span>
                    </td>

                    <td className="py-2.5 px-2.5 tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 w-7">{ev.score.toFixed(2)}</span>
                        <div className="w-12 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-teal-600 rounded-full"
                            style={{ width: `${Math.min(100, Math.round(ev.score * 100))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-2.5 text-slate-600 font-medium">
                      {ev.affectedLeads.join(', ') || 'II'}
                    </td>

                    <td className="py-2.5 px-2.5 text-slate-700 tabular-nums whitespace-nowrap">
                      {ev.heartRateBpm != null ? `${ev.heartRateBpm} bpm` : '—'}
                    </td>

                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] border ${statusMeta.cls}`}>
                        {statusMeta.label}
                      </span>
                    </td>

                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] border ${VERDICT_BADGE[ev.reviewVerdict]}`}
                      >
                        {VERDICT_LABEL_VI[ev.reviewVerdict]}
                      </span>
                    </td>

                    {canAcknowledge && (
                      <td
                        className="py-2.5 px-2.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          {ev.alertStatus === 'active' && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => onAcknowledge(ev)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              <span>Đã nhận</span>
                            </button>
                          )}
                          {(ev.alertStatus === 'active' || ev.alertStatus === 'acknowledged') && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => onResolve(ev)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                            >
                              <CheckCheck className="w-3 h-3" />
                              <span>Đóng</span>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

