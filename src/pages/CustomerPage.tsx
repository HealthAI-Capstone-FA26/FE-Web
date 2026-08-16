import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Search, ArrowUpRight, FileText, ClipboardList, CheckCircle2, ShieldCheck, HeartPulse, HelpCircle } from 'lucide-react';

/* 
 * DESIGN READ:
 * Page Kind: Customer Portal Index (Dành cho khách hàng) for a Premium Medical Brand
 * Audience: Patients and visitors seeking guides, results lookup, and hospital information
 * Vibe: Premium, high-trust, sterile yet warm, high-end agency feel
 * Aesthetic Family: Soft Structuralism with Crisp Details (#FAF9F6 canvas, Deep Blue #0b3c8f accent, Double-Bezel cards)
 * 
 * Design Dials:
 * - DESIGN_VARIANCE: 5 (Clean geometric bento layout, rhythmic variation)
 * - MOTION_INTENSITY: 5 (Hover-active scale down, spring slide transitions, fade-up reveal on scroll)
 * - VISUAL_DENSITY: 5 (Balanced metadata, tags, icons, search & category navigation)
 */

interface CustomerService {
  id: string;
  name: string;
  image: string;
  link: string;
  category: 'lookup' | 'guide' | 'billing';
  desc: string;
  icon: React.ComponentType<any>;
  size: 'normal' | 'large';
}

