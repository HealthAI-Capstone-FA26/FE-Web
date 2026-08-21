import React from 'react';
import { UserCheck, Users } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { AccountInfoView } from './AccountInfoView';
import { PatientProfilesView } from './PatientProfilesView';

export const PatientIntakeWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'account-info',
      label: 'Tài khoản của tôi',
      icon: UserCheck,
      badge: 'Account',
      component: <AccountInfoView />
    },
    {
      id: 'patient-profiles',
      label: 'Profile Cá nhân & Người thân',
      icon: Users,
      component: <PatientProfilesView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Tài Khoản & Profile Bệnh Nhân"
      subtitle="Quản lý tài khoản truy cập trực tuyến và profile thông tin hành chính cá nhân / người thân"
      tabs={tabs}
      defaultTabId="account-info"
    />
  );
};
