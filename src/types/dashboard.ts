import type { UserRole } from './auth';

export interface TabNavItem {
  id: string;
  label: string;
  iconName: string;
  badge?: string;
  moduleTag?: string;
}

export interface NavGroup {
  groupName: string;
  items: TabNavItem[];
}

export const ROLE_NAV_CONFIG: Record<UserRole, NavGroup[]> = {
  RECEPTION: [
    {
      groupName: 'Tiếp nhận & Check-in',
      items: [
        { id: 'rec_checkin', label: 'Tiếp nhận & Check-in BHYT (Mod 3)', iconName: 'UserCheck', badge: '08 Chờ' },
        { id: 'rec_patients', label: 'Quản lý Hồ sơ Bệnh nhân', iconName: 'Users' },
        { id: 'rec_booking', label: 'Đăng ký khám tại quầy (Mod 2)', iconName: 'UserPlus' },
        { id: 'rec_queue', label: 'Quản lý Hàng chờ Phòng khám', iconName: 'Activity' }
      ]
    },
    {
      groupName: 'Thu phí & Hóa đơn',
      items: [
        { id: 'rec_billing', label: 'Thu phí & Mã VietQR (Mod 6)', iconName: 'CreditCard', badge: '05 Chờ đóng' },
        { id: 'rec_invoice', label: 'Xuất Hóa đơn PDF', iconName: 'FileText' }
      ]
    }
  ],
  NURSE: [
    {
      groupName: 'Kiểm tra Sinh hiệu',
      items: [
        { id: 'nurse_vitals_queue', label: 'Hàng chờ đo sinh hiệu (Mod 4)', iconName: 'Users', badge: '12 Ca' },
        { id: 'nurse_vitals_input', label: 'Form nhập chỉ số sinh hiệu & BMI', iconName: 'Activity', badge: 'Realtime' }
      ]
    },
    {
      groupName: 'Cảnh báo & An toàn',
      items: [
        { id: 'nurse_alerts', label: 'Cảnh báo sinh hiệu bất thường', iconName: 'AlertTriangle', badge: '03 Gấp' }
      ]
    }
  ],
  DOCTOR: [
    {
      groupName: 'Thăm khám & Khám sơ bộ',
      items: [
        { id: 'doc_emr_ai', label: 'Hồ sơ EMR & AI Tóm tắt (Mod 5)', iconName: 'Stethoscope', badge: 'AI01 & AI02' },
        { id: 'doc_queue', label: 'Hàng chờ bệnh nhân vào khám', iconName: 'Users', badge: '15 Ca' }
      ]
    },
    {
      groupName: 'Chẩn đoán & Kê đơn',
      items: [
        { id: 'doc_icd10', label: 'Timeline & Chuẩn mã ICD-10 (Mod 8)', iconName: 'FileText' },
        { id: 'doc_prescription', label: 'Kê đơn thuốc & Ký số (Mod 9)', iconName: 'Pill' }
      ]
    }
  ],
  LAB: [
    {
      groupName: 'Xét nghiệm Phòng Lab',
      items: [
        { id: 'lab_orders', label: 'Ca chỉ định xét nghiệm (Mod 7)', iconName: 'FlaskConical', badge: '09 Chỉ định' },
        { id: 'lab_upload', label: 'Upload ảnh DICOM/X-quang & AI', iconName: 'FileText' }
      ]
    },
    {
      groupName: 'An toàn & Cảnh báo',
      items: [
        { id: 'lab_alerts', label: 'Cảnh báo chỉ số nguy hiểm', iconName: 'AlertCircle', badge: '02 Cảnh báo' }
      ]
    }
  ],
  ADMIN: [
    {
      groupName: 'Giám sát Realtime',
      items: [
        { id: 'admin_monitor', label: 'Dashboard 7 bước Realtime (Mod 10)', iconName: 'LayoutDashboard', badge: 'Realtime' },
        { id: 'admin_reports', label: 'Báo cáo thời gian chờ & Tải', iconName: 'Activity' }
      ]
    },
    {
      groupName: 'Bảo mật & Chuẩn FHIR',
      items: [
        { id: 'admin_audit', label: 'Truy vết Nhật ký Audit Log', iconName: 'ShieldCheck' },
        { id: 'admin_fhir', label: 'Rà soát dữ liệu lỗi FHIR (Mod 11)', iconName: 'Sparkles' }
      ]
    }
  ],
  PATIENT: [
    {
      groupName: 'Hồ sơ Bệnh nhân',
      items: [
        { id: 'pat_appointments', label: 'Lịch hẹn & Khai báo y tế (Mod 2 & 3)', iconName: 'Users' },
        { id: 'pat_records', label: 'Đơn thuốc & Tải PDF HSBA (Mod 9)', iconName: 'Pill' }
      ]
    }
  ]
};
