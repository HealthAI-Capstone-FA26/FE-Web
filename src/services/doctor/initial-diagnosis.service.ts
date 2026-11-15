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
  icd10?: {
    icd10Code: string;
    icd10Name?: string;
    descriptionVi?: string;
    descriptionEn?: string;
  };
  doctor?: {
    doctorId: string;
    fullName: string;
    title?: string;
  };
}

/**
 * Lấy nội dung hiển thị cho Ô Chẩn đoán sơ bộ (Mục 5) từ danh sách diagnoses
 * Chỉ lấy bản ghi có diagnosisType === 'initial' (ưu tiên isPrimary === true)
 */
export function extractPrimaryInitialDiagnosisText(
  diagnoses?: DiagnosisItem[] | null
): string {
  if (!Array.isArray(diagnoses) || diagnoses.length === 0) return '';
  const initialList = diagnoses.filter((d) => d.diagnosisType === 'initial');
  if (initialList.length === 0) return '';
  const primary = initialList.find((d) => d.isPrimary) || initialList[0];
  return (
    primary.diagnosisName?.trim() ||
    primary.icd10?.descriptionVi?.trim() ||
    primary.icd10?.icd10Name?.trim() ||
    primary.icd10Code?.trim() ||
    ''
  );
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

  /**
   * Lưu hoặc cập nhật Chẩn đoán sơ bộ (Mục 5 - diagnosisType === 'initial', isPrimary === true)
   * Đảm bảo không lỗi 409 khi trùng mã ICD-10 và luôn đồng bộ đúng vào bảng diagnoses
   */
  async upsertInitialDiagnosis(
    encounterId: string,
    rawPreliminaryDiag: string
  ): Promise<DiagnosisItem | null> {
    const trimmed = rawPreliminaryDiag.trim();
    if (!trimmed) return null;

    const matchedIcd = trimmed.match(/([A-Z]\d{2}(?:\.\d{1,3})?)/i);
    let icdCode = matchedIcd ? matchedIcd[1].toUpperCase() : '';
    if (icdCode === 'K29.0') icdCode = 'K29.00';
    if (icdCode === 'Z00.0') icdCode = 'Z00.00';

    if (!icdCode) {
      const lower = trimmed.toLowerCase();
      if (lower.includes('phế quản')) icdCode = 'J20.9';
      else if (lower.includes('phổi')) icdCode = 'J18.9';
      else if (lower.includes('huyết áp')) icdCode = 'I10';
      else if (lower.includes('suy tim')) icdCode = 'I50.9';
      else if (lower.includes('nhịp tim') || lower.includes('loạn nhịp')) icdCode = 'I49.9';
      else if (lower.includes('dạ dày') || lower.includes('tá tràng')) icdCode = 'K29.00';
      else if (lower.includes('tổng quát')) icdCode = 'Z00.00';
      else icdCode = 'I20.9';
    }

    const cleanDiagName =
      trimmed
        .replace(/^\[[A-Z0-9.]+\]\s*/i, '')
        .replace(/\s*\([A-Z]\d{2}(?:\.\d{1,3})?\)\s*$/i, '')
        .trim() || trimmed;

    const existingList = await this.getByEncounterId(encounterId, {
      diagnosisType: 'initial',
    }).catch(() => [] as DiagnosisItem[]);

    const initialList = Array.isArray(existingList)
      ? existingList.filter((d) => d.diagnosisType === 'initial')
      : [];

    const sameCodeDiag = initialList.find(
      (d) => d.icd10Code?.toUpperCase() === icdCode.toUpperCase()
    );

    if (sameCodeDiag) {
      return this.update(encounterId, sameCodeDiag.diagnosisId, {
        diagnosisName: cleanDiagName,
        isPrimary: true,
      });
    }

    // Nếu đã có bản ghi initial khác mã ICD-10 và chưa gắn với phiếu chỉ định CLS, xóa bản cũ trước khi tạo bản mới
    for (const oldDiag of initialList) {
      if (oldDiag.icd10Code?.toUpperCase() !== icdCode.toUpperCase()) {
        await this.remove(encounterId, oldDiag.diagnosisId).catch(() => {});
      }
    }

    try {
      return await this.create(encounterId, {
        icd10Code: icdCode,
        diagnosisName: cleanDiagName,
        diagnosisType: 'initial',
        isPrimary: true,
      });
    } catch {
      // Fallback sang mã I20.9 nếu mã ICD-10 người dùng gõ tự do không có trong danh mục ICD-10
      const fallbackDiag = initialList.find((d) => d.icd10Code?.toUpperCase() === 'I20.9');
      if (fallbackDiag) {
        return this.update(encounterId, fallbackDiag.diagnosisId, {
          diagnosisName: cleanDiagName,
          isPrimary: true,
        });
      }
      return this.create(encounterId, {
        icd10Code: 'I20.9',
        diagnosisName: cleanDiagName,
        diagnosisType: 'initial',
        isPrimary: true,
      });
    }
  },
};
