import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Activity, Award, HeartPulse, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { animate, splitText, stagger } from 'animejs';

const slides = [
  {
    id: 1,
    topLabel: "PHÒNG KHÁM TIM MẠCH 4AM",
    title: "HỆ THỐNG Y TẾ CHUẨN QUỐC TẾ",
    highlight: "CHẤT LƯỢNG TỐT NHẤT",
    subtitle: "CÔNG BỐ CỦA SỞ Y TẾ THÀNH PHỐ",
    badges: [
      { text: "Chuyên gia Bác sĩ giỏi", icon: Award },
      { text: "Thiết bị hiện đại", icon: Activity },
      { text: "Hiệu quả điều trị cao", icon: ShieldCheck },
      { text: "Chi phí hợp lý", icon: HeartPulse }
    ],
    cta: "ĐĂNG KÝ KHÁM BỆNH",
    image: "/images/hero_general.png",
    bgTheme: "from-[#002f87] via-[#0042b3] to-[#001a52]"
  },
  {
    id: 2,
    topLabel: "CHUYÊN KHOA TIM MẠCH",
    title: "CHĂM SÓC & CAN THIỆP TIM MẠCH",
    highlight: "ÍT XÂM LẤN - HỒI PHỤC NHANH",
    subtitle: "PHÒNG MỔ HYBRID ĐẠT TIÊU CHUẨN QUỐC TẾ CỰC KỲ NGHIÊM NGẶT",
    badges: [
      { text: "Cá thể hóa 100%", icon: HeartPulse },
      { text: "Chuẩn xác từng milimet", icon: Activity },
      { text: "Tránh biến chứng", icon: ShieldCheck }
    ],
    cta: "TÌM HIỂU CHUYÊN KHOA",
    image: "/images/hero_cardio.png",
    bgTheme: "from-[#004aad] via-[#005cce] to-[#002366]"
  },
  {
    id: 3,
    topLabel: "CÔNG NGHỆ MỚI NHẤT",
    title: "TẦM SOÁT UNG THƯ CHUYÊN SÂU",
    highlight: "CHÍNH XÁC - KỊP THỜI",
    subtitle: "PHÁT HIỆN SỚM RỦI RO VỚI CÔNG NGHỆ CT/MRI THẾ HỆ MỚI",
    badges: [
      { text: "Siêu nhanh 10 giây", icon: Clock },
      { text: "Đường mổ siêu nhỏ", icon: Activity },
      { text: "Gần 100% an toàn", icon: ShieldCheck }
    ],
    cta: "TƯ VẤN NGAY VỚI CHUYÊN GIA",
    image: "/images/hero_screening.png",
    bgTheme: "from-[#003399] via-[#0047cc] to-[#001f5c]"
  }
];

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const topLabelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const highlightRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const subtitleLineLeftRef = useRef<HTMLDivElement>(null);
  const subtitleLineRightRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    const cleanups: Array<{ revert: () => void }> = [];

    if (titleRef.current) {
      const titleSplit = splitText(titleRef.current, {
        lines: { wrap: 'clip' },
      });
      titleSplit.addEffect(({ lines }) =>
        animate(lines, {
          y: ['100%', '0%'],
          duration: 750,
          ease: 'out(3)',
          delay: stagger(150, { start: 80 }),
        })
      );
      cleanups.push(titleSplit);
    }

    if (highlightRef.current) {
      const highlightSplit = splitText(highlightRef.current, {
        lines: { wrap: 'clip' },
      });
      highlightSplit.addEffect(({ lines }) =>
        animate(lines, {
          y: ['100%', '0%'],
          duration: 750,
          ease: 'out(3)',
          delay: stagger(180, { start: 220 }),
        })
      );
      cleanups.push(highlightSplit);
    }

    if (subtitleRef.current) {
      const subtitleSplit = splitText(subtitleRef.current, {
        lines: { wrap: 'clip' },
      });
      subtitleSplit.addEffect(({ lines }) =>
        animate(lines, {
          y: ['100%', '0%'],
          duration: 700,
          ease: 'out(3)',
          delay: stagger(150, { start: 380 }),
        })
      );
      cleanups.push(subtitleSplit);
    }

    if (topLabelRef.current) {
      cleanups.push(
        animate(topLabelRef.current, {
          y: [-16, 0],
          opacity: [0, 1],
          scale: [0.94, 1],
          duration: 500,
          ease: 'out(3)',
        })
      );
    }

    if (subtitleLineLeftRef.current && subtitleLineRightRef.current) {
      cleanups.push(
        animate([subtitleLineLeftRef.current, subtitleLineRightRef.current], {
          scaleX: [0, 1],
          opacity: [0, 1],
          duration: 500,
          ease: 'out(3)',
          delay: 360,
        })
      );
    }

    const badgeItems = badgesRef.current
      ? Array.from(badgesRef.current.children)
      : [];
    if (badgeItems.length) {
      cleanups.push(
        animate(badgeItems, {
          y: [18, 0],
          opacity: [0, 1],
          scale: [0.92, 1],
          duration: 550,
          ease: 'out(3)',
          delay: stagger(90, { start: 500 }),
        })
      );
    }

    if (ctaRef.current) {
      cleanups.push(
        animate(ctaRef.current, {
          y: [18, 0],
          opacity: [0, 1],
          scale: [0.95, 1],
          duration: 550,
          ease: 'out(3)',
          delay: 680,
        })
      );
    }

    return () => {
      cleanups.forEach((item) => item.revert());
    };
  }, [currentSlide]);

  return (
    <section className="relative w-full min-h-[70vh] lg:min-h-[600px] overflow-hidden flex items-center bg-blue-900 group">

      {/* Dynamic Background Gradient */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id + "bg"}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.5 }}
          transition={{ duration: 1 }}
          className={`absolute inset-0 bg-gradient-to-r ${slide.bgTheme} z-0`}
        />
      </AnimatePresence>

      {/* Abstract light rays/waves for "promotional" effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_0%,transparent_50%)] transform rotate-12" />
        <div className="absolute bottom-[-50%] right-[-10%] w-[120%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,transparent_50%)] transform -rotate-12" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 z-10 py-12 lg:py-0 h-full flex items-center">
        
        {/* Right Side: Image (Background layer on lg screens) */}
        <div className="absolute inset-0 lg:left-auto lg:right-0 lg:w-[55%] h-full z-10 flex items-center justify-end opacity-40 lg:opacity-100 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, scale: 0.95, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -30 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full h-full relative flex items-center justify-end"
            >
              <div 
                className="w-full h-[50%] lg:h-full relative lg:-mr-16 xl:-mr-32 flex justify-end items-center"
                style={{
                  maskImage: 'linear-gradient(to right, transparent 0%, black 25%, black 100%)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 25%, black 100%)'
                }}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover object-right lg:object-center rounded-2xl lg:shadow-2xl"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Left Side: Content */}
        <div
          ref={contentRef}
          key={slide.id}
          className="w-full lg:w-[80%] xl:w-[75%] flex flex-col items-start justify-center text-left z-20 relative"
        >
          {/* Top Label */}
          <div ref={topLabelRef} className="mb-4 opacity-0">
            <span className="inline-block bg-white text-blue-900 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
              {slide.topLabel}
            </span>
          </div>

          {/* Main Title (White) */}
          <h2
            ref={titleRef}
            className="text-3xl md:text-4xl lg:text-[2.75rem] xl:text-5xl font-extrabold text-white uppercase tracking-tight leading-[1.42] mb-2 drop-shadow-md lg:whitespace-nowrap"
          >
            {slide.title}
          </h2>

          {/* Highlight Title (Yellow/Gold) */}
          <h1
            ref={highlightRef}
            className="text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold text-yellow-400 uppercase tracking-tight leading-[1.4] drop-shadow-lg mb-6 lg:whitespace-nowrap"
          >
            {slide.highlight}
          </h1>

          {/* Subtitle */}
          <div className="flex items-center gap-4 mb-8">
            <div
              ref={subtitleLineLeftRef}
              className="h-[2px] w-8 lg:w-12 bg-yellow-400 hidden sm:block origin-right opacity-0"
            />
            <p
              ref={subtitleRef}
              className="text-base md:text-lg lg:text-xl text-white font-medium uppercase tracking-wide leading-[1.45] drop-shadow-md lg:whitespace-nowrap"
            >
              {slide.subtitle}
            </p>
            <div
              ref={subtitleLineRightRef}
              className="h-[2px] w-8 lg:w-12 bg-yellow-400 hidden sm:block origin-left opacity-0"
            />
          </div>

          {/* Badges Grid */}
          <div ref={badgesRef} className="flex flex-wrap gap-3 mb-10">
            {slide.badges.map((badge, idx) => (
              <div
                key={idx}
                className="opacity-0 flex items-center gap-2 bg-gradient-to-b from-yellow-300 to-yellow-500 text-[#002f87] px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg shadow-lg border border-yellow-200"
              >
                <badge.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="font-bold text-xs lg:text-sm uppercase tracking-tight">{badge.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            ref={ctaRef}
            className="opacity-0 group relative overflow-hidden rounded-full bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 lg:px-8 lg:py-4 text-white font-bold text-base lg:text-lg uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer"
          >
            <span className="relative z-10">{slide.cta}</span>
            <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
            {/* Button shine effect */}
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
          </button>
        </div>

      </div>

      {/* Edge Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 lg:left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/20 hover:bg-black/50 text-white/70 hover:text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-30 opacity-0 group-hover:opacity-100"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-2 lg:right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/20 hover:bg-black/50 text-white/70 hover:text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-30 opacity-0 group-hover:opacity-100"
        aria-label="Next slide"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Slide Indicator Dots (Bottom center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-2 rounded-full transition-all duration-300 shadow-sm ${
              currentSlide === idx ? "w-8 bg-yellow-400" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

    </section>
  );
};

