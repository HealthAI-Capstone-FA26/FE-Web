import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, Plus, X, Save, CheckCircle2, HeartPulse, History, Calendar, Stethoscope, Clock } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { getPatientEncounterHistory, type EncounterItem } from '../../services/encounter/encounter.service';

export const PatientMedicalRecordView: React.FC = () => {
  const [medicalRecord, setMedicalRecord] = useState({
    patientId: 'BN-2026-088',
    bhytNumber: 'GD479085001234',
    bloodType: 'O+',
    medicalHistory: 'Tiền sử tăng huyết áp nhẹ (chẩn đoán năm 2023). Đã từng phẫu thuật ruột thừa năm 2018.',
    currentMedications: 'Amlodipine 5mg (1 viên/ngày uống buổi sáng)',
    familyHistory: 'Cha có tiền sử đái tháo đường type 2. Mẹ khỏe mạnh.'
  });

  const [allergies, setAllergies] = useState<string[]>(['Penicillin', 'Hải sản (Tôm, Cua)']);
  const [newAllergy, setNewAllergy] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Encounter History from API (GET /api/v1/encounters?patientId=UUID)
  const [encounterHistory, setEncounterHistory] = useState<EncounterItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      setIsLoadingHistory(true);
      try {
        const history = await getPatientEncounterHistory(medicalRecord.patientId);
        if (isMounted && Array.isArray(history)) {
          setEncounterHistory(history);
        }
      } catch (err) {
        console.warn('Không thể tải lịch sử lượt khám từ Backend:', err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    }
    fetchHistory();
    return () => { isMounted = false; };
  }, [medicalRecord.patientId]);

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (item: string) => {
    setAllergies(allergies.filter((a) => a !== item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const formatStatusText = (status: string) => {
    switch (status) {
      case 'finished': return 'Đã hoàn thành';
      case 'in_progress': return 'Đang khám';
      case 'registered': return 'Đã tiếp nhận';
      case 'arrived': return 'Mới tới';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'finished': return 'normal';
      case 'in_progress': return 'ai';
      case 'registered': return 'normal';
      default: return 'normal';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-700" />
            <span>Hồ Sơ Y Tế & Tiền Sử Bệnh Lý Lâm Sàng</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu y khoa lâm sàng, tiền sử dị ứng thuốc, thông tin BHYT và lịch sử các ca khám cũ.
          </p>
        </div>
        <Badge variant="normal" size="sm">
          Chuẩn HL7 FHIR R4
        </Badge>
      </div>

      {/* Patient Code & BHYT Identifier Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
            Hồ sơ Bệnh nhân Điện tử chính thức (EMR)
          </div>
          <div className="text-lg font-black tracking-tight flex items-center gap-3">
            <span>Mã Bệnh Nhân: <strong className="text-amber-400 font-mono">{medicalRecord.patientId}</strong></span>
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
            <span>BHYT: <strong className="text-blue-200 font-mono">{medicalRecord.bhytNumber}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold shrink-0">
          <HeartPulse className="w-4 h-4 text-rose-400" />
          <span>Nhóm máu: <strong className="text-white font-mono">{medicalRecord.bloodType}</strong></span>
        </div>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Hồ sơ y tế và tiền sử bệnh lý đã được cập nhật thành công!</span>
        </div>
      )}

      {/* Real Patient Encounter History Section (GET /api/v1/encounters?patientId=UUID) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-700" />
            <span>Lịch Sử Các Ca Khám Cũ Đã Thực Hiện (Encounter History)</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {encounterHistory.length} ca khám
          </span>
        </div>

        {isLoadingHistory ? (
          <div className="p-6 text-center text-xs text-slate-500 font-bold">
            Đang tải dữ liệu ca khám từ Backend...
          </div>
        ) : encounterHistory.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200/80">
            Chưa có lịch sử lượt khám nào được ghi nhận cho bệnh nhân này.
          </div>
        ) : (
          <div className="space-y-3">
            {encounterHistory.map((enc) => (
              <div
                key={enc.encounterId}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-extrabold text-slate-900">
                    <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px]">
                      {enc.encounterCode}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 font-semibold">
                      <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                      {enc.department?.departmentName || 'Khoa Nội Tổng hợp'}
                    </span>
                  </div>
                  <Badge variant={getStatusVariant(enc.status)} size="sm">
                    {formatStatusText(enc.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Thời gian đến: <strong className="text-slate-800 font-mono">{enc.arrivedAt ? new Date(enc.arrivedAt).toLocaleString('vi-VN') : '---'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Bác sĩ phụ trách: <strong className="text-slate-800">{enc.doctor?.fullName || 'Bác sĩ trực khoa'}</strong></span>
                  </div>
                </div>

                {enc.chiefComplaint?.reasonForVisit && (
                  <div className="p-2 bg-white rounded-lg border border-slate-200/70 text-slate-700 text-[11px] font-medium">
                    <strong className="text-indigo-900 font-bold">Lý do khám:</strong> {enc.chiefComplaint.reasonForVisit}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medical Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dị ứng & Tiền sử */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-base text-slate-900">Danh Sách Dị Ứng & Cảnh Báo An Toàn</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Danh sách dị ứng (Kháng sinh Penicillin, Thức ăn, Phấn hoa...) *
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {allergies.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs rounded-lg">
                    {item}
                    <button type="button" onClick={() => handleRemoveAllergy(item)} className="hover:text-rose-900 cursor-pointer border-none bg-transparent">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập chất/thuốc dị ứng mới..."
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAllergy(); } }}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition-colors flex items-center gap-1 cursor-pointer border-none"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mã số thẻ BHYT chính thức</label>
                <input
                  type="text"
                  value={medicalRecord.bhytNumber}
                  onChange={(e) => setMedicalRecord({ ...medicalRecord, bhytNumber: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nhóm máu</label>
                <select
                  value={medicalRecord.bloodType}
                  onChange={(e) => setMedicalRecord({ ...medicalRecord, bloodType: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-bold"
                >
                  <option value="O+">Nhóm O+</option>
                  <option value="O-">Nhóm O-</option>
                  <option value="A+">Nhóm A+</option>
                  <option value="A-">Nhóm A-</option>
                  <option value="B+">Nhóm B+</option>
                  <option value="B-">Nhóm B-</option>
                  <option value="AB+">Nhóm AB+</option>
                  <option value="AB-">Nhóm AB-</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tiền sử bệnh lý bản thân</label>
              <textarea
                rows={3}
                value={medicalRecord.medicalHistory}
                onChange={(e) => setMedicalRecord({ ...medicalRecord, medicalHistory: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                placeholder="Mô tả các bệnh mãn tính hoặc phẫu thuật trước đây..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thuốc đang sử dụng thường xuyên</label>
              <input
                type="text"
                value={medicalRecord.currentMedications}
                onChange={(e) => setMedicalRecord({ ...medicalRecord, currentMedications: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                placeholder="VD: Thuốc huyết áp, tiểu đường..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tiền sử bệnh gia đình</label>
              <input
                type="text"
                value={medicalRecord.familyHistory}
                onChange={(e) => setMedicalRecord({ ...medicalRecord, familyHistory: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                placeholder="VD: Cha/mẹ có tiền sử bệnh tim mạch, tiểu đường..."
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-md border-none"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Cập Nhật Hồ Sơ Y Tế</span>
          </button>
        </div>
      </form>
    </div>
  );
};

