import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Megaphone,
  Volume2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Building2,
  Users,
  Search,
  Check,
  AlertCircle,
  VolumeX,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { WorkspaceContainer, type WorkspaceTab } from '../../components/common/WorkspaceContainer';
import { queueTicketService, type QueueTicketItem } from '../../services/queue/queue-ticket.service';
import { doctorService, type DepartmentResponse, type DoctorResponse } from '../../services/doctor/doctor.service';
import { encounterService } from '../../services/encounter/encounter.service';
import { IdentityVerificationHistoryModal } from './components/IdentityVerificationHistoryModal';
import { ReceptionIntakeModal } from './components/ReceptionIntakeModal';

// Helper phát tiếng chuông phát thanh bệnh viện (3 nốt nhạc) dùng Web Audio API
const playQueueChime = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }
      const ctx = new AudioCtx();

      // Nốt nhạc chuông bệnh viện: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
      const notes = [
        { freq: 523.25, duration: 0.22, time: 0 },
        { freq: 659.25, duration: 0.22, time: 0.18 },
        { freq: 783.99, duration: 0.45, time: 0.36 },
      ];

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);

        gain.gain.setValueAtTime(0.01, ctx.currentTime + n.time);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + n.time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + n.time);
        osc.stop(ctx.currentTime + n.time + n.duration);
      });

      setTimeout(() => {
        ctx.close().catch(() => {});
        resolve();
      }, 800);
    } catch (e) {
      console.warn('Lỗi Web Audio API:', e);
      resolve();
    }
  });
};

// Helper lấy danh sách giọng đọc và ưu tiên giọng Tiếng Việt chuẩn
const getVietnameseVoice = (selectedVoiceURI?: string): SpeechSynthesisVoice | null => {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  if (selectedVoiceURI) {
    const found = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (found) return found;
  }

  // Ưu tiên 1: Giọng Tiếng Việt chuẩn (vi-VN) như Google Tiếng Việt hoặc Microsoft HoaiMy / An
  const viVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().includes('vi') ||
      v.name.toLowerCase().includes('tiếng việt') ||
      v.name.toLowerCase().includes('vietnamese') ||
      v.name.toLowerCase().includes('hoaimy') ||
      v.name.toLowerCase().includes('an')
  );

  return viVoice || voices[0] || null;
};

// Helper đọc loa phát thanh gọi số bằng tiếng Việt (Web Speech API)
const speakQueueAnnouncement = (
  ticketCode: string,
  patientName?: string,
  counterName?: string,
  selectedVoiceURI?: string
) => {
  if (!('speechSynthesis' in window)) return;

  // Dừng các câu đang đọc dở trước đó
  window.speechSynthesis.cancel();

  // Đọc mã số tách rời ký tự để rõ ràng hơn (VD: "B001" -> "B 0 0 1")
  const formattedCode = ticketCode.split('').join(' ');
  const counterStr = counterName || 'Quầy tiếp nhận';
  const nameStr = patientName && patientName !== 'Bệnh nhân chưa đặt tên' ? `bệnh nhân ${patientName}` : 'bệnh nhân';

  // Câu phát thanh chuẩn bệnh viện: "Xin mời bệnh nhân Nguyễn Văn A, số thứ tự B 0 0 1, đến Quầy 01"
  const textToSpeak = `Xin mời ${nameStr}, số thứ tự ${formattedCode}, đến ${counterStr}.`;

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = 'vi-VN';
  utterance.rate = 0.88; // Tốc độ đọc vừa phải, chuẩn loa thông báo
  utterance.pitch = 1.0;

  const viVoice = getVietnameseVoice(selectedVoiceURI);
  if (viVoice) {
    utterance.voice = viVoice;
  }

  // Phát nhạc chuông trước, sau đó phát câu đọc
  playQueueChime().then(() => {
    window.speechSynthesis.speak(utterance);
  });
};

