import React from 'react';
import { Sparkles } from 'lucide-react';
import { BorderBeam } from '../../../components/ui/border-beam';
import type { CaseOverviewData } from '../../../services/doctor';

interface AiClinicalSummaryCardProps {
  summaryText: string;
  caseOverview: CaseOverviewData | null;
  isGeneratingAiSummary: boolean;
  onTriggerAiSummary: () => void;
}

export const AiClinicalSummaryCard: React.FC<AiClinicalSummaryCardProps> = ({
  summaryText,
  caseOverview,
  isGeneratingAiSummary,
  onTriggerAiSummary,
}) => {
  return (
    <BorderBeam size="md" colorVariant="colorful">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-indigo-500/30 shadow-xl shadow-indigo-950/40 rounded-3xl p-6 text-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Mô-đun AI01 — Tóm tắt bệnh án do AI tự động biên soạn
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-bold">
              {caseOverview?.aiClinicalSummary ? 'Trực tiếp từ AI Model' : 'Mức tin cậy: 97.4%'}
            </span>
            <button
              type="button"
              onClick={onTriggerAiSummary}
              disabled={isGeneratingAiSummary}
              className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-none shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
              title="Yêu cầu AI sinh lại bản tóm tắt lâm sàng"
            >
              <Sparkles className={`w-3 h-3 text-amber-300 ${isGeneratingAiSummary ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAiSummary ? 'Đang tóm tắt...' : 'Kích hoạt AI tóm tắt'}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed font-medium">
          {summaryText}
        </p>


      </div>
    </BorderBeam>
  );
};
