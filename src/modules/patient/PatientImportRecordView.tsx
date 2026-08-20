// FR-HM-2.6 — Import hồ sơ bệnh án từ nguồn khác (FHIR)
// Actor: Bệnh nhân
// Trạng thái: Mock UI (chưa nối API parser FHIR thật)

import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, FileCode, Eye, RefreshCw } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

interface FHIRResource {
  resourceType: string;
  id: string;
  status: string;
  details: string;
  date: string;
}

const MOCK_FHIR_PREVIEW: FHIRResource[] = [
  {
    resourceType: 'Patient',
    id: 'fhir-pat-001',
    status: 'Active',
    details: 'Khưu Trọng Quân • Nam • 1995-08-15',
    date: '2026-08-01'
  },
  {
    resourceType: 'Condition',
    id: 'cond-icd-i10',
    status: 'Confirmed',
    details: 'Mã ICD-10: I10 - Tăng huyết áp vô căn (nguyên phát)',
    date: '2025-11-10'
  },
  {
    resourceType: 'Observation',
    id: 'obs-bp-092',
    status: 'Final',
    details: 'Huyết áp tâm thu/tâm trương: 135/85 mmHg (Đo tại BV Chợ Rẫy)',
    date: '2026-01-15'
  },
  {
    resourceType: 'MedicationRequest',
    id: 'med-req-004',
    status: 'Completed',
    details: 'Amlodipine 5mg Oral Tablet • 30 viên',
    date: '2026-03-20'
  },
  {
    resourceType: 'DiagnosticReport',
    id: 'diag-xray-012',
    status: 'Final',
    details: 'X-quang ngực thẳng • Kết quả: Bóng tim không to, phổi trong',
    date: '2026-05-12'
  }
];

export const PatientImportRecordView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImported, setIsImported] = useState(false);
  const [fhirData, setFhirData] = useState<FHIRResource[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsParsing(true);
      setTimeout(() => {
        setIsParsing(false);
        setFhirData(MOCK_FHIR_PREVIEW);
      }, 1000);
    }
  };

  const handleConfirmImport = () => {
    setIsImported(true);
    setTimeout(() => setIsImported(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Import Hồ Sơ Bệnh Án Chuẩn HL7 FHIR R4
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tải lên tệp dữ liệu y tế (JSON/XML/FHIR Bundle) từ các bệnh viện hoặc ứng dụng khác để đồng bộ vào EMR 4AM.
          </p>
        </div>
        <Badge variant="ai" size="sm">
          FR-HM-2.6
        </Badge>
      </div>

      {isImported && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Đã liên thông & tích hợp thành công 05 tài nguyên FHIR vào Hồ sơ Bệnh án EMR của bạn!</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <UploadCloud className="w-5 h-5 text-blue-700" />
          <h3 className="font-bold text-base text-slate-900">Tải Lên Tệp Dữ Liệu Y Tế FHIR</h3>
        </div>

        <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <input
            type="file"
            accept=".json,.xml,.fhir"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
            <FileCode className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-800">
            {selectedFile ? `Tệp đã chọn: ${selectedFile.name}` : 'Nhấp vào đây hoặc kéo thả tệp (.json, .xml) chứa dữ liệu FHIR Bundle'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Hỗ trợ các chuẩn HL7 FHIR R4 Bundle, Smart-on-FHIR Export</p>
        </label>

        {/* Parsing state */}
        {isParsing && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-900 font-bold text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-700" />
            <span>Đang phân tích cấu trúc FHIR Bundle & trích xuất các tài nguyên (Resources)...</span>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {fhirData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-700" />
              <h3 className="font-bold text-base text-slate-900">Xem Trước Dữ Liệu Trích Xuất (FHIR Resources)</h3>
            </div>
            <span className="text-xs font-bold text-slate-500">Tìm thấy: <span className="font-black text-blue-900">{fhirData.length} Tài nguyên</span></span>
          </div>

          <div className="divide-y divide-slate-100">
            {fhirData.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold text-[10px] rounded">
                      {item.resourceType}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{item.details}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">ID: {item.id} • Ngày tạo: {item.date}</span>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md shrink-0">
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={handleConfirmImport}
              className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer shadow-md border-none"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận Nhập Hồ Sơ Về Bệnh Viện 4AM</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
