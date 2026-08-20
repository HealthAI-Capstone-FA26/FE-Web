import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const DoctorEMRView: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState('BN-2026-088');
  const [preliminaryDiag, setPreliminaryDiag] = useState('Nghi ngờ Viêm phế quản cấp / Theo dõi Viêm phổi nhẹ');
  const [selectedLabOrders, setSelectedLabOrders] = useState<string[]>([
    'Xét nghiệm công thức máu toàn phần (CBC)',
    'Chụp X-quang ngực thẳng (Digital Radiography)'
  ]);

  const handleToggleLabOrder = (orderName: string) => {
    setSelectedLabOrders((prev) =>
      prev.includes(orderName) ? prev.filter((i) => i !== orderName) : [...prev, orderName]
    );
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Hồ Sơ EMR & Phân Tích AI
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem hồ sơ bệnh án điện tử, tóm tắt AI (AI01) và khoanh vùng tổn thương (AI02).
          </p>
        </div>

        <Badge variant="normal" size="md">
          Đang khám: P-90234
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient EMR & AI Panel (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* AI01 Smart EMR Summary Widget */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Mô-đun AI01 — Tóm Tắt Bệnh Án Thông Minh (Smart EMR Summary)
                </h3>
              </div>
              <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/40 px-2.5 py-0.5 rounded-full font-bold">
                Confidence: 97.4%
              </span>
            </div>

            <p className="text-xs text-purple-100/90 leading-relaxed font-medium">
              Bệnh nhân nam 21 tuổi, tiền sử dị ứng Penicillin. Khai báo ho kéo dài 4 ngày kèm sốt nhẹ 38.2°C. Chỉ số sinh hiệu ghi nhận lúc tiếp nhận: Huyết áp 120/80 mmHg, SpO2 96%, nhịp tim 88 bpm. Chưa ghi nhận tiền sử mãn tính nguy hiểm.
            </p>

            <div className="text-[11px] text-purple-200/70 border-t border-purple-700/50 pt-2 flex items-center justify-between">
              <span>Tham chiếu nguồn: EMR VitalSigns (Mod 4) + SymptomForm (Mod 3)</span>
              <span className="font-bold text-amber-300">Tự động sinh bởi Medical AI Model</span>
            </div>
          </div>

          {/* AI02 Abnormal Detection Viewer */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Mô-đun AI02 — Phân Tích Bất Thường & Gợi Ý Chẩn Đoán Sơ Bộ</span>
              </h3>
              <Badge variant="ai" size="sm">
                AI Region of Interest (ROI)
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                <span className="text-xs font-bold text-amber-900 block">Cảnh báo Sinh hiệu Bất thường:</span>
                <ul className="text-xs text-amber-800 space-y-1 list-disc pl-4">
                  <li>Nhiệt độ 38.2°C (Vượt ngưỡng bình thường 37.0°C)</li>
                  <li>SpO2 96% (Cần theo dõi sát hô hấp)</li>
                </ul>
              </div>

              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2">
                <span className="text-xs font-bold text-indigo-900 block">Đề xuất Chẩn đoán Sơ bộ từ AI:</span>
                <div className="text-sm font-extrabold text-indigo-950">Viêm Phế Quản Cấp (J20.9)</div>
                <span className="text-[10px] text-indigo-700 font-bold block">Độ tin cậy mô hình: 92.5%</span>
              </div>
            </div>
          </div>

          {/* Doctor Preliminary Diagnosis Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3">
              Ghi Nhận Kết Quả Thăm Khám Lâm Sàng (Bác Sĩ)
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Chẩn đoán sơ bộ của Bác sĩ (*):</label>
              <textarea
                rows={2}
                value={preliminaryDiag}
                onChange={(e) => setPreliminaryDiag(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
              />
            </div>

            {/* AI Suggested Lab Orders */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Danh mục Xét nghiệm Gợi ý do AI Đề Xuất:</span>
                <span className="text-[10px] text-purple-600 font-bold">AI Recommended</span>
              </label>

              <div className="space-y-2">
                {[
                  'Xét nghiệm công thức máu toàn phần (CBC)',
                  'Chụp X-quang ngực thẳng (Digital Radiography)',
                  'Xét nghiệm CRP định lượng',
                  'Siêu âm tim màu Doppler'
                ].map((item, idx) => {
                  const isChecked = selectedLabOrders.includes(item);
                  return (
                    <label
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all text-xs font-bold ${
                        isChecked ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleLabOrder(item)}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                        <span>{item}</span>
                      </div>
                      {idx < 2 && <Badge variant="ai" size="sm">AI Khuyên dùng</Badge>}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác Nhận Chỉ Định & Chuyển Thu Ngân (Mô-đun 6)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Patient Queue (1 col) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800">Hàng Chờ Bác Sĩ Khám</h3>
            <Badge variant="info" size="sm">15 Bệnh nhân</Badge>
          </div>

          <div className="space-y-2">
            {[
              { id: 'BN-2026-088', name: 'Khưu Trọng Quân', time: '08:30 AM', status: 'Đang khám' },
              { id: 'BN-2026-089', name: 'Nguyễn Thị Thu Hà', time: '08:45 AM', status: 'Chờ vào' },
              { id: 'BN-2026-090', name: 'Phạm Minh Đức', time: '09:00 AM', status: 'Chờ vào' }
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  selectedPatientId === p.id
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300'
                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                  <span>{p.name}</span>
                  <span className="text-[10px] text-blue-700 font-bold">{p.time}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">{p.id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
