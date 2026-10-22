import React from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, Pill } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { PatientPortalAppointmentsView } from './PatientPortalAppointmentsView';
import { PatientPrescriptionsView } from './PatientPrescriptionsView';

export const PatientRecordsWorkspaceView: React.FC = () => {
  const location = useLocation();
  const isPrescriptionsPath = location.pathname.includes('ho-so-don-thuoc');

  const tabs: WorkspaceTab[] = [
    {
      id: 'appointments',
      label: 'Đặt lịch khám & Quản lý lịch hẹn',
      icon: Calendar,
      component: <PatientPortalAppointmentsView />
    },
    {
      id: 'prescriptions',
      label: 'Đơn thuốc điện tử & Tái khám',
      icon: Pill,
      component: <PatientPrescriptionsView />
    }
  ];

  return (
    <WorkspaceContainer
      title={isPrescriptionsPath ? "Đơn Thuốc Điện Tử & Lịch Tái Khám" : "Đặt Lịch Khám & Quản Lý Lịch Hẹn"}
      subtitle={isPrescriptionsPath ? "Tra cứu đơn thuốc điện tử có chữ ký số CA, hướng dẫn dùng thuốc và theo dõi lịch tái khám" : "Đăng ký lịch khám trực tuyến, theo dõi trạng thái lịch hẹn và xuất trình mã QR check-in"}
      icon={isPrescriptionsPath ? Pill : Calendar}
      tabs={tabs}
      defaultTabId={isPrescriptionsPath ? 'prescriptions' : 'appointments'}
    />
  );
};
