import { apiFetch } from '../api';
import type { AiClinicalSummaryData, AiDiagnosisSuggestionItem } from './doctor-ai.service';

export interface UpsertClinicalExamPayload {
  examinationFindings?: string;
  clinicalNotes?: string;
  examinedAt?: string;
}

export interface CaseOverviewData {
  encounter: {
    encounterId: string;
    status: string;
    arrivedAt?: string;
    department?: any;
    doctor?: any;
  };
  patient: {
    patientId: string;
    patientCode?: string;
    fullName: string;
    gender: 'male' | 'female' | 'other' | string;
    dateOfBirth?: string;
    phoneNumber?: string;
    identityNumber?: string;
    bloodType?: string;
  };
  chiefComplaint?: {
    reasonForVisit?: string;
    symptoms?: string;
    recordedAt?: string;
  };
  clinicalExamination?: {
    examinationFindings?: string;
    clinicalNotes?: string;
    examinedAt?: string;
  };
  latestVitalSession?: {
    sessionId: string;
    measuredAt?: string;
    observations?: Array<{
      observationValue?: string | number;
      item?: {
        itemCode: string;
        itemName: string;
        unit?: string;
      };
    }>;
  };
  allergies?: Array<{
    allergyId: string;
    allergyType: 'drug' | 'food' | 'environmental' | 'other' | string;
    allergenName: string;
    severity: 'mild' | 'moderate' | 'severe' | 'life_threatening' | string;
    reactionDescription?: string;
    status: string;
  }>;
  medicalHistories?: Array<{
    historyId: string;
    conditionName: string;
    diagnosedYear?: number;
    status: string;
    notes?: string;
  }>;
  aiClinicalSummary?: AiClinicalSummaryData | null;
  imagingHistory?: any[];
  aiDiagnosisSuggestions?: AiDiagnosisSuggestionItem[];
}

export const clinicalExamService = {
  // 1. GET /api/v1/doctor-examination/encounters/:encounterId/overview
  async getCaseOverview(encounterId: string): Promise<CaseOverviewData> {
    return apiFetch<CaseOverviewData>(
      `/doctor-examination/encounters/${encounterId}/overview`,
      {
        method: 'GET',
      }
    );
  },

  // 2. POST /api/v1/doctor-examination/encounters/:encounterId/clinical-examination
  async upsertClinicalExamination(
    encounterId: string,
    payload: UpsertClinicalExamPayload
  ): Promise<any> {
    return apiFetch<any>(
      `/doctor-examination/encounters/${encounterId}/clinical-examination`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },
};
