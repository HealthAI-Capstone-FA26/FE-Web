import React from 'react';
import { CreditCard, FileText, XCircle } from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { ReceptionBillingView } from './ReceptionBillingView';

export const ReceptionBillingWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'billing-pending',
      label: 'Thu Phí & Thanh Toán',
      icon: CreditCard,
      component: <ReceptionBillingView filterStatus="pending" />,
    },
    {
      id: 'invoices-paid',
      label: 'Hóa Đơn Đã Thanh Toán',
      icon: FileText,
      component: <ReceptionBillingView filterStatus="paid" />,
    },
    {
      id: 'invoices-cancelled',
      label: 'Hóa Đơn Đã Hủy',
      icon: XCircle,
      component: <ReceptionBillingView filterStatus="cancelled" />,
    },
  ];

  return (
    <WorkspaceContainer
      title="Quản Lý Thu Phí & Hóa Đơn"
      subtitle="Xử lý thu phí khám/xét nghiệm, thanh toán mã QR PayOS và xuất hóa đơn PDF"
      icon={CreditCard}
      tabs={tabs}
      defaultTabId="billing-pending"
    />
  );
};
