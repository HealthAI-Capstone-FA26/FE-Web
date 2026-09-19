import { apiFetch } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceItemData {
  invoiceItemId: string;
  invoiceId: string;
  itemType: 'consultation' | 'tests' | string;
  sourceId: string;
  description: string;
  quantity: number;
  unitPrice: number | string;
  amount: number | string;
}

export interface PaymentData {
  paymentId: string;
  invoiceId: string;
  paymentMethod: 'cash' | 'bank_transfer' | string;
  amount: number | string;
  status: 'pending' | 'success' | 'failed' | string;
  paidAt?: string | null;
  createdAt: string;
}

export interface InvoiceData {
  invoiceId: string;
  invoiceCode: string;
  encounterId?: string | null;    // nullable: invoice phí khám được tạo trước khi có Encounter
  appointmentId?: string | null;  // có giá trị khi là invoice phí khám (consultation)
  patientId: string;
  invoiceType: 'consultation' | 'tests' | 'combined' | string;
  subtotalAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded' | string;
  pdfFileUrl?: string | null;
  issuedAt: string;
  createdAt: string;
  items: InvoiceItemData[];
  payments: PaymentData[];
}

export interface GenerateInvoicePayload {
  /** Dùng để tạo invoice phí khám (consultation) TRƯỚC khi có Encounter */
  appointmentId?: string;
  /** Dùng để tạo invoice xét nghiệm (tests) sau khi đã có Encounter */
  encounterId?: string;
  discountAmount?: number;
}

export interface ListInvoicesQuery {
  appointmentId?: string;
  patientId?: string;
  encounterId?: string;
  status?: 'pending' | 'paid' | 'cancelled' | 'refunded';
}

export interface CancelInvoicePayload {
  cancelReason: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const invoiceService = {
  /**
   * POST /invoices/generate
   * Tự động tính chi phí khám + xét nghiệm, sinh hóa đơn mới.
   */
  async generate(payload: GenerateInvoicePayload): Promise<InvoiceData> {
    return apiFetch<InvoiceData>('/invoices/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * GET /invoices
   * Danh sách hóa đơn, lọc theo patientId / encounterId / status.
   */
  async findMany(query?: ListInvoicesQuery): Promise<InvoiceData[]> {
    const params = new URLSearchParams();
    if (query?.appointmentId) params.append('appointmentId', query.appointmentId);
    if (query?.patientId) params.append('patientId', query.patientId);
    if (query?.encounterId) params.append('encounterId', query.encounterId);
    if (query?.status) params.append('status', query.status);
    const qs = params.toString();
    return apiFetch<InvoiceData[]>(`/invoices${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * GET /invoices/:id
   * Chi tiết hóa đơn (items + payments).
   */
  async findById(invoiceId: string): Promise<InvoiceData> {
    return apiFetch<InvoiceData>(`/invoices/${invoiceId}`, { method: 'GET' });
  },

  /**
   * GET /invoices/:id/pdf
   * Lấy (hoặc tạo) URL PDF của hóa đơn.
   */
  async getPdfUrl(invoiceId: string): Promise<{ url: string }> {
    return apiFetch<{ url: string }>(`/invoices/${invoiceId}/pdf`, {
      method: 'GET',
    });
  },

  /**
   * POST /invoices/:id/cancel
   * Hủy hóa đơn (chỉ khi status='pending').
   */
  async cancel(invoiceId: string, payload: CancelInvoicePayload): Promise<InvoiceData> {
    return apiFetch<InvoiceData>(`/invoices/${invoiceId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
