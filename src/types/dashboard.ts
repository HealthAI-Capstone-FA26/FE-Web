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
      groupName: 'Không gian Nghiệp vụ',
      items: [
        { id: 'rec_workspace_intake', label: 'Tiếp nhận & Intake Bệnh nhân', path: '/tiep-nhan/danh-sach-cho', iconName: 'UserCheck', badge: '08 Chờ' },
        { id: 'rec_workspace_billing', label: 'Quản lý Thu phí & Hóa đơn', path: '/tiep-nhan/thu-phi', iconName: 'CreditCard', badge: '05 Chờ' }
      ]
    }
  ],
  NURSE: [
    {
      groupName: 'Không gian Nghiệp vụ',
      items: [
        { id: 'nurse_workspace_vitals', label: 'Quản lý Sinh hiệu & Cảnh báo', path: '/dieu-duong/hang-cho-sinh-hieu', iconName: 'Activity', badge: '12 Ca' }
      ]
    }
  ],
  DOCTOR: [
    {
      groupName: 'Không gian Thăm khám',
      items: [
        { id: 'doc_workspace_clinical', label: 'Bàn làm việc Bác sĩ (Clinical)', path: '/bac-si/danh-sach-kham', iconName: 'Stethoscope', badge: 'AI Integrated' }
      ]
    }
  ],
  LAB: [
    {
      groupName: 'Không gian Chẩn đoán',
      items: [
        { id: 'lab_workspace_diagnostic', label: 'Xét nghiệm & Chẩn đoán AI', path: '/xet-nghiem/hang-cho-xet-nghiem', iconName: 'FlaskConical', badge: '09 Ca' }
      ]
    }
  ],
  ADMIN: [
    {
      groupName: 'Không gian Quản trị',
      items: [
        { id: 'admin_workspace_realtime', label: 'Giám sát Realtime & Báo cáo', path: '/quan-tri/tong-quan', iconName: 'LayoutDashboard', badge: 'Live' },
        { id: 'admin_workspace_security', label: 'Bảo mật Audit & Chuẩn FHIR', path: '/quan-tri/nhat-ky-he-thong', iconName: 'ShieldCheck' }
      ]
    }
  ],
  PATIENT: [
    {
      groupName: 'Cổng Bệnh nhân',
      items: [
        { id: 'pat_workspace_intake', label: 'Hồ sơ & Khai báo Y tế', path: '/benh-nhan/ho-so', iconName: 'UserCheck', badge: 'Intake' },
        { id: 'pat_workspace_records', label: 'Lịch hẹn & Bệnh án PDF', path: '/benh-nhan/lich-hen', iconName: 'FileText' }
      ]
    }
  ]
};
