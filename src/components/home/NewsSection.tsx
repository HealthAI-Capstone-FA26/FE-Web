import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';

/* 
 * Design Archetype: Premium Utilitarian Minimalism & Editorial UI
 * - Clean off-white canvas
 * - Muted pastel tags
 * - Instrument Serif display title
 * - Crisp borders and high-contrast typography
 */

const categories = {
  featured: { label: "Nổi bật", bg: "bg-[#FDEBEC]", text: "text-[#9F2F2D]" }, // Pale Red
  ykhoa: { label: "Y khoa", bg: "bg-[#E1F3FE]", text: "text-[#1F6C9F]" },       // Pale Blue
  sukien: { label: "Sự kiện", bg: "bg-[#EDF3EC]", text: "text-[#346538]" },     // Pale Green
  congnghe: { label: "Công nghệ", bg: "bg-[#FBF3DB]", text: "text-[#956400]" },  // Pale Yellow
};

const homeNews = [
  {
    id: "featured",
    title: "Các dấu hiệu mang thai sớm ngay trong 1 tuần đầu tiên",
    desc: "Nếu đang trong hành trình chờ đón con yêu, chị em đừng bỏ qua các dấu hiệu có thai sớm tuần đầu mà cơ thể đang khẽ nhắn gửi...",
    date: "15/08/2026",
    category: categories.featured,
    image: "/images/news_featured.png"
  },
  {
    id: "1",
    title: "Nhận biết viêm da quanh miệng và cách xử lý hiệu quả",
    desc: "Dù không đe dọa đến sức khỏe toàn thân nhưng viêm da quanh miệng có thể gây ảnh hưởng đáng kể đến thẩm mỹ...",
    date: "12/08/2026",
    category: categories.ykhoa,
    image: "/images/news_thumb_1.png"
  },
  {
    id: "2",
    title: "Tưởng nhồi máu cơ tim, đột quỵ hóa rối loạn tâm thần",
    desc: "Chị Hoa, 26 tuổi, nhập viện cấp cứu nhiều lần do hoảng hốt, nghĩ mình mắc bệnh tim, đột quỵ...",
    date: "10/08/2026",
    category: categories.ykhoa,
    image: "/images/service_customer.png"
  }
];

export const NewsSection = () => {
  return (
    <section className="bg-[#FAF9F6] py-24 w-full border-t border-slate-200/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">ẤN PHẨM TRUYỀN THÔNG</span>
          <h2 className="text-3xl md:text-4xl font-normal text-slate-900 tracking-tight font-serif italic">
            Tin tức nổi bật
          </h2>
          <div className="w-12 h-px bg-slate-300 mt-6" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {homeNews.map((item) => (
            <Link 
              to={`/tin-tuc/${item.id}`} 
              key={item.id} 
              className="group flex flex-col border border-slate-200/50 bg-white rounded-xl p-5 hover:border-slate-300 transition-all duration-300 shadow-sm shadow-slate-200/10 cursor-pointer h-full justify-between"
            >
              <div>
                <div className="aspect-[16/10] rounded-lg overflow-hidden bg-slate-50 border border-slate-100 mb-5">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                  />
                </div>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[8px] uppercase tracking-wider font-bold mb-3 ${item.category.bg} ${item.category.text}`}>
                  {item.category.label}
                </span>
                <h3 className="text-lg font-normal text-slate-900 tracking-tight leading-snug mb-3 group-hover:text-slate-800 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-6 line-clamp-2">
                  {item.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center text-xs text-slate-400 gap-1.5">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{item.date}</span>
                </div>
                <span className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="flex justify-center mt-12">
          <Link 
            to="/tin-tuc" 
            className="group relative rounded-full px-6 py-3 bg-slate-900 text-white font-medium text-xs flex items-center gap-4 hover:bg-slate-800 active:scale-[0.98] transition-all duration-300 shadow-sm shadow-black/5"
          >
            <span>Xem tất cả bản tin</span>
            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>

      </div>
    </section>
  );
};

