import React from 'react';
import { UserCheck, UserPlus, Users } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { ReceptionCheckinView } from './ReceptionCheckinView';
import { ReceptionPatientsView } from './ReceptionPatientsView';
import { ReceptionPatientProfileFormView } from './ReceptionPatientProfileFormView';

export const ReceptionIntakeWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'checkin-list',
      label: 'Danh sách chờ & Check-in',
      icon: UserCheck,
      badge: '08 Chờ',
      component: <ReceptionCheckinView />
    },
    {
      id: 'patients-list',
      label: 'Danh sách & Quản lý Bệnh nhân',
      icon: Users,
      component: <ReceptionPatientsView />
    },
    {
      id: 'create-profile',
      label: 'Tạo mới Hồ sơ Bệnh nhân',
      icon: UserPlus,
      component: <ReceptionPatientProfileFormView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Tiếp Nhận & Đăng Ký Khám Tại Quầy"
      subtitle="Thực hiện check-in, quản lý danh sách bệnh nhân và tạo mới hồ sơ bệnh nhân gọn gàng"
      icon={UserCheck}
      tabs={tabs}
      defaultTabId="checkin-list"
    />
  );
};
