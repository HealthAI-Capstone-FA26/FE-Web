import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Phone } from 'lucide-react';

const slides = [
  {
    id: 1,
    titleTop: "LẦN ĐẦU TIÊN TẠI VIỆT NAM",
    titleMainWhite: "BỆNH VIỆN MAI PHƯƠNG",
    titleMainYellow: "TRUNG TÂM KHÁM CHỮA BỆNH CHUẨN QUỐC TẾ",
    features: [
      "Khám chữa bệnh chất lượng cao với chuyên gia đầu ngành",
      "Hệ thống trang thiết bị y tế hiện đại thế hệ mới nhất"
    ],
    badge: "TƯ VẤN TRỰC TUYẾN",
    cta: "ĐĂNG KÝ NGAY",
    image: "/images/hero_general.png"
  },
  {
    id: 2,
    titleTop: "CHUYÊN KHOA UNG BƯỚU",
    titleMainWhite: "TẦM SOÁT UNG THƯ SỚM",
    titleMainYellow: "CÔNG NGHỆ CHẨN ĐOÁN HÌNH ẢNH CAO CẤP",
    features: [
      "Phát hiện sớm các rủi ro thầm lặng với công nghệ MRI/CT",
      "Hội chẩn đa chuyên khoa mang lại phác đồ cá nhân hóa"
    ],
    badge: "ƯU ĐÃI 20%",
    cta: "NHẬN TƯ VẤN GÓI KHÁM",
    image: "/images/hero_screening.png"
  },
  {
    id: 3,
    titleTop: "CHUYÊN KHOA TIM MẠCH",
    titleMainWhite: "TRUNG TÂM TIM MẠCH",
    titleMainYellow: "CAN THIỆP ÍT XÂM LẤN & CHĂM SÓC TÍCH CỰC",
    features: [
      "Quy tụ đội ngũ Giáo sư, Tiến sĩ, Bác sĩ hàng đầu",
      "Phòng mổ Hybrid đạt tiêu chuẩn vô khuẩn quốc tế"
    ],
    badge: "CẤP CỨU 24/7",
    cta: "TÌM HIỂU THÊM",
    image: "/images/hero_cardio.png"
  }
];

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  return (
    <section className="relative w-full h-[650px] md:h-[600px] overflow-hidden bg-[#0a1e42]">

      {/* Slides Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${currentSlide === index ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
          >
            {/* Background Image / Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#06142e] via-[#0d2a5c] to-[#0a1e42]">
              {/* Optional: Add a faint grid or dot pattern here to match Tam Anh's techy background */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-300 via-transparent to-transparent bg-[length:20px_20px]"></div>
            </div>

            {/* Main Content Area */}
            <div className="absolute inset-0 flex flex-col md:flex-row items-center max-w-[1400px] mx-auto px-12 md:px-20 pt-8 pb-28 md:pb-24">

              {/* Left Side: Visual (Images/Doctors) */}
              <div className="w-full md:w-5/12 h-full flex items-center justify-center relative">
                {/* Techy glowing frame for the image */}
                <div className="relative w-full max-w-md aspect-[4/3] rounded-xl overflow-hidden border-2 border-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 z-20"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 z-20"></div>
                  <img
                    src={slide.image}
                    alt={slide.titleMainWhite}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right Side: Text & Marketing Copy */}
              <div className="w-full md:w-7/12 flex flex-col items-center md:items-start text-center md:text-left mt-8 md:mt-0 pl-0 md:pl-12">

                {/* Top Pill */}
                <div className="bg-blue-900/60 border border-blue-400/30 text-cyan-300 px-6 py-1.5 rounded-full font-bold text-sm md:text-base uppercase tracking-widest mb-4 inline-block shadow-sm">
                  {slide.titleTop}
                </div>

                {/* Main Titles */}
                <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-wide leading-tight mb-2 drop-shadow-md">
                  {slide.titleMainWhite}
                </h1>
                <h2 className="text-2xl md:text-4xl font-extrabold text-[#facc15] uppercase tracking-wide leading-tight mb-8 drop-shadow-md">
                  {slide.titleMainYellow}
                </h2>

                {/* Features List */}
                <div className="flex flex-col space-y-4 mb-8 w-full max-w-2xl">
                  {slide.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-3 bg-blue-900/40 p-3 rounded-lg border border-blue-500/20 backdrop-blur-sm">
                      <div className="bg-yellow-400 rounded-full p-0.5 shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-blue-900" />
                      </div>
                      <span className="text-white font-bold text-sm md:text-base">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Badge Highlight */}
                <div className="flex items-center space-x-4">
                  <div className="bg-red-600 text-white font-black text-xl md:text-2xl px-6 py-2 rounded-lg shadow-lg border border-red-500 uppercase tracking-widest animate-pulse">
                    {slide.badge}
                  </div>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Persistent Bottom CTA Bar (Stays exact same across all slides) */}
      <div className="absolute bottom-0 left-0 right-0 h-16 md:h-20 flex z-30 shadow-2xl border-t border-white/10">
        {/* Left Red CTA Box */}
        <div className="w-2/5 md:w-1/3 bg-gradient-to-r from-[#d91e1e] to-[#e62a2a] flex items-center justify-end pr-6 md:pr-12 cursor-pointer hover:from-[#b91818] hover:to-[#c01d1d] transition-colors relative group">
          <span className="text-white font-black text-lg md:text-3xl uppercase tracking-wider drop-shadow-md mr-2">
            Đăng ký ngay
          </span>
          <ChevronRight className="w-8 h-8 md:w-12 md:h-12 text-white/50 group-hover:text-white transition-colors" />

          {/* Angle cut effect (simulated with border) */}
          <div className="absolute top-0 -right-8 w-0 h-0 border-t-[64px] border-l-[32px] md:border-t-[80px] border-t-transparent border-l-[#e62a2a] group-hover:border-l-[#c01d1d] transition-colors z-20"></div>
        </div>

        {/* Right Blue Info Box */}
        <div className="w-3/5 md:w-2/3 bg-gradient-to-r from-[#0052a2] to-[#004080] flex items-center pl-12 md:pl-20 text-white shadow-inner">
          <Phone className="w-6 h-6 md:w-8 md:h-8 mr-3 text-cyan-300" />
          <div className="flex flex-col md:flex-row md:items-center text-sm md:text-2xl font-bold tracking-wide">
            <span className="mr-0 md:mr-2">028 7102 6789 <span className="text-cyan-300 font-medium text-xs md:text-lg">(TP.HCM)</span></span>
            <span className="hidden md:inline mx-2">-</span>
            <span>024 7106 6858 <span className="text-cyan-300 font-medium text-xs md:text-lg">(Hà Nội)</span></span>
          </div>
        </div>
      </div>

      {/* Carousel Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 border border-white/20 flex items-center justify-center text-white z-40 transition-colors backdrop-blur-sm hidden md:flex"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 border border-white/20 flex items-center justify-center text-white z-40 transition-colors backdrop-blur-sm hidden md:flex"
      >
        <ChevronRight className="w-8 h-8" />
      </button>



    </section>
  );
};
