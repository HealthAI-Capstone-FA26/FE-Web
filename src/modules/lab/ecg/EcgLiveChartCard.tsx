import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  Grid,
  Maximize2,
  Minimize2,
  Monitor,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { EcgAnomalyEvent, EcgRecordingType, EcgSignal } from '../../../types/ecg';
import { STANDARD_12_LEADS } from '../../../types/ecg';
import type { SignalState } from '../../../hooks/useEcgRecording';
import type { PlaybackClock, PlaybackSnapshot } from '../../../hooks/useEcgPlayback';
import { EcgCanvas, type EcgCanvasHandle } from './chart/EcgCanvas';
import type { EcgGridMode } from './chart/renderer/gridLayer';
import { Minimap } from './chart/Minimap';
import { formatTimeMs, getAnomalyLabel } from './ecgMeta';

interface EcgLiveChartCardProps {
  signalState: SignalState;
  recordingType: EcgRecordingType;
  selectedLeads: string[];
  anomalies: EcgAnomalyEvent[];
  rPeaksMs: number[];
  clock: PlaybackClock;
  snapshot: PlaybackSnapshot;
  windowSec: 5 | 10 | 20 | 30;
  onChangeWindowSec: (sec: 5 | 10 | 20 | 30) => void;
  gainMmPerMv: 5 | 10 | 20;
  onChangeGain: (gain: 5 | 10 | 20) => void;
  gridMode: EcgGridMode;
  onChangeGridMode: (mode: EcgGridMode) => void;
  viewStartMs: number;
  viewEndMs: number;
  onViewChange: (startMs: number, endMs: number) => void;
  onResetZoom: () => void;
  selectedEventId: string | null;
  onSelectEvent: (event: EcgAnomalyEvent) => void;
  patientName: string;
  encounterCode: string;
}

/** Tiếng bíp ngắn bằng Web Audio API khi gặp bất thường nguy cấp (mặc định tắt). */
function playCriticalBeep(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch {
    // Bỏ qua nếu trình duyệt chặn autoplay audio
  }
}

