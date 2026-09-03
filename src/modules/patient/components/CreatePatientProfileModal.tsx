import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2, Save, AlertCircle, CreditCard, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';
import { DobInput } from '../../../components/common/DobInput';
import { patientService, type PatientGender } from '../../../services/patient/patient.service';

export interface ProfileItem {
  id: string;
  patientCode?: string;
  relationship: string;
  fullName: string;
  dob: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  identityCard: string;
  insuranceCard?: string;
  phone: string;
  email: string;
  address: string;
  isBackendRecord?: boolean;
}

interface CreatePatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPhone?: string;
  userEmail?: string;
  hasSelfProfile: boolean;
  onSuccess: (message?: string) => void;
}

const mapGenderToBE = (g: string): PatientGender => {
  if (g === 'Nam') return 'male';
  if (g === 'Nữ') return 'female';
  return 'other';
};

export const CreatePatientProfileModal: React.FC<CreatePatientProfileModalProps> = ({
  isOpen,
  onClose,
  userPhone = '',
  userEmail = '',
  hasSelfProfile,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Omit<ProfileItem, 'id'>>({
    relationship: 'Bản thân',
    fullName: '',
    dob: '',
    gender: 'Nam',
    identityCard: '',
    insuranceCard: '',
    phone: '',
    email: '',
    address: '',
    isBackendRecord: false,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        relationship: hasSelfProfile ? 'Con cái' : 'Bản thân',
        fullName: '',
        dob: '',
        gender: 'Nam',
        identityCard: '',
        insuranceCard: '',
        phone: userPhone,
        email: userEmail,
        address: '',
        isBackendRecord: false,
      });
      setFormError(null);
    }
  }, [isOpen, hasSelfProfile, userPhone, userEmail]);

  if (!isOpen) return null;

  const handleFormChange = (field: keyof Omit<ProfileItem, 'id'>, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên bệnh nhân');
      return;
    }
    if (!formData.identityCard.trim()) {
      setFormError('Vui lòng nhập số CCCD / CMND');
      return;
    }
    if (!formData.dob) {
      setFormError('Vui lòng chọn ngày sinh');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Vui lòng nhập số điện thoại liên hệ');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        dateOfBirth: formData.dob,
        gender: mapGenderToBE(formData.gender),
        phoneNumber: formData.phone.trim(),
        identityNumber: formData.identityCard.trim() || undefined,
        insuranceNumber: formData.insuranceCard?.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        relationship: formData.relationship,
      };

      try {
        await patientService.createPatient(payload);
      } catch (createErr: any) {
        if (
          createErr?.message?.includes('đã có hồ sơ') ||
          createErr?.status === 409 ||
          createErr?.statusCode === 409
        ) {
          const cleanPhone = payload.phoneNumber.replace(/\D/g, '');
          const suggestion = await patientService.findMatchSuggestion({
            phoneNumber: cleanPhone || undefined,
            identityNumber: payload.identityNumber,
          });

          if (suggestion?.matched && suggestion.patient?.patientId) {
            await patientService.linkUser(suggestion.patient.patientId);
          } else {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }

      onSuccess(`Đã tạo thành công hồ sơ bệnh nhân ${formData.fullName}!`);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Tạo hồ sơ bệnh nhân thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-700" />
            <span>Tạo Hồ Sơ Bệnh Nhân Mới</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer border-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Quan hệ với chủ tài khoản (*)</label>
              <select
                value={formData.relationship}
                onChange={(e) => handleFormChange('relationship', e.target.value)}
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
              >
                <option value="Bản thân" disabled={hasSelfProfile}>
                  Bản thân {hasSelfProfile ? '(Đã có 1 hồ sơ Bản thân)' : ''}
                </option>
                <option value="Con cái">Con cái</option>
                <option value="Cha / Mẹ">Cha / Mẹ</option>
                <option value="Người thân">Người thân khác</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Họ và tên bệnh nhân (*)</label>
              <input
                type="text"
                required
                placeholder="Nhập họ và tên đầy đủ"
                value={formData.fullName}
                onChange={(e) => handleFormChange('fullName', e.target.value)}
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Số CCCD / CMND (*)</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Nhập số CCCD/CMND"
                  value={formData.identityCard}
                  onChange={(e) => handleFormChange('identityCard', e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Mã số thẻ BHYT / Bảo hiểm</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập mã thẻ BHYT (nếu có)"
                  value={formData.insuranceCard || ''}
                  onChange={(e) => handleFormChange('insuranceCard', e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                />
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Ngày sinh (*)</label>
              <DobInput
                value={formData.dob}
                onChange={(val) => handleFormChange('dob', val)}
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Giới tính (*)</label>
              <select
                value={formData.gender}
                onChange={(e) => handleFormChange('gender', e.target.value as any)}
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Số điện thoại liên hệ (*)</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Email gửi kết quả / Đơn thuốc</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="nhapemail@example.com"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Địa chỉ thường trú</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập địa chỉ thường trú"
                  value={formData.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer border-none"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-sm transition-all cursor-pointer border-none flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSubmitting ? 'Đang tạo...' : 'Tạo Hồ Sơ Bệnh Nhân'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
