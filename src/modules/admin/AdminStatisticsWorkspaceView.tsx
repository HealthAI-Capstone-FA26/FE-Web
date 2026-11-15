import React from 'react';
import { BarChart3 } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { AdminStatisticsView } from './AdminStatisticsView';

export const AdminStatisticsWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'statistics-overview',
      label: 'Thống Kê & Báo Cáo Vận Hành',
      icon: BarChart3,
      component: <AdminStatisticsView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Thống Kê & Báo Cáo Vận Hành (SE07)"
      subtitle="Giám sát lưu lượng khám thời gian thực, doanh thu viện phí, hiệu suất cận lâm sàng và thời gian chờ từng chặng"
      icon={BarChart3}
      tabs={tabs}
      defaultTabId="statistics-overview"
    />
  );
};

