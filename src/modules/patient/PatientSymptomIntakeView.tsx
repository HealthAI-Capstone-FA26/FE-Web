// FR-HM-2.3 — Khai báo triệu chứng ban đầu
// Actor: Bệnh nhân
// Trạng thái: Mock UI (chưa nối API)
// TODO: liên kết dữ liệu thật với FR-HM-3.4 khi module 3 hoàn thiện

import React, { useState } from 'react';
import { Activity, Plus, Send, CheckCircle2, Clock, Frown } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

const COMMON_SYMPTOMS = [
  'Đau đầu / Chóng mặt',
  'Sốt cao / Rét run',
  'Ho khan / Khó thở',
  'Đau ngực / Hồi hộp',
  'Đau bụng / Nôn mửa',
  'Mệt mỏi / Uể oải',
  'Đau khớp / Đau lưng',
  'Rối loạn tiêu hóa'
];

export const PatientSymptomIntakeView: React.FC = () => {
  const [chiefComplaint, setChiefComplaint] = useState('Đau đầu âm ỉ kéo dài 2 ngày nay kèm sốt nhẹ về chiều.');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Đau đầu / Chóng mặt', 'Sốt cao / Rét run']);
  const [customSymptom, setCustomSymptom] = useState('');
  const [painLevel, setPainLevel] = useState<number>(6);
  const [onsetTime, setOnsetTime] = useState<string>('2 ngày trước');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleSymptom = (item: string) => {
    if (selectedSymptoms.includes(item)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== item));
    } else {
      setSelectedSymptoms([...selectedSymptoms, item]);
    }
  };

  const handleAddCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Khai Báo Triệu Chứng Ban Đầu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mô tả tình trạng sức khỏe hiện tại giúp bác sĩ tổng hợp thông tin EMR trước khi vào phòng khám.
          </p>
        </div>
        <Badge variant="ai" size="sm">
          FR-HM-2.3
        </Badge>
      </div>

      {isSubmitted && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Khai báo triệu chứng ban đầu đã gửi thành công tới bác sĩ phụ trách!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Activity className="w-5 h-5 text-blue-700" />
          <h3 className="font-bold text-base text-slate-900">Thông Tin Khám & Triệu Chứng Ban Đầu</h3>
        </div>

        {/* Lý do khám */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Lý do chính đi khám bệnh *</label>
          <textarea
            rows={3}
            required
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            placeholder="VD: Đau đầu, sốt nhẹ, mệt mỏi khó ngủ vài ngày nay..."
          />
        </div>

        {/* Chọn nhanh triệu chứng */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Chọn nhanh các triệu chứng bạn đang gặp phải:</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map((item) => {
              const isSelected = selectedSymptoms.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleSymptom(item)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isSelected ? `✓ ${item}` : `+ ${item}`}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Thêm triệu chứng khác nếu không có ở trên..."
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSymptom(); } }}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
            <button
              type="button"
              onClick={handleAddCustomSymptom}
              className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition-colors flex items-center gap-1 cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm</span>
            </button>
          </div>
        </div>

        {/* Mức độ khó chịu (1-10 Slider) */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Frown className={`w-5 h-5 ${painLevel >= 7 ? 'text-rose-600' : painLevel >= 4 ? 'text-amber-600' : 'text-emerald-600'}`} />
              <label className="text-xs font-bold text-slate-800">Mức độ đau / khó chịu cảm nhận:</label>
            </div>
            <span className={`text-sm font-black px-3 py-0.5 rounded-full border ${
              painLevel >= 7 ? 'bg-rose-100 text-rose-800 border-rose-200' : painLevel >= 4 ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}>
              {painLevel} / 10 {painLevel >= 7 ? '(Đau nhiều / Gấp)' : painLevel >= 4 ? '(Đau vừa)' : '(Đau nhẹ)'}
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={10}
            value={painLevel}
            onChange={(e) => setPainLevel(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
            <span>1 - Nhẹ nhàng</span>
            <span>5 - Vừa phải</span>
            <span>10 - Rất đau / Cấp cứu</span>
          </div>
        </div>

        {/* Thời gian khởi phát */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian bắt đầu xuất hiện triệu chứng</label>
          <div className="relative">
            <input
              type="text"
              value={onsetTime}
              onChange={(e) => setOnsetTime(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              placeholder="VD: Từ đêm qua, khoảng 3 ngày trước..."
            />
            <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-md border-none"
          >
            <Send className="w-4 h-4" />
            <span>Gửi Khai Báo Triệu Chứng</span>
          </button>
        </div>
      </form>
    </div>
  );
};
