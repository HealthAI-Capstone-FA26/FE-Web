import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useCan } from '../../hooks/useCan';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DEFAULT_PATHS } from '../../types/dashboard';
import type { UserRole } from '../../types/auth';

interface ProtectedRouteProps {
  requiredPermission?: string;
  requiredRole?: UserRole | UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredPermission,
  requiredRole,
}) => {
  const { isLoggedIn, currentRole } = useAuth();
  const { can, hasRole } = useCan();

  const fallbackPath = ROLE_DEFAULT_PATHS[currentRole] || '/';

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requiredPermission && !can(requiredPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
};
