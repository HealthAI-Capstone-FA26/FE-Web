import type { UserRole } from './auth';

export interface WorkflowStep {
  stepNumber: number;
  title: string;
  shortTitle: string;
  description: string;
  assignedRole: UserRole;
  roleName: string;
  moduleName: string;
  icon: string;
}

export const SEVEN_STEPS_WORKFLOW: WorkflowStep[] = [
  {
    stepNumber: 1,
    title: 'Đăng ký & Tiếp nhận',
    shortTitle: 'Đăng ký',
    description: 'Đăng ký online hoặc trực tiếp tại quầy Lễ tân, xác minh CCCD/BHYT & chữ ký điện tử',
    assignedRole: 'RECEPTIONIST',
    roleName: 'Nhân viên Lễ tân',
    moduleName: 'Quầy tiếp đón',
    icon: 'UserCheck'
  },
  {
    stepNumber: 2,
    title: 'Kiểm tra sinh hiệu',
    shortTitle: 'Sinh hiệu',
    description: 'Đo mạch, huyết áp, nhiệt độ, nhịp thở, SpO2, BMI & cảnh báo chỉ số bất thường',
    assignedRole: 'NURSE',
    roleName: 'Điều dưỡng',
    moduleName: 'Trạm điều dưỡng',
    icon: 'Activity'
  },
  {
    stepNumber: 3,
    title: 'Khám & Gợi ý chỉ định',
    shortTitle: 'Khám sơ bộ',
    description: 'Bác sĩ khám lâm sàng, xem AI tóm tắt EMR & ra chỉ định xét nghiệm',
    assignedRole: 'DOCTOR',
    roleName: 'Bác sĩ khám',
    moduleName: 'Khám lâm sàng',
    icon: 'Stethoscope'
  },
  {
    stepNumber: 4,
    title: 'Thanh toán chi phí',
    shortTitle: 'Thanh toán',
    description: 'Tính tổng phí xét nghiệm, thanh toán VietQR / MoMo / Tiền mặt & tự động xuất hóa đơn PDF',
    assignedRole: 'RECEPTIONIST',
    roleName: 'Thu ngân / Bệnh nhân',
    moduleName: 'Quầy thu phí',
    icon: 'CreditCard'
  },
  {
    stepNumber: 5,
    title: 'Xét nghiệm phòng Lab',
    shortTitle: 'Xét nghiệm',
    description: 'Kỹ thuật viên thực hiện xét nghiệm, tải kết quả & hình ảnh cận lâm sàng',
    assignedRole: 'LAB',
    roleName: 'KTV Phòng Lab',
    moduleName: 'Phòng cận lâm sàng',
    icon: 'FlaskConical'
  },
  {
    stepNumber: 6,
    title: 'Chẩn đoán ICD-10 & Tư vấn',
    shortTitle: 'Chẩn đoán',
    description: 'Bác sĩ xem Timeline EMR, kết luận chẩn đoán theo mã bệnh ICD-10 & tư vấn điều trị',
    assignedRole: 'DOCTOR',
    roleName: 'Bác sĩ kết luận',
    moduleName: 'Kết luận & Tư vấn',
    icon: 'FileText'
  },
  {
    stepNumber: 7,
    title: 'Kê đơn, Ký số & Nhận HSBA',
    shortTitle: 'Kê đơn & HSBA',
    description: 'Kê đơn thuốc điện tử, ký số Bác sĩ & xuất bộ Hồ sơ y tế PDF',
    assignedRole: 'DOCTOR',
    roleName: 'Bác sĩ / Bệnh nhân',
    moduleName: 'Đơn thuốc & Ký số',
    icon: 'Pill'
  }
];
