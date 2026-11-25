import React from 'react';
import { QrCode, Download, MessageCircle, CheckCircle2, Smartphone } from 'lucide-react';

/**
 * Hiển thị mã QR của Zalo Bot (Bot Healthcare AI) và hướng dẫn bệnh nhân liên kết SĐT
 * để nhận phiếu thông tin lượt khám PDF tự động sau khi kết thúc khám.
 */
export const ZaloBotQrPanel: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-cyan-50/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Mã QR Zalo Bot — Nhận Phiếu Khám Tự Động
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Bot Healthcare AI · Hướng dẫn bệnh nhân quét mã để liên kết số điện thoại
              </p>
            </div>
          </div>

          <a
            href="/images/zalo-bot-qr.png"
            download="zalo-bot-healthcare-ai-qr.png"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Tải ảnh QR</span>
          </a>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* QR Image Card */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
              <img
                src="/images/zalo-bot-qr.png"
                alt="Mã QR Zalo Bot Healthcare AI"
                className="w-64 h-64 object-contain rounded-xl"
              />
            </div>
            <span className="mt-3 text-xs font-extrabold text-blue-700 tracking-wide uppercase">
              Bot Healthcare AI
            </span>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Hướng dẫn bệnh nhân thực hiện (3 bước)
            </h4>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                <Smartphone className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-extrabold text-slate-900">Bước 1:</span> Mở ứng dụng{' '}
                  <span className="font-bold text-blue-700">Zalo</span> trên điện thoại và quét mã QR bên cạnh.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-cyan-50/60 border border-cyan-100">
                <MessageCircle className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-extrabold text-slate-900">Bước 2:</span> Nhắn{' '}
                  <span className="font-bold text-cyan-800">số điện thoại đã đăng ký khám</span> (ví dụ:{' '}
                  <code className="px-1.5 py-0.5 rounded bg-white border border-cyan-200 font-mono text-[11px]">
                    0912345678
                  </code>
                  ) vào khung chat với Bot để hệ thống liên kết hồ sơ.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-extrabold text-slate-900">Bước 3:</span> Sau khi bác sĩ bấm{' '}
                  <span className="font-bold text-emerald-800">Hoàn tất &amp; Đóng ca khám</span>, phiếu thông tin
                  lượt khám PDF sẽ tự động được gửi qua Zalo này.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
