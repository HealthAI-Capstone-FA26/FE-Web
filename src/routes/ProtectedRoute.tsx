import React from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { currentRole, switchRole } = useAuth();

  const isAllowed = allowedRoles.includes(currentRole);

  if (!isAllowed) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Cần quyền truy cập</h2>
        <p className="text-xs text-slate-500 max-w-md mt-1">
          Chức năng này yêu cầu vai trò thuộc về:{' '}
          <strong className="text-blue-700">{allowedRoles.join(', ')}</strong>. Vai trò hiện tại của bạn là{' '}
          <strong className="text-rose-600">{currentRole}</strong>.
        </p>

        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => switchRole(allowedRoles[0])}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer border-none"
          >
            Chuyển nhanh sang vai trò {allowedRoles[0]}
          </button>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            Về Dashboard Tổng Quan
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
