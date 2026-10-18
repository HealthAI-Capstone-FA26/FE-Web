import { apiFetch } from '../api';
import { clinicalExamService, type UpsertClinicalExamPayload, type CaseOverviewData } from './clinical-exam.service';
import { doctorAiService, type AiReferenceSource, type AiClinicalSummaryData, type AiDiagnosisSuggestionItem } from './doctor-ai.service';

// Re-export for backward compatibility
export type { UpsertClinicalExamPayload, CaseOverviewData };
export type { AiReferenceSource, AiClinicalSummaryData, AiDiagnosisSuggestionItem };

export interface TestCatalogItem {
  testTypeId: string;
  serviceId?: string;
  testCode: string;
  testName: string;
  category?: string;
  price: number;
  room?: string;
  requiresFasting?: boolean;
  preparationNote?: string | null;
  panelGroup?: string;
}

export interface TestOrderItemInput {
  serviceId?: string;
  testTypeId?: string;
  wasAiSuggested?: boolean;
}

export interface CreateTestOrderPayload {
  diagnosisId?: string;
  notes?: string;
  clinicalIndication?: string;
  priority?: 'routine' | 'urgent' | 'stat';
  items: TestOrderItemInput[];
}

export interface CancelTestOrderItemPayload {
  reason: string;
}

export interface TestOrderItemDetail {
  orderItemId: string;
  orderId: string;
  testTypeId: string;
  unitPrice: number;
  wasAiSuggested: boolean;
  status: string;
  testType?: {
    testTypeId: string;
    testCode: string;
    testName: string;
    category: string;
    price: number;
  };
  service?: {
    serviceId: string;
    serviceCode: string;
    serviceName: string;
    price: number;
  };
  labTask?: {
    taskId: string;
    status: string;
    paymentVerified: boolean;
    labRoomId?: string;
  };
}

export interface TestOrderDetail {
  orderId: string;
  orderCode: string;
  encounterId: string;
  orderedByUserId: string;
  diagnosisId?: string;
  notes?: string;
  orderedAt: string;
  items: TestOrderItemDetail[];
}

// Danh mục dịch vụ được nạp 100% động từ Database qua API GET /doctor-examination/services
export const AVAILABLE_TEST_CATALOG: TestCatalogItem[] = [];

export const testOrderService = {
  // 0. GET /api/v1/doctor-examination/services (Lấy danh mục dịch vụ cận lâm sàng từ database)
  async getAvailableServices(): Promise<TestCatalogItem[]> {
    try {
      const res = await apiFetch<{ total: number; items: any[] }>(
        '/doctor-examination/services',
        { method: 'GET' }
      );
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        return res.items.map((item) => ({
          testTypeId: item.serviceId,
          serviceId: item.serviceId,
          testCode: item.serviceCode,
          testName: item.serviceName,
          category: item.panelGroup || item.modality || 'blood',
          price: Number(item.price) || 0,
          room: item.defaultRoom?.diagnosticRoomName || 'Phòng Xét nghiệm Máu (BLOOD-LAB)',
          requiresFasting: Boolean(item.requiresFasting),
          preparationNote: item.preparationNote,
          panelGroup: item.panelGroup,
        }));
      }
    } catch (err) {
      console.error('Lỗi khi tải danh mục dịch vụ từ backend /doctor-examination/services:', err);
    }
    return [];
  },

  // 1. POST /api/v1/doctor-examination/encounters/:encounterId/test-orders
  async createTestOrder(
    encounterId: string,
    payload: CreateTestOrderPayload
  ): Promise<TestOrderDetail> {
    const formattedItems = payload.items.map((it) => ({
      serviceId: it.serviceId || it.testTypeId,
    }));
    return apiFetch<TestOrderDetail>(
      `/doctor-examination/encounters/${encounterId}/test-orders`,
      {
        method: 'POST',
        body: JSON.stringify({
          diagnosisId: payload.diagnosisId,
          notes: payload.notes,
          clinicalIndication: payload.clinicalIndication,
          priority: payload.priority || 'routine',
          items: formattedItems,
        }),
      }
    );
  },

  // 2. GET /api/v1/doctor-examination/encounters/:encounterId/test-orders
  async getTestOrdersByEncounter(
    encounterId: string
  ): Promise<TestOrderDetail[]> {
    return apiFetch<TestOrderDetail[]>(
      `/doctor-examination/encounters/${encounterId}/test-orders`,
      {
        method: 'GET',
      }
    );
  },

  // 3. GET /api/v1/doctor-examination/test-orders/:orderId
  async getTestOrderById(orderId: string): Promise<TestOrderDetail> {
    return apiFetch<TestOrderDetail>(
      `/doctor-examination/test-orders/${orderId}`,
      {
        method: 'GET',
      }
    );
  },

  // 4. PATCH /api/v1/doctor-examination/test-order-items/:orderItemId/cancel
  async cancelTestOrderItem(
    orderItemId: string,
    payload: CancelTestOrderItemPayload
  ): Promise<TestOrderItemDetail> {
    return apiFetch<TestOrderItemDetail>(
      `/doctor-examination/test-order-items/${orderItemId}/cancel`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
  },

  /** @deprecated Use clinicalExamService.upsertClinicalExamination instead */
  async upsertClinicalExamination(
    encounterId: string,
    payload: UpsertClinicalExamPayload
  ): Promise<any> {
    return clinicalExamService.upsertClinicalExamination(encounterId, payload);
  },

  /** @deprecated Use clinicalExamService.getCaseOverview instead */
  async getCaseOverview(encounterId: string): Promise<CaseOverviewData> {
    return clinicalExamService.getCaseOverview(encounterId);
  },

  /** @deprecated Use doctorAiService.generateAiClinicalSummary instead */
  async generateAiClinicalSummary(
    encounterId: string
  ): Promise<{ encounterId: string; status: string }> {
    return doctorAiService.generateAiClinicalSummary(encounterId);
  },

  /** @deprecated Use doctorAiService.getAiClinicalSummary instead */
  async getAiClinicalSummary(
    encounterId: string
  ): Promise<AiClinicalSummaryData | null> {
    return doctorAiService.getAiClinicalSummary(encounterId);
  },

  /** @deprecated Use doctorAiService.generateAiDiagnosisSuggestions instead */
  async generateAiDiagnosisSuggestions(
    encounterId: string
  ): Promise<AiDiagnosisSuggestionItem[]> {
    return doctorAiService.generateAiDiagnosisSuggestions(encounterId);
  },

  /** @deprecated Use doctorAiService.getAiDiagnosisSuggestions instead */
  async getAiDiagnosisSuggestions(
    encounterId: string
  ): Promise<AiDiagnosisSuggestionItem[]> {
    return doctorAiService.getAiDiagnosisSuggestions(encounterId);
  },
};
