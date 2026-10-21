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
  diagnosticRoomId?: string;
  status?: string;
  assignedLabStaffId?: string;
  limit?: number;
}

export function normalizeLabTask(raw: any): LabTaskItem {
  if (!raw) return raw;
  const taskId = raw.taskId || raw.labTaskId;
  const roomId = raw.diagnosticRoomId || raw.labRoomId;

  // Chuẩn hóa thông tin phòng
  const rawRoom = raw.diagnosticRoom || raw.labRoom;
  const normalizedRoom = rawRoom
    ? {
        labRoomId: rawRoom.diagnosticRoomId || rawRoom.labRoomId,
        diagnosticRoomId: rawRoom.diagnosticRoomId || rawRoom.labRoomId,
        labRoomCode: rawRoom.diagnosticRoomCode || rawRoom.labRoomCode,
        diagnosticRoomCode: rawRoom.diagnosticRoomCode || rawRoom.labRoomCode,
        labRoomName: rawRoom.diagnosticRoomName || rawRoom.labRoomName,
        diagnosticRoomName: rawRoom.diagnosticRoomName || rawRoom.labRoomName,
        location: rawRoom.location || rawRoom.roomLocation,
        roomLocation: rawRoom.location || rawRoom.roomLocation,
        isActive: rawRoom.isActive ?? true,
      }
    : undefined;

  // Chuẩn hóa orderItem, testType/service và tham số kết quả
  let orderItem = raw.orderItem;
  if (orderItem) {
    const service = orderItem.service || orderItem.testType;
    const testType = service
      ? {
          testTypeId: service.serviceId || service.testTypeId,
          testCode: service.serviceCode || service.testCode,
          testName: service.serviceName || service.testName,
          category: service.category || 'blood_test',
          specimenType: service.specimenType || 'Máu tĩnh mạch',
          price: service.price ?? orderItem.unitPrice,
          labResultParameters: (service.resultParameters || service.labResultParameters || []).map((p: any) => ({
            parameterId: p.parameterId,
            testTypeId: p.serviceId || p.testTypeId,
            parameterCode: p.parameterCode,
            parameterName: p.parameterName,
            loincCode: p.loincCode,
            unit: p.unit,
            dataType: p.dataType || 'numeric',
            displayOrder: p.displayOrder || 0,
            isActive: p.isActive ?? true,
            labParameterThresholds: (p.thresholds || p.labParameterThresholds || []).map((th: any) => ({
              labThresholdId: th.thresholdId || th.labThresholdId,
              parameterId: th.parameterId,
              ageMin: th.ageMin,
              ageMax: th.ageMax,
              gender: th.gender,
              riskLevel: th.riskLevel || 'normal',
              rangeMin: th.rangeMin,
              rangeMax: th.rangeMax,
              isActive: th.isActive ?? true,
            })),
          })),
        }
      : undefined;

    const order = orderItem.order;
    const doctor = order?.doctor;
    const orderedByUser = order?.orderedByUser || (doctor ? {
      userId: doctor.userId,
      email: doctor.email || '',
      profile: {
        fullName: doctor.fullName,
        phoneNumber: doctor.phoneNumber,
      },
    } : undefined);

    orderItem = {
      ...orderItem,
      testType,
      order: order
        ? {
            ...order,
            orderedByUser,
          }
        : undefined,
    };
  }

  // Chuẩn hóa kết quả nếu có
  let labResult = raw.result || raw.labResult;
  if (labResult) {
    labResult = {
      ...labResult,
      labResultId: labResult.resultId || labResult.labResultId,
      resultId: labResult.resultId || labResult.labResultId,
      labTaskId: labResult.taskId || labResult.labTaskId,
      taskId: labResult.taskId || labResult.labTaskId,
    };
  }

  return {
    ...raw,
    labTaskId: taskId,
    taskId: taskId,
    labRoomId: roomId,
    diagnosticRoomId: roomId,
    labRoom: normalizedRoom,
    diagnosticRoom: normalizedRoom,
    orderItem,
    labResult,
  };
}

export const labTaskService = {
  /**
   * GET /api/v1/lab-tasks?diagnosticRoomId=...&status=...
   * Lấy worklist nhiệm vụ xét nghiệm (có thể lấy toàn bộ hoặc lọc theo phòng Lab)
   */
  async getLabTasks(query?: ListLabTasksQuery): Promise<LabTaskItem[]> {
    const searchParams = new URLSearchParams();
    const roomId = query?.diagnosticRoomId || query?.labRoomId;
    if (roomId) {
      searchParams.append('diagnosticRoomId', roomId);
    }
    if (query?.status && query.status !== 'ALL') {
      searchParams.append('status', query.status);
    }
    if (query?.assignedLabStaffId) {
      searchParams.append('assignedStaffUserId', query.assignedLabStaffId);
    }
    if (query?.limit) {
      searchParams.append('limit', String(query.limit));
    }

    const rawList = await apiFetch<any[]>(`/lab-tasks?${searchParams.toString()}`, {
      method: 'GET',
    });
    return Array.isArray(rawList) ? rawList.map(normalizeLabTask) : [];
  },

  /**
   * GET /api/v1/lab-tasks/:id
   * Chi tiết 1 nhiệm vụ xét nghiệm
   */
  async getLabTaskById(id: string): Promise<LabTaskItem> {
    const raw = await apiFetch<any>(`/lab-tasks/${id}`, {
      method: 'GET',
    });
    return normalizeLabTask(raw);
  },

  /**
   * POST /api/v1/lab-tasks/:id/receive
   * KTV tiếp nhận mẫu xét nghiệm (chuyển ready -> in_progress)
   */
  async receiveLabTask(id: string, data?: { specimenCode?: string; specimenCollectedAt?: string }): Promise<LabTaskItem> {
    const raw = await apiFetch<any>(`/lab-tasks/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
    return normalizeLabTask(raw);
  },

  /**
   * PATCH /api/v1/lab-tasks/:id/assign
   * Phân công hoặc chuyển KTV phụ trách
   */
  async assignLabTask(id: string, assignedStaffUserId: string): Promise<LabTaskItem> {
    const raw = await apiFetch<any>(`/lab-tasks/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedStaffUserId }),
    });
    return normalizeLabTask(raw);
  },

  /**
   * POST /api/v1/lab-tasks/:id/report-exception
   * Báo cáo mẫu hỏng hoặc sự cố (chuyển sang on_hold)
   */
  async reportException(id: string, reasonCode: string, detail?: string): Promise<LabTaskItem> {
    const raw = await apiFetch<any>(`/lab-tasks/${id}/report-exception`, {
      method: 'POST',
      body: JSON.stringify({ reasonCode, detail }),
    });
    return normalizeLabTask(raw);
  },
};
