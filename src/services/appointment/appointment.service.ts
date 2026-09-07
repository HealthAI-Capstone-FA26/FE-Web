import { apiFetch } from '../api';

export interface AppointmentSlotResponse {
  slotId: string;
  scheduleId: string;
  slotStartTime: string;
  slotEndTime: string;
  capacity: number;
  bookedCount: number;
  status: 'free' | 'booked' | 'blocked';
  schedule?: {
    scheduleId: string;
    doctorId: string;
    departmentId: string;
    workDate: string;
    shiftType: string;
    roomNumber?: string;
    department?: {
      departmentId: string;
      departmentName: string;
      code: string;
    };
  };
}

export interface CreateOnlineAppointmentPayload {
  patientId: string;
  relationship: string;
  departmentId: string;
  doctorId: string;
  slotId: string;
  reasonForVisit?: string;
  priority?: 'normal' | 'urgent' | 'emergency';
}

export interface AppointmentItem {
  appointmentId: string;
  appointmentCode: string;
  bookingChannel: 'online' | 'at_hospital';
  status: 'pending' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  patientId: string;
  doctorId: string;
  departmentId: string;
  slotId?: string;
  bookedByUserId?: string;
  appointmentDate: string;
  appointmentTime: string;
  reasonForVisit?: string;
  priority: string;
  cancelReason?: string;
  cancelledAt?: string;
  createdAt: string;
  patient?: {
    patientId: string;
    patientCode: string;
    fullName: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    identityNumber?: string;
  };
  doctor?: {
    doctorId: string;
    doctorCode?: string;
    fullName: string;
    title?: string;
    specialization?: string;
    position?: string;
    academicRank?: string;
    degree?: string;
    user?: {
      fullName: string;
      email?: string;
      phoneNumber?: string;
      avatarUrl?: string;
    };
  };
  department?: {
    departmentId: string;
    departmentCode?: string;
    departmentName: string;
    roomLocation?: string;
    description?: string;
    code?: string;
    location?: string;
  };
  slot?: {
    slotId: string;
    slotStartTime: string;
    slotEndTime: string;
  };
  queueTicket?: {
    ticketId: string;
    ticketNumber: string;
    ticketPrefix: string;
    queueStatus: string;
    issuedAt?: string;
    calledAt?: string;
  };
}

export interface FindAppointmentsQuery {
  patientId?: string;
  status?: string;
  from?: string;
  to?: string;
}

export const appointmentService = {
  // Lấy danh sách Slot còn trống (status=free) của 1 bác sĩ theo ngày (YYYY-MM-DD)
  async getFreeSlots(doctorId: string, date: string): Promise<AppointmentSlotResponse[]> {
    return apiFetch<AppointmentSlotResponse[]>(`/doctors/${doctorId}/slots?date=${encodeURIComponent(date)}`, {
      method: 'GET',
    });
  },

  // Đặt lịch khám online
  async createOnlineAppointment(payload: CreateOnlineAppointmentPayload): Promise<AppointmentItem> {
    return apiFetch<AppointmentItem>('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Lấy danh sách lịch hẹn
  async getAppointments(query?: FindAppointmentsQuery): Promise<AppointmentItem[]> {
    const queryParams = new URLSearchParams();
    if (query?.patientId) queryParams.append('patientId', query.patientId);
    if (query?.status) queryParams.append('status', query.status);
    if (query?.from) queryParams.append('from', query.from);
    if (query?.to) queryParams.append('to', query.to);

    const queryString = queryParams.toString();
    const url = `/appointments${queryString ? `?${queryString}` : ''}`;
    return apiFetch<AppointmentItem[]>(url, {
      method: 'GET',
    });
  },

  // Xem chi tiết 1 lịch hẹn
  async getAppointmentById(id: string): Promise<AppointmentItem> {
    return apiFetch<AppointmentItem>(`/appointments/${id}`, {
      method: 'GET',
    });
  },

  // Bệnh nhân hoặc lễ tân hủy lịch hẹn (pending / confirmed)
  async cancelAppointment(id: string, cancelReason?: string): Promise<AppointmentItem> {
    return apiFetch<AppointmentItem>(`/appointments/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ cancelReason: cancelReason || 'Bệnh nhân chủ động hủy lịch qua hệ thống' }),
    });
  },

  // Lễ tân xác nhận lịch hẹn (pending -> confirmed)
  async confirmAppointment(id: string): Promise<AppointmentItem> {
    return apiFetch<AppointmentItem>(`/appointments/${id}/confirm`, {
      method: 'PATCH',
    });
  },

  // Lễ tân tiếp nhận / check-in bệnh nhân (confirmed -> checked_in, tự động phát số thứ tự QueueTicket)
  async checkInAppointment(id: string): Promise<{ appointment: AppointmentItem; queueTicket: any }> {
    return apiFetch<{ appointment: AppointmentItem; queueTicket: any }>(`/appointments/${id}/check-in`, {
      method: 'PATCH',
    });
  },

  // Đánh dấu bệnh nhân vắng mặt / không đến (-> no_show)
  async markNoShowAppointment(id: string): Promise<AppointmentItem> {
    return apiFetch<AppointmentItem>(`/appointments/${id}/no-show`, {
      method: 'PATCH',
    });
  },

  // Lễ tân tạo lịch khám trực tiếp tại quầy (bookingChannel = at_hospital)
  async createAtHospitalAppointment(payload: {
    patientId?: string;
    departmentId: string;
    reasonForVisit?: string;
    priority?: 'normal' | 'urgent' | 'emergency';
  }): Promise<{ appointment: AppointmentItem; queueTicket: any }> {
    return apiFetch<{ appointment: AppointmentItem; queueTicket: any }>('/appointments/at-hospital', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
