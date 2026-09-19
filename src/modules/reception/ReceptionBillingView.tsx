import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CreditCard, RefreshCw, XCircle, AlertCircle,
  Loader2, Plus, Eye, CheckCircle2, Clock,
  Stethoscope, Layers, Receipt, FlaskConical
} from 'lucide-react';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/common/DataTable';
import { invoiceService, type InvoiceData } from '../../services/payment/invoice.service';
import { ReceptionGenerateInvoiceModal } from './components/ReceptionGenerateInvoiceModal';
import { ReceptionPaymentModal } from './components/ReceptionPaymentModal';
import { ReceptionCancelInvoiceModal } from './components/ReceptionCancelInvoiceModal';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtVND = (amount: number | string) =>
  Number(amount).toLocaleString('vi-VN') + ' ₫';

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface ReceptionBillingViewProps {
  /** Nếu undefined → hiển thị tất cả hóa đơn pending */
  filterStatus?: 'pending' | 'paid' | 'cancelled';
}

// ─── Component ──────────────────────────────────────────────────────────────

export const ReceptionBillingView: React.FC<ReceptionBillingViewProps> = ({
  filterStatus = 'pending',
}) => {
  // ── State: danh sách hóa đơn ──────────────────────────────────────────────
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // ── State: phân loại hóa đơn (Tổng, Phí khám, Khám + XN, Xét nghiệm) ────
  const [selectedType, setSelectedType] = useState<'all' | 'consultation' | 'combined' | 'tests'>('all');

  // Reset filter khi đổi tab
  useEffect(() => {
    setSelectedType('all');
  }, [filterStatus]);

  // ── State: các modal ──────────────────────────────────────────────────────
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceData | null>(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedInvoiceForCancel, setSelectedInvoiceForCancel] = useState<InvoiceData | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch danh sách hóa đơn
  // ─────────────────────────────────────────────────────────────────────────
  const fetchInvoices = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const data = await invoiceService.findMany({ status: filterStatus });
      setInvoices(data);
    } catch (err: any) {
      setListError(err?.message || 'Không thể tải danh sách hóa đơn.');
    } finally {
      setIsLoadingList(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // ─────────────────────────────────────────────────────────────────────────
  // Thống kê & lọc theo loại hóa đơn (Khám, Khám + XN, Tổng)
  // ─────────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const consultationList = invoices.filter((i) => i.invoiceType === 'consultation');
    const combinedList = invoices.filter((i) => i.invoiceType === 'combined');
    const testsList = invoices.filter((i) => i.invoiceType === 'tests');

    const sumAmount = (list: InvoiceData[]) =>
      list.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

    return {
      all: { count: invoices.length, amount: sumAmount(invoices) },
      consultation: { count: consultationList.length, amount: sumAmount(consultationList) },
      combined: { count: combinedList.length, amount: sumAmount(combinedList) },
      tests: { count: testsList.length, amount: sumAmount(testsList) },
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    if (filterStatus !== 'paid' || selectedType === 'all') return invoices;
    return invoices.filter((inv) => inv.invoiceType === selectedType);
  }, [invoices, selectedType, filterStatus]);

  // ─────────────────────────────────────────────────────────────────────────
  // Modal openers (Mở tức thì 0ms + Tải ngầm chi tiết)
  // ─────────────────────────────────────────────────────────────────────────
  const openPaymentModal = (invoice: InvoiceData) => {
    // 1. Mở modal ngay lập tức bằng dữ liệu sẵn có (0ms - siêu mượt)
    setSelectedInvoiceForPayment(invoice);
    setIsPaymentModalOpen(true);

    // 2. Chạy ngầm API GET /api/v1/invoices/{id} để đồng bộ dữ liệu mới nhất (nếu có)
    invoiceService.findById(invoice.invoiceId)
      .then((freshInvoice) => {
        setSelectedInvoiceForPayment(freshInvoice);
      })
      .catch((err) => {
        console.warn('Sử dụng dữ liệu hóa đơn hiện tại:', err);
      });
  };

  const openCancelModal = (invoice: InvoiceData) => {
    setSelectedInvoiceForCancel(invoice);
    setIsCancelModalOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Cấu hình cột bảng
  // ─────────────────────────────────────────────────────────────────────────
  const columns: Column<InvoiceData>[] = [
    {
      header: 'Mã Hóa Đơn',
      accessorKey: 'invoiceCode',
      cell: (row) => (
        <span className="font-mono font-bold text-blue-700 text-xs">
          {row.invoiceCode}
        </span>
      ),
    },
    {
      header: 'Loại',
      accessorKey: 'invoiceType',
      cell: (row) => {
        const typeMap: Record<string, { label: string; variant: BadgeVariant }> = {
          consultation: { label: 'Khám', variant: 'info' },
          tests: { label: 'Xét nghiệm', variant: 'ai' },
          combined: { label: 'Khám + XN', variant: 'neutral' },
        };
        const conf = typeMap[row.invoiceType] || { label: row.invoiceType, variant: 'info' };
        return <Badge variant={conf.variant} size="sm">{conf.label}</Badge>;
      },
    },
    {
      header: 'Số Dịch Vụ',
      cell: (row) => (
        <span className="text-xs text-slate-600">
          {row.items?.length ?? 0} mục
        </span>
      ),
    },
    {
      header: 'Tổng Tiền',
      accessorKey: 'totalAmount',
      cell: (row) => (
        <span className="font-extrabold text-emerald-700 text-xs">
          {fmtVND(row.totalAmount)}
        </span>
      ),
    },
    {
      header: 'Ngày Lập',
      accessorKey: 'createdAt',
      cell: (row) => (
        <span className="text-xs text-slate-500">{fmtDate(row.createdAt)}</span>
      ),
    },
    {
      header: 'Trạng Thái',
      accessorKey: 'status',
      cell: (row) => {
        if (row.status === 'paid') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Đã thanh toán
            </span>
          );
        }
        if (row.status === 'pending') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Clock className="w-3 h-3" />
              Chờ thanh toán
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            <XCircle className="w-3 h-3" />
            Đã hủy
          </span>
        );
      },
    },
    {
      header: 'Thao Tác',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => openPaymentModal(row)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 border-none cursor-pointer transition-colors shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Thanh toán</span>
              </button>
              <button
                type="button"
                onClick={() => openCancelModal(row)}
                title="Hủy hóa đơn"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer border-none bg-transparent transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {row.status === 'paid' && (
            <button
              type="button"
              onClick={() => openPaymentModal(row)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center gap-1 border border-emerald-200 cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem chi tiết</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {filterStatus === 'paid'
              ? 'Hóa Đơn Đã Thanh Toán'
              : filterStatus === 'cancelled'
              ? 'Hóa Đơn Đã Hủy'
              : 'Thu Phí & Thanh Toán'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {filterStatus === 'paid'
              ? 'Tra cứu lịch sử, xem & in lại phiếu thu PDF.'
              : filterStatus === 'cancelled'
              ? 'Danh sách các hóa đơn đã hủy bỏ do bác sĩ đổi chỉ định.'
              : 'Tính chi phí dịch vụ, tạo mã QR PayOS và thu phí bệnh nhân.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filterStatus === 'pending' && (
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lập hóa đơn mới</span>
            </button>
          )}
          <button
            type="button"
            onClick={fetchInvoices}
            disabled={isLoadingList}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border-none cursor-pointer transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {listError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold text-sm">Không tải được dữ liệu</p>
            <p className="text-xs">{listError}</p>
          </div>
          <button
            type="button"
            onClick={fetchInvoices}
            className="ml-auto px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg border-none cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Overview Stat Cards - Chỉ hiển thị ở tab Hóa đơn đã thanh toán */}
      {filterStatus === 'paid' && !isLoadingList && !listError && invoices.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${stats.tests.count > 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3.5`}>
          {/* Card 1: Tổng */}
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedType === 'all'
                ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Tổng Tất Cả</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  selectedType === 'all' ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {stats.all.count}
                </span>
              </div>
              <p className="text-lg font-black text-slate-900">{fmtVND(stats.all.amount)}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              selectedType === 'all' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
            }`}>
              <Receipt className="w-5 h-5" />
            </div>
          </button>

          {/* Card 2: Phí khám chung */}
          <button
            type="button"
            onClick={() => setSelectedType('consultation')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedType === 'consultation'
                ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-500/20 shadow-xs'
                : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Phí Khám Chung</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  selectedType === 'consultation' ? 'bg-sky-200 text-sky-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {stats.consultation.count}
                </span>
              </div>
              <p className="text-lg font-black text-sky-900">{fmtVND(stats.consultation.amount)}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              selectedType === 'consultation' ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-600'
            }`}>
              <Stethoscope className="w-5 h-5" />
            </div>
          </button>

          {/* Card 3: Khám + Xét nghiệm */}
          <button
            type="button"
            onClick={() => setSelectedType('combined')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedType === 'combined'
                ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20 shadow-xs'
                : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Khám + Xét Nghiệm</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  selectedType === 'combined' ? 'bg-purple-200 text-purple-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {stats.combined.count}
                </span>
              </div>
              <p className="text-lg font-black text-purple-900">{fmtVND(stats.combined.amount)}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              selectedType === 'combined' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
          </button>

          {/* Card 4: Xét nghiệm (nếu có) */}
          {stats.tests.count > 0 && (
            <button
              type="button"
              onClick={() => setSelectedType('tests')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedType === 'tests'
                  ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Xét Nghiệm Riêng</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    selectedType === 'tests' ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {stats.tests.count}
                  </span>
                </div>
                <p className="text-lg font-black text-amber-900">{fmtVND(stats.tests.amount)}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                selectedType === 'tests' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600'
              }`}>
                <FlaskConical className="w-5 h-5" />
              </div>
            </button>
          )}
        </div>
      )}

      {/* Loading state / DataTable */}
      {isLoadingList ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Đang tải danh sách hóa đơn...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredInvoices}
          extraFilters={
            filterStatus === 'paid' ? (
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {[
                  { id: 'all' as const, label: 'Tất cả (Tổng)', count: stats.all.count },
                  { id: 'consultation' as const, label: 'Phí khám chung', count: stats.consultation.count },
                  { id: 'combined' as const, label: 'Khám + XN', count: stats.combined.count },
                  ...(stats.tests.count > 0
                    ? [{ id: 'tests' as const, label: 'Xét nghiệm', count: stats.tests.count }]
                    : []),
                ].map((tab) => {
                  const active = selectedType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedType(tab.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 border cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          active ? 'bg-blue-700/80 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : undefined
          }
          searchPlaceholder="Tìm theo mã hóa đơn, mã encounter..."
          emptyMessage={
            filterStatus === 'paid' && selectedType !== 'all'
              ? `Không có hóa đơn nào thuộc loại "${
                  selectedType === 'consultation'
                    ? 'Phí khám chung'
                    : selectedType === 'combined'
                    ? 'Khám + XN'
                    : 'Xét nghiệm'
                }".`
              : filterStatus === 'pending'
              ? 'Không có hóa đơn nào đang chờ thanh toán.'
              : 'Không có hóa đơn nào.'
          }
        />
      )}

      {/* ── Modal 1: Lập hóa đơn mới ───────────────────────────────────────── */}
      <ReceptionGenerateInvoiceModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onInvoiceCreated={(created) => {
          fetchInvoices();
          openPaymentModal(created);
        }}
        onSelectPendingInvoice={(inv) => {
          openPaymentModal(inv);
        }}
      />

      {/* ── Modal 2: Xử lý thanh toán ──────────────────────────────────────── */}
      <ReceptionPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedInvoiceForPayment(null);
        }}
        invoice={selectedInvoiceForPayment}
        onPaymentSuccess={() => {
          fetchInvoices();
        }}
        onCancelInvoice={(inv) => {
          setIsPaymentModalOpen(false);
          openCancelModal(inv);
        }}
      />

      {/* ── Modal 3: Xác nhận hủy hóa đơn ─────────────────────────────────── */}
      <ReceptionCancelInvoiceModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedInvoiceForCancel(null);
        }}
        invoice={selectedInvoiceForCancel}
        onCancelSuccess={() => {
          fetchInvoices();
        }}
      />
    </div>
  );
};
