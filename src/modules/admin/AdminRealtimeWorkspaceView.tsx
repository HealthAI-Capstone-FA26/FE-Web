import React from 'react';
import { LayoutDashboard, Activity } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { AdminRealtimeMonitorView } from './AdminRealtimeMonitorView';

export const AdminRealtimeWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'realtime-monitor',
      label: 'Dashboard Realtime 7 Bước',
      icon: LayoutDashboard,
      badge: 'Live',
      component: <AdminRealtimeMonitorView />
    },
    {
      id: 'wait-reports',
      label: 'Báo cáo Thời gian Chờ & KPI',
      icon: Activity,
      component: <AdminRealtimeMonitorView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Giám Sát Realtime & Báo Cáo KPI (Admin Workspace)"
      subtitle="Theo dõi luồng khám bệnh 7 bước thời gian thực, đo lường thời gian chờ của bệnh nhân và cảnh báo tắc nghẽn"
      icon={LayoutDashboard}
      tabs={tabs}
      defaultTabId="realtime-monitor"
    />
  );
};
