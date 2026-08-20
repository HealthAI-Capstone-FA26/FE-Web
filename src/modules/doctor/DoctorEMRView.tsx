import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, CheckCircle2, AlertTriangle, FileText, User,
  Activity, Heart, Thermometer, ShieldAlert, CheckSquare, Square,
  Clock, CreditCard, FlaskConical, Play
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { BorderBeam } from '../../components/ui/border-beam';

/* 
 * DESIGN READ:
 * Component Kind: Doctor Consultation & EMR view module (Mô-đun 5)
 * Audience: Doctors conducting clinical exams.
 * Vibe: Premium medical AI clinical assistant, displaying detailed EMR,
 *       interactive X-ray simulator with red-highlighted abnormal region overlays,
 *       and dynamic suggested lab orders matching the doctor's written diagnosis.
 *       AI02 is locked until payment and lab completion are simulated.
 */

interface VisitHistoryItem {
  date: string;
  diagnose: string;
  doctor: string;
}

interface PatientEMR {
  id: string;
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
  vitals: {
    bp: string;
    hr: number;
    spo2: number;
    temp: number;
  };
  aiSummary: string;
  aiSourceRef: string;
  aiProposedDiag: string;
  aiConfidence: string;
  initialClinicalNote: string;
  initialDoctorDiag: string;
}

const mockPatientsEMR: Record<string, PatientEMR> = {
  'BN-2026-088': {
    id: 'BN-2026-088',
    name: 'Khưu Trọng Quân',
    age: 21,
    gender: 'Nam',
    dob: '2005-05-15',
    phone: '0902 357 872',
    cccd: '079085001234',
    bhyt: 'GD479085001234',
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
    aiSummary: 'Bệnh nhân nam 21 tuổi, có tiền sử dị ứng kháng sinh nhóm Penicillin và hen phế quản thời thơ ấu. Ghi nhận triệu chứng ho khan liên tục trong 4 ngày gần nhất, kèm theo sốt nhẹ 38.2°C và tức nhẹ lồng ngực trái khi hô hấp sâu. Các chỉ số sinh hiệu ổn định ngoại trừ nhiệt độ tăng nhẹ và SpO2 cận biên.',
    aiSourceRef: 'Sinh hiệu Điều dưỡng (Mô-đun 4) + Triệu chứng Khai báo tại Quầy (Mô-đun 3)',
    aiProposedDiag: 'Viêm Phế Quản Cấp (ICD-10: J20.9) / Theo dõi Viêm phổi thùy dưới trái',
    aiConfidence: '92.5%',
    initialClinicalNote: 'Lồng ngực cân đối, di động theo nhịp thở. Phổi trái nghe rì rào phế nang giảm nhẹ ở đáy phổi, có ít rale ẩm rải rác thùy dưới trái. Họng hơi đỏ nhẹ, không giả mạc.',
    initialDoctorDiag: 'Viêm phế quản cấp / Theo dõi viêm phổi thùy dưới trái'
  },
  'BN-2026-089': {
    id: 'BN-2026-089',
    name: 'Nguyễn Thị Thu Hà',
    age: 45,
    gender: 'Nữ',
    dob: '1981-11-20',
    phone: '0976 558 338',
    cccd: '079085002345',
    bhyt: 'GD479085002345',
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
    aiSummary: 'Bệnh nhân nữ 45 tuổi, tiền sử tăng huyết áp đang điều trị thuốc hàng ngày. Nhập viện vì cơn đau thắt ngực vùng trước tim lan ra sau vai trái xuất hiện khi nghỉ ngơi, kèm nhịp tim nhanh 95 nhịp/phút, khó thở nhẹ, huyết áp tăng nhẹ lúc tiếp nhận.',
    aiSourceRef: 'Tiền sử bệnh án điện tử EMR + Chỉ số điện tâm đồ sơ bộ lúc nhận bệnh',
    aiProposedDiag: 'Thiếu Máu Cơ Tim Cục Bộ (ICD-10: I25.9) / Theo dõi cơn đau thắt ngực ổn định',
    aiConfidence: '89.4%',
    initialClinicalNote: 'Tim nhịp đều nhanh, tiếng tim T1, T2 rõ, không nghe tiếng thổi bệnh lý. Phổi rì rào phế nang êm dịu, không rale. Bụng mềm, không đau tức.',
    initialDoctorDiag: 'Thiếu máu cơ tim cục bộ / Tăng huyết áp vô căn'
  },
  'BN-2026-090': {
    id: 'BN-2026-090',
    name: 'Phạm Minh Đức',
    age: 62,
    gender: 'Nam',
    dob: '1964-04-12',
    phone: '0906 339 886',
    cccd: '079085003456',
    bhyt: 'GD479085003456',
    bloodType: 'B+',
    allergies: 'Dị ứng aspirin gây kích ứng dạ dày',
    history: 'Viêm loét dạ dày tá tràng tái phát nhiều lần, xơ vữa động mạch nhẹ',
    symptoms: 'Đau dữ dội vùng thượng vị lan ra sau lưng sau bữa ăn nhiều dầu mỡ, kèm buồn nôn nhiều lần',
    vitals: {
      bp: '120/80 mmHg',
      hr: 78,
      spo2: 99,
      temp: 37.0
    },
    aiSummary: 'Bệnh nhân nam 62 tuổi, tiền sử viêm dạ dày tá tràng. Đau bụng dữ dội vùng trên rốn lan ra sau lưng kèm buồn nôn. Chỉ số huyết động ổn định, không sốt, không có dấu hiệu suy hô hấp.',
    aiSourceRef: 'Khai báo triệu chứng lâm sàng cấp cứu + Lịch sử đơn thuốc dạ dày năm 2025',
    aiProposedDiag: 'Viêm Dạ Dày Tá Tràng Cấp (ICD-10: K29.5) / Theo dõi Viêm tụy cấp',
    aiConfidence: '91.2%',
    initialClinicalNote: 'Bụng mềm, ấn đau tức chói vùng thượng vị và hạ sườn trái, không có phản ứng thành bụng, cảm ứng phúc mạc âm tính. Nhu động ruột bình thường.',
    initialDoctorDiag: 'Viêm dạ dày tá tràng cấp tính'
  }
};

