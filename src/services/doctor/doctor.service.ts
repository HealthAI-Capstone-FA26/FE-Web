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
  userId?: string;
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

export const doctorService = {
  // GET /departments — Danh sách khoa phòng
  async getDepartments(): Promise<DepartmentResponse[]> {
    return apiFetch<DepartmentResponse[]>('/departments', { method: 'GET' });
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
};
