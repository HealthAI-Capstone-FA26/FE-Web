import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
  Search,
  Plus,
  Edit3,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Building2,
  Award,
  FileCheck,
  X,
  Save,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { doctorService, type DoctorResponse, type CreateDoctorData } from '../../services/doctor/doctor.service';

export const AdminDoctorsView: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorResponse | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<DoctorResponse | null>(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState<CreateDoctorData>({
    fullName: '',
    title: 'ThS.BS',
    licenseNumber: '',
    specialization: 'Khoa Nội Tổng Hợp',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load doctors from backend
  const fetchDoctors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await doctorService.getDoctors();
      setDoctors(data);
    } catch (err: any) {
      console.error('Lỗi lấy danh sách bác sĩ:', err);
      setError(err?.message || 'Không thể tải danh sách bác sĩ từ server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

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

      return matchesSearch && matchesStatus;
    });
  }, [doctors, searchQuery, selectedStatus]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormData({
      fullName: '',
      title: 'ThS.BS',
      licenseNumber: '',
      specialization: 'Khoa Nội Tổng Hợp',
      isActive: true,
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (doctor: DoctorResponse) => {
    setEditingDoctor(doctor);
    setFormData({
      fullName: doctor.fullName,
      title: doctor.title || '',
      licenseNumber: doctor.licenseNumber || '',
      specialization: doctor.specialization || '',
      isActive: doctor.isActive,
    });
    setFormError(null);
  };

  // Open Detail Modal
  const handleOpenDetailModal = async (doctorId: string) => {
    try {
      const detail = await doctorService.getDoctorById(doctorId);
      setViewingDoctor(detail);
    } catch (err) {
      console.error('Lỗi lấy chi tiết bác sĩ:', err);
    }
  };

  // Handle Submit Create
  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên bác sĩ');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await doctorService.createDoctor(formData);
      setIsCreateModalOpen(false);
      fetchDoctors(); // Refresh list
    } catch (err: any) {
      setFormError(err?.message || 'Tạo bác sĩ thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Submit Edit
  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    if (!formData.fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên bác sĩ');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await doctorService.updateDoctor(editingDoctor.doctorId, formData);
      setEditingDoctor(null);
      fetchDoctors(); // Refresh list
    } catch (err: any) {
      setFormError(err?.message || 'Cập nhật bác sĩ thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Panel */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-800 shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Quản Lý Bác Sĩ</span>
              <Badge variant="normal" size="sm">
                Admin Portal
              </Badge>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Danh sách bác sĩ chính thức & thỉnh giảng, cấp số giấy phép hành nghề và quản lý chuyên khoa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDoctors}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Bác Sĩ Mới</span>
          </button>
        </div>
      </div>

      {/* Quick Overview KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng Bác Sĩ</span>
            <div className="text-2xl font-black text-slate-800 mt-1">{doctors.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Đang Hoạt Động</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {doctors.filter((d) => d.isActive).length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Chuyên Khoa Giám Sát</span>
            <div className="text-2xl font-black text-purple-600 mt-1">
              {new Set(doctors.map((d) => d.specialization).filter(Boolean)).size}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
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
            <p className="text-xs">Thử điều chỉnh từ khóa tìm kiếm hoặc bấm "Thêm Bác Sĩ Mới".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã Bác Sĩ</th>
                  <th className="py-3.5 px-4">Họ và Tên & Chức Danh</th>
                  <th className="py-3.5 px-4">Chuyên Khoa</th>
                  <th className="py-3.5 px-4">Giấy Phép Hành Nghề</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
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
                          <div className="text-[10px] text-slate-400">
                            ID: {doctor.doctorId.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-slate-800 font-medium bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {doctor.specialization || 'Chưa cập nhật'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {doctor.licenseNumber ? (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <FileCheck className="w-3.5 h-3.5" />
                          {doctor.licenseNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chưa cấp GP</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {doctor.isActive ? (
                        <Badge variant="normal" size="sm">
                          Hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Tạm ngưng
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetailModal(doctor.doctorId)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(doctor)}
                          className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-4 h-4" />
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

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-700" />
                <span>Thêm Bác Sĩ Mới</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-4 text-xs font-semibold">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold">Họ và Tên bác sĩ (*)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-bold">Chức danh học vị</label>
                  <select
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                  >
                    <option value="BS">BS. (Bác sĩ)</option>
                    <option value="ThS.BS">ThS.BS (Thạc sĩ Bác sĩ)</option>
                    <option value="BS.CKI">BS.CKI (Chuyên khoa I)</option>
                    <option value="BS.CKII">BS.CKII (Chuyên khoa II)</option>
                    <option value="TS.BS">TS.BS (Tiến sĩ Bác sĩ)</option>
                    <option value="PGS.TS.BS">PGS.TS.BS (Phó Giáo sư)</option>
                    <option value="GS.TS.BS">GS.TS.BS (Giáo sư)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-bold">Chuyên khoa</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Tim mạch, Nhi..."
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold">Số Giấy phép hành nghề (License Number)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: CCHN-123456/BYT"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-blue-900 rounded cursor-pointer"
                />
                <label htmlFor="createIsActive" className="text-slate-800 font-bold cursor-pointer">
                  Trạng thái hoạt động (Kích hoạt bác sĩ)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Lưu Bác Sĩ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <span>Chỉnh Sửa Thông Tin Bác Sĩ ({editingDoctor.doctorCode})</span>
              </h3>
              <button
                onClick={() => setEditingDoctor(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDoctor} className="space-y-4 text-xs font-semibold">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold">Họ và Tên bác sĩ (*)</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-bold">Chức danh học vị</label>
                  <select
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                  >
                    <option value="BS">BS. (Bác sĩ)</option>
                    <option value="ThS.BS">ThS.BS (Thạc sĩ Bác sĩ)</option>
                    <option value="BS.CKI">BS.CKI (Chuyên khoa I)</option>
                    <option value="BS.CKII">BS.CKII (Chuyên khoa II)</option>
                    <option value="TS.BS">TS.BS (Tiến sĩ Bác sĩ)</option>
                    <option value="PGS.TS.BS">PGS.TS.BS (Phó Giáo sư)</option>
                    <option value="GS.TS.BS">GS.TS.BS (Giáo sư)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-bold">Chuyên khoa</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold">Số Giấy phép hành nghề (License Number)</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-blue-900 rounded cursor-pointer"
                />
                <label htmlFor="editIsActive" className="text-slate-800 font-bold cursor-pointer">
                  Trạng thái hoạt động (Kích hoạt bác sĩ)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Cập Nhật Bác Sĩ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {viewingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-700" />
                <span>Chi Tiết Bác Sĩ</span>
              </h3>
              <button
                onClick={() => setViewingDoctor(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-950 text-sm">{viewingDoctor.doctorCode}</span>
                  {viewingDoctor.isActive ? (
                    <Badge variant="normal" size="sm">Đang hoạt động</Badge>
                  ) : (
                    <Badge variant="warning" size="sm">Tạm ngưng</Badge>
                  )}
                </div>
                <div className="text-base font-black text-slate-900">
                  {viewingDoctor.title ? `${viewingDoctor.title} ` : ''}{viewingDoctor.fullName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Chuyên Khoa</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{viewingDoctor.specialization || 'Chưa cập nhật'}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Giấy Phép Hành Nghề</span>
                  <span className="font-mono font-bold text-emerald-700 mt-0.5 block">
                    {viewingDoctor.licenseNumber || 'Chưa có'}
                  </span>
                </div>
              </div>

              {viewingDoctor.doctorDepartments && viewingDoctor.doctorDepartments.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-extrabold text-slate-800 block">Các khoa trực thuộc:</span>
                  <div className="space-y-1">
                    {viewingDoctor.doctorDepartments.map((rel) => (
                      <div
                        key={rel.departmentId}
                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between"
                      >
                        <span className="font-bold text-slate-800">
                          {rel.department?.departmentName} ({rel.department?.departmentCode})
                        </span>
                        {rel.isPrimary && <Badge variant="info" size="sm">Khoa chính</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingDoctor(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
