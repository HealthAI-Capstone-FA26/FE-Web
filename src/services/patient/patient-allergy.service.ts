import { apiFetch } from '../api';

export type AllergyType = 'drug' | 'food' | 'environmental' | 'other';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening';
export type AllergyStatus = 'active' | 'resolved' | 'entered_in_error';

export interface PatientAllergyItem {
  allergyId: string;
  patientId: string;
  encounterId?: string;
  allergyType: AllergyType;
  allergenName: string;
  reactionDescription?: string;
  severity: AllergySeverity;
  status: AllergyStatus;
  recordedByUserId?: string;
  recordedAt: string;
}

export interface CreatePatientAllergyPayload {
  allergyType: AllergyType;
  allergenName: string;
  reactionDescription?: string;
  severity: AllergySeverity;
  encounterId?: string;
}

export const patientAllergyService = {
  // POST /api/v1/patients/:patientId/allergies
  async createAllergy(
    patientId: string,
    payload: CreatePatientAllergyPayload
  ): Promise<PatientAllergyItem> {
    return apiFetch<PatientAllergyItem>(`/patients/${patientId}/allergies`, {
      method: 'POST',
      body: JSON.stringify(payload),
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