export const EcgLiveChartCard: React.FC<EcgLiveChartCardProps> = ({
  signalState,
  recordingType,
  selectedLeads,
  anomalies,
  rPeaksMs,
  clock,
  snapshot,
  windowSec,
  onChangeWindowSec,
  gainMmPerMv,
  onChangeGain,
  gridMode,
  onChangeGridMode,
  viewStartMs,
  viewEndMs,
  onViewChange,
  onResetZoom,
  selectedEventId,
  onSelectEvent,
  patientName,
  encounterCode,
}) => {
  const cardRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<EcgCanvasHandle | null>(null);
  const [liveStyle, setLiveStyle] = useState<'sweep' | 'scroll'>('sweep');
  const [pts, setPts] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layout12Matrix, setLayout12Matrix] = useState(false);
  const [criticalFlash, setCriticalFlash] = useState(false);
  const lastAlertedIdRef = useRef<string | null>(null);

  const signal: EcgSignal | null = signalState.kind === 'ready' ? signalState.signal : null;
  const durationMs = snapshot.durationMs || 30000;

  // Sự kiện bất thường mà con trỏ playback đang đi qua
  const activeLiveAnomaly = useMemo(() => {
    const pos = snapshot.positionMs;
    return anomalies.find((a) => pos >= a.startOffsetMs && pos <= a.endOffsetMs + 250) ?? null;
  }, [anomalies, snapshot.positionMs]);

  useEffect(() => {
    if (!activeLiveAnomaly) {
      lastAlertedIdRef.current = null;
      return;
    }
    if (lastAlertedIdRef.current === activeLiveAnomaly.id) return;
    lastAlertedIdRef.current = activeLiveAnomaly.id;
    if (activeLiveAnomaly.severity === 'critical') {
      setCriticalFlash(true);
      if (soundEnabled) playCriticalBeep();
      const t = setTimeout(() => setCriticalFlash(false), 1100);
      return () => clearTimeout(t);
    }
  }, [activeLiveAnomaly, soundEnabled]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    const el = cardRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  };

  const handleExportPng = () => {
    const dataUrl = canvasRef.current?.exportPng({
      patientName,
      encounterCode,
      title: `Sóng ECG trực tiếp (${selectedLeads.join(', ')})`,
    });
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `ecg-live-${encounterCode}.png`;
    a.click();
  };

  const windowMs = windowSec * 1000;
  const effectiveStartMs = liveStyle === 'sweep' ? Math.floor(snapshot.positionMs / windowMs) * windowMs : viewStartMs;
  const effectiveEndMs = liveStyle === 'sweep' ? effectiveStartMs + windowMs : viewEndMs;

  const isMultiLead = selectedLeads.length > 1;
  const canvasHeight = isMultiLead ? Math.min(720, selectedLeads.length * 90) : 220;

  return (
    <section
      ref={cardRef}
      className={`glass-card !rounded-[20px] p-4 space-y-3 transition-shadow ${
        criticalFlash ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/25 animate-pulse' : ''
      } ${isFullscreen ? 'bg-white !rounded-none h-screen overflow-y-auto' : ''}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-[14px] font-semibold text-slate-900">
            Sóng ECG trực tiếp · {selectedLeads.length === 1 ? `Lead ${selectedLeads[0]}` : `${selectedLeads.length} đạo trình`}
          </h3>

          {snapshot.playing ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Streaming...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Tạm dừng</span>
            </span>
          )}

          <span className="hidden sm:inline-block text-[11px] text-slate-400 tabular-nums">
            25 mm/s · {gainMmPerMv} mm/mV
          </span>
        </div>

        {/* Các điều khiển góc phải */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Sweep / Scroll toggle */}
          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200/80 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setLiveStyle('sweep')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                liveStyle === 'sweep' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Con trỏ quét từ trái sang phải có khoảng xoá 40ms giống monitor bệnh viện"
            >
              Sweep
            </button>
            <button
              type="button"
              onClick={() => setLiveStyle('scroll')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                liveStyle === 'scroll' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Sóng trôi từ phải sang trái"
            >
              Scroll
            </button>
          </div>

          {/* Cửa sổ thời gian 5s / 10s / 20s / 30s */}
          <select
            value={windowSec}
            onChange={(e) => onChangeWindowSec(Number(e.target.value) as 5 | 10 | 20 | 30)}
            className="px-2 py-1 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200/90 cursor-pointer"
            title="Cửa sổ thời gian hiển thị"
          >
            <option value={5}>5 giây</option>
            <option value={10}>10 giây</option>
            <option value={20}>20 giây</option>
            <option value={30}>30 giây</option>
          </select>

          {/* Gain 5 / 10 / 20 mm/mV */}
          <select
            value={gainMmPerMv}
            onChange={(e) => onChangeGain(Number(e.target.value) as 5 | 10 | 20)}
            className="px-2 py-1 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200/90 cursor-pointer"
            title="Độ nhạy biên độ (Gain)"
          >
            <option value={5}>5 mm/mV</option>
            <option value={10}>10 mm/mV</option>
            <option value={20}>20 mm/mV</option>
          </select>

          {/* Chế độ Giấy ECG / Monitor tối */}
          <button
            type="button"
            onClick={() => onChangeGridMode(gridMode === 'paper' ? 'standard' : 'paper')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
              gridMode === 'paper'
                ? 'bg-[#FFF5F5] text-red-800 border-[#F5A3A3]'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
            }`}
            title="Phím tắt G: Bật/tắt giấy kẻ ô hồng y khoa"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Giấy ECG</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeGridMode(gridMode === 'monitor' ? 'standard' : 'monitor')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
              gridMode === 'monitor'
                ? 'bg-slate-900 text-emerald-400 border-slate-700'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
            }`}
            title="Giao diện Monitor ICU nền tối"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Monitor</span>
          </button>

          {recordingType === 'resting_12_lead' && (
            <button
              type="button"
              onClick={() => setLayout12Matrix((v) => !v)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                layout12Matrix
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
              }`}
              title="Bố cục 12 đạo trình chuẩn 3×4 + dải nhịp Lead II"
            >
              12-Lead 3×4
            </button>
          )}

          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/80 tabular-nums">
            Pts: {pts}
          </span>

          <button
            type="button"
            onClick={onResetZoom}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 transition cursor-pointer"
          >
            Reset Zoom
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              soundEnabled
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-white text-slate-500 border-slate-200/90 hover:text-slate-800'
            }`}
            title={soundEnabled ? 'Đang bật tiếng bíp cảnh báo nguy cấp' : 'Bật tiếng bíp khi gặp bất thường nguy cấp'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleExportPng}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/90 transition cursor-pointer"
            title="Xuất PNG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/90 transition cursor-pointer"
            title="Phím tắt F: Toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Vùng Canvas chính + Badge cảnh báo nổi khi con trỏ đi qua đoạn bất thường */}
      <div className="relative">
        <AnimatePresence>
          {activeLiveAnomaly && (
            <motion.button
              key={activeLiveAnomaly.id}
              type="button"
              onClick={() => onSelectEvent(activeLiveAnomaly)}
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className={`absolute top-2.5 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-md cursor-pointer tabular-nums ${
                activeLiveAnomaly.severity === 'critical'
                  ? 'bg-red-600 text-white'
                  : activeLiveAnomaly.severity === 'high'
                    ? 'bg-orange-500 text-white'
                    : 'bg-amber-400 text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                {getAnomalyLabel(activeLiveAnomaly.anomalyType)} · {activeLiveAnomaly.score.toFixed(2)}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {signal && layout12Matrix ? (
          /* Layout 12 đạo trình chuẩn 3×4 + rhythm strip Lead II ở dưới (mục 3.5) */
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
              {STANDARD_12_LEADS.map((lead, idx) => {
                const col = Math.floor(idx / 3);
                const segSpan = durationMs / 4;
                const segStart = col * segSpan;
                const segEnd = segStart + Math.min(2500, segSpan);
                return (
                  <EcgCanvas
                    key={lead}
                    signal={signal}
                    styleMode="static"
                    gridMode={gridMode}
                    gainMmPerMv={gainMmPerMv}
                    leadNames={[lead]}
                    showCalibrationPulse={col === 0}
                    viewStartMs={segStart}
                    viewEndMs={segEnd}
                    durationMs={durationMs}
                    anomalies={anomalies}
                    selectedEventId={selectedEventId}
                    onSelectEvent={onSelectEvent}
                    heightPx={92}
                    showYAxis={false}
                    showXAxis={false}
                    ariaLabel={`Đạo trình ${lead}`}
                  />
                );
              })}
            </div>
            <EcgCanvas
              ref={canvasRef}
              signal={signal}
              styleMode={liveStyle}
              gridMode={gridMode}
              gainMmPerMv={gainMmPerMv}
              leadNames={['II']}
              showCalibrationPulse
              viewStartMs={effectiveStartMs}
              viewEndMs={effectiveEndMs}
              durationMs={durationMs}
              onViewChange={onViewChange}
              anomalies={anomalies}
              rPeaksMs={rPeaksMs}
              selectedEventId={selectedEventId}
              onSelectEvent={onSelectEvent}
              clock={clock}
              heightPx={120}
              showYAxis
              showXAxis
              onPointsChange={setPts}
              ariaLabel="Dải nhịp đạo trình II kéo dài"
            />
          </div>
        ) : (
          <EcgCanvas
            ref={canvasRef}
            signal={signal}
            styleMode={signal ? liveStyle : 'static'}
            gridMode={gridMode}
            gainMmPerMv={gainMmPerMv}
            leadNames={selectedLeads}
            showCalibrationPulse
            viewStartMs={effectiveStartMs}
            viewEndMs={effectiveEndMs}
            durationMs={durationMs}
            onViewChange={onViewChange}
            anomalies={anomalies}
            rPeaksMs={rPeaksMs}
            selectedEventId={selectedEventId}
            onSelectEvent={onSelectEvent}
            clock={clock}
            heightPx={canvasHeight}
            showYAxis
            showXAxis
            onPointsChange={setPts}
            ariaLabel={`ECG trực tiếp đạo trình ${selectedLeads.join(', ')}, cửa sổ ${windowSec} giây`}
          />
        )}
      </div>

      {/* Minimap */}
      {signal && (
        <div className="pl-10">
          <Minimap
            signal={signal}
            leadName={selectedLeads[0] ?? 'II'}
            durationMs={durationMs}
            viewStartMs={effectiveStartMs}
            viewEndMs={effectiveEndMs}
            anomalies={anomalies}
            onViewChange={(s, e) => {
              clock.seek(s);
              onViewChange(s, e);
            }}
          />
        </div>
      )}

      {/* Player bar dưới minimap: ⏮ ⏯ ⏭ · thanh tiến trình có vạch màu anomaly · thời gian · tốc độ · Theo dõi trực tiếp */}
      <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => clock.seek(Math.max(0, snapshot.positionMs - 2000))}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 transition cursor-pointer"
            title="Lùi 2 giây (Phím ←)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => clock.toggle()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Phát / Tạm dừng (Phím Space)"
          >
            {snapshot.playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{snapshot.playing ? 'Tạm dừng' : 'Phát'}</span>
          </button>

          <button
            type="button"
            onClick={() => clock.seek(Math.min(durationMs, snapshot.positionMs + 2000))}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 transition cursor-pointer"
            title="Tiến 2 giây (Phím →)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Thanh tiến trình có đánh dấu các vạch bất thường (click để nhảy tới) */}
        <div className="flex-1 min-w-[180px] flex items-center gap-3">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
              clock.seek(ratio * durationMs);
            }}
            className="relative flex-1 h-2.5 rounded-full bg-slate-200/90 overflow-hidden cursor-pointer"
            title="Bấm để nhảy tới mốc thời gian"
          >
            {anomalies.map((ev) => {
              const left = (ev.startOffsetMs / Math.max(1, durationMs)) * 100;
              const width = Math.max(0.8, ((ev.endOffsetMs - ev.startOffsetMs) / Math.max(1, durationMs)) * 100);
              return (
                <span
                  key={ev.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    clock.seek(ev.startOffsetMs);
                    onSelectEvent(ev);
                  }}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  className={`absolute top-0 bottom-0 ${
                    ev.severity === 'critical'
                      ? 'bg-red-500'
                      : ev.severity === 'high'
                        ? 'bg-orange-400'
                        : 'bg-amber-400'
                  }`}
                />
              );
            })}
            <div
              className="h-full bg-blue-600/80 rounded-full pointer-events-none"
              style={{ width: `${Math.min(100, (snapshot.positionMs / Math.max(1, durationMs)) * 100)}%` }}
            />
          </div>

          <span className="text-xs font-medium text-slate-600 tabular-nums shrink-0">
            {formatTimeMs(snapshot.positionMs)} / {formatTimeMs(durationMs)}
          </span>
        </div>

        {/* Tốc độ 0.5× / 1× / 2× / 4× + nút Theo dõi trực tiếp */}
        <div className="flex items-center gap-1.5">
          <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/80">
            {([0.5, 1, 2, 4] as const).map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => clock.setSpeed(sp)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold tabular-nums transition cursor-pointer ${
                  snapshot.speed === sp ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {sp}×
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              clock.seek(0);
              clock.play();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Theo dõi trực tiếp</span>
          </button>
        </div>
      </div>
    </section>
  );
};

