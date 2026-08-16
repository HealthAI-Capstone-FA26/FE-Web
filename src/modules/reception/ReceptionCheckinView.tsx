import React, { useState } from 'react';
import { UserCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';

interface ReceptionPatient {
  id: string;
  name: string;
  dob: string;
  phone: string;
  idCard: string; // CCCD
  insuranceCard: string; // BHYT
  bookingType: 'Online' | 'At-Hospital';
  hasESignature: boolean;
  specialty: string;
  status: 'Waiting' | 'Verified' | 'Dispatched';
}

const MOCK_RECEPTION_PATIENTS: ReceptionPatient[] = [
  {
    id: 'BN-2026-088',
    name: 'Khưu Trọng Quân',
    dob: '22/04/2005',
    phone: '0902 357 872',
    idCard: '079205001234',
    insuranceCard: 'DN479205001234',
    bookingType: 'Online',
    hasESignature: true,
    specialty: 'Khoa Nội Tổng Hợp',
    status: 'Waiting'
  },
  {
    id: 'BN-2026-089',
    name: 'Nguyễn Thị Thu Hà',
    dob: '15/08/1990',
    phone: '0918 223 445',
    idCard: '079190005678',
    insuranceCard: 'DN479190005678',
    bookingType: 'At-Hospital',
    hasESignature: true,
    specialty: 'Khoa Tim Mạch',
    status: 'Waiting'
  },
  {
    id: 'BN-2026-090',
    name: 'Phạm Minh Đức',
    dob: '02/11/1982',
    phone: '0933 112 334',
    idCard: '079182009988',
    insuranceCard: 'DN479182009988',
    bookingType: 'Online',
    hasESignature: false,
    specialty: 'Khoa Thần Kinh',
    status: 'Waiting'
  }
];

export const ReceptionCheckinView: React.FC = () => {
  const [patients, setPatients] = useState<ReceptionPatient[]>(MOCK_RECEPTION_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<ReceptionPatient | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [assignedDoctor, setAssignedDoctor] = useState('BS. CKII. Nguyễn Quang Huy');

  const handleVerifyAndDispatch = () => {
    if (!selectedPatient) return;
    setPatients((prev) =>
      prev.map((p) => (p.id === selectedPatient.id ? { ...p, status: 'Dispatched' } : p))
    );
    setIsVerifyModalOpen(false);
    setSelectedPatient(null);
  };

  const columns: Column<ReceptionPatient>[] = [
    {
      header: 'Mã Bệnh Nhân',
      accessorKey: 'id',
      cell: (row) => <span className="font-extrabold text-blue-950 whitespace-nowrap">{row.id}</span>
    },
    {
      header: 'Họ và Tên',
      cell: (row) => (
        <div className="whitespace-nowrap">
          <span className="font-extrabold text-slate-800">{row.name}</span>
          <span className="text-[11px] text-slate-500 block">
            Ngày sinh: {row.dob} • SĐT: {row.phone}
          </span>
        </div>
      )
    },
    {
      header: 'Số CCCD / Mã BHYT',
      cell: (row) => (
        <div className="whitespace-nowrap text-xs">
          <div className="font-semibold text-slate-700">CCCD: {row.idCard}</div>
          <div className="text-[11px] text-blue-700 font-bold">BHYT: {row.insuranceCard}</div>
        </div>
      )
    },
    {
      header: 'Hình thức Đặt',
      cell: (row) => (
        <Badge variant={row.bookingType === 'Online' ? 'info' : 'neutral'} size="sm">
          {row.bookingType === 'Online' ? 'Đặt Online (Mod 2)' : 'Trực tiếp tại quầy'}
        </Badge>
      )
    },
    {
      header: 'Chữ ký điện tử',
      cell: (row) => (
        <Badge variant={row.hasESignature ? 'normal' : 'warning'} size="sm">
          {row.hasESignature ? 'Đã ký E-Signature' : 'Chưa ký xác nhận'}
        </Badge>
      )
    },
    {
      header: 'Chuyên khoa đăng ký',
      accessorKey: 'specialty',
      cell: (row) => <span className="font-semibold text-slate-700 whitespace-nowrap">{row.specialty}</span>
    },
    {
      header: 'Thao tác tiếp nhận',
      cell: (row) => (
        <button
          onClick={() => {
            setSelectedPatient(row);
            setIsVerifyModalOpen(true);
          }}
          disabled={row.status === 'Dispatched'}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 whitespace-nowrap ${
            row.status === 'Dispatched'
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-xs'
          }`}
        >
          {row.status === 'Dispatched' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã điều hướng</span>
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5" />
              <span>Xác minh & Điều hướng</span>
            </>
          )}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Mô-đun 3: Tiếp nhận & Thu thập thông tin
            </span>
            <Badge variant="ai" size="sm">
              Định danh CCCD & BHYT
            </Badge>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Quầy Tiếp Nhận & Xác Minh Bệnh Nhân Check-in
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhân viên lễ tân xác minh giấy tờ định danh, kiểm tra Chữ ký điện tử (E-Signature) và xếp hàng chờ phòng khám bác sĩ.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Hàng chờ tiếp nhận</span>
            <span className="text-lg font-black text-blue-900">08 Bệnh nhân</span>
          </div>
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable columns={columns} data={patients} searchPlaceholder="Tìm theo tên bệnh nhân, CCCD, số điện thoại..." />

      {/* Verification & Queue Dispatching Modal */}
      {selectedPatient && (
        <Modal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
          title={`Xác Minh & Điều Hướng Bệnh Nhân: ${selectedPatient.name}`}
          subtitle={`Mã bệnh nhân: ${selectedPatient.id} • ${selectedPatient.specialty}`}
          footer={
            <>
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleVerifyAndDispatch}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer border-none shadow-sm flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Xác nhận & Điều hướng vào Hàng chờ Bác sĩ</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold block">Họ và tên:</span>
                <span className="font-extrabold text-slate-800 text-sm">{selectedPatient.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Số CCCD / CMND:</span>
                <span className="font-bold text-slate-800">{selectedPatient.idCard}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Số thẻ BHYT:</span>
                <span className="font-bold text-blue-700">{selectedPatient.insuranceCard}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Chữ ký điện tử (E-Signature):</span>
                <Badge variant={selectedPatient.hasESignature ? 'normal' : 'warning'} size="sm">
                  {selectedPatient.hasESignature ? 'Đã ký cam kết bảo mật y tế' : 'Cần yêu cầu ký bổ sung'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block font-extrabold text-slate-800">Chọn Bác sĩ chuyên khoa phụ trách tiếp nhận:</label>
              <select
                value={assignedDoctor}
                onChange={(e) => setAssignedDoctor(e.target.value)}
                className="w-full bg-white p-3 rounded-xl border border-slate-200 font-bold text-xs text-slate-800 outline-none focus:border-blue-600"
              >
                <option value="BS. CKII. Nguyễn Quang Huy">BS. CKII. Nguyễn Quang Huy (Khoa Nội - Phòng 305)</option>
                <option value="BS. Trương Lê Danh Thái">BS. Trương Lê Danh Thái (Khoa Tim Mạch - Phòng 201)</option>
                <option value="BS. Phạm Đức Anh">BS. Phạm Đức Anh (Khoa Thần Kinh - Phòng 402)</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
