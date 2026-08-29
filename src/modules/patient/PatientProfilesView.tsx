import React, { useState, useEffect } from 'react';
import {
  User,
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Plus,
  Save,
  CheckCircle2,
  CreditCard,
  Loader2,
  AlertCircle,
  Edit3,
  ArrowLeft,
  ShieldCheck,
  CalendarPlus,
  FileText
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { DobInput } from '../../components/common/DobInput';
import { useAuth } from '../../context/AuthContext';
import { patientService, type PatientGender } from '../../services/patient/patient.service';

interface ProfileItem {
  id: string; // patientId or temporary local id
  patientCode?: string;
  relationship: string;
  fullName: string;
  dob: string; // YYYY-MM-DD
  gender: 'Nam' | 'Nữ' | 'Khác';
  identityCard: string;
  insuranceCard?: string;
  phone: string;
  email: string;
  address: string;
  isBackendRecord?: boolean;
}

type ViewMode = 'DETAIL' | 'CREATE' | 'EDIT';

const mapRelationshipToFE = (rel?: string): string => {
  if (!rel) return 'Bản thân';
  const lower = rel.toLowerCase();
  if (lower === 'self' || lower === 'bản thân') return 'Bản thân';
  if (lower === 'child' || lower === 'con cái' || lower === 'con') return 'Con cái';
  if (lower === 'parent' || lower === 'bố/mẹ' || lower === 'cha mẹ' || lower === 'bố' || lower === 'mẹ') return 'Bố/Mẹ';
  if (lower === 'spouse' || lower === 'vợ/chồng' || lower === 'vợ' || lower === 'chồng') return 'Vợ/Chồng';
  if (lower === 'guardian' || lower === 'người giám hộ') return 'Người giám hộ';
  if (lower === 'other' || lower === 'khác') return 'Khác';
  return rel;
};

const mapGenderToFE = (g?: string): 'Nam' | 'Nữ' | 'Khác' => {
  if (g === 'male' || g === 'Nam') return 'Nam';
  if (g === 'female' || g === 'Nữ') return 'Nữ';
  return 'Khác';
};

const mapGenderToBE = (g: string): PatientGender => {
  if (g === 'Nam') return 'male';
  if (g === 'Nữ') return 'female';
  return 'other';
};

const formatDateForDisplay = (dobStr?: string): string => {
  if (!dobStr) return 'Chưa cập nhật';
  const parts = dobStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return dobStr;
};

export const PatientProfilesView: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('DETAIL');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Form State for Create / Edit
  const [formData, setFormData] = useState<ProfileItem>({
    id: '',
    relationship: 'Con cái',
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

  const loadPatients = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await patientService.getMyPatients();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: ProfileItem[] = data.map((p) => ({
          id: p.patientId,
          patientCode: p.patientCode,
          relationship: mapRelationshipToFE(p.relationship),
          fullName: p.fullName || '',
          dob: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
          gender: mapGenderToFE(p.gender),
          identityCard: p.identityNumber || '',
          insuranceCard: p.insuranceNumber || '',
          phone: p.phoneNumber || '',
          email: p.email || '',
          address: p.address || '',
          isBackendRecord: true,
        }));
        setProfiles(mapped);
      } else {
        // Nếu getMyPatients trả về [] (do chưa có PatientContact), dùng API match-suggestion để tìm và tự động khôi phục hồ sơ
        try {
          const cleanPhone = (user?.phone || '').replace(/\D/g, '');
          const suggestion = await patientService.findMatchSuggestion({ phoneNumber: cleanPhone || undefined });
          if (suggestion?.matched && suggestion.patient?.patientId) {
            try {
              await patientService.linkUser(suggestion.patient.patientId);
            } catch (linkErr) {
              console.log('Lưu ý khi liên kết hồ sơ:', linkErr);
            }
            const fullP = await patientService.getPatientById(suggestion.patient.patientId);
            if (fullP) {
              const mappedSingle: ProfileItem = {
                id: fullP.patientId,
                patientCode: fullP.patientCode,
                relationship: 'Bản thân',
                fullName: fullP.fullName || '',
                dob: fullP.dateOfBirth ? fullP.dateOfBirth.split('T')[0] : '',
                gender: mapGenderToFE(fullP.gender),
                identityCard: fullP.identityNumber || '',
                insuranceCard: fullP.insuranceNumber || '',
                phone: fullP.phoneNumber || '',
                email: fullP.email || '',
                address: fullP.address || '',
                isBackendRecord: true,
              };
              setProfiles([mappedSingle]);
              return;
            }
          }
        } catch (sugErr) {
          console.log('Thử tìm gợi ý hồ sơ thất bại:', sugErr);
        }
        setProfiles([]);
      }
    } catch (err: any) {
      console.error('Lỗi tải danh sách hồ sơ:', err);
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const activeProfile = profiles.find((p) => p.id === selectedProfileId) || null;

  const handleSelectProfile = (id: string) => {
    setSelectedProfileId(id);
    setViewMode('DETAIL');
    setErrorMessage('');
  };

  const handleOpenCreate = () => {
    const hasSelf = profiles.some((p) => p.relationship === 'Bản thân' || p.relationship === 'self');
    setFormData({
      id: `NEW_${Date.now()}`,
      relationship: hasSelf ? 'Con cái' : 'Bản thân',
      fullName: '',
      dob: '',
      gender: 'Nam',
      identityCard: '',
      insuranceCard: '',
      phone: user?.phone || '',
      email: user?.email || '',
      address: '',
      isBackendRecord: false,
    });
    setViewMode('CREATE');
    setErrorMessage('');
  };

  const handleOpenEdit = () => {
    if (!activeProfile) return;
    setFormData({ ...activeProfile });
    setViewMode('EDIT');
    setErrorMessage('');
  };

  const handleFormChange = (field: keyof ProfileItem, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

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

      if (viewMode === 'EDIT' && formData.isBackendRecord && formData.id) {
        await patientService.updatePatient(formData.id, payload);
      } else {
        try {
          await patientService.createPatient(payload);
        } catch (createErr: any) {
          // Xử lý thông minh khi gặp 409 Conflict: "Bạn đã có hồ sơ bệnh nhân, không thể tạo thêm"
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
              try {
                await patientService.linkUser(suggestion.patient.patientId);
              } catch (lErr) {
                console.log('Liên kết hồ sơ đã tồn tại:', lErr);
              }
              const existingFull = await patientService.getPatientById(suggestion.patient.patientId);
              if (existingFull) {
                const mappedExisting: ProfileItem = {
                  id: existingFull.patientId,
                  patientCode: existingFull.patientCode,
                  relationship: 'Bản thân',
                  fullName: existingFull.fullName || '',
                  dob: existingFull.dateOfBirth ? existingFull.dateOfBirth.split('T')[0] : '',
                  gender: mapGenderToFE(existingFull.gender),
                  identityCard: existingFull.identityNumber || '',
                  phone: existingFull.phoneNumber || '',
                  email: existingFull.email || '',
                  address: existingFull.address || '',
                  isBackendRecord: true,
                };
                setProfiles([mappedExisting]);
                setSelectedProfileId(mappedExisting.id);
                setIsSaved(true);
                setTimeout(() => setIsSaved(false), 3000);
                setViewMode('DETAIL');
                return;
              }
            }
          }
          throw createErr;
        }
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      setViewMode('DETAIL');
      await loadPatients();
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể lưu thông tin hồ sơ. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasOtherSelfProfile = profiles.some(
    (p) => (p.relationship === 'Bản thân' || p.relationship === 'self') && p.id !== formData.id
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-700" />
            <span>Profile Thông Tin Hành Chính Cá Nhân & Người Thân</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý danh sách các hồ sơ đăng ký khám bệnh cho Bản thân và Người thân trong gia đình.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Hồ Sơ Bệnh Nhân Mới</span>
        </button>
      </div>

      {/* Profile Cards Grid Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Danh sách hồ sơ bệnh nhân ({profiles.length})</span>
          </h3>
        </div>

        {isLoading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
            <span className="text-xs font-semibold">Đang tải danh sách hồ sơ...</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Chưa có hồ sơ bệnh nhân nào</p>
              <p className="text-xs text-slate-500 mt-1">Bấm nút "Tạo Hồ Sơ Bệnh Nhân Mới" để tạo hồ sơ khám bệnh đầu tiên.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Hồ Sơ Mới Ngay</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {profiles.map((p) => {
              const isSelected = p.id === selectedProfileId && viewMode === 'DETAIL';
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProfile(p.id)}
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-blue-50/40 border-blue-600 ring-2 ring-blue-600/20 shadow-md'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {p.fullName ? p.fullName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{p.fullName || 'Chưa đặt tên'}</h4>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold mt-0.5">
                          {p.relationship}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2.5 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mã BN:</span>
                      <span className="font-extrabold text-blue-700">{p.patientCode || 'Chưa cấp'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">SĐT:</span>
                      <span className="font-medium text-slate-800">{p.phone || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Ngày sinh:</span>
                      <span className="font-medium text-slate-800">{formatDateForDisplay(p.dob)}</span>
                    </div>
                  </div>

                  <div className="h-5 flex items-center justify-end">
                    {isSelected ? (
                      <span className="text-[10px] text-blue-700 font-bold flex items-center gap-1">
                        <span>Đang xem chi tiết</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
                        Xem chi tiết →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Lưu thông tin hồ sơ thành công!</span>
        </div>
      )}

      {/* Detail View Mode */}
      {viewMode === 'DETAIL' && activeProfile && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                {activeProfile.fullName ? activeProfile.fullName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-900">{activeProfile.fullName}</h3>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                    {activeProfile.relationship}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeProfile.patientCode ? `Mã Bệnh Nhân: ${activeProfile.patientCode}` : 'Hồ sơ chưa có mã định danh'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenEdit}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border-none"
              >
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Chỉnh Sửa Thông Tin</span>
              </button>
            </div>
          </div>

          {/* Details Read-Only Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Họ và tên bệnh nhân</span>
              <p className="text-xs font-bold text-slate-800">{activeProfile.fullName || 'Chưa cập nhật'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mối quan hệ</span>
              <p className="text-xs font-bold text-slate-800">{activeProfile.relationship}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Số CCCD / CMND</span>
              <p className="text-xs font-bold text-slate-800">{activeProfile.identityCard || 'Chưa cập nhật'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mã số thẻ BHYT / Bảo hiểm</span>
              <p className="text-xs font-bold text-slate-800">{activeProfile.insuranceCard || 'Chưa cập nhật'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ngày sinh (DD/MM/YYYY)</span>
              <p className="text-xs font-bold text-slate-800">{formatDateForDisplay(activeProfile.dob)}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Giới tính</span>
              <p className="text-xs font-bold text-slate-800">{activeProfile.gender}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Số điện thoại liên hệ</span>
              <p className="text-xs font-bold text-slate-800">{activeProfile.phone || 'Chưa cập nhật'}</p>
            </div>

            <div className="md:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email nhận thông báo / đơn thuốc</span>
              <p className="text-xs font-bold text-slate-800">{activeProfile.email || 'Chưa cập nhật'}</p>
            </div>

            <div className="md:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Địa chỉ thường trú</span>
              <p className="text-xs font-bold text-slate-800">{activeProfile.address || 'Chưa cập nhật'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Mode (CREATE or EDIT) */}
      {(viewMode === 'CREATE' || viewMode === 'EDIT') && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('DETAIL')}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-none"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-base text-slate-900">
                {viewMode === 'CREATE' ? 'Tạo Hồ Sơ Bệnh Nhân Mới' : `Chỉnh Sửa Hồ Sơ: ${formData.fullName || 'Bệnh Nhân'}`}
              </h3>
            </div>
            {viewMode === 'EDIT' && formData.patientCode && (
              <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                Mã Bệnh Nhân: {formData.patientCode}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quan hệ với chủ tài khoản *</label>
              <select
                value={formData.relationship}
                onChange={(e) => handleFormChange('relationship', e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              >
                <option value="Bản thân" disabled={hasOtherSelfProfile}>
                  Bản thân {hasOtherSelfProfile ? '(Đã có 1 hồ sơ Bản thân)' : ''}
                </option>
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
                placeholder="Nhập họ và tên đầy đủ"
                value={formData.fullName}
                onChange={(e) => handleFormChange('fullName', e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số CCCD / CMND *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Nhập số CCCD/CMND"
                  value={formData.identityCard}
                  onChange={(e) => handleFormChange('identityCard', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mã số thẻ BHYT / Bảo hiểm</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập mã thẻ BHYT (nếu có)"
                  value={formData.insuranceCard || ''}
                  onChange={(e) => handleFormChange('insuranceCard', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh (Ngày / Tháng / Năm) *</label>
              <DobInput
                value={formData.dob}
                onChange={(val) => handleFormChange('dob', val)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính *</label>
              <select
                value={formData.gender}
                onChange={(e) => handleFormChange('gender', e.target.value)}
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
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
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
                  placeholder="nhapemail@example.com"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
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
                  placeholder="Nhập địa chỉ thường trú"
                  value={formData.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Form Footer Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setViewMode('DETAIL')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border-none"
            >
              Hủy / Quay lại
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center gap-2 cursor-pointer shadow-md border-none"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSubmitting ? 'Đang lưu...' : viewMode === 'CREATE' ? 'Tạo Hồ Sơ Bệnh Nhân' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
