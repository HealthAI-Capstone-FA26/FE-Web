// FR-HM-2.3 — Tiếp nhận triệu chứng ban đầu (Lễ tân)
// Actor: Nhân viên tiếp nhận (Reception)
// Trạng thái: Mock UI (chưa nối API)
// TODO: liên kết dữ liệu thật với FR-HM-3.4 khi module 3 hoàn thiện

import React, { useState } from 'react';
import { Activity, Search, Save, CheckCircle2, User } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const ReceptionSymptomIntakeView: React.FC = () => {
  const [patientSearch, setPatientSearch] = useState('P-90234');
  const patientName = 'Khưu Trọng Quân';
  const [chiefComplaint, setChiefComplaint] = useState('Đau ngực nhẹ khi vận động nhiều, kèm ho khan về đêm.');
  const [symptoms, setSymptoms] = useState<string[]>(['Đau ngực / Hồi hộp', 'Ho khan / Khó thở']);
  const [newSymptom, setNewSymptom] = useState('');
  const [painScale, setPainScale] = useState<number>(5);
  const [isSaved, setIsSaved] = useState(false);

  const handleAddSymptom = () => {
    if (newSymptom.trim() && !symptoms.includes(newSymptom.trim())) {
      setSymptoms([...symptoms, newSymptom.trim()]);
      setNewSymptom('');
    }
  };

  const handleRemoveSymptom = (item: string) => {
    setSymptoms(symptoms.filter((s) => s !== item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Tiếp Nhận Triệu Chứng Ban Đầu Tại Quầy
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lễ tân ghi nhận triệu chứng sơ bộ của bệnh nhân khi đăng ký khám để phân luồng phòng khám phù hợp.
          </p>
        </div>
        <Badge variant="normal" size="sm">
          FR-HM-2.3 (Lễ Tân)
        </Badge>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Đã lưu triệu chứng ban đầu và cập nhật vào hàng chờ phòng khám của bác sĩ!</span>
        </div>
      )}

      {/* Patient Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
        <User className="w-8 h-8 text-blue-700 p-1.5 bg-blue-50 rounded-xl border border-blue-200 shrink-0" />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase">Mã Bệnh Nhân</label>
            <div className="relative">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-bold"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase">Họ và tên bệnh nhân</label>
            <input
              type="text"
              readOnly
              value={patientName}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Activity className="w-5 h-5 text-blue-700" />
          <h3 className="font-bold text-base text-slate-900">Ghi Nhận Triệu Chứng Sơ Bộ</h3>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Lý do chính bệnh nhân khai báo *</label>
          <textarea
            rows={3}
            required
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            placeholder="Nhập ghi chú ngắn gọn lý do đi khám..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Danh sách triệu chứng ghi nhận được:</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {symptoms.map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs rounded-lg">
                {item}
                <button type="button" onClick={() => handleRemoveSymptom(item)} className="hover:text-blue-950 cursor-pointer border-none bg-transparent">
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Thêm triệu chứng khác..."
              value={newSymptom}
              onChange={(e) => setNewSymptom(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSymptom(); } }}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
            <button
              type="button"
              onClick={handleAddSymptom}
              className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 cursor-pointer border-none"
            >
              Thêm
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mức độ đau / Khó chịu (1-10)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={painScale}
              onChange={(e) => setPainScale(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian khởi phát</label>
            <input
              type="text"
              defaultValue="2 ngày nay"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-md border-none"
          >
            <Save className="w-4 h-4" />
            <span>Lưu & Chuyển Phòng Khám</span>
          </button>
        </div>
      </form>
    </div>
  );
};
