import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ArrowRight, Clock } from 'lucide-react';

/* 
 * Design Archetype: Premium Utilitarian Minimalism & Editorial UI
 * - Warm monochrome/bone canvas (#FAF9F6)
 * - Muted spot pastels for badges
 * - Instrument Serif display headlines with tight tracking
 * - 1px solid #EAEAEA crisp borders (using border-slate-200/80)
 * - Hardware accelerated entry animations
 */

const categories = {
  featured: { label: "Nổi bật", bg: "bg-[#FDEBEC]", text: "text-[#9F2F2D]" }, // Pale Red
  ykhoa: { label: "Y khoa", bg: "bg-[#E1F3FE]", text: "text-[#1F6C9F]" },       // Pale Blue
  sukien: { label: "Sự kiện", bg: "bg-[#EDF3EC]", text: "text-[#346538]" },     // Pale Green
  congnghe: { label: "Công nghệ", bg: "bg-[#FBF3DB]", text: "text-[#956400]" },  // Pale Yellow
};

const articles = [
  {
    id: "featured",
    title: "Các dấu hiệu mang thai sớm ngay trong 1 tuần đầu tiên",
    desc: "Nếu đang trong hành trình chờ đón con yêu, chị em đừng bỏ qua các dấu hiệu có thai sớm tuần đầu mà cơ thể đang khẽ nhắn gửi. Nhận biết sớm không chỉ giúp chị em chuẩn bị tâm lý mà còn có kế hoạch chăm sóc thai kỳ tốt nhất.",
    date: "15/08/2026",
    category: categories.featured,
    image: "/images/news_featured.png"
  },
  {
    id: "1",
    title: "Nhận biết viêm da quanh miệng và cách xử lý hiệu quả",
    desc: "Dù không đe dọa đến sức khỏe toàn thân nhưng viêm da quanh miệng có thể gây ảnh hưởng đáng kể đến thẩm mỹ và tâm lý của người bệnh...",
    date: "12/08/2026",
    category: categories.ykhoa,
    image: "/images/news_thumb_1.png"
  },
  {
    id: "2",
    title: "Tưởng nhồi máu cơ tim, đột quỵ hóa rối loạn tâm thần",
    desc: "Chị Hoa, 26 tuổi, nhập viện cấp cứu nhiều lần do hoảng hốt, nghĩ mình mắc bệnh tim, đột quỵ với các triệu chứng tim đập nhanh...",
    date: "10/08/2026",
    category: categories.ykhoa,
    image: "/images/service_customer.png"
  },
  {
    id: "3",
    title: "Bệnh viện Mai Phương khám sức khỏe miễn phí cho gần 300 người dân",
    desc: "Hệ thống Bệnh viện Đa khoa Mai Phương TP.HCM phối hợp cùng UBND phường Chợ Quán và Trạm Y tế tổ chức khám bệnh, phát thuốc...",
    date: "06/08/2026",
    category: categories.sukien,
    image: "/images/news_thumb.png"
  },
  {
    id: "4",
    title: "Da Vinci Xi Dual Console: Phẫu thuật robot hai buồng điều khiển",
    desc: "Da Vinci Xi Dual Console - Phẫu thuật robot hai buồng điều khiển là công nghệ điều trị tiên tiến nhất hiện nay tại Việt Nam...",
    date: "01/08/2026",
    category: categories.congnghe,
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=600&auto=format&fit=crop"
  }
];

export const NewsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const featuredArticle = articles[0];
  const listArticles = articles.slice(1);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans selection:bg-[#E1F3FE] selection:text-[#1F6C9F]">
      <Header />
      
      <main className="flex-grow py-20 lg:py-28 max-w-7xl mx-auto px-6 lg:px-8 w-full z-10">
        
        {/* Page Header */}
        <div className="max-w-3xl mb-16 md:mb-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 block">BẢN TIN Y KHOA</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0d2a5c] uppercase tracking-tight leading-[1.05]">
            Tin tức & Sự kiện
          </h1>
          <div className="h-px bg-slate-200/60 mt-8 w-full" />
        </div>

        {/* Featured Article - Bento Header Slot */}
        <div className="mb-16">
          <Link 
            to={`/tin-tuc/${featuredArticle.id}`} 
            className="group grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-slate-200/50 bg-white rounded-2xl p-6 md:p-8 hover:border-slate-300 transition-all duration-300 shadow-sm shadow-slate-200/10 cursor-pointer"
          >
            <div className="lg:col-span-7 aspect-[16/10] rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
              <img 
                src={featuredArticle.image} 
                alt={featuredArticle.title} 
                className="w-full h-full object-cover object-top group-hover:scale-[1.01] transition-transform duration-700 ease-out"
              />
            </div>
            <div className="lg:col-span-5 flex flex-col items-start pr-4">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-bold mb-4 ${featuredArticle.category.bg} ${featuredArticle.category.text}`}>
                {featuredArticle.category.label}
              </span>
              
              <h2 className="text-2xl md:text-3xl font-bold text-[#0b3c8f] tracking-tight leading-snug mb-4 group-hover:text-blue-700 transition-colors">
                {featuredArticle.title}
              </h2>
              
              <p className="text-slate-500 text-sm leading-relaxed mb-6 font-sans">
                {featuredArticle.desc}
              </p>
              
              <div className="flex items-center justify-between w-full pt-4 border-t border-slate-100">
                <div className="flex items-center text-xs text-slate-400 gap-1.5">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{featuredArticle.date}</span>
                </div>
                <span className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform">
                  Chi tiết bài viết <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Asymmetrical Grid of Supporting Articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listArticles.map((article) => (
            <Link 
              key={article.id}
              to={`/tin-tuc/${article.id}`} 
              className="group flex flex-col border border-slate-200/50 bg-white rounded-xl p-5 hover:border-slate-300 transition-all duration-300 shadow-sm shadow-slate-200/10 cursor-pointer h-full justify-between"
            >
              <div>
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-50 border border-slate-100 mb-5">
                  <img 
                    src={article.image} 
                    alt={article.title} 
                    className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                  />
                </div>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[8px] uppercase tracking-wider font-bold mb-3 ${article.category.bg} ${article.category.text}`}>
                  {article.category.label}
                </span>
                <h3 className="text-lg font-bold text-[#0b3c8f] tracking-tight leading-snug mb-3 group-hover:text-blue-700 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-6 line-clamp-3">
                  {article.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center text-xs text-slate-400 gap-1.5">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{article.date}</span>
                </div>
                <span className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

      </main>
      <Footer />
    </div>
  );
};
