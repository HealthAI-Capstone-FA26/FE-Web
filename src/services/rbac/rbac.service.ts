import { apiFetch } from '../api';

export interface PermissionItem {
  permissionId: string;
  permissionCode: string;
  resource: string;
  action: string;
  scope: string;
  description?: string;
}

export interface RolePermissionItem {
  roleId: string;
  permissionId: string;
  permission: PermissionItem;
}

export interface RoleItemResponse {
  roleId: string;
  roleCode: string;
  roleName: string;
  description?: string;
  isSystem: boolean;
  isDefaultRole: boolean;
  rolePermissions?: RolePermissionItem[];
}

export const rbacService = {
  // 1. Lấy danh sách tất cả các role kèm permissions (GET /admin/roles)
  async getRoles(): Promise<RoleItemResponse[]> {
    return apiFetch<RoleItemResponse[]>('/admin/roles', { method: 'GET' });
  },

  // 2. Lấy danh sách tất cả permissions có trong hệ thống (GET /admin/permissions)
  async getAllPermissions(): Promise<PermissionItem[]> {
    return apiFetch<PermissionItem[]>('/admin/permissions', { method: 'GET' });
  },

  // 3. Lấy danh sách permissions của 1 role cụ thể (GET /admin/roles/:roleId/permissions)
  async getRolePermissions(roleId: string): Promise<PermissionItem[]> {
    return apiFetch<PermissionItem[]>(`/admin/roles/${roleId}/permissions`, { method: 'GET' });
  },

  // 4. Cập nhật/Thay thế toàn bộ danh sách permissions của role (PUT /admin/roles/:roleId/permissions)
  async replaceRolePermissions(roleId: string, permissionIds: string[]): Promise<PermissionItem[]> {
    return apiFetch<PermissionItem[]>(`/admin/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissionIds }),
    });
  },

  // 5. Thêm permissions vào role (POST /admin/roles/:roleId/permissions)
  async addPermissionsToRole(roleId: string, permissionIds: string[]): Promise<PermissionItem[]> {
    return apiFetch<PermissionItem[]>(`/admin/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissionIds }),
    });
  },

  // 6. Gỡ 1 permission khỏi role (DELETE /admin/roles/:roleId/permissions/:permissionId)
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<PermissionItem[]> {
    return apiFetch<PermissionItem[]>(`/admin/roles/${roleId}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
  },

  // 7. Lấy role hiện tại của 1 user (GET /admin/users/:userId/role)
  async getUserRole(userId: string): Promise<RoleItemResponse | null> {
    return apiFetch<RoleItemResponse | null>(`/admin/users/${userId}/role`, { method: 'GET' });
  },

  // 8. Gán / thay thế role của user (PUT /admin/users/:userId/role)
  async assignRoleToUser(userId: string, roleId: string): Promise<RoleItemResponse> {
    return apiFetch<RoleItemResponse>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ roleId }),
    });
  },
};
