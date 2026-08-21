// FR-HM-2.2 — Thu thập thông tin bảo hiểm y tế
// Actor: Bệnh nhân
// Trạng thái: Mock UI (chưa nối API BHXH)

import React, { useState } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, RefreshCw, Save } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const PatientInsuranceView: React.FC = () => {
  const [insuranceNumber, setInsuranceNumber] = useState('DN 4 79 7923456789');
  const [initialHospital, setInitialHospital] = useState('Bệnh viện Đa khoa 4AM (Mã 79-012)');
  const [validUntil, setValidUntil] = useState('2026-12-31');
  const [benefitRate, setBenefitRate] = useState<number>(80);
  const [verificationStatus, setVerificationStatus] = useState<'VALID' | 'EXPIRED' | 'UNVERIFIED'>('VALID');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationStatus('VALID');
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Thông Tin Thẻ Bảo Hiểm Y Tế (BHYT)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Khai báo mã số BHYT để được hưởng quyền lợi chi trả tự động khi thăm khám & làm xét nghiệm.
          </p>
        </div>
        <Badge variant={verificationStatus === 'VALID' ? 'normal' : verificationStatus === 'EXPIRED' ? 'critical' : 'warning'} size="sm">
          {verificationStatus === 'VALID' ? 'Thẻ Hợp Lệ' : verificationStatus === 'EXPIRED' ? 'Hết Hạn' : 'Chưa Xác Thực'}
        </Badge>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Thông tin thẻ BHYT đã được cập nhật thành công!</span>
        </div>
      )}

      {/* Visual BHYT Card Display */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-lg space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-blue-200 font-black block">BẢO HIỂM XÃ HỘI VIỆT NAM</span>
            <h3 className="text-lg font-black tracking-tight text-white mt-0.5">THẺ BẢO HIỂM Y TẾ</h3>
          </div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg font-mono font-black text-xs border border-white/30 text-white">
            Mức hưởng: {benefitRate}%
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-blue-200 uppercase font-bold block">Số thẻ BHYT:</span>
          <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-yellow-300 block">
            {insuranceNumber || 'DN 4 XX XXXXXXXXXX'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-blue-700/60 text-xs">
          <div>
            <span className="text-[10px] text-blue-200/80 uppercase font-bold block">Nơi KCB Ban Đầu:</span>
            <span className="font-bold text-white line-clamp-1">{initialHospital}</span>
          </div>
          <div>
            <span className="text-[10px] text-blue-200/80 uppercase font-bold block">Hạn Sử Dụng Đến:</span>
            <span className="font-bold text-white">{validUntil}</span>
          </div>
        </div>
      </div>

      {/* Form Details */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-base text-slate-900">Chi Tiết Thông Tin Thẻ BHYT</h3>
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Đang xác thực BHXH...' : 'Kiểm Tra Thẻ BHXH'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mã số thẻ BHYT (15 ký tự) *</label>
            <input
              type="text"
              required
              value={insuranceNumber}
              onChange={(e) => setInsuranceNumber(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-mono font-bold uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tỷ lệ hưởng BHYT (%) *</label>
            <select
              value={benefitRate}
              onChange={(e) => setBenefitRate(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-bold"
            >
              <option value={100}>100% (Chi trả toàn bộ)</option>
              <option value={95}>95% (Hưởng 95% chi phí)</option>
              <option value={80}>80% (Hưởng 80% chi phí chuẩn)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Nơi đăng ký khám chữa bệnh ban đầu *</label>
            <input
              type="text"
              required
              value={initialHospital}
              onChange={(e) => setInitialHospital(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Thời hạn sử dụng thẻ *</label>
            <input
              type="date"
              required
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái xác thực Cổng BHXH</label>
            <div className="flex items-center gap-2 py-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">Đã tra cứu hợp lệ trên Cổng BHXH Quốc Gia</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-md border-none"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Thông Tin BHYT</span>
          </button>
        </div>
      </form>
    </div>
  );
};
