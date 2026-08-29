import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_NAV_CONFIG, ROLE_DEFAULT_PATHS } from '../../types/dashboard';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getAvatarUrl } from '../../services/api';
import type { UserRole } from '../../types/auth';
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
  Sparkles,
  CreditCard,
  Pill,
  AlertTriangle,
  AlertCircle,
  PanelLeft,
  PanelLeftClose,
  Lock,
  X
} from 'lucide-react';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { AccountInfoView } from '../../modules/patient/AccountInfoView';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, currentRole, switchRole, logout, allRoles, can } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const rawNavGroups = ROLE_NAV_CONFIG[currentRole] || ROLE_NAV_CONFIG.DOCTOR;
  const navGroups = rawNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.requiredPermission || can(item.requiredPermission)),
    }))
    .filter((group) => group.items.length > 0);

  const handleRoleSwitch = (targetRole: UserRole) => {
    switchRole(targetRole);
    setIsRoleDropdownOpen(false);
    const targetPath = ROLE_DEFAULT_PATHS[targetRole] || '/bac-si/danh-sach-kham';
    navigate(targetPath);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
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
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200/80 cursor-pointer bg-white"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5 text-slate-700" /> : <PanelLeft className="w-5 h-5 text-blue-700" />}
            </button>

            <Link to={ROLE_DEFAULT_PATHS[currentRole] || '/bac-si/danh-sach-kham'} className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-extrabold text-sm shadow-md group-hover:bg-blue-800 transition-colors">
                4AM
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm text-blue-950 uppercase tracking-tight whitespace-nowrap">
                  {currentRole === 'PATIENT' ? 'CỔNG THÔNG TIN BỆNH NHÂN (PATIENT PORTAL)' : 'HỆ THỐNG QUẢN LÝ NỘI BỘ (EMR & AI)'}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                  Bệnh viện Đa khoa 4AM • Chuẩn HL7 FHIR R4
                </span>
              </div>
            </Link>
          </div>

          {/* Right Topbar Action & Profile */}
          <div className="flex items-center space-x-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 font-bold px-3 py-1.5 rounded-lg border border-slate-200/80 whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>{user?.roleTitle || (currentRole === 'PATIENT' ? 'Cổng Bệnh Nhân 4AM' : 'Phân Hệ Nội Bộ Bệnh Viện')}</span>
            </span>

            <div className="w-px h-4 bg-slate-200 hidden md:block"></div>

            <button className="relative p-2 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-none bg-transparent">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>

            {/* User Profile Card */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center space-x-2.5 p-1.5 pl-2.5 rounded-xl hover:bg-slate-100 transition-all border border-slate-200/80 cursor-pointer bg-white"
              >
                {user?.avatar ? (
                  <img
                    src={getAvatarUrl(user.avatar)}
                    alt={user?.name || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-blue-200 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200 shrink-0">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-extrabold text-slate-800 leading-tight whitespace-nowrap">{user?.name}</div>
                  <div className="text-[10px] text-blue-700 font-bold uppercase whitespace-nowrap">{user?.roleTitle}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
                    <button
                      onClick={() => setIsProfileOpen(false)}
                      className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                    <AccountInfoView />
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
        {/* Sidebar Sticky & Flush Left */}
        <aside
          className={`fixed lg:sticky top-[78px] left-0 z-20 h-[calc(100vh-78px)] bg-white border-r border-slate-200/90 transition-all duration-300 ease-in-out shrink-0 overflow-y-auto ${isSidebarOpen
            ? 'w-72 translate-x-0 p-4'
            : '-translate-x-full lg:translate-x-0 lg:w-20 p-2'
            }`}
        >
          <div className="flex flex-col justify-between h-full space-y-4">
            <div className="space-y-4">
              {/* Categorized Tab Groups inside Sidebar */}
              <div className="space-y-4">
                {navGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    {isSidebarOpen ? (
                      <div className="px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        {group.groupName}
                      </div>
                    ) : (
                      <div className="h-px bg-slate-200/80 my-2 mx-1" title={group.groupName} />
                    )}

                    {group.items.map((item) => {
                      const Icon = getIconComponent(item.iconName);

                      return (
                        <NavLink
                          key={item.id}
                          to={item.path}
                          title={item.label}
                          className={({ isActive }) =>
                            `flex items-center transition-all cursor-pointer border ${isSidebarOpen
                              ? 'w-full justify-between px-3 py-2.5 rounded-xl text-xs text-left'
                              : 'w-11 h-11 mx-auto justify-center rounded-xl'
                            } ${isActive
                              ? 'bg-blue-600 text-white border-blue-600 font-black shadow-sm'
                              : 'bg-transparent border-transparent text-slate-700 hover:bg-slate-100 hover:text-blue-900 font-bold'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isSidebarOpen ? (
                                <>
                                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                    <span className="text-xs font-bold leading-tight">{item.label}</span>
                                  </div>
                                  {item.badge && (
                                    <span
                                      className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ml-1 ${isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                                        }`}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <div className="relative flex items-center justify-center">
                                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                                  {item.badge && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                                  )}
                                </div>
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

            {/* Sidebar Footer Info */}
            <div className="pt-3 border-t border-slate-100">
              {isSidebarOpen ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="whitespace-nowrap">Tiêu chuẩn HL7 FHIR</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Dữ liệu y tế liên thông toàn diện & tích hợp Mô-đun AI.
                  </p>
                </div>
              ) : (
                <div className="flex justify-center" title="Tiêu chuẩn HL7 FHIR - Hoạt động">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden min-w-0">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