export const DoctorEMRView: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    return localStorage.getItem('doctor_selected_patient_id') || 'BN-2026-088';
  });

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
  const [patientWorkflowStates, setPatientWorkflowStates] = useState<Record<string, 'initial' | 'ordered' | 'completed'>>({
    'BN-2026-088': 'initial',
    'BN-2026-089': 'initial',
    'BN-2026-090': 'completed' // This patient has completed testing already!
  });

  // Active Patient EMR Data
  const currentPatient = useMemo(() => {
    return mockPatientsEMR[selectedPatientId] || mockPatientsEMR['BN-2026-088'];
  }, [selectedPatientId]);

  // Form States
  const [clinicalExamNote, setClinicalExamNote] = useState('');
  const [preliminaryDiag, setPreliminaryDiag] = useState('');
  const [selectedLabOrders, setSelectedLabOrders] = useState<string[]>([]);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);

  useEffect(() => {
    setClinicalExamNote(currentPatient.initialClinicalNote);
    setPreliminaryDiag(currentPatient.initialDoctorDiag);
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
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Mô-đun 5: Khám sơ bộ, EMR & Tích hợp AI (Doctor EMR)
            </span>
            <Badge variant="ai" size="sm">
              AI01 & AI02 Ready
            </Badge>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Khám bệnh, Chẩn đoán sơ bộ & Chỉ định xét nghiệm
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem hồ sơ bệnh án EMR, tóm tắt AI có tham chiếu nguồn dữ liệu, chẩn đoán đề xuất từ X-quang nhấp nháy khoanh vùng bất thường, và chỉ định xét nghiệm gợi ý.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2 text-xs font-extrabold text-indigo-950">
          <User className="w-4 h-4 text-indigo-600" />
          <span>Bệnh nhân đang khám: {currentPatient.name} ({currentPatient.id})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Patient EMR & AI Panel (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-6">

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
                  <p><strong className="text-slate-700">Họ tên:</strong> {currentPatient.name}</p>
                  <p><strong className="text-slate-700">Tuổi/Giới:</strong> {currentPatient.age} tuổi ({currentPatient.gender})</p>
                  <p><strong className="text-slate-700">Ngày sinh:</strong> {currentPatient.dob}</p>
                  <p><strong className="text-slate-700">Nhóm máu:</strong> {currentPatient.bloodType}</p>
                </div>
              </div>

              {/* Clinical History & Allergies */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tiền sử & Dị ứng</span>
                <div className="space-y-1">
                  <p className="text-rose-600 font-bold"><strong className="text-slate-700">Dị ứng:</strong> {currentPatient.allergies}</p>
                  <p><strong className="text-slate-700">Tiền sử bệnh:</strong> {currentPatient.history}</p>
                  <p><strong className="text-slate-700">Triệu chứng khai báo:</strong> {currentPatient.symptoms}</p>
                </div>
              </div>

              {/* Vitals */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">Chỉ số Sinh hiệu lúc đón tiếp</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold leading-none">HA</span>
                      <span className="font-mono">{currentPatient.vitals.bp}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold leading-none">Nhịp tim</span>
                      <span className="font-mono">{currentPatient.vitals.hr} bpm</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold leading-none">SpO2</span>
                      <span className="font-mono">{currentPatient.vitals.spo2}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Thermometer className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold leading-none">Nhiệt độ</span>
                      <span className={`font-mono ${currentPatient.vitals.temp >= 38 ? 'text-rose-600' : 'text-slate-800'}`}>{currentPatient.vitals.temp}°C</span>
                    </div>
                  </div>
                </div>
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
                    {selectedPatientId === 'BN-2026-088' && (
                      <div className="absolute bottom-10 left-12 w-14 h-14 border-2 border-dashed border-rose-500 bg-rose-500/10 rounded-full animate-ping duration-1000 flex items-center justify-center">
                        <span className="text-[8px] bg-rose-600 text-white font-extrabold px-1 py-0.5 rounded leading-none shrink-0 pointer-events-none">AI02 (92%)</span>
                      </div>
                    )}

                    {selectedPatientId === 'BN-2026-088' && (
                      <div className="absolute bottom-10 left-12 w-14 h-14 border-2 border-rose-600 bg-rose-500/20 rounded-full flex items-center justify-center cursor-help" title="Vùng bất thường: Vùng mờ thâm nhiễm thùy dưới phổi trái">
                        <span className="text-[7px] text-white font-extrabold uppercase font-sans tracking-wide">Vùng mờ</span>
                      </div>
                    )}

                    {selectedPatientId === 'BN-2026-089' && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-dashed border-amber-500 bg-amber-500/15 rounded-full animate-pulse flex items-center justify-center">
                        <span className="text-[8px] bg-amber-600 text-white font-extrabold px-1 rounded">Rối loạn nhịp</span>
                      </div>
                    )}

                    {selectedPatientId === 'BN-2026-090' && (
                      <div className="absolute bottom-12 right-16 w-16 h-12 border-2 border-dashed border-rose-500 bg-rose-500/15 rounded-full animate-pulse flex items-center justify-center">
                        <span className="text-[8px] bg-rose-600 text-white font-extrabold px-1 rounded">Dạ dày (Loét)</span>
                      </div>
                    )}

                    <span className="text-[9px] text-slate-400 font-bold text-center mt-2 z-10">
                      {selectedPatientId === 'BN-2026-088'
                        ? 'Phát hiện vùng mờ thâm nhiễm phế nang (Thùy dưới phổi trái)'
                        : selectedPatientId === 'BN-2026-089'
                          ? 'AI phân tích nhịp tim: Khoảng QT kéo dài nhẹ'
                          : 'AI phân tích ổ bụng: Dấu hiệu viêm niêm mạc môn vị'}
                    </span>
                  </div>

                  {/* AI Proposed Diagnosis & Confidence Score details */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="p-4 bg-indigo-950/40 border border-indigo-900/50 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-indigo-300 block uppercase tracking-wide">Chẩn đoán đề xuất từ AI:</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">
                          Confidence Score: {currentPatient.aiConfidence}
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-white">
                        {currentPatient.aiProposedDiag}
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

        </div>

        {/* Right Column: Patient Queue (1 column) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Hàng chờ Khám của Bác sĩ</h3>
              <Badge variant="info" size="sm">03 Bệnh nhân</Badge>
            </div>

            <div className="space-y-2.5">
              {Object.values(mockPatientsEMR).map((p) => {
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
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
