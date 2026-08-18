import React, { useState } from 'react';
import { Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';

interface NurseQueuePatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  status: 'Pending' | 'Measured';
  vitals?: {
    pulse: number;
    bpSystolic: number;
    bpDiastolic: number;
    temp: number;
    spo2: number;
    height: number;
    weight: number;
    bmi: number;
    isAbnormal: boolean;
  };
}

const MOCK_NURSE_QUEUE: NurseQueuePatient[] = [
  {
    id: 'BN-2026-002',
    name: 'Lê Văn Hoàng',
    age: 58,
    gender: 'Nam',
    phone: '0988 123 456',
    status: 'Pending'
  },
  {
    id: 'BN-2026-003',
    name: 'Nguyễn Bích Ngọc',
    age: 29,
    gender: 'Nữ',
    phone: '0912 345 678',
    status: 'Pending'
  },
  {
    id: 'BN-2026-004',
    name: 'Trần Văn Tiến',
    age: 64,
    gender: 'Nam',
    phone: '0977 889 900',
    status: 'Measured',
    vitals: {
      pulse: 110,
      bpSystolic: 165,
      bpDiastolic: 100,
      temp: 38.5,
      spo2: 94,
      height: 168,
      weight: 78,
      bmi: 27.6,
      isAbnormal: true
    }
  }
];

export const NurseQueueView: React.FC = () => {
  const [patients, setPatients] = useState<NurseQueuePatient[]>(MOCK_NURSE_QUEUE);
  const [selectedPatient, setSelectedPatient] = useState<NurseQueuePatient | null>(null);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);

  // Form states
  const [pulse, setPulse] = useState(80);
  const [bpSystolic, setBpSystolic] = useState(120);
  const [bpDiastolic, setBpDiastolic] = useState(80);
  const [temp, setTemp] = useState(37.0);
  const [spo2, setSpo2] = useState(98);
  const [height, setHeight] = useState(165);
  const [weight, setWeight] = useState(62);

  // Auto calc BMI
  const bmi = height > 0 ? parseFloat((weight / ((height / 100) * (height / 100))).toFixed(1)) : 0;
  const isAbnormal = bpSystolic >= 140 || bpSystolic <= 90 || temp >= 38.0 || spo2 < 95;

  const handleSaveVitals = () => {
    if (!selectedPatient) return;
    setPatients((prev) =>
      prev.map((p) =>
        p.id === selectedPatient.id
          ? {
              ...p,
              status: 'Measured',
              vitals: {
                pulse,
                bpSystolic,
                bpDiastolic,
                temp,
                spo2,
                height,
                weight,
                bmi,
                isAbnormal
              }
            }
          : p
      )
    );
    setIsInputModalOpen(false);
    setSelectedPatient(null);
  };

  const columns: Column<NurseQueuePatient>[] = [
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
            {row.age} tuổi • {row.gender} • SĐT: {row.phone}
          </span>
        </div>
      )
    },
    {
      header: 'Chỉ số Sinh hiệu vừa đo',
      cell: (row) => {
        if (!row.vitals) return <span className="text-slate-400 font-semibold italic text-xs">Chưa đo sinh hiệu</span>;
        return (
          <div className="whitespace-nowrap text-xs space-y-0.5">
            <div>HA: <strong className="text-blue-900">{row.vitals.bpSystolic}/{row.vitals.bpDiastolic} mmHg</strong> • Mạch: <strong>{row.vitals.pulse} bpm</strong></div>
            <div className="text-[11px] text-slate-600">Nhiệt độ: <strong>{row.vitals.temp}°C</strong> • SpO2: <strong>{row.vitals.spo2}%</strong> • BMI: <strong>{row.vitals.bmi}</strong></div>
          </div>
        );
      }
    },
    {
      header: 'Cảnh báo tự động',
      cell: (row) => {
        if (!row.vitals) return <Badge variant="neutral" size="sm">Đang chờ</Badge>;
        return (
          <Badge variant={row.vitals.isAbnormal ? 'critical' : 'normal'} size="sm">
            {row.vitals.isAbnormal ? 'Cảnh báo bất thường!' : 'Sinh hiệu ổn định'}
          </Badge>
        );
      }
    },
    {
      header: 'Thao tác điều dưỡng',
      cell: (row) => (
        <button
          onClick={() => {
            setSelectedPatient(row);
            if (row.vitals) {
              setPulse(row.vitals.pulse);
              setBpSystolic(row.vitals.bpSystolic);
              setBpDiastolic(row.vitals.bpDiastolic);
              setTemp(row.vitals.temp);
              setSpo2(row.vitals.spo2);
              setHeight(row.vitals.height);
              setWeight(row.vitals.weight);
            } else {
              setPulse(80);
              setBpSystolic(120);
              setBpDiastolic(80);
              setTemp(37.0);
              setSpo2(98);
              setHeight(165);
              setWeight(62);
            }
            setIsInputModalOpen(true);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 whitespace-nowrap ${
            row.status === 'Measured'
              ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-xs'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{row.status === 'Measured' ? 'Cập nhật lại sinh hiệu' : 'Nhập sinh hiệu (Mod 4)'}</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Mô-đun 4: Kiểm tra sinh hiệu & Cảnh báo bất thường
          </span>
          <Badge variant="warning" size="sm">
            Tự động tính BMI & Phát hiện bất thường
          </Badge>
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Trạm Điều Dưỡng — Đo & Ghi Nhận Chỉ Số Sinh Hiệu Bệnh Nhân
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Nhập mạch, huyết áp, nhiệt độ, nhịp thở, SpO2, thể trạng (chiều cao, cân nặng). Hệ thống tự động cảnh báo nếu vượt ngưỡng.
        </p>
      </div>

      <DataTable columns={columns} data={patients} searchPlaceholder="Tìm bệnh nhân theo tên, mã số..." />

      {selectedPatient && (
        <Modal
          isOpen={isInputModalOpen}
          onClose={() => setIsInputModalOpen(false)}
          title={`Ghi Nhận Sinh Hiệu: ${selectedPatient.name}`}
          subtitle={`Bệnh nhân: ${selectedPatient.age} tuổi • ${selectedPatient.gender}`}
          footer={
            <>
              <button
                onClick={() => setIsInputModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveVitals}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer border-none shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu Chỉ Số Sinh Hiệu & Đồng Bộ EMR</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            {isAbnormal && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold flex items-center gap-2 animate-pulse">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>CẢNH BÁO: Chỉ số huyết áp / nhiệt độ / SpO2 vượt ngưỡng an toàn!</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Huyết áp Tâm Thu (mmHg)</label>
                <input
                  type="number"
                  value={bpSystolic}
                  onChange={(e) => setBpSystolic(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-extrabold text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Huyết áp Tâm Trương (mmHg)</label>
                <input
                  type="number"
                  value={bpDiastolic}
                  onChange={(e) => setBpDiastolic(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-extrabold text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Nhịp tim / Mạch (bpm)</label>
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-extrabold text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Nhiệt độ cơ thể (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-extrabold text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Chỉ số SpO2 (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-extrabold text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Chiều cao (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Cân nặng (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div className="col-span-2 bg-blue-50/80 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-700 font-extrabold uppercase block">Tự động tính toán BMI</span>
                  <span className="text-xl font-black text-blue-900">{bmi}</span>
                </div>
                <Badge variant={bmi >= 25 ? 'warning' : 'normal'} size="sm">
                  {bmi >= 25 ? 'Thừa cân' : 'Bình thường'}
                </Badge>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
