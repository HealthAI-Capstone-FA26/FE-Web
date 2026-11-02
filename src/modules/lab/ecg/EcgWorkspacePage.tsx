import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Cpu,
  FlaskConical,
  Keyboard,
  Menu,
  Radio,
  Upload,
  WifiOff,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCan } from '../../../hooks/useCan';
import { useEcgAlertSocket } from '../../../hooks/useEcgAlertSocket';
import { useEcgPlayback } from '../../../hooks/useEcgPlayback';
import { useEcgRecording } from '../../../hooks/useEcgRecording';
import {
  ecgErrorMessage,
  ecgService,
  isEcgMockMode,
  setEcgMockMode,
} from '../../../services/lab/ecg.service';
import { labTaskService, type LabTaskItem } from '../../../services/lab/lab-task.service';
import {
  STANDARD_12_LEADS,
  type EcgAlertStatus,
  type EcgAnomalyEvent,
  type EcgAnomalyFilter,
  type EcgReviewVerdict,
} from '../../../types/ecg';
import type { EcgGridMode } from './chart/renderer/gridLayer';
import { EcgAnomalyChartCard } from './EcgAnomalyChartCard';
import { EcgEventDetailPanel } from './EcgEventDetailPanel';
import { EcgEventsTable } from './EcgEventsTable';
import { EcgKpiCards } from './EcgKpiCards';
import { EcgLiveChartCard } from './EcgLiveChartCard';
import { EcgSidebar, type EcgViewMode } from './EcgSidebar';
import { EcgUploadForm } from './EcgUploadForm';
import { ReanalyzeModal } from './ReanalyzeModal';

export interface EcgWorkspacePageProps {
  defaultMode?: EcgViewMode;
  initialTaskId?: string;
}

interface ToastMessage {
  id: number;
  kind: 'success' | 'error' | 'info';
  text: string;
}