const customerServicesData: CustomerService[] = [
  {
    id: "phieu-khao-sat",
    name: "Phiếu khảo sát mức độ hài lòng khách hàng",
    image: "https://tamanhhospital.vn/wp-content/uploads/2022/11/khao-sat.jpg",
    link: "https://tamanhhospital.vn/danh-cho-khach-hang/phieu-khao-sat/",
    category: "lookup",
    desc: "Ý kiến đóng góp quý báu của quý khách hàng giúp chúng tôi liên tục cải tiến và nâng cao chất lượng dịch vụ y khoa tốt hơn mỗi ngày.",
    icon: ClipboardList,
    size: "large"
  },
  {
    id: "tra-cuu-ket-qua",
    name: "Tra Cứu Kết Quả - Hồ Sơ Sức Khỏe Điện Tử",
    image: "https://tamanhhospital.vn/wp-content/uploads/2021/02/tra-cuu-kq-xet-nghiem.jpg",
    link: "https://tamanhhospital.vn/danh-cho-khach-hang/tra-cuu-ket-qua/",
    category: "lookup",
    desc: "Hệ thống bảo mật trực tuyến tối ưu giúp khách hàng chủ động tra cứu kết quả khám bệnh, lịch sử xét nghiệm và hồ sơ bệnh án mọi lúc mọi nơi.",
    icon: FileText,
    size: "large"
  },
  {
    id: "danh-muc-dich-vu",
    name: "Danh mục dịch vụ kỹ thuật Bệnh viện Đa khoa 4AM TP.HCM",
    image: "https://tamanhhospital.vn/wp-content/uploads/2022/03/huong-dan-tra-cuu-ket-qua-xet-nghiem.jpg",
    link: "https://tamanhhospital.vn/danh-cho-khach-hang/danh-muc-dich-vu-ky-tam-anh-tphcm/",
    category: "billing",
    desc: "Tra cứu danh sách các dịch vụ khám bệnh, danh mục kỹ thuật và quy trình can thiệp chuyên sâu được phê duyệt áp dụng tại bệnh viện.",
    icon: HeartPulse,
    size: "normal"
  },
  {
    id: "huong-dan-tra-cuu-kham",
    name: "Hướng dẫn tra cứu kết quả khám chữa bệnh trực tuyến",
    image: "https://tamanhhospital.vn/wp-content/uploads/2024/10/huong-dan-tra-cuu-ket-qua-kham-chua-benh-truc-tuyen.jpg",
    link: "https://tamanhhospital.vn/danh-cho-khach-hang/huong-dan-tra-cuu-ket-qua-kham-chua-benh/",
    category: "lookup",
    desc: "Các bước hướng dẫn chi tiết giúp bệnh nhân đăng nhập và tra cứu kết quả chẩn đoán hình ảnh, đơn thuốc trực tuyến nhanh chóng.",
    icon: HelpCircle,
    size: "normal"
  },
  {
    id: "huong-dan-kham",
    name: "Hướng dẫn khám bệnh tại bệnh viện",
    image: "https://tamanhhospital.vn/wp-content/uploads/2021/02/huong-dan-kham.jpg",
    link: "https://tamanhhospital.vn/danh-cho-khach-hang/huong-dan-kham-benh/",
    category: "guide",
    desc: "Cung cấp cẩm nang chi tiết về các bước đón tiếp, làm thủ tục đăng ký khám, thanh toán và hướng dẫn di chuyển giữa các khoa phòng.",
    icon: CheckCircle2,
    size: "normal"
  },
  {
    id: "dang-ky-kham",
    name: "Đăng ký khám bệnh trực tuyến nhanh",
    image: "https://tamanhhospital.vn/wp-content/uploads/2021/02/dang-ky-kham-benh.jpg",
    link: "https://tamanhhospital.vn/danh-cho-khach-hang/dat-lich-kham/",
    category: "guide",
    desc: "Chủ động chọn ngày khám, chuyên khoa và bác sĩ yêu thích giúp rút ngắn thời gian xếp hàng chờ đợi làm thủ tục tại sảnh tiếp đón.",
    icon: ClipboardList,
    size: "normal"
  },
  {
    id: "huong-dan-tra-cuu-xet-nghiem",
    name: "Hướng dẫn tra cứu kết quả xét nghiệm trực tuyến",
    image: "https://tamanhhospital.vn/wp-content/uploads/2022/03/huong-dan-tra-cuu-ket-qua-xet-nghiem.jpg",
    link: "https://tamanhhospital.vn/danh-cho-khach-hang/huong-dan-tra-cuu-ket-qua-xet-nghiem/",
    category: "lookup",
    desc: "Hướng dẫn kích hoạt tài khoản định danh để tải về các kết quả xét nghiệm máu, xét nghiệm sinh hóa và nước tiểu trực tuyến an toàn.",
    icon: HelpCircle,
    size: "normal"
  },
  {
    id: "quy-trinh-ngoai-tru",
    name: "Quy trình khám và điều trị ngoại trú",
    image: "https://tamanhhospital.vn/wp-content/uploads/2021/02/huong-dan-kh-noi-tru.jpg",
    link: "https://tamanhhospital.vn/danh-cho-khach-hang/quy-trinh-kham-benh-ngoai-tru/",
    category: "guide",
    desc: "Quy trình chuẩn hóa 5 bước khép kín giúp tối ưu hóa thời gian khám, tư vấn chuyên khoa và cấp phát thuốc bảo hiểm y tế thuận tiện nhất.",
    icon: CheckCircle2,
    size: "normal"
  },
  {
    id: "dieu-tri-noi-tru",
    name: "Hướng dẫn khách hàng điều trị nội trú",
    image: "https://tamanhhospital.vn/wp-content/uploads/2021/02/kham-noi-tru.jpg",
    link: "https://tamanhhospital.vn/danh-cho-khach-hang/huong-dan-khach-hang-dieu-tri-noi-tru/",
    category: "guide",
    desc: "Thông tin cần thiết về tiện nghi buồng bệnh, quy định giờ giấc sinh hoạt, chế độ dinh dưỡng cá thể hóa và thủ tục chuẩn bị điều trị nội trú.",
    icon: HeartPulse,
    size: "large"
  },
  {
    id: "thanh-toan-bao-hiem",
    name: "Hướng dẫn thanh toán bảo hiểm bảo lãnh",
    image: "https://tamanhhospital.vn/wp-content/uploads/2021/02/thanh-toan-bao-hiem.jpg",
    link: "https://tamanhhospital.vn/danh-cho-khach-hang/huong-dan-thanh-toan-bao-hiem/",
    category: "billing",
    desc: "Quy trình bảo lãnh viện phí trực tiếp giúp tối giản thủ tục giấy tờ hành chính và tiết kiệm tối đa thời gian thanh toán cho bệnh nhân.",
    icon: ShieldCheck,
    size: "normal"
  },
  {
    id: "thu-tuc-xuat-nhap-vien",
    name: "Thủ tục nhập viện và xuất viện",
    image: "https://tamanhhospital.vn/wp-content/uploads/2021/02/thu-tuc-xuat-nhap-vien.jpg",
    link: "https://tamanhhospital.vn/danh-cho-khach-hang/thu-tuc-xuat-nhap-vien/",
    category: "billing",
    desc: "Hướng dẫn chuẩn bị hồ sơ hành chính, thẻ bảo hiểm, nộp tạm ứng viện phí và các bước tất toán hồ sơ ra viện nhanh chóng.",
    icon: FileText,
    size: "normal"
  },
  {
    id: "khach-tham-benh",
    name: "Thông tin cho khách thăm bệnh",
    image: "https://tamanhhospital.vn/wp-content/uploads/2021/02/huong-dan-tham-benh.jpg",
    link: "https://tamanhhospital.vn/danh-cho-khach-hang/thong-tin-cho-khach-tham-benh/",
    category: "guide",
    desc: "Quy định chi tiết về khung giờ thăm người bệnh, an ninh ra vào buồng bệnh và kiểm soát nhiễm khuẩn nhằm bảo vệ sức khỏe cho bệnh nhân.",
    icon: CheckCircle2,
    size: "normal"
  },
  {
    id: "bang-gia-dich-vu",
    name: "Bảng giá dịch vụ khám chữa bệnh Bệnh viện Đa khoa 4AM",
    image: "https://tamanhhospital.vn/wp-content/uploads/2021/02/bang-gia.jpg",
    link: "https://tamanhhospital.vn/danh-cho-khach-hang/bang-gia/",
    category: "billing",
    desc: "Minh bạch công khai bảng giá các dịch vụ khám chuyên khoa, xét nghiệm, chẩn đoán hình ảnh và ngày giường điều trị nội trú tại bệnh viện.",
    icon: FileText,
    size: "normal"
  }
];



