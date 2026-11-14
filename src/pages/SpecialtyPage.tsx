import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Search, ArrowUpRight,UserCheck, Stethoscope, Activity } from 'lucide-react';

/* 
 * DESIGN READ:
 * Page Kind: Specialty Index (Chuyên khoa) for a Premium Medical Brand
 * Audience: Healthcare consumers seeking world-class medical services
 * Vibe: Premium, high-trust, sterile yet warm, high-end agency feel
 * Aesthetic Family: Soft Structuralism with Crisp Details (#FAF9F6 canvas, Deep Blue #0b3c8f accent, Double-Bezel cards)
 * 
 * Design Dials:
 * - DESIGN_VARIANCE: 5 (Clean geometric bento layout, rhythmic variation)
 * - MOTION_INTENSITY: 6 (Hover-active scale down, spring slide transitions, fade-up reveal on scroll)
 * - VISUAL_DENSITY: 5 (Balanced metadata, tags, icons, search & category navigation)
 */

interface Specialty {
  id: string;
  name: string;
  slug: string;
  icon: string;
  category: 'clinical' | 'arrhythmia' | 'diagnostics' | 'preventive';
  desc: string;
  doctorCount: number;
  featuredDoctor: string;
  stat: string;
  statLabel: string;
  highlight: string;
  size?: 'normal' | 'large';
}

