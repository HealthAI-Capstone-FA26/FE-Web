import React from 'react';
import { Users, Stethoscope, HeartPulse } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { AdminDoctorsView } from './AdminDoctorsView';
import { AdminUsersView } from './AdminUsersView';
import { ReceptionPatientsView } from '../reception/ReceptionPatientsView';

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
    },
    {
      id: 'patient-management',
      label: 'Quản Lý Bệnh Nhân',
      icon: HeartPulse,
      component: <ReceptionPatientsView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Quản Trị Người Dùng, Bác Sĩ & Bệnh Nhân (Admin Workspace)"
      subtitle="Quản lý toàn bộ danh sách tài khoản người dùng, phân vai trò hệ thống, hồ sơ bác sĩ và hồ sơ bệnh nhân bệnh viện"
      icon={Users}
      tabs={tabs}
      defaultTabId="user-management"
    />
  );
};


