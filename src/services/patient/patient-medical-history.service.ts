import { apiFetch } from '../api';

export type MedicalHistoryType =
  | 'chronic_disease'
  | 'surgery'
  | 'family_history'
  | 'cardiac_procedure'
  | 'risk_factor';

export type MedicalHistoryStatus = 'active' | 'resolved' | 'inactive';

export interface CreatePatientMedicalHistoryPayload {
  historyType: MedicalHistoryType;
  conditionName: string;
  onsetDate?: string; // YYYY-MM-DD
  notes?: string;
}

export interface PatientMedicalHistoryItem {
  historyId: string;
  patientId: string;
  historyType: MedicalHistoryType;
  conditionName: string;
  onsetDate?: string | null;
  diagnosedYear?: number | null;
  status: MedicalHistoryStatus;
  notes?: string | null;
  treatmentSummary?: string | null;
  createdAt: string;
  updatedAt: string;
  recordedByDoctor?: {
    doctorId: string;
    fullName: string;
    title?: string;
  } | null;
}

export interface FindMedicalHistoryQuery {
  historyType?: MedicalHistoryType | string;
  status?: MedicalHistoryStatus | string;
}

export const patientMedicalHistoryService = {
  /**
   * GET /patients/:patientId/medical-history
   * Lấy danh sách tiền sử bệnh án dài hạn của bệnh nhân
   */
  async getMedicalHistories(
    patientId: string,
    query?: FindMedicalHistoryQuery
  ): Promise<PatientMedicalHistoryItem[]> {
    const searchParams = new URLSearchParams();
    if (query?.historyType) searchParams.append('historyType', query.historyType);
    if (query?.status) searchParams.append('status', query.status);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiFetch<PatientMedicalHistoryItem[]>(`/patients/${patientId}/medical-history${qs}`, {
      method: 'GET',
    });
  },

  /**
   * POST /patients/:patientId/medical-history
   * Khai báo tiền sử bệnh án mới cho bệnh nhân
   */
  async createMedicalHistory(
    patientId: string,
    payload: CreatePatientMedicalHistoryPayload
  ): Promise<PatientMedicalHistoryItem> {
    return apiFetch<PatientMedicalHistoryItem>(`/patients/${patientId}/medical-history`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * PATCH /medical-history/:id/status
   * Cập nhật trạng thái tiền sử bệnh (active | resolved | inactive)
   */
  async updateStatus(
    historyId: string,
    status: MedicalHistoryStatus
  ): Promise<PatientMedicalHistoryItem> {
    return apiFetch<PatientMedicalHistoryItem>(`/medical-history/${historyId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
