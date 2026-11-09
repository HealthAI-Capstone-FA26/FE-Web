import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
  Search,
  Plus,
  Edit3,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileCheck,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import {
  doctorService,
  getSpecializationLabel,
  CARDIOLOGY_SPECIALIZATIONS,
  type DoctorResponse,
} from '../../services/doctor/doctor.service';
import { CreateDoctorModal } from './components/CreateDoctorModal';
import { EditDoctorModal } from './components/EditDoctorModal';
import { DetailDoctorModal } from './components/DetailDoctorModal';

export const AdminDoctorsView: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorResponse | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<DoctorResponse | null>(null);

  // Toast notification state
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const doctorsData = await doctorService.getDoctors();
      setDoctors(doctorsData);
    } catch (err: any) {
      console.error('Lỗi nạp dữ liệu:', err);
      setError(err?.message || 'Không thể tải dữ liệu từ máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedSpecialization, pageSize]);

  const handleSuccess = (message?: string) => {
    fetchData();
    if (message) {
      setSuccessToast(message);
      setTimeout(() => {
        setSuccessToast(null);
      }, 4000);
    }
  };

  // Compute counts for stat cards
  const activeCount = useMemo(() => doctors.filter((d) => d.isActive).length, [doctors]);
  const inactiveCount = useMemo(() => doctors.filter((d) => !d.isActive).length, [doctors]);

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

      const matchesSpec =
        selectedSpecialization === 'ALL' || doc.specialization === selectedSpecialization;

      return matchesSearch && matchesStatus && matchesSpec;
    });
  }, [doctors, searchQuery, selectedStatus, selectedSpecialization]);

  // Pagination calculation
  const totalDoctors = filteredDoctors.length;
  const totalPages = Math.max(1, Math.ceil(totalDoctors / pageSize));

  const paginatedDoctors = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredDoctors.slice(startIdx, startIdx + pageSize);
  }, [filteredDoctors, currentPage, pageSize]);

  const handleOpenDetailModal = async (doctorId: string) => {
    try {
      const detail = await doctorService.getDoctorById(doctorId);
      setViewingDoctor(detail);
    } catch (err) {
      console.error('Lỗi lấy chi tiết bác sĩ:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-top-5 duration-200 text-xs font-bold">
          <UserCheck className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header View */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Quản Lý Bác Sĩ & Chuyên Khoa Tim Mạch
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản trị toàn bộ danh sách bác sĩ, chứng chỉ hành nghề, học vị chuyên khoa tại Phòng khám Tim mạch 4AM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 border-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Bác Sĩ Mới</span>
          </button>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 border-none cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { key: 'ALL', label: 'Tổng bác sĩ', count: doctors.length, icon: Stethoscope, color: 'text-blue-700 bg-blue-50' },
          { key: 'ACTIVE', label: 'Đang hoạt động', count: activeCount, icon: UserCheck, color: 'text-emerald-700 bg-emerald-50' },
          { key: 'INACTIVE', label: 'Tạm ngưng', count: inactiveCount, icon: UserX, color: 'text-rose-700 bg-rose-50' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setSelectedStatus(item.key as any);
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedStatus === item.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10'
                : 'bg-white text-slate-800 border-slate-200/90 hover:border-blue-200 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold ${selectedStatus === item.key ? 'text-blue-100' : 'text-slate-500'}`}>
                {item.label}
              </span>
              <div
                className={`p-1.5 rounded-lg ${selectedStatus === item.key ? 'bg-white/20 text-white' : item.color}`}
              >
                <item.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className={`text-xl font-black mt-2 ${selectedStatus === item.key ? 'text-white' : 'text-slate-900'}`}>
              {item.count}
            </div>
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Search Bar & Filter Controls Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* 1. Search Box */}
            <div className="relative flex-1 sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên bác sĩ, mã BS, số giấy phép, chuyên khoa..."
                className="w-full pl-9 pr-9 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 hover:bg-white transition-all text-slate-800 placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Specialization Filter */}
            <div className="relative">
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 transition-all text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
              >
                <option value="ALL">Tất cả phân nhóm Tim mạch ({doctors.length})</option>
                {Object.entries(CARDIOLOGY_SPECIALIZATIONS).map(([key, label]) => {
                  const count = doctors.filter((d) => d.specialization === key).length;
                  return (
                    <option key={key} value={key}>
                      {label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Clear All Filters Button if active */}
            {(searchQuery || selectedSpecialization !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialization('ALL');
                  setSelectedStatus('ALL');
                }}
                className="px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1 border border-slate-200 hover:border-rose-200 cursor-pointer bg-white shrink-0"
                title="Xóa tất cả bộ lọc"
              >
                <X className="w-3.5 h-3.5" />
                <span>Đặt lại lọc</span>
              </button>
            )}
          </div>

          {/* Right counter */}
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0 self-end md:self-auto">
            <span>Tìm thấy:</span>
            <span className="font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-xl">
              {filteredDoctors.length} bác sĩ
            </span>
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Đang tải danh sách bác sĩ...</span>
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
        ) : filteredDoctors.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Stethoscope className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <div className="text-xs font-bold text-slate-700">Không tìm thấy bác sĩ nào</div>
            <p className="text-[11px] text-slate-400">Hãy thử đổi từ khóa tìm kiếm hoặc lọc phân nhóm chuyên khoa khác.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Bác sĩ</th>
                  <th className="py-3 px-4">Mã số & Giấy phép</th>
                  <th className="py-3 px-4">Chuyên khoa Tim mạch</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDoctors.map((doctor) => {
                  const specLabel = getSpecializationLabel(doctor.specialization);

                  return (
                    <tr key={doctor.doctorId} className="hover:bg-slate-50/60 transition-colors">
                      {/* Doctor Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-black text-xs shrink-0">
                            {doctor.fullName ? doctor.fullName.charAt(0).toUpperCase() : <Stethoscope className="w-5 h-5 text-slate-400" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate">
                              {doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">Mã BS: {doctor.doctorCode}</span>
                          </div>
                        </div>
                      </td>

                      {/* License */}
                      <td className="py-3.5 px-4 font-mono">
                        {doctor.licenseNumber ? (
                          <div className="flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                            <FileCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>{doctor.licenseNumber}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chưa cập nhật</span>
                        )}
                      </td>

                      {/* Specialization */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                          <span>{specLabel}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {doctor.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Tạm ngưng
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetailModal(doctor.doctorId)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingDoctor(doctor)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit3 className="w-4 h-4" />
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
        {!isLoading && totalDoctors > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Hiển thị</span>
              <span className="font-bold text-slate-800">
                {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalDoctors)}
              </span>
              <span>trên tổng số</span>
              <span className="font-bold text-slate-800">{totalDoctors} bác sĩ</span>

              <span className="mx-2 text-slate-300 hidden sm:inline">|</span>

              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Số dòng/trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value={5}>5 bác sĩ</option>
                  <option value={8}>8 bác sĩ</option>
                  <option value={10}>10 bác sĩ</option>
                  <option value={15}>15 bác sĩ</option>
                  <option value={20}>20 bác sĩ</option>
                  <option value={9999}>Tất cả</option>
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
                          className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors border cursor-pointer ${
                            currentPage === page
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

      {/* SEPARATE MODAL COMPONENTS */}
      <CreateDoctorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
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
    </div>
  );
};
