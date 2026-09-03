export type UserRole = 'PATIENT' | 'RECEPTIONIST' | 'NURSE' | 'DOCTOR' | 'LAB' | 'ADMIN';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  avatar?: string;
  department?: string;
  staffCode?: string;
  phone?: string;
  permissions?: string[];
};

export type RoleNavigationItem = {
  id: string;
  label: string;
  path: string;
  iconName: string;
  badge?: string;
  requiredPermission?: string;
};
