import React from 'react';
import { Shield, Sliders } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { AdminRbacView } from './AdminRbacView';
import { AdminSecuritySettingsView } from './AdminSecuritySettingsView';

export const AdminSecurityWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'security-settings',
      label: 'Bảo mật hệ thống',
      icon: Sliders,
      component: <AdminSecuritySettingsView />
    },
    {
      id: 'rbac-matrix',
      label: 'Phân Quyền Hệ Thống',
      icon: Shield,
      component: <AdminRbacView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Bảo Mật & Quản Trị Hệ Thống (Admin Workspace)"
      subtitle="Cấu hình tham số bảo mật phiên làm việc, chống brute-force và quản lý ma trận phân quyền vai trò người dùng"
      icon={Shield}
      tabs={tabs}
      defaultTabId="security-settings"
    />
  );
};
