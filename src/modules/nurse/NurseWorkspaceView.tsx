import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { UserCheck, FileText, ShieldAlert } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { NurseQueueView } from './NurseQueueView';
import { NurseVitalAlertsView } from './NurseVitalAlertsView';

export const NurseWorkspaceView: React.FC = () => {
  const location = useLocation();

  const defaultTabId = useMemo(() => {
    if (location.pathname.includes('canh-bao')) {
      return 'vital-alerts';
    }
    return 'patient-records';
  }, [location.pathname]);

  const tabs: WorkspaceTab[] = [
    {
      id: 'patient-records',
      label: 'Hồ sơ hàng chờ sinh hiệu',
      icon: FileText,
      component: <NurseQueueView />,
    },
    {
      id: 'vital-alerts',
      label: 'Cảnh báo sinh hiệu & Tra cứu ngưỡng',
      icon: ShieldAlert,
      component: <NurseVitalAlertsView />,
    },
  ];

  return (
    <WorkspaceContainer
      title="Trạm Tiếp Nhận & Đo Sinh Hiệu Điều Dưỡng"
      subtitle="Tiếp nhận bệnh nhân từ quầy Lễ tân, ghi nhận sinh hiệu và theo dõi cảnh báo bất thường trước khi vào khám Bác sĩ"
      icon={UserCheck}
      tabs={tabs}
      defaultTabId={defaultTabId}
    />
  );
};

export default NurseWorkspaceView;
