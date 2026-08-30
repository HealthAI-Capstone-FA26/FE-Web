import React, { useState, useEffect } from 'react';
import {
  User,
  Users,
  Plus,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Edit3,
  ShieldCheck,
  FileText,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patient/patient.service';
import { CreatePatientProfileModal, type ProfileItem } from './components/CreatePatientProfileModal';
import { EditPatientProfileModal } from './components/EditPatientProfileModal';

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
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingProfile, setEditingProfile] = useState<ProfileItem | null>(null);

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
        if (!selectedProfileId && mapped.length > 0) {
          setSelectedProfileId(mapped[0].id);
        }
      } else {
        // Nếu getMyPatients trả về [], dùng API match-suggestion để tự động liên kết
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
              setSelectedProfileId(mappedSingle.id);
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

  const activeProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0] || null;
  const hasSelfProfile = profiles.some((p) => p.relationship === 'Bản thân' || p.relationship === 'self');

  const handleSuccess = (message?: string) => {
    loadPatients();
    if (message) {
      setSuccessToast(message);
      setTimeout(() => {
        setSuccessToast(null);
      }, 4000);
    }
  };

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
          onClick={() => setIsCreateModalOpen(true)}
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
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Hồ Sơ Mới Ngay</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {profiles.map((p) => {
              const isSelected = p.id === selectedProfileId;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProfileId(p.id)}
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

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-700/60 flex items-center gap-3 animate-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail View Mode Card */}
      {activeProfile && (
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
                onClick={() => setEditingProfile(activeProfile)}
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

      {/* SEPARATE MODAL COMPONENTS */}
      <CreatePatientProfileModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        userPhone={user?.phone}
        userEmail={user?.email}
        hasSelfProfile={hasSelfProfile}
        onSuccess={handleSuccess}
      />

      <EditPatientProfileModal
        isOpen={Boolean(editingProfile)}
        profile={editingProfile}
        onClose={() => setEditingProfile(null)}
        hasOtherSelfProfile={profiles.some(
          (p) => (p.relationship === 'Bản thân' || p.relationship === 'self') && p.id !== editingProfile?.id
        )}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
