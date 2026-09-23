import { apiFetch } from '../api';

export type TriageQueueStatus =
  | 'waiting'
  | 'called'
  | 'in_progress'
  | 'done'
  | 'skipped'
  | 'cancelled';

export type TriagePriority = 'emergency' | 'urgent' | 'normal';

export interface TriageQueueEntryItem {
  queueEntryId: string;
  encounterId: string;
  departmentId: string;
  assignedNurseUserId: string;
  priority: TriagePriority | string;
  queueOrder: number;
  status: TriageQueueStatus;
  triageQueueDate: string;
  calledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  sessionId?: string | null;
  createdAt: string;
  updatedAt: string;
  encounter?: {
    encounterId: string;
    encounterCode: string;
    patientId: string;
    departmentId: string;
    doctorId?: string | null;
    status: string;
    arrivedAt?: string;
    patient?: {
      patientId: string;
      patientCode: string;
      fullName: string;
      phoneNumber?: string;
      dateOfBirth?: string;
      gender?: string;
      address?: string;
    };
    department?: {
      departmentId: string;
      departmentName: string;
      departmentCode?: string;
    };
    chiefComplaint?: {
      complaintId?: string;
      encounterId?: string;
      reasonForVisit?: string;
      symptoms?: string;
      symptomOnsetDate?: string;
      painLevel?: number;
    };
    vitalSignSessions?: Array<{
      vitalSessionId: string;
      measuredAt: string;
      observations: Array<{
        observationValue: number;
        item: {
          itemCode: string;
          itemName: string;
          unit: string;
        };
      }>;
    }>;
  };
  assignedNurseUser?: {
    userId: string;
    email: string;
    profile?: {
      fullName?: string;
    };
  };
}

export interface FindTriageQueueParams {
  departmentId?: string;
  date?: string;
  status?: string;
}

export const triageQueueService = {
  // GET /triage-queue?departmentId=&date=&status=
  async getTriageQueue(params?: FindTriageQueueParams): Promise<TriageQueueEntryItem[]> {
    const query = new URLSearchParams();
    if (params?.departmentId) query.append('departmentId', params.departmentId);
    if (params?.date) query.append('date', params.date);
    if (params?.status) query.append('status', params.status);

    const queryString = query.toString();
    const endpoint = queryString ? `/triage-queue?${queryString}` : '/triage-queue';

    return apiFetch<TriageQueueEntryItem[]>(endpoint, {
      method: 'GET',
    });
  },

  // POST /triage-queue/dequeue
  // Y tá gọi bệnh nhân tiếp theo trong hàng đợi triage của mình theo thứ tự ưu tiên (waiting -> called)
  async dequeue(): Promise<TriageQueueEntryItem> {
    return apiFetch<TriageQueueEntryItem>('/triage-queue/dequeue', {
      method: 'POST',
    });
  },

  // PATCH /triage-queue/:id/start
  // Y tá bắt đầu đo sinh hiệu cho bệnh nhân đã gọi (called -> in_progress)
  async startProcessing(queueEntryId: string): Promise<TriageQueueEntryItem> {
    return apiFetch<TriageQueueEntryItem>(`/triage-queue/${queueEntryId}/start`, {
      method: 'PATCH',
    });
  },

  // GET /triage-queue/:id
  async getById(queueEntryId: string): Promise<TriageQueueEntryItem> {
    return apiFetch<TriageQueueEntryItem>(`/triage-queue/${queueEntryId}`, {
      method: 'GET',
    });
  },
};
