import React from 'react';
import { FlaskConical, FileText, AlertCircle } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { LabOrdersView } from './LabOrdersView';

export const LabWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'lab-orders',
      label: 'Yêu cầu xét nghiệm',
      icon: FlaskConical,
      component: <LabOrdersView />
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

  return (
    <WorkspaceContainer
      title="Phòng Xét Nghiệm & Chẩn Đoán Hình Ảnh (Lab Workspace)"
      subtitle="Tiếp nhận chỉ định xét nghiệm, tải lên ảnh DICOM và xử lý phân tích tự động từ AI"
      icon={FlaskConical}
      tabs={tabs}
      defaultTabId="lab-orders"
    />
  );
};
