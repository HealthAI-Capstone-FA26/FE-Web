import { apiFetch } from '../api';

export interface LabResultValuePayload {
  parameterId: string;
  valueNumeric?: number | null;
  valueText?: string | null;
}

export interface SubmitLabResultDto {
  values: LabResultValuePayload[];
  overallConclusion?: string;
  resultStatus?: 'preliminary' | 'final' | 'corrected' | 'cancelled';
  resultedAt?: string;
}

export interface UpdateLabResultDto {
  values?: LabResultValuePayload[];
  overallConclusion?: string;
  resultStatus?: 'preliminary' | 'final' | 'corrected' | 'cancelled';
}

export interface LabParameterThresholdItem {
  labThresholdId: string;
  parameterId: string;
  ageMin?: number | null;
  ageMax?: number | null;
  gender?: string | null;
  riskLevel: 'normal' | 'low' | 'medium' | 'high' | 'critical';
  rangeMin?: number | string | null;
  rangeMax?: number | string | null;
  isActive?: boolean;
}

export interface LabResultAlertItem {
  alertId?: string;
  resultValueId?: string;
  encounterId?: string;
  thresholdId?: string | null;
  measuredValue?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  expectedMin?: number | string | null;
  expectedMax?: number | string | null;
  status?: string;
  reason?: string;
}

export interface LabResultValueItem {
  resultValueId: string;
  labResultId: string;
  parameterId: string;
  valueNumeric?: string | number | null;
  valueText?: string | null;
  isAbnormal: boolean;
  parameter?: {
    parameterId: string;
    parameterCode: string;
    parameterName: string;
    unit?: string;
    dataType?: string;
    labParameterThresholds?: LabParameterThresholdItem[];
  };
  labResultAlerts?: LabResultAlertItem[];
}

export interface LabResultAttachmentItem {
  attachmentId: string;
  labResultId: string;
  fileType: 'image' | 'pdf' | 'raw_export' | 'other';
  fileUrl: string;
  description?: string;
  uploadedByUserId: string;
  uploadedAt: string;
}

export interface LabResultDetail {
  labResultId: string;
  labTaskId: string;
  enteredByUserId: string;
  overallConclusion?: string;
  resultStatus: 'preliminary' | 'final' | 'corrected' | 'cancelled';
  resultedAt: string;
  createdAt: string;
  values: LabResultValueItem[];
  attachments?: LabResultAttachmentItem[];
  aiLabAnalyses?: any[];
}

export function resolveAttachmentUrl(fileUrl: string | undefined | null): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
    return fileUrl;
  }
  const baseUrl = (import.meta.env.VITE_UPLOAD_BASE_URL || 'http://localhost:9000/app-uploads').replace(/\/+$/, '');
  const cleanPath = fileUrl.replace(/^\/+/, '');
  return `${baseUrl}/${cleanPath}`;
}

export function normalizeLabResult(r: any): LabResultDetail {
  if (!r) return r;
  const resultId = r.resultId || r.labResultId;
  const taskId = r.taskId || r.labTaskId;
  return {
    ...r,
    labResultId: resultId,
    resultId: resultId,
    labTaskId: taskId,
    taskId: taskId,
    attachments: (r.attachments || []).map((att: any) => ({
      ...att,
      labResultId: att.resultId || att.labResultId || resultId,
      fileUrl: resolveAttachmentUrl(att.fileUrl),
    })),
    values: (r.values || []).map((v: any) => ({
      ...v,
      resultValueId: v.resultValueId || v.valueId,
      labResultId: resultId,
      parameter: v.parameter
        ? {
            ...v.parameter,
            labParameterThresholds: (v.parameter.thresholds || v.parameter.labParameterThresholds || []).map((th: any) => ({
              ...th,
              labThresholdId: th.thresholdId || th.labThresholdId,
            })),
          }
        : undefined,
    })),
  };
}

export const labResultService = {
  /**
   * POST /api/v1/lab-tasks/:id/results
   * Nhập kết quả xét nghiệm cho nhiệm vụ
   */
  async submitLabResult(labTaskId: string, data: SubmitLabResultDto): Promise<LabResultDetail> {
    const raw = await apiFetch<any>(`/lab-tasks/${labTaskId}/results`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeLabResult(raw);
  },

  /**
   * GET /api/v1/lab-tasks/:id/result
   * Lấy kết quả xét nghiệm theo nhiệm vụ
   */
  async getLabResultByTaskId(labTaskId: string): Promise<LabResultDetail> {
    const raw = await apiFetch<any>(`/lab-tasks/${labTaskId}/result`, {
      method: 'GET',
    });
    return normalizeLabResult(raw);
  },

  /**
   * GET /api/v1/lab-results/:id
   * Chi tiết kết quả xét nghiệm
   */
  async getLabResultById(labResultId: string): Promise<LabResultDetail> {
    const raw = await apiFetch<any>(`/lab-results/${labResultId}`, {
      method: 'GET',
    });
    return normalizeLabResult(raw);
  },

  /**
   * PATCH /api/v1/lab-results/:id
   * Cập nhật / Duyệt (final) kết quả xét nghiệm
   */
  async updateLabResult(labResultId: string, data: UpdateLabResultDto): Promise<LabResultDetail> {
    const raw = await apiFetch<any>(`/lab-results/${labResultId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return normalizeLabResult(raw);
  },

  /**
   * POST /api/v1/lab-results/:id/attachments
   * Tải ảnh/tệp đính kèm kết quả
   */
  async uploadAttachment(
    labResultId: string,
    file: File,
    fileType: 'image' | 'pdf' | 'raw_export' | 'other' = 'image',
    description?: string
  ): Promise<LabResultAttachmentItem> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    if (description) {
      formData.append('description', description);
    }

    return apiFetch<LabResultAttachmentItem>(`/lab-results/${labResultId}/attachments`, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * GET /api/v1/lab-results/:id/attachments
   * Danh sách tệp đính kèm của kết quả
   */
  async getAttachments(labResultId: string): Promise<LabResultAttachmentItem[]> {
    return apiFetch<LabResultAttachmentItem[]>(`/lab-results/${labResultId}/attachments`, {
      method: 'GET',
    });
  },

  /**
   * POST /api/v1/lab-results/:id/detect-alerts
   * Kích hoạt và lấy kết quả đối soát ngưỡng bất thường
   */
  async detectAlerts(labResultId: string): Promise<{
    labResultId: string;
    totalValues: number;
    abnormalCount: number;
    results: Array<{
      resultValueId: string;
      isAbnormal: boolean;
      riskLevel: 'low' | 'medium' | 'high' | 'critical' | null;
      expectedMin?: number | null;
      expectedMax?: number | null;
      thresholdId?: string | null;
    }>;
  }> {
    return apiFetch(`/lab-results/${labResultId}/detect-alerts`, {
      method: 'POST',
    });
  },
};
