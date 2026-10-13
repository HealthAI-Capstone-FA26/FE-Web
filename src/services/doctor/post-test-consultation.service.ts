import { apiFetch } from '../api';
import type { TimelineEvent } from './case-timeline.service';

export interface ParaclinicalProgress {
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  pendingOrders: number;
  percentCompleted: number;
}

export interface UnresolvedAlerts {
  labAlerts: number;
  ecgAlerts: number;
  total: number;
}

export interface PostTestTimelineResponse {
  encounter: {
    encounterId: string;
    encounterCode: string;
    status: string;
    arrivedAt?: string;
    department?: {
      departmentId: string;
      departmentName: string;
      roomLocation?: string;
    };
    doctor?: {
      doctorId: string;
      fullName: string;
      title?: string;
    };
  };
  patient?: {
    patientId: string;
    patientCode?: string;
    fullName: string;
    dateOfBirth?: string;
    gender?: string;
    phoneNumber?: string;
    identityNumber?: string;
    bloodType?: string;
  };
  allergies?: Array<{
    allergyId: string;
    allergenName: string;
    reaction?: string;
    severity?: string;
    status: string;
  }>;
  medicalHistories?: Array<{
    historyId: string;
    conditionName: string;
    diagnosedYear?: number;
    treatmentSummary?: string;
    status: string;
  }>;
  readyForConclusion: boolean;
  paraclinicalProgress?: ParaclinicalProgress;
  unresolvedAlerts?: UnresolvedAlerts;
  timeline: TimelineEvent[];
}

export interface CreateDiagnosisConclusionDto {
  icd10Code: string;
  diagnosisName?: string;
  isPrimary?: boolean;
  notes?: string;
  diagnosedAt?: string;
}

export interface DiagnosisConclusionItem {
  diagnosisId: string;
  encounterId: string;
  icd10Code: string;
  diagnosisName: string;
  diagnosisType: 'final' | string;
  isPrimary: boolean;
  notes?: string | null;
  diagnosedAt: string;
  createdAt: string;
  doctor?: {
    doctorId: string;
    fullName: string;
    title?: string;
  };
}

export interface UpsertTreatmentConsultationDto {
  conditionExplanation: string;
  treatmentPlan: string;
  lifestyleAdvice?: string;
  nutritionAdvice?: string;
  followUpRequired?: boolean;
  followUpIntervalDays?: number;
  consultedAt?: string;
}

export interface TreatmentConsultationItem {
  consultationId: string;
  encounterId: string;
  conditionExplanation: string;
  treatmentPlan: string;
  lifestyleAdvice?: string | null;
  nutritionAdvice?: string | null;
  followUpRequired: boolean;
  followUpIntervalDays?: number | null;
  consultedAt: string;
  createdAt: string;
  updatedAt: string;
  doctor?: {
    doctorId: string;
    fullName: string;
    title?: string;
  };
}

export const postTestConsultationService = {
  /**
   * Lấy dòng thời gian tiến trình bệnh án tổng hợp (Case Timeline)
   * Trả về cờ `readyForConclusion` = true khi toàn bộ xét nghiệm đã có kết quả
   */
  async getTimeline(encounterId: string): Promise<PostTestTimelineResponse> {
    return apiFetch<PostTestTimelineResponse>(
      `/post-test-consultation/encounters/${encounterId}/timeline`,
      { method: 'GET' }
    );
  },

  /**
   * Bác sĩ ghi nhận 1 chẩn đoán chính thức (diagnosisType = 'final')
   * Chỉ khi lượt khám đang ở trạng thái 'awaiting_review' (đã xong toàn bộ CLS)
   */
  async createDiagnosisConclusion(
    encounterId: string,
    dto: CreateDiagnosisConclusionDto
  ): Promise<DiagnosisConclusionItem> {
    return apiFetch<DiagnosisConclusionItem>(
      `/post-test-consultation/encounters/${encounterId}/diagnosis-conclusion`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    );
  },

  /**
   * Lấy danh sách chẩn đoán chính thức của 1 lượt khám (mặc định chỉ lọc 'final')
   */
  async getDiagnosisConclusions(
    encounterId: string,
    query?: { includeAll?: boolean }
  ): Promise<DiagnosisConclusionItem[]> {
    const qs = query?.includeAll ? '?includeAll=true' : '';
    return apiFetch<DiagnosisConclusionItem[]>(
      `/post-test-consultation/encounters/${encounterId}/diagnosis-conclusion${qs}`,
      { method: 'GET' }
    );
  },

  /**
   * Bác sĩ ghi nhận hoặc cập nhật tư vấn điều trị (Idempotent PUT 1-1 với lượt khám)
   * Yêu cầu lượt khám ở trạng thái 'awaiting_review' và đã có ít nhất 1 chẩn đoán final
   */
  async upsertTreatmentConsultation(
    encounterId: string,
    dto: UpsertTreatmentConsultationDto
  ): Promise<TreatmentConsultationItem> {
    return apiFetch<TreatmentConsultationItem>(
      `/post-test-consultation/encounters/${encounterId}/treatment-consultation`,
      {
        method: 'PUT',
        body: JSON.stringify(dto),
      }
    );
  },

  /**
   * Lấy thông tin tư vấn điều trị của ca khám
   */
  async getTreatmentConsultation(
    encounterId: string
  ): Promise<TreatmentConsultationItem | null> {
    try {
      return await apiFetch<TreatmentConsultationItem>(
        `/post-test-consultation/encounters/${encounterId}/treatment-consultation`,
        { method: 'GET' }
      );
    } catch {
      return null;
    }
  },
};
