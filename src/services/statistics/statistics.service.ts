import { apiFetch } from '../api';

export interface OverviewStatisticsResponse {
  range: {
    from: string;
    to: string;
    days: number;
  };
  appointments: {
    total: number;
    byStatus: Record<string, number>;
    byBookingChannel: Record<string, number>;
    byType: Record<string, number>;
  };
  encounters: {
    total: number;
    finished: number;
    byStatus: Record<string, number>;
    byPatientType: Record<string, number>;
    dailyVolume: Array<{ date: string; count: number }>;
  };
  revenue: {
    currency: string;
    total: number;
    byMethod: Record<string, { amount: number; count: number }>;
  };
  diagnostics: {
    completedTasks: number;
    byModality: Record<string, number>;
  };
  notifications: Array<{
    channel: string;
    status: string;
    count: number;
  }>;
}

export interface StageSummaryItem {
  stage: string;
  sampleCount: number;
  avgWaitSec: number | null;
  avgProcessSec: number | null;
  p90WaitSecWorstDay: number | null;
  p90ProcessSecWorstDay: number | null;
}

export interface StageDailyItem {
  date: string;
  stage: string;
  serviceId: string | null;
  sampleCount: number;
  avgWaitSec: number | null;
  p90WaitSec: number | null;
  avgProcessSec: number | null;
  p90ProcessSec: number | null;
}

export interface StagesStatisticsResponse {
  range: {
    from: string;
    to: string;
  };
  summary: StageSummaryItem[];
  daily: StageDailyItem[];
}

export interface DashboardRealtimeResponse {
  date: string;
  generatedAt: string;
  receptionQueue: Record<string, number>;
  triageQueue: Record<string, number>;
  doctorQueue: Array<{
    doctorId: string;
    status: string;
    count: number;
  }>;
  diagnosticBacklog: Array<{
    diagnosticRoomId: string | null;
    status: string;
    count: number;
  }>;
  encountersByStatus: Record<string, number>;
  stageTimesToday: Array<{
    stage: string;
    serviceId: string | null;
    sampleCount: number;
    avgWaitSec: number | null;
    p90WaitSec: number | null;
    avgProcessSec: number | null;
    p90ProcessSec: number | null;
  }>;
}

export interface EtaResult {
  stage: string;
  serviceStage: string;
  basis: 'hourly' | 'daily' | 'none';
  sampleCount: number;
  confidence: 'high' | 'medium' | 'low' | 'none';
  avgServiceSec: number | null;
  ahead: number;
  servers: number;
  estimatedWaitSec: number | null;
}

export interface TicketEtaResult extends EtaResult {
  ticketId: string;
  ticketNumber?: number;
  ticketPrefix?: string;
  status: string;
}

export const STAGE_LABELS_VI: Record<string, string> = {
  reception_queue: 'Chờ tiếp đón tại quầy',
  reception_checkin: 'Thủ tục tiếp nhận',
  triage_wait: 'Chờ đo sinh hiệu',
  vitals: 'Đo sinh hiệu & Phân loại',
  doctor_wait: 'Chờ khám bác sĩ',
  consultation: 'Bác sĩ thăm khám',
  payment: 'Thanh toán viện phí',
  diagnostic_wait: 'Chờ cận lâm sàng',
  diagnostic_execution: 'Thực hiện cận lâm sàng / ECG',
  result_review: 'Chờ bác sĩ đọc kết quả',
};

export const statisticsService = {
  /**
   * GET /statistics/dashboard — Dashboard theo dõi luồng khám thời gian thực (hôm nay) — ADMIN
   */
  async getDashboard(): Promise<DashboardRealtimeResponse> {
    return apiFetch<DashboardRealtimeResponse>('/statistics/dashboard', {
      method: 'GET',
    });
  },

  /**
   * GET /statistics/overview?from=YYYY-MM-DD&to=YYYY-MM-DD — Báo cáo tổng quan — ADMIN
   */
  async getOverview(from: string, to: string): Promise<OverviewStatisticsResponse> {
    const params = new URLSearchParams({ from, to });
    return apiFetch<OverviewStatisticsResponse>(`/statistics/overview?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * GET /statistics/stages — Thời gian chờ / xử lý trung bình từng chặng — ADMIN
   */
  async getStages(
    from: string,
    to: string,
    stage?: string,
    serviceId?: string
  ): Promise<StagesStatisticsResponse> {
    const params = new URLSearchParams({ from, to });
    if (stage) params.append('stage', stage);
    if (serviceId) params.append('serviceId', serviceId);
    return apiFetch<StagesStatisticsResponse>(`/statistics/stages?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * GET /statistics/eta — Ước lượng thời gian chờ ở 1 chặng
   */
  async getEta(query: {
    stage: string;
    serviceId?: string;
    ahead?: number;
    servers?: number;
  }): Promise<EtaResult> {
    const params = new URLSearchParams({ stage: query.stage });
    if (query.serviceId) params.append('serviceId', query.serviceId);
    if (query.ahead !== undefined) params.append('ahead', String(query.ahead));
    if (query.servers !== undefined) params.append('servers', String(query.servers));
    return apiFetch<EtaResult>(`/statistics/eta?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * GET /statistics/eta/queue-ticket/:ticketId — Ước lượng thời gian chờ của 1 số thứ tự
   */
  async getTicketEta(ticketId: string): Promise<TicketEtaResult> {
    return apiFetch<TicketEtaResult>(`/statistics/eta/queue-ticket/${ticketId}`, {
      method: 'GET',
    });
  },

  /**
   * POST /statistics/rollup — Tính lại thống kê cho khoảng ngày (backfill / sửa số liệu) — ADMIN
   */
  async rollupRange(from: string, to: string, note?: string): Promise<any> {
    return apiFetch<any>('/statistics/rollup', {
      method: 'POST',
      body: JSON.stringify({ from, to, ...(note ? { note } : {}) }),
    });
  },
};

