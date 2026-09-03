import type { UserRole } from './auth';

export interface TabNavItem {
  id: string;
  label: string;
  iconName: string;
  path: string;
  badge?: string;
  moduleTag?: string;
  requiredPermission?: string;
}

export interface NavGroup {
  groupName: string;
  items: TabNavItem[];
}

const receptionNavGroups: NavGroup[] = [
  {
    groupName: 'Nghiệp vụ Tiếp nhận',
    items: [
      { id: 'rec_workspace_checkin', label: 'Tiếp nhận & Đăng ký quầy', path: '/tiep-nhan/danh-sach-cho', iconName: 'UserCheck', badge: '08 Chờ', requiredPermission: 'queue-ticket:read:all' },
      { id: 'rec_workspace_patients', label: 'Khai báo & Tra cứu Hồ sơ', path: '/tiep-nhan/benh-nhan', iconName: 'Users', requiredPermission: 'patient:read:all' },
      { id: 'rec_workspace_billing', label: 'Quản lý Thu phí & Hóa đơn', path: '/tiep-nhan/thu-phi', iconName: 'CreditCard', badge: '05 Chờ', requiredPermission: 'claim:read:all' }
    ]
  }
];

export const ROLE_DEFAULT_PATHS: Record<UserRole, string> = {
  PATIENT: '/benh-nhan/ho-so',
  RECEPTIONIST: '/tiep-nhan/danh-sach-cho',
  NURSE: '/dieu-duong/hang-cho-sinh-hieu',
  DOCTOR: '/bac-si/danh-sach-kham',
  LAB: '/xet-nghiem/hang-cho-xet-nghiem',
  ADMIN: '/quan-tri/tong-quan'
};

export const ROLE_NAV_CONFIG: Record<UserRole, NavGroup[]> = {
  RECEPTIONIST: receptionNavGroups,
  NURSE: [
    {
      groupName: 'Không gian Nghiệp vụ',
      items: [
        { id: 'nurse_workspace_vitals', label: 'Quản lý Sinh hiệu & Cảnh báo', path: '/dieu-duong/hang-cho-sinh-hieu', iconName: 'Activity', badge: '12 Ca', requiredPermission: 'observation:read:all' }
      ]
    }
  ],
  DOCTOR: [
    {
      groupName: 'Không gian Thăm khám',
      items: [
        { id: 'doc_workspace_clinical', label: 'Bàn làm việc Bác sĩ (Clinical)', path: '/bac-si/danh-sach-kham', iconName: 'Stethoscope', badge: 'AI Integrated', requiredPermission: 'encounter:read:all' }
      ]
    }
  ],
  LAB: [
    {
      groupName: 'Không gian Chẩn đoán',
      items: [
        { id: 'lab_workspace_diagnostic', label: 'Xét nghiệm & Chẩn đoán AI', path: '/xet-nghiem/hang-cho-xet-nghiem', iconName: 'FlaskConical', badge: '09 Ca', requiredPermission: 'imaging-study:read:all' }
      ]
    }
  ],
  ADMIN: [
    {
      groupName: 'Không gian Quản trị',
      items: [
        { id: 'admin_workspace_realtime', label: 'Quản lý', path: '/quan-tri/tong-quan', iconName: 'LayoutDashboard', requiredPermission: 'user:read:all' },
        { id: 'admin_workspace_security', label: 'Bảo mật', path: '/quan-tri/nhat-ky-he-thong', iconName: 'ShieldCheck', requiredPermission: 'security-config:read:all' }
      ]
    }
  ],
  PATIENT: [
    {
      groupName: 'Cổng Bệnh nhân',
      items: [
        { id: 'pat_workspace_profile', label: 'Hồ sơ khách hàng', path: '/benh-nhan/ho-so', iconName: 'UserCheck', requiredPermission: 'patient:read:own' },
        { id: 'pat_workspace_medical', label: 'Hồ sơ Y tế & Tiền sử', path: '/benh-nhan/ho-so-y-te', iconName: 'FileText', badge: 'HL7 FHIR', requiredPermission: 'patient:read:own' },
        { id: 'pat_workspace_submission', label: 'Khai báo & Nộp dữ liệu', path: '/benh-nhan/trieu-chung', iconName: 'Activity', requiredPermission: 'observation:create:own' },
        { id: 'pat_workspace_records', label: 'Lịch hẹn & Bệnh án PDF', path: '/benh-nhan/lich-hen', iconName: 'Calendar', requiredPermission: 'appointment:read:own' }
      ]
    }
  ]
};
