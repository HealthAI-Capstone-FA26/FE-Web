import React from 'react';
import { FileText, CreditCard, ShieldCheck } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { PatientMedicalRecordView } from './PatientMedicalRecordView';
import { PatientInsuranceView } from './PatientInsuranceView';
import { PatientConsentView } from './PatientConsentView';

export const PatientMedicalWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'medical-record',
      label: 'Hồ sơ EMR & Tiền sử y tế',
      icon: FileText,
      badge: 'HL7 FHIR',
      component: <PatientMedicalRecordView />
    },
    {
      id: 'insurance',
      label: 'Thẻ BHYT & Bảo hiểm (FR-2.2)',
      icon: CreditCard,
      component: <PatientInsuranceView />
    },
    {
      id: 'consent',
      label: 'Đồng ý Dữ liệu & AI (FR-2.5)',
      icon: ShieldCheck,
      component: <PatientConsentView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Hồ Sơ Y Tế & Quyền Chia Sẻ Dữ Liệu"
      subtitle="Quản lý hồ sơ bệnh án điện tử, thẻ BHYT và xác nhận quyền chia sẻ dữ liệu y tế"
      tabs={tabs}
      defaultTabId="medical-record"
    />
  );
};
