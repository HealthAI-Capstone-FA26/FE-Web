import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search, CheckCircle2, Clock, FileText,
  Clipboard, BookOpen, AlertCircle, ArrowRight, User, Loader2,
  Eye, Image as ImageIcon, ExternalLink, RefreshCw, X, AlertTriangle, Check, FlaskConical,
  HeartPulse, Stethoscope, Calendar, Activity, CheckSquare, Square
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { icd10Service } from '../../services/icd10/icd10.service';
import {
  postTestConsultationService,
  type PostTestTimelineResponse,
} from '../../services/doctor/post-test-consultation.service';
import { type TimelineEvent } from '../../services/doctor/case-timeline.service';
import { encounterService, type EncounterItem } from '../../services/encounter/encounter.service';
import { resolveAttachmentUrl } from '../../services/lab/lab-result.service';
import { useAuth } from '../../context/AuthContext';
import { BorderBeam } from '../../components/ui/border-beam';
import { Mascot } from 'page-mascot';

/* 
 * DESIGN READ:
 * Component Kind: Post-Test Cardiology Diagnosis & Treatment Consultation Panel (Mô-đun 8 / SE05)
 * Specialty: Cardiology Clinic Only (Phòng Khám Chuyên Khoa Tim Mạch)
 * Audience: Cardiologists reviewing completed paraclinical tests (Blood/Troponin, ECG, Echo, X-ray),
 *           selecting official ICD-10 cardiovascular diagnosis, and formulating treatment consultations.
 */

// Danh mục mã bệnh ICD-10 tim mạch phổ biến (Gợi ý nhanh cho Bác sĩ Tim mạch)
const CARDIOLOGY_QUICK_ICD10 = [
  { code: 'I20.9', name: 'Đau thắt ngực, không đặc hiệu (Angina pectoris, unspecified)', shortName: 'Đau thắt ngực' },
  { code: 'I21.9', name: 'Nhồi máu cơ tim cấp, không đặc hiệu (Acute myocardial infarction)', shortName: 'Nhồi máu cơ tim cấp' },
  { code: 'I25.1', name: 'Bệnh tim do xơ vữa động mạch (Atherosclerotic heart disease)', shortName: 'Bệnh tim xơ vữa' },
  { code: 'I50.9', name: 'Suy tim, không đặc hiệu (Heart failure, unspecified)', shortName: 'Suy tim' },
  { code: 'I10', name: 'Tăng huyết áp vô căn (nguyên phát) (Essential hypertension)', shortName: 'Tăng huyết áp' },
  { code: 'I48.9', name: 'Rung nhĩ và cuồng nhĩ, không đặc hiệu (Atrial fibrillation & flutter)', shortName: 'Rung nhĩ / Cuồng nhĩ' },
  { code: 'I47.1', name: 'Nhịp nhanh trên thất kịch phát (Supraventricular tachycardia)', shortName: 'Nhịp nhanh trên thất' },
  { code: 'I42.0', name: 'Bệnh cơ tim giãn (Dilated cardiomyopathy)', shortName: 'Bệnh cơ tim giãn' },
  { code: 'I35.0', name: 'Hẹp van động mạch chủ (Aortic valve stenosis)', shortName: 'Hẹp van ĐMC' },
  { code: 'I05.0', name: 'Hẹp van hai lá do thấp (Rheumatic mitral stenosis)', shortName: 'Hẹp van 2 lá' },
];

interface CurrentPatientInfo {
  id: string;
  encounterId: string;
  name: string;
  age: number | string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  bloodType: string;
  allergies: string;
  history: string;
  symptoms: string;
  clinicalExam: string;
  existingDiagnosis?: {
    code: string;
    name: string;
    notes?: string;
    isPrimary?: boolean;
  };
  defaultAdvice: {
    explanation: string;
    plan: string;
    lifestyle: string;
    nutrition: string;
    followUpRequired: boolean;
    followUpIntervalDays: number;
  };
}

