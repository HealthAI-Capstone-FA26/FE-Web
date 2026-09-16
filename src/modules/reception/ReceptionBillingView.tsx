import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, QrCode, CheckCircle2, Download, Printer,
  RefreshCw, Banknote, XCircle, FileText, AlertCircle,
  Clock, Loader2, ChevronRight, Receipt, Wallet, Plus, Search
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { invoiceService, type InvoiceData } from '../../services/payment/invoice.service';
import {
  paymentTransactionService,
  type PaymentTransaction,
  type BankTransferResult,
} from '../../services/payment/payment-transaction.service';
import { encounterService, type EncounterItem } from '../../services/encounter/encounter.service';

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

type PaymentStep = 'idle' | 'select_method' | 'cash_confirm' | 'qr_waiting' | 'success' | 'cancelled';
type PaymentMethod = 'cash' | 'bank_transfer';

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

  // ── State: modal thanh toán ───────────────────────────────────────────────
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── State: thanh toán tiền mặt ────────────────────────────────────────────
  const [cashPayment, setCashPayment] = useState<PaymentTransaction | null>(null);

  // ── State: chuyển khoản QR ────────────────────────────────────────────────
  const [bankTransferResult, setBankTransferResult] = useState<BankTransferResult | null>(null);
  const [isPollingStatus, setIsPollingStatus] = useState(false);

  // ── State: hủy hóa đơn ───────────────────────────────────────────────────
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // ── State: PDF ────────────────────────────────────────────────────────────
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  // ── State: Lập hóa đơn mới ───────────────────────────────────────────────
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateEncounterId, setGenerateEncounterId] = useState('');
  const [generateDiscount, setGenerateDiscount] = useState<number | ''>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Danh sách lượt khám gợi ý khi lập hóa đơn
  const [recentEncounters, setRecentEncounters] = useState<EncounterItem[]>([]);
  const [allInvoicesForLookup, setAllInvoicesForLookup] = useState<InvoiceData[]>([]);
  const [isLoadingEncounters, setIsLoadingEncounters] = useState(false);
  const [encounterSearch, setEncounterSearch] = useState('');

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

  // Tải danh sách lượt khám gần đây kèm toàn bộ hóa đơn để kiểm tra trạng thái
  const fetchRecentEncounters = useCallback(async () => {
    setIsLoadingEncounters(true);
    try {
      const [encData, invData] = await Promise.all([
        encounterService.getEncounters(),
        invoiceService.findMany({}),
      ]);
      setRecentEncounters(encData || []);
      setAllInvoicesForLookup(invData || []);
    } catch {
      setRecentEncounters([]);
      setAllInvoicesForLookup([]);
    } finally {
      setIsLoadingEncounters(false);
    }
  }, []);

  // Tra cứu trạng thái hóa đơn của từng ca khám
  const getEncounterBillingInfo = useCallback(
    (encounterId: string) => {
      const invs = allInvoicesForLookup.filter((i) => i.encounterId === encounterId);
      if (invs.length === 0) {
        return {
          status: 'none' as const,
          label: 'Chưa lập hóa đơn',
          badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
          invoice: null,
        };
      }
      const pendingInv = invs.find((i) => i.status === 'pending');
      if (pendingInv) {
        return {
          status: 'pending' as const,
          label: `Chờ thanh toán (${pendingInv.invoiceCode})`,
          badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
          invoice: pendingInv,
        };
      }
      const paidInvs = invs.filter((i) => i.status === 'paid');
      if (paidInvs.length > 0) {
        return {
          status: 'paid' as const,
          label: `Đã thanh toán (${paidInvs[0].invoiceCode})`,
          badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          invoice: paidInvs[0],
        };
      }
      return {
        status: 'cancelled' as const,
        label: 'Hóa đơn đã hủy',
        badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
        invoice: null,
      };
    },
    [allInvoicesForLookup]
  );

  useEffect(() => {
    if (isGenerateModalOpen) {
      fetchRecentEncounters();
    }
  }, [isGenerateModalOpen, fetchRecentEncounters]);

  // ─────────────────────────────────────────────────────────────────────────
  // Polling trạng thái thanh toán QR (mỗi 5 giây)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (paymentStep !== 'qr_waiting' || !bankTransferResult) return;

    setIsPollingStatus(true);
    const intervalId = setInterval(async () => {
      try {
        const payment = await paymentTransactionService.getById(bankTransferResult.paymentId);
        if (payment.status === 'success') {
          clearInterval(intervalId);
          setIsPollingStatus(false);
          setPaymentStep('success');
          await fetchInvoices();
          // Load PDF
          if (selectedInvoice) {
            loadPdf(selectedInvoice.invoiceId);
          }
        } else if (payment.status === 'failed') {
          clearInterval(intervalId);
          setIsPollingStatus(false);
          setActionError('Giao dịch QR thất bại. Vui lòng thử lại.');
          setPaymentStep('select_method');
        }
      } catch {
        // bỏ qua lỗi polling, thử lại ở lần sau
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
      setIsPollingStatus(false);
    };
  }, [paymentStep, bankTransferResult, selectedInvoice, fetchInvoices]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const openPaymentModal = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
    setPaymentStep('select_method');
    setPaymentMethod('cash');
    setCashPayment(null);
    setBankTransferResult(null);
    setPdfUrl(null);
    setActionError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
    setPaymentStep('idle');
    setCashPayment(null);
    setBankTransferResult(null);
    setActionError(null);
  };

  const loadPdf = async (invoiceId: string) => {
    setIsLoadingPdf(true);
    try {
      const result = await invoiceService.getPdfUrl(invoiceId);
      setPdfUrl(result.url);
    } catch {
      setPdfUrl(null);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Lập hóa đơn mới cho lượt khám
  const handleGenerateInvoice = async () => {
    const encId = generateEncounterId.trim();
    if (!encId) {
      setGenerateError('Vui lòng chọn hoặc nhập mã lượt khám (Encounter ID).');
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const discount =
        typeof generateDiscount === 'number' && generateDiscount > 0
          ? generateDiscount
          : undefined;
      const createdInvoice = await invoiceService.generate({
        encounterId: encId,
        discountAmount: discount,
      });
      setIsGenerateModalOpen(false);
      setGenerateEncounterId('');
      setGenerateDiscount('');
      await fetchInvoices();
      // Tự động mở modal thanh toán cho hóa đơn vừa tạo
      openPaymentModal(createdInvoice);
    } catch (err: any) {
      setGenerateError(err?.message || 'Không thể lập hóa đơn cho lượt khám này.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Bước 1: Tạo giao dịch tiền mặt
  const handleCreateCashPayment = async () => {
    if (!selectedInvoice) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      const payment = await paymentTransactionService.createCash({
        invoiceId: selectedInvoice.invoiceId,
        amount: Number(selectedInvoice.totalAmount),
      });
      setCashPayment(payment);
      setPaymentStep('cash_confirm');
    } catch (err: any) {
      setActionError(err?.message || 'Không thể tạo giao dịch tiền mặt.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bước 2: Xác nhận đã thu tiền mặt
  const handleConfirmCash = async () => {
    if (!cashPayment) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await paymentTransactionService.confirmCash(cashPayment.paymentId);
      setPaymentStep('success');
      await fetchInvoices();
      if (selectedInvoice) {
        loadPdf(selectedInvoice.invoiceId);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Không thể xác nhận thanh toán.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Tạo link QR chuyển khoản
  const handleCreateBankTransfer = async () => {
    if (!selectedInvoice) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      const result = await paymentTransactionService.createBankTransfer({
        invoiceId: selectedInvoice.invoiceId,
      });
      setBankTransferResult(result);
      setPaymentStep('qr_waiting');
    } catch (err: any) {
      setActionError(err?.message || 'Không thể tạo mã QR chuyển khoản.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Hủy hóa đơn
  const handleCancelInvoice = async () => {
    if (!selectedInvoice || !cancelReason.trim()) return;
    setIsCancelling(true);
    try {
      await invoiceService.cancel(selectedInvoice.invoiceId, { cancelReason });
      setIsCancelModalOpen(false);
      setCancelReason('');
      closeModal();
      await fetchInvoices();
    } catch (err: any) {
      setActionError(err?.message || 'Không thể hủy hóa đơn.');
    } finally {
      setIsCancelling(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Columns
  // ─────────────────────────────────────────────────────────────────────────
  const columns: Column<InvoiceData>[] = [
    {
      header: 'Mã Hóa Đơn',
      accessorKey: 'invoiceCode',
      cell: (row) => (
        <span className="font-extrabold text-blue-800 whitespace-nowrap font-mono text-xs">
          {row.invoiceCode}
        </span>
      ),
    },
    {
      header: 'Loại',
      cell: (row) => {
        const typeMap: Record<string, string> = {
          consultation: 'Khám',
          tests: 'Xét nghiệm',
          combined: 'Khám + XN',
        };
        return (
          <Badge variant="info" size="sm" icon={false}>
            {typeMap[row.invoiceType] ?? row.invoiceType}
          </Badge>
        );
      },
    },
    {
      header: 'Số dịch vụ',
      cell: (row) => (
        <span className="text-slate-600 font-semibold">{row.items.length} mục</span>
      ),
    },
    {
      header: 'Tổng tiền',
      cell: (row) => (
        <span className="font-black text-emerald-700 whitespace-nowrap">
          {fmtVND(row.totalAmount)}
        </span>
      ),
    },
    {
      header: 'Ngày lập',
      cell: (row) => (
        <span className="text-slate-500 whitespace-nowrap">{fmtDate(row.issuedAt)}</span>
      ),
    },
    {
      header: 'Trạng thái',
      cell: (row) => {
        const statusMap: Record<string, { variant: any; label: string }> = {
          pending: { variant: 'warning', label: 'Chờ thanh toán' },
          paid: { variant: 'success', label: 'Đã thanh toán' },
          cancelled: { variant: 'neutral', label: 'Đã hủy' },
          refunded: { variant: 'critical', label: 'Hoàn tiền' },
        };
        const s = statusMap[row.status] ?? { variant: 'neutral', label: row.status };
        return <Badge variant={s.variant} size="sm">{s.label}</Badge>;
      },
    },
    {
      header: 'Thao tác',
      cell: (row) => {
        if (row.status === 'paid') {
          return (
            <button
              onClick={() => {
                setSelectedInvoice(row);
                setPdfUrl(row.pdfFileUrl ?? null);
                setPaymentStep('success');
                setIsModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:bg-emerald-100 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Xem / In PDF</span>
            </button>
          );
        }
        if (row.status === 'pending') {
          return (
            <button
              onClick={() => openPaymentModal(row)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Thanh toán</span>
            </button>
          );
        }
        return <span className="text-slate-400 text-xs">—</span>;
      },
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Modal content: từng bước
  // ─────────────────────────────────────────────────────────────────────────
  const renderModalBody = () => {
    if (!selectedInvoice) return null;
    const total = Number(selectedInvoice.totalAmount);
    const discount = Number(selectedInvoice.discountAmount ?? 0);
    const subtotal = Number(selectedInvoice.subtotalAmount ?? total);

    // ─── Bước: Chọn phương thức ───────────────────────────────────────────
    if (paymentStep === 'select_method' || paymentStep === 'idle') {
      return (
        <div className="space-y-5 text-xs">
          {/* Chi tiết hóa đơn */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="font-extrabold text-slate-700 mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              Chi tiết dịch vụ chỉ định
            </p>
            <ul className="divide-y divide-slate-200">
              {selectedInvoice.items.map((item) => (
                <li key={item.invoiceItemId} className="py-2 flex justify-between gap-4">
                  <span className="text-slate-600">{item.description}</span>
                  <span className="font-bold text-slate-800 whitespace-nowrap">
                    {fmtVND(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-slate-300 space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Tạm tính</span>
                <span>{fmtVND(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Giảm trừ (BHYT/khuyến mãi)</span>
                  <span>- {fmtVND(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-base text-emerald-800 pt-1">
                <span>Tổng thanh toán</span>
                <span>{fmtVND(total)}</span>
              </div>
            </div>
          </div>

          {/* Chọn phương thức */}
          <div className="space-y-2">
            <p className="font-extrabold text-slate-800">Phương thức thanh toán</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Tiền mặt */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <Banknote className={`w-5 h-5 mb-1.5 ${paymentMethod === 'cash' ? 'text-blue-600' : 'text-slate-400'}`} />
                <p className={`font-bold ${paymentMethod === 'cash' ? 'text-blue-800' : 'text-slate-700'}`}>
                  Tiền mặt
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">Thu tại quầy lễ tân</p>
              </button>
              {/* Chuyển khoản QR */}
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  paymentMethod === 'bank_transfer'
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <QrCode className={`w-5 h-5 mb-1.5 ${paymentMethod === 'bank_transfer' ? 'text-blue-600' : 'text-slate-400'}`} />
                <p className={`font-bold ${paymentMethod === 'bank_transfer' ? 'text-blue-800' : 'text-slate-700'}`}>
                  QR PayOS
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">Mọi ngân hàng / ví điện tử</p>
              </button>
            </div>
          </div>

          {/* Lỗi */}
          {actionError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
        </div>
      );
    }

    // ─── Bước: Chờ xác nhận tiền mặt ─────────────────────────────────────
    if (paymentStep === 'cash_confirm') {
      return (
        <div className="space-y-5 text-xs">
          <div className="flex flex-col items-center py-4 space-y-3">
            <div className="w-16 h-16 bg-blue-50 border-2 border-blue-200 rounded-full flex items-center justify-center">
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
            <p className="font-black text-slate-800 text-base">Đang chờ thu tiền mặt</p>
            <p className="text-slate-500 text-center max-w-xs">
              Bệnh nhân cần nộp <strong className="text-emerald-700 text-sm">{fmtVND(selectedInvoice.totalAmount)}</strong> tại quầy. Nhấn xác nhận sau khi đã nhận đủ tiền.
            </p>
          </div>
          {cashPayment && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã giao dịch</span>
                <span className="font-mono font-bold text-slate-700 truncate max-w-[180px]">
                  {cashPayment.paymentId.slice(0, 8).toUpperCase()}…
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền</span>
                <span className="font-black text-emerald-700">{fmtVND(cashPayment.amount)}</span>
              </div>
            </div>
          )}
          {actionError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
        </div>
      );
    }

    // ─── Bước: QR đang chờ quét ───────────────────────────────────────────
    if (paymentStep === 'qr_waiting' && bankTransferResult) {
      return (
        <div className="space-y-4 text-xs">
          <div className="bg-slate-900 rounded-2xl p-5 text-center text-white space-y-3">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-sm">
              <QrCode className="w-5 h-5" />
              <span>Quét mã QR để thanh toán</span>
            </div>
            {/* QR Code từ checkoutUrl PayOS */}
            <div className="bg-white p-3 rounded-xl inline-block mx-auto">
              <QRCodeSVG
                value={bankTransferResult.checkoutUrl}
                size={180}
                level="M"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </div>
            <p className="text-slate-300 text-[11px]">
              Hỗ trợ mọi ngân hàng Việt Nam • Ví MoMo / VNPay / ZaloPay
            </p>
            <p className="font-black text-emerald-400 text-base">
              {fmtVND(selectedInvoice.totalAmount)}
            </p>
          </div>

          {/* Trạng thái polling */}
          <div className="flex items-center justify-center gap-2 text-slate-500 py-1">
            {isPollingStatus ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>Đang theo dõi trạng thái thanh toán...</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                <span>Đang chờ bệnh nhân quét mã</span>
              </>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800">
            <p className="font-bold mb-1">Hướng dẫn</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px]">
              <li>Bệnh nhân mở app ngân hàng / ví điện tử</li>
              <li>Quét mã QR trên màn hình này</li>
              <li>Xác nhận số tiền và chuyển khoản</li>
              <li>Hệ thống tự động xác nhận trong vài giây</li>
            </ol>
          </div>
        </div>
      );
    }

    // ─── Bước: Thành công ─────────────────────────────────────────────────
    if (paymentStep === 'success') {
      return (
        <div className="py-4 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h4 className="text-lg font-black text-slate-800">Thanh Toán Thành Công!</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Dữ liệu xét nghiệm đã được kích hoạt chuyển sang phòng Lab tự động.
          </p>

          {/* Nút tải / in PDF */}
          <div className="flex gap-2 justify-center pt-2 flex-wrap">
            {isLoadingPdf ? (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tạo PDF...</span>
              </div>
            ) : pdfUrl ? (
              <>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 no-underline transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Xem &amp; In PDF</span>
                </a>
                <a
                  href={pdfUrl}
                  download
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 no-underline transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải File PDF</span>
                </a>
              </>
            ) : (
              <button
                onClick={() => selectedInvoice && loadPdf(selectedInvoice.invoiceId)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none hover:bg-slate-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tải lại PDF</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Modal footer buttons
  // ─────────────────────────────────────────────────────────────────────────
  const renderModalFooter = () => {
    if (paymentStep === 'success') {
      return (
        <button
          onClick={closeModal}
          className="px-5 py-2 bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none"
        >
          Đóng
        </button>
      );
    }

    if (paymentStep === 'select_method') {
      return (
        <div className="flex gap-2 w-full">
          {/* Nút hủy hóa đơn */}
          <button
            onClick={() => setIsCancelModalOpen(true)}
            className="px-3 py-2 bg-white text-red-600 border border-red-200 font-bold text-xs rounded-xl cursor-pointer hover:bg-red-50 flex items-center gap-1.5 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Hủy hóa đơn</span>
          </button>
          <div className="flex-1" />
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none"
          >
            Đóng
          </button>
          <button
            onClick={paymentMethod === 'cash' ? handleCreateCashPayment : handleCreateBankTransfer}
            disabled={isProcessing}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none flex items-center gap-1.5 disabled:opacity-60 transition-colors"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : paymentMethod === 'cash' ? (
              <Banknote className="w-4 h-4" />
            ) : (
              <QrCode className="w-4 h-4" />
            )}
            <span>
              {isProcessing
                ? 'Đang xử lý...'
                : paymentMethod === 'cash'
                ? 'Tiến hành thu tiền mặt'
                : 'Tạo mã QR thanh toán'}
            </span>
            {!isProcessing && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      );
    }

    if (paymentStep === 'cash_confirm') {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setPaymentStep('select_method');
              setCashPayment(null);
            }}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none"
          >
            Quay lại
          </button>
          <button
            onClick={handleConfirmCash}
            disabled={isProcessing}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none flex items-center gap-1.5 disabled:opacity-60 transition-colors"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{isProcessing ? 'Đang xác nhận...' : 'Xác nhận đã thu tiền'}</span>
          </button>
        </div>
      );
    }

    if (paymentStep === 'qr_waiting') {
      return (
        <button
          onClick={() => {
            setPaymentStep('select_method');
            setBankTransferResult(null);
          }}
          className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none"
        >
          Hủy / Chọn lại phương thức
        </button>
      );
    }

    return null;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {filterStatus === 'paid' ? 'Hóa Đơn Đã Thanh Toán' : filterStatus === 'cancelled' ? 'Hóa Đơn Đã Hủy' : 'Thu Phí & Thanh Toán'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {filterStatus === 'paid'
              ? 'Tra cứu lịch sử, xem & in lại phiếu thu PDF.'
              : 'Tính chi phí dịch vụ, tạo mã QR PayOS và thu phí bệnh nhân.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filterStatus === 'pending' && (
            <button
              onClick={() => {
                setGenerateError(null);
                setIsGenerateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lập hóa đơn mới</span>
            </button>
          )}
          <button
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
            onClick={fetchInvoices}
            className="ml-auto px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg border-none cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoadingList ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Đang tải danh sách hóa đơn...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={invoices}
          searchPlaceholder="Tìm theo mã hóa đơn, mã encounter..."
          emptyMessage={
            filterStatus === 'pending'
              ? 'Không có hóa đơn nào đang chờ thanh toán.'
              : 'Không có hóa đơn nào.'
          }
        />
      )}

      {/* ── Modal thanh toán ──────────────────────────────────────────────── */}
      {selectedInvoice && (
        <Modal
          isOpen={isModalOpen}
          onClose={paymentStep === 'qr_waiting' ? () => {} : closeModal}
          title={
            paymentStep === 'success' ? (
              <span className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                Thanh Toán Thành Công
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Xử Lý Hóa Đơn: {selectedInvoice.invoiceCode}
              </span>
            )
          }
          subtitle={
            paymentStep !== 'success'
              ? `Tổng thanh toán: ${fmtVND(selectedInvoice.totalAmount)}`
              : undefined
          }
          footer={renderModalFooter()}
          maxWidth="lg"
        >
          {renderModalBody()}
        </Modal>
      )}

      {/* ── Modal xác nhận hủy hóa đơn ───────────────────────────────────── */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={
          <span className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            Xác nhận hủy hóa đơn
          </span>
        }
        maxWidth="sm"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none"
            >
              Quay lại
            </button>
            <button
              onClick={handleCancelInvoice}
              disabled={!cancelReason.trim() || isCancelling}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              <span>{isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700">
            <p className="font-bold mb-1">⚠ Cảnh báo</p>
            <p>Hóa đơn <strong>{selectedInvoice?.invoiceCode}</strong> sẽ bị hủy và không thể khôi phục. Chỉ thực hiện khi bác sĩ đã đổi chỉ định.</p>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Lý do hủy <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy hóa đơn..."
              rows={3}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300 resize-none"
            />
          </div>
        </div>
      </Modal>
      {/* ── Modal lập hóa đơn mới ─────────────────────────────────────────── */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => !isGenerating && setIsGenerateModalOpen(false)}
        title={
          <span className="flex items-center gap-2 text-blue-700">
            <Receipt className="w-5 h-5" />
            Lập Hóa Đơn Cho Lượt Khám
          </span>
        }
        subtitle="Chỉ hiển thị các lượt khám chưa lập hóa đơn hoặc chưa thanh toán viện phí."
        maxWidth="4xl"
        footer={
          <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-3">
            <div className="text-xs text-slate-500">
              {generateEncounterId ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Đã chọn: {recentEncounters.find((e) => e.encounterId === generateEncounterId)?.patient?.fullName || 'Bệnh nhân'} ({recentEncounters.find((e) => e.encounterId === generateEncounterId)?.encounterCode})
                </span>
              ) : (
                <span>Vui lòng chọn một ca khám chưa lập hóa đơn từ danh sách trên.</span>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                disabled={isGenerating}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleGenerateInvoice}
                disabled={!generateEncounterId.trim() || isGenerating}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                <span>{isGenerating ? 'Đang lập hóa đơn...' : 'Tạo Hóa Đơn & Thanh Toán'}</span>
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Lỗi nếu có */}
          {generateError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generateError}</span>
            </div>
          )}

          {/* Thanh tìm kiếm & Làm mới */}
          <div className="flex items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên bệnh nhân, mã lượt khám, mã bệnh nhân..."
                value={encounterSearch}
                onChange={(e) => setEncounterSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
              />
            </div>
            <button
              type="button"
              onClick={fetchRecentEncounters}
              disabled={isLoadingEncounters}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEncounters ? 'animate-spin text-blue-600' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Danh sách lượt khám (Chỉ hiện ca chưa tạo HĐ hoặc đang chờ thanh toán) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-600 text-[11px] grid grid-cols-12 gap-2">
              <div className="col-span-4">BỆNH NHÂN / MÃ CA</div>
              <div className="col-span-3">KHOA KHÁM / BÁC SĨ</div>
              <div className="col-span-2">TIẾP NHẬN</div>
              <div className="col-span-3 text-right">TRẠNG THÁI / THAO TÁC</div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {isLoadingEncounters ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs font-medium">Đang tải danh sách ca khám chưa thanh toán...</span>
                </div>
              ) : (() => {
                  const unpaidEncounters = recentEncounters.filter((enc) => {
                    const info = getEncounterBillingInfo(enc.encounterId);
                    return info.status === 'none' || info.status === 'pending';
                  });
                  const filtered = unpaidEncounters.filter((enc) => {
                    if (!encounterSearch.trim()) return true;
                    const q = encounterSearch.trim().toLowerCase();
                    return (
                      enc.encounterCode?.toLowerCase().includes(q) ||
                      enc.patient?.fullName?.toLowerCase().includes(q) ||
                      enc.patient?.patientCode?.toLowerCase().includes(q) ||
                      enc.department?.departmentName?.toLowerCase().includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400 text-xs space-y-1">
                        <p className="font-semibold text-slate-600">Không có ca khám nào cần lập hóa đơn</p>
                        <p className="text-[11px] text-slate-400">
                          Tất cả ca khám đã được thanh toán hoặc không khớp với từ khóa tìm kiếm.
                        </p>
                      </div>
                    );
                  }

                  return filtered.map((enc) => {
                    const isSelected = generateEncounterId === enc.encounterId;
                    const billingInfo = getEncounterBillingInfo(enc.encounterId);

                    return (
                      <div
                        key={enc.encounterId}
                        onClick={() => {
                          if (billingInfo.status === 'none') {
                            setGenerateEncounterId(enc.encounterId);
                          }
                        }}
                        className={`px-4 py-3 grid grid-cols-12 gap-2 items-center transition-colors ${
                          isSelected
                            ? 'bg-blue-50/90 border-l-4 border-blue-600'
                            : billingInfo.status === 'pending'
                            ? 'hover:bg-amber-50/40 bg-white'
                            : 'hover:bg-slate-50/80 bg-white cursor-pointer'
                        }`}
                      >
                        {/* Bệnh nhân */}
                        <div className="col-span-4 space-y-0.5">
                          <div className="font-bold text-slate-900 text-xs">
                            {enc.patient?.fullName || 'Bệnh nhân chưa có tên'}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                              {enc.encounterCode}
                            </span>
                            {enc.patient?.patientCode && (
                              <span>• Mã BN: {enc.patient.patientCode}</span>
                            )}
                          </div>
                        </div>

                        {/* Khoa khám / Bác sĩ */}
                        <div className="col-span-3 space-y-0.5 text-[11px]">
                          <div className="text-slate-800 font-medium truncate">
                            {enc.department?.departmentName || '---'}
                          </div>
                          <div className="text-slate-500 text-[10px] truncate">
                            {enc.doctor?.fullName ? `BS: ${enc.doctor.fullName}` : 'Chưa chỉ định BS'}
                          </div>
                        </div>

                        {/* Tiếp nhận */}
                        <div className="col-span-2 text-[11px] text-slate-500">
                          {fmtDate(enc.arrivedAt)}
                        </div>

                        {/* Trạng thái & Thao tác */}
                        <div className="col-span-3 flex items-center justify-end gap-2">
                          {billingInfo.status === 'pending' && billingInfo.invoice ? (
                            <>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                                Chờ thanh toán
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsGenerateModalOpen(false);
                                  openPaymentModal(billingInfo.invoice!);
                                }}
                                className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold border-none transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Thanh toán</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                                Chưa lập HĐ
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGenerateEncounterId(enc.encounterId);
                                }}
                                className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition-colors cursor-pointer shrink-0 ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                                }`}
                              >
                                {isSelected ? '✓ Đã chọn' : 'Chọn lập HĐ'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
            </div>
          </div>

          {/* Chi tiết ca được chọn & Ô giảm trừ */}
          {generateEncounterId && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Thông tin lượt khám được chọn để lập hóa đơn
                </span>
                <button
                  type="button"
                  onClick={() => setGenerateEncounterId('')}
                  className="text-[11px] text-slate-500 hover:text-red-600 font-semibold cursor-pointer bg-transparent border-none"
                >
                  Bỏ chọn
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">BỆNH NHÂN</p>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">
                    {recentEncounters.find((e) => e.encounterId === generateEncounterId)?.patient?.fullName || '---'}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">MÃ LƯỢT KHÁM</p>
                  <p className="font-bold font-mono text-indigo-700 text-xs mt-0.5">
                    {recentEncounters.find((e) => e.encounterId === generateEncounterId)?.encounterCode || '---'}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">GIẢM TRỪ CHI PHÍ (VNĐ - TÙY CHỌN)</p>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={generateDiscount}
                    onChange={(e) =>
                      setGenerateDiscount(
                        e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                      )
                    }
                    placeholder="0"
                    className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
