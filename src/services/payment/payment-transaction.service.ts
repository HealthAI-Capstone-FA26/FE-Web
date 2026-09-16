import { apiFetch } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GatewayTransaction {
  gatewayTransactionId: string;
  paymentId: string;
  provider: string;
  providerTransactionRef?: string;
  qrCodeData?: string | null;
  status: 'initiated' | 'success' | 'failed' | string;
  initiatedAt: string;
  completedAt?: string | null;
}

export interface PaymentTransaction {
  paymentId: string;
  invoiceId: string;
  paymentMethod: 'cash' | 'bank_transfer' | string;
  amount: number | string;
  status: 'pending' | 'success' | 'failed' | string;
  paidAt?: string | null;
  receivedByUserId?: string | null;
  createdAt: string;
  gatewayTransaction?: GatewayTransaction | null;
}

export interface CreateCashPayload {
  invoiceId: string;
  amount: number;
}

export interface ConfirmCashPayload {
  note?: string;
}

export interface CreateBankTransferPayload {
  invoiceId: string;
}

export interface BankTransferResult {
  paymentId: string;
  checkoutUrl: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const paymentTransactionService = {
  /**
   * POST /payments/cash
   * Ghi nhận thanh toán tiền mặt tại quầy (tạo giao dịch ở trạng thái 'pending').
   */
  async createCash(payload: CreateCashPayload): Promise<PaymentTransaction> {
    return apiFetch<PaymentTransaction>('/payments/cash', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * POST /payments/cash/:id/confirm
   * Lễ tân xác nhận đã thu tiền mặt → Invoice chuyển sang 'paid', mở khóa LabTask.
   */
  async confirmCash(
    paymentId: string,
    payload: ConfirmCashPayload = {}
  ): Promise<PaymentTransaction> {
    return apiFetch<PaymentTransaction>(`/payments/cash/${paymentId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * POST /payments/bank-transfer
   * Tạo link/QR PayOS. Backend tự tính số tiền còn thiếu.
   * Trả về { paymentId, checkoutUrl } để FE render QR từ checkoutUrl.
   */
  async createBankTransfer(payload: CreateBankTransferPayload): Promise<BankTransferResult> {
    return apiFetch<BankTransferResult>('/payments/bank-transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * GET /payments?invoiceId=...
   * Tra cứu lịch sử giao dịch thanh toán của một hóa đơn.
   */
  async findByInvoice(invoiceId: string): Promise<PaymentTransaction[]> {
    return apiFetch<PaymentTransaction[]>(`/payments?invoiceId=${invoiceId}`, {
      method: 'GET',
    });
  },

  /**
   * GET /payments/:id
   * Chi tiết một giao dịch thanh toán.
   */
  async getById(paymentId: string): Promise<PaymentTransaction> {
    return apiFetch<PaymentTransaction>(`/payments/${paymentId}`, {
      method: 'GET',
    });
  },
};
