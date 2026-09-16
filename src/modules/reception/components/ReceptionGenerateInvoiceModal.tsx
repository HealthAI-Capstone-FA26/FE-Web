import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt, Search, RefreshCw, Loader2, CheckCircle2,
  AlertCircle, CreditCard
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { invoiceService, type InvoiceData } from '../../../services/payment/invoice.service';
import { encounterService, type EncounterItem } from '../../../services/encounter/encounter.service';

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

interface ReceptionGenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: (invoice: InvoiceData) => void;
  onSelectPendingInvoice?: (invoice: InvoiceData) => void;
}

export const ReceptionGenerateInvoiceModal: React.FC<ReceptionGenerateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onInvoiceCreated,
  onSelectPendingInvoice,
}) => {
  const [recentEncounters, setRecentEncounters] = useState<EncounterItem[]>([]);
  const [allInvoicesForLookup, setAllInvoicesForLookup] = useState<InvoiceData[]>([]);
  const [isLoadingEncounters, setIsLoadingEncounters] = useState(false);
  const [encounterSearch, setEncounterSearch] = useState('');

  const [selectedEncounterId, setSelectedEncounterId] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number | ''>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Tải danh sách lượt khám và toàn bộ hóa đơn khi mở modal
  const fetchRecentEncounters = useCallback(async () => {
    setIsLoadingEncounters(true);
    try {
      const [encData, invData] = await Promise.all([
        encounterService.getEncounters(),
        invoiceService.findMany({}),
      ]);
      setRecentEncounters(encData || []);
      setAllInvoicesForLookup(invData || []);
    } catch {
      setRecentEncounters([]);
      setAllInvoicesForLookup([]);
    } finally {
      setIsLoadingEncounters(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedEncounterId('');
      setDiscountAmount('');
      setGenerateError(null);
      setEncounterSearch('');
      fetchRecentEncounters();
    }
  }, [isOpen, fetchRecentEncounters]);

  // Tra cứu trạng thái hóa đơn của từng ca khám
  const getEncounterBillingInfo = useCallback(
    (encounterId: string) => {
      const invs = allInvoicesForLookup.filter((i) => i.encounterId === encounterId);
      if (invs.length === 0) {
        return {
          status: 'none' as const,
          label: 'Chưa lập HĐ',
          badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
          invoice: null,
        };
      }
      const pendingInv = invs.find((i) => i.status === 'pending');
      if (pendingInv) {
        return {
          status: 'pending' as const,
          label: `Chờ thanh toán (${pendingInv.invoiceCode})`,
          badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
          invoice: pendingInv,
        };
      }
      const paidInvs = invs.filter((i) => i.status === 'paid');
      if (paidInvs.length > 0) {
        return {
          status: 'paid' as const,
          label: `Đã thanh toán (${paidInvs[0].invoiceCode})`,
          badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          invoice: paidInvs[0],
        };
      }
      return {
        status: 'cancelled' as const,
        label: 'HĐ cũ đã hủy',
        badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200',
        invoice: null,
      };
    },
    [allInvoicesForLookup]
  );

  // Xử lý tạo hóa đơn
  const handleGenerateInvoice = async () => {
    const encId = selectedEncounterId.trim();
    if (!encId) {
      setGenerateError('Vui lòng chọn một lượt khám để lập hóa đơn.');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    try {
      const discount =
        typeof discountAmount === 'number' && discountAmount > 0
          ? discountAmount
          : undefined;

      const createdInvoice = await invoiceService.generate({
        encounterId: encId,
        discountAmount: discount,
      });

      onClose();
      onInvoiceCreated(createdInvoice);
    } catch (err: any) {
      setGenerateError(err?.message || 'Không thể lập hóa đơn cho lượt khám này.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Lọc chỉ lấy các ca chưa tạo HĐ, đang chờ thanh toán, hoặc đã hủy HĐ cũ cần lập lại
  const unpaidEncounters = recentEncounters.filter((enc) => {
    const info = getEncounterBillingInfo(enc.encounterId);
    return info.status === 'none' || info.status === 'pending' || info.status === 'cancelled';
  });

  const filteredEncounters = unpaidEncounters.filter((enc) => {
    if (!encounterSearch.trim()) return true;
    const q = encounterSearch.trim().toLowerCase();
    return (
      enc.encounterCode?.toLowerCase().includes(q) ||
      enc.patient?.fullName?.toLowerCase().includes(q) ||
      enc.patient?.patientCode?.toLowerCase().includes(q) ||
      enc.department?.departmentName?.toLowerCase().includes(q)
    );
  });

  const selectedEncounter = recentEncounters.find((e) => e.encounterId === selectedEncounterId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isGenerating && onClose()}
      title={
        <span className="flex items-center gap-2 text-blue-700">
          <Receipt className="w-5 h-5" />
          Lập Hóa Đơn Cho Lượt Khám
        </span>
      }
      subtitle="Chỉ hiển thị các lượt khám chưa lập hóa đơn hoặc chưa thanh toán viện phí."
      maxWidth="6xl"
      footer={
        <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-3">
          <div className="text-xs text-slate-500">
            {selectedEncounterId ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Đã chọn: {selectedEncounter?.patient?.fullName || 'Bệnh nhân'} ({selectedEncounter?.encounterCode})
              </span>
            ) : (
              <span>Vui lòng chọn một ca khám chưa lập hóa đơn từ danh sách trên.</span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleGenerateInvoice}
              disabled={!selectedEncounterId.trim() || isGenerating}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
              <span>{isGenerating ? 'Đang lập hóa đơn...' : 'Tạo Hóa Đơn & Thanh Toán'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Lỗi nếu có */}
        {generateError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generateError}</span>
          </div>
        )}

        {/* Thanh tìm kiếm & Làm mới */}
        <div className="flex items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên bệnh nhân, mã lượt khám, mã bệnh nhân..."
              value={encounterSearch}
              onChange={(e) => setEncounterSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
            />
          </div>
          <button
            type="button"
            onClick={fetchRecentEncounters}
            disabled={isLoadingEncounters}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEncounters ? 'animate-spin text-blue-600' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Danh sách lượt khám */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-600 text-[11px] grid grid-cols-12 gap-3 items-center">
            <div className="col-span-4">BỆNH NHÂN / MÃ CA</div>
            <div className="col-span-3">KHOA KHÁM / BÁC SĨ</div>
            <div className="col-span-2">TIẾP NHẬN</div>
            <div className="col-span-3 text-right">TRẠNG THÁI / THAO TÁC</div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {isLoadingEncounters ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs font-medium">Đang tải danh sách ca khám chưa thanh toán...</span>
              </div>
            ) : filteredEncounters.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-1">
                <p className="font-semibold text-slate-600">Không có ca khám nào cần lập hóa đơn</p>
                <p className="text-[11px] text-slate-400">
                  Tất cả ca khám đã được thanh toán hoặc không khớp với từ khóa tìm kiếm.
                </p>
              </div>
            ) : (
              filteredEncounters.map((enc) => {
                const isSelected = selectedEncounterId === enc.encounterId;
                const billingInfo = getEncounterBillingInfo(enc.encounterId);

                return (
                  <div
                    key={enc.encounterId}
                    onClick={() => {
                      if (billingInfo.status === 'none' || billingInfo.status === 'cancelled') {
                        setSelectedEncounterId(enc.encounterId);
                      }
                    }}
                    className={`px-4 py-3 grid grid-cols-12 gap-3 items-center transition-colors ${
                      isSelected
                        ? 'bg-blue-50/90 border-l-4 border-blue-600'
                        : billingInfo.status === 'pending'
                        ? 'hover:bg-amber-50/40 bg-white'
                        : 'hover:bg-slate-50/80 bg-white cursor-pointer'
                    }`}
                  >
                    {/* Bệnh nhân */}
                    <div className="col-span-4 space-y-0.5">
                      <div className="font-bold text-slate-900 text-xs">
                        {enc.patient?.fullName || 'Bệnh nhân chưa có tên'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                          {enc.encounterCode}
                        </span>
                        {enc.patient?.patientCode && (
                          <span>• Mã BN: {enc.patient.patientCode}</span>
                        )}
                      </div>
                    </div>

                    {/* Khoa khám / Bác sĩ */}
                    <div className="col-span-3 space-y-0.5 text-[11px]">
                      <div className="text-slate-800 font-medium truncate">
                        {enc.department?.departmentName || '---'}
                      </div>
                      <div className="text-slate-500 text-[10px] truncate">
                        {enc.doctor?.fullName ? `BS: ${enc.doctor.fullName}` : 'Chưa chỉ định BS'}
                      </div>
                    </div>

                    {/* Tiếp nhận */}
                    <div className="col-span-2 text-[11px]">
                      {enc.arrivedAt ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">
                            {new Date(enc.arrivedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(enc.arrivedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>

                    {/* Trạng thái & Thao tác */}
                    <div className="col-span-3 flex items-center justify-end gap-2 shrink-0">
                      {billingInfo.status === 'pending' && billingInfo.invoice ? (
                        <>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                            Chờ thanh toán
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              onSelectPendingInvoice?.(billingInfo.invoice!);
                            }}
                            className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold border-none transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Thanh toán</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${billingInfo.badgeClass}`}>
                            {billingInfo.label}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEncounterId(enc.encounterId);
                            }}
                            className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition-colors cursor-pointer shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                            }`}
                          >
                            {isSelected ? '✓ Đã chọn' : 'Chọn lập HĐ'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chi tiết ca được chọn & Ô giảm trừ */}
        {selectedEncounterId && (
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Thông tin lượt khám được chọn để lập hóa đơn
              </span>
              <button
                type="button"
                onClick={() => setSelectedEncounterId('')}
                className="text-[11px] text-slate-500 hover:text-red-600 font-semibold cursor-pointer bg-transparent border-none"
              >
                Bỏ chọn
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">BỆNH NHÂN</p>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {selectedEncounter?.patient?.fullName || '---'}
                </p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">MÃ LƯỢT KHÁM</p>
                <p className="font-bold font-mono text-indigo-700 text-xs mt-0.5">
                  {selectedEncounter?.encounterCode || '---'}
                </p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">GIẢM TRỪ CHI PHÍ (VNĐ - TÙY CHỌN)</p>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={discountAmount}
                  onChange={(e) =>
                    setDiscountAmount(
                      e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                    )
                  }
                  placeholder="Nhập 0 nếu không có"
                  className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-bold text-slate-800"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
