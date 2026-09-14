import React, { useState } from 'react';
import { Stethoscope, Sparkles, Check, Tag, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { clinicalExamService } from '../../../services/doctor';

export interface DynamicAiDiagnosis {
  id: string;
  icd10Code: string;
  diseaseName: string;
  confidenceScore: number;
  rationale: string;
}

interface ClinicalExamFormProps {
  encounterId?: string;
  clinicalExamNote: string;
  setClinicalExamNote: (val: string) => void;
  preliminaryDiag: string;
  setPreliminaryDiag: (val: string) => void;
  dynamicAiDiagnosisList: DynamicAiDiagnosis[];
  isGeneratingAiDiagnosis: boolean;
  onTriggerAiDiagnosis: () => void;
  onQuickDiagnosisSelect: (diagText: string) => void;
  examWarningMsg?: string | null;
}

export const ClinicalExamForm: React.FC<ClinicalExamFormProps> = ({
  encounterId,
  clinicalExamNote,
  setClinicalExamNote,
  preliminaryDiag,
  setPreliminaryDiag,
  dynamicAiDiagnosisList,
  isGeneratingAiDiagnosis,
  onTriggerAiDiagnosis,
  onQuickDiagnosisSelect,
  examWarningMsg,
}) => {
  const [isSavingExam, setIsSavingExam] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  const handleSaveOnlyClinicalExam = async () => {
    if (!encounterId) return;
    if (!clinicalExamNote.trim() && !preliminaryDiag.trim()) {
      setSaveErrorMsg('Vui lòng nhập kết quả khám hoặc chẩn đoán sơ bộ.');
      return;
    }
    setIsSavingExam(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
    try {
      await clinicalExamService.upsertClinicalExamination(encounterId, {
        examinationFindings: clinicalExamNote.trim() || undefined,
        clinicalNotes: preliminaryDiag.trim() || undefined,
      });
      setSaveSuccessMsg('Đã lưu kết quả khám lâm sàng & chẩn đoán sơ bộ thành công!');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Không thể lưu khám lâm sàng';
      setSaveErrorMsg(`Lỗi lưu khám: ${msg}`);
    } finally {
      setIsSavingExam(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-blue-700" />
          <span>Ghi nhận Khám lâm sàng & Chẩn đoán sơ bộ (Bác sĩ)</span>
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="info" size="sm">
            API: clinical-examination
          </Badge>
          <button
            type="button"
            onClick={handleSaveOnlyClinicalExam}
            disabled={isSavingExam || !encounterId}
            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Lưu riêng kết quả khám lâm sàng vào Database"
          >
            {isSavingExam ? <Loader2 className="w-3 h-3 animate-spin text-blue-600" /> : <Save className="w-3 h-3 text-blue-700" />}
            <span>Lưu khám</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="text-xs text-emerald-700 font-semibold flex items-center gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-200 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {(saveErrorMsg || examWarningMsg) && (
        <div className="text-xs text-amber-800 font-medium flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{saveErrorMsg || examWarningMsg}</span>
        </div>
      )}

      {/* Input: Clinical examination notes */}
      <div className="space-y-1.5 text-xs">
        <label className="block font-bold text-slate-700">
          Kết quả thăm khám lâm sàng (Nghe tim phổi, kiểm tra triệu chứng, tri giác):
        </label>
        <textarea
          rows={2}
          value={clinicalExamNote}
          onChange={(e) => setClinicalExamNote(e.target.value)}
          placeholder="Nhập kết quả thăm khám lâm sàng (Ví dụ: Tim đều, phổi ran ẩm rải rác hai đáy phổi, họng đỏ xung huyết...)"
          className="w-full p-3 rounded-xl border border-slate-200 font-medium outline-none focus:border-blue-600 text-xs text-slate-800 transition-colors leading-relaxed"
        />
      </div>

      {/* AI Proposed Diagnosis Suggestions Widget */}
      <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-700 animate-pulse" />
            <span className="text-xs font-extrabold text-purple-900">
              Top Gợi ý Chẩn đoán Sơ bộ từ AI (AI Diagnosis Suggestions):
            </span>
          </div>
          <button
            type="button"
            onClick={onTriggerAiDiagnosis}
            disabled={isGeneratingAiDiagnosis}
            className="px-2 py-1 bg-white hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-purple-300 shadow-2xs disabled:opacity-50"
            title="Yêu cầu AI sinh lại danh sách gợi ý chẩn đoán sơ bộ"
          >
            <Sparkles className={`w-3 h-3 text-purple-600 ${isGeneratingAiDiagnosis ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAiDiagnosis ? 'Đang phân tích...' : 'AI Phân tích lại'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {dynamicAiDiagnosisList.map((item) => {
            const isCurrentlySelected = preliminaryDiag.toLowerCase().includes(item.diseaseName.toLowerCase());

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all space-y-2 bg-white ${
                  isCurrentlySelected ? 'border-purple-600 shadow-xs ring-1 ring-purple-500' : 'border-purple-200/90'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="font-mono font-extrabold text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                    {item.icd10Code}
                  </span>
                  <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    {item.confidenceScore}% tin cậy
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800 leading-snug">
                    {item.diseaseName}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-normal">
                    {item.rationale}
                  </p>
                </div>

                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-medium">Khuyến nghị chẩn đoán</span>
                  <button
                    type="button"
                    onClick={() => onQuickDiagnosisSelect(item.diseaseName)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer border flex items-center gap-1 transition-colors ${
                      isCurrentlySelected
                        ? 'bg-purple-700 text-white border-purple-700'
                        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>{isCurrentlySelected ? 'Đang chọn' : 'Áp dụng chẩn đoán'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input: Doctor Preliminary Diagnosis */}
      <div className="space-y-2 text-xs">
        <label className="block font-bold text-slate-700">
          Chẩn đoán sơ bộ của Bác sĩ (*):
        </label>
        <input
          type="text"
          value={preliminaryDiag}
          onChange={(e) => setPreliminaryDiag(e.target.value)}
          placeholder="Nhập chẩn đoán sơ bộ (Ví dụ: Viêm phế quản cấp / Theo dõi viêm phổi thùy)"
          required
          className="w-full p-3 rounded-xl border border-slate-200 font-extrabold outline-none focus:border-blue-600 text-xs md:text-sm text-slate-800 transition-colors"
        />

        {/* Quick Diagnosis Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3 text-slate-400" /> Gợi ý nhanh:
          </span>
          {[
            'Viêm phế quản cấp',
            'Theo dõi viêm phổi thùy',
            'Rối loạn tiêu hóa cấp',
            'Viêm dạ dày - tá tràng',
            'Nhiễm trùng tiết niệu',
            'Khám sức khỏe tổng quát',
          ].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onQuickDiagnosisSelect(tag)}
              className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-600 transition-colors cursor-pointer"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
