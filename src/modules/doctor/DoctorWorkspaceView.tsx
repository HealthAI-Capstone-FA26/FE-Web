import React, { useEffect } from 'react';
import { Stethoscope, FileText, Pill } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { DoctorEMRView } from './DoctorEMRView';
import { DoctorDiagnosisView } from './DoctorDiagnosisView';
import { DoctorPrescriptionView } from './DoctorPrescriptionView';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctor/doctor.service';
import { doctorScheduleService } from '../../services/doctor/doctor-schedule.service';

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DoctorWorkspaceView: React.FC = () => {
  const { user } = useAuth();

  // Tải trước thông tin bác sĩ & lịch trực tuần hiện tại ngay khi vào bàn làm việc
  useEffect(() => {
    async function prefetchSchedule() {
      try {
        let docId = user?.doctorId;
        if (!docId) {
          const cachedDocStr = localStorage.getItem('4am_cached_doctor');
          if (cachedDocStr) {
            const cachedDoc = JSON.parse(cachedDocStr);
            docId = cachedDoc?.doctorId;
          }
        }
        if (!docId && user?.id) {
          const doc = await doctorService.getDoctorByUserId(user.id);
          if (doc) {
            docId = doc.doctorId;
            localStorage.setItem('4am_cached_doctor', JSON.stringify(doc));
          }
        }

        if (docId) {
          const monday = getMonday(new Date());
          const fromDate = toDateStr(monday);
          const sunday = new Date(monday);
          sunday.setDate(sunday.getDate() + 6);
          const toDate = toDateStr(sunday);
          const cacheKey = `4am_cached_schedules_${docId}_${fromDate}`;

          if (!sessionStorage.getItem(cacheKey)) {
            const res = await doctorScheduleService.getSchedules({
              doctorId: docId,
              from: fromDate,
              to: toDate,
            });
            if (res) {
              sessionStorage.setItem(cacheKey, JSON.stringify(res));
              sessionStorage.setItem(`4am_cached_schedules_${fromDate}`, JSON.stringify(res));
            }
          }
        }
      } catch {
        // bỏ qua
      }
    }

    prefetchSchedule();
  }, [user]);
  const tabs: WorkspaceTab[] = [
    {
      id: 'emr-ai',
      label: 'Hàng chờ & Hồ sơ EMR (Tóm tắt AI)',
      icon: Stethoscope,
      badge: '15 Ca',
      component: <DoctorEMRView />
    },
    {
      id: 'icd10-diagnosis',
      label: 'Chẩn đoán mã ICD-10',
      icon: FileText,
      component: <DoctorDiagnosisView />
    },
    {
      id: 'prescription',
      label: 'Kê đơn thuốc & Ký số',
      icon: Pill,
      component: <DoctorPrescriptionView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Bàn Làm Việc Bác Sĩ (Clinical Workspace)"
      subtitle="Quản lý danh sách hàng chờ, tóm tắt AI hồ sơ EMR, chẩn đoán ICD-10 và kê đơn ký số đồng bộ trên 1 giao diện"
      icon={Stethoscope}
      tabs={tabs}
      defaultTabId="emr-ai"
    />
  );
};
