import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Loader2,
  User,
  History,
  Save,
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import {
  patientAllergyService,
  parseAllergiesFromText,
  type PatientAllergyItem,
  type AllergyType,
  type AllergySeverity,
  type AllergyStatus,
} from '../../../services/patient/patient-allergy.service';
import type { NursePatientRow } from '../../../services/encounter/encounter.service';

interface NurseAllergyModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientRow: NursePatientRow | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const NurseAllergyModal: React.FC<NurseAllergyModalProps> = ({
  isOpen,
  onClose,
  patientRow,
  onSuccess,
  onError,
}) => {
  const [allergies, setAllergies] = useState<PatientAllergyItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form states: 4 bước tuần tự
  const [allergyType, setAllergyType] = useState<AllergyType>('food');
  const [allergenName, setAllergenName] = useState<string>('');
  const [severity, setSeverity] = useState<AllergySeverity>('severe');
  const [reactionDescription, setReactionDescription] = useState<string>('');

  // Tải danh sách dị ứng của bệnh nhân
  const fetchAllergies = useCallback(async () => {
    if (!patientRow?.patientId) return;
    setIsLoadingList(true);
    try {
      const data = await patientAllergyService.getAllergies(patientRow.patientId);
      setAllergies(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách dị ứng:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [patientRow?.patientId]);

  useEffect(() => {
    if (isOpen && patientRow?.patientId) {
      fetchAllergies();
      // Reset form
      setAllergyType('food');
      setAllergenName('');
      setSeverity('severe');
      setReactionDescription('');
    } else {
      setAllergies([]);
    }
  }, [isOpen, patientRow?.patientId, fetchAllergies]);

  // Gửi tạo bản ghi hồ sơ dị ứng mới
  const handleSubmitAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientRow?.patientId) return;

    if (!allergenName.trim()) {
      if (onError) onError('Vui lòng điền nội dung / tác nhân dị ứng!');
      return;
    }

    try {
      setIsSubmitting(true);
      await patientAllergyService.createAllergy(patientRow.patientId, {
        allergyType,
        allergenName: allergenName.trim(),
        severity,
        reactionDescription: reactionDescription.trim() || undefined,
      });

      if (onSuccess) {
        onSuccess(`Đã ghi nhận dị ứng "${allergenName.trim()}" cho bệnh nhân ${patientRow.name}!`);
      }

      // Reset form
      setAllergenName('');
      setReactionDescription('');
      await fetchAllergies();
    } catch (err: any) {
      console.error('Lỗi khi lưu dị ứng:', err);
      if (onError) {
        onError(err.message || 'Không thể ghi nhận dị ứng. Vui lòng kiểm tra lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật trạng thái của bản ghi (active / resolved / entered_in_error)
  const handleUpdateStatus = async (allergyId: string, newStatus: AllergyStatus) => {
    try {
      await patientAllergyService.updateStatus(allergyId, newStatus);
      if (onSuccess) onSuccess('Đã cập nhật trạng thái dị ứng thành công!');
      fetchAllergies();
    } catch (err: any) {
      console.error('Lỗi khi đổi trạng thái dị ứng:', err);
      if (onError) onError(err.message || 'Không thể đổi trạng thái dị ứng');
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

  if (!patientRow) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shadow-2xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Khai Báo & Quản Lý Tiền Sử Dị Ứng</h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Hồ sơ ghi nhận dị ứng dài hạn của bệnh nhân <strong className="text-slate-800">{patientRow.name}</strong>
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full text-xs">
          <span className="text-slate-400">
            Dữ liệu dị ứng thuốc tự động kiểm tra chống chỉ định khi Bác sĩ kê đơn
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition"
          >
            Đóng
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-xs text-slate-700">
        {/* Banner Thông Tin Bệnh Nhân */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm">{patientRow.name}</span>
              <div className="text-[11px] text-slate-500 space-x-2">
                <span>Tuổi/Giới: <strong className="text-slate-700">{patientRow.age} ({patientRow.gender})</strong></span>
                <span>•</span>
                <span>SĐT: <strong className="text-slate-700">{patientRow.phone || '---'}</strong></span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Lượt khám hiện tại</span>
            <span className="font-mono font-bold text-blue-700">{patientRow.encounterCode}</span>
          </div>
        </div>

        {/* Form Ghi nhận dị ứng: 4 bước tuần tự */}
        <form onSubmit={handleSubmitAllergy} className="p-4 bg-rose-50/50 border border-rose-200/80 rounded-2xl space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Khai Báo Dị Ứng Bệnh Nhân</span>
            </div>
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
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
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

                      {/* Đổi trạng thái */}
                      <div className="flex items-center gap-1.5">
                        {item.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.allergyId, 'resolved')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 cursor-pointer transition"
                            title="Đánh dấu bệnh nhân đã hết dị ứng"
                          >
                            Đã khỏi
                          </button>
                        )}
                        {item.status !== 'entered_in_error' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.allergyId, 'entered_in_error')}
                            className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-[10px] rounded-lg border border-slate-200 hover:border-rose-200 cursor-pointer transition"
                            title="Đánh dấu ghi nhầm dữ liệu"
                          >
                            Ghi nhầm
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Hiển thị chi tiết từng mục dị ứng đã bóc tách */}
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
    </Modal>
  );
};
