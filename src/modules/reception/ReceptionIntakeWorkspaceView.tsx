import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, UserPlus, Users, CalendarCheck } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { ReceptionAppointmentsView } from './ReceptionAppointmentsView';
import { ReceptionPatientsView } from './ReceptionPatientsView';
import { ReceptionPatientProfileFormView } from './ReceptionPatientProfileFormView';
import { doctorService } from '../../services/doctor/doctor.service';
import { patientService } from '../../services/patient/patient.service';

export const ReceptionIntakeWorkspaceView: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    doctorService.getDepartments().catch(() => {});
    patientService.getAllPatients().catch(() => {});
  }, []);

  const handleSelectPatientForWalkin = (patient: any) => {
    navigate('/tiep-nhan/benh-nhan', { state: { initialPatient: patient } });
  };

  const tabs: WorkspaceTab[] = [
    {
      id: 'appointments-checkin',
      label: 'Danh sách Lịch hẹn & Check-in',
      icon: CalendarCheck,
      component: <ReceptionAppointmentsView />,
    },
    {
      id: 'patients-list',
      label: 'Danh sách bệnh nhân',
      icon: Users,
      component: (
        <ReceptionPatientsView
          onSelectPatientForWalkin={handleSelectPatientForWalkin}
        />
      ),
    },
    {
      id: 'create-profile',
      label: 'Tạo hồ sơ bệnh nhân',
      icon: UserPlus,
      component: <ReceptionPatientProfileFormView />,
    },
  ];

  return (
    <WorkspaceContainer
      title="Tiếp Nhận & Check-in Lịch Hẹn"
      subtitle="Xác nhận lịch hẹn đặt trước, thực hiện check-in và quản lý hồ sơ bệnh nhân"
      icon={UserCheck}
      tabs={tabs}
      defaultTabId="appointments-checkin"
    />
  );
};

