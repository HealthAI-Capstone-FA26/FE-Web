import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Loader2,
  AlertCircle,
  History,
  Save,
} from 'lucide-react';
import {
  patientAllergyService,
  parseAllergiesFromText,
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
  encounterId: _encounterId,
  onSuccess,
  onError,
}) => {
  const [allergies, setAllergies] = useState<PatientAllergyItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [localFeedback, setLocalFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form states: 4 bước tuần tự
  const [allergyType, setAllergyType] = useState<AllergyType>('food');
  const [allergenName, setAllergenName] = useState<string>('');
  const [severity, setSeverity] = useState<AllergySeverity>('severe');
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
      setAllergyType('food');
      setAllergenName('');
      setSeverity('severe');
      setReactionDescription('');
      setLocalFeedback(null);
    }
  }, [patientId, fetchAllergies]);

  const handleSubmitAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    if (!allergenName.trim()) {
      const msg = 'Vui lòng điền nội dung / tác nhân dị ứng!';
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
      });

      const successMsg = `Đã ghi nhận dị ứng "${allergenName.trim()}" cho bệnh nhân ${patientName || ''}!`;
      setLocalFeedback({ message: successMsg, type: 'success' });
      if (onSuccess) onSuccess(successMsg);

      // Reset form
      setAllergenName('');
      setReactionDescription('');
      await fetchAllergies();
    } catch (err: any) {
      console.error('Lỗi khi lưu dị ứng:', err);
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
      const msg = 'Đã cập nhật trạng thái dị ứng!';
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

  const getSeverityBadge = (sev?: string) => {
    switch (sev) {
      case 'life_threatening':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">🔥 Nguy hiểm tính mạng</span>;
      case 'severe':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">⚠️ Nặng</span>;
      case 'moderate':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">🟡 Trung bình</span>;
      case 'mild':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 Nhẹ</span>;
      default:
        return sev ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{sev}</span> : null;
    }
  };

  const getTypeBadge = (type: AllergyType) => {
    switch (type) {
      case 'drug':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">Thuốc / Kháng sinh</span>;
      case 'food':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">Thực phẩm</span>;
      case 'environmental':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">Môi trường</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">Tác nhân khác</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">Đang hiệu lực</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">Đã khỏi</span>;
      case 'entered_in_error':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">Ghi nhận nhầm</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-4 text-xs text-slate-700">
      {/* Thông báo inline */}
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

      {/* Form Ghi nhận dị ứng: 4 bước tuần tự */}
      <form onSubmit={handleSubmitAllergy} className="p-4 bg-rose-50/50 border border-rose-200/80 rounded-2xl space-y-3.5 shadow-2xs">
        <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Khai Báo Dị Ứng Bệnh Nhân</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* 1. Dropdown Chọn loại */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 text-[11px] block">
              1. Loại dị ứng (*):
            </label>
            <select
              value={allergyType}
              onChange={(e) => setAllergyType(e.target.value as AllergyType)}
              className="w-full p-2.5 bg-white rounded-xl border border-slate-200 font-bold outline-none focus:border-rose-500 text-xs text-slate-900 cursor-pointer"
            >
              <option value="food">Thực phẩm</option>
              <option value="drug">Thuốc / Kháng sinh</option>
              <option value="environmental">Môi trường / Dị nguyên khác</option>
              <option value="other">Tác nhân khác</option>
            </select>
          </div>

          {/* 2. Điền nội dung / Tên tác nhân dị ứng */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 text-[11px] block">
              2. Nội dung / Tên dị ứng (*):
            </label>
            <input
              type="text"
              value={allergenName}
              onChange={(e) => setAllergenName(e.target.value)}
              placeholder="Ví dụ: dị ứng tôm, penicillin, đậu phộng..."
              required
              className="w-full p-2.5 bg-white rounded-xl border border-slate-200 font-extrabold outline-none focus:border-rose-500 text-xs text-slate-900"
            />
          </div>

          {/* 3. Dropdown Chọn Mức độ */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 text-[11px] block">
              3. Mức độ nghiêm trọng:
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as AllergySeverity)}
              className="w-full p-2.5 bg-white rounded-xl border border-slate-200 font-bold outline-none focus:border-rose-500 text-xs text-slate-900 cursor-pointer"
            >
              <option value="severe">Nặng</option>
              <option value="moderate">Trung bình</option>
              <option value="mild">Nhẹ</option>
              <option value="life_threatening">Nguy hiểm tính mạng</option>
            </select>
          </div>

          {/* 4. Input Ghi nội dung phản ứng */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 text-[11px] block">
              4. Nội dung phản ứng:
            </label>
            <input
              type="text"
              value={reactionDescription}
              onChange={(e) => setReactionDescription(e.target.value)}
              placeholder="Ví dụ: nổi mề đay, khó thở, ngứa họng..."
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
              <Save className="w-4 h-4" />
            )}
            <span>Ghi Nhận Dị Ứng Này</span>
          </button>
        </div>
      </form>

      {/* Lịch sử ghi nhận dị ứng */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-500" />
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
            {allergies.map((item) => {
              const parsedItems = parseAllergiesFromText(item.allergyText);

              return (
                <div
                  key={item.allergyId}
                  className={`p-3 rounded-2xl border transition-all space-y-2 ${
                    item.status === 'entered_in_error'
                      ? 'bg-slate-100 border-slate-200 opacity-60'
                      : item.status === 'resolved'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.recordedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(item.allergyId, 'resolved')}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 cursor-pointer transition"
                        >
                          Đã khỏi
                        </button>
                      )}
                      {item.status !== 'entered_in_error' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(item.allergyId, 'entered_in_error')}
                          className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-[10px] rounded-lg border border-slate-200 hover:border-rose-200 cursor-pointer transition"
                        >
                          Ghi nhầm
                        </button>
                      )}
                    </div>
                  </div>

                  {parsedItems.length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">
                      {item.allergyText || 'Không ghi nhận dị ứng'}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {parsedItems.map((p, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {getTypeBadge(p.type)}
                              <span className="font-extrabold text-slate-900 text-xs">
                                {p.name}
                              </span>
                            </div>
                            {getSeverityBadge(p.severity)}
                          </div>

                          {p.reaction && (
                            <p className="text-[11px] text-slate-600 font-medium pl-1">
                              Phản ứng: <span className="text-slate-800 font-semibold">{p.reaction}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
