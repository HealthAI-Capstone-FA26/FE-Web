import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Sparkles, ShieldCheck, HeartPulse, Clock } from 'lucide-react';

interface TileData {
  title: string;
  subtitle: string;
  imgUrl: string;
}

const SERVICES_TILES: TileData[] = [
  {
    title: 'Sảnh Đón 5 Sao',
    subtitle: 'Không gian tiếp đón sang trọng',
    imgUrl: '/images/hospital_lobby_vn.png',
  },
  {
    title: 'Phòng Nội Trú VIP',
    subtitle: 'Tiện nghi y tế tiêu chuẩn quốc tế',
    imgUrl: '/images/hospital_room_vn.png',
  },
  {
    title: 'Tư Vấn 24/7',
    subtitle: 'Đội ngũ chăm sóc chu đáo',
    imgUrl: '/images/hospital_customer_vn.png',
  },
  {
    title: 'Tiếp Đón Nhanh',
    subtitle: 'Phân luồng & sinh hiệu EMR',
    imgUrl: '/images/hospital_reception_vn.png',
  },
  {
    title: 'Chẩn Đoán MRI 3.0T',
    subtitle: 'Công nghệ hình ảnh sắc nét',
    imgUrl: '/images/equipment_mri.png',
  },
  {
    title: 'Cắt Lớp CT 512 Lát',
    subtitle: 'Phát hiện sớm vi tổn thương',
    imgUrl: '/images/equipment_ct.png',
  },
  {
    title: 'Siêu Âm 4D AI',
    subtitle: 'Săn sóc thai kỳ & tim mạch',
    imgUrl: '/images/equipment_ultrasound.png',
  },
  {
    title: 'Khám Chuyên Khoa Sâu',
    subtitle: 'Chuyên gia đầu ngành tư vấn',
    imgUrl: '/images/hero_cardio.png',
  },
];

