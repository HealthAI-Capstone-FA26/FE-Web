import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';

export const useCan = () => {
  const { user, currentRole, permissions, can } = useAuth();

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(currentRole);
    }
    return currentRole === role;
  };

  const hasAnyPermission = (permissionCodes: string[]): boolean => {
    if (!user) return false;
    if (currentRole === 'ADMIN') return true;
    return permissionCodes.some((code) => can(code));
  };

  const hasAllPermissions = (permissionCodes: string[]): boolean => {
    if (!user) return false;
    if (currentRole === 'ADMIN') return true;
    return permissionCodes.every((code) => can(code));
  };

  return {
    can,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    permissions,
    currentRole,
    user,
  };
};
