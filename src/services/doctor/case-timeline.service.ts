import { apiFetch } from '../api';

export type TimelineEventType =
  | 'chief_complaint'
  | 'vital_sign_session'
  | 'clinical_examination'
  | 'test_order'
  | 'lab_result'
  | 'diagnosis'
  | 'treatment_consultation';

export interface LabResultValueItem {
  resultValueId: string;
  labResultId: string;
  parameterId: string;
  valueNumeric?: number | string | null;
  valueText?: string | null;
  isAbnormal: boolean;
  createdAt?: string;
  parameter: {
    parameterId: string;
    testTypeId?: string;
    parameterCode: string;
    parameterName: string | null;
    loincCode?: string | null;
    unit?: string | null;
    dataType?: string | null;
    displayOrder?: number;
  };
}

export interface LabResultAttachmentItem {
  attachmentId: string;
  labResultId: string;
  fileType: string; // 'image' | 'pdf' | 'xray' | 'ct' | 'mri' | 'ultrasound' | 'ecg' | 'raw_export' | 'other'
  fileUrl: string;
  description?: string | null;
  uploadedByUserId?: string;
  uploadedAt: string;
}

export interface EncounterLabResultData {
  orderItemId: string;
  testTypeId: string;
  testName: string;
  category: string;
  orderedAt: string;
  labTaskStatus: string;
  labResult: {
    labResultId: string;
    labTaskId: string;
    enteredByUserId?: string;
    reviewedAt?: string;
    overallConclusion?: string | null;
    resultStatus: 'preliminary' | 'final' | 'corrected' | 'cancelled' | string;
    resultedAt: string;
    createdAt?: string;
    technicianNotes?: string;
    pathologistFindings?: string;
    values: LabResultValueItem[];
    attachments: LabResultAttachmentItem[];
  };
}

export interface TimelineEvent {
  type: TimelineEventType;
  occurredAt: string;
  summary: string;
  data: any;
}

export interface CaseTimelineResponse {
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
  timeline: TimelineEvent[];
}

export const caseTimelineService = {
  /** Lấy dòng thời gian tiến trình bệnh án kèm toàn bộ kết quả cận lâm sàng của 1 ca khám */
  async getTimeline(encounterId: string): Promise<CaseTimelineResponse> {
    return apiFetch<CaseTimelineResponse>(
      `/post-test-consultation/encounters/${encounterId}/timeline`,
      { method: 'GET' }
    );
  },

  /** Kích hoạt AI đánh giá & đề xuất chẩn đoán hậu xét nghiệm */
  async generateAiDiagnosisReview(encounterId: string): Promise<any[]> {
    return apiFetch<any[]>(
      `/post-test-consultation/encounters/${encounterId}/ai-diagnosis-review/generate`,
      { method: 'POST', body: JSON.stringify({}) }
    );
  },

  /** Đọc kết quả đề xuất chẩn đoán AI hậu xét nghiệm */
  async getAiDiagnosisReview(encounterId: string): Promise<any[]> {
    return apiFetch<any[]>(
      `/post-test-consultation/encounters/${encounterId}/ai-diagnosis-review`,
      { method: 'GET' }
    );
  },

  /** Bác sĩ lưu kết luận chẩn đoán chính thức (Final diagnosis) */
  async submitDiagnosisConclusion(
    encounterId: string,
    payload: {
      icd10Code: string;
      diagnosisName?: string;
      isPrimary?: boolean;
      notes?: string;
      clinicalNotes?: string;
      aiSuggestionId?: string;
      aiDecision?: 'accepted' | 'rejected' | 'modified';
      doctorFeedback?: 'accepted' | 'rejected' | 'modified';
      rejectionReason?: string;
    }
  ): Promise<any> {
    const body: Record<string, any> = {
      icd10Code: payload.icd10Code,
      diagnosisName: payload.diagnosisName,
      isPrimary: payload.isPrimary ?? true,
      notes: payload.notes || payload.clinicalNotes,
    };
    if (payload.aiSuggestionId) {
      body.aiSuggestionId = payload.aiSuggestionId;
      body.aiDecision = payload.aiDecision || payload.doctorFeedback || 'accepted';
      if (body.aiDecision === 'rejected') {
        body.rejectionReason = payload.rejectionReason;
      }
    }
    return apiFetch(
      `/post-test-consultation/encounters/${encounterId}/diagnosis-conclusion`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  },

  /** Ghi nhận tư vấn điều trị và đóng lượt khám (finished) */
  async submitTreatmentConsultation(
    encounterId: string,
    payload: {
      conditionExplanation: string;
      treatmentPlan: string;
      lifestyleAdvice?: string;
      nutritionAdvice?: string;
      followUpRequired?: boolean;
      followUpDate?: string;
    }
  ): Promise<any> {
    return apiFetch(
      `/post-test-consultation/encounters/${encounterId}/treatment-consultation`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  },
};
