import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, CalendarPlus } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { ReceptionPatientsView } from './ReceptionPatientsView';
import { ReceptionWalkinBookingModal } from './ReceptionWalkinBookingModal';

export const ReceptionPatientManageWorkspaceView: React.FC = () => {
  const location = useLocation();
  const [initialPatient, setInitialPatient] = useState<any | null>(
    (location.state as any)?.initialPatient || null
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(!!(location.state as any)?.initialPatient);

  useEffect(() => {
    if ((location.state as any)?.initialPatient) {
      setInitialPatient((location.state as any).initialPatient);
      setIsModalOpen(true);
    }
  }, [location.state]);

  const tabs: WorkspaceTab[] = [
    {
      id: 'patients-list',
      label: 'Danh sách bệnh nhân & Đăng ký khám',
      icon: Users,
      component: <ReceptionPatientsView />,
    },
  ];

  return (
    <>
      <WorkspaceContainer
        title="Quản Lý Bệnh Nhân & Đăng Ký Khám Tại Quầy"
        subtitle="Tra cứu hồ sơ bệnh nhân, đăng ký khám trực tiếp và cấp số thứ tự hàng chờ (STT Loại B)"
        icon={CalendarPlus}
        tabs={tabs}
        defaultTabId="patients-list"
      />

      <ReceptionWalkinBookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setInitialPatient(null);
        }}
        initialPatient={initialPatient}
      />
    </>
  );
};
