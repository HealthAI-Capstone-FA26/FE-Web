import { formatAllergySummary } from '../../services/patient/patient-allergy.service';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Pill, CheckCircle2, FileCheck, Printer,
  Download, Calendar, Search, Plus, Trash2, ShieldAlert,
  Award, Check, RefreshCw, User, X, Loader2, Save,
  CheckCircle, ArrowRight, Clock, FileText, CheckCheck,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { BorderBeam } from '../../components/ui/border-beam';
import { Mascot } from 'page-mascot';
import { encounterService, formatPdfDeliveryNote, type EncounterItem } from '../../services/encounter/encounter.service';
import { caseTimelineService, type CaseTimelineResponse } from '../../services/doctor/case-timeline.service';
import { useAuth } from '../../context/AuthContext';
import { drugCatalogService, type DrugCatalogItem as ApiDrugItem, type DrugCatalogDetail } from '../../services/doctor/drug-catalog.service';
import {
  prescriptionService,
  type PrescriptionDetail,
} from '../../services/prescription';
import { postTestConsultationService } from '../../services/doctor/post-test-consultation.service';
import { initialDiagnosisService } from '../../services/doctor/initial-diagnosis.service';
import type { DoctorDateFilterMode } from './DoctorEMRView';
import { appointmentService, type AppointmentSlotResponse } from '../../services/appointment/appointment.service';


interface PrescriptionPatientInfo {
  id: string;
  encounterId: string;
  name: string;
  age: number | string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  bloodType: string;
  allergies: string;
  history: string;
  diagnosis: string;
  icd10Code: string;
  aiSuggestedIcd: {
    code: string;
    name: string;
  };
}

interface PrescribedDrugItem {
  catalogCode: string;
  drugId?: string;
  name: string;
  class: string;
  dosage: string;
  unit: string;
  quantity: number;
  route: string;
  duration: string;
  advice: string;
}

export interface DoctorPrescriptionViewProps {
  onNavigateTab?: (tabId: string) => void;
  dateFilterMode?: DoctorDateFilterMode;
  customDate?: string;
}

