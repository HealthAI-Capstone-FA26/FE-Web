import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  FlaskConical,
  Loader2,
  PauseCircle,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { ResolveExceptionModal } from '../../../components/lab-exception';
import {
  type TestOrderDetail,
  type TestOrderItemDetail,
} from '../../../services/doctor';
import { labTaskService, type LabTaskItem } from '../../../services/lab/lab-task.service';
import { EXCEPTION_REASONS_CONFIG } from '../../../utils/labTaskStatus';
import { type LabTaskExceptionReason } from '../../../types/lab-exception';

interface TestOrderHistoryListProps {
  existingTestOrders: TestOrderDetail[];
  isLoadingTestOrders: boolean;
  onHoldTasks?: LabTaskItem[];
  onRefreshOrders: () => void;
  cancellingItemId: string | null;
  onCancelItem: (orderItemId: string, testName: string) => void;
  onViewResult?: () => void;
  onToast?: (type: 'success' | 'error' | 'warning', message: string) => void;
}

export const TestOrderHistoryList: React.FC<TestOrderHistoryListProps> = ({
  existingTestOrders,
  isLoadingTestOrders,
  onHoldTasks = [],
  onRefreshOrders,
  cancellingItemId,
  onCancelItem,
  onViewResult,
  onToast,
}) => {
  const [resolvingTask, setResolvingTask] = useState<LabTaskItem | null>(null);
  const [isLoadingResolveTask, setIsLoadingResolveTask] = useState(false);

  const handleOpenResolveModal = async (item: TestOrderItemDetail, order: TestOrderDetail) => {
    const taskId = item.task?.taskId || item.labTask?.taskId;
    if (!taskId) return;

    try {
      setIsLoadingResolveTask(true);
      const fullTask = await labTaskService.getLabTaskById(taskId);
      setResolvingTask(fullTask);
    } catch {
      // Fallback if GET by id is not fully populated in BE yet
      const fallbackTask: LabTaskItem = {
        id: taskId,
        labTaskId: taskId,
        orderItemId: item.orderItemId,
        labRoomId: item.task?.labRoomId || item.labTask?.labRoomId || '',
        createdAt: new Date().toISOString(),
        status: 'on_hold',
        paymentVerified: Boolean(item.task?.paymentVerified || item.labTask?.paymentVerified),
        orderItem: {
          orderItemId: item.orderItemId,
          orderId: order.orderId,
          testTypeId: item.testTypeId,
          unitPrice: item.unitPrice,
          status: item.status,
          testType: item.service
            ? {
                testTypeId: item.service.serviceId,
                testCode: item.service.serviceCode,
                testName: item.service.serviceName,
                category: 'Xét nghiệm',
                price: item.service.price,
              }
            : item.testType
            ? {
                testTypeId: item.testType.testTypeId,
                testCode: item.testType.testCode,
                testName: item.testType.testName,
                category: item.testType.category,
                price: item.testType.price,
              }
            : undefined,
          order: {
            orderId: order.orderId,
            orderCode: order.orderCode,
            orderedAt: order.orderedAt,
          },
        },
      };
      setResolvingTask(fallbackTask);
    } finally {
      setIsLoadingResolveTask(false);
    }
  };

  const renderItemStatusBadge = (item: TestOrderItemDetail) => {
    const task = item.task || item.labTask;

    // 0. Trạng thái tạm dừng chờ bác sĩ xử lý (on_hold)
    if (item.status === 'on_hold' || task?.status === 'on_hold') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 animate-pulse">
          <PauseCircle className="w-3 h-3 text-amber-600 shrink-0" />
          <span>Cần quyết định</span>
        </span>
      );
    }

    // 1. Trạng thái kết thúc hoặc đang tiến hành
    if (item.status === 'completed' || task?.status === 'completed') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Đã có kết quả</span>
        </span>
      );
    }

    if (item.status === 'cancelled' || task?.status === 'cancelled') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-300 line-through">
          Đã hủy
        </span>
      );
    }

    if (
      item.status === 'in_progress' ||
      item.status === 'sample_collected' ||
      task?.status === 'in_progress' ||
      task?.status === 'sample_collected'
    ) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
          <span>Đang thực hiện</span>
        </span>
      );
    }

    // 2. Đã thanh toán, chờ lấy mẫu (ready)
    if (task?.paymentVerified || task?.status === 'ready') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
          <span>Đã thu phí • Chờ lấy mẫu</span>
        </span>
      );
    }

    // 3. Chưa thanh toán (ordered / payment_pending / pending)
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
        <span>Chờ thu phí</span>
      </span>
    );
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
          {onHoldTasks.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
              {onHoldTasks.length} sự cố cần quyết định
            </span>
          )}
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

      {/* 🚨 PHẦN NỔI BẬT: Chỉ định cận lâm sàng bị tạm dừng sự cố cần bác sĩ quyết định */}
      {onHoldTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-200 text-amber-900 font-extrabold text-xs inline-flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-800 animate-pulse" />
                CẦN QUYẾT ĐỊNH ({onHoldTasks.length})
              </span>
              <h5 className="text-xs font-bold text-amber-950">
                Chỉ định cận lâm sàng đang tạm dừng do sự cố
              </h5>
            </div>
            <span className="text-[11px] text-amber-800 font-medium">
              Vui lòng chọn Thử lại (Lấy lại mẫu) hoặc Hủy dịch vụ
            </span>
          </div>

          <div className="space-y-2">
            {onHoldTasks.map((t) => {
              const testName =
                t.orderItem?.testType?.testName || 'Chỉ định xét nghiệm';
              const testCode =
                t.orderItem?.testType?.testCode || '---';
              const reasonCfg = t.exceptionReasonCode
                ? EXCEPTION_REASONS_CONFIG[t.exceptionReasonCode as LabTaskExceptionReason]
                : undefined;

              return (
                <div
                  key={t.id || t.labTaskId || t.orderItemId}
                  className="p-3 bg-white rounded-xl border border-amber-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        {testName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {testCode}
                      </span>
                      {reasonCfg && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                          {reasonCfg.title}
                        </span>
                      )}
                    </div>
                    {t.exceptionDetail && (
                      <p className="text-[11px] text-slate-600 italic">
                        Chi tiết từ phòng Lab: &quot;{t.exceptionDetail}&quot;
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setResolvingTask(t)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Xử lý sự cố ngay</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isLoadingTestOrders ? (
        <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Đang tải danh sách phiếu chỉ định...</span>
        </div>
      ) : existingTestOrders.length === 0 ? (
        onHoldTasks.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-1">
            <FlaskConical className="w-6 h-6 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">Chưa có phiếu chỉ định cận lâm sàng nào</p>
            <p className="text-[11px] text-slate-400">
              Bác sĩ chọn các dịch vụ xét nghiệm ở trên và nhấn &quot;Xác nhận Chỉ định&quot; để tạo phiếu mới.
            </p>
          </div>
        ) : null
      ) : (
        <div className="space-y-4">
          {existingTestOrders.map((order) => {
            const orderItems = order.items || [];
            const isOrderPaid =
              orderItems.length > 0 &&
              orderItems.every((i) => {
                const task = i.task || i.labTask;
                return (
                  i.status === 'cancelled' ||
                  task?.paymentVerified === true ||
                  task?.status === 'ready' ||
                  task?.status === 'sample_collected' ||
                  task?.status === 'in_progress' ||
                  task?.status === 'completed'
                );
              });

            return (
              <div
                key={order.orderId}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-xs text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded">
                      {order.orderCode}
                    </span>
                    {isOrderPaid ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Đã thanh toán</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Chưa thanh toán</span>
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 font-medium">
                      Lập lúc: {new Date(order.orderedAt).toLocaleTimeString('vi-VN')} {new Date(order.orderedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {order.notes && (
                    <div className="text-[11px] text-slate-600 italic">
                      Ghi chú: &quot;{order.notes}&quot;
                    </div>
                  )}
                </div>

                {/* Items in this order */}
                <div className="space-y-2">
                  {order.items?.map((item) => {
                    const testName = item.service?.serviceName || item.testType?.testName || 'Xét nghiệm';
                    const testCode = item.service?.serviceCode || item.testType?.testCode || '---';
                    const task = item.task || item.labTask;
                    const isOnHold = item.status === 'on_hold' || task?.status === 'on_hold';
                    const isPaid = Boolean(
                      task?.paymentVerified ||
                      task?.status === 'ready' ||
                      task?.status === 'sample_collected' ||
                      task?.status === 'completed' ||
                      task?.status === 'in_progress'
                    );
                    const isCancelable =
                      !isPaid &&
                      item.status !== 'completed' &&
                      item.status !== 'cancelled' &&
                      item.status !== 'in_progress' &&
                      item.status !== 'sample_collected' &&
                      !isOnHold;
                    const isCancelling = cancellingItemId === item.orderItemId;

                    return (
                      <div
                        key={item.orderItemId}
                        className={`p-2.5 rounded-xl bg-white border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                          isOnHold
                            ? 'border-amber-400 bg-amber-50/30 ring-1 ring-amber-300'
                            : 'border-slate-200/80'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            <span className={item.status === 'cancelled' || task?.status === 'cancelled' ? 'line-through text-slate-400' : ''}>
                              {testName}
                            </span>
                            {item.wasAiSuggested && (
                              <span className="text-[8px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded font-bold border border-purple-200">
                                AI Gợi ý
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Mã: <span className="font-mono text-slate-600">{testCode}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className="font-mono font-bold text-slate-700 text-xs">
                            {item.unitPrice.toLocaleString('vi-VN')} đ
                          </span>

                          {renderItemStatusBadge(item)}

                          {/* Action: Resolve Exception button for Doctors */}
                          {isOnHold && (
                            <button
                              type="button"
                              disabled={isLoadingResolveTask}
                              onClick={() => handleOpenResolveModal(item, order)}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>Xử lý sự cố</span>
                            </button>
                          )}

                          {(item.status === 'completed' || task?.status === 'completed') && onViewResult && (
                            <button
                              type="button"
                              onClick={onViewResult}
                              className="px-2.5 py-1 text-[11px] font-extrabold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 cursor-pointer flex items-center gap-1 transition-colors shadow-2xs"
                              title="Chuyển sang Tab Chẩn đoán bệnh để xem kết quả chi tiết và kết luận"
                            >
                              <Eye className="w-3 h-3 text-purple-600" />
                              <span>Xem KQ</span>
                            </button>
                          )}

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
            );
          })}
        </div>
      )}

      {/* Doctor Resolve Exception Modal */}
      <ResolveExceptionModal
        isOpen={!!resolvingTask}
        onClose={() => setResolvingTask(null)}
        task={resolvingTask}
        onToast={onToast}
        onRefetchRequired={onRefreshOrders}
        onSuccess={(_updated, _decision) => {
          onRefreshOrders();
        }}
      />
    </div>
  );
};
