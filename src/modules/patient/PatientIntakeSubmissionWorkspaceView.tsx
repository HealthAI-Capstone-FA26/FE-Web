import React from 'react';
import { Activity, FileText } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { PatientSymptomIntakeView } from './PatientSymptomIntakeView';
import { PatientImportRecordView } from './PatientImportRecordView';

export const PatientIntakeSubmissionWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'symptoms',
      label: 'Khai báo Triệu chứng (FR-2.3)',
      icon: Activity,
      component: <PatientSymptomIntakeView />
    },
    {
      id: 'import-fhir',
      label: 'Import Hồ sơ FHIR (FR-2.6)',
      icon: FileText,
      component: <PatientImportRecordView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Khai Báo Triệu Chứng & Tải Lên Dữ Liệu Y Tế"
      subtitle="Khai báo thông tin triệu chứng sức khỏe trước khi khám và import dữ liệu y tế chuẩn HL7 FHIR R4"
      tabs={tabs}
      defaultTabId="symptoms"
    />
  );
};
