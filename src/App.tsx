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

// Consolidated Workspaces
import { DoctorWorkspaceView } from './modules/doctor/DoctorWorkspaceView';
import { ReceptionIntakeWorkspaceView } from './modules/reception/ReceptionIntakeWorkspaceView';
import { ReceptionPatientManageWorkspaceView } from './modules/reception/ReceptionPatientManageWorkspaceView';
import { ReceptionBillingWorkspaceView } from './modules/reception/ReceptionBillingWorkspaceView';
import { NurseWorkspaceView } from './modules/nurse/NurseWorkspaceView';
import { LabWorkspaceView } from './modules/lab/LabWorkspaceView';
import { AdminRealtimeWorkspaceView } from './modules/admin/AdminRealtimeWorkspaceView';
import { AdminSecurityWorkspaceView } from './modules/admin/AdminSecurityWorkspaceView';
import { PatientIntakeWorkspaceView } from './modules/patient/PatientIntakeWorkspaceView';
import { PatientMedicalWorkspaceView } from './modules/patient/PatientMedicalWorkspaceView';
import { PatientIntakeSubmissionWorkspaceView } from './modules/patient/PatientIntakeSubmissionWorkspaceView';
import { PatientRecordsWorkspaceView } from './modules/patient/PatientRecordsWorkspaceView';

import { ProtectedRoute } from './components/common/ProtectedRoute';

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

          {/* Consolidated Internal Workspaces (Nested under DashboardOverview Layout) */}
          <Route element={<DashboardOverview />}>
            {/* BỆNH NHÂN WORKSPACES */}
            <Route element={<ProtectedRoute requiredRole={['PATIENT', 'ADMIN']} />}>
              <Route path="/benh-nhan/ho-so" element={<PatientIntakeWorkspaceView />} />
              <Route path="/benh-nhan/ho-so-y-te" element={<PatientMedicalWorkspaceView />} />
              <Route path="/benh-nhan/dong-y" element={<PatientMedicalWorkspaceView />} />
              <Route path="/benh-nhan/trieu-chung" element={<PatientIntakeSubmissionWorkspaceView />} />
              <Route path="/benh-nhan/bao-hiem" element={<PatientMedicalWorkspaceView />} />
              <Route path="/benh-nhan/nhap-ho-so" element={<PatientIntakeSubmissionWorkspaceView />} />
              
              <Route path="/benh-nhan/lich-hen" element={<PatientRecordsWorkspaceView />} />
              <Route path="/benh-nhan/ho-so-don-thuoc" element={<PatientRecordsWorkspaceView />} />
            </Route>

            {/* TIẾP NHẬN WORKSPACES */}
            <Route element={<ProtectedRoute requiredRole={['RECEPTION', 'ADMIN']} />}>
              <Route path="/tiep-nhan/danh-sach-cho" element={<ReceptionIntakeWorkspaceView />} />
              <Route path="/tiep-nhan/dang-ky-tai-quay" element={<ReceptionIntakeWorkspaceView />} />
              <Route path="/tiep-nhan/ho-so-benh-nhan" element={<ReceptionIntakeWorkspaceView />} />

              <Route path="/tiep-nhan/benh-nhan" element={<ReceptionPatientManageWorkspaceView />} />
              <Route path="/tiep-nhan/trieu-chung-benh-nhan" element={<ReceptionPatientManageWorkspaceView />} />
              <Route path="/tiep-nhan/hang-cho-phong-kham" element={<ReceptionIntakeWorkspaceView />} />
              
              <Route path="/tiep-nhan/thu-phi" element={<ReceptionBillingWorkspaceView />} />
              <Route path="/tiep-nhan/ho-don" element={<ReceptionBillingWorkspaceView />} />
            </Route>

            {/* ĐIỀU DƯỠNG WORKSPACE */}
            <Route element={<ProtectedRoute requiredRole={['NURSE', 'ADMIN']} />}>
              <Route path="/dieu-duong/hang-cho-sinh-hieu" element={<NurseWorkspaceView />} />
              <Route path="/dieu-duong/nhap-sinh-hieu" element={<NurseWorkspaceView />} />
              <Route path="/dieu-duong/canh-bao" element={<NurseWorkspaceView />} />
            </Route>

            {/* BÁC SĨ WORKSPACE */}
            <Route element={<ProtectedRoute requiredRole={['DOCTOR', 'ADMIN']} />}>
              <Route path="/bac-si/danh-sach-kham" element={<DoctorWorkspaceView />} />
              <Route path="/bac-si/hang-cho-kham" element={<DoctorWorkspaceView />} />
              <Route path="/bac-si/kham-benh" element={<DoctorWorkspaceView />} />
              <Route path="/bac-si/ke-don" element={<DoctorWorkspaceView />} />
            </Route>

            {/* XÉT NGHIỆM WORKSPACE */}
            <Route element={<ProtectedRoute requiredRole={['LAB', 'ADMIN']} />}>
              <Route path="/xet-nghiem/hang-cho-xet-nghiem" element={<LabWorkspaceView />} />
              <Route path="/xet-nghiem/upload-dicom" element={<LabWorkspaceView />} />
              <Route path="/xet-nghiem/canh-bao" element={<LabWorkspaceView />} />
            </Route>

            {/* QUẢN TRỊ WORKSPACES */}
            <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
              <Route path="/quan-tri/tong-quan" element={<AdminRealtimeWorkspaceView />} />
              <Route path="/quan-tri/bao-cao" element={<AdminRealtimeWorkspaceView />} />
              <Route path="/quan-tri/nhat-ky-he-thong" element={<AdminSecurityWorkspaceView />} />
              <Route path="/quan-tri/fhir-log" element={<AdminSecurityWorkspaceView />} />
            </Route>
          </Route>

          {/* Catch-all Dashboard Redirects */}
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/dashboard/*" element={<DashboardRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
