import { apiFetch } from '../api';

export interface PrescriptionItemInput {
  drugId: string;
  quantity: number;
  dosage: string;
  routeCode?: string;
  routeSystem?: string;
  routeDisplay?: string;
  frequency: string;
  durationDays?: number;
  instruction?: string;
}

export interface CreatePrescriptionPayload {
  encounterId: string;
  diagnosisId: string;
  items: PrescriptionItemInput[];
}

export interface UpdatePrescriptionItemsPayload {
  items: PrescriptionItemInput[];
}

export interface ConfirmAlertPayload {
  overrideReason: string;
}

export interface SignPrescriptionPayload {
  password: string;
}

export interface ScheduleFollowupPayload {
  appointmentDate?: string;
  appointmentTime?: string;
  doctorId?: string;
  slotId?: string;
  reasonForVisit?: string;
  priority?: string;
  closeEncounter?: boolean;
}

export interface PrescriptionDrugItem {
  prescriptionItemId: string;
  prescriptionId: string;
  drugId: string;
  quantity: number | string;
  dosage: string;
  routeCode?: string | null;
  routeSystem?: string | null;
  routeDisplay?: string | null;
  frequency: string;
  durationDays?: number | null;
  instruction?: string | null;
  drug: {
    drugId: string;
    drugCode: string;
    drugName: string;
    genericName: string;
    strength: string;
    dosageForm: string;
    unit: string;
    route: string;
    therapeuticClass?: string | null;
    allergenCategory?: {
      categoryId: string;
      categoryCode: string;
      categoryName: string;
    } | null;
  };
}

export interface PrescriptionSafetyAlert {
  alertId: string;
  prescriptionId: string;
  alertType: 'drug_allergy' | 'drug_interaction' | 'duplicate_class' | string;
  severity: 'mild' | 'moderate' | 'severe' | 'contraindicated' | string;
  message: string;
  status: 'active' | 'confirmed';
  overrideReason?: string | null;
  confirmedByUserId?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
}

export interface PrescriptionDetail {
  prescriptionId: string;
  prescriptionCode: string;
  encounterId: string;
  diagnosisId: string;
  doctorId: string;
  status: 'draft' | 'signed' | 'cancelled' | string;
  certificateSerial?: string | null;
  signedDocumentHash?: string | null;
  signedAt?: string | null;
  pdfFileUrl?: string | null;
  printedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: PrescriptionDrugItem[];
  safetyAlerts: PrescriptionSafetyAlert[];
  doctor?: {
    doctorId: string;
    doctorCode?: string;
    fullName: string;
    title?: string;
  };
  diagnosis?: {
    diagnosisId: string;
    diagnosisName: string;
    icd10Code: string;
    diagnosisType: string;
    icd10?: {
      icd10Code: string;
      descriptionVi: string;
      descriptionEn?: string;
    };
  };
  encounter?: {
    encounterId: string;
    encounterCode: string;
    status: string;
    patientId: string;
    patient?: {
      patientId: string;
      patientCode: string;
      fullName: string;
      dateOfBirth?: string;
      gender?: string;
      phoneNumber?: string;
      bloodType?: string;
    };
  };
}

export interface FindPrescriptionsQuery {
  encounterId?: string;
  doctorId?: string;
  patientId?: string;
  status?: string;
}

