import { apiFetch } from '../api';

export type PatientGender = 'male' | 'female' | 'other' | 'unknown';

export interface CreatePatientData {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: PatientGender;
  identityNumber?: string;
  insuranceNumber?: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  ethnicity?: string;
  relationship?: string;
}

export interface PatientResponse {
  patientId: string;
  userId?: string | null;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: PatientGender | string;
  identityNumber?: string | null;
  insuranceNumber?: string | null;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
  ethnicity?: string | null;
  relationship?: string;
  isPrimaryContact?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchSuggestionQuery {
  identityNumber?: string;
  insuranceNumber?: string;
  phoneNumber?: string;
}

export interface MatchSuggestionResult {
  matched: boolean;
  patient?: {
    patientId: string;
    patientCode: string;
    fullName: string;
    dateOfBirth: string;
    maskedIdentityNumber?: string;
    maskedPhoneNumber?: string;
  };
}

export const patientService = {
  // Tạo hồ sơ bệnh nhân (POST /patients)
  async createPatient(data: CreatePatientData): Promise<PatientResponse> {
    return apiFetch<PatientResponse>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Danh sách / Tìm kiếm tất cả hồ sơ bệnh nhân (GET /patients?search=...) — dành cho Lễ tân/Admin
  async getAllPatients(search?: string): Promise<PatientResponse[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const queryString = params.toString();
    const url = `/patients${queryString ? `?${queryString}` : ''}`;
    return apiFetch<PatientResponse[]>(url, { method: 'GET' });
  },

  // Danh sách hồ sơ bệnh nhân user đang quản lý (GET /patients/my)
  async getMyPatients(): Promise<PatientResponse[]> {
    return apiFetch<PatientResponse[]>('/patients/my', {
      method: 'GET',
    });
  },

  // Chi tiết hồ sơ bệnh nhân theo ID (GET /patients/:id)
  async getPatientById(id: string): Promise<PatientResponse> {
    return apiFetch<PatientResponse>(`/patients/${id}`, {
      method: 'GET',
    });
  },

  // Cập nhật hồ sơ bệnh nhân (PATCH /patients/:id)
  async updatePatient(id: string, data: Partial<CreatePatientData>): Promise<PatientResponse> {
    return apiFetch<PatientResponse>(`/patients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Gợi ý hồ sơ bệnh nhân khớp với thông tin user (GET /patients/match-suggestion)
  async findMatchSuggestion(params?: MatchSuggestionQuery): Promise<MatchSuggestionResult> {
    const queryParams = new URLSearchParams();
    if (params?.identityNumber) queryParams.append('identityNumber', params.identityNumber);
    if (params?.insuranceNumber) queryParams.append('insuranceNumber', params.insuranceNumber);
    if (params?.phoneNumber) queryParams.append('phoneNumber', params.phoneNumber);

    const queryString = queryParams.toString();
    const url = `/patients/match-suggestion${queryString ? `?${queryString}` : ''}`;
    return apiFetch<MatchSuggestionResult>(url, {
      method: 'GET',
    });
  },

  // Liên kết hồ sơ bệnh nhân với tài khoản hiện tại (POST /patients/:id/link-user)
  async linkUser(id: string): Promise<{ message?: string; patient?: PatientResponse }> {
    return apiFetch<{ message?: string; patient?: PatientResponse }>(`/patients/${id}/link-user`, {
      method: 'POST',
    });
  },

  // Bước 1: Gửi yêu cầu làm người liên hệ / liên kết người thân (POST /patients/contact-requests)
  async createContactRequest(data: {
    fullName: string;
    dateOfBirth: string;
    identityNumber: string;
    phoneNumber: string;
    relationship: 'parent' | 'child' | 'spouse' | 'guardian' | 'other';
    verifyMethod: 'email' | 'sms';
    email?: string;
  }): Promise<{ message: string; verifyMethod: string }> {
    return apiFetch<{ message: string; verifyMethod: string }>('/patients/contact-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Bước 2: Xác thực OTP để hoàn tất liên kết người thân (POST /patients/contact-requests/verify-otp)
  async verifyContactRequestOtp(data: {
    otp: string;
  }): Promise<{ message: string; contact?: any }> {
    return apiFetch<{ message: string; contact?: any }>('/patients/contact-requests/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

