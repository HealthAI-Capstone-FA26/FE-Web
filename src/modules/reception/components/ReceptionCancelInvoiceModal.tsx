import React, { useState } from 'react';
import { XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { invoiceService, type InvoiceData } from '../../../services/payment/invoice.service';

interface ReceptionCancelInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
  onCancelSuccess: () => void;
}

export const ReceptionCancelInvoiceModal: React.FC<ReceptionCancelInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onCancelSuccess,
}) => {
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (isCancelling) return;
    setCancelReason('');
    setError(null);
    onClose();
  };

  const handleCancelInvoice = async () => {
    if (!invoice) return;
    const reason = cancelReason.trim();
    if (!reason) {
      setError('Vui lòng nhập lý do hủy hóa đơn.');
      return;
    }

    setIsCancelling(true);
    setError(null);
    try {
      await invoiceService.cancel(invoice.invoiceId, { cancelReason: reason });
      setCancelReason('');
      onCancelSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể hủy hóa đơn.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!invoice) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <span className="flex items-center gap-2 text-red-600">
          <XCircle className="w-5 h-5" />
          Xác nhận hủy hóa đơn
        </span>
      }
      maxWidth="sm"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <button
            type="button"
            onClick={handleClose}
            disabled={isCancelling}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none transition-colors"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={handleCancelInvoice}
            disabled={!cancelReason.trim() || isCancelling}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
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
          <p>
            Hóa đơn <strong>{invoice.invoiceCode}</strong> sẽ bị hủy và không thể khôi phục. Chỉ thực hiện khi bác sĩ đã thay đổi hoặc hủy chỉ định.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
  );
};
