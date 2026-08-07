export const ServicesSection = () => {
  return (
    <section className="bg-white py-16 border-b border-slate-100">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12">
        
        <div className="mb-12">
          <h2 className="text-3xl font-light text-[#1da1f2] mb-3 relative inline-block">
            Dịch vụ cao cấp - Chi phí hợp lý
          </h2>
          <p className="text-slate-600 mt-6">
            Đội ngũ chăm sóc khách hàng chuyên nghiệp, tư vấn miễn phí qua tổng đài, website và fanpage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="overflow-hidden group rounded-xl shadow-sm border border-slate-200">
            <img 
              src="/images/hospital_lobby_vn.png" 
              alt="Sảnh chờ cao cấp" 
              className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="overflow-hidden group rounded-xl shadow-sm border border-slate-200">
            <img 
              src="/images/hospital_room_vn.png" 
              alt="Phòng bệnh nhân nội trú" 
              className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="overflow-hidden group rounded-xl shadow-sm border border-slate-200">
            <img 
              src="/images/hospital_customer_vn.png" 
              alt="Chăm sóc khách hàng" 
              className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="overflow-hidden group rounded-xl shadow-sm border border-slate-200">
            <img 
              src="/images/hospital_reception_vn.png" 
              alt="Quầy tiếp đón" 
              className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

        </div>

      </div>
    </section>
  );
};
