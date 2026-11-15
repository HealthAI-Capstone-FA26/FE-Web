import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  UserCheck,
  Activity,
  Stethoscope,
  Pill,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  MapPin,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Sparkles,
  Check
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const AboutPage: React.FC = () => {
  const steps = [
    {
      stepNumber: '01',
      title: 'Đăng Ký & Lấy Số Thứ Tự',
      subtitle: 'Chủ động thời gian, giảm thiểu chờ đợi',
      icon: Calendar,
      color: 'blue',
      badge: 'Bắt đầu',
      description:
        'Quý khách có thể chủ động đặt trước lịch hẹn theo ngày giờ mong muốn ngay trên website hoặc lấy số thứ tự tại Kiosk tiếp đón tự động khi đến sảnh phòng khám.',
      tips: [
        'Đặt lịch hẹn trước giúp bạn được ưu tiên gọi vào khám theo khung giờ đã chọn.',
        'Nhận thông báo xác nhận lịch hẹn và số thứ tự qua tin nhắn/email.'
      ]
    },
    {
      stepNumber: '02',
      title: 'Tiếp Đón & Hoàn Tất Hồ Sơ Ban Đầu',
      subtitle: 'Xác nhận thông tin nhanh chóng tại quầy',
      icon: UserCheck,
      color: 'teal',
      badge: 'Quầy tiếp nhận',
      description:
        'Tại quầy tiếp đón, nhân viên y tế sẽ hỗ trợ đối chiếu thông tin cá nhân, cập nhật lý do đến khám, tiếp nhận bảo hiểm y tế (nếu có) và hướng dẫn vào trạm đo sinh hiệu.',
      tips: [
        'Vui lòng chuẩn bị sẵn CCCD/CMND hoặc mã số lịch hẹn trên điện thoại.',
        'Khai báo đầy đủ các triệu chứng khó chịu gần đây và tiền sử dị ứng thuốc nếu có.'
      ]
    },
    {
      stepNumber: '03',
      title: 'Kiểm Tra Chỉ Số Sức Khỏe Ban Đầu',
      subtitle: 'Đo lường các chỉ số sinh hiệu nền tảng',
      icon: Activity,
      color: 'amber',
      badge: 'Trạm điều dưỡng',
      description:
        'Điều dưỡng viên tiến hành đo các thông số nền tảng gồm: Huyết áp, nhịp mạch, SpO2 (độ bão hòa oxy máu), nhiệt độ, chiều cao và cân nặng trước khi bạn gặp Bác sĩ.',
      tips: [
        'Nên ngồi nghỉ ngơi thư giãn từ 5 - 10 phút trước khi đo huyết áp để chỉ số được chính xác nhất.',
        'Thông báo với điều dưỡng nếu bạn vừa vận động mạnh, leo cầu thang hoặc cảm thấy hồi hộp.'
      ]
    },
    {
      stepNumber: '04',
      title: 'Bác Sĩ Khám & Chỉ Định Cận Lâm Sàng',
      subtitle: 'Thăm khám chuyên sâu & xét nghiệm cần thiết',
      icon: Stethoscope,
      color: 'indigo',
      badge: 'Phòng khám chuyên khoa',
      description:
        'Bác sĩ chuyên khoa trực tiếp thăm khám lâm sàng (nghe tim, phổi, kiểm tra mạch máu). Tùy vào tình trạng bệnh, bác sĩ sẽ chỉ định các kiểm tra cận lâm sàng phù hợp như Điện tâm đồ (ECG), Siêu âm tim, Xét nghiệm máu, hoặc X-quang.',
      tips: [
        'Trao đổi cởi mở với bác sĩ về thói quen sinh hoạt, chế độ ăn uống và các lo lắng của bạn.',
        'Nhân viên hướng dẫn sẽ đưa bạn đến đúng phòng xét nghiệm và hỗ trợ lấy mẫu nhẹ nhàng.'
      ]
    },
    {
      stepNumber: '05',
      title: 'Tư Vấn Kết Quả, Kê Đơn & Hướng Dẫn Điều Trị',
      subtitle: 'Giải thích cặn kẽ & cấp đơn thuốc điện tử',
      icon: Pill,
      color: 'emerald',
      badge: 'Hoàn tất buổi khám',
      description:
        'Bác sĩ tổng hợp kết quả cận lâm sàng, giải thích cặn kẽ về tình trạng sức khỏe tim mạch, tư vấn phác đồ điều trị, cấp đơn thuốc rõ ràng và hướng dẫn lịch tái khám định kỳ.',
      tips: [
        'Hỏi kỹ bác sĩ về cách dùng từng loại thuốc, thời điểm uống và các tác dụng phụ có thể gặp.',
        'Hồ sơ khám và đơn thuốc được lưu trữ điện tử, bạn có thể tra cứu lại bất cứ lúc nào qua tài khoản cá nhân.'
      ]
    }
  ];

  const preparationNotes = [
    {
      icon: FileText,
      title: 'Giấy tờ cần mang theo',
      items: [
        'Căn cước công dân (CCCD) hoặc giấy tờ tùy thân có ảnh.',
        'Thẻ Bảo hiểm y tế / Bảo hiểm tư nhân (nếu có để hưởng quyền lợi).',
        'Sổ khám bệnh cũ, các toa thuốc đang uống tại nhà.',
        'Các kết quả xét nghiệm, điện tâm đồ, đĩa chụp X-quang hoặc siêu âm trong vòng 6 tháng gần nhất.'
      ]
    },
    {
      icon: AlertCircle,
      title: 'Lưu ý trước khi khám & làm xét nghiệm',
      items: [
        'Không sử dụng rượu, bia, cà phê, trà đặc hoặc chất kích thích trong vòng 24 giờ trước khi khám.',
        'Mặc trang phục rộng rãi, thoải mái, áo ngắn tay hoặc có cúc để thuận tiện đo điện tâm đồ và siêu âm tim.',
        'Uống thuốc huyết áp buổi sáng như thường lệ (trừ khi có chỉ dẫn riêng của bác sĩ).'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Header />

      <main className="flex-grow pb-24">
        {/* HERO BANNER SECTION */}
        <section className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white py-16 lg:py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-5 tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cẩm Nang Hướng Dẫn Bệnh Nhân</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
              Quy Trình Khám Chữa Bệnh Tại Phòng Khám 4AM
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Nhằm mang lại trải nghiệm khám bệnh nhanh chóng, chu đáo và không mất thời gian chờ đợi, phòng khám 4AM xây dựng quy trình tiếp đón và thăm khám khoa học qua từng bước rõ ràng.
            </p>

            <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
              <Link
                to="/"
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Đặt Lịch Khám Ngay</span>
              </Link>
              <a
                href="#huong-dan-chuan-bi"
                className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all border border-white/15 flex items-center gap-2 cursor-pointer"
              >
                <span>Những điều cần chuẩn bị</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>
        </section>

        {/* 5 BƯỚC KHÁM BỆNH SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                5 Bước Khám Bệnh Khoa Học & Thuận Tiện
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Từ khi bước vào sảnh đến khi nhận toa thuốc, quý khách luôn được nhân viên y tế hướng dẫn tận tình ở từng khu vực chuyên môn.
              </p>
            </div>

            <div className="space-y-6 lg:space-y-8">
              {steps.map((s, idx) => {
                const IconComponent = s.icon;
                return (
                  <div
                    key={s.stepNumber}
                    className="relative bg-slate-50/80 hover:bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 hover:border-blue-300 transition-all duration-300 shadow-2xs hover:shadow-lg flex flex-col lg:flex-row gap-6 lg:items-start group"
                  >
                    {/* Left: Step Number & Icon */}
                    <div className="flex items-center lg:flex-col gap-4 shrink-0 lg:w-36">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform shrink-0">
                        <IconComponent className="w-7 h-7" />
                      </div>
                      <div className="text-left lg:text-center">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 block">
                          BƯỚC {s.stepNumber}
                        </span>
                        <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {s.badge}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Content */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                          {s.title}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          {s.subtitle}
                        </p>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                        {s.description}
                      </p>

                      {/* Tips box */}
                      <div className="bg-white/90 rounded-2xl p-4 border border-slate-200/80 space-y-2 mt-3">
                        <span className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Lưu ý hữu ích cho bạn:</span>
                        </span>
                        <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-600">
                          {s.tips.map((tip, tipIdx) => (
                            <li key={tipIdx} className="leading-snug font-medium">
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CẦN CHUẨN BỊ GÌ TRƯỚC KHI KHÁM SECTION */}
        <section id="huong-dan-chuan-bi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chuẩn Bị Chu Đáo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Những Điều Quý Khách Cần Chuẩn Bị
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Chuẩn bị đầy đủ giấy tờ và lưu ý ăn uống giúp quá trình chẩn đoán được nhanh chóng và mang lại kết quả chuẩn xác nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {preparationNotes.map((card, idx) => {
              const IconComp = card.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900">{card.title}</h3>
                    </div>

                    <ul className="space-y-3">
                      {card.items.map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                          <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Cần hỗ trợ hướng dẫn thêm?</span>
                    <span className="font-bold text-blue-700 flex items-center gap-1">
                      <PhoneCall className="w-3 h-3" />
                      <span>1800 6858</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* BANNER HỖ TRỢ & ĐẶT LỊCH NHANH */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center lg:text-left max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-300">
                Chăm sóc tận tâm — Bác sĩ giàu kinh nghiệm
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Sẵn Sàng Đồng Hành Cùng Trái Tim Của Bạn
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Đừng ngần ngại đặt lịch khám ngay hôm nay để được thăm khám chuyên sâu bởi đội ngũ bác sĩ Tim mạch hàng đầu và theo dõi sức khỏe chủ động.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 shrink-0 w-full sm:w-auto">
              <Link
                to="/"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-100 active:scale-95 text-blue-900 font-black text-xs sm:text-sm transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <span>ĐẶT LỊCH HẸN NGAY</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </Link>
              <Link
                to="/chuyen-gia"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all border border-white/20 flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <span>Xem danh sách bác sĩ</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
