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
  Link2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { patientService, type MatchSuggestionResult } from '../../services/patient/patient.service';
import { getAvatarUrl } from '../../services/api';
import { CreatePatientProfileModal, type ProfileItem } from './components/CreatePatientProfileModal';
import { EditPatientProfileModal } from './components/EditPatientProfileModal';
import { LinkPatientProfileModal } from './components/LinkPatientProfileModal';

const mapRelationshipToFE = (rel?: string): string => {
  if (!rel) return 'Bản thân';
  const lower = rel.toLowerCase();
  if (lower === 'self' || lower === 'bản thân') return 'Bản thân';
  if (lower === 'child' || lower === 'con cái' || lower === 'con') return 'Con cái';
  if (lower === 'parent' || lower === 'bố/mẹ' || lower === 'cha mẹ' || lower === 'cha / mẹ' || lower === 'bố' || lower === 'mẹ') return 'Bố/Mẹ';
  if (lower === 'spouse' || lower === 'vợ/chồng' || lower === 'vợ' || lower === 'chồng') return 'Vợ/Chồng';
  if (lower === 'guardian' || lower === 'người giám hộ') return 'Người giám hộ';
  if (lower === 'other' || lower === 'khác' || lower === 'người thân' || lower === 'người thân khác') return 'Người thân';
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
  
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const isLoading = isInitialLoading;
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [editingProfile, setEditingProfile] = useState<ProfileItem | null>(null);

  // Match suggestion state
  const [suggestedProfile, setSuggestedProfile] = useState<MatchSuggestionResult['patient'] | null>(null);
  const [isSuggestionDismissed, setIsSuggestionDismissed] = useState<boolean>(false);

  const loadPatients = async (options?: { silent?: boolean; selectId?: string }) => {
    const isSilent = options?.silent ?? (profiles.length > 0);
    if (!isSilent) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }
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

        if (options?.selectId && mapped.some((m) => m.id === options.selectId)) {
          setSelectedProfileId(options.selectId);
        } else if (!selectedProfileId || !mapped.some((m) => m.id === selectedProfileId)) {
          setSelectedProfileId(mapped[0].id);
        }
      } else {
        setProfiles([]);
        // Kiểm tra xem có gợi ý hồ sơ trùng khớp với tài khoản không
        try {
          const cleanPhone = (user?.phone || '').replace(/\D/g, '');
          const suggestion = await patientService.findMatchSuggestion({ phoneNumber: cleanPhone || undefined });
          if (suggestion?.matched && suggestion.patient?.patientId) {
            setSuggestedProfile(suggestion.patient);
          }
        } catch (sugErr) {
          console.log('Kiểm tra gợi ý hồ sơ:', sugErr);
        }
      }
    } catch (err: any) {
      console.error('Lỗi tải danh sách hồ sơ:', err);
      setErrorMessage(err?.message || 'Không thể tải danh sách hồ sơ bệnh nhân');
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPatients({ silent: false });
  }, []);

  const activeProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0] || null;
  const hasSelfProfile = profiles.some((p) => p.relationship === 'Bản thân' || p.relationship === 'self');

  const handleSuccess = (message?: string, selectId?: string) => {
    loadPatients({ silent: true, selectId: selectId || selectedProfileId });
    setSuggestedProfile(null);
    if (message) {
      setSuccessToast(message);
      setTimeout(() => {
        setSuccessToast(null);
      }, 4000);
    }
  };

  return (
    <div className="space-y-5 w-full">
      {/* Header Banner - Full Width */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Users className="w-5 h-5" />
            </div>
            <span>Profile Thông Tin Hành Chính Cá Nhân & Người Thân</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý danh sách các hồ sơ đăng ký khám bệnh cho Bản thân và Người thân trong gia đình.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsLinkModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer border border-slate-200/80 active:scale-95"
          >
            <Link2 className="w-4 h-4 text-blue-600" />
            <span>Tra Cứu & Liên Kết Hồ Sơ</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Hồ Sơ Bệnh Nhân Mới</span>
          </button>
        </div>
      </div>

      {/* SMART SUGGESTION BANNER (Khi hệ thống tìm thấy hồ sơ khớp tại viện) */}
      {suggestedProfile && !hasSelfProfile && !isSuggestionDismissed && (
        <div className="p-4 bg-linear-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-950 flex items-center gap-2">
                <span>Tìm thấy hồ sơ y tế cũ của bạn tại bệnh viện</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                  Khớp SĐT {user?.phone}
                </span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Bệnh nhân: <strong className="text-slate-900">{suggestedProfile.fullName}</strong>
                {suggestedProfile.maskedIdentityNumber && ` • CCCD: ${suggestedProfile.maskedIdentityNumber}`}
                {suggestedProfile.patientCode && ` • Mã BN: ${suggestedProfile.patientCode}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsSuggestionDismissed(true)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer border-none bg-transparent"
            >
              Để sau
            </button>
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border-none"
            >
              <span>Xem & Liên Kết Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

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

      {/* Main Layout: Compact Corner List (Left) + Expanded Detail View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Compact Profile Cards (Gọn gàng ở 1 góc) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Hồ sơ đã tạo ({profiles.length})</span>
                {isRefreshing && <Loader2 className="w-3 h-3 text-blue-600 animate-spin ml-1" />}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="p-1 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer border-none bg-transparent"
                title="Thêm hồ sơ mới"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isInitialLoading && profiles.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-500 gap-2">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-[11px] font-medium">Đang tải hồ sơ...</span>
              </div>
            ) : profiles.length === 0 ? (
              <div className="py-6 text-center space-y-2 border border-dashed border-slate-200 rounded-xl p-3">
                <User className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Chưa có hồ sơ bệnh nhân</p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-xs text-blue-600 font-bold hover:underline cursor-pointer border-none bg-transparent"
                >
                  + Tạo hồ sơ đầu tiên
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.map((p) => {
                  const isSelected = p.id === (activeProfile?.id || selectedProfileId);
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProfileId(p.id)}
                      className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-600/30 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                      {(p.relationship === 'Bản thân' || p.relationship === 'self') && user?.avatar ? (
                        <img
                          src={getAvatarUrl(user.avatar)}
                          alt={p.fullName}
                          className="w-9 h-9 rounded-xl object-cover border border-blue-200 shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                          }`}
                        >
                          {p.fullName ? p.fullName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                        </div>
                      )}
                        <div className="min-w-0">
                          <h4 className={`font-bold text-xs truncate ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                            {p.fullName || 'Chưa đặt tên'}
                          </h4>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mt-0.5 ${
                              p.relationship === 'Bản thân'
                                ? isSelected
                                  ? 'bg-blue-200/80 text-blue-900'
                                  : 'bg-blue-50 text-blue-700'
                                : isSelected
                                ? 'bg-slate-200 text-slate-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {p.relationship}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="shrink-0 flex items-center">
                          <span className="w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Expanded Detail View (Mở rộng diện tích) */}
        <div className="lg:col-span-8 xl:col-span-9">
          {activeProfile ? (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6 animate-in fade-in duration-200">
              {/* Detail Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  {(activeProfile.relationship === 'Bản thân' || activeProfile.relationship === 'self') && user?.avatar ? (
                    <img
                      src={getAvatarUrl(user.avatar)}
                      alt={activeProfile.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-200 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/20">
                      {activeProfile.fullName ? activeProfile.fullName.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-lg sm:text-xl text-slate-900">{activeProfile.fullName}</h3>
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                        {activeProfile.relationship}
                      </span>
                      {activeProfile.relationship === 'Bản thân' && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Hồ sơ chính
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                      <span className="text-slate-400">Mã Bệnh Nhân:</span>
                      <span className="font-bold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
                        {activeProfile.patientCode || 'Chưa cấp mã BN'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(activeProfile)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-2xs"
                  >
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <span>Chỉnh Sửa Thông Tin</span>
                  </button>
                </div>
              </div>

              {/* Group 1: Thông tin nhân khẩu học */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Thông tin cá nhân & Nhân khẩu học</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Họ và tên</span>
                    <p className="text-xs font-bold text-slate-900 truncate">{activeProfile.fullName || 'Chưa cập nhật'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mối quan hệ</span>
                    <p className="text-xs font-bold text-slate-900">{activeProfile.relationship}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ngày sinh</span>
                    <p className="text-xs font-bold text-slate-900">{formatDateForDisplay(activeProfile.dob)}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Giới tính</span>
                    <p className="text-xs font-bold text-slate-900">{activeProfile.gender}</p>
                  </div>
                </div>
              </div>

              {/* Group 2: Định danh & Bảo hiểm */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Giấy tờ định danh & Bảo hiểm Y tế</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số CCCD / Định danh cá nhân</span>
                    <p className="text-xs font-bold text-slate-900">{activeProfile.identityCard || 'Chưa cập nhật'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mã thẻ BHYT / Bảo hiểm y tế</span>
                    <p className="text-xs font-bold text-slate-900">{activeProfile.insuranceCard || 'Chưa cập nhật'}</p>
                  </div>
                </div>
              </div>

              {/* Group 3: Liên hệ & Địa chỉ */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Thông tin liên hệ & Nơi cư trú</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số điện thoại liên hệ</span>
                    <p className="text-xs font-bold text-slate-900">{activeProfile.phone || 'Chưa cập nhật'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email nhận thông báo</span>
                    <p className="text-xs font-bold text-slate-900">{activeProfile.email || 'Chưa cập nhật'}</p>
                  </div>

                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Địa chỉ thường trú</span>
                    <p className="text-xs font-bold text-slate-900">{activeProfile.address || 'Chưa cập nhật'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <User className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">Chọn hoặc tạo mới hồ sơ bệnh nhân để xem chi tiết</p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer border-none"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Hồ Sơ Mới Ngay</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SEPARATE MODAL COMPONENTS */}
      <CreatePatientProfileModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        userPhone={user?.phone}
        userEmail={user?.email}
        hasSelfProfile={hasSelfProfile}
        onSuccess={handleSuccess}
      />

      <LinkPatientProfileModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        userPhone={user?.phone}
        userEmail={user?.email}
        hasSelfProfile={hasSelfProfile}
        initialSuggestion={suggestedProfile}
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

