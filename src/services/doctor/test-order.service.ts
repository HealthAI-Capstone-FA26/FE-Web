import { apiFetch } from '../api';
import { clinicalExamService, type UpsertClinicalExamPayload, type CaseOverviewData } from './clinical-exam.service';
import { doctorAiService, type AiReferenceSource, type AiClinicalSummaryData, type AiDiagnosisSuggestionItem } from './doctor-ai.service';

// Re-export for backward compatibility
export type { UpsertClinicalExamPayload, CaseOverviewData };
export type { AiReferenceSource, AiClinicalSummaryData, AiDiagnosisSuggestionItem };

export interface TestCatalogItem {
  testTypeId: string;
  testCode: string;
  testName: string;
  category: string;
  price: number;
  room?: string;
}

export interface TestOrderItemInput {
  testTypeId: string;
  wasAiSuggested?: boolean;
}

export interface CreateTestOrderPayload {
  diagnosisId?: string;
  notes?: string;
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

// 5 danh mục xét nghiệm chuẩn từ cơ sở dữ liệu bệnh viện
export const AVAILABLE_TEST_CATALOG: TestCatalogItem[] = [
  {
    testTypeId: 'a9a04ea8-d3fd-44ab-83b5-91dac083020a',
    testCode: 'XQ-NGUC',
    testName: 'Chụp X-quang ngực thẳng',
    category: 'imaging',
    price: 120000,
    room: 'Phòng Chẩn đoán hình ảnh (IMAGING)',
  },
  {
    testTypeId: 'ef6a0f10-fe0f-4ae2-8735-3b85fc758e96',
    testCode: 'CBC',
    testName: 'Tổng phân tích tế bào máu (CBC)',
    category: 'blood',
    price: 150000,
    room: 'Phòng Huyết học (HEMA)',
  },
  {
    testTypeId: '31b17480-2d77-4938-8e6e-316a03220324',
    testCode: 'BIOC01',
    testName: 'Sinh hóa máu cơ bản (Glucose, Creatinine)',
    category: 'biochemistry',
    price: 180000,
    room: 'Phòng Sinh hóa (BIOCHEM)',
  },
  {
    testTypeId: 'd482d559-bb5f-4f54-a7a7-2f39e27d4ad6',
    testCode: 'URI01',
    testName: 'Tổng phân tích nước tiểu (10 thông số)',
    category: 'urinalysis',
    price: 90000,
    room: 'Phòng Nước tiểu (URINE)',
  },
  {
    testTypeId: '5264b4d1-0e8a-4ced-941a-1fddc8c4eb59',
    testCode: 'MICRO01',
    testName: 'Cấy phân tìm vi khuẩn gây bệnh',
    category: 'microbiology',
    price: 250000,
    room: 'Phòng Vi sinh (MICRO)',
  },
];

export const testOrderService = {
  // 1. POST /api/v1/doctor-examination/encounters/:encounterId/test-orders
  async createTestOrder(
    encounterId: string,
    payload: CreateTestOrderPayload
  ): Promise<TestOrderDetail> {
    return apiFetch<TestOrderDetail>(
      `/doctor-examination/encounters/${encounterId}/test-orders`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
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
