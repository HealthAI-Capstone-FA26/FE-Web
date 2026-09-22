import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, User, Headphones, Calendar, Search, Menu, LogIn, X,
  Info, Stethoscope, UserCheck, Zap, Building2, Trophy, Newspaper, PhoneCall
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LoginModal } from '../auth/LoginModal';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DEFAULT_PATHS } from '../../types/dashboard';
import { UserProfilePill } from '../common/UserProfilePill';

const NAV_ITEMS = [
  { id: 'gioi-thieu', label: 'Giới thiệu', path: '/gioi-thieu', icon: Info },
  { id: 'chuyen-khoa', label: 'Chuyên khoa', path: '/chuyen-khoa', icon: Stethoscope },
  { id: 'chuyen-gia', label: 'Chuyên gia - Bác sĩ', path: '/chuyen-gia', icon: UserCheck },
  { id: 'dich-vu', label: 'Dịch vụ đặc biệt', path: '/dich-vu', icon: Zap },
  { id: 'tien-nghi', label: 'Tiện nghi', path: '/tien-nghi', icon: Building2 },
  { id: 'giai-thuong', label: 'Giải thưởng', path: '/giai-thuong', icon: Trophy },
  { id: 'tin-tuc', label: 'Tin tức', path: '/tin-tuc', icon: Newspaper },
  { id: 'lien-he', label: 'Liên hệ', path: '/lien-he', icon: PhoneCall },
];

export const Header = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { user, currentRole, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="w-full sticky top-0 z-50 bg-white/95 backdrop-blur-md flex flex-col border-b border-slate-200/80 shadow-xs">
      {/* Top Bar (Tier 1) */}
      <div className="bg-slate-50/90 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-2.5">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-3">

            {/* Left: Logo + Name */}
            <Link to="/" className="flex items-center space-x-3 group shrink-0">
              <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center select-none overflow-hidden rounded-full border border-slate-200/80 bg-white p-1 shadow-xs group-hover:border-[#0b3c8f] group-hover:scale-105 transition-all duration-300">
                <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-base md:text-lg text-[#0b3c8f] leading-tight uppercase tracking-wide group-hover:text-blue-600 transition-colors">
                  Bệnh viện Đa khoa 4AM
                </span>
                <span className="text-[10px] md:text-[11px] text-slate-500 font-medium tracking-wider">Hệ thống Y tế uy tín</span>
              </div>
            </Link>

            {/* Middle: Hotlines */}
            <div className="hidden md:flex items-center space-x-5 text-xs md:text-sm text-slate-700 font-medium bg-white px-4 py-1.5 rounded-full border border-slate-200/80 shadow-2xs">
              <div className="flex items-center space-x-1.5 hover:text-blue-700 cursor-pointer transition-colors">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Hà Nội: <strong className="text-blue-800 font-bold">1800 6858</strong></span>
              </div>
              <div className="w-px h-3 bg-slate-200"></div>
              <div className="flex items-center space-x-1.5 hover:text-blue-700 cursor-pointer transition-colors">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Hồ Chí Minh: <strong className="text-blue-800 font-bold">0287 102 6789</strong></span>
              </div>
            </div>

            {/* Right: Utility Links & Actions */}
            <div className="flex items-center space-x-3 shrink-0">
              <Link to="/khach-hang" className="hidden xl:flex items-center space-x-1.5 text-[11px] text-slate-600 hover:text-blue-600 transition-colors font-semibold uppercase tracking-wider">
                <User className="w-3 h-3" />
                <span>Khách hàng</span>
              </Link>
              <div className="hidden xl:block w-px h-3 bg-slate-300"></div>
              <Link to="/hoi-dap" className="hidden sm:flex items-center space-x-1.5 text-[11px] text-slate-600 hover:text-blue-600 transition-colors font-semibold uppercase tracking-wider">
                <Headphones className="w-3 h-3" />
                <span>Hỏi đáp</span>
              </Link>

              {isLoggedIn && user ? (
                <div className="flex items-center space-x-2 ml-1">
                  <UserProfilePill
                    user={user}
                    roleLabel={currentRole === 'PATIENT' ? 'Cổng Bệnh Nhân' : undefined}
                    onClick={() => navigate(ROLE_DEFAULT_PATHS[currentRole] || '/benh-nhan/ho-so')}
                    showChevron={false}
                  />
                  <button
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="text-[10px] text-slate-400 hover:text-blue-700 font-bold uppercase tracking-wider ml-1 cursor-pointer bg-transparent border-none outline-none"
                    title="Đổi mật khẩu"
                  >
                    [Đổi]
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/', { replace: true });
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-bold uppercase tracking-wider ml-1 cursor-pointer bg-transparent border-none outline-none"
                    title="Đăng xuất"
                  >
                    [Thoát]
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center space-x-1 text-xs text-[#0b3c8f] hover:text-white border border-[#0b3c8f] hover:bg-[#0b3c8f] transition-all font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs cursor-pointer bg-transparent"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </button>
              )}

              <Link to="/dat-lich" className="flex items-center space-x-1 text-xs text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-xs border border-orange-600/20">
                <Calendar className="w-3.5 h-3.5" />
                <span>Đặt lịch khám</span>
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Ultra Smooth GPU-Accelerated Top Dock Bar (Tier 2) */}
      <div className="py-2 px-3 md:px-6 bg-slate-900/95 text-slate-100 shadow-xl border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-center">

          {/* Centered Top Dock Capsule Menu */}
          <div 
            onMouseLeave={() => setHoveredId(null)}
            className="hidden lg:flex items-center gap-1 p-1.5 bg-slate-950/90 rounded-full border border-slate-800/80 backdrop-blur-xl shadow-2xl relative"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const isHovered = hoveredId === item.id;

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onMouseEnter={() => setHoveredId(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium select-none z-10 transition-colors duration-200 group ${
                    isActive
                      ? 'text-slate-950 font-extrabold'
                      : isHovered
                      ? 'text-white'
                      : 'text-slate-300'
                  }`}
                >
                  {/* Active Indicator Capsule (White) */}
                  {isActive && (
                    <motion.div
                      layoutId="activeDockPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 bg-white rounded-full shadow-md shadow-white/10 z-[-1]"
                    />
                  )}

                  {/* Hover Indicator Capsule (Dark Glass) */}
                  {!isActive && isHovered && (
                    <motion.div
                      layoutId="hoverDockPill"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-slate-800/90 border border-slate-700/60 rounded-full shadow-inner z-[-1]"
                    />
                  )}

                  <motion.div
                    animate={{ scale: isHovered || isActive ? 1.15 : 1 }}
                    transition={{ duration: 0.15 }}
                    className="shrink-0 flex items-center justify-center"
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-400'
                      }`}
                    />
                  </motion.div>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="h-4 w-px bg-slate-800 mx-1"></div>

            <button
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-full transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center relative z-10"
              title="Tìm kiếm"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center justify-between w-full">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Danh mục</span>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg cursor-pointer border-none"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-2 pt-2 border-t border-slate-800 grid grid-cols-2 gap-1.5 overflow-hidden"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Render Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={() => { }}
      />
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
};




