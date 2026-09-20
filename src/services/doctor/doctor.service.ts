import { apiFetch } from '../api';

export interface DoctorDepartmentRelation {
  doctorId: string;
  departmentId: string;
  isPrimary: boolean;
  assignedAt?: string;
  department?: {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    description?: string;
    roomLocation?: string;
    isActive: boolean;
  };
}

export interface DoctorResponse {
  doctorId: string;
  userId?: string | null;
  doctorCode: string;
  fullName: string;
  title?: string | null;
  licenseNumber?: string | null;
  specialization?: string | null;
  isActive: boolean;
  createdAt: string;
  doctorDepartments?: DoctorDepartmentRelation[];
}

export interface CreateDoctorData {
  fullName: string;
  title?: string;
  licenseNumber?: string;
  specialization?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

export interface SearchDoctorQuery {
  search?: string;
  departmentId?: string;
}

export interface DepartmentResponse {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  description?: string;
  roomLocation?: string;
  isActive: boolean;
}

export interface AssignDepartmentData {
  departmentId: string;
  isPrimary?: boolean;
}

export interface DepartmentSuggestionResult {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  score: number;
  keywordScore: number;
  semanticScore: number;
  matchedKeywords: string[];
  method: 'keyword' | 'semantic' | 'hybrid' | 'fallback';
}

let cachedDepartments: DepartmentResponse[] | null = null;
let departmentsFetchPromise: Promise<DepartmentResponse[]> | null = null;

export const doctorService = {
  // POST /department-suggestion — Gợi ý chuyên khoa dựa trên mô tả triệu chứng
  async suggestDepartment(symptoms: string): Promise<DepartmentSuggestionResult[]> {
    return apiFetch<DepartmentSuggestionResult[]>('/department-suggestion', {
      method: 'POST',
      body: JSON.stringify({ symptoms }),
    });
  },

  // GET /departments — Danh sách khoa phòng (có memory cache)
  async getDepartments(forceRefresh = false): Promise<DepartmentResponse[]> {
    if (!forceRefresh && cachedDepartments) {
      return cachedDepartments;
    }
    if (!forceRefresh && departmentsFetchPromise) {
      return departmentsFetchPromise;
    }
    departmentsFetchPromise = apiFetch<DepartmentResponse[]>('/departments', { method: 'GET' })
      .then((data) => {
        cachedDepartments = data;
        departmentsFetchPromise = null;
        return data;
      })
      .catch((err) => {
        departmentsFetchPromise = null;
        throw err;
      });
    return departmentsFetchPromise;
  },

  getCachedDepartments(): DepartmentResponse[] | null {
    return cachedDepartments;
  },

  async prefetchDepartments(): Promise<DepartmentResponse[]> {
    return this.getDepartments();
  },

  // POST /doctors/:id/departments — Gán bác sĩ vào khoa
  async assignDoctorDepartment(doctorId: string, data: AssignDepartmentData) {
    return apiFetch(`/doctors/${doctorId}/departments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // GET /doctors — Danh sách bác sĩ
  async getDoctors(query?: SearchDoctorQuery): Promise<DoctorResponse[]> {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.departmentId) params.append('departmentId', query.departmentId);

    const queryString = params.toString();
    const url = `/doctors${queryString ? `?${queryString}` : ''}`;
    return apiFetch<DoctorResponse[]>(url, { method: 'GET' });
  },

  // GET /doctors/:id — Xem chi tiết bác sĩ
  async getDoctorById(id: string): Promise<DoctorResponse> {
    return apiFetch<DoctorResponse>(`/doctors/${id}`, { method: 'GET' });
  },

  // POST /doctors — Tạo bác sĩ mới (chỉ Admin)
  async createDoctor(data: CreateDoctorData): Promise<DoctorResponse> {
    return apiFetch<DoctorResponse>('/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PATCH /doctors/:id — Cập nhật bác sĩ (chỉ Admin)
  async updateDoctor(id: string, data: Partial<CreateDoctorData>): Promise<DoctorResponse> {
    return apiFetch<DoctorResponse>(`/doctors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // PATCH /doctor-departments/:id — Sửa isPrimary (đổi khoa chính), id dạng "doctorId_departmentId" (chỉ Admin)
  async updateDoctorDepartment(
    id: string,
    isPrimary: boolean
  ): Promise<{ doctorId: string; departmentId: string; isPrimary: boolean }> {
    return apiFetch<{ doctorId: string; departmentId: string; isPrimary: boolean }>(
      `/doctor-departments/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isPrimary }),
      }
    );
  },

  // DELETE /doctor-departments/:id — Gỡ bác sĩ khỏi khoa, id dạng "doctorId_departmentId" (chỉ Admin)
  async removeDoctorDepartment(id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/doctor-departments/${id}`, {
      method: 'DELETE',
    });
  },

  // GET /departments/:id/doctors — Liệt kê danh sách bác sĩ theo khoa (ưu tiên khoa chính lên trước)
  async getDoctorsByDepartment(departmentId: string): Promise<any[]> {
    return apiFetch<any[]>(`/departments/${departmentId}/doctors`, {
      method: 'GET',
    });
  },
};

export function encodeDoctorDepartmentId(doctorId: string, departmentId: string): string {
  return `${doctorId}_${departmentId}`;
}
