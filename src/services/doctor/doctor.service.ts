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
  userId?: string;
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

export const CARDIOLOGY_SPECIALIZATIONS: Record<string, string> = {
  general_cardiology: 'Nội Tim mạch tổng quát',
  interventional: 'Can thiệp Tim mạch',
  electrophysiology: 'Rối loạn nhịp tim',
  echocardiography: 'Siêu âm & Thăm dò chức năng tim',
  preventive: 'Tim mạch dự phòng',
};

export function getSpecializationLabel(spec?: string | null): string {
  if (!spec) return 'Bác sĩ chuyên khoa Tim mạch';
  return CARDIOLOGY_SPECIALIZATIONS[spec] || spec;
}

export const doctorService = {
  // Bỏ department theo kiến trúc phòng khám Tim mạch mới (SE01-SE07)
  async getDepartments(): Promise<DepartmentResponse[]> {
    return [];
  },

  getCachedDepartments(): DepartmentResponse[] | null {
    return [];
  },

  async prefetchDepartments(): Promise<DepartmentResponse[]> {
    return [];
  },

  // POST /doctors/:id/departments — Gán bác sĩ vào khoa
  async assignDoctorDepartment(doctorId: string, data: AssignDepartmentData) {
    return apiFetch(`/doctors/${doctorId}/departments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // GET /doctors — Danh sách bác sĩ (hỗ trợ tìm theo userId)
  async getDoctors(query?: SearchDoctorQuery): Promise<DoctorResponse[]> {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.departmentId) params.append('departmentId', query.departmentId);
    if (query?.userId) params.append('userId', query.userId);

    const queryString = params.toString();
    const url = `/doctors${queryString ? `?${queryString}` : ''}`;
    return apiFetch<DoctorResponse[]>(url, { method: 'GET' });
  },

  // Tra doctorId từ userId (gọi sau khi bác sĩ đăng nhập)
  async getDoctorIdByUserId(userId: string): Promise<string | null> {
    const doc = await this.getDoctorByUserId(userId);
    return doc?.doctorId || null;
  },

  // Lấy toàn bộ thông tin hồ sơ bác sĩ từ userId (kèm chuyên khoa, chức danh)
  async getDoctorByUserId(userId: string): Promise<DoctorResponse | null> {
    try {
      const doctors = await this.getDoctors({ userId });
      if (Array.isArray(doctors) && doctors.length > 0) {
        return doctors[0];
      }
      return null;
    } catch {
      return null;
    }
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