// Helper lấy ngày hiện tại theo giờ địa phương (tránh lệch timezone UTC)
const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ReceptionQueueCallingBoard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [selectedCounter, setSelectedCounter] = useState<string>('Quầy 01');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'waiting' | 'called' | 'done'>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');

  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        const vList = window.speechSynthesis.getVoices();
        setAvailableVoices(vList);
        const defaultVi = vList.find(
          (v) =>
            v.lang.toLowerCase().includes('vi') ||
            v.name.toLowerCase().includes('tiếng việt') ||
            v.name.toLowerCase().includes('vietnamese')
        );
        if (defaultVi) {
          setSelectedVoiceURI(defaultVi.voiceURI);
        }
      }
    };

    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const [tickets, setTickets] = useState<QueueTicketItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCallingNext, setIsCallingNext] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // State Modal Tiếp Đón & Khai Báo Lâm Sàng Ban Đầu (Chief Complaint & Intake)
  const [intakeModalTicket, setIntakeModalTicket] = useState<QueueTicketItem | null>(null);

  // State Modal Xem Lịch Sử Xác Minh Danh Tính (Chức năng 6 GET)
  const [historyModalEncounterId, setHistoryModalEncounterId] = useState<string | null>(null);
  const [historyModalPatientName, setHistoryModalPatientName] = useState<string>('');
  const [historyModalEncounterCode, setHistoryModalEncounterCode] = useState<string>('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);


  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const cachedDepts = doctorService.getCachedDepartments();
        if (cachedDepts) {
          setDepartments(cachedDepts);
        } else {
          const depts = await doctorService.getDepartments();
          setDepartments(depts);
        }

        const docs = await doctorService.getDoctors();
        setDoctors(docs);
      } catch (err) {
        console.error('Lỗi tải danh mục khoa/bác sĩ:', err);
      }
    };
    fetchMeta();
  }, []);

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const queryDate = selectedDate || getLocalDateString();
      const query = {
        date: queryDate,
        departmentId: selectedDepartmentId !== 'all' ? selectedDepartmentId : undefined,
      };
      const data = await queueTicketService.getQueueTickets(query);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Lỗi tải danh sách hàng đợi:', err);
      showToast(err.message || 'Không thể tải danh sách hàng đợi', 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [selectedDepartmentId, selectedDate]);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(() => {
      fetchTickets(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const formatTicketCode = (ticket: QueueTicketItem) => {
    const numStr = String(ticket.ticketNumber).padStart(3, '0');
    return `${ticket.ticketPrefix}${numStr}`;
  };

  const stats = useMemo(() => {
    const waiting = tickets.filter((t) => t.status === 'waiting');
    const called = tickets.filter((t) => t.status === 'called');
    const done = tickets.filter((t) => t.status === 'done');
    return {
      waitingCount: waiting.length,
      calledCount: called.length,
      doneCount: done.length,
      totalCount: tickets.length,
      nextTicket: waiting[0] || null,
      currentServingTicket: called.find((t) => t.counterNumber === selectedCounter) || called[0] || null,
    };
  }, [tickets, selectedCounter]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (activeTab === 'waiting' && t.status !== 'waiting') return false;
      if (activeTab === 'called' && t.status !== 'called') return false;
      if (activeTab === 'done' && t.status !== 'done') return false;

      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const code = formatTicketCode(t).toLowerCase();
        const patName = t.appointment?.patient?.fullName?.toLowerCase() || '';
        const patPhone = t.appointment?.patient?.phoneNumber || '';
        const deptName = t.department?.departmentName?.toLowerCase() || '';
        if (!code.includes(kw) && !patName.includes(kw) && !patPhone.includes(kw) && !deptName.includes(kw)) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, activeTab, searchKeyword]);

  const handleReplayAudio = (ticket: QueueTicketItem) => {
    const code = formatTicketCode(ticket);
    showToast(`Đã phát lại loa gọi số ${code}!`, 'info');
    speakQueueAnnouncement(
      code,
      ticket.appointment?.patient?.fullName,
      ticket.counterNumber || selectedCounter,
      selectedVoiceURI
    );
  };

  const handleCallNext = async () => {
    if (!stats.nextTicket) {
      showToast('Hiện tại không còn bệnh nhân nào đang chờ trong hàng đợi', 'info');
      return;
    }
    setIsCallingNext(true);
    try {
      await queueTicketService.callTicket(stats.nextTicket.ticketId, selectedCounter);
      const code = formatTicketCode(stats.nextTicket);
      showToast(`Đã gọi số ${code} đến ${selectedCounter}!`, 'success');
      fetchTickets(true);

      if (isAudioEnabled) {
        speakQueueAnnouncement(
          code,
          stats.nextTicket.appointment?.patient?.fullName,
          selectedCounter,
          selectedVoiceURI
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi gọi số tiếp theo', 'error');
    } finally {
      setIsCallingNext(false);
    }
  };

  const handleCallSpecificTicket = async (ticket: QueueTicketItem) => {
    // Nếu phiếu đã ở trạng thái đang gọi ('called'), chỉ phát lại âm thanh mà không gửi API đổi trạng thái để tránh lỗi BE
    if (ticket.status === 'called') {
      handleReplayAudio(ticket);
      return;
    }

    setActionLoadingId(ticket.ticketId);
    try {
      await queueTicketService.callTicket(ticket.ticketId, selectedCounter);
      const code = formatTicketCode(ticket);
      showToast(`Đã gọi số ${code} đến ${selectedCounter}!`, 'success');
      fetchTickets(true);

      if (isAudioEnabled) {
        speakQueueAnnouncement(
          code,
          ticket.appointment?.patient?.fullName,
          selectedCounter,
          selectedVoiceURI
        );
      }
    } catch (err: any) {
      if (err.message?.includes('called')) {
        handleReplayAudio(ticket);
      } else {
        showToast(err.message || 'Lỗi khi gọi số', 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenCompleteModalOrServe = (ticket: QueueTicketItem) => {
    setIntakeModalTicket(ticket);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : notification.type === 'error'
              ? 'bg-rose-600 text-white shadow-rose-500/20'
              : 'bg-slate-800 text-white shadow-slate-900/20'
          }`}
        >
          {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {notification.type === 'info' && <Megaphone className="w-5 h-5 flex-shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header & Bộ điều khiển quầy tiếp nhận */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Bảng Điều Phối & Gọi Số Trực Tiếp
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Tự động ưu tiên vé Đặt Online (A) trước vé Đăng ký tại quầy (B)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thiết lập Quầy & Khoa phòng */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quầy:</span>
              <select
                value={selectedCounter}
                onChange={(e) => setSelectedCounter(e.target.value)}
                aria-label="Chọn quầy phục vụ"
                className="bg-transparent text-sm font-bold text-teal-700 outline-none cursor-pointer"
              >
                <option value="Quầy 01">Quầy 01 (Tiếp nhận chung)</option>
                <option value="Quầy 02">Quầy 02 (Khám trực tiếp)</option>
                <option value="Quầy 03">Quầy 03 (Khám hẹn Online)</option>
                <option value="Quầy Ưu Tiên">Quầy Ưu Tiên (Cấp cứu / Người già)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                aria-label="Lọc theo chuyên khoa phòng"
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Tất cả chuyên khoa</option>
                {departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentName}
                  </option>
                ))}
              </select>
            </div>

            {/* Bộ chọn Ngày hàng đợi */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-4 h-4 text-teal-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Chọn ngày hàng đợi"
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                title="Chọn ngày hàng đợi khám"
              />
            </div>

            {availableVoices.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">Giọng:</span>
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => {
                    setSelectedVoiceURI(e.target.value);
                    speakQueueAnnouncement('TEST', 'Thử Giọng Đọc', selectedCounter, e.target.value);
                  }}
                  aria-label="Chọn giọng đọc phát thanh"
                  className="bg-transparent text-xs font-bold text-teal-700 outline-none cursor-pointer max-w-[140px] sm:max-w-[180px] truncate"
                >
                  {availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name.replace(/Microsoft |Google /g, '')} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => {
                const nextState = !isAudioEnabled;
                setIsAudioEnabled(nextState);
                if (nextState) {
                  speakQueueAnnouncement('TEST', 'Thử Âm Thanh', selectedCounter, selectedVoiceURI);
                }
              }}
              title={isAudioEnabled ? 'Âm thanh tự động: Đang BẬT (Bấm để TẮT)' : 'Âm thanh tự động: Đang TẮT (Bấm để BẬT)'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                isAudioEnabled
                  ? 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4 text-teal-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>{isAudioEnabled ? 'Âm loa: Bật' : 'Âm loa: Tắt'}</span>
            </button>

            <button
              onClick={() => fetchTickets(false)}
              disabled={isLoading}
              title="Làm mới hàng đợi"
              aria-label="Làm mới dữ liệu hàng đợi"
              className="p-2 text-slate-600 hover:text-teal-600 bg-slate-50 hover:bg-teal-50 border border-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* HERO SECTION: Bảng điều khiển Gọi Số Trực Tiếp */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CỘT TRÁI: Số ĐANG ĐƯỢC GỌI TẠI QUẦY */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Đang phục vụ tại {selectedCounter}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-400">
                {stats.currentServingTicket?.calledAt
                  ? `Đã gọi lúc ${new Date(stats.currentServingTicket.calledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Sẵn sàng phục vụ'}
              </span>
            </div>

            {stats.currentServingTicket ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-5xl font-black tracking-tight font-mono px-4 py-1.5 rounded-2xl shadow-inner ${
                          stats.currentServingTicket.ticketPrefix === 'A'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        }`}
                      >
                        {formatTicketCode(stats.currentServingTicket)}
                      </span>
                      <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">
                          {stats.currentServingTicket.appointment?.patient?.fullName || 'Bệnh nhân chưa đặt tên'}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                          <span>CCCD: {stats.currentServingTicket.appointment?.patient?.identityNumber || '---'}</span>
                          <span>•</span>
                          <span>SĐT: {stats.currentServingTicket.appointment?.patient?.phoneNumber || '---'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${
                      stats.currentServingTicket.ticketPrefix === 'A'
                        ? 'bg-teal-900/60 text-teal-300 border border-teal-600/40'
                        : 'bg-amber-900/60 text-amber-300 border border-amber-600/40'
                    }`}
                  >
                    {stats.currentServingTicket.ticketPrefix === 'A' ? (
                      <>
                        <img src="/images/online_icon.png" alt="Online" className="w-4 h-4 object-contain" />
                        <span>Đặt Online</span>
                      </>
                    ) : (
                      <>
                        <img src="/images/counter_icon.png" alt="Tại quầy" className="w-4 h-4 object-contain" />
                        <span>Tại Quầy</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Thông tin khám */}
                <div className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-3.5 border border-slate-700/50 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Chuyên khoa:</span>
                    <span className="font-semibold text-teal-200">
                      {stats.currentServingTicket.department?.departmentName || 'Chưa chọn khoa'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Bác sĩ khám:</span>
                    <span className="font-semibold text-slate-200">
                      {stats.currentServingTicket.appointment?.doctor?.user?.fullName ||
                        stats.currentServingTicket.appointment?.doctor?.fullName ||
                        '(Chưa gán bác sĩ)'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block mb-0.5">Lý do khám / Triệu chứng:</span>
                    <span className="text-slate-300 italic">
                      {stats.currentServingTicket.appointment?.reasonForVisit || 'Khám tổng quát theo yêu cầu'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Megaphone className="w-12 h-12 mx-auto mb-2 text-slate-600 opacity-60" />
                <p className="text-sm font-medium">Chưa có số thứ tự nào đang được gọi tại quầy này.</p>
                <p className="text-xs text-slate-500 mt-1">Bấm "Gọi số tiếp theo" bên phải để đón tiếp bệnh nhân.</p>
              </div>
            )}
          </div>

          {/* Nút thao tác của Thẻ Đang Phục Vụ */}
          {stats.currentServingTicket && (
            <div className="flex items-center gap-3 pt-5 mt-5 border-t border-slate-700/60">
              <button
                onClick={() => handleReplayAudio(stats.currentServingTicket!)}
                disabled={actionLoadingId === stats.currentServingTicket.ticketId}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-700/70 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer border border-slate-600/50"
              >
                <Volume2 className="w-4 h-4 text-teal-400" />
                <span>Phát Lại Âm Thanh</span>
              </button>

              <button
                onClick={() => handleOpenCompleteModalOrServe(stats.currentServingTicket!)}
                disabled={actionLoadingId === stats.currentServingTicket.ticketId}
                className="flex-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-teal-500/25 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Hoàn Tất Tiếp Nhận & Chuyển Khám</span>
              </button>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: NÚT GỌI SỐ TIẾP THEO & BỆNH NHÂN TIẾP THEO */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Bệnh nhân tiếp theo trong hàng chờ
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                Ưu tiên số 1
              </span>
            </div>

            {stats.nextTicket ? (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 mb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-2xl font-bold font-mono px-3 py-1 rounded-xl ${
                        stats.nextTicket.ticketPrefix === 'A'
                          ? 'bg-teal-100 text-teal-800 border border-teal-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {formatTicketCode(stats.nextTicket)}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {stats.nextTicket.appointment?.patient?.fullName || 'Bệnh nhân'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {stats.nextTicket.department?.departmentName || 'Đang cập nhật'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                      stats.nextTicket.ticketPrefix === 'A'
                        ? 'bg-teal-50 text-teal-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {stats.nextTicket.ticketPrefix === 'A' ? (
                      <>
                        <img src="/images/online_icon.png" alt="Online" className="w-3.5 h-3.5 object-contain" />
                        <span>Online</span>
                      </>
                    ) : (
                      <>
                        <img src="/images/counter_icon.png" alt="Tại quầy" className="w-3.5 h-3.5 object-contain" />
                        <span>Tại quầy</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-5 text-center border border-dashed border-slate-200 mb-5">
                <p className="text-xs text-slate-500 font-medium">Hàng chờ hiện tại đang trống.</p>
              </div>
            )}
          </div>

          {/* NÚT GỌI SỐ TO NỔI BẬT */}
          <button
            onClick={handleCallNext}
            disabled={!stats.nextTicket || isCallingNext}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg transition transform active:scale-98 cursor-pointer ${
              stats.nextTicket
                ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 hover:from-teal-700 hover:to-cyan-700 text-white shadow-teal-600/30'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Megaphone className={`w-5 h-5 ${isCallingNext ? 'animate-bounce' : ''}`} />
            <span>{isCallingNext ? 'Đang kích hoạt gọi số...' : '🔊 GỌI SỐ TIẾP THEO'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Đang chờ gọi</span>
            <p className="text-xl font-bold text-slate-800">{stats.waitingCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Đang tại quầy</span>
            <p className="text-xl font-bold text-slate-800">{stats.calledCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Đã tiếp nhận</span>
            <p className="text-xl font-bold text-slate-800">{stats.doneCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Tổng phát hôm nay</span>
            <p className="text-xl font-bold text-slate-800">{stats.totalCount}</p>
          </div>
        </div>
      </div>

      {/* DANH SÁCH HÀNG ĐỢI CHI TIẾT */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Bộ lọc & Thanh tìm kiếm */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({stats.totalCount})
            </button>
            <button
              onClick={() => setActiveTab('waiting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'waiting'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đang chờ ({stats.waitingCount})
            </button>
            <button
              onClick={() => setActiveTab('called')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'called'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đang gọi ({stats.calledCount})
            </button>
            <button
              onClick={() => setActiveTab('done')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'done'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã xong ({stats.doneCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã số, tên BN, SĐT..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
            />
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Số Phiếu (STT)</th>
                <th className="py-3 px-4">Bệnh Nhân</th>
                <th className="py-3 px-4">Kênh Đặt</th>
                <th className="py-3 px-4">Chuyên Khoa & Bác Sĩ</th>
                <th className="py-3 px-4">Quầy / Thời Gian</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                    <span>Đang tải danh sách hàng đợi...</span>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <span>Không có số thứ tự nào phù hợp bộ lọc hiện tại.</span>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const code = formatTicketCode(ticket);
                  const isWaiting = ticket.status === 'waiting';
                  const isCalled = ticket.status === 'called';
                  const isDone = ticket.status === 'done';

                  return (
                    <tr
                      key={ticket.ticketId}
                      className={`hover:bg-slate-50/80 transition ${
                        isCalled ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                            ticket.ticketPrefix === 'A'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {ticket.appointment?.patient?.fullName || 'Chưa có thông tin'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ticket.appointment?.patient?.phoneNumber || '---'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            ticket.ticketPrefix === 'A'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {ticket.ticketPrefix === 'A' ? (
                            <>
                              <img src="/images/online_icon.png" alt="Online" className="w-3.5 h-3.5 object-contain" />
                              <span>Đặt Online</span>
                            </>
                          ) : (
                            <>
                              <img src="/images/counter_icon.png" alt="Tại quầy" className="w-3.5 h-3.5 object-contain" />
                              <span>Tại Quầy</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {ticket.department?.departmentName || '---'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ticket.appointment?.doctor?.user?.fullName ||
                            ticket.appointment?.doctor?.fullName ||
                            'Chưa gán bác sĩ'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-700">
                          {ticket.counterNumber || '---'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {ticket.calledAt
                            ? `Gọi: ${new Date(ticket.calledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                            : `Cấp: ${new Date(ticket.issuedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isWaiting && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>Đang chờ</span>
                          </span>
                        )}
                        {isCalled && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 animate-pulse">
                            <Megaphone className="w-3 h-3" />
                            <span>Đang gọi</span>
                          </span>
                        )}
                        {isDone && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đã xong</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          {isWaiting && (
                            <button
                              onClick={() => handleCallSpecificTicket(ticket)}
                              disabled={actionLoadingId === ticket.ticketId}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Gọi số</span>
                            </button>
                          )}

                          {isCalled && (
                            <>
                              <button
                                onClick={() => handleReplayAudio(ticket)}
                                disabled={actionLoadingId === ticket.ticketId}
                                title="Gọi lại loa"
                                className="p-1.5 text-slate-600 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenCompleteModalOrServe(ticket)}
                                disabled={actionLoadingId === ticket.ticketId}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Tiếp nhận xong</span>
                              </button>
                            </>
                          )}

                          {isDone && (
                            <div className="inline-flex items-center gap-2">
                              <span className="text-[11px] text-slate-400 italic">Đã vào khám</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  let encId =
                                    ticket.appointment?.encounter?.encounterId ||
                                    ticket.appointment?.encounters?.[0]?.encounterId;
                                  let encCode =
                                    ticket.appointment?.encounter?.encounterCode ||
                                    ticket.appointment?.encounters?.[0]?.encounterCode ||
                                    '';

                                  if (!encId && ticket.appointment?.patientId) {
                                    try {
                                      const encList = await encounterService.getEncounters({
                                        patientId: ticket.appointment.patientId,
                                      });
                                      if (encList && encList.length > 0) {
                                        encId = encList[0].encounterId;
                                        encCode = encList[0].encounterCode;
                                      }
                                    } catch (e) {
                                      console.warn('Không thể tải ca khám:', e);
                                    }
                                  }

                                  if (encId) {
                                    setHistoryModalEncounterId(encId);
                                    setHistoryModalPatientName(ticket.appointment?.patient?.fullName || '');
                                    setHistoryModalEncounterCode(encCode);
                                    setIsHistoryModalOpen(true);
                                  } else {
                                    showToast('Chưa tìm thấy mã lượt khám cho bệnh nhân này', 'info');
                                  }
                                }}
                                title="Xem lịch sử xác minh danh tính"
                                className="px-2.5 py-1 text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200/90 rounded-lg transition cursor-pointer flex items-center gap-1.5 font-bold text-xs shadow-2xs"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                                <span>Lịch sử XM</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TIẾP ĐÓN & KHAI BÁO LÂM SÀNG BAN ĐẦU (CHIEF COMPLAINT & INTAKE) */}
      <ReceptionIntakeModal
        isOpen={Boolean(intakeModalTicket)}
        onClose={() => setIntakeModalTicket(null)}
        ticket={intakeModalTicket}
        doctors={doctors}
        onSuccess={() => fetchTickets(true)}
        showToast={showToast}
      />

      {/* MODAL XEM LỊCH SỬ XÁC MINH DANH TÍNH (GET /encounters/:id/identity-verifications) */}
      <IdentityVerificationHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        encounterId={historyModalEncounterId}
        patientName={historyModalPatientName}
        encounterCode={historyModalEncounterCode}
        onVerificationCreated={() => {
          fetchTickets(true);
        }}
      />
    </div>
  );
};

export const ReceptionQueueCallingWorkspaceView: React.FC = () => {
  const tabs: WorkspaceTab[] = [
    {
      id: 'calling-board',
      label: 'Bảng Điều Phối & Gọi Số',
      icon: Megaphone,
      badge: 'Live',
      component: <ReceptionQueueCallingBoard />,
    },
  ];

  return (
    <WorkspaceContainer
      title="Điều Phối & Gọi Số Hồ Sơ"
      subtitle="Hệ thống gọi số thứ tự tiếp nhận bệnh nhân thông minh, ưu tiên theo kênh đặt và ca cấp cứu"
      icon={Megaphone}
      tabs={tabs}
      defaultTabId="calling-board"
    />
  );
};
