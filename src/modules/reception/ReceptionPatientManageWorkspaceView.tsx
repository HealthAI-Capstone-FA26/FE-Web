import React, { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { CalendarPlus, Users } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { ReceptionWalkinBookingForm } from './ReceptionWalkinBookingForm';
import { ReceptionPatientsView } from './ReceptionPatientsView';

export const ReceptionPatientManageWorkspaceView: React.FC = () => {
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  const [preselectedPatient, setPreselectedPatient] = useState<any | null>(
    (location.state as any)?.initialPatient || null
  );

  const handleSelectPatientForWalkin = (patient: any) => {
    setPreselectedPatient(patient);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', 'walkin-booking');
      return newParams;
    });
  };

  const handleNavigateToTab = (tabId: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tabId);
      return newParams;
    });
  };

  const tabs: WorkspaceTab[] = [
    {
      id: 'walkin-booking',
      label: 'Đăng ký khám trực tiếp',
      icon: CalendarPlus,
      component: (
        <ReceptionWalkinBookingForm
          initialPatient={preselectedPatient}
          onNavigateToTab={handleNavigateToTab}
        />
      ),
    },
    {
      id: 'patients-list',
      label: 'Danh sách bệnh nhân',
      icon: Users,
      component: (
        <ReceptionPatientsView
          onSelectPatientForWalkin={handleSelectPatientForWalkin}
        />
      ),
    },
  ];

  return (
    <WorkspaceContainer
      title="Khai Báo & Đăng Ký Khám Trực Tiếp"
      subtitle="Tiếp nhận khai báo, quản lý danh sách bệnh nhân và đăng ký khám trực tiếp tại quầy (Cấp số thứ tự STT loại B)"
      icon={CalendarPlus}
      tabs={tabs}
      defaultTabId="walkin-booking"
    />
  );
};


