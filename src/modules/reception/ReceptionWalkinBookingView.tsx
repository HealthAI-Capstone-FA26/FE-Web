import React, { useState } from 'react';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const ReceptionWalkinBookingView: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [idCard, setIdCard] = useState('');
  const [specialty, setSpecialty] = useState('Khoa Nội Tổng Hợp');
  const [doctor] = useState('BS. CKII. Nguyễn Quang Huy');
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedQueueNo, setGeneratedQueueNo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;
    const queueNo = 'A-' + Math.floor(100 + Math.random() * 900);
    setGeneratedQueueNo(queueNo);
    setIsSuccess(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Mô-đun 2: Đăng ký tại quầy (At-hospital)
          </span>
          <Badge variant="info" size="sm">
            Cấp số thứ tự tự động
          </Badge>
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Form Đăng Ký Khám Trực Tiếp Cho Bệnh Nhân Vãng Lai
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tiếp nhận bệnh nhân đến trực tiếp tại bệnh viện, chọn chuyên khoa, bác sĩ và in số thứ tự chờ vào phòng khám.
        </p>
      </div>

      {isSuccess ? (
        <div className="bg-white p-8 rounded-3xl border border-emerald-200 shadow-lg text-center space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Đăng Ký Khám Thành Công!</h3>
          <p className="text-xs text-slate-500">Bệnh nhân: <strong className="text-slate-800">{fullName}</strong> • SĐT: {phone}</p>

          <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 inline-block max-w-sm w-full space-y-1">
            <span className="text-xs font-extrabold text-emerald-800 uppercase block">Số Thứ Tự Khám</span>
            <div className="text-4xl font-black text-emerald-700 font-mono tracking-wider">{generatedQueueNo}</div>
            <span className="text-[11px] text-slate-600 font-semibold block">{specialty} • {doctor}</span>
          </div>

          <div className="pt-3">
            <button
              onClick={() => {
                setIsSuccess(false);
                setFullName('');
                setPhone('');
                setIdCard('');
              }}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer border-none"
            >
              Tiếp tục đăng ký bệnh nhân tiếp theo
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-700" />
            <span>Thông tin bệnh nhân đăng ký</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">Họ và tên bệnh nhân (*)</label>
              <input
                type="text"
                placeholder="Nhập đầy đủ họ tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full p-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">Số điện thoại (*)</label>
              <input
                type="text"
                placeholder="Nhập số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full p-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">Số CCCD / CMND</label>
              <input
                type="text"
                placeholder="Nhập 12 số CCCD"
                value={idCard}
                onChange={(e) => setIdCard(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">Chuyên khoa khám (*)</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-blue-600"
              >
                <option value="Khoa Nội Tổng Hợp">Khoa Nội Tổng Hợp</option>
                <option value="Khoa Tim Mạch">Khoa Tim Mạch</option>
                <option value="Khoa Thần Kinh">Khoa Thần Kinh</option>
                <option value="Khoa Cơ Xương Khớp">Khoa Cơ Xương Khớp</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer border-none flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Xác nhận Đăng ký & Cấp số thứ tự</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
