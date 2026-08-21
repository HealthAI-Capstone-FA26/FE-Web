import React from 'react';
import { UserCheck, UserPlus } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { ReceptionCheckinView } from './ReceptionCheckinView';
import { ReceptionWalkinBookingView } from './ReceptionWalkinBookingView';
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
      id: 'walkin-booking',
      label: 'Đăng ký khám tại quầy',
      icon: UserPlus,
      component: <ReceptionWalkinBookingView />
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
      subtitle="Thực hiện check-in, đăng ký khám tại quầy và tạo mới hồ sơ bệnh nhân gọn gàng"
      icon={UserCheck}
      tabs={tabs}
      defaultTabId="checkin-list"
    />
  );
};
