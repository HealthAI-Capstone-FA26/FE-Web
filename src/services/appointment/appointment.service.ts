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

export interface GuestRequestOtpPayload {
  phoneNumber: string;
  email?: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  identityNumber: string;
  departmentId: string;
  doctorId: string;
  slotId: string;
  reasonForVisit?: string;
  priority?: 'normal' | 'urgent' | 'emergency';
  verifyMethod: 'email' | 'sms';
}

export interface GuestVerifyOtpPayload {
  phoneNumber: string;
  otp: string;
  email?: string;
}

export interface SyncPatientPayload {
  appointmentId: string;
  fullName: string;
  identityNumber: string;
  phoneNumber: string;
}

export interface ConfirmMainPatientPayload {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  identityNumber?: string;
  insuranceNumber?: string;
  phoneNumber?: string;
}

export interface PatientDetail {
  patientId: string;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  identityNumber: string;
  insuranceNumber?: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  status: 'draft' | 'main';
}

export interface AppointmentItem {
  appointmentId: string;
  appointmentCode: string;
  bookingChannel: 'online' | 'at_hospital';
  status: 'pending' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  patientId: string | null;
  suggestedPatientId?: string | null;
  suggestedReason?: string | null;
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
    insuranceNumber?: string;
    identityVerified?: boolean;
    identityVerifiedAt?: string;
    status?: 'draft' | 'main';
  };
  suggestedPatient?: {
    patientId: string;
    patientCode: string;
    fullName: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    identityNumber?: string;
    insuranceNumber?: string;
    identityVerified?: boolean;
    identityVerifiedAt?: string;
    status?: 'draft' | 'main';
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
  encounter?: {
    encounterId: string;
    encounterCode: string;
  };
  encounters?: Array<{
    encounterId: string;
    encounterCode: string;
  }>;
}

export interface FindAppointmentsQuery {
  patientId?: string;
  status?: string;
  from?: string;
  to?: string;
}

let cachedAppointmentsMap: Map<string, AppointmentItem[]> = new Map();

function getAppointmentQueryKey(query?: FindAppointmentsQuery): string {
  const params = new URLSearchParams();
  if (query?.patientId) params.append('patientId', query.patientId);
  if (query?.status) params.append('status', query.status);
  if (query?.from) params.append('from', query.from);
  if (query?.to) params.append('to', query.to);
  return params.toString();
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
    const res = await apiFetch<AppointmentItem>('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.invalidateCache();
    return res;
  },

  // Khách vãng lai (Guest) đặt lịch - Bước 1: Gửi thông tin + yêu cầu mã OTP
  async guestRequestOtp(payload: GuestRequestOtpPayload): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/appointments/guest/request-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Khách vãng lai (Guest) đặt lịch - Bước 2: Nhập OTP để xác nhận và hoàn tất đặt lịch
  async guestVerifyOtp(payload: GuestVerifyOtpPayload): Promise<AppointmentItem> {
    const res = await apiFetch<AppointmentItem>('/appointments/guest/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.invalidateCache();
    return res;
  },

  // Lấy dữ liệu cache đồng bộ nếu đã có
  getCachedAppointments(query?: FindAppointmentsQuery): AppointmentItem[] | null {
    const key = getAppointmentQueryKey(query);
    return cachedAppointmentsMap.get(key) || null;
  },

  invalidateCache() {
    cachedAppointmentsMap.clear();
  },

  // Lấy danh sách lịch hẹn (hỗ trợ Memory Cache + Background Refresh)
  async getAppointments(query?: FindAppointmentsQuery, forceRefresh = false): Promise<AppointmentItem[]> {
    const key = getAppointmentQueryKey(query);
    if (!forceRefresh && cachedAppointmentsMap.has(key)) {
      return cachedAppointmentsMap.get(key)!;
    }

    const queryParams = new URLSearchParams();
    if (query?.patientId) queryParams.append('patientId', query.patientId);
    if (query?.status) queryParams.append('status', query.status);
    if (query?.from) queryParams.append('from', query.from);
    if (query?.to) queryParams.append('to', query.to);

    const queryString = queryParams.toString();
    const url = `/appointments${queryString ? `?${queryString}` : ''}`;
    const data = await apiFetch<AppointmentItem[]>(url, {
      method: 'GET',
    });
    cachedAppointmentsMap.set(key, data);
    return data;
  },

  // Xem chi tiết 1 lịch hẹn
  async getAppointmentById(id: string): Promise<AppointmentItem> {
    return apiFetch<AppointmentItem>(`/appointments/${id}`, {
      method: 'GET',
    });
  },

  // Bệnh nhân hoặc lễ tân hủy lịch hẹn (pending / confirmed)
  async cancelAppointment(id: string, cancelReason?: string): Promise<AppointmentItem> {
    const res = await apiFetch<AppointmentItem>(`/appointments/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ cancelReason: cancelReason || 'Bệnh nhân chủ động hủy lịch qua hệ thống' }),
    });
    this.invalidateCache();
    return res;
  },

  // Lễ tân xác nhận lịch hẹn (pending -> confirmed)
  async confirmAppointment(id: string): Promise<AppointmentItem> {
    const res = await apiFetch<AppointmentItem>(`/appointments/${id}/confirm`, {
      method: 'PATCH',
    });
    this.invalidateCache();
    return res;
  },

  // Lễ tân tiếp nhận / check-in bệnh nhân (confirmed -> checked_in, tự động phát số thứ tự QueueTicket)
  async checkInAppointment(id: string): Promise<{ appointment: AppointmentItem; queueTicket: any }> {
    const res = await apiFetch<{ appointment: AppointmentItem; queueTicket: any }>(`/appointments/${id}/check-in`, {
      method: 'PATCH',
    });
    this.invalidateCache();
    return res;
  },

  // Đánh dấu bệnh nhân vắng mặt / không đến (-> no_show)
  async markNoShowAppointment(id: string): Promise<AppointmentItem> {
    const res = await apiFetch<AppointmentItem>(`/appointments/${id}/no-show`, {
      method: 'PATCH',
    });
    this.invalidateCache();
    return res;
  },

  // Lễ tân tạo lịch khám trực tiếp tại quầy (bookingChannel = at_hospital)
  async createAtHospitalAppointment(payload: {
    patientId?: string;
    departmentId: string;
    reasonForVisit?: string;
    priority?: 'normal' | 'urgent' | 'emergency';
  }): Promise<{ appointment: AppointmentItem; queueTicket: any }> {
    const res = await apiFetch<{ appointment: AppointmentItem; queueTicket: any }>('/appointments/at-hospital', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.invalidateCache();
    return res;
  },

  // Lễ tân đối chiếu CCCD cho case "matched" (appointment có suggestedPatientId, patientId=null)
  async syncPatient(payload: SyncPatientPayload): Promise<AppointmentItem> {
    const res = await apiFetch<AppointmentItem>('/appointments/sync-patient', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.invalidateCache();
    return res;
  },

  // Lễ tân xác nhận danh tính bệnh nhân (draft -> main)
  async confirmMainPatient(patientId: string, payload: ConfirmMainPatientPayload): Promise<PatientDetail> {
    const res = await apiFetch<PatientDetail>(`/patients/${patientId}/confirm-main`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    this.invalidateCache();
    return res;
  },

  // Lấy chi tiết hồ sơ bệnh nhân theo ID (dùng để xem thông tin gợi ý hoặc hồ sơ draft)
  async getPatientById(patientId: string): Promise<PatientDetail> {
    return apiFetch<PatientDetail>(`/patients/${patientId}`);
  },
};

