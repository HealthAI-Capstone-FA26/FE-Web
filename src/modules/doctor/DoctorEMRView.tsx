import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, CheckCircle2, AlertTriangle, FileText, User,
  Activity, Heart, Thermometer, ShieldAlert, CheckSquare, Square,
  Clock, Play, Loader2
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { BorderBeam } from '../../components/ui/border-beam';
import {
  encounterService,
  type EncounterItem,
} from '../../services/encounter/encounter.service';
import {
  patientAllergyService,
  type PatientAllergyItem,
  type AllergyType,
  type AllergySeverity,
} from '../../services/patient/patient-allergy.service';

interface PatientEMR {
  id: string;
  encounterId?: string;
  patientId?: string;
  name: string;
  age: number;
  gender: 'Nam' | 'Nữ';
  dob: string;
  phone: string;
  cccd: string;
  bhyt: string;
  bloodType: string;
  allergies: string;
  history: string;
  symptoms: string;
  hasVitals?: boolean;
  vitals?: {
    bp?: string;
    hr?: number;
    spo2?: number;
    temp?: number;
  };
  aiSummary: string;
  aiSourceRef: string;
  aiProposedDiag: string;
  aiConfidence: string;
  initialClinicalNote: string;
  initialDoctorDiag: string;
}

export const DoctorEMRView: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    return localStorage.getItem('doctor_selected_patient_id') || '';
  });

  const [apiEncounters, setApiEncounters] = useState<EncounterItem[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);

  // Fetch encounters from GET /api/v1/encounters
  useEffect(() => {
    setIsLoadingApi(true);
    encounterService
      .getEncounters()
      .then((data) => {
        if (Array.isArray(data)) {
          setApiEncounters(data);
        }
      })
      .catch((err) => {
        console.warn('Lỗi khi tải ca khám bác sĩ từ API:', err);
      })
      .finally(() => setIsLoadingApi(false));
  }, []);

  const handleSelectPatientId = (id: string) => {
    setSelectedPatientId(id);
    localStorage.setItem('doctor_selected_patient_id', id);
  };

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

  // Patient process states simulation: 'initial' | 'ordered' | 'completed'
  const [patientWorkflowStates, setPatientWorkflowStates] = useState<Record<string, 'initial' | 'ordered' | 'completed'>>({});

  // Map API Encounters to PatientEMR format
  const combinedPatientsMap = useMemo(() => {
    const map: Record<string, PatientEMR> = {};

    apiEncounters.forEach((enc) => {
      const key = enc.patient?.patientCode || enc.encounterCode || enc.patientId;
      const latestVitalSession = enc.vitalSignSessions && enc.vitalSignSessions.length > 0 ? enc.vitalSignSessions[0] : undefined;

      const getObs = (...codes: string[]) => {
        if (!latestVitalSession) return undefined;
        const obs = latestVitalSession.observations?.find((o) =>
          o.item?.itemCode && codes.some((c) => c.toLowerCase() === o.item?.itemCode?.toLowerCase())
        );
        return obs?.observationValue;
      };

      const pulse = getObs('HR', 'PULSE');
      const bpSys = getObs('SBP', 'BP_SYS', 'BP_SYSTOLIC');
      const bpDia = getObs('BP_DIASTOLIC', 'DBP', 'BP_DIA');
      const temp = getObs('TEMP', 'TEMPERATURE');
      const spo2 = getObs('SPO2');

      const hasVitals = Boolean(
        latestVitalSession &&
        (pulse !== undefined || bpSys !== undefined || bpDia !== undefined || temp !== undefined || spo2 !== undefined)
      );

      const birthYear = enc.patient?.dateOfBirth ? new Date(enc.patient.dateOfBirth).getFullYear() : 2000;
      const age = new Date().getFullYear() - birthYear;

      map[key] = {
        id: key,
        encounterId: enc.encounterId,
        patientId: enc.patient?.patientId || enc.patientId,
        name: enc.patient?.fullName || 'Bệnh nhân',
        age: age || 25,
        gender: enc.patient?.gender === 'female' ? 'Nữ' : 'Nam',
        dob: enc.patient?.dateOfBirth?.slice(0, 10) || '---',
        phone: enc.patient?.phoneNumber || '---',
        cccd: enc.patient?.identityNumber || '---',
        bhyt: '---',
        bloodType: enc.patient?.bloodType || 'O+',
        allergies: 'Chưa ghi nhận dị ứng',
        history: 'Chưa ghi nhận tiền sử bệnh',
        symptoms: enc.chiefComplaint?.symptoms || enc.chiefComplaint?.reasonForVisit || 'Khai báo lâm sàng ban đầu',
        hasVitals,
        vitals: hasVitals
          ? {
            bp: bpSys && bpDia ? `${bpSys}/${bpDia} mmHg` : bpSys ? `${bpSys} mmHg` : '---',
            hr: Number(pulse) || 0,
            spo2: Number(spo2) || 0,
            temp: Number(temp) || 0,
          }
          : undefined,
        aiSummary: `Bệnh nhân ${enc.patient?.fullName || 'khám'}, tuổi ${age}. Lý do khám: ${enc.chiefComplaint?.reasonForVisit || 'Khám tổng quát'}. Triệu chứng: ${enc.chiefComplaint?.symptoms || 'Bình thường'}. Ca khám ${enc.encounterCode} đã tiếp nhận vào ${enc.arrivedAt?.slice(0, 10)}.`,
        aiSourceRef: 'Sinh hiệu Điều dưỡng + Khai báo tiếp đón Lễ tân',
        aiProposedDiag: enc.chiefComplaint?.reasonForVisit || 'Viêm phế quản cấp / Theo dõi lâm sàng',
        aiConfidence: '93.5%',
        initialClinicalNote: 'Bệnh nhân tỉnh táo, tiếp xúc tốt. Thăm khám lâm sàng bình thường.',
        initialDoctorDiag: enc.chiefComplaint?.reasonForVisit || 'Khám chuyên khoa',
      };
    });

    return map;
  }, [apiEncounters]);

  // Active Patient EMR Data
  const currentPatient = useMemo(() => {
    if (selectedPatientId && combinedPatientsMap[selectedPatientId]) {
      return combinedPatientsMap[selectedPatientId];
    }
    return Object.values(combinedPatientsMap)[0] || null;
  }, [selectedPatientId, combinedPatientsMap]);

  useEffect(() => {
    const keys = Object.keys(combinedPatientsMap);
    if (keys.length > 0) {
      if (!selectedPatientId || !combinedPatientsMap[selectedPatientId]) {
        const firstKey = keys[0];
        setSelectedPatientId(firstKey);
        localStorage.setItem('doctor_selected_patient_id', firstKey);
      }
    }
  }, [combinedPatientsMap, selectedPatientId]);

  // Fetch full Encounter Detail payload via GET /api/v1/encounters/{id}
  const [selectedEncounterDetail, setSelectedEncounterDetail] = useState<EncounterItem | null>(null);
  const [isLoadingEncounterDetail, setIsLoadingEncounterDetail] = useState<boolean>(false);

  useEffect(() => {
    const targetId = currentPatient?.encounterId || (apiEncounters.find((e) => e.encounterCode === selectedPatientId || e.patient?.patientCode === selectedPatientId)?.encounterId);
    if (targetId) {
      setIsLoadingEncounterDetail(true);
      encounterService
        .getEncounterById(targetId)
        .then((data) => {
          setSelectedEncounterDetail(data);
        })
        .catch((err) => {
          console.warn('Lỗi khi gọi GET /api/v1/encounters/{id}:', err);
          setSelectedEncounterDetail(null);
        })
        .finally(() => setIsLoadingEncounterDetail(false));
    } else {
      setSelectedEncounterDetail(null);
    }
  }, [currentPatient?.encounterId, selectedPatientId, apiEncounters]);

  // Fetch patient allergies via GET /api/v1/patients/{patientId}/allergies
  const [patientAllergies, setPatientAllergies] = useState<PatientAllergyItem[]>([]);
  const [isLoadingAllergies, setIsLoadingAllergies] = useState<boolean>(false);

  const activePatientId = useMemo(() => {
    return (
      currentPatient?.patientId ||
      selectedEncounterDetail?.patientId ||
      selectedEncounterDetail?.patient?.patientId ||
      apiEncounters.find(
        (e) => e.encounterCode === selectedPatientId || e.patient?.patientCode === selectedPatientId
      )?.patientId
    );
  }, [currentPatient, selectedEncounterDetail, selectedPatientId, apiEncounters]);

  useEffect(() => {
    if (activePatientId) {
      setIsLoadingAllergies(true);
      patientAllergyService
        .getAllergies(activePatientId)
        .then((data) => {
          setPatientAllergies(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.warn('Lỗi khi tải danh sách dị ứng bệnh nhân EMR:', err);
          setPatientAllergies([]);
        })
        .finally(() => setIsLoadingAllergies(false));
    } else {
      setPatientAllergies([]);
    }
  }, [activePatientId]);

  const getSeverityBadge = (sev: AllergySeverity) => {
    switch (sev) {
      case 'life_threatening':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
            🔥 Nguy hiểm tính mạng
          </span>
        );
      case 'severe':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
            ⚠️ Nặng
          </span>
        );
      case 'moderate':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
            🟡 Trung bình
          </span>
        );
      case 'mild':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
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
            <img src="/images/drug_icon.png" alt="Thuốc" className="w-4 h-4 object-contain shrink-0 inline-block align-middle" />
            <span>Thuốc</span>
          </span>
        );
      case 'food':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
            <img src="/images/food_icon.png" alt="Thực phẩm" className="w-4 h-4 object-contain shrink-0 inline-block align-middle" />
            <span>Thực phẩm</span>
          </span>
        );
      case 'environmental':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
            <img src="/images/environmental_icon.png" alt="Môi trường" className="w-4 h-4 object-contain shrink-0 inline-block align-middle" />
            <span>Môi trường</span>
          </span>
        );
      case 'other':
      default:
        return (
          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
            <img src="/images/other_icon.png" alt="Khác" className="w-4 h-4 object-contain shrink-0 inline-block align-middle" />
            <span>Khác</span>
          </span>
        );
    }
  };

  // Extract observations from GET /api/v1/encounters/{id}
  const activeEncounterSession = selectedEncounterDetail?.vitalSignSessions && selectedEncounterDetail.vitalSignSessions.length > 0
    ? selectedEncounterDetail.vitalSignSessions[0]
    : undefined;

  const getActiveEncounterObs = (...codes: string[]): string | number | undefined => {
    if (!activeEncounterSession) return undefined;
    const obs = activeEncounterSession.observations?.find((o) =>
      o.item?.itemCode && codes.some((c) => c.toLowerCase() === o.item?.itemCode?.toLowerCase())
    );
    return obs?.observationValue;
  };

  const activePulse = getActiveEncounterObs('HR', 'PULSE');
  const activeBpSys = getActiveEncounterObs('SBP', 'BP_SYS', 'BP_SYSTOLIC');
  const activeBpDia = getActiveEncounterObs('DBP', 'BP_DIA', 'BP_DIASTOLIC');
  const activeTemp = getActiveEncounterObs('TEMP', 'TEMPERATURE');
  const activeSpo2 = getActiveEncounterObs('SPO2');

  const hasMeasuredVitals = Boolean(
    (activeEncounterSession && (activePulse !== undefined || activeBpSys !== undefined || activeBpDia !== undefined || activeTemp !== undefined || activeSpo2 !== undefined)) ||
    (currentPatient?.hasVitals && currentPatient?.vitals)
  );

  const displayBp = activeBpSys && activeBpDia
    ? `${activeBpSys}/${activeBpDia} mmHg`
    : activeBpSys
      ? `${activeBpSys} mmHg`
      : currentPatient?.vitals?.bp;

  const displayHr = activePulse !== undefined
    ? `${activePulse} bpm`
    : currentPatient?.vitals?.hr !== undefined
      ? `${currentPatient.vitals.hr} bpm`
      : undefined;

  const displaySpo2 = activeSpo2 !== undefined
    ? `${activeSpo2}%`
    : currentPatient?.vitals?.spo2 !== undefined
      ? `${currentPatient.vitals.spo2}%`
      : undefined;

  const displayTemp = activeTemp !== undefined
    ? `${activeTemp}°C`
    : currentPatient?.vitals?.temp !== undefined
      ? `${currentPatient.vitals.temp}°C`
      : undefined;

  // Form States
  const [clinicalExamNote, setClinicalExamNote] = useState('');
  const [preliminaryDiag, setPreliminaryDiag] = useState('');
  const [selectedLabOrders, setSelectedLabOrders] = useState<string[]>([]);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);

  useEffect(() => {
    setClinicalExamNote(currentPatient?.initialClinicalNote || '');
    setPreliminaryDiag(currentPatient?.initialDoctorDiag || '');
    setIsSubmitSuccess(false);
  }, [currentPatient]);

  // Active Patient Workflow state
  const currentWorkflowState = patientWorkflowStates[selectedPatientId] || 'initial';

  // Dynamic suggested lab orders helper based on Diagnosis
  const dynamicSuggestedOrders = useMemo(() => {
    const diag = preliminaryDiag.toLowerCase();

    if (diag.includes('phổi') || diag.includes('phế quản') || diag.includes('ho') || diag.includes('thở') || diag.includes('ngực trái')) {
      return [
        { id: 'lo_xray_chest', name: 'Chụp X-quang ngực thẳng (Chest X-Ray)', isAI: true },
        { id: 'lo_cbc', name: 'Xét nghiệm công thức máu toàn phần (CBC)', isAI: true },
        { id: 'lo_crp', name: 'Xét nghiệm CRP định lượng (Đánh giá viêm)', isAI: true },
        { id: 'lo_sputum', name: 'Xét nghiệm cấy đờm tìm vi khuẩn', isAI: false }
      ];
    }

    if (diag.includes('tim') || diag.includes('mạch') || diag.includes('huyết áp') || diag.includes('vành')) {
      return [
        { id: 'lo_ecg', name: 'Điện tâm đồ (ECG 12 cực)', isAI: true },
        { id: 'lo_echo', name: 'Siêu âm tim màu Doppler tim', isAI: true },
        { id: 'lo_troponin', name: 'Xét nghiệm định lượng Troponin T/I', isAI: true },
        { id: 'lo_lipid', name: 'Sinh hóa máu: Bộ mỡ máu (Lipid Profile)', isAI: false }
      ];
    }

    if (diag.includes('dạ dày') || diag.includes('loét') || diag.includes('tụy') || diag.includes('tiêu hóa') || diag.includes('bụng')) {
      return [
        { id: 'lo_endo_gastro', name: 'Nội soi dạ dày tá tràng gây mê', isAI: true },
        { id: 'lo_us_abdomen', name: 'Siêu âm ổ bụng tổng quát', isAI: true },
        { id: 'lo_amylase', name: 'Xét nghiệm Amylase máu và nước tiểu', isAI: true },
        { id: 'lo_cbc_gastro', name: 'Xét nghiệm công thức máu toàn phần (CBC)', isAI: false }
      ];
    }

    return [
      { id: 'lo_cbc_def', name: 'Xét nghiệm công thức máu toàn phần (CBC)', isAI: true },
      { id: 'lo_blood_chem', name: 'Sinh hóa máu cơ bản (Ure, Creatinin, AST, ALT)', isAI: true },
      { id: 'lo_us_general', name: 'Siêu âm ổ bụng tổng quát', isAI: false }
    ];
  }, [preliminaryDiag]);

  // Set default check for AI recommended items when dynamic orders list changes
  useEffect(() => {
    const aiIds = dynamicSuggestedOrders.filter(o => o.isAI).map(o => o.name);
    setSelectedLabOrders(aiIds);
  }, [dynamicSuggestedOrders]);

  const handleToggleLabOrder = (orderName: string) => {
    setSelectedLabOrders((prev) =>
      prev.includes(orderName) ? prev.filter((i) => i !== orderName) : [...prev, orderName]
    );
  };

  // Submitting initial diagnostic orders advances the state from 'initial' to 'ordered'
  const handleConfirmDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitSuccess(true);
    setPatientWorkflowStates(prev => ({
      ...prev,
      [selectedPatientId]: 'ordered'
    }));
    setTimeout(() => {
      setIsSubmitSuccess(false);
    }, 4000);
  };

  // Fast-track simulation helper to directly set patient status as 'completed'
  const handleSimulateLabCompletion = () => {
    setPatientWorkflowStates(prev => ({
      ...prev,
      [selectedPatientId]: 'completed'
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 animate-in fade-in duration-200">

      {/* Module Title Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Hồ Sơ EMR & Phân Tích AI
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem hồ sơ bệnh án EMR, tóm tắt AI tự động (AI01) và khoanh vùng bất thường (AI02).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 text-xs font-bold text-blue-900">
          <User className="w-4 h-4 text-blue-700" />
          <span>
            {currentPatient
              ? `Bệnh nhân: ${selectedEncounterDetail?.patient?.fullName || currentPatient.name} (${currentPatient.id})`
              : 'Chưa chọn bệnh nhân'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Patient EMR & AI Panel (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {!currentPatient ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200/90 shadow-xs text-center space-y-3">
              <User className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">Chưa có bệnh nhân trong hàng chờ khám</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Khi lễ tân tiếp nhận bệnh nhân hoặc gọi số, hồ sơ bệnh nhân sẽ tự động xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <>
              {/* A. Administrative EMR Profile & Vitals */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span>Hồ sơ Bệnh án Điện tử (EMR) - Thông tin Hành chính & Sinh hiệu</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Personal Info */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Thông tin bệnh nhân</span>
                    <div className="space-y-1">
                      <p><strong className="text-slate-700">Họ tên:</strong> {selectedEncounterDetail?.patient?.fullName || currentPatient?.name}</p>
                      <p><strong className="text-slate-700">Tuổi/Giới:</strong> {currentPatient?.age} tuổi ({selectedEncounterDetail?.patient?.gender === 'female' ? 'Nữ' : selectedEncounterDetail?.patient?.gender === 'male' ? 'Nam' : currentPatient?.gender})</p>
                      <p><strong className="text-slate-700">Ngày sinh:</strong> {selectedEncounterDetail?.patient?.dateOfBirth?.slice(0, 10) || currentPatient?.dob}</p>
                      <p><strong className="text-slate-700">Nhóm máu:</strong> {selectedEncounterDetail?.patient?.bloodType || currentPatient?.bloodType}</p>
                    </div>
                  </div>

                  {/* Clinical History & Allergies */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tiền sử & Dị ứng</span>
                      {isLoadingAllergies && <Loader2 className="w-3.5 h-3.5 text-rose-600 animate-spin" />}
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Dynamic Allergies section from GET /api/v1/patients/:patientId/allergies */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <strong className="text-slate-800 text-[11px]">Dị ứng ghi nhận:</strong>
                        </div>

                        {isLoadingAllergies ? (
                          <span className="text-[11px] text-slate-400 italic">Đang tải dị ứng bệnh nhân...</span>
                        ) : patientAllergies.filter((a) => a.status === 'active').length > 0 ? (
                          <div className="space-y-1.5 pt-0.5">
                            {patientAllergies
                              .filter((a) => a.status === 'active')
                              .map((item) => (
                                <div
                                  key={item.allergyId}
                                  className="p-2 rounded-xl bg-white border border-rose-200/80 shadow-2xs space-y-0.5"
                                >
                                  <div className="flex items-center justify-between gap-1 flex-wrap">
                                    <span className="font-extrabold text-rose-900 text-xs flex items-center gap-1">
                                      {getTypeLabel(item.allergyType)} {item.allergenName}
                                    </span>
                                    {getSeverityBadge(item.severity)}
                                  </div>
                                  {item.reactionDescription && (
                                    <p className="text-[10px] text-slate-500 font-medium leading-snug">
                                      Triệu chứng: {item.reactionDescription}
                                    </p>
                                  )}
                                </div>
                              ))}

                            {/* Cảnh báo dị ứng thuốc nổi bật cho Bác sĩ trước khi kê đơn */}
                            {patientAllergies.some((a) => a.status === 'active' && a.allergyType === 'drug') && (
                              <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-800 font-bold flex items-center gap-1.5 animate-pulse">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>CẢNH BÁO KÊ ĐƠN: Bệnh nhân dị ứng kháng sinh/thuốc!</span>
                              </div>
                            )}
                          </div>
                        ) : currentPatient?.allergies && currentPatient.allergies !== 'Chưa ghi nhận dị ứng' ? (
                          <p className="text-rose-600 font-bold text-xs">{currentPatient.allergies}</p>
                        ) : (
                          <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-lg border border-emerald-200/80 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Chưa ghi nhận dị ứng (An toàn kê đơn)</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/60 space-y-1">
                        <p><strong className="text-slate-700">Tiền sử bệnh:</strong> {currentPatient?.history || 'Chưa ghi nhận'}</p>
                        <p><strong className="text-slate-700">Triệu chứng khai báo:</strong> {selectedEncounterDetail?.chiefComplaint?.symptoms || selectedEncounterDetail?.chiefComplaint?.reasonForVisit || currentPatient?.symptoms || 'Chưa ghi nhận'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vitals */}
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2.5">
                    <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">
                      Chỉ số Sinh hiệu lúc đón tiếp
                    </span>

                    {hasMeasuredVitals ? (
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold leading-none">HA</span>
                            <span className="font-mono">{displayBp || '---'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold leading-none">Nhịp tim</span>
                            <span className="font-mono">{displayHr || '---'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold leading-none">SpO2</span>
                            <span className="font-mono">{displaySpo2 || '---'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Thermometer className="w-4 h-4 text-amber-500 shrink-0" />
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold leading-none">Nhiệt độ</span>
                            <span className={`font-mono ${(Number(activeTemp) || currentPatient?.vitals?.temp || 0) >= 38 ? 'text-rose-600 font-extrabold' : 'text-slate-800'}`}>
                              {displayTemp || '---'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200/80 text-amber-900 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Bệnh nhân chưa đo chỉ số sinh hiệu</span>
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* B. AI01 Smart EMR Summary Widget */}
              <BorderBeam size="md" colorVariant="colorful">
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-indigo-500/30 shadow-xl shadow-indigo-950/40 rounded-3xl p-6 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                        Mô-đun AI01 — Tóm tắt bệnh án do AI tự động biên soạn
                      </h3>
                    </div>
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-bold">
                      Mức tin cậy: 97.4%
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                    {currentPatient.aiSummary}
                  </p>

                  <div className="text-[10px] text-slate-400 border-t border-indigo-950/80 pt-2 flex flex-col sm:flex-row justify-between gap-1">
                    <span><strong>Tham chiếu dữ liệu nguồn:</strong> {currentPatient.aiSourceRef}</span>
                    <span className="font-extrabold text-cyan-400 text-[9px] uppercase tracking-wider">Tự động đối chiếu chéo bởi Medical AI Engine</span>
                  </div>
                </div>
              </BorderBeam>

              {/* C. AI02 Lab Image Analysis & AI Proposed Diagnosis (Locked by workflow state) */}
              {currentWorkflowState === 'completed' ? (
                <BorderBeam size="md" colorVariant="colorful">
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-indigo-500/30 shadow-xl shadow-indigo-950/40 rounded-3xl p-6 space-y-4 text-white">
                    <div className="flex items-center justify-between border-b border-indigo-950 pb-3">
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-cyan-400" />
                        <span>Mô-đun AI02 — Kết quả phân tích hình ảnh xét nghiệm & Đề xuất AI</span>
                      </h3>
                      <Badge variant="ai" size="sm">
                        AI Region of Interest (ROI)
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center animate-in zoom-in-95 duration-200">
                      {/* Chest X-ray simulator with highlight overlay */}
                      <div className="md:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden h-52 group">
                        <span className="text-[9px] font-extrabold text-slate-500 absolute top-2 left-2 font-mono uppercase">Simulation: X-Ray Chest</span>

                        {/* stylized SVG lungs outline */}
                        <svg className="w-36 h-36 opacity-40 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4m-8 6h4m-4 4h4m-4-8h4M4 8h16M4 12h16m-16 4h16" />
                          <circle cx="8" cy="12" r="3" strokeWidth={1} />
                          <circle cx="16" cy="12" r="3" strokeWidth={1} />
                        </svg>

                        {/* Simulated abnormal region glowing pulse border overlay */}
                        {currentWorkflowState === 'completed' && (
                          <div className="absolute bottom-10 left-12 w-14 h-14 border-2 border-dashed border-rose-500 bg-rose-500/10 rounded-full animate-ping duration-1000 flex items-center justify-center">
                            <span className="text-[8px] bg-rose-600 text-white font-extrabold px-1 py-0.5 rounded leading-none shrink-0 pointer-events-none">AI02 (92%)</span>
                          </div>
                        )}

                        {currentWorkflowState === 'completed' && (
                          <div className="absolute bottom-10 left-12 w-14 h-14 border-2 border-rose-600 bg-rose-500/20 rounded-full flex items-center justify-center cursor-help" title="Vùng bất thường: Vùng mờ thâm nhiễm phế nang">
                            <span className="text-[7px] text-white font-extrabold uppercase font-sans tracking-wide">Vùng mờ</span>
                          </div>
                        )}

                        <span className="text-[9px] text-slate-400 font-bold text-center mt-2 z-10">
                          {preliminaryDiag.toLowerCase().includes('tim')
                            ? 'AI phân tích nhịp tim: Khoảng QT kéo dài nhẹ'
                            : preliminaryDiag.toLowerCase().includes('dạ dày') || preliminaryDiag.toLowerCase().includes('bụng')
                              ? 'AI phân tích ổ bụng: Dấu hiệu viêm niêm mạc môn vị'
                              : 'Phát hiện vùng mờ thâm nhiễm phế nang (Thùy dưới phổi)'}
                        </span>
                      </div>

                      {/* AI Proposed Diagnosis & Confidence Score details */}
                      <div className="md:col-span-7 space-y-3">
                        <div className="p-4 bg-indigo-950/40 border border-indigo-900/50 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-indigo-300 block uppercase tracking-wide">Chẩn đoán đề xuất từ AI:</span>
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">
                              Confidence Score: {currentPatient?.aiConfidence || '93.5%'}
                            </span>
                          </div>
                          <div className="text-sm font-extrabold text-white">
                            {currentPatient?.aiProposedDiag || 'Theo dõi lâm sàng'}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-normal">
                            * Đề xuất dựa trên chẩn đoán hình ảnh phim chụp lồng ngực cận dưới kết hợp với tổng hợp chỉ số bệnh lý lâm sàng.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </BorderBeam>
              ) : (
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 text-white">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Mô-đun AI02 — Kết quả phân tích hình ảnh xét nghiệm & Đề xuất AI</span>
                    </h3>
                    <Badge variant="ai" size="sm">
                      AI Region of Interest (ROI)
                    </Badge>
                  </div>

                  {/* LOCKED state matching doctor consultation billing constraints */}
                  <div className="border border-dashed border-slate-800 bg-slate-950/40 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 min-h-[180px]">
                    {currentWorkflowState === 'initial' ? (
                      <>
                        <ShieldAlert className="w-10 h-10 text-amber-500" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-tight">AI02 — Chưa có dữ liệu cận lâm sàng</h4>
                          <p className="text-[11px] text-slate-400 max-w-lg leading-relaxed">
                            Chỉ định xét nghiệm chưa được gửi đi. Hãy điền kết quả khám lâm sàng, chẩn đoán sơ bộ bên dưới và nhấn nút <strong>"Xác nhận Chỉ định"</strong> để chuyển sang Quầy Thu phí (Mô-đun 6).
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Clock className="w-10 h-10 text-indigo-500 animate-spin-slow" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-tight">AI02 — Đang chờ thanh toán & Xét nghiệm phòng Lab</h4>
                          <p className="text-[11px] text-slate-400 max-w-lg leading-relaxed">
                            Chỉ định cận lâm sàng đã được chuyển đi. Bệnh nhân cần hoàn tất thanh toán viện phí tại quầy thu phí (Mô-đun 6) và thực hiện chụp chiếu xét nghiệm tại phòng Lab (Mô-đun 7).
                          </p>
                        </div>
                      </>
                    )}

                    {/* Simulated quick developer control bypass banner */}
                    <div className="pt-2 border-t border-slate-800 w-full flex items-center justify-center gap-3 text-[10px] font-bold">
                      <span className="text-slate-400">Dành cho Người kiểm thử:</span>
                      <button
                        type="button"
                        onClick={handleSimulateLabCompletion}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-lg cursor-pointer border-none flex items-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 text-amber-300" />
                        <span>Mô phỏng: Đóng phí & Lab hoàn tất</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* D. Doctor Preliminary Diagnosis Input & Suggested Lab Orders */}
              <form onSubmit={handleConfirmDiagnosis} className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
                <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-700" />
                  <span>Ghi nhận chẩn đoán & Chỉ định cận lâm sàng (Bác sĩ)</span>
                </h3>

                {/* Input: Clinical examination notes */}
                <div className="space-y-1.5 text-xs">
                  <label className="block font-bold text-slate-700">Kết quả thăm khám lâm sàng (Nghe phổi, kiểm tra triệu chứng):</label>
                  <textarea
                    rows={2}
                    value={clinicalExamNote}
                    onChange={(e) => setClinicalExamNote(e.target.value)}
                    placeholder="Nhập kết quả khám lâm sàng..."
                    className="w-full p-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-blue-600 text-xs md:text-sm text-slate-800"
                  />
                </div>

                {/* Input: Doctor Preliminary Diagnosis */}
                <div className="space-y-1.5 text-xs">
                  <label className="block font-bold text-slate-700">Chẩn đoán sơ bộ của Bác sĩ (*):</label>
                  <input
                    type="text"
                    value={preliminaryDiag}
                    onChange={(e) => setPreliminaryDiag(e.target.value)}
                    placeholder="Nhập chẩn đoán sơ bộ (Ví dụ: Viêm phế quản cấp / Theo dõi viêm phổi)"
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 font-extrabold outline-none focus:border-blue-600 text-xs md:text-sm text-slate-800"
                  />
                </div>

                {/* AI Auto Suggested Lab Orders list based on Diagnosis */}
                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800">Hệ thống tự động gợi ý danh mục xét nghiệm phù hợp:</span>
                    <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-100 uppercase tracking-wide">
                      Gợi ý tự động (AI Suggested)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dynamicSuggestedOrders.map((item) => {
                      const isChecked = selectedLabOrders.includes(item.name);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleLabOrder(item.name)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs font-bold ${isChecked
                            ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            {isChecked ? (
                              <CheckSquare className="w-4.5 h-4.5 text-blue-700 shrink-0" />
                            ) : (
                              <Square className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                            )}
                            <span className="leading-tight">{item.name}</span>
                          </div>

                          {item.isAI && (
                            <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded shrink-0 font-bold uppercase ml-1">
                              AI khuyên dùng
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Feedback alert */}
                {isSubmitSuccess && (
                  <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 bg-emerald-50 p-3 rounded-xl border border-emerald-100 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Đã gửi chỉ định thành công! Bệnh nhân đang chuyển sang Quầy Thu phí (Mô-đun 6). Vui lòng sử dụng nút <strong>"Mô phỏng"</strong> trong ô AI02 để cập nhật kết quả Lab nhanh!</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={currentWorkflowState !== 'initial'}
                    className={`px-6 py-3 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none flex items-center gap-2 uppercase tracking-wide ${currentWorkflowState !== 'initial'
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-700 hover:bg-blue-800'
                      }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{currentWorkflowState === 'initial' ? 'Xác nhận Chỉ định & Chuyển Thu phí' : 'Đã gửi Chỉ định Xét nghiệm'}</span>
                  </button>
                </div>
              </form>
            </>
          )}

        </div>

        {/* Right Column: Patient Queue (1 column) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Hàng chờ Khám của Bác sĩ</h3>
              <Badge variant="info" size="sm">
                {String(Object.keys(combinedPatientsMap).length).padStart(2, '0')} Bệnh nhân
              </Badge>
            </div>

            <div className="space-y-2.5">
              {isLoadingApi ? (
                <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Đang tải danh sách hàng chờ...</span>
                </div>
              ) : Object.keys(combinedPatientsMap).length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-1.5">
                  <User className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-500">Chưa có bệnh nhân trong hàng chờ</p>
                  <p className="text-[10px]">Các ca khám tiếp nhận tại Lễ tân sẽ tự động hiển thị tại đây.</p>
                </div>
              ) : (
                Object.values(combinedPatientsMap).map((p) => {
                  const workflowState = patientWorkflowStates[p.id] || 'initial';
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPatientId(p.id)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex justify-between items-center ${selectedPatientId === p.id
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300'
                        : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                        }`}
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-extrabold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{p.id}</div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${selectedPatientId === p.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                          }`}>
                          {selectedPatientId === p.id ? 'Đang khám' : 'Chờ vào'}
                        </span>
                        {workflowState === 'ordered' && (
                          <span className="text-[8px] bg-amber-100 text-amber-800 font-bold px-1 rounded">Chờ đóng phí/Lab</span>
                        )}
                        {workflowState === 'completed' && (
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">Đã có kết quả Lab</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
