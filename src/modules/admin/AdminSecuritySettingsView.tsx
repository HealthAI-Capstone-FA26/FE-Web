import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Clock,
  Lock,
  Smartphone,
  Save,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
  Sliders,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  securityConfigService,
  type SecurityConfig,
  type UpdateSecurityConfigDto,
} from '../../services/security-config/security-config.service';

export const AdminSecuritySettingsView: React.FC = () => {
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<SecurityConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // 1. Tải cấu hình từ Backend API
  const fetchConfig = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await securityConfigService.getConfig();
      setConfig(data);
      setOriginalConfig(data);
    } catch (err: any) {
      console.error('Lỗi khi tải cấu hình bảo mật:', err);
      showToast(err.message || 'Không thể tải cấu hình bảo mật từ máy chủ', 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // 2. Xử lý thay đổi trường dữ liệu
  const handleChange = (field: keyof SecurityConfig, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      [field]: value,
    });
  };

  // Kiểm tra có thay đổi so với bản gốc hay không
  const hasChanges = Boolean(
    config &&
      originalConfig &&
      (config.accessTokenTtlMins !== originalConfig.accessTokenTtlMins ||
        config.refreshTokenTtlHours !== originalConfig.refreshTokenTtlHours ||
        config.maxSessionHours !== originalConfig.maxSessionHours ||
        config.maxLoginAttempts !== originalConfig.maxLoginAttempts ||
        config.lockoutDurationMins !== originalConfig.lockoutDurationMins ||
        config.mfaRequired !== originalConfig.mfaRequired)
  );

  // 3. Khôi phục về giá trị đã tải từ server
  const handleReset = () => {
    if (originalConfig) {
      setConfig({ ...originalConfig });
      showToast('Đã hoàn tác các thay đổi chưa lưu', 'info');
    }
  };

  // 4. Validate & Lưu cấu hình (PATCH /admin/security-settings)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    // Client validation
    if (config.accessTokenTtlMins < 1 || config.accessTokenTtlMins > 60) {
      showToast('Thời gian sống của Access Token phải từ 1 đến 60 phút', 'error');
      return;
    }
    if (config.refreshTokenTtlHours < 1 || config.refreshTokenTtlHours > 24) {
      showToast('Thời gian sống của Refresh Token phải từ 1 đến 24 giờ', 'error');
      return;
    }
    if (config.maxSessionHours < 1 || config.maxSessionHours > 72) {
      showToast('Thời gian tối đa của phiên phải từ 1 đến 72 giờ', 'error');
      return;
    }
    if (config.maxLoginAttempts < 1 || config.maxLoginAttempts > 20) {
      showToast('Số lần đăng nhập sai tối đa phải từ 1 đến 20 lần', 'error');
      return;
    }
    if (config.lockoutDurationMins < 0 || config.lockoutDurationMins > 1440) {
      showToast('Thời gian khóa tài khoản phải từ 0 đến 1440 phút (24h)', 'error');
      return;
    }

    const payload: UpdateSecurityConfigDto = {
      accessTokenTtlMins: Number(config.accessTokenTtlMins),
      refreshTokenTtlHours: Number(config.refreshTokenTtlHours),
      maxSessionHours: Number(config.maxSessionHours),
      maxLoginAttempts: Number(config.maxLoginAttempts),
      lockoutDurationMins: Number(config.lockoutDurationMins),
      mfaRequired: Boolean(config.mfaRequired),
    };

    setIsSaving(true);
    try {
      const updated = await securityConfigService.updateConfig(payload);
      setConfig(updated);
      setOriginalConfig(updated);
      showToast('Cập nhật cấu hình bảo mật hệ thống thành công!', 'success');
    } catch (err: any) {
      console.error('Lỗi khi lưu cấu hình bảo mật:', err);
      showToast(err.message || 'Không thể lưu cấu hình bảo mật', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-200 p-8">
        <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-700">Đang tải tham số bảo mật hệ thống...</p>
        <p className="text-xs text-slate-400 mt-1">Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto my-8">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Không thể tải thông số bảo mật</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Hệ thống không thể kết nối hoặc tài khoản của bạn không có quyền truy cập thông số này.
        </p>
        <button
          onClick={() => fetchConfig()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-200 text-xs font-bold mb-2.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Chính Sách An Toàn Thông Tin & Quản Trị Phiên</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Cấu Hình Bảo Mật Hệ Thống</span>
            </h2>
            <p className="text-blue-100/80 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Thiết lập thời gian hết hạn Access/Refresh Token, chính sách khóa tài khoản chống tấn công Brute-force và quy chuẩn xác thực đa yếu tố (MFA).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fetchConfig(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md"
              title="Làm mới dữ liệu từ server"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Làm Mới</span>
            </button>
          </div>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-blue-200/80 text-[11px] block">JWT Token TTL</span>
            <span className="text-base font-extrabold text-white mt-0.5 block">
              {config.accessTokenTtlMins} phút
            </span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-blue-200/80 text-[11px] block">Refresh Token</span>
            <span className="text-base font-extrabold text-white mt-0.5 block">
              {config.refreshTokenTtlHours} giờ
            </span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-blue-200/80 text-[11px] block">Giới Hạn Thử Sai</span>
            <span className="text-base font-extrabold text-amber-300 mt-0.5 block">
              {config.maxLoginAttempts} lần
            </span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-blue-200/80 text-[11px] block">Xác Thực 2 Bước</span>
            <span
              className={`text-base font-extrabold mt-0.5 flex items-center gap-1.5 ${
                config.mfaRequired ? 'text-emerald-400' : 'text-slate-300'
              }`}
            >
              {config.mfaRequired ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Bắt buộc
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Tùy chọn
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all shadow-md animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 rounded"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 2. Main Form Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Quản lý Phiên & Token */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-5 hover:border-blue-200 transition-all">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                  Quản Lý Phiên & Token (JWT)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Kiểm soát chu kỳ sống của mã thông báo truy cập và thời hạn phiên đăng nhập
                </p>
              </div>
            </div>

            {/* Access Token TTL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Thời gian sống Access Token</span>
                  <span className="text-[10px] text-blue-600 font-extrabold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    {config.accessTokenTtlMins} Phút
                  </span>
                </label>
                <span className="text-[11px] text-slate-400 font-semibold">Chuẩn: 1 - 60 phút</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={60}
                  step={1}
                  value={config.accessTokenTtlMins}
                  onChange={(e) => handleChange('accessTokenTtlMins', Number(e.target.value))}
                  className="flex-1 accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={config.accessTokenTtlMins}
                  onChange={(e) => handleChange('accessTokenTtlMins', Number(e.target.value))}
                  className="w-20 px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Token ngắn hạn giúp giảm thiểu rủi ro khi token bị lộ. Khi hết hạn, frontend sẽ tự động làm mới bằng refresh token.
              </p>
            </div>

            {/* Refresh Token TTL */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Thời gian sống Refresh Token</span>
                  <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    {config.refreshTokenTtlHours} Giờ
                  </span>
                </label>
                <span className="text-[11px] text-slate-400 font-semibold">Chuẩn: 1 - 24 giờ</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={24}
                  step={1}
                  value={config.refreshTokenTtlHours}
                  onChange={(e) => handleChange('refreshTokenTtlHours', Number(e.target.value))}
                  className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={config.refreshTokenTtlHours}
                  onChange={(e) => handleChange('refreshTokenTtlHours', Number(e.target.value))}
                  className="w-20 px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Sau thời gian này, refresh token sẽ vô hiệu hóa và người dùng bắt buộc phải đăng nhập lại.
              </p>
            </div>

            {/* Max Session Hours */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Thời hạn tối đa phiên làm việc</span>
                  <span className="text-[10px] text-purple-600 font-extrabold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                    {config.maxSessionHours} Giờ
                  </span>
                </label>
                <span className="text-[11px] text-slate-400 font-semibold">Chuẩn: 1 - 72 giờ</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={72}
                  step={1}
                  value={config.maxSessionHours}
                  onChange={(e) => handleChange('maxSessionHours', Number(e.target.value))}
                  className="flex-1 accent-purple-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={config.maxSessionHours}
                  onChange={(e) => handleChange('maxSessionHours', Number(e.target.value))}
                  className="w-20 px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Tổng thời gian phiên làm việc tối đa cho một phiên đăng nhập liên tục của cán bộ nhân viên y tế.
              </p>
            </div>
          </div>

          {/* Card 2: Chống tấn công dò mật khẩu & Khóa tài khoản */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-5 hover:border-amber-200 transition-all">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-xs shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                  Khóa Tài Khoản & Chống Brute-Force
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Bảo vệ chống tấn công dò đoán mật khẩu tự động và thu hồi quyền đăng nhập
                </p>
              </div>
            </div>

            {/* Max Login Attempts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Số lần đăng nhập sai tối đa</span>
                  <span className="text-[10px] text-amber-700 font-extrabold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {config.maxLoginAttempts} Lần
                  </span>
                </label>
                <span className="text-[11px] text-slate-400 font-semibold">Chuẩn: 1 - 20 lần</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={config.maxLoginAttempts}
                  onChange={(e) => handleChange('maxLoginAttempts', Number(e.target.value))}
                  className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={config.maxLoginAttempts}
                  onChange={(e) => handleChange('maxLoginAttempts', Number(e.target.value))}
                  className="w-20 px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-center"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Khi người dùng nhập sai mật khẩu vượt quá ngưỡng này, tài khoản sẽ rơi vào trạng thái tạm khóa (Locked).
              </p>
            </div>

            {/* Lockout Duration Mins */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Thời gian khóa tài khoản</span>
                  <span className="text-[10px] text-rose-700 font-extrabold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    {config.lockoutDurationMins === 0 ? 'Không khóa' : `${config.lockoutDurationMins} Phút`}
                  </span>
                </label>
                <span className="text-[11px] text-slate-400 font-semibold">0 - 1440 phút (24h)</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={120}
                  step={5}
                  value={config.lockoutDurationMins}
                  onChange={(e) => handleChange('lockoutDurationMins', Number(e.target.value))}
                  className="flex-1 accent-rose-500 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
                <input
                  type="number"
                  min={0}
                  max={1440}
                  value={config.lockoutDurationMins}
                  onChange={(e) => handleChange('lockoutDurationMins', Number(e.target.value))}
                  className="w-20 px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-center"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Thời gian hệ thống từ chối mọi yêu cầu đăng nhập từ tài khoản bị khóa trước khi tự động giải phóng.
              </p>
            </div>

            {/* Info warning alert */}
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900 mt-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                Cấu hình khóa quá nghiêm ngặt (dưới 3 lần thử) có thể gây bất tiện cho người dùng quên mật khẩu. Khuyến nghị thiết lập từ 5 lần thử và khóa 15 phút.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Xác thực 2 bước (MFA / 2FA) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 hover:border-emerald-200 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    Bắt Buộc Xác Thực Đa Yếu Tố (MFA / 2FA)
                  </h3>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      config.mfaRequired
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {config.mfaRequired ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Khi kích hoạt, mọi phiên đăng nhập của nhân viên y tế và bệnh nhân bắt buộc phải vượt qua bước xác nhận mã OTP gửi qua Email hoặc SMS để bảo vệ dữ liệu bệnh án điện tử EMR.
                </p>
              </div>
            </div>

            {/* Custom Toggle Switch */}
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <button
                type="button"
                role="switch"
                aria-checked={config.mfaRequired}
                onClick={() => handleChange('mfaRequired', !config.mfaRequired)}
                className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out border ${
                  config.mfaRequired
                    ? 'bg-emerald-600 border-emerald-600'
                    : 'bg-slate-200 border-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ease-in-out flex items-center justify-center text-[10px] font-bold ${
                    config.mfaRequired ? 'translate-x-6 text-emerald-600' : 'translate-x-0 text-slate-400'
                  }`}
                >
                  {config.mfaRequired ? '✓' : '✕'}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Action Footer Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {hasChanges ? (
                <span className="text-amber-600 font-bold">
                  Bạn có thay đổi chưa được lưu vào hệ thống.
                </span>
              ) : (
                <span>Các thông số cấu hình đang đồng bộ với máy chủ Backend.</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={!hasChanges || isSaving}
              onClick={handleReset}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                hasChanges && !isSaving
                  ? 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-xs'
                  : 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hoàn Tác</span>
            </button>

            <button
              type="submit"
              disabled={isSaving || !hasChanges}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                hasChanges && !isSaving
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu Cấu Hình Bảo Mật</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
