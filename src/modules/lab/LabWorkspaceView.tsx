import React from 'react';
import { FlaskConical, FileText, Activity } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { LabOrdersView } from './LabOrdersView';
import { EcgWorkspacePage } from './ecg/EcgWorkspacePage';

export const LabWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'lab-orders',
      label: 'Yêu cầu xét nghiệm',
      icon: FlaskConical,
      component: <LabOrdersView />
    },
    {
      id: 'ecg-ai',
      label: 'Điện tâm đồ ECG & AI Anomaly',
      icon: Activity,
      badge: 'Live',
      component: <EcgWorkspacePage defaultMode="anomaly" />
    },
    {
      id: 'dicom-ai',
      label: 'Upload ảnh DICOM & Phân tích AI',
      icon: FileText,
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
