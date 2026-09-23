import React from 'react';
import { CalendarDays } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { DoctorScheduleView } from './DoctorScheduleView';

export const DoctorScheduleWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'my-schedule',
      label: 'Lịch Ca Trực Của Tôi',
      icon: CalendarDays,
      component: <DoctorScheduleView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Lịch Phân Công Ca Trực Bác Sĩ"
      subtitle="Theo dõi thời khóa biểu ca trực tuần, chuyên khoa công tác, vị trí phòng khám và danh sách slot khám chi tiết"
      icon={CalendarDays}
      tabs={tabs}
      defaultTabId="my-schedule"
    />
  );
};

export default DoctorScheduleWorkspaceView;
