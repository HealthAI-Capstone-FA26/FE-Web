import { useCallback, useEffect, useRef, useState } from 'react';
import type { EcgRecording, EcgRecordingDetail, EcgSignal } from '../types/ecg';
import { EcgUnsupportedFormatError, ecgErrorMessage, ecgService } from '../services/lab/ecg.service';

export type SignalState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; signal: EcgSignal }
  | { kind: 'unsupported'; format: string }
  | { kind: 'error'; message: string };

/** Danh sách bản ghi của task + chi tiết bản ghi đang chọn + tín hiệu đã parse. */
export function useEcgRecording(taskId: string | null) {
  const [recordings, setRecordings] = useState<EcgRecording[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<EcgRecordingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [signalState, setSignalState] = useState<SignalState>({ kind: 'idle' });
  const [signalNonce, setSignalNonce] = useState(0);

  const refreshList = useCallback(async () => {
    if (!taskId) return;
    setListLoading(true);
    setListError(null);
    try {
      const list = await ecgService.listRecordings(taskId);
      const visible = list.filter((r) => r.status !== 'cancelled');
      setRecordings(visible);
      setSelectedId((cur) => (cur && visible.some((r) => r.id === cur) ? cur : visible[0]?.id ?? null));
    } catch (err) {
      setListError(ecgErrorMessage(err, 'load'));
    } finally {
      setListLoading(false);
    }
  }, [taskId]);

  const refreshDetail = useCallback(async (silent = false) => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    if (!silent) setDetailLoading(true);
    try {
      const d = await ecgService.getRecording(selectedId);
      setDetail(d);
      setRecordings((prev) => prev.map((r) => (r.id === d.id ? { ...r, status: d.status, latestAnalysis: d.latestAnalysis } : r)));
    } catch (err) {
      if (!silent) setListError(ecgErrorMessage(err, 'load'));
    } finally {
      if (!silent) setDetailLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    void refreshDetail();
  }, [refreshDetail]);

  // Tải tín hiệu khi đổi bản ghi (không tải lại khi chỉ analysis thay đổi).
  const detailRef = useRef(detail);
  detailRef.current = detail;
  const detailId = detail?.id ?? null;
  useEffect(() => {
    const current = detailRef.current;
    if (!current) return;
    let cancelled = false;
    setSignalState({ kind: 'loading' });
    ecgService
      .loadSignal(current)
      .then((signal) => { if (!cancelled) setSignalState({ kind: 'ready', signal }); })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof EcgUnsupportedFormatError) setSignalState({ kind: 'unsupported', format: err.format });
        else setSignalState({ kind: 'error', message: ecgErrorMessage(err, 'load') });
      });
    return () => {
      cancelled = true;
    };
  }, [detailId, signalNonce]);

  const retrySignal = useCallback(() => setSignalNonce((n) => n + 1), []);

  return {
    recordings,
    listLoading,
    listError,
    selectedId,
    setSelectedId,
    detail,
    setDetail,
    detailLoading,
    signalState,
    refreshList,
    refreshDetail,
    retrySignal,
  };
}
