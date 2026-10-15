import { apiFetch } from '../api';

export type AllergyType = 'drug' | 'food' | 'environmental' | 'other';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening';
export type AllergyStatus = 'active' | 'resolved' | 'entered_in_error';

export interface PatientAllergyItem {
  allergyId: string;
  patientId: string;
  allergyText: string;
  encounterId?: string;
  allergyType?: AllergyType;
  allergenName?: string;
  reactionDescription?: string;
  severity?: AllergySeverity;
  status: AllergyStatus;
  recordedByUserId?: string;
  recordedAt: string;
}

export interface CreatePatientAllergyPayload {
  allergyText?: string;
  allergyType?: AllergyType;
  allergenName?: string;
  reactionDescription?: string;
  severity?: AllergySeverity;
  encounterId?: string;
}

export const patientAllergyService = {
  // POST /api/v1/patients/:patientId/allergies
  async createAllergy(
    patientId: string,
    payload: CreatePatientAllergyPayload
  ): Promise<PatientAllergyItem> {
    // Chuẩn hóa thành allergyText theo format Backend: "[NHÓM] tác_nhân (Mức độ: ..., Phản ứng: ...)"
    let allergyText = payload.allergyText;
    if (!allergyText && payload.allergenName) {
      const typeTag = (payload.allergyType || 'other').toUpperCase();
      const details = [
        payload.severity ? `Mức độ: ${payload.severity}` : null,
        payload.reactionDescription ? `Phản ứng: ${payload.reactionDescription}` : null,
      ].filter(Boolean).join(' - ');

      allergyText = `[${typeTag}] ${payload.allergenName}${details ? ` (${details})` : ''}`;
    }

    return apiFetch<PatientAllergyItem>(`/patients/${patientId}/allergies`, {
      method: 'POST',
      body: JSON.stringify({ allergyText: allergyText || 'Chưa rõ' }),
    });
  },

  // GET /api/v1/patients/:patientId/allergies
  async getAllergies(
    patientId: string,
    status?: string
  ): Promise<PatientAllergyItem[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiFetch<PatientAllergyItem[]>(`/patients/${patientId}/allergies${query}`, {
      method: 'GET',
    });
  },

  // PATCH /api/v1/allergies/:id/status
  async updateStatus(
    allergyId: string,
    status: AllergyStatus
  ): Promise<PatientAllergyItem> {
    return apiFetch<PatientAllergyItem>(`/allergies/${allergyId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
