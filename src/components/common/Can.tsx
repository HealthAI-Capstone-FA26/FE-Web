import React from 'react';
import { useCan } from '../../hooks/useCan';
import type { UserRole } from '../../types/auth';

interface CanProps {
  perform?: string;
  anyOf?: string[];
  allOf?: string[];
  role?: UserRole | UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({
  perform,
  anyOf,
  allOf,
  role,
  fallback = null,
  children,
}) => {
  const { can, hasRole, hasAnyPermission, hasAllPermissions } = useCan();

  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  if (perform && !can(perform)) {
    return <>{fallback}</>;
  }

  if (anyOf && anyOf.length > 0 && !hasAnyPermission(anyOf)) {
    return <>{fallback}</>;
  }

  if (allOf && allOf.length > 0 && !hasAllPermissions(allOf)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
