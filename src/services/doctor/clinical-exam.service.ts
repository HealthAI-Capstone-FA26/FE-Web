import { apiFetch } from '../api';
import type { AiClinicalSummaryData, AiDiagnosisSuggestionItem } from './doctor-ai.service';

export interface UpsertClinicalExamPayload {
  patientPosition?: string;
  inspectionFindings?: string;
  palpationFindings?: string;
  percussionFindings?: string;
  auscultationFindings?: string;
  examinationFindings?: string; // backwards compatibility fallback
  clinicalNotes?: string;
  examinedAt?: string;
  structured?: any;
}

export interface ClinicalExaminationData {
  examinationId: string;
  encounterId: string;
  doctorId: string;
  patientPosition?: string | null;
  inspectionFindings?: string | null;
  palpationFindings?: string | null;
  percussionFindings?: string | null;
  auscultationFindings?: string | null;
  examinationFindings?: string; // mapped from auscultation or other findings
  clinicalNotes?: string | null;
  structuredFindings?: any;
  examinedAt: string;
  createdAt?: string;
  doctor?: {
    doctorId: string;
    fullName: string;
    title?: string;
    specialization?: string;
  };
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
  clinicalExamination?: ClinicalExaminationData | null;
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
    const data = await apiFetch<CaseOverviewData>(
      `/doctor-examination/encounters/${encounterId}/overview`,
      {
        method: 'GET',
      }
    );
    if (data?.clinicalExamination) {
      const exam = data.clinicalExamination as any;
      if (!exam.examinationFindings) {
        exam.examinationFindings = exam.auscultationFindings || exam.inspectionFindings || '';
      }
    }
    return data;
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
      if (res) {
        const exam = res as any;
        if (!exam.examinationFindings) {
          exam.examinationFindings = exam.auscultationFindings || exam.inspectionFindings || '';
        }
      }
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
    // Tự động map examinationFindings sang auscultationFindings nếu chưa có
    const formattedPayload: any = { ...payload };
    if (!formattedPayload.auscultationFindings && formattedPayload.examinationFindings) {
      formattedPayload.auscultationFindings = formattedPayload.examinationFindings;
    }
    delete formattedPayload.examinationFindings; // Tránh bị whitelist NestJS cảnh báo/lọc

    return apiFetch<any>(
      `/doctor-examination/encounters/${encounterId}/clinical-examination`,
      {
        method: 'POST',
        body: JSON.stringify(formattedPayload),
      }
    );
  },

  // 4. POST /api/v1/doctor-examination/encounters/:encounterId/start
  async startExamination(encounterId: string): Promise<any> {
    return apiFetch<any>(
      `/doctor-examination/encounters/${encounterId}/start`,
      {
        method: 'POST',
      }
    );
  },
};

