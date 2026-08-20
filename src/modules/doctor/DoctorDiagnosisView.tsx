import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, CheckCircle2, XCircle, Sparkles, Clock, FileText, 
  Clipboard, BookOpen, AlertCircle, ArrowRight, User
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { BorderBeam } from '../../components/ui/border-beam';

/* 
 * DESIGN READ:
 * Component Kind: Post-Lab Diagnosis & Patient Consultation panel (Mô-đun 8)
 * Audience: Doctors finalizing official diagnoses.
 * Vibe: Premium clinical EMR workspace, displaying EMR history timelines, 
 *       AI-generated diagnostic reasoning panels, and interactive ICD-10 search engines.
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
      reasoning: 'Cơn đau thắt ngực trái điển hình lan sau vai kết hợp nhịp tim nhanh 95 bpm và biến đổi sóng T dẹt trên điện tâm đồ hướng tới bệnh lý mạch vành nhẹ trên nền tăng huyết áp.',
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
    allergies: 'Dị ứng aspirin gây kích ứng dạ dày',
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

const ICD10_CATALOG = [
  { code: 'J18.1', name: 'Viêm phổi thùy, không xác định' },
  { code: 'J20.9', name: 'Viêm phế quản cấp, không xác định' },
  { code: 'I25.9', name: 'Bệnh tim thiếu máu cục bộ mạn tính, không xác định' },
  { code: 'I10', name: 'Tăng huyết áp vô căn (nguyên phát)' },
  { code: 'K29.5', name: 'Viêm dạ dày mạn tính, không xác định' },
  { code: 'K25.9', name: 'Loét dạ dày: cấp tính không có xuất huyết hoặc thủng' },
  { code: 'E11.9', name: 'Đái tháo đường typ 2 không có biến chứng' },
  { code: 'J45.9', name: 'Hen phế quan, không xác định' }
];

export const DoctorDiagnosisView: React.FC = () => {
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

  const [icd10Search, setIcd10Search] = useState('');
  const [selectedIcd, setSelectedIcd] = useState({ code: 'J18.1', name: 'Viêm phổi thùy, không xác định' });
  const [aiDecision, setAiDecision] = useState<'ACCEPT' | 'REJECT'>('ACCEPT');
  const [rejectReason, setRejectReason] = useState('');
  
  // Consultation form states
  const [expNote, setExpNote] = useState('');
  const [planNote, setPlanNote] = useState('');
  const [lifeNote, setLifeNote] = useState('');
  
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);

  // Active Patient Details
  const currentPatient = useMemo(() => {
    return mockPatientsDiagnosisData[selectedPatientId] || mockPatientsDiagnosisData['BN-2026-088'];
  }, [selectedPatientId]);

  // Synchronize advice & default ICD recommendation when active patient changes
  useEffect(() => {
    setExpNote(currentPatient.defaultAdvice.explanation);
    setPlanNote(currentPatient.defaultAdvice.plan);
    setLifeNote(currentPatient.defaultAdvice.lifestyle);
    setSelectedIcd({
      code: currentPatient.aiSuggestedIcd.code,
      name: currentPatient.aiSuggestedIcd.name
    });
    setAiDecision('ACCEPT');
    setRejectReason('');
    setIcd10Search('');
    setIsSubmitSuccess(false);
  }, [currentPatient]);

  // Search filtered ICD-10 list
  const filteredIcdList = useMemo(() => {
    if (!icd10Search) return [];
    const query = icd10Search.toLowerCase();
    return ICD10_CATALOG.filter(
      item => item.code.toLowerCase().includes(query) || item.name.toLowerCase().includes(query)
    );
  }, [icd10Search]);

  const handleSelectIcd = (item: { code: string; name: string }) => {
    setSelectedIcd(item);
    setIcd10Search('');
  };

  const handleSaveDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitSuccess(true);
    setTimeout(() => {
      setIsSubmitSuccess(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 animate-in fade-in duration-200">
      
      {/* Module Title Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Mô-đun 8: Chẩn đoán hậu xét nghiệm & Tư vấn điều trị
            </span>
            <Badge variant="ai" size="sm">
              ICD-10 Standardized
            </Badge>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Kết luận Chẩn đoán Lâm sàng & Lập Hồ sơ Tư vấn
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp timeline y khoa, phê duyệt đề xuất từ mô-đun AI tổng hợp, chọn mã bệnh quốc tế ICD-10 và hoàn tất ghi chú tư vấn điều trị.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2 text-xs font-extrabold text-indigo-950">
          <User className="w-4 h-4 text-indigo-600" />
          <span>Bệnh nhân đang khám: {currentPatient.name} ({currentPatient.id})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Patient Queue & EMR Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Patient Selector */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Danh sách bệnh nhân hậu xét nghiệm</h3>
            
            <div className="grid grid-cols-1 gap-2">
              {Object.values(mockPatientsDiagnosisData).map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPatientId(p.id)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex justify-between items-center ${
                    selectedPatientId === p.id
                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300'
                      : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold text-slate-800">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{p.id}</div>
                  </div>
                  <Badge variant="normal" size="sm">Đã có kết quả Lab</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* EMR Timeline View */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700 animate-pulse" />
              <span>Tiến trình bệnh án điện tử (EMR Timeline)</span>
            </h3>

            <div className="relative pl-6 border-l-2 border-slate-200 space-y-5 text-xs">
              {/* Node 1: Check-in */}
              <div className="relative">
                <span className="w-3.5 h-3.5 bg-blue-600 rounded-full absolute -left-[32px] top-0.5 ring-4 ring-blue-100 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                </span>
                <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wide">08:15 AM — Tiếp nhận (Mô-đun 3)</span>
                <span className="font-extrabold text-slate-800">Hoàn tất thủ tục tiếp nhận, xác minh thông tin bảo hiểm y tế.</span>
              </div>

              {/* Node 2: Nurse vitals */}
              <div className="relative">
                <span className="w-3.5 h-3.5 bg-emerald-600 rounded-full absolute -left-[32px] top-0.5 ring-4 ring-emerald-100 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                </span>
                <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wide">08:25 AM — Khám sinh hiệu (Mô-đun 4)</span>
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-800">
                    Chỉ số sinh hiệu: HA {currentPatient.vitals.bp}, Mạch {currentPatient.vitals.hr} bpm, SpO2 {currentPatient.vitals.spo2}%, Sốt {currentPatient.vitals.temp}°C.
                  </p>
                  <p className="text-slate-500 italic">Triệu chứng: {currentPatient.symptoms}</p>
                </div>
              </div>

              {/* Node 3: Initial Doctor consultation */}
              <div className="relative">
                <span className="w-3.5 h-3.5 bg-purple-600 rounded-full absolute -left-[32px] top-0.5 ring-4 ring-purple-100 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                </span>
                <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wide">08:45 AM — Khám sơ bộ (Mô-đun 5)</span>
                <p className="font-extrabold text-slate-800">
                  Khám lâm sàng: {currentPatient.clinicalExam}
                </p>
              </div>

              {/* Node 4: Lab Test result */}
              <div className="relative">
                <span className="w-3.5 h-3.5 bg-amber-500 rounded-full absolute -left-[32px] top-0.5 ring-4 ring-amber-100 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                </span>
                <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wide">09:10 AM — Xét nghiệm phòng Lab (Mô-đun 7)</span>
                <div className="space-y-1.5">
                  <p className="font-extrabold text-slate-800">
                    Kết quả cận lâm sàng: {currentPatient.labResult}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] text-slate-600 font-mono">
                    <FileText className="w-3.5 h-3.5 text-blue-700" />
                    <span>Đính kèm: {currentPatient.attachedFile}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right column: AI recommendations, Decision inputs and ICD10 lookup (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* AI diagnosis recommendations with details */}
          <BorderBeam size="md" colorVariant="colorful">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-indigo-500/30 shadow-xl shadow-indigo-950/40 p-6 rounded-3xl text-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Mô-đun AI — Phân tích dữ liệu & Đề xuất chẩn đoán gợi ý
                  </h3>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-bold">
                  Mức tin cậy: {currentPatient.aiSuggestedIcd.confidence}
                </span>
              </div>

              <div className="p-4 bg-indigo-950/40 border border-indigo-900/50 rounded-2xl space-y-2">
                <span className="text-[10px] font-extrabold text-indigo-300 uppercase block tracking-wider">Mã bệnh lý AI đề xuất:</span>
                <div className="text-sm font-extrabold text-white">
                  <span className="bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded font-mono mr-2 border border-indigo-800">
                    {currentPatient.aiSuggestedIcd.code}
                  </span>
                  {currentPatient.aiSuggestedIcd.name}
                </div>
                
                <div className="text-xs text-slate-200 leading-relaxed font-semibold pt-1.5 border-t border-indigo-950/80">
                  <strong>Lập luận giải trình của AI:</strong> {currentPatient.aiSuggestedIcd.reasoning}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex justify-between items-center pt-2 border-t border-indigo-950/80">
                <span><strong>Tài liệu tham chiếu y khoa:</strong> {currentPatient.aiSuggestedIcd.references}</span>
                <span className="font-extrabold text-cyan-400 text-[9px] uppercase tracking-wider">AI03 Synthesis Model</span>
              </div>
            </div>
          </BorderBeam>

          {/* Form container: doctor official diagnosis & advice */}
          <form onSubmit={handleSaveDiagnosis} className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Clipboard className="w-4 h-4 text-blue-700" />
              <span>Kết luận chuyên môn & Phác đồ điều trị tư vấn</span>
            </h3>

            {/* Doctor Decision: Accept or Reject AI proposal */}
            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-slate-700">Quyết định phê duyệt đề xuất từ AI (*):</label>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAiDecision('ACCEPT');
                    setSelectedIcd({
                      code: currentPatient.aiSuggestedIcd.code,
                      name: currentPatient.aiSuggestedIcd.name
                    });
                  }}
                  className={`flex-1 p-3.5 rounded-2xl border font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    aiDecision === 'ACCEPT' 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-300 shadow-xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Đồng ý & Chấp nhận gợi ý AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAiDecision('REJECT')}
                  className={`flex-1 p-3.5 rounded-2xl border font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    aiDecision === 'REJECT' 
                      ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-300 shadow-xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="w-4.5 h-4.5 text-rose-600" />
                  <span>Phủ quyết gợi ý AI (Nhập chẩn đoán khác)</span>
                </button>
              </div>

              {aiDecision === 'REJECT' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                  <label className="block text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4.5 h-4.5 text-rose-600" />
                    <span>Lý do phủ quyết chẩn đoán AI (*):</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="vd: Triệu chứng thực thể vùng phổi nghe rale khác biệt, phim X-quang có mờ nhẹ phế quản nhưng sinh hiệu SpO2 đã hồi phục ổn định..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full p-3 rounded-xl border border-rose-200 text-xs font-bold text-slate-800 outline-none focus:border-rose-500 focus:bg-white bg-white/70"
                  />
                </div>
              )}
            </div>

            {/* ICD-10 Search & Official Disease selection */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700">Mã bệnh lý chính thức chuẩn hóa ICD-10 (*):</label>
              
              <div className="relative">
                <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nhập mã bệnh ICD-10 hoặc tên bệnh lý (Ví dụ: J18, Viêm phổi)..."
                  value={icd10Search}
                  onChange={(e) => setIcd10Search(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              {/* Search dropdown overlay matches */}
              {icd10Search && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto shadow-lg text-xs font-bold divide-y divide-slate-100 z-10 relative animate-in fade-in duration-100">
                  {filteredIcdList.length > 0 ? (
                    filteredIcdList.map((item) => (
                      <div
                        key={item.code}
                        onClick={() => handleSelectIcd(item)}
                        className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-slate-700"
                      >
                        <div>
                          <span className="font-mono bg-blue-50 text-blue-900 border border-blue-150 px-2 py-0.5 rounded mr-2">
                            {item.code}
                          </span>
                          <span>{item.name}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))
                  ) : (
                    <div className="p-3.5 text-center text-slate-400 font-medium">Không tìm thấy mã bệnh khớp từ khóa.</div>
                  )}
                </div>
              )}

              {/* Selected Official ICD code indicator card */}
              <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
                <div className="flex items-center">
                  <BookOpen className="w-4.5 h-4.5 text-blue-700 mr-2 shrink-0" />
                  <div>
                    <span className="font-mono bg-blue-700 text-white px-2 py-0.5 rounded text-[11px] mr-2">
                      {selectedIcd.code}
                    </span>
                    <span>{selectedIcd.name}</span>
                  </div>
                </div>
                <Badge variant="normal" size="sm">Mã bệnh chính thức</Badge>
              </div>
            </div>

            {/* Treatment Consultation Section */}
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                < Clipboard className="w-4 h-4 text-blue-700" />
                <span>Nội dung tư vấn điều trị cho bệnh nhân</span>
              </h4>

              {/* Input: Condition explanation */}
              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-slate-700">1. Giải thích tình trạng bệnh lý:</label>
                <textarea
                  rows={2}
                  required
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  placeholder="Ghi giải thích cụ thể cho bệnh nhân hiểu..."
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-blue-600 text-xs text-slate-800"
                />
              </div>

              {/* Input: Plan details */}
              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-slate-700">2. Phương án điều trị đề xuất:</label>
                <textarea
                  rows={2}
                  required
                  value={planNote}
                  onChange={(e) => setPlanNote(e.target.value)}
                  placeholder="Ghi phương án uống thuốc hoặc phác đồ cụ thể..."
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-blue-600 text-xs text-slate-800"
                />
              </div>

              {/* Input: Lifestyle and Diet */}
              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-slate-700">3. Chế độ sinh hoạt & Dinh dưỡng phù hợp:</label>
                <textarea
                  rows={2}
                  required
                  value={lifeNote}
                  onChange={(e) => setLifeNote(e.target.value)}
                  placeholder="Lời dặn ăn uống nghỉ ngơi tại nhà..."
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-blue-600 text-xs text-slate-800"
                />
              </div>
            </div>

            {/* Success feedback toast */}
            {isSubmitSuccess && (
              <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 bg-emerald-50 p-3 rounded-xl border border-emerald-100 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Đã lưu chẩn đoán ICD-10 và hồ sơ tư vấn điều trị thành công! Chuyển thông tin tự động sang kê đơn thuốc (Mô-đun 9).</span>
              </div>
            )}

            {/* Submit buttons */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none flex items-center gap-2 uppercase tracking-wide"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu chẩn đoán & Chuyển kê đơn (Mô-đun 9)</span>
              </button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
};
