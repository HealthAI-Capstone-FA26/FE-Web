import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const videoList = [
  {
    id: "o1zDKdvAtgo",
    title: "Video giới thiệu Bệnh viện Đa khoa Tâm Anh 1",
    source: "Nguồn: Bệnh viện Đa khoa Tâm Anh",
    image: "https://img.youtube.com/vi/o1zDKdvAtgo/hqdefault.jpg"
  },
  {
    id: "cF8ZWOQJmHU",
    title: "Video giới thiệu Bệnh viện Đa khoa Tâm Anh 2",
    source: "Nguồn: Bệnh viện Đa khoa Tâm Anh",
    image: "https://img.youtube.com/vi/cF8ZWOQJmHU/hqdefault.jpg"
  },
  {
    id: "MxlfxXElEEc",
    title: "Bản tin Y tế & Sức khỏe cộng đồng",
    source: "Nguồn: VTV24 Sức khỏe",
    image: "https://img.youtube.com/vi/MxlfxXElEEc/hqdefault.jpg"
  },
  {
    id: "FdREBcvNP1s",
    title: "Kiến thức y khoa: Nhận biết và phòng ngừa bệnh",
    source: "Nguồn: Bệnh viện Đa khoa Tâm Anh",
    image: "https://img.youtube.com/vi/FdREBcvNP1s/hqdefault.jpg"
  },
  {
    id: "ky54Jhh0ugk",
    title: "Tư vấn sức khỏe: Bệnh lý tim mạch và cách điều trị",
    source: "Nguồn: Bệnh viện Đa khoa Tâm Anh",
    image: "https://img.youtube.com/vi/ky54Jhh0ugk/hqdefault.jpg"
  },
  {
    id: "osIQA2xRrVQ",
    title: "Tìm hiểu về các phương pháp chẩn đoán hình ảnh tiên tiến",
    source: "Nguồn: Bệnh viện Đa khoa Tâm Anh",
    image: "https://img.youtube.com/vi/osIQA2xRrVQ/hqdefault.jpg"
  },
  {
    id: "Qm74Xqq0vFc",
    title: "Hướng dẫn chăm sóc sức khỏe thai kỳ cho mẹ bầu",
    source: "Nguồn: Bệnh viện Đa khoa Tâm Anh",
    image: "https://img.youtube.com/vi/Qm74Xqq0vFc/hqdefault.jpg"
  },
  {
    id: "RqAbVBi1eQk",
    title: "Ứng dụng công nghệ nội soi tiêu hóa không đau",
    source: "Nguồn: Bệnh viện Đa khoa Tâm Anh",
    image: "https://img.youtube.com/vi/RqAbVBi1eQk/hqdefault.jpg"
  }
];

export const VideoSection = () => {
  const [activeVideo, setActiveVideo] = useState(videoList[0]);
  const [currentPage, setCurrentPage] = useState(0);

  // We will show 4 videos per page on desktop, and 2 on mobile, but for simplicity of pagination math we use 4.
  // Using responsive grid handles the layout gracefully.
  const itemsPerPage = 4;
  const totalPages = Math.ceil(videoList.length / itemsPerPage);

  const handleNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrev = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const visibleVideos = videoList.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <section className="bg-white py-16 w-full border-b border-slate-100">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8">
        
        {/* Main Video Player */}
        <div className="relative w-full aspect-[16/9] bg-slate-900 shadow-lg mb-6 rounded-lg overflow-hidden">
          <iframe 
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${activeVideo.id}`} 
            title={activeVideo.title} 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen
          ></iframe>
        </div>

        {/* Text Below Main Video */}
        <div className="text-center mb-10">
          <h3 className="font-bold text-lg md:text-xl text-[#0d2a5c] mb-1">{activeVideo.title}</h3>
          <p className="text-slate-600 text-sm font-medium">{activeVideo.source}</p>
        </div>

        {/* Video List Carousel Wrapper */}
        <div className="relative">
          
          {/* Prev Button */}
          <button 
            onClick={handlePrev} 
            className="absolute -left-2 md:-left-12 top-[40%] -translate-y-1/2 z-10 p-2 md:p-3 bg-white border border-slate-200 rounded-full shadow-md text-slate-600 hover:text-[#0d2a5c] hover:bg-slate-50 transition-all hover:scale-110 focus:outline-none"
            aria-label="Previous videos"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Video List Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {visibleVideos.map((video) => (
              <div 
                key={video.id} 
                className={`flex flex-col group cursor-pointer transition-opacity duration-300 ${activeVideo.id === video.id ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                onClick={() => setActiveVideo(video)}
              >
                <div className="relative w-full aspect-[16/9] overflow-hidden mb-2 rounded-md">
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
                <p className={`text-xs md:text-[13px] text-center leading-tight px-1 ${activeVideo.id === video.id ? 'text-[#0d2a5c] font-semibold' : 'text-slate-600'}`}>
                  {video.title}
                </p>
              </div>
            ))}
          </div>

          {/* Next Button */}
          <button 
            onClick={handleNext} 
            className="absolute -right-2 md:-right-12 top-[40%] -translate-y-1/2 z-10 p-2 md:p-3 bg-white border border-slate-200 rounded-full shadow-md text-slate-600 hover:text-[#0d2a5c] hover:bg-slate-50 transition-all hover:scale-110 focus:outline-none"
            aria-label="Next videos"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              aria-label={`Go to page ${idx + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${currentPage === idx ? 'bg-[#0d2a5c] w-6' : 'bg-slate-300 hover:bg-slate-400'}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
