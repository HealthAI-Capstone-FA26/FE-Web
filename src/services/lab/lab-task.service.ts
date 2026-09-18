import { apiFetch } from '../api';
import type { LabRoomItem } from './lab-room.service';

export interface LabParameterThreshold {
  labThresholdId: string;
  parameterId: string;
  ageMin?: number;
  ageMax?: number;
  gender?: string;
  riskLevel: 'normal' | 'low' | 'medium' | 'high' | 'critical';
  rangeMin?: string | number | null;
  rangeMax?: string | number | null;
  isActive: boolean;
}

export interface LabParameterItem {
  parameterId: string;
  testTypeId: string;
  parameterCode: string;
  parameterName: string;
  loincCode?: string;
  unit?: string;
  dataType?: 'numeric' | 'positive_negative' | 'text';
  displayOrder: number;
  isActive: boolean;
  labParameterThresholds?: LabParameterThreshold[];
}

export interface LabTaskPatient {
  patientId: string;
  patientCode: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber?: string;
}

export interface LabTaskDoctor {
  userId: string;
  email: string;
  profile?: {
    fullName: string;
    phoneNumber?: string;
  };
}

export interface LabTaskItem {
  labTaskId: string;
  orderItemId: string;
  labRoomId: string;
  assignedLabStaffId?: string | null;
  paymentVerified: boolean;
  status: 'payment_pending' | 'ready' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  receivedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  labRoom?: LabRoomItem;
  assignedLabStaff?: LabTaskDoctor | null;
  orderItem?: {
    orderItemId: string;
    orderId: string;
    testTypeId: string;
    unitPrice: string | number;
    status: string;
    testType?: {
      testTypeId: string;
      testCode: string;
      testName: string;
      category: string;
      specimenType?: string;
      price: string | number;
      labResultParameters?: LabParameterItem[];
    };
    order?: {
      orderId: string;
      orderCode: string;
      orderedAt: string;
      notes?: string;
      orderedByUser?: LabTaskDoctor;
      encounter?: {
        encounterId: string;
        encounterCode: string;
        patient?: LabTaskPatient;
        department?: {
          departmentId: string;
          departmentName: string;
          departmentCode?: string;
        };
      };
    };
  };
  labResult?: any;
}

export interface ListLabTasksQuery {
  labRoomId?: string;
  status?: string;
  assignedLabStaffId?: string;
  limit?: number;
}

export const labTaskService = {
  /**
   * GET /api/v1/lab-tasks?labRoomId=...&status=...
   * Lấy worklist nhiệm vụ xét nghiệm (có thể lấy toàn bộ hoặc lọc theo phòng Lab)
   */
  async getLabTasks(query?: ListLabTasksQuery): Promise<LabTaskItem[]> {
    const searchParams = new URLSearchParams();
    if (query?.labRoomId) {
      searchParams.append('labRoomId', query.labRoomId);
    }
    if (query?.status && query.status !== 'ALL') {
      searchParams.append('status', query.status);
    }
    if (query?.assignedLabStaffId) {
      searchParams.append('assignedLabStaffId', query.assignedLabStaffId);
    }
    if (query?.limit) {
      searchParams.append('limit', String(query.limit));
    }

    return apiFetch<LabTaskItem[]>(`/lab-tasks?${searchParams.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * GET /api/v1/lab-tasks/:id
   * Chi tiết 1 nhiệm vụ xét nghiệm
   */
  async getLabTaskById(id: string): Promise<LabTaskItem> {
    return apiFetch<LabTaskItem>(`/lab-tasks/${id}`, {
      method: 'GET',
    });
  },

  /**
   * POST /api/v1/lab-tasks/:id/receive
   * KTV tiếp nhận mẫu xét nghiệm (chuyển ready -> in_progress)
   */
  async receiveLabTask(id: string): Promise<LabTaskItem> {
    return apiFetch<LabTaskItem>(`/lab-tasks/${id}/receive`, {
      method: 'POST',
    });
  },

  /**
   * PATCH /api/v1/lab-tasks/:id/assign
   * Phân công hoặc chuyển KTV phụ trách
   */
  async assignLabTask(id: string, assignedLabStaffId: string): Promise<LabTaskItem> {
    return apiFetch<LabTaskItem>(`/lab-tasks/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedLabStaffId }),
    });
  },

  /**
   * POST /api/v1/lab-tasks/:id/report-exception
   * Báo cáo mẫu hỏng hoặc sự cố (chuyển sang on_hold)
   */
  async reportException(id: string, reason: string, notes?: string): Promise<LabTaskItem> {
    return apiFetch<LabTaskItem>(`/lab-tasks/${id}/report-exception`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
  },
};
