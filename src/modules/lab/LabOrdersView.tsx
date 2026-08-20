import React, { useState } from 'react';
import { FlaskConical, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';

interface LabOrder {
  id: string;
  patientName: string;
  testName: string;
  isPaid: boolean;
  status: 'Pending' | 'Completed';
  resultValue?: string;
}

const MOCK_LAB_ORDERS: LabOrder[] = [
  {
    id: 'LAB-2026-001',
    patientName: 'Trần Thị Mỹ Duyên',
    testName: 'Xét nghiệm công thức máu toàn phần (CBC)',
    isPaid: true,
    status: 'Pending'
  },
  {
    id: 'LAB-2026-002',
    patientName: 'Lê Văn Hoàng',
    testName: 'Xét nghiệm Sinh hóa máu (Glucose, Ure, Creatinine)',
    isPaid: true,
    status: 'Pending'
  }
];

export const LabOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<LabOrder[]>(MOCK_LAB_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [resultVal, setResultVal] = useState('');

  const handleSaveResult = () => {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: 'Completed', resultValue: resultVal } : o))
    );
    setIsInputModalOpen(false);
  };

  const columns: Column<LabOrder>[] = [
    {
      header: 'Mã Chỉ Định Lab',
      accessorKey: 'id',
      cell: (row) => <span className="font-extrabold text-blue-950 whitespace-nowrap">{row.id}</span>
    },
    {
      header: 'Bệnh Nhân',
      accessorKey: 'patientName',
      cell: (row) => <span className="font-extrabold text-slate-800 whitespace-nowrap">{row.patientName}</span>
    },
    {
      header: 'Tên Xét Nghiệm Chỉ Định',
      accessorKey: 'testName',
      cell: (row) => <span className="font-semibold text-slate-700 whitespace-nowrap">{row.testName}</span>
    },
    {
      header: 'Ràng buộc Thanh toán',
      cell: (row) => (
        <Badge variant={row.isPaid ? 'normal' : 'critical'} size="sm">
          {row.isPaid ? 'Đã hoàn tất thanh toán' : 'Chưa thanh toán (Chặn lab)'}
        </Badge>
      )
    },
    {
      header: 'Trạng thái xử lý',
      cell: (row) => (
        <Badge variant={row.status === 'Completed' ? 'normal' : 'warning'} size="sm">
          {row.status === 'Completed' ? 'Đã có kết quả EMR' : 'Đang chờ xét nghiệm'}
        </Badge>
      )
    },
    {
      header: 'Thao tác KTV Lab',
      cell: (row) => (
        <button
          onClick={() => {
            setSelectedOrder(row);
            setResultVal(row.resultValue || 'WBC: 6.8 K/uL, RBC: 4.5 M/uL, HGB: 13.5 g/dL, PLT: 250 K/uL');
            setIsInputModalOpen(true);
          }}
          disabled={!row.isPaid}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold text-xs rounded-lg cursor-pointer border-none shadow-xs whitespace-nowrap flex items-center gap-1.5"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Nhập thông số xét nghiệm</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Xét Nghiệm Phòng Lab
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tiếp nhận chỉ định xét nghiệm, cập nhật kết quả và liên thông với hồ sơ EMR.
          </p>
        </div>
        <Badge variant="normal" size="sm">
          Mô-đun 7
        </Badge>
      </div>

      <DataTable columns={columns} data={orders} searchPlaceholder="Tìm theo tên bệnh nhân, mã chỉ định..." />

      {selectedOrder && (
        <Modal
          isOpen={isInputModalOpen}
          onClose={() => setIsInputModalOpen(false)}
          title={`Nhập Kết Quả Xét Nghiệm: ${selectedOrder.testName}`}
          subtitle={`Bệnh nhân: ${selectedOrder.patientName}`}
          footer={
            <>
              <button
                onClick={() => setIsInputModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveResult}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer border-none shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu & Đồng Bộ Sang Hồ Sơ EMR</span>
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <label className="block font-extrabold text-slate-800">Kết quả chỉ số kỹ thuật xét nghiệm (*):</label>
            <textarea
              rows={4}
              value={resultVal}
              onChange={(e) => setResultVal(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
