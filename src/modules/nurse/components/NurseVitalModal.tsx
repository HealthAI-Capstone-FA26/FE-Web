import React, { useState, useEffect } from 'react';
import {
  Heart,
  Thermometer,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Table,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Activity,
  History,
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Badge } from '../../../components/common/Badge';
import {
  vitalService,
  type VitalItemResponse,
  type VitalReferenceRangeResponse,
} from '../../../services/vital/vital.service';
import { encounterService, type NursePatientRow } from '../../../services/encounter/encounter.service';
import { EncounterDetailAllergiesTab } from './tabs/EncounterDetailAllergiesTab';
import { EncounterDetailMedicalHistoryTab } from './tabs/EncounterDetailMedicalHistoryTab';

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
  const [pulse, setPulse] = useState<number | string>('');
  const [bpSystolic, setBpSystolic] = useState<number | string>('');
  const [bpDiastolic, setBpDiastolic] = useState<number | string>('');
  const [temp, setTemp] = useState<number | string>('');
  const [respiratoryRate, setRespiratoryRate] = useState<number | string>('');
  const [spo2, setSpo2] = useState<number | string>('');
  const [height, setHeight] = useState<number | string>('');
  const [weight, setWeight] = useState<number | string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'vitals' | 'allergies' | 'medical_history'>('vitals');
  const [_vitalItems, setVitalItems] = useState<VitalItemResponse[]>([]);
  const [refRangesList, setRefRangesList] = useState<VitalReferenceRangeResponse[]>([]);
  const [showRefTable, setShowRefTable] = useState<boolean>(true);
  const [isLoadingRefRanges, setIsLoadingRefRanges] = useState<boolean>(false);

  // Tải danh mục chỉ số sinh hiệu active & khoảng tham chiếu sinh hiệu riêng cho bệnh nhân theo tuổi/giới tính
  useEffect(() => {
    if (isOpen) {
      setActiveTab('vitals');
      vitalService
        .getVitalItems()
        .then((items) => setVitalItems(items))
        .catch((err) => console.warn('Could not fetch active vital items:', err));

      if (patientRow?.patientId) {
        setIsLoadingRefRanges(true);
        vitalService
          .getVitalReferenceRanges(patientRow.patientId)
          .then((ranges) => {
            setRefRangesList(ranges);
          })
          .catch((err) => console.warn('Could not fetch patient reference ranges:', err))
          .finally(() => setIsLoadingRefRanges(false));
      }
    }
  }, [isOpen, patientRow?.patientId]);

  const ageNum =
    typeof patientRow?.age === 'number'
      ? patientRow.age
      : parseInt(String(patientRow?.age || '30').replace(/[^0-9]/g, ''), 10) || 30;

  const isPediatric = ageNum < 16;
  const isToddler = ageNum <= 5;

  // Điền dữ liệu nếu đã có lịch sử đo trước đó; nếu chưa đo lần nào thì để trống để Điều dưỡng nhập mới
  useEffect(() => {
    if (patientRow) {
      if (patientRow.vitals) {
        setPulse(patientRow.vitals.pulse ?? '');
        setBpSystolic(patientRow.vitals.bpSystolic ?? '');
        setBpDiastolic(patientRow.vitals.bpDiastolic ?? '');
        setTemp(patientRow.vitals.temp ?? '');
        setRespiratoryRate(patientRow.vitals.respiratoryRate ?? '');
        setSpo2(patientRow.vitals.spo2 ?? '');
        setHeight(patientRow.vitals.height ?? '');
        setWeight(patientRow.vitals.weight ?? '');
      } else {
        // Chưa có dữ liệu sinh hiệu -> Để trống hoàn toàn
        setPulse('');
        setBpSystolic('');
        setBpDiastolic('');
        setTemp('');
        setRespiratoryRate('');
        setSpo2('');
        setHeight('');
        setWeight('');
      }
      setNotes('');
    }
  }, [patientRow]);

  if (!patientRow) return null;

  // Tính BMI tự động (nếu cả chiều cao và cân nặng đều đã được nhập)
  const numHeight = typeof height === 'number' ? height : parseFloat(height) || 0;
  const numWeight = typeof weight === 'number' ? weight : parseFloat(weight) || 0;
  const currentBmi =
    numHeight > 0 && numWeight > 0
      ? parseFloat((numWeight / ((numHeight / 100) * (numHeight / 100))).toFixed(1))
      : 0;

  const numBpSys = typeof bpSystolic === 'number' ? bpSystolic : parseFloat(bpSystolic) || 0;
  const numBpDia = typeof bpDiastolic === 'number' ? bpDiastolic : parseFloat(bpDiastolic) || 0;
  const numPulse = typeof pulse === 'number' ? pulse : parseFloat(pulse) || 0;
  const numTemp = typeof temp === 'number' ? temp : parseFloat(temp) || 0;
  const numSpo2 = typeof spo2 === 'number' ? spo2 : parseFloat(spo2) || 0;
  const numResp = typeof respiratoryRate === 'number' ? respiratoryRate : parseFloat(respiratoryRate) || 0;

  // Kiểm tra cảnh báo bất thường trực tiếp trên form theo nhóm tuổi (chỉ kiểm tra các trường đã nhập)
  const isFormAbnormal = isToddler
    ? (numBpSys > 0 && (numBpSys > 115 || numBpSys < 75)) ||
    (numBpDia > 0 && (numBpDia > 75 || numBpDia < 45)) ||
    (numTemp > 0 && (numTemp >= 37.6 || numTemp < 36.1)) ||
    (numSpo2 > 0 && numSpo2 < 96) ||
    (numPulse > 0 && (numPulse > 135 || numPulse < 75)) ||
    (numResp > 0 && (numResp > 32 || numResp < 18))
    : isPediatric
      ? (numBpSys > 0 && (numBpSys > 120 || numBpSys < 80)) ||
      (numBpDia > 0 && (numBpDia > 78 || numBpDia < 50)) ||
      (numTemp > 0 && (numTemp >= 37.6 || numTemp < 36.1)) ||
      (numSpo2 > 0 && numSpo2 < 96) ||
      (numPulse > 0 && (numPulse > 115 || numPulse < 65)) ||
      (numResp > 0 && (numResp > 26 || numResp < 14))
      : (numBpSys > 0 && (numBpSys >= 120 || numBpSys < 90)) ||
      (numBpDia > 0 && (numBpDia >= 80 || numBpDia < 60)) ||
      (numTemp > 0 && (numTemp >= 37.5 || numTemp < 36.1)) ||
      (numSpo2 > 0 && numSpo2 < 96) ||
      (numPulse > 0 && (numPulse > 90 || numPulse < 60)) ||
      (numResp > 0 && (numResp > 20 || numResp < 12));

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
        pulse: numPulse > 0 ? numPulse : undefined,
        systolicBp: numBpSys > 0 ? numBpSys : undefined,
        diastolicBp: numBpDia > 0 ? numBpDia : undefined,
        temperature: numTemp > 0 ? numTemp : undefined,
        respiratoryRate: numResp > 0 ? numResp : undefined,
        spo2: numSpo2 > 0 ? numSpo2 : undefined,
        height: numHeight > 0 ? numHeight : undefined,
        weight: numWeight > 0 ? numWeight : undefined,
        notes: notes.trim() || undefined,
        queueEntryId: patientRow.queueEntryId,
      });

      let routeMsg = '';
      try {
        const routeResult = await encounterService.routeDoctor(patientRow.encounterId);
        if (routeResult?.doctor?.fullName) {
          routeMsg = ` & Điều phối vào phòng Bác sĩ ${routeResult.doctor.fullName}`;
        }
      } catch {
        // Tự động bỏ qua nếu đã phân bổ hoặc chưa đủ điều kiện
      }

      onSuccess(`Đã lưu phiên sinh hiệu cho bệnh nhân ${patientRow.name}${routeMsg}!`);
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi lưu sinh hiệu mới:', err);
      onError(err.message || 'Không thể lưu phiên sinh hiệu mới. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSourceReference = (source?: string | null) => {
    if (!source) return <span className="text-slate-400 italic">Chuẩn Bộ Y Tế</span>;

    const urlRegex = /\((https?:\/\/[^\s)]+)\)/i;
    const match = source.match(urlRegex);

    if (match) {
      const url = match[1];
      const textWithoutUrl = source.replace(urlRegex, '').trim();
      return (
        <div className="space-y-1">
          <p className="text-slate-700 font-medium text-[11px] leading-relaxed">{textWithoutUrl}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold"
            title={url}
          >
            <span>Tài liệu tham chiếu gốc</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      );
    }

    return <p className="text-slate-600 text-[11px] leading-relaxed">{source}</p>;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      maxWidth="4xl"
      title={
        patientRow
          ? activeTab === 'vitals'
            ? `Ghi Nhận Sinh Hiệu: ${patientRow.name}`
            : activeTab === 'allergies'
            ? `Kê Khai Dị Ứng: ${patientRow.name}`
            : `Kê Khai Tiền Sử Bệnh: ${patientRow.name}`
          : 'Ghi Nhận Sinh Hiệu'
      }
      subtitle={patientRow ? `Mã ca: ${patientRow.encounterCode} • ${patientRow.age} tuổi • ${patientRow.gender}` : ''}
      footer={
        activeTab === 'vitals' ? (
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
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none transition-colors"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vitals')}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Activity className="w-4 h-4" />
              <span>Quay lại Đo Sinh Hiệu</span>
            </button>
          </>
        )
      }
    >
      <div className="space-y-4 text-xs">
        {/* TAB NAVIGATION CHUYỂN ĐỔI: ĐO SINH HIỆU, TIỀN SỬ DỊ ỨNG, TIỀN SỬ BỆNH */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'vitals'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Đo Sinh Hiệu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('allergies')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'allergies'
                ? 'bg-white text-rose-800 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Tiền Sử Dị Ứng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medical_history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'medical_history'
                ? 'bg-white text-indigo-800 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tiền Sử Bệnh & Tim Mạch</span>
          </button>
        </div>

        {activeTab === 'vitals' && (
          <div className="space-y-4">
        {patientRow?.chiefComplaint && (
          <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900">Lý do tiếp đón & Triệu chứng ban đầu:</span>
                {typeof patientRow.chiefComplaint.painLevel === 'number' && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${patientRow.chiefComplaint.painLevel >= 7
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : patientRow.chiefComplaint.painLevel >= 4
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                  >
                    Mức đau: {patientRow.chiefComplaint.painLevel}/10
                  </span>
                )}
              </div>
              <p className="text-slate-800 font-medium">
                <span className="font-bold text-slate-700">Lý do:</span>{' '}
                {patientRow.chiefComplaint.reasonForVisit || 'Khám tổng quát'}
                {patientRow.chiefComplaint.symptoms && (
                  <>
                    {' '}• <span className="font-bold text-slate-700">Triệu chứng:</span>{' '}
                    {patientRow.chiefComplaint.symptoms}
                  </>
                )}
                {patientRow.chiefComplaint.symptomOnsetDate && (
                  <>
                    {' '}• <span className="font-bold text-slate-700">Khởi phát:</span>{' '}
                    {patientRow.chiefComplaint.symptomOnsetDate.slice(0, 10)}
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {isFormAbnormal && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold flex items-center gap-2 animate-pulse">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>
              {isPediatric
                ? 'CẢNH BÁO SỚM (NHI KHOA): Có chỉ số sinh hiệu ngoài khoảng tham chiếu Nhi khoa'
                : 'CẢNH BÁO SỚM (NEWS2): Có chỉ số vượt ngưỡng NEWS2 (Huyết áp: 90-119 / 60-79, Mạch: 60-90, Nhiệt độ: 36.1-37.4°C, SpO2: ≥96%)'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Huyết áp tâm thu */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">HA Tâm Thu (mmHg)</label>
            <input
              type="number"
              value={bpSystolic}
              onChange={(e) => setBpSystolic(e.target.value)}
              className={`w-full p-2.5 rounded-xl border font-extrabold text-sm outline-none ${(isToddler && (numBpSys > 115 || (numBpSys > 0 && numBpSys < 75))) ||
                (!isToddler && isPediatric && (numBpSys > 120 || (numBpSys > 0 && numBpSys < 80))) ||
                (!isPediatric && (numBpSys >= 120 || (numBpSys > 0 && numBpSys < 90)))
                ? 'border-rose-400 bg-rose-50 text-rose-800 focus:border-rose-600'
                : 'border-slate-200 focus:border-blue-600'
                }`}
              placeholder={isToddler ? '95' : isPediatric ? '105' : '115'}
            />
            <span className="text-[10px] text-slate-400">
              {isToddler
                ? 'Bình thường (Nhi khoa 3-5t): 80 - 110'
                : isPediatric
                  ? 'Bình thường (Nhi khoa): 85 - 115'
                  : 'Bình thường (NEWS2): 90 - 119'}
            </span>
          </div>

          {/* Huyết áp tâm trương */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">HA Tâm Trương (mmHg)</label>
            <input
              type="number"
              value={bpDiastolic}
              onChange={(e) => setBpDiastolic(e.target.value)}
              className={`w-full p-2.5 rounded-xl border font-extrabold text-sm outline-none ${(isToddler && (numBpDia > 75 || (numBpDia > 0 && numBpDia < 45))) ||
                (!isToddler && isPediatric && (numBpDia > 78 || (numBpDia > 0 && numBpDia < 50))) ||
                (!isPediatric && (numBpDia >= 80 || (numBpDia > 0 && numBpDia < 60)))
                ? 'border-rose-400 bg-rose-50 text-rose-800 focus:border-rose-600'
                : 'border-slate-200 focus:border-blue-600'
                }`}
              placeholder={isToddler ? '60' : isPediatric ? '70' : '75'}
            />
            <span className="text-[10px] text-slate-400">
              {isToddler
                ? 'Bình thường (Nhi khoa 3-5t): 50 - 75'
                : isPediatric
                  ? 'Bình thường (Nhi khoa): 55 - 75'
                  : 'Bình thường (NEWS2): 60 - 79'}
            </span>
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
              onChange={(e) => setPulse(e.target.value)}
              className={`w-full p-2.5 rounded-xl border font-extrabold text-sm outline-none ${(isToddler && (numPulse > 135 || (numPulse > 0 && numPulse < 75))) ||
                (!isToddler && isPediatric && (numPulse > 115 || (numPulse > 0 && numPulse < 65))) ||
                (!isPediatric && (numPulse > 90 || (numPulse > 0 && numPulse < 60)))
                ? 'border-rose-400 bg-rose-50 text-rose-800 focus:border-rose-600'
                : 'border-slate-200 focus:border-blue-600'
                }`}
              placeholder={isToddler ? '100' : isPediatric ? '90' : '80'}
            />
            <span className="text-[10px] text-slate-400">
              {isToddler
                ? 'Bình thường (Nhi khoa 3-5t): 80 - 130'
                : isPediatric
                  ? 'Bình thường (Nhi khoa): 70 - 110'
                  : 'Bình thường: 60 - 90'}
            </span>
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
              onChange={(e) => setTemp(e.target.value)}
              className={`w-full p-2.5 rounded-xl border font-extrabold text-sm outline-none ${numTemp >= 37.6 || (numTemp > 0 && numTemp < 36.1)
                ? 'border-rose-400 bg-rose-50 text-rose-800 focus:border-rose-600'
                : 'border-slate-200 focus:border-blue-600'
                }`}
              placeholder="37.0"
            />
            <span className="text-[10px] text-slate-400">Bình thường: 36.1 - 37.5</span>
          </div>

          {/* SpO2 */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">SpO2 (%)</label>
            <input
              type="number"
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              className={`w-full p-2.5 rounded-xl border font-extrabold text-sm outline-none ${numSpo2 > 0 && numSpo2 < 96
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
              onChange={(e) => setRespiratoryRate(e.target.value)}
              className={`w-full p-2.5 rounded-xl border font-extrabold text-sm outline-none ${(isToddler && (numResp > 32 || (numResp > 0 && numResp < 18))) ||
                (!isToddler && isPediatric && (numResp > 26 || (numResp > 0 && numResp < 14))) ||
                (!isPediatric && (numResp > 20 || (numResp > 0 && numResp < 12)))
                ? 'border-rose-400 bg-rose-50 text-rose-800 focus:border-rose-600'
                : 'border-slate-200 focus:border-blue-600'
                }`}
              placeholder={isToddler ? '24' : isPediatric ? '20' : '18'}
            />
            <span className="text-[10px] text-slate-400">
              {isToddler
                ? 'Bình thường (Nhi khoa 3-5t): 20 - 30'
                : isPediatric
                  ? 'Bình thường (Nhi khoa): 16 - 24'
                  : 'Bình thường: 12 - 20'}
            </span>
          </div>

          {/* Chiều cao */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Chiều cao (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-600"
              placeholder={isToddler ? '95' : isPediatric ? '135' : '165'}
            />
          </div>

          {/* Cân nặng */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Cân nặng (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-600"
              placeholder={isToddler ? '14' : isPediatric ? '32' : '60'}
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

        {/* Ghi chú quan sát lâm sàng của điều dưỡng */}
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

        {/* Bảng Dải Tham Chiếu & Cảnh Báo Ngưỡng Sinh Hiệu từ API GET /vital-reference-ranges */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 mt-2">
          <button
            type="button"
            onClick={() => setShowRefTable(!showRefTable)}
            className="w-full p-3 bg-slate-100 hover:bg-slate-200/80 flex items-center justify-between font-bold text-slate-700 text-xs transition-colors border-none cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-blue-600" />
              <span>Bảng Ngưỡng Sinh Hiệu Chuẩn</span>
              {refRangesList.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-extrabold text-[10px] rounded-full">
                  {refRangesList.length} chỉ số
                </span>
              )}
            </div>
            {showRefTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showRefTable && (
            <div className="p-3 space-y-2 bg-white border-t border-slate-200">
              {isLoadingRefRanges ? (
                <div className="flex items-center justify-center py-4 gap-2 text-slate-500 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Đang tải dải tham chiếu theo độ tuổi bệnh nhân...</span>
                </div>
              ) : refRangesList.length === 0 ? (
                <p className="text-slate-400 text-[11px] italic py-2 text-center">
                  Chưa có khoảng tham chiếu cấu hình cho độ tuổi này.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs min-w-[660px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700 font-bold text-xs">
                        <th className="py-2.5 px-3.5 w-[24%]">Chỉ số sinh hiệu</th>
                        <th className="py-2.5 px-3.5 w-[20%]">Khoảng chuẩn tham chiếu</th>
                        <th className="py-2.5 px-3.5 w-[28%]">Trạng thái giá trị nhập</th>
                        <th className="py-2.5 px-3.5 w-[28%]">Nguồn chuẩn y tế</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {refRangesList.map((row) => {
                        let val: number | null = null;
                        const code = row.itemCode.toUpperCase();
                        if ((code === 'SBP' || code === 'BP_SYS') && numBpSys > 0) val = numBpSys;
                        else if ((code === 'DBP' || code === 'BP_DIA') && numBpDia > 0) val = numBpDia;
                        else if ((code === 'HR' || code === 'PULSE') && numPulse > 0) val = numPulse;
                        else if (code === 'TEMP' && numTemp > 0) val = numTemp;
                        else if ((code === 'RR' || code === 'RESP') && numResp > 0) val = numResp;
                        else if (code === 'SPO2' && numSpo2 > 0) val = numSpo2;
                        else if (code === 'HEIGHT' && numHeight > 0) val = numHeight;
                        else if (code === 'WEIGHT' && numWeight > 0) val = numWeight;
                        else if (code === 'BMI' && currentBmi > 0) val = currentBmi;

                        const isAbn = val !== null && (val < row.minNormal || val > row.maxNormal);

                        return (
                          <tr
                            key={row.itemCode}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isAbn ? 'bg-rose-50/50' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3.5 font-bold text-slate-900">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{row.itemName}</span>
                                <span className="text-[10px] text-slate-400 font-mono font-normal">
                                  ({row.itemCode})
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3.5 font-extrabold text-emerald-700 whitespace-nowrap">
                              {row.minNormal} - {row.maxNormal}{' '}
                              <span className="text-[11px] font-normal text-slate-500">{row.unit}</span>
                            </td>
                            <td className="py-2.5 px-3.5">
                              {val === null ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500">
                                  Chưa nhập
                                </span>
                              ) : isAbn ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                                  <span>Bất thường ({val} {row.unit})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                                  <span>Bình thường ({val} {row.unit})</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5">
                              {renderSourceReference(row.sourceReference)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* TAB 2: TIỀN SỬ DỊ ỨNG */}
      {activeTab === 'allergies' && patientRow && (
        <div className="py-1">
          <EncounterDetailAllergiesTab
            patientId={patientRow.patientId}
            patientName={patientRow.name}
            encounterId={patientRow.encounterId}
            onSuccess={onSuccess}
            onError={onError}
          />
        </div>
      )}

      {/* TAB 3: TIỀN SỬ BỆNH & TIM MẠCH */}
      {activeTab === 'medical_history' && patientRow && (
        <div className="py-1">
          <EncounterDetailMedicalHistoryTab
            patientId={patientRow.patientId}
            patientName={patientRow.name}
            encounterId={patientRow.encounterId}
            onSuccess={onSuccess}
            onError={onError}
          />
        </div>
      )}
    </div>
  </Modal>
);
};
