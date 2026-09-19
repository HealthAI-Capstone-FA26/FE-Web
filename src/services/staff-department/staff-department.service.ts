import { apiFetch } from '../api';

export interface DepartmentItem {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  description?: string;
  status?: string;
}

export interface UserProfileItem {
  profileId?: string;
  userId?: string;
  fullName?: string;
  actorRole?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface UserItem {
  userId: string;
  email: string;
  status: string;
  profile?: UserProfileItem;
  userRoles?: any[];
}

export interface StaffDepartmentItem {
  id: string; // Composite key: userId_departmentId
  userId: string;
  departmentId: string;
  isPrimary: boolean;
  assignedAt: string;
  user?: UserItem;
  department?: DepartmentItem;
}

export interface AssignStaffDepartmentDto {
  departmentId: string;
  isPrimary?: boolean;
}

export const staffDepartmentService = {
  // Lấy tất cả phân bổ điều dưỡng - khoa (GET /staff-departments)
  async getAllStaffDepartments(): Promise<StaffDepartmentItem[]> {
    return apiFetch<StaffDepartmentItem[]>('/staff-departments', { method: 'GET' });
  },

  // Lấy danh sách nhân viên gán vào 1 khoa (GET /departments/:id/staff)
  async getStaffByDepartment(departmentId: string): Promise<StaffDepartmentItem[]> {
    return apiFetch<StaffDepartmentItem[]>(`/departments/${departmentId}/staff`, { method: 'GET' });
  },

  // Lấy danh sách khoa gán cho 1 nhân viên (GET /users/:id/departments)
  async getDepartmentsByUser(userId: string): Promise<StaffDepartmentItem[]> {
    return apiFetch<StaffDepartmentItem[]>(`/users/${userId}/departments`, { method: 'GET' });
  },

  // Gán nhân viên/điều dưỡng vào khoa (POST /users/:id/departments)
  async assignStaffDepartment(userId: string, dto: AssignStaffDepartmentDto): Promise<StaffDepartmentItem> {
    return apiFetch<StaffDepartmentItem>(`/users/${userId}/departments`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  // Đổi trạng thái khoa chính (PATCH /staff-departments/:id)
  async updatePrimaryDepartment(id: string, isPrimary: boolean): Promise<StaffDepartmentItem> {
    return apiFetch<StaffDepartmentItem>(`/staff-departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isPrimary }),
    });
  },

  // Gỡ nhân viên khỏi khoa (DELETE /staff-departments/:id)
  async removeStaffDepartment(id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/staff-departments/${id}`, {
      method: 'DELETE',
    });
  },

  // Lấy danh sách toàn bộ các khoa (GET /departments)
  async getAllDepartments(): Promise<DepartmentItem[]> {
    return apiFetch<DepartmentItem[]>('/departments', { method: 'GET' });
  },
};
