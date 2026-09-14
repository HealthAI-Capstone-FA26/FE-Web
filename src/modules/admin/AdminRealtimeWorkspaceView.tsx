import React from 'react';
import { Users, Stethoscope, HeartPulse, CalendarDays, Coins } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { AdminDoctorsView } from './AdminDoctorsView';
import { AdminDoctorSchedulesView } from './AdminDoctorSchedulesView';
import { AdminUsersView } from './AdminUsersView';
import { ReceptionPatientsView } from '../reception/ReceptionPatientsView';
import { AdminExaminationFeesView } from './AdminExaminationFeesView';

export const AdminRealtimeWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'user-management',
      label: 'Quản Lý Tài Khoản',
      icon: Users,
      component: <AdminUsersView />
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

  return (
    <WorkspaceContainer
      title="Quản Trị Hệ Thống (Admin Workspace)"
      subtitle="Quản lý toàn bộ tài khoản người dùng, bác sĩ, lịch làm việc, hồ sơ bệnh nhân và danh mục bảng giá phí khám bệnh"
      icon={Users}
      tabs={tabs}
      defaultTabId="user-management"
    />
  );
};


