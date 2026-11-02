export const LAB_TASK_EXCEPTION_REASONS = [
  'specimen_rejected',
  'patient_unavailable',
  'duplicate_order',
  'equipment_failure',
  'other',
] as const;

export type LabTaskExceptionReason = (typeof LAB_TASK_EXCEPTION_REASONS)[number];

export type LabTaskExceptionDecision = 'retry' | 'cancel';

export interface ReportExceptionPayload {
  reasonCode: LabTaskExceptionReason;
  detail?: string; // detail <= 255
}

export interface ResolveExceptionPayload {
  decision: LabTaskExceptionDecision;
  reason?: string; // reason <= 255
}

export interface LabTaskExceptionInfo {
  reasonCode?: LabTaskExceptionReason | null;
  detail?: string | null;
  reportedAt?: string | null;
  reportedByUserId?: string | null;
  reportedByName?: string | null;
  resolvedDecision?: LabTaskExceptionDecision | null;
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  resolvedByName?: string | null;
  resolveNote?: string | null;
}

