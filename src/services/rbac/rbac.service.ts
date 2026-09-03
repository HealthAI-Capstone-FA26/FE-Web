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

// ============================================================
// IN-MEMORY CACHE & PROMISE DEDUPLICATION
// ============================================================
let cachedRoles: RoleItemResponse[] | null = null;
let cachedPermissions: PermissionItem[] | null = null;
let rolesPromise: Promise<RoleItemResponse[]> | null = null;
let permissionsPromise: Promise<PermissionItem[]> | null = null;

export const rbacService = {
  // Xóa sạch cache (khi cần làm mới dữ liệu)
  clearCache() {
    cachedRoles = null;
    cachedPermissions = null;
    rolesPromise = null;
    permissionsPromise = null;
  },

  // 1. Lấy danh sách tất cả các role kèm permissions (Có Cache 0ms)
  async getRoles(forceRefresh = false): Promise<RoleItemResponse[]> {
    if (!forceRefresh && cachedRoles) {
      return cachedRoles;
    }

    if (!forceRefresh && rolesPromise) {
      return rolesPromise;
    }

    rolesPromise = (async () => {
      try {
        const rawRoles = await apiFetch<RoleItemResponse[]>('/admin/roles', { method: 'GET' });
        cachedRoles = (rawRoles || []).map((r) => ({
          ...r,
          roleCode: (r.roleCode || '').trim(),
          roleName: (r.roleName || '').trim(),
        }));
        return cachedRoles;
      } finally {
        rolesPromise = null;
      }
    })();

    return rolesPromise;
  },

  // 2. Lấy danh sách tất cả permissions có trong hệ thống (Có Cache 0ms)
  async getAllPermissions(forceRefresh = false): Promise<PermissionItem[]> {
    if (!forceRefresh && cachedPermissions) {
      return cachedPermissions;
    }

    if (!forceRefresh && permissionsPromise) {
      return permissionsPromise;
    }

    permissionsPromise = (async () => {
      try {
        const rawPerms = await apiFetch<PermissionItem[]>('/admin/permissions', { method: 'GET' });
        cachedPermissions = (rawPerms || []).map((p) => {
          const parts = p.permissionCode.split(':');
          return {
            ...p,
            resource: p.resource || parts[0] || 'other',
            action: p.action || parts[1] || 'read',
            scope: p.scope || parts[2] || 'all',
          };
        });
        return cachedPermissions;
      } finally {
        permissionsPromise = null;
      }
    })();

    return permissionsPromise;
  },

  // 3. Lấy danh sách permissions của 1 role cụ thể (GET /admin/roles/:roleId/permissions)
  async getRolePermissions(roleId: string): Promise<PermissionItem[]> {
    return apiFetch<PermissionItem[]>(`/admin/roles/${roleId}/permissions`, { method: 'GET' });
  },

  // 4. Cập nhật/Thay thế toàn bộ danh sách permissions của role (PUT /admin/roles/:roleId/permissions)
  async replaceRolePermissions(roleId: string, permissionIds: string[]): Promise<PermissionItem[]> {
    const res = await apiFetch<PermissionItem[]>(`/admin/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissionIds }),
    });
    // Invalidate cache sau khi sửa đổi quyền
    this.clearCache();
    return res;
  },

  // 5. Thêm permissions vào role (POST /admin/roles/:roleId/permissions)
  async addPermissionsToRole(roleId: string, permissionIds: string[]): Promise<PermissionItem[]> {
    const res = await apiFetch<PermissionItem[]>(`/admin/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissionIds }),
    });
    this.clearCache();
    return res;
  },

  // 6. Gỡ 1 permission khỏi role (DELETE /admin/roles/:roleId/permissions/:permissionId)
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<PermissionItem[]> {
    const res = await apiFetch<PermissionItem[]>(`/admin/roles/${roleId}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
    this.clearCache();
    return res;
  },

  // 7. Lấy role hiện tại của 1 user (GET /admin/users/:userId/role)
  async getUserRole(userId: string): Promise<RoleItemResponse | null> {
    return apiFetch<RoleItemResponse | null>(`/admin/users/${userId}/role`, { method: 'GET' });
  },

  // 8. Gán / thay thế role của user (PUT /admin/users/:userId/role)
  async assignRoleToUser(userId: string, roleId: string): Promise<RoleItemResponse> {
    const res = await apiFetch<RoleItemResponse>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ roleId }),
    });
    return res;
  },
};
