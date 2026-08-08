import { MapPin, User, Headphones, Calendar, Search, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="w-full shadow-sm sticky top-0 z-50 bg-white flex flex-col">
      {/* Top Bar (Tier 1) */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-3">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">

            {/* Left: Logo + Name */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-20 h-20 flex items-center justify-center select-none overflow-hidden rounded-full border border-slate-200/60 bg-white p-1 shadow-sm group-hover:border-[#0b3c8f] transition-all">
                <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg md:text-xl text-[#0b3c8f] leading-tight uppercase tracking-wide group-hover:text-blue-600 transition-colors">
                  Bệnh viện Đa khoa 4AM
                </span>
                <span className="text-[11px] text-slate-500 font-medium tracking-wider">Hệ thống Y tế uy tín</span>
              </div>
            </Link>

            {/* Right: Contact & Utilities */}
            <div className="flex flex-col items-end space-y-2">
              {/* Row 1: Hotlines */}
              <div className="flex items-center space-x-6 text-sm text-slate-700 font-medium">
                <div className="flex items-center space-x-1.5 hover:text-blue-700 cursor-pointer transition-colors">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Hà Nội: <strong className="text-blue-800">1800 6858</strong></span>
                </div>
                <div className="flex items-center space-x-1.5 hover:text-blue-700 cursor-pointer transition-colors">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Hồ Chí Minh: <strong className="text-blue-800">0287 102 6789</strong></span>
                </div>
              </div>

              {/* Row 2: Utility Links */}
              <div className="flex items-center space-x-4">
                <Link to="/khach-hang" className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-blue-600 transition-colors font-semibold uppercase tracking-wider">
                  <User className="w-3.5 h-3.5" />
                  <span>Dành cho khách hàng</span>
                </Link>
                <div className="w-px h-3 bg-slate-300"></div>
                <Link to="/hoi-dap" className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-blue-600 transition-colors font-semibold uppercase tracking-wider">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Hỏi đáp</span>
                </Link>
                <Link to="/dat-lich" className="flex items-center space-x-1.5 text-xs text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-sm ml-2 border border-orange-600/20">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Đặt lịch khám</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Navigation Bar (Tier 2) */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">

            {/* Desktop Menu */}
            <nav className="hidden md:flex flex-1 justify-between items-center pr-8 border-r border-slate-100">
              <Link to="/gioi-thieu" className="text-[13px] font-bold text-blue-900 hover:text-amber-500 transition-colors uppercase">Giới thiệu</Link>
              <Link to="/chuyen-khoa" className="text-[13px] font-bold text-blue-900 hover:text-amber-500 transition-colors uppercase">Chuyên khoa</Link>
              <Link to="/chuyen-gia" className="text-[13px] font-bold text-blue-900 hover:text-amber-500 transition-colors uppercase">Chuyên gia - Bác sĩ</Link>
              <Link to="/dich-vu" className="text-[13px] font-bold text-blue-900 hover:text-amber-500 transition-colors uppercase">Dịch vụ đặc biệt</Link>
              <Link to="/tien-nghi" className="text-[13px] font-bold text-blue-900 hover:text-amber-500 transition-colors uppercase">Tiện nghi</Link>
              <Link to="/giai-thuong" className="text-[13px] font-bold text-blue-900 hover:text-amber-500 transition-colors uppercase">Giải thưởng</Link>
              <Link to="/tin-tuc" className="text-[13px] font-bold text-blue-900 hover:text-amber-500 transition-colors uppercase">Tin tức</Link>
              <Link to="/lien-he" className="text-[13px] font-bold text-blue-900 hover:text-amber-500 transition-colors uppercase">Liên hệ</Link>
            </nav>

            {/* Search Icon */}
            <div className="hidden md:flex items-center pl-6">
              <button className="text-slate-400 hover:text-blue-600 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex flex-1 justify-end items-center py-2">
              <button className="text-blue-900 hover:text-blue-700">
                <Menu className="h-6 w-6" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
