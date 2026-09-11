import { apiFetch } from '../api';

export interface EncounterPatient {
  patientId: string;
  patientCode?: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  identityNumber?: string;
  bloodType?: string;
}

export interface EncounterDepartment {
  departmentId: string;
  departmentName: string;
  roomLocation?: string;
}

export interface EncounterDoctor {
  doctorId: string;
  fullName: string;
  title?: string;
  specialization?: string;
}

export interface EncounterVitalObservation {
  observationId: string;
  itemId: string;
  observationValue: number | string;
  isAbnormal: boolean;
  item?: {
    itemCode: string;
    itemName: string;
    unit: string;
  };
}

export interface EncounterVitalSession {
  vitalSessionId: string;
  measuredAt: string;
  notes?: string;
  createdAt: string;
  observations: EncounterVitalObservation[];
}

export interface EncounterChiefComplaint {
  complaintId: string;
  encounterId: string;
  reasonForVisit?: string;
  symptoms?: string;
  symptomOnsetDate?: string;
  painLevel?: number;
  inputChannel?: string;
  recordedByUserId?: string;
}

export interface EncounterItem {
  encounterId: string;
  appointmentId: string;
  patientId: string;
  departmentId: string;
  doctorId?: string;
  encounterCode: string;
  patientType: string; // 'new' | 'returning'
  status: 'arrived' | 'registered' | 'waiting_for_doctor' | 'in_progress' | 'finished' | 'cancelled';
  arrivedAt: string;
  chiefComplaint?: EncounterChiefComplaint;
  patient?: EncounterPatient;
  department?: EncounterDepartment;
  doctor?: EncounterDoctor;
  vitalSignSessions?: EncounterVitalSession[];
}

export interface ParsedVitals {
  pulse?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  temp?: number;
  respiratoryRate?: number;
  spo2?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  isAbnormal?: boolean;
}

export interface NursePatientRow {
  encounterId: string;
  encounterCode: string;
  patientId: string;
  name: string;
  age: number | string;
  gender: string;
  phone: string;
  departmentName: string;
  doctorName: string;
  arrivedAt: string;
  status: 'Pending' | 'Measured';
  vitalSessionId?: string;
  vitals?: ParsedVitals;
  chiefComplaint?: EncounterChiefComplaint;
}

export const encounterService = {
  // Lấy danh sách ca khám (hỗ trợ lọc theo trạng thái: arrived, registered, ...)
  async getEncounters(params?: { status?: string; patientId?: string }): Promise<EncounterItem[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.patientId) query.append('patientId', params.patientId);

    const queryString = query.toString();
    const endpoint = queryString ? `/encounters?${queryString}` : '/encounters';

    return apiFetch<EncounterItem[]>(endpoint, {
      method: 'GET',
    });
  },

  // Lấy chi tiết 1 ca khám
  async getEncounterById(id: string): Promise<EncounterItem> {
    return apiFetch<EncounterItem>(`/encounters/${id}`, {
      method: 'GET',
    });
  },
};
