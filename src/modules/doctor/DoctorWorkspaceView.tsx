import React from 'react';
import { Stethoscope, FileText, Pill } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { DoctorEMRView } from './DoctorEMRView';
import { DoctorDiagnosisView } from './DoctorDiagnosisView';
import { DoctorPrescriptionView } from './DoctorPrescriptionView';

export const DoctorWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'emr-ai',
      label: 'Hàng chờ & Hồ sơ EMR (Tóm tắt AI)',
      icon: Stethoscope,
      badge: '15 Ca',
      component: <DoctorEMRView />
    },
    {
      id: 'icd10-diagnosis',
      label: 'Chẩn đoán mã ICD-10',
      icon: FileText,
      component: <DoctorDiagnosisView />
    },
    {
      id: 'prescription',
      label: 'Kê đơn thuốc & Ký số',
      icon: Pill,
      component: <DoctorPrescriptionView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Bàn Làm Việc Bác Sĩ (Clinical Workspace)"
      subtitle="Quản lý danh sách hàng chờ, tóm tắt AI hồ sơ EMR, chẩn đoán ICD-10 và kê đơn ký số đồng bộ trên 1 giao diện"
      icon={Stethoscope}
      tabs={tabs}
      defaultTabId="emr-ai"
    />
  );
};
