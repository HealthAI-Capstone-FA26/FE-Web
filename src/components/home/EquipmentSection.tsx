export const EquipmentSection = () => {
  return (
    <section className="bg-white flex flex-col md:flex-row min-h-[600px] border-b border-slate-100">

      {/* Left Blue Bar */}
      <div className="hidden md:block w-16 lg:w-32 bg-[#1da1f2] flex-shrink-0"></div>

      <div className="flex-grow flex flex-col py-16 px-4 md:px-8 lg:px-12 max-w-[1200px] mx-auto w-full">
        <div className="mb-8">

          <h2 className="text-3xl font-light text-[#1da1f2] mb-3 relative inline-block">
            Trang thiết bị hiện đại
          </h2>
          <p className="text-slate-600 mt-6">
            Bệnh viện sở hữu hệ thống trang thiết bị cao cấp phục vụ công tác chẩn đoán và điều trị.
          </p>
        </div>

        {/* Masonry / Collage Grid for Equipment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[250px]">

          {/* Large Image - CT Scanner */}
          <div className="md:col-span-2 row-span-2 overflow-hidden">
            <img
              src="/images/equipment_ct.png"
              alt="CT Scanner"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Small Image 1 - MRI */}
          <div className="md:col-span-1 row-span-1 overflow-hidden">
            <img
              src="/images/equipment_mri.png"
              alt="MRI Machine"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Small Image 2 - Ultrasound */}
          <div className="md:col-span-1 row-span-1 overflow-hidden">
            <img
              src="/images/equipment_ultrasound.png"
              alt="Ultrasound"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>

        </div>
      </div>

      {/* Right Blue Bar */}
      <div className="hidden md:block w-16 lg:w-32 bg-[#1da1f2] flex-shrink-0"></div>

    </section>
  );
};
