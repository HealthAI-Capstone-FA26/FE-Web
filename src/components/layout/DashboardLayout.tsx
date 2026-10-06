import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_NAV_CONFIG, ROLE_DEFAULT_PATHS } from '../../types/dashboard';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getAvatarUrl } from '../../services/api';
import {
  LayoutDashboard,
  User,
  Users,
  UserCheck,
  Activity,
  Stethoscope,
  FlaskConical,
  FileText,
  ShieldCheck,
  Bell,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CreditCard,
  Pill,
  AlertTriangle,
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  Megaphone,
  PanelLeft,
  PanelLeftClose,
  Lock,
  X
} from 'lucide-react';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { AccountInfoView } from '../../modules/patient/AccountInfoView';
import { UserProfilePill } from '../common/UserProfilePill';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, currentRole, logout, can } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Inactivity timer for auto-collapsing sidebar
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveringSidebarRef = useRef<boolean>(false);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      setIsSidebarOpen(false);
    }, 3000);
  }, [clearInactivityTimer]);

  // Initial load & route change: start 3s countdown if sidebar is open and user isn't hovering
  useEffect(() => {
    if (isSidebarOpen && !isHoveringSidebarRef.current) {
      resetInactivityTimer();
    }
    return () => {
      clearInactivityTimer();
    };
  }, [location.pathname, isSidebarOpen, resetInactivityTimer, clearInactivityTimer]);

  const rawNavGroups = ROLE_NAV_CONFIG[currentRole] || ROLE_NAV_CONFIG.DOCTOR;
  const navGroups = rawNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.requiredPermission || can(item.requiredPermission)),
    }))
    .filter((group) => group.items.length > 0);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'CalendarDays':
        return CalendarDays;
      case 'CalendarCheck':
        return CalendarCheck;
      case 'CalendarPlus':
        return CalendarPlus;
      case 'Megaphone':
        return Megaphone;
      case 'UserCheck':
        return UserCheck;
      case 'Users':
        return Users;
      case 'Activity':
        return Activity;
      case 'CreditCard':
        return CreditCard;
      case 'FileText':
        return FileText;
      case 'Stethoscope':
        return Stethoscope;
      case 'Pill':
        return Pill;
      case 'FlaskConical':
        return FlaskConical;
      case 'AlertTriangle':
        return AlertTriangle;
      case 'AlertCircle':
        return AlertCircle;
      case 'ShieldCheck':
        return ShieldCheck;
      case 'Sparkles':
        return Sparkles;
      case 'LayoutDashboard':
      default:
        return LayoutDashboard;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col font-sans antialiased">
      {/* Main Header / Topbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Sidebar Toggle Button (Desktop & Mobile) */}
            <button
              onClick={() => {
                setIsSidebarOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    resetInactivityTimer();
                  } else {
                    clearInactivityTimer();
                  }
                  return next;
                });
              }}
              className="p-2 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200/80 cursor-pointer bg-white"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5 text-slate-700" /> : <PanelLeft className="w-5 h-5 text-blue-700" />}
            </button>

            <Link 
              to={currentRole === 'PATIENT' ? '/' : (ROLE_DEFAULT_PATHS[currentRole] || '/bac-si/danh-sach-kham')} 
              className="flex items-center space-x-3 group"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs group-hover:border-blue-600 transition-colors shrink-0">
                <img src="/images/logo.png" alt="Logo 4AM" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm text-blue-950 uppercase tracking-tight whitespace-nowrap">
                  {currentRole === 'PATIENT' ? 'CỔNG THÔNG TIN BỆNH NHÂN (PATIENT PORTAL)' : 'HỆ THỐNG QUẢN LÝ NỘI BỘ (EMR & AI)'}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                  Phòng khám Tim mạch 4AM • Chuẩn HL7 FHIR R4
                </span>
              </div>
            </Link>
          </div>

          {/* Right Topbar Action & Profile */}
          <div className="flex items-center space-x-3">
            <button className="relative p-2 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-none bg-transparent">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>

            {/* User Profile Card */}
            <div className="relative">
              <UserProfilePill
                user={user}
                isOpen={isRoleDropdownOpen}
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              />

              {/* Dropdown Menu */}
              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/60">
                    <p className="text-xs font-extrabold text-slate-800">{user?.name}</p>
                    <p className="text-[11px] text-slate-500">{user?.email}</p>
                    {user?.department && (
                      <p className="text-[10px] text-blue-700 font-bold mt-0.5">{user.department}</p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      onClick={() => {
                        setIsRoleDropdownOpen(false);
                        setIsProfileOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 cursor-pointer border-none bg-transparent"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Hồ sơ của tôi</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsRoleDropdownOpen(false);
                        setIsChangePasswordOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 cursor-pointer border-none bg-transparent"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Đổi mật khẩu</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setIsRoleDropdownOpen(false);
                        navigate('/', { replace: true });
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer border-none bg-transparent"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}

              <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
              />

              {isProfileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
                  {/* Ambient Liquid Glow Orbs */}
                  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                  </div>

                  <div className="glass-card relative z-10 w-full max-w-2xl max-h-[88vh] flex flex-col p-4 sm:p-6 shadow-2xl overflow-hidden">
                    <button
                      onClick={() => setIsProfileOpen(false)}
                      className="absolute top-4 right-4 z-20 p-2 bg-slate-100/80 hover:bg-slate-200/90 backdrop-blur-md rounded-full transition-all border border-white/80 text-slate-500 hover:text-slate-900 cursor-pointer shadow-xs active:scale-95"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="overflow-y-auto custom-scrollbar pr-1.5 space-y-4 max-h-[calc(88vh-2.5rem)] pb-2">
                      <AccountInfoView />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-10 lg:hidden"
        />
      )}

      {/* Main Screen Container with Flush Left Sidebar */}
      <div className="flex-1 flex w-full relative">
        {/* Floating Arrow Tab on Left Edge when sidebar is collapsed (Vertically Centered) */}
        {!isSidebarOpen && (
          <button
            onClick={() => {
              setIsSidebarOpen(true);
              resetInactivityTimer();
            }}
            onMouseEnter={() => {
              isHoveringSidebarRef.current = true;
              setIsSidebarOpen(true);
              resetInactivityTimer();
            }}
            title="Mở menu điều hướng (Hover hoặc Click)"
            className="fixed left-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-6 sm:w-7 h-14 bg-white hover:bg-blue-600 text-slate-400 hover:text-white border border-l-0 border-slate-200/90 hover:border-blue-600 shadow-md hover:shadow-lg rounded-r-xl transition-all cursor-pointer group"
          >
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Sidebar Sticky & Flush Left - Liquid Glass Rail */}
        <aside
          onMouseEnter={() => {
            isHoveringSidebarRef.current = true;
            setIsSidebarOpen(true);
            resetInactivityTimer();
          }}
          onMouseMove={() => {
            isHoveringSidebarRef.current = true;
            if (!isSidebarOpen) {
              setIsSidebarOpen(true);
            }
            resetInactivityTimer();
          }}
          onMouseLeave={() => {
            isHoveringSidebarRef.current = false;
            resetInactivityTimer();
          }}
          onClick={() => {
            resetInactivityTimer();
          }}
          className={`fixed lg:sticky top-[78px] left-0 z-20 h-[calc(100vh-78px)] transition-all duration-300 ease-in-out shrink-0 overflow-y-auto overflow-x-hidden ${
            isSidebarOpen
              ? 'w-72 translate-x-0 p-3'
              : 'w-0 p-0 border-r-0 -translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Light Liquid Glass Rail Container Card */}
          <div className="relative h-full rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.08),inset_0_1px_2px_rgba(255,255,255,0.9)] p-3 flex flex-col justify-between text-slate-800 overflow-hidden">
            {/* Ambient Soft Glow Spheres */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-400/20 blur-2xl pointer-events-none" />
            <div className="absolute bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-400/15 blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              {/* Header inside Sidebar with quick collapse button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shadow-2xs shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  </div>
                  <span className="text-xs font-black uppercase text-slate-800 tracking-wide">
                    Menu điều hướng
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSidebarOpen(false);
                    clearInactivityTimer();
                  }}
                  title="Thu gọn menu"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200 bg-transparent flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Categorized Tab Groups inside Sidebar */}
              <div className="space-y-4">
                {navGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-2">
                    <div className="px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                      <span>{group.groupName}</span>
                    </div>

                    {group.items.map((item) => {
                      const Icon = getIconComponent(item.iconName);

                      return (
                        <NavLink
                          key={item.id}
                          to={item.path}
                          title={item.label}
                          className={({ isActive }) =>
                            `group relative flex items-center w-full justify-between px-3 py-2.5 rounded-2xl text-xs text-left transition-all duration-200 cursor-pointer ${
                              isActive
                                ? 'bg-white text-blue-950 font-bold shadow-[0_10px_25px_-5px_rgba(59,130,246,0.25)] border border-blue-200/80 scale-[1.02]'
                                : 'bg-white/40 hover:bg-white/80 text-slate-700 hover:text-blue-900 font-semibold border border-white/60 hover:border-blue-200/60 hover:scale-[1.01] hover:translate-x-0.5 shadow-2xs'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div className="flex items-center space-x-2.5 min-w-0 flex-1 relative z-10">
                                <div
                                  className={`p-1.5 rounded-xl transition-colors shrink-0 ${
                                    isActive
                                      ? 'bg-blue-600 text-white shadow-2xs'
                                      : 'bg-white/80 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 border border-slate-200/50'
                                  }`}
                                >
                                  <Icon className="w-4 h-4 shrink-0" />
                                </div>
                                <span className="text-xs font-bold leading-snug tracking-tight text-slate-800 group-hover:text-blue-900 transition-colors">
                                  {item.label}
                                </span>
                              </div>

                              {item.badge && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ml-1.5 relative z-10 ${
                                    isActive
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>


          </div>
        </aside>

        {/* Content Outlet */}
        <main className={`flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden min-w-0 transition-all duration-300 ${!isSidebarOpen ? 'pl-8 sm:pl-10 lg:pl-12' : ''}`}>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
