// FR-HM-2.1 — Tạo/Cập nhật hồ sơ bệnh nhân
// Actor: Bệnh nhân
// Trạng thái: Mock UI (chưa nối API)

import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, AlertCircle, Plus, X, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { DobInput } from '../../components/common/DobInput';
import { useAuth } from '../../context/AuthContext';
import { patientService, type PatientGender } from '../../services/patient/patient.service';

export const PatientProfileFormView: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    dob: '',
    gender: 'Nam',
    identityCard: '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    medicalHistory: '',
    currentMedications: '',
    familyHistory: ''
  });

  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (item: string) => {
    setAllergies(allergies.filter((a) => a !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const mapGenderToBE = (g: string): PatientGender => {
      if (g === 'Nam') return 'male';
      if (g === 'Nữ') return 'female';
      return 'other';
    };

    try {
      await patientService.createPatient({
        fullName: formData.fullName.trim(),
        dateOfBirth: formData.dob,
        gender: mapGenderToBE(formData.gender),
        phoneNumber: formData.phone.trim(),
        identityNumber: formData.identityCard.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể tạo hồ sơ bệnh nhân. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Hồ Sơ Cá Nhân & Tiền Sử Y Tế
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cập nhật thông tin hành chính, tiền sử bệnh lý và dị ứng để bác sĩ tham vấn tốt nhất.
          </p>
        </div>
        <Badge variant="normal" size="sm">
          FR-HM-2.1
        </Badge>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Hồ sơ y tế cá nhân đã được lưu thành công vào hệ thống!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin hành chính */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-base text-slate-900">Thông Tin Hành Chính</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số CCCD / CMND *</label>
              <input
                type="text"
                required
                value={formData.identityCard}
                onChange={(e) => setFormData({ ...formData, identityCard: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh (Ngày / Tháng / Năm) *</label>
              <DobInput
                value={formData.dob}
                onChange={(val) => setFormData({ ...formData, dob: val })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại *</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email liên hệ</label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ thường trú</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Tiền sử bệnh & Dị ứng */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-base text-slate-900">Tiền Sử Bệnh & Dị Ứng</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Danh sách dị ứng (Thuốc, Thức ăn, Phấn hoa...)</label>
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
                  placeholder="Nhập dị ứng mới..."
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tiền sử bệnh lý bản thân</label>
              <textarea
                rows={3}
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                placeholder="Mô tả các bệnh mãn tính hoặc phẫu thuật trước đây..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thuốc đang sử dụng thường xuyên</label>
              <input
                type="text"
                value={formData.currentMedications}
                onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                placeholder="VD: Thuốc huyết áp, tiểu đường..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tiền sử bệnh gia đình</label>
              <input
                type="text"
                value={formData.familyHistory}
                onChange={(e) => setFormData({ ...formData, familyHistory: e.target.value })}
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
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center gap-2 cursor-pointer shadow-md border-none"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi Hồ Sơ'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
