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

export interface ClinicalExaminationData {
  examinationId: string;
  encounterId: string;
  doctorId: string;
  examinationFindings: string;
  clinicalNotes?: string;
  examinedAt: string;
  createdAt?: string;
  doctor?: {
    doctorId: string;
    fullName: string;
    title?: string;
    specialization?: string;
  };
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

  // 2. GET /api/v1/doctor-examination/encounters/:encounterId/clinical-examination
  async getClinicalExamination(encounterId: string): Promise<ClinicalExaminationData | null> {
    try {
      console.log(`[ClinicalExamService] Đang gọi GET /doctor-examination/encounters/${encounterId}/clinical-examination`);
      const res = await apiFetch<ClinicalExaminationData>(
        `/doctor-examination/encounters/${encounterId}/clinical-examination`,
        {
          method: 'GET',
        }
      );
      console.log(`[ClinicalExamService] Kết quả GET clinical-examination:`, res);
      return res;
    } catch (err: any) {
      // Nếu ca khám chưa có kết quả khám lâm sàng (404), trả về null an toàn
      if (err?.status === 404 || err?.statusCode === 404 || err?.data?.statusCode === 404) {
        console.log(`[ClinicalExamService] Ca khám ${encounterId} chưa có dữ liệu khám (404 Not Found) - trả về null.`);
        return null;
      }
      console.warn('Lỗi khi gọi GET clinical-examination:', err);
      return null;
    }
  },

  // 3. POST /api/v1/doctor-examination/encounters/:encounterId/clinical-examination
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
