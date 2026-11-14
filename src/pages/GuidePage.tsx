import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  FileText,
  Activity,
  CalendarCheck,
  QrCode,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  HelpCircle,
  Pill,
  Clock,
  HeartPulse,
  Download,
  Lock,
  ChevronDown,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const GuidePage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const steps = [
    {
      step: '01',
      title: 'Nhận Mã Hồ Sơ & Giấy Tờ Khi Rời Phòng Khám',
      subtitle: 'Giữ lại phiếu khám có mã QR hoặc tin nhắn kích hoạt',
      icon: QrCode,
      color: 'blue',
      badge: 'Tại phòng khám',
      desc: 'Sau khi hoàn tất buổi khám, quý khách nhận Tờ tóm tắt bệnh án & Đơn thuốc có in sẵn Mã bệnh nhân (Patient ID) và mã QR tra cứu cá nhân. Đồng thời hệ thống sẽ gửi tin nhắn SMS/Zalo thông báo hồ sơ đã sẵn sàng.',
      highlights: [
        'Giữ gìn phiếu khám hoặc chụp lại ảnh mã QR trên điện thoại',
        'Tin nhắn SMS chứa đường link truy cập nhanh trực tiếp vào hồ sơ',
        'Mỗi bệnh nhân có một mã hồ sơ định danh duy nhất bảo mật'
      ]
    },
    {
      step: '02',
      title: 'Quét Mã QR Hoặc Nhấp Link Bảo Mật',
      subtitle: 'Truy cập bảo mật bằng thiết bị cá nhân',
      icon: Smartphone,
      color: 'indigo',
      badge: 'Thao tác tại nhà',
      desc: 'Để bảo vệ dữ liệu y tế cá nhân và phòng tránh rò rỉ thông tin, quý khách quét trực tiếp mã QR được in trên Phiếu kết quả khám hoặc nhấp vào đường link tra cứu riêng gửi qua tin nhắn SMS/Zalo của phòng khám.',
      highlights: [
        'Mã QR và liên kết được mã hóa định danh riêng cho từng bệnh nhân',
        'Xác thực an toàn bằng mã OTP gửi về số điện thoại đã đăng ký khám',
        'Hoạt động trực tiếp trên trình duyệt điện thoại (Safari, Chrome), không cần tải app'
      ]
    },
    {
      step: '03',
      title: 'Tra Cứu Kết Quả & Đơn Thuốc Điện Tử',
      subtitle: 'Xem toàn bộ chẩn đoán, ECG, siêu âm và chỉ dẫn dùng thuốc',
      icon: FileText,
      color: 'emerald',
      badge: 'Tra cứu chi tiết',
      desc: 'Tại mục "Hồ sơ y tế" và "Đơn thuốc", toàn bộ thông tin về đợt khám của bạn được số hóa minh bạch, trực quan theo chuẩn y tế quốc tế FHIR R4.',
      highlights: [
        'Đơn thuốc điện tử: Tên thuốc, số lượng, cách uống Sáng - Trưa - Chiều - Tối, lưu ý trước/sau ăn',
        'Kết quả cận lâm sàng: Biểu đồ Điện tâm đồ (ECG), phiếu kết quả Siêu âm tim Doppler, Xét nghiệm men tim',
        'Hỗ trợ tải phiếu kết quả dạng PDF hoặc in ra giấy khi cần hội chẩn'
      ]
    },
    {
      step: '04',
      title: 'Theo Dõi Sinh Hiệu & Nhắc Lịch Tái Khám',
      subtitle: 'Tự động nhắc nhở uống thuốc và hẹn tái khám định kỳ',
      icon: CalendarCheck,
      color: 'amber',
      badge: 'Đồng hành dài hạn',
      desc: 'Hệ thống tự động lên lịch nhắc tái khám trước 1 - 2 ngày qua SMS/Zalo. Quý khách cũng có thể ghi nhận chỉ số huyết áp, nhịp tim đo tại nhà để bác sĩ đánh giá trong lần khám kế tiếp.',
      highlights: [
        'Nhận thông báo nhắc lịch tái khám theo chỉ định của Bác sĩ',
        'Chủ động bấm xác nhận hoặc chọn lại giờ tái khám tiện lợi',
        'Ghi chú nhật ký huyết áp tại nhà để theo dõi diễn tiến điều trị'
      ]
    }
  ];

  const features = [
    {
      icon: Pill,
      title: 'Đơn Thuốc Điện Tử Rõ Ràng',
      desc: 'Không lo thất lạc giấy khám. Toàn bộ tên thuốc, hàm lượng, giờ uống và chống chỉ định đều hiển thị rõ ràng, dễ đọc cho người cao tuổi.'
    },
    {
      icon: Activity,
      title: 'Bản Ghi ECG & Siêu Âm Tim Số',
      desc: 'Toàn bộ sóng điện tim ECG và hình ảnh siêu âm tim Doppler được lưu trữ điện tử, dễ dàng mở lại kiểm tra so sánh qua từng đợt khám.'
    },
    {
      icon: HeartPulse,
      title: 'Theo Dõi Huyết Áp Tại Nhà',
      desc: 'Giao diện cho phép cập nhật chỉ số huyết áp đo hàng ngày, tự động vẽ biểu đồ giúp bác sĩ điều chỉnh liều thuốc hạ áp chính xác nhất.'
    },
    {
      icon: Lock,
      title: 'Bảo Mật Chuẩn Y Tế FHIR R4',
      desc: 'Dữ liệu sức khỏe của bạn được mã hóa an toàn, chỉ có bạn và bác sĩ điều trị trực tiếp mới có quyền truy cập.'
    }
  ];

  const faqs = [
    {
      q: 'Làm thế nào để tôi truy cập được hồ sơ kết quả khám của mình?',
      a: 'Để bảo mật thông tin bệnh án và phòng ngừa rò rỉ dữ liệu, phòng khám không mở công khai cổng đăng nhập trực tiếp trên trang chủ. Quý khách vui lòng quét mã QR in trên Phiếu kết quả khám hoặc nhấp vào đường link tra cứu bảo mật được gửi qua tin nhắn SMS/Zalo sau buổi khám.'
    },
    {
      q: 'Sau khi rời phòng khám bao lâu thì có đầy đủ kết quả trên liên kết tra cứu?',
      a: 'Chẩn đoán lâm sàng và Đơn thuốc điện tử của bác sĩ sẽ sẵn sàng ngay khi kết thúc buổi khám. Các kết quả xét nghiệm sinh hóa chuyên sâu (Troponin, Lipid...) và siêu âm tim sẽ được cập nhật tối đa trong vòng 30 - 60 phút.'
    },
    {
      q: 'Tôi bị mất phiếu khám hoặc không nhận được tin nhắn thì làm sao?',
      a: 'Quý khách vui lòng gọi ngay đến Tổng đài Hỗ trợ khách hàng 0287 102 6789. Sau khi nhân viên y tế đối chiếu họ tên và số CCCD để xác minh danh tính, hệ thống sẽ cấp lại đường link tra cứu bảo mật về điện thoại của quý khách.'
    },
    {
      q: 'Nếu ở nhà uống thuốc gặp tác dụng phụ hoặc khó chịu thì liên hệ ai?',
      a: 'Quý khách vui lòng gọi ngay đường dây nóng chăm sóc khách hàng 0287 102 6789 để được bác sĩ trực tư vấn hướng xử trí, hoặc đến cơ sở y tế gần nhất nếu có dấu hiệu đau ngực, khó thở cấp tính.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0b3c8f]/10 via-[#0b3c8f]/5 to-transparent pt-12 pb-16 md:pt-16 md:pb-20 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200/60 text-[#0b3c8f] text-xs font-semibold uppercase tracking-wider mb-4">
              <HeartPulse className="w-3.5 h-3.5 text-blue-700" />
              <span>Chăm sóc tim mạch sau khám</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-[#0d2a5c] tracking-tight leading-tight mb-4">
              Hướng Dẫn Theo Dõi Kết Quả Khám Khi Về Nhà
            </h1>

            <p className="text-base md:text-lg text-slate-600 leading-relaxed font-sans mb-8">
              Quy trình 4 bước đơn giản giúp quý bệnh nhân dễ dàng tra cứu đơn thuốc điện tử, kết quả xét nghiệm cận lâm sàng tim mạch, theo dõi chỉ số huyết áp và nhận nhắc hẹn tái khám mọi lúc, mọi nơi.
            </p>


          </div>
        </div>
      </section>

      {/* Red Alert / Emergency Guide Banner */}


      {/* 4 Steps Journey */}
      <main id="quy-trinh" className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20 w-full scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0b3c8f] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Quy trình tra cứu
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0d2a5c] tracking-tight mt-3">
            4 Bước Theo Dõi Sức Khỏe Tại Nhà
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-2 font-sans">
            Không cần đến trực tiếp phòng khám, bạn có thể nắm trọn vẹn diễn biến sức khỏe tim mạch của mình chỉ với vài thao tác.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/70 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#0b3c8f]/10 text-[#0b3c8f] flex items-center justify-center font-bold">
                        <Icon className="w-6 h-6" strokeWidth={1.8} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                        {item.badge}
                      </span>
                    </div>
                    <span className="text-2xl md:text-3xl font-black text-slate-200 font-mono">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-lg md:text-xl font-bold text-[#0d2a5c] tracking-tight leading-snug mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs font-semibold text-blue-700 mb-3 font-sans">
                    {item.subtitle}
                  </p>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-sans mb-6">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Điểm cần lưu ý:
                  </h4>
                  <ul className="space-y-2">
                    {item.highlights.map((h, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <section className="max-w-7xl mx-auto px-6 lg:px-8 -mt-6 relative z-10 w-full">
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200/80 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-950 uppercase tracking-wide">
                Lưu ý an toàn tim mạch tại nhà
              </h2>
              <p className="text-xs text-rose-900/90 leading-relaxed font-sans mt-0.5">
                Nếu xuất hiện cơn đau thắt ngực dữ dội kéo dài &gt; 15 phút, khó thở đột ngột, ngất xỉu hoặc nhịp tim đập bất thường &gt; 120 nhịp/phút khi nghỉ, vui lòng gọi cấp cứu <strong>115</strong> hoặc đến cơ sở y tế gần nhất ngay lập tức.
              </p>
            </div>
          </div>
          <a
            href="tel:115"
            className="shrink-0 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs"
          >
            Gọi cấp cứu 115
          </a>
        </div>
      </section>
      {/* Feature Highlights Bento */}
      <section className="bg-slate-100/70 py-16 md:py-20 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Tiện ích số hóa
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0d2a5c] tracking-tight mt-2">
              Lợi Ích Khi Quản Lý Hồ Sơ Điện Tử
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-xs hover:border-blue-200 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0b3c8f] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) */}
      <section className="max-w-4xl mx-auto px-6 lg:px-8 py-16 md:py-20 w-full">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0b3c8f] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Hỗ trợ giải đáp
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0d2a5c] tracking-tight mt-3">
            Câu Hỏi Thường Gặp Sau Khi Khám
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-2 font-sans">
            Những thắc mắc phổ biến của bệnh nhân trong quá trình dùng thuốc và theo dõi bệnh tại nhà.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-semibold text-slate-800 hover:text-[#0b3c8f] transition-colors"
                >
                  <span className="text-sm md:text-base leading-snug">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#0b3c8f]' : ''
                      }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-slate-600 leading-relaxed font-sans border-t border-slate-100">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-r from-[#0b3c8f] to-[#0d2a5c] text-white py-14">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">
            Cần Hỗ Trợ Tra Cứu Hoặc Hẹn Lịch Khám Lại?
          </h2>
          <p className="text-sm md:text-base text-blue-100/90 max-w-2xl mx-auto font-sans leading-relaxed mb-8">
            Bộ phận Chăm sóc khách hàng và Đội ngũ Điều dưỡng Tim mạch 4AM sẵn sàng giải đáp thắc mắc về đơn thuốc và hỗ trợ tra cứu hồ sơ kết quả 24/7.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:02871026789"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-slate-100 text-[#0b3c8f] font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-md active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Tổng đài hỗ trợ: 0287 102 6789</span>
            </a>
            <Link
              to="/chuyen-khoa"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs uppercase tracking-wider transition-all duration-300"
            >
              <span>Xem danh mục chuyên khoa</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

