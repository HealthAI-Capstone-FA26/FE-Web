import React, { useState, useEffect, useMemo } from 'react';
import { User, Stethoscope, Sparkles, FileText } from 'lucide-react';
import {
  encounterService,
  type EncounterItem,
} from '../../services/encounter/encounter.service';
import {
  patientAllergyService,
  type PatientAllergyItem,
} from '../../services/patient/patient-allergy.service';
import {
  appointmentService,
  type AppointmentItem,
} from '../../services/appointment/appointment.service';
import {
  testOrderService,
  clinicalExamService,
  doctorAiService,
  AVAILABLE_TEST_CATALOG,
  type TestOrderDetail,
  type CaseOverviewData,
} from '../../services/doctor';

// Modular Sub-Components
import type { PatientEMR, PatientWorkflowState } from './types';
import { PatientQueueSidebar } from './components/PatientQueueSidebar';
import { PatientAdministrativeCard } from './components/PatientAdministrativeCard';
import { AiClinicalSummaryCard } from './components/AiClinicalSummaryCard';
import { AiImagingAnalysisCard } from './components/AiImagingAnalysisCard';
import { ClinicalExamForm, type DynamicAiDiagnosis } from './components/ClinicalExamForm';
import { TestOrderCreationCard } from './components/TestOrderCreationCard';
import { TestOrderHistoryList } from './components/TestOrderHistoryList';

