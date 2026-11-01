import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Pill, CheckCircle2, AlertTriangle, FileCheck, Printer,
  Download, Calendar, Search, Plus, Trash2, ShieldAlert,
  Award, Check, RefreshCw, User, X, Loader2, Save,
  CheckCircle, ArrowRight, Clock, FileText, CheckCheck,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { BorderBeam } from '../../components/ui/border-beam';
import { Mascot } from 'page-mascot';
import { encounterService, type EncounterItem } from '../../services/encounter/encounter.service';
import { caseTimelineService, type CaseTimelineResponse } from '../../services/doctor/case-timeline.service';
import { useAuth } from '../../context/AuthContext';
import { drugCatalogService, type DrugCatalogItem as ApiDrugItem, type DrugCatalogDetail } from '../../services/doctor/drug-catalog.service';
import {
  prescriptionService,
  type PrescriptionDetail,
  type PrescriptionSafetyAlert,
} from '../../services/prescription';
import { postTestConsultationService } from '../../services/doctor/post-test-consultation.service';
import { initialDiagnosisService } from '../../services/doctor/initial-diagnosis.service';
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
}

export const DoctorPrescriptionView: React.FC<DoctorPrescriptionViewProps> = ({ onNavigateTab }) => {
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

  // Sync selected patient from localStorage
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    return localStorage.getItem('doctor_selected_patient_id') || '';
  });

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
  const [backendAlerts, setBackendAlerts] = useState<PrescriptionSafetyAlert[]>([]);
  const [finalDiagnosisId, setFinalDiagnosisId] = useState<string | null>(null);

  // Override Alert Modal state
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedAlertToOverride, setSelectedAlertToOverride] = useState<PrescriptionSafetyAlert | null>(null);
  const [overrideReasonText, setOverrideReasonText] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

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

  // Tải danh sách ca khám thực tế
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
      ? timelineData.allergies.map((a) => a.allergenName).join(', ')
      : 'Chưa ghi nhận dị ứng';

    const history = timelineData?.medicalHistories?.length
      ? timelineData.medicalHistories.map((h) => h.conditionName).join(', ')
      : 'Chưa ghi nhận tiền sử';

    const diagEvent = timelineData?.timeline?.find((t) => t.type === 'diagnosis');
    const icd10Code = diagEvent?.data?.icd10?.icd10Code || diagEvent?.data?.icd10Code || 'R69';
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
      setBackendAlerts([]);
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
          setBackendAlerts(detail.safetyAlerts || []);

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

          // Check follow-up suggestion
          try {
            const sug = await prescriptionService.getFollowupSuggestion(detail.prescriptionId);
            if (isMounted && sug?.suggestedDate) {
              setFollowUpDate(sug.suggestedDate);
            }
          } catch {}

          // Check if follow-up appointment exists
          try {
            const followup = await prescriptionService.getFollowup(detail.prescriptionId);
            if (isMounted && followup) {
              setIsFollowUpSynced(true);
              if (followup.appointmentDate) {
                setFollowUpDate(new Date(followup.appointmentDate).toISOString().slice(0, 10));
              }
              if (followup.reasonForVisit) {
                setFollowUpNotes(followup.reasonForVisit);
              }
            }
          } catch {
            if (isMounted) setIsFollowUpSynced(false);
          }
        } else {
          // No prescription yet
          setCurrentPrescription(null);
          setPrescribedList([]);
          setBackendAlerts([]);
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

  // Client preview warnings
  const clientSafetyWarnings = useMemo(() => {
    const warnings: { type: 'danger' | 'warning'; text: string }[] = [];

    prescribedList.forEach((drug) => {
      if (timelineData?.allergies && timelineData.allergies.length > 0) {
        timelineData.allergies.forEach((al) => {
          const allergen = (al.allergenName || '').toLowerCase();
          const dName = (drug.name || '').toLowerCase();
          const dClass = (drug.class || '').toLowerCase();
          if (allergen && (dName.includes(allergen) || dClass.includes(allergen))) {
            warnings.push({
              type: 'danger',
              text: `Cảnh báo dị ứng: Bệnh nhân có tiền sử dị ứng "${al.allergenName}". Nguy cơ phản ứng khi dùng "${drug.name}"!`,
            });
          }
        });
      }
    });

    const drugClasses = prescribedList.map((d) => d.class);
    const duplicates = drugClasses.filter((c, index) => drugClasses.indexOf(c) !== index);
    duplicates.forEach((dupClass) => {
      warnings.push({
        type: 'warning',
        text: `Cảnh báo trùng lặp nhóm hoạt chất [${dupClass}]. Vui lòng xem xét tối ưu đơn thuốc.`,
      });
    });

    return warnings;
  }, [prescribedList, timelineData]);

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
        // Resolve diagnosis
        let diagId = finalDiagnosisId;
        if (!diagId) {
          try {
            const initDiags = await initialDiagnosisService.getByEncounterId(activeEncounterId);
            if (initDiags && initDiags.length > 0) {
              diagId = initDiags[0].diagnosisId;
              setFinalDiagnosisId(diagId);
            }
          } catch {}
        }

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
            const createdDiag = await initialDiagnosisService.create(activeEncounterId, {
              icd10Code: currentPatient?.icd10Code || 'R69',
              diagnosisName: currentPatient?.diagnosis || 'Chẩn đoán xác định',
              isPrimary: true,
            });
            diagId = createdDiag.diagnosisId;
            setFinalDiagnosisId(diagId);
          } catch (initErr) {
            try {
              const createdFinal = await postTestConsultationService.createDiagnosisConclusion(activeEncounterId, {
                icd10Code: currentPatient?.icd10Code || 'R69',
                diagnosisName: currentPatient?.diagnosis || 'Chẩn đoán xác định',
                isPrimary: true,
              });
              diagId = createdFinal.diagnosisId;
              setFinalDiagnosisId(diagId);
            } catch {}
          }
        }

        if (!diagId) {
          throw new Error('Chưa có chẩn đoán cho ca khám này. Vui lòng xác lập chẩn đoán trước khi kê đơn.');
        }

        updatedPrescription = await prescriptionService.create({
          encounterId: activeEncounterId,
          diagnosisId: diagId,
          items: itemsPayload,
        });
      }

      setCurrentPrescription(updatedPrescription);
      if (updatedPrescription.safetyAlerts) {
        setBackendAlerts(updatedPrescription.safetyAlerts);
      }

      // Refresh follow-up suggestion
      try {
        const sug = await prescriptionService.getFollowupSuggestion(updatedPrescription.prescriptionId);
        if (sug?.suggestedDate) {
          setFollowUpDate(sug.suggestedDate);
        }
      } catch {}

      if (!silent) {
        showToast('success', 'Lưu đơn thuốc (bản nháp) thành công! Hệ thống đã chạy Safety Check.');
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

  // Confirm Alert Override (PATCH /prescriptions/:id/alerts/:alertId/confirm)
  const handleConfirmAlertOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertToOverride || !currentPrescription) return;
    if (!overrideReasonText.trim()) {
      showToast('info', 'Vui lòng nhập lý do giải trình override cảnh báo!');
      return;
    }

    try {
      setIsSubmittingOverride(true);
      const updatedAlert = await prescriptionService.confirmAlert(
        currentPrescription.prescriptionId,
        selectedAlertToOverride.alertId,
        { overrideReason: overrideReasonText.trim() }
      );

      setBackendAlerts((prev) =>
        prev.map((a) => (a.alertId === updatedAlert.alertId ? updatedAlert : a))
      );
      setIsOverrideModalOpen(false);
      setSelectedAlertToOverride(null);
      setOverrideReasonText('');
      showToast('success', 'Đã xác nhận ghi đè cảnh báo an toàn thuốc thành công!');
    } catch (err: any) {
      showToast('error', `Lỗi khi xác nhận override: ${err?.message || 'Thao tác thất bại'}`);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // Open CA Digital Signing Modal
  const handleOpenDigitalSignModal = () => {
    if (prescribedList.length === 0) {
      showToast('info', 'Đơn thuốc chưa có thuốc, không thể ký số!');
      return;
    }

    // Check unconfirmed blocking alerts
    const hasUnconfirmedBlocking = backendAlerts.some(
      (a) => a.status === 'active' && (a.severity === 'severe' || a.severity === 'contraindicated')
    );
    if (hasUnconfirmedBlocking) {
      showToast(
        'error',
        'Đơn thuốc còn cảnh báo an toàn mức độ nặng/chống chỉ định chưa được xác nhận! Vui lòng ấn "Xác nhận Override" và nhập lý do chuyên môn trước khi ký số.'
      );
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

  // Export / Print PDF (GET /prescriptions/:id/export & PATCH /prescriptions/:id/printed)
  const handlePrintPrescription = async () => {
    if (!currentPrescription?.prescriptionId) {
      showToast('info', 'Vui lòng lưu đơn thuốc trước khi in.');
      return;
    }
    try {
      const res = await prescriptionService.exportPdf(currentPrescription.prescriptionId);
      await prescriptionService.markAsPrinted(currentPrescription.prescriptionId);
      if (res?.pdfUrl) {
        window.open(res.pdfUrl, '_blank');
      } else {
        showToast('error', 'Không nhận được tệp PDF để in.');
      }
    } catch (err: any) {
      showToast('error', `Lỗi khi in đơn thuốc: ${err?.message || 'Thao tác thất bại'}`);
    }
  };

  const handleDownloadPdf = async () => {
    if (!currentPrescription?.prescriptionId) {
      showToast('info', 'Vui lòng lưu đơn thuốc trước khi tải.');
      return;
    }
    try {
      const res = await prescriptionService.exportPdf(currentPrescription.prescriptionId);
      if (res?.pdfUrl) {
        window.open(res.pdfUrl, '_blank');
      } else {
        showToast('error', 'Không tìm thấy tệp PDF.');
      }
    } catch (err: any) {
      showToast('error', `Lỗi khi tải PDF đơn thuốc: ${err?.message || 'Thao tác thất bại'}`);
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

  // Finish Encounter Without Follow-up (POST /prescriptions/encounters/:encounterId/finish)
  const handleFinishEncounter = async () => {
    if (!activeEncounterId) return;
    if (!window.confirm('Bạn có chắc chắn muốn kết thúc lượt khám này mà không cần đặt lịch hẹn tái khám?')) {
      return;
    }

    try {
      setIsFinishingEncounter(true);
      await prescriptionService.finishEncounter(activeEncounterId);
      showToast('success', 'Lượt khám đã được kết thúc thành công!');
      fetchEncounters();
      setCompletionModal({
        isOpen: true,
        message: `Đã hoàn tất ca khám cho bệnh nhân ${currentPatient?.name || ''}.`,
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

  // Xác định bước hiện tại trong quy trình kê đơn 4 bước
  const currentStep = useMemo(() => {
    if (isFollowUpSynced || activeEncounter?.status === 'finished') return 4;
    if (isPrescriptionSigned) return 3;
    if (prescribedList.length > 0) return 2;
    return 1;
  }, [isFollowUpSynced, activeEncounter?.status, isPrescriptionSigned, prescribedList.length]);

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
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
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
              Lập đơn thuốc điện tử, tự động kiểm tra tương tác thuốc, xử lý cảnh báo dị ứng và ký số pháp lý CA.
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

        {/* Right Column: Prescription editor, directory selector, safety checks, follow-up, signing (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Stepper Quy trình Kê đơn 4 bước */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { step: 1, title: 'Soạn đơn thuốc', desc: 'Chọn thuốc & liều' },
                { step: 2, title: 'Kiểm tra an toàn', desc: 'Tương tác & Dị ứng' },
                { step: 3, title: 'Ký số CA & In', desc: 'Xác thực pháp lý' },
                { step: 4, title: 'Hẹn tái khám', desc: 'Hoàn tất ca khám' },
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

          {/* Drug Safety Checks Alerts (Combined Backend API Alerts & Client Heuristics) */}
          <div className="space-y-2">
            {backendAlerts.length > 0 ? (
              backendAlerts.map((alert) => {
                const isBlocking = alert.severity === 'severe' || alert.severity === 'contraindicated';
                const isConfirmed = alert.status === 'confirmed';

                return (
                  <div
                    key={alert.alertId}
                    className={`p-4 rounded-2xl border text-xs font-bold flex items-start justify-between gap-3 animate-in slide-in-from-top-2 duration-200 ${
                      isConfirmed
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : isBlocking
                        ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-xs'
                        : 'bg-amber-50 border-amber-200 text-amber-900 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {isConfirmed ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : isBlocking ? (
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1 leading-snug">
                        <div className="flex items-center gap-2">
                          <span
                            className={`uppercase text-[9px] tracking-wider block font-black ${
                              isConfirmed
                                ? 'text-emerald-700'
                                : isBlocking
                                ? 'text-rose-800'
                                : 'text-amber-800'
                            }`}
                          >
                            {alert.alertType === 'drug_allergy'
                              ? 'CẢNH BÁO DỊ ỨNG THUỐC'
                              : alert.alertType === 'drug_interaction'
                              ? 'TƯƠNG TÁC THUỐC'
                              : 'CẢNH BÁO AN TOÀN DƯỢC LÂM SÀNG'}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                              alert.severity === 'contraindicated'
                                ? 'bg-rose-200 text-rose-900'
                                : alert.severity === 'severe'
                                ? 'bg-rose-150 text-rose-850'
                                : 'bg-amber-200 text-amber-900'
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="font-extrabold text-xs">{alert.message}</p>
                        {isConfirmed && alert.overrideReason && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg font-medium mt-1">
                            <strong>Đã xác nhận override:</strong> {alert.overrideReason}
                          </div>
                        )}
                      </div>
                    </div>

                    {!isConfirmed && isBlocking && !isPrescriptionSigned && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAlertToOverride(alert);
                          setOverrideReasonText('');
                          setIsOverrideModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] rounded-xl shrink-0 cursor-pointer border-none shadow-xs transition-colors"
                      >
                        Xác nhận Override
                      </button>
                    )}
                  </div>
                );
              })
            ) : clientSafetyWarnings.length > 0 ? (
              clientSafetyWarnings.map((w, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-200 ${
                    w.type === 'danger'
                      ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-xs'
                      : 'bg-amber-50 border-amber-200 text-amber-900 shadow-xs'
                  }`}
                >
                  {w.type === 'danger' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 leading-snug">
                    <span className="uppercase text-[9px] tracking-wider block font-black text-rose-800">
                      {w.type === 'danger' ? 'HỆ THỐNG CẢNH BÁO NGUY HIỂM' : 'CẢNH BÁO LÂM SÀNG'}
                    </span>
                    <p className="font-extrabold">{w.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between font-bold shadow-xs">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 bg-emerald-600 text-white rounded-full p-0.5 shrink-0" />
                  <span>Kiểm tra an toàn (Safety Check): Không phát hiện tương tác hoặc chống chỉ định dị ứng.</span>
                </div>
                <Badge variant="normal" size="sm">Safety Passed</Badge>
              </div>
            )}
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

              <div className="md:col-span-2 pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isPrescriptionSigned}
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
                    Mã đơn: <strong className="text-blue-900">{currentPrescription.prescriptionCode}</strong> • Trạng thái: {currentPrescription.status}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{prescribedList.length} thuốc đã kê</span>

                {!isPrescriptionSigned && (
                  <button
                    type="button"
                    onClick={() => handleSavePrescription(false)}
                    disabled={isSavingPrescription || prescribedList.length === 0}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs transition-colors"
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
                            disabled={isPrescriptionSigned}
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

          {/* Follow-up Appointment Selector & Finish Encounter panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4.5 h-4.5 text-blue-700" />
                <span>Thiết Lập Lịch Hẹn Tái Khám & Kết Thúc Lượt Khám</span>
              </h3>
              {isFollowUpSynced && (
                <Badge variant="success" size="sm">
                  Đã Có Lịch Tái Khám
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-bold">
              <div className="md:col-span-4 space-y-1">
                <label className="block text-slate-700">Chọn ngày tái khám:</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-850 outline-none focus:border-blue-600 bg-white"
                />
              </div>

              <div className="md:col-span-8 space-y-1">
                <label className="block text-slate-700">Nội dung / Yêu cầu tái khám:</label>
                <input
                  type="text"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Nhập nội dung nhắc nhở khi đến tái khám..."
                  className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-850 outline-none focus:border-blue-600 bg-white"
                />
              </div>

              {/* Chọn ca khám trống của bác sĩ */}
              {followUpDate && (
                <div className="md:col-span-12 space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Khung giờ khám còn trống của Bác sĩ (Slot Picker):</span>
                    </label>
                    {isLoadingSlots && (
                      <span className="text-[10px] text-blue-600 font-semibold animate-pulse">
                        Đang tìm khung giờ trống...
                      </span>
                    )}
                  </div>
                  {availableSlots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availableSlots.map((slot) => {
                        const isSel = selectedSlotId === slot.slotId;
                        return (
                          <button
                            key={slot.slotId}
                            type="button"
                            onClick={() => setSelectedSlotId(slot.slotId)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                              isSel
                                ? 'bg-blue-700 text-white border-blue-700 shadow-xs ring-2 ring-blue-300'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {(slot.slotStartTime || (slot as any).startTime || '').slice(0, 5)} - {(slot.slotEndTime || (slot as any).endTime || '').slice(0, 5)}
                          </button>
                        );
                      })}
                    </div>
                  ) : !isLoadingSlots ? (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium">
                      Không có ca cố định cụ thể trong ngày này. Hệ thống sẽ tự động xếp vào ca khám đầu buổi của Bác sĩ.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
              <span className="text-[10px] text-slate-400 font-bold italic">
                * Đặt lịch tái khám sẽ tự động đóng lượt khám hiện tại (finished) và gửi thông báo nhắc lịch cho bệnh nhân.
              </span>

              <div className="flex items-center gap-2">
                {/* Finish without followup button */}
                <button
                  type="button"
                  onClick={handleFinishEncounter}
                  disabled={isFinishingEncounter || !activeEncounterId}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl border-none cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {isFinishingEncounter ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>Kết thúc ca (Không hẹn)</span>
                </button>

                {/* Schedule follow-up button */}
                <button
                  type="button"
                  onClick={handleScheduleFollowUp}
                  disabled={isSchedulingFollowup || !isPrescriptionSigned}
                  title={!isPrescriptionSigned ? 'Vui lòng ký số đơn thuốc trước khi đặt lịch tái khám' : ''}
                  className={`px-4 py-2 text-xs font-extrabold rounded-xl border-none cursor-pointer flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 ${
                    isFollowUpSynced
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                      : 'bg-blue-700 hover:bg-blue-800 text-white'
                  }`}
                >
                  {isSchedulingFollowup ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : isFollowUpSynced ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Đã Đặt Lịch Tái Khám</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 text-cyan-300" />
                      <span>Đặt Lịch Hẹn Tái Khám</span>
                    </>
                  )}
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
                  disabled={prescribedList.length === 0 || isSavingPrescription}
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

      {/* OVERRIDE ALERT REASON MODAL */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => {
          if (!isSubmittingOverride) setIsOverrideModalOpen(false);
        }}
        title="Xác Nhận Đã Biết Rủi Ro An Toàn Thuốc (Override Alert)"
        subtitle="Giải trình chuyên môn trước khi bỏ qua cảnh báo nghiêm trọng"
      >
        <form onSubmit={handleConfirmAlertOverride} className="space-y-4 text-xs font-semibold">
          {selectedAlertToOverride && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-1">
              <span className="uppercase text-[9px] font-black text-rose-800 tracking-wider block">
                Nội dung cảnh báo an toàn:
              </span>
              <p className="font-extrabold text-xs leading-relaxed">{selectedAlertToOverride.message}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-slate-700 font-bold">
              Lý do Bác sĩ xác nhận override (*):
            </label>
            <textarea
              rows={3}
              value={overrideReasonText}
              onChange={(e) => setOverrideReasonText(e.target.value)}
              placeholder="vd: Đã cân nhắc lợi ích điều trị vượt trội so với nguy cơ; hướng dẫn bệnh nhân theo dõi sát và tái khám ngay nếu có dấu hiệu bất thường..."
              required
              className="w-full p-3 rounded-xl border border-slate-200 font-medium text-slate-800 outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmittingOverride}
              onClick={() => setIsOverrideModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer border-none"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmittingOverride || !overrideReasonText.trim()}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs disabled:opacity-50"
            >
              {isSubmittingOverride ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Xác Nhận Ghi Đè</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

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
