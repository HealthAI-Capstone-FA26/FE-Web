import React from 'react';
import { CreditCard, FileText } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { ReceptionBillingView } from './ReceptionBillingView';

export const ReceptionBillingWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'billing-qr',
      label: 'Thu phí & Thanh toán VietQR',
      icon: CreditCard,
      badge: '05 Chờ',
      component: <ReceptionBillingView />
    },
    {
      id: 'invoices',
      label: 'Xuất Hóa đơn & Biên nhận PDF',
      icon: FileText,
      component: <ReceptionBillingView />
    }
  ];

  return (
    <WorkspaceContainer
      title="Quản Lý Thu Phí & Hóa Đơn Bệnh Viện"
      subtitle="Xử lý thu phí khám/xét nghiệm, thanh toán mã VietQR động và xuất hóa đơn PDF tiêu chuẩn"
      icon={CreditCard}
      tabs={tabs}
      defaultTabId="billing-qr"
    />
  );
};
