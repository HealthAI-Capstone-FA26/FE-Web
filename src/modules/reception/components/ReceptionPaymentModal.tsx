import React, { useState, useEffect } from 'react';
import {
  CreditCard, QrCode, CheckCircle2,
  Banknote, XCircle, AlertCircle,
  Loader2, ChevronRight, Receipt
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../../../components/common/Modal';
import { type InvoiceData } from '../../../services/payment/invoice.service';
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

  // Reset state khi mở modal với invoice mới
  useEffect(() => {
    if (isOpen && invoice) {
      if (invoice.status === 'paid') {
        setPaymentStep('success');
      } else {
        setPaymentStep('select_method');
        setPaymentMethod('cash');
        setCashPayment(null);
        setBankTransferResult(null);
        setActionError(null);
      }
    }
  }, [isOpen, invoice]);

  // Polling trạng thái thanh toán QR PayOS (mỗi 5 giây)
  useEffect(() => {
    if (paymentStep !== 'qr_waiting' || !bankTransferResult || !invoice) return;

    const intervalId = setInterval(async () => {
      try {
        const payment = await paymentTransactionService.getById(bankTransferResult.paymentId);
        if (payment.status === 'success') {
          clearInterval(intervalId);
          setPaymentStep('success');
          onPaymentSuccess();
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra trạng thái thanh toán:', err);
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
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

  // Thông tin thanh toán thành công
  const successfulPayment = invoice.payments?.find((p) => p.status === 'success') || cashPayment;
  const paymentMethodLabel =
    successfulPayment?.paymentMethod === 'bank_transfer'
      ? 'Chuyển khoản VietQR (PayOS)'
      : successfulPayment?.paymentMethod === 'cash'
      ? 'Tiền mặt tại quầy'
      : paymentMethod === 'bank_transfer'
      ? 'Chuyển khoản VietQR (PayOS)'
      : 'Tiền mặt tại quầy';

  const paidTime = successfulPayment?.paidAt || invoice.issuedAt || invoice.createdAt;

  // ── Render Footer ──────────────────────────────────────────────────────────
  const renderFooter = () => {
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
        <div className="flex w-full justify-end items-center">
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

    if (paymentStep === 'success') {
      return (
        <div className="flex w-full justify-end items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none transition-colors shadow-xs"
          >
            Đóng
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
            Chi Tiết Hóa Đơn: {invoice.invoiceCode}
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
                value={bankTransferResult.qrCode || bankTransferResult.checkoutUrl}
                size={220}
                level="M"
                includeMargin
              />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800">{fmtVND(total)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Người bệnh mở app ngân hàng bất kỳ để quét mã thanh toán VietQR
              </p>
            </div>

            {/* Thông tin tài khoản nhận chuyển khoản */}
            {(bankTransferResult.accountNumber || bankTransferResult.accountName || bankTransferResult.description) && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left text-xs space-y-2 max-w-sm mx-auto text-slate-600">
                {bankTransferResult.accountName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <span className="font-bold text-slate-800 uppercase">{bankTransferResult.accountName}</span>
                  </div>
                )}
                {bankTransferResult.accountNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <span className="font-bold font-mono text-blue-700 text-sm select-all">{bankTransferResult.accountNumber}</span>
                  </div>
                )}
                {bankTransferResult.description && (
                  <div className="flex justify-between items-center gap-3 pt-1.5 border-t border-slate-200">
                    <span className="text-slate-500 shrink-0">Nội dung CK:</span>
                    <span
                      className="font-bold font-mono text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded select-all text-[11px] truncate"
                      title={bankTransferResult.description}
                    >
                      {bankTransferResult.description}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-blue-700 bg-blue-50 py-2.5 px-3 rounded-xl border border-blue-100 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              <span>Hệ thống tự động xác nhận sau khi chuyển khoản thành công...</span>
            </div>
          </div>
        )}

        {/* ── Bước: Thành công / Chi tiết hoá đơn đã thanh toán ───────────── */}
        {paymentStep === 'success' && (
          <div className="space-y-3.5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">Đã thanh toán thành công</h3>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Hóa đơn <strong className="font-mono">{invoice.invoiceCode}</strong> đã được tất toán
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-600 text-white rounded-lg">
                Đã thu tiền
              </span>
            </div>

            {/* Chi tiết dịch vụ chỉ định */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <p className="font-extrabold text-slate-700 mb-2 flex items-center gap-1.5 text-xs">
                <Receipt className="w-4 h-4 text-blue-600" />
                Dịch vụ chỉ định ({invoice.items?.length || 0} mục)
              </p>
              <ul className="divide-y divide-slate-200 max-h-48 overflow-y-auto pr-1 text-xs">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item) => (
                    <li key={item.invoiceItemId} className="py-2 flex justify-between items-start gap-4">
                      <div>
                        <p className="font-semibold text-slate-800">{item.description}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Số lượng: {item.quantity} × {fmtVND(item.unitPrice || item.amount)}
                        </p>
                      </div>
                      <span className="font-bold text-slate-800 whitespace-nowrap pt-0.5">
                        {fmtVND(item.amount)}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="py-2 text-slate-400 italic">Không có chi tiết dịch vụ</li>
                )}
              </ul>

              <div className="mt-2.5 pt-2.5 border-t border-slate-300 space-y-1.5 text-xs">
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
                <div className="flex justify-between font-black text-sm text-emerald-800 pt-1">
                  <span>Tổng tiền đã thanh toán</span>
                  <span className="text-base">{fmtVND(total)}</span>
                </div>
              </div>
            </div>

            {/* Thông tin giao dịch */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px]">Hình thức thanh toán</span>
                <p className="font-bold text-slate-700 mt-0.5">{paymentMethodLabel}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Thời gian thanh toán</span>
                <p className="font-bold text-slate-700 mt-0.5">{fmtDate(paidTime)}</p>
              </div>
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
