import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { PlaceholderPage } from './pages/PlaceholderPage';
import NewsDetailPage from './pages/NewsDetailPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gioi-thieu" element={<PlaceholderPage title="Giới thiệu" />} />
        <Route path="/chuyen-khoa" element={<PlaceholderPage title="Chuyên khoa" />} />
        <Route path="/chuyen-gia" element={<PlaceholderPage title="Chuyên gia - Bác sĩ" />} />
        <Route path="/dich-vu" element={<PlaceholderPage title="Dịch vụ đặc biệt" />} />
        <Route path="/tien-nghi" element={<PlaceholderPage title="Tiện nghi" />} />
        <Route path="/giai-thuong" element={<PlaceholderPage title="Giải thưởng" />} />
        <Route path="/tin-tuc" element={<PlaceholderPage title="Tin tức" />} />
        <Route path="/tin-tuc/:id" element={<NewsDetailPage />} />
        <Route path="/lien-he" element={<PlaceholderPage title="Liên hệ" />} />
      </Routes>
    </Router>
  );
}

export default App;
