import React, { useState } from 'react';
import {
  Stethoscope,
  Sparkles,
  Check,
  Tag,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  Hand,
  Volume2,
  Activity,
  FileText,
  UserCheck,
} from 'lucide-react';
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
  // Các trường khám thực thể đầy đủ theo chuẩn Backend SE02
  patientPosition?: string;
  setPatientPosition?: (val: string) => void;
  inspectionFindings?: string;
  setInspectionFindings?: (val: string) => void;
  palpationFindings?: string;
  setPalpationFindings?: (val: string) => void;
  percussionFindings?: string;
  setPercussionFindings?: (val: string) => void;
  auscultationFindings?: string;
  setAuscultationFindings?: (val: string) => void;
  clinicalNotes?: string;
  setClinicalNotes?: (val: string) => void;

  // Tương thích ngược
  clinicalExamNote?: string;
  setClinicalExamNote?: (val: string) => void;

  // Chẩn đoán sơ bộ & AI
  preliminaryDiag: string;
  setPreliminaryDiag: (val: string) => void;
  dynamicAiDiagnosisList: DynamicAiDiagnosis[];
  isGeneratingAiDiagnosis: boolean;
  onTriggerAiDiagnosis: () => void;
  onQuickDiagnosisSelect: (diagText: string, icd10Code?: string) => void;
  examWarningMsg?: string | null;
}


