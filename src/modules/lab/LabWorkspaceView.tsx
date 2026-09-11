import React from 'react';
import { useLocation } from 'react-router-dom';
import { FlaskConical, FileText, AlertCircle, Building2 } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { LabOrdersView } from './LabOrdersView';
import { LabRoomsView } from './LabRoomsView';

export const LabWorkspaceView: React.FC = () => {
  const location = useLocation();

  const tabs: WorkspaceTab[] = [
    {
      id: 'lab-orders',
      label: 'Hàng chờ & Chỉ định Xét nghiệm',
      icon: FlaskConical,
      badge: '09 Ca',
      component: <LabOrdersView />
    },
    {
      id: 'lab-rooms',
      label: 'Phòng Lab & Phân công KTV',
      icon: Building2,
      component: <LabRoomsView />
    },
    {
      id: 'dicom-ai',
      label: 'Upload ảnh DICOM & Phân tích AI',
      icon: FileText,
      component: <LabOrdersView />
    },
    {
      id: 'lab-alerts',
      label: 'Cảnh báo Chỉ số Nguy cấp',
      icon: AlertCircle,
      badge: '02 Ca',
      component: <LabOrdersView />
    }
  ];

  const defaultTab = location.pathname.includes('/xet-nghiem/phong-lab') ? 'lab-rooms' : 'lab-orders';

  return (
    <WorkspaceContainer
      title="Phòng Xét Nghiệm & Chẩn Đoán Hình Ảnh (Lab Workspace)"
      subtitle="Tiếp nhận chỉ định xét nghiệm, quản lý phân công phòng Lab, tải lên ảnh DICOM và xử lý phân tích tự động từ AI"
      icon={FlaskConical}
      tabs={tabs}
      defaultTabId={defaultTab}
    />
  );
};
