import React, { useState, useEffect, useMemo } from 'react';
import {
  FlaskConical,
  Search,
  Filter,
  RefreshCw,
  Building2,
  CheckCircle2,
  XCircle,
  Edit3,
  Tag,
  AlertCircle,
  Loader2,
  X,
  Save,
  Check,
  Eye,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { apiFetch } from '../../services/api';

export interface ServiceCatalogAdminItem {
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  modality: string; // blood_test | ecg | xray | echo
  panelGroup: string | null;
  resultKind: string; // parametric | waveform | image_report
  specimenType: string | null;
  requiresFasting: boolean;
  preparationNote: string | null;
  price: number;
  turnaroundMins: number | null;
  isActive: boolean;
  defaultRoomId?: string;
  defaultRoom?: {
    diagnosticRoomId: string;
    diagnosticRoomCode: string;
    diagnosticRoomName: string;
    modality: string;
    location: string;
  };
}

export const AdminServiceCatalogFeesView: React.FC = () => {
  const [services, setServices] = useState<ServiceCatalogAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal State for Edit Service
  const [editingService, setEditingService] = useState<ServiceCatalogAdminItem | null>(null);
  const [detailService, setDetailService] = useState<ServiceCatalogAdminItem | null>(null);

  // Form State for Edit
  const [formData, setFormData] = useState<{
    serviceName: string;
    price: number | '';
    preparationNote: string;
    requiresFasting: boolean;
    turnaroundMins: number | '';
    isActive: boolean;
  }>({
    serviceName: '',
    price: '',
    preparationNote: '',
    requiresFasting: false,
    turnaroundMins: '',
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchServices = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setErrorMessage(null);

      // Gọi API danh mục dịch vụ cận lâm sàng
      const res = await apiFetch<{ total: number; items: any[] }>('/doctor-examination/services');
      if (res && Array.isArray(res.items)) {
        const mapped: ServiceCatalogAdminItem[] = res.items.map((item) => ({
          serviceId: item.serviceId,
          serviceCode: item.serviceCode,
          serviceName: item.serviceName,
          modality: item.modality || 'blood_test',
          panelGroup: item.panelGroup || null,
          resultKind: item.resultKind || 'parametric',
          specimenType: item.specimenType || null,
          requiresFasting: Boolean(item.requiresFasting),
          preparationNote: item.preparationNote || null,
          price: Number(item.price) || 0,
          turnaroundMins: item.turnaroundMins ? Number(item.turnaroundMins) : null,
          isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
          defaultRoom: item.defaultRoom,
        }));
        setServices(mapped);
      } else {
        setServices([]);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh mục dịch vụ xét nghiệm:', err);
      setErrorMessage(err?.message || 'Không thể tải danh sách dịch vụ xét nghiệm.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenEditModal = (service: ServiceCatalogAdminItem) => {
    setEditingService(service);
    setFormData({
      serviceName: service.serviceName,
      price: service.price,
      preparationNote: service.preparationNote || '',
      requiresFasting: service.requiresFasting,
      turnaroundMins: service.turnaroundMins ?? '',
      isActive: service.isActive,
    });
    setModalError(null);
  };

  const handleCloseModal = () => {
    setEditingService(null);
    setModalError(null);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    if (!formData.serviceName.trim()) {
      setModalError('Tên dịch vụ xét nghiệm không được để trống.');
      return;
    }
    if (formData.price === '' || Number(formData.price) < 0) {
      setModalError('Đơn giá dịch vụ phải lớn hơn hoặc bằng 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);

      // Cập nhật optimistic trên UI trước
      setServices((prev) =>
        prev.map((s) =>
          s.serviceId === editingService.serviceId
            ? {
                ...s,
                serviceName: formData.serviceName.trim(),
                price: Number(formData.price),
                preparationNote: formData.preparationNote.trim() || null,
                requiresFasting: formData.requiresFasting,
                turnaroundMins: formData.turnaroundMins === '' ? null : Number(formData.turnaroundMins),
                isActive: formData.isActive,
              }
            : s
        )
      );

      setSuccessMessage(`Đã cập nhật biểu phí cho dịch vụ [${editingService.serviceCode}] thành công!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      handleCloseModal();
    } catch (err: any) {
      console.error('Lỗi khi cập nhật dịch vụ:', err);
      setModalError(err?.message || 'Đã xảy ra lỗi khi lưu thông tin dịch vụ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper format VND
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Helper map Modality text & badge
  const getModalityBadge = (modality: string) => {
    switch (modality) {
      case 'blood_test':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Xét nghiệm máu</span>;
      case 'ecg':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Điện tâm đồ (ECG)</span>;
      case 'echo':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Siêu âm tim</span>;
      case 'xray':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">X-Quang ngực</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">{modality}</span>;
    }
  };

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // Modality filter
      if (selectedModality !== 'all' && s.modality !== selectedModality) return false;

      // Status filter
      if (selectedStatus === 'active' && !s.isActive) return false;
      if (selectedStatus === 'inactive' && s.isActive) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchCode = s.serviceCode.toLowerCase().includes(query);
        const matchName = s.serviceName.toLowerCase().includes(query);
        const matchRoom = s.defaultRoom?.diagnosticRoomName?.toLowerCase().includes(query);
        const matchGroup = s.panelGroup?.toLowerCase().includes(query);
        return matchCode || matchName || matchRoom || matchGroup;
      }

      return true;
    });
  }, [services, selectedModality, selectedStatus, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = services.length;
    const activeCount = services.filter((s) => s.isActive).length;
    const bloodCount = services.filter((s) => s.modality === 'blood_test').length;
    const otherModalityCount = total - bloodCount;
    return { total, activeCount, bloodCount, otherModalityCount };
  }, [services]);

  return (
    <div className="space-y-6">
      {/* Toast Alert Message */}
      {successMessage && (
        <div className="fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl shadow-xl animate-in fade-in max-w-md">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold">{successMessage}</span>
        </div>
      )}

      {/* Thông báo banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-3">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Danh Mục Dịch Vụ Cận Lâm Sàng & Xét Nghiệm (Service Catalog)</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
            Quản Lý Biểu Phí Xét Nghiệm & CĐHA
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Thiết lập đơn giá cho các chỉ định cận lâm sàng (xét nghiệm máu, điện tâm đồ ECG, siêu âm tim, X-quang), điều chỉnh thời gian trả kết quả và lưu ý trước khi làm xét nghiệm.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchServices(true)}
            disabled={isRefreshing || isLoading}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-white/15 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Thẻ Thống Kê Nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tổng số dịch vụ</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Đang hoạt động</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.activeCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Xét nghiệm Máu</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.bloodCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">ECG, Siêu Âm, X-Quang</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.otherModalityCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bộ Lọc & Tìm Kiếm */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên dịch vụ, phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Lọc Modality */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loại:</span>
            <select
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">Tất cả loại hình</option>
              <option value="blood_test">Xét nghiệm máu</option>
              <option value="ecg">Điện tâm đồ (ECG)</option>
              <option value="echo">Siêu âm tim</option>
              <option value="xray">X-Quang ngực</option>
            </select>
          </div>

          {/* Lọc Trạng Thái */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang áp dụng</option>
              <option value="inactive">Tạm ngưng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách Dịch Vụ Cận Lâm Sàng */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
            <p className="text-xs font-medium">Đang tải danh mục dịch vụ cận lâm sàng...</p>
          </div>
        ) : errorMessage ? (
          <div className="py-16 text-center text-rose-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="text-xs font-bold">{errorMessage}</p>
            <button
              onClick={() => fetchServices()}
              className="mt-3 px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition"
            >
              Thử lại
            </button>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium">Không tìm thấy dịch vụ cận lâm sàng nào phù hợp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã Dịch Vụ</th>
                  <th className="py-3.5 px-4">Tên Dịch Vụ Cận Lâm Sàng</th>
                  <th className="py-3.5 px-4">Phân Loại / Modality</th>
                  <th className="py-3.5 px-4">Phòng Thực Hiện Mặc Định</th>
                  <th className="py-3.5 px-4 text-right">Đơn Giá Áp Dụng</th>
                  <th className="py-3.5 px-4 text-center">Thời Gian Trả KQ</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((service) => (
                  <tr key={service.serviceId} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {service.serviceCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{service.serviceName}</div>
                      {service.requiresFasting && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5">
                          ⚠️ Yêu cầu nhịn ăn
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getModalityBadge(service.modality)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]" title={service.defaultRoom?.diagnosticRoomName}>
                          {service.defaultRoom?.diagnosticRoomName || 'Chưa gán phòng'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono text-sm">
                      {formatVND(service.price)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {service.turnaroundMins ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>~{service.turnaroundMins} phút</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">---</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {service.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Hoạt động</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          <XCircle className="w-3 h-3" />
                          <span>Tạm ngưng</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailService(service)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Xem chi tiết dịch vụ"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(service)}
                          className="p-1.5 text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-lg transition cursor-pointer"
                          title="Chỉnh sửa đơn giá & thông tin"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
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

      {/* MODAL CHỈNH SỬA DỊCH VỤ CẬN LÂM SÀNG */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Chỉnh Sửa Biểu Phí & Dịch Vụ
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Mã dịch vụ: {editingService.serviceCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4 overflow-y-auto">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tên dịch vụ cận lâm sàng *</label>
                <input
                  type="text"
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  placeholder="Nhập tên dịch vụ..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Đơn giá áp dụng (VNĐ) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value === '' ? '' : Number(e.target.value) })
                    }
                    placeholder="150000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-blue-700 font-mono outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Thời gian trả KQ (phút)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.turnaroundMins}
                    onChange={(e) =>
                      setFormData({ ...formData, turnaroundMins: e.target.value === '' ? '' : Number(e.target.value) })
                    }
                    placeholder="Ví dụ: 120"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Lưu ý chuẩn bị bệnh nhân</label>
                <textarea
                  rows={2}
                  value={formData.preparationNote}
                  onChange={(e) => setFormData({ ...formData, preparationNote: e.target.value })}
                  placeholder="Ví dụ: Nhịn ăn ít nhất 8 tiếng trước khi lấy máu..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.requiresFasting}
                    onChange={(e) => setFormData({ ...formData, requiresFasting: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-700">Yêu cầu bệnh nhân nhịn ăn</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-700">Đang hoạt động</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu Thay Đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT DỊCH VỤ */}
      {detailService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Chi Tiết Dịch Vụ Cận Lâm Sàng</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailService(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-semibold">Mã dịch vụ:</span>
                <span className="font-mono font-bold text-blue-700">{detailService.serviceCode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-semibold">Tên dịch vụ:</span>
                <span className="font-bold text-slate-800 text-right">{detailService.serviceName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-semibold">Phân loại:</span>
                <span>{getModalityBadge(detailService.modality)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-semibold">Đơn giá:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{formatVND(detailService.price)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-semibold">Phòng thực hiện:</span>
                <span className="font-semibold text-slate-700">{detailService.defaultRoom?.diagnosticRoomName || '---'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-semibold">Thời gian dự kiến:</span>
                <span className="font-semibold text-slate-700">
                  {detailService.turnaroundMins ? `~${detailService.turnaroundMins} phút` : '---'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-semibold">Lưu ý chuẩn bị:</span>
                <span className="font-medium text-slate-700 text-right max-w-[200px]">
                  {detailService.preparationNote || 'Không có yêu cầu đặc biệt'}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400 font-semibold">Trạng thái:</span>
                <span>
                  {detailService.isActive ? (
                    <span className="text-emerald-700 font-bold">Đang áp dụng</span>
                  ) : (
                    <span className="text-slate-500 font-bold">Tạm ngưng</span>
                  )}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailService(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
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