const specialtiesData: Specialty[] = [
  {
    id: "hypertension-coronary",
    name: "Khoa Khám & Điều Trị Tăng Huyết Áp - Mạch Vành",
    slug: "tang-huyet-ap-mach-vanh",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2026/07/icon-trung-tam-phau-thuat-tim-mach-mau-va-long-nguc.png",
    category: "clinical",
    desc: "Tầm soát chuyên sâu và điều trị cá thể hóa các bệnh lý tăng huyết áp kháng trị, thiếu máu cơ tim cục bộ, cơn đau thắt ngực và dự phòng nhồi máu cơ tim sớm.",
    doctorCount: 8,
    featuredDoctor: "BS.CKII. Nguyễn Quang Huy",
    stat: "98.5%",
    statLabel: "Kiểm soát huyết áp đạt mục tiêu",
    highlight: "Đo Holter huyết áp 24h & Theo dõi liên tục",
    size: "large"
  },
  {
    id: "arrhythmia-electrophysiology",
    name: "Trung Tâm Thăm Dò & Điều Trị Rối Loạn Nhịp Tim",
    slug: "roi-loan-nhip-tim-dien-sinh-ly",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2020/12/khoa-noithankinh.png",
    category: "arrhythmia",
    desc: "Chẩn đoán chính xác các rối loạn nhịp nguy hiểm như rung nhĩ (AFib), ngoại tâm thu thất (PVC), nhịp nhanh kịch phát trên thất, nhịp tim chậm và block dẫn truyền nhĩ thất.",
    doctorCount: 6,
    featuredDoctor: "ThS.BS. Trương Lê Danh Thái",
    stat: "12-Leads",
    statLabel: "Điện tâm đồ kỹ thuật số độ nhạy cao",
    highlight: "Hệ thống điện tâm đồ ECG & Phân tích chuyên sâu",
    size: "large"
  },
  {
    id: "echocardiography-imaging",
    name: "Đơn Vị Chẩn Đoán Hình Ảnh & Siêu Âm Tim Doppler",
    slug: "sieu-am-tim-doppler-cdha",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2024/02/trung-tam-mat-cong-nghe-cao.png",
    category: "diagnostics",
    desc: "Đánh giá chi tiết hình thái cấu trúc tim, vận động thành tim, chức năng tống máu thất trái (EF), chẩn đoán hẹp/hở van tim và các tổn thương mạch máu lớn.",
    doctorCount: 5,
    featuredDoctor: "BS.CKI. Phạm Đức Anh",
    stat: "0.1mm",
    statLabel: "Độ phân giải siêu âm Doppler màu",
    highlight: "Máy siêu âm tim màu 4D đa bình diện",
    size: "normal"
  },
  {
    id: "heart-failure-management",
    name: "Trung Tâm Quản Lý & Tối Ưu Hóa Điều Trị Suy Tim",
    slug: "quan-ly-suy-tim-toan-dien",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2026/07/icon-trung-tam-phau-thuat-tim-mach-mau-va-long-nguc.png",
    category: "clinical",
    desc: "Chương trình quản lý suy tim ngoại trú toàn diện từ giai đoạn sớm đến suy tim mạn tính. Ứng dụng phác đồ tứ trụ chuẩn quốc tế nhằm cải thiện chất lượng sống và giảm tỷ lệ tái nhập viện.",
    doctorCount: 7,
    featuredDoctor: "BS.CKII. Nguyễn Quang Huy",
    stat: "75%",
    statLabel: "Giảm tỷ lệ nhập viện do suy tim",
    highlight: "Xét nghiệm định lượng men tim NT-proBNP & Troponin T",
    size: "large"
  },
  {
    id: "cardiac-biomarkers-lab",
    name: "Đơn Vị Xét Nghiệm Dấu Ấn Sinh Học Tim Mạch",
    slug: "xet-nghiem-dau-an-tim-mach",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-khoa-xa-tri-khoa-hoc-hat-nhan.png",
    category: "diagnostics",
    desc: "Thực hiện xét nghiệm sinh hóa tim mạch khẩn cấp: hs-Troponin T/I siêu nhạy phát hiện hoại tử cơ tim sớm, CK-MB, điện giải đồ, chức năng thận và công thức máu toàn phần.",
    doctorCount: 4,
    featuredDoctor: "KTV. Trương Lê Danh Thái",
    stat: "< 60 phút",
    statLabel: "Thời gian trả kết quả xét nghiệm khẩn",
    highlight: "Hệ thống xét nghiệm miễn dịch tự động chuẩn ISO",
    size: "normal"
  },
  {
    id: "dyslipidemia-metabolic",
    name: "Khoa Tim Mạch Chuyển Hóa & Rối Loạn Lipid Máu",
    slug: "tim-mach-chuyen-hoa-lipid",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2024/09/trung-tam-kiem-soat-can-nang-va-dieu-tri-beo-phi.png",
    category: "clinical",
    desc: "Kiểm soát các yếu tố nguy cơ tim mạch xơ vữa do rối loạn mỡ máu (Tăng Cholesterol, Triglyceride, LDL-C cao), hội chứng chuyển hóa và đái tháo đường đi kèm.",
    doctorCount: 5,
    featuredDoctor: "BS.CKI. Nguyễn Văn Tim",
    stat: "10 năm",
    statLabel: "Đánh giá thang điểm nguy cơ tim mạch",
    highlight: "Bộ xét nghiệm Lipid toàn phần & Tư vấn dinh dưỡng tim mạch",
    size: "normal"
  },
  {
    id: "preventive-cardiology",
    name: "Trung Tâm Tim Mạch Dự Phòng & Tầm Soát Đột Quỵ",
    slug: "tim-mach-du-phong-tam-soat",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2022/02/logo-tieu-hoa-gan-mat-f.png",
    category: "preventive",
    desc: "Gói khám tầm soát sức khỏe tim mạch định kỳ, đánh giá nguy cơ đột quỵ não từ nguyên nhân tim mạch, tầm soát huyết khối và kiểm tra tim mạch cho người chơi thể thao.",
    doctorCount: 6,
    featuredDoctor: "BS.CKII. Nguyễn Quang Huy",
    stat: "100%",
    statLabel: "Khách hàng được lập hồ sơ theo dõi dài hạn",
    highlight: "Gói khám cá thể hóa theo độ tuổi và tiền sử gia đình",
    size: "large"
  },
  {
    id: "cardiac-rehabilitation",
    name: "Đơn Vị Phục Hồi Chức Năng Tim Mạch & Lối Sống",
    slug: "phuc-hoi-chuc-nang-tim-mach",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2023/04/icon-ngoaitonghop.png",
    category: "preventive",
    desc: "Hướng dẫn tập luyện vận động an toàn, cải thiện dung nạp gắng sức, tư vấn điều chỉnh lối sống và kiểm soát căng thẳng tâm lý sau cơn nhồi máu cơ tim hoặc can thiệp.",
    doctorCount: 4,
    featuredDoctor: "ThS.BS. Trương Lê Danh Thái",
    stat: "90%",
    statLabel: "Bệnh nhân cải thiện khả năng gắng sức",
    highlight: "Theo dõi nhịp tim & huyết áp liên tục trong tập luyện",
    size: "normal"
  }
];

