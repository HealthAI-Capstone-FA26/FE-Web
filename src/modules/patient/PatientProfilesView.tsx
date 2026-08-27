import React, { useState } from 'react';
import { User, Users, Calendar, Phone, Mail, MapPin, Plus, Save, CheckCircle2, CreditCard } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

interface ProfileItem {
  id: string;
  relationship: 'Bản thân' | 'Con cái' | 'Cha / Mẹ' | 'Người thân';
  fullName: string;
  dob: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  identityCard: string;
  phone: string;
  email: string;
  address: string;
}

export const PatientProfilesView: React.FC = () => {
  const [profiles, setProfiles] = useState<ProfileItem[]>([
    {
      id: 'PROF-001',
      relationship: 'Bản thân',
      fullName: 'Khưu Trọng Quân',
      dob: '1995-08-15',
      gender: 'Nam',
      identityCard: '079195001234',
      phone: '0902 357 872',
      email: 'quan.khuu@gmail.com',
      address: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh'
    },
    {
      id: 'PROF-002',
      relationship: 'Con cái',
      fullName: 'Khưu Gia Bảo',
      dob: '2019-11-20',
      gender: 'Nam',
      identityCard: 'Chưa cấp (Trẻ em)',
      phone: '0902 357 872',
      email: 'quan.khuu@gmail.com',
      address: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh'
    }
  ]);

  const [selectedProfileId, setSelectedProfileId] = useState<string>('PROF-001');
  const [isSaved, setIsSaved] = useState(false);

  const activeProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0];

  const handleUpdateActiveProfile = (field: keyof ProfileItem, value: string) => {
    setProfiles(prev =>
      prev.map(p => (p.id === selectedProfileId ? { ...p, [field]: value } : p))
    );
  };

  const handleAddNewProfile = () => {
    const newId = `PROF-00${profiles.length + 1}`;
    const newProf: ProfileItem = {
      id: newId,
      relationship: 'Người thân',
      fullName: 'Người thân mới',
      dob: '2000-01-01',
      gender: 'Nam',
      identityCard: '',
      phone: '0902 357 872',
      email: '',
      address: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh'
    };
    setProfiles([...profiles, newProf]);
    setSelectedProfileId(newId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-700" />
            <span>Profile Thông Tin Hành Chính Cá Nhân & Người Thân</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý các Profile đăng ký khám bệnh cho Bản thân và Người thân trong gia đình.
          </p>
        </div>

      </div>

      {/* Select Profile Tabs & Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          {profiles.map((p) => {
            const isActive = p.id === selectedProfileId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProfileId(p.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 ${isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{p.fullName}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {p.relationship}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddNewProfile}
          className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Profile Người Thân</span>
        </button>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Thông tin Profile hành chính đã được lưu thành công!</span>
        </div>
      )}

      {/* Administrative Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-base text-slate-900">
              Thông Tin Hành Chính ({activeProfile.relationship}: {activeProfile.fullName})
            </h3>
          </div>
          <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            Mã Profile: {activeProfile.id}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Quan hệ với chủ tài khoản *</label>
            <select
              value={activeProfile.relationship}
              onChange={(e) => handleUpdateActiveProfile('relationship', e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            >
              <option value="Bản thân">Bản thân</option>
              <option value="Con cái">Con cái</option>
              <option value="Cha / Mẹ">Cha / Mẹ</option>
              <option value="Người thân">Người thân khác</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên bệnh nhân *</label>
            <input
              type="text"
              required
              value={activeProfile.fullName}
              onChange={(e) => handleUpdateActiveProfile('fullName', e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Số CCCD / CMND *</label>
            <div className="relative">
              <input
                type="text"
                required
                value={activeProfile.identityCard}
                onChange={(e) => handleUpdateActiveProfile('identityCard', e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              />
              <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh *</label>
            <div className="relative">
              <input
                type="date"
                required
                value={activeProfile.dob}
                onChange={(e) => handleUpdateActiveProfile('dob', e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính *</label>
            <select
              value={activeProfile.gender}
              onChange={(e) => handleUpdateActiveProfile('gender', e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
            <div className="relative">
              <input
                type="tel"
                required
                value={activeProfile.phone}
                onChange={(e) => handleUpdateActiveProfile('phone', e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Email gửi kết quả / Đơn thuốc</label>
            <div className="relative">
              <input
                type="email"
                value={activeProfile.email}
                onChange={(e) => handleUpdateActiveProfile('email', e.target.value)}
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
                value={activeProfile.address}
                onChange={(e) => handleUpdateActiveProfile('address', e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Form Footer Action */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-md border-none"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Thông Tin Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
};
