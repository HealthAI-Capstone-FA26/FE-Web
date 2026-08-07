import { Play } from 'lucide-react';

const videoList = [
  {
    id: 1,
    title: "Siêu máy chụp CT SOMATOM Force VB30 (100.000 lát cắt)",
    image: "/images/equipment_ct.png"
  },
  {
    id: 2,
    title: "Khai trương Phòng khám Đa khoa Mai Phương Quận 7",
    image: "/images/service_lobby.png"
  },
  {
    id: 3,
    title: "Bệnh viện khách sạn quốc tế",
    image: "/images/service_room.png"
  },
  {
    id: 4,
    title: "Khám phá vườn cổ tích tại khoa Nhi",
    image: "/images/service_reception.png"
  }
];

export const VideoSection = () => {
  return (
    <section className="bg-white py-16 w-full border-b border-slate-100">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8">
        
        {/* Main Video Player */}
        <div className="relative w-full aspect-[16/9] bg-slate-900 shadow-lg mb-6 rounded-lg overflow-hidden">
          <iframe 
            className="w-full h-full"
            src="https://www.youtube.com/embed/Q0cbNdG2gJ4" 
            title="Siêu máy chụp CT SOMATOM Force VB30" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen
          ></iframe>
        </div>

        {/* Text Below Main Video */}
        <div className="text-center mb-8">
          <h3 className="font-bold text-lg md:text-xl text-[#0d2a5c] mb-1">The state-of-the-art SOMATOM Force VB30 CT scanner (over 100,000 slices)</h3>
          <p className="text-slate-600 text-sm">Bệnh Viện Đa Khoa Mai Phương</p>
        </div>

        {/* Video List */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {videoList.map((video) => (
            <div key={video.id} className="flex flex-col group cursor-pointer">
              <div className="relative w-full aspect-[16/9] overflow-hidden mb-2">
                <img 
                  src={video.image} 
                  alt={video.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                
                {/* Red Play Button */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-10 h-8 md:w-12 md:h-8 bg-[#ff0000] rounded-lg flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 text-white" fill="currentColor" />
                  </div>
                </div>
              </div>
              <p className="text-xs md:text-[13px] text-slate-600 text-center leading-tight">
                {video.title}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
