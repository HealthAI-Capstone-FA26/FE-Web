import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  CalendarCheck,
  Coins,
  FlaskConical,
  RefreshCw,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  Stethoscope,
  HeartPulse,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  statisticsService,
  STAGE_LABELS_VI,
  type DashboardRealtimeResponse,
  type OverviewStatisticsResponse,
  type StagesStatisticsResponse,
} from '../../services/statistics/statistics.service';

// Helper format YYYY-MM-DD theo múi giờ Việt Nam
const toDateInputStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatVnd = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDurationSec = (sec: number | null | undefined): string => {
  if (sec === null || sec === undefined) return '—';
  if (sec < 60) return `${sec} giây`;
  const mins = Math.floor(sec / 60);
  const remSec = sec % 60;
  if (mins < 60) {
    return remSec > 0 ? `${mins}p ${remSec}s` : `${mins} phút`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}p`;
};

const ENCOUNTER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  arrived: { label: 'Đã đến phòng khám', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  registered: { label: 'Đã đăng ký tiếp nhận', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  waiting_for_doctor: { label: 'Chờ bác sĩ khám', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'Đang khám lâm sàng', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  awaiting_diagnostics: { label: 'Chờ cận lâm sàng', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  diagnostics_in_progress: { label: 'Đang làm cận lâm sàng', color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  awaiting_review: { label: 'Chờ BS đọc kết quả', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  finished: { label: 'Đã hoàn tất khám', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const MODALITY_LABELS: Record<string, string> = {
  ECG: 'Điện tâm đồ (ECG)',
  LAB: 'Xét nghiệm sinh hóa / huyết học',
  XRAY: 'Chụp X-Quang ngực',
  ECHO: 'Siêu âm tim (Echocardiography)',
  ULTRASOUND: 'Siêu âm',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Tiền mặt tại quầy',
  bank_transfer: 'Chuyển khoản QR Ngân hàng',
  card: 'Thẻ thanh toán',
};

type PresetRange = 'today' | '7days' | '30days' | 'custom';

export const AdminStatisticsView: React.FC = () => {
  const todayStr = toDateInputStr(new Date());
  const sevenDaysAgoStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toDateInputStr(d);
  })();

  const [preset, setPreset] = useState<PresetRange>('7days');
  const [fromDate, setFromDate] = useState<string>(sevenDaysAgoStr);
  const [toDate, setToDate] = useState<string>(todayStr);

  const [dashboard, setDashboard] = useState<DashboardRealtimeResponse | null>(null);
  const [overview, setOverview] = useState<OverviewStatisticsResponse | null>(null);
  const [stagesData, setStagesData] = useState<StagesStatisticsResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRollingUp, setIsRollingUp] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const applyPreset = (p: PresetRange) => {
    setPreset(p);
    const now = new Date();
    const end = toDateInputStr(now);
    if (p === 'today') {
      setFromDate(end);
      setToDate(end);
    } else if (p === '7days') {
      const start = new Date();
      start.setDate(now.getDate() - 6);
      setFromDate(toDateInputStr(start));
      setToDate(end);
    } else if (p === '30days') {
      const start = new Date();
      start.setDate(now.getDate() - 29);
      setFromDate(toDateInputStr(start));
      setToDate(end);
    }
  };

  const fetchStatistics = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [dashRes, overRes, stageRes] = await Promise.all([
        statisticsService.getDashboard().catch((err) => {
          console.warn('Dashboard realtime error:', err);
          return null;
        }),
        statisticsService.getOverview(fromDate, toDate),
        statisticsService.getStages(fromDate, toDate).catch((err) => {
          console.warn('Stages stats error:', err);
          return null;
        }),
      ]);

      if (dashRes) setDashboard(dashRes);
      setOverview(overRes);
      if (stageRes) setStagesData(stageRes);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tải dữ liệu thống kê từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handleRollup = async () => {
    setIsRollingUp(true);
    setToastMsg(null);
    try {
      await statisticsService.rollupRange(fromDate, toDate, 'Admin manual rollup');
      setToastMsg('Đã tổng hợp lại dữ liệu thống kê (Rollup) thành công!');
      await fetchStatistics();
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi khi chạy tổng hợp thống kê.');
    } finally {
      setIsRollingUp(false);
    }
  };

  // Tính toán tổng hàng đợi realtime hôm nay (khớp 100% status trong schema.prisma)
  const receptionWaiting =
    (dashboard?.receptionQueue?.waiting || 0) +
    (dashboard?.receptionQueue?.called || 0) +
    (dashboard?.receptionQueue?.serving || 0);
  const receptionDone = dashboard?.receptionQueue?.done || 0;

  const triageWaiting =
    (dashboard?.triageQueue?.waiting || 0) +
    (dashboard?.triageQueue?.called || 0) +
    (dashboard?.triageQueue?.in_progress || 0);
  const triageDone = dashboard?.triageQueue?.done || 0;

  const doctorQueueActive = (dashboard?.doctorQueue || [])
    .filter((d) => d.status === 'waiting' || d.status === 'called' || d.status === 'in_progress')
    .reduce((sum, d) => sum + d.count, 0);
  const doctorEncounterActive =
    (dashboard?.encountersByStatus?.waiting_for_doctor || 0) +
    (dashboard?.encountersByStatus?.in_progress || 0);
  const doctorWaitingCount = Math.max(doctorQueueActive, doctorEncounterActive);

  const doctorQueueDone = (dashboard?.doctorQueue || [])
    .filter((d) => d.status === 'done')
    .reduce((sum, d) => sum + d.count, 0);
  const doctorDoneCount = Math.max(doctorQueueDone, dashboard?.encountersByStatus?.finished || 0);

  const labActiveCount = (dashboard?.diagnosticBacklog || []).reduce((sum, t) => sum + t.count, 0);

  // Max daily count để vẽ biểu đồ cột
  const maxDailyVolume = Math.max(
    ...(overview?.encounters?.dailyVolume?.map((d) => d.count) || [1]),
    1
  );

  const completionRate =
    overview && overview.encounters.total > 0
      ? Math.round((overview.encounters.finished / overview.encounters.total) * 100)
      : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Thanh điều khiển & Bộ lọc khoảng thời gian */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              SE07 • Báo Cáo & Giám Sát Vận Hành
            </span>
            {dashboard?.generatedAt && (
              <span className="text-[11px] text-slate-400 font-medium">
                Cập nhật lúc: {new Date(dashboard.generatedAt).toLocaleTimeString('vi-VN')}
              </span>
            )}
          </div>
          <h2 className="text-lg font-black text-slate-900">
            Trung Tâm Thống Kê & Phân Tích Lưu Lượng Phòng Khám
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Presets */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => applyPreset('today')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer border-none ${
                preset === 'today' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => applyPreset('7days')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer border-none ${
                preset === '7days' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 ngày qua
            </button>
            <button
              type="button"
              onClick={() => applyPreset('30days')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer border-none ${
                preset === '30days' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 ngày qua
            </button>
          </div>

          {/* Custom Date Inputs */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => {
                setPreset('custom');
                setFromDate(e.target.value);
              }}
              className="bg-transparent font-bold text-slate-700 outline-none border-none text-xs"
            />
            <span className="text-slate-400">→</span>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => {
                setPreset('custom');
                setToDate(e.target.value);
              }}
              className="bg-transparent font-bold text-slate-700 outline-none border-none text-xs"
            />
          </div>

          <button
            type="button"
            onClick={handleRollup}
            disabled={isRollingUp || isLoading}
            title="Tính toán và tổng hợp lại thời gian chờ/xử lý các chặng trong kỳ"
            className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Layers className={`w-3.5 h-3.5 ${isRollingUp ? 'animate-spin' : ''}`} />
            <span>{isRollingUp ? 'Đang tổng hợp...' : 'Rollup số liệu'}</span>
          </button>

          <button
            type="button"
            onClick={fetchStatistics}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-none flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Thông báo lỗi / thành công */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2. GIÁM SÁT HÀNG ĐỢI THỜI GIAN THỰC HÔM NAY (GET /statistics/dashboard) */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-5 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-blue-100">
              Trạng Thái Luồng Khám Thời Gian Thực Hôm Nay ({dashboard?.date || todayStr})
            </h3>
          </div>
          <span className="text-[11px] text-blue-200/80 font-medium">
            Giám sát trực tiếp các chặng hàng đợi trong ngày
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Chặng 1: Quầy Tiếp Tân */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-200">1. Quầy Tiếp Tân</span>
              <Users className="w-4 h-4 text-blue-300" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-2xl font-black text-white">{receptionWaiting}</div>
                <div className="text-[11px] text-blue-200/80">Đang chờ gọi số</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold text-emerald-300">{receptionDone}</div>
                <div className="text-[10px] text-blue-200/70">Đã tiếp nhận</div>
              </div>
            </div>
          </div>

          {/* Chặng 2: Đo Sinh Hiệu & Phân Loại */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-200">2. Đo Sinh Hiệu (Triage)</span>
              <HeartPulse className="w-4 h-4 text-amber-300" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-2xl font-black text-white">{triageWaiting}</div>
                <div className="text-[11px] text-blue-200/80">Chờ / Đang đo SH</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold text-emerald-300">{triageDone}</div>
                <div className="text-[10px] text-blue-200/70">Đã hoàn tất</div>
              </div>
            </div>
          </div>

          {/* Chặng 3: Phòng Khám Bác Sĩ */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-200">3. Phòng Khám Bác Sĩ</span>
              <Stethoscope className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-2xl font-black text-white">{doctorWaitingCount}</div>
                <div className="text-[11px] text-blue-200/80">Chờ / Đang khám</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold text-emerald-300">{doctorDoneCount}</div>
                <div className="text-[10px] text-blue-200/70">Đã khám xong</div>
              </div>
            </div>
          </div>

          {/* Chặng 4: Cận Lâm Sàng & ECG */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-200">4. Cận Lâm Sàng / ECG</span>
              <FlaskConical className="w-4 h-4 text-purple-300" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-2xl font-black text-white">{labActiveCount}</div>
                <div className="text-[11px] text-blue-200/80">Chỉ định đang chờ / xử lý</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold text-amber-300">
                  {dashboard?.encountersByStatus?.awaiting_review || 0}
                </div>
                <div className="text-[10px] text-blue-200/70">Ca chờ BS đọc KQ</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BỐN THẺ KPI TỔNG QUAN TRONG KỲ (GET /statistics/overview) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tổng lượt khám */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Lượt Khám</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {isLoading ? '...' : overview?.encounters.total || 0}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {completionRate}% hoàn tất
            </span>
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Đã kết thúc khám:</span>
            <span className="font-bold text-slate-800">{overview?.encounters.finished || 0} ca</span>
          </div>
        </div>

        {/* KPI 2: Tổng lịch hẹn */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Lịch Hẹn</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {isLoading ? '...' : overview?.appointments.total || 0}
            </span>
            <span className="text-xs font-medium text-slate-400">
              ({overview?.range.days || 1} ngày)
            </span>
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Khám mới / Tái khám:</span>
            <span className="font-bold text-slate-800">
              {(overview?.appointments.byType?.new || 0) + (overview?.appointments.byType?.new_visit || 0)} / {overview?.appointments.byType?.follow_up || 0}
            </span>
          </div>
        </div>

        {/* KPI 3: Doanh thu thực thu */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh Thu Thực Thu</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">
              {isLoading ? '...' : formatVnd(overview?.revenue.total || 0)}
            </span>
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Số giao dịch thành công:</span>
            <span className="font-bold text-slate-800">
              {Object.values(overview?.revenue.byMethod || {}).reduce((s, m) => s + m.count, 0)} GD
            </span>
          </div>
        </div>

        {/* KPI 4: Cận lâm sàng đã thực hiện */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ca Cận Lâm Sàng</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <FlaskConical className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {isLoading ? '...' : overview?.diagnostics.completedTasks || 0}
            </span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              Đã có kết quả
            </span>
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Điện tâm đồ (ECG):</span>
            <span className="font-bold text-slate-800">
              {overview?.diagnostics.byModality?.ECG || 0} ca
            </span>
          </div>
        </div>
      </div>

      {/* 4. BIỂU ĐỒ LƯU LƯỢNG KHÁM THEO NGÀY & CƠ CẤU DOANH THU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái (2/3): Biểu đồ cột lưu lượng lượt khám theo ngày */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Biểu Đồ Lưu Lượng Lượt Khám Theo Ngày</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Số lượng bệnh nhân tiếp nhận từ {fromDate} đến {toDate}
              </p>
            </div>
            <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Tổng: {overview?.encounters.total || 0} lượt
            </span>
          </div>

          {!overview?.encounters.dailyVolume || overview.encounters.dailyVolume.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl">
              Chưa có dữ liệu lượt khám trong khoảng thời gian này
            </div>
          ) : (
            <div className="pt-4">
              <div className="h-52 flex items-end gap-1.5 sm:gap-2.5 overflow-x-auto pb-2 px-1">
                {overview.encounters.dailyVolume.map((item) => {
                  const heightPercent = Math.max(Math.round((item.count / maxDailyVolume) * 100), item.count > 0 ? 12 : 4);
                  const shortDate = item.date.slice(5).replace('-', '/'); // MM/DD
                  return (
                    <div
                      key={item.date}
                      className="flex-1 min-w-[34px] flex flex-col items-center gap-1.5 group"
                      title={`Ngày ${item.date}: ${item.count} lượt khám`}
                    >
                      <span className="text-[10px] font-extrabold text-slate-700 group-hover:text-blue-700 transition-colors">
                        {item.count}
                      </span>
                      <div className="w-full h-36 bg-slate-100 rounded-t-lg flex items-end overflow-hidden p-0.5">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            item.count > 0
                              ? 'bg-gradient-to-t from-blue-700 to-blue-500 group-hover:from-indigo-700 group-hover:to-blue-400'
                              : 'bg-slate-200'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                        {shortDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Phân loại đối tượng bệnh nhân & kênh đặt lịch */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Đặt lịch Online</span>
              <span className="text-sm font-black text-slate-800">
                {(overview?.appointments.byBookingChannel?.patient_web || 0) +
                  (overview?.appointments.byBookingChannel?.online || 0)}{' '}
                lịch
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Đăng ký tại quầy</span>
              <span className="text-sm font-black text-slate-800">
                {(overview?.appointments.byBookingChannel?.receptionist || 0) +
                  (overview?.appointments.byBookingChannel?.walk_in || 0)}{' '}
                lịch
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Khám Dịch vụ / Thường</span>
              <span className="text-sm font-black text-slate-800">
                {overview?.encounters.byPatientType?.standard ||
                  overview?.encounters.byPatientType?.regular ||
                  overview?.encounters.total ||
                  0}{' '}
                ca
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Cấp cứu / Ưu tiên</span>
              <span className="text-sm font-black text-rose-600">
                {(overview?.encounters.byPatientType?.emergency || 0) +
                  (overview?.encounters.byPatientType?.vip || 0) +
                  (overview?.encounters.byPatientType?.elderly || 0)}{' '}
                ca
              </span>
            </div>
          </div>
        </div>

        {/* Cột phải (1/3): Cơ cấu Doanh thu & Kỹ thuật Cận lâm sàng */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Cơ Cấu Doanh Thu Theo Phương Thức</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Phân bổ nguồn thu viện phí & xét nghiệm
              </p>
            </div>

            <div className="space-y-3">
              {['bank_transfer', 'cash'].map((methodKey) => {
                const methodData = overview?.revenue.byMethod?.[methodKey] || { amount: 0, count: 0 };
                const totalRev = overview?.revenue.total || 0;
                const percent = totalRev > 0 ? Math.round((methodData.amount / totalRev) * 100) : 0;
                const isBank = methodKey === 'bank_transfer';

                return (
                  <div key={methodKey} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        {isBank ? (
                          <CreditCard className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Banknote className="w-4 h-4 text-emerald-600" />
                        )}
                        {PAYMENT_METHOD_LABELS[methodKey] || methodKey}
                      </span>
                      <span className="font-extrabold text-slate-900">{formatVnd(methodData.amount)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full rounded-full ${isBank ? 'bg-blue-600' : 'bg-emerald-600'}`}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{methodData.count} giao dịch</span>
                      <span className="font-bold">{percent}% tổng thu</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cận lâm sàng theo Modality */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Cận Lâm Sàng Theo Phân Loại Kỹ Thuật
            </span>
            {Object.keys(overview?.diagnostics.byModality || {}).length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có ca cận lâm sàng hoàn tất trong kỳ.</p>
            ) : (
              <div className="space-y-1.5">
                {Object.entries(overview?.diagnostics.byModality || {}).map(([mod, count]) => (
                  <div
                    key={mod}
                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-purple-50/60 border border-purple-100"
                  >
                    <span className="font-semibold text-slate-700">
                      {MODALITY_LABELS[mod] || mod}
                    </span>
                    <span className="font-black text-purple-700">{count} ca</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. PHÂN BỔ TRẠNG THÁI LƯỢT KHÁM & THỜI GIAN CHỜ TỪNG CHẶNG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bảng phân bổ trạng thái lượt khám */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Phân Bổ Trạng Thái Hồ Sơ Khám (Encounters)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thống kê chi tiết trạng thái các lượt khám trong kỳ báo cáo
            </p>
          </div>

          {Object.keys(overview?.encounters.byStatus || {}).length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              Chưa có lượt khám nào trong khoảng thời gian đã chọn.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(overview?.encounters.byStatus || {}).map(([st, count]) => {
                const meta = ENCOUNTER_STATUS_LABELS[st] || {
                  label: st,
                  color: 'bg-slate-100 text-slate-700 border-slate-200',
                };
                return (
                  <div
                    key={st}
                    className={`p-3 rounded-xl border flex items-center justify-between ${meta.color}`}
                  >
                    <span className="text-xs font-bold">{meta.label}</span>
                    <span className="text-base font-black">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bảng Thời gian chờ / Xử lý trung bình từng chặng (GET /statistics/stages) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Thời Gian Chờ & Thực Hiện Trung Bình Từng Chặng</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Phân tích điểm nghẽn vận hành (SLA & Bottleneck Analysis)
              </p>
            </div>
          </div>

          {!stagesData?.summary || stagesData.summary.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-2 border border-dashed border-slate-200 rounded-xl">
              <p className="text-xs font-bold text-slate-600">
                Chưa có dữ liệu tổng hợp thời gian chặng (Stage Rollup) cho kỳ này
              </p>
              <p className="text-[11px] text-slate-400">
                Nhấn nút <strong>"Rollup số liệu"</strong> ở góc trên để hệ thống tính toán thời gian chờ và xử lý từ lịch sử khám bệnh.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-extrabold">
                    <th className="py-2.5 pr-2">Chặng quy trình</th>
                    <th className="py-2.5 px-2 text-right">Số mẫu</th>
                    <th className="py-2.5 px-2 text-right">TG Chờ TB</th>
                    <th className="py-2.5 pl-2 text-right">TG Xử lý TB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stagesData.summary.map((item) => (
                    <tr key={item.stage} className="hover:bg-slate-50/80">
                      <td className="py-2.5 pr-2 font-bold text-slate-800">
                        {STAGE_LABELS_VI[item.stage] || item.stage}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-600">
                        {item.sampleCount}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-amber-700">
                        {formatDurationSec(item.avgWaitSec)}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-bold text-blue-700">
                        {formatDurationSec(item.avgProcessSec)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