export const DoctorPrescriptionView: React.FC<DoctorPrescriptionViewProps> = ({
  onNavigateTab,
  dateFilterMode = 'today',
  customDate,
}) => {
  const { user } = useAuth();
  const [, setSearchParams] = useSearchParams();

  const navigateTab = useCallback(
    (tabId: string) => {
      if (onNavigateTab) {
        onNavigateTab(tabId);
      } else {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', tabId);
          return next;
        });
      }
    },
    [onNavigateTab, setSearchParams]
  );

  // Toast Notification System
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const showToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  }, []);

  // Completion Modal with Next Patient button
  const [completionModal, setCompletionModal] = useState<{ isOpen: boolean; message: string } | null>(null);
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);

  // Sync selected patient from localStorage
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    return localStorage.getItem('doctor_selected_patient_id') || '';
  });

  const effectiveCustomDate = useMemo(() => {
    if (customDate) return customDate;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [customDate]);

  const [apiEncounters, setApiEncounters] = useState<EncounterItem[]>([]);
  const [isLoadingEncounters, setIsLoadingEncounters] = useState(false);
  const [timelineData, setTimelineData] = useState<CaseTimelineResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'in_progress' | 'awaiting_review' | 'finished'>('all');

  // Thống kê số lượng theo nhóm trạng thái cho Hàng đợi
  const queueCounts = useMemo(() => {
    return {
      all: apiEncounters.length,
      waiting: apiEncounters.filter((e) => !e.status || e.status === 'waiting_for_doctor' || e.status === 'arrived' || e.status === 'pending').length,
      in_progress: apiEncounters.filter((e) => e.status === 'in_progress' || e.status === 'awaiting_diagnostics' || e.status === 'diagnostics_in_progress').length,
      awaiting_review: apiEncounters.filter((e) => e.status === 'awaiting_review').length,
      finished: apiEncounters.filter((e) => e.status === 'finished' || e.status === 'completed').length,
    };
  }, [apiEncounters]);

  // Prescription backend data
  const [currentPrescription, setCurrentPrescription] = useState<PrescriptionDetail | null>(null);
  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false);
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);
  const [finalDiagnosisId, setFinalDiagnosisId] = useState<string | null>(null);

  // Real Drug Catalog State from Backend API
  const [dbDrugs, setDbDrugs] = useState<ApiDrugItem[]>([]);
  const [isLoadingDrugs, setIsLoadingDrugs] = useState<boolean>(false);
  const [drugSearchQuery, setDrugSearchQuery] = useState<string>('');

  // Selected drug state in form
  const [selectedCatalogCode, setSelectedCatalogCode] = useState<string>('');
  const [customDosage, setCustomDosage] = useState<string>('');
  const [customQty, setCustomQty] = useState<number>(10);
  const [customRoute, setCustomRoute] = useState<string>('Uống');
  const [customDuration, setCustomDuration] = useState<string>('5 ngày');
  const [customAdvice, setCustomAdvice] = useState<string>('Uống nhiều nước ấm.');

  // Prescription Drugs list
  const [prescribedList, setPrescribedList] = useState<PrescribedDrugItem[]>([]);

  // Follow-up appointment state
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [followUpNotes, setFollowUpNotes] = useState<string>('Tái khám kiểm tra hô hấp, nghe phổi và làm huyết học nếu cần.');
  const [isFollowUpSynced, setIsFollowUpSynced] = useState<boolean>(false);
  const [isSchedulingFollowup, setIsSchedulingFollowup] = useState(false);
  const [isFinishingEncounter, setIsFinishingEncounter] = useState(false);

  // Slots giờ khám còn trống của bác sĩ
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlotResponse[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');

  // CA Signing modal state
  const [isDigitalSignModalOpen, setIsDigitalSignModalOpen] = useState(false);
  const [signPassword, setSignPassword] = useState('');

  const [isSigningProgress, setIsSigningProgress] = useState(false);
  const [isSignedSuccess, setIsSignedSuccess] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  const fetchEncountersReqIdRef = useRef<number>(0);

  // Tải danh sách ca khám thực tế
  const fetchEncounters = useCallback(async () => {
    const reqId = ++fetchEncountersReqIdRef.current;
    try {
      setIsLoadingEncounters(true);
      let dateParams: { date?: string; from?: string; to?: string } = {};
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (dateFilterMode === 'today') {
        dateParams = { date: todayStr };
      } else if (dateFilterMode === 'yesterday') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const yesterdayStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
        dateParams = { date: yesterdayStr };
      } else if (dateFilterMode === '7days') {
        const s = new Date();
        s.setDate(s.getDate() - 6);
        const sevenDaysAgoStr = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`;
        dateParams = { from: sevenDaysAgoStr, to: todayStr };
      } else if (dateFilterMode === 'custom' && effectiveCustomDate) {
        dateParams = { date: effectiveCustomDate };
      }

      const data = await encounterService.getEncounters({
        ...(user?.doctorId ? { doctorId: user.doctorId } : {}),
        ...dateParams,
      });
      if (reqId !== fetchEncountersReqIdRef.current) return;
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
      if (reqId === fetchEncountersReqIdRef.current) {
        setIsLoadingEncounters(false);
      }
    }
  }, [user?.doctorId, dateFilterMode, effectiveCustomDate]);

  useEffect(() => {
    fetchEncounters();
  }, [fetchEncounters]);

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

  // Tìm ca khám thật
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

  // Lọc danh sách ca khám theo nhóm trạng thái & từ khóa tìm kiếm (Tên, mã LK, mã BN, SĐT)
  const filteredEncounters = useMemo(() => {
    return apiEncounters.filter((enc) => {
      // Lọc theo nhóm trạng thái
      if (statusFilter === 'waiting') {
        const isWaiting = !enc.status || enc.status === 'waiting_for_doctor' || enc.status === 'arrived' || enc.status === 'pending';
        if (!isWaiting) return false;
      } else if (statusFilter === 'in_progress') {
        const isInProgress = enc.status === 'in_progress' || enc.status === 'awaiting_diagnostics' || enc.status === 'diagnostics_in_progress';
        if (!isInProgress) return false;
      } else if (statusFilter === 'awaiting_review') {
        if (enc.status !== 'awaiting_review') return false;
      } else if (statusFilter === 'finished') {
        const isFin = enc.status === 'finished' || enc.status === 'completed';
        if (!isFin) return false;
      }

      // Lọc theo từ khóa
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      const nameMatch = enc.patient?.fullName?.toLowerCase().includes(term);
      const encCodeMatch = enc.encounterCode?.toLowerCase().includes(term);
      const patCodeMatch = enc.patient?.patientCode?.toLowerCase().includes(term);
      const phoneMatch = enc.patient?.phoneNumber?.toLowerCase().includes(term);
      const idMatch = enc.encounterId?.toLowerCase().includes(term);
      return Boolean(nameMatch || encCodeMatch || patCodeMatch || phoneMatch || idMatch);
    });
  }, [apiEncounters, statusFilter, searchTerm]);

  // Tải danh sách ca khám còn trống của bác sĩ theo ngày tái khám
  useEffect(() => {
    if (!user?.doctorId || !followUpDate) {
      setAvailableSlots([]);
      return;
    }
    let cancelled = false;
    setIsLoadingSlots(true);
    appointmentService
      .getFreeSlots(user.doctorId, followUpDate)
      .then((slots) => {
        if (!cancelled) {
          setAvailableSlots(slots || []);
          if (slots && slots.length > 0) {
            setSelectedSlotId(slots[0].slotId);
          } else {
            setSelectedSlotId('');
          }
        }
      })
      .catch((err) => {
        console.warn('Lỗi khi tải ca khám trống:', err);
        if (!cancelled) setAvailableSlots([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.doctorId, followUpDate]);

  // Tải timeline ca khám
  useEffect(() => {
    if (!activeEncounterId) {
      setTimelineData(null);
      return;
    }
    let cancelled = false;
    caseTimelineService
      .getTimeline(activeEncounterId)
      .then((res) => {
        if (!cancelled) setTimelineData(res);
      })
      .catch(() => {
        if (!cancelled) setTimelineData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeEncounterId]);

  const currentPatient = useMemo<PrescriptionPatientInfo | null>(() => {
    if (!activeEncounter && !timelineData) return null;

    const pat = timelineData?.patient || activeEncounter?.patient;
    const enc = timelineData?.encounter || activeEncounter;
    const dob = pat?.dateOfBirth || '';
    const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : '--';
    const gender = (pat?.gender === 'female' ? 'Nữ' : 'Nam') as 'Nam' | 'Nữ';
    const bloodType = pat?.bloodType || 'Chưa rõ';

    const allergies = timelineData?.allergies?.length
      ? timelineData.allergies.map((a: any) => formatAllergySummary(a.allergyText || a.allergenName)).join('; ')
      : 'Chưa ghi nhận dị ứng';

    const history = timelineData?.medicalHistories?.length
      ? timelineData.medicalHistories.map((h) => h.conditionName).join(', ')
      : 'Chưa ghi nhận tiền sử';

    // Ưu tiên lấy chẩn đoán chính thức (diagnosisType === 'final'), nếu chưa có mới lấy bản ghi chẩn đoán mới nhất
    const diagEvents = (timelineData?.timeline || []).filter((t) => t.type === 'diagnosis');
    const diagEvent =
      [...diagEvents].reverse().find((t) => t.data?.diagnosisType === 'final') ||
      diagEvents[diagEvents.length - 1];
    const icd10Code = diagEvent?.data?.icd10?.icd10Code || diagEvent?.data?.icd10Code || 'I10';
    const diagnosis = diagEvent?.data?.diagnosisName || diagEvent?.data?.icd10?.descriptionVi || 'Chưa có chẩn đoán chính thức';

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
      diagnosis,
      icd10Code,
      aiSuggestedIcd: {
        code: icd10Code,
        name: diagnosis,
      },
    };
  }, [activeEncounter, timelineData, activeEncounterId]);

  // Load prescription data and final diagnosis for active encounter
  useEffect(() => {
    if (!activeEncounterId) {
      setCurrentPrescription(null);
      setPrescribedList([]);
      setIsFollowUpSynced(false);
      setFinalDiagnosisId(null);
      return;
    }

    let isMounted = true;
    const loadPrescriptionForEncounter = async () => {
      setIsLoadingPrescription(true);
      try {
        // 1. Fetch final diagnosis if exists
        try {
          const conclusions = await postTestConsultationService.getDiagnosisConclusions(activeEncounterId);
          if (isMounted && conclusions && conclusions.length > 0) {
            setFinalDiagnosisId(conclusions[0].diagnosisId);
          }
        } catch {}

        // 2. Fetch prescriptions for this encounter
        const prescriptions = await prescriptionService.findMany({ encounterId: activeEncounterId });
        if (!isMounted) return;

        if (Array.isArray(prescriptions) && prescriptions.length > 0) {
          const mainPrescription = prescriptions[0];
          // Get full details
          const detail = await prescriptionService.getById(mainPrescription.prescriptionId);
          if (!isMounted) return;

          setCurrentPrescription(detail);

          if (detail.diagnosisId) {
            setFinalDiagnosisId(detail.diagnosisId);
          }

          // Populate prescribedList from items
          if (detail.items && detail.items.length > 0) {
            const mappedList: PrescribedDrugItem[] = detail.items.map((item) => ({
              catalogCode: item.drug?.drugCode || item.drugId,
              drugId: item.drugId,
              name: item.drug?.drugName || 'Thuốc',
              class: item.drug?.therapeuticClass || item.drug?.genericName || 'Thuốc điều trị',
              dosage: item.dosage,
              unit: item.drug?.unit || 'Viên',
              quantity: Number(item.quantity),
              route: item.routeDisplay || item.drug?.route || 'Uống',
              duration: item.durationDays ? `${item.durationDays} ngày` : '5 ngày',
              advice: item.instruction || '',
            }));
            setPrescribedList(mappedList);
          } else {
            setPrescribedList([]);
          }

          // Kiểm tra xem ca khám đã được đặt lịch tái khám ở bước Tư vấn (Tab 2) chưa
          try {
            const consult = await postTestConsultationService.getTreatmentConsultation(activeEncounterId);
            const followUpAppt = consult?.encounter?.followUpAppointment;
            if (isMounted && followUpAppt) {
              setIsFollowUpSynced(true);
              if (followUpAppt.appointmentDate) {
                setFollowUpDate(new Date(followUpAppt.appointmentDate).toISOString().slice(0, 10));
              }
            } else if (isMounted) {
              setIsFollowUpSynced(false);
            }
          } catch {
            if (isMounted) setIsFollowUpSynced(false);
          }
        } else {
          // No prescription yet
          setCurrentPrescription(null);
          setPrescribedList([]);
          setIsFollowUpSynced(false);
        }
      } catch (err) {
        console.warn('Lỗi khi tải đơn thuốc cho ca khám:', err);
      } finally {
        if (isMounted) setIsLoadingPrescription(false);
      }
    };

    loadPrescriptionForEncounter();
    return () => {
      isMounted = false;
    };
  }, [activeEncounterId]);

  // Fetch real Drug Catalog from Backend API (GET /prescriptions/drug-catalog)
  useEffect(() => {
    let isMounted = true;
    async function fetchDrugCatalog() {
      setIsLoadingDrugs(true);
      try {
        const res = await drugCatalogService.search(drugSearchQuery, 1, 100);
        if (isMounted && res?.items) {
          setDbDrugs(res.items);
          if (res.items.length > 0 && !selectedCatalogCode) {
            const first = res.items[0];
            setSelectedCatalogCode(first.drugCode || first.drugId);
            setCustomDosage(first.defaultDosage || 'Uống 1 viên x 2 lần/ngày');
            setCustomRoute(first.defaultRoute || 'Uống');
          }
        }
      } catch (err) {
        console.warn('Không thể tải danh mục thuốc từ Backend:', err);
      } finally {
        if (isMounted) setIsLoadingDrugs(false);
      }
    }
    fetchDrugCatalog();
    return () => {
      isMounted = false;
    };
  }, [drugSearchQuery]);

  // Active selected item from API
  const activeDirectoryItem = useMemo(() => {
    return dbDrugs.find((item) => item.drugCode === selectedCatalogCode || item.drugId === selectedCatalogCode) || dbDrugs[0];
  }, [dbDrugs, selectedCatalogCode]);

  // Detailed drug info fetched from GET /prescriptions/drug-catalog/:drugId
  const [selectedDrugDetail, setSelectedDrugDetail] = useState<DrugCatalogDetail | null>(null);

  useEffect(() => {
    if (activeDirectoryItem) {
      if (activeDirectoryItem.defaultDosage) setCustomDosage(activeDirectoryItem.defaultDosage);
      if (activeDirectoryItem.defaultRoute) setCustomRoute(activeDirectoryItem.defaultRoute);

      let isMounted = true;
      drugCatalogService
        .getById(activeDirectoryItem.drugId)
        .then((detail) => {
          if (isMounted) setSelectedDrugDetail(detail);
        })
        .catch((err) => {
          console.warn('Không thể lấy chi tiết thuốc từ API getById:', err);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [activeDirectoryItem]);

  // Handle select patient
  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    localStorage.setItem('doctor_selected_patient_id', id);
  };

  // Add drug action
  const handleAddDrug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDirectoryItem) {
      showToast('info', 'Vui lòng chọn thuốc từ danh mục!');
      return;
    }
    const code = activeDirectoryItem.drugCode || activeDirectoryItem.drugId;
    if (prescribedList.some((item) => item.catalogCode === code || item.drugId === activeDirectoryItem.drugId)) {
      showToast('info', 'Thuốc này đã tồn tại trong đơn thuốc!');
      return;
    }
    const newDrug: PrescribedDrugItem = {
      catalogCode: code,
      drugId: activeDirectoryItem.drugId,
      name: activeDirectoryItem.drugName,
      class: activeDirectoryItem.genericName || activeDirectoryItem.allergenCategory?.categoryName || 'Thuốc hóa dược',
      dosage: customDosage || activeDirectoryItem.defaultDosage || 'Uống 1 viên x 2 lần/ngày',
      unit: activeDirectoryItem.unit || 'Viên',
      quantity: customQty,
      route: customRoute || activeDirectoryItem.defaultRoute || 'Uống',
      duration: customDuration,
      advice: customAdvice,
    };
    setPrescribedList([...prescribedList, newDrug]);
  };

  // Delete drug action
  const handleDeleteDrug = (code: string) => {
    setPrescribedList(prescribedList.filter((item) => item.catalogCode !== code));
  };

  // Save / Update Prescription to Backend API (POST /prescriptions or PATCH /prescriptions/:id/items)
  const handleSavePrescription = async (silent = false): Promise<PrescriptionDetail | null> => {
    if (!activeEncounterId) {
      if (!silent) showToast('info', 'Vui lòng chọn ca khám trước khi lưu đơn thuốc!');
      return null;
    }
    if (prescribedList.length === 0) {
      if (!silent) showToast('info', 'Đơn thuốc chưa có dòng thuốc nào!');
      return null;
    }

    try {
      setIsSavingPrescription(true);

      const itemsPayload = prescribedList.map((item) => {
        const durationNum = parseInt(item.duration) || 5;
        return {
          drugId: item.drugId || item.catalogCode,
          quantity: Number(item.quantity) || 1,
          dosage: item.dosage || '1 viên/lần',
          routeDisplay: item.route || 'Uống',
          frequency: item.dosage.includes('x') ? item.dosage.split('x')[1]?.trim() || '2 lần/ngày' : '2 lần/ngày',
          durationDays: durationNum,
          instruction: item.advice || undefined,
        };
      });

      let updatedPrescription: PrescriptionDetail;

      if (currentPrescription?.prescriptionId && currentPrescription.status === 'draft') {
        updatedPrescription = await prescriptionService.updateItems(currentPrescription.prescriptionId, {
          items: itemsPayload,
        });
      } else {
        // Resolve final diagnosis (Backend bắt buộc diagnosisType === 'final')
        let diagId = finalDiagnosisId;
        if (!diagId) {
          try {
            const conclusions = await postTestConsultationService.getDiagnosisConclusions(activeEncounterId);
            if (conclusions && conclusions.length > 0) {
              diagId = conclusions[0].diagnosisId;
              setFinalDiagnosisId(diagId);
            }
          } catch {}
        }

        if (!diagId) {
          try {
            const createdFinal = await postTestConsultationService.createDiagnosisConclusion(activeEncounterId, {
              icd10Code: currentPatient?.icd10Code || 'I10',
              diagnosisName:
                currentPatient?.diagnosis && currentPatient.diagnosis !== 'Chưa có chẩn đoán chính thức'
                  ? currentPatient.diagnosis
                  : 'Chẩn đoán xác định chuyên khoa Tim mạch',
              isPrimary: true,
            });
            diagId = createdFinal.diagnosisId;
            setFinalDiagnosisId(diagId);
          } catch {}
        }

        if (!diagId) {
          throw new Error(
            'Chưa có chẩn đoán chính thức (Final Diagnosis) cho ca khám này. Vui lòng lưu kết luận chẩn đoán ở Tab 2 trước khi kê đơn.'
          );
        }

        updatedPrescription = await prescriptionService.create({
          encounterId: activeEncounterId,
          diagnosisId: diagId,
          items: itemsPayload,
        });
      }

      setCurrentPrescription(updatedPrescription);

      // Refresh follow-up suggestion
      try {
        const sug = await prescriptionService.getFollowupSuggestion(updatedPrescription.prescriptionId);
        if (sug?.suggestedDate) {
          setFollowUpDate(sug.suggestedDate);
        }
      } catch {}

      if (!silent) {
        showToast('success', 'Lưu đơn thuốc (bản nháp) thành công!');
      }
      return updatedPrescription;
    } catch (err: any) {
      if (!silent) {
        showToast('error', `Lỗi khi lưu đơn thuốc: ${err?.message || 'Thao tác thất bại'}`);
      }
      return null;
    } finally {
      setIsSavingPrescription(false);
    }
  };

  // Open CA Digital Signing Modal
  const handleOpenDigitalSignModal = () => {
    if (prescribedList.length === 0) {
      showToast('info', 'Đơn thuốc chưa có thuốc, không thể ký số!');
      return;
    }

    setSignPassword('');
    setSignError(null);
    setIsSignedSuccess(currentPrescription?.status === 'signed');
    setIsSigningProgress(false);
    setIsDigitalSignModalOpen(true);
  };

  // Execute Digital CA Signing (POST /prescriptions/:id/sign)
  const handleExecuteSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signPassword) {
      setSignError('Vui lòng nhập mật khẩu tài khoản bác sĩ để xác thực chữ ký');
      return;
    }

    try {
      setIsSigningProgress(true);
      setSignError(null);

      // Auto-save if needed
      let p = currentPrescription;
      if (!p || p.status === 'draft') {
        p = await handleSavePrescription(true);
        if (!p) {
          throw new Error('Không thể tự động lưu đơn thuốc trước khi ký.');
        }
      }

      const signedPrescription = await prescriptionService.sign(p.prescriptionId, {
        password: signPassword,
      });

      setCurrentPrescription(signedPrescription);
      setIsSigningProgress(false);
      setIsSignedSuccess(true);
      showToast('success', 'Ký số đơn thuốc CA thành công!');
      fetchEncounters();
    } catch (err: any) {
      setIsSigningProgress(false);
      setSignError(err?.message || 'Ký số CA thất bại. Vui lòng kiểm tra lại mật khẩu xác thực.');
    }
  };

  // In / Xuất PDF Phiếu Kết Quả Khám Bệnh & Bệnh Án EMR (Hỗ trợ cả khi không kê đơn thuốc)
  const openMedicalReportPrintWindow = useCallback(async () => {
    let consultData: any = null;
    if (activeEncounterId) {
      try {
        consultData = await postTestConsultationService.getTreatmentConsultation(activeEncounterId);
      } catch {
        // ignore
      }
    }

    const pat = timelineData?.patient || activeEncounter?.patient;
    const enc = timelineData?.encounter || activeEncounter;
    const doctorName = user?.name || activeEncounter?.doctor?.fullName || 'Bác sĩ chuyên khoa Tim mạch';
    const labEvents = (timelineData?.timeline || []).filter(
      (e) => e.type === 'lab_result' || e.type === 'diagnostic_result'
    );
    const vitalEvent = (timelineData?.timeline || []).find((e) => e.type === 'vital_sign_session');
    const examEvent = (timelineData?.timeline || []).find((e) => e.type === 'clinical_examination');

    const win = window.open('', '_blank', 'width=900,height=850');
    if (!win) {
      showToast('error', 'Trình duyệt đang chặn cửa sổ bật lên (Pop-up). Vui lòng cho phép mở cửa sổ in.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const vitalsHtml =
      vitalEvent?.data?.observations && vitalEvent.data.observations.length > 0
        ? vitalEvent.data.observations
            .map(
              (obs: any) =>
                `<span style="display:inline-block;background:#f1f5f9;border:1px solid #cbd5e1;padding:3px 8px;border-radius:6px;margin:2px 4px 2px 0;font-size:12px;"><strong>${
                  obs.item?.itemName || obs.item?.itemCode || 'Chỉ số'
                }:</strong> ${obs.observationValue} ${obs.item?.unit || ''}</span>`
            )
            .join('')
        : 'Đã kiểm tra sinh hiệu tiêu chuẩn';

    const labHtml =
      labEvents.length > 0
        ? `<table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:12px;">
            <thead>
              <tr style="background:#f8fafc;border-bottom:1px solid #cbd5e1;text-align:left;">
                <th style="padding:6px 8px;border:1px solid #cbd5e1;">Dịch vụ Cận lâm sàng</th>
                <th style="padding:6px 8px;border:1px solid #cbd5e1;">Chỉ số / Kết quả đo</th>
                <th style="padding:6px 8px;border:1px solid #cbd5e1;">Kết luận</th>
              </tr>
            </thead>
            <tbody>
              ${labEvents
                .map((ev: any) => {
                  const labRes = ev.data?.result || ev.data?.labResult;
                  const vals = (labRes?.values || [])
                    .map(
                      (v: any) =>
                        `${v.parameter?.parameterName || v.parameter?.parameterCode}: <strong>${
                          v.valueNumeric ?? v.valueText ?? '-'
                        }</strong> ${v.parameter?.unit || ''}`
                    )
                    .join('<br/>');
                  return `<tr>
                    <td style="padding:6px 8px;border:1px solid #cbd5e1;font-weight:bold;">${
                      ev.data?.serviceName || ev.data?.testName || ev.summary
                    }</td>
                    <td style="padding:6px 8px;border:1px solid #cbd5e1;">${vals || 'Đã hoàn tất'}</td>
                    <td style="padding:6px 8px;border:1px solid #cbd5e1;">${
                      labRes?.overallConclusion || labRes?.findings || 'Bình thường'
                    }</td>
                  </tr>`;
                })
                .join('')}
            </tbody>
          </table>`
        : '<p style="font-size:12px;color:#64748b;margin:4px 0;">Không có chỉ định cận lâm sàng hoặc đã hoàn tất kiểm tra.</p>';

    const drugsHtml =
      prescribedList.length > 0
        ? `<table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:12px;">
            <thead>
              <tr style="background:#f8fafc;border-bottom:1px solid #cbd5e1;text-align:left;">
                <th style="padding:6px 8px;border:1px solid #cbd5e1;">STT</th>
                <th style="padding:6px 8px;border:1px solid #cbd5e1;">Tên thuốc & Hàm lượng</th>
                <th style="padding:6px 8px;border:1px solid #cbd5e1;">Đường dùng</th>
                <th style="padding:6px 8px;border:1px solid #cbd5e1;">Số lượng</th>
                <th style="padding:6px 8px;border:1px solid #cbd5e1;">Liều dùng & Cách dùng</th>
              </tr>
            </thead>
            <tbody>
              ${prescribedList
                .map(
                  (d, i) => `<tr>
                    <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:center;">${i + 1}</td>
                    <td style="padding:6px 8px;border:1px solid #cbd5e1;font-weight:bold;">${d.name}</td>
                    <td style="padding:6px 8px;border:1px solid #cbd5e1;">${d.route}</td>
                    <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;">${d.quantity} ${d.unit}</td>
                    <td style="padding:6px 8px;border:1px solid #cbd5e1;">${d.dosage} (${d.duration})${
                    d.advice ? `<br/><em>Lưu ý: ${d.advice}</em>` : ''
                  }</td>
                  </tr>`
                )
                .join('')}
            </tbody>
          </table>`
        : '<p style="font-size:12px;color:#475569;margin:4px 0;">Không kê đơn thuốc (Điều trị theo hướng dẫn tư vấn & chế độ sinh hoạt).</p>';

    win.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>Phiếu Kết Quả Khám Bệnh EMR - ${currentPatient?.name || 'Bệnh nhân'}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 28px; line-height: 1.5; }
          .container { max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 28px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e40af; padding-bottom: 14px; margin-bottom: 18px; }
          .title { text-align: center; margin: 16px 0; }
          .title h1 { font-size: 20px; color: #1e3a8a; margin: 0; text-transform: uppercase; }
          .title p { font-size: 12px; color: #64748b; margin: 4px 0 0; }
          .section { margin-bottom: 16px; }
          .section-title { font-size: 13px; font-weight: 800; color: #1e40af; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; font-size: 13px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 13px; }
          .footer { display: flex; justify-content: space-between; margin-top: 28px; font-size: 13px; }
          @media print {
            body { padding: 0; }
            .container { border: none; padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align:right;max-width:800px;margin:0 auto 12px;">
          <button onclick="window.print()" style="background:#1d4ed8;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-weight:bold;cursor:pointer;">
            🖨️ In Phiếu / Lưu PDF
          </button>
        </div>
        <div class="container">
          <div class="header">
            <div>
              <div style="font-weight:900;font-size:15px;color:#1e3a8a;">PHÒNG KHÁM CHUYÊN KHOA TIM MẠCH HEALTHAI</div>
              <div style="font-size:12px;color:#475569;">Hệ thống Bệnh án điện tử thông minh (EMR Cardiology Platform)</div>
            </div>
            <div style="text-align:right;font-size:12px;">
              <div><strong>Mã lượt khám:</strong> ${enc?.encounterCode || currentPatient?.id || 'N/A'}</div>
              <div><strong>Mã bệnh nhân:</strong> ${pat?.patientCode || 'N/A'}</div>
              <div><strong>Ngày khám:</strong> ${todayStr}</div>
            </div>
          </div>

          <div class="title">
            <h1>PHIẾU KẾT QUẢ KHÁM BỆNH & TƯ VẤN ĐIỀU TRỊ</h1>
            <p>Bản tổng hợp hồ sơ bệnh án điện tử (EMR Clinical Summary Report)</p>
          </div>

          <div class="section">
            <div class="section-title">1. Thông tin hành chính bệnh nhân</div>
            <div class="grid">
              <div><strong>Họ và tên:</strong> ${currentPatient?.name || pat?.fullName || '---'}</div>
              <div><strong>Giới tính / Tuổi:</strong> ${currentPatient?.gender || '---'} (${currentPatient?.age || '--'} tuổi)</div>
              <div><strong>Số điện thoại:</strong> ${pat?.phoneNumber || '---'}</div>
              <div><strong>Tiền sử dị ứng:</strong> ${currentPatient?.allergies || 'Chưa ghi nhận'}</div>
              <div style="grid-column: span 2;"><strong>Tiền sử bệnh lý:</strong> ${currentPatient?.history || 'Chưa ghi nhận'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">2. Sinh hiệu & Khám lâm sàng Tim mạch</div>
            <div style="margin-bottom:8px;">${vitalsHtml}</div>
            <div class="box">
              <div><strong>Nghe tim phổi:</strong> ${examEvent?.data?.auscultationFindings || examEvent?.data?.examinationFindings || 'Tim đều, T1 T2 rõ'}</div>
              ${examEvent?.data?.inspectionFindings ? `<div><strong>Nhìn:</strong> ${examEvent.data.inspectionFindings}</div>` : ''}
              ${examEvent?.data?.palpationFindings ? `<div><strong>Sờ:</strong> ${examEvent.data.palpationFindings}</div>` : ''}
              ${examEvent?.data?.percussionFindings ? `<div><strong>Gõ:</strong> ${examEvent.data.percussionFindings}</div>` : ''}
              ${examEvent?.data?.clinicalNotes ? `<div><strong>Ghi chú lâm sàng:</strong> ${examEvent.data.clinicalNotes}</div>` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">3. Kết quả Cận lâm sàng (Xét nghiệm / Chẩn đoán hình ảnh / ECG)</div>
            ${labHtml}
          </div>

          <div class="section">
            <div class="section-title">4. Chẩn đoán xác định (ICD-10) & Phác đồ tư vấn điều trị</div>
            <div class="box">
              <div style="font-size:14px;color:#1e3a8a;margin-bottom:6px;">
                <strong>Chẩn đoán chính (ICD-10):</strong> [${currentPatient?.icd10Code || 'I10'}] ${currentPatient?.diagnosis || 'Đã xác lập chẩn đoán'}
              </div>
              ${
                consultData?.conditionExplanation
                  ? `<div><strong>Giải thích tình trạng bệnh:</strong> ${consultData.conditionExplanation}</div>`
                  : ''
              }
              ${
                consultData?.treatmentPlan
                  ? `<div><strong>Hướng xử trí & Phác đồ điều trị:</strong> ${consultData.treatmentPlan}</div>`
                  : ''
              }
              ${
                consultData?.lifestyleAdvice
                  ? `<div><strong>Tư vấn lối sống & vận động:</strong> ${consultData.lifestyleAdvice}</div>`
                  : ''
              }
              ${
                consultData?.nutritionAdvice
                  ? `<div><strong>Tư vấn chế độ dinh dưỡng:</strong> ${consultData.nutritionAdvice}</div>`
                  : ''
              }
              ${
                followUpDate
                  ? `<div style="margin-top:6px;color:#047857;font-weight:bold;">📅 Lịch hẹn tái khám: ${followUpDate}</div>`
                  : ''
              }
            </div>
          </div>

          <div class="section">
            <div class="section-title">5. Chỉ định thuốc điều trị</div>
            ${drugsHtml}
          </div>

          <div class="footer">
            <div style="font-size:11px;color:#64748b;max-width:55%;">
              * Phiếu kết quả này được trích xuất từ Hệ thống Bệnh án điện tử EMR.<br/>
              * Khi đi tái khám, quý bệnh nhân vui lòng mang theo phiếu này hoặc mã lượt khám <strong>${
                enc?.encounterCode || currentPatient?.id || ''
              }</strong>.
            </div>
            <div style="text-align:center;min-width:220px;">
              <div><em>Ngày ${todayStr}</em></div>
              <div style="font-weight:bold;margin-top:4px;">BÁC SĨ KHÁM & KẾT LUẬN</div>
              <div style="margin:36px 0 8px;color:#059669;font-size:11px;font-weight:bold;">✓ Đã xác nhận hoàn tất hồ sơ EMR</div>
              <div style="font-weight:800;color:#1e3a8a;">${doctorName}</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 250); };
        </script>
      </body>
      </html>
    `);
    win.document.close();
  }, [activeEncounterId, timelineData, activeEncounter, user?.name, currentPatient, prescribedList, followUpDate, showToast]);

  // Export / Print PDF (GET /prescriptions/:id/export & PATCH /prescriptions/:id/printed, fallback sang Phiếu kết quả EMR)
  const handlePrintPrescription = async () => {
    if (!currentPrescription?.prescriptionId) {
      await openMedicalReportPrintWindow();
      return;
    }
    try {
      const res = await prescriptionService.exportPdf(currentPrescription.prescriptionId);
      await prescriptionService.markAsPrinted(currentPrescription.prescriptionId).catch(() => {});
      if (res?.pdfUrl) {
        window.open(res.pdfUrl, '_blank');
      } else {
        await openMedicalReportPrintWindow();
      }
    } catch {
      await openMedicalReportPrintWindow();
    }
  };

  const handleDownloadPdf = async () => {
    if (!currentPrescription?.prescriptionId) {
      await openMedicalReportPrintWindow();
      return;
    }
    try {
      const res = await prescriptionService.exportPdf(currentPrescription.prescriptionId);
      if (res?.pdfUrl) {
        window.open(res.pdfUrl, '_blank');
      } else {
        await openMedicalReportPrintWindow();
      }
    } catch {
      await openMedicalReportPrintWindow();
    }
  };

  // Schedule Follow-up Appointment (POST /prescriptions/:id/followup)
  const handleScheduleFollowUp = async () => {
    if (!currentPrescription?.prescriptionId) {
      showToast('info', 'Vui lòng lưu và ký số đơn thuốc trước khi đặt lịch tái khám!');
      return;
    }
    if (currentPrescription.status !== 'signed') {
      showToast('info', 'Đơn thuốc cần được ký số (status=signed) trước khi đặt lịch tái khám!');
      return;
    }
    if (!followUpDate) {
      showToast('info', 'Vui lòng chọn ngày tái khám!');
      return;
    }

    try {
      setIsSchedulingFollowup(true);
      await prescriptionService.scheduleFollowup(currentPrescription.prescriptionId, {
        appointmentDate: followUpDate,
        slotId: selectedSlotId || undefined,
        reasonForVisit: followUpNotes || 'Tái khám điều trị',
        closeEncounter: true,
      });
      setIsFollowUpSynced(true);
      showToast('success', `Đã đặt lịch tái khám ngày ${followUpDate} thành công và tự động đóng ca khám!`);
      fetchEncounters();
      setCompletionModal({
        isOpen: true,
        message: `Đã hoàn tất kê đơn & đặt lịch hẹn tái khám ngày ${followUpDate} cho bệnh nhân ${currentPatient?.name || ''}.`,
      });
    } catch (err: any) {
      showToast('error', `Lỗi khi đặt lịch tái khám: ${err?.message || 'Thao tác thất bại'}`);
    } finally {
      setIsSchedulingFollowup(false);
    }
  };

  // Mở modal xác nhận kết thúc lượt khám
  const handleFinishEncounter = () => {
    if (!activeEncounterId) return;
    if (!isPrescriptionSigned) {
      showToast('error', 'Vui lòng ký số đơn thuốc trước khi hoàn tất & đóng ca khám.');
      return;
    }
    setIsFinishConfirmOpen(true);
  };

  // Xác nhận kết thúc lượt khám (POST /encounters/:encounterId/finish)
  const handleConfirmFinishEncounter = async () => {
    if (!activeEncounterId) return;

    try {
      setIsFinishingEncounter(true);

      // Nếu bác sĩ đã thêm thuốc vào danh sách nhưng chưa lưu hoặc đơn thuốc đang ở trạng thái nháp, tự động lưu trước khi đóng ca
      if (prescribedList.length > 0 && (!currentPrescription || currentPrescription.status === 'draft')) {
        const saved = await handleSavePrescription(true);
        if (!saved) {
          showToast(
            'error',
            'Không thể lưu đơn thuốc trước khi đóng ca khám. Vui lòng kiểm tra lại chẩn đoán chính thức (Tab 2) hoặc danh sách thuốc.'
          );
          return;
        }
      }

      const finishRes = await prescriptionService.finishEncounter(activeEncounterId);
      const zaloNote = formatPdfDeliveryNote(finishRes?.pdfDelivery);
      setIsFinishConfirmOpen(false);
      showToast('success', `Lượt khám đã được kết thúc thành công!${zaloNote}`);
      fetchEncounters();
      setCompletionModal({
        isOpen: true,
        message: `Đã hoàn tất ca khám cho bệnh nhân ${currentPatient?.name || ''}.${zaloNote}`,
      });
    } catch (err: any) {
      showToast('error', `Lỗi khi kết thúc lượt khám: ${err?.message || 'Thao tác thất bại'}`);
    } finally {
      setIsFinishingEncounter(false);
    }
  };

  // Gọi ca khám tiếp theo từ hàng đợi
  const handleNextPatient = () => {
    const nextCandidate =
      apiEncounters.find((e) => e.encounterId !== activeEncounterId && e.status === 'awaiting_review') ||
      apiEncounters.find(
        (e) =>
          e.encounterId !== activeEncounterId &&
          (!e.status || e.status === 'waiting_for_doctor' || e.status === 'arrived' || e.status === 'pending')
      ) ||
      apiEncounters.find((e) => e.encounterId !== activeEncounterId && e.status !== 'finished' && e.status !== 'completed');

    setCompletionModal(null);

    if (nextCandidate) {
      setSelectedPatientId(nextCandidate.encounterId);
      localStorage.setItem('doctor_selected_patient_id', nextCandidate.encounterId);
      if (nextCandidate.status === 'awaiting_review') {
        navigateTab('diagnosis');
      } else {
        navigateTab('emr');
      }
    } else {
      showToast('info', 'Đã hết ca khám chờ trong hàng đợi!');
    }
  };

  const isPrescriptionSigned = currentPrescription?.status === 'signed';
  const isEncounterFinished =
    activeEncounter?.status === 'finished' ||
    activeEncounter?.status === 'completed' ||
    timelineData?.encounter?.status === 'finished';
  const isPrescriptionLocked = isPrescriptionSigned || isEncounterFinished;

  // Xác định bước hiện tại trong quy trình kê đơn 3 bước
  const currentStep = useMemo(() => {
    if (isFollowUpSynced || isEncounterFinished) return 3;
    if (isPrescriptionSigned || prescribedList.length > 0) return 2;
    return 1;
  }, [isFollowUpSynced, isEncounterFinished, isPrescriptionSigned, prescribedList.length]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-lg transition-all animate-in slide-in-from-top-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-blue-50 border-blue-300 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
            ) : (
              <Clock className="w-4.5 h-4.5 text-blue-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer border-none bg-transparent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Module Title Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex items-center gap-3">
          <Mascot
            directions="/mascots/mydoctor-directions.png"
            reactions="/mascots/mydoctor-reactions.png"
            size={120}
            className="shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Kê Đơn Thuốc & Ký Số Điện Tử
              </h2>
              {currentPrescription && (
                <Badge
                  variant={isPrescriptionSigned ? 'success' : 'warning'}
                  size="sm"
                >
                  {isPrescriptionSigned ? 'Đã Ký Số CA' : 'Bản Nháp (Draft)'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Lập đơn thuốc điện tử và ký số pháp lý CA.
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

        {/* Left Column: Patient selector and allergy record (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Patient queue card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Bệnh nhân đang chờ đơn thuốc
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

            {/* Segmented status filter pills */}
            <div className="flex flex-wrap gap-1 p-1 bg-slate-100/80 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`flex-1 min-w-[56px] py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer border-none ${
                  statusFilter === 'all'
                    ? 'bg-white text-blue-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Tất cả ({queueCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('waiting')}
                className={`py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer border-none ${
                  statusFilter === 'waiting'
                    ? 'bg-white text-blue-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Chờ khám ({queueCounts.waiting})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_progress')}
                className={`py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer border-none ${
                  statusFilter === 'in_progress'
                    ? 'bg-white text-blue-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Đang khám ({queueCounts.in_progress})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('awaiting_review')}
                className={`py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer border-none ${
                  statusFilter === 'awaiting_review'
                    ? 'bg-rose-50 text-rose-700 shadow-xs font-black ring-1 ring-rose-200'
                    : queueCounts.awaiting_review > 0
                    ? 'text-rose-700 font-extrabold bg-rose-50/50 hover:bg-rose-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Có KQ CLS ({queueCounts.awaiting_review})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('finished')}
                className={`py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer border-none ${
                  statusFilter === 'finished'
                    ? 'bg-white text-emerald-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Đã xong ({queueCounts.finished})
              </button>
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
                <div className="p-4 text-center text-xs text-slate-400">Đang tải danh sách ca khám...</div>
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

                return (
                  <div
                    key={enc.encounterId}
                    onClick={() => handleSelectPatient(enc.encounterId)}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex justify-between items-center ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300'
                        : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-extrabold text-slate-800">{patName}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{patCode}</div>
                    </div>
                    {enc.status === 'awaiting_review' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        Đã có KQ CLS
                      </span>
                    ) : enc.status === 'in_progress' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                        Đang khám
                      </span>
                    ) : enc.status === 'awaiting_diagnostics' || enc.status === 'diagnostics_in_progress' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                        Chờ CLS
                      </span>
                    ) : enc.status === 'finished' || enc.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Đã xong
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Chờ khám
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Patient clinical details & allergy warning */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Thông tin lâm sàng & Dị ứng
            </h3>

            {currentPatient ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <span className="font-extrabold text-rose-800 flex items-center gap-1.5 uppercase text-[9px] tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Tiền sử dị ứng thuốc:</span>
                  </span>
                  <p className="font-extrabold text-rose-950 leading-relaxed">
                    {currentPatient.allergies}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-extrabold text-slate-700 block uppercase text-[9px] tracking-wider">Chẩn đoán lâm sàng:</span>
                  <div className="space-y-1 font-semibold text-slate-600">
                    <div className="text-slate-800">
                      Mã bệnh: <span className="font-mono bg-blue-700 text-white px-1.5 py-0.5 rounded text-[10px]">{currentPatient.icd10Code}</span>
                    </div>
                    <div className="text-slate-800 leading-snug">
                      Tên bệnh: {currentPatient.diagnosis}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 border border-blue-150 rounded-xl space-y-1 font-semibold text-slate-700">
                  <span className="text-[9px] font-extrabold uppercase text-blue-800 block tracking-wider">Tiền sử bệnh án:</span>
                  <p className="leading-snug text-slate-600">{currentPatient.history}</p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Chưa chọn ca khám
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Prescription editor, directory selector, follow-up, signing (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Stepper Quy trình Kê đơn 3 bước */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { step: 1, title: 'Soạn đơn thuốc', desc: 'Chọn thuốc & liều' },
                { step: 2, title: 'Ký số CA & In', desc: 'Xác thực pháp lý' },
                { step: 3, title: 'Hẹn tái khám', desc: 'Hoàn tất ca khám' },
              ].map((s) => {
                const isPassed = currentStep > s.step;
                const isCurrent = currentStep === s.step;
                return (
                  <div
                    key={s.step}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                      isCurrent
                        ? 'bg-blue-50/80 border-blue-400 shadow-xs ring-1 ring-blue-300'
                        : isPassed
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200/70 text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        isCurrent
                          ? 'bg-blue-700 text-white'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : s.step}
                    </div>
                    <div className="leading-tight truncate">
                      <div
                        className={`text-xs font-black truncate ${
                          isCurrent ? 'text-blue-900' : isPassed ? 'text-emerald-900' : 'text-slate-700'
                        }`}
                      >
                        {s.title}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add medication from National Drug Directory Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Search className="w-4.5 h-4.5 text-blue-700" />
              <span>Tra Cứu Danh Mục Thuốc Quốc Gia & Thêm Vào Đơn</span>
            </h3>

            <form onSubmit={handleAddDrug} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">

              <div className="space-y-1 md:col-span-2">
                <label className="block font-bold text-slate-700">1. Tìm & Chọn thuốc kê đơn (*):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={drugSearchQuery}
                    onChange={(e) => setDrugSearchQuery(e.target.value)}
                    placeholder="Tìm tên thuốc..."
                    className="w-1/3 p-3 rounded-xl border border-slate-200 font-medium text-slate-800 outline-none focus:border-blue-600 bg-white text-xs"
                  />
                  <select
                    value={selectedCatalogCode}
                    onChange={(e) => setSelectedCatalogCode(e.target.value)}
                    className="w-2/3 p-3 rounded-xl border border-slate-200 font-extrabold text-slate-800 outline-none focus:border-blue-600 bg-white"
                  >
                    {isLoadingDrugs ? (
                      <option value="">Đang tải danh mục thuốc...</option>
                    ) : dbDrugs.length === 0 ? (
                      <option value="">Không tìm thấy thuốc...</option>
                    ) : (
                      dbDrugs.map((item) => {
                        const code = item.drugCode || item.drugId;
                        return (
                          <option key={item.drugId} value={code}>
                            {item.drugName} {item.genericName ? `(${item.genericName})` : ''} - {item.unit}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
                {selectedDrugDetail && (
                  <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-bold text-blue-900">
                      <span>Mã CSDL: <span className="font-mono text-blue-800">{selectedDrugDetail.drugCode}</span> ({selectedDrugDetail.drugName})</span>
                      {selectedDrugDetail.allergenCategory && (
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-extrabold text-[10px]">
                          Nhóm dị ứng: {selectedDrugDetail.allergenCategory.categoryName}
                        </span>
                      )}
                    </div>
                    {selectedDrugDetail.genericName && (
                      <div className="text-slate-600">Hoạt chất gốc: <span className="font-semibold">{selectedDrugDetail.genericName}</span></div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">2. Số lượng & Đơn vị tính (*):</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={customQty}
                    onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                    className="w-24 p-3 rounded-xl border border-slate-200 font-black text-center text-slate-800 outline-none focus:border-blue-600"
                  />
                  <span className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center">
                    {activeDirectoryItem?.unit || 'Viên'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">3. Đường dùng (*):</label>
                <select
                  value={customRoute}
                  onChange={(e) => setCustomRoute(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-blue-600 bg-white"
                >
                  <option value="Uống">Uống (viên/nước)</option>
                  <option value="Tiêm">Tiêm tĩnh mạch / Tiêm bắp</option>
                  <option value="Bôi">Bôi ngoài da</option>
                  <option value="Đặt">Đặt dưới lưỡi / Đặt hậu môn</option>
                  <option value="Hít">Hít phế quản (xịt)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">4. Thời gian dùng (*):</label>
                <input
                  type="text"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  placeholder="vd: 5 ngày, 7 ngày..."
                  className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block font-bold text-slate-700">5. Liều dùng & Liều lượng chi tiết (*):</label>
                <input
                  type="text"
                  value={customDosage}
                  onChange={(e) => setCustomDosage(e.target.value)}
                  placeholder="vd: Uống 1 viên x 2 lần/ngày sau khi ăn no..."
                  className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block font-bold text-slate-700">6. Lời dặn dặn dò của Bác sĩ:</label>
                <input
                  type="text"
                  value={customAdvice}
                  onChange={(e) => setCustomAdvice(e.target.value)}
                  placeholder="vd: Tránh ăn no sát giờ uống, uống nhiều nước..."
                  className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="md:col-span-2 pt-2 flex items-center justify-between gap-2">
                {isEncounterFinished ? (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                    Ca khám này đã kết thúc (Đã xong) nên không thể thêm hoặc sửa đơn thuốc.
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={isPrescriptionLocked}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Vào Đơn Thuốc</span>
                </button>
              </div>

            </form>
          </div>

          {/* Current Prescription Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-indigo-700" />
                  <span>Nội Dung Đơn Thuốc Hiện Tại (Chuẩn Hóa ICD-10)</span>
                </h3>
                {currentPrescription && (
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Mã đơn: <strong className="text-blue-900">{currentPrescription.prescriptionCode}</strong> • Trạng thái:{' '}
                    {currentPrescription.status === 'signed'
                      ? 'Đã ký xác nhận'
                      : currentPrescription.status === 'dispensed'
                      ? 'Đã cấp phát'
                      : currentPrescription.status === 'cancelled'
                      ? 'Đã hủy'
                      : 'Bản nháp'}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{prescribedList.length} thuốc đã kê</span>

                {!isPrescriptionLocked && (
                  <button
                    type="button"
                    onClick={() => handleSavePrescription(false)}
                    disabled={isSavingPrescription || prescribedList.length === 0}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isSavingPrescription ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-blue-700" />
                        <span>Lưu Bản Nháp</span>
                      </>
                    )}
                  </button>
                )}

                {/* Print/Download button if signed */}
                {isPrescriptionSigned && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrintPrescription}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <Printer className="w-3.5 h-3.5 text-cyan-300" />
                      <span>In đơn</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Tải PDF</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {isLoadingPrescription ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Đang tải dữ liệu đơn thuốc...
              </div>
            ) : prescribedList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200">
                      <th className="py-2.5 px-3">Tên Thuốc & Hàm Lượng</th>
                      <th className="py-2.5 px-3">Đường Dùng</th>
                      <th className="py-2.5 px-3">Liều Dùng & Liều Lượng</th>
                      <th className="py-2.5 px-3 text-center">Số Lượng</th>
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3 text-center">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {prescribedList.map((d) => (
                      <tr key={d.catalogCode} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-slate-850 block">{d.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{d.class}</span>
                        </td>
                        <td className="py-3 px-3">{d.route}</td>
                        <td className="py-3 px-3">
                          <span className="block text-slate-650">{d.dosage}</span>
                          {d.advice && <span className="text-[9px] text-indigo-600 block italic leading-none mt-1">Lưu ý: {d.advice}</span>}
                        </td>
                        <td className="py-3 px-3 text-center font-black text-blue-900">{d.quantity} {d.unit}</td>
                        <td className="py-3 px-3 font-bold text-slate-600">{d.duration}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            disabled={isPrescriptionLocked}
                            onClick={() => handleDeleteDrug(d.catalogCode)}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors cursor-pointer border-none bg-transparent"
                            title="Xóa thuốc"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 font-medium text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                Chưa có thuốc nào được kê trong đơn. Hãy chọn thuốc từ danh mục phía trên.
              </div>
            )}
          </div>

          {/* Trạng thái Lịch Hẹn Tái Khám & Kết Thúc Lượt Khám */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4.5 h-4.5 text-blue-700" />
                <span>Hoàn Tất & Kết Thúc Lượt Khám</span>
              </h3>
              {isFollowUpSynced ? (
                <Badge variant="success" size="sm">
                  Đã Có Lịch Tái Khám
                </Badge>
              ) : (
                <span className="text-[11px] font-semibold text-slate-400">
                  Không yêu cầu tái khám
                </span>
              )}
            </div>

            {isFollowUpSynced && followUpDate ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-emerald-900">
                    Bệnh nhân đã được hẹn tái khám vào ngày {followUpDate}
                  </p>
                  <p className="text-emerald-700 font-medium">
                    Lịch hẹn và khung giờ đã được hệ thống giữ chỗ thành công tại bước Tư vấn điều trị (Tab 2).
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
              <span className="text-[11px] text-slate-500 font-medium">
                * Bác sĩ cần ký xác nhận đơn thuốc trước khi hoàn tất &amp; đóng ca khám.
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={openMedicalReportPrintWindow}
                  disabled={!activeEncounterId}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
                >
                  <Printer className="w-4 h-4 text-blue-700" />
                  <span>In / Tải Phiếu Kết Quả EMR (.PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinishEncounter}
                  disabled={isFinishingEncounter || !activeEncounterId || isEncounterFinished || !isPrescriptionSigned}
                  title={!isPrescriptionSigned && !isEncounterFinished ? 'Vui lòng ký số đơn thuốc trước khi đóng ca khám' : undefined}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl border-none cursor-pointer flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  {isFinishingEncounter ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4" />
                  )}
                  <span>
                    {activeEncounter?.status === 'finished' ? 'Ca khám đã hoàn tất' : 'Hoàn tất & Đóng ca khám'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Verification & Digital CA Signature execution panel */}
          <BorderBeam size="md" colorVariant="colorful">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-indigo-500/30 shadow-xl p-6 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold uppercase text-cyan-300 block tracking-wider">XÁC THỰC PHÁP LÝ CA</span>
                <h4 className="text-sm font-black">Xác Nhận Đơn Thuốc Điện Tử & Xuất Hồ Sơ Bệnh Án PDF</h4>
                <p className="text-[11px] text-slate-400">
                  Thực hiện ký số điện tử của bác sĩ phụ trách để xuất tệp EMR PDF lưu trữ tập trung vào hệ thống bệnh nhân.
                </p>
              </div>

              {isPrescriptionSigned ? (
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-300 font-extrabold text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Đơn Thuốc Đã Ký Số Thành Công</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-md"
                  >
                    <Download className="w-4 h-4 text-cyan-300" />
                    <span>Xem PDF</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleOpenDigitalSignModal}
                  disabled={prescribedList.length === 0 || isSavingPrescription || isEncounterFinished}
                  className="px-6 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none flex items-center gap-2 shrink-0 transition-all uppercase tracking-wide"
                >
                  <FileCheck className="w-4.5 h-4.5 text-cyan-300" />
                  <span>Ký Số Bác Sĩ & Đóng Đơn</span>
                </button>
              )}
            </div>
          </BorderBeam>

        </div>

      </div>

      {/* Digital Signature execution CA verify Modal */}
      <Modal
        isOpen={isDigitalSignModalOpen}
        onClose={() => {
          if (!isSigningProgress) setIsDigitalSignModalOpen(false);
        }}
        title="Xác Thực Ký Số Pháp Lý Bác Sĩ (CA Digital Signature)"
        subtitle={`Bác sĩ ký: ${user?.name || 'BS. CKII'} • Chứng thư CA Bộ Y Tế`}
        footer={
          isSignedSuccess ? (
            <button
              onClick={() => setIsDigitalSignModalOpen(false)}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl cursor-pointer border-none"
            >
              Hoàn Tất Quy Trình & Đóng
            </button>
          ) : (
            <button
              disabled={isSigningProgress}
              onClick={() => setIsDigitalSignModalOpen(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer border-none"
            >
              Hủy
            </button>
          )
        }
      >
        {isSigningProgress ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Đang ký số đơn thuốc (CA Digital Signature)...</h4>
              <p className="text-xs text-slate-500 font-medium">Đang xác thực khóa mật và phát hành chứng thực điện tử.</p>
            </div>
          </div>
        ) : isSignedSuccess ? (
          <div className="py-6 text-center space-y-4 text-xs font-semibold">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Ký Số Đơn Thuốc Thành Công!</h4>
              <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto leading-normal">
                Đơn thuốc đã được mã hóa pháp lý bằng chữ ký số của <strong className="text-slate-800">{user?.name || 'Bác sĩ điều trị'}</strong> và tự động đồng bộ sang Cổng Bệnh nhân & Nhà thuốc bệnh viện.
              </p>
            </div>

            {/* EMR PDF preview info */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-3 font-sans text-slate-700">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-black text-indigo-950 uppercase tracking-wider text-[10px]">Tóm Tắt Hồ Sơ Đơn Thuốc EMR</span>
                <span className="font-mono text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black">Digital Verified</span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed">
                <div>Mã đơn thuốc: <strong className="font-mono text-blue-900">{currentPrescription?.prescriptionCode}</strong></div>
                <div>Bệnh nhân: <strong className="text-slate-900">{currentPatient?.name || 'Bệnh nhân'}</strong> ({currentPatient?.gender || '--'}, {currentPatient?.age || '--'} tuổi)</div>
                <div>Chẩn đoán chính: <strong>{currentPatient?.icd10Code} - {currentPatient?.diagnosis}</strong></div>
                <div>Đơn thuốc kê: <strong>{prescribedList.map((d) => `${d.name} x ${d.quantity}`).join(', ') || 'Chưa có thuốc'}</strong></div>
                {currentPrescription?.certificateSerial && (
                  <div>Mã chứng thư CA: <strong className="font-mono text-slate-800">{currentPrescription.certificateSerial}</strong></div>
                )}
              </div>
              <div className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                <Award className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Ký bởi: {user?.name || 'Bác sĩ điều trị'} (Bộ Y Tế CA)</span>
              </div>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={handlePrintPrescription}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs"
              >
                <Printer className="w-4 h-4 text-cyan-300" />
                <span>In Đơn Thuốc</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs"
              >
                <Download className="w-4 h-4 text-cyan-300" />
                <span>Tải Hồ Sơ Y Tế (.PDF)</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleExecuteSign} className="space-y-4 text-xs font-semibold">
            {signError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{signError}</span>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-800 block">Thông tin chứng thư chữ ký số (CA):</span>
              <div className="space-y-1 text-slate-600 text-xs">
                <div>Bác sĩ ký: <strong className="text-slate-800">{user?.name || 'Bác sĩ điều trị'}</strong></div>
                <div>Tổ chức cấp: <strong className="text-blue-900">Ban Cơ Yếu Chính Phủ / Cổng Ký Số Y Tế</strong></div>
                <div>Số lượng thuốc trong đơn: <strong className="text-slate-900">{prescribedList.length} dòng</strong></div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-700 font-bold">
                Nhập mật khẩu tài khoản bác sĩ để xác thực ký số (*):
              </label>
              <input
                type="password"
                value={signPassword}
                onChange={(e) => setSignPassword(e.target.value)}
                placeholder="Nhập mật khẩu tài khoản bác sĩ (mặc định: 123456)..."
                required
                className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-blue-600 bg-white"
              />
              <span className="text-[10px] text-slate-400 italic block">
                * Nhập mật khẩu tài khoản bác sĩ của bạn (hoặc 123456 trong môi trường thử nghiệm).
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSigningProgress || !signPassword}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl flex items-center gap-2 cursor-pointer border-none shadow-md disabled:opacity-50"
              >
                {isSigningProgress ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 text-cyan-300" />
                    <span>Xác Nhận Ký Số CA</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* FINISH CONFIRM MODAL */}
      <Modal
        isOpen={isFinishConfirmOpen}
        onClose={() => {
          if (!isFinishingEncounter) setIsFinishConfirmOpen(false);
        }}
        title="Xác Nhận Kết Thúc Lượt Khám"
        subtitle="Hoàn tất phiên khám và gửi phiếu thông tin cho bệnh nhân"
      >
        <div className="space-y-4 text-xs font-semibold">
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-slate-700 space-y-1.5">
            <p className="text-sm font-extrabold text-slate-900">
              Bạn có chắc chắn muốn kết thúc lượt khám của bệnh nhân{' '}
              <span className="text-blue-700">{currentPatient?.name || 'hiện tại'}</span>?
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sau khi xác nhận, hệ thống sẽ chuyển trạng thái lượt khám sang hoàn tất, tự động gửi phiếu thông tin lượt khám qua Zalo (nếu bệnh nhân đã liên kết) và email hướng dẫn cổng bệnh nhân (nếu chưa có tài khoản).
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFinishConfirmOpen(false)}
              disabled={isFinishingEncounter}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmFinishEncounter}
              disabled={isFinishingEncounter}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl cursor-pointer border-none flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isFinishingEncounter ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              <span>{isFinishingEncounter ? 'Đang xử lý...' : 'Xác Nhận Kết Thúc'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* COMPLETION MODAL WITH NEXT PATIENT CALL */}
      <Modal
        isOpen={Boolean(completionModal?.isOpen)}
        onClose={() => setCompletionModal(null)}
        title="Hoàn Tất Ca Khám Thành Công"
        subtitle="Hồ sơ đơn thuốc & bệnh án điện tử đã được số hóa an toàn"
      >
        <div className="py-4 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-extrabold text-slate-900">
              {completionModal?.message || 'Ca khám đã hoàn tất!'}
            </h4>
            <p className="text-xs text-slate-500">
              Đơn thuốc và lịch hẹn đã được lưu vào hệ thống EMR. Bạn có thể in đơn hoặc chuyển sang ca khám tiếp theo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <button
              type="button"
              onClick={handlePrintPrescription}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              <span>In đơn thuốc</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs"
            >
              <Download className="w-4 h-4 text-cyan-300" />
              <span>Tải PDF bệnh án</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCompletionModal(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleNextPatient}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer border-none shadow-md"
            >
              <span>Gọi khám ca tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
