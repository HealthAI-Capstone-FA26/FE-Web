import React from 'react';
import {
  Activity,
  Clock,
  User,
  Phone,
  Building2,
  Stethoscope,
  History,
  Loader2,
  Eye,
  ShieldAlert,
  GitFork,
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { DataTable, type Column } from '../../../components/common/DataTable';
import type { NursePatientRow } from '../../../services/encounter/encounter.service';

interface NurseQueueTableProps {
  data: NursePatientRow[];
  isLoading: boolean;
  onOpenMeasure: (row: NursePatientRow) => void;
  onOpenHistory: (row: NursePatientRow) => void;
  onOpenDetail: (row: NursePatientRow) => void;
  onOpenAllergy: (row: NursePatientRow) => void;
  onOpenChangeDept?: (row: NursePatientRow) => void;
  onStartProcessing?: (row: NursePatientRow) => void;
}

export const NurseQueueTable: React.FC<NurseQueueTableProps> = ({
  data,
  isLoading,
  onOpenMeasure,
  onOpenHistory,
  onOpenDetail,
  onOpenAllergy,
  onOpenChangeDept,
  onStartProcessing,
}) => {
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'emergency':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
            Cấp cứu
          </span>
        );
      case 'urgent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
            Khẩn cấp
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Thường
          </span>
        );
    }
  };

  const getTriageStatusBadge = (triageStatus?: string, rowStatus?: string) => {
    switch (triageStatus) {
      case 'waiting':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-2.5 h-2.5" />
            Đang chờ
          </span>
        );
      case 'called':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
            <Activity className="w-2.5 h-2.5" />
            Đang gọi vào
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
            <Activity className="w-2.5 h-2.5" />
            Đang đo
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ Đã đo xong
          </span>
        );
      default:
        return rowStatus === 'Measured' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ Đã đo xong
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            Chờ xử lý
          </span>
        );
    }
  };

  const columns: Column<NursePatientRow>[] = [
    {
      header: 'STT & Ưu tiên',
      cell: (row) => (
        <div className="flex flex-col items-start gap-1">
          <span className="font-black text-slate-900 font-mono text-sm">
            {row.queueOrder !== undefined ? `#${String(row.queueOrder).padStart(2, '0')}` : '---'}
          </span>
          {getPriorityBadge(row.priority)}
        </div>
      ),
    },
    {
      header: 'Mã Lượt Khám',
      accessorKey: 'encounterCode',
      cell: (row) => (
        <div>
          <span className="font-extrabold text-blue-950 font-mono block text-xs">{row.encounterCode}</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            Tiếp nhận: {formatTimeAgo(row.arrivedAt)}
          </span>
          <div className="mt-1">
            {getTriageStatusBadge(row.triageStatus, row.status)}
          </div>
        </div>
      ),
    },
    {
      header: 'Bệnh Nhân',
      cell: (row) => (
        <div className="whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-extrabold text-slate-900 text-xs">{row.name}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
            <span>{row.age !== '---' ? `${row.age} tuổi` : 'Chưa có năm sinh'}</span>
            <span>•</span>
            <span>{row.gender}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5 font-mono text-slate-600">
              <Phone className="w-3 h-3 text-slate-400" />
              {row.phone}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Chuyên Khoa & Bác Sĩ',
      cell: (row) => (
        <div className="text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>{row.departmentName}</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <Stethoscope className="w-3 h-3 text-teal-600 shrink-0" />
            <span>{row.doctorName}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Chỉ Số Sinh Hiệu',
      cell: (row) => {
        if (!row.vitals) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
              Chờ đo sinh hiệu
            </span>
          );
        }

        return (
          <div className="text-xs space-y-0.5 whitespace-nowrap">
            <div>
              HA: <strong className="text-blue-900">{row.vitals.bpSystolic}/{row.vitals.bpDiastolic} mmHg</strong>
              {' • '}
              Mạch: <strong className="text-slate-800">{row.vitals.pulse} bpm</strong>
            </div>
            <div className="text-[11px] text-slate-600">
              Nhiệt độ: <strong>{row.vitals.temp}°C</strong>
              {' • '}
              SpO2: <strong className={row.vitals.spo2 && row.vitals.spo2 < 95 ? 'text-rose-600 font-bold' : ''}>{row.vitals.spo2}%</strong>
              {row.vitals.bmi ? (
                <>
                  {' • '}
                  BMI: <strong>{row.vitals.bmi}</strong>
                </>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Cảnh Báo Sớm',
      cell: (row) => {
        if (!row.vitals) {
          return <Badge variant="neutral" size="sm">Đang chờ</Badge>;
        }
        return (
          <Badge variant={row.vitals.isAbnormal ? 'critical' : 'normal'} size="sm">
            {row.vitals.isAbnormal ? 'Cảnh báo bất thường!' : 'Sinh hiệu ổn định'}
          </Badge>
        );
      },
    },
    {
      header: 'Thao Tác',
      cell: (row) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {/* Nút Xem chi tiết ca khám */}
          <button
            type="button"
            onClick={() => onOpenDetail(row)}
            title="Xem chi tiết hồ sơ ca khám (Lý do khám, Bác sĩ, Sinh hiệu)"
            className="p-1.5 rounded-xl text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Nút Khai báo dị ứng */}
          <button
            type="button"
            onClick={() => onOpenAllergy(row)}
            title="Khai báo & quản lý dị ứng của bệnh nhân"
            className="p-1.5 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
          </button>

          {row.triageStatus === 'called' && onStartProcessing && (
            <button
              type="button"
              onClick={() => onStartProcessing(row)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-2xs"
              title="Bệnh nhân đã vào bàn, bấm để bắt đầu đo"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Bắt đầu đo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenMeasure(row)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 shadow-2xs ${
              row.status === 'Measured' || row.triageStatus === 'done'
                ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{row.status === 'Measured' || row.triageStatus === 'done' ? 'Đo lại' : 'Nhập sinh hiệu'}</span>
          </button>

          {row.status === 'Measured' && (
            <>
              {onOpenChangeDept && (
                <button
                  type="button"
                  onClick={() => onOpenChangeDept(row)}
                  title="Đổi khoa khám & tự động chọn bác sĩ rảnh nhất"
                  className="p-1.5 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                >
                  <GitFork className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenHistory(row)}
                title="Xem lịch sử các lần đo"
                className="p-1.5 rounded-xl text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {isLoading && data.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span>Đang tải danh sách ca khám từ Lễ tân...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <span>Hiện chưa có ca khám nào đang chờ đo sinh hiệu.</span>
        </div>
      ) : (
        <DataTable columns={columns} data={data} searchPlaceholder="Tìm theo tên bệnh nhân, mã lượt khám, SĐT..." />
      )}
    </div>
  );
};
