import React from 'react';
import { Shield } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { AdminRbacView } from './AdminRbacView';

export const AdminSecurityWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'rbac-matrix',
      label: 'Phân Quyền Hệ Thống (RBAC)',
      icon: Shield,
      badge: 'Bảo mật',
      component: <AdminRbacView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Bảo Mật & Quản Trị Phân Quyền Vai Trò (Admin Workspace)"
      subtitle="Quản lý ma trận phân quyền RBAC và cấu hình quyền hạn chi tiết cho từng vai trò người dùng"
      icon={Shield}
      tabs={tabs}
      defaultTabId="rbac-matrix"
    />
  );
};


