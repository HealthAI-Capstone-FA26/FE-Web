import React from 'react';
import { QrCode, Calendar } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const PatientPortalAppointmentsView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Trang cá nhân Bệnh nhân (Patient Portal)
          </span>
          <Badge variant="normal" size="sm">
            Mã bệnh nhân: P-90234
          </Badge>
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Lịch Đặt Khám Online & Mã QR Check-in Tự Động
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Quản lý lịch hẹn đặt trước, xuất trình mã QR check-in tại quầy lễ tân bệnh viện và xác nhận cam kết E-Signature.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-700" />
            <span>Lịch Khám Sắp Tới — Bệnh viện Đa khoa 4AM</span>
          </h3>
          <Badge variant="info" size="sm">Đã xác nhận</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>Chuyên khoa: <strong className="text-slate-900">Khoa Nội Tổng Hợp</strong></div>
            <div>Bác sĩ khám: <strong className="text-blue-900">BS. CKII. Nguyễn Quang Huy</strong></div>
            <div>Thời gian: <strong className="text-emerald-700">08:30 AM — Thứ Hai, 17/08/2026</strong></div>
            <div>Địa điểm: <strong className="text-slate-800">Phòng 305 — Tầng 3, Khai bệnh NỘI</strong></div>
            <div className="pt-2">
              <Badge variant="normal" size="sm">Chữ ký E-Signature: Đã ký cam kết</Badge>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-2xl text-white text-center space-y-2">
            <span className="text-xs font-bold text-amber-300 block">Mã QR Check-in Quầy Lễ Tân</span>
            <div className="w-32 h-32 bg-white p-2 rounded-xl mx-auto flex items-center justify-center">
              <QrCode className="w-28 h-28 text-slate-900" />
            </div>
            <span className="text-[10px] text-slate-300 block font-mono">CODE: P-90234-BOOKING-01</span>
          </div>
        </div>
      </div>
    </div>
  );
};
