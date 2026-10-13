import { apiFetch } from '../api';

export interface CreateInitialDiagnosisDto {
  icd10Code: string;
  diagnosisName?: string;
  diagnosisType?: 'initial' | 'differential';
  isPrimary?: boolean;
  notes?: string;
  diagnosedAt?: string;
}

export interface UpdateInitialDiagnosisDto {
  diagnosisName?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface DiagnosisItem {
  diagnosisId: string;
  encounterId: string;
  icd10Code: string;
  diagnosisName: string;
  diagnosisType: 'initial' | 'differential' | 'final' | string;
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

export const initialDiagnosisService = {
  /**
   * Tạo chẩn đoán ban đầu (initial) hoặc phân biệt (differential) cho ca khám
   * Bắt buộc có trước khi chỉ định cận lâm sàng (SE02)
   */
  async create(
    encounterId: string,
    dto: CreateInitialDiagnosisDto
  ): Promise<DiagnosisItem> {
    return apiFetch<DiagnosisItem>(
      `/doctor-examination/encounters/${encounterId}/diagnoses`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    );
  },

  /**
   * Lấy danh sách chẩn đoán của ca khám
   */
  async getByEncounterId(
    encounterId: string,
    query?: { diagnosisType?: string }
  ): Promise<DiagnosisItem[]> {
    const qs = query?.diagnosisType ? `?diagnosisType=${query.diagnosisType}` : '';
    return apiFetch<DiagnosisItem[]>(
      `/doctor-examination/encounters/${encounterId}/diagnoses${qs}`,
      { method: 'GET' }
    );
  },

  /**
   * Cập nhật chẩn đoán
   */
  async update(
    encounterId: string,
    diagnosisId: string,
    dto: UpdateInitialDiagnosisDto
  ): Promise<DiagnosisItem> {
    return apiFetch<DiagnosisItem>(
      `/doctor-examination/encounters/${encounterId}/diagnoses/${diagnosisId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }
    );
  },

  /**
   * Xóa chẩn đoán sơ bộ
   */
  async remove(encounterId: string, diagnosisId: string): Promise<void> {
    return apiFetch<void>(
      `/doctor-examination/encounters/${encounterId}/diagnoses/${diagnosisId}`,
      { method: 'DELETE' }
    );
  },
};
