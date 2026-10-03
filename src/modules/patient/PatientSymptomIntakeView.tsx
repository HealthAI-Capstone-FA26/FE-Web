// FR-HM-2.3 — Khai báo triệu chứng ban đầu
// Actor: Bệnh nhân (hoặc Người thân khai hộ)
// Trạng thái: Đã hoàn thiện UI & kết nối API chief-complaint

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Frown,
  Meh,
  Smile,
  Flame,
  AlertCircle,
  Calendar,
  User,
  Stethoscope,
  Loader2,
  Sparkles,
  X,
  RefreshCw,
  FileText,
  ChevronRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { patientService, type PatientResponse } from '../../services/patient/patient.service';
import { encounterService, type EncounterItem } from '../../services/encounter/encounter.service';
import {
  chiefComplaintService,
  type ChiefComplaintResponse,
} from '../../services/reception/chief-complaint.service';

interface SymptomCategory {
  category: string;
  items: string[];
}

const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    category: 'Toàn thân & Thể trạng',
    items: ['Sốt cao / Rét run', 'Mệt mỏi / Kiệt sức', 'Sụt cân bất thường', 'Khó ngủ / Mất ngủ', 'Chán ăn', 'Đổ mồ hôi đêm'],
  },
  {
    category: 'Hô hấp & Tai Mũi Họng',
    items: ['Ho khan kéo dài', 'Ho có đờm', 'Khó thở / Thở rít', 'Đau rát họng', 'Nghẹt mũi / Sổ mũi', 'Khàn tiếng mất giọng'],
  },
  {
    category: 'Tim mạch & Tuần hoàn',
    items: ['Đau thắt ngực', 'Hồi hộp / Đánh trống ngực', 'Chóng mặt / Choáng váng', 'Huyết áp dao động', 'Phù mắt cá chân'],
  },
  {
    category: 'Tiêu hóa & Chuyển hóa',
    items: ['Đau bụng âm ỉ', 'Đau quặn từng cơn', 'Buồn nôn / Nôn ói', 'Tiêu chảy', 'Táo bón / Khó tiêu', 'Ợ chua / Nóng rát'],
  },
  {
    category: 'Cơ xương khớp & Thần kinh',
    items: ['Đau đầu / Căng thẳng', 'Đau mỏi cổ vai gáy', 'Đau nhức khớp', 'Đau thắt lưng', 'Tê bì tay chân', 'Co cứng cơ'],
  },
];

const getPainVisual = (level: number) => {
  if (level === 0) {
    return {
      label: '0 - Không đau',
      color: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      icon: Smile,
      desc: 'Cơ thể hoàn toàn bình thường, không cảm thấy đau hay khó chịu.',
    };
  }
  if (level <= 3) {
    return {
      label: `${level} - Đau nhẹ`,
      color: 'text-blue-700',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-300',
      icon: Smile,
      desc: 'Có cảm giác khó chịu nhưng không gây trở ngại sinh hoạt hàng ngày.',
    };
  }
  if (level <= 6) {
    return {
      label: `${level} - Đau vừa phải`,
      color: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
      icon: Meh,
      desc: 'Đau ảnh hưởng đến công việc, học tập hoặc giấc ngủ; cần nghỉ ngơi.',
    };
  }
  if (level <= 8) {
    return {
      label: `${level} - Đau dữ dội`,
      color: 'text-orange-700',
      badgeBg: 'bg-orange-50 text-orange-800 border-orange-300',
      icon: Frown,
      desc: 'Đau nhiều, cản trở hầu hết các sinh hoạt cơ bản, khó tập trung.',
    };
  }
  return {
    label: `${level} - Rất đau / Khẩn cấp`,
    color: 'text-rose-700',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-300',
    icon: Flame,
    desc: 'Đau đớn tột cùng không thể chịu đựng nổi, cần được can thiệp y tế khẩn.',
  };
};

