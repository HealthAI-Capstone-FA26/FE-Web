import React from 'react';
import { UserCheck, UserPlus, Users, CalendarCheck } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { ReceptionAppointmentsView } from './ReceptionAppointmentsView';
import { ReceptionPatientsView } from './ReceptionPatientsView';
import { ReceptionPatientProfileFormView } from './ReceptionPatientProfileFormView';

export const ReceptionIntakeWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'appointments-checkin',
      label: 'Danh sách Lịch hẹn & Check-in',
      icon: CalendarCheck,
      component: <ReceptionAppointmentsView />
    },
    {
      id: 'patients-list',
      label: 'Danh sách bệnh nhân',
      icon: Users,
      component: <ReceptionPatientsView />
    },
    {
      id: 'create-profile',
      label: 'Tạo hồ sơ bệnh nhân',
      icon: UserPlus,
      component: <ReceptionPatientProfileFormView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Tiếp Nhận & Đăng Ký Khám Tại Quầy"
      subtitle="Thực hiện xác nhận lịch hẹn, check-in cấp số thứ tự, quản lý danh sách bệnh nhân và tạo mới hồ sơ bệnh nhân"
      icon={UserCheck}
      tabs={tabs}
      defaultTabId="appointments-checkin"
    />
  );
};