const insurancePartners = [
  { name: "Bảo hiểm Bảo Việt", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-bhdbv-e1760583019785.png" },
  { name: "Pacific Cross", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-pacific-cross.png" },
  { name: "Generali", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-generali.png" },
  { name: "Dai-ichi Life", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-dai-ichi-life.png" },
  { name: "Bảo Minh", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-bao-minh.png" },
  { name: "Azinsu", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-azinsu.png" },
  { name: "GIC", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-gic.png" },
  { name: "Bảo hiểm BIC", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-bao-hiem-bic.png" },
  { name: "Papaya", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-papaya.png" },
  { name: "MIC", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-mic.png" },
  { name: "Euro Center", logo: "https://tamanhhospital.vn/wp-content/uploads/2026/08/Euro-Center.png" },
  { name: "PTI", logo: "https://tamanhhospital.vn/wp-content/uploads/2026/08/Logo-PTI.png" },
  { name: "AIA", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-aia.png" },
  { name: "VietinBank Insurance", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-vietinbank.png" },
  { name: "PJICO", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-pjico.png" },
  { name: "Insmart", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/lo-go-insmart.png" },
  { name: "Fullerton Health", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-fullerton.png" },
  { name: "ATACC", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-atacc.png" },
  { name: "Assurance", logo: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-assurance.png" }
];

const categoryFilters = [
  { id: 'all', label: 'Tất cả chuyên khoa' },
  { id: 'clinical', label: 'Nội Tim Mạch & Huyết Áp' },
  { id: 'arrhythmia', label: 'Rối Loạn Nhịp & Điện Sinh Lý' },
  { id: 'diagnostics', label: 'Chẩn Đoán Hình Ảnh & Thăm Dò' },
  { id: 'preventive', label: 'Tim Mạch Dự Phòng' }
];

export const SpecialtyPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredSpecialties = useMemo(() => {
    return specialtiesData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.featuredDoctor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      <Header />
      
      {/* Hero Section - Max top padding of pt-24 at desktop to keep header balanced */}
      <section className="relative pt-16 pb-12 lg:pt-20 lg:pb-16 bg-gradient-to-b from-blue-50/30 to-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tag/Eyebrow Restraint (Only 1 on page to avoid generic feel) */}
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0b3c8f] mb-3 block">
              Hệ thống chuyên khoa mũi nhọn
            </span>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0d2a5c] uppercase tracking-tight leading-[1.05] mb-6">
              Danh sách chuyên khoa
            </h1>
            
            <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-[65ch] mx-auto mb-8 font-sans">
              Quy tụ các trung tâm y khoa kỹ thuật cao và mũi nhọn hàng đầu đạt chuẩn quốc tế, mang lại hiệu quả điều trị vượt trội.
            </p>

            {/* Smart Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-0 bg-[#0b3c8f]/5 rounded-full blur-md opacity-50"></div>
              <div className="relative flex items-center bg-white border border-slate-200 shadow-sm rounded-full px-5 py-3.5 focus-within:border-[#0b3c8f] focus-within:ring-2 focus-within:ring-[#0b3c8f]/10 transition-all duration-300">
                <Search className="w-5 h-5 text-slate-400 mr-3" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Tìm chuyên khoa, bác sĩ hoặc bệnh lý..."
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

      {/* Category Tabs Section */}
      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2 border-b border-slate-200/60 pb-6">
            {categoryFilters.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`relative px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95 ${
                  selectedCategory === tab.id
                    ? 'bg-[#0b3c8f] text-white shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties Uniform Grid */}
      <main className="flex-grow pb-24 max-w-7xl mx-auto px-6 lg:px-8 w-full">
        <AnimatePresence mode="wait">
          {filteredSpecialties.length > 0 ? (
            <motion.div 
              key={selectedCategory + searchTerm}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
            >
              {filteredSpecialties.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="group flex flex-col h-full"
                  >
                    {/* Double-Bezel Architecture */}
                    {/* Outer Shell (Hardware tray look) */}
                    <div className="h-full bg-slate-100/50 hover:bg-[#0b3c8f]/5 border border-slate-200/50 p-2.5 rounded-[2rem] transition-colors duration-500 flex flex-col">
                      
                      {/* Inner Core (Concentric curves, padding, inside shadow highlight) */}
                      <div className="h-full bg-white p-6 md:p-8 rounded-[calc(2rem-0.625rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-sm border border-slate-200/10 flex flex-col justify-between">
                        <div>
                          
                          {/* Top row: Icon + Stat */}
                          <div className="flex items-start justify-between mb-6 gap-4">
                            {/* Department Icon wrapper */}
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center p-2.5 border border-slate-100 group-hover:scale-105 group-hover:border-blue-100 transition-all duration-300 shrink-0">
                              <img 
                                src={item.icon} 
                                alt={item.name} 
                                className="w-full h-full object-contain filter drop-shadow-sm" 
                              />
                            </div>
                            
                            {/* Mini highlight stat card inside the cell */}
                            <div className="text-right shrink-0">
                              <span className="text-lg md:text-xl font-bold text-[#0b3c8f] tracking-tight block">
                                {item.stat}
                              </span>
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-medium max-w-[140px] ml-auto">
                                {item.statLabel}
                              </span>
                            </div>
                          </div>

                          {/* Category Badge */}
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[8px] uppercase tracking-wider font-bold mb-3 ${
                            item.category === 'clinical' ? 'bg-[#E1F3FE] text-[#1F6C9F]' :
                            item.category === 'arrhythmia' ? 'bg-[#FDEBEC] text-[#9F2F2D]' :
                            item.category === 'diagnostics' ? 'bg-[#FBF3DB] text-[#956400]' :
                            'bg-[#EDF3EC] text-[#346538]'
                          }`}>
                            {item.category === 'clinical' ? 'Nội Tim Mạch & Huyết Áp' :
                             item.category === 'arrhythmia' ? 'Rối Loạn Nhịp & Điện Sinh Lý' :
                             item.category === 'diagnostics' ? 'Chẩn Đoán Hình Ảnh & Thăm Dò' :
                             'Tim Mạch Dự Phòng'}
                          </span>

                          {/* Title */}
                          <h3 className="text-lg md:text-xl font-bold text-[#0d2a5c] tracking-tight leading-snug mb-3 min-h-[3.25rem] flex items-center group-hover:text-[#0b3c8f] transition-colors">
                            {item.name}
                          </h3>

                          {/* Short Description */}
                          <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6 font-sans min-h-[4rem] line-clamp-3">
                            {item.desc}
                          </p>
                        </div>

                        <div>
                          {/* Inner divider */}
                          <div className="h-px bg-slate-100 mb-5" />

                          {/* Highlight feature line */}
                          <div className="flex items-center gap-2 mb-4 text-xs min-h-[1.25rem]">
                            <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" strokeWidth={1.5} />
                            <span className="font-semibold text-slate-700 truncate">{item.highlight}</span>
                          </div>

                          {/* Specialty footer: doctors count & featured Doctor */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                              <span>{item.featuredDoctor}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Stethoscope className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                              <span>{item.doctorCount} chuyên gia</span>
                            </div>
                          </div>

                          {/* Interactive Button-in-Button CTA */}
                          <div className="mt-6 flex justify-end">
                            <a 
                              href={item.slug} 
                              onClick={(e) => e.preventDefault()} // Mock route
                              className="relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold text-[10px] uppercase tracking-wider pl-4 pr-1.5 py-1.5 hover:from-[#0b3c8f] hover:to-[#0d2a5c] transition-all duration-300 group active:scale-[0.98] shadow-sm cursor-pointer"
                            >
                              <span>Chi tiết khoa</span>
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[0.5px] transition-transform duration-300">
                                <ArrowUpRight className="w-3 h-3 text-white" strokeWidth={2} />
                              </div>
                            </a>
                          </div>
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
              <h4 className="text-lg font-bold text-slate-700 uppercase mb-2">Không tìm thấy chuyên khoa</h4>
              <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                Rất tiếc, chúng tôi không tìm thấy chuyên khoa phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;. Vui lòng thử tìm kiếm lại bằng một từ khóa khác.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Insurance Partners Section */}
      <section className="bg-slate-50 py-20 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2.5 block">
              Bảo lãnh viện phí trực tiếp
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0d2a5c] uppercase tracking-tight">
              Đối tác bảo hiểm liên kết
            </h2>
            <div className="h-0.5 w-12 bg-blue-600/30 mx-auto mt-4" />
          </div>

          {/* Grayscale filter and low opacity for premium minimalist feel, colored on hover */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6 items-center justify-items-center">
            {insurancePartners.map((partner, idx) => (
              <div 
                key={idx}
                className="bg-white border border-slate-200/40 p-4 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-center w-full aspect-[16/9] hover:border-slate-300 hover:shadow-md transition-all duration-300 group"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  title={partner.name}
                  className="max-h-10 w-full object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-102 transition-all duration-300 select-none"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