export const ClinicalExamForm: React.FC<ClinicalExamFormProps> = ({
  encounterId,
  patientPosition = '',
  setPatientPosition,
  inspectionFindings = '',
  setInspectionFindings,
  palpationFindings = '',
  setPalpationFindings,
  percussionFindings = '',
  setPercussionFindings,
  auscultationFindings = '',
  setAuscultationFindings,
  clinicalNotes = '',
  setClinicalNotes,
  clinicalExamNote = '',
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

  // Đồng bộ giá trị khám nghe (auscultationFindings ưu tiên, fallback clinicalExamNote)
  const currentAuscultation = auscultationFindings || clinicalExamNote || '';
  const updateAuscultation = (val: string) => {
    if (setAuscultationFindings) setAuscultationFindings(val);
    if (setClinicalExamNote) setClinicalExamNote(val);
  };

  const appendToField = (
    currentVal: string,
    setter?: (val: string) => void,
    snippet?: string
  ) => {
    if (!setter || !snippet) return;
    if (!currentVal.trim()) {
      setter(snippet);
    } else if (!currentVal.includes(snippet)) {
      setter(`${currentVal.trim()}; ${snippet}`);
    }
  };

  const handleSaveOnlyClinicalExam = async () => {
    if (!encounterId) return;

    const hasAnyContent = Boolean(
      patientPosition.trim() ||
      inspectionFindings.trim() ||
      palpationFindings.trim() ||
      percussionFindings.trim() ||
      currentAuscultation.trim() ||
      clinicalNotes.trim() ||
      preliminaryDiag.trim()
    );

    if (!hasAnyContent) {
      setSaveErrorMsg('Vui lòng nhập ít nhất một nội dung khám (tư thế, nhìn, sờ, gõ, nghe, nhận định hoặc chẩn đoán sơ bộ).');
      return;
    }

    setIsSavingExam(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
    try {
      await clinicalExamService.upsertClinicalExamination(encounterId, {
        patientPosition: patientPosition.trim() || undefined,
        inspectionFindings: inspectionFindings.trim() || undefined,
        palpationFindings: palpationFindings.trim() || undefined,
        percussionFindings: percussionFindings.trim() || undefined,
        auscultationFindings: currentAuscultation.trim() || undefined,
        clinicalNotes: (clinicalNotes.trim() || preliminaryDiag.trim()) || undefined,
      });

      setSaveSuccessMsg('Đã lưu đầy đủ kết quả khám thực thể lâm sàng thành công!');

      // Gọi lại GET để đồng bộ dữ liệu mới nhất từ DB
      const reloaded = await clinicalExamService.getClinicalExamination(encounterId);
      if (reloaded) {
        if (setPatientPosition && reloaded.patientPosition !== undefined) {
          setPatientPosition(reloaded.patientPosition || '');
        }
        if (setInspectionFindings && reloaded.inspectionFindings !== undefined) {
          setInspectionFindings(reloaded.inspectionFindings || '');
        }
        if (setPalpationFindings && reloaded.palpationFindings !== undefined) {
          setPalpationFindings(reloaded.palpationFindings || '');
        }
        if (setPercussionFindings && reloaded.percussionFindings !== undefined) {
          setPercussionFindings(reloaded.percussionFindings || '');
        }
        const savedAuscultation = reloaded.auscultationFindings || reloaded.examinationFindings || '';
        updateAuscultation(savedAuscultation);
        if (setClinicalNotes && reloaded.clinicalNotes !== undefined) {
          setClinicalNotes(reloaded.clinicalNotes || '');
        }
        if (setPreliminaryDiag && reloaded.clinicalNotes && !preliminaryDiag) {
          setPreliminaryDiag(reloaded.clinicalNotes);
        }
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Không thể lưu khám lâm sàng';
      setSaveErrorMsg(`Lỗi lưu khám: ${msg}`);
    } finally {
      setIsSavingExam(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3.5 gap-2">
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-700" />
            <span>Ghi nhận Khám lâm sàng & Chẩn đoán sơ bộ (Bác sĩ Tim Mạch)</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Phiếu thăm khám lâm sàng chuẩn SE02: Tư thế → Nhìn → Sờ → Gõ → Nghe → Nhận định
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="info" size="sm">
            API: clinical-examination
          </Badge>
          <button
            type="button"
            onClick={handleSaveOnlyClinicalExam}
            disabled={isSavingExam || !encounterId}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            title="Lưu trọn vẹn kết quả khám lâm sàng vào Database"
          >
            {isSavingExam ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSavingExam ? 'Đang lưu...' : 'Lưu khám'}</span>
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

      {/* ── MỤC 1: TƯ THẾ NGƯỜI BỆNH ── */}
      <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Tư thế người bệnh khi khám (patient_position):</span>
          </label>
          <span className="text-[10px] text-slate-400 font-normal">Tùy chọn</span>
        </div>
        <input
          type="text"
          value={patientPosition}
          onChange={(e) => setPatientPosition?.(e.target.value)}
          placeholder="Ví dụ: Nằm ngửa, đầu cao 30 độ / Ngồi thẳng / Nằm nghiêng trái..."
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium outline-none focus:border-blue-600 text-xs text-slate-800 transition-colors"
        />
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-slate-400 font-bold">Gợi ý nhanh:</span>
          {[
            'Nằm ngửa, đầu cao 30 độ',
            'Nằm ngửa phẳng',
            'Ngồi thẳng',
            'Nằm nghiêng trái',
          ].map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setPatientPosition?.(pos)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg border transition-colors cursor-pointer ${patientPosition === pos
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                }`}
            >
              + {pos}
            </button>
          ))}
        </div>
      </div>

      {/* ── MỤC 2: 4 BƯỚC THĂM KHÁM TIM MẠCH (NHÌN · SỜ · GÕ · NGHE) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>Bốn bước thăm khám thực thể tim mạch:</span>
          </h4>
          <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Khớp 1-1 với DB table clinical_examinations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Bước 1: NHÌN (Inspection) */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. Khám Nhìn (inspection_findings):</span>
              </label>
              <span className="text-[10px] text-slate-400">Lồng ngực, da, mỏm tim</span>
            </div>
            <textarea
              rows={2}
              value={inspectionFindings}
              onChange={(e) => setInspectionFindings?.(e.target.value)}
              placeholder="Ghi nhận da niêm mạc, lồng ngực cân đối, tĩnh mạch cổ nổi, sẹo mổ..."
              className="w-full p-2.5 rounded-xl border border-slate-200 font-medium outline-none focus:border-blue-600 text-xs text-slate-800 transition-colors leading-relaxed"
            />
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              {[
                'Lồng ngực cân đối',
                'Da niêm mạc hồng hào',
                'Môi & đầu chi không tím tái',
                'Tĩnh mạch cổ không nổi',
                'Không có sẹo mổ cũ',
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => appendToField(inspectionFindings, setInspectionFindings, item)}
                  className="px-1.5 py-0.5 text-[9px] font-semibold rounded-md border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 transition-colors cursor-pointer"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          {/* Bước 2: SỜ (Palpation) */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Hand className="w-3.5 h-3.5 text-amber-600" />
                <span>2. Khám Sờ (palpation_findings):</span>
              </label>
              <span className="text-[10px] text-slate-400">Mỏm tim, rung miêu, Hartzer</span>
            </div>
            <textarea
              rows={2}
              value={palpationFindings}
              onChange={(e) => setPalpationFindings?.(e.target.value)}
              placeholder="Vị trí mỏm tim, diện đập, rung miêu, dấu Hartzer, mạch ngoại biên..."
              className="w-full p-2.5 rounded-xl border border-slate-200 font-medium outline-none focus:border-blue-600 text-xs text-slate-800 transition-colors leading-relaxed"
            />
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              {[
                'Mỏm tim KLS 5 đường trung đòn trái',
                'Không có rung miêu',
                'Dấu hiệu Hartzer (-)',
                'Mạch ngoại vi bắt rõ đều',
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => appendToField(palpationFindings, setPalpationFindings, item)}
                  className="px-1.5 py-0.5 text-[9px] font-semibold rounded-md border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 text-slate-600 transition-colors cursor-pointer"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          {/* Bước 3: GÕ (Percussion) */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span>3. Khám Gõ (percussion_findings):</span>
              </label>
              <span className="text-[10px] text-slate-400">Diện đục của tim</span>
            </div>
            <textarea
              rows={2}
              value={percussionFindings}
              onChange={(e) => setPercussionFindings?.(e.target.value)}
              placeholder="Diện đục tim trong giới hạn bình thường hay giãn rộng..."
              className="w-full p-2.5 rounded-xl border border-slate-200 font-medium outline-none focus:border-blue-600 text-xs text-slate-800 transition-colors leading-relaxed"
            />
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              {[
                'Diện đục tim trong giới hạn bình thường',
                'Phổi gõ trong 2 bên',
                'Không phát hiện bóng tim to',
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => appendToField(percussionFindings, setPercussionFindings, item)}
                  className="px-1.5 py-0.5 text-[9px] font-semibold rounded-md border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-600 transition-colors cursor-pointer"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          {/* Bước 4: NGHE (Auscultation) */}
          <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-blue-700" />
                <span>4. Khám Nghe (auscultation_findings) (*):</span>
              </label>
              <span className="text-[10px] text-blue-700 font-semibold">Trọng yếu</span>
            </div>
            <textarea
              rows={2}
              value={currentAuscultation}
              onChange={(e) => updateAuscultation(e.target.value)}
              placeholder="Tần số tim, nhịp tim đều/không đều, T1 T2 rõ, âm thổi tâm thu/tâm trương, rale phổi..."
              className="w-full p-2.5 rounded-xl border border-blue-200 bg-white font-medium outline-none focus:border-blue-600 text-xs text-slate-800 transition-colors leading-relaxed"
            />
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              {[
                'Tim đều, T1 T2 rõ, không âm thổi',
                'Nhịp xoang đều ~75 ck/phút',
                'Phổi thông khí đều 2 bên, không rale',
                'Tiếng thổi tâm thu 2/6 mỏm tim',
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => appendToField(currentAuscultation, updateAuscultation, item)}
                  className="px-1.5 py-0.5 text-[9px] font-semibold rounded-md border border-blue-200 bg-white hover:bg-blue-100 hover:text-blue-800 text-blue-700 transition-colors cursor-pointer"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MỤC 3: TÓM TẮT DIỄN TIẾN & NHẬN ĐỊNH LÂM SÀNG ── */}
      <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Tóm tắt diễn tiến & Nhận định lâm sàng (clinical_notes):</span>
          </label>
          <span className="text-[10px] text-slate-400">Hội chứng & đánh giá</span>
        </div>
        <textarea
          rows={2}
          value={clinicalNotes}
          onChange={(e) => setClinicalNotes?.(e.target.value)}
          placeholder="Tóm tắt hội chứng nghi ngờ (hội chứng suy tim, hẹp/hở van, đau ngực do thiếu máu cơ tim...)"
          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium outline-none focus:border-blue-600 text-xs text-slate-800 transition-colors leading-relaxed"
        />
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-slate-400 font-bold">Gợi ý hội chứng:</span>
          {[
            'Chưa phát hiện hội chứng suy tim',
            'Theo dõi hội chứng vành cấp',
            'Nghi ngờ hẹp/hở van tim',
            'Tình trạng huyết động ổn định',
          ].map((syn) => (
            <button
              key={syn}
              type="button"
              onClick={() => appendToField(clinicalNotes, setClinicalNotes, syn)}
              className="px-2 py-0.5 text-[10px] font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              + {syn}
            </button>
          ))}
        </div>
      </div>

      {/* ── MỤC 4: TOP GỢI Ý CHẨN ĐOÁN SƠ BỘ TỪ AI ── */}
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
            className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-purple-300 shadow-2xs disabled:opacity-50"
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
                className={`p-3 rounded-xl border transition-all space-y-2 bg-white ${isCurrentlySelected ? 'border-purple-600 shadow-xs ring-1 ring-purple-500' : 'border-purple-200/90'
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
                    onClick={() => onQuickDiagnosisSelect(item.diseaseName, item.icd10Code)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer border flex items-center gap-1 transition-colors ${isCurrentlySelected
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

      {/* ── MỤC 5: CHẨN ĐOÁN SƠ BỘ CỦA BÁC SĨ ── */}
      <div className="space-y-2 text-xs">
        <label className="block font-bold text-slate-700">
          Chẩn đoán sơ bộ của Bác sĩ (*) (SE02 Initial Diagnosis):
        </label>
        <input
          type="text"
          value={preliminaryDiag}
          onChange={(e) => setPreliminaryDiag(e.target.value)}
          placeholder="Nhập chẩn đoán sơ bộ (Ví dụ: Viêm phế quản cấp / Theo dõi cơn đau thắt ngực ổn định)"
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
            'Theo dõi cơn đau thắt ngực ổn định',
            'Tăng huyết áp vô căn (nguyên phát)',
            'Suy tim mạn',
            'Rối loạn nhịp tim',
            'Viêm dạ dày - tá tràng',
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