export const DoctorDiagnosisView: React.FC = () => {
  const { user } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    return localStorage.getItem('doctor_selected_patient_id') || '';
  });

  const [apiEncounters, setApiEncounters] = useState<EncounterItem[]>([]);
  const [isLoadingEncounters, setIsLoadingEncounters] = useState(false);
  const [timelineData, setTimelineData] = useState<PostTestTimelineResponse | null>(null);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);
  const [selectedLabEvent, setSelectedLabEvent] = useState<TimelineEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cache timeline data theo encounterId
  const timelineCache = useRef<Map<string, PostTestTimelineResponse>>(new Map());

  const handleSelectPatientId = (id: string) => {
    setSelectedPatientId(id);
    localStorage.setItem('doctor_selected_patient_id', id);
  };

  // Tải danh sách ca khám thực tế từ API encounters
  const fetchEncounters = async () => {
    try {
      setIsLoadingEncounters(true);
      const data = await encounterService.getEncounters(user?.doctorId ? { doctorId: user.doctorId } : undefined);
      if (Array.isArray(data)) {
        setApiEncounters(data);
        const currentSaved = localStorage.getItem('doctor_selected_patient_id');
        const match = data.find((e) => e.encounterId === currentSaved || e.encounterCode === currentSaved);
        if (match) {
          setSelectedPatientId(match.encounterId);
        } else if (data.length > 0 && (!currentSaved || !data.some((e) => e.encounterId === currentSaved))) {
          setSelectedPatientId(data[0].encounterId);
          localStorage.setItem('doctor_selected_patient_id', data[0].encounterId);
        }
      }
    } catch (err) {
      console.warn('Lỗi khi tải danh sách ca khám:', err);
    } finally {
      setIsLoadingEncounters(false);
    }
  };

  useEffect(() => {
    fetchEncounters();
  }, [user?.doctorId]);

  // Đồng bộ selectedPatientId từ localStorage (khi chọn bệnh nhân ở Tab khác)
  useEffect(() => {
    const handleStorage = () => {
      const val = localStorage.getItem('doctor_selected_patient_id');
      if (val && val !== selectedPatientId) {
        setSelectedPatientId(val);
      }
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 1000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [selectedPatientId]);

  // Tìm ca khám thật tương ứng với selectedPatientId
  const activeEncounter = useMemo(() => {
    return apiEncounters.find(
      (e) =>
        e.encounterId === selectedPatientId ||
        e.encounterCode === selectedPatientId ||
        e.patient?.patientCode === selectedPatientId ||
        e.patient?.patientId === selectedPatientId
    );
  }, [apiEncounters, selectedPatientId]);

  const activeEncounterId = activeEncounter?.encounterId || (selectedPatientId.includes('-') && selectedPatientId.length > 30 ? selectedPatientId : undefined);

  // Lọc danh sách ca khám theo từ khóa tìm kiếm (Tên, mã LK, mã BN, SĐT)
  const filteredEncounters = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return apiEncounters;
    return apiEncounters.filter((enc) => {
      const nameMatch = enc.patient?.fullName?.toLowerCase().includes(term);
      const encCodeMatch = enc.encounterCode?.toLowerCase().includes(term);
      const patCodeMatch = enc.patient?.patientCode?.toLowerCase().includes(term);
      const phoneMatch = enc.patient?.phoneNumber?.toLowerCase().includes(term);
      const idMatch = enc.encounterId?.toLowerCase().includes(term);
      return Boolean(nameMatch || encCodeMatch || patCodeMatch || phoneMatch || idMatch);
    });
  }, [apiEncounters, searchTerm]);

  // Fetch timeline có cache
  const fetchTimeline = useCallback(async (encounterId: string, forceRefresh = false) => {
    if (!forceRefresh && timelineCache.current.has(encounterId)) {
      setTimelineData(timelineCache.current.get(encounterId)!);
      setIsLoadingTimeline(false);
      postTestConsultationService.getTimeline(encounterId)
        .then((res) => {
          timelineCache.current.set(encounterId, res);
          setTimelineData((prev) =>
            prev?.encounter?.encounterId === encounterId ? res : prev
          );
        })
        .catch(() => { /* silent fail */ });
      return;
    }
    setTimelineData(null);
    setIsLoadingTimeline(true);
    try {
      const res = await postTestConsultationService.getTimeline(encounterId);
      timelineCache.current.set(encounterId, res);
      setTimelineData((prev) => {
        return activeEncounterId === encounterId ? res : prev;
      });
    } catch (err) {
      console.warn('Lỗi tải timeline ca khám:', err);
      setTimelineData(null);
    } finally {
      setIsLoadingTimeline(false);
    }
  }, [activeEncounterId]);

  useEffect(() => {
    if (!activeEncounterId) {
      setTimelineData(null);
      return;
    }
    fetchTimeline(activeEncounterId);
  }, [activeEncounterId, fetchTimeline]);

  // Tải trước ngầm 2-3 ca tiếp theo trong hàng đợi
  useEffect(() => {
    if (!activeEncounterId || apiEncounters.length === 0) return;

    let isCancelled = false;
    const currentIndex = apiEncounters.findIndex(
      (e) => e.encounterId === activeEncounterId || e.encounterCode === activeEncounterId
    );

    const nextEncounters = apiEncounters
      .slice(currentIndex >= 0 ? currentIndex + 1 : 0, (currentIndex >= 0 ? currentIndex + 1 : 0) + 3)
      .filter((e) => e.encounterId && !timelineCache.current.has(e.encounterId));

    if (nextEncounters.length === 0) return;

    const timer = setTimeout(async () => {
      for (const enc of nextEncounters) {
        if (isCancelled) break;
        try {
          const prefetchData = await postTestConsultationService.getTimeline(enc.encounterId);
          if (!isCancelled) {
            timelineCache.current.set(enc.encounterId, prefetchData);
          }
        } catch {
          // Bỏ qua lỗi ngầm
        }
      }
    }, 800);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [activeEncounterId, apiEncounters]);

  // Form states cho Chẩn đoán ICD-10 chính thức
  const [icd10Search, setIcd10Search] = useState('');
  const [selectedIcd, setSelectedIcd] = useState<{ code: string; name: string }>({
    code: 'I20.9',
    name: 'Đau thắt ngực, không đặc hiệu (Angina pectoris, unspecified)',
  });
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [isPrimaryDiagnosis, setIsPrimaryDiagnosis] = useState(true);

  // Form states cho Tư vấn Điều trị (Treatment Consultation)
  const [expNote, setExpNote] = useState('');
  const [planNote, setPlanNote] = useState('');
  const [lifeNote, setLifeNote] = useState('');
  const [nutritionNote, setNutritionNote] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpIntervalDays, setFollowUpIntervalDays] = useState<number>(14);

  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);

  // Thông tin tổng hợp của bệnh nhân hiện tại
  const currentPatient = useMemo<CurrentPatientInfo | null>(() => {
    const validTimeline = timelineData?.encounter?.encounterId === activeEncounterId ? timelineData : null;

    if (!activeEncounter && !validTimeline?.patient) {
      return null;
    }

    const enc = activeEncounter;
    const pat = validTimeline?.patient || enc?.patient;

    let age: number | string = '—';
    let dob = 'Chưa rõ';
    if (pat?.dateOfBirth) {
      const birth = new Date(pat.dateOfBirth);
      dob = birth.toLocaleDateString('vi-VN');
      const diff = Date.now() - birth.getTime();
      age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

    const gender = (pat?.gender === 'female' ? 'Nữ' : 'Nam') as 'Nam' | 'Nữ';
    const bloodType = pat?.bloodType || 'Chưa rõ';

    const allergies = validTimeline?.allergies?.length
      ? validTimeline.allergies.map((a) => a.allergenName).join(', ')
      : 'Chưa ghi nhận dị ứng';

    const history = validTimeline?.medicalHistories?.length
      ? validTimeline.medicalHistories.map((h) => h.conditionName).join(', ')
      : 'Chưa ghi nhận tiền sử';

    // Trích xuất các sự kiện từ timeline đúng ca khám
    const diagEvent = validTimeline?.timeline?.find((t) => t.type === 'diagnosis');
    const clinicalExamEvent = validTimeline?.timeline?.find((t) => t.type === 'clinical_examination');
    const chiefComplaintEvent = validTimeline?.timeline?.find((t) => t.type === 'chief_complaint');
    const consultEvent = validTimeline?.timeline?.find((t) => t.type === 'treatment_consultation');

    const symptoms =
      chiefComplaintEvent?.data?.symptoms ||
      chiefComplaintEvent?.data?.reasonForVisit ||
      activeEncounter?.chiefComplaint?.symptoms ||
      activeEncounter?.chiefComplaint?.reasonForVisit ||
      'Chưa ghi nhận triệu chứng';

    const clinicalExamParts = [
      clinicalExamEvent?.data?.auscultationFindings ? `Nghe tim phổi: ${clinicalExamEvent.data.auscultationFindings}` : '',
      clinicalExamEvent?.data?.inspectionFindings ? `Nhìn: ${clinicalExamEvent.data.inspectionFindings}` : '',
      clinicalExamEvent?.data?.palpationFindings ? `Sờ: ${clinicalExamEvent.data.palpationFindings}` : '',
      clinicalExamEvent?.data?.percussionFindings ? `Gõ: ${clinicalExamEvent.data.percussionFindings}` : '',
      clinicalExamEvent?.data?.patientPosition ? `Tư thế: ${clinicalExamEvent.data.patientPosition}` : '',
      clinicalExamEvent?.data?.clinicalNotes ? `Nhận định: ${clinicalExamEvent.data.clinicalNotes}` : '',
      clinicalExamEvent?.data?.examinationFindings,
    ].filter(Boolean);

    const clinicalExam = clinicalExamParts.length > 0 ? clinicalExamParts.join(' | ') : 'Chưa có kết quả khám lâm sàng';

    const existingDiagnosis = diagEvent?.data?.icd10Code || diagEvent?.data?.icd10?.icd10Code
      ? {
        code: diagEvent.data.icd10Code || diagEvent.data.icd10.icd10Code,
        name: diagEvent.data.diagnosisName || diagEvent.data.icd10?.descriptionVi || diagEvent.data.icd10?.descriptionEn || '',
        notes: diagEvent.data.notes || diagEvent.data.clinicalNotes || '',
        isPrimary: diagEvent.data.isPrimary ?? true,
      }
      : undefined;

    const defaultAdvice = {
      explanation: consultEvent?.data?.conditionExplanation || '',
      plan: consultEvent?.data?.treatmentPlan || '',
      lifestyle: consultEvent?.data?.lifestyleAdvice || '',
      nutrition: consultEvent?.data?.nutritionAdvice || '',
      followUpRequired: Boolean(consultEvent?.data?.followUpRequired),
      followUpIntervalDays: consultEvent?.data?.followUpIntervalDays || 14,
    };

    return {
      id: enc?.encounterCode || pat?.patientCode || enc?.encounterId || 'N/A',
      encounterId: activeEncounterId || enc?.encounterId || '',
      name: pat?.fullName || 'Bệnh nhân',
      age,
      gender,
      dob,
      bloodType,
      allergies,
      history,
      symptoms,
      clinicalExam,
      existingDiagnosis,
      defaultAdvice,
    };
  }, [activeEncounter, timelineData, activeEncounterId]);

  // Reset form khi bác sĩ đổi ca khám
  useEffect(() => {
    setExpNote('');
    setPlanNote('');
    setLifeNote('');
    setNutritionNote('');
    setFollowUpRequired(false);
    setFollowUpIntervalDays(14);
    setSelectedIcd({
      code: 'I20.9',
      name: 'Đau thắt ngực, không đặc hiệu (Angina pectoris, unspecified)',
    });
    setDiagnosisNotes('');
    setIsPrimaryDiagnosis(true);
    setIcd10Search('');
    setIsSubmitSuccess(false);
    setSubmitError(null);
  }, [activeEncounterId]);

  // Điền dữ liệu từ timeline nếu ca khám đã có chẩn đoán hoặc tư vấn trước đó
  useEffect(() => {
    if (!timelineData || !currentPatient) return;

    if (currentPatient.defaultAdvice.explanation || currentPatient.defaultAdvice.plan) {
      setExpNote(currentPatient.defaultAdvice.explanation);
      setPlanNote(currentPatient.defaultAdvice.plan);
      setLifeNote(currentPatient.defaultAdvice.lifestyle);
      setNutritionNote(currentPatient.defaultAdvice.nutrition);
      setFollowUpRequired(currentPatient.defaultAdvice.followUpRequired);
      setFollowUpIntervalDays(currentPatient.defaultAdvice.followUpIntervalDays || 14);
    }

    if (currentPatient.existingDiagnosis?.code) {
      setSelectedIcd({
        code: currentPatient.existingDiagnosis.code,
        name: currentPatient.existingDiagnosis.name,
      });
      if (currentPatient.existingDiagnosis.notes) {
        setDiagnosisNotes(currentPatient.existingDiagnosis.notes);
      }
      if (currentPatient.existingDiagnosis.isPrimary !== undefined) {
        setIsPrimaryDiagnosis(currentPatient.existingDiagnosis.isPrimary);
      }
    }
  }, [timelineData, currentPatient]);

  // Autocomplete tra cứu mã ICD-10
  const [searchResults, setSearchResults] = useState<Array<{ code: string; name: string }>>([]);
  const [isSearchingIcd, setIsSearchingIcd] = useState(false);

  useEffect(() => {
    if (!icd10Search.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingIcd(true);
        const apiResults = await icd10Service.searchIcd10({ search: icd10Search.trim(), limit: 20 });
        if (apiResults && apiResults.length > 0) {
          setSearchResults(
            apiResults.map((r) => ({
              code: r.icd10Code,
              name: r.icd10NameVi || r.icd10Name,
            }))
          );
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.warn('Lỗi tra cứu ICD-10:', err);
        setSearchResults([]);
      } finally {
        setIsSearchingIcd(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [icd10Search]);

  const handleSelectIcd = (item: { code: string; name: string }) => {
    setSelectedIcd(item);
    setIcd10Search('');
  };

  // Tính ngày tái khám dự kiến hiển thị cho người dùng
  const computedFollowUpDate = useMemo(() => {
    if (!followUpRequired || !followUpIntervalDays) return null;
    const target = new Date();
    target.setDate(target.getDate() + Number(followUpIntervalDays));
    return target.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, [followUpRequired, followUpIntervalDays]);

  // Lưu Chẩn đoán & Tư vấn điều trị
  const handleSaveDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!activeEncounterId) {
      setSubmitError('Vui lòng chọn một ca khám trước khi lưu.');
      return;
    }

    if (!selectedIcd.code) {
      setSubmitError('Vui lòng chọn một mã bệnh ICD-10 chẩn đoán chính thức.');
      return;
    }

    if (!expNote.trim()) {
      setSubmitError('Vui lòng nhập nội dung giải thích tình trạng bệnh cho bệnh nhân.');
      return;
    }

    if (!planNote.trim()) {
      setSubmitError('Vui lòng nhập phương án điều trị đề xuất.');
      return;
    }

    if (followUpRequired && (followUpIntervalDays < 1 || followUpIntervalDays > 730)) {
      setSubmitError('Số ngày hẹn tái khám phải nằm trong khoảng từ 1 đến 730 ngày.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Ghi nhận kết luận chẩn đoán chính thức (POST /post-test-consultation/encounters/:id/diagnosis-conclusion)
      await postTestConsultationService.createDiagnosisConclusion(activeEncounterId, {
        icd10Code: selectedIcd.code,
        diagnosisName: selectedIcd.name,
        isPrimary: isPrimaryDiagnosis,
        notes: diagnosisNotes.trim() || undefined,
      });

      // 2. Lưu tư vấn điều trị và hoàn tất lượt khám (PUT /post-test-consultation/encounters/:id/treatment-consultation)
      await postTestConsultationService.upsertTreatmentConsultation(activeEncounterId, {
        conditionExplanation: expNote.trim(),
        treatmentPlan: planNote.trim(),
        lifestyleAdvice: lifeNote.trim() || undefined,
        nutritionAdvice: nutritionNote.trim() || undefined,
        followUpRequired,
        followUpIntervalDays: followUpRequired ? Number(followUpIntervalDays) : undefined,
      });

      setIsSubmitSuccess(true);

      // Invalidate cache và refresh timeline
      timelineCache.current.delete(activeEncounterId);
      await fetchTimeline(activeEncounterId, true);

      setTimeout(() => {
        setIsSubmitSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error('Lỗi khi lưu kết luận chẩn đoán & tư vấn:', err);
      const errMsg = err?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu kết luận chẩn đoán.';
      setSubmitError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 animate-in fade-in duration-200">

      {/* Module Title Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Mascot
            directions="/mascots/mydoctor-directions.png"
            reactions="/mascots/mydoctor-reactions.png"
            size={120}
            className="shrink-0"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Kết Luận Chẩn Đoán & Tư Vấn Phác Đồ Tim Mạch
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Đối chiếu kết quả xét nghiệm, điện tim ECG; ra quyết định chẩn đoán ICD-10 và tư vấn điều trị.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 text-xs font-bold text-blue-900 shrink-0">
          <User className="w-4 h-4 text-blue-700" />
          <span>
            {activeEncounter || currentPatient
              ? (() => {
                  const name = timelineData?.patient?.fullName || activeEncounter?.patient?.fullName || currentPatient?.name;
                  const pCode = timelineData?.patient?.patientCode || activeEncounter?.patient?.patientCode;
                  const encCode = timelineData?.encounter?.encounterCode || activeEncounter?.encounterCode;
                  const codeDetails = [pCode, encCode].filter(Boolean).join(' • ');
                  return `Bệnh nhân: ${name}${codeDetails ? ` (${codeDetails})` : ''}`;
                })()
              : 'Chưa chọn bệnh nhân'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left column: Patient Queue & EMR Timeline (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Patient Selector */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-rose-600" />
                <span>Hàng đợi khám Bác sĩ Tim mạch</span>
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="info" size="sm">
                  {searchTerm
                    ? `${filteredEncounters.length}/${apiEncounters.length} Ca`
                    : `${String(apiEncounters.length).padStart(2, '0')} Ca`}
                </Badge>
                <button
                  type="button"
                  onClick={fetchEncounters}
                  disabled={isLoadingEncounters}
                  className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-1"
                  title="Làm mới danh sách"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEncounters ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Ô tìm kiếm bệnh nhân nhanh */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên, mã LK, mã BN, SĐT..."
                className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-600 transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
              {isLoadingEncounters && (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Đang tải danh sách ca khám...</span>
                </div>
              )}

              {!isLoadingEncounters && filteredEncounters.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  {searchTerm ? `Không tìm thấy ca khám nào khớp với "${searchTerm}"` : 'Chưa có ca khám nào trong hàng đợi'}
                </div>
              )}

              {filteredEncounters.map((enc) => {
                const patName = enc.patient?.fullName || 'Bệnh nhân';
                const patCode = enc.encounterCode || enc.patient?.patientCode || enc.encounterId.slice(0, 8);
                const isSelected = selectedPatientId === enc.encounterId || selectedPatientId === enc.encounterCode;
                const isReady = enc.status === 'awaiting_review' || enc.status === 'in_progress' || enc.status === 'finished';

                return (
                  <div
                    key={enc.encounterId}
                    onClick={() => handleSelectPatientId(enc.encounterId)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex justify-between items-center ${isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-300'
                      : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                      }`}
                  >
                    <div>
                      <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <span>{patName}</span>
                        {enc.status && (
                          <span className="text-[9px] font-semibold text-slate-600 bg-slate-200/70 px-1.5 py-0.2 rounded font-mono">
                            {enc.status}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{patCode}</div>
                    </div>
                    <Badge variant={isReady ? 'normal' : 'warning'} size="sm">
                      {isReady ? 'Đã có KQ CLS' : 'Đang thực hiện'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EMR Timeline View */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-700 animate-pulse" />
                <span>Tiến trình bệnh án điện tử (EMR Timeline)</span>
              </h3>
              {activeEncounterId && (
                <button
                  type="button"
                  onClick={() => {
                    timelineCache.current.delete(activeEncounterId);
                    fetchTimeline(activeEncounterId, true);
                  }}
                  disabled={isLoadingTimeline}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingTimeline ? 'animate-spin' : ''}`} />
                  <span>Cập nhật</span>
                </button>
              )}
            </div>

            {isLoadingTimeline ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="font-semibold">Đang tải dòng thời gian và kết quả cận lâm sàng...</span>
              </div>
            ) : timelineData?.timeline && timelineData.encounter?.encounterId === activeEncounterId && timelineData.timeline.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-5 text-xs">
                {timelineData.timeline.map((event, idx) => {
                  const eventDate = event.occurredAt ? new Date(event.occurredAt) : null;
                  const eventTime = eventDate
                    ? `${eventDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • ${eventDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                    : '';

                  if (event.type === 'chief_complaint') {
                    return (
                      <div key={idx} className="relative">
                        <span className="w-3.5 h-3.5 bg-blue-600 rounded-full absolute -left-[32px] top-0.5 ring-4 ring-blue-100 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        </span>
                        <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wide">
                          {eventTime} — Tiếp nhận khám (Mô-đun 3)
                        </span>
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-800">
                            {event.data?.reasonForVisit ? `Lý do khám: ${event.data.reasonForVisit}` : event.summary}
                          </p>
                          {event.data?.symptoms && (
                            <p className="text-slate-500 italic">Triệu chứng: {event.data.symptoms}</p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (event.type === 'vital_sign_session') {
                    const obsList = event.data?.observations || [];
                    return (
                      <div key={idx} className="relative">
                        <span className="w-3.5 h-3.5 bg-emerald-600 rounded-full absolute -left-[32px] top-0.5 ring-4 ring-emerald-100 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        </span>
                        <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wide">
                          {eventTime} — Đo sinh hiệu tim mạch (Mô-đun 4)
                        </span>
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-800">{event.summary}</p>
                          {obsList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {obsList.map((obs: any, oIdx: number) => (
                                <span
                                  key={oIdx}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${obs.isAbnormal
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-slate-100 text-slate-700'
                                    }`}
                                >
                                  {obs.item?.itemName || obs.item?.itemCode || 'Chỉ số'}: {obs.observationValue} {obs.item?.unit || ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (event.type === 'clinical_examination') {
                    return (
                      <div key={idx} className="relative">
                        <span className="w-3.5 h-3.5 bg-purple-600 rounded-full absolute -left-[32px] top-0.5 ring-4 ring-purple-100 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        </span>
                        <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wide">
                          {eventTime} — Khám lâm sàng tim mạch (Mô-đun 5)
                        </span>
                        <div className="space-y-0.5 text-xs">
                          {event.data?.auscultationFindings && (
                            <p className="font-extrabold text-slate-800">
                              Nghe tim phổi: {event.data.auscultationFindings}
                            </p>
                          )}
                          {event.data?.inspectionFindings && (
                            <p className="text-slate-700">Nhìn: {event.data.inspectionFindings}</p>
                          )}
                          {event.data?.palpationFindings && (
                            <p className="text-slate-700">Sờ: {event.data.palpationFindings}</p>
                          )}
                          {event.data?.percussionFindings && (
                            <p className="text-slate-700">Gõ: {event.data.percussionFindings}</p>
                          )}
                          {event.data?.patientPosition && (
                            <p className="text-slate-500 text-[11px]">Tư thế: {event.data.patientPosition}</p>
                          )}
                          {!event.data?.auscultationFindings && !event.data?.inspectionFindings && (
                            <p className="font-extrabold text-slate-800">
                              {event.data?.examinationFindings || 'Đã ghi nhận khám lâm sàng.'}
                            </p>
                          )}
                          {event.data?.clinicalNotes && (
                            <p className="text-slate-500 italic">Nhận định / Chẩn đoán sơ bộ: {event.data.clinicalNotes}</p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (event.type === 'test_order' || event.type === 'diagnostic_order') {
                    const items = event.data?.items || [];
                    return (
                      <div key={idx} className="relative">
                        <span className="w-3.5 h-3.5 bg-indigo-600 rounded-full absolute -left-[32px] top-0.5 ring-4 ring-indigo-100 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        </span>
                        <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wide">
                          {eventTime} — Chỉ định CLS tim mạch (Mô-đun 5)
                        </span>
                        <p className="font-extrabold text-slate-800">
                          {items.map((i: any) => i.service?.serviceName || i.testType?.testName).filter(Boolean).join(', ') || event.summary}
                        </p>
                      </div>
                    );
                  }

                  if (event.type === 'lab_result' || event.type === 'diagnostic_result') {
                    const labRes = event.data?.result || event.data?.labResult;
                    const values = labRes?.values || [];
                    const abnormalCount = values.filter((v: any) => v.isAbnormal).length;
                    const testTitle = event.data?.serviceName || event.data?.testName || event.summary;

                    return (
                      <div key={idx} className="relative group">
                        <span className="w-3.5 h-3.5 bg-amber-500 rounded-full absolute -left-[32px] top-0.5 ring-4 ring-amber-100 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wide">
                            {eventTime} — Kết quả CLS (Mô-đun 7)
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedLabEvent(event)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 transition-all hover:bg-blue-100"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Xem chi tiết</span>
                          </button>
                        </div>

                        <div className="space-y-1 mt-1 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/80">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900">{testTitle}</span>
                            <Badge variant={abnormalCount > 0 ? 'critical' : 'normal'} size="sm">
                              {abnormalCount > 0 ? `${abnormalCount} chỉ số bất thường` : 'Bình thường'}
                            </Badge>
                          </div>
                          {values.length > 0 && (
                            <div className="text-[11px] text-slate-600 line-clamp-2">
                              {values.map((v: any) => `${v.parameter?.parameterName || v.parameter?.parameterCode || 'Chỉ số'}: ${v.valueNumeric ?? v.valueText} ${v.parameter?.unit || ''}`).join(' • ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (event.type === 'diagnosis') {
                    return (
                      <div key={idx} className="relative">
                        <span className="w-3.5 h-3.5 bg-rose-600 rounded-full absolute -left-[32px] top-0.5 ring-4 ring-rose-100 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        </span>
                        <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wide">
                          {eventTime} — Chẩn đoán: {event.data?.diagnosisType === 'final' ? 'Chính thức' : 'Sơ bộ'}
                        </span>
                        <p className="font-extrabold text-slate-800">
                          {event.data?.diagnosisName} ({event.data?.icd10Code})
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="relative">
                      <span className="w-3.5 h-3.5 bg-slate-400 rounded-full absolute -left-[32px] top-0.5 ring-4 ring-slate-100 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      </span>
                      <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wide">{eventTime} — {event.summary}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                {isLoadingTimeline ? (
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Đang tải dòng thời gian EMR...</span>
                  </div>
                ) : activeEncounterId ? (
                  'Chưa có dữ liệu tiến trình EMR cho ca khám này.'
                ) : (
                  'Vui lòng chọn một ca khám từ danh sách để xem dòng thời gian bệnh án.'
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right column: Paraclinical Readiness, ICD-10 Diagnosis & Treatment Consultation (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {!currentPatient ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/90 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-slate-800">Chưa chọn ca khám bệnh nhân</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Vui lòng chọn một ca khám từ danh sách hàng đợi bên trái để kiểm tra kết quả cận lâm sàng, thiết lập chẩn đoán ICD-10 và hồ sơ tư vấn điều trị.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Paraclinical Readiness & Completion Progress Banner */}
              <div className="space-y-3">
                {timelineData?.readyForConclusion ? (
                  <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-50 border border-emerald-500/40 rounded-3xl flex items-start gap-3.5 shadow-xs">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-emerald-950 uppercase tracking-tight">
                          Đã đủ điều kiện ra kết luận chẩn đoán chính thức
                        </h4>
                        <span className="text-[11px] font-black text-emerald-800 bg-emerald-200/80 px-2.5 py-0.5 rounded-full">
                          100% Hoàn tất
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                        Tất cả 4 dịch vụ Cận lâm sàng Tim mạch (Xét nghiệm men tim, Điện tim ECG, Siêu âm tim Doppler, X-quang) đã có kết quả chính thức từ các phòng chức năng.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-50 border border-amber-400/50 rounded-3xl flex items-start gap-3.5 shadow-xs">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-amber-950 uppercase tracking-tight">
                          Đang chờ kết quả cận lâm sàng
                        </h4>
                        {timelineData?.paraclinicalProgress && (
                          <span className="text-[11px] font-black text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full font-mono">
                            {timelineData.paraclinicalProgress.completedOrders}/{timelineData.paraclinicalProgress.totalOrders} Dịch vụ
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        Vẫn còn chỉ định cận lâm sàng đang trong quá trình thực hiện hoặc chờ phê duyệt tại phòng Lab. Bác sĩ có thể xem trước kết quả đã trả và lưu chẩn đoán tạm thời.
                      </p>
                    </div>
                  </div>
                )}

                {/* Paraclinical Progress Stats Card */}
                {timelineData?.paraclinicalProgress && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="text-slate-600">Tiến độ CLS:</span>
                      <span className="font-extrabold text-slate-900">
                        {timelineData.paraclinicalProgress.completedOrders} / {timelineData.paraclinicalProgress.totalOrders} phiếu
                      </span>
                    </div>

                    <div className="w-48 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${timelineData.paraclinicalProgress.percentCompleted}%` }}
                      />
                    </div>

                    {timelineData.unresolvedAlerts && timelineData.unresolvedAlerts.total > 0 && (
                      <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 font-bold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Có {timelineData.unresolvedAlerts.total} cảnh báo bất thường</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Form container: Official ICD-10 Diagnosis & Treatment Consultation */}
              <form onSubmit={handleSaveDiagnosis} className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">

                {/* Section A: Official ICD-10 Cardiovascular Diagnosis */}
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                      <Clipboard className="w-4 h-4 text-rose-600" />
                      <span>1. Kết Luận Chẩn Đoán Chuyên Khoa Tim Mạch (Mã ICD-10)</span>
                    </h3>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isPrimaryDiagnosis}
                        onChange={(e) => setIsPrimaryDiagnosis(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Chẩn đoán chính (Primary)</span>
                    </label>
                  </div>

                  {/* Quick Pick Chips for Cardiology ICD-10 */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Gợi ý bệnh lý tim mạch thường gặp:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {CARDIOLOGY_QUICK_ICD10.map((cardio) => {
                        const isChosen = selectedIcd.code === cardio.code;
                        return (
                          <button
                            key={cardio.code}
                            type="button"
                            onClick={() => handleSelectIcd({ code: cardio.code, name: cardio.name })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${isChosen
                              ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/30 ring-2 ring-rose-200'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                          >
                            <span className="font-mono text-[10px] opacity-80">{cardio.code}</span>
                            <span>{cardio.shortName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Search bar for full ICD-10 catalog */}
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold text-slate-700">
                      Tra cứu mã bệnh ICD-10 mở rộng:
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Nhập mã bệnh hoặc tên bệnh lý (Ví dụ: I25, Đau ngực, Nhồi máu cơ tim)..."
                        value={icd10Search}
                        onChange={(e) => setIcd10Search(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 focus:bg-white bg-slate-50/60 transition-all placeholder:text-slate-400"
                      />
                    </div>

                    {icd10Search && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto shadow-lg text-xs font-bold divide-y divide-slate-100 z-10 relative animate-in fade-in duration-100">
                        {isSearchingIcd ? (
                          <div className="p-3.5 text-center text-slate-400 font-medium">
                            Đang tra cứu danh mục ICD-10...
                          </div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map((item) => (
                            <div
                              key={item.code}
                              onClick={() => handleSelectIcd(item)}
                              className="p-3 hover:bg-rose-50 cursor-pointer flex justify-between items-center text-slate-700"
                            >
                              <div>
                                <span className="font-mono bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded mr-2">
                                  {item.code}
                                </span>
                                <span>{item.name}</span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          ))
                        ) : (
                          <div className="p-3.5 text-center text-slate-400 font-medium">
                            Không tìm thấy mã bệnh khớp từ khóa "{icd10Search}".
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected ICD-10 Card */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-900 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-blue-800 font-semibold block text-[10px] uppercase tracking-wider">
                          Mã bệnh lý chính thức đã chọn:
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono bg-blue-700 text-white px-2.5 py-0.5 rounded-md text-xs font-black">
                            {selectedIcd.code}
                          </span>
                          <span className="text-slate-900 font-extrabold text-sm">{selectedIcd.name}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={isPrimaryDiagnosis ? 'normal' : 'info'} size="sm">
                      {isPrimaryDiagnosis ? 'Chẩn đoán chính' : 'Chẩn đoán phụ'}
                    </Badge>
                  </div>

                  {/* Clinical diagnostic notes */}
                  <div className="space-y-1.5 text-xs">
                    <label className="block font-bold text-slate-700">
                      Ghi chú chẩn đoán lâm sàng & phân tích cận lâm sàng:
                    </label>
                    <textarea
                      rows={2}
                      value={diagnosisNotes}
                      onChange={(e) => setDiagnosisNotes(e.target.value)}
                      placeholder="Ví dụ: Siêu âm tim EF 48%, ST chênh xuống V4-V6, men tim Troponin I trong giới hạn an toàn..."
                      className="w-full p-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-blue-600 text-xs text-slate-800 bg-white"
                    />
                  </div>
                </div>

                {/* Section B: Treatment Consultation Form */}
                <div className="space-y-4 border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                    <Clipboard className="w-4 h-4 text-blue-700" />
                    <span>2. Hồ Sơ Tư Vấn Điều Trị & Phác Đồ Tim Mạch (Mô-đun 8)</span>
                  </h4>

                  {/* Condition explanation */}
                  <div className="space-y-1.5 text-xs">
                    <label className="block font-bold text-slate-700">
                      1. Giải thích tình trạng bệnh lý (*):
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={expNote}
                      onChange={(e) => setExpNote(e.target.value)}
                      placeholder="Giải thích rõ nguyên nhân, mức độ thiếu máu cơ tim / suy tim / tăng huyết áp để bệnh nhân hiểu..."
                      className="w-full p-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-blue-600 text-xs text-slate-800 bg-white"
                    />
                  </div>

                  {/* Treatment plan */}
                  <div className="space-y-1.5 text-xs">
                    <label className="block font-bold text-slate-700">
                      2. Phương án điều trị đề xuất (*):
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={planNote}
                      onChange={(e) => setPlanNote(e.target.value)}
                      placeholder="Phác đồ điều trị nội khoa, kiểm soát huyết áp, dùng thuốc kháng đông, theo dõi cơn đau thắt ngực..."
                      className="w-full p-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-blue-600 text-xs text-slate-800 bg-white"
                    />
                  </div>

                  {/* Lifestyle advice */}
                  <div className="space-y-1.5 text-xs">
                    <label className="block font-bold text-slate-700">
                      3. Lời khuyên sinh hoạt & vận động:
                    </label>
                    <textarea
                      rows={2}
                      value={lifeNote}
                      onChange={(e) => setLifeNote(e.target.value)}
                      placeholder="Vận động nhẹ nhàng, đi bộ 30 phút mỗi ngày, hạn chế gắng sức nặng, bỏ thuốc lá, tránh căng thẳng..."
                      className="w-full p-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-blue-600 text-xs text-slate-800 bg-white"
                    />
                  </div>

                  {/* Nutrition advice */}
                  <div className="space-y-1.5 text-xs">
                    <label className="block font-bold text-slate-700">
                      4. Chế độ dinh dưỡng tim mạch:
                    </label>
                    <textarea
                      rows={2}
                      value={nutritionNote}
                      onChange={(e) => setNutritionNote(e.target.value)}
                      placeholder="Ăn nhạt (giảm muối dưới 2g/ngày), hạn chế mỡ động vật & phủ tạng, tăng cường rau xanh, trái cây và cá béo..."
                      className="w-full p-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-blue-600 text-xs text-slate-800 bg-white"
                    />
                  </div>

                  {/* Follow-up appointment scheduling (SE05 followUpIntervalDays) */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2.5 text-xs font-black text-slate-800 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={followUpRequired}
                          onChange={(e) => setFollowUpRequired(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          Yêu cầu tái khám định kỳ
                        </span>
                      </label>

                      {followUpRequired && computedFollowUpDate && (
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-3 py-1 rounded-full">
                          Dự kiến tái khám: {computedFollowUpDate}
                        </span>
                      )}
                    </div>

                    {followUpRequired && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-200/80 animate-in fade-in duration-150">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-600">Chọn nhanh khoảng cách:</span>
                          {[
                            { label: '7 ngày (1 tuần)', days: 7 },
                            { label: '14 ngày (2 tuần)', days: 14 },
                            { label: '30 ngày (1 tháng)', days: 30 },
                            { label: '60 ngày (2 tháng)', days: 60 },
                            { label: '90 ngày (3 tháng)', days: 90 },
                          ].map((pill) => (
                            <button
                              key={pill.days}
                              type="button"
                              onClick={() => setFollowUpIntervalDays(pill.days)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer border transition-all ${followUpIntervalDays === pill.days
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                              {pill.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="text-xs font-semibold text-slate-700">
                            Số ngày tới lần tái khám tiếp theo:
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={730}
                            value={followUpIntervalDays}
                            onChange={(e) => setFollowUpIntervalDays(Math.max(1, Math.min(730, Number(e.target.value) || 1)))}
                            className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 font-mono font-bold text-xs text-slate-900 outline-none focus:border-blue-600 bg-white"
                          />
                          <span className="text-xs text-slate-500 font-medium">ngày (1 - 730 ngày)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Error Toast */}
                {submitError && (
                  <div className="text-xs text-rose-600 font-semibold flex items-center gap-1.5 bg-rose-50 p-3 rounded-xl border border-rose-200 animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Submit Success Toast */}
                {isSubmitSuccess && (
                  <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Đã lưu kết luận chẩn đoán ICD-10 và hồ sơ tư vấn điều trị thành công! Chuyển thông tin tự động sang kê đơn thuốc (Mô-đun 9).</span>
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none flex items-center gap-2 uppercase tracking-wide transition-all active:scale-98"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang lưu chẩn đoán & tư vấn...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ghi Nhận Kết Luận Chẩn Đoán & Chuyển Kê Đơn (Mô-đun 9)</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </>
          )}

        </div>

      </div>

      {/* Modal Chi Tiết Kết Quả Xét Nghiệm (Lab Result Detail) */}
      <Modal
        isOpen={!!selectedLabEvent}
        onClose={() => setSelectedLabEvent(null)}
        title={
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
            <FlaskConical className="w-5 h-5 text-amber-600" />
            <span>Chi Tiết Kết Quả: {selectedLabEvent?.data?.testName || 'Xét nghiệm'}</span>
          </div>
        }
        subtitle={
          selectedLabEvent
            ? `Thời gian: ${new Date(selectedLabEvent.occurredAt).toLocaleString('vi-VN')} • Trạng thái: ${selectedLabEvent.data?.labResult?.resultStatus === 'final'
              ? 'Đã có kết quả chính thức'
              : selectedLabEvent.data?.labResult?.resultStatus === 'corrected'
                ? 'Đã đính chính'
                : 'Kết quả sơ bộ'
            }`
            : undefined
        }
        maxWidth="4xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-[11px] text-slate-500 font-medium">
              Dữ liệu được đồng bộ trực tiếp từ phòng Xét nghiệm Lab (Mô-đun 7)
            </div>
            <button
              type="button"
              onClick={() => setSelectedLabEvent(null)}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl cursor-pointer border-none"
            >
              Đóng
            </button>
          </div>
        }
      >
        {selectedLabEvent && (() => {
          const labRes = selectedLabEvent.data?.result || selectedLabEvent.data?.labResult;
          const testTitle = selectedLabEvent.data?.serviceName || selectedLabEvent.data?.testName || selectedLabEvent.summary;
          const categoryName = selectedLabEvent.data?.modality || selectedLabEvent.data?.panelGroup || selectedLabEvent.data?.category || 'Chung';
          const values = labRes?.values || [];
          const attachments = labRes?.attachments || [];
          const abnormalCount = values.filter((v: any) => v.isAbnormal).length;

          return (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase">Tên xét nghiệm</span>
                  <div className="text-xs font-black text-slate-800">{testTitle}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Nhóm: {categoryName}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase">Tổng số thông số</span>
                  <div className="text-xs font-black text-slate-800">{values.length} chỉ số đo</div>
                  <div className="text-[10px]">
                    {abnormalCount > 0 ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {abnormalCount} bất thường
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Tất cả bình thường
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase">Trạng thái phê duyệt</span>
                  <div>
                    <Badge variant={labRes?.resultStatus === 'final' ? 'normal' : 'warning'} size="sm">
                      {labRes?.resultStatus === 'final' ? 'Đã có kết quả chính thức' : labRes?.resultStatus === 'corrected' ? 'Đã đính chính' : 'Sơ bộ'}
                    </Badge>
                  </div>
                  {labRes?.resultedAt && (
                    <div className="text-[10px] text-slate-500 font-medium">
                      Ngày trả: {new Date(labRes.resultedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clipboard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bảng phân tích các chỉ số xét nghiệm ({values.length})</span>
                </h5>

                {values.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Chưa có danh sách chỉ số chi tiết cho xét nghiệm này.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Tên chỉ số</th>
                          <th className="py-2.5 px-3 text-center">Kết quả đo</th>
                          <th className="py-2.5 px-3">Đơn vị</th>
                          <th className="py-2.5 px-3 text-center">Đánh giá</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {values.map((v: any) => {
                          const valDisplay = v.valueNumeric !== null && v.valueNumeric !== undefined ? v.valueNumeric : (v.valueText || '—');
                          return (
                            <tr key={v.resultValueId || v.parameterId} className={v.isAbnormal ? 'bg-rose-50/70 font-semibold' : 'hover:bg-slate-50'}>
                              <td className="py-2 px-3 text-slate-800 font-bold">
                                {v.parameter?.parameterName || v.parameter?.parameterCode || 'Chỉ số'}
                              </td>
                              <td className={`py-2 px-3 text-center font-black ${v.isAbnormal ? 'text-rose-700 text-sm' : 'text-slate-900'}`}>
                                {valDisplay}
                              </td>
                              <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                                {v.parameter?.unit || '—'}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {v.isAbnormal ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    Bất thường
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Bình thường
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                    <span>Hình ảnh / Tệp đính kèm ({attachments.length})</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {attachments.map((att: any) => {
                      const isImg = att.fileType?.includes('image') || att.fileType?.includes('xray') || att.fileUrl?.match(/\.(jpg|jpeg|png|webp|gif)/i);
                      return (
                        <div
                          key={att.attachmentId}
                          className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-blue-400 transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isImg ? (
                              <ImageIcon className="w-4 h-4 text-purple-600 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            )}
                            <span className="font-semibold text-slate-800 truncate text-[11px]">
                              {att.description || att.fileType || 'Tệp kết quả'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewAttachmentUrl(resolveAttachmentUrl(att.fileUrl))}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer border-none shrink-0"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Xem tệp</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(labRes?.technicianNotes || labRes?.overallConclusion) && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {labRes?.technicianNotes && (
                    <div className="text-xs text-amber-900 bg-amber-50/80 p-3 rounded-xl border border-amber-200">
                      <strong>Ghi chú kỹ thuật viên:</strong> {labRes.technicianNotes}
                    </div>
                  )}
                  {labRes?.overallConclusion && (
                    <div className="text-xs text-blue-950 bg-blue-50/80 p-3 rounded-xl border border-blue-200">
                      <strong>Kết luận chung:</strong> {labRes.overallConclusion}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Modal Phóng To / Xem Tệp Đính Kèm Cận Lâm Sàng */}
      {previewAttachmentUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-white">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-extrabold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>Xem tệp / hình ảnh cận lâm sàng</span>
              </h4>
              <div className="flex items-center gap-2">
                <a
                  href={previewAttachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở tab mới</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAttachmentUrl(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/40 min-h-[300px]">
              {previewAttachmentUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)/i) ? (
                <img
                  src={previewAttachmentUrl}
                  alt="Kết quả cận lâm sàng"
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg border border-slate-800"
                />
              ) : (
                <div className="text-center space-y-3 p-8">
                  <FileText className="w-12 h-12 mx-auto text-blue-400" />
                  <p className="text-xs text-slate-300">Tệp định dạng tài liệu (PDF / File xuất)</p>
                  <a
                    href={previewAttachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Tải về hoặc Xem trong tab mới</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
