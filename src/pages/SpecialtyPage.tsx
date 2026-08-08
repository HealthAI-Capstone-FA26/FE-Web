import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Search, ArrowUpRight, Award, Shield, UserCheck, Stethoscope, Activity, Heart } from 'lucide-react';

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
  category: 'surgical' | 'medical' | 'maternity-pediatric' | 'specialized';
  desc: string;
  doctorCount: number;
  featuredDoctor: string;
  stat: string;
  statLabel: string;
  highlight: string;
  size: 'normal' | 'large'; // Map to bento layout span
}

const specialtiesData: Specialty[] = [
  {
    id: "cardio-surgery",
    name: "Trung tâm Phẫu thuật Tim Mạch máu và Lồng ngực",
    slug: "phau-thuat-tim-mach-mau-va-long-nguc",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2026/07/icon-trung-tam-phau-thuat-tim-mach-mau-va-long-nguc.png",
    category: "surgical",
    desc: "Điều trị chuyên sâu bệnh lý tim bẩm sinh, mạch vành, mạch máu ngoại biên và bệnh lý lồng ngực bằng kỹ thuật xâm lấn tối thiểu hiện đại, rút ngắn thời gian hồi phục của bệnh nhân.",
    doctorCount: 16,
    featuredDoctor: "GS.TS.BS. Nguyễn Hữu Ước",
    stat: "5,000+",
    statLabel: "Ca phẫu thuật thành công",
    highlight: "Phòng mổ Hybrid đạt chuẩn quốc tế",
    size: "large"
  },
  {
    id: "radiotherapy",
    name: "Khoa Xạ trị",
    slug: "xa-tri",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2025/10/logo-khoa-xa-tri-khoa-hoc-hat-nhan.png",
    category: "specialized",
    desc: "Ứng dụng công nghệ gia tốc hạt xạ trị và y học hạt nhân tiên tiến nhất thế giới để điều trị trúng đích các tế bào ung thư, giúp tiêu diệt khối u hiệu quả tối đa và bảo vệ mô lành xung quanh.",
    doctorCount: 8,
    featuredDoctor: "PGS.TS.BS. Nguyễn Xuân Kính",
    stat: "98%",
    statLabel: "Độ chính xác định vị u",
    highlight: "Công nghệ TrueBeam hiện đại",
    size: "large"
  },
  {
    id: "pediatric-surgery",
    name: "Khoa Ngoại Nhi",
    slug: "ngoai-nhi",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2025/05/icon-khoa-ngoai-nhi-tam-anh.png",
    category: "maternity-pediatric",
    desc: "Chăm sóc ngoại khoa toàn diện cho trẻ sơ sinh và trẻ nhỏ. Chuyên điều trị các dị tật bẩm sinh tiết niệu, tiêu hóa, lồng ngực bằng vi phẫu thuật tinh vi và an toàn.",
    doctorCount: 10,
    featuredDoctor: "TS.BS. Nguyễn Việt Hoa",
    stat: "3,500+",
    statLabel: "Bệnh nhi hồi phục tốt",
    highlight: "Ekip vi phẫu sơ sinh đầu ngành",
    size: "normal"
  },
  {
    id: "hepatitis-center",
    name: "Trung tâm Viêm gan và Gan nhiễm mỡ",
    slug: "viem-gan-va-gan-nhiem-mo",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2022/02/logo-tieu-hoa-gan-mat-f.png",
    category: "medical",
    desc: "Tầm soát chuyên sâu, chẩn đoán xác thực và điều trị hiệu quả các bệnh lý viêm gan siêu vi A, B, C, gan nhiễm mỡ, xơ gan bằng phác đồ cá thể hóa ứng dụng thuốc thế hệ mới.",
    doctorCount: 12,
    featuredDoctor: "PGS.TS.BS. Nguyễn Cảnh Bình",
    stat: "95%",
    statLabel: "Kiểm soát tiến triển xơ gan",
    highlight: "Máy siêu âm đàn hồi Fibroscan",
    size: "normal"
  },
  {
    id: "weight-control",
    name: "Kiểm soát cân nặng và Điều trị béo phì",
    slug: "kiem-soat-can-nang-va-dieu-tri-beo-phi",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2024/09/trung-tam-kiem-soat-can-nang-va-dieu-tri-beo-phi.png",
    category: "specialized",
    desc: "Cung cấp giải pháp toàn diện khoa học kiểm soát cân nặng, điều trị béo phì y khoa kết hợp công nghệ chuyển hóa dinh dưỡng thế hệ mới và phẫu thuật tạo hình dạ dày ít xâm lấn.",
    doctorCount: 9,
    featuredDoctor: "BS.CKII. Trần Minh Thắng",
    stat: "1,200+",
    statLabel: "Khách hàng lấy lại vóc dáng",
    highlight: "Phác đồ giảm béo y khoa 360",
    size: "normal"
  },
  {
    id: "neurosurgery-spine",
    name: "Khoa Ngoại Thần kinh – Cột sống",
    slug: "ngoai-than-kinh-cot-song",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2025/04/icon-khoa-ngoai-than-kinh-cot-song.png",
    category: "surgical",
    desc: "Phẫu thuật u não, u tủy sống, chấn thương sọ não và thoát vị đĩa đệm cột sống bằng robot định vị dẫn đường hiện đại kết hợp hệ thống cảnh báo chức năng thần kinh trong mổ.",
    doctorCount: 15,
    featuredDoctor: "TS.BS. Nguyễn Anh Tuấn",
    stat: "92%",
    statLabel: "Phục hồi vận động sớm",
    highlight: "Kính vi phẫu Zeiss Kinevo 900",
    size: "large"
  },
  {
    id: "reproductive-support",
    name: "Trung tâm Hỗ trợ sinh sản",
    slug: "trung-tam-ho-tro-sinh-san-ivfta",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2020/12/khoa-ivf.png",
    category: "maternity-pediatric",
    desc: "Tiên phong ứng dụng trí tuệ nhân tạo (AI) trong nuôi cấy và chọn lọc phôi động học Time-lapse. Đạt tỷ lệ thụ thai IVF thành công vượt trội hàng đầu Việt Nam và Đông Nam Á.",
    doctorCount: 22,
    featuredDoctor: "PGS.TS.BS. Lê Hoàng",
    stat: "68.5%",
    statLabel: "Tỷ lệ thụ thai IVF thành công",
    highlight: "Phòng Lab ISO 5 chuẩn quốc tế",
    size: "large"
  },
  {
    id: "high-tech-eye",
    name: "Trung tâm Mắt Công nghệ cao",
    slug: "trung-tam-mat",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2024/02/trung-tam-mat-cong-nghe-cao.png",
    category: "specialized",
    desc: "Khám và phẫu thuật đục thủy tinh thể, tật khúc xạ cận/viễn/loạn bằng công nghệ Laser Femto và RELEX SMILE hiện đại, mang lại thị lực tối đa nhanh chóng, không đau đớn.",
    doctorCount: 11,
    featuredDoctor: "ThS.BS. Nguyễn Thị Vân Anh",
    stat: "10,000+",
    statLabel: "Ca phẫu thuật an toàn",
    highlight: "Thiết bị Smile Pro 2026 tiên tiến",
    size: "normal"
  },
  {
    id: "gastro-endoscopy",
    name: "Trung tâm Nội soi & Phẫu thuật nội soi tiêu hóa",
    slug: "noi-soi-tieu-hoa",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2020/11/icon-tieuhoa.png",
    category: "surgical",
    desc: "Nội soi phóng đại và nội soi nhuộm màu NBI không đau phát hiện sớm các dấu hiệu tiền ung thư ống tiêu hóa. Phẫu thuật nội soi ổ bụng ít xâm lấn bằng hệ thống camera 3D sắc nét.",
    doctorCount: 14,
    featuredDoctor: "TS.BS. Phạm Hữu Tùng",
    stat: "100%",
    statLabel: "Nội soi không đau",
    highlight: "Nội soi phóng đại nhuộm màu NBI",
    size: "normal"
  },
  {
    id: "gastroenterology",
    name: "Khoa Tiêu hóa – Gan mật – Tụy",
    slug: "khoa-tieu-hoa-gan-mat-tuy",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2022/02/logo-tieu-hoa-gan-mat-f.png",
    category: "medical",
    desc: "Điều trị nội khoa toàn diện các bệnh lý viêm loét dạ dày, trào ngược thực quản, viêm đại tràng mãn tính, viêm tụy cấp và bệnh lý sỏi túi mật bằng phác đồ kết hợp tối ưu.",
    doctorCount: 13,
    featuredDoctor: "PGS.TS.BS. Trần Văn Hợp",
    stat: "96.8%",
    statLabel: "Hài lòng của người bệnh",
    highlight: "Tầm soát HP hơi thở C13/C14",
    size: "normal"
  },
  {
    id: "general-surgery",
    name: "Khoa Ngoại Tổng Hợp",
    slug: "ngoai-tong-hop",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2023/04/icon-ngoaitonghop.png",
    category: "surgical",
    desc: "Chuyên phẫu thuật điều trị bướu giáp, thoát vị bẹn, viêm ruột thừa, sỏi mật bằng phẫu thuật nội soi kỹ thuật cao, giúp bệnh nhân giảm thiểu sẹo mổ và phục hồi nhanh nhất.",
    doctorCount: 12,
    featuredDoctor: "PGS.TS.BS. Nguyễn Anh Dũng",
    stat: "3-5 ngày",
    statLabel: "Thời gian xuất viện trung bình",
    highlight: "Phẫu thuật nội soi Robot 4K/3D",
    size: "large"
  },
  {
    id: "neuroscience-center",
    name: "Trung tâm Khoa học Thần kinh",
    slug: "noi-than-kinh",
    icon: "https://tamanhhospital.vn/wp-content/uploads/2020/12/khoa-noithankinh.png",
    category: "medical",
    desc: "Đơn vị cấp cứu đột quỵ não giờ vàng và điều trị chuyên sâu Parkinson, sa sút trí tuệ, động kinh, đau đầu mãn tính bằng các phác đồ y khoa đột phá và công nghệ số hóa bản đồ não.",
    doctorCount: 18,
    featuredDoctor: "PGS.TS.BS. Nguyễn Văn Liệu",
    stat: "< 45 phút",
    statLabel: "Thời gian cửa - kim đột quỵ",
    highlight: "Bản đồ não số hóa tích hợp AI",
    size: "large"
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
  { id: 'surgical', label: 'Ngoại khoa & Phẫu thuật' },
  { id: 'medical', label: 'Nội khoa & Tim mạch' },
  { id: 'maternity-pediatric', label: 'Sản & Nhi khoa' },
  { id: 'specialized', label: 'Hỗ trợ điều trị' }
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

      {/* Specialties Bento Grid */}
      <main className="flex-grow pb-24 max-w-7xl mx-auto px-6 lg:px-8 w-full">
        <AnimatePresence mode="wait">
          {filteredSpecialties.length > 0 ? (
            <motion.div 
              key={selectedCategory + searchTerm}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6"
            >
              {filteredSpecialties.map((item, index) => {
                const isLarge = item.size === 'large';
                return (
                  <div
                    key={item.id}
                    className={`group ${
                      isLarge ? 'lg:col-span-3' : 'lg:col-span-2'
                    } flex flex-col`}
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
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center p-2.5 border border-slate-100 group-hover:scale-105 group-hover:border-blue-100 transition-all duration-300">
                              <img 
                                src={item.icon} 
                                alt={item.name} 
                                className="w-full h-full object-contain filter drop-shadow-sm" 
                              />
                            </div>
                            
                            {/* Mini highlight stat card inside the cell */}
                            <div className="text-right">
                              <span className="text-lg md:text-xl font-bold text-[#0b3c8f] tracking-tight block">
                                {item.stat}
                              </span>
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-medium">
                                {item.statLabel}
                              </span>
                            </div>
                          </div>

                          {/* Category Badge */}
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[8px] uppercase tracking-wider font-bold mb-3 ${
                            item.category === 'surgical' ? 'bg-[#FDEBEC] text-[#9F2F2D]' :
                            item.category === 'medical' ? 'bg-[#E1F3FE] text-[#1F6C9F]' :
                            item.category === 'maternity-pediatric' ? 'bg-[#EDF3EC] text-[#346538]' :
                            'bg-[#FBF3DB] text-[#956400]'
                          }`}>
                            {item.category === 'surgical' ? 'Ngoại khoa & Phẫu thuật' :
                             item.category === 'medical' ? 'Nội khoa & Tim mạch' :
                             item.category === 'maternity-pediatric' ? 'Sản & Nhi khoa' :
                             'Hỗ trợ điều trị'}
                          </span>

                          {/* Title */}
                          <h3 className="text-lg md:text-xl font-bold text-[#0d2a5c] tracking-tight leading-snug mb-3 group-hover:text-[#0b3c8f] transition-colors">
                            {item.name}
                          </h3>

                          {/* Short Description */}
                          <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6 font-sans">
                            {item.desc}
                          </p>
                        </div>

                        <div>
                          {/* Inner divider */}
                          <div className="h-px bg-slate-100 mb-5" />

                          {/* Highlight feature line */}
                          <div className="flex items-center gap-2 mb-4 text-xs">
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
