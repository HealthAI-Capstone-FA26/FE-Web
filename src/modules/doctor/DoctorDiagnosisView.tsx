import React, { useState } from 'react';
import { Search, CheckCircle2, XCircle, Sparkles, Clock } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const DoctorDiagnosisView: React.FC = () => {
  const [icd10Search, setIcd10Search] = useState('J20.9');
  const [selectedIcd] = useState({ code: 'J20.9', name: 'Viêm phế quản cấp, không xác định' });
  const [aiDecision, setAiDecision] = useState<'ACCEPT' | 'REJECT'>('ACCEPT');
  const [rejectReason, setRejectReason] = useState('');
  const [consultationNote, setConsultationNote] = useState('Khuyên bệnh nhân nghỉ ngơi, uống đủ nước, đeo khẩu trang khi ra ngoài.');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Mô-đun 8: Chẩn đoán Hậu xét nghiệm & Tư vấn
          </span>
          <Badge variant="ai" size="sm">
            Chuẩn mã quốc tế ICD-10
          </Badge>
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Giao Diện Chẩn Đoán Chính Thức Theo Chuẩn ICD-10 & Phê Duyệt Gợi Ý AI
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Bác sĩ tổng hợp tiến trình bệnh án Timeline, quyết định Chấp nhận / Phủ quyết đề xuất chẩn đoán từ AI và tư vấn điều trị.
        </p>
      </div>

      {/* EMR Timeline View */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-700" />
          <span>Timeline Tiến Trình Bệnh Án Điển Hình</span>
        </h3>

        <div className="relative pl-6 border-l-2 border-blue-200 space-y-4 text-xs">
          <div className="relative">
            <span className="w-3 h-3 bg-blue-600 rounded-full absolute -left-[31px] top-1 ring-4 ring-blue-100"></span>
            <span className="font-bold text-slate-400 block text-[10px]">08:15 AM — Mô-đun 3 (Check-in)</span>
            <span className="font-extrabold text-slate-800">Bệnh nhân tiếp nhận tại quầy, hoàn tất chữ ký điện tử E-Signature</span>
          </div>

          <div className="relative">
            <span className="w-3 h-3 bg-emerald-600 rounded-full absolute -left-[31px] top-1 ring-4 ring-emerald-100"></span>
            <span className="font-bold text-slate-400 block text-[10px]">08:25 AM — Mô-đun 4 (Sinh hiệu)</span>
            <span className="font-extrabold text-slate-800">Đo sinh hiệu: HA 120/80 mmHg, Mạch 88 bpm, Sốt nhẹ 38.2°C, SpO2 96%</span>
          </div>

          <div className="relative">
            <span className="w-3 h-3 bg-purple-600 rounded-full absolute -left-[31px] top-1 ring-4 ring-purple-100"></span>
            <span className="font-bold text-slate-400 block text-[10px]">09:10 AM — Mô-đun 7 (Kết quả Phòng Lab)</span>
            <span className="font-extrabold text-slate-800">X-Quang Ngực: Hình ảnh phế quản xuất tiết nhẹ, không tổn thương đông đặc</span>
          </div>
        </div>
      </div>

      {/* AI Suggestion Decision & ICD-10 Selection */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
        <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Đề xuất Chẩn đoán Tổng hợp từ AI (AI Recommendation)</span>
            </span>
            <Badge variant="ai" size="sm">Confidence: 94.8%</Badge>
          </div>
          <p className="text-xs text-purple-900 font-semibold">
            Dựa trên kết quả X-quang mới nhất và chỉ số sốt 38.2°C, AI đề xuất chẩn đoán: <strong>J20.9 - Viêm phế quản cấp</strong>.
          </p>
        </div>

        {/* Accept or Reject Controls */}
        <div className="space-y-3">
          <label className="block text-xs font-extrabold text-slate-800">Quyết định chuyên môn của Bác sĩ đối với đề xuất AI (*):</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAiDecision('ACCEPT')}
              className={`flex-1 p-3 rounded-2xl border font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                aiDecision === 'ACCEPT' ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-300' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Chấp Nhận Đề Xuất AI</span>
            </button>

            <button
              type="button"
              onClick={() => setAiDecision('REJECT')}
              className={`flex-1 p-3 rounded-2xl border font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                aiDecision === 'REJECT' ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-300' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Phủ Quyết (Reject) Đề Xuất AI</span>
            </button>
          </div>

          {aiDecision === 'REJECT' && (
            <div className="space-y-1.5 p-3 bg-rose-50 rounded-2xl border border-rose-200 animate-in fade-in">
              <label className="block text-xs font-bold text-rose-900">Nhập lý do Phủ quyết đề xuất AI (*):</label>
              <input
                type="text"
                placeholder="vd: Bệnh nhân có dấu hiệu lâm sàng khác với kết quả AI khoanh vùng..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-rose-300 text-xs font-bold text-slate-800 outline-none"
              />
            </div>
          )}
        </div>

        {/* ICD-10 Search & Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-slate-800">Tra cứu & Chọn Mã bệnh ICD-10 Chính thức (*):</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập mã bệnh ICD-10 hoặc tên bệnh..."
              value={icd10Search}
              onChange={(e) => setIcd10Search(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-mono font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-xs mr-2">{selectedIcd.code}</span>
              <span className="font-bold text-slate-800">{selectedIcd.name}</span>
            </div>
            <Badge variant="normal" size="sm">Mã chuẩn ICD-10</Badge>
          </div>
        </div>

        {/* Consultation Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-extrabold text-slate-800">Lời dặn & Ghi chú Tư vấn Điều trị:</label>
          <textarea
            rows={3}
            value={consultationNote}
            onChange={(e) => setConsultationNote(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Lưu Chẩn Đoán ICD-10 & Chuyển Sang Kê Đơn Thuốc (Mô-đun 9)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
