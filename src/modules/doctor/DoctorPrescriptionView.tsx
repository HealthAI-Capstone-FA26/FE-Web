import React, { useState, useEffect, useMemo } from 'react';
import { 
  Pill, CheckCircle2, AlertTriangle, FileCheck, Printer, 
  Download, Calendar, User, Search, Plus, Trash2, ShieldAlert, 
  Award, Check
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { BorderBeam } from '../../components/ui/border-beam';

/* 
 * DESIGN READ:
 * Component Kind: Electronic Prescription & Digital Signing module (Mô-đun 9)
 * Audience: Doctors prescribing medications and signing checkup reports.
 * Vibe: Premium clinical workstation layout with live drug-safety checks (allergies, interactions, duplications),
 *       interactive National Drug Directory lookup, follow-up calendar sync, and digital CA signature workflow.
 */

interface PatientEMRDetail {
  id: string;
  name: string;
  age: number;
  gender: 'Nam' | 'Nữ';
  dob: string;
  bloodType: string;
  allergies: string;
  history: string;
  symptoms: string;
  vitals: {
    bp: string;
    hr: number;
    spo2: number;
    temp: number;
  };
  clinicalExam: string;
  labResult: string;
  attachedFile: string;
  aiSuggestedIcd: {
    code: string;
    name: string;
    confidence: string;
    reasoning: string;
    references: string;
  };
  defaultAdvice: {
    explanation: string;
    plan: string;
    lifestyle: string;
  };
}

const mockPatientsDiagnosisData: Record<string, PatientEMRDetail> = {
  'BN-2026-088': {
    id: 'BN-2026-088',
    name: 'Khưu Trọng Quân',
    age: 21,
    gender: 'Nam',
    dob: '2005-05-15',
    bloodType: 'O+',
    allergies: 'Dị ứng kháng sinh Penicillin, bụi phấn hoa',
    history: 'Tiền sử hen phế quản nhẹ thời thơ ấu (đã ổn định)',
    symptoms: 'Ho khan kéo dài 4 ngày, kèm sốt nhẹ, cảm giác tức ngực trái khi hít thở sâu',
    vitals: {
      bp: '122/82 mmHg',
      hr: 88,
      spo2: 96,
      temp: 38.2
    },
    clinicalExam: 'Lồng ngực cân đối. Phổi trái nghe rì rào phế nang giảm nhẹ ở đáy phổi, có ít rale ẩm rải rác thùy dưới trái. Họng hơi đỏ nhẹ.',
    labResult: 'Chụp X-quang phổi thẳng (Digital Chest X-Ray): Hình ảnh mờ thâm nhiễm đông đặc khu trú nhu mô phổi thùy dưới trái. Chỉ số Bạch cầu WBC: 12.5 K/uL (tăng nhẹ).',
    attachedFile: 'Chest_XRay_Digital.png',
    aiSuggestedIcd: {
      code: 'J18.1',
      name: 'Viêm phổi thùy, không xác định',
      confidence: '94.8%',
      reasoning: 'Vùng đông đặc nhu mô đáy phổi trái trên X-quang kết hợp sốt 38.2°C, bạch cầu tăng nhẹ và SpO2 giảm nhẹ (96%) là dấu hiệu điển hình của viêm phổi thùy cấp tính.',
      references: 'Bệnh học Nội khoa Lồng ngực + Phân tích hình ảnh AI02 ROI Chest'
    },
    defaultAdvice: {
      explanation: 'Viêm thùy dưới phổi trái mức độ nhẹ, cần dùng kháng sinh điều trị và theo dõi sát chỉ số hô hấp SpO2 tại nhà.',
      plan: 'Điều trị ngoại trú kháng sinh nhóm Macrolide (Clarithromycin 500mg) do dị ứng kháng sinh nhóm Penicillin. Hạ sốt bằng Paracetamol 500mg khi sốt > 38.5°C.',
      lifestyle: 'Nghỉ ngơi hoàn toàn tại giường, ăn cháo súp ấm dễ tiêu, uống nhiều nước ấm (2.5L/ngày) để loãng đờm, hạn chế nằm phòng máy lạnh quá lạnh.'
    }
  },
  'BN-2026-089': {
    id: 'BN-2026-089',
    name: 'Nguyễn Thị Thu Hà',
    age: 45,
    gender: 'Nữ',
    dob: '1981-11-20',
    bloodType: 'A+',
    allergies: 'Chưa ghi nhận dị ứng',
    history: 'Tăng huyết áp vô căn phát hiện 3 năm nay, uống thuốc Amlodipine 5mg hàng ngày',
    symptoms: 'Đau tức vùng ngực trái lan ra bả vai trái, cảm giác hồi hộp đánh trống ngực khó thở nhẹ',
    vitals: {
      bp: '135/85 mmHg',
      hr: 95,
      spo2: 98,
      temp: 36.8
    },
    clinicalExam: 'Tim nhịp đều nhanh 95 l/p, tiếng tim T1, T2 rõ, không nghe âm thổi bệnh lý. Phổi trong, không rale.',
    labResult: 'Điện tâm đồ (ECG 12 cực): Nhịp xoang nhanh 95 l/p, có sóng T dẹt ở các chuyển đạo trước tim V5, V6 hướng tới thiếu máu cơ tim dưới nội tâm mạc.',
    attachedFile: 'ECG_12Leads_Report.pdf',
    aiSuggestedIcd: {
      code: 'I25.9',
      name: 'Bệnh tim thiếu máu cục bộ mạn tính, không xác định',
      confidence: '89.4%',
      reasoning: 'Cơn đau thắt ngực trái điển hình lan sau vai kết hợp nhịp tim nhanh 95 bpm và biến đổi sóng T dẹt trên điện tâm đồ hướng tới bệnh lý mạch vành mạch máu nhỏ trên nền tăng huyết áp.',
      references: 'Khuyến cáo Hội Tim mạch học Quốc gia về Hội chứng mạch vành mạn 2024'
    },
    defaultAdvice: {
      explanation: 'Thiếu máu cơ tim cục bộ nhẹ do hẹp nhẹ mạch vành kết hợp huyết áp chưa được kiểm soát tối ưu tại nhà.',
      plan: 'Bổ sung thuốc chống ngưng tập tiểu cầu (Aspirin 81mg) phối hợp điều trị ổn định huyết áp và hạ mỡ máu (Atorvastatin 10mg).',
      lifestyle: 'Hạn chế vận động gắng sức đột ngột, giữ tinh thần thoải mái, ăn giảm muối (ăn nhạt), kiêng thực phẩm giàu cholesterol (lòng đỏ trứng, nội tạng động vật).'
    }
  },
  'BN-2026-090': {
    id: 'BN-2026-090',
    name: 'Phạm Minh Đức',
    age: 62,
    gender: 'Nam',
    dob: '1964-04-12',
    bloodType: 'B+',
    allergies: 'Dị ứng aspirin gây kích ứng dạ dày cấp',
    history: 'Viêm loét dạ dày tá tràng tái phát nhiều lần, xơ vữa động mạch nhẹ',
    symptoms: 'Đau dữ dội vùng thượng vị lan ra sau lưng sau bữa ăn nhiều dầu mỡ, kèm buồn nôn nhiều lần',
    vitals: {
      bp: '120/80 mmHg',
      hr: 78,
      spo2: 99,
      temp: 37.0
    },
    clinicalExam: 'Bụng mềm, ấn đau tức chói vùng thượng vị và hạ sườn trái, phản ứng thành bụng âm tính.',
    labResult: 'Nội soi dạ dày tá tràng gây mê: Niêm mạc hang vị dạ dày xung huyết đỏ, có vài ổ loét trợt nông kích thước nhỏ 2-3mm, bờ mềm mại không xuất huyết hoạt động.',
    attachedFile: 'Gastro_Endoscopy_Images.png',
    aiSuggestedIcd: {
      code: 'K29.5',
      name: 'Viêm dạ dày mạn tính, không xác định',
      confidence: '91.2%',
      reasoning: 'Hình ảnh nội soi niêm mạc hang vị dạ dày xung huyết trợt nhẹ khẳng định tình trạng viêm dạ dày cấp tính/đợt cấp viêm dạ dày mạn tính sau ăn thức ăn nhiều dầu mỡ.',
      references: 'Tiêu chuẩn chẩn đoán nội soi dạ dày tá tràng - Hiệp hội Tiêu hóa Việt Nam'
    },
    defaultAdvice: {
      explanation: 'Viêm trợt hang vị dạ dày cấp tính do kích ứng thức ăn hoặc stress làm tăng tiết acid dịch vị.',
      plan: 'Sử dụng thuốc ức chế bơm proton PPI (Esomeprazole 40mg uống trước ăn sáng 30 phút) kết hợp thuốc bao niêm mạc dạ dày (Sucralfate). Ngừng sử dụng Aspirin.',
      lifestyle: 'Ăn chín uống sôi, dùng thức ăn lỏng dễ tiêu, chia nhỏ 5-6 bữa ăn/ngày, tránh ăn quá no hoặc để bụng quá đói. Tuyệt đối kiêng chua, cay, bia rượu, cà phê.'
    }
  }
};

// National Drug Directory
interface DrugCatalogItem {
  code: string;
  name: string;
  class: string;
  unit: string;
  defaultDosage: string;
  defaultRoute: string;
  defaultQty: number;
  activeIngredient: string;
}

const NATIONAL_DRUG_DIRECTORY: DrugCatalogItem[] = [
  {
    code: 'DRUG-001',
    name: 'Amoxicillin 500mg',
    class: 'Penicillin Antibiotic',
    unit: 'Viên',
    defaultDosage: 'Uống 1 viên x 3 lần/ngày',
    defaultRoute: 'Uống',
    defaultQty: 21,
    activeIngredient: 'Penicillin'
  },
  {
    code: 'DRUG-002',
    name: 'Clarithromycin 500mg',
    class: 'Macrolide Antibiotic',
    unit: 'Viên',
    defaultDosage: 'Uống 1 viên x 2 lần/ngày sau khi ăn',
    defaultRoute: 'Uống',
    defaultQty: 14,
    activeIngredient: 'Clarithromycin'
  },
  {
    code: 'DRUG-003',
    name: 'Paracetamol 500mg',
    class: 'Analgesic / Antipyretic',
    unit: 'Viên',
    defaultDosage: 'Uống 1 viên khi đau đầu hoặc sốt > 38.5°C (tối đa 4 viên/ngày)',
    defaultRoute: 'Uống',
    defaultQty: 10,
    activeIngredient: 'Paracetamol'
  },
  {
    code: 'DRUG-004',
    name: 'Ibuprofen 400mg',
    class: 'NSAID (Kháng viêm không Steroid)',
    unit: 'Viên',
    defaultDosage: 'Uống 1 viên x 2 lần/ngày sau khi ăn no',
    defaultRoute: 'Uống',
    defaultQty: 10,
    activeIngredient: 'NSAID / Aspirin class'
  },
  {
    code: 'DRUG-005',
    name: 'Aspirin 81mg',
    class: 'Antiplatelet (Kháng kết tập tiểu cầu)',
    unit: 'Viên',
    defaultDosage: 'Uống 1 viên vào buổi sáng sau ăn no',
    defaultRoute: 'Uống',
    defaultQty: 30,
    activeIngredient: 'NSAID / Aspirin class'
  },
  {
    code: 'DRUG-006',
    name: 'Esomeprazole 40mg',
    class: 'Proton Pump Inhibitor (PPI)',
    unit: 'Viên',
    defaultDosage: 'Uống 1 viên trước ăn sáng 30 phút',
    defaultRoute: 'Uống',
    defaultQty: 14,
    activeIngredient: 'Esomeprazole'
  },
  {
    code: 'DRUG-007',
    name: 'Sucralfate 1g',
    class: 'Gastric Mucosal Protectant',
    unit: 'Gói',
    defaultDosage: 'Hòa tan uống 1 gói x 3 lần/ngày trước ăn 1 tiếng hoặc trước khi đi ngủ',
    defaultRoute: 'Uống',
    defaultQty: 20,
    activeIngredient: 'Sucralfate'
  },
  {
    code: 'DRUG-008',
    name: 'Atorvastatin 10mg',
    class: 'Statin (Hạ lipid máu)',
    unit: 'Viên',
    defaultDosage: 'Uống 1 viên tối trước khi đi ngủ',
    defaultRoute: 'Uống',
    defaultQty: 30,
    activeIngredient: 'Atorvastatin'
  },
  {
    code: 'DRUG-009',
    name: 'Amlodipine 5mg',
    class: 'Antihypertensive (Hạ huyết áp)',
    unit: 'Viên',
    defaultDosage: 'Uống 1 viên sáng ngủ dậy',
    defaultRoute: 'Uống',
    defaultQty: 30,
    activeIngredient: 'Amlodipine'
  },
  {
    code: 'DRUG-010',
    name: 'Loratadine 10mg',
    class: 'Antihistamine (Chống dị ứng)',
    unit: 'Viên',
    defaultDosage: 'Uống 1 viên tối sau ăn',
    defaultRoute: 'Uống',
    defaultQty: 10,
    activeIngredient: 'Loratadine'
  }
];

interface PrescribedDrugItem {
  catalogCode: string;
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
  // Sync selected patient from localStorage
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    return localStorage.getItem('doctor_selected_patient_id') || 'BN-2026-088';
  });

  const currentPatient = useMemo(() => {
    return mockPatientsDiagnosisData[selectedPatientId] || mockPatientsDiagnosisData['BN-2026-088'];
  }, [selectedPatientId]);

  // Selected drug state in form
  const [selectedCatalogCode, setSelectedCatalogCode] = useState<string>(NATIONAL_DRUG_DIRECTORY[2].code);
  const [customDosage, setCustomDosage] = useState<string>(NATIONAL_DRUG_DIRECTORY[2].defaultDosage);
  const [customQty, setCustomQty] = useState<number>(NATIONAL_DRUG_DIRECTORY[2].defaultQty);
  const [customRoute, setCustomRoute] = useState<string>(NATIONAL_DRUG_DIRECTORY[2].defaultRoute);
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

  // Sync initial drug selection when dropdown code changes
  const activeDirectoryItem = useMemo(() => {
    return NATIONAL_DRUG_DIRECTORY.find(item => item.code === selectedCatalogCode) || NATIONAL_DRUG_DIRECTORY[0];
  }, [selectedCatalogCode]);

  useEffect(() => {
    if (activeDirectoryItem) {
      setCustomDosage(activeDirectoryItem.defaultDosage);
      setCustomQty(activeDirectoryItem.defaultQty);
      setCustomRoute(activeDirectoryItem.defaultRoute);
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

    // Auto-populate default medications based on AI proposed plans
    if (selectedPatientId === 'BN-2026-088') {
      setPrescribedList([
        {
          catalogCode: 'DRUG-002',
          name: 'Clarithromycin 500mg',
          class: 'Macrolide Antibiotic',
          dosage: 'Uống 1 viên x 2 lần/ngày sau khi ăn',
          unit: 'Viên',
          quantity: 14,
          route: 'Uống',
          duration: '7 ngày',
          advice: 'Kháng sinh uống đúng giờ. Tránh xa các sản phẩm sữa khi uống.'
        },
        {
          catalogCode: 'DRUG-003',
          name: 'Paracetamol 500mg',
          class: 'Analgesic / Antipyretic',
          dosage: 'Uống 1 viên khi sốt trên 38.5°C hoặc đau ngực nhiều',
          unit: 'Viên',
          quantity: 10,
          route: 'Uống',
          duration: 'Khi cần',
          advice: 'Cách nhau tối thiểu 4-6 tiếng.'
        }
      ]);
    } else if (selectedPatientId === 'BN-2026-089') {
      setPrescribedList([
        {
          catalogCode: 'DRUG-005',
          name: 'Aspirin 81mg',
          class: 'Antiplatelet (Kháng kết tập tiểu cầu)',
          dosage: 'Uống 1 viên vào buổi sáng sau ăn no',
          unit: 'Viên',
          quantity: 30,
          route: 'Uống',
          duration: '30 ngày',
          advice: 'Không bẻ vụn hoặc nhai nát viên thuốc giải phóng chậm.'
        },
        {
          catalogCode: 'DRUG-009',
          name: 'Amlodipine 5mg',
          class: 'Antihypertensive (Hạ huyết áp)',
          dosage: 'Uống 1 viên sáng ngủ dậy',
          unit: 'Viên',
          quantity: 30,
          route: 'Uống',
          duration: '30 ngày',
          advice: 'Đo huyết áp hàng ngày.'
        }
      ]);
    } else if (selectedPatientId === 'BN-2026-090') {
      setPrescribedList([
        {
          catalogCode: 'DRUG-006',
          name: 'Esomeprazole 40mg',
          class: 'Proton Pump Inhibitor (PPI)',
          dosage: 'Uống 1 viên trước ăn sáng 30 phút',
          unit: 'Viên',
          quantity: 14,
          route: 'Uống',
          duration: '14 ngày',
          advice: 'Uống lúc bụng đói.'
        },
        {
          catalogCode: 'DRUG-007',
          name: 'Sucralfate 1g',
          class: 'Gastric Mucosal Protectant',
          dosage: 'Hòa tan uống 1 gói x 3 lần/ngày trước ăn 1 tiếng',
          unit: 'Gói',
          quantity: 20,
          route: 'Uống',
          duration: '7 ngày',
          advice: 'Khuấy đều với nước trước khi uống.'
        }
      ]);
    }
  }, [selectedPatientId]);

  // Handle select patient
  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    localStorage.setItem('doctor_selected_patient_id', id);
  };

  // Add drug action
  const handleAddDrug = (e: React.FormEvent) => {
    e.preventDefault();
    if (prescribedList.some(item => item.catalogCode === selectedCatalogCode)) {
      alert('Thuốc này đã tồn tại trong đơn thuốc!');
      return;
    }
    const newDrug: PrescribedDrugItem = {
      catalogCode: selectedCatalogCode,
      name: activeDirectoryItem.name,
      class: activeDirectoryItem.class,
      dosage: customDosage,
      unit: activeDirectoryItem.unit,
      quantity: customQty,
      route: customRoute,
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
      // 1. Allergies & Contraindications Checks
      if (selectedPatientId === 'BN-2026-088') {
        if (drug.catalogCode === 'DRUG-001') {
          warnings.push({
            type: 'danger',
            text: `Chống chỉ định nghiêm trọng: Bệnh nhân Khưu Trọng Quân có tiền sử dị ứng kháng sinh nhóm Penicillin. Nguy cơ sốc phản vệ khi dùng Amoxicillin!`
          });
        }
      }
      if (selectedPatientId === 'BN-2026-090') {
        if (drug.catalogCode === 'DRUG-005' || drug.catalogCode === 'DRUG-004') {
          warnings.push({
            type: 'danger',
            text: `Cảnh báo lâm sàng: Bệnh nhân Phạm Minh Đức có tiền sử dị ứng kích ứng dạ dày cấp với Aspirin/NSAID. Tránh kê đơn Aspirin 81mg hoặc Ibuprofen 400mg khi đang loét hang vị.`
          });
        }
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
  }, [prescribedList, selectedPatientId]);

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
      
      {/* Header card banner */}
      <BorderBeam size="md" colorVariant="colorful">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-indigo-500/30 shadow-xl shadow-indigo-950/40 p-6 rounded-3xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-cyan-400/30">
                Mô-đun 9: Kê đơn thuốc điện tử & Ký số
              </span>
              <Badge variant="ai" size="sm">
                Safety Check Active
              </Badge>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Pill className="w-5 h-5 text-cyan-400" />
              <span>Hệ Thống Lập Đơn Thuốc Quốc Gia & CA Digital Signature</span>
            </h2>
            <p className="text-xs text-slate-300">
              Tự động kiểm tra chéo tương tác gốc thuốc, kiểm soát tiền sử dị ứng và xác thực ký số chứng thư pháp lý của Bác sĩ.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/50 border border-indigo-900 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-200">
            <User className="w-4 h-4 text-cyan-400" />
            <span>Bác sĩ kê đơn: <strong className="text-white">BS. CKII. Nguyễn Quang Huy</strong></span>
          </div>
        </div>
      </BorderBeam>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Patient selector and allergy record (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Patient queue card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Bệnh nhân đang chờ đơn thuốc</h3>
            
            <div className="grid grid-cols-1 gap-2">
              {Object.values(mockPatientsDiagnosisData).map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPatient(p.id)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex justify-between items-center ${
                    selectedPatientId === p.id
                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300'
                      : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold text-slate-800">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{p.id}</div>
                  </div>
                  <Badge variant={selectedPatientId === p.id ? 'ai' : 'normal'} size="sm">
                    ICD-10: {p.aiSuggestedIcd.code}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Patient clinical details & allergy warning */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Thông tin lâm sàng & Dị ứng
            </h3>

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
                    Mã bệnh: <span className="font-mono bg-blue-700 text-white px-1.5 py-0.5 rounded text-[10px]">{currentPatient.aiSuggestedIcd.code}</span>
                  </div>
                  <div className="text-slate-800 leading-snug">
                    Tên bệnh: {currentPatient.aiSuggestedIcd.name}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-150 rounded-xl space-y-1 font-semibold text-slate-700">
                <span className="text-[9px] font-extrabold uppercase text-blue-800 block tracking-wider">Tiền sử bệnh án:</span>
                <p className="leading-snug text-slate-600">{currentPatient.history}</p>
              </div>
            </div>
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
              
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">1. Chọn thuốc kê đơn (*):</label>
                <select
                  value={selectedCatalogCode}
                  onChange={(e) => setSelectedCatalogCode(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-extrabold text-slate-800 outline-none focus:border-blue-600 bg-white"
                >
                  {NATIONAL_DRUG_DIRECTORY.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name} ({item.class})
                    </option>
                  ))}
                </select>
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
                    {activeDirectoryItem.unit}
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
                className={`px-4 py-2 text-xs font-extrabold rounded-xl border-none cursor-pointer flex items-center gap-1.5 shadow-xs transition-all ${
                  isFollowUpSynced
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
                Đơn thuốc đã được mã hóa pháp lý bằng chữ ký số của <strong className="text-slate-800">BS. Nguyễn Quang Huy</strong> và tự động đồng bộ sang Trang cá nhân bệnh nhân & Nhà thuốc bệnh viện.
              </p>
            </div>

            {/* Simulated Printed medical PDF preview */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-3 font-sans text-slate-700">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-black text-indigo-950 uppercase tracking-wider text-[10px]">Tóm Tắt Hồ Sơ Khám Bệnh EMR (.PDF)</span>
                <span className="font-mono text-[9px] bg-slate-200 px-1.5 py-0.5 rounded">Digital Verified</span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed">
                <div>Bệnh viện Đa khoa Tâm Anh - Phòng khám Nội hô hấp</div>
                <div>Bệnh nhân: <strong className="text-slate-900">{currentPatient.name}</strong> ({currentPatient.gender}, {currentPatient.age} tuổi)</div>
                <div>Chẩn đoán chính: <strong>{currentPatient.aiSuggestedIcd.code} - {currentPatient.aiSuggestedIcd.name}</strong></div>
                <div>Đơn thuốc kê: <strong>{prescribedList.map(d => `${d.name} x ${d.quantity}`).join(', ')}</strong></div>
                {isFollowUpSynced && <div>Hẹn khám lại: <strong>{followUpDate} ({followUpNotes})</strong></div>}
              </div>
              <div className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                <Award className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Ký bởi: BS. CKII. Nguyễn Quang Huy (Bộ Y Tế CA)</span>
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
