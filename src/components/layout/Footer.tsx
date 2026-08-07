import { Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#edf4fc] text-slate-700 py-12 border-t border-blue-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-[#0b3c8f] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-blue-900 select-none">
                <span className="font-black text-lg leading-none tracking-tighter text-center translate-y-[-1px]">mp</span>
              </div>
              <span className="font-extrabold text-xl text-[#0b3c8f] tracking-wide uppercase">Bệnh Viện Đa Khoa Mai Phương</span>
            </div>
            <p className="text-sm mb-4 max-w-md leading-relaxed text-slate-600">
              Nền tảng quản lý khám chữa bệnh tích hợp AI dựa trên chuẩn FHIR R4.
              Đồ án tốt nghiệp ứng dụng công nghệ hiện đại vào quy trình y tế thực tế tại Bệnh viện Đa khoa Mai Phương.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[#0b3c8f] font-bold mb-4 uppercase text-sm tracking-wider">Liên hệ</h3>
            <ul className="space-y-3 text-sm text-slate-600 font-medium">
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 shrink-0 text-[#0b3c8f]" />
                <span>2B Phổ Quang, Phường 2, Tân Bình, TP.HCM</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 shrink-0 text-[#0b3c8f]" />
                <span>0287 102 6789</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 shrink-0 text-[#0b3c8f]" />
                <span>cskh@bvmaiphuong.vn</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-[#0b3c8f] font-bold mb-4 uppercase text-sm tracking-wider">Liên kết</h3>
            <ul className="space-y-2 text-sm text-slate-600 font-medium">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Tài liệu FHIR R4 API</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Chi tiết Quy trình 9 bước</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Mô hình AI & Dataset</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Chính sách bảo mật</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-200/60 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 font-medium">
          <p>&copy; 2024 Mai Phương Health AI (Capstone Project). All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">GitHub Repository</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
