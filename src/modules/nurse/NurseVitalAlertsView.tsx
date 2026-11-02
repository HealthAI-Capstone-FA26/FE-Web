import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Table,
  User,
  Clock,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  useVitalAlertSocket,
  type DetectionResult,
} from '../../hooks/useVitalAlertSocket';
import {
  vitalService,
  type VitalReferenceRangeResponse,
  type VitalItemResponse,
} from '../../services/vital/vital.service';
import { encounterService, type EncounterItem } from '../../services/encounter/encounter.service';

interface EnrichedAlertItem {
  id: string;
  encounterId: string;
  encounterCode?: string;
  patientName?: string;
  patientAge?: number | string;
  patientGender?: string;
  vitalSessionId: string;
  totalObservations: number;
  abnormalCount: number;
  results: DetectionResult[];
  receivedAt: string;
}

/**
 * Trích xuất và định dạng kết quả phân tích chỉ số sinh hiệu:
 * Tách tên chỉ số tiếng Việt, giá trị đo, đơn vị, khoảng chuẩn, ghi chú và link tài liệu gốc.
 */
const parseDetectionResult = (
  res: DetectionResult,
  vitalItemsMap: Map<string, VitalItemResponse>
) => {
  const itemInfo = vitalItemsMap.get(res.itemId);
  const rawReason = res.reason || '';

  // 1. Tách URL tài liệu gốc nếu có dạng (https://...)
  let sourceUrl = '';
  let cleanReason = rawReason;
  const urlMatch = rawReason.match(/\((https?:\/\/[^\s)]+)\)/);
  if (urlMatch) {
    sourceUrl = urlMatch[1];
    cleanReason = rawReason.replace(urlMatch[0], '').trim();
  }

  // 2. Tách tên nguồn: "Nguồn: NEWS2 - Royal College..."
  let sourceText = '';
  const sourceMatch = cleanReason.match(/Nguồn:\s*(.+?)(?:\.|$)/i);
  if (sourceMatch) {
    sourceText = sourceMatch[1].trim();
    cleanReason = cleanReason.replace(sourceMatch[0], '').trim();
  }

  // 3. Tách cấu trúc "<Tên chỉ số> đo được <giá trị> <đơn vị>, <lý do>"
  const mainMatch = cleanReason.match(/^(.*?)\s+đo được\s+([0-9.]+)\s*([^\s,]*)(?:,\s*(.*))?$/i);

  const displayName = itemInfo?.itemName || mainMatch?.[1]?.trim() || 'Chỉ số sinh hiệu';
  const displayValue = mainMatch?.[2]?.trim() || '';
  const displayUnit = itemInfo?.unit || mainMatch?.[3]?.trim() || '';
  const clinicalNote = mainMatch?.[4]?.replace(/[.-]/g, '').trim() || cleanReason;

  const expectedRange =
    res.expectedMin !== null && res.expectedMax !== null
      ? `${res.expectedMin} - ${res.expectedMax} ${displayUnit}`
      : res.expectedMin !== null
        ? `≥ ${res.expectedMin} ${displayUnit}`
        : res.expectedMax !== null
          ? `≤ ${res.expectedMax} ${displayUnit}`
          : null;

  return {
    displayName,
    displayValue,
    displayUnit,
    expectedRange,
    clinicalNote,
    sourceText,
    sourceUrl,
  };
};

