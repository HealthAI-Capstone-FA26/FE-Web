import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Stethoscope, FileText, Pill, Activity, Calendar } from 'lucide-react';
import { EcgWorkspacePage } from '../lab/ecg/EcgWorkspacePage';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { DoctorEMRView, type DoctorDateFilterMode } from './DoctorEMRView';
import { DoctorDiagnosisView } from './DoctorDiagnosisView';
import { DoctorPrescriptionView } from './DoctorPrescriptionView';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctor/doctor.service';
import { doctorScheduleService } from '../../services/doctor/doctor-schedule.service';
import { encounterService } from '../../services/encounter/encounter.service';

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

  // Quản lý bộ lọc mốc ngày khám (hiển thị nhỏ ở cạnh nút Làm mới)
  const [dateFilterMode, setDateFilterMode] = useState<DoctorDateFilterMode>('today');
  const [customDate, setCustomDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const dateParams = useMemo(() => {
    let params: { date?: string; from?: string; to?: string } = {};
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (dateFilterMode === 'today') {
      params = { date: todayStr };
    } else if (dateFilterMode === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yesterdayStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
      params = { date: yesterdayStr };
    } else if (dateFilterMode === '7days') {
      const s = new Date();
      s.setDate(s.getDate() - 6);
      const sevenDaysAgoStr = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`;
      params = { from: sevenDaysAgoStr, to: todayStr };
    } else if (dateFilterMode === 'custom' && customDate) {
      params = { date: customDate };
    }
    return params;
  }, [dateFilterMode, customDate]);

  // Đếm số ca khám theo mốc ngày đã chọn từ API để hiển thị lên huy hiệu tab
  const [encounterCount, setEncounterCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCount() {
      try {
        const data = await encounterService.getEncounters({
          ...(user?.doctorId ? { doctorId: user.doctorId } : {}),
          ...dateParams,
        });
        if (Array.isArray(data)) {
          setEncounterCount(data.length);
        }
      } catch {
        // bỏ qua
      }
    }
    fetchCount();
  }, [user?.doctorId, dateParams]);

  const [, setSearchParams] = useSearchParams();

  const handleNavigateTab = useCallback((tabId: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    });
  }, [setSearchParams]);

  const tabs: WorkspaceTab[] = useMemo(() => [
    {
      id: 'emr-ai',
      label: 'Hàng chờ & Hồ sơ',
      icon: Stethoscope,
      badge: encounterCount !== null ? `${String(encounterCount).padStart(2, '0')} Ca` : undefined,
      component: (
        <DoctorEMRView
          onNavigateTab={handleNavigateTab}
          dateFilterMode={dateFilterMode}
          customDate={customDate}
        />
      )
    },
    {
      id: 'icd10-diagnosis',
      label: 'Chuẩn đoán bệnh ',
      icon: FileText,
      component: (
        <DoctorDiagnosisView
          onNavigateTab={handleNavigateTab}
          dateFilterMode={dateFilterMode}
          customDate={customDate}
        />
      )
    },
    {
      id: 'prescription',
      label: 'Kê đơn thuốc & Ký số',
      icon: Pill,
      component: (
        <DoctorPrescriptionView
          onNavigateTab={handleNavigateTab}
          dateFilterMode={dateFilterMode}
          customDate={customDate}
        />
      )
    },
    {
      id: 'ecg-review',
      label: 'Điện tâm đồ ECG & AI Review',
      icon: Activity,
      badge: 'AI',
      component: <EcgWorkspacePage defaultMode="review" />
    }
  ], [encounterCount, handleNavigateTab, dateFilterMode, customDate]);

  // Cụm lọc ngày nhỏ gọn đặt ngay cạnh nút "Làm mới"
  const dateFilterAction = (
    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/90 shadow-2xs text-xs">
      <div className="flex items-center gap-1 px-1.5 text-slate-500 font-semibold text-[11px] shrink-0">
        <Calendar className="w-3.5 h-3.5 text-blue-600" />
      </div>
      {[
        { key: 'today', label: 'Hôm nay' },
        { key: 'yesterday', label: 'Hôm qua' },
        { key: '7days', label: '7 ngày' },
        { key: 'all', label: 'Tất cả' },
        { key: 'custom', label: 'Chọn ngày' },
      ].map((m) => {
        const isSelected = dateFilterMode === m.key;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => setDateFilterMode(m.key as DoctorDateFilterMode)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-xs shrink-0 ${
              isSelected
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {m.label}
          </button>
        );
      })}
      {dateFilterMode === 'custom' && (
        <input
          type="date"
          value={customDate}
          onChange={(e) => setCustomDate(e.target.value)}
          className="ml-1 px-1.5 py-0.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 font-medium outline-none focus:border-blue-600"
        />
      )}
    </div>
  );

  return (
    <WorkspaceContainer
      title="Bàn Làm Việc Bác Sĩ (Clinical Workspace)"
      subtitle="Quản lý danh sách hàng chờ, tóm tắt AI hồ sơ EMR, chẩn đoán ICD-10 và kê đơn ký số đồng bộ trên 1 giao diện"
      icon={Stethoscope}
      tabs={tabs}
      defaultTabId="emr-ai"
      actions={dateFilterAction}
    />
  );
};
