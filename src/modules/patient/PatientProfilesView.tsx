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

  const loadPatients = async (options?: { silent?: boolean }) => {
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

  const activeProfile = profiles[0] || null;
  const hasSelfProfile = profiles.length > 0;

  const handleSuccess = (message?: string) => {
    loadPatients({ silent: true });
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
              <User className="w-5 h-5" />
            </div>
            <span>Hồ Sơ Y Tế Cá Nhân</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý thông tin định danh và hồ sơ hành chính gắn với tài khoản của bạn tại Phòng Khám Tim Mạch.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {!hasSelfProfile ? (
            <>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(true)}
                className="w-full sm:w-auto justify-center px-3.5 py-2.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer border border-slate-200/80 active:scale-95"
              >
                <Link2 className="w-4 h-4 text-blue-600" />
                <span>Tra Cứu & Liên Kết Hồ Sơ Cũ</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full sm:w-auto justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer border-none"
              >
                <Plus className="w-4 h-4" />
                <span>Khai Báo Hồ Sơ Bản Thân</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => activeProfile && setEditingProfile(activeProfile)}
              className="w-full sm:w-auto justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer border-none"
            >
              <Edit3 className="w-4 h-4" />
              <span>Chỉnh Sửa Thông Tin Hồ Sơ</span>
            </button>
          )}
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

      {/* Main Content Area - Full Width */}
      {isInitialLoading && profiles.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-center text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-xs sm:text-sm font-semibold">Đang tải thông tin hồ sơ bệnh nhân...</span>
        </div>
      ) : !activeProfile ? (
        <div className="bg-white p-8 sm:p-14 rounded-2xl border border-dashed border-slate-300 shadow-xs text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Bạn chưa có hồ sơ bệnh nhân liên kết
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Vui lòng liên kết hồ sơ đã từng khám tại Phòng Khám Tim Mạch hoặc khai báo hồ sơ bệnh nhân để đặt lịch khám và tra cứu lịch sử y tế.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-slate-200/80 active:scale-95"
            >
              <Link2 className="w-4 h-4 text-blue-600" />
              <span>Tra Cứu & Liên Kết Hồ Sơ Cũ</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" />
              <span>Khai Báo Hồ Sơ Bản Thân</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6 animate-in fade-in duration-200">
          {/* Detail Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3.5 sm:gap-4">
              {user?.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={activeProfile.fullName}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-blue-200 shadow-md shrink-0"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-md shadow-blue-500/20 shrink-0">
                  {activeProfile.fullName ? activeProfile.fullName.charAt(0).toUpperCase() : <User className="w-7 h-7 sm:w-8 sm:h-8" />}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-lg sm:text-2xl text-slate-900 truncate">{activeProfile.fullName}</h3>
                  <span className="px-2.5 py-0.5 sm:py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] sm:text-xs font-bold inline-flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Hồ sơ chính chủ
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400">Mã Bệnh Nhân:</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-mono text-[11px] sm:text-xs">
                    {activeProfile.patientCode || 'Chưa cấp mã BN'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setEditingProfile(activeProfile)}
                className="w-full sm:w-auto justify-center px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-blue-200 shadow-2xs active:scale-95"
              >
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Chỉnh Sửa Thông Tin</span>
              </button>
            </div>
          </div>

          {/* Group 1: Thông tin nhân khẩu học */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Thông tin cá nhân & Nhân khẩu học</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Họ và tên</span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{activeProfile.fullName || 'Chưa cập nhật'}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trạng thái hồ sơ</span>
                <p className="text-xs sm:text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đã liên kết tài khoản</span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ngày sinh</span>
                <p className="text-xs sm:text-sm font-bold text-slate-900">{formatDateForDisplay(activeProfile.dob)}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Giới tính</span>
                <p className="text-xs sm:text-sm font-bold text-slate-900">{activeProfile.gender}</p>
              </div>
            </div>
          </div>

          {/* Group 2: Định danh & Bảo hiểm */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Giấy tờ định danh & Bảo hiểm Y tế</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số CCCD / Định danh cá nhân</span>
                <p className="text-xs sm:text-sm font-bold text-slate-900">{activeProfile.identityCard || 'Chưa cập nhật'}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mã thẻ BHYT / Bảo hiểm y tế</span>
                <p className="text-xs sm:text-sm font-bold text-slate-900">{activeProfile.insuranceCard || 'Chưa cập nhật'}</p>
              </div>
            </div>
          </div>

          {/* Group 3: Liên hệ & Địa chỉ */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Thông tin liên hệ & Nơi cư trú</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số điện thoại liên hệ</span>
                <p className="text-xs sm:text-sm font-bold text-slate-900">{activeProfile.phone || 'Chưa cập nhật'}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email nhận thông báo</span>
                <p className="text-xs sm:text-sm font-bold text-slate-900">{activeProfile.email || 'Chưa cập nhật'}</p>
              </div>

              <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Địa chỉ thường trú</span>
                <p className="text-xs sm:text-sm font-bold text-slate-900">{activeProfile.address || 'Chưa cập nhật'}</p>
              </div>
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
        hasOtherSelfProfile={false}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

