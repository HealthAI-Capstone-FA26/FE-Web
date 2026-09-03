// FR-HM-2.1 — Tạo/Cập nhật hồ sơ bệnh nhân (Nhập hộ tại quầy)
// Actor: Nhân viên tiếp nhận (Reception)

import React, { useState } from 'react';
import { UserPlus, Search, Save, CheckCircle2, Zap, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { patientService, type CreatePatientData } from '../../services/patient/patient.service';
import { DobInput } from '../../components/common/DobInput';

export const ReceptionPatientProfileFormView: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    gender: 'Nam',
    identityCard: '',
    insuranceCard: '',
    phone: '',
    email: '',
    address: '',
    relationship: 'Bản thân',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [patientCode, setPatientCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuickLookup = () => {
    setFormData({
      fullName: 'Trần Văn Hoàng',
      dob: '1988-04-20',
      gender: 'Nam',
      identityCard: '079188009876',
      insuranceCard: 'HS4010123456789',
      phone: '0918234567',
      email: 'hoang.tran@gmail.com',
      address: '456 Lê Văn Sỹ, Phường 14, Quận 3, TP. Hồ Chí Minh',
      relationship: 'Bản thân',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên bệnh nhân');
      return;
    }
    if (!formData.dob) {
      setErrorMessage('Vui lòng chọn ngày sinh');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage('Vui lòng nhập số điện thoại');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: CreatePatientData = {
        fullName: formData.fullName.trim(),
        dateOfBirth: formData.dob,
        gender: formData.gender === 'Nam' ? 'male' : formData.gender === 'Nữ' ? 'female' : 'other',
        phoneNumber: formData.phone.trim(),
        identityNumber: formData.identityCard.trim() || undefined,
        insuranceNumber: formData.insuranceCard.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        relationship: formData.relationship || 'Bản thân',
      };

      const res = await patientService.createPatient(payload);
      setPatientCode(res.patientCode || res.patientId || 'Đã cấp');
      setIsSaved(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Tạo hồ sơ bệnh nhân thất bại. Vui lòng kiểm tra lại.');
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
            Tiếp Nhận & Nhập Hộ Hồ Sơ Bệnh Nhân
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mẫu nhập liệu tối ưu hóa tốc độ cao cho Lễ tân tiếp nhận bệnh nhân vãng lai hoặc đăng ký tại quầy.
          </p>
        </div>

      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Đã tạo thành công Hồ sơ bệnh nhân mới vào cơ sở dữ liệu!</p>
              <p className="text-xs text-emerald-700">Mã Bệnh Nhân: <span className="font-black text-blue-900">{patientCode}</span> • Tên: {formData.fullName}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsSaved(false);
              setFormData({
                fullName: '',
                dob: '',
                gender: 'Nam',
                identityCard: '',
                insuranceCard: '',
                phone: '',
                email: '',
                address: '',
                relationship: 'Bản thân',
              });
            }}
            className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 cursor-pointer border-none shadow-xs"
          >
            Tạo Hồ Sơ Mới Tiếp Theo
          </button>
        </div>
      )}

      {/* Action Bar */}


      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <UserPlus className="w-5 h-5 text-blue-700" />
          <h3 className="font-bold text-base text-slate-900">Thông Tin Hành Chính Bệnh Nhân</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên bệnh nhân *</label>
            <input
              type="text"
              required
              placeholder="VD: NGUYEN VAN A"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 uppercase font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Số CCCD / Định danh</label>
            <input
              type="text"
              placeholder="12 chữ số CCCD"
              value={formData.identityCard}
              onChange={(e) => setFormData({ ...formData, identityCard: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mã số thẻ BHYT</label>
            <input
              type="text"
              placeholder="HS4010123456789"
              value={formData.insuranceCard}
              onChange={(e) => setFormData({ ...formData, insuranceCard: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh *</label>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
            <input
              type="tel"
              required
              placeholder="09xx xxx xxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mối quan hệ</label>
            <select
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            >
              <option value="Bản thân">Bản thân</option>
              <option value="Con cái">Con cái</option>
              <option value="Cha / Mẹ">Cha / Mẹ</option>
              <option value="Người thân">Người thân khác</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ thường trú</label>
            <input
              type="text"
              placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email (Không bắt buộc)</label>
            <input
              type="email"
              placeholder="email@domain.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-md border-none disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSubmitting ? 'Đang gửi...' : 'Tạo Hồ Sơ Bệnh Nhân'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
