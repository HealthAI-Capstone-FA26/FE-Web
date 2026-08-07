import { PhoneCall, Calendar, FileText, Stethoscope, Microscope, HeartPulse, Play } from 'lucide-react';

const features = [
  { icon: PhoneCall, label: "CẤP CỨU 24/7" },
  { icon: Calendar, label: "ĐẶT LỊCH KHÁM" },
  { icon: FileText, label: "TRA CỨU KẾT QUẢ" },
  { icon: Stethoscope, label: "CHUYÊN GIA" },
  { icon: Microscope, label: "THIẾT BỊ TỐI TÂN" },
  { icon: HeartPulse, label: "CHĂM SÓC CHUẨN" }
];

export const SystemOverviewSection = () => {
  return (
    <section className="py-16 bg-[#fafbfc] w-full border-b border-slate-100">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">

        <div className="flex flex-col lg:flex-row gap-12 items-center">

          {/* Left: Hospital Image */}
          <div className="w-full lg:w-1/2">
            <div className="relative w-full aspect-[4/3] rounded-2xl shadow-md border border-slate-200 overflow-hidden bg-slate-100">
              <img
                src="/images/hospital_lobby_vn.png"
                alt="Hình ảnh bệnh viện Đa Khoa"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Right: Content & Grid */}
          <div className="w-full lg:w-1/2 flex flex-col">

            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-[#0d2a5c] uppercase mb-4 relative inline-block">
                Hệ thống y tế hàng đầu
                <div className="absolute -bottom-2 left-0 w-24 h-1 bg-amber-500 rounded-full lg:left-0 left-1/2 lg:translate-x-0 -translate-x-1/2"></div>
              </h2>
              <p className="text-slate-500 mt-6 leading-relaxed">
                Tự hào mang đến dịch vụ chăm sóc sức khỏe chất lượng cao, quy tụ đội ngũ chuyên gia đầu ngành, trang thiết bị tối tân và quy trình chuẩn quốc tế.
              </p>
            </div>

            {/* Grid of 6 features */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {features.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer h-[120px] group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
                      <Icon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-[11px] font-bold text-[#0d2a5c] uppercase">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
