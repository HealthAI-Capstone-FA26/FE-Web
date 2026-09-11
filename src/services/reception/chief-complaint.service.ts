import { apiFetch } from '../api';

export type ChiefComplaintInputChannel = 'self_kiosk' | 'receptionist_assisted' | 'online_pre_visit';

export interface UpsertChiefComplaintPayload {
  reasonForVisit: string;
  symptoms?: string;
  symptomOnsetDate?: string; // YYYY-MM-DD
  painLevel?: number;        // 0 - 10
  inputChannel: ChiefComplaintInputChannel;
}

export interface ChiefComplaintResponse {
  complaintId: string;
  encounterId: string;
  reasonForVisit: string;
  symptoms?: string;
  symptomOnsetDate?: string;
  painLevel?: number;
  inputChannel: ChiefComplaintInputChannel;
  recordedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export const chiefComplaintService = {
  /**
   * POST /api/v1/encounters/:encounterId/chief-complaint
   * Khai báo hoặc cập nhật lý do khám & triệu chứng cho 1 lượt khám (Encounter)
   */
  async upsert(
    encounterId: string,
    payload: UpsertChiefComplaintPayload
  ): Promise<ChiefComplaintResponse> {
    return apiFetch<ChiefComplaintResponse>(`/encounters/${encounterId}/chief-complaint`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * GET /api/v1/encounters/:encounterId/chief-complaint
   * Lấy thông tin lý do khám & triệu chứng ban đầu của 1 lượt khám
   */
  async getByEncounterId(encounterId: string): Promise<ChiefComplaintResponse> {
    return apiFetch<ChiefComplaintResponse>(`/encounters/${encounterId}/chief-complaint`, {
      method: 'GET',
    });
  },
};
