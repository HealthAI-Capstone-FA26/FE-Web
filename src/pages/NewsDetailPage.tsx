import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ArrowLeft, Clock, Share2 } from 'lucide-react';

/* 
 * Design Archetype: Premium Utilitarian Minimalism & Editorial UI
 * - Warm monochrome background (#FAF9F6)
 * - Instrument Serif display title
 * - Crisp borders and high-contrast typography
 * - Spacious text container (max-w-[65ch] for prose)
 */

const newsDetails: Record<string, { title: string; date: string; category: string; image: string; content: React.ReactNode }> = {
  "1": {
    title: "Nhận biết viêm da quanh miệng và cách xử lý hiệu quả",
    date: "12/08/2026",
    category: "Y khoa",
    image: "/images/news_thumb_1.png",
    content: (
      <>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Dù không đe dọa đến sức khỏe toàn thân nhưng viêm da quanh miệng có thể gây ảnh hưởng đáng kể đến thẩm mỹ và tâm lý của người bệnh. Việc nhận biết sớm các triệu chứng sẽ giúp quá trình điều trị diễn ra nhanh chóng và hiệu quả hơn.</p>
        <h3 className="text-2xl font-bold text-[#0d2a5c] mt-8 mb-4">Viêm da quanh miệng là gì?</h3>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Viêm da quanh miệng là một tình trạng viêm da phổ biến, biểu hiện bằng các nốt mẩn đỏ, mụn nước nhỏ liti xuất hiện xung quanh vùng miệng, đôi khi lan lên mũi hoặc vùng mắt. Bệnh thường gặp ở phụ nữ trẻ và trẻ em.</p>
        <h3 className="text-2xl font-bold text-[#0d2a5c] mt-8 mb-4">Nguyên nhân gây bệnh</h3>
        <ul className="list-disc pl-6 mb-6 space-y-3 text-slate-600 font-sans">
          <li>Sử dụng mỹ phẩm, kem dưỡng da chứa thành phần gây kích ứng.</li>
          <li>Lạm dụng thuốc bôi ngoài da có chứa corticoid.</li>
          <li>Thay đổi nội tiết tố, dị ứng thời tiết hoặc thực phẩm.</li>
        </ul>
        <h3 className="text-2xl font-bold text-[#0d2a5c] mt-8 mb-4">Cách xử lý và điều trị</h3>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Khi có dấu hiệu viêm da quanh miệng, người bệnh nên ngưng ngay các loại mỹ phẩm đang sử dụng. Không tự ý mua thuốc bôi tại nhà. Hãy đến các cơ sở y tế uy tín như Bệnh viện Đa khoa Mai Phương để được bác sĩ da liễu thăm khám và kê đơn thuốc phù hợp, thường là kháng sinh bôi ngoài da hoặc thuốc uống dị ứng.</p>
      </>
    )
  },
  "2": {
    title: "Tưởng nhồi máu cơ tim, đột quỵ hóa rối loạn tâm thần",
    date: "10/08/2026",
    category: "Y khoa",
    image: "/images/service_customer.png",
    content: (
      <>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Chị Hoa, 26 tuổi, nhập viện cấp cứu nhiều lần do hoảng hốt, tim đập nhanh, khó thở, nghĩ mình mắc bệnh tim, đột quỵ. Tuy nhiên, kết quả khám tim mạch hoàn toàn bình thường.</p>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Sau khi được chuyển sang khoa Tâm lý - Tâm thần tại Bệnh viện Đa khoa Mai Phương, bác sĩ chẩn đoán chị Hoa mắc chứng Rối loạn hoảng sợ (Panic disorder). Đây là một dạng rối loạn lo âu phổ biến trong xã hội hiện đại.</p>
        <h3 className="text-2xl font-bold text-[#0d2a5c] mt-8 mb-4">Dấu hiệu nhận biết</h3>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Cơn hoảng sợ thường xuất hiện đột ngột với các triệu chứng mãnh liệt như:</p>
        <ul className="list-disc pl-6 mb-6 space-y-3 text-slate-600 font-sans">
          <li>Tim đập thình thịch, đau tức ngực.</li>
          <li>Đổ mồ hôi, tay chân run rẩy.</li>
          <li>Cảm giác nghẹt thở, chóng mặt, sợ hãi tột độ như sắp chết.</li>
        </ul>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Bác sĩ khuyến cáo, khi gặp các triệu chứng trên mà khám thể chất không phát hiện bệnh lý, bệnh nhân nên đến khám chuyên khoa Tâm lý - Tâm thần để được hỗ trợ trị liệu kịp thời, tránh ảnh hưởng nặng nề đến chất lượng cuộc sống.</p>
      </>
    )
  },
  "3": {
    title: "Hệ thống Bệnh viện Đa khoa Mai Phương TP.HCM khám sức khỏe cho gần 300 người dân",
    date: "06/08/2026",
    category: "Sự kiện",
    image: "/images/news_thumb.png",
    content: (
      <>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Ngày 06/08, Hệ thống Bệnh viện Đa khoa Mai Phương TP.HCM phối hợp cùng UBND phường Chợ Quán và Trạm Y tế tổ chức chương trình khám bệnh, phát thuốc miễn phí cho người dân có hoàn cảnh khó khăn trên địa bàn.</p>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Chương trình đã thu hút gần 300 người dân tham gia. Đội ngũ y bác sĩ của Bệnh viện Mai Phương đã tiến hành đo huyết áp, test đường huyết, siêu âm tổng quát và tư vấn sức khỏe tận tình cho bà con.</p>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Đại diện Bệnh viện chia sẻ: "Đây là một trong những hoạt động thiện nguyện thường niên của Bệnh viện Đa khoa Mai Phương, nhằm chung tay cùng cộng đồng chăm sóc sức khỏe cho những người yếu thế, mang lại một cuộc sống khỏe mạnh và tốt đẹp hơn".</p>
      </>
    )
  },
  "4": {
    title: "Da Vinci Xi Dual Console: Phẫu thuật robot hai buồng điều khiển",
    date: "01/08/2026",
    category: "Công nghệ",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=600&auto=format&fit=crop",
    content: (
      <>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Bệnh viện Đa khoa Mai Phương tự hào là đơn vị tiên phong ứng dụng hệ thống Robot Da Vinci Xi Dual Console - công nghệ phẫu thuật robot hai buồng điều khiển tiên tiến nhất hiện nay.</p>
        <h3 className="text-2xl font-bold text-[#0d2a5c] mt-8 mb-4">Ưu điểm vượt trội</h3>
        <ul className="list-disc pl-6 mb-6 space-y-3 text-slate-600 font-sans">
          <li><strong>Độ chính xác cao:</strong> Cánh tay robot linh hoạt xoay 540 độ, vươn tới những góc khuất hẹp nhất mà tay người khó tiếp cận.</li>
          <li><strong>Ít xâm lấn:</strong> Vết mổ siêu nhỏ, giảm đau đớn, hạn chế mất máu và nguy cơ nhiễm trùng.</li>
          <li><strong>Hồi phục nhanh:</strong> Bệnh nhân có thể xuất viện sớm và trở lại sinh hoạt bình thường nhanh chóng.</li>
          <li><strong>Đào tạo trực tiếp:</strong> Hệ thống Dual Console cho phép hai bác sĩ phẫu thuật cùng thao tác trên một bệnh nhân, hỗ trợ hiệu quả cho công tác hội chẩn và đào tạo chuyên sâu.</li>
        </ul>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Việc đưa vào vận hành hệ thống Robot Da Vinci Xi một lần nữa khẳng định cam kết của Bệnh viện Đa khoa Mai Phương trong việc liên tục cập nhật công nghệ y khoa thế giới, mang đến chất lượng điều trị tốt nhất cho người bệnh.</p>
      </>
    )
  },
  "featured": {
    title: "Các dấu hiệu mang thai sớm ngay trong 1 tuần đầu tiên",
    date: "15/08/2026",
    category: "Nổi bật",
    image: "/images/news_featured.png",
    content: (
      <>
        <p className="mb-6 text-lg text-slate-700 leading-relaxed font-sans">Nếu đang trong hành trình chờ đón con yêu, chị em đừng bỏ qua các dấu hiệu có thai sớm tuần đầu mà cơ thể đang khẽ nhắn gửi. Nhận biết sớm không chỉ giúp chị em chuẩn bị tâm lý mà còn có kế hoạch chăm sóc thai kỳ tốt nhất.</p>
        <h3 className="text-2xl font-bold text-[#0d2a5c] mt-8 mb-4">1. Trễ kinh (Chậm kinh)</h3>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Đây là dấu hiệu mang thai sớm và đáng tin cậy nhất đối với những phụ nữ có chu kỳ kinh nguyệt đều đặn. Khi quá trình thụ thai thành công, cơ thể sẽ tiết ra hormone hCG để duy trì thai kỳ, làm buồng trứng ngừng rụng trứng, dẫn đến việc mất kinh.</p>
        <h3 className="text-2xl font-bold text-[#0d2a5c] mt-8 mb-4">2. Máu báo thai</h3>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Khoảng 10-14 ngày sau khi thụ thai, phôi thai sẽ bám vào niêm mạc tử cung để làm tổ, có thể gây ra hiện tượng chảy máu nhẹ (máu báo thai). Máu báo thường có màu hồng nhạt hoặc nâu, lượng rất ít và chỉ xuất hiện trong 1-2 ngày.</p>
        <h3 className="text-2xl font-bold text-[#0d2a5c] mt-8 mb-4">3. Thay đổi ở vùng ngực</h3>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Sự gia tăng hormone khi mang thai khiến lượng máu đến bầu ngực tăng lên. Chị em sẽ cảm thấy ngực căng tức, nhạy cảm hơn bình thường, quầng vú có thể sẫm màu hơn.</p>
        <h3 className="text-2xl font-bold text-[#0d2a5c] mt-8 mb-4">4. Đi tiểu thường xuyên</h3>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Lưu lượng máu trong cơ thể tăng lên khiến thận phải làm việc nhiều hơn để lọc chất thải, dẫn đến việc bàng quang nhanh đầy và bạn phải đi tiểu nhiều hơn.</p>
        <h3 className="text-2xl font-bold text-[#0d2a5c] mt-8 mb-4">Lưu ý từ bác sĩ</h3>
        <p className="mb-6 text-slate-600 leading-relaxed font-sans">Các dấu hiệu trên có thể khác nhau ở mỗi người. Để khẳng định chắc chắn mình đã mang thai, bạn nên sử dụng que thử thai hoặc đến Bệnh viện Đa khoa Mai Phương để thực hiện xét nghiệm máu Beta hCG và siêu âm kiểm tra nhé.</p>
      </>
    )
  }
};

