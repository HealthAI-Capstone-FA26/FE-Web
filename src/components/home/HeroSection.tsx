import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/* 
 * Design Read: Premium medical hero section for patient trust, with a clean clinical-editorial language, 
 * leaning toward Tailwind CSS + Instrument Serif + responsive split-screen layout + custom Motion transitions.
 * 
 * Dial Calibration:
 * - DESIGN_VARIANCE: 7 (Asymmetric editorial layout)
 * - MOTION_INTENSITY: 5 (Smooth, hardware-accelerated transitions)
 * - VISUAL_DENSITY: 3 (Spacious layout, breathing room)
 */

const slides = [
  {
    id: 1,
    category: "LẦN ĐẦU TIÊN TẠI VIỆT NAM",
    title: "Trung tâm Y tế",
    titleItalic: "chuẩn Quốc tế",
    description: "Quy tụ chuyên gia đầu ngành cùng trang thiết bị y khoa hiện đại thế hệ mới nhất, kiến tạo chuẩn mực khám chữa bệnh mới.",
    cta: "Đặt lịch khám",
    image: "/images/hero_general.png"
  },
  {
    id: 2,
    category: "CHUYÊN KHOA TIM MẠCH",
    title: "Chăm sóc và Can thiệp",
    titleItalic: "ít xâm lấn",
    description: "Quy tụ đội ngũ Giáo sư, Tiến sĩ hàng đầu cùng phòng mổ Hybrid đạt tiêu chuẩn vô khuẩn quốc tế cực kỳ nghiêm ngặt.",
    cta: "Tìm hiểu chuyên khoa Tim mạch",
    image: "/images/hero_cardio.png"
  },
  {
    id: 3,
    category: "CHUYÊN KHOA UNG BƯỚU",
    title: "Tầm soát ung thư",
    titleItalic: "công nghệ cao",
    description: "Phát hiện sớm các rủi ro sức khỏe âm thầm bằng công nghệ chẩn đoán hình ảnh CT/MRI thế hệ mới nhất.",
    cta: "Nhận tư vấn tầm soát",
    image: "/images/hero_screening.png"
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
    }, 6000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  const slide = slides[currentSlide];

  return (
    <section className="relative w-full min-h-[80dvh] lg:min-h-[85dvh] overflow-hidden bg-[#FAF9F6] flex items-center py-16 lg:py-24 border-b border-slate-200/50">

      {/* Background Graphic Element - Subtle radial glow */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04)_0%,transparent_70%)] pointer-events-none z-0" />

      <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Side: Content Box */}
          <div className="lg:col-span-6 flex flex-col justify-center text-left max-w-xl lg:max-w-none">

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-start"
              >
                {/* Micro Category Tag */}
                <span className="inline-block rounded-full bg-slate-200/50 border border-slate-300/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600 mb-6">
                  {slide.category}
                </span>

                {/* Title */}
                <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-normal text-slate-900 tracking-tight leading-[1.2] lg:leading-[1.25] mb-6">
                  {slide.title} <br />
                  <span className="italic text-slate-600 font-light">
                    {slide.titleItalic}
                  </span>
                </h1>

                {/* Subtext */}
                <p className="text-base text-slate-600 leading-relaxed font-sans max-w-[45ch] mb-8">
                  {slide.description}
                </p>

                {/* CTA Button-in-Button (Nested Island style) */}
                <button className="group relative rounded-full px-5 py-2.5 bg-slate-900 text-white font-medium text-sm flex items-center gap-4 hover:bg-slate-800 active:scale-[0.98] transition-all duration-300 shadow-sm shadow-black/5">
                  <span>{slide.cta}</span>
                  <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              </motion.div>
            </AnimatePresence>

          </div>

          {/* Right Side: Image with Doppelrand Bezel */}
          <div className="lg:col-span-6 flex justify-center items-center w-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-lg lg:max-w-none"
              >
                {/* Double-Bezel Enclosure */}
                <div className="bg-slate-100/60 p-2 rounded-[2.5rem] border border-slate-200/50 shadow-sm shadow-slate-200/30">
                  <div className="inner-core bg-white rounded-[calc(2.5rem-0.5rem)] overflow-hidden aspect-[4/3] relative group shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-102"
                    />
                    {/* Minimal aesthetic gradient overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent pointer-events-none" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

        {/* Carousel Navigation & Indicators */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-200/40">

          {/* Slide Indicator Dots */}
          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentSlide(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === idx ? "w-6 bg-slate-900" : "w-1.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Minimalist Prev/Next Arrows */}
          <div className="flex gap-3">
            <button
              onClick={prevSlide}
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.95]"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.95]"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
