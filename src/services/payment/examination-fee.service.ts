import { apiFetch } from '../api';

export interface ExaminationFeeItem {
  feeId: string;
  feeCode: string;
  departmentId?: string | null;
  feeName: string;
  feeType: string;
  price: number;
  isActive: boolean;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
  department?: {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    description?: string;
  } | null;
}

export interface CreateExaminationFeeData {
  departmentId?: string;
  feeName: string;
  feeType?: string;
  price: number;
  effectiveFrom?: string;
  isActive?: boolean;
}

export interface UpdateExaminationFeeData {
  departmentId?: string | null;
  feeName?: string;
  feeType?: string;
  price?: number;
  effectiveFrom?: string;
  isActive?: boolean;
}

export interface FindExaminationFeesQuery {
  departmentId?: string;
  isActive?: boolean;
}

export const examinationFeeService = {
  // GET /examination-fees
  async getExaminationFees(query?: FindExaminationFeesQuery): Promise<ExaminationFeeItem[]> {
    const params = new URLSearchParams();
    if (query?.departmentId) params.append('departmentId', query.departmentId);
    if (query?.isActive !== undefined) params.append('isActive', String(query.isActive));

    const queryString = params.toString();
    const url = `/examination-fees${queryString ? `?${queryString}` : ''}`;
    return apiFetch<ExaminationFeeItem[]>(url, { method: 'GET' });
  },

  // POST /examination-fees (Chỉ ADMIN)
  async createExaminationFee(data: CreateExaminationFeeData): Promise<ExaminationFeeItem> {
    return apiFetch<ExaminationFeeItem>('/examination-fees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PATCH /examination-fees/:id (Chỉ ADMIN)
  async updateExaminationFee(id: string, data: UpdateExaminationFeeData): Promise<ExaminationFeeItem> {
    return apiFetch<ExaminationFeeItem>(`/examination-fees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
