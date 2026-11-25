import React from 'react';

export type QueueStatusKey = 'all' | 'waiting' | 'in_progress' | 'awaiting_review' | 'finished';

export interface QueueStatusCounts {
  all: number;
  waiting: number;
  in_progress: number;
  awaiting_review: number;
  finished: number;
}

interface QueueStatusFilterProps {
  value: QueueStatusKey;
  onChange: (value: QueueStatusKey) => void;
  counts: QueueStatusCounts;
  className?: string;
}

interface StatusOption {
  key: Exclude<QueueStatusKey, 'all'>;
  label: string;
  description: string;
  dot: string;
  activeBg: string;
  activeText: string;
  activeRing: string;
  activeCount: string;
  /** Trạng thái cần bác sĩ ưu tiên xử lý khi có số lượng > 0 */
  attention?: boolean;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    key: 'waiting',
    label: 'Chờ khám',
    description: 'Bệnh nhân đã tiếp nhận, đang chờ bác sĩ gọi khám',
    dot: 'bg-amber-500',
    activeBg: 'bg-amber-50',
    activeText: 'text-amber-800',
    activeRing: 'ring-amber-300',
    activeCount: 'bg-amber-500 text-white',
  },
  {
    key: 'in_progress',
    label: 'Đang khám',
    description: 'Đang khám lâm sàng hoặc đang thực hiện cận lâm sàng',
    dot: 'bg-blue-600',
    activeBg: 'bg-blue-50',
    activeText: 'text-blue-800',
    activeRing: 'ring-blue-300',
    activeCount: 'bg-blue-600 text-white',
  },
  {
    key: 'awaiting_review',
    label: 'Có KQ CLS',
    description: 'Đã có kết quả cận lâm sàng, cần bác sĩ đọc và kết luận',
    dot: 'bg-violet-600',
    activeBg: 'bg-violet-50',
    activeText: 'text-violet-800',
    activeRing: 'ring-violet-300',
    activeCount: 'bg-violet-600 text-white',
    attention: true,
  },
  {
    key: 'finished',
    label: 'Hoàn tất',
    description: 'Ca khám đã kết thúc',
    dot: 'bg-emerald-600',
    activeBg: 'bg-emerald-50',
    activeText: 'text-emerald-800',
    activeRing: 'ring-emerald-300',
    activeCount: 'bg-emerald-600 text-white',
  },
];

/**
 * Bộ lọc trạng thái hàng chờ khám dùng chung cho các màn hình Bác sĩ
 * (Hồ sơ EMR, Chẩn đoán, Kê đơn).
 * Bố cục: 1 hàng "Tất cả" + lưới 2x2 các trạng thái lâm sàng có mã màu,
 * đảm bảo nhãn luôn hiển thị đầy đủ trong cột sidebar hẹp.
 */
export const QueueStatusFilter: React.FC<QueueStatusFilterProps> = ({
  value,
  onChange,
  counts,
  className = '',
}) => {
  const isAllActive = value === 'all';

  return (
    <div
      role="tablist"
      aria-label="Lọc hàng chờ theo trạng thái ca khám"
      className={`grid grid-cols-2 gap-1.5 ${className}`}
    >
      {/* Tất cả */}
      <button
        type="button"
        role="tab"
        aria-selected={isAllActive}
        title="Tất cả: Toàn bộ ca khám trong khoảng thời gian đang xem"
        onClick={() => onChange('all')}
        className={`col-span-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          isAllActive
            ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
        }`}
      >
        <span>Tất cả ca khám</span>
        <span
          className={`min-w-[26px] px-1.5 py-0.5 rounded-md text-[11px] font-black text-center tabular-nums ${
            isAllActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {counts.all}
        </span>
      </button>

      {/* Các trạng thái lâm sàng */}
      {STATUS_OPTIONS.map((opt) => {
        const isActive = value === opt.key;
        const count = counts[opt.key] ?? 0;
        const needsAttention = Boolean(opt.attention && count > 0);

        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={`${opt.label}: ${opt.description}`}
            onClick={() => onChange(opt.key)}
            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isActive
                ? `${opt.activeBg} ${opt.activeText} border-transparent ring-1 ${opt.activeRing}`
                : needsAttention
                ? 'bg-violet-50/60 border-violet-200 text-violet-800 hover:bg-violet-50'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                {needsAttention && (
                  <span className={`absolute inline-flex h-full w-full rounded-full ${opt.dot} opacity-60 animate-ping`} />
                )}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${opt.dot}`} />
              </span>
              <span className="whitespace-nowrap">{opt.label}</span>
            </span>
            <span
              className={`min-w-[22px] px-1.5 py-0.5 rounded-md text-[10px] font-black text-center tabular-nums ${
                isActive
                  ? opt.activeCount
                  : count > 0
                  ? 'bg-slate-100 text-slate-800'
                  : 'bg-slate-50 text-slate-400'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
