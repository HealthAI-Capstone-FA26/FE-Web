import { apiFetch } from '../api';

export interface Icd10Item {
  icd10Code: string;
  icd10Name: string;
  icd10NameVi?: string;
  chapter?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchIcd10Params {
  search?: string;
  chapter?: string;
  isActive?: boolean;
  limit?: number;
}

export const icd10Service = {
  /**
   * Tìm kiếm danh mục ICD-10 theo từ khóa (mã ICD-10 hoặc tên bệnh tiếng Việt / Tiếng Anh)
   * GET /api/v1/icd10-codes?search=...&limit=20
   */
  async searchIcd10(params: SearchIcd10Params = {}): Promise<Icd10Item[]> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.chapter) query.append('chapter', params.chapter);
    if (params.isActive !== undefined) query.append('isActive', String(params.isActive));
    if (params.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    const endpoint = `/icd10-codes${queryString ? `?${queryString}` : ''}`;
    return apiFetch<Icd10Item[]>(endpoint);
  },

  /**
   * Lấy chi tiết 1 mã ICD-10 theo mã code (VD: J18.9)
   * GET /api/v1/icd10-codes/{code}
   */
  async getIcd10ByCode(code: string): Promise<Icd10Item> {
    return apiFetch<Icd10Item>(`/icd10-codes/${encodeURIComponent(code)}`);
  },
};
