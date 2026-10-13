import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Activity,
  HeartPulse,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Table,
  Radio,
  User,
  Clock,
  Sparkles,
  Calendar,
  ChevronRight,
  Filter,
  Check,
  X
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { DataTable } from '../../components/common/DataTable';
import { useVitalAlertSocket, type VitalAlertPushPayload, type DetectionResult } from '../../hooks/useVitalAlertSocket';
import { vitalService, type VitalReferenceRangeResponse } from '../../services/vital/vital.service';
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

export const NurseVitalAlertsView: React.FC = () => {
  const [encounters, setEncounters] = useState<EncounterItem[]>([]);
  const [isLoadingEncounters, setIsLoadingEncounters] = useState(false);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'abnormal'>('abnormal');

  // Tra cứu khoảng tham chiếu chuẩn theo độ tuổi
  const [searchPatientId, setSearchPatientId] = useState<string>('');
  const [selectedPatientForRef, setSelectedPatientForRef] = useState<any | null>(null);
  const [referenceRanges, setReferenceRanges] = useState<VitalReferenceRangeResponse[]>([]);
  const [isLoadingRefRanges, setIsLoadingRefRanges] = useState(false);

  // Trạng thái chạy lại detect alerts thủ công
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectResultMsg, setDetectResultMsg] = useState<string | null>(null);

  // Hook kết nối WebSocket Realtime
  const { isConnected, alerts, latestAlert, clearAlerts } = useVitalAlertSocket({
    autoConnect: true,
  });

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
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-600 animate-pulse" />
              Realtime Vital Signs Alert Monitoring
            </span>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-600 animate-pulse' : 'text-amber-500'}`} />
              <span>{isConnected ? 'WebSocket: Đang kết nối trực tiếp (/vital-alerts)' : 'WebSocket: Mất kết nối'}</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Giám Sát Cảnh Báo Sinh Hiệu & Tra Cứu Ngưỡng Tham Chiếu
          </h2>
          <p className="text-xs text-slate-500">
            Tự động lắng nghe cảnh báo vượt ngưỡng nguy kịch từ WebSocket gateway và tra cứu dải tham chiếu chuẩn theo độ tuổi & giới tính.
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
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filterSeverity === 'abnormal'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chỉ bất thường ({enrichedAlertList.filter((a) => a.abnormalCount > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterSeverity('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filterSeverity === 'all'
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
                  Khi điều dưỡng nhập hoặc cập nhật sinh hiệu có giá trị ngoài khoảng tham chiếu nguy hiểm (Huyết áp cao, Nhịp nhanh, SpO2 &lt; 95%), cảnh báo sẽ hiển thị lập tức tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredAlertList.map((alertItem) => {
                  const hasAbnormal = alertItem.abnormalCount > 0;
                  return (
                    <div
                      key={alertItem.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        hasAbnormal
                          ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                              hasAbnormal
                                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {hasAbnormal ? <AlertTriangle className="w-4.5 h-4.5" /> : <Activity className="w-4.5 h-4.5" />}
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                              <span>{alertItem.patientName}</span>
                              <span className="text-[10px] font-bold text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                                {alertItem.encounterCode}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {alertItem.patientAge} tuổi • {alertItem.patientGender} • Nhận lúc:{' '}
                              {new Date(alertItem.receivedAt).toLocaleTimeString('vi-VN')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={hasAbnormal ? 'critical' : 'normal'} size="sm">
                            {hasAbnormal ? `${alertItem.abnormalCount} Bất thường` : 'Bình thường'}
                          </Badge>
                          <button
                            type="button"
                            disabled={isDetecting}
                            onClick={() => handleTriggerDetectAlerts(alertItem.vitalSessionId)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="Chạy lại Orchestrator Detect Alerts"
                          >
                            <RefreshCw className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
                            <span>Detect lại</span>
                          </button>
                        </div>
                      </div>

                      {/* Chi tiết từng chỉ số đo trong phiên */}
                      {alertItem.results && alertItem.results.length > 0 && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Kết quả phân tích ngưỡng ({alertItem.results.length} chỉ số):
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {alertItem.results.map((res, rIdx) => {
                              const isAbn = res.isAbnormal;
                              return (
                                <div
                                  key={rIdx}
                                  className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                                    isAbn
                                      ? 'bg-rose-50/70 border-rose-200 text-rose-900 font-bold'
                                      : 'bg-slate-50 border-slate-200/60 text-slate-700'
                                  }`}
                                >
                                  <div>
                                    <div className="text-[11px] font-extrabold flex items-center gap-1">
                                      {isAbn ? <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" /> : <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                                      <span>Mã chỉ số: {res.itemId.slice(0, 8)}...</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                      Chuẩn: [{res.expectedMin ?? '—'} - {res.expectedMax ?? '—'}] • Nguồn: {res.alertSource}
                                    </div>
                                    {res.reason && (
                                      <div className="text-[10px] text-rose-700 italic mt-0.5">{res.reason}</div>
                                    )}
                                  </div>
                                  <Badge variant={isAbn ? 'critical' : 'normal'} size="sm">
                                    {isAbn ? 'Vượt ngưỡng' : 'Đạt'}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
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
              <label className="block font-bold text-slate-700">Chọn bệnh nhân để tra cứu ngưỡng:</label>
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
                    <div className="font-extrabold text-slate-900">{selectedPatientForRef.fullName}</div>
                    <div className="text-[10px] text-slate-500">
                      Giới tính: {selectedPatientForRef.gender === 'female' ? 'Nữ' : 'Nam'} • Ngày sinh:{' '}
                      {selectedPatientForRef.dateOfBirth ? new Date(selectedPatientForRef.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                    </div>
                  </div>
                </div>
                <Badge variant="normal" size="sm">Đang tra cứu</Badge>
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
                            <div className="text-[10px] text-slate-400 font-mono">{ref.itemCode}</div>
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
                  * Trị số ngoài khoảng này sẽ kích hoạt cờ cảnh báo bất thường tự động tới Điều dưỡng và Bác sĩ.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