const NewsDetailPage = () => {
  const { id } = useParams();
  
  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const newsItem = newsDetails[id as string];

  if (!newsItem) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans">
        <Header />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="text-center max-w-md px-6">
            <h2 className="text-2xl font-bold text-[#0d2a5c] uppercase mb-6">Không tìm thấy bài viết</h2>
            <Link to="/tin-tuc" className="group rounded-full px-5 py-2.5 bg-slate-900 text-white font-medium text-xs inline-flex items-center gap-3 hover:bg-slate-800 active:scale-[0.98] transition-all duration-300">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang tin tức</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans flex flex-col selection:bg-[#E1F3FE] selection:text-[#1F6C9F]">
      <Header />
      
      <main className="flex-grow py-16 lg:py-24 max-w-4xl mx-auto px-6 lg:px-8 w-full z-10">
        
        {/* Navigation Back */}
        <Link 
          to="/tin-tuc" 
          className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-500 hover:text-slate-950 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Danh sách tin tức</span>
        </Link>

        {/* Article Envelope */}
        <article className="border border-slate-200/50 bg-white rounded-2xl p-6 md:p-12 lg:p-16 shadow-sm shadow-slate-200/10">
          
          {/* Metadata Category */}
          <span className="inline-block rounded-full bg-[#E1F3FE] text-[#1F6C9F] px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-bold mb-6">
            {newsItem.category}
          </span>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0d2a5c] uppercase tracking-tight leading-snug mb-6">
            {newsItem.title}
          </h1>

          {/* Clock & Share Meta */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-8 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" strokeWidth={1.5} />
              <span>Đăng ngày: {newsItem.date}</span>
            </div>
            <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-950 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/40">
              <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="font-semibold">Chia sẻ</span>
            </button>
          </div>

          {/* Featured Image - Clean Double Bezel look */}
          <div className="mb-10 bg-slate-100/60 p-2 rounded-2xl border border-slate-200/40">
            <div className="rounded-xl overflow-hidden aspect-[16/9]">
              <img 
                src={newsItem.image} 
                alt={newsItem.title} 
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          {/* Article Body */}
          <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-[#0d2a5c]">
            {newsItem.content}
          </div>

        </article>
      </main>

      <Footer />
    </div>
  );
};

export default NewsDetailPage;

