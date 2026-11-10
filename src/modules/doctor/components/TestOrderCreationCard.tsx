import React, { useState } from 'react';
import {
  FlaskConical, CheckSquare, Square, Receipt,
  Send, Loader2, CheckCircle2, AlertCircle, Eye, Clock, AlertTriangle
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import {
  type TestCatalogItem
} from '../../../services/doctor';

interface TestOrderCreationCardProps {
  services?: TestCatalogItem[];
  isLoadingServices?: boolean;
  selectedTestTypeIds: string[];
  onToggleCatalogItem: (typeId: string) => void;
  aiRecommendedCodes?: Set<string>;
  totalEstimatedCost: number;
  orderNotes: string;
  setOrderNotes: (val: string) => void;
  isSubmittingOrder: boolean;
  submitSuccessMsg: string | null;
  submitErrorMsg: string | null;
  onSubmitOrder: (e: React.FormEvent) => void;
}

export const TestOrderCreationCard: React.FC<TestOrderCreationCardProps> = ({
  services,
  isLoadingServices,
  selectedTestTypeIds,
  onToggleCatalogItem,
  totalEstimatedCost,
  orderNotes,
  setOrderNotes,
  isSubmittingOrder,
  submitSuccessMsg,
  submitErrorMsg,
  onSubmitOrder,
}) => {
  const displayCatalog = services || [];
  const [detailModalItem, setDetailModalItem] = useState<TestCatalogItem | null>(null);

  return (
    <>
    <form onSubmit={onSubmitOrder} className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-purple-600" />
          <span>Chỉ định Cận lâm sàng & Tạo phiếu xét nghiệm</span>
        </h3>
        <Badge variant="neutral" size="sm">
          API: test-orders
        </Badge>
      </div>

      {/* Test Catalog List */}
      <div className="space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800">
              Danh mục dịch vụ Cận lâm sàng & Xét nghiệm:
            </span>
            {isLoadingServices && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-normal">
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                Đang tải từ CSDL...
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {isLoadingServices ? (
            <div className="col-span-full py-8 flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Đang tải danh mục xét nghiệm từ cơ sở dữ liệu...</span>
            </div>
          ) : displayCatalog.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs">Không có danh mục cận lâm sàng nào khả dụng từ hệ thống.</p>
            </div>
          ) : (
            displayCatalog.map((item: TestCatalogItem) => {
            const isChecked = selectedTestTypeIds.includes(item.testTypeId);

            return (
              <div
                key={item.testTypeId}
                onClick={() => onToggleCatalogItem(item.testTypeId)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                  isChecked
                    ? 'bg-blue-50/80 border-blue-500 text-blue-950 shadow-xs ring-1 ring-blue-500'
                    : 'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-xs leading-snug text-slate-900">
                        {item.testName}
                      </div>
                      {item.room && (
                        <div className="text-[10px] text-slate-500 font-medium mt-1">
                          {item.room}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailModalItem(item);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-100/60 transition-colors cursor-pointer"
                      title="Xem chi tiết hướng dẫn & thông tin dịch vụ"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-500 font-medium">Đơn giá niêm yết:</span>
                  <span className="font-extrabold text-blue-800 font-mono">
                    {item.price.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            );
          }))}
        </div>

        {/* Order Fee Summary */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Receipt className="w-4 h-4 text-blue-600" />
            <span>Đã chọn <strong>{selectedTestTypeIds.length}</strong> dịch vụ xét nghiệm</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Tổng chi phí dự tính:</span>
            <span className="font-extrabold text-sm text-blue-900 font-mono">
              {totalEstimatedCost.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>
      </div>

      {/* Input: Order Notes */}
      <div className="space-y-1.5 text-xs">
        <label className="block font-bold text-slate-700">
          Ghi chú / Yêu cầu gửi phòng xét nghiệm & cận lâm sàng:
        </label>
        <input
          type="text"
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          placeholder="Ví dụ: Chụp ngực tư thế đứng thẳng, ưu tiên trả kết quả khẩn, nghi ngờ viêm thùy..."
          className="w-full p-3 rounded-xl border border-slate-200 font-medium outline-none focus:border-blue-600 text-xs text-slate-800 transition-colors"
        />
      </div>

      {/* Feedback alerts */}
      {submitSuccessMsg && (
        <div className="text-xs text-emerald-700 font-semibold flex items-center gap-2 bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="leading-relaxed">{submitSuccessMsg}</span>
        </div>
      )}

      {submitErrorMsg && (
        <div className="text-xs text-rose-700 font-semibold flex items-center gap-2 bg-rose-50 p-3.5 rounded-xl border border-rose-200 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="leading-relaxed">{submitErrorMsg}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmittingOrder || selectedTestTypeIds.length === 0}
          className={`px-6 py-3 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none flex items-center justify-center gap-2 uppercase tracking-wide transition-all ${
            isSubmittingOrder || selectedTestTypeIds.length === 0
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-blue-700 hover:bg-blue-800'
          }`}
        >
          {isSubmittingOrder ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang gửi chỉ định lên hệ thống...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Xác nhận Chỉ định & Chuyển Thu phí</span>
            </>
          )}
        </button>
      </div>
    </form>

    {/* Modal xem chi tiết dịch vụ cận lâm sàng */}
    {detailModalItem && (
      <Modal
        isOpen={Boolean(detailModalItem)}
        onClose={() => setDetailModalItem(null)}
        title="Thông Tin Dịch Vụ Cận Lâm Sàng"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-700 p-1">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                {detailModalItem.testName}
              </h4>
              <div className="text-[11px] text-slate-500 mt-1">
                Phòng thực hiện: <strong className="text-slate-800">{detailModalItem.room || 'Phòng Xét nghiệm Máu'}</strong>
              </div>
            </div>
            <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              {detailModalItem.testCode}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-500">Đơn giá niêm yết:</span>
              <span className="font-extrabold text-sm text-blue-900 font-mono">
                {detailModalItem.price.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Lưu ý chuẩn bị (Preparation Note)</span>
              </div>
              <p className="text-amber-800 leading-relaxed font-medium">
                {detailModalItem.preparationNote || (detailModalItem.requiresFasting ? 'Yêu cầu nhịn ăn trước khi lấy mẫu xét nghiệm.' : 'Không có lưu ý đặc biệt trước khi thực hiện.')}
              </p>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setDetailModalItem(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    )}
    </>
  );
};
