import { Stethoscope, Hospital, BriefcaseMedical, ClipboardList, HandCoins } from 'lucide-react';

const values = [
  {
    icon: Stethoscope,
    text: "CHUYÊN GIA ĐẦU NGÀNH - BÁC SĨ GIỎI - CHUYÊN VIÊN GIÀU KINH NGHIỆM"
  },
  {
    icon: Hospital,
    text: "TRANG THIẾT BỊ HIỆN ĐẠI BẬC NHẤT"
  },
  {
    icon: BriefcaseMedical,
    text: "HIỆU QUẢ ĐIỀU TRỊ CAO THÀNH TỰU NỔI BẬT"
  },
  {
    icon: ClipboardList,
    text: "QUY TRÌNH TOÀN DIỆN, KHOA HỌC, CHUYÊN NGHIỆP"
  },
  {
    icon: HandCoins,
    text: "DỊCH VỤ CAO CẤP CHI PHÍ HỢP LÝ"
  }
];

export const ValuesSection = () => {
  return (
    <section className="py-16 bg-white w-full border-b border-slate-100">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-4 lg:gap-6">
          {values.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index} 
                className="relative bg-white rounded-2xl rounded-tl-[40px] border-[3px] border-slate-100 p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 group overflow-hidden h-full min-h-[220px]"
              >
                {/* Golden top-left corner accent */}
                <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-br-[100%] rounded-tl-[36px] z-0"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <Icon className="w-14 h-14 md:w-16 md:h-16 text-[#0d2a5c] mb-6 group-hover:scale-110 group-hover:text-blue-600 transition-all duration-300 stroke-[1.5]" />
                  <p className="text-[#0d2a5c] font-bold text-xs md:text-sm leading-relaxed uppercase">
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
