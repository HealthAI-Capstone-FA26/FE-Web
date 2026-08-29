// FR-HM-2.5 — Đồng ý xử lý dữ liệu (Consent & E-Signature)
// Actor: Bệnh nhân
// Trạng thái: Mock UI (chưa nối API)

import React, { useState } from 'react';
import { ShieldCheck, FileCheck, CheckCircle2, AlertTriangle, PenTool, Lock } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';

export const PatientConsentView: React.FC = () => {
  const { user } = useAuth();
  const [agreeDataTerms, setAgreeDataTerms] = useState(true);
  const [agreeAIAssist, setAgreeAIAssist] = useState(true);
  const [signatureName, setSignatureName] = useState(user?.name || 'Nguyễn Văn A');
  const [isSigned, setIsSigned] = useState(true);
  const [signedTimestamp, setSignedTimestamp] = useState('2026-08-20 09:15:22');

  const handleSignConsent = (e: React.FormEvent) => {
    e.preventDefault();
    if (agreeDataTerms && signatureName.trim()) {
      setIsSigned(true);
      const now = new Date();
      setSignedTimestamp(now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0'));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Cam Kết Đồng Ý Xử Lý Dữ Liệu Y Tế & Ứng Dụng AI
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xác nhận đồng ý lưu trữ bệnh án điện tử EMR theo tiêu chuẩn HL7 FHIR và hỗ trợ chuẩn đoán AI.
          </p>
        </div>
        <Badge variant={isSigned ? "ai" : "warning"} size="sm">
          {isSigned ? "Đã Ký Số" : "Chưa Ký"}
        </Badge>
      </div>

      {/* Status Alert Banner */}
      {isSigned ? (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-blue-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0" />
            <div>
              <p className="font-bold text-sm">Bệnh nhân đã ký thành công Văn bản cam kết điện tử!</p>
              <p className="text-xs text-blue-700">Mã chữ ký E-Sig: <span className="font-mono font-bold">ESIG-2026-90234-77A</span> • Thời gian: {signedTimestamp}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs">
            Hợp lệ & Bảo mật
          </span>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs font-bold">Vui lòng đọc kỹ các điều khoản dịch vụ y tế bên dưới và ký số xác nhận trước khi khám bệnh.</p>
        </div>
      )}

      {/* Main Terms Box */}
      <form onSubmit={handleSignConsent} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileCheck className="w-5 h-5 text-blue-700" />
          <h3 className="font-bold text-base text-slate-900">Nội Dung Văn Bản Cam Kết & Điều Khoản Y Tế</h3>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 space-y-3 max-h-60 overflow-y-auto leading-relaxed">
          <p className="font-bold text-slate-900">1. Điều khoản bảo mật & lưu trữ dữ liệu y tế (EMR):</p>
          <p>Bệnh nhân đồng ý cho Bệnh viện Đa khoa 4AM thu thập, mã hóa và lưu trữ dữ liệu bệnh án điện tử (bao gồm sinh hiệu, kết quả xét nghiệm, chẩn đoán, đơn thuốc) theo quy chuẩn an toàn HL7 FHIR R4 và các quy định pháp luật hiện hành của Bộ Y Tế.</p>
          
          <p className="font-bold text-slate-900">2. Điều khoản cho phép ứng dụng Mô-đun AI hỗ trợ chẩn đoán:</p>
          <p>Bệnh nhân đồng ý cho phép các hệ thống AI (AI01 - Tóm tắt EMR tự động và AI02 - Khoanh vùng bất thường hình ảnh y tế DICOM) xử lý dữ liệu lâm sàng của mình nhằm mục đích hỗ trợ bác sĩ đưa ra quyết định thăm khám nhanh chóng và chính xác hơn.</p>

          <p className="font-bold text-slate-900">3. Quyền riêng tư & bảo mật thông tin:</p>
          <p>Mọi thông tin cá nhân của bệnh nhân đều được bảo mật tuyệt đối, mã hóa đường truyền SSL/TLS 256-bit và không được chia sẻ cho bất kỳ bên thứ ba nào ngoài phạm vi phục vụ khám chữa bệnh tại Bệnh viện 4AM.</p>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={agreeDataTerms}
              onChange={(e) => setAgreeDataTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800">
              Tôi đã đọc, hiểu rõ và đồng ý với các điều khoản thu thập, bảo lưu và liên thông dữ liệu y tế cá nhân (HL7 FHIR R4).
            </span>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={agreeAIAssist}
              onChange={(e) => setAgreeAIAssist(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800">
              Tôi đồng ý cho phép các mô-đun AI phân tích dữ liệu lâm sàng & hình ảnh y tế hỗ trợ bác sĩ thăm khám.
            </span>
          </label>
        </div>

        {/* E-Signature Area */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-blue-700" />
            <h4 className="font-bold text-sm text-slate-900">Chữ Ký Điện Tử (E-Signature) Xác Nhận</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Họ tên người cam kết / Bệnh nhân *</label>
              <input
                type="text"
                required
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 uppercase font-bold"
              />
            </div>

            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Mẫu chữ ký điện tử giả định</span>
              <span className="font-serif italic text-xl text-blue-900 font-bold">{signatureName || 'Chữ Ký Bệnh Nhân'}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mã hóa bảo mật RSA 2048-bit</span>
          </div>

          <button
            type="submit"
            disabled={!agreeDataTerms || !signatureName.trim()}
            className={`px-6 py-2.5 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md border-none ${
              agreeDataTerms && signatureName.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSigned ? 'Cập Nhật Chữ Ký Số' : 'Xác Nhận & Ký Số Cam Kết'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