export const EcgWorkspacePage: React.FC<EcgWorkspacePageProps> = ({
  defaultMode = 'anomaly',
  initialTaskId,
}) => {
  const { hasRole, user } = useCan();
  const isLabStaff = hasRole('LAB');
  const isDoctor = hasRole('DOCTOR');
  const canReanalyze = hasRole(['LAB', 'DOCTOR']);
  const canAcknowledge = hasRole(['LAB', 'DOCTOR']);
  const canReview = isDoctor;

  const [mockEnabled, setMockEnabled] = useState<boolean>(() => {
    // Mặc định bật dữ liệu mô phỏng nếu chưa cấu hình tắt để luôn chạy được ngay khi chưa có BE
    if (localStorage.getItem('ecg_mock') === null) {
      setEcgMockMode(true);
      return true;
    }
    return isEcgMockMode();
  });

  const [tasks, setTasks] = useState<LabTaskItem[]>([]);
  const [taskId, setTaskId] = useState<string>(initialTaskId ?? 'task-ecg-demo');
  const [viewMode, setViewMode] = useState<EcgViewMode>(defaultMode);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    recordings,
    listLoading,
    selectedId,
    setSelectedId,
    detail,
    setDetail,
    signalState,
    refreshList,
    refreshDetail,
    retrySignal,
  } = useEcgRecording(taskId);

  const durationMs =
    (signalState.kind === 'ready' ? signalState.signal.durationMs : detail?.durationMs) ?? 30000;
  const { clock, snapshot } = useEcgPlayback(durationMs);

  // Tự động phát khi tải xong tín hiệu
  useEffect(() => {
    if (signalState.kind === 'ready') {
      clock.setDuration(signalState.signal.durationMs);
      clock.seek(0);
      clock.play();
    }
  }, [signalState, clock]);

  // Cửa sổ xem (Zoom / Pan) + Liên kết trục thời gian
  const [viewRange, setViewRange] = useState<{ startMs: number; endMs: number }>({
    startMs: 0,
    endMs: 30000,
  });
  const [linkedZoom, setLinkedZoom] = useState(true);
  const [windowSec, setWindowSec] = useState<5 | 10 | 20 | 30>(10);
  const [gainMmPerMv, setGainMmPerMv] = useState<5 | 10 | 20>(10);
  const [gridMode, setGridMode] = useState<EcgGridMode>('standard');

  // Đạo trình đang chọn (mặc định Lead II theo mục 3.2)
  const [selectedLeads, setSelectedLeads] = useState<string[]>(['II']);
  const [multiLead, setMultiLead] = useState(false);

  // Sự kiện đang chọn + bộ lọc + đối chiếu 2 lần phân tích
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filter, setFilter] = useState<EcgAnomalyFilter>({});
  const [comparisonAnalysisId, setComparisonAnalysisId] = useState<string | null>(null);
  const [busyEventId, setBusyEventId] = useState<string | null>(null);

  // Modal upload & re-analyze
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reanalyzeOpen, setReanalyzeOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Toast tiếng Việt
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const pushToast = useCallback((kind: ToastMessage['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  // Tải danh sách task ECG thật khi tắt chế độ mock
  useEffect(() => {
    if (mockEnabled) return;
    labTaskService
      .getLabTasks({ limit: 30 })
      .then((list) => {
        setTasks(list);
        if (list.length > 0 && taskId === 'task-ecg-demo') {
          setTaskId(list[0].labTaskId);
        }
      })
      .catch(() => {
        // Giữ taskId hiện tại
      });
  }, [mockEnabled, taskId]);

  useEffect(() => {
    setViewRange({ startMs: 0, endMs: durationMs });
  }, [durationMs, selectedId]);

  const currentAnalysis = detail?.latestAnalysis ?? detail?.analyses[0] ?? null;
  const comparisonAnalysis = useMemo(
    () => detail?.analyses.find((a) => a.id === comparisonAnalysisId) ?? null,
    [detail?.analyses, comparisonAnalysisId],
  );
  const allAnomalies = useMemo(() => currentAnalysis?.anomalies ?? [], [currentAnalysis]);

  const filteredEvents = useMemo(
    () =>
      allAnomalies.filter(
        (e) =>
          (!filter.alertStatus || e.alertStatus === filter.alertStatus) &&
          (!filter.severity || e.severity === filter.severity) &&
          (!filter.reviewVerdict || e.reviewVerdict === filter.reviewVerdict),
      ),
    [allAnomalies, filter],
  );

  const selectedEvent = useMemo(
    () => allAnomalies.find((e) => e.id === selectedEventId) ?? allAnomalies[0] ?? null,
    [allAnomalies, selectedEventId],
  );

  // Đỉnh R tổng hợp từ các sự kiện + ước lượng cho nhịp trực tiếp
  const allRPeaksMs = useMemo(() => {
    const set = new Set<number>();
    for (const ev of allAnomalies) {
      const rp = ev.details?.rPeaks;
      if (Array.isArray(rp)) {
        for (const p of rp) {
          const n = Number(p);
          if (Number.isFinite(n)) set.add(n);
        }
      }
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [allAnomalies]);

  const liveHeartRateBpm = useMemo(() => {
    const pos = snapshot.positionMs;
    const recent = allRPeaksMs.filter((t) => t <= pos && t >= pos - 6000);
    if (recent.length >= 2) {
      const rr = (recent[recent.length - 1] - recent[0]) / (recent.length - 1);
      if (rr >= 220 && rr <= 2000) return Math.round(60000 / rr);
    }
    return currentAnalysis?.summaryMetrics?.hrMean ?? null;
  }, [allRPeaksMs, snapshot.positionMs, currentAnalysis]);

  // Socket realtime `/lab-alerts`, room `encounter:{encounterId}`, event `ecg-alert-update`
  const { state: socketState } = useEcgAlertSocket({
    encounterId: detail?.encounterId,
    enabled: Boolean(detail?.encounterId),
    onUpdate: () => {
      void refreshDetail(true);
      pushToast('info', 'Đã cập nhật kết quả phân tích ECG thời gian thực.');
    },
    onReconnect: () => {
      void refreshDetail(true);
    },
  });

  // Animate Reset Zoom 300ms ease-out (mục 4.3)
  const animateResetZoom = useCallback(() => {
    const start0 = viewRange.startMs;
    const end0 = viewRange.endMs;
    const targetEnd = durationMs;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 300);
      const easeOut = 1 - Math.pow(1 - p, 3);
      setViewRange({
        startMs: start0 * (1 - easeOut),
        endMs: end0 + (targetEnd - end0) * easeOut,
      });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [viewRange.startMs, viewRange.endMs, durationMs]);

  // Chọn sự kiện từ chart hoặc bảng → zoom tới đoạn đó (±1s padding) + mở Event Detail + nhảy Card 2 tới vị trí
  const handleSelectEvent = useCallback(
    (ev: EcgAnomalyEvent) => {
      setSelectedEventId(ev.id);
      const pad = 1800;
      const s = Math.max(0, ev.startOffsetMs - pad);
      const e = Math.min(durationMs, ev.endOffsetMs + pad);
      setViewRange({ startMs: s, endMs: Math.max(s + 1000, e) });
      clock.seek(ev.startOffsetMs);
      if (ev.affectedLeads.length > 0 && !multiLead) {
        setSelectedLeads([ev.affectedLeads[0]]);
      }
    },
    [durationMs, clock, multiLead],
  );

  // Phím tắt toàn cục (mục 7): Space, ←/→, +/-, 0, N/P, F, G
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        clock.toggle();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        clock.seek(Math.max(0, clock.positionMs - 1000));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        clock.seek(Math.min(durationMs, clock.positionMs + 1000));
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        const span = viewRange.endMs - viewRange.startMs;
        const mid = (viewRange.startMs + viewRange.endMs) / 2;
        const nextSpan = Math.max(500, span * 0.75);
        const s = Math.max(0, Math.min(durationMs - nextSpan, mid - nextSpan / 2));
        setViewRange({ startMs: s, endMs: s + nextSpan });
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        const span = viewRange.endMs - viewRange.startMs;
        const mid = (viewRange.startMs + viewRange.endMs) / 2;
        const nextSpan = Math.min(durationMs, span * 1.3);
        const s = Math.max(0, Math.min(durationMs - nextSpan, mid - nextSpan / 2));
        setViewRange({ startMs: s, endMs: s + nextSpan });
      } else if (e.key === '0') {
        e.preventDefault();
        animateResetZoom();
      } else if (e.key.toLowerCase() === 'n' && allAnomalies.length > 0) {
        e.preventDefault();
        const idx = allAnomalies.findIndex((a) => a.id === selectedEvent?.id);
        const next = allAnomalies[(idx + 1) % allAnomalies.length];
        if (next) handleSelectEvent(next);
      } else if (e.key.toLowerCase() === 'p' && allAnomalies.length > 0) {
        e.preventDefault();
        const idx = allAnomalies.findIndex((a) => a.id === selectedEvent?.id);
        const prev = allAnomalies[(idx - 1 + allAnomalies.length) % allAnomalies.length];
        if (prev) handleSelectEvent(prev);
      } else if (e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setGridMode((m) => (m === 'paper' ? 'standard' : 'paper'));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clock, durationMs, viewRange, animateResetZoom, allAnomalies, selectedEvent, handleSelectEvent]);

  // Optimistic update + rollback cho Acknowledge / Resolve (mục 3.6)
  const handleEventStatusAction = async (
    ev: EcgAnomalyEvent,
    action: 'acknowledge' | 'resolve',
  ) => {
    if (!detail) return;
    const prevDetail = structuredClone(detail);
    const nextStatus: EcgAlertStatus = action === 'acknowledge' ? 'acknowledged' : 'resolved';
    setBusyEventId(ev.id);

    setDetail((cur) => {
      if (!cur) return cur;
      const patchAnomalies = (list: EcgAnomalyEvent[]): EcgAnomalyEvent[] =>
        list.map((item) => (item.id === ev.id ? { ...item, alertStatus: nextStatus } : item));
      return {
        ...cur,
        latestAnalysis: cur.latestAnalysis
          ? { ...cur.latestAnalysis, anomalies: patchAnomalies(cur.latestAnalysis.anomalies) }
          : null,
        analyses: cur.analyses.map((a) => ({ ...a, anomalies: patchAnomalies(a.anomalies) })),
      };
    });

    try {
      await ecgService.updateEventStatus(ev.id, action);
      pushToast(
        'success',
        action === 'acknowledge' ? 'Đã tiếp nhận cảnh báo bất thường.' : 'Đã đóng cảnh báo.',
      );
    } catch (err) {
      setDetail(prevDetail);
      pushToast('error', ecgErrorMessage(err, 'alert'));
    } finally {
      setBusyEventId(null);
    }
  };

  // Lưu đánh giá của Bác sĩ
  const handleSaveReview = async (
    eventId: string,
    verdict: Exclude<EcgReviewVerdict, 'pending'>,
    note: string,
  ) => {
    const reviewerName = user?.fullName || user?.name || 'Bác sĩ điều trị';
    try {
      await ecgService.reviewEvent(eventId, verdict, note, reviewerName);
      await refreshDetail(true);
      pushToast('success', 'Đã lưu đánh giá lâm sàng kết quả AI.');
    } catch (err) {
      pushToast('error', ecgErrorMessage(err, 'review'));
    }
  };

  // Chạy lại AI
  const handleReanalyze = async (payload: { modelVersionId?: string; threshold: number }) => {
    if (!detail) return;
    try {
      await ecgService.reanalyze(detail.id, payload);
      await refreshDetail(true);
      pushToast('info', 'Đã xếp hàng phân tích lại AI.');
    } catch (err) {
      const msg = ecgErrorMessage(err, 'reanalyze');
      pushToast('error', msg);
      throw new Error(msg);
    }
  };

  // Huỷ bản ghi
  const handleCancelRecording = async (id: string) => {
    try {
      await ecgService.cancelRecording(id);
      await refreshList();
      pushToast('info', 'Đã huỷ bản ghi ECG.');
    } catch (err) {
      pushToast('error', ecgErrorMessage(err, 'cancel'));
    }
  };

  const handleToggleLead = (lead: string) => {
    if (!multiLead) {
      setSelectedLeads([lead]);
      return;
    }
    setSelectedLeads((prev) => {
      if (prev.includes(lead)) {
        return prev.length > 1 ? prev.filter((l) => l !== lead) : prev;
      }
      return [...prev, lead];
    });
  };

  const handleToggleMock = () => {
    const next = !mockEnabled;
    setEcgMockMode(next);
    setMockEnabled(next);
    if (next) setTaskId('task-ecg-demo');
    void refreshList();
  };

  const patientName = detail?.patientName ?? 'Lương Thị Hải Yến';
  const encounterCode = detail?.encounterCode ?? 'KB-20261101-0412';

  return (
    <div className="space-y-4">
      {/* HEADER BAR: Bệnh nhân · Mã lượt khám · Loại ghi · Thiết bị · Trạng thái Socket + Mock toggle */}
      <header className="glass-card !rounded-[20px] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Nút mở drawer sidebar trên Tablet/Mobile */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="xl:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            title="Mở bảng điều khiển bản ghi & đạo trình"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200/80 text-[#B91C1C] flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{patientName}</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold tabular-nums border border-slate-200/80">
                  {encounterCode}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2">
                <span>Thiết bị: {detail?.deviceModel ?? 'Nihon Kohden ECG-2350'}</span>
                {detail?.deviceSerial && <span className="tabular-nums">({detail.deviceSerial})</span>}
                <span>· Tần số: {detail?.sampleRateHz ?? 500} Hz</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cụm trạng thái kết nối + chọn Task + Phím tắt + Chế độ Demo */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {!mockEnabled && tasks.length > 0 && (
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700"
            >
              {tasks.map((t) => (
                <option key={t.labTaskId} value={t.labTaskId}>
                  {t.orderItem?.order?.encounter?.patient?.fullName ?? t.labTaskId.slice(0, 8)} ·{' '}
                  {t.orderItem?.testType?.testName ?? 'ECG'}
                </option>
              ))}
            </select>
          )}

          {/* Trạng thái Socket (mục 5: Mất socket → chấm cam) */}
          {socketState === 'reconnecting' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
              <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Mất kết nối realtime — đang thử lại</span>
            </span>
          )}
          {(socketState === 'connected' || socketState === 'mock') && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>{socketState === 'mock' ? 'Realtime (Mô phỏng)' : 'Realtime /lab-alerts'}</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleToggleMock}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold transition cursor-pointer ${mockEnabled
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            title="Chuyển đổi giữa dữ liệu tổng hợp (P-QRS-T 500Hz) và API Backend thực tế"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{mockEnabled ? 'Dữ liệu mô phỏng: BẬT' : 'Dữ liệu mô phỏng: TẮT'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowShortcuts((s) => !s)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/90 font-medium cursor-pointer"
            title="Xem danh sách phím tắt"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phím tắt</span>
          </button>
        </div>
      </header>

      {/* Bảng gợi ý phím tắt & công cụ đo */}
      {showShortcuts && (
        <div className="glass-card !rounded-[16px] px-4 py-2.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[11px]">Space</kbd> Phát/Dừng
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[11px]">←/→</kbd> Lùi/Tiến 1s
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[11px]">+/-</kbd> Thu/Phóng
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[11px]">0</kbd> Reset Zoom
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[11px]">N / P</kbd> Sự kiện kế/trước
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[11px]">G</kbd> Giấy ECG
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[11px]">Alt + Kéo</kbd> Thước đo Caliper (ms & bpm)
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[11px]">Ctrl + Kéo</kbd> Khoanh vùng Zoom
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowShortcuts(false)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* BỐ CỤC CHÍNH: SIDEBAR 240px + MAIN WORKSPACE */}
      <div className="flex flex-col xl:flex-row items-start gap-4">
        {/* Sidebar cố định trên Desktop (≥1280px) */}
        <div className="hidden xl:block">
          <EcgSidebar
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            recordings={recordings}
            selectedRecordingId={selectedId}
            onSelectRecording={setSelectedId}
            availableLeads={detail?.leadNames ?? STANDARD_12_LEADS}
            selectedLeads={selectedLeads}
            multiLead={multiLead}
            onToggleMultiLead={() => {
              setMultiLead((m) => {
                if (m) setSelectedLeads((cur) => [cur[0] ?? 'II']);
                return !m;
              });
            }}
            onToggleLead={handleToggleLead}
            onSelectAll12Leads={() => {
              setMultiLead(true);
              setSelectedLeads(detail?.leadNames ?? STANDARD_12_LEADS);
            }}
            anomalies={allAnomalies}
            canUpload={isLabStaff}
            onOpenUpload={() => setUploadOpen(true)}
            onCancelRecording={isLabStaff ? handleCancelRecording : undefined}
          />
        </div>

        {/* Drawer Sidebar cho Tablet / Mobile */}
        <AnimatePresence>
          {drawerOpen && (
            <div className="fixed inset-0 z-50 xl:hidden flex">
              <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 w-[270px] max-w-full h-full bg-slate-50 p-3 overflow-y-auto shadow-2xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">Điều khiển ECG</span>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <EcgSidebar
                  viewMode={viewMode}
                  onChangeViewMode={(m) => {
                    setViewMode(m);
                    setDrawerOpen(false);
                  }}
                  recordings={recordings}
                  selectedRecordingId={selectedId}
                  onSelectRecording={(id) => {
                    setSelectedId(id);
                    setDrawerOpen(false);
                  }}
                  availableLeads={detail?.leadNames ?? STANDARD_12_LEADS}
                  selectedLeads={selectedLeads}
                  multiLead={multiLead}
                  onToggleMultiLead={() => setMultiLead((m) => !m)}
                  onToggleLead={handleToggleLead}
                  onSelectAll12Leads={() => {
                    setMultiLead(true);
                    setSelectedLeads(detail?.leadNames ?? STANDARD_12_LEADS);
                    setDrawerOpen(false);
                  }}
                  anomalies={allAnomalies}
                  canUpload={isLabStaff}
                  onOpenUpload={() => {
                    setDrawerOpen(false);
                    setUploadOpen(true);
                  }}
                  onCancelRecording={isLabStaff ? handleCancelRecording : undefined}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* VÙNG NỘI DUNG CHÍNH */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Empty state khi không có bản ghi nào (mục 5) */}
          {!listLoading && recordings.length === 0 ? (
            <div className="glass-card !rounded-[20px] p-10 text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border border-red-200/80 text-[#B91C1C] flex items-center justify-center">
                <FlaskConical className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Chưa có bản ghi Điện tâm đồ (ECG) cho ca khám này
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tải lên bản ghi tín hiệu từ máy điện tim để hiển thị sóng trực tiếp 25 mm/s và chạy mô hình phát hiện bất thường tự động.
              </p>
              {isLabStaff && (
                <button
                  type="button"
                  onClick={() => setUploadOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Tải bản ghi ECG</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* HÀNG KPI CARDS (6 ô ngang — ẩn bớt trên mobile nhỏ nếu cần tập trung Live ECG) */}
              <div className="hidden sm:block">
                <EcgKpiCards
                  recording={detail}
                  analysis={currentAnalysis}
                  liveHeartRateBpm={liveHeartRateBpm}
                />
              </div>

              {/* CARD 1: AI Anomaly Detection (ẩn trên màn hình di động hẹp theo mục 3.1, hoặc khi chỉ chọn chế độ Live thuần) */}
              {viewMode !== 'live' && (
                <div className="hidden md:block">
                  <EcgAnomalyChartCard
                    signalState={signalState}
                    analysis={currentAnalysis}
                    comparisonAnalysis={comparisonAnalysis}
                    leadName={selectedLeads[0] ?? 'II'}
                    durationMs={durationMs}
                    viewStartMs={viewRange.startMs}
                    viewEndMs={viewRange.endMs}
                    onViewChange={(startMs, endMs) => setViewRange({ startMs, endMs })}
                    onResetZoom={animateResetZoom}
                    linkedZoom={linkedZoom}
                    onToggleLinkedZoom={() => setLinkedZoom((v) => !v)}
                    selectedEventId={selectedEvent?.id ?? null}
                    onSelectEvent={handleSelectEvent}
                    canReanalyze={canReanalyze}
                    onOpenReanalyze={() => setReanalyzeOpen(true)}
                    patientName={patientName}
                    encounterCode={encounterCode}
                    onRetrySignal={retrySignal}
                  />
                </div>
              )}

              {/* CARD 2: Live ECG (luôn hiển thị trên cả Desktop, Tablet và Mobile) */}
              <EcgLiveChartCard
                signalState={signalState}
                recordingType={detail?.recordingType ?? 'resting_12_lead'}
                selectedLeads={selectedLeads}
                anomalies={allAnomalies}
                rPeaksMs={allRPeaksMs}
                clock={clock}
                snapshot={snapshot}
                windowSec={windowSec}
                onChangeWindowSec={(sec) => {
                  setWindowSec(sec);
                  if (linkedZoom) {
                    const start = Math.min(viewRange.startMs, Math.max(0, durationMs - sec * 1000));
                    setViewRange({ startMs: start, endMs: Math.min(durationMs, start + sec * 1000) });
                  }
                }}
                gainMmPerMv={gainMmPerMv}
                onChangeGain={setGainMmPerMv}
                gridMode={gridMode}
                onChangeGridMode={setGridMode}
                viewStartMs={viewRange.startMs}
                viewEndMs={viewRange.endMs}
                onViewChange={(startMs, endMs) => {
                  if (linkedZoom) setViewRange({ startMs, endMs });
                }}
                onResetZoom={animateResetZoom}
                selectedEventId={selectedEvent?.id ?? null}
                onSelectEvent={handleSelectEvent}
                patientName={patientName}
                encounterCode={encounterCode}
              />

              {/* CARD 3 (Bảng sự kiện) + CARD 4 (Chi tiết & Review của Bác sĩ) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                <div className="xl:col-span-7">
                  <EcgEventsTable
                    events={filteredEvents}
                    filter={filter}
                    onChangeFilter={setFilter}
                    selectedEventId={selectedEvent?.id ?? null}
                    onSelectEvent={handleSelectEvent}
                    canAcknowledge={canAcknowledge}
                    onAcknowledge={(ev) => void handleEventStatusAction(ev, 'acknowledge')}
                    onResolve={(ev) => void handleEventStatusAction(ev, 'resolve')}
                    busyEventId={busyEventId}
                  />
                </div>

                <div className="xl:col-span-5">
                  <EcgEventDetailPanel
                    event={selectedEvent}
                    analysis={currentAnalysis}
                    analyses={detail?.analyses ?? []}
                    comparisonAnalysisId={comparisonAnalysisId}
                    onChangeComparisonAnalysisId={setComparisonAnalysisId}
                    signal={signalState.kind === 'ready' ? signalState.signal : null}
                    canReview={canReview}
                    canReanalyze={canReanalyze}
                    onSaveReview={handleSaveReview}
                    onOpenReanalyze={() => setReanalyzeOpen(true)}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Upload bản ghi (chỉ LAB_STAFF) */}
      {isLabStaff && (
        <EcgUploadForm
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          taskId={taskId}
          onUploaded={(created) => {
            void refreshList();
            setSelectedId(created.id);
            pushToast('success', 'Tải bản ghi ECG thành công.');
          }}
        />
      )}

      {/* Modal Chạy lại phân tích AI */}
      {canReanalyze && (
        <ReanalyzeModal
          open={reanalyzeOpen}
          onClose={() => setReanalyzeOpen(false)}
          defaultThreshold={currentAnalysis?.thresholdUsed ?? 0.5}
          onSubmit={handleReanalyze}
        />
      )}

      {/* Toast tiếng Việt góc dưới phải */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className={`pointer-events-auto px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-lg border ${t.kind === 'error'
                  ? 'bg-red-600 text-white border-red-700'
                  : t.kind === 'success'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-slate-900 text-white border-slate-700'
                }`}
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
