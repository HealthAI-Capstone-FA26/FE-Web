import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { UserCheck, FileText, ShieldAlert, Calendar } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { NurseQueueView, type NurseDateFilterMode } from './NurseQueueView';
import { NurseVitalAlertsView } from './NurseVitalAlertsView';

export const NurseWorkspaceView: React.FC = () => {
  const location = useLocation();

  // Bộ lọc ngày dùng chung cho Workspace Điều dưỡng (mặc định 'today')
  const [dateFilterMode, setDateFilterMode] = useState<NurseDateFilterMode>('today');
  const [customDate, setCustomDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const defaultTabId = useMemo(() => {
    if (location.pathname.includes('canh-bao')) {
      return 'vital-alerts';
    }
    return 'patient-records';
  }, [location.pathname]);

  const tabs: WorkspaceTab[] = useMemo(() => [
    {
      id: 'patient-records',
      label: 'Hồ sơ hàng chờ sinh hiệu',
      icon: FileText,
      component: (
        <NurseQueueView
          dateFilterMode={dateFilterMode}
          customDate={customDate}
        />
      ),
    },
    {
      id: 'vital-alerts',
      label: 'Cảnh báo sinh hiệu & Tra cứu ngưỡng',
      icon: ShieldAlert,
      component: <NurseVitalAlertsView />,
    },
  ], [dateFilterMode, customDate]);

  // Cụm lọc ngày nhỏ gọn đặt ngay cạnh nút "Làm mới" trên Header
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
            onClick={() => setDateFilterMode(m.key as NurseDateFilterMode)}
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
      title="Trạm Tiếp Nhận & Đo Sinh Hiệu Điều Dưỡng"
      subtitle="Tiếp nhận bệnh nhân từ quầy Lễ tân, ghi nhận sinh hiệu và theo dõi cảnh báo bất thường trước khi vào khám Bác sĩ"
      icon={UserCheck}
      tabs={tabs}
      defaultTabId={defaultTabId}
      actions={dateFilterAction}
    />
  );
};

export default NurseWorkspaceView;