export const ServicesSection: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTileIndex, setActiveTileIndex] = useState(0);

  // Animation & 3D Ring State
  const spinRef = useRef(0);
  const targetSpeedRef = useRef(0.003);
  const currentSpeedRef = useRef(0.003);
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);
  const imagesLoadedRef = useRef<HTMLImageElement[]>([]);

  // Load tile images once
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    let count = 0;
    SERVICES_TILES.forEach((tile, index) => {
      const img = new Image();
      img.src = tile.imgUrl;
      img.onload = () => {
        count++;
      };
      loadedImages[index] = img;
    });
    imagesLoadedRef.current = loadedImages;
  }, []);

  // 3D Ring Render Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = Math.max(520, Math.min(680, width * 0.48));

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 3D Ring Geometry Vectors
    const axisDeg = 15; // plane tilt angle
    const ax = (axisDeg * Math.PI) / 180;
    const cf = 0.42; // ratio semi-minor/semi-major
    const sf = Math.sqrt(1 - cf * cf);

    const U = [Math.cos(ax), Math.sin(ax), 0];
    const V = [-Math.sin(ax) * cf, Math.cos(ax) * cf, sf];
    const AXIS = [
      U[1] * V[2] - U[2] * V[1],
      U[2] * V[0] - U[0] * V[2],
      U[0] * V[1] - U[1] * V[0],
    ];

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.width;
      const H = canvas.height;

      ctx.save();
      ctx.scale(dpr, dpr);
      const cssW = W / dpr;
      const cssH = H / dpr;

      // Clear Canvas Background with soft light gradient
      const bgGrad = ctx.createLinearGradient(0, 0, cssW, cssH);
      bgGrad.addColorStop(0, '#f8fafc');
      bgGrad.addColorStop(0.5, '#eef2f7');
      bgGrad.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cssW, cssH);

      // Draw subtle glowing light background circles
      const glow1 = ctx.createRadialGradient(cssW * 0.5, cssH * 0.5, 30, cssW * 0.5, cssH * 0.5, cssW * 0.45);
      glow1.addColorStop(0, 'rgba(186, 230, 253, 0.45)');
      glow1.addColorStop(0.6, 'rgba(191, 219, 254, 0.2)');
      glow1.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, cssW, cssH);

      // Update rotation spin
      if (isPlaying && !isDraggingRef.current) {
        currentSpeedRef.current += (targetSpeedRef.current - currentSpeedRef.current) * 0.05;
        spinRef.current += currentSpeedRef.current;
      }

      // Ring dimensions in screen space
      const cx = cssW / 2;
      const cy = cssH / 2 + 10;
      const majorA = Math.min(cssW * 0.38, 480);
      const distCam = 11;
      const nTiles = SERVICES_TILES.length;
      const tileWidth = Math.min(cssW * 0.22, 240);
      const tileHeight = tileWidth * 0.72;

      // Project 3D vector to screen
      const project = (p: number[]) => {
        const k = (majorA * distCam) / (distCam - p[2]);
        return [cx + k * p[0], cy + k * p[1], k];
      };

      // Compute tile positions and depth
      const list: { index: number; psi: number; z: number }[] = [];
      for (let i = 0; i < nTiles; i++) {
        const psi = spinRef.current - (i * 2 * Math.PI) / nTiles;
        const c = Math.cos(psi);
        const s = Math.sin(psi);
        const z = c * U[2] + s * V[2];
        list.push({ index: i, psi, z });
      }

      // Sort tiles back-to-front by depth Z
      list.sort((a, b) => a.z - b.z);

      // Find tile closest to viewer (front-most)
      const frontTile = list[list.length - 1];
      if (frontTile && frontTile.index !== activeTileIndex) {
        setActiveTileIndex(frontTile.index);
      }

      // Helper for rounded rectangle clipping
      const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };

      // Function to render center headline text
      const drawCenterHeadline = () => {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Tagline
        ctx.font = '800 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#0284c7';
        ctx.letterSpacing = '3px';
        ctx.fillText('HỆ THỐNG Y TẾ TIÊU CHUẨN ĐA KHOA', cx, cy - 42);

        // Main Title 1
        ctx.font = '900 28px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 8;
        ctx.fillText('DỊCH VỤ CAO CẤP', cx, cy - 10);

        // Main Title 2
        ctx.font = '800 24px system-ui, -apple-system, sans-serif';
        const textGrad = ctx.createLinearGradient(cx - 150, cy, cx + 150, cy);
        textGrad.addColorStop(0, '#0284c7');
        textGrad.addColorStop(0.5, '#2563eb');
        textGrad.addColorStop(1, '#1d4ed8');
        ctx.fillStyle = textGrad;
        ctx.fillText('CHI PHÍ HỢP LÝ', cx, cy + 24);

        // Subtitle
        ctx.font = '600 12px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.shadowBlur = 0;
        ctx.fillText('Chăm sóc toàn diện • Công nghệ chẩn đoán AI • Bệnh viện 4AM', cx, cy + 54);

        ctx.restore();
      };

      let textDrawn = false;

      // Draw Tiles in depth order
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        // Draw headline text between back tiles (z < 0) and front tiles (z >= 0)
        if (!textDrawn && item.z >= -0.05) {
          drawCenterHeadline();
          textDrawn = true;
        }

        const psi = item.psi;
        const c = Math.cos(psi);
        const s = Math.sin(psi);

        const C = [c * U[0] + s * V[0], c * U[1] + s * V[1], c * U[2] + s * V[2]];
        const T = [-s * U[0] + c * V[0], -s * U[1] + c * V[1], -s * U[2] + c * V[2]];
        const hRad = tileWidth / (2 * majorA);

        const p0 = project(C);
        const pT = project([C[0] + T[0] * hRad, C[1] + T[1] * hRad, C[2] + T[2] * hRad]);
        const pA = project([C[0] + AXIS[0] * hRad, C[1] + AXIS[1] * hRad, C[2] + AXIS[2] * hRad]);

        const ex = pT[0] - p0[0];
        const ey = pT[1] - p0[1];
        const fx = pA[0] - p0[0];
        const fy = pA[1] - p0[1];

        // Skip edge-on invisible tiles
        if (Math.abs(ex * fy - ey * fx) < 0.3) continue;

        const tile = SERVICES_TILES[item.index];
        const img = imagesLoadedRef.current[item.index];

        ctx.save();
        ctx.translate(p0[0], p0[1]);

        // Calculate depth scale & opacity
        const depthScale = Math.max(0.68, Math.min(1.2, p0[2] / (majorA * 0.95)));
        const depthAlpha = Math.max(0.55, Math.min(1.0, (item.z + 1.2) / 2.2));

        ctx.scale(depthScale, depthScale);
        ctx.globalAlpha = depthAlpha;

        const tw = tileWidth;
        const th = tileHeight;
        const rad = 18;

        // Card Soft Shadow
        ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
        ctx.shadowBlur = 16 * depthScale;
        ctx.shadowOffsetY = 8 * depthScale;

        // Draw Card Background / Border Frame
        drawRoundRect(-tw / 2, -th / 2, tw, th, rad);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.shadowColor = 'transparent';

        // Clip Image Inside Card
        ctx.save();
        drawRoundRect(-tw / 2, -th / 2, tw, th, rad);
        ctx.clip();

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, -tw / 2, -th / 2, tw, th);
        } else {
          // Placeholder gradient if image loading
          const pGrad = ctx.createLinearGradient(-tw / 2, -th / 2, tw / 2, th / 2);
          pGrad.addColorStop(0, '#f1f5f9');
          pGrad.addColorStop(1, '#e2e8f0');
          ctx.fillStyle = pGrad;
          ctx.fillRect(-tw / 2, -th / 2, tw, th);
        }

        // Dark gradient overlay at bottom of image for text readability
        const cardOverlay = ctx.createLinearGradient(0, -th / 2, 0, th / 2);
        cardOverlay.addColorStop(0, 'rgba(0,0,0,0.05)');
        cardOverlay.addColorStop(0.45, 'rgba(0,0,0,0.25)');
        cardOverlay.addColorStop(1, 'rgba(15,23,42,0.88)');
        ctx.fillStyle = cardOverlay;
        ctx.fillRect(-tw / 2, -th / 2, tw, th);

        // Glass Gloss Reflection Arc at top
        const glossGrad = ctx.createLinearGradient(0, -th / 2, 0, 0);
        glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glossGrad;
        ctx.fillRect(-tw / 2, -th / 2, tw, th / 2);

        // Title and Subtitle text inside tile card
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.font = '800 12px system-ui, -apple-system, sans-serif';
        ctx.fillText(tile.title, -tw / 2 + 12, th / 2 - 24);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '600 10px system-ui, -apple-system, sans-serif';
        ctx.fillText(tile.subtitle, -tw / 2 + 12, th / 2 - 9);

        ctx.restore(); // restore clip

        // Card Border Glow (Highlight front-most card with bright cyan border)
        const isFront = item.index === activeTileIndex;
        drawRoundRect(-tw / 2, -th / 2, tw, th, rad);
        ctx.lineWidth = isFront ? 3 : 1.5;
        ctx.strokeStyle = isFront ? '#0284c7' : 'rgba(255, 255, 255, 0.8)';
        ctx.stroke();

        ctx.restore();
      }

      if (!textDrawn) {
        drawCenterHeadline();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isPlaying, activeTileIndex]);

  // Mouse / Touch Drag interaction to spin ring
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMouseXRef.current;
    spinRef.current += deltaX * 0.005;
    lastMouseXRef.current = e.clientX;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handlePrev = () => {
    spinRef.current += (2 * Math.PI) / SERVICES_TILES.length;
  };

  const handleNext = () => {
    spinRef.current -= (2 * Math.PI) / SERVICES_TILES.length;
  };

  return (
    <section className="bg-slate-50/80 py-12 md:py-16 overflow-hidden relative border-y border-slate-200/80">
      {/* Ambient background light blur blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 relative z-10">
        
        {/* Top Header Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-black text-blue-600 uppercase tracking-widest mb-2">
              <Sparkles className="w-4 h-4 animate-pulse text-blue-600" />
              <span>Grainient 3D Showcase • Bệnh viện 4AM</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Khám Phá Dịch Vụ & Cơ Sở Vật Chất 5 Sao
            </h2>
          </div>

          {/* Interactive Player Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrev}
              title="Xem dịch vụ trước"
              className="p-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Tạm dừng xoay 3D' : 'Tự động xoay 3D'}
              className="px-4 py-2 rounded-full bg-[#0b3c8f] hover:bg-blue-800 text-white font-extrabold text-xs flex items-center space-x-2 shadow-md shadow-blue-900/20 transition-all cursor-pointer active:scale-95"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Tạm dừng' : 'Tự động xoay'}</span>
            </button>
            <button
              onClick={handleNext}
              title="Xem dịch vụ tiếp theo"
              className="p-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D Orbiting Ring Canvas Container */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08)] cursor-grab active:cursor-grabbing select-none"
        >
          <canvas ref={canvasRef} className="w-full block" />

          {/* Helper Drag Overlay Indicator */}
          <div className="absolute bottom-4 left-6 text-[11px] font-bold text-slate-600 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 shadow-xs flex items-center space-x-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>Kéo chuột để xoay 360° Vòng Dịch Vụ</span>
          </div>
        </div>

        {/* Bottom Active Service Feature Highlight Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center space-x-3.5 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Chuẩn HL7 FHIR R4</h4>
              <p className="text-[11px] text-slate-500 font-medium">Dữ liệu liên thông toàn quốc</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center space-x-3.5 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Trí Tuệ Nhân Tạo AI</h4>
              <p className="text-[11px] text-slate-500 font-medium">Gợi ý chuyên khoa & đọc EMR</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center space-x-3.5 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Chăm Sóc VIP 1-on-1</h4>
              <p className="text-[11px] text-slate-500 font-medium">Điều dưỡng theo sát tận tâm</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center space-x-3.5 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Đặt Lịch & Tiếp Đón 24/7</h4>
              <p className="text-[11px] text-slate-500 font-medium">Không chờ đợi, ưu tiên nhanh</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
