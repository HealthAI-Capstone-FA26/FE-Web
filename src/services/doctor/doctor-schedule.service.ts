import { apiFetch } from '../api';

export type ScheduleSession = 'morning' | 'afternoon' | 'evening';
export type ScheduleStatus = 'active' | 'cancelled';
export type SlotStatus = 'free' | 'booked' | 'blocked' | 'expired';

export const SESSION_CONFIG: Record<
  ScheduleSession,
  { label: string; defaultStart: string; defaultEnd: string }
> = {
  morning: { label: 'Ca Sáng', defaultStart: '07:30', defaultEnd: '11:30' },
  afternoon: { label: 'Ca Chiều', defaultStart: '13:00', defaultEnd: '17:00' },
  evening: { label: 'Ca Tối', defaultStart: '17:30', defaultEnd: '20:30' },
};

export interface SlotAppointmentInfo {
  appointmentId: string;
  appointmentCode: string;
  bookingChannel: string;
  status: string;
  reasonForVisit?: string | null;
  priority?: string;
  appointmentDate: string;
  patient?: {
    patientId: string;
    patientCode?: string;
    fullName: string;
    phoneNumber?: string;
    gender?: string;
    dateOfBirth?: string;
    identityNumber?: string;
    status?: string;
  } | null;
  suggestedPatient?: {
    patientId: string;
    patientCode?: string;
    fullName: string;
    phoneNumber?: string;
    gender?: string;
    dateOfBirth?: string;
    identityNumber?: string;
  } | null;
}

export interface AppointmentSlotResponse {
  slotId: string;
  scheduleId: string;
  slotStartTime: string;
  slotEndTime: string;
  capacity: number;
  bookedCount: number;
  status: string; // 'free' | 'full' | 'booked' | 'blocked'
  createdAt?: string;
  updatedAt?: string;
  appointments?: SlotAppointmentInfo[];
}

export interface DoctorScheduleResponse {
  scheduleId: string;
  doctorId: string;
  departmentId: string;
  workDate: string; // ISO string YYYY-MM-DD
  session: ScheduleSession;
  startTime: string;
  endTime: string;
  slotDurationMins: number;
  maxPatientsPerSlot: number;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
  department?: {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    roomLocation?: string;
  };
  appointmentSlots?: AppointmentSlotResponse[];
}

export interface SearchDoctorScheduleQuery {
  doctorId?: string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

export interface CreateDoctorScheduleData {
  doctorId: string;
  departmentId?: string;
  workDate: string; // YYYY-MM-DD
  session: ScheduleSession;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  slotDurationMins?: number;
  maxPatientsPerSlot?: number;
}

export interface CancelScheduleResult {
  schedule: DoctorScheduleResponse;
  blockedFreeSlots: number;
  impactedBookedSlots: number;
  reason?: string;
}

export const doctorScheduleService = {
  // GET /doctor-schedules — Danh sách lịch làm việc theo bác sĩ / khoảng ngày
  async getSchedules(query?: SearchDoctorScheduleQuery): Promise<DoctorScheduleResponse[]> {
    const params = new URLSearchParams();
    if (query?.doctorId) params.append('doctorId', query.doctorId);
    if (query?.from) params.append('from', query.from);
    if (query?.to) params.append('to', query.to);

    const queryString = params.toString();
    const url = `/doctor-schedules${queryString ? `?${queryString}` : ''}`;
    return apiFetch<DoctorScheduleResponse[]>(url, { method: 'GET' });
  },

  // GET /doctor-schedules/:id — Chi tiết 1 lịch làm việc kèm tất cả slot
  async getScheduleById(id: string): Promise<DoctorScheduleResponse> {
    return apiFetch<DoctorScheduleResponse>(`/doctor-schedules/${id}`, { method: 'GET' });
  },

  // POST /doctor-schedules — Tạo ca làm việc thủ công, tự sinh slot
  async createSchedule(data: CreateDoctorScheduleData): Promise<{ schedule: DoctorScheduleResponse; slotCount: number }> {
    return apiFetch<{ schedule: DoctorScheduleResponse; slotCount: number }>('/doctor-schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PATCH /doctor-schedules/:id/cancel — Báo nghỉ / hủy ca
  async cancelSchedule(id: string, reason?: string): Promise<CancelScheduleResult> {
    return apiFetch<CancelScheduleResult>(`/doctor-schedules/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  // POST /doctor-schedules/cron/weekly-generate — Tự động sinh lịch tuần
  async triggerWeeklyGenerate(weekMonday?: string): Promise<{ generated: number; message?: string }> {
    return apiFetch<{ generated: number; message?: string }>('/doctor-schedules/cron/weekly-generate', {
      method: 'POST',
      body: JSON.stringify({ weekMonday }),
    });
  },
};
