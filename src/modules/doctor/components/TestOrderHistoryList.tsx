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

function formatVnd(value: number | string | undefined | null): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return '0 ₫';
  return `${num.toLocaleString('vi-VN')} ₫`;
}

function formatOrderDateTime(iso?: string): string {
  if (!iso) return '---';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${hh}:${mm} • ${dd}/${mo}/${yyyy}`;
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

    if (item.status === 'on_hold' || task?.status === 'on_hold') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 whitespace-nowrap shrink-0 animate-pulse">
          <PauseCircle className="w-3 h-3 text-amber-600 shrink-0" />
          <span>Cần quyết định</span>
        </span>
      );
    }

    if (item.status === 'completed' || task?.status === 'completed') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Đã có kết quả</span>
        </span>
      );
    }

    if (item.status === 'cancelled' || task?.status === 'cancelled') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-300 line-through whitespace-nowrap shrink-0">
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
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0">
          <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
          <span>Đang thực hiện</span>
        </span>
      );
    }

    if (task?.paymentVerified || task?.status === 'ready') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0">
          <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
          <span>Chờ lấy mẫu</span>
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0">
        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
        <span>Chờ thu phí</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <FileText className="w-4 h-4 text-blue-700 shrink-0" />
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
          className="text-xs font-bold text-slate-500 hover:text-blue-700 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 cursor-pointer bg-transparent border-none transition-colors shrink-0"
          title="Làm mới danh sách phiếu chỉ định"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTestOrders ? 'animate-spin text-blue-600' : ''}`} />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {/* Chỉ định cận lâm sàng bị tạm dừng sự cố cần bác sĩ quyết định */}
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
                  <div className="space-y-1 min-w-0">
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
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap transition-colors"
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
            const activeOrderItems = orderItems.filter(
              (i) => i.status !== 'cancelled' && (i.task?.status || i.labTask?.status) !== 'cancelled'
            );
            const totalOrderAmount = activeOrderItems.reduce(
              (sum, i) => sum + (Number(i.unitPrice) || 0),
              0
            );
            const isOrderPaid =
              activeOrderItems.length > 0 &&
              activeOrderItems.every((i) => {
                const task = i.task || i.labTask;
                return (
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
                className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs"
              >
                {/* Order Header */}
                <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-extrabold text-xs text-blue-900 bg-blue-100/90 border border-blue-200/80 px-2.5 py-0.5 rounded-lg">
                      {order.orderCode}
                    </span>
                    {isOrderPaid ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Đã thanh toán</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Chờ thanh toán</span>
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      Lập lúc: <strong className="font-semibold text-slate-700">{formatOrderDateTime(order.orderedAt)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {orderItems.length} dịch vụ
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-[11px] text-slate-600 font-semibold">
                      Tổng cộng:{' '}
                      <strong className="font-mono font-extrabold text-slate-900 tabular-nums">
                        {formatVnd(totalOrderAmount)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Order Clinical Note (if present) */}
                {order.notes && (
                  <div className="px-4 py-2 bg-blue-50/40 border-b border-slate-100 text-[11px] text-slate-600 flex items-center gap-1.5">
                    <span className="font-bold text-slate-700 shrink-0">Ghi chú lâm sàng:</span>
                    <span className="italic text-slate-700">{order.notes}</span>
                  </div>
                )}

                {/* Column Headers (Desktop) */}
                <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_110px_140px_96px] sm:items-center gap-3 px-4 py-2 bg-slate-50/40 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <span>Danh mục chỉ định</span>
                  <span className="text-right">Đơn giá</span>
                  <span className="text-center">Trạng thái</span>
                  <span className="text-right">Thao tác</span>
                </div>

                {/* Items List */}
                <div className="divide-y divide-slate-100">
                  {orderItems.map((item, idx) => {
                    const testName = item.service?.serviceName || item.testType?.testName || 'Xét nghiệm';
                    const testCode = item.service?.serviceCode || item.testType?.testCode || '---';
                    const task = item.task || item.labTask;
                    const isCancelled = item.status === 'cancelled' || task?.status === 'cancelled';
                    const isCompleted = item.status === 'completed' || task?.status === 'completed';
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
                      !isCompleted &&
                      !isCancelled &&
                      item.status !== 'in_progress' &&
                      item.status !== 'sample_collected' &&
                      !isOnHold;
                    const isCancelling = cancellingItemId === item.orderItemId;

                    return (
                      <div
                        key={item.orderItemId}
                        className={`px-4 py-3 transition-colors flex flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_110px_140px_96px] sm:items-center gap-2.5 sm:gap-3 text-xs ${
                          isOnHold
                            ? 'bg-amber-50/50'
                            : isCancelled
                            ? 'bg-slate-50/50 opacity-70'
                            : 'bg-white hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Col 1: Service Info */}
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 font-mono text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div className="space-y-1 min-w-0">
                            <div className="font-bold text-slate-800 leading-snug flex items-center gap-2 flex-wrap">
                              <span className={isCancelled ? 'line-through text-slate-400' : ''}>
                                {testName}
                              </span>
                              {item.wasAiSuggested && (
                                <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold border border-purple-200 whitespace-nowrap">
                                  AI Gợi ý
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                              <span>Mã DV:</span>
                              <span className="font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                                {testCode}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mobile bottom bar / Desktop Cols 2-4 */}
                        <div className="flex items-center justify-between sm:contents pl-7 sm:pl-0">
                          {/* Col 2: Unit Price */}
                          <div
                            className={`font-mono font-bold text-xs tabular-nums whitespace-nowrap sm:text-right ${
                              isCancelled ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {formatVnd(item.unitPrice)}
                          </div>

                          {/* Col 3: Status Badge */}
                          <div className="flex sm:justify-center shrink-0">
                            {renderItemStatusBadge(item)}
                          </div>

                          {/* Col 4: Action Button */}
                          <div className="flex justify-end shrink-0">
                            {isOnHold ? (
                              <button
                                type="button"
                                disabled={isLoadingResolveTask}
                                onClick={() => handleOpenResolveModal(item, order)}
                                className="px-2.5 py-1.5 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-2xs inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
                              >
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>Xử lý</span>
                              </button>
                            ) : isCompleted && onViewResult ? (
                              <button
                                type="button"
                                onClick={onViewResult}
                                className="px-2.5 py-1.5 text-[11px] font-extrabold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 rounded-lg border border-violet-200 cursor-pointer inline-flex items-center gap-1 whitespace-nowrap transition-colors shadow-2xs"
                                title="Chuyển sang Tab Chẩn đoán bệnh để xem kết quả chi tiết và kết luận"
                              >
                                <Eye className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                                <span>Xem KQ</span>
                              </button>
                            ) : isCancelable ? (
                              <button
                                type="button"
                                disabled={isCancelling}
                                onClick={() => onCancelItem(item.orderItemId, testName)}
                                className="px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 cursor-pointer inline-flex items-center gap-1 whitespace-nowrap transition-colors"
                                title="Hủy chỉ định xét nghiệm này"
                              >
                                {isCancelling ? (
                                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                ) : (
                                  <Trash2 className="w-3 h-3 shrink-0" />
                                )}
                                <span>Hủy</span>
                              </button>
                            ) : (
                              <span className="text-slate-300 font-mono text-xs select-none hidden sm:inline">
                                —
                              </span>
                            )}
                          </div>
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
