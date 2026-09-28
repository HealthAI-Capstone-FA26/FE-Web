import React, { useState, useEffect, useMemo } from 'react';
import {
  Pill, CheckCircle2, AlertTriangle, FileCheck, Printer,
  Download, Calendar, Search, Plus, Trash2, ShieldAlert,
  Award, Check, RefreshCw
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { BorderBeam } from '../../components/ui/border-beam';
import { Mascot } from 'page-mascot';
import { encounterService, type EncounterItem } from '../../services/encounter/encounter.service';
import { caseTimelineService, type CaseTimelineResponse } from '../../services/doctor/case-timeline.service';
import { useAuth } from '../../context/AuthContext';
import { drugCatalogService, type DrugCatalogItem as ApiDrugItem, type DrugCatalogDetail } from '../../services/doctor/drug-catalog.service';

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

export const DoctorPrescriptionView: React.FC = () => {
  const { user } = useAuth();
  // Sync selected patient from localStorage
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    return localStorage.getItem('doctor_selected_patient_id') || '';
  });

  const [apiEncounters, setApiEncounters] = useState<EncounterItem[]>([]);
  const [isLoadingEncounters, setIsLoadingEncounters] = useState(false);
  const [timelineData, setTimelineData] = useState<CaseTimelineResponse | null>(null);

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
  const [followUpDate, setFollowUpDate] = useState<string>('2026-08-26');
  const [followUpNotes, setFollowUpNotes] = useState<string>('Tái khám kiểm tra hô hấp, nghe phổi và làm huyết học nếu cần.');
  const [isFollowUpSynced, setIsFollowUpSynced] = useState<boolean>(false);

  // CA Signing modal state
  const [isDigitalSignModalOpen, setIsDigitalSignModalOpen] = useState(false);
  const [isSigningProgress, setIsSigningProgress] = useState(false);
  const [isSignedSuccess, setIsSignedSuccess] = useState(false);

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
    return () => { isMounted = false; };
  }, [drugSearchQuery]);

  // Active selected item from API
  const activeDirectoryItem = useMemo(() => {
    return dbDrugs.find(item => (item.drugCode === selectedCatalogCode || item.drugId === selectedCatalogCode)) || dbDrugs[0];
  }, [dbDrugs, selectedCatalogCode]);

  // Detailed drug info fetched from GET /prescriptions/drug-catalog/:drugId
  const [selectedDrugDetail, setSelectedDrugDetail] = useState<DrugCatalogDetail | null>(null);

  useEffect(() => {
    if (activeDirectoryItem) {
      if (activeDirectoryItem.defaultDosage) setCustomDosage(activeDirectoryItem.defaultDosage);
      if (activeDirectoryItem.defaultRoute) setCustomRoute(activeDirectoryItem.defaultRoute);

      let isMounted = true;
      drugCatalogService.getById(activeDirectoryItem.drugId).then(detail => {
        if (isMounted) setSelectedDrugDetail(detail);
      }).catch(err => {
        console.warn('Không thể lấy chi tiết thuốc từ API getById:', err);
      });
      return () => { isMounted = false; };
    }
  }, [activeDirectoryItem]);

  // Sync selected patient changes from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const persistedId = localStorage.getItem('doctor_selected_patient_id');
      if (persistedId && persistedId !== selectedPatientId) {
        setSelectedPatientId(persistedId);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [selectedPatientId]);

  // Set default drugs based on patient on load
  useEffect(() => {
    setPrescribedList([]);
    setIsFollowUpSynced(false);
    setIsSignedSuccess(false);
  }, [selectedPatientId]);

  // Handle select patient
  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    localStorage.setItem('doctor_selected_patient_id', id);
  };

  // Add drug action
  const handleAddDrug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDirectoryItem) {
      alert('Vui lòng chọn thuốc từ danh mục!');
      return;
    }
    const code = activeDirectoryItem.drugCode || activeDirectoryItem.drugId;
    if (prescribedList.some(item => item.catalogCode === code || item.drugId === activeDirectoryItem.drugId)) {
      alert('Thuốc này đã tồn tại trong đơn thuốc!');
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
      advice: customAdvice
    };
    setPrescribedList([...prescribedList, newDrug]);
  };

  // Delete drug action
  const handleDeleteDrug = (code: string) => {
    setPrescribedList(prescribedList.filter(item => item.catalogCode !== code));
  };

  // Safety checks calculation (Allergies & Duplicate classes)
  const safetyWarnings = useMemo(() => {
    const warnings: { type: 'danger' | 'warning'; text: string }[] = [];

    prescribedList.forEach(drug => {
      // 1. Allergies & Contraindications Checks from real patient allergies
      if (timelineData?.allergies && timelineData.allergies.length > 0) {
        timelineData.allergies.forEach((al) => {
          const allergen = (al.allergenName || '').toLowerCase();
          const dName = (drug.name || '').toLowerCase();
          const dClass = (drug.class || '').toLowerCase();
          if (allergen && (dName.includes(allergen) || dClass.includes(allergen))) {
            warnings.push({
              type: 'danger',
              text: `Cảnh báo dị ứng nghiêm trọng: Bệnh nhân ${currentPatient?.name || ''} có tiền sử dị ứng "${al.allergenName}". Nguy cơ phản ứng phụ khi dùng thuốc "${drug.name}"!`
            });
          }
        });
      }
    });

    // 2. Duplicate active ingredients / drug classes
    const drugClasses = prescribedList.map(d => d.class);
    const duplicates = drugClasses.filter((c, index) => drugClasses.indexOf(c) !== index);
    duplicates.forEach(dupClass => {
      warnings.push({
        type: 'warning',
        text: `Cảnh báo trùng lặp gốc thuốc: Đơn thuốc chứa nhiều hơn một sản phẩm thuộc nhóm [${dupClass}]. Vui lòng tối giản hóa đơn.`
      });
    });

    // 3. Drug-Drug Interactions
    const hasAspirin = prescribedList.some(d => d.catalogCode === 'DRUG-005');
    const hasIbuprofen = prescribedList.some(d => d.catalogCode === 'DRUG-004');
    if (hasAspirin && hasIbuprofen) {
      warnings.push({
        type: 'danger',
        text: `Tương tác thuốc nghiêm trọng: Sử dụng kết hợp Aspirin và Ibuprofen làm tăng mạnh nguy cơ loét dạ dày xuất huyết và làm giảm hiệu lực kháng tiểu cầu của Aspirin.`
      });
    }

    return warnings;
  }, [prescribedList, timelineData, currentPatient]);

  // Sync follow-up schedule
  const handleSyncFollowUp = () => {
    setIsFollowUpSynced(true);
    setTimeout(() => {
      alert(`Đã tự động đồng bộ lịch hẹn tái khám ngày ${followUpDate} vào lịch trình cá nhân của bệnh nhân & Kích hoạt chuỗi tin nhắc SMS/Zalo hẹn giờ tự động.`);
    }, 100);
  };

  // Digital CA Signing handler
  const handleTriggerDigitalSign = () => {
    setIsDigitalSignModalOpen(true);
    setIsSigningProgress(true);
    setIsSignedSuccess(false);

    // Simulate CA cert verification and signing
    setTimeout(() => {
      setIsSigningProgress(false);
      setIsSignedSuccess(true);
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mascot
            directions="/mascots/mydoctor-directions.png"
            reactions="/mascots/mydoctor-reactions.png"
            size={120}
            className="shrink-0"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Kê Đơn Thuốc & Ký Số Điện Tử
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lập đơn thuốc điện tử, tự động kiểm tra tương tác thuốc, cảnh báo dị ứng và ký số pháp lý.
            </p>
          </div>
        </div>
        <Badge variant="ai" size="sm">
          CA Digital Signature
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Patient selector and allergy record (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Patient queue card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Bệnh nhân đang chờ đơn thuốc</h3>
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

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
              {isLoadingEncounters && (
                <div className="p-4 text-center text-xs text-slate-400">Đang tải danh sách ca khám...</div>
              )}

              {!isLoadingEncounters && apiEncounters.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Chưa có ca khám nào trong hàng đợi
                </div>
              )}

              {apiEncounters.map((enc) => {
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
                    <Badge variant={isSelected ? 'ai' : 'normal'} size="sm">
                      {enc.department?.departmentName || 'Ca khám'}
                    </Badge>
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

          {/* Drug Safety Checks Alerts */}
          {safetyWarnings.length > 0 ? (
            <div className="space-y-2">
              {safetyWarnings.map((w, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-200 ${w.type === 'danger'
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
              ))}
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between font-bold shadow-xs">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 bg-emerald-600 text-white rounded-full p-0.5 shrink-0" />
                <span>Kiểm tra an toàn (Safety Check): Không phát hiện tương tác hoặc chống chỉ định dị ứng.</span>
              </div>
              <Badge variant="normal" size="sm">Safety Passed</Badge>
            </div>
          )}

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
                    {((selectedDrugDetail.interactionsA && selectedDrugDetail.interactionsA.length > 0) || (selectedDrugDetail.interactionsB && selectedDrugDetail.interactionsB.length > 0)) && (
                      <div className="text-amber-800 font-extrabold flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Có ghi nhận tương tác thuốc trong CSDL hệ thống</span>
                      </div>
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
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Vào Đơn Thuốc</span>
                </button>
              </div>

            </form>
          </div>

          {/* Current Prescription Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Pill className="w-4 h-4 text-indigo-700" />
                <span>Nội Dung Đơn Thuốc Hiện Tại (Chuẩn Hóa ICD-10)</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">{prescribedList.length} thuốc đã kê</span>
            </div>

            {prescribedList.length > 0 ? (
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
                            onClick={() => handleDeleteDrug(d.catalogCode)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer border-none bg-transparent"
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

          {/* Follow-up Appointment Selector */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Calendar className="w-4.5 h-4.5 text-blue-700" />
              <span>Thiết Lập Lịch Hẹn Tái Khám (Đồng Bộ Patient Portal)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-bold">
              <div className="md:col-span-4 space-y-1">
                <label className="block text-slate-700">Chọn ngày tái khám:</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-850 outline-none focus:border-blue-600"
                />
              </div>

              <div className="md:col-span-8 space-y-1">
                <label className="block text-slate-700">Nội dung / Yêu cầu tái khám:</label>
                <input
                  type="text"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Nhập nội dung nhắc nhở khi đến tái khám..."
                  className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-850 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-slate-400 font-bold italic">
                * Chuỗi tin nhắn SMS tự động sẽ tự động gửi nhắc lịch bệnh nhân trước ngày khám 1 ngày.
              </span>
              <button
                type="button"
                onClick={handleSyncFollowUp}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl border-none cursor-pointer flex items-center gap-1.5 shadow-xs transition-all ${isFollowUpSynced
                  ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
              >
                {isFollowUpSynced ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Đã Đồng Bộ Lịch Trình</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>Xác Nhận & Đồng Bộ Lịch Hẹn</span>
                  </>
                )}
              </button>
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

              <button
                onClick={handleTriggerDigitalSign}
                disabled={prescribedList.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none flex items-center gap-2 shrink-0 transition-all uppercase tracking-wide"
              >
                <FileCheck className="w-4.5 h-4.5 text-cyan-300" />
                <span>Ký Số Bác Sĩ & Đóng Đơn</span>
              </button>
            </div>
          </BorderBeam>

        </div>

      </div>

      {/* Digital Signature execution CA verify Modal */}
      <Modal
        isOpen={isDigitalSignModalOpen}
        onClose={() => { if (!isSigningProgress) setIsDigitalSignModalOpen(false); }}
        title="Xác Thực Ký Số Pháp Lý Bác Sĩ (CA Digital Signature)"
        subtitle="Chứng thư số: BS. CKII. Nguyễn Quang Huy (Bộ Y Tế CA)"
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
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Verifying CA Certificate Credentials...</h4>
              <p className="text-xs text-slate-500 font-medium">Đang tiến hành mã hóa bất đối xứng khóa bí mật (Private Key) để ký số đơn thuốc.</p>
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
                Đơn thuốc đã được mã hóa pháp lý bằng chữ ký số của <strong className="text-slate-800">{user?.name || 'Bác sĩ điều trị'}</strong> và tự động đồng bộ sang Trang cá nhân bệnh nhân & Nhà thuốc bệnh viện.
              </p>
            </div>

            {/* Simulated Printed medical PDF preview */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-3 font-sans text-slate-700">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-black text-indigo-950 uppercase tracking-wider text-[10px]">Tóm Tắt Hồ Sơ Khám Bệnh EMR (.PDF)</span>
                <span className="font-mono text-[9px] bg-slate-200 px-1.5 py-0.5 rounded">Digital Verified</span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed">
                <div>{user?.department ? `Khoa / Phòng: ${user.department}` : 'Phòng khám Chuyên khoa'}</div>
                <div>Bệnh nhân: <strong className="text-slate-900">{currentPatient?.name || 'Bệnh nhân'}</strong> ({currentPatient?.gender || '--'}, {currentPatient?.age || '--'} tuổi)</div>
                <div>Chẩn đoán chính: <strong>{currentPatient?.aiSuggestedIcd?.code || currentPatient?.icd10Code || 'R69'} - {currentPatient?.aiSuggestedIcd?.name || currentPatient?.diagnosis || 'Chưa có chẩn đoán'}</strong></div>
                <div>Đơn thuốc kê: <strong>{prescribedList.map(d => `${d.name} x ${d.quantity}`).join(', ') || 'Chưa có thuốc'}</strong></div>
                {isFollowUpSynced && <div>Hẹn khám lại: <strong>{followUpDate} ({followUpNotes})</strong></div>}
              </div>
              <div className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                <Award className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Ký bởi: {user?.name || 'Bác sĩ điều trị'} {user?.staffCode ? `(Mã BS: ${user.staffCode})` : '(Bộ Y Tế CA)'}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => alert('Đang in đơn thuốc kết nối máy in...')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs"
              >
                <Printer className="w-4 h-4 text-cyan-300" />
                <span>In Đơn Thuốc</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Tải tập tin EMR_Prescription_Report.pdf thành công.');
                }}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs"
              >
                <Download className="w-4 h-4 text-cyan-300" />
                <span>Tải Hồ Sơ Y Tế (.PDF)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs font-semibold">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-800 block">Thông tin chứng thư chữ ký số (CA):</span>
              <div className="space-y-1 text-slate-600">
                <div>Bác sĩ ký: <strong className="text-slate-800">BS. CKII. Nguyễn Quang Huy</strong></div>
                <div>Mã chứng thư: <strong className="font-mono text-blue-900">CA-HEALTH-2026-8899</strong></div>
                <div>Thời gian ký: <strong className="text-slate-800">19/08/2026 12:45 PM</strong></div>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
