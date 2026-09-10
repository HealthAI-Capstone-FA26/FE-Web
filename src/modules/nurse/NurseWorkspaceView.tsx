import React from 'react';
import { UserCheck, FileText } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { NurseQueueView } from './NurseQueueView';

export const NurseWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'patient-records',
      label: 'Hồ sơ bệnh nhân',
      icon: FileText,
      component: <NurseQueueView />,
    },
  ];

  return (
    <WorkspaceContainer
      title="Trạm Tiếp Nhận & Đo Sinh Hiệu Điều Dưỡng"
      subtitle="Tiếp nhận bệnh nhân từ quầy Lễ tân, ghi nhận sinh hiệu và theo dõi cảnh báo bất thường trước khi vào khám Bác sĩ"
      icon={UserCheck}
      tabs={tabs}
      defaultTabId="patient-records"
    />
  );
};

export default NurseWorkspaceView;
