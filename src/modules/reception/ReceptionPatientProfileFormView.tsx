// FR-HM-2.1 — Tạo/Cập nhật hồ sơ bệnh nhân (Nhập hộ siêu tốc tại quầy)
// Actor: Nhân viên tiếp nhận (Reception)
// Trạng thái: Mock UI (chưa nối API)

import React, { useState } from 'react';
import { UserPlus, Search, Save, CheckCircle2, Zap } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const ReceptionPatientProfileFormView: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    gender: 'Nam',
    identityCard: '',
    phone: '',
    email: '',
    address: '',
    medicalHistory: '',
    allergiesText: '',
    currentMedications: ''
  });

  const [isSaved, setIsSaved] = useState(false);
  const [patientCode, setPatientCode] = useState('');

  const handleQuickLookup = () => {
    setFormData({
      fullName: 'Trần Văn Hoàng',
      dob: '1988-04-20',
      gender: 'Nam',
      identityCard: '079188009876',
      phone: '0918 234 567',
      email: 'hoang.tran@gmail.com',
      address: '456 Lê Văn Sỹ, Phường 14, Quận 3, TP. Hồ Chí Minh',
      medicalHistory: 'Tiểu đường type 2 (đang điều trị)',
      allergiesText: 'Aspirin',
      currentMedications: 'Metformin 500mg'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedCode = 'P-' + Math.floor(10000 + Math.random() * 90000);
    setPatientCode(generatedCode);
    setIsSaved(true);
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
        <Badge variant="normal" size="sm">
          FR-HM-2.1 (Lễ Tân)
        </Badge>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Đã tạo thành công Hồ sơ bệnh nhân mới!</p>
              <p className="text-xs text-emerald-700">Mã Bệnh Nhân: <span className="font-black text-blue-900">{patientCode}</span> • Tên: {formData.fullName}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsSaved(false);
              setFormData({ fullName: '', dob: '', gender: 'Nam', identityCard: '', phone: '', email: '', address: '', medicalHistory: '', allergiesText: '', currentMedications: '' });
            }}
            className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 cursor-pointer border-none"
          >
            Tạo Hồ Sơ Mới
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
          <Zap className="w-4 h-4 text-blue-700" />
          <span>Quét nhanh CCCD chip hoặc Tra cứu thông tin có sẵn:</span>
        </div>
        <button
          type="button"
          onClick={handleQuickLookup}
          className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs border-none"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Đọc Dữ Liệu CCCD Demo</span>
        </button>
      </div>

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
            <label className="block text-xs font-bold text-slate-700 mb-1">Số CCCD / Định danh *</label>
            <input
              type="text"
              required
              placeholder="12 chữ số CCCD"
              value={formData.identityCard}
              onChange={(e) => setFormData({ ...formData, identityCard: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh *</label>
            <input
              type="date"
              required
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
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
            <input
              type="tel"
              required
              placeholder="09xx xxx xxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ cư trú</label>
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

        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Dị ứng (Nếu có)</label>
            <input
              type="text"
              placeholder="VD: Dị ứng Penicillin, Hải sản..."
              value={formData.allergiesText}
              onChange={(e) => setFormData({ ...formData, allergiesText: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tiền sử bệnh lý chính</label>
            <input
              type="text"
              placeholder="VD: Tăng huyết áp, Đái tháo đường..."
              value={formData.medicalHistory}
              onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-md border-none"
          >
            <Save className="w-4 h-4" />
            <span>Tạo Hồ Sơ & Xếp Hàng Khám</span>
          </button>
        </div>
      </form>
    </div>
  );
};
