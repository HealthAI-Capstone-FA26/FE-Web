import React from 'react';
import { useLocation } from 'react-router-dom';
import { Users, Stethoscope, HeartPulse, CalendarDays, Coins, Building2, GitFork } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { AdminDoctorsView } from './AdminDoctorsView';
import { AdminDoctorSchedulesView } from './AdminDoctorSchedulesView';
import { AdminUsersView } from './AdminUsersView';
import { ReceptionPatientsView } from '../reception/ReceptionPatientsView';
import { AdminExaminationFeesView } from './AdminExaminationFeesView';
import { LabRoomsView } from '../lab/LabRoomsView';
import { AdminStaffDepartmentsView } from './AdminStaffDepartmentsView';

export const AdminRealtimeWorkspaceView: React.FC = () => {
  const location = useLocation();

  const tabs: WorkspaceTab[] = [
    {
      id: 'user-management',
      label: 'Quản Lý Tài Khoản',
      icon: Users,
      component: <AdminUsersView />
    },
    {
      id: 'staff-departments',
      label: 'Phân Bổ Khoa Điều Dưỡng',
      icon: GitFork,
      component: <AdminStaffDepartmentsView />
    },
    {
      id: 'lab-rooms',
      label: 'Phòng lab',
      icon: Building2,
      component: <LabRoomsView />
    },
    {
      id: 'doctor-management',
      label: 'Quản Lý Bác Sĩ',
      icon: Stethoscope,
      component: <AdminDoctorsView />
    },
    {
      id: 'doctor-schedules',
      label: 'Lịch Làm Của Bác Sĩ',
      icon: CalendarDays,
      component: <AdminDoctorSchedulesView />
    },
    {
      id: 'patient-management',
      label: 'Quản Lý Bệnh Nhân',
      icon: HeartPulse,
      component: <ReceptionPatientsView />
    },
    {
      id: 'examination-fees',
      label: 'Danh Mục Mức Phí Khám',
      icon: Coins,
      component: <AdminExaminationFeesView />
    }
  ];

  const defaultTab = location.pathname.includes('/quan-tri/phong-lab') ? 'lab-rooms' : 'user-management';

  return (
    <WorkspaceContainer
      title="Quản Trị Hệ Thống (Admin Workspace)"
      subtitle="Quản lý toàn bộ tài khoản người dùng, phân công phòng Lab & KTV, bác sĩ, lịch làm việc, hồ sơ bệnh nhân và danh mục bảng giá phí khám bệnh"
      icon={Users}
      tabs={tabs}
      defaultTabId={defaultTab}
    />
  );
};


