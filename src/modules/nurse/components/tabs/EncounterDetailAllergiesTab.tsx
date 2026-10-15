import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Plus,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  patientAllergyService,
  type PatientAllergyItem,
  type AllergyType,
  type AllergySeverity,
  type AllergyStatus,
} from '../../../../services/patient/patient-allergy.service';

interface EncounterDetailAllergiesTabProps {
  patientId: string;
  patientName?: string;
  encounterId?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const EncounterDetailAllergiesTab: React.FC<EncounterDetailAllergiesTabProps> = ({
  patientId,
  patientName,
  encounterId,
  onSuccess,
  onError,
}) => {
  const [allergies, setAllergies] = useState<PatientAllergyItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [localFeedback, setLocalFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [allergyType, setAllergyType] = useState<AllergyType>('drug');
  const [allergenName, setAllergenName] = useState<string>('');
  const [severity, setSeverity] = useState<AllergySeverity>('moderate');
  const [reactionDescription, setReactionDescription] = useState<string>('');

  const fetchAllergies = useCallback(async () => {
    if (!patientId) return;
    setIsLoadingList(true);
    try {
      const data = await patientAllergyService.getAllergies(patientId);
      setAllergies(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách dị ứng:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      fetchAllergies();
      setAllergyType('drug');
      setAllergenName('');
      setSeverity('moderate');
      setReactionDescription('');
      setLocalFeedback(null);
    }
  }, [patientId, fetchAllergies]);

  const handleSubmitAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    if (!allergenName.trim()) {
      const msg = 'Vui lòng nhập tên tác nhân gây dị ứng!';
      setLocalFeedback({ message: msg, type: 'error' });
      if (onError) onError(msg);
      return;
    }

    try {
      setIsSubmitting(true);
      setLocalFeedback(null);
      await patientAllergyService.createAllergy(patientId, {
        allergyType,
        allergenName: allergenName.trim(),
        severity,
        reactionDescription: reactionDescription.trim() || undefined,
        encounterId: encounterId || undefined,
      });

      const successMsg = `Đã ghi nhận dị ứng "${allergenName.trim()}" cho bệnh nhân!`;
      setLocalFeedback({ message: successMsg, type: 'success' });
      if (onSuccess) onSuccess(successMsg);

      // Reset form fields
      setAllergenName('');
      setReactionDescription('');
      fetchAllergies();
    } catch (err: any) {
      console.error('Lỗi khi thêm dị ứng:', err);
      const errMsg = err.message || 'Không thể ghi nhận dị ứng. Vui lòng kiểm tra lại.';
      setLocalFeedback({ message: errMsg, type: 'error' });
      if (onError) onError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (allergyId: string, newStatus: AllergyStatus) => {
    try {
      await patientAllergyService.updateStatus(allergyId, newStatus);
      const msg = 'Đã cập nhật trạng thái dị ứng thành công!';
      setLocalFeedback({ message: msg, type: 'success' });
      if (onSuccess) onSuccess(msg);
      fetchAllergies();
    } catch (err: any) {
      console.error('Lỗi khi đổi trạng thái dị ứng:', err);
      const errMsg = err.message || 'Không thể đổi trạng thái dị ứng';
      setLocalFeedback({ message: errMsg, type: 'error' });
      if (onError) onError(errMsg);
    }
  };

  const getSeverityBadge = (sev: AllergySeverity) => {
    switch (sev) {
      case 'life_threatening':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">🔥 Nguy hiểm tính mạng</span>;
      case 'severe':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">⚠️ Nặng</span>;
      case 'moderate':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">🟡 Trung bình</span>;
      case 'mild':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <img src="/images/mild_icon.png" alt="Nhẹ" className="w-3 h-3 object-contain shrink-0" />
            <span>Nhẹ</span>
          </span>
        );
    }
  };

  const getTypeLabel = (type: AllergyType) => {
    switch (type) {
      case 'drug':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
            <img src="/images/drug_icon.png" alt="Thuốc" className="w-3.5 h-3.5 object-contain shrink-0" />
            <span>Thuốc / Kháng sinh</span>
          </span>
        );
      case 'food':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
            <img src="/images/food_icon.png" alt="Thực phẩm" className="w-3.5 h-3.5 object-contain shrink-0" />
            <span>Thực phẩm</span>
          </span>
        );
      case 'environmental':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
            <img src="/images/environmental_icon.png" alt="Môi trường" className="w-3.5 h-3.5 object-contain shrink-0" />
            <span>Môi trường</span>
          </span>
        );
      case 'other':
      default:
        return (
          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
            <img src="/images/other_icon.png" alt="Khác" className="w-3.5 h-3.5 object-contain shrink-0" />
            <span>Tác nhân khác</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Thông báo inline nếu có */}
      {localFeedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            localFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {localFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{localFeedback.message}</span>
        </div>
      )}

      {/* Form POST Khai báo dị ứng mới */}
      <form onSubmit={handleSubmitAllergy} className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-2xl space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
            <Plus className="w-4 h-4 text-rose-600" />
            <span>Khai Báo Dị Ứng Mới Cho Bệnh Nhân</span>
          </div>
          <span className="text-[10px] text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-full font-bold">
            Tự động đồng bộ EMR
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Loại dị ứng */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 text-[11px] block">Loại dị ứng (*):</label>
              {allergyType === 'drug' && (
                <span className="flex items-center gap-1 text-[10px] text-rose-800 font-extrabold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  <img src="/images/drug_icon.png" alt="Thuốc" className="w-3 h-3 object-contain shrink-0" />
                  <span>Dị ứng Thuốc</span>
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              {allergyType === 'drug' && (
                <img
                  src="/images/drug_icon.png"
                  alt="Thuốc"
                  className="w-4 h-4 object-contain absolute left-2.5 pointer-events-none z-10"
                />
              )}
              {allergyType === 'food' && (
                <img
                  src="/images/food_icon.png"
                  alt="Thực phẩm"
                  className="w-4 h-4 object-contain absolute left-2.5 pointer-events-none z-10"
                />
              )}
              {allergyType === 'environmental' && (
                <img
                  src="/images/environmental_icon.png"
                  alt="Môi trường"
                  className="w-4 h-4 object-contain absolute left-2.5 pointer-events-none z-10"
                />
              )}
              {allergyType === 'other' && (
                <img
                  src="/images/other_icon.png"
                  alt="Khác"
                  className="w-4 h-4 object-contain absolute left-2.5 pointer-events-none z-10"
                />
              )}
              <select
                value={allergyType}
                onChange={(e) => setAllergyType(e.target.value as AllergyType)}
                className="w-full p-2.5 bg-white rounded-xl border border-slate-200 font-semibold outline-none focus:border-rose-500 text-xs pl-8"
              >
                <option value="drug">Thuốc / Kháng sinh</option>
                <option value="food">Thực phẩm (Hải sản, Trứng, Sữa...)</option>
                <option value="environmental">Môi trường (Bụi, Phấn hoa, Lông thú...)</option>
                <option value="other">Tác nhân khác</option>
              </select>
            </div>
          </div>

          {/* Mức độ nghiêm trọng */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 text-[11px] block">Mức độ nghiêm trọng (*):</label>
              {severity === 'mild' && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-800 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <img src="/images/mild_icon.png" alt="Nhẹ" className="w-3 h-3 object-contain shrink-0" />
                  <span>Mức độ Nhẹ</span>
                </span>
              )}
              {severity === 'moderate' && (
                <span className="text-[10px] text-amber-800 font-extrabold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  🟡 Trung bình
                </span>
              )}
              {severity === 'severe' && (
                <span className="text-[10px] text-rose-800 font-extrabold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  ⚠️ Nặng
                </span>
              )}
              {severity === 'life_threatening' && (
                <span className="text-[10px] text-rose-950 font-extrabold bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300 animate-pulse">
                  🔥 Nguy hiểm tính mạng
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              {severity === 'mild' && (
                <img
                  src="/images/mild_icon.png"
                  alt="Nhẹ"
                  className="w-4 h-4 object-contain absolute left-2.5 pointer-events-none z-10"
                />
              )}
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as AllergySeverity)}
                className={`w-full p-2.5 bg-white rounded-xl border border-slate-200 font-semibold outline-none focus:border-rose-500 text-xs ${
                  severity === 'mild' ? 'pl-8' : ''
                }`}
              >
                <option value="mild">Nhẹ (Mild)</option>
                <option value="moderate">Trung bình (Moderate)</option>
                <option value="severe">Nặng (Severe)</option>
                <option value="life_threatening">Nguy hiểm tính mạng (Life Threatening)</option>
              </select>
            </div>
          </div>

          {/* Tên chất gây dị ứng */}
          <div className="sm:col-span-2 space-y-1">
            <label className="font-bold text-slate-700 text-[11px] block">Tên tác nhân / Chất gây dị ứng (*):</label>
            <input
              type="text"
              value={allergenName}
              onChange={(e) => setAllergenName(e.target.value)}
              placeholder="Ví dụ: Penicillin, Aspirin, Phấn hoa, Tôm cua..."
              required
              className="w-full p-2.5 bg-white rounded-xl border border-slate-200 font-extrabold outline-none focus:border-rose-500 text-xs text-slate-900"
            />
          </div>

          {/* Mô tả phản ứng */}
          <div className="sm:col-span-2 space-y-1">
            <label className="font-bold text-slate-700 text-[11px] block">Mô tả triệu chứng / phản ứng khi dị ứng (nếu có):</label>
            <textarea
              rows={2}
              value={reactionDescription}
              onChange={(e) => setReactionDescription(e.target.value)}
              placeholder="Ví dụ: Nổi mề đay toàn thân, ngứa cổ họng, khó thở nhẹ khi dùng thuốc..."
              className="w-full p-2.5 bg-white rounded-xl border border-slate-200 font-medium outline-none focus:border-rose-500 text-xs text-slate-800"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer transition border-none flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Ghi Nhận Dị Ứng Này</span>
          </button>
        </div>
      </form>

      {/* Danh sách các dị ứng đã khai báo */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Danh Sách Tiền Sử Dị Ứng Đã Ghi Nhận ({allergies.length})</span>
          </span>
          {isLoadingList && <Loader2 className="w-4 h-4 text-rose-600 animate-spin" />}
        </div>

        {allergies.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            Bệnh nhân chưa có thông tin khai báo dị ứng nào trong hồ sơ.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {allergies.map((item) => (
              <div
                key={item.allergyId}
                className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  item.status === 'entered_in_error'
                    ? 'bg-slate-100 border-slate-200 opacity-60'
                    : item.status === 'resolved'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {item.allergenName || item.allergyText}
                    </span>
                    {item.severity && getSeverityBadge(item.severity)}
                    {item.allergyType && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {getTypeLabel(item.allergyType)}
                      </span>
                    )}
                  </div>

                  {item.reactionDescription && (
                    <p className="text-[11px] text-slate-600 font-medium">
                      Phản ứng: {item.reactionDescription}
                    </p>
                  )}

                  <div className="text-[10px] text-slate-400 font-mono">
                    Ghi nhận lúc: {new Date(item.recordedAt).toLocaleString('vi-VN')}
                  </div>
                </div>

                {/* Cập nhật status */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.allergyId, 'resolved')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 cursor-pointer transition"
                    >
                      Đã khỏi (Resolved)
                    </button>
                  )}

                  {item.status !== 'entered_in_error' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.allergyId, 'entered_in_error')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] rounded-lg border border-slate-300 cursor-pointer transition"
                    >
                      Đánh dấu nhầm
                    </button>
                  )}

                  {item.status === 'entered_in_error' && (
                    <span className="text-[10px] font-bold text-slate-400 italic">
                      Đã đánh dấu nhập sai
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
