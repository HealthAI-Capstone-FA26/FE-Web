import React from 'react';
import { Calendar, Pill } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { PatientPortalAppointmentsView } from './PatientPortalAppointmentsView';

export const PatientRecordsWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'appointments',
      label: 'Lịch hẹn & Đăng ký khám',
      icon: Calendar,
      component: <PatientPortalAppointmentsView />
    },
    {
      id: 'records-pdf',
      label: 'Đơn thuốc & Bệnh án PDF',
      icon: Pill,
      component: <PatientPortalAppointmentsView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Lịch Hẹn Khám & Bệnh Án Điện Tử (Patient Records)"
      subtitle="Quản lý lịch hẹn khám bệnh, theo dõi quá trình khám và xem/tải về đơn thuốc, bệnh án PDF"
      icon={Calendar}
      tabs={tabs}
      defaultTabId="appointments"
    />
  );
};