const categoryFilters = [
  { id: 'all', label: 'Tất cả dịch vụ' },
  { id: 'lookup', label: 'Tra cứu & Khảo sát' },
  { id: 'guide', label: 'Hướng dẫn khám bệnh' },
  { id: 'billing', label: 'Dịch vụ & Viện phí' }
];

export const CustomerPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredServices = useMemo(() => {
    return customerServicesData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.desc.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-12 lg:pt-20 lg:pb-16 bg-gradient-to-b from-blue-50/30 to-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0b3c8f] mb-3 block">
              Cổng thông tin & Tiện ích người bệnh
            </span>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0d2a5c] uppercase tracking-tight leading-[1.05] mb-6">
              Dành cho khách hàng
            </h1>
            
            <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-[65ch] mx-auto mb-8 font-sans">
              Bệnh viện Đa khoa 4AM cung cấp đầy đủ thông tin hướng dẫn, biểu mẫu khảo sát, quy trình khám chữa bệnh trực tuyến và nội ngoại trú giúp quý khách trải nghiệm dịch vụ tiện lợi nhất.
            </p>

            {/* Smart Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-0 bg-[#0b3c8f]/5 rounded-full blur-md opacity-50"></div>
              <div className="relative flex items-center bg-white border border-slate-200 shadow-sm rounded-full px-5 py-3.5 focus-within:border-[#0b3c8f] focus-within:ring-2 focus-within:ring-[#0b3c8f]/10 transition-all duration-300">
                <Search className="w-5 h-5 text-slate-400 mr-3" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Tìm kiếm hướng dẫn, biểu mẫu hoặc tiện ích..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent border-none outline-none focus:ring-0"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Filter Section */}
      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2 border-b border-slate-200/60 pb-6">
            {categoryFilters.map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-4 py-2 text-xs md:text-[13px] font-bold rounded-full transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'bg-[#0b3c8f] text-white shadow-sm' 
                      : 'bg-white text-slate-600 hover:text-[#0b3c8f] border border-slate-200/50 hover:border-[#0b3c8f]/20'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bento Grid Content */}
      <main className="flex-grow max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <AnimatePresence mode="wait">
          {filteredServices.length > 0 ? (
            <motion.div 
              key={selectedCategory + '-' + searchTerm}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredServices.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    className="relative group rounded-3xl p-1 bg-white border border-slate-200/50 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#0b3c8f]/20 w-full"
                  >
                    {/* Double-Bezel Inner Shell */}
                    <div className="bg-[#FAF9F6] rounded-[1.375rem] overflow-hidden flex flex-col h-full border border-white relative">
                      
                      {/* Image Frame */}
                      <div className="relative overflow-hidden aspect-[16/10] bg-slate-100 shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                        
                        {/* Category Tag */}
                        <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-[#0b3c8f] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                          {item.category === 'lookup' ? 'Tra cứu' : item.category === 'guide' ? 'Hướng dẫn' : 'Viện phí'}
                        </span>

                        {/* Top-Right Floating Icon representing clickability */}
                        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <ArrowUpRight className="w-4 h-4 text-[#0b3c8f]" />
                        </div>
                      </div>

                      {/* Info Content */}
                      <div className="p-6 flex flex-col flex-grow justify-between">
                        <div>
                          {/* Title with Icon */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0b3c8f] shrink-0 mt-0.5">
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm md:text-base leading-snug group-hover:text-[#0b3c8f] transition-colors line-clamp-2">
                              {item.name}
                            </h3>
                          </div>

                          <p className="text-slate-500 text-xs md:text-[13px] leading-relaxed line-clamp-3 mb-6 font-sans">
                            {item.desc}
                          </p>
                        </div>

                        {/* Custom Double-Bezel Button CTA */}
                        <div className="pt-2 flex justify-end">
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold text-[10px] uppercase tracking-wider pl-4 pr-1.5 py-1.5 hover:from-[#0b3c8f] hover:to-[#0d2a5c] transition-all duration-300 group active:scale-[0.98] shadow-sm cursor-pointer"
                          >
                            <span>Chi tiết dịch vụ</span>
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[0.5px] transition-transform duration-300">
                              <ArrowUpRight className="w-3 h-3 text-white" strokeWidth={2} />
                            </div>
                          </a>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 bg-white border border-slate-200/50 rounded-2xl p-8"
            >
              <p className="text-slate-400 text-sm mb-4 font-mono">0 kết quả tìm thấy</p>
              <h4 className="text-lg font-bold text-slate-700 uppercase mb-2">Không tìm thấy tiện ích</h4>
              <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                Rất tiếc, chúng tôi không tìm thấy tiện ích phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;. Vui lòng thử tìm kiếm lại bằng một từ khóa khác.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>



      <Footer />
    </div>
  );
};
