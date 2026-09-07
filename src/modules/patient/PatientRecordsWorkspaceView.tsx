import React from 'react';
import { Calendar } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { PatientPortalAppointmentsView } from './PatientPortalAppointmentsView';

export const PatientRecordsWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'appointments',
      label: 'Đặt lịch khám & Quản lý lịch hẹn',
      icon: Calendar,
      component: <PatientPortalAppointmentsView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Đặt Lịch Khám & Quản Lý Lịch Hẹn"
      subtitle="Đăng ký lịch khám trực tuyến, theo dõi trạng thái lịch hẹn và xuất trình mã QR check-in"
      icon={Calendar}
      tabs={tabs}
      defaultTabId="appointments"
    />
  );
};
