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

export interface InvoicePatientData {
  patientId: string;
  patientCode: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  identityNumber?: string;
  insuranceNumber?: string;
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
  patient?: InvoicePatientData;
  encounter?: {
    encounterId: string;
    encounterCode: string;
  };
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

export type LabWorkflowPaymentState = 'ordered' | 'paid' | 'completed';

/**
 * Kiểm tra danh sách hóa đơn của 1 encounter có hóa đơn phí xét nghiệm/CLS đã thanh toán hay chưa
 * (loại trừ hóa đơn phí khám consultation riêng lẻ).
 */
export function hasPaidLabInvoice(invoices: InvoiceData[]): boolean {
  return invoices.some(
    (inv) =>
      inv.status === 'paid' &&
      (inv.invoiceType === 'diagnostics' ||
        inv.invoiceType === 'tests' ||
        inv.invoiceType === 'combined' ||
        inv.items?.some((item) => item.itemType === 'tests' || item.itemType === 'diagnostics'))
  );
}

/**
 * Xác định trạng thái đóng phí & thực hiện xét nghiệm của một encounter
 * dựa trên chỉ định CLS và hóa đơn phí xét nghiệm riêng của encounter đó.
 */
export function resolveEncounterLabPaymentState(
  orders: Array<{
    items?: Array<{
      status?: string;
      task?: { status?: string; paymentVerified?: boolean } | null;
      labTask?: { status?: string; paymentVerified?: boolean } | null;
    }>;
  }>,
  invoices: InvoiceData[]
): LabWorkflowPaymentState | null {
  const activeItems = orders
    .flatMap((o) => o.items || [])
    .filter((i) => i.status !== 'cancelled');

  if (activeItems.length === 0) return null;

  const allCompleted = activeItems.every(
    (i) => (i.task?.status || i.labTask?.status) === 'completed'
  );
  if (allCompleted) return 'completed';

  const isPaid =
    hasPaidLabInvoice(invoices) ||
    activeItems.some((i) => {
      const task = i.task || i.labTask;
      return (
        task?.paymentVerified === true ||
        task?.status === 'ready' ||
        task?.status === 'sample_collected' ||
        task?.status === 'in_progress' ||
        task?.status === 'completed'
      );
    });

  return isPaid ? 'paid' : 'ordered';
}
