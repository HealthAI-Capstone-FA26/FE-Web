import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DashboardOverview } from './pages/DashboardOverview';
import Home from './pages/Home';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { SpecialtyPage } from './pages/SpecialtyPage';
import { NewsPage } from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import { CustomerPage } from './pages/CustomerPage';

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

          {/* Clinical Staff & Admin Portal Routes (Per-Role Task System) */}
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/dashboard/*" element={<DashboardOverview />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
