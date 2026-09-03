import React from 'react';
import { Users, Stethoscope } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { AdminDoctorsView } from './AdminDoctorsView';
import { AdminUsersView } from './AdminUsersView';

export const AdminRealtimeWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'user-management',
      label: 'Quản Lý Tài Khoản',
      icon: Users,
      component: <AdminUsersView />
    },
    {
      id: 'doctor-management',
      label: 'Quản Lý Bác Sĩ',
      icon: Stethoscope,
      component: <AdminDoctorsView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Quản Trị Người Dùng & Bác Sĩ (Admin Workspace)"
      subtitle="Quản lý toàn bộ danh sách tài khoản người dùng, phân vai trò hệ thống và hồ sơ bác sĩ bệnh viện"
      icon={Users}
      tabs={tabs}
      defaultTabId="user-management"
    />
  );
};


