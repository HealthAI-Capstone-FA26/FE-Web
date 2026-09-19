import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2,
  Users,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Star,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  ShieldAlert,
  GitFork,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Mascot } from 'page-mascot';
import {
  staffDepartmentService,
  type StaffDepartmentItem,
  type DepartmentItem,
} from '../../services/staff-department/staff-department.service';
import { userService, type UserItemResponse } from '../../services/user/user.service';
import { getAvatarUrl } from '../../services/api';

const NurseIcon = ({ className }: { className?: string }) => (
  <img src="/images/nurse_icon.png" alt="Điều dưỡng" className={className || "w-4 h-4 shrink-0 rounded-full object-cover"} />
);

// Custom Select Component cho Điều Dưỡng
const CustomNurseSelect: React.FC<{
  nurses: UserItemResponse[];
  selectedUserId: string;
  onSelect: (userId: string) => void;
}> = ({ nurses, selectedUserId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedNurse = useMemo(
    () => nurses.find((n) => n.userId === selectedUserId),
    [nurses, selectedUserId]
  );

  const filteredNurses = useMemo(() => {
    if (!search.trim()) return nurses;
    const q = search.toLowerCase();
    return nurses.filter(
      (n) =>
        (n.fullName && n.fullName.toLowerCase().includes(q)) ||
        (n.email && n.email.toLowerCase().includes(q))
    );
  }, [nurses, search]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border transition-all flex items-center justify-between cursor-pointer bg-white ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
            : 'border-slate-200 hover:border-blue-400 shadow-2xs'
        }`}
      >
        {selectedNurse ? (
          <div className="flex items-center gap-2.5 min-w-0 text-left">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-rose-50 border border-rose-200 shrink-0 flex items-center justify-center">
              {getAvatarUrl(selectedNurse.avatarUrl) ? (
                <img
                  src={getAvatarUrl(selectedNurse.avatarUrl)}
                  alt={selectedNurse.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <NurseIcon className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="truncate">
              <span className="font-bold text-slate-900 mr-1.5">
                {selectedNurse.fullName || selectedNurse.email}
              </span>
              <span className="text-[10px] font-mono text-slate-400">({selectedNurse.email})</span>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 font-medium">-- Chọn điều dưỡng cần gán --</span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên hoặc email điều dưỡng..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white font-medium"
                autoFocus
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
            {filteredNurses.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Không tìm thấy điều dưỡng nào
              </div>
            ) : (
              filteredNurses.map((nurse) => {
                const isSelected = nurse.userId === selectedUserId;
                const avatar = getAvatarUrl(nurse.avatarUrl);

                return (
                  <div
                    key={nurse.userId}
                    onClick={() => {
                      onSelect(nurse.userId);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-rose-50 border border-rose-200 shrink-0 flex items-center justify-center">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={nurse.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <NurseIcon className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {nurse.fullName || 'Điều dưỡng'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {nurse.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        NURSE
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Select Component cho Khoa / Phòng
const CustomDepartmentSelect: React.FC<{
  departments: DepartmentItem[];
  selectedDepartmentId: string;
  onSelect: (deptId: string) => void;
}> = ({ departments, selectedDepartmentId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDept = useMemo(
    () => departments.find((d) => d.departmentId === selectedDepartmentId),
    [departments, selectedDepartmentId]
  );

  const filteredDepts = useMemo(() => {
    if (!search.trim()) return departments;
    const q = search.toLowerCase();
    return departments.filter(
      (d) =>
        (d.departmentName && d.departmentName.toLowerCase().includes(q)) ||
        (d.departmentCode && d.departmentCode.toLowerCase().includes(q))
    );
  }, [departments, search]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border transition-all flex items-center justify-between cursor-pointer bg-white ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
            : 'border-slate-200 hover:border-blue-400 shadow-2xs'
        }`}
      >
        {selectedDept ? (
          <div className="flex items-center gap-2.5 min-w-0 text-left">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-slate-900 mr-2">
                {selectedDept.departmentName}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {selectedDept.departmentCode}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 font-medium">-- Chọn khoa/phòng làm việc --</span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên khoa hoặc mã khoa..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white font-medium"
                autoFocus
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
            {filteredDepts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Không tìm thấy khoa nào
              </div>
            ) : (
              filteredDepts.map((dept) => {
                const isSelected = dept.departmentId === selectedDepartmentId;

                return (
                  <div
                    key={dept.departmentId}
                    onClick={() => {
                      onSelect(dept.departmentId);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {dept.departmentName}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {dept.departmentCode}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminStaffDepartmentsView: React.FC = () => {
  const [staffDepartments, setStaffDepartments] = useState<StaffDepartmentItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [users, setUsers] = useState<UserItemResponse[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [isPrimaryAssign, setIsPrimaryAssign] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Confirm Modal
  const [deletingItem, setDeletingItem] = useState<StaffDepartmentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load Data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sdList, deptList, userList] = await Promise.all([
        staffDepartmentService.getAllStaffDepartments().catch(() => []),
        staffDepartmentService.getAllDepartments().catch(() => []),
        userService.getUsers().catch(() => []),
      ]);

      setStaffDepartments(sdList || []);
      setDepartments(deptList || []);
      setUsers(userList || []);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu phân bổ khoa:', err);
      setError(err?.message || 'Không thể tải danh sách phân bổ khoa từ máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter nurses list for assign dropdown (chỉ lấy tài khoản có role NURSE)
  const nurseUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.actorRole?.toUpperCase() === 'NURSE'

    );
  }, [users]);

  // Filtered staff departments list
  const filteredItems = useMemo(() => {
    return staffDepartments.filter((item) => {
      const nurseName = item.user?.profile?.fullName || item.user?.email || '';
      const nurseEmail = item.user?.email || '';
      const deptName = item.department?.departmentName || '';
      const deptCode = item.department?.departmentCode || '';

      const matchesSearch =
        !searchQuery ||
        nurseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nurseEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deptName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deptCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        selectedDeptFilter === 'ALL' || item.departmentId === selectedDeptFilter;

      return matchesSearch && matchesDept;
    });
  }, [staffDepartments, searchQuery, selectedDeptFilter]);

  // Pagination calculation
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedItems = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredItems.slice(startIdx, startIdx + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Handle assign staff department
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedDepartmentId) {
      setModalError('Vui lòng chọn đầy đủ Nhân viên và Khoa làm việc');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    try {
      await staffDepartmentService.assignStaffDepartment(selectedUserId, {
        departmentId: selectedDepartmentId,
        isPrimary: isPrimaryAssign,
      });

      setSuccessToast('Đã gán khoa công tác cho nhân viên thành công!');
      setTimeout(() => setSuccessToast(null), 4000);
      setIsModalOpen(false);
      setSelectedUserId('');
      setSelectedDepartmentId('');
      fetchData();
    } catch (err: any) {
      console.error('Lỗi gán khoa:', err);
      setModalError(err?.message || 'Không thể gán khoa cho nhân viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggle primary department
  const handleTogglePrimary = async (item: StaffDepartmentItem) => {
    const newIsPrimary = !item.isPrimary;
    try {
      await staffDepartmentService.updatePrimaryDepartment(item.id, newIsPrimary);
      setSuccessToast(
        newIsPrimary
          ? `Đã cài đặt "${item.department?.departmentName}" làm khoa chính`
          : `Đã chuyển "${item.department?.departmentName}" thành khoa phụ`
      );
      setTimeout(() => setSuccessToast(null), 4000);
      fetchData();
    } catch (err: any) {
      alert(err?.message || 'Không thể thay đổi trạng thái khoa chính');
    }
  };

  // Handle remove assignment
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await staffDepartmentService.removeStaffDepartment(deletingItem.id);
      setSuccessToast('Đã gỡ nhân viên khỏi khoa công tác');
      setTimeout(() => setSuccessToast(null), 4000);
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      alert(err?.message || 'Gỡ nhân viên khỏi khoa thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats calculation
  const totalAssignedNurses = useMemo(() => {
    const uniqueUsers = new Set(staffDepartments.map((sd) => sd.userId));
    return uniqueUsers.size;
  }, [staffDepartments]);

  const primaryCount = useMemo(() => {
    return staffDepartments.filter((sd) => sd.isPrimary).length;
  }, [staffDepartments]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Mascot
            directions="/mascots/admin-directions.png"
            reactions="/mascots/admin-reactions.png"
            size={120}
            className="shrink-0"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Phân Bổ Khoa Công Tác Cho Điều Dưỡng
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gán điều dưỡng/y tá vào các khoa chuyên môn để theo dõi và xử lý hàng đợi đo sinh hiệu của bệnh nhân
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 border-none cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Tải lại</span>
          </button>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setModalError(null);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center gap-2 border-none cursor-pointer shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Gán Khoa Công Tác Mới</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng số phân bổ</span>
            <div className="text-lg font-black text-slate-900">{staffDepartments.length} lượt</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <NurseIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã phân khoa</span>
            <div className="text-lg font-black text-slate-900">{totalAssignedNurses} điều dưỡng</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Khoa công tác chính</span>
            <div className="text-lg font-black text-slate-900">{primaryCount} vị trí</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Khoa/Phòng hoạt động</span>
            <div className="text-lg font-black text-slate-900">{departments.length} chuyên khoa</div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50/30">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên điều dưỡng, email, tên khoa..."
              className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Lọc theo khoa:</label>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">Tất cả các khoa ({staffDepartments.length})</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentName} ({d.departmentCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content View */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Đang tải danh sách phân bổ khoa...</span>
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
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Building2 className="w-10 h-10 mx-auto text-slate-300" />
            <div className="text-xs font-bold text-slate-700">Chưa có dữ liệu phân bổ khoa nào</div>
            <p className="text-[11px] text-slate-400">Hãy nhấn "Gán Khoa Công Tác Mới" để bắt đầu xếp lịch.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Điều Dưỡng / Nhân Viên</th>
                  <th className="py-3 px-4">Khoa Công Tác</th>
                  <th className="py-3 px-4">Mã Khoa</th>
                  <th className="py-3 px-4 text-center">Trạng Thái Khoa</th>
                  <th className="py-3 px-4">Ngày Phân Công</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {paginatedItems.map((item) => {
                  const avatarUrl = getAvatarUrl(item.user?.profile?.avatarUrl);
                  const fullName = item.user?.profile?.fullName || item.user?.email || 'Chưa cập nhật';
                  const roleCode = item.user?.profile?.actorRole || 'NURSE';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-rose-50 border border-rose-200 shrink-0 flex items-center justify-center">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                            ) : (
                              <NurseIcon className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{fullName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{item.user?.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Department Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{item.department?.departmentName || 'Khoa không xác định'}</span>
                        </div>
                      </td>

                      {/* Department Code */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.department?.departmentCode || 'N/A'}
                        </span>
                      </td>

                      {/* Primary Status */}
                      <td className="py-3.5 px-4 text-center">
                        {item.isPrimary ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>Khoa Chính</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            <span>Khoa Phụ</span>
                          </span>
                        )}
                      </td>

                      {/* Assigned Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                        {item.assignedAt ? new Date(item.assignedAt).toLocaleDateString('vi-VN') : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePrimary(item)}
                            title={item.isPrimary ? 'Đổi thành Khoa Phụ' : 'Đặt làm Khoa Chính'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${item.isPrimary
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                              }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${item.isPrimary ? 'fill-amber-500' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            title="Gỡ khỏi khoa"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && totalItems > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Hiển thị</span>
              <span className="font-bold text-slate-800">
                {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)}
              </span>
              <span>trên tổng số</span>
              <span className="font-bold text-slate-800">{totalItems} lượt phân khoa</span>

              <span className="mx-2 text-slate-300 hidden sm:inline">|</span>

              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Số bản ghi/trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={20}>20</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

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
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Gán Điều Dưỡng Vào Khoa</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAssignSubmit} className="p-5 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Select Nurse */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn Điều Dưỡng <span className="text-rose-500">*</span>
                </label>
                <CustomNurseSelect
                  nurses={nurseUsers}
                  selectedUserId={selectedUserId}
                  onSelect={(userId) => setSelectedUserId(userId)}
                />
              </div>

              {/* Select Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn Khoa / Phòng Công Tác <span className="text-rose-500">*</span>
                </label>
                <CustomDepartmentSelect
                  departments={departments}
                  selectedDepartmentId={selectedDepartmentId}
                  onSelect={(deptId) => setSelectedDepartmentId(deptId)}
                />
              </div>

              {/* Primary Checkbox */}
              <label className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimaryAssign}
                  onChange={(e) => setIsPrimaryAssign(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">Đặt làm Khoa công tác chính</div>
                  <div className="text-[10px] text-slate-400">
                    Khoa chính sẽ được ưu tiên hiển thị khi điều dưỡng đăng nhập hệ thống
                  </div>
                </div>
              </label>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border-none cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm border-none cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang gán...</span>
                    </>
                  ) : (
                    <span>Xác Nhận Gán Khoa</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-5 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Xác Nhận Gỡ Nhân Viên Khỏi Khoa</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn gỡ <strong>{deletingItem.user?.profile?.fullName || deletingItem.user?.email}</strong> khỏi khoa{' '}
                <strong>{deletingItem.department?.departmentName}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border-none cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm border-none cursor-pointer transition-all flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Đồng Ý Gỡ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
