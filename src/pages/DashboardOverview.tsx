import React from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Outlet, Navigate } from 'react-router-dom';

export const DashboardOverview: React.FC = () => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout>
      <div className="animate-in fade-in duration-150">
        <Outlet />
      </div>
    </DashboardLayout>
  );
};
