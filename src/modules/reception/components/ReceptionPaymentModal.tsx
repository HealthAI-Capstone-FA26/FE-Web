import React, { useState, useEffect } from 'react';
import {
  CreditCard, QrCode, CheckCircle2, Download, Printer,
  RefreshCw, Banknote, XCircle, AlertCircle,
  Clock, Loader2, ChevronRight, Receipt
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../../../components/common/Modal';
import { invoiceService, type InvoiceData } from '../../../services/payment/invoice.service';
import {
  paymentTransactionService,
  type PaymentTransaction,
  type BankTransferResult,
} from '../../../services/payment/payment-transaction.service';

const fmtVND = (amount: number | string) =>
  Number(amount).toLocaleString('vi-VN') + ' ₫';

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

type PaymentStep = 'idle' | 'select_method' | 'cash_confirm' | 'qr_waiting' | 'success';
type PaymentMethod = 'cash' | 'bank_transfer';

interface ReceptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
  onPaymentSuccess: () => void;
  onCancelInvoice?: (invoice: InvoiceData) => void;
}

export const ReceptionPaymentModal: React.FC<ReceptionPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
  onCancelInvoice,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('select_method');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Tiền mặt
  const [cashPayment, setCashPayment] = useState<PaymentTransaction | null>(null);

  // QR PayOS
  const [bankTransferResult, setBankTransferResult] = useState<BankTransferResult | null>(null);
  const [isPollingStatus, setIsPollingStatus] = useState(false);

  // PDF
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  // Reset state khi mở modal với invoice mới
  useEffect(() => {
    if (isOpen && invoice) {
      if (invoice.status === 'paid') {
        setPaymentStep('success');
        loadPdf(invoice.invoiceId);
      } else {
        setPaymentStep('select_method');
        setPaymentMethod('cash');
        setCashPayment(null);
        setBankTransferResult(null);
        setPdfUrl(null);
        setActionError(null);
      }
    }
  }, [isOpen, invoice]);

  // Load URL file PDF phiếu thu
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

  // Polling trạng thái thanh toán QR PayOS (mỗi 5 giây)
  useEffect(() => {
    if (paymentStep !== 'qr_waiting' || !bankTransferResult || !invoice) return;

    setIsPollingStatus(true);
    const intervalId = setInterval(async () => {
      try {
        const payment = await paymentTransactionService.getById(bankTransferResult.paymentId);
        if (payment.status === 'success') {
          clearInterval(intervalId);
          setIsPollingStatus(false);
          setPaymentStep('success');
          onPaymentSuccess();
          loadPdf(invoice.invoiceId);
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra trạng thái thanh toán:', err);
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
      setIsPollingStatus(false);
    };
  }, [paymentStep, bankTransferResult, invoice, onPaymentSuccess]);

  // Bước 1: Tạo giao dịch tiền mặt
  const handleCreateCashPayment = async () => {
    if (!invoice) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      const payment = await paymentTransactionService.createCash({
        invoiceId: invoice.invoiceId,
        amount: Number(invoice.totalAmount),
      });
      setCashPayment(payment);
      setPaymentStep('cash_confirm');
    } catch (err: any) {
      setActionError(err?.message || 'Không thể tạo giao dịch tiền mặt.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bước 2: Tiếp tân xác nhận đã thu tiền mặt
  const handleConfirmCash = async () => {
    if (!cashPayment || !invoice) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await paymentTransactionService.confirmCash(cashPayment.paymentId);
      setPaymentStep('success');
      onPaymentSuccess();
      loadPdf(invoice.invoiceId);
    } catch (err: any) {
      setActionError(err?.message || 'Không thể xác nhận thanh toán.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Tạo link QR chuyển khoản PayOS
  const handleCreateBankTransfer = async () => {
    if (!invoice) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      const result = await paymentTransactionService.createBankTransfer({
        invoiceId: invoice.invoiceId,
      });
      setBankTransferResult(result);
      setPaymentStep('qr_waiting');
    } catch (err: any) {
      setActionError(err?.message || 'Không thể tạo mã QR chuyển khoản.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!invoice) return null;

  const total = Number(invoice.totalAmount);
  const discount = Number(invoice.discountAmount ?? 0);
  const subtotal = Number(invoice.subtotalAmount ?? total);

  // ── Render Footer ──────────────────────────────────────────────────────────
  const renderFooter = () => {
    if (paymentStep === 'success') {
      return (
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer border-none transition-colors"
        >
          Đóng
        </button>
      );
    }

    if (paymentStep === 'select_method') {
      return (
        <div className="flex gap-2 w-full">
          {onCancelInvoice && invoice.status === 'pending' && (
            <button
              type="button"
              onClick={() => onCancelInvoice(invoice)}
              className="px-3 py-2 bg-white text-red-600 border border-red-200 font-bold text-xs rounded-xl cursor-pointer hover:bg-red-50 flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Hủy hóa đơn</span>
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={paymentMethod === 'cash' ? handleCreateCashPayment : handleCreateBankTransfer}
            disabled={isProcessing}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none flex items-center gap-1.5 disabled:opacity-60 transition-colors shadow-xs"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span>
              {paymentMethod === 'cash' ? 'Thu tiền mặt' : 'Tạo mã QR thanh toán'}
            </span>
          </button>
        </div>
      );
    }

    if (paymentStep === 'cash_confirm') {
      return (
        <div className="flex gap-2 w-full justify-end">
          <button
            type="button"
            onClick={() => setPaymentStep('select_method')}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none transition-colors"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={handleConfirmCash}
            disabled={isProcessing}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none flex items-center gap-1.5 disabled:opacity-60 transition-colors shadow-xs"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Xác nhận đã nhận {fmtVND(total)}</span>
          </button>
        </div>
      );
    }

    if (paymentStep === 'qr_waiting') {
      return (
        <div className="flex gap-2 w-full justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {isPollingStatus && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Đang đợi người bệnh quét mã...</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPaymentStep('select_method')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none transition-colors"
          >
            Đổi phương thức
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={paymentStep === 'qr_waiting' ? () => {} : onClose}
      title={
        paymentStep === 'success' ? (
          <span className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            Thanh Toán Thành Công
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Xử Lý Hóa Đơn: {invoice.invoiceCode}
          </span>
        )
      }
      subtitle={
        paymentStep !== 'success'
          ? `Tổng thanh toán: ${fmtVND(total)}`
          : undefined
      }
      footer={renderFooter()}
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* ── Bước: Chọn phương thức ────────────────────────────────────── */}
        {paymentStep === 'select_method' && (
          <div className="space-y-4">
            {/* Chi tiết dịch vụ */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="font-extrabold text-slate-700 mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                Chi tiết dịch vụ chỉ định
              </p>
              <ul className="divide-y divide-slate-200 max-h-48 overflow-y-auto">
                {invoice.items?.map((item) => (
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
                    <span>Giảm trừ (BHYT / voucher)</span>
                    <span>- {fmtVND(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base text-emerald-800 pt-1">
                  <span>Tổng thanh toán</span>
                  <span>{fmtVND(total)}</span>
                </div>
              </div>
            </div>

            {/* Chọn phương thức thanh toán */}
            <div className="space-y-2">
              <p className="font-extrabold text-slate-800">Phương thức thanh toán</p>
              <div className="grid grid-cols-2 gap-3">
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
                  <p className="text-slate-400 text-[11px] mt-0.5">Thu trực tiếp tại quầy</p>
                </button>

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
                  <p className="text-slate-400 text-[11px] mt-0.5">Quét bằng ứng dụng ngân hàng</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Bước: Xác nhận tiền mặt ───────────────────────────────────── */}
        {paymentStep === 'cash_confirm' && cashPayment && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
              <Banknote className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-xs text-emerald-700 font-semibold">Giao dịch tiền mặt đã được khởi tạo</p>
              <p className="text-2xl font-black text-emerald-800">{fmtVND(total)}</p>
              <p className="text-[11px] text-slate-500">
                Mã giao dịch: <code className="font-mono">{cashPayment.paymentId.slice(0, 8)}...</code>
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800">
              <p className="font-bold mb-1">Xác nhận của thu ngân:</p>
              <p>Vui lòng đếm đủ tiền mặt trước khi nhấn <strong>"Xác nhận đã nhận"</strong>.</p>
            </div>
          </div>
        )}

        {/* ── Bước: Quét mã QR PayOS ────────────────────────────────────── */}
        {paymentStep === 'qr_waiting' && bankTransferResult && (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs inline-block mx-auto">
              <QRCodeSVG
                value={bankTransferResult.checkoutUrl}
                size={220}
                level="M"
                includeMargin
              />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800">{fmtVND(total)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Người bệnh mở app ngân hàng bất kỳ để quét mã thanh toán
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-blue-600 bg-blue-50 py-2 rounded-xl border border-blue-100">
              <Clock className="w-4 h-4 animate-spin text-blue-500" />
              <span>Hệ thống tự động xác nhận sau khi chuyển khoản thành công...</span>
            </div>
          </div>
        )}

        {/* ── Bước: Thành công ──────────────────────────────────────────── */}
        {paymentStep === 'success' && (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Thanh toán hoàn tất!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Hóa đơn <strong>{invoice.invoiceCode}</strong> đã được ghi nhận thanh toán.
              </p>
            </div>

            {/* Chi tiết giao dịch */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Số tiền đã thu:</span>
                <span className="font-bold text-emerald-700">{fmtVND(total)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Thời gian:</span>
                <span>{fmtDate(new Date().toISOString())}</span>
              </div>
            </div>

            {/* Các nút in & tải PDF */}
            <div className="pt-2 flex justify-center gap-3">
              {isLoadingPdf ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tạo file PDF hóa đơn...</span>
                </div>
              ) : pdfUrl ? (
                <>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 no-underline transition-colors shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Xem & In PDF</span>
                  </a>
                  <a
                    href={pdfUrl}
                    download
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 no-underline transition-colors shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải File PDF</span>
                  </a>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => loadPdf(invoice.invoiceId)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Tải lại PDF</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hiển thị lỗi nếu có */}
        {actionError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
