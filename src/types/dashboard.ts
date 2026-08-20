import type { UserRole } from './auth';

export interface TabNavItem {
  id: string;
  label: string;
  iconName: string;
  path: string;
  badge?: string;
  moduleTag?: string;
}

export interface NavGroup {
  groupName: string;
  items: TabNavItem[];
}

export const ROLE_DEFAULT_PATHS: Record<UserRole, string> = {
  PATIENT: '/benh-nhan/lich-hen',
  RECEPTION: '/tiep-nhan/danh-sach-cho',
  NURSE: '/dieu-duong/hang-cho-sinh-hieu',
  DOCTOR: '/bac-si/danh-sach-kham',
  LAB: '/xet-nghiem/hang-cho-xet-nghiem',
  ADMIN: '/quan-tri/tong-quan'
};

export const ROLE_NAV_CONFIG: Record<UserRole, NavGroup[]> = {
  RECEPTION: [
    {
      groupName: 'Tiếp nhận & Check-in',
      items: [
        { id: 'rec_checkin', label: 'Tiếp nhận & Check-in', path: '/tiep-nhan/danh-sach-cho', iconName: 'UserCheck', badge: '08 Chờ' },
        { id: 'rec_patients', label: 'Quản lý Hồ sơ Bệnh nhân', path: '/tiep-nhan/benh-nhan', iconName: 'Users' },
        { id: 'rec_patient_form', label: 'Tạo mới Hồ sơ Bệnh nhân', path: '/tiep-nhan/ho-so-benh-nhan', iconName: 'UserPlus' },
        { id: 'rec_booking', label: 'Đăng ký khám tại quầy', path: '/tiep-nhan/dang-ky-tai-quay', iconName: 'UserPlus' },
        { id: 'rec_symptom_intake', label: 'Khai báo triệu chứng', path: '/tiep-nhan/trieu-chung-benh-nhan', iconName: 'Activity' },
        { id: 'rec_queue', label: 'Hàng chờ phòng khám', path: '/tiep-nhan/hang-cho-phong-kham', iconName: 'Activity' }
      ]
    },
    {
      groupName: 'Thu phí & Hóa đơn',
      items: [
        { id: 'rec_billing', label: 'Thu phí & Mã VietQR', path: '/tiep-nhan/thu-phi', iconName: 'CreditCard', badge: '05 Chờ' },
        { id: 'rec_invoice', label: 'Xuất hóa đơn PDF', path: '/tiep-nhan/ho-don', iconName: 'FileText' }
      ]
    }
  ],
  NURSE: [
    {
      groupName: 'Kiểm tra Sinh hiệu',
      items: [
        { id: 'nurse_vitals_queue', label: 'Hàng chờ đo sinh hiệu', path: '/dieu-duong/hang-cho-sinh-hieu', iconName: 'Users', badge: '12 Ca' },
        { id: 'nurse_vitals_input', label: 'Nhập sinh hiệu & BMI', path: '/dieu-duong/nhap-sinh-hieu', iconName: 'Activity', badge: 'Realtime' }
      ]
    },
    {
      groupName: 'Cảnh báo & An toàn',
      items: [
        { id: 'nurse_alerts', label: 'Cảnh báo sinh hiệu', path: '/dieu-duong/canh-bao', iconName: 'AlertTriangle', badge: '03 Gấp' }
      ]
    }
  ],
  DOCTOR: [
    {
      groupName: 'Thăm khám & Khám sơ bộ',
      items: [
        { id: 'doc_emr_ai', label: 'Hồ sơ EMR & Tóm tắt AI', path: '/bac-si/danh-sach-kham', iconName: 'Stethoscope', badge: 'AI Integrated' },
        { id: 'doc_queue', label: 'Hàng chờ bệnh nhân', path: '/bac-si/hang-cho-kham', iconName: 'Users', badge: '15 Ca' }
      ]
    },
    {
      groupName: 'Chẩn đoán & Kê đơn',
      items: [
        { id: 'doc_icd10', label: 'Chẩn đoán mã ICD-10', path: '/bac-si/kham-benh', iconName: 'FileText' },
        { id: 'doc_prescription', label: 'Kê đơn thuốc & Ký số', path: '/bac-si/ke-don', iconName: 'Pill' }
      ]
    }
  ],
  LAB: [
    {
      groupName: 'Xét nghiệm Phòng Lab',
      items: [
        { id: 'lab_orders', label: 'Chỉ định xét nghiệm', path: '/xet-nghiem/hang-cho-xet-nghiem', iconName: 'FlaskConical', badge: '09 Ca' },
        { id: 'lab_upload', label: 'Upload ảnh DICOM & AI', path: '/xet-nghiem/upload-dicom', iconName: 'FileText' }
      ]
    },
    {
      groupName: 'An toàn & Cảnh báo',
      items: [
        { id: 'lab_alerts', label: 'Cảnh báo chỉ số nguy hiểm', path: '/xet-nghiem/canh-bao', iconName: 'AlertCircle', badge: '02 Ca' }
      ]
    }
  ],
  ADMIN: [
    {
      groupName: 'Giám sát Realtime',
      items: [
        { id: 'admin_monitor', label: 'Dashboard Realtime 7 bước', path: '/quan-tri/tong-quan', iconName: 'LayoutDashboard', badge: 'Live' },
        { id: 'admin_reports', label: 'Báo cáo thời gian chờ', path: '/quan-tri/bao-cao', iconName: 'Activity' }
      ]
    },
    {
      groupName: 'Bảo mật & Chuẩn FHIR',
      items: [
        { id: 'admin_audit', label: 'Nhật ký Audit Log', path: '/quan-tri/nhat-ky-he-thong', iconName: 'ShieldCheck' },
        { id: 'admin_fhir', label: 'Rà soát dữ liệu FHIR', path: '/quan-tri/fhir-log', iconName: 'Sparkles' }
      ]
    }
  ],
  PATIENT: [
    {
      groupName: 'Thu thập thông tin (Intake)',
      items: [
        { id: 'pat_profile_form', label: 'Hồ sơ cá nhân (FR-2.1)', path: '/benh-nhan/ho-so', iconName: 'User' },
        { id: 'pat_consent', label: 'Đồng ý dữ liệu & AI (FR-2.5)', path: '/benh-nhan/dong-y', iconName: 'ShieldCheck' },
        { id: 'pat_symptoms', label: 'Khai báo triệu chứng (FR-2.3)', path: '/benh-nhan/trieu-chung', iconName: 'Activity' },
        { id: 'pat_insurance', label: 'Thông tin BHYT (FR-2.2)', path: '/benh-nhan/bao-hiem', iconName: 'CreditCard' },
        { id: 'pat_import_fhir', label: 'Import hồ sơ FHIR (FR-2.6)', path: '/benh-nhan/nhap-ho-so', iconName: 'FileText' }
      ]
    },
    {
      groupName: 'Lịch khám & Bệnh án',
      items: [
        { id: 'pat_appointments', label: 'Lịch hẹn & Khai báo y tế', path: '/benh-nhan/lich-hen', iconName: 'Users' },
        { id: 'pat_records', label: 'Đơn thuốc & Bệnh án PDF', path: '/benh-nhan/ho-so-don-thuoc', iconName: 'Pill' }
      ]
    }
  ]
};
