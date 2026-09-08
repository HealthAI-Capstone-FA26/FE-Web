import { apiFetch } from '../api';
import type { AppointmentItem } from '../appointment/appointment.service';

export type QueueTicketStatus = 'waiting' | 'called' | 'done' | 'skipped' | 'cancelled';

export interface QueueTicketItem {
  ticketId: string;
  appointmentId: string;
  departmentId: string;
  ticketPrefix: 'A' | 'B';
  ticketNumber: number;
  ticketDate: string;
  status: QueueTicketStatus;
  counterNumber?: string;
  calledAt?: string;
  issuedAt: string;
  department?: {
    departmentId: string;
    departmentName: string;
    code?: string;
    roomLocation?: string;
  };
  appointment?: AppointmentItem;
}

export interface FindQueueTicketsQuery {
  departmentId?: string;
  date?: string; // YYYY-MM-DD
  status?: string;
}

export interface CallTicketPayload {
  counterNumber: string;
}

export interface ServeTicketPayload {
  doctorId?: string;
}

export const queueTicketService = {
  // Lấy danh sách hàng đợi theo ngày, khoa, trạng thái (đã sort theo thứ tự ưu tiên)
  async getQueueTickets(query?: FindQueueTicketsQuery): Promise<QueueTicketItem[]> {
    const params = new URLSearchParams();
    if (query?.departmentId) params.append('departmentId', query.departmentId);
    if (query?.date) params.append('date', query.date);
    if (query?.status) params.append('status', query.status);

    const qs = params.toString();
    const url = `/queue-tickets${qs ? `?${qs}` : ''}`;
    return apiFetch<QueueTicketItem[]>(url, { method: 'GET' });
  },

  // Tiếp tân bấm gọi số đến quầy (chuyển sang 'called')
  async callTicket(ticketId: string, counterNumber: string): Promise<QueueTicketItem> {
    return apiFetch<QueueTicketItem>(`/queue-tickets/${ticketId}/call`, {
      method: 'PATCH',
      body: JSON.stringify({ counterNumber }),
    });
  },

  // Tiếp tân hoàn tất tiếp nhận (chuyển 'called' -> 'done', gán bác sĩ, sinh Encounter khám)
  async serveDoneTicket(
    ticketId: string,
    payload: ServeTicketPayload = {}
  ): Promise<{ queueTicket: QueueTicketItem; appointment: any; encounter: any }> {
    return apiFetch<{ queueTicket: QueueTicketItem; appointment: any; encounter: any }>(
      `/queue-tickets/${ticketId}/done`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
  },
};
