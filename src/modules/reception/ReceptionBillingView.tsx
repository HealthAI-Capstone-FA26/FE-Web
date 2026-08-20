import React, { useState } from 'react';
import { CreditCard, QrCode, CheckCircle2, Download, Printer } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';

interface PendingBill {
  id: string;
  patientName: string;
  doctorName: string;
  examFee: number;
  labTests: Array<{ name: string; price: number }>;
  totalAmount: number;
  status: 'Pending' | 'Paid';
}

const MOCK_BILLS: PendingBill[] = [
  {
    id: 'HD-2026-101',
    patientName: 'Trần Thị Mỹ Duyên',
    doctorName: 'BS. CKII. Nguyễn Quang Huy',
    examFee: 300000,
    labTests: [
      { name: 'Xét nghiệm công thức máu toàn phần (CBC)', price: 150000 },
      { name: 'Chụp X-quang ngực thẳng (Digital Radiography)', price: 250000 }
    ],
    totalAmount: 700000,
    status: 'Pending'
  },
  {
    id: 'HD-2026-102',
    patientName: 'Lê Văn Hoàng',
    doctorName: 'BS. Trương Lê Danh Thái',
    examFee: 300000,
    labTests: [
      { name: 'Xét nghiệm Sinh hóa máu (Glucose, Ure, Creatinine)', price: 200000 },
      { name: 'Siêu âm tim màu Doppler', price: 450000 }
    ],
    totalAmount: 950000,
    status: 'Pending'
  }
];

export const ReceptionBillingView: React.FC = () => {
  const [bills, setBills] = useState<PendingBill[]>(MOCK_BILLS);
  const [selectedBill, setSelectedBill] = useState<PendingBill | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'VietQR' | 'Cash' | 'EWallet'>('VietQR');
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  const handleConfirmPayment = () => {
    if (!selectedBill) return;
    setBills((prev) =>
      prev.map((b) => (b.id === selectedBill.id ? { ...b, status: 'Paid' } : b))
    );
    setIsPaidSuccess(true);
  };

  const columns: Column<PendingBill>[] = [
    {
      header: 'Mã Hóa Đơn',
      accessorKey: 'id',
      cell: (row) => <span className="font-extrabold text-blue-950 whitespace-nowrap">{row.id}</span>
    },
    {
      header: 'Bệnh Nhân',
      accessorKey: 'patientName',
      cell: (row) => <span className="font-extrabold text-slate-800 whitespace-nowrap">{row.patientName}</span>
    },
    {
      header: 'Bác sĩ Chỉ định',
      accessorKey: 'doctorName',
      cell: (row) => <span className="font-semibold text-slate-700 whitespace-nowrap">{row.doctorName}</span>
    },
    {
      header: 'Tổng Chi Phí Xét Nghiệm & Khám',
      cell: (row) => (
        <span className="font-black text-emerald-700 whitespace-nowrap text-xs">
          {row.totalAmount.toLocaleString('vi-VN')} VNĐ
        </span>
      )
    },
    {
      header: 'Trạng Thái',
      cell: (row) => (
        <Badge variant={row.status === 'Paid' ? 'normal' : 'warning'} size="sm">
          {row.status === 'Paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
        </Badge>
      )
    },
    {
      header: 'Thao tác thu ngân',
      cell: (row) => (
        <button
          onClick={() => {
            setSelectedBill(row);
            setIsPaidSuccess(false);
            setIsPaymentModalOpen(true);
          }}
          disabled={row.status === 'Paid'}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 whitespace-nowrap ${
            row.status === 'Paid'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
              : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-xs'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>{row.status === 'Paid' ? 'Đã xuất PDF' : 'Thanh toán & Xuất Hóa đơn'}</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Thu Phí & Mã VietQR
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tính toán chi phí dịch vụ, tạo mã QR thanh toán nhanh và xuất hóa đơn PDF tự động.
          </p>
        </div>
        <Badge variant="ai" size="sm">
          Mô-đun 6
        </Badge>
      </div>

      <DataTable columns={columns} data={bills} searchPlaceholder="Tìm hóa đơn theo tên bệnh nhân, mã HD..." />

      {selectedBill && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title={`Thanh Toán Hóa Đơn: ${selectedBill.id}`}
          subtitle={`Bệnh nhân: ${selectedBill.patientName}`}
          footer={
            isPaidSuccess ? (
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-5 py-2 bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none shadow-sm"
              >
                Đóng Modal
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận Đã Thu Tiền & Xuất Hóa đơn PDF</span>
                </button>
              </>
            )
          }
        >
          {isPaidSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-slate-800">Thanh Toán & Xuất Hóa Đơn PDF Thành Công!</h4>
              <p className="text-xs text-slate-500">
                Dữ liệu xét nghiệm đã tự động kích hoạt chuyển sang phòng Lab (Mô-đun 7).
              </p>

              <div className="flex gap-2 justify-center pt-2">
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none">
                  <Printer className="w-4 h-4" />
                  <span>In Hóa Đơn PDF</span>
                </button>
                <button className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none">
                  <Download className="w-4 h-4" />
                  <span>Tải File .PDF</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-800 block text-xs">Chi tiết danh mục dịch vụ chỉ định:</span>
                <ul className="divide-y divide-slate-200">
                  <li className="py-1.5 flex justify-between">
                    <span>Phí khám bệnh lâm sàng:</span>
                    <span className="font-bold text-slate-800">{selectedBill.examFee.toLocaleString('vi-VN')} VNĐ</span>
                  </li>
                  {selectedBill.labTests.map((t, idx) => (
                    <li key={idx} className="py-1.5 flex justify-between">
                      <span>{t.name}:</span>
                      <span className="font-bold text-slate-800">{t.price.toLocaleString('vi-VN')} VNĐ</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-black text-emerald-800">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-base font-black text-emerald-700">{selectedBill.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="block font-extrabold text-slate-800">Phương thức thanh toán:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('VietQR')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                      paymentMethod === 'VietQR' ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-300' : 'bg-white border-slate-200'
                    }`}
                  >
                    Mã VietQR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                      paymentMethod === 'Cash' ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-300' : 'bg-white border-slate-200'
                    }`}
                  >
                    Tiền mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('EWallet')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                      paymentMethod === 'EWallet' ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-300' : 'bg-white border-slate-200'
                    }`}
                  >
                    Ví MoMo / VNPay
                  </button>
                </div>
              </div>

              {paymentMethod === 'VietQR' && (
                <div className="p-4 bg-slate-900 rounded-2xl text-center space-y-2 text-white">
                  <span className="text-xs font-bold text-amber-300 block">Quét Mã VietQR Chuyển Khoản Ngân Hàng</span>
                  <div className="w-36 h-36 bg-white p-2 rounded-xl mx-auto flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-slate-900" />
                  </div>
                  <span className="text-[11px] text-slate-300 block">Nội dung CK: {selectedBill.id} - {selectedBill.patientName}</span>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
