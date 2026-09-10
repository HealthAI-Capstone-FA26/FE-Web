import { apiFetch } from '../api';

export interface RecordVitalSignsPayload {
  encounterId: string;
  patientId: string;
  recordedByUserId: string;
  measuredAt?: string;
  notes?: string;
  pulse?: number;
  systolicBp?: number;
  diastolicBp?: number;
  temperature?: number;
  respiratoryRate?: number;
  spo2?: number;
  height?: number;
  weight?: number;
}

export interface UpdateVitalSignsPayload {
  pulse?: number;
  systolicBp?: number;
  diastolicBp?: number;
  temperature?: number;
  respiratoryRate?: number;
  spo2?: number;
  height?: number;
  weight?: number;
  measuredAt?: string;
  notes?: string;
}

export interface VitalSignObservationItem {
  observationId: string;
  itemId: string;
  observationValue: number;
  isAbnormal: boolean;
  item: {
    itemCode: string;
    itemName: string;
    unit: string;
  };
}

export interface VitalSignSessionResponse {
  vitalSessionId: string;
  encounterId: string;
  patientId: string;
  recordedByUserId: string;
  measuredAt: string;
  notes?: string;
  createdAt: string;
  observations: VitalSignObservationItem[];
}

export interface DetectAlertsResponse {
  vitalSessionId: string;
  totalObservations: number;
  abnormalCount: number;
  results: Array<{
    observationId: string;
    itemCode: string;
    isAbnormal: boolean;
    severity?: 'normal' | 'warning' | 'critical';
    source?: string;
    message?: string;
  }>;
}

export const vitalService = {
  /**
   * POST /api/v1/vital-sessions
   * Ghi nhận phiên đo sinh hiệu / thể trạng mới
   */
  async recordVitalSigns(payload: RecordVitalSignsPayload): Promise<VitalSignSessionResponse> {
    return apiFetch<VitalSignSessionResponse>('/vital-sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * GET /api/v1/vital-sessions/latest?encounterId=...
   * Lần đo gần nhất của 1 lượt khám
   */
  async getLatestVitalSession(encounterId: string): Promise<VitalSignSessionResponse | null> {
    try {
      return await apiFetch<VitalSignSessionResponse>(`/vital-sessions/latest?encounterId=${encounterId}`, {
        method: 'GET',
      });
    } catch {
      return null;
    }
  },

  /**
   * GET /api/v1/vital-sessions?encounterId=...&limit=...
   * Lịch sử ghi nhận sinh hiệu của 1 lượt khám
   */
  async getVitalSessions(encounterId: string, limit = 20): Promise<VitalSignSessionResponse[]> {
    return apiFetch<VitalSignSessionResponse[]>(`/vital-sessions?encounterId=${encounterId}&limit=${limit}`, {
      method: 'GET',
    });
  },

  /**
   * GET /api/v1/vital-sessions/:id
   * Chi tiết 1 phiên ghi nhận sinh hiệu
   */
  async getVitalSessionById(vitalSessionId: string): Promise<VitalSignSessionResponse> {
    return apiFetch<VitalSignSessionResponse>(`/vital-sessions/${vitalSessionId}`, {
      method: 'GET',
    });
  },

  /**
   * PATCH /api/v1/vital-sessions/:id
   * Sửa / bổ sung chỉ số cho 1 phiên đã ghi nhận
   */
  async updateVitalSession(
    vitalSessionId: string,
    payload: UpdateVitalSignsPayload,
  ): Promise<VitalSignSessionResponse> {
    return apiFetch<VitalSignSessionResponse>(`/vital-sessions/${vitalSessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * POST /api/v1/vital-sessions/:id/detect-alerts
   * Chạy lại phát hiện bất thường cho 1 phiên đo
   */
  async detectAlerts(vitalSessionId: string): Promise<DetectAlertsResponse> {
    return apiFetch<DetectAlertsResponse>(`/vital-sessions/${vitalSessionId}/detect-alerts`, {
      method: 'POST',
    });
  },
};
