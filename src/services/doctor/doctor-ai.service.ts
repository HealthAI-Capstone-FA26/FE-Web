import { apiFetch } from '../api';

export interface AiReferenceSource {
  sourceId?: string;
  sourceType: string;
  relevanceNote?: string;
}

export interface AiClinicalSummaryData {
  summaryId?: string;
  encounterId: string;
  modelName?: string;
  modelVersion?: string;
  summaryText: string;
  generatedAt?: string;
  referenceSources?: AiReferenceSource[];
}

export interface AiDiagnosisSuggestionItem {
  suggestionId: string;
  encounterId: string;
  icd10Code: string;
  rank: number;
  confidenceScore: number;
  rationale?: string;
  icd10?: {
    icd10Code: string;
    descriptionEn?: string;
    descriptionVi?: string;
  };
  referenceSources?: AiReferenceSource[];
}

export const doctorAiService = {
  // 1. POST /api/v1/doctor-examination/encounters/:encounterId/ai-clinical-summary/generate
  async generateAiClinicalSummary(
    encounterId: string
  ): Promise<{ encounterId: string; status: string }> {
    return apiFetch<{ encounterId: string; status: string }>(
      `/doctor-examination/encounters/${encounterId}/ai-clinical-summary/generate`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
  },

  // 2. GET /api/v1/doctor-examination/encounters/:encounterId/ai-clinical-summary
  async getAiClinicalSummary(
    encounterId: string
  ): Promise<AiClinicalSummaryData | null> {
    return apiFetch<AiClinicalSummaryData | null>(
      `/doctor-examination/encounters/${encounterId}/ai-clinical-summary`,
      {
        method: 'GET',
      }
    );
  },

  // 3. POST /api/v1/doctor-examination/encounters/:encounterId/ai-diagnosis-suggestions/generate
  async generateAiDiagnosisSuggestions(
    encounterId: string
  ): Promise<AiDiagnosisSuggestionItem[]> {
    return apiFetch<AiDiagnosisSuggestionItem[]>(
      `/doctor-examination/encounters/${encounterId}/ai-diagnosis-suggestions/generate`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
  },

  // 4. GET /api/v1/doctor-examination/encounters/:encounterId/ai-diagnosis-suggestions
  async getAiDiagnosisSuggestions(
    encounterId: string
  ): Promise<AiDiagnosisSuggestionItem[]> {
    return apiFetch<AiDiagnosisSuggestionItem[]>(
      `/doctor-examination/encounters/${encounterId}/ai-diagnosis-suggestions`,
      {
        method: 'GET',
      }
    );
  },
};
