import React from 'react';
import {
  FlaskConical, Sparkles, CheckSquare, Square, Receipt,
  Send, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import {
  AVAILABLE_TEST_CATALOG,
  type TestCatalogItem
} from '../../../services/doctor';

interface TestOrderCreationCardProps {
  selectedTestTypeIds: string[];
  onToggleCatalogItem: (typeId: string) => void;
  aiRecommendedCodes: Set<string>;
  totalEstimatedCost: number;
  orderNotes: string;
  setOrderNotes: (val: string) => void;
  isSubmittingOrder: boolean;
  submitSuccessMsg: string | null;
  submitErrorMsg: string | null;
  onSubmitOrder: (e: React.FormEvent) => void;
}

export const TestOrderCreationCard: React.FC<TestOrderCreationCardProps> = ({
  selectedTestTypeIds,
  onToggleCatalogItem,
  aiRecommendedCodes,
  totalEstimatedCost,
  orderNotes,
  setOrderNotes,
  isSubmittingOrder,
  submitSuccessMsg,
  submitErrorMsg,
  onSubmitOrder,
}) => {
  return (
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
          <span className="font-extrabold text-slate-800">
            Danh mục dịch vụ Cận lâm sàng & Xét nghiệm:
          </span>
          <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1 self-start sm:self-auto">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>AI tự động đề xuất theo triệu chứng & chẩn đoán</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AVAILABLE_TEST_CATALOG.map((item: TestCatalogItem) => {
            const isChecked = selectedTestTypeIds.includes(item.testTypeId);
            const isAiSuggested = aiRecommendedCodes.has(item.testCode);

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
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        Mã: <span className="font-mono text-slate-700">{item.testCode}</span>
                        {item.room && ` • ${item.room}`}
                      </div>
                    </div>
                  </div>

                  {isAiSuggested && (
                    <span className="text-[9px] bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded font-bold uppercase shrink-0 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                      <span>AI khuyên dùng</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-500 font-medium">Đơn giá niêm yết:</span>
                  <span className="font-extrabold text-blue-800 font-mono">
                    {item.price.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            );
          })}
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
  );
};
