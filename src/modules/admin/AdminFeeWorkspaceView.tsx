import React, { useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Coins, Receipt, FlaskConical } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { AdminExaminationFeesView } from './AdminExaminationFeesView';
import { AdminServiceCatalogFeesView } from './AdminServiceCatalogFeesView';

export const AdminFeeWorkspaceView: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTabFromUrl = searchParams.get('tab');

  const defaultTab = useMemo(() => {
    if (activeTabFromUrl === 'service-fees' || location.pathname.includes('xet-nghiem')) {
      return 'service-fees';
    }
    return 'examination-fees';
  }, [activeTabFromUrl, location.pathname]);

  const tabs: WorkspaceTab[] = [
    {
      id: 'examination-fees',
      label: 'Mức Phí Khám Ban Đầu',
      icon: Receipt,
      component: <AdminExaminationFeesView />,
    },
    {
      id: 'service-fees',
      label: 'Biểu Phí Xét Nghiệm & CĐHA',
      icon: FlaskConical,
      badge: 'Cận lâm sàng',
      component: <AdminServiceCatalogFeesView />,
    },
  ];

  return (
    <WorkspaceContainer
      title="Quản Lý Biểu Phí & Bảng Giá Viện Phí"
      subtitle="Quản lý toàn bộ danh mục mức giá khám ban đầu của các chuyên khoa và biểu phí các dịch vụ cận lâm sàng (xét nghiệm máu, điện tâm đồ, X-quang, siêu âm tim)"
      icon={Coins}
      tabs={tabs}
      defaultTabId={defaultTab}
    />
  );
};

export default AdminFeeWorkspaceView;

