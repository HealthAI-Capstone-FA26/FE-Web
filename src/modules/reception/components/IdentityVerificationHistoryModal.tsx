import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  UserCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  CreditCard,
  Baby,
  Phone,
  FileCheck2,
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Badge } from '../../../components/common/Badge';
import {
  encounterService,
  type IdentityVerificationLog,
  type VerificationMethod,
  type VerificationStatus,
} from '../../../services/encounter/encounter.service';

interface IdentityVerificationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  encounterId: string | null;
  patientName?: string;
  encounterCode?: string;
  onVerificationCreated?: () => void;
}

export const IdentityVerificationHistoryModal: React.FC<IdentityVerificationHistoryModalProps> = ({
  isOpen,
  onClose,
  encounterId,
  patientName,
  encounterCode,
  onVerificationCreated,
}) => {
  const [logs, setLogs] = useState<IdentityVerificationLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form xác minh bổ sung / đối chiếu lại (Re-verify)
  const [isReverifying, setIsReverifying] = useState<boolean>(false);
  const [method, setMethod] = useState<VerificationMethod>('national_id_card');
  const [status, setStatus] = useState<VerificationStatus>('verified');
  const [mismatchNotes, setMismatchNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchHistory = useCallback(async () => {
    if (!encounterId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await encounterService.getIdentityVerifications(encounterId);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Lỗi khi tải lịch sử xác minh danh tính:', err);
      setErrorMessage(err.message || 'Không thể tải lịch sử xác minh danh tính');
    } finally {
      setIsLoading(false);
    }
  }, [encounterId]);

  useEffect(() => {
    if (isOpen && encounterId) {
      fetchHistory();
      setIsReverifying(false);
      setMismatchNotes('');
    } else {
      setLogs([]);
    }
  }, [isOpen, encounterId, fetchHistory]);

  const handleCreateVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encounterId) return;

    if (status === 'failed' && !mismatchNotes.trim()) {
      setErrorMessage('Vui lòng nhập lý do không khớp khi xác minh thất bại');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Cách 1: Ánh xạ 'health_insurance_card' (21 ký tự) sang 'manual' (6 ký tự)
      // kèm tag '[BHYT/VssID]' trong ghi chú để không vượt quá VARCHAR(20) của DB
      const isBhyt = method === 'health_insurance_card';
      const apiMethod = isBhyt ? 'manual' : method;
      const prefix = isBhyt ? '[BHYT/VssID]' : '';
      const finalNotes = prefix
        ? (mismatchNotes.trim() ? `${prefix} ${mismatchNotes.trim()}` : prefix)
        : (mismatchNotes.trim() || undefined);

      await encounterService.recordIdentityVerification(encounterId, {
        verificationMethod: apiMethod,
        verificationStatus: status,
        mismatchNotes: finalNotes,
      });
      setIsReverifying(false);
      setMismatchNotes('');
      await fetchHistory();
      if (onVerificationCreated) {
        onVerificationCreated();
      }
    } catch (err: any) {
      console.error('Lỗi khi ghi nhận xác minh:', err);
      setErrorMessage(err.message || 'Không thể ghi nhận log xác minh danh tính');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getMethodBadge = (m: string, notes?: string | null) => {
    const isBhyt = m === 'health_insurance_card' || (notes && notes.includes('[BHYT/VssID]'));
    if (isBhyt) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Thẻ BHYT / VssID</span>
        </span>
      );
    }

    switch (m) {
      case 'national_id_card':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>CCCD gắn chip / CMND</span>
          </span>
        );
      case 'patient_card':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
            <span>Thẻ bệnh nhân viện</span>
          </span>
        );
      case 'phone_otp':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Phone className="w-3.5 h-3.5 text-amber-600" />
            <span>OTP Số điện thoại</span>
          </span>
        );
      case 'manual':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <Baby className="w-3.5 h-3.5 text-teal-600" />
            <span>Giấy khai sinh / Thủ công</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
            {m}
          </span>
        );
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'verified':
        return (
          <Badge variant="success" size="sm">
            Đã xác thực hợp lệ
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="critical" size="sm">
            Không khớp / Thất bại
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" size="sm">
            Đang chờ xử lý
          </Badge>
        );
      default:
        return <Badge variant="neutral" size="sm">{s}</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lịch Sử Xác Minh Danh Tính Ca Khám"
      subtitle={
        patientName
          ? `Bệnh nhân: ${patientName}${encounterCode ? ` • Lượt khám: ${encounterCode}` : ''}`
          : 'Nhật ký các lần đối chiếu giấy tờ và nhận diện tại bệnh viện'
      }
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={fetchHistory}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <div className="flex items-center gap-2">
            {!isReverifying && (
              <button
                type="button"
                onClick={() => setIsReverifying(true)}
                className="px-4 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Thực hiện xác minh lại</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Khung form xác minh bổ sung / re-verify */}
        {isReverifying && (
          <form
            onSubmit={handleCreateVerification}
            className="p-4 bg-teal-50/60 border border-teal-200/90 rounded-2xl space-y-3 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-teal-900 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Ghi nhận lần xác minh bổ sung / đối chiếu lại:</span>
              </span>
              <button
                type="button"
                onClick={() => setIsReverifying(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Phương thức đối chiếu:</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as VerificationMethod)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="national_id_card">CCCD gắn chip / CMND</option>
                  <option value="health_insurance_card">Thẻ BHYT / Ứng dụng VssID</option>
                  <option value="patient_card">Thẻ khám bệnh viện</option>
                  <option value="manual">Giấy khai sinh / Đối chiếu thủ công</option>
                  <option value="phone_otp">OTP số điện thoại</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kết quả đối chiếu:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as VerificationStatus)}
                  className={`w-full p-2 bg-white border rounded-xl font-bold focus:outline-none ${
                    status === 'verified'
                      ? 'border-emerald-300 text-emerald-800'
                      : 'border-rose-300 text-rose-800'
                  }`}
                >
                  <option value="verified">✓ Đã xác thực hợp lệ (verified)</option>
                  <option value="failed">✕ Không khớp / Thất bại (failed)</option>
                  <option value="pending">⏳ Đang chờ xác minh (pending)</option>
                </select>
              </div>
            </div>

            {status === 'failed' && (
              <div>
                <label className="font-bold text-rose-700 block mb-1">
                  Lý do không khớp / Nghi ngờ sai lệch giấy tờ: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={mismatchNotes}
                  onChange={(e) => setMismatchNotes(e.target.value)}
                  placeholder="Ví dụ: Ảnh khuôn mặt không khớp ảnh CCCD, Số CCCD sai 1 số..."
                  className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5" />
                )}
                <span>Lưu kết quả xác minh</span>
              </button>
            </div>
          </form>
        )}

        {/* Danh sách các lần xác minh */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            <p className="text-xs font-medium">Đang tải lịch sử xác minh...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-1">
            <ShieldAlert className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 text-xs">Chưa có lịch sử xác minh danh tính</p>
            <p className="text-[11px]">
              Lượt khám này chưa được ghi nhận lần đối chiếu giấy tờ nào tại quầy tiếp nhận.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
              <span>TỔNG CỘNG: {logs.length} LẦN ĐỐI CHIẾU</span>
              <span className="italic text-slate-400">Sắp xếp: Mới nhất trước</span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {logs.map((log, index) => (
                <div
                  key={log.verificationId || index}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    log.verificationStatus === 'verified'
                      ? 'bg-white border-slate-200/90 hover:border-emerald-200'
                      : 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getMethodBadge(log.verificationMethod, log.mismatchNotes)}
                      {getStatusBadge(log.verificationStatus)}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateTime(log.verifiedAt)}</span>
                    </div>
                  </div>

                  {/* Thông tin nhân viên & ghi chú */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <div className="text-slate-500 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Nhân viên xác minh:</span>
                      <strong className="text-slate-700">
                        {log.verifiedByUser?.fullName || 'Nhân viên quầy tiếp nhận'}
                      </strong>
                    </div>

                    {(() => {
                      const cleanNote = log.mismatchNotes?.replace(/\[BHYT\/VssID\]\s*/g, '').trim();
                      if (!cleanNote) return null;
                      return (
                        <div className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 font-medium">
                          <strong>Ghi chú:</strong> {cleanNote}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