export const NurseVitalAlertsView: React.FC = () => {
  const [encounters, setEncounters] = useState<EncounterItem[]>([]);
  const [isLoadingEncounters, setIsLoadingEncounters] = useState(false);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'abnormal'>('abnormal');

  // Danh mục chỉ số sinh hiệu để hiển thị tên thân thiện thay vì UUID
  const [vitalItemsMap, setVitalItemsMap] = useState<Map<string, VitalItemResponse>>(new Map());

  // Trạng thái thu gọn/mở rộng nhóm chỉ số bình thường của từng ca khám
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});
  const toggleExpand = (id: string) => {
    setExpandedAlerts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Tra cứu khoảng tham chiếu chuẩn theo độ tuổi
  const [searchPatientId, setSearchPatientId] = useState<string>('');
  const [selectedPatientForRef, setSelectedPatientForRef] = useState<any | null>(null);
  const [referenceRanges, setReferenceRanges] = useState<VitalReferenceRangeResponse[]>([]);
  const [isLoadingRefRanges, setIsLoadingRefRanges] = useState(false);

  // Trạng thái chạy lại detect alerts thủ công
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectResultMsg, setDetectResultMsg] = useState<string | null>(null);

  // Hook kết nối WebSocket Realtime
  const { isConnected, alerts, clearAlerts, subscribeEncounter } = useVitalAlertSocket({
    autoConnect: true,
  });

  // Tải danh mục chỉ số sinh hiệu active để map tên chỉ số
  useEffect(() => {
    vitalService
      .getVitalItems()
      .then((items) => {
        const map = new Map<string, VitalItemResponse>();
        items.forEach((item) => map.set(item.itemId, item));
        setVitalItemsMap(map);
      })
      .catch((err) => console.warn('Lỗi tải danh mục chỉ số:', err));
  }, []);

  // Tải danh sách ca khám thực tế để ánh xạ tên bệnh nhân & chọn tra cứu
  const fetchEncounters = async () => {
    try {
      setIsLoadingEncounters(true);
      const data = await encounterService.getEncounters();
      if (Array.isArray(data)) {
        setEncounters(data);
        if (data.length > 0 && !selectedEncounterId) {
          setSelectedEncounterId(data[0].encounterId);
          if (data[0].patient?.patientId) {
            setSearchPatientId(data[0].patient.patientId);
            setSelectedPatientForRef(data[0].patient);
          }
        }
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách ca khám:', err);
    } finally {
      setIsLoadingEncounters(false);
    }
  };

  useEffect(() => {
    fetchEncounters();
  }, []);

  // Tự động subscribe vào các encounter để nhận cảnh báo realtime từ backend
  useEffect(() => {
    if (isConnected && encounters.length > 0) {
      encounters.forEach((enc) => {
        if (enc.encounterId) {
          subscribeEncounter(enc.encounterId);
        }
      });
    }
  }, [isConnected, encounters, subscribeEncounter]);

  // Khi chọn bệnh nhân để tra cứu dải tham chiếu
  useEffect(() => {
    if (!searchPatientId) {
      setReferenceRanges([]);
      return;
    }
    setIsLoadingRefRanges(true);
    vitalService
      .getVitalReferenceRanges(searchPatientId)
      .then((data) => setReferenceRanges(data))
      .catch((err) => {
        console.warn('Lỗi tra cứu khoảng tham chiếu:', err);
        setReferenceRanges([]);
      })
      .finally(() => setIsLoadingRefRanges(false));
  }, [searchPatientId]);

  // Ánh xạ danh sách alert từ WebSocket với thông tin ca khám thực tế
  const enrichedAlertList = useMemo<EnrichedAlertItem[]>(() => {
    return alerts.map((al, idx) => {
      const matchEnc = encounters.find((e) => e.encounterId === al.encounterId);
      const pat = matchEnc?.patient;

      let age: number | string = '—';
      if (pat?.dateOfBirth) {
        const birth = new Date(pat.dateOfBirth);
        const diff = Date.now() - birth.getTime();
        age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      }

      return {
        id: `${al.vitalSessionId}-${idx}`,
        encounterId: al.encounterId,
        encounterCode: matchEnc?.encounterCode || al.encounterId.slice(0, 8),
        patientName: pat?.fullName || 'Bệnh nhân',
        patientAge: age,
        patientGender: pat?.gender === 'female' ? 'Nữ' : 'Nam',
        vitalSessionId: al.vitalSessionId,
        totalObservations: al.totalObservations,
        abnormalCount: al.abnormalCount,
        results: al.results || [],
        receivedAt: al.receivedAt || new Date().toISOString(),
      };
    });
  }, [alerts, encounters]);

  // Lọc theo mức độ
  const filteredAlertList = useMemo(() => {
    if (filterSeverity === 'abnormal') {
      return enrichedAlertList.filter((a) => a.abnormalCount > 0);
    }
    return enrichedAlertList;
  }, [enrichedAlertList, filterSeverity]);

  // Bấm nút chạy lại phát hiện bất thường cho phiên sinh hiệu
  const handleTriggerDetectAlerts = async (sessionId: string) => {
    if (!sessionId) return;
    setIsDetecting(true);
    setDetectResultMsg(null);
    try {
      const res = await vitalService.detectAlerts(sessionId);
      setDetectResultMsg(
        `Đã hoàn tất phân tích lại: ${res.abnormalCount}/${res.totalObservations} chỉ số bất thường được ghi nhận!`
      );
      setTimeout(() => setDetectResultMsg(null), 4000);
    } catch (err: any) {
      setDetectResultMsg(err?.message || 'Lỗi khi kích hoạt phát hiện bất thường.');
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">

          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Giám Sát Cảnh Báo Sinh Hiệu & Tra Cứu Ngưỡng Tham Chiếu
          </h2>
          <p className="text-xs text-slate-500">
            Tự động lắng nghe cảnh báo vượt ngưỡng nguy kịch và tra cứu dải
            tham chiếu chuẩn theo độ tuổi & giới tính.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <button
              type="button"
              onClick={clearAlerts}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
            >
              Xóa lịch sử cảnh báo ({alerts.length})
            </button>
          )}
          <button
            type="button"
            onClick={fetchEncounters}
            disabled={isLoadingEncounters}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer border-none transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEncounters ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: Luồng Cảnh Báo Sinh Hiệu Realtime (7 Cột) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Danh Sách Cảnh Báo Bất Thường Realtime
                </h3>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterSeverity('abnormal')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filterSeverity === 'abnormal'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Chỉ bất thường ({enrichedAlertList.filter((a) => a.abnormalCount > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterSeverity('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filterSeverity === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Tất cả ({enrichedAlertList.length})
                </button>
              </div>
            </div>

            {/* Thông báo kết quả phát hiện thủ công */}
            {detectResultMsg && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-bold text-blue-900 flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{detectResultMsg}</span>
              </div>
            )}

            {/* Danh sách Alert */}
            {filteredAlertList.length === 0 ? (
              <div className="p-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <ShieldAlert className="w-10 h-10 mx-auto text-slate-300" />
                <div className="text-xs font-bold text-slate-600">
                  {filterSeverity === 'abnormal'
                    ? 'Chưa ghi nhận cảnh báo bất thường nào từ hệ thống Socket.IO.'
                    : 'Chưa có dữ liệu phiên sinh hiệu được đẩy qua WebSocket.'}
                </div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Khi điều dưỡng nhập hoặc cập nhật sinh hiệu có giá trị ngoài khoảng tham chiếu nguy
                  hiểm (Huyết áp cao, Nhịp nhanh, SpO2 &lt; 95%), cảnh báo sẽ hiển thị lập tức tại
                  đây.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1">
                {filteredAlertList.map((alertItem) => {
                  const hasAbnormal = alertItem.abnormalCount > 0;
                  const abnormalResults = alertItem.results.filter((r) => r.isAbnormal);
                  const normalResults = alertItem.results.filter((r) => !r.isAbnormal);
                  const isExpanded = expandedAlerts[alertItem.id] ?? false;

                  return (
                    <div
                      key={alertItem.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3.5 ${hasAbnormal
                        ? 'bg-rose-50/30 border-rose-200 hover:border-rose-400 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200'
                        }`}
                    >
                      {/* Header bệnh nhân */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${hasAbnormal
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                              : 'bg-slate-200 text-slate-700'
                              }`}
                          >
                            {hasAbnormal ? (
                              <AlertTriangle className="w-5 h-5" />
                            ) : (
                              <Activity className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <span>{alertItem.patientName}</span>
                              <span className="text-[10px] font-bold text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {alertItem.encounterCode}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>
                                {alertItem.patientAge} tuổi • {alertItem.patientGender}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-slate-400">
                                <Clock className="w-3 h-3" />
                                {new Date(alertItem.receivedAt).toLocaleTimeString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${hasAbnormal
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-emerald-600 text-white'
                              }`}
                          >
                            {hasAbnormal ? `${alertItem.abnormalCount} Bất thường` : 'Bình thường'}
                          </span>
                          <button
                            type="button"
                            disabled={isDetecting}
                            onClick={() => handleTriggerDetectAlerts(alertItem.vitalSessionId)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="Chạy lại phân tích ngưỡng"
                          >
                            <RefreshCw className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
                            <span>Detect lại</span>
                          </button>
                        </div>
                      </div>

                      {/* 1. Nhóm chỉ số VƯỢT NGƯỠNG (Bất thường) */}
                      {abnormalResults.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-700">
                            <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                            <span>Chỉ số vượt ngưỡng nguy kịch ({abnormalResults.length}):</span>
                          </div>

                          <div className="grid grid-cols-1 gap-2.5">
                            {abnormalResults.map((res, rIdx) => {
                              const parsed = parseDetectionResult(res, vitalItemsMap);
                              return (
                                <div
                                  key={rIdx}
                                  className="p-3.5 bg-rose-50/90 border border-rose-300 rounded-2xl shadow-xs space-y-2 hover:border-rose-400 transition-all"
                                >
                                  {/* Tên chỉ số & Badge Vượt ngưỡng */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                                      <span className="text-xs font-black text-rose-950 uppercase tracking-wide">
                                        {parsed.displayName}
                                      </span>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                                      Vượt ngưỡng
                                    </span>
                                  </div>

                                  {/* Trị số đo thực tế & Khoảng chuẩn */}
                                  <div className="flex flex-wrap items-baseline gap-3 pt-0.5">
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-xs text-rose-800 font-bold">
                                        Thực tế:
                                      </span>
                                      <span className="text-xl font-black text-rose-600 font-mono">
                                        {parsed.displayValue || 'Bất thường'}
                                      </span>
                                      <span className="text-xs text-rose-800 font-bold">
                                        {parsed.displayUnit}
                                      </span>
                                    </div>

                                    {parsed.expectedRange && (
                                      <div className="flex items-center gap-1 text-[11px] bg-white/90 px-2.5 py-0.5 rounded-lg border border-rose-200 text-rose-900 font-bold">
                                        <span className="text-slate-500 font-medium">
                                          Khoảng chuẩn:
                                        </span>
                                        <span className="font-mono">{parsed.expectedRange}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Diễn giải lâm sàng & Nguồn tham chiếu */}
                                  {(parsed.clinicalNote || parsed.sourceText) && (
                                    <div className="text-[11px] text-rose-950 bg-white/70 p-2.5 rounded-xl border border-rose-200/80 space-y-1">
                                      {parsed.clinicalNote && (
                                        <p className="font-semibold leading-relaxed">
                                          {parsed.clinicalNote}
                                        </p>
                                      )}
                                      {parsed.sourceText && (
                                        <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 font-medium pt-1 border-t border-rose-100">
                                          <span className="truncate">
                                            Căn cứ: {parsed.sourceText}
                                          </span>
                                          {parsed.sourceUrl && (
                                            <a
                                              href={parsed.sourceUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-bold shrink-0"
                                            >
                                              <span>Tài liệu gốc</span>
                                              <ExternalLink className="w-3 h-3" />
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2. Nhóm chỉ số ĐẠT / BÌNH THƯỜNG (Thu gọn / Mở rộng) */}
                      {normalResults.length > 0 && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => toggleExpand(alertItem.id)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>
                                {isExpanded ? 'Thu gọn' : 'Xem'} {normalResults.length} chỉ số bình
                                thường (đạt chuẩn)
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-1 animate-in fade-in duration-200">
                              {normalResults.map((res, rIdx) => {
                                const parsed = parseDetectionResult(res, vitalItemsMap);
                                return (
                                  <div
                                    key={rIdx}
                                    className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 text-xs"
                                  >
                                    <div className="min-w-0">
                                      <div className="font-extrabold text-slate-800 truncate text-[11px]">
                                        {parsed.displayName}
                                      </div>
                                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                        <span className="font-mono font-bold text-emerald-700">
                                          {parsed.displayValue
                                            ? `${parsed.displayValue} ${parsed.displayUnit}`
                                            : 'Đạt'}
                                        </span>
                                        {parsed.expectedRange && (
                                          <span className="text-slate-400 font-mono">
                                            ({parsed.expectedRange})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0 flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span>Đạt</span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cột Phải: Tra Cứu Khoảng Tham Chiếu Chuẩn Theo Độ Tuổi & Giới Tính (5 Cột) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Table className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Dải Tham Chiếu Sinh Hiệu Chuẩn (API)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Áp dụng theo độ tuổi và giới tính của từng bệnh nhân
                </p>
              </div>
            </div>

            {/* Chọn bệnh nhân từ hàng đợi */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-700">
                Chọn bệnh nhân để tra cứu ngưỡng:
              </label>
              <select
                value={searchPatientId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setSearchPatientId(pid);
                  const matched = encounters.find((enc) => enc.patient?.patientId === pid);
                  setSelectedPatientForRef(matched?.patient || null);
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-blue-600 bg-white"
              >
                <option value="">-- Chọn bệnh nhân trong hàng đợi --</option>
                {encounters.map((enc) => (
                  <option key={enc.encounterId} value={enc.patient?.patientId || ''}>
                    {enc.patient?.fullName || 'Bệnh nhân'} ({enc.encounterCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Thẻ bệnh nhân đang tra cứu */}
            {selectedPatientForRef && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900">
                      {selectedPatientForRef.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Giới tính: {selectedPatientForRef.gender === 'female' ? 'Nữ' : 'Nam'} • Ngày
                      sinh:{' '}
                      {selectedPatientForRef.dateOfBirth
                        ? new Date(selectedPatientForRef.dateOfBirth).toLocaleDateString('vi-VN')
                        : 'Chưa rõ'}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  Đang tra cứu
                </span>
              </div>
            )}

            {/* Bảng kết quả dải tham chiếu */}
            {isLoadingRefRanges ? (
              <div className="p-8 text-center space-y-2 text-slate-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600" />
                <span>Đang tải dải tham chiếu chuẩn theo độ tuổi...</span>
              </div>
            ) : referenceRanges.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Vui lòng chọn một bệnh nhân từ danh sách để tải khoảng tham chiếu chuẩn.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                  <span>Khoảng bình thường ({referenceRanges.length} chỉ số):</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                    Chuẩn Bộ Y Tế & CDC
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Chỉ số</th>
                        <th className="py-2.5 px-3 text-center">Khoảng Bình Thường</th>
                        <th className="py-2.5 px-3">Đơn vị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {referenceRanges.map((ref) => (
                        <tr key={ref.itemCode} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 text-slate-800 font-bold">
                            <div>{ref.itemName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {ref.itemCode}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-extrabold text-emerald-700 bg-emerald-50/40">
                            {ref.minNormal} - {ref.maxNormal}
                          </td>
                          <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                            {ref.unit || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-slate-400 italic pt-1">
                  * Trị số ngoài khoảng này sẽ kích hoạt cờ cảnh báo bất thường tự động tới Điều
                  dưỡng và Bác sĩ.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
