import React from 'react';
import { LayoutDashboard, Activity, Stethoscope, Users } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { AdminRealtimeMonitorView } from './AdminRealtimeMonitorView';
import { AdminDoctorsView } from './AdminDoctorsView';
import { AdminUsersView } from './AdminUsersView';

export const AdminRealtimeWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'realtime-monitor',
      label: 'Dashboard Realtime 7 Bước',
      icon: LayoutDashboard,
      badge: 'Live',
      component: <AdminRealtimeMonitorView />
    },
    {
      id: 'user-management',
      label: 'Quản Lý Tài Khoản (Users)',
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
      id: 'wait-reports',
      label: 'Báo cáo Thời gian Chờ & KPI',
      icon: Activity,
      component: <AdminRealtimeMonitorView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Giám Sát Realtime & Quản Trị Hệ Thống (Admin Workspace)"
      subtitle="Theo dõi luồng khám bệnh 7 bước thời gian thực, quản lý tài khoản người dùng, bác sĩ và rà soát vận hành bệnh viện"
      icon={LayoutDashboard}
      tabs={tabs}
      defaultTabId="realtime-monitor"
    />
  );
};


