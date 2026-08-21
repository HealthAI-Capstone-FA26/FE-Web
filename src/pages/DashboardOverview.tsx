import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '../types/auth';

const PREFIX_ROLE_MAP: Record<string, UserRole> = {
  '/benh-nhan': 'PATIENT',
  '/tiep-nhan': 'RECEPTION',
  '/dieu-duong': 'NURSE',
  '/bac-si': 'DOCTOR',
  '/xet-nghiem': 'LAB',
  '/quan-tri': 'ADMIN'
};

export const DashboardOverview: React.FC = () => {
  const { currentRole, switchRole } = useAuth();
  const location = useLocation();

  // Automatically sync active role in AuthContext based on current URL path
  useEffect(() => {
    const matchedPrefix = Object.keys(PREFIX_ROLE_MAP).find((prefix) =>
      location.pathname.startsWith(prefix)
    );
    if (matchedPrefix) {
      const roleForPath = PREFIX_ROLE_MAP[matchedPrefix];
      if (roleForPath !== currentRole) {
        switchRole(roleForPath);
      }
    }
  }, [location.pathname]);

  return (
    <DashboardLayout>
      <div className="animate-in fade-in duration-150">
        <Outlet />
      </div>
    </DashboardLayout>
  );
};
