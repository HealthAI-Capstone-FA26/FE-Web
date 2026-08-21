import React from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { NurseQueueView } from './NurseQueueView';

export const NurseWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'vitals-input',
      label: 'Hàng chờ & Nhập Sinh hiệu (Vitals & BMI)',
      icon: Activity,
      badge: '12 Ca',
      component: <NurseQueueView />
    },
    {
      id: 'vitals-alerts',
      label: 'Cảnh báo Sinh hiệu Bất thường',
      icon: AlertTriangle,
      badge: '03 Gấp',
      component: <NurseQueueView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Bàn Làm Việc Điều Dưỡng (Vitals Workspace)"
      subtitle="Đo chỉ số sinh hiệu (Huyết áp, Nhịp tim, Nhiệt độ, SpO2, BMI) và theo dõi cảnh báo chỉ số nguy cơ"
      icon={Activity}
      tabs={tabs}
      defaultTabId="vitals-input"
    />
  );
};
