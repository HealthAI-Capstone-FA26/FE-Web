import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardOverview } from './pages/DashboardOverview';
import { ROLE_DEFAULT_PATHS } from './types/dashboard';

// Public Patient-Facing Pages
import Home from './pages/Home';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { SpecialtyPage } from './pages/SpecialtyPage';
import { NewsPage } from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import { CustomerPage } from './pages/CustomerPage';

// Internal Role Views
import { ReceptionCheckinView } from './modules/reception/ReceptionCheckinView';
import { ReceptionPatientsView } from './modules/reception/ReceptionPatientsView';
import { ReceptionWalkinBookingView } from './modules/reception/ReceptionWalkinBookingView';
import { ReceptionBillingView } from './modules/reception/ReceptionBillingView';
import { ReceptionPatientProfileFormView } from './modules/reception/ReceptionPatientProfileFormView';
import { ReceptionSymptomIntakeView } from './modules/reception/ReceptionSymptomIntakeView';

import { NurseQueueView } from './modules/nurse/NurseQueueView';

import { DoctorEMRView } from './modules/doctor/DoctorEMRView';
import { DoctorDiagnosisView } from './modules/doctor/DoctorDiagnosisView';
import { DoctorPrescriptionView } from './modules/doctor/DoctorPrescriptionView';

import { LabOrdersView } from './modules/lab/LabOrdersView';

import { AdminRealtimeMonitorView } from './modules/admin/AdminRealtimeMonitorView';

import { PatientPortalAppointmentsView } from './modules/patient/PatientPortalAppointmentsView';
import { PatientProfileFormView } from './modules/patient/PatientProfileFormView';
import { PatientConsentView } from './modules/patient/PatientConsentView';
import { PatientSymptomIntakeView } from './modules/patient/PatientSymptomIntakeView';
import { PatientInsuranceView } from './modules/patient/PatientInsuranceView';
import { PatientImportRecordView } from './modules/patient/PatientImportRecordView';

const DashboardRedirect = () => {
  const { currentRole } = useAuth();
  const defaultPath = ROLE_DEFAULT_PATHS[currentRole] || '/bac-si/danh-sach-kham';
  return <Navigate to={defaultPath} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Patient-Facing Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/gioi-thieu" element={<PlaceholderPage title="Giới thiệu" />} />
          <Route path="/chuyen-khoa" element={<SpecialtyPage />} />
          <Route path="/khach-hang" element={<CustomerPage />} />
          <Route path="/chuyen-gia" element={<PlaceholderPage title="Chuyên gia - Bác sĩ" />} />
          <Route path="/dich-vu" element={<PlaceholderPage title="Dịch vụ đặc biệt" />} />
          <Route path="/tien-nghi" element={<PlaceholderPage title="Tiện nghi" />} />
          <Route path="/giai-thuong" element={<PlaceholderPage title="Giải thưởng" />} />
          <Route path="/tin-tuc" element={<NewsPage />} />
          <Route path="/tin-tuc/:id" element={<NewsDetailPage />} />
          <Route path="/lien-he" element={<PlaceholderPage title="Liên hệ" />} />

          {/* Clinical Staff & Patient Portal Routes (Nested under DashboardOverview Layout) */}
          <Route element={<DashboardOverview />}>
            {/* BENH NHAN (PATIENT) - Module 2 Intake */}
            <Route path="/benh-nhan/ho-so" element={<PatientProfileFormView />} />
            <Route path="/benh-nhan/dong-y" element={<PatientConsentView />} />
            <Route path="/benh-nhan/trieu-chung" element={<PatientSymptomIntakeView />} />
            <Route path="/benh-nhan/bao-hiem" element={<PatientInsuranceView />} />
            <Route path="/benh-nhan/nhap-ho-so" element={<PatientImportRecordView />} />
            <Route path="/benh-nhan/lich-hen" element={<PatientPortalAppointmentsView />} />
            <Route path="/benh-nhan/ho-so-don-thuoc" element={<PatientPortalAppointmentsView />} />

            {/* TIEP NHAN (RECEPTION) - Module 2 Intake */}
            <Route path="/tiep-nhan/danh-sach-cho" element={<ReceptionCheckinView />} />
            <Route path="/tiep-nhan/benh-nhan" element={<ReceptionPatientsView />} />
            <Route path="/tiep-nhan/ho-so-benh-nhan" element={<ReceptionPatientProfileFormView />} />
            <Route path="/tiep-nhan/dang-ky-tai-quay" element={<ReceptionWalkinBookingView />} />
            <Route path="/tiep-nhan/trieu-chung-benh-nhan" element={<ReceptionSymptomIntakeView />} />
            <Route path="/tiep-nhan/hang-cho-phong-kham" element={<ReceptionCheckinView />} />
            <Route path="/tiep-nhan/thu-phi" element={<ReceptionBillingView />} />
            <Route path="/tiep-nhan/ho-don" element={<ReceptionBillingView />} />

            {/* DIEU DUONG (NURSE) */}
            <Route path="/dieu-duong/hang-cho-sinh-hieu" element={<NurseQueueView />} />
            <Route path="/dieu-duong/nhap-sinh-hieu" element={<NurseQueueView />} />
            <Route path="/dieu-duong/canh-bao" element={<NurseQueueView />} />

            {/* BAC SI (DOCTOR) */}
            <Route path="/bac-si/danh-sach-kham" element={<DoctorEMRView />} />
            <Route path="/bac-si/hang-cho-kham" element={<DoctorEMRView />} />
            <Route path="/bac-si/kham-benh" element={<DoctorDiagnosisView />} />
            <Route path="/bac-si/ke-don" element={<DoctorPrescriptionView />} />

            {/* XET NGHIEM (LAB) */}
            <Route path="/xet-nghiem/hang-cho-xet-nghiem" element={<LabOrdersView />} />
            <Route path="/xet-nghiem/upload-dicom" element={<LabOrdersView />} />
            <Route path="/xet-nghiem/canh-bao" element={<LabOrdersView />} />

            {/* QUAN TRI (ADMIN) */}
            <Route path="/quan-tri/tong-quan" element={<AdminRealtimeMonitorView />} />
            <Route path="/quan-tri/bao-cao" element={<AdminRealtimeMonitorView />} />
            <Route path="/quan-tri/nhat-ky-he-thong" element={<AdminRealtimeMonitorView />} />
            <Route path="/quan-tri/fhir-log" element={<AdminRealtimeMonitorView />} />
          </Route>

          {/* Legacy / Catch-all Dashboard Redirects */}
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/dashboard/*" element={<DashboardRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
