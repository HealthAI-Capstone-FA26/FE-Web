import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Building2,
  CheckCircle2,
  XCircle,
  Edit3,
  Calendar,
  Tag,
  AlertCircle,
  Loader2,
  X,
  Save,
  Check,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  examinationFeeService,
  type ExaminationFeeItem,
  type CreateExaminationFeeData,
  type UpdateExaminationFeeData
} from '../../services/payment/examination-fee.service';
import { doctorService, type DepartmentResponse } from '../../services/doctor/doctor.service';

export const AdminExaminationFeesView: React.FC = () => {
  const [fees, setFees] = useState<ExaminationFeeItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingFee, setEditingFee] = useState<ExaminationFeeItem | null>(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState<{
    feeName: string;
    departmentId: string;
    feeType: string;
    price: number | '';
    effectiveFrom: string;
    isActive: boolean;
  }>({
    feeName: '',
    departmentId: '',
    feeType: 'standard',
    price: 150000,
    effectiveFrom: new Date().toISOString().split('T')[0],
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch data
  const fetchData = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const [feeList, deptList] = await Promise.all([
        examinationFeeService.getExaminationFees(),
        doctorService.getDepartments().catch(() => []),
      ]);
      setFees(feeList || []);
      setDepartments(deptList || []);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể tải danh sách mức phí khám. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered List
  const filteredFees = useMemo(() => {
    return fees.filter((fee) => {
      // Search
      const matchesSearch =
        !searchTerm.trim() ||
        fee.feeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.feeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fee.department?.departmentName || '').toLowerCase().includes(searchTerm.toLowerCase());

      // Department Filter
      const matchesDept =
        selectedDeptId === 'all' ||
        (selectedDeptId === 'global' ? !fee.departmentId : fee.departmentId === selectedDeptId);

      // Status Filter
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' ? fee.isActive : !fee.isActive);

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [fees, searchTerm, selectedDeptId, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = fees.length;
    const active = fees.filter((f) => f.isActive).length;
    const inactive = fees.filter((f) => !f.isActive).length;
    const global = fees.filter((f) => !f.departmentId).length;
    return { total, active, inactive, global };
  }, [fees]);

  // Open Modal Create
  const handleOpenCreateModal = () => {
    setFormData({
      feeName: '',
      departmentId: '',
      feeType: 'standard',
      price: 150000,
      effectiveFrom: new Date().toISOString().split('T')[0],
      isActive: true,
    });
    setEditingFee(null);
    setModalError(null);
    setIsCreateModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEditModal = (fee: ExaminationFeeItem) => {
    setEditingFee(fee);
    setFormData({
      feeName: fee.feeName,
      departmentId: fee.departmentId || '',
      feeType: fee.feeType || 'standard',
      price: fee.price,
      effectiveFrom: fee.effectiveFrom ? fee.effectiveFrom.split('T')[0] : new Date().toISOString().split('T')[0],
      isActive: fee.isActive,
    });
    setModalError(null);
    setIsCreateModalOpen(true);
  };

  // Submit Create / Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.feeName.trim()) {
      setModalError('Vui lòng nhập tên mức phí khám');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setModalError('Vui lòng nhập đơn giá hợp lệ (> 0 VNĐ)');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingFee) {
        // Update
        const payload: UpdateExaminationFeeData = {
          feeName: formData.feeName.trim(),
          departmentId: formData.departmentId ? formData.departmentId : null,
          feeType: formData.feeType,
          price: Number(formData.price),
          effectiveFrom: formData.effectiveFrom,
          isActive: formData.isActive,
        };
        await examinationFeeService.updateExaminationFee(editingFee.feeId, payload);
        setSuccessMessage(`Đã cập nhật thành công mức phí [${editingFee.feeCode}]!`);
      } else {
        // Create
        const payload: CreateExaminationFeeData = {
          feeName: formData.feeName.trim(),
          departmentId: formData.departmentId ? formData.departmentId : undefined,
          feeType: formData.feeType,
          price: Number(formData.price),
          effectiveFrom: formData.effectiveFrom,
          isActive: formData.isActive,
        };
        const created = await examinationFeeService.createExaminationFee(payload);
        setSuccessMessage(`Đã tạo thành công mức phí mới [${created.feeCode}]!`);
      }

      setIsCreateModalOpen(false);
      fetchData(true);
    } catch (err: any) {
      setModalError(err?.message || 'Thao tác thất bại. Vui lòng kiểm tra lại quyền hoặc dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (fee: ExaminationFeeItem) => {
    try {
      const updatedStatus = !fee.isActive;
      await examinationFeeService.updateExaminationFee(fee.feeId, { isActive: updatedStatus });
      setFees((prev) =>
        prev.map((f) => (f.feeId === fee.feeId ? { ...f, isActive: updatedStatus } : f))
      );
      setSuccessMessage(
        `Đã ${updatedStatus ? 'kích hoạt' : 'tạm ngưng'} mức phí [${fee.feeCode}]`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể thay đổi trạng thái mức phí');
    }
  };

  // Format Currency
  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Fee Type Badge helper
  const renderFeeTypeBadge = (type: string) => {
    switch (type) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-100 text-amber-800">Khám Cấp Cứu</span>;
      case 'vip':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-purple-100 text-purple-800">Khám VIP</span>;
      case 'specialist':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-100 text-indigo-800">Chuyên Khoa</span>;
      case 'standard':
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">Khám Thường</span>;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 text-xs font-extrabold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 border-none bg-transparent cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 text-xs font-extrabold">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 border-none bg-transparent cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng số mức phí</p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{stats.total}</h4>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đang áp dụng</p>
            <h4 className="text-2xl font-black text-emerald-600 mt-0.5">{stats.active}</h4>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tạm ngưng</p>
            <h4 className="text-2xl font-black text-rose-600 mt-0.5">{stats.inactive}</h4>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phí chung toàn viện</p>
            <h4 className="text-2xl font-black text-purple-700 mt-0.5">{stats.global}</h4>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã phí, tên phí hoặc tên khoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:bg-white focus:border-blue-600 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dept Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer text-xs"
              >
                <option value="all">Tất cả Khoa phòng</option>
                <option value="global">🌐 Phí chung toàn viện</option>
                {departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentName}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer text-xs"
              >
                <option value="all">Tất cả Trạng thái</option>
                <option value="active">🟢 Đang áp dụng</option>
                <option value="inactive">🔴 Tạm ngưng</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-all cursor-pointer border-none flex items-center space-x-1 text-xs"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Create Fee Button */}
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold shadow-sm transition-all cursor-pointer border-none flex items-center space-x-2 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Mức Phí Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500">Đang tải danh mục phí khám...</p>
          </div>
        ) : filteredFees.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <p className="text-sm font-extrabold text-slate-800">Không tìm thấy mức phí khám phù hợp</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Thử thay đổi từ khóa tìm kiếm hoặc bấm nút "Tạo Mức Phí Mới" để khai báo giá dịch vụ khám bệnh mới.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã Phí</th>
                  <th className="py-3.5 px-4">Tên Mức Phí Khám</th>
                  <th className="py-3.5 px-4">Khoa Áp Dụng</th>
                  <th className="py-3.5 px-4">Loại Phí</th>
                  <th className="py-3.5 px-4 text-right">Đơn Giá (VNĐ)</th>
                  <th className="py-3.5 px-4">Ngày Hiệu Lực</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredFees.map((fee) => (
                  <tr key={fee.feeId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Fee Code */}
                    <td className="py-3 px-4 font-black text-blue-900 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 inline-flex items-center gap-1 font-mono text-[11px]">
                        <Tag className="w-3 h-3 text-blue-500" />
                        {fee.feeCode}
                      </span>
                    </td>

                    {/* Fee Name */}
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      <div>{fee.feeName}</div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {fee.department ? (
                        <div className="flex items-center space-x-1.5 text-slate-800 font-bold">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{fee.department.departmentName}</span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200/60 inline-flex items-center space-x-1">
                          <span>🌐 Toàn bệnh viện</span>
                        </span>
                      )}
                    </td>

                    {/* Fee Type */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderFeeTypeBadge(fee.feeType)}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap text-sm">
                      {formatVND(fee.price)}
                    </td>

                    {/* Effective From */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-semibold">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {fee.effectiveFrom
                            ? new Date(fee.effectiveFrom).toLocaleDateString('vi-VN')
                            : 'N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(fee)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer border transition-all ${
                          fee.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Bấm để bật/tắt trạng thái"
                      >
                        {fee.isActive ? (
                          <>
                            <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                            <span>🟢 Đang áp dụng</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3.5 h-3.5 text-rose-600" />
                            <span>🔴 Tạm ngưng</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(fee)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 font-bold transition-all cursor-pointer border-none bg-transparent inline-flex items-center space-x-1.5 text-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Coins className="w-5 h-5 text-blue-700" />
                <span>{editingFee ? `Cập Nhật Mức Phí [${editingFee.feeCode}]` : 'Khai Báo Mức Phí Khám Mới'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs font-semibold">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Tên mức phí khám (*)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Khám Nội tổng quát, Khám Nhi khoa..."
                  value={formData.feeName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, feeName: e.target.value }))}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Khoa áp dụng</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, departmentId: e.target.value }))}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                  >
                    <option value="">🌐 Toàn bệnh viện (Phí chung)</option>
                    {departments.map((d) => (
                      <option key={d.departmentId} value={d.departmentId}>
                        {d.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phân loại phí</label>
                  <select
                    value={formData.feeType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, feeType: e.target.value }))}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                  >
                    <option value="standard">Khám Thường (Standard)</option>
                    <option value="urgent">Khám Cấp Cứu (Urgent)</option>
                    <option value="specialist">Khám Chuyên Khoa (Specialist)</option>
                    <option value="vip">Khám VIP (VIP)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Đơn giá (VNĐ) (*)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    required
                    placeholder="150000"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: e.target.value === '' ? '' : Number(e.target.value),
                      }))
                    }
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-black text-sm text-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ngày bắt đầu có hiệu lực</label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-slate-800 font-bold">Kích hoạt áp dụng mức phí này ngay</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer border-none"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold shadow-sm transition-all cursor-pointer border-none flex items-center space-x-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Đang lưu...' : editingFee ? 'Cập Nhật Mức Phí' : 'Tạo Mức Phí'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
