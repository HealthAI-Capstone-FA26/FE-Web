import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { EcgAlertSocketPayload } from '../types/ecg';
import { ecgMockBus, isEcgMockMode } from '../services/lab/ecg.service';

export type EcgSocketState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'mock';

interface UseEcgAlertSocketOptions {
  encounterId?: string | null;
  enabled?: boolean;
  onUpdate?: (payload: EcgAlertSocketPayload) => void;
  /** Gọi khi kết nối được khôi phục sau khi mất — dùng để refetch analyses. */
  onReconnect?: () => void;
}

/**
 * Socket.IO namespace `/lab-alerts`, room `encounter:{encounterId}`, event `ecg-alert-update`.
 * Theo pattern của useVitalAlertSocket (emit `subscribe` với encounterId để BE join room).
 */
export function useEcgAlertSocket({ encounterId, enabled = true, onUpdate, onReconnect }: UseEcgAlertSocketOptions) {
  const [state, setState] = useState<EcgSocketState>('idle');
  const onUpdateRef = useRef(onUpdate);
  const onReconnectRef = useRef(onReconnect);
  onUpdateRef.current = onUpdate;
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    if (!enabled || !encounterId) {
      setState('idle');
      return;
    }

    if (isEcgMockMode()) {
      setState('mock');
      const handler = (e: Event) => {
        const detail = (e as CustomEvent<EcgAlertSocketPayload>).detail;
        onUpdateRef.current?.(detail);
      };
      ecgMockBus.addEventListener('ecg-alert-update', handler);
      return () => ecgMockBus.removeEventListener('ecg-alert-update', handler);
    }

    const rawApiUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    let socketBaseUrl = 'http://localhost:3000';
    try {
      const parsed = new URL(rawApiUrl);
      socketBaseUrl = `${parsed.protocol}//${parsed.host}`;
    } catch {
      // giữ fallback
    }

    setState('connecting');
    const token = localStorage.getItem('access_token');
    const socket: Socket = io(`${socketBaseUrl}/lab-alerts`, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      auth: token ? { token } : undefined,
    });
    let everConnected = false;

    socket.on('connect', () => {
      socket.emit('subscribe', { encounterId, room: `encounter:${encounterId}` });
      setState('connected');
      if (everConnected) onReconnectRef.current?.();
      everConnected = true;
    });
    socket.on('disconnect', () => setState('reconnecting'));
    socket.on('connect_error', () => setState(everConnected ? 'reconnecting' : 'connecting'));
    socket.on('ecg-alert-update', (payload: EcgAlertSocketPayload) => onUpdateRef.current?.(payload));

    return () => {
      socket.emit('unsubscribe', { encounterId, room: `encounter:${encounterId}` });
      socket.disconnect();
    };
  }, [enabled, encounterId]);

  return { state };
}

