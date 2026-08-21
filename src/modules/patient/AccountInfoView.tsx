import React, { useState } from 'react';
import { User, Mail, Phone, ShieldCheck, AlertTriangle, UserPlus, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

interface AccountInfoViewProps {
  onNavigateToProfile?: () => void;
  onNavigateToBooking?: () => void;
}

export const AccountInfoView: React.FC<AccountInfoViewProps> = ({
  onNavigateToProfile,
  onNavigateToBooking
}) => {
  const { user } = useAuth();
  
  // State simulating whether this account has an attached patient medical record
  const [hasRegisteredPatientRecord, setHasRegisteredPatientRecord] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-700" />
            <span>Thông Tin Tài Khoản Đăng Nhập</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý tài khoản truy cập trực tuyến và kiểm tra trạng thái liên kết hồ sơ khám bệnh tại Bệnh viện 4AM.
          </p>
        </div>
        <Badge variant="normal" size="sm">
          Account Status: Active
        </Badge>
      </div>

      {/* Account Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center text-blue-900 font-black text-2xl uppercase shadow-md shrink-0">
            {user?.name.charAt(0) || 'U'}
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg font-black text-slate-900">{user?.name}</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Tài khoản Online đã xác thực
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
            <p className="text-xs text-slate-600 font-bold">Số điện thoại: {user?.phone || '0902 357 872'}</p>
          </div>
        </div>

        {/* Status Box: Registered Patient Medical Record vs New Online Account */}
        {!hasRegisteredPatientRecord ? (
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-amber-950">
                  Tài khoản chưa đăng ký Hồ sơ Bệnh nhân (Mã BN) tại Bệnh viện 4AM
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Bạn hiện mới tạo **Tài khoản Đăng nhập trực tuyến**. Để có thể đặt lịch khám trực tuyến, theo dõi tiền sử y tế, nhận đơn thuốc và xem kết quả xét nghiệm, bạn cần cập nhật **Profile Bệnh nhân** chính thức.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setHasRegisteredPatientRecord(true);
                  if (onNavigateToProfile) onNavigateToProfile();
                }}
                className="px-4 py-2.5 bg-blue-600 text-white text-xs font-extrabold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm border-none cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tạo Profile Bệnh Nhân Ngay</span>
              </button>

              <button
                type="button"
                onClick={onNavigateToBooking}
                className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-extrabold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm border-none cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Đăng Ký Đặt Lịch Khám</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-extrabold text-emerald-950">
                  Đã liên kết Hồ sơ Bệnh nhân thành công
                </h4>
              </div>
              <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-lg">
                Mã BN: BN-2026-088
              </span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              Tài khoản của bạn đã được kết nối với Hồ sơ Bệnh án điện tử chính thức. Bạn có thể tra cứu đơn thuốc, tiền sử bệnh và kết quả cận lâm sàng HL7 FHIR bất cứ lúc nào.
            </p>
          </div>
        )}

        {/* Account Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email liên hệ đăng nhập</div>
            <div className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{user?.email}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số điện thoại xác thực</div>
            <div className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{user?.phone || '0902 357 872'}</span>
            </div>
          </div>
        </div>

        {/* Quick Demo Switch State Button */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => setHasRegisteredPatientRecord(!hasRegisteredPatientRecord)}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-1 cursor-pointer"
          >
            <span>[Demo Mẫu] Chuyển đổi trạng thái: {hasRegisteredPatientRecord ? 'Đã có Hồ sơ BN' : 'Chưa có Hồ sơ BN'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