const formatDateToYMD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const PatientSymptomIntakeView: React.FC = () => {
  // Profiles & Encounters
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [encounters, setEncounters] = useState<EncounterItem[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string>('');
  const [customEncounterId, setCustomEncounterId] = useState<string>('');
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingEncounters, setIsLoadingEncounters] = useState(false);
  const [isLoadingComplaint, setIsLoadingComplaint] = useState(false);

  // Form Fields
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [painLevel, setPainLevel] = useState<number>(0);
  const [symptomOnsetDate, setSymptomOnsetDate] = useState<string>(formatDateToYMD(new Date()));
  const [existingComplaint, setExistingComplaint] = useState<ChiefComplaintResponse | null>(null);

  // Submit & Alert states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Load patient profiles for the user
  const fetchMyPatients = async () => {
    try {
      setIsLoadingPatients(true);
      const res = await patientService.getMyPatients();
      setPatients(res || []);
      if (res && res.length > 0 && !selectedPatientId) {
        setSelectedPatientId(res[0].patientId);
      }
    } catch (err: any) {
      console.error('Lỗi tải danh sách hồ sơ:', err);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchMyPatients();
  }, []);

  // 2. When selectedPatientId changes, fetch encounters
  useEffect(() => {
    if (!selectedPatientId) return;

    let isMounted = true;
    const fetchEncounters = async () => {
      try {
        setIsLoadingEncounters(true);
        const list = await encounterService.getEncounters({ patientId: selectedPatientId });
        if (isMounted) {
          setEncounters(list || []);
          if (list && list.length > 0) {
            setSelectedEncounterId(list[0].encounterId);
          } else {
            setSelectedEncounterId('');
          }
        }
      } catch (err: any) {
        console.warn('Không thể tải lượt khám:', err);
        if (isMounted) {
          setEncounters([]);
          setSelectedEncounterId('');
        }
      } finally {
        if (isMounted) setIsLoadingEncounters(false);
      }
    };

    fetchEncounters();
    return () => {
      isMounted = false;
    };
  }, [selectedPatientId]);

  // 3. When encounterId changes, check for existing chief complaint
  const activeTargetEncounterId = selectedEncounterId || customEncounterId.trim();

  useEffect(() => {
    if (!activeTargetEncounterId) {
      setExistingComplaint(null);
      return;
    }

    let isMounted = true;
    const fetchExistingComplaint = async () => {
      try {
        setIsLoadingComplaint(true);
        const data = await chiefComplaintService.getByEncounterId(activeTargetEncounterId);
        if (isMounted && data) {
          setExistingComplaint(data);
          setChiefComplaint(data.reasonForVisit || '');
          if (data.painLevel !== undefined && data.painLevel !== null) {
            setPainLevel(data.painLevel);
          }
          if (data.symptomOnsetDate) {
            const parsedDate = new Date(data.symptomOnsetDate);
            if (!isNaN(parsedDate.getTime())) {
              setSymptomOnsetDate(formatDateToYMD(parsedDate));
            }
          }
          if (data.symptoms) {
            const list = data.symptoms
              .split(/[,;\n]+/)
              .map((s) => s.trim())
              .filter(Boolean);
            setSelectedSymptoms(list);
          }
        }
      } catch (err: any) {
        // 404 meaning no existing complaint yet - normal case
        if (isMounted) {
          setExistingComplaint(null);
        }
      } finally {
        if (isMounted) setIsLoadingComplaint(false);
      }
    };

    fetchExistingComplaint();
    return () => {
      isMounted = false;
    };
  }, [activeTargetEncounterId]);

  // Symptom toggling
  const toggleSymptom = (item: string) => {
    if (selectedSymptoms.includes(item)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== item));
    } else {
      setSelectedSymptoms([...selectedSymptoms, item]);
    }
  };

  const handleAddCustomSymptom = () => {
    const trimmed = customSymptom.trim();
    if (trimmed && !selectedSymptoms.includes(trimmed)) {
      setSelectedSymptoms([...selectedSymptoms, trimmed]);
      setCustomSymptom('');
    }
  };

  const handleRemoveSymptom = (item: string) => {
    setSelectedSymptoms(selectedSymptoms.filter((s) => s !== item));
  };

  // Quick onset date presets
  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setSymptomOnsetDate(formatDateToYMD(d));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetEncounter = activeTargetEncounterId;
    if (!targetEncounter) {
      setErrorMessage(
        'Vui lòng chọn hoặc nhập mã lượt khám (Encounter ID) để gửi thông tin triệu chứng tới bác sĩ.'
      );
      return;
    }

    if (!chiefComplaint.trim()) {
      setErrorMessage('Vui lòng mô tả lý do chính đi khám bệnh.');
      return;
    }

    if (chiefComplaint.length > 255) {
      setErrorMessage('Lý do khám không được vượt quá 255 ký tự theo quy định hệ thống.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        reasonForVisit: chiefComplaint.trim(),
        symptoms: selectedSymptoms.length > 0 ? selectedSymptoms.join(', ') : undefined,
        symptomOnsetDate: symptomOnsetDate ? new Date(symptomOnsetDate).toISOString() : undefined,
        painLevel: painLevel,
        inputChannel: 'online_pre_visit' as const,
      };

      const res = await chiefComplaintService.upsert(targetEncounter, payload);
      setExistingComplaint(res);
      setSuccessMessage(
        'Khai báo triệu chứng ban đầu đã được lưu và gửi tới hồ sơ bệnh án thành công!'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Lỗi khi gửi khai báo:', err);
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi lưu thông tin triệu chứng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const painVisual = useMemo(() => getPainVisual(painLevel), [painLevel]);
  const PainIcon = painVisual.icon;

  const currentPatient = patients.find((p) => p.patientId === selectedPatientId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-slate-800 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Tiếp Đón Thông Minh & Phân Luồng Khám</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Khai Báo Triệu Chứng Ban Đầu
            </h1>
            <p className="text-xs md:text-sm text-blue-100/90 max-w-2xl font-normal leading-relaxed">
              Mô tả chi tiết tình trạng sức khỏe hiện tại giúp Bác sĩ và Điều dưỡng nắm trước tiền sử,
              chuẩn bị thiết bị và hỗ trợ khám nhanh chóng hơn.
            </p>
          </div>
          <Badge variant="ai" size="md" className="shrink-0 border-white/30 text-white shadow-md">
            FR-HM-2.3
          </Badge>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-2xl flex items-start gap-3.5 text-emerald-900 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs md:text-sm">
            <p className="font-extrabold">{successMessage}</p>
            <p className="text-emerald-700 text-xs mt-0.5">
              Bác sĩ phụ trách ca khám sẽ tự động nhận được các thông tin này trên màn hình Khám bệnh lâm sàng.
            </p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50/90 border border-rose-300 rounded-2xl flex items-start gap-3.5 text-rose-900 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs md:text-sm">
            <p className="font-extrabold">Không thể gửi khai báo</p>
            <p className="text-rose-700 text-xs mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bước 1: Chọn Hồ Sơ Bệnh Nhân & Lượt Khám */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                1. Chọn Hồ Sơ & Lượt Khám Cần Khai Báo
              </h3>
              <p className="text-[11px] text-slate-500">
                Thông tin triệu chứng sẽ được liên kết trực tiếp vào hồ sơ khám (Encounter) của bệnh nhân.
              </p>
            </div>
          </div>
          {isLoadingPatients && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
        </div>

        {/* Danh sách Profile Bệnh nhân */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Hồ sơ bệnh nhân *
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/60"
            >
              {patients.length === 0 ? (
                <option value="">Chưa có hồ sơ bệnh nhân</option>
              ) : (
                patients.map((p) => (
                  <option key={p.patientId} value={p.patientId}>
                    {p.fullName} ({p.relationship || 'Bản thân'}) - Mã BN: {p.patientCode}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lượt khám / Lịch hẹn đang hoạt động *
            </label>
            {isLoadingEncounters ? (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Đang tải các lượt khám của bệnh nhân...</span>
              </div>
            ) : encounters.length > 0 ? (
              <select
                value={selectedEncounterId}
                onChange={(e) => {
                  setSelectedEncounterId(e.target.value);
                  setCustomEncounterId('');
                }}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/60"
              >
                {encounters.map((enc) => (
                  <option key={enc.encounterId} value={enc.encounterId}>
                    Mã khám: {enc.encounterId.slice(0, 8)}... - Trạng thái: {enc.status || 'Đang chờ'}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Nhập mã lượt khám thủ công (Encounter UUID)..."
                  value={customEncounterId}
                  onChange={(e) => setCustomEncounterId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/60"
                />
              </div>
            )}
          </div>
        </div>

        {encounters.length === 0 && !customEncounterId && (
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center gap-2.5 text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Bệnh nhân này chưa có lượt khám nào trên hệ thống. Bạn có thể nhập mã lượt khám thủ công ở trên hoặc tiến hành đặt lịch khám trước.
            </span>
          </div>
        )}

        {existingComplaint && (
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-3 text-blue-900 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Lượt khám này đã có thông tin khai báo trước đó (Cập nhật lần cuối: {new Date(existingComplaint.updatedAt).toLocaleString('vi-VN')}). Bạn có thể chỉnh sửa và gửi lại.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Form Nhập Triệu Chứng Chi Tiết */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bước 2: Chi tiết triệu chứng */}
        <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                2. Chi Tiết Triệu Chứng & Cảm Nhận Lâm Sàng
              </h3>
              <p className="text-[11px] text-slate-500">
                Điền trung thực và cụ thể để hỗ trợ bác sĩ chẩn đoán chính xác.
              </p>
            </div>
          </div>

          {/* Lý do chính đi khám */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Lý do chính đi khám bệnh *
              </label>
              <span className={`text-[10px] font-bold ${chiefComplaint.length > 255 ? 'text-rose-600' : 'text-slate-400'}`}>
                {chiefComplaint.length}/255 ký tự
              </span>
            </div>
            <textarea
              rows={3}
              required
              maxLength={255}
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 transition-all font-medium leading-relaxed"
              placeholder="VD: Đau đầu âm ỉ kéo dài 2 ngày nay kèm sốt nhẹ về chiều, mệt mỏi ăn uống kém..."
            />
          </div>

          {/* Chọn nhanh các triệu chứng theo nhóm */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Chọn các biểu hiện hoặc triệu chứng bạn đang gặp phải:
              </label>
              <span className="text-[11px] font-bold text-blue-600">
                Đã chọn: {selectedSymptoms.length} triệu chứng
              </span>
            </div>

            <div className="space-y-3.5">
              {SYMPTOM_CATEGORIES.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {cat.category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map((item) => {
                      const isSelected = selectedSymptoms.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleSymptom(item)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-[1.02]'
                              : 'bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {isSelected ? `✓ ${item}` : `+ ${item}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Thêm triệu chứng khác */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Thêm triệu chứng khác (nếu không có trong danh sách trên):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập triệu chứng rồi bấm Thêm hoặc Enter..."
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSymptom();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSymptom}
                  className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm border-none active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>
            </div>

            {/* Danh sách Tags đã chọn */}
            {selectedSymptoms.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Tổng hợp danh sách triệu chứng đã ghi nhận:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSymptoms.map((sym) => (
                    <span
                      key={sym}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100/70 text-blue-900 border border-blue-200"
                    >
                      <Tag className="w-3 h-3 text-blue-600" />
                      <span>{sym}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSymptom(sym)}
                        className="hover:text-rose-600 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Thang điểm đau VAS (0 - 10) */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200 rounded-3xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PainIcon className={`w-5 h-5 ${painVisual.color}`} />
                <label className="text-xs font-bold text-slate-800">
                  Thang điểm đau / mức độ khó chịu (VAS 0 - 10):
                </label>
              </div>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full border shadow-2xs ${painVisual.badgeBg}`}>
                {painVisual.label}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={painLevel}
              onChange={(e) => setPainLevel(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
              <span>0 (Không đau)</span>
              <span>3 (Đau nhẹ)</span>
              <span>5 (Đau vừa)</span>
              <span>7 (Đau nhiều)</span>
              <span>10 (Cấp cứu)</span>
            </div>

            <p className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-200/60 font-medium">
              💡 {painVisual.desc}
            </p>
          </div>

          {/* Ngày khởi phát triệu chứng */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Thời gian bắt đầu xuất hiện triệu chứng:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="relative">
                <input
                  type="date"
                  max={formatDateToYMD(new Date())}
                  value={symptomOnsetDate}
                  onChange={(e) => setSymptomOnsetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="px-2.5 py-2 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="px-2.5 py-2 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  Hôm qua
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(3)}
                  className="px-2.5 py-2 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  3 ngày trước
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(7)}
                  className="px-2.5 py-2 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  1 tuần trước
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tóm tắt xem trước trước khi gửi */}
        <div className="bg-slate-900 text-white p-5 md:p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs md:text-sm font-bold tracking-tight">
                Phiếu Tóm Tắt Tiền Khám Gửi Bác Sĩ
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Kênh: Trực tuyến (Web Portal)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Bệnh nhân:</span>
              <span className="font-bold text-white">
                {currentPatient ? `${currentPatient.fullName} (${currentPatient.patientCode})` : 'Chưa chọn'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Lượt khám liên kết:</span>
              <span className="font-bold text-blue-300">
                {activeTargetEncounterId ? activeTargetEncounterId.slice(0, 13) + '...' : 'Chưa chọn'}
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-400 block text-[11px]">Lý do khám chính:</span>
              <span className="font-semibold text-slate-200 italic">
                "{chiefComplaint || 'Chưa nhập lý do'}"
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Mức độ đau / khó chịu:</span>
              <span className="font-bold text-amber-400">
                {painVisual.label}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Ngày khởi phát:</span>
              <span className="font-bold text-white">
                {symptomOnsetDate ? new Date(symptomOnsetDate).toLocaleDateString('vi-VN') : 'Chưa rõ'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <p className="text-[11px] text-slate-400">
              * Dữ liệu được bảo mật y tế và đồng bộ tức thời với hồ sơ ca khám của Bệnh viện.
            </p>
            <button
              type="submit"
              disabled={isSubmitting || !activeTargetEncounterId}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/25 border-none active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi dữ liệu...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Khai Báo Triệu Chứng</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
