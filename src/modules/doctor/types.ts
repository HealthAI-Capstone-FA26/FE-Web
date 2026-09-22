export interface PatientEMR {
  id: string;
  encounterId?: string;
  encounterCode?: string;
  patientCode?: string;
  arrivedAt?: string;
  appointmentId?: string;
  patientId?: string;
  status?: string;
  name: string;
  age: number;
  gender: 'Nam' | 'Nữ';
  dob: string;
  phone: string;
  cccd: string;
  bhyt: string;
  bloodType: string;
  allergies: string;
  history: string;
  symptoms: string;
  hasVitals?: boolean;
  vitals?: {
    bp?: string;
    hr?: number;
    spo2?: number;
    temp?: number;
  };
  aiSummary: string;
  aiSourceRef: string;
  aiProposedDiag: string;
  aiConfidence: string;
  initialClinicalNote: string;
  initialDoctorDiag: string;
}

export type PatientWorkflowState = 'initial' | 'ordered' | 'paid' | 'completed';
