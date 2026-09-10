import React, { useState, useEffect } from 'react';
import {
  Heart,
  Thermometer,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  PlusCircle,
  Save,
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Badge } from '../../../components/common/Badge';
import { vitalService } from '../../../services/vital/vital.service';
import type { NursePatientRow } from '../../../services/encounter/encounter.service';

interface NurseVitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientRow: NursePatientRow | null;
  currentUserId?: string;
  onSuccess: (message: string) => void;
  onError: (errorMsg: string) => void;
}

export const NurseVitalModal: React.FC<NurseVitalModalProps> = ({
  isOpen,
  onClose,
  patientRow,
  currentUserId,
  onSuccess,
  onError,
}) => {
  const [pulse, setPulse] = useState<number>(80);
  const [bpSystolic, setBpSystolic] = useState<number>(115);
  const [bpDiastolic, setBpDiastolic] = useState<number>(75);
  const [temp, setTemp] = useState<number>(37.0);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(18);
  const [spo2, setSpo2] = useState<number>(98);
  const [height, setHeight] = useState<number>(165);
  const [weight, setWeight] = useState<number>(60);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Điền dữ liệu ban đầu khi mở modal
  useEffect(() => {
    if (patientRow) {
      if (patientRow.vitals) {
        setPulse(patientRow.vitals.pulse ?? 80);
        setBpSystolic(patientRow.vitals.bpSystolic ?? 115);
        setBpDiastolic(patientRow.vitals.bpDiastolic ?? 75);
        setTemp(patientRow.vitals.temp ?? 37.0);
        setRespiratoryRate(patientRow.vitals.respiratoryRate ?? 18);
        setSpo2(patientRow.vitals.spo2 ?? 98);
        setHeight(patientRow.vitals.height ?? 165);
        setWeight(patientRow.vitals.weight ?? 60);
      } else {
        setPulse(80);
        setBpSystolic(115);
        setBpDiastolic(75);
        setTemp(37.0);
        setRespiratoryRate(18);
        setSpo2(98);
        setHeight(165);
        setWeight(60);
      }
      setNotes('');
    }
  }, [patientRow]);

  if (!patientRow) return null;

  // Tính BMI tự động
  const currentBmi =
    height > 0 ? parseFloat((weight / ((height / 100) * (height / 100))).toFixed(1)) : 0;

  // Kiểm tra cảnh báo bất thường trực tiếp trên form theo chuẩn NEWS2 database (90-119 / 60-79)
  const isFormAbnormal =
    bpSystolic >= 120 ||
    bpSystolic < 90 ||
    bpDiastolic >= 80 ||
    bpDiastolic < 60 ||
    temp >= 37.5 ||
    temp < 36.1 ||
    spo2 < 96 ||
    pulse > 90 ||
    pulse < 60 ||
    respiratoryRate > 20 ||
    respiratoryRate < 12;

  // Luôn ghi nhận lần đo mới (POST) để lưu đầy đủ lịch sử theo dõi
  const handleSave = async () => {
    if (!patientRow) return;

    try {
      setIsSubmitting(true);
      const recordedByUserId = currentUserId || '00000000-0000-0000-0000-000000000000';

      await vitalService.recordVitalSigns({
        encounterId: patientRow.encounterId,
        patientId: patientRow.patientId,
        recordedByUserId,
        pulse,
        systolicBp: bpSystolic,
        diastolicBp: bpDiastolic,
        temperature: temp,
        respiratoryRate,
        spo2,
        height,
        weight,
        notes: notes.trim() || undefined,
      });

      onSuccess(`Đã lưu phiên sinh hiệu mới vào lịch sử cho bệnh nhân ${patientRow.name}!`);
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi lưu sinh hiệu mới:', err);
      onError(err.message || 'Không thể lưu phiên sinh hiệu mới. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title={`Ghi Nhận Sinh Hiệu: ${patientRow.name}`}
      subtitle={`Mã ca: ${patientRow.encounterCode} • ${patientRow.age} tuổi • ${patientRow.gender} • Khoa: ${patientRow.departmentName}`}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none transition-colors"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Lưu một phiên đo mới vào lịch sử"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Lưu Sinh Hiệu & Đồng Bộ Bác Sĩ</span>
          </button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
        {isFormAbnormal && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold flex items-center gap-2 animate-pulse">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>CẢNH BÁO SỚM: Có chỉ số vượt ngưỡng NEWS2 (Huyết áp: 90-119 / 60-79, Mạch: 60-90, Nhiệt độ: 36.1-37.4°C, SpO2: &ge;96%)</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Huyết áp tâm thu */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">HA Tâm Thu (mmHg)</label>
            <input
              type="number"
              value={bpSystolic}
              onChange={(e) => setBpSystolic(Number(e.target.value))}
              className={`w-full p-2.5 rounded-xl border font-extrabold text-sm outline-none ${
                bpSystolic >= 120 || bpSystolic < 90
                  ? 'border-rose-400 bg-rose-50 text-rose-800 focus:border-rose-600'
                  : 'border-slate-200 focus:border-blue-600'
              }`}
              placeholder="115"
            />
            <span className="text-[10px] text-slate-400">Bình thường (NEWS2): 90 - 119</span>
          </div>

          {/* Huyết áp tâm trương */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">HA Tâm Trương (mmHg)</label>
            <input
              type="number"
              value={bpDiastolic}
              onChange={(e) => setBpDiastolic(Number(e.target.value))}
              className={`w-full p-2.5 rounded-xl border font-extrabold text-sm outline-none ${
                bpDiastolic >= 80 || bpDiastolic < 60
                  ? 'border-rose-400 bg-rose-50 text-rose-800 focus:border-rose-600'
                  : 'border-slate-200 focus:border-blue-600'
              }`}
              placeholder="75"
            />
            <span className="text-[10px] text-slate-400">Bình thường (NEWS2): 60 - 79</span>
          </div>

          {/* Mạch / Nhịp tim */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Mạch (lần/phút)
            </label>
            <input
              type="number"
              value={pulse}
              onChange={(e) => setPulse(Number(e.target.value))}
              className={`w-full p-2.5 rounded-xl border font-extrabold text-sm outline-none ${
                pulse > 90 || pulse < 60
                  ? 'border-rose-400 bg-rose-50 text-rose-800 focus:border-rose-600'
                  : 'border-slate-200 focus:border-blue-600'
              }`}
              placeholder="80"
            />
            <span className="text-[10px] text-slate-400">Bình thường: 60 - 90</span>
          </div>

          {/* Nhiệt độ */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              Nhiệt độ (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              className={`w-full p-2.5 rounded-xl border font-extrabold text-sm outline-none ${
                temp >= 37.5 || temp < 36.1
                  ? 'border-rose-400 bg-rose-50 text-rose-800 focus:border-rose-600'
                  : 'border-slate-200 focus:border-blue-600'
              }`}
              placeholder="37.0"
            />
            <span className="text-[10px] text-slate-400">Bình thường: 36.1 - 37.4</span>
          </div>

          {/* SpO2 */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">SpO2 (%)</label>
            <input
              type="number"
              value={spo2}
              onChange={(e) => setSpo2(Number(e.target.value))}
              className={`w-full p-2.5 rounded-xl border font-extrabold text-sm outline-none ${
                spo2 < 96
                  ? 'border-rose-400 bg-rose-50 text-rose-800 focus:border-rose-600'
                  : 'border-slate-200 focus:border-blue-600'
              }`}
              placeholder="98"
            />
            <span className="text-[10px] text-slate-400">Bình thường: 96 - 100</span>
          </div>

          {/* Nhịp thở */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Nhịp thở (lần/phút)</label>
            <input
              type="number"
              value={respiratoryRate}
              onChange={(e) => setRespiratoryRate(Number(e.target.value))}
              className={`w-full p-2.5 rounded-xl border font-extrabold text-sm outline-none ${
                respiratoryRate > 20 || respiratoryRate < 12
                  ? 'border-rose-400 bg-rose-50 text-rose-800 focus:border-rose-600'
                  : 'border-slate-200 focus:border-blue-600'
              }`}
              placeholder="18"
            />
            <span className="text-[10px] text-slate-400">Bình thường: 12 - 20</span>
          </div>

          {/* Chiều cao */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Chiều cao (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-600"
              placeholder="165"
            />
          </div>

          {/* Cân nặng */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Cân nặng (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-600"
              placeholder="60"
            />
          </div>

          {/* Tự động tính BMI */}
          <div className="bg-blue-50/90 p-3 rounded-xl border border-blue-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-blue-700 font-extrabold uppercase block">Tự động tính BMI</span>
              <span className="text-xl font-black text-blue-900">{currentBmi}</span>
            </div>
            <Badge
              variant={currentBmi >= 25 ? 'warning' : currentBmi < 18.5 ? 'neutral' : 'normal'}
              size="sm"
            >
              {currentBmi >= 25 ? 'Thừa cân' : currentBmi < 18.5 ? 'Gầy' : 'Bình thường'}
            </Badge>
          </div>
        </div>

        {/* Ghi chú lâm sàng của điều dưỡng */}
        <div className="space-y-1 pt-1">
          <label className="block font-bold text-slate-700">Ghi chú quan sát lâm sàng (nếu có)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={255}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-600 resize-none"
            placeholder="Ví dụ: Bệnh nhân tỉnh táo, tiếp xúc tốt, có dấu hiệu mệt mỏi nhẹ..."
          />
        </div>
      </div>
    </Modal>
  );
};
