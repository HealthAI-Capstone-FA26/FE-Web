import React from 'react';
import { Users } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { ReceptionPatientsView } from './ReceptionPatientsView';

export const ReceptionPatientManageWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'patients-list',
      label: 'Danh sách bệnh nhân',
      icon: Users,
      component: <ReceptionPatientsView />,
    },
  ];

  return (
    <WorkspaceContainer
      title="Danh Sách Bệnh Nhân"
      subtitle="Tra cứu thông tin hành chính, CCCD/BHYT và quản lý hồ sơ bệnh nhân"
      icon={Users}
      tabs={tabs}
      defaultTabId="patients-list"
    />
  );
};
