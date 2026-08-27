import React from 'react';
import { UserCheck, Users } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { AccountInfoView } from './AccountInfoView';
import { PatientProfilesView } from './PatientProfilesView';

export const PatientIntakeWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'patient-profiles',
      label: 'Hồ sơ bệnh nhân',
      icon: Users,
      component: <PatientProfilesView />
    },
    {
      id: 'account-info',
      label: 'Tài khoản của tôi',
      icon: UserCheck,
      component: <AccountInfoView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Hồ Sơ Khách Hàng"
      subtitle="Quản lý thông tin hồ sơ bệnh nhân cá nhân / người thân và tài khoản truy cập trực tuyến"
      tabs={tabs}
      defaultTabId="patient-profiles"
    />
  );
};
