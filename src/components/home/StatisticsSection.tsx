import { TrendingDown, Users, FileCheck, Zap } from 'lucide-react';

export const StatisticsSection = () => {
  return (
    <section className="py-20 bg-blue-600 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 40L40 0H20L0 20M40 40V20L20 40" fill="none" stroke="currentColor" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-blue-500/50 p-4 rounded-2xl mb-6 shadow-inner border border-blue-400/30">
              <TrendingDown className="w-8 h-8 text-blue-100" />
            </div>
            <div className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">45%</div>
            <div className="text-blue-100 text-sm md:text-base font-medium">Giảm thời gian xem hồ sơ</div>
            <div className="text-xs text-blue-300 mt-2 font-mono bg-blue-700/50 px-2 py-1 rounded">[SỐ LIỆU MINH HỌA]</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-blue-500/50 p-4 rounded-2xl mb-6 shadow-inner border border-blue-400/30">
              <Zap className="w-8 h-8 text-blue-100" />
            </div>
            <div className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">60%</div>
            <div className="text-blue-100 text-sm md:text-base font-medium">Tăng tốc độ ra y lệnh</div>
            <div className="text-xs text-blue-300 mt-2 font-mono bg-blue-700/50 px-2 py-1 rounded">[SỐ LIỆU MINH HỌA]</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-blue-500/50 p-4 rounded-2xl mb-6 shadow-inner border border-blue-400/30">
              <Users className="w-8 h-8 text-blue-100" />
            </div>
            <div className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">10k+</div>
            <div className="text-blue-100 text-sm md:text-base font-medium">Bệnh án mô phỏng</div>
            <div className="text-xs text-blue-300 mt-2 font-mono bg-blue-700/50 px-2 py-1 rounded">[SỐ LIỆU MINH HỌA]</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-blue-500/50 p-4 rounded-2xl mb-6 shadow-inner border border-blue-400/30">
              <FileCheck className="w-8 h-8 text-blue-100" />
            </div>
            <div className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">100%</div>
            <div className="text-blue-100 text-sm md:text-base font-medium">Tuân thủ chuẩn FHIR</div>
            <div className="text-xs text-blue-300 mt-2 font-mono bg-blue-700/50 px-2 py-1 rounded">[SỐ LIỆU MINH HỌA]</div>
          </div>
        </div>
      </div>
    </section>
  );
};
