import React, { useState, useEffect, useRef } from 'react';
import {
  Ticket,
  Printer,
  Sparkles,
  RotateCcw,
  Building2,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { queueTicketService, type QueueTicketItem } from '../services/queue/queue-ticket.service';

export const KioskQueueTicketPage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [issuedTicket, setIssuedTicket] = useState<QueueTicketItem | null>(null);
  const [countdown, setCountdown] = useState<number>(10);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cập nhật đồng hồ thời gian thực
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Đếm ngược tự động quay về màn hình chờ sau khi lấy số thành công
  useEffect(() => {
    if (issuedTicket) {
      setCountdown(10);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleReset();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [issuedTicket]);

  const playChimeAndSpeak = (code: string) => {
    try {
      // Âm thanh thông báo ngắn qua Web Audio API
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch {
      // AudioContext có thể bị chặn nếu chưa có user gesture
    }

    // Đọc số thứ tự bằng Tiếng Việt
    if ('speechSynthesis' in window) {
      try {
        const text = `Số thứ tự của quý khách là ${code}. Xin vui lòng chờ gọi số tại quầy tiếp đón.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      } catch {
        // bỏ qua nếu browser không hỗ trợ voice
      }
    }
  };

  const handleIssueTicket = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Gọi API Public không cần JWT
      const ticket = await queueTicketService.issueAtHospitalTicket();
      setIssuedTicket(ticket);

      const codeStr = `${ticket.ticketPrefix}-${String(ticket.ticketNumber).padStart(3, '0')}`;
      playChimeAndSpeak(codeStr);
    } catch (err: any) {
      console.error('Lỗi khi lấy số thứ tự:', err);
      setErrorMsg(err.message || 'Không thể kết nối đến máy chủ cấp số. Vui lòng liên hệ nhân viên tiếp đón!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIssuedTicket(null);
    setErrorMsg(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatTicketCode = (t: QueueTicketItem) => {
    return `${t.ticketPrefix}-${String(t.ticketNumber).padStart(3, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none relative overflow-hidden font-sans">
      {/* Background Decor Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER: Thông tin cơ sở & Đồng hồ thời gian thực */}
      <header className="p-6 md:p-8 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
              Phòng Khám Đa Khoa Quốc Tế
            </h1>
            <p className="text-xs md:text-sm text-teal-300/80 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Hệ thống Kiosk cấp số tự động thông minh
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-2xl md:text-4xl font-extrabold tracking-wider text-teal-400 drop-shadow-sm">
            {currentTime || '--:--:--'}
          </div>
          <div className="text-xs md:text-sm text-slate-400 capitalize mt-0.5">
            {currentDate || 'Đang cập nhật...'}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        {!issuedTicket ? (
          /* MÀN HÌNH CHỜ: NÚT BẤM LẤY SỐ KHỔNG LỒ */
          <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in duration-300">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs md:text-sm font-semibold tracking-wide">
                <Sparkles className="w-4 h-4 text-teal-400" />
                Dành cho Quý khách khám bệnh trực tiếp tại quầy
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Chào mừng Quý khách đến với phòng khám
              </h2>
              <p className="text-slate-400 text-sm md:text-lg max-w-lg mx-auto">
                Quý khách vui lòng chạm vào nút bên dưới để nhận phiếu số thứ tự tiếp đón tại sảnh chờ.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-center gap-3 animate-in shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* BIG ACTION BUTTON */}
            <div className="relative group flex justify-center py-4">
              <div className="absolute inset-0 max-w-md mx-auto bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl blur-2xl opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse pointer-events-none" />

              <button
                id="btn-issue-queue-ticket"
                onClick={handleIssueTicket}
                disabled={isLoading}
                className="relative max-w-md w-full py-8 md:py-10 px-8 rounded-3xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-95 text-white font-extrabold text-xl md:text-2xl tracking-wide shadow-2xl shadow-teal-500/30 border border-teal-400/40 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-4 group disabled:opacity-50"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-200">
                  <Ticket className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
                <div className="space-y-1">
                  <span className="block text-white text-2xl md:text-3xl">
                    {isLoading ? 'ĐANG IN PHIẾU...' : 'CHẠM ĐỂ LẤY SỐ'}
                  </span>
                  <span className="block text-xs md:text-sm text-teal-100/80 font-normal">
                    (Nhận phiếu số thứ tự vào quầy tiếp nhận)
                  </span>
                </div>
              </button>
            </div>

            {/* QUY TRÌNH HƯỚNG DẪN 3 BƯỚC */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 max-w-xl mx-auto text-left">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <div className="font-bold text-slate-200">Lấy phiếu số</div>
                <div className="text-slate-400">Chạm màn hình để nhận phiếu số thứ tự của bạn.</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <div className="font-bold text-slate-200">Ngồi ghế chờ</div>
                <div className="text-slate-400">Quan sát màn hình và lắng nghe loa gọi số tại quầy.</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <div className="font-bold text-slate-200">Đến quầy tiếp nhận</div>
                <div className="text-slate-400">Xuất trình CCCD/BHYT cho nhân viên tiếp đón.</div>
              </div>
            </div>
          </div>
        ) : (
          /* MÀN HÌNH KẾT QUẢ: PHIẾU IN SỐ THỨ TỰ THÀNH CÔNG */
          <div className="max-w-md w-full animate-in zoom-in-95 duration-200 space-y-6">
            {/* THẺ PHIẾU KHÁM MÔ PHỎNG MÁY IN NHIỆT */}
            <div
              id="kiosk-printable-ticket"
              className="bg-white text-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 relative overflow-hidden"
            >
              {/* Header phiếu */}
              <div className="text-center pb-5 border-b-2 border-dashed border-slate-200 space-y-1">
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                  Phòng Khám Đa Khoa Quốc Tế
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  PHIẾU SỐ THỨ TỰ TIẾP ĐÓN
                </h3>
                <div className="text-xs text-slate-500">
                  {new Date(issuedTicket.issuedAt).toLocaleString('vi-VN')}
                </div>
              </div>

              {/* SỐ PHIẾU KHỔNG LỒ */}
              <div className="py-8 text-center space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 border border-teal-200 inline-block px-3 py-1 rounded-full">
                  Khám Trực Tiếp Tại Viện
                </div>
                <div className="text-6xl md:text-7xl font-black font-mono tracking-tight text-slate-900 pt-2">
                  {formatTicketCode(issuedTicket)}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Trạng thái: <span className="font-bold text-amber-600">Đang chờ gọi</span>
                </p>
              </div>

              {/* Lời dặn */}
              <div className="pt-4 border-t-2 border-dashed border-slate-200 text-center space-y-2 text-xs text-slate-600">
                <p className="font-bold text-slate-800">
                  Quý khách vui lòng ngồi ghế chờ tại sảnh.
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Chú ý lắng nghe loa phát thanh và quan sát màn hình điện tử gọi số tại các quầy tiếp đón.
                </p>
              </div>

              {/* Răng cưa giả lập cuộn giấy in */}
              <div className="absolute -bottom-2 left-0 right-0 flex justify-between px-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-slate-950 rounded-full" />
                ))}
              </div>
            </div>

            {/* CÁC NÚT ĐIỀU KHIỂN & ĐẾM NGƯỢC */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-teal-400" />
                  <span>In lại phiếu</span>
                </button>

                <button
                  onClick={handleReset}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Hoàn tất ({countdown}s)</span>
                </button>
              </div>

              <div className="text-center text-xs text-slate-500">
                Màn hình sẽ tự động quay lại sau{' '}
                <span className="font-bold text-teal-400 font-mono text-sm">{countdown}</span> giây...
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER: Trợ giúp & hotline */}
      <footer className="p-4 md:p-6 border-t border-slate-800/80 bg-slate-900/40 text-center text-xs text-slate-400 relative z-10 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <HelpCircle className="w-4 h-4 text-teal-400" />
          <span>Cần trợ giúp? Vui lòng liên hệ nhân viên hướng dẫn tại sảnh tiếp đón.</span>
        </div>
        <div className="text-slate-500 text-[11px]">
          Tổng đài hỗ trợ: <span className="text-teal-400 font-bold">1900 6868</span> • Giờ làm việc: 07:00 - 20:00
        </div>
      </footer>
    </div>
  );
};

export default KioskQueueTicketPage;
