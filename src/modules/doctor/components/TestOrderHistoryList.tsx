import React from 'react';
import {
  FileText, RefreshCw, Loader2, FlaskConical, Trash2,
  CheckCircle2, Clock
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import {
  AVAILABLE_TEST_CATALOG,
  type TestOrderDetail
} from '../../../services/doctor';

interface TestOrderHistoryListProps {
  existingTestOrders: TestOrderDetail[];
  isLoadingTestOrders: boolean;
  onRefreshOrders: () => void;
  cancellingItemId: string | null;
  onCancelItem: (orderItemId: string, testName: string) => void;
}

export const TestOrderHistoryList: React.FC<TestOrderHistoryListProps> = ({
  existingTestOrders,
  isLoadingTestOrders,
  onRefreshOrders,
  cancellingItemId,
  onCancelItem,
}) => {
  const renderItemStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Đã có kết quả</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-300">
            Đã hủy
          </span>
        );
      case 'in_progress':
      case 'sample_collected':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
            <span>Đang xử lý</span>
          </span>
        );
      case 'payment_pending':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Chờ thu phí</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-700" />
          <h4 className="text-sm font-extrabold text-slate-800">
            Phiếu Chỉ Định Đã Lập Của Ca Khám
          </h4>
          <Badge variant="neutral" size="sm">
            {existingTestOrders.length} phiếu
          </Badge>
        </div>

        <button
          type="button"
          onClick={onRefreshOrders}
          disabled={isLoadingTestOrders}
          className="text-xs font-bold text-slate-500 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-transparent border-none p-1"
          title="Làm mới danh sách phiếu chỉ định"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTestOrders ? 'animate-spin text-blue-600' : ''}`} />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {isLoadingTestOrders ? (
        <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Đang tải danh sách phiếu chỉ định...</span>
        </div>
      ) : existingTestOrders.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-1">
          <FlaskConical className="w-6 h-6 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-600">Chưa có phiếu chỉ định cận lâm sàng nào</p>
          <p className="text-[11px] text-slate-400">
            Bác sĩ chọn các dịch vụ xét nghiệm ở trên và nhấn "Xác nhận Chỉ định" để tạo phiếu mới.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {existingTestOrders.map((order) => (
            <div
              key={order.orderId}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-xs text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded">
                    {order.orderCode}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Lập lúc: {new Date(order.orderedAt).toLocaleTimeString('vi-VN')} {new Date(order.orderedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {order.notes && (
                  <div className="text-[11px] text-slate-600 italic">
                    Ghi chú: "{order.notes}"
                  </div>
                )}
              </div>

              {/* Items in this order */}
              <div className="space-y-2">
                {order.items?.map((item) => {
                  const catalogMatch = AVAILABLE_TEST_CATALOG.find(
                    (c) => c.testTypeId === item.testTypeId
                  );
                  const testName = item.testType?.testName || catalogMatch?.testName || 'Xét nghiệm';
                  const testCode = item.testType?.testCode || catalogMatch?.testCode || '---';
                  const room = catalogMatch?.room;
                  const isCancelable = item.status === 'payment_pending' || item.status === 'pending';
                  const isCancelling = cancellingItemId === item.orderItemId;

                  return (
                    <div
                      key={item.orderItemId}
                      className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span>{testName}</span>
                          {item.wasAiSuggested && (
                            <span className="text-[8px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded font-bold border border-purple-200">
                              AI Gợi ý
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Mã: <span className="font-mono text-slate-600">{testCode}</span>
                          {room && ` • ${room}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="font-mono font-bold text-slate-700 text-xs">
                          {item.unitPrice.toLocaleString('vi-VN')} đ
                        </span>

                        {renderItemStatusBadge(item.status)}

                        {isCancelable && (
                          <button
                            type="button"
                            disabled={isCancelling}
                            onClick={() => onCancelItem(item.orderItemId, testName)}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 cursor-pointer flex items-center gap-1 transition-colors"
                            title="Hủy chỉ định xét nghiệm này"
                          >
                            {isCancelling ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            <span>Hủy</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
