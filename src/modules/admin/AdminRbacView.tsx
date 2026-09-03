import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Stethoscope,
  HeartPulse,
  Receipt,
  FlaskConical,
  UserCheck,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  CheckSquare,
  Square,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { rbacService, type RoleItemResponse, type PermissionItem } from '../../services/rbac/rbac.service';

const ROLE_ICONS: Record<string, { icon: any; color: string; bgColor: string; borderColor: string }> = {
  ADMIN: { icon: Shield, color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  DOCTOR: { icon: Stethoscope, color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  NURSE: { icon: HeartPulse, color: 'text-rose-700', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
  RECEPTIONIST: { icon: Receipt, color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  RECEPTION: { icon: Receipt, color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  LAB: { icon: FlaskConical, color: 'text-cyan-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  PATIENT: { icon: UserCheck, color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
};

const RESOURCE_LABELS: Record<string, { title: string; desc: string }> = {
  patient: { title: 'Hồ Sơ Bệnh Nhân (Patient)', desc: 'Tạo, xem, sửa thông tin hành chính & y tế của bệnh nhân' },
  appointment: { title: 'Lịch Hẹn Khám (Appointment)', desc: 'Đặt lịch online, tạo lịch tại quầy, xác nhận, hủy lịch' },
  'appointment-slot': { title: 'Khung Giờ Khám (Appointment Slot)', desc: 'Tra cứu các ca khám trống theo lịch làm việc của bác sĩ' },
  encounter: { title: 'Lượt Khám Bệnh (Encounter)', desc: 'Mở ca khám, theo dõi tiến trình thăm khám, kết thúc lượt' },
  'queue-ticket': { title: 'Hàng Đợi & Gọi Số (Queue Ticket)', desc: 'Phát số thứ tự nhóm A/B, gọi số quầy tiếp nhận' },
  'doctor-queue-entry': { title: 'Hàng Chờ Phòng Khám Bác Sĩ', desc: 'Điều phối bệnh nhân vào phòng khám chuyên khoa' },
  doctor: { title: 'Hồ Sơ Bác Sĩ (Doctor)', desc: 'Quản lý danh sách, chuyên khoa và hồ sơ bác sĩ' },
  'doctor-department': { title: 'Phân Bổ Chuyên Khoa Bác Sĩ', desc: 'Gán bác sĩ vào chuyên khoa phòng khám' },
  'doctor-schedule': { title: 'Lịch Làm Việc Bác Sĩ (Schedule)', desc: 'Xếp ca trực, báo nghỉ, tự sinh slot hàng tuần' },
  'chief-complaint': { title: 'Lý Do Khám & Triệu Chứng', desc: 'Ghi nhận triệu chứng ban đầu và lý do đến khám' },
  'identity-verification': { title: 'Xác Minh Danh Tính (Identity)', desc: 'Xác thực CCCD, nhận diện khuôn mặt bệnh nhân' },
  consent: { title: 'Đồng Ý & Thỏa Thuận Y Tế (Consent)', desc: 'Ký điện tử thỏa thuận điều trị và xử lý dữ liệu' },
  'consent-policy': { title: 'Chính Sách & Điều Khoản (Policy)', desc: 'Quản lý nội dung chính sách tuân thủ y tế' },
  observation: { title: 'Sinh Hiệu & Chỉ Số Y Tế (Vitals)', desc: 'Đo huyết áp, nhịp tim, SpO2, chiều cao, cân nặng' },
  condition: { title: 'Chẩn Đoán Bệnh ICD-10 (Condition)', desc: 'Ghi nhận mã bệnh lý và chẩn đoán y khoa' },
  medication: { title: 'Đơn Thuốc & Dược Phẩm (Medication)', desc: 'Kê đơn thuốc điện tử, hướng dẫn liều dùng' },
  allergy: { title: 'Dị Ứng & Cảnh Báo (Allergy)', desc: 'Lịch sử dị ứng thuốc, thức ăn của bệnh nhân' },
  'imaging-study': { title: 'Hình Ảnh Y Khoa & DICOM', desc: 'Quản lý chụp X-Quang, CT, MRI và ảnh chuẩn DICOM' },
  claim: { title: 'Thu Phí & Thanh Toán BHYT (Claims)', desc: 'Lập phiếu thu viện phí và giám định BHYT' },
  user: { title: 'Tài Khoản Đăng Nhập (User)', desc: 'Quản lý thông tin đăng nhập, hồ sơ tài khoản' },
  role: { title: 'Vai Trò Hệ Thống (Role)', desc: 'Cấu hình vai trò và gán quyền' },
  'security-config': { title: 'Bảo Mật & Cấu Hình Hệ Thống', desc: 'Cài đặt thời gian khóa tài khoản, thời hạn Token, MFA' },
};

export const AdminRbacView: React.FC = () => {
  const [roles, setRoles] = useState<RoleItemResponse[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [initialPermissionIds, setInitialPermissionIds] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(4);

  // Nạp danh sách Role và Permissions
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        rbacService.getRoles(),
        rbacService.getAllPermissions().catch(() => []),
      ]);

      const cleanedRoles = (rolesData || []).map((r) => ({
        ...r,
        roleCode: (r.roleCode || '').trim(),
        roleName: (r.roleName || '').trim(),
      }));

      setRoles(cleanedRoles);
      setAllPermissions(permissionsData || []);

      if (cleanedRoles && cleanedRoles.length > 0) {
        const defaultRole = cleanedRoles.find((r) => r.roleCode === 'DOCTOR') || cleanedRoles[0];
        setSelectedRoleId(defaultRole.roleId);
        loadRolePermissions(defaultRole);
      }
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu RBAC:', err);
      setError(err?.message || 'Không thể tải dữ liệu phân quyền từ máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRoleId, pageSize]);

  // Khi chọn một Role khác
  const handleSelectRole = (role: RoleItemResponse) => {
    setSelectedRoleId(role.roleId);
    loadRolePermissions(role);
  };

  const loadRolePermissions = (role: RoleItemResponse) => {
    const currentPermIds = new Set<string>();
    if (role.rolePermissions) {
      role.rolePermissions.forEach((rp) => {
        if (rp.permissionId) currentPermIds.add(rp.permissionId);
      });
    }
    setSelectedPermissionIds(new Set(currentPermIds));
    setInitialPermissionIds(new Set(currentPermIds));
  };

  // Toggle 1 permission
  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {};

    allPermissions.forEach((p) => {
      const parts = p.permissionCode.split(':');
      const res = p.resource || parts[0] || 'other';
      if (!groups[res]) groups[res] = [];

      const matchesSearch =
        !searchQuery ||
        p.permissionCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (RESOURCE_LABELS[res]?.title && RESOURCE_LABELS[res].title.toLowerCase().includes(searchQuery.toLowerCase()));

      if (matchesSearch) {
        groups[res].push(p);
      }
    });

    return groups;
  }, [allPermissions, searchQuery]);

  // Pagination calculation
  const groupEntries = useMemo(() => Object.entries(groupedPermissions), [groupedPermissions]);
  const totalGroups = groupEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalGroups / pageSize));

  const paginatedGroupEntries = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return groupEntries.slice(startIdx, startIdx + pageSize);
  }, [groupEntries, currentPage, pageSize]);

  // Toggle tất cả quyền trong 1 nhóm
  const handleToggleGroup = (resourceKey: string, selectAll: boolean) => {
    const items = groupedPermissions[resourceKey] || [];
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      items.forEach((item) => {
        if (selectAll) {
          next.add(item.permissionId);
        } else {
          next.delete(item.permissionId);
        }
      });
      return next;
    });
  };

  // Kiểm tra có thay đổi chưa lưu
  const isDirty = useMemo(() => {
    if (selectedPermissionIds.size !== initialPermissionIds.size) return true;
    for (const id of selectedPermissionIds) {
      if (!initialPermissionIds.has(id)) return true;
    }
    return false;
  }, [selectedPermissionIds, initialPermissionIds]);

  // Lưu phân quyền cho role
  const handleSave = async () => {
    if (!selectedRoleId) return;
    setIsSaving(true);
    try {
      const permIdsArray = Array.from(selectedPermissionIds);
      await rbacService.replaceRolePermissions(selectedRoleId, permIdsArray);

      // Cập nhật lại state roles cục bộ
      setRoles((prev) =>
        prev.map((r) => {
          if (r.roleId === selectedRoleId) {
            return {
              ...r,
              rolePermissions: permIdsArray.map((pid) => ({
                roleId: r.roleId,
                permissionId: pid,
                permission: allPermissions.find((p) => p.permissionId === pid)!,
              })),
            };
          }
          return r;
        })
      );

      setInitialPermissionIds(new Set(selectedPermissionIds));
      setSuccessToast(`Đã lưu cấu hình phân quyền thành công!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Lỗi khi lưu phân quyền:', err);
      alert(err?.message || 'Lưu cấu hình phân quyền thất bại. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const activeRole = roles.find((r) => r.roleId === selectedRoleId);

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
            <Shield className="w-5 h-5 text-blue-700" />
            <span>Vai trò của các tài khoản</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình quyền hạn truy cập chi tiết (Tạo, Xem, Sửa, Xóa) cho từng vai trò trong hệ thống bệnh viện
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={isLoading || isSaving}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 border-none cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Tải lại</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving || isLoading}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm border-none cursor-pointer ${isDirty
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 animate-pulse'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Cấu Hình Phân Quyền</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Role Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {roles.map((r) => {
          const roleCfg = ROLE_ICONS[r.roleCode] || ROLE_ICONS.PATIENT;
          const isSelected = selectedRoleId === r.roleId;
          const assignedCount = isSelected
            ? selectedPermissionIds.size
            : r.rolePermissions?.length || 0;

          return (
            <button
              key={r.roleId}
              onClick={() => handleSelectRole(r)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${isSelected
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/15'
                : 'bg-white text-slate-800 border-slate-200/90 hover:border-blue-200 hover:bg-slate-50/50'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {r.roleName}
                </span>
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20 text-white' : roleCfg.bgColor}`}>
                  <roleCfg.icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : roleCfg.color}`} />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20 text-blue-100' : 'bg-slate-100 text-slate-500'
                  }`}>
                  {r.roleCode}
                </span>
                <span className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-blue-700'}`}>
                  {assignedCount} quyền
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Content Area: Active Role Details + Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Top Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Đang chỉnh sửa phân quyền cho:</span>
            <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {activeRole?.roleCode || 'Chưa chọn vai trò'}
            </span>
          </div>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm mã quyền, mô tả..."
              className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Content Matrix */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Đang tải danh mục phân quyền...</span>
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
        ) : Object.keys(groupedPermissions).length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Shield className="w-10 h-10 mx-auto text-slate-300" />
            <div className="text-xs font-bold text-slate-700">Không tìm thấy quyền nào phù hợp</div>
            <p className="text-[11px] text-slate-400">Hãy thử đổi từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {paginatedGroupEntries.map(([resKey, perms]) => {
              const resInfo = RESOURCE_LABELS[resKey] || {
                title: `Tài nguyên: ${resKey.toUpperCase()}`,
                desc: 'Quyền hạn thao tác trên tài nguyên',
              };

              const allGroupSelected = perms.every((p) => selectedPermissionIds.has(p.permissionId));

              return (
                <div
                  key={resKey}
                  className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white shadow-2xs"
                >
                  {/* Resource Group Header */}
                  <div className="p-3.5 bg-slate-50/70 border-b border-slate-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>{resInfo.title}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{resInfo.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleGroup(resKey, !allGroupSelected)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {allGroupSelected ? (
                          <>
                            <CheckSquare className="w-3 h-3 text-blue-600" />
                            <span>Bỏ chọn nhóm</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-3 h-3 text-slate-400" />
                            <span>Chọn tất cả ({perms.length})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Permissions Grid */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {perms.map((p) => {
                      const isChecked = selectedPermissionIds.has(p.permissionId);
                      const parts = p.permissionCode.split(':');
                      const permAction = p.action || parts[1] || 'read';
                      const permScope = p.scope || parts[2] || 'all';

                      // Action badge style
                      const actionColor =
                        permAction === 'create'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : permAction === 'read'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : permAction === 'update'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200';

                      return (
                        <label
                          key={p.permissionId}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${isChecked
                            ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(p.permissionId)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mt-0.5 shrink-0 cursor-pointer"
                          />

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${actionColor}`}>
                                {permAction}
                              </span>
                              <span className="text-[9px] font-bold font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                                {permScope}
                              </span>
                            </div>

                            <div className="text-xs font-bold text-slate-900 font-mono break-all">
                              {p.permissionCode}
                            </div>

                            {p.description && (
                              <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                                {p.description}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && totalGroups > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Hiển thị nhóm</span>
              <span className="font-bold text-slate-800">
                {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalGroups)}
              </span>
              <span>trên tổng số</span>
              <span className="font-bold text-slate-800">{totalGroups} nhóm nghiệp vụ</span>

              <span className="mx-2 text-slate-300 hidden sm:inline">|</span>

              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Số nhóm/trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value={3}>3 nhóm</option>
                  <option value={4}>4 nhóm</option>
                  <option value={6}>6 nhóm</option>
                  <option value={8}>8 nhóm</option>
                  <option value={12}>12 nhóm</option>
                  <option value={999}>Tất cả</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="Trang đầu"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Trang trước"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, idx, array) => {
                    const prevPage = array[idx - 1];
                    const hasGap = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {hasGap && <span className="px-1 text-slate-400 text-xs">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors border cursor-pointer ${currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="Trang sau"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Trang cuối"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
