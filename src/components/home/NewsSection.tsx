import { Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const newsList = [
  {
    id: 1,
    title: "Nhận biết viêm da quanh miệng và cách xử lý hiệu quả",
    desc: "Dù không đe dọa đến sức khỏe toàn thân nhưng viêm da quanh miệng có thể gây ảnh hưởng đáng kể đến thẩm mỹ...",
    image: "/images/news_thumb_1.png"
  },
  {
    id: 2,
    title: "Tưởng nhồi máu cơ tim, đột quỵ hóa rối loạn tâm thần",
    desc: "Chị Hoa, 26 tuổi, nhập viện cấp cứu nhiều lần do hoảng hốt, nghĩ mình mắc bệnh tim, đột quỵ với các triệu chứng...",
    image: "/images/service_customer.png"
  },
  {
    id: 3,
    title: "Hệ thống Bệnh viện Đa khoa Mai Phương TP.HCM khám sức khỏe cho gần 300 người dân",
    desc: "Ngày 06/08, Hệ thống Bệnh viện Đa khoa Mai Phương TP.HCM phối hợp cùng UBND phường Chợ Quán và Trạm Y tế...",
    image: "/images/news_thumb.png"
  },
  {
    id: 4,
    title: "Da Vinci Xi Dual Console: Phẫu thuật robot hai buồng điều khiển",
    desc: "Da Vinci Xi Dual Console - Phẫu thuật robot hai buồng điều khiển là công nghệ điều trị tiên tiến nhất hiện nay...",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=600&auto=format&fit=crop"
  }
];

export const NewsSection = () => {
  return (
    <section className="bg-[#f8f9fa] py-16 w-full">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        
        {/* Title */}
        <div className="flex justify-center mb-10">
          <h2 className="text-2xl font-semibold text-[#1da1f2] relative inline-block uppercase pb-2">
            Tin Tức
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-[2px] bg-slate-400"></div>
          </h2>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white">
          
          {/* Left Column - Featured */}
          <Link to="/tin-tuc/featured" className="flex flex-col group cursor-pointer h-full">
            <div className="relative overflow-hidden w-full aspect-[4/3] bg-slate-100">
              <img 
                src="/images/news_featured.png" 
                alt="Featured News" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 bg-white flex-grow border border-slate-100">
              <h3 className="text-[20px] font-bold text-slate-800 mb-3 leading-tight group-hover:text-[#1da1f2] transition-colors">
                Các dấu hiệu mang thai sớm ngay trong 1 tuần đầu tiên
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Nếu đang trong hành trình chờ đón con yêu, chị em đừng bỏ qua các dấu hiệu có thai sớm tuần đầu mà cơ thể đang khẽ nhắn gửi. Nhận biết sớm không chỉ giúp chị em chuẩn bị tâm lý mà còn có kế hoạch chăm sóc thai kỳ tốt nhất...
              </p>
            </div>
          </Link>

          {/* Right Column - List */}
          <div className="flex flex-col gap-4">
            {newsList.map((item) => (
              <Link to={`/tin-tuc/${item.id}`} key={item.id} className="flex gap-4 p-3 bg-white group cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100">
                <div className="w-[140px] h-[95px] flex-shrink-0 overflow-hidden bg-slate-100">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex flex-col justify-between py-1">
                  <div>
                    <h4 className="text-[#1da1f2] font-semibold text-[15px] leading-tight mb-2 group-hover:text-[#1581c4] transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-slate-500 text-[13px] leading-snug line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                  <div className="flex justify-end mt-2 items-center text-slate-600 hover:text-[#1da1f2] transition-colors">
                    <Share2 className="w-4 h-4 mr-1.5" />
                    <span className="text-xs font-semibold underline">XEM CHI TIẾT</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>

        {/* Button */}
        <div className="flex justify-center mt-10">
          <button className="bg-[#1da1f2] hover:bg-[#1581c4] text-white font-semibold py-3 px-8 transition-colors text-sm uppercase">
            Xem thêm tất cả tin tức
          </button>
        </div>

      </div>
    </section>
  );
};
