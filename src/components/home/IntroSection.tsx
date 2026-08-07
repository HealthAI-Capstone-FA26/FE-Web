import { PhoneCall, CalendarPlus, FileSearch, Stethoscope, Microscope, HeartPulse } from 'lucide-react';

export const IntroSection = () => {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Left Column: Visual Placeholder */}
          <div className="w-full lg:w-1/2">
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-blue-100 shadow-xl border border-slate-200 group">
              <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-transparent transition-colors duration-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[14px] border-l-blue-600 border-b-8 border-b-transparent ml-2"></div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <span className="bg-white/90 text-blue-900 font-semibold px-4 py-1.5 rounded-full text-sm shadow-sm">
                  [Video giới thiệu bệnh viện]
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Content & Actions */}
          <div className="w-full lg:w-1/2">
            <div className="text-center lg:text-left mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0d2a5c] uppercase tracking-tight mb-4">
                Hệ thống Y tế Hàng đầu
              </h2>
              <div className="w-24 h-1 bg-amber-500 mx-auto lg:mx-0 mb-6"></div>
              <p className="text-slate-600 text-lg leading-relaxed font-light">
                Tự hào mang đến dịch vụ chăm sóc sức khỏe chất lượng cao, quy tụ đội ngũ chuyên gia đầu ngành, trang thiết bị tối tân và quy trình chuẩn quốc tế.
              </p>
            </div>

            {/* Grid Action Icons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white hover:bg-blue-600 group rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center transition-colors cursor-pointer">
                <div className="w-14 h-14 bg-blue-50 group-hover:bg-white/20 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <PhoneCall className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <span className="font-bold text-slate-800 group-hover:text-white transition-colors text-sm uppercase">Cấp cứu 24/7</span>
              </div>

              <div className="bg-white hover:bg-blue-600 group rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center transition-colors cursor-pointer">
                <div className="w-14 h-14 bg-blue-50 group-hover:bg-white/20 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <CalendarPlus className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <span className="font-bold text-slate-800 group-hover:text-white transition-colors text-sm uppercase">Đặt lịch khám</span>
              </div>

              <div className="bg-white hover:bg-blue-600 group rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center transition-colors cursor-pointer">
                <div className="w-14 h-14 bg-blue-50 group-hover:bg-white/20 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <FileSearch className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <span className="font-bold text-slate-800 group-hover:text-white transition-colors text-sm uppercase">Tra cứu kết quả</span>
              </div>

              <div className="bg-white hover:bg-blue-600 group rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center transition-colors cursor-pointer">
                <div className="w-14 h-14 bg-blue-50 group-hover:bg-white/20 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <Stethoscope className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <span className="font-bold text-slate-800 group-hover:text-white transition-colors text-sm uppercase">Chuyên gia</span>
              </div>

              <div className="bg-white hover:bg-blue-600 group rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center transition-colors cursor-pointer">
                <div className="w-14 h-14 bg-blue-50 group-hover:bg-white/20 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <Microscope className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <span className="font-bold text-slate-800 group-hover:text-white transition-colors text-sm uppercase">Thiết bị tối tân</span>
              </div>

              <div className="bg-white hover:bg-blue-600 group rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center transition-colors cursor-pointer">
                <div className="w-14 h-14 bg-blue-50 group-hover:bg-white/20 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <HeartPulse className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <span className="font-bold text-slate-800 group-hover:text-white transition-colors text-sm uppercase">Chăm sóc chuẩn</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