export const prescriptionService = {
  /**
   * Tạo đơn thuốc mới (status=draft) gắn với 1 Encounter + Diagnosis
   * Backend tự động kích hoạt PrescriptionSafetyCheckOrchestrator
   */
  async create(payload: CreatePrescriptionPayload): Promise<PrescriptionDetail> {
    return apiFetch<PrescriptionDetail>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Cập nhật danh sách dòng thuốc (chỉ khi status=draft)
   * Tự động chạy lại Safety Check
   */
  async updateItems(prescriptionId: string, payload: UpdatePrescriptionItemsPayload): Promise<PrescriptionDetail> {
    return apiFetch<PrescriptionDetail>(`/prescriptions/${prescriptionId}/items`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Huỷ đơn thuốc
   */
  async cancel(prescriptionId: string): Promise<PrescriptionDetail> {
    return apiFetch<PrescriptionDetail>(`/prescriptions/${prescriptionId}/cancel`, {
      method: 'POST',
    });
  },

  /**
   * Đánh dấu đơn thuốc đã in (cập nhật printedAt)
   */
  async markAsPrinted(prescriptionId: string): Promise<PrescriptionDetail> {
    return apiFetch<PrescriptionDetail>(`/prescriptions/${prescriptionId}/printed`, {
      method: 'PATCH',
    });
  },

  /**
   * Chi tiết đơn thuốc kèm items (tên thuốc) và safetyAlerts
   */
  async getById(prescriptionId: string): Promise<PrescriptionDetail> {
    return apiFetch<PrescriptionDetail>(`/prescriptions/${prescriptionId}`, {
      method: 'GET',
    });
  },

  /**
   * Liệt kê đơn thuốc theo bộ lọc (encounterId, doctorId, patientId, status)
   */
  async findMany(query?: FindPrescriptionsQuery): Promise<PrescriptionDetail[]> {
    const params = new URLSearchParams();
    if (query?.encounterId) params.append('encounterId', query.encounterId);
    if (query?.doctorId) params.append('doctorId', query.doctorId);
    if (query?.patientId) params.append('patientId', query.patientId);
    if (query?.status) params.append('status', query.status);

    const qs = params.toString();
    return apiFetch<PrescriptionDetail[]>(`/prescriptions${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Danh sách cảnh báo an toàn (Safety Check) của đơn thuốc
   */
  async getAlerts(prescriptionId: string): Promise<PrescriptionSafetyAlert[]> {
    return apiFetch<PrescriptionSafetyAlert[]>(`/prescriptions/${prescriptionId}/alerts`, {
      method: 'GET',
    });
  },

  /**
   * Bác sĩ xác nhận đã biết rủi ro của 1 cảnh báo an toàn (bắt buộc nêu lý do override)
   */
  async confirmAlert(
    prescriptionId: string,
    alertId: string,
    payload: ConfirmAlertPayload
  ): Promise<PrescriptionSafetyAlert> {
    return apiFetch<PrescriptionSafetyAlert>(`/prescriptions/${prescriptionId}/alerts/${alertId}/confirm`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Ký số đơn thuốc (xác thực lại mật khẩu bác sĩ)
   * Chặn ký nếu còn alert severe/contraindicated active chưa confirm
   * Khi hợp lệ: chuyển status -> signed, sinh serial và PDF chính thức
   */
  async sign(prescriptionId: string, payload: SignPrescriptionPayload): Promise<PrescriptionDetail> {
    return apiFetch<PrescriptionDetail>(`/prescriptions/${prescriptionId}/sign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Xuất PDF đơn thuốc (URL file đã ký hoặc bản xem trước preview)
   */
  async exportPdf(prescriptionId: string): Promise<{ pdfUrl: string; preview: boolean }> {
    return apiFetch<{ pdfUrl: string; preview: boolean }>(`/prescriptions/${prescriptionId}/export`, {
      method: 'GET',
    });
  },

  /**
   * Gợi ý ngày tái khám theo phác đồ điều trị và số ngày dùng thuốc
   */
  async getFollowupSuggestion(prescriptionId: string): Promise<{ suggestedDate: string }> {
    return apiFetch<{ suggestedDate: string }>(`/prescriptions/${prescriptionId}/followup/suggestion`, {
      method: 'GET',
    });
  },

  /**
   * Xem chi tiết lịch hẹn tái khám liên kết với đơn thuốc
   */
  async getFollowup(prescriptionId: string): Promise<any> {
    return apiFetch<any>(`/prescriptions/${prescriptionId}/followup`, {
      method: 'GET',
    });
  },

  /**
   * Đặt lịch tái khám (Appointment kiểu "follow_up") theo đơn thuốc đã ký
   */
  async scheduleFollowup(
    prescriptionId: string,
    payload: ScheduleFollowupPayload
  ): Promise<{ appointment: any; closedEncounter: boolean }> {
    return apiFetch<{ appointment: any; closedEncounter: boolean }>(`/prescriptions/${prescriptionId}/followup`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Đóng lượt khám (status=finished) khi hoàn tất kê đơn không cần đặt lịch tái khám
   */
  async finishEncounter(encounterId: string): Promise<any> {
    return apiFetch<any>(`/prescriptions/encounters/${encounterId}/finish`, {
      method: 'POST',
    });
  },
};
