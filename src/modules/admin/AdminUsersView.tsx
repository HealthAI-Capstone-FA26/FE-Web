import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Edit3,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Shield,
  UserCheck,
  Stethoscope,
  HeartPulse,
  Receipt,
  FlaskConical,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { userService, type UserItemResponse } from '../../services/user/user.service';
import { getAvatarUrl } from '../../services/api';
import { EditUserModal } from './components/EditUserModal';

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; badgeVariant: 'blue' | 'emerald' | 'amber' | 'purple' | 'slate' | 'rose' }
> = {
  ADMIN: { label: 'Quản trị viên', icon: Shield, color: 'text-purple-600 bg-purple-50 border-purple-200', badgeVariant: 'purple' },
  DOCTOR: { label: 'Bác sĩ', icon: Stethoscope, color: 'text-blue-600 bg-blue-50 border-blue-200', badgeVariant: 'blue' },
  NURSE: { label: 'Điều dưỡng', icon: HeartPulse, color: 'text-rose-600 bg-rose-50 border-rose-200', badgeVariant: 'rose' },
  RECEPTION: { label: 'Lễ tân', icon: Receipt, color: 'text-amber-600 bg-amber-50 border-amber-200', badgeVariant: 'amber' },
  LAB: { label: 'KTV Xét nghiệm', icon: FlaskConical, color: 'text-cyan-600 bg-cyan-50 border-cyan-200', badgeVariant: 'blue' },
  PATIENT: { label: 'Bệnh nhân', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', badgeVariant: 'emerald' },
};

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<UserItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoleTab, setSelectedRoleTab] = useState<string>('ALL');

  // Modal State
  const [editingUser, setEditingUser] = useState<UserItemResponse | null>(null);

  // Toast
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Lỗi tải danh sách người dùng:', err);
      setError(err?.message || 'Không thể kết nối đến máy chủ để tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSuccess = (message?: string) => {
    fetchData();
    if (message) {
      setSuccessToast(message);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  // Role Counts
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: users.length,
      PATIENT: 0,
      DOCTOR: 0,
      NURSE: 0,
      RECEPTION: 0,
      LAB: 0,
      ADMIN: 0,
    };
    users.forEach((u) => {
      const role = (u.actorRole || 'PATIENT').toUpperCase();
      if (counts[role] !== undefined) {
        counts[role]++;
      }
    });
    return counts;
  }, [users]);

  // Filtered List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchQuery ||
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phoneNumber && u.phoneNumber.includes(searchQuery)) ||
        u.userId.toLowerCase().includes(searchQuery.toLowerCase());

      const userRole = (u.actorRole || 'PATIENT').toUpperCase();
      const matchesRole = selectedRoleTab === 'ALL' || userRole === selectedRoleTab;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRoleTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-700" />
            <span>Quản Lý Tài Khoản Người Dùng & Phân Vai Trò</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị toàn bộ tài khoản nhân sự y tế, bác sĩ và bệnh nhân đã đăng ký trong hệ thống
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 self-start md:self-auto border-none cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: 'ALL', label: 'Tổng tài khoản', count: roleCounts.ALL, icon: Users, color: 'text-blue-700 bg-blue-50' },
          { key: 'DOCTOR', label: 'Bác sĩ', count: roleCounts.DOCTOR, icon: Stethoscope, color: 'text-indigo-700 bg-indigo-50' },
          { key: 'NURSE', label: 'Điều dưỡng', count: roleCounts.NURSE, icon: HeartPulse, color: 'text-rose-700 bg-rose-50' },
          { key: 'RECEPTION', label: 'Lễ tân / Thu ngân', count: roleCounts.RECEPTION, icon: Receipt, color: 'text-amber-700 bg-amber-50' },
          { key: 'LAB', label: 'KTV Xét nghiệm', count: roleCounts.LAB, icon: FlaskConical, color: 'text-cyan-700 bg-cyan-50' },
          { key: 'PATIENT', label: 'Bệnh nhân', count: roleCounts.PATIENT, icon: UserCheck, color: 'text-emerald-700 bg-emerald-50' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setSelectedRoleTab(item.key)}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${selectedRoleTab === item.key
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-blue-200 hover:bg-slate-50/50'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold ${selectedRoleTab === item.key ? 'text-blue-100' : 'text-slate-500'}`}>
                {item.label}
              </span>
              <div
                className={`p-1.5 rounded-lg ${selectedRoleTab === item.key ? 'bg-white/20 text-white' : item.color
                  }`}
              >
                <item.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className={`text-xl font-black mt-2 ${selectedRoleTab === item.key ? 'text-white' : 'text-slate-900'}`}>
              {item.count}
            </div>
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Search Bar & Role Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50/30">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, email, SĐT, ID..."
              className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['ALL', 'DOCTOR', 'NURSE', 'RECEPTION', 'LAB', 'PATIENT', 'ADMIN'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedRoleTab(tab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 border cursor-pointer ${selectedRoleTab === tab
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {tab === 'ALL' ? 'Tất cả' : ROLE_CONFIG[tab]?.label || tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Đang tải danh sách người dùng...</span>
          </div>
        ) : error ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3 text-rose-600">
            <AlertCircle className="w-8 h-8" />
            <span className="text-xs font-bold">{error}</span>
            <button
              onClick={fetchData}
              className="mt-2 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-xl cursor-pointer border-none"
            >
              Thử lại
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <div className="text-xs font-bold text-slate-700">Không tìm thấy tài khoản nào</div>
            <p className="text-[11px] text-slate-400">Hãy thử đổi từ khóa tìm kiếm hoặc chọn tab vai trò khác.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Người dùng</th>
                  <th className="py-3 px-4">Liên hệ</th>
                  <th className="py-3 px-4 text-center">Vai trò hệ thống</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Ngày tạo</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const roleKey = (u.actorRole || 'PATIENT').toUpperCase();
                  const roleCfg = ROLE_CONFIG[roleKey] || ROLE_CONFIG.PATIENT;
                  const avatarSrc = u.avatarUrl ? getAvatarUrl(u.avatarUrl) : null;

                  return (
                    <tr key={u.userId} className="hover:bg-slate-50/60 transition-colors">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt={u.fullName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-black shrink-0">
                              {u.fullName ? u.fullName.charAt(0).toUpperCase() : <Users className="w-5 h-5 text-slate-400" />}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate">{u.fullName}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>
                        {u.phoneNumber && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{u.phoneNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                          style={{ backgroundColor: 'var(--role-bg)', color: 'var(--role-text)' }}>
                          <span className={`inline-flex items-center gap-1.5 ${roleCfg.color.split(' ')[0]}`}>
                            <roleCfg.icon className="w-3.5 h-3.5" />
                            <span>{roleCfg.label}</span>
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {u.status === 'active' ? 'Hoạt động' : u.status}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-center text-slate-500 text-[11px]">
                        <div className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Chỉnh sửa</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
