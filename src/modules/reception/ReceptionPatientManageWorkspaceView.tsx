import React from 'react';
import { Activity, Users } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { ReceptionSymptomIntakeView } from './ReceptionSymptomIntakeView';
import { ReceptionPatientsView } from './ReceptionPatientsView';

export const ReceptionPatientManageWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'symptoms-intake',
      label: 'Khai báo triệu chứng ban đầu',
      icon: Activity,
      component: <ReceptionSymptomIntakeView />
    },
    {
      id: 'patients-manage',
      label: 'Quản lý Hồ sơ & Tra cứu Bệnh nhân',
      icon: Users,
      component: <ReceptionPatientsView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Khai Báo & Quản Lý Hồ Sơ Bệnh Nhân"
      subtitle="Khai báo triệu chứng lâm sàng ban đầu tại quầy và quản lý danh sách hồ sơ bệnh nhân toàn hệ thống"
      icon={Users}
      tabs={tabs}
      defaultTabId="symptoms-intake"
    />
  );
};
