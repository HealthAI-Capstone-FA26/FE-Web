import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface DetectionResult {
  observationId: string;
  itemId: string;
  isAbnormal: boolean;
  alertLevel: 'critical' | null;
  alertSource: 'rule' | 'ai';
  thresholdId: string | null;
  expectedMin: number | null;
  expectedMax: number | null;
  reason?: string;
}

export interface VitalAlertPushPayload {
  vitalSessionId: string;
  encounterId: string;
  totalObservations: number;
  abnormalCount: number;
  results: DetectionResult[];
  receivedAt?: string;
}

interface UseVitalAlertSocketOptions {
  encounterId?: string;
  autoConnect?: boolean;
  onAlert?: (payload: VitalAlertPushPayload) => void;
}

export function useVitalAlertSocket(options: UseVitalAlertSocketOptions = {}) {
  const { encounterId, autoConnect = true, onAlert } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<VitalAlertPushPayload[]>([]);
  const [latestAlert, setLatestAlert] = useState<VitalAlertPushPayload | null>(null);

  // Khởi tạo và kết nối Socket.IO
  useEffect(() => {
    if (!autoConnect) return;

    // Lấy host backend từ env hoặc fallback localhost:3000
    const rawApiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1';
    let socketBaseUrl = 'http://localhost:3000';
    try {
      const parsed = new URL(rawApiUrl);
      socketBaseUrl = `${parsed.protocol}//${parsed.host}`;
    } catch {
      // Fallback
    }

    const socketUrl = `${socketBaseUrl}/vital-alerts`;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Nếu đã có encounterId thì subscribe phòng ngay
      if (encounterId) {
        socket.emit('subscribe', { encounterId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('vital-alert-update', (payload: VitalAlertPushPayload) => {
      const enrichedPayload: VitalAlertPushPayload = {
        ...payload,
        receivedAt: new Date().toISOString(),
      };

      setLatestAlert(enrichedPayload);
      setAlerts((prev) => [enrichedPayload, ...prev.slice(0, 49)]);

      if (onAlert) {
        onAlert(enrichedPayload);
      }
    });

    return () => {
      if (encounterId) {
        socket.emit('unsubscribe', { encounterId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, encounterId, onAlert]);

  // Subscribe vào 1 encounterId cụ thể
  const subscribeEncounter = useCallback((encId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('subscribe', { encounterId: encId });
    }
  }, []);

  // Rời khỏi phòng theo dõi 1 encounterId
  const unsubscribeEncounter = useCallback((encId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('unsubscribe', { encounterId: encId });
    }
  }, []);

  // Xoá danh sách cảnh báo đã đọc
  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setLatestAlert(null);
  }, []);

  return {
    isConnected,
    alerts,
    latestAlert,
    subscribeEncounter,
    unsubscribeEncounter,
    clearAlerts,
  };
}
