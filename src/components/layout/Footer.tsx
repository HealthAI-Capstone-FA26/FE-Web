import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/* 
 * Design Archetype: Premium Utilitarian Minimalism & Editorial UI
 * - Background color matching the main canvas (#FAF9F6)
 * - Playfair Display serif italic for section headers
 * - Crisp borders and high-contrast typography
 * - Ultra-light precise icons (strokeWidth={1.5})
 */

export const Footer = () => {
  return (
    <footer className="bg-[#FAF9F6] text-slate-600 py-20 lg:py-24 border-t border-slate-200/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
          
          {/* Logo & Description */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <Link to="/" className="flex items-center space-x-3 mb-6 group">
              <div className="bg-slate-900 text-white w-9 h-9 rounded-full flex items-center justify-center border border-slate-800 select-none group-hover:bg-slate-800 transition-colors">
                <span className="font-sans font-black text-sm tracking-tighter translate-y-[-0.5px]">4am</span>
              </div>
              <span className="font-sans font-bold text-lg text-slate-900 tracking-wide uppercase">
                Bệnh viện Đa khoa 4AM
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-md font-sans">
              Nền tảng quản lý khám chữa bệnh tích hợp AI dựa trên chuẩn FHIR R4. 
              Đồ án tốt nghiệp ứng dụng công nghệ hiện đại vào quy trình y tế thực tế tại Hệ thống Y tế 4AM.
            </p>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="font-sans font-bold text-slate-900 uppercase tracking-wider text-xs mb-6">Liên hệ</h3>
            <ul className="space-y-4 text-xs font-sans text-slate-500">
              <li className="flex items-start gap-3">
                <MapPin className="h-4.5 w-4.5 shrink-0 text-slate-400" strokeWidth={1.5} />
                <span className="leading-relaxed">2B Phổ Quang, Phường 2, Tân Bình, TP.HCM</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4.5 w-4.5 shrink-0 text-slate-400" strokeWidth={1.5} />
                <span>0287 102 6789</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4.5 w-4.5 shrink-0 text-slate-400" strokeWidth={1.5} />
                <span>cskh@bv4am.vn</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div className="lg:col-span-3">
            <h3 className="font-sans font-bold text-slate-900 uppercase tracking-wider text-xs mb-6">Liên kết</h3>
            <ul className="space-y-3 text-xs font-sans text-slate-500">
              <li>
                <a href="#" className="hover:text-slate-950 transition-colors flex items-center gap-1 group">
                  <span>Tài liệu FHIR R4 API</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-slate-950 transition-colors flex items-center gap-1 group">
                  <span>Quy trình khám bệnh 9 bước</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-slate-950 transition-colors flex items-center gap-1 group">
                  <span>Mô hình AI & Dataset</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-slate-950 transition-colors flex items-center gap-1 group">
                  <span>Chính sách bảo mật</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200/50 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono tracking-wider uppercase text-slate-400">
          <p className="mb-4 md:mb-0">&copy; 2026 Bệnh viện Đa khoa 4AM. All rights reserved.</p>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer" 
            className="hover:text-slate-800 transition-colors flex items-center gap-1 group"
          >
            <span>GitHub Repository</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </footer>
  );
};

