import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { AdminRealtimeMonitorView } from './AdminRealtimeMonitorView';

export const AdminSecurityWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'audit-logs',
      label: 'Nhật ký Truy cập Audit Log',
      icon: ShieldCheck,
      component: <AdminRealtimeMonitorView />
    },
    {
      id: 'fhir-compliance',
      label: 'Rà soát Chuẩn dữ liệu HL7 FHIR R4',
      icon: Sparkles,
      component: <AdminRealtimeMonitorView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Bảo Mật Audit Log & Chuẩn HL7 FHIR (Admin Workspace)"
      subtitle="Quản lý nhật ký hoạt động hệ thống, kiểm soát truy cập dữ liệu y tế và rà soát tính tuân thủ chuẩn HL7 FHIR"
      icon={ShieldCheck}
      tabs={tabs}
      defaultTabId="audit-logs"
    />
  );
};
