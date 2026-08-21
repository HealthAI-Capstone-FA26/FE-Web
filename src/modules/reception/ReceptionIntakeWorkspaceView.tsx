import React from 'react';
import { UserCheck, UserPlus, Activity, Users } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { ReceptionCheckinView } from './ReceptionCheckinView';
import { ReceptionWalkinBookingView } from './ReceptionWalkinBookingView';
import { ReceptionPatientProfileFormView } from './ReceptionPatientProfileFormView';
import { ReceptionSymptomIntakeView } from './ReceptionSymptomIntakeView';
import { ReceptionPatientsView } from './ReceptionPatientsView';

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
    },
    {
      id: 'symptoms-intake',
      label: 'Khai báo triệu chứng ban đầu',
      icon: Activity,
      component: <ReceptionSymptomIntakeView />
    },
    {
      id: 'patients-manage',
      label: 'Quản lý Hồ sơ & Tra cứu',
      icon: Users,
      component: <ReceptionPatientsView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Không Gian Tiếp Nhận & Intake Bệnh Nhân"
      subtitle="Thực hiện check-in, đăng ký khám, tạo mới hồ sơ và khai báo triệu chứng tập trung trong cùng 1 giao diện"
      icon={UserCheck}
      tabs={tabs}
      defaultTabId="checkin-list"
    />
  );
};
