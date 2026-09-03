import React, { useState, useEffect } from 'react';
import { Edit3, X, Loader2, Save, AlertCircle } from 'lucide-react';
import { patientService, type CreatePatientData } from '../../services/patient/patient.service';
import { DobInput } from '../../components/common/DobInput';

export interface PatientItem {
  patientId: string;
  mrn: string;
  name: string;
  age: number;
  gender: 'Nam' | 'Nữ' | string;
  email: string;
  phone: string;
  cccd: string;
  ssn: string;
  bhyt: string;
  dob: string;
  recentAction: string;
  doctor: string;
  specialty: string;
}

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientItem | null;
  onSuccess: (message?: string, updatedData?: Partial<PatientItem>) => void;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    gender: 'Nam',
    identityCard: '',
    insuranceCard: '',
    phone: '',
    email: '',
    address: '',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (patient) {
      setFormData({
        fullName: patient.name || '',
        dob: patient.dob || '',
        gender: patient.gender === 'Nam' ? 'Nam' : patient.gender === 'Nữ' ? 'Nữ' : 'Khác',
        identityCard: patient.cccd !== 'Chưa cập nhật' ? patient.cccd : '',
        insuranceCard: patient.bhyt !== 'Chưa cập nhật' ? patient.bhyt : '',
        phone: patient.phone !== 'Chưa cập nhật' ? patient.phone : '',
        email: patient.email !== 'Chưa cập nhật' ? patient.email : '',
        address: '',
      });
      setFormError(null);
    }
  }, [patient]);

  if (!isOpen || !patient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên bệnh nhân');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: Partial<CreatePatientData> = {
      fullName: formData.fullName.trim(),
      dateOfBirth: formData.dob || undefined,
      gender: formData.gender === 'Nam' ? 'male' : formData.gender === 'Nữ' ? 'female' : 'other',
      phoneNumber: formData.phone.trim() || undefined,
      identityNumber: formData.identityCard.trim() || undefined,
      insuranceNumber: formData.insuranceCard.trim() || undefined,
      email: formData.email.trim() || undefined,
      address: formData.address.trim() || undefined,
    };

    try {
      const targetId = patient.patientId || patient.mrn;
      await patientService.updatePatient(targetId, payload);
      const birthYear = formData.dob ? new Date(formData.dob).getFullYear() : 1995;
      const computedAge = isNaN(birthYear) ? 30 : new Date().getFullYear() - birthYear;

      onSuccess(`Đã cập nhật thành công hồ sơ bệnh nhân ${formData.fullName.trim()}!`, {
        name: formData.fullName.trim(),
        dob: formData.dob,
        age: computedAge,
        gender: formData.gender,
        phone: formData.phone.trim() || 'Chưa cập nhật',
        cccd: formData.identityCard.trim() || 'Chưa cập nhật',
        ssn: formData.identityCard.trim() || 'Chưa cập nhật',
        bhyt: formData.insuranceCard.trim() || 'Chưa cập nhật',
        email: formData.email.trim() || 'Chưa cập nhật',
      });
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Cập nhật hồ sơ bệnh nhân thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-700" />
            <span>Cập Nhật Hồ Sơ Bệnh Nhân</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer border-none bg-transparent"
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

          <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-blue-900 font-bold text-xs flex justify-between items-center">
            <span>Mã bệnh nhân (MRN):</span>
            <span className="font-mono text-blue-700">{patient.mrn}</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold">Họ và tên bệnh nhân (*)</label>
            <input
              type="text"
              required
              placeholder="VD: NGUYEN VAN A"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">Số CCCD / Định danh</label>
              <input
                type="text"
                placeholder="12 chữ số CCCD"
                value={formData.identityCard}
                onChange={(e) => setFormData({ ...formData, identityCard: e.target.value })}
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">Mã số thẻ BHYT</label>
              <input
                type="text"
                placeholder="HS4010123456789"
                value={formData.insuranceCard}
                onChange={(e) => setFormData({ ...formData, insuranceCard: e.target.value })}
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">Giới tính (*)</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">Số điện thoại liên hệ</label>
              <input
                type="tel"
                placeholder="09xx xxx xxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold">Ngày sinh (*)</label>
            <DobInput
              value={formData.dob}
              onChange={(val) => setFormData({ ...formData, dob: val })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold">Email bệnh nhân</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold">Địa chỉ thường trú</label>
            <input
              type="text"
              placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-700 transition-all font-semibold"
            />
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
              className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2 border-none"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Lưu Cập Nhật</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
