import type { LabTaskExceptionDecision, LabTaskExceptionReason } from '../types/lab-exception';

export type LabTaskStatusKey =
  | 'payment_pending'
  | 'ready'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export interface LabTaskStatusMeta {
  key: LabTaskStatusKey;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
}

export const LAB_TASK_STATUS_META: Record<LabTaskStatusKey, LabTaskStatusMeta> = {
  payment_pending: {
    key: 'payment_pending',
    label: 'Chờ thanh toán',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-300',
    dotColor: 'bg-slate-400',
    description: 'Chỉ định chưa được thanh toán tại quầy thu ngân',
  },
  ready: {
    key: 'ready',
    label: 'Chờ lấy mẫu',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-500',
    description: 'Đã thanh toán, sẵn sàng để KTV tiếp nhận mẫu',
  },
  in_progress: {
    key: 'in_progress',
    label: 'Đang thực hiện',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    dotColor: 'bg-blue-600',
    description: 'KTV đã nhận mẫu, đang đo đạc và nhập chỉ số EMR',
  },
  on_hold: {
    key: 'on_hold',
    label: 'Chờ bác sĩ xử lý',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    dotColor: 'bg-amber-500',
    description: 'Nhiệm vụ gặp sự cố, tạm dừng chờ bác sĩ chỉ định quyết định Thử lại / Huỷ',
  },
  completed: {
    key: 'completed',
    label: 'Đã có kết quả',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    dotColor: 'bg-emerald-600',
    description: 'Đã hoàn tất xét nghiệm và cập nhật hồ sơ bệnh án EMR',
  },
  cancelled: {
    key: 'cancelled',
    label: 'Đã huỷ',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-500',
    badgeBorder: 'border-slate-300',
    dotColor: 'bg-slate-400',
    description: 'Chỉ định đã bị huỷ bởi bác sĩ hoặc hệ thống',
  },
};

export interface ExceptionReasonConfig {
  code: LabTaskExceptionReason;
  title: string;
  description: string;
  quickChips: string[];
  suggestedDecision: LabTaskExceptionDecision;
}

export const EXCEPTION_REASONS_CONFIG: Record<LabTaskExceptionReason, ExceptionReasonConfig> = {
  specimen_rejected: {
    code: 'specimen_rejected',
    title: 'Mẫu bị từ chối',
    description: 'Tan huyết, đông, thiếu thể tích, sai ống hoặc nhãn không khớp',
    quickChips: [
      'Mẫu tan huyết (Hemolysis)',
      'Mẫu đông sợi huyết',
      'Thiếu thể tích mẫu',
      'Sai loại ống nghiệm / chất chống đông',
      'Nhãn mẫu không khớp bệnh nhân',
    ],
    suggestedDecision: 'retry',
  },
  patient_unavailable: {
    code: 'patient_unavailable',
    title: 'Bệnh nhân vắng',
    description: 'Bệnh nhân đã về, chuyển viện hoặc từ chối thực hiện',
    quickChips: [
      'Bệnh nhân đã ra về',
      'Bệnh nhân từ chối lấy mẫu',
      'Bệnh nhân chuyển viện cấp cứu',
      'Gọi loa 3 lần không có mặt',
    ],
    suggestedDecision: 'cancel',
  },
  duplicate_order: {
    code: 'duplicate_order',
    title: 'Trùng chỉ định',
    description: 'Trùng với chỉ định đã thực hiện hoặc đang xử lý cùng lượt khám',
    quickChips: [
      'Trùng xét nghiệm vừa làm trong ngày',
      'Bác sĩ lập trùng 2 phiếu cùng loại',
      'Đã có kết quả gần nhất còn hiệu lực',
    ],
    suggestedDecision: 'cancel',
  },
  equipment_failure: {
    code: 'equipment_failure',
    title: 'Sự cố thiết bị',
    description: 'Máy hỏng hóc, lỗi hiệu chuẩn hoặc hết hoá chất xét nghiệm',
    quickChips: [
      'Máy hỏng đang chờ bảo trì',
      'Lỗi hiệu chuẩn (Calibration fail)',
      'Hết hoá chất xét nghiệm',
      'Mất kết nối máy LIS',
    ],
    suggestedDecision: 'retry',
  },
  other: {
    code: 'other',
    title: 'Lý do khác',
    description: 'Các sự cố phát sinh khác (bắt buộc nhập mô tả cụ thể)',
    quickChips: [
      'Ống mẫu bị vỡ trong quá trình vận chuyển',
      'Nguồn điện phòng xét nghiệm gián đoạn',
      'Cần bác sĩ hội chẩn lại quy trình lấy mẫu',
    ],
    suggestedDecision: 'retry',
  },
};

export const EXCEPTION_MESSAGES = {
  MSG25: 'Nhiệm vụ không ở trạng thái chờ xử lý sự cố. Vui lòng tải lại.',
  REPORT_INVALID_STATE: (stateLabel: string) =>
    `Không thể báo sự cố: nhiệm vụ đang ở trạng thái ${stateLabel}.`,
  CONFLICT_ALREADY_RESOLVED:
    'Chỉ định vừa được xử lý bởi người khác (trạng thái hiện tại đã thay đổi). Đã tải lại dữ liệu.',
  MISSING_REASON: 'Vui lòng chọn lý do sự cố.',
  OTHER_MISSING_DETAIL: 'Vui lòng mô tả chi tiết khi chọn "Lý do khác".',
  CANCEL_MISSING_NOTE: 'Vui lòng nhập lý do huỷ chỉ định.',
  MAX_LENGTH_255: 'Tối đa 255 ký tự.',
} as const;

export function getLabTaskStatusMeta(status?: string | null): LabTaskStatusMeta {
  if (!status) return LAB_TASK_STATUS_META.ready;
  const key = status as LabTaskStatusKey;
  return LAB_TASK_STATUS_META[key] ?? {
    key: 'ready',
    label: status,
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    dotColor: 'bg-slate-400',
    description: status,
  };
}

