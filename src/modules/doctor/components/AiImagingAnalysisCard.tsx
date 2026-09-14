import React from 'react';
import { AlertTriangle, ShieldAlert, Clock, Play } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { BorderBeam } from '../../../components/ui/border-beam';
import type { PatientWorkflowState } from '../types';

interface AiImagingAnalysisCardProps {
  currentWorkflowState: PatientWorkflowState;
  onSimulateLabCompletion: () => void;
  preliminaryDiag: string;
  aiConfidence?: string;
  aiProposedDiag?: string;
}

export const AiImagingAnalysisCard: React.FC<AiImagingAnalysisCardProps> = ({
  currentWorkflowState,
  onSimulateLabCompletion,
  preliminaryDiag,
  aiConfidence = '93.5%',
  aiProposedDiag = 'Theo dõi lâm sàng',
}) => {
  if (currentWorkflowState === 'completed') {
    return (
      <BorderBeam size="md" colorVariant="colorful">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-indigo-500/30 shadow-xl shadow-indigo-950/40 rounded-3xl p-6 space-y-4 text-white">
          <div className="flex items-center justify-between border-b border-indigo-950 pb-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-cyan-400" />
              <span>Mô-đun AI02 — Kết quả phân tích hình ảnh xét nghiệm & Đề xuất AI</span>
            </h3>
            <Badge variant="ai" size="sm">
              AI Region of Interest (ROI)
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center animate-in zoom-in-95 duration-200">
            {/* Chest X-ray simulator with highlight overlay */}
            <div className="md:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden h-52 group">
              <span className="text-[9px] font-extrabold text-slate-500 absolute top-2 left-2 font-mono uppercase">
                Simulation: X-Ray Chest
              </span>

              {/* stylized SVG lungs outline */}
              <svg className="w-36 h-36 opacity-40 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4m-8 6h4m-4 4h4m-4-8h4M4 8h16M4 12h16m-16 4h16" />
                <circle cx="8" cy="12" r="3" strokeWidth={1} />
                <circle cx="16" cy="12" r="3" strokeWidth={1} />
              </svg>

              {/* Simulated abnormal region glowing pulse border overlay */}
              <div className="absolute bottom-10 left-12 w-14 h-14 border-2 border-dashed border-rose-500 bg-rose-500/10 rounded-full animate-ping duration-1000 flex items-center justify-center">
                <span className="text-[8px] bg-rose-600 text-white font-extrabold px-1 py-0.5 rounded leading-none shrink-0 pointer-events-none">
                  AI02 (92%)
                </span>
              </div>

              <div
                className="absolute bottom-10 left-12 w-14 h-14 border-2 border-rose-600 bg-rose-500/20 rounded-full flex items-center justify-center cursor-help"
                title="Vùng bất thường: Vùng mờ thâm nhiễm phế nang"
              >
                <span className="text-[7px] text-white font-extrabold uppercase font-sans tracking-wide">
                  Vùng mờ
                </span>
              </div>

              <span className="text-[9px] text-slate-400 font-bold text-center mt-2 z-10">
                {preliminaryDiag.toLowerCase().includes('tim')
                  ? 'AI phân tích nhịp tim: Khoảng QT kéo dài nhẹ'
                  : preliminaryDiag.toLowerCase().includes('dạ dày') || preliminaryDiag.toLowerCase().includes('bụng')
                  ? 'AI phân tích ổ bụng: Dấu hiệu viêm niêm mạc môn vị'
                  : 'Phát hiện vùng mờ thâm nhiễm phế nang (Thùy dưới phổi)'}
              </span>
            </div>

            {/* AI Proposed Diagnosis & Confidence Score details */}
            <div className="md:col-span-7 space-y-3">
              <div className="p-4 bg-indigo-950/40 border border-indigo-900/50 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-indigo-300 block uppercase tracking-wide">
                    Chẩn đoán đề xuất từ AI:
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">
                    Confidence Score: {aiConfidence}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-white">
                  {aiProposedDiag}
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  * Đề xuất dựa trên chẩn đoán hình ảnh phim chụp lồng ngực cận dưới kết hợp với tổng hợp chỉ số bệnh lý lâm sàng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </BorderBeam>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 text-white">
      <div className="flex items-center justify-between border-b border-slate-850 pb-3">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Mô-đun AI02 — Kết quả phân tích hình ảnh xét nghiệm & Đề xuất AI</span>
        </h3>
        <Badge variant="ai" size="sm">
          AI Region of Interest (ROI)
        </Badge>
      </div>

      <div className="border border-dashed border-slate-800 bg-slate-950/40 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 min-h-[180px]">
        {currentWorkflowState === 'initial' ? (
          <>
            <ShieldAlert className="w-10 h-10 text-amber-500" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-tight">
                AI02 — Chưa có dữ liệu cận lâm sàng
              </h4>
              <p className="text-[11px] text-slate-400 max-w-lg leading-relaxed">
                Chỉ định xét nghiệm chưa được gửi đi. Hãy điền kết quả khám lâm sàng, chẩn đoán sơ bộ bên dưới và nhấn nút <strong>"Xác nhận Chỉ định"</strong> để chuyển sang Quầy Thu phí (Mô-đun 6).
              </p>
            </div>
          </>
        ) : (
          <>
            <Clock className="w-10 h-10 text-indigo-500 animate-spin-slow" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-tight">
                AI02 — Đang chờ thanh toán & Xét nghiệm phòng Lab
              </h4>
              <p className="text-[11px] text-slate-400 max-w-lg leading-relaxed">
                Chỉ định cận lâm sàng đã được chuyển đi. Bệnh nhân cần hoàn tất thanh toán viện phí tại quầy thu phí (Mô-đun 6) và thực hiện chụp chiếu xét nghiệm tại phòng Lab (Mô-đun 7).
              </p>
            </div>
          </>
        )}

        {/* Developer simulation control */}
        <div className="pt-2 border-t border-slate-800 w-full flex items-center justify-center gap-3 text-[10px] font-bold">
          <span className="text-slate-400">Dành cho Người kiểm thử:</span>
          <button
            type="button"
            onClick={onSimulateLabCompletion}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-lg cursor-pointer border-none flex items-center gap-1.5 shadow-xs"
          >
            <Play className="w-3.5 h-3.5 text-amber-300" />
            <span>Mô phỏng: Đóng phí & Lab hoàn tất</span>
          </button>
        </div>
      </div>
    </div>
  );
};
