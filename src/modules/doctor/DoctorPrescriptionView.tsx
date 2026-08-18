import React, { useState } from 'react';
import { Pill, CheckCircle2, FileCheck, Printer, Download } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

interface PrescribedDrug {
  id: string;
  name: string;
  dosage: string;
  unit: string;
  quantity: number;
  route: string;
  instructions: string;
}

export const DoctorPrescriptionView: React.FC = () => {
  const [drugs] = useState<PrescribedDrug[]>([
    {
      id: 'TH-001',
      name: 'Paracetamol 500mg (Hạ sốt, giảm đau)',
      dosage: '500mg',
      unit: 'Viên',
      quantity: 10,
      route: 'Uống',
      instructions: 'Uống 1 viên khi sốt trên 38.5°C, cách nhau 4-6 giờ'
    },
    {
      id: 'TH-002',
      name: 'Acetylcysteine 200mg (Long đờm)',
      dosage: '200mg',
      unit: 'Gói',
      quantity: 14,
      route: 'Uống',
      instructions: 'Uống 1 gói x 2 lần/ngày sau khi ăn'
    }
  ]);

  const [isDigitalSignModalOpen, setIsDigitalSignModalOpen] = useState(false);
  const [isSignedSuccess, setIsSignedSuccess] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Mô-đun 9: Kê đơn thuốc điện tử & Ký số
          </span>
          <Badge variant="normal" size="sm">
            Danh mục Thuốc Quốc gia
          </Badge>
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Lập Đơn Thuốc Điện Tử & Ký Số Xác Thực Pháp Lý Bác Sĩ
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tự động kiểm tra an toàn thuốc (tương tác thuốc, chống chỉ định dị ứng), ký số pháp lý và xuất hồ sơ y tế PDF.
        </p>
      </div>

      {/* Drug Safety Alert Banner */}
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between font-bold">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Hệ thống Kiểm tra An toàn Thuốc (Safety Check): Đơn thuốc không ghi nhận tương tác thuốc nguy hiểm.</span>
        </div>
        <Badge variant="normal" size="sm">Safety Passed</Badge>
      </div>

      {/* Prescription Form Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Pill className="w-4 h-4 text-blue-700" />
            <span>Danh Mục Thuốc Kê Trong Đơn (Mã ICD-10: J20.9)</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">2 Thuốc được chọn</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200">
                <th className="py-3 px-3">Tên Thuốc & Hàm Lượng</th>
                <th className="py-3 px-3">Đường Dùng</th>
                <th className="py-3 px-3">Số Lượng</th>
                <th className="py-3 px-3">Lời Dặn Của Bác Sĩ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drugs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-extrabold text-slate-800">{d.name}</td>
                  <td className="py-3 px-3 font-semibold text-slate-700">{d.route}</td>
                  <td className="py-3 px-3 font-black text-blue-900">{d.quantity} {d.unit}</td>
                  <td className="py-3 px-3 font-semibold text-slate-600">{d.instructions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={() => setIsDigitalSignModalOpen(true)}
            className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none flex items-center gap-2"
          >
            <FileCheck className="w-4 h-4" />
            <span>Thực Hiện Ký Số Bác Sĩ & Xuất Hồ Sơ Y Tế PDF</span>
          </button>
        </div>
      </div>

      {/* Digital Signature Modal */}
      <Modal
        isOpen={isDigitalSignModalOpen}
        onClose={() => setIsDigitalSignModalOpen(false)}
        title="Xác Thực Ký Số Pháp Lý Bác Sĩ"
        subtitle="Chứng thư số: BS. CKII. Nguyễn Quang Huy (Bộ Y Tế CA)"
        footer={
          isSignedSuccess ? (
            <button
              onClick={() => setIsDigitalSignModalOpen(false)}
              className="px-5 py-2 bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none"
            >
              Đóng Modal
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsDigitalSignModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer border-none"
              >
                Hủy
              </button>
              <button
                onClick={() => setIsSignedSuccess(true)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none shadow-sm flex items-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" />
                <span>Ký Số Đơn Thuốc & Xuất PDF</span>
              </button>
            </>
          )
        }
      >
        {isSignedSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-800">Ký Số Đơn Thuốc Điện Tử Thành Công!</h4>
            <p className="text-xs text-slate-500">
              Đơn thuốc đã được đồng bộ lên Trang cá nhân Bệnh nhân (Patient Portal) và phân hệ Nhà thuốc bệnh viện.
            </p>

            <div className="flex gap-2 justify-center pt-2">
              <button className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none">
                <Printer className="w-4 h-4" />
                <span>In Đơn Thuốc</span>
              </button>
              <button className="px-4 py-2 bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none">
                <Download className="w-4 h-4" />
                <span>Tải Hồ Sơ Y Tế (.PDF)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-800 block">Thông tin chứng thư chữ ký số (CA):</span>
              <div className="space-y-1 text-slate-600">
                <div>Bác sĩ ký: <strong className="text-slate-800">BS. CKII. Nguyễn Quang Huy</strong></div>
                <div>Mã chứng thư: <strong className="font-mono text-blue-900">CA-HEALTH-2026-8899</strong></div>
                <div>Thời gian ký: <strong className="text-slate-800">17/08/2026 08:45 AM</strong></div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
