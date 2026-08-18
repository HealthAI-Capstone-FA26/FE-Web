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
    assignedRole: 'RECEPTION',
    roleName: 'Nhân viên Lễ tân',
    moduleName: 'Mô-đun 2 & 3',
    icon: 'UserCheck'
  },
  {
    stepNumber: 2,
    title: 'Kiểm tra sinh hiệu',
    shortTitle: 'Sinh hiệu',
    description: 'Đo mạch, huyết áp, nhiệt độ, nhịp thở, SpO2, BMI & cảnh báo chỉ số bất thường',
    assignedRole: 'NURSE',
    roleName: 'Điều dưỡng',
    moduleName: 'Mô-đun 4',
    icon: 'Activity'
  },
  {
    stepNumber: 3,
    title: 'Khám & Gợi ý chỉ định',
    shortTitle: 'Khám sơ bộ',
    description: 'Bác sĩ khám lâm sàng, xem AI tóm tắt EMR (AI01), xem AI khoanh vùng ảnh (AI02) & ra chỉ định xét nghiệm',
    assignedRole: 'DOCTOR',
    roleName: 'Bác sĩ khám',
    moduleName: 'Mô-đun 5',
    icon: 'Stethoscope'
  },
  {
    stepNumber: 4,
    title: 'Thanh toán chi phí',
    shortTitle: 'Thanh toán',
    description: 'Tính tổng phí xét nghiệm, thanh toán VietQR / MoMo / Tiền mặt & tự động xuất hóa đơn PDF',
    assignedRole: 'RECEPTION',
    roleName: 'Thu ngân / Bệnh nhân',
    moduleName: 'Mô-đun 6',
    icon: 'CreditCard'
  },
  {
    stepNumber: 5,
    title: 'Xét nghiệm phòng Lab',
    shortTitle: 'Xét nghiệm',
    description: 'Kỹ thuật viên thực hiện xét nghiệm, upload ảnh X-quang/MRI & AI phân tích khoanh vùng rủi ro',
    assignedRole: 'LAB',
    roleName: 'KTV Phòng Lab',
    moduleName: 'Mô-đun 7',
    icon: 'FlaskConical'
  },
  {
    stepNumber: 6,
    title: 'Chẩn đoán ICD-10 & Duyệt AI',
    shortTitle: 'Chẩn đoán',
    description: 'Bác sĩ xem Timeline EMR, duyệt đề xuất chẩn đoán AI theo mã bệnh ICD-10 & tư vấn điều trị',
    assignedRole: 'DOCTOR',
    roleName: 'Bác sĩ kết luận',
    moduleName: 'Mô-đun 8',
    icon: 'FileText'
  },
  {
    stepNumber: 7,
    title: 'Kê đơn, Ký số & Nhận HSBA',
    shortTitle: 'Kê đơn & HSBA',
    description: 'Kê đơn thuốc điện tử, kiểm tra tương tác thuốc, ký số Bác sĩ & xuất bộ Hồ sơ y tế PDF',
    assignedRole: 'DOCTOR',
    roleName: 'Bác sĩ / Bệnh nhân',
    moduleName: 'Mô-đun 9',
    icon: 'Pill'
  }
];
