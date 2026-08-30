import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
  Search,
  Plus,
  Edit3,
  Eye,
  Loader2,
  AlertCircle,
  Building2,
  RefreshCw,
  FileCheck,
  UserPlus,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { doctorService, type DoctorResponse, type DepartmentResponse } from '../../services/doctor/doctor.service';
import { CreateDoctorModal } from './components/CreateDoctorModal';
import { EditDoctorModal } from './components/EditDoctorModal';
import { DetailDoctorModal } from './components/DetailDoctorModal';
import { AssignDepartmentModal } from './components/AssignDepartmentModal';

export const AdminDoctorsView: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedDepartmentTab, setSelectedDepartmentTab] = useState<string>('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorResponse | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<DoctorResponse | null>(null);

  // Assign Department Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [assignDefaultDoctorId, setAssignDefaultDoctorId] = useState<string>('');
  const [assignDefaultDepartmentId, setAssignDefaultDepartmentId] = useState<string>('');

  // Toast notification state
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleSuccess = (message?: string) => {
    fetchData();
    if (message) {
      setSuccessToast(message);
      setTimeout(() => {
        setSuccessToast(null);
      }, 4000);
    }
  };

  // Fetch doctors & departments
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [doctorsData, departmentsData] = await Promise.all([
        doctorService.getDoctors(),
        doctorService.getDepartments().catch(() => []),
      ]);
      setDoctors(doctorsData);
      setDepartments(departmentsData);
    } catch (err: any) {
      console.error('Lỗi nạp dữ liệu:', err);
      setError(err?.message || 'Không thể tải dữ liệu từ server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute counts for department tabs
  const departmentDoctorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    doctors.forEach((doc) => {
      doc.doctorDepartments?.forEach((dd) => {
        counts[dd.departmentId] = (counts[dd.departmentId] || 0) + 1;
      });
    });
    return counts;
  }, [doctors]);

  // Filtered doctors list
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSearch =
        !searchQuery ||
        doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.doctorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.specialization && doc.specialization.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.licenseNumber && doc.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && doc.isActive) ||
        (selectedStatus === 'INACTIVE' && !doc.isActive);

      const matchesDepartment =
        selectedDepartmentTab === 'ALL' ||
        doc.doctorDepartments?.some((dd) => dd.departmentId === selectedDepartmentTab);

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [doctors, searchQuery, selectedStatus, selectedDepartmentTab]);

  // Open Assign modal for a specific doctor
  const handleOpenAssignModalForDoctor = (doctorId: string) => {
    setAssignDefaultDoctorId(doctorId);
    setAssignDefaultDepartmentId(selectedDepartmentTab !== 'ALL' ? selectedDepartmentTab : '');
    setIsAssignModalOpen(true);
  };

  // Open Assign modal for current department tab
  const handleOpenAssignModalForCurrentDept = () => {
    setAssignDefaultDoctorId('');
    setAssignDefaultDepartmentId(selectedDepartmentTab !== 'ALL' ? selectedDepartmentTab : '');
    setIsAssignModalOpen(true);
  };

  const handleOpenDetailModal = async (doctorId: string) => {
    try {
      const detail = await doctorService.getDoctorById(doctorId);
      setViewingDoctor(detail);
    } catch (err) {
      console.error('Lỗi lấy chi tiết bác sĩ:', err);
    }
  };

  // Currently selected department object for banner context
  const currentDeptInfo = useMemo(() => {
    return departments.find((d) => d.departmentId === selectedDepartmentTab);
  }, [departments, selectedDepartmentTab]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-blue-900/40 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Quản Trị Nhân Sự Y Tế</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Danh Sách Bác Sĩ & Phân Công Khoa Phòng
          </h1>
          <p className="text-slate-300 text-xs font-medium max-w-2xl">
            Quản lý hồ sơ bác sĩ, chức danh học vị, chứng chỉ hành nghề và phân công khoa phòng trực thuộc toàn hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10 shrink-0">
          {selectedDepartmentTab !== 'ALL' && (
            <button
              onClick={handleOpenAssignModalForCurrentDept}
              className="px-4 py-2.5 bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 border border-indigo-400/30"
            >
              <UserPlus className="w-4 h-4" />
              <span>Gán Bác Sĩ Vào Khoa Này</span>
            </button>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Bác Sĩ Mới</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 transition-all cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DEPARTMENT TABS */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
        <div className="px-2 pt-1 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-700" />
            <span>Danh Sách Khoa Phòng:</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            {departments.length} Khoa đang hoạt động
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-1">
          <button
            onClick={() => setSelectedDepartmentTab('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
              selectedDepartmentTab === 'ALL'
                ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <span>Tất cả khoa</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              selectedDepartmentTab === 'ALL' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {doctors.length}
            </span>
          </button>

          {departments.map((dept) => {
            const count = departmentDoctorCounts[dept.departmentId] || 0;
            const isSelected = selectedDepartmentTab === dept.departmentId;
            return (
              <button
                key={dept.departmentId}
                onClick={() => setSelectedDepartmentTab(dept.departmentId)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <span>{dept.departmentName}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã BS, số GP, chuyên khoa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-slate-800 pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:bg-white focus:border-blue-700 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Trạng thái:</span>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedStatus === status
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'Tất cả' : status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Data */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
            <span className="text-xs font-bold">Đang tải danh sách bác sĩ từ hệ thống...</span>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Stethoscope className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-600">Không tìm thấy bác sĩ nào</p>
            <p className="text-xs">
              {selectedDepartmentTab !== 'ALL'
                ? `Hiện chưa có bác sĩ thuộc ${currentDeptInfo?.departmentName || 'khoa này'}. Bấm bên dưới để gán bác sĩ.`
                : 'Thử điều chỉnh từ khóa tìm kiếm hoặc bấm "Thêm Bác Sĩ Mới".'}
            </p>
            {selectedDepartmentTab !== 'ALL' && (
              <div className="pt-2">
                <button
                  onClick={handleOpenAssignModalForCurrentDept}
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Gán Bác Sĩ Vào {currentDeptInfo?.departmentName}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã Bác Sĩ</th>
                  <th className="py-3.5 px-4">Họ và Tên & Chức Danh</th>
                  <th className="py-3.5 px-4">Khoa Trực Thuộc / Chuyên Khoa</th>
                  <th className="py-3.5 px-4">Giấy Phép Hành Nghề</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor.doctorId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                      {doctor.doctorCode}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-800 font-extrabold text-xs shrink-0">
                          {doctor.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900">
                            {doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {(() => {
                        const primaryDept = doctor.doctorDepartments?.find((d) => d.isPrimary)?.department?.departmentName;
                        const deptText = primaryDept
                          ? `${primaryDept}${doctor.specialization ? ` (${doctor.specialization})` : ''}`
                          : (doctor.specialization || 'Chưa cập nhật');
                        return (
                          <span className="inline-flex items-center gap-1 text-slate-800 font-medium bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            {deptText}
                          </span>
                        );
                      })()}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {doctor.licenseNumber ? (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <FileCheck className="w-3.5 h-3.5" />
                          {doctor.licenseNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-sans text-[11px]">Chưa cập nhật</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {doctor.isActive ? (
                        <Badge variant="normal" size="sm">Hoạt động</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Tạm ngưng</Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenDetailModal(doctor.doctorId)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingDoctor(doctor)}
                          className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenAssignModalForDoctor(doctor.doctorId)}
                          className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Phân công khoa phòng"
                        >
                          <Building2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TOAST NOTIFICATION BANNER */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-700/60 flex items-center gap-3 animate-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SEPARATE MODAL COMPONENTS */}
      <CreateDoctorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        departments={departments}
        onSuccess={handleSuccess}
      />

      <EditDoctorModal
        doctor={editingDoctor}
        onClose={() => setEditingDoctor(null)}
        onSuccess={handleSuccess}
      />

      <DetailDoctorModal
        doctor={viewingDoctor}
        onClose={() => setViewingDoctor(null)}
      />

      <AssignDepartmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        doctors={doctors}
        departments={departments}
        defaultDoctorId={assignDefaultDoctorId}
        defaultDepartmentId={assignDefaultDepartmentId}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
