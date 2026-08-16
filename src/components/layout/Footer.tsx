import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/* 
 * Design Archetype: Premium Utilitarian Minimalism & Editorial UI
 * - Dark Theme: Deep Slate Navy (#071324) base with video background
 * - Overlay: bg-[#071324]/92 backdrop-blur-[3px]
 * - Crisp light-slate text and high-contrast white accents
 * - Ultra-light precise icons (strokeWidth={1.5})
 */

export const Footer = () => {
  return (
    <footer className="relative text-slate-300 py-20 lg:py-24 border-t border-slate-800/50 bg-black overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085844_21a8f4b3-dea5-4ede-be16-d53f6973bb14.mp4"
        />
        {/* Gradient Overlay for high text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">

          {/* Logo & Description */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <Link to="/" className="flex items-center space-x-3 mb-6 group">
              <div className="w-20 h-20 flex items-center justify-center select-none overflow-hidden rounded-full border border-slate-800 bg-[#071324] p-1 shadow-sm group-hover:border-slate-400 transition-all">
                <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-sans font-bold text-lg text-white tracking-wide uppercase">
                Bệnh viện Đa khoa 4AM
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md font-sans">
              Nền tảng quản lý khám chữa bệnh tích hợp AI dựa trên chuẩn FHIR R4.
              Đồ án tốt nghiệp ứng dụng công nghệ hiện đại vào quy trình y tế thực tế tại Hệ thống Y tế 4AM.
            </p>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="font-sans font-bold text-white uppercase tracking-wider text-xs mb-6">Liên hệ</h3>
            <ul className="space-y-4 text-xs font-sans text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="h-4.5 w-4.5 shrink-0 text-slate-500" strokeWidth={1.5} />
                <span className="leading-relaxed">2B Phổ Quang, Phường 2, Tân Bình, TP.HCM</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4.5 w-4.5 shrink-0 text-slate-500" strokeWidth={1.5} />
                <span>0287 102 6789</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4.5 w-4.5 shrink-0 text-slate-500" strokeWidth={1.5} />
                <span>cskh@bv4am.vn</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div className="lg:col-span-3">
            <h3 className="font-sans font-bold text-white uppercase tracking-wider text-xs mb-6">Liên kết</h3>
            <ul className="space-y-3 text-xs font-sans text-slate-400">
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span>Tài liệu FHIR R4 API</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span>Quy trình khám bệnh 9 bước</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span>Mô hình AI & Dataset</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center gap-1 group">
                  <span>Chính sách bảo mật</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/60 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono tracking-wider uppercase text-slate-500">
          <p className="mb-4 md:mb-0">&copy; 2026 Bệnh viện Đa khoa 4AM. All rights reserved.</p>

        </div>
      </div>
    </footer>
  );
};