export const DoctorEMRView: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    return localStorage.getItem('doctor_selected_patient_id') || '';
  });

  // Tab con nội bộ: 'emr_summary' (Hồ sơ EMR & AI01) | 'clinical_orders' (Khám & Chỉ định) | 'ai_imaging' (Phân tích ảnh AI02)
  const [activeSubTab, setActiveSubTab] = useState<'emr_summary' | 'clinical_orders' | 'ai_imaging'>('emr_summary');

  const [apiEncounters, setApiEncounters] = useState<EncounterItem[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);

  // 1. Fetch encounters from GET /api/v1/encounters
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
  const [patientWorkflowStates, setPatientWorkflowStates] = useState<Record<string, PatientWorkflowState>>({});

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
        appointmentId: enc.appointmentId,
        patientId: enc.patient?.patientId || enc.patientId,
        status: enc.status,
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
        initialDoctorDiag: enc.chiefComplaint?.reasonForVisit || 'Khám tổng quát',
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

  // 2. Fetch full Encounter Detail payload via GET /api/v1/encounters/{id}
  const [selectedEncounterDetail, setSelectedEncounterDetail] = useState<EncounterItem | null>(null);

  // 3. Fetch full Case Overview payload via GET /api/v1/doctor-examination/encounters/{id}/overview
  const [caseOverview, setCaseOverview] = useState<CaseOverviewData | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState<boolean>(false);
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState<boolean>(false);
  const [isGeneratingAiDiagnosis, setIsGeneratingAiDiagnosis] = useState<boolean>(false);

  // 3.1 Appointment State & Start Consultation Handler
  const [currentAppointment, setCurrentAppointment] = useState<AppointmentItem | null>(null);
  const [isStartingAppointment, setIsStartingAppointment] = useState<boolean>(false);

  const fetchCaseOverview = async (encounterId: string) => {
    setIsLoadingOverview(true);
    try {
      const data = await clinicalExamService.getCaseOverview(encounterId);
      setCaseOverview(data);
    } catch (err) {
      console.warn('Lỗi khi gọi GET /doctor-examination/encounters/:id/overview:', err);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  useEffect(() => {
    const targetId = currentPatient?.encounterId || (apiEncounters.find((e) => e.encounterCode === selectedPatientId || e.patient?.patientCode === selectedPatientId)?.encounterId);
    if (targetId) {
      encounterService
        .getEncounterById(targetId)
        .then((data) => {
          setSelectedEncounterDetail(data);
        })
        .catch((err) => {
          console.warn('Lỗi khi gọi GET /api/v1/encounters/{id}:', err);
          setSelectedEncounterDetail(null);
        });

      fetchCaseOverview(targetId);
    } else {
      setSelectedEncounterDetail(null);
      setCaseOverview(null);
    }
  }, [currentPatient?.encounterId, selectedPatientId, apiEncounters]);

  // Đồng bộ thông tin Appointment tương ứng với ca khám đang chọn
  useEffect(() => {
    const apptId = selectedEncounterDetail?.appointmentId || currentPatient?.appointmentId;
    if (apptId) {
      appointmentService
        .getAppointmentById(apptId)
        .then((appt) => {
          setCurrentAppointment(appt);
          if (appt.status === 'in_progress') {
            setApiEncounters((prev) =>
              prev.map((e) =>
                e.appointmentId === apptId || (currentPatient && e.encounterId === currentPatient.encounterId)
                  ? { ...e, status: 'in_progress' }
                  : e
              )
            );
          }
        })
        .catch((err) => {
          console.warn('Lỗi khi tải thông tin lịch hẹn:', err);
          setCurrentAppointment(null);
        });
    } else {
      setCurrentAppointment(null);
    }
  }, [selectedEncounterDetail?.appointmentId, currentPatient?.appointmentId, currentPatient?.encounterId]);

  // Bác sĩ bấm nút bắt đầu phiên khám (gọi PATCH /appointments/:id/start)
  const handleStartConsultation = async () => {
    const apptId = currentAppointment?.appointmentId || selectedEncounterDetail?.appointmentId || currentPatient?.appointmentId;
    if (!apptId) {
      alert('Không tìm thấy mã lịch hẹn (Appointment ID) để bắt đầu phiên khám.');
      return;
    }

    setIsStartingAppointment(true);
    try {
      const updatedAppt = await appointmentService.startAppointment(apptId);
      setCurrentAppointment(updatedAppt);

      // Cập nhật selectedEncounterDetail sang in_progress
      setSelectedEncounterDetail((prev) => (prev ? { ...prev, status: 'in_progress' } : null));

      // Cập nhật danh sách ca khám apiEncounters
      setApiEncounters((prev) =>
        prev.map((e) =>
          e.appointmentId === apptId || e.encounterId === currentPatient?.encounterId
            ? { ...e, status: 'in_progress' }
            : e
        )
      );

      // Tải lại tổng quan ca khám nếu có encounterId
      const encId = currentPatient?.encounterId || selectedEncounterDetail?.encounterId;
      if (encId) {
        await fetchCaseOverview(encId);
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Không thể bắt đầu ca khám.';
      alert(`Lỗi khi bắt đầu phiên khám: ${msg}`);
    } finally {
      setIsStartingAppointment(false);
    }
  };

  // 4. Fetch patient allergies via GET /api/v1/patients/{patientId}/allergies (Dùng bổ trợ)
  const [patientAllergies, setPatientAllergies] = useState<PatientAllergyItem[]>([]);
  const [isLoadingAllergies, setIsLoadingAllergies] = useState<boolean>(false);

  const activePatientId = useMemo(() => {
    return (
      caseOverview?.patient?.patientId ||
      currentPatient?.patientId ||
      selectedEncounterDetail?.patientId ||
      selectedEncounterDetail?.patient?.patientId ||
      apiEncounters.find(
        (e) => e.encounterCode === selectedPatientId || e.patient?.patientCode === selectedPatientId
      )?.patientId
    );
  }, [caseOverview, currentPatient, selectedEncounterDetail, selectedPatientId, apiEncounters]);

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

  const activeAllergies = useMemo(() => {
    if (caseOverview?.allergies && caseOverview.allergies.length > 0) {
      return caseOverview.allergies;
    }
    return patientAllergies;
  }, [caseOverview?.allergies, patientAllergies]);

  // Observations from CaseOverview or Encounter
  const activeEncounterSession = caseOverview?.latestVitalSession || (selectedEncounterDetail?.vitalSignSessions && selectedEncounterDetail.vitalSignSessions.length > 0
    ? selectedEncounterDetail.vitalSignSessions[0]
    : undefined);

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
    ? activePulse
    : currentPatient?.vitals?.hr !== undefined
      ? currentPatient.vitals.hr
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

  // Form & Test Order States
  const [clinicalExamNote, setClinicalExamNote] = useState('');
  const [preliminaryDiag, setPreliminaryDiag] = useState('');
  const [selectedTestTypeIds, setSelectedTestTypeIds] = useState<string[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [existingTestOrders, setExistingTestOrders] = useState<TestOrderDetail[]>([]);
  const [isLoadingTestOrders, setIsLoadingTestOrders] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [cancellingItemId, setCancellingItemId] = useState<string | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);
  const [examWarningMsg, setExamWarningMsg] = useState<string | null>(null);

  const activeEncounterId = currentPatient?.encounterId;

  // Gọi API kích hoạt AI tóm tắt diễn tiến lâm sàng
  const handleTriggerAiSummary = async () => {
    if (!activeEncounterId) return;
    setIsGeneratingAiSummary(true);
    try {
      await doctorAiService.generateAiClinicalSummary(activeEncounterId);
      await fetchCaseOverview(activeEncounterId);
    } catch (err) {
      console.warn('Kích hoạt AI tóm tắt hoàn tất:', err);
    } finally {
      setIsGeneratingAiSummary(false);
    }
  };

  // Gọi API kích hoạt AI gợi ý chẩn đoán sơ bộ
  const handleTriggerAiDiagnosis = async () => {
    if (!activeEncounterId) return;
    setIsGeneratingAiDiagnosis(true);
    try {
      await doctorAiService.generateAiDiagnosisSuggestions(activeEncounterId);
      await fetchCaseOverview(activeEncounterId);
    } catch (err) {
      console.warn('Kích hoạt AI gợi ý chẩn đoán hoàn tất:', err);
    } finally {
      setIsGeneratingAiDiagnosis(false);
    }
  };

  // Bản tóm tắt diễn tiến lâm sàng do AI biên soạn (AI01)
  const currentAiSummary = useMemo(() => {
    if (caseOverview?.aiClinicalSummary?.summaryText) {
      return caseOverview.aiClinicalSummary.summaryText;
    }
    const patName = caseOverview?.patient?.fullName || selectedEncounterDetail?.patient?.fullName || currentPatient?.name || 'Bệnh nhân';
    const patAge = currentPatient?.age || 30;
    const patGender = (caseOverview?.patient?.gender === 'female' || selectedEncounterDetail?.patient?.gender === 'female') ? 'Nữ' : 'Nam';
    const symp = caseOverview?.chiefComplaint?.symptoms || selectedEncounterDetail?.chiefComplaint?.symptoms || currentPatient?.symptoms || 'Bình thường';
    const allgs = activeAllergies.filter((a) => a.status === 'active');
    const allgStr = allgs.length > 0 ? allgs.map((a) => `${a.allergenName} (${a.severity})`).join(', ') : 'Chưa ghi nhận dị ứng';
    const histStr = caseOverview?.medicalHistories?.length ? caseOverview.medicalHistories.map((h) => h.conditionName).join(', ') : (currentPatient?.history || 'Chưa ghi nhận');

    return `Bệnh nhân ${patName} (${patGender}, ${patAge} tuổi). Tiếp nhận tại phòng khám với lý do/triệu chứng: "${symp}". Chỉ số sinh hiệu lúc tiếp đón: Huyết áp ${displayBp || '---'}, nhịp tim ${displayHr || '---'}, SpO2 ${displaySpo2 || '---'}, thân nhiệt ${displayTemp || '---'}. Tiền sử bệnh lý: ${histStr}. Ghi nhận dị ứng: ${allgStr}. Đề xuất Bác sĩ thăm khám hô hấp/toàn thân và chỉ định cận lâm sàng đánh giá chuyên sâu.`;
  }, [caseOverview, selectedEncounterDetail, currentPatient, activeAllergies, displayBp, displayHr, displaySpo2, displayTemp]);

  // Top chẩn đoán sơ bộ do AI đề xuất (kèm độ tin cậy và lập luận y khoa)
  const dynamicAiDiagnosisList: DynamicAiDiagnosis[] = useMemo(() => {
    if (caseOverview?.aiDiagnosisSuggestions && caseOverview.aiDiagnosisSuggestions.length > 0) {
      return caseOverview.aiDiagnosisSuggestions.map((s, idx) => ({
        id: s.suggestionId || `ai-diag-${idx}`,
        icd10Code: s.icd10Code || s.icd10?.icd10Code || '---',
        diseaseName: s.icd10?.descriptionVi || s.icd10?.descriptionEn || s.icd10Code,
        confidenceScore: Math.round(Number(s.confidenceScore) <= 1 ? Number(s.confidenceScore) * 100 : Number(s.confidenceScore)),
        rationale: s.rationale || 'Gợi ý dựa trên tổng hợp triệu chứng lâm sàng và chỉ số sinh hiệu.',
      }));
    }

    const symp = (caseOverview?.chiefComplaint?.symptoms || selectedEncounterDetail?.chiefComplaint?.symptoms || currentPatient?.symptoms || '').toLowerCase();
    const tempVal = Number(activeTemp) || currentPatient?.vitals?.temp || 0;

    if (symp.includes('ho') || symp.includes('sốt') || symp.includes('thở') || symp.includes('phổi') || tempVal >= 38.5) {
      return [
        {
          id: 'ai-diag-1',
          icd10Code: 'J20.9',
          diseaseName: 'Viêm phế quản cấp (Acute Bronchitis)',
          confidenceScore: 94,
          rationale: 'Bệnh nhân sốt cao, ho kèm khó thở. Cần chụp X-quang ngực thẳng và xét nghiệm máu CBC để đánh giá mức độ nhiễm khuẩn.',
        },
        {
          id: 'ai-diag-2',
          icd10Code: 'J18.9',
          diseaseName: 'Theo dõi Viêm phổi cộng đồng',
          confidenceScore: 78,
          rationale: 'Thân nhiệt cao bất thường kết hợp triệu chứng hô hấp cần kiểm tra kỹ tổn thương nhu mô phổi.',
        },
      ];
    }

    if (symp.includes('bụng') || symp.includes('dạ dày') || symp.includes('tiêu hóa') || symp.includes('tiêu chảy')) {
      return [
        {
          id: 'ai-diag-g1',
          icd10Code: 'K29.0',
          diseaseName: 'Viêm dạ dày - tá tràng cấp tính',
          confidenceScore: 91,
          rationale: 'Đau tức vùng thượng vị, triệu chứng tiêu hóa khởi phát cấp tính sau ăn.',
        },
        {
          id: 'ai-diag-g2',
          icd10Code: 'A09',
          diseaseName: 'Nhiễm trùng đường ruột / Rối loạn tiêu hóa',
          confidenceScore: 76,
          rationale: 'Cần làm xét nghiệm vi sinh phân và sinh hóa máu cơ bản để đánh giá mất nước và điện giải.',
        },
      ];
    }

    return [
      {
        id: 'ai-diag-def1',
        icd10Code: 'R50.9',
        diseaseName: 'Sốt chưa rõ nguyên nhân / Theo dõi nhiễm siêu vi',
        confidenceScore: 89,
        rationale: 'Triệu chứng sốt cấp tính, đề xuất làm xét nghiệm máu CBC và sinh hóa máu cơ bản.',
      },
    ];
  }, [caseOverview?.aiDiagnosisSuggestions, caseOverview?.chiefComplaint?.symptoms, selectedEncounterDetail?.chiefComplaint?.symptoms, currentPatient?.symptoms, activeTemp, currentPatient?.vitals?.temp]);

  // Tải danh sách các phiếu chỉ định đã lập của ca khám từ API
  const fetchEncounterTestOrders = async (encounterId: string) => {
    try {
      setIsLoadingTestOrders(true);
      const orders = await testOrderService.getTestOrdersByEncounter(encounterId);
      if (Array.isArray(orders)) {
        setExistingTestOrders(orders);
        const hasActiveOrder = orders.some(
          (o) => o.items && o.items.some((i) => i.status !== 'cancelled')
        );
        if (hasActiveOrder) {
          setPatientWorkflowStates((prev) => ({
            ...prev,
            [selectedPatientId]: prev[selectedPatientId] === 'completed' ? 'completed' : 'ordered',
          }));
        }
      }
    } catch (err) {
      console.warn('Lỗi khi tải phiếu chỉ định của ca khám:', err);
    } finally {
      setIsLoadingTestOrders(false);
    }
  };

  useEffect(() => {
    setClinicalExamNote(currentPatient?.initialClinicalNote || '');
    setPreliminaryDiag(currentPatient?.initialDoctorDiag || '');
    setSubmitSuccessMsg(null);
    setSubmitErrorMsg(null);
    setExamWarningMsg(null);

    if (activeEncounterId) {
      fetchEncounterTestOrders(activeEncounterId);
    } else {
      setExistingTestOrders([]);
    }
  }, [currentPatient, activeEncounterId, selectedPatientId]);

  // Trạng thái quy trình ca khám hiện tại
  const currentWorkflowState = patientWorkflowStates[selectedPatientId] || 'initial';

  // Thuật toán AI gợi ý chỉ định cận lâm sàng dựa trên Chẩn đoán sơ bộ & Triệu chứng
  const aiRecommendedCodes = useMemo(() => {
    const diag = ((preliminaryDiag || '') + ' ' + (currentPatient?.symptoms || '')).toLowerCase();
    const codes = new Set<string>();

    if (
      diag.includes('phổi') ||
      diag.includes('phế quản') ||
      diag.includes('ho') ||
      diag.includes('thở') ||
      diag.includes('ngực') ||
      diag.includes('sốt')
    ) {
      codes.add('XQ-NGUC');
      codes.add('CBC');
    }

    if (
      diag.includes('dạ dày') ||
      diag.includes('tiêu hóa') ||
      diag.includes('bụng') ||
      diag.includes('tiêu chảy') ||
      diag.includes('ruột') ||
      diag.includes('phân')
    ) {
      codes.add('MICRO01');
      codes.add('CBC');
      codes.add('BIOC01');
    }

    if (
      diag.includes('tiểu') ||
      diag.includes('thận') ||
      diag.includes('đường huyết') ||
      diag.includes('chuyển hóa') ||
      diag.includes('mỡ máu')
    ) {
      codes.add('URI01');
      codes.add('BIOC01');
    }

    if (codes.size === 0) {
      codes.add('CBC');
      codes.add('BIOC01');
    }

    return codes;
  }, [preliminaryDiag, currentPatient?.symptoms]);

  useEffect(() => {
    const recommendedIds = AVAILABLE_TEST_CATALOG.filter((item) =>
      aiRecommendedCodes.has(item.testCode)
    ).map((item) => item.testTypeId);
    setSelectedTestTypeIds(recommendedIds);
  }, [aiRecommendedCodes]);

  const handleToggleCatalogItem = (testTypeId: string) => {
    setSelectedTestTypeIds((prev) =>
      prev.includes(testTypeId) ? prev.filter((id) => id !== testTypeId) : [...prev, testTypeId]
    );
  };

  const handleQuickDiagnosisSelect = (diagText: string) => {
    setPreliminaryDiag(diagText);
  };

  // Tính tổng chi phí cận lâm sàng dự tính
  const totalEstimatedCost = useMemo(() => {
    return AVAILABLE_TEST_CATALOG.filter((item) =>
      selectedTestTypeIds.includes(item.testTypeId)
    ).reduce((sum, item) => sum + item.price, 0);
  }, [selectedTestTypeIds]);

  // Gửi chỉ định cận lâm sàng lên API POST /api/v1/doctor-examination/encounters/:encounterId/test-orders
  const handleConfirmDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEncounterId) {
      setSubmitErrorMsg('Không tìm thấy mã ca khám (Encounter ID) để tạo chỉ định.');
      return;
    }
    if (selectedTestTypeIds.length === 0) {
      setSubmitErrorMsg('Vui lòng chọn ít nhất một chỉ định cận lâm sàng trong danh mục.');
      return;
    }

    setIsSubmittingOrder(true);
    setSubmitSuccessMsg(null);
    setSubmitErrorMsg(null);
    setExamWarningMsg(null);

    try {
      // 1. Lưu khám lâm sàng & chẩn đoán sơ bộ
      if (clinicalExamNote.trim() || preliminaryDiag.trim()) {
        try {
          await clinicalExamService.upsertClinicalExamination(activeEncounterId, {
            examinationFindings: clinicalExamNote.trim() || undefined,
            clinicalNotes: preliminaryDiag.trim() || undefined,
          });
        } catch (examErr: any) {
          const errMsg = examErr?.data?.message || examErr?.message || '';
          if (errMsg.includes('arrived') || errMsg.includes('chưa tới lượt')) {
            setExamWarningMsg('Lưu ý: Khám lâm sàng chưa lưu vào DB do ca khám đang ở trạng thái tiếp đón (arrived).');
          } else {
            console.warn('Cảnh báo lưu khám lâm sàng:', examErr);
          }
        }
      }

      // 2. Tạo phiếu chỉ định cận lâm sàng
      const itemsPayload = selectedTestTypeIds.map((typeId) => {
        const catalogItem = AVAILABLE_TEST_CATALOG.find((c) => c.testTypeId === typeId);
        const wasAiSuggested = catalogItem ? aiRecommendedCodes.has(catalogItem.testCode) : false;
        return {
          testTypeId: typeId,
          wasAiSuggested,
        };
      });

      const orderResult = await testOrderService.createTestOrder(activeEncounterId, {
        notes: orderNotes.trim() || undefined,
        items: itemsPayload,
      });

      setSubmitSuccessMsg(
        `Đã lập phiếu chỉ định ${orderResult.orderCode} thành công! Ca khám đã được chuyển sang Quầy Thu phí (Mô-đun 6).`
      );
      setOrderNotes('');

      // Cập nhật trạng thái quy trình & refresh danh sách phiếu
      setPatientWorkflowStates((prev) => ({
        ...prev,
        [selectedPatientId]: 'ordered',
      }));

      await fetchEncounterTestOrders(activeEncounterId);
      await fetchCaseOverview(activeEncounterId);
    } catch (err: any) {
      console.error('Lỗi khi lập phiếu chỉ định cận lâm sàng:', err);
      const errMsg = err?.data?.message || err?.message || 'Không thể tạo phiếu chỉ định. Vui lòng kiểm tra lại.';
      setSubmitErrorMsg(`Tạo phiếu thất bại: ${errMsg}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Hủy chỉ định xét nghiệm
  const handleCancelTestOrderItem = async (orderItemId: string, testName: string) => {
    if (!window.confirm(`Bác sĩ có chắc chắn muốn hủy chỉ định xét nghiệm "${testName}" này không?`)) {
      return;
    }

    setCancellingItemId(orderItemId);
    try {
      await testOrderService.cancelTestOrderItem(orderItemId, {
        reason: 'Bác sĩ hủy chỉ định cận lâm sàng do thay đổi hướng chẩn đoán.',
      });
      if (activeEncounterId) {
        await fetchEncounterTestOrders(activeEncounterId);
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || 'Không thể hủy chỉ định.';
      alert(`Lỗi khi hủy chỉ định: ${errMsg}`);
    } finally {
      setCancellingItemId(null);
    }
  };

  // Mô phỏng đóng viện phí & có kết quả Lab
  const handleSimulateLabCompletion = () => {
    setPatientWorkflowStates((prev) => ({
      ...prev,
      [selectedPatientId]: 'completed',
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
        {/* Left 2 columns: Patient EMR, AI & Actions */}
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
              {/* Sub-tab Navigation Bar */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
                {/* Tab 1: Hồ sơ Bệnh án Điện tử (EMR) & Tóm tắt AI01 */}
                <button
                  type="button"
                  onClick={() => setActiveSubTab('emr_summary')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSubTab === 'emr_summary'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Hồ sơ EMR & Tóm tắt AI (AI01)</span>
                </button>

                {/* Tab 2: Ghi nhận Khám lâm sàng & Chỉ định Cận lâm sàng */}
                <button
                  type="button"
                  onClick={() => setActiveSubTab('clinical_orders')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSubTab === 'clinical_orders'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <span>Khám & Chỉ định CLS</span>
                  {existingTestOrders.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-extrabold">
                      {existingTestOrders.length}
                    </span>
                  )}
                </button>

                {/* Tab 3: Mô-đun AI02 — Kết quả phân tích hình ảnh xét nghiệm */}
                <button
                  type="button"
                  onClick={() => setActiveSubTab('ai_imaging')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSubTab === 'ai_imaging'
                      ? 'bg-white text-purple-700 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Phân tích ảnh AI (AI02)</span>
                  {currentWorkflowState === 'completed' && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold animate-pulse">
                      Đã có KQ
                    </span>
                  )}
                </button>
              </div>

              {/* Tab 1: Hồ sơ Bệnh án Điện tử (EMR) - Thông tin Hành chính & Sinh hiệu + AI01 Tóm tắt bệnh án */}
              {activeSubTab === 'emr_summary' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Component 1: Administrative EMR Profile & Vitals */}
                  <PatientAdministrativeCard
                    currentPatient={currentPatient}
                    caseOverview={caseOverview}
                    selectedEncounterDetail={selectedEncounterDetail}
                    currentAppointment={currentAppointment}
                    isStartingAppointment={isStartingAppointment}
                    onStartConsultation={handleStartConsultation}
                    activeAllergies={activeAllergies}
                    isLoadingAllergies={isLoadingAllergies}
                    isLoadingOverview={isLoadingOverview}
                    displayBp={displayBp}
                    displayHr={displayHr}
                    displaySpo2={displaySpo2}
                    displayTemp={displayTemp}
                    hasMeasuredVitals={hasMeasuredVitals}
                  />

                  {/* Component 2: AI01 Smart EMR Summary Widget */}
                  <AiClinicalSummaryCard
                    summaryText={currentAiSummary}
                    caseOverview={caseOverview}
                    isGeneratingAiSummary={isGeneratingAiSummary}
                    onTriggerAiSummary={handleTriggerAiSummary}
                  />
                </div>
              )}

              {/* Tab 2: Ghi nhận Khám lâm sàng & Chẩn đoán sơ bộ + Chỉ định Cận lâm sàng + Phiếu đã lập */}
              {activeSubTab === 'clinical_orders' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Component 4: Doctor Clinical Examination & Preliminary Diagnosis */}
                  <ClinicalExamForm
                    encounterId={activeEncounterId}
                    clinicalExamNote={clinicalExamNote}
                    setClinicalExamNote={setClinicalExamNote}
                    preliminaryDiag={preliminaryDiag}
                    setPreliminaryDiag={setPreliminaryDiag}
                    dynamicAiDiagnosisList={dynamicAiDiagnosisList}
                    isGeneratingAiDiagnosis={isGeneratingAiDiagnosis}
                    onTriggerAiDiagnosis={handleTriggerAiDiagnosis}
                    onQuickDiagnosisSelect={handleQuickDiagnosisSelect}
                    examWarningMsg={examWarningMsg}
                  />

                  {/* Component 5: Test Order Creation Form */}
                  <TestOrderCreationCard
                    selectedTestTypeIds={selectedTestTypeIds}
                    onToggleCatalogItem={handleToggleCatalogItem}
                    aiRecommendedCodes={aiRecommendedCodes}
                    totalEstimatedCost={totalEstimatedCost}
                    orderNotes={orderNotes}
                    setOrderNotes={setOrderNotes}
                    isSubmittingOrder={isSubmittingOrder}
                    submitSuccessMsg={submitSuccessMsg}
                    submitErrorMsg={submitErrorMsg}
                    onSubmitOrder={handleConfirmDiagnosis}
                  />

                  {/* Component 6: Test Order History List */}
                  <TestOrderHistoryList
                    existingTestOrders={existingTestOrders}
                    isLoadingTestOrders={isLoadingTestOrders}
                    onRefreshOrders={() => activeEncounterId && fetchEncounterTestOrders(activeEncounterId)}
                    cancellingItemId={cancellingItemId}
                    onCancelItem={handleCancelTestOrderItem}
                  />
                </div>
              )}

              {/* Tab 3: Mô-đun AI02 — Kết quả phân tích hình ảnh xét nghiệm & Đề xuất AI */}
              {activeSubTab === 'ai_imaging' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Component 3: AI02 Lab Image Analysis & ROI Simulation */}
                  <AiImagingAnalysisCard
                    currentWorkflowState={currentWorkflowState}
                    onSimulateLabCompletion={handleSimulateLabCompletion}
                    preliminaryDiag={preliminaryDiag}
                    aiConfidence={currentPatient?.aiConfidence}
                    aiProposedDiag={currentPatient?.aiProposedDiag}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Right 1 column: Patient Queue Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <PatientQueueSidebar
            patients={combinedPatientsMap}
            selectedPatientId={selectedPatientId}
            onSelectPatient={handleSelectPatientId}
            isLoading={isLoadingApi}
            patientWorkflowStates={patientWorkflowStates}
          />
        </div>
      </div>
    </div>
  );
};
