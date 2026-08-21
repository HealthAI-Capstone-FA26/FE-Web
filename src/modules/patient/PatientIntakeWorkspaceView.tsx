import React from 'react';
import { UserCheck, Users, FileText, Activity, CreditCard, ShieldCheck } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { AccountInfoView } from './AccountInfoView';
import { PatientProfilesView } from './PatientProfilesView';
import { PatientMedicalRecordView } from './PatientMedicalRecordView';
import { PatientSymptomIntakeView } from './PatientSymptomIntakeView';
import { PatientInsuranceView } from './PatientInsuranceView';
import { PatientConsentView } from './PatientConsentView';
import { PatientImportRecordView } from './PatientImportRecordView';

export const PatientIntakeWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'account-info',
      label: '1. Tài khoản của tôi',
      icon: UserCheck,
      badge: 'Account',
      component: <AccountInfoView />
    },
    {
      id: 'patient-profiles',
      label: '2. Profile Cá nhân & Người thân',
      icon: Users,
      component: <PatientProfilesView />
    },
    {
      id: 'medical-record',
      label: '3. Hồ sơ Y tế & Tiền sử (EMR)',
      icon: FileText,
      badge: 'HL7 FHIR',
      component: <PatientMedicalRecordView />
    },
    {
      id: 'symptoms',
      label: '4. Khai báo Triệu chứng (FR-2.3)',
      icon: Activity,
      component: <PatientSymptomIntakeView />
    },
    {
      id: 'insurance',
      label: '5. Thẻ BHYT & Bảo hiểm (FR-2.2)',
      icon: CreditCard,
      component: <PatientInsuranceView />
    },
    {
      id: 'consent',
      label: '6. Đồng ý Dữ liệu & AI (FR-2.5)',
      icon: ShieldCheck,
      component: <PatientConsentView />
    },
    {
      id: 'import-fhir',
      label: '7. Import Hồ sơ FHIR (FR-2.6)',
      icon: FileText,
      component: <PatientImportRecordView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Cổng Bệnh Nhân & Khai Báo Y Tế (Patient Portal)"
      subtitle="Phân định rõ Thông tin Tài khoản trực tuyến, Profile hành chính cá nhân/người thân và Hồ sơ Y tế lâm sàng Bệnh viện 4AM"
      icon={UserCheck}
      tabs={tabs}
      defaultTabId="account-info"
    />
  );
};
