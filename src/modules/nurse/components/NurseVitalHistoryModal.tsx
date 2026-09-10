import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  History,
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Badge } from '../../../components/common/Badge';
import {
  vitalService,
  type VitalSignSessionResponse,
  type DetectAlertsResponse,
} from '../../../services/vital/vital.service';
import type { NursePatientRow } from '../../../services/encounter/encounter.service';

interface NurseVitalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientRow: NursePatientRow | null;
}

export const NurseVitalHistoryModal: React.FC<NurseVitalHistoryModalProps> = ({
  isOpen,
  onClose,
  patientRow,
}) => {
  const [sessions, setSessions] = useState<VitalSignSessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [detectingSessionId, setDetectingSessionId] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectAlertsResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!patientRow?.encounterId) return;
    setIsLoading(true);
    setStatusMessage(null);
    setDetectionResult(null);
    try {
      const data = await vitalService.getVitalSessions(patientRow.encounterId);
      setSessions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Lỗi khi tải lịch sử sinh hiệu:', err);
      setStatusMessage(err.message || 'Không thể tải lịch sử sinh hiệu');
    } finally {
      setIsLoading(false);
    }
  }, [patientRow?.encounterId]);

  useEffect(() => {
    if (isOpen && patientRow) {
      fetchHistory();
    }
  }, [isOpen, patientRow, fetchHistory]);

  const handleRunDetectAlerts = async (sessionId: string) => {
    try {
      setDetectingSessionId(sessionId);
      const res = await vitalService.detectAlerts(sessionId);
      setDetectionResult(res);
      // Refresh list to update any isAbnormal badges
      await fetchHistory();
    } catch (err: any) {
      console.error('Lỗi khi chạy detect-alerts:', err);
      setStatusMessage(err.message || 'Không thể chạy lại phát hiện cảnh báo');
    } finally {
      setDetectingSessionId(null);
    }
  };

  if (!patientRow) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Lịch Sử Sinh Hiệu: ${patientRow.name}`}
      subtitle={`Mã ca: ${patientRow.encounterCode} • ${patientRow.departmentName}`}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none transition-colors"
        >
          Đóng
        </button>
      }
    >
      <div className="space-y-4 text-xs">
        {statusMessage && (
          <div className="p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Kết quả Detect Alerts nếu vừa bấm */}
        {detectionResult && (
          <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Kết Quả Chạy Phân Tích Cảnh Báo (AI & Rule-based)
              </span>
              <Badge variant={detectionResult.abnormalCount > 0 ? 'critical' : 'normal'} size="sm">
                {detectionResult.abnormalCount > 0
                  ? `${detectionResult.abnormalCount} Bất thường`
                  : 'Bình thường'}
              </Badge>
            </div>
            <div className="text-[11px] text-indigo-700">
              Tổng số chỉ số kiểm tra: <strong>{detectionResult.totalObservations}</strong>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span>Đang tải lịch sử các phiên đo...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span>Chưa có phiên đo sinh hiệu nào được ghi nhận cho ca này.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, index) => {
              const hasAbnormal = session.observations?.some((o) => o.isAbnormal);

              return (
                <div
                  key={session.vitalSessionId || index}
                  className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-xs">
                        Phiên đo #{sessions.length - index}
                      </span>
                      {index === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200">
                          Mới nhất
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Lần trước
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(session.measuredAt || session.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={hasAbnormal ? 'critical' : 'normal'} size="sm">
                        {hasAbnormal ? 'Cảnh báo bất thường' : 'Chỉ số bình thường'}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => handleRunDetectAlerts(session.vitalSessionId)}
                        disabled={detectingSessionId === session.vitalSessionId}
                        title="Chạy lại phát hiện bất thường AI/Rule"
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {detectingSessionId === session.vitalSessionId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        <span>Quét cảnh báo AI</span>
                      </button>
                    </div>
                  </div>

                  {/* Danh sách quan sát chỉ số */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {session.observations?.map((obs) => (
                      <div
                        key={obs.observationId}
                        className={`p-2 rounded-xl border text-[11px] ${
                          obs.isAbnormal
                            ? 'bg-rose-50 border-rose-200 text-rose-900 font-bold'
                            : 'bg-slate-50 border-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400 font-medium">
                          {obs.item?.itemName || obs.item?.itemCode}
                        </div>
                        <div className="text-xs font-black mt-0.5 flex items-center justify-between">
                          <span>
                            {obs.observationValue} {obs.item?.unit}
                          </span>
                          {obs.isAbnormal && <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
                        </div>
                      </div>
                    ))}
                  </div>

                  {session.notes && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                      <strong className="not-italic text-slate-700 font-bold">Ghi chú:</strong> {session.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
