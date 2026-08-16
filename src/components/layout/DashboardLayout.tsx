import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_NAV_CONFIG } from '../../types/dashboard';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
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
  Menu,
  X,
  Sparkles,
  CreditCard,
  Pill,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface DashboardLayoutProps {
  children?: React.ReactNode;
  activeTabId?: string;
  onSelectTab?: (tabId: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTabId: externalActiveTabId,
  onSelectTab
}) => {
  const { user, currentRole, switchRole, logout, allRoles } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const navGroups = ROLE_NAV_CONFIG[currentRole] || ROLE_NAV_CONFIG.DOCTOR;
  const defaultTabId = navGroups[0]?.items[0]?.id || 'doc_emr_ai';

  const [internalActiveTabId, setInternalActiveTabId] = useState<string>(defaultTabId);

  // Sync default tab when role changes
  useEffect(() => {
    const newDefault = navGroups[0]?.items[0]?.id || 'doc_emr_ai';
    setInternalActiveTabId(newDefault);
    if (onSelectTab) {
      onSelectTab(newDefault);
    }
  }, [currentRole]);

  const activeTabId = externalActiveTabId || internalActiveTabId;

  const handleTabClick = (tabId: string) => {
    setInternalActiveTabId(tabId);
    if (onSelectTab) {
      onSelectTab(tabId);
    }
    setIsSidebarOpen(false);
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
      {/* Dev Demo Quick Role Switcher Bar */}
      <div className="bg-slate-950 text-slate-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between border-b border-slate-800 gap-2 sticky top-0 z-40">
        <div className="flex items-center space-x-2 shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold text-blue-400 uppercase tracking-wide whitespace-nowrap">
            [Demo Role Switcher]
          </span>
          <span className="hidden md:inline text-slate-400 whitespace-nowrap">
            Chuyển vai trò quản lý nhiệm vụ nội bộ:
          </span>
        </div>

        {/* Role buttons with whitespace-nowrap and shrink-0 to prevent word wrapping */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          {allRoles.map((r) => {
            const isActive = r.role === currentRole;
            return (
              <button
                key={r.role}
                onClick={() => {
                  switchRole(r.role);
                  setIsRoleDropdownOpen(false);
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Header / Topbar */}
      <header className="bg-white border-b border-slate-200 sticky top-[33px] z-30 shadow-xs">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg border border-slate-200 cursor-pointer"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-extrabold text-sm shadow-md group-hover:bg-blue-800 transition-colors">
                4AM
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm text-blue-950 uppercase tracking-tight whitespace-nowrap">
                  HỆ THỐNG QUẢN LÝ NỘI BỘ (EMR & AI)
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
              <span>Phân Hệ Nội Bộ Bệnh Viện</span>
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
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-900 font-extrabold text-xs flex items-center justify-center border border-blue-200">
                  {user?.name.charAt(0)}
                </div>
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
                    <p className="text-[10px] text-blue-700 font-bold mt-0.5">{user?.department}</p>
                  </div>

                  <div className="py-1">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Đổi vai trò nội bộ
                    </div>
                    {allRoles.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => {
                          switchRole(r.role);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-100 cursor-pointer ${
                          r.role === currentRole ? 'font-bold text-blue-700 bg-blue-50/50' : 'text-slate-700'
                        }`}
                      >
                        <span className="whitespace-nowrap">{r.label}</span>
                        {r.role === currentRole && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      onClick={() => {
                        logout();
                        setIsRoleDropdownOpen(false);
                        navigate('/dashboard');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer border-none bg-transparent"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Screen Container with Flush Left Sidebar */}
      <div className="flex-1 flex w-full relative">
        {/* Sidebar Sticky & Flush Left */}
        <aside
          className={`fixed lg:sticky top-[78px] left-0 z-20 w-72 h-[calc(100vh-78px)] bg-white border-r border-slate-200/90 transform transition-transform duration-200 ease-in-out shrink-0 overflow-y-auto ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex flex-col justify-between h-full p-4 space-y-4">
            <div className="space-y-5">
              {/* Active Role Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md">
                <div className="flex items-center justify-between text-[10px] text-blue-200 uppercase font-black tracking-wider mb-1">
                  <span>Phân hệ nội bộ</span>
                  <Badge variant="ai" size="sm">
                    {currentRole}
                  </Badge>
                </div>
                <div className="text-sm font-black text-white leading-tight">
                  {user?.roleTitle}
                </div>
                <div className="text-[11px] text-blue-200/80 mt-1 font-medium line-clamp-1">
                  {user?.department || 'Hệ thống Quản lý Y tế'}
                </div>
              </div>

              {/* Categorized Tab Groups inside Sidebar with SINGLE ACTIVE HIGHLIGHT */}
              <div className="space-y-4">
                {navGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <div className="px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {group.groupName}
                    </div>
                    {group.items.map((item) => {
                      const Icon = getIconComponent(item.iconName);
                      // ONLY MATCH EXACT ITEM ID FOR ACTIVE HIGHLIGHT!
                      const isItemActive = item.id === activeTabId;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabClick(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer border text-left ${
                            isItemActive
                              ? 'bg-blue-600 text-white border-blue-600 font-black shadow-sm'
                              : 'bg-transparent border-transparent text-slate-700 hover:bg-slate-100 hover:text-blue-900 font-bold'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <Icon className={`w-4 h-4 shrink-0 ${isItemActive ? 'text-white' : 'text-slate-500'}`} />
                            <span className="truncate whitespace-nowrap">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ml-1 ${
                                isItemActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Footer Info */}
            <div className="pt-3 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="whitespace-nowrap">Tiêu chuẩn HL7 FHIR</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Dữ liệu y tế liên thông toàn diện & tích hợp Mô-đun AI.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden min-w-0">{children}</main>
      </div>
    </div>
  );
};
