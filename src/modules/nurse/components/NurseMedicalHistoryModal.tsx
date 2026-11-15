import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  CheckCircle2,
  Loader2,
  X,
  Clock,
  Calendar,
  AlertTriangle,
  HeartPulse,
  Activity,
  History,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Badge } from '../../../components/common/Badge';
import {
  patientMedicalHistoryService,
  type PatientMedicalHistoryItem,
  type MedicalHistoryType,
  type MedicalHistoryStatus,
} from '../../../services/patient/patient-medical-history.service';
import type { NursePatientRow } from '../../../services/encounter/encounter.service';

interface NurseMedicalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientRow: NursePatientRow | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const HISTORY_TYPE_LABELS: Record<MedicalHistoryType, { label: string; color: string }> = {
  chronic_disease: { label: 'Bệnh mạn tính', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  cardiac_procedure: { label: 'Can thiệp tim mạch', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  surgery: { label: 'Phẫu thuật trước đây', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  family_history: { label: 'Tiền sử gia đình', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  risk_factor: { label: 'Yếu tố nguy cơ', color: 'bg-orange-50 text-orange-700 border-orange-200' },
};

const COMMON_CARDIAC_CONDITIONS = [
  { type: 'chronic_disease' as MedicalHistoryType, name: 'Tăng huyết áp nguyên phát' },
  { type: 'chronic_disease' as MedicalHistoryType, name: 'Đái tháo đường Type 2' },
  { type: 'chronic_disease' as MedicalHistoryType, name: 'Rối loạn lipid máu (Mỡ máu cao)' },
  { type: 'cardiac_procedure' as MedicalHistoryType, name: 'Đặt Stent mạch vành (PCI)' },
  { type: 'cardiac_procedure' as MedicalHistoryType, name: 'Nong van hai lá bằng bóng' },
  { type: 'risk_factor' as MedicalHistoryType, name: 'Tiền sử hút thuốc lá (>10 năm)' },
  { type: 'family_history' as MedicalHistoryType, name: 'Gia đình có người nhồi máu cơ tim sớm' },
];

export const NurseMedicalHistoryModal: React.FC<NurseMedicalHistoryModalProps> = ({
  isOpen,
  onClose,
  patientRow,
  onSuccess,
  onError,
}) => {
  const [histories, setHistories] = useState<PatientMedicalHistoryItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Form states
  const [historyType, setHistoryType] = useState<MedicalHistoryType>('chronic_disease');
  const [conditionName, setConditionName] = useState<string>('');
  const [onsetDate, setOnsetDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch patient medical histories
  const fetchHistories = useCallback(async () => {
    if (!patientRow?.patientId) return;
    setIsLoadingList(true);
    try {
      const data = await patientMedicalHistoryService.getMedicalHistories(patientRow.patientId);
      setHistories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách tiền sử bệnh:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [patientRow?.patientId]);

  useEffect(() => {
    if (isOpen && patientRow?.patientId) {
      fetchHistories();
      setFormError(null);
      setConditionName('');
      setOnsetDate('');
      setNotes('');
    }
  }, [isOpen, patientRow?.patientId, fetchHistories]);

  // Lọc theo Tab loại tiền sử
  const filteredHistories = histories.filter((item) => {
    if (activeTab === 'all') return true;
    return item.historyType === activeTab;
  });

  // Thêm mới tiền sử bệnh
  const handleCreateHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientRow?.patientId) return;

    if (!conditionName.trim()) {
      setFormError('Vui lòng nhập tên bệnh lý hoặc thủ thuật.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      await patientMedicalHistoryService.createMedicalHistory(patientRow.patientId, {
        historyType,
        conditionName: conditionName.trim(),
        onsetDate: onsetDate || undefined,
        notes: notes.trim() || undefined,
      });

      setConditionName('');
      setOnsetDate('');
      setNotes('');
      await fetchHistories();

      if (onSuccess) {
        onSuccess(`Đã ghi nhận tiền sử bệnh "${conditionName.trim()}" cho bệnh nhân!`);
      }
    } catch (err: any) {
      console.error('Lỗi khi thêm tiền sử bệnh:', err);
      const errMsg = err?.data?.message || err?.message || 'Không thể lưu tiền sử bệnh.';
      setFormError(errMsg);
      if (onError) onError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật trạng thái (active / resolved / inactive)
  const handleUpdateStatus = async (historyId: string, newStatus: MedicalHistoryStatus) => {
    try {
      await patientMedicalHistoryService.updateStatus(historyId, newStatus);
      await fetchHistories();
      if (onSuccess) {
        onSuccess(
          `Đã chuyển trạng thái tiền sử bệnh sang "${
            newStatus === 'resolved' ? 'Đã ổn định' : newStatus === 'active' ? 'Đang theo dõi' : 'Ngưng theo dõi'
          }"!`
        );
      }
    } catch (err: any) {
      console.error('Lỗi khi cập nhật trạng thái tiền sử bệnh:', err);
      if (onError) onError(err?.message || 'Không thể cập nhật trạng thái.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
          <History className="w-5 h-5 text-indigo-600" />
          <span>Hồ Sơ Tiền Sử Bệnh & Can Thiệp Tim Mạch</span>
        </div>
      }
      subtitle={
        patientRow
          ? `Bệnh nhân: ${patientRow.name} • ${patientRow.age} tuổi • ${patientRow.gender} • Mã: ${patientRow.encounterCode}`
          : undefined
      }
      maxWidth="4xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <span className="text-[11px] text-slate-500 font-semibold">
            Tổng cộng: <strong className="text-slate-800">{histories.length}</strong> tiền sử bệnh ghi nhận trong EMR
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl cursor-pointer border-none"
          >
            Đóng
          </button>
        </div>
      }
    >
      <div className="space-y-6 text-xs text-slate-800">

        {/* Form Thêm Mới Tiền Sử Bệnh */}
        <form
          onSubmit={handleCreateHistory}
          className="bg-indigo-50/50 p-4.5 rounded-2xl border border-indigo-200/80 space-y-3.5 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Ghi Nhận Thêm Tiền Sử Bệnh / Yếu Tố Nguy Cơ Mới</span>
            </h4>
            <span className="text-[10px] text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full font-bold">
              Lưu dài hạn vào EMR
            </span>
          </div>

          {/* Gợi ý nhanh các bệnh lý tim mạch */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Gợi ý bệnh lý tim mạch & nguy cơ:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CARDIAC_CONDITIONS.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setHistoryType(c.type);
                    setConditionName(c.name);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                >
                  + {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            <div className="sm:col-span-4 space-y-1">
              <label className="block font-bold text-slate-700">Loại tiền sử (*):</label>
              <select
                value={historyType}
                onChange={(e) => setHistoryType(e.target.value as MedicalHistoryType)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white outline-none focus:border-indigo-600"
              >
                <option value="chronic_disease">Bệnh mạn tính</option>
                <option value="cardiac_procedure">Can thiệp tim mạch</option>
                <option value="surgery">Phẫu thuật trước đây</option>
                <option value="family_history">Tiền sử gia đình</option>
                <option value="risk_factor">Yếu tố nguy cơ</option>
              </select>
            </div>

            <div className="sm:col-span-5 space-y-1">
              <label className="block font-bold text-slate-700">Tên bệnh lý / Thủ thuật can thiệp (*):</label>
              <input
                type="text"
                required
                value={conditionName}
                onChange={(e) => setConditionName(e.target.value)}
                placeholder="Ví dụ: Tăng huyết áp độ 2, Đặt stent LAD năm 2022..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none focus:border-indigo-600"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="block font-bold text-slate-700">Ngày phát hiện / Khởi phát:</label>
              <input
                type="date"
                value={onsetDate}
                onChange={(e) => setOnsetDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Ghi chú điều trị / diễn tiến:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Đang uống Amlodipine 5mg hằng ngày, huyết áp mục tiêu &lt; 130/80 mmHg..."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none focus:border-indigo-600"
            />
          </div>

          {formError && (
            <div className="text-xs text-rose-600 font-bold flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer border-none transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu Tiền Sử Bệnh</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Bộ Lọc Theo Loại Tiền Sử */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
          {[
            { id: 'all', label: `Tất cả (${histories.length})` },
            { id: 'chronic_disease', label: 'Bệnh mạn tính' },
            { id: 'cardiac_procedure', label: 'Can thiệp tim mạch' },
            { id: 'surgery', label: 'Phẫu thuật' },
            { id: 'family_history', label: 'Gia đình' },
            { id: 'risk_factor', label: 'Nguy cơ' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Danh Sách Tiền Sử Đã Ghi Nhận */}
        <div className="space-y-3">
          {isLoadingList ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Đang tải danh sách tiền sử bệnh...</span>
            </div>
          ) : filteredHistories.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400">
              Chưa ghi nhận tiền sử bệnh nào trong danh mục này.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredHistories.map((item) => {
                const typeBadge = HISTORY_TYPE_LABELS[item.historyType] || {
                  label: item.historyType,
                  color: 'bg-slate-100 text-slate-700',
                };
                const isActive = item.status === 'active';
                const isResolved = item.status === 'resolved';

                return (
                  <div
                    key={item.historyId}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-start justify-between gap-3 shadow-2xs hover:border-indigo-300 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                        <h5 className="font-black text-slate-900 text-xs">{item.conditionName}</h5>
                        {item.onsetDate && (
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.onsetDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>

                      {item.notes && <p className="text-slate-600 text-[11px] leading-relaxed">{item.notes}</p>}
                    </div>

                    {/* Badge trạng thái & Actions chuyển trạng thái */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={isActive ? 'critical' : isResolved ? 'normal' : 'neutral'} size="sm">
                        {isActive ? 'Đang theo dõi' : isResolved ? 'Đã ổn định' : 'Ngưng theo dõi'}
                      </Badge>

                      <div className="flex items-center gap-1">
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.historyId, 'resolved')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            title="Đánh dấu đã ổn định / đã khỏi"
                          >
                            Đã ổn định
                          </button>
                        )}
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.historyId, 'active')}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            title="Kích hoạt lại trạng thái theo dõi"
                          >
                            Theo dõi lại
                          </button>
                        )}
                        {item.status !== 'inactive' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.historyId, 'inactive')}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            title="Ngưng theo dõi"
                          >
                            Ngưng
                          </button>
                        )}
                      </div>
                    </div>
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
