import React, { useState } from 'react';
import { 
  FlaskConical, CheckCircle2, Sparkles, Upload, 
  X, Lock, ShieldAlert, Check, FileText, Bell, Loader2 
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { BorderBeam } from '../../components/ui/border-beam';

/* 
 * DESIGN READ:
 * Component Kind: Lab Technician Dashboard panel (Mô-đun 7)
 * Audience: LabStaff performing diagnostic tests.
 * Vibe: Premium medical laboratory workspace interface, featuring payment validation constraints,
 *       file attachment simulator, AI analysis loader with visual lung overlays, and instant critical value warnings.
 */

interface LabOrder {
  id: string;
  patientName: string;
  mrn: string;
  testName: string;
  isPaid: boolean;
  status: 'Pending' | 'Completed';
  resultValue?: string;
  doctor: string;
  attachedFile?: string;
  hasRiskAlert?: boolean;
  riskMessage?: string;
}

const initialLabOrders: LabOrder[] = [
  {
    id: 'LAB-2026-001',
    patientName: 'Trần Thị Mỹ Duyên',
    mrn: 'BN-2026-001',
    testName: 'Xét nghiệm công thức máu toàn phần (CBC)',
    isPaid: true,
    status: 'Pending',
    doctor: 'BS. Daniel McAdams'
  },
  {
    id: 'LAB-2026-002',
    patientName: 'Lê Văn Hoàng',
    mrn: 'BN-2026-002',
    testName: 'Chụp X-quang ngực thẳng (Chest X-Ray)',
    isPaid: false, // Unpaid - blocked!
    status: 'Pending',
    doctor: 'BS. Daniel McAdams'
  },
  {
    id: 'LAB-2026-003',
    patientName: 'Khưu Trọng Quân',
    mrn: 'BN-2026-088',
    testName: 'Chụp X-quang phổi thẳng (Digital Chest X-Ray)',
    isPaid: true,
    status: 'Pending',
    doctor: 'BS. Emily Johnson'
  },
  {
    id: 'LAB-2026-004',
    patientName: 'Phạm Minh Đức',
    mrn: 'BN-2026-090',
    testName: 'Nội soi dạ dày tá tràng gây mê',
    isPaid: true,
    status: 'Completed',
    resultValue: 'Niêm mạc hang vị dạ dày xung huyết đỏ trợt nhẹ, bờ cong nhỏ trơn láng.',
    doctor: 'BS. Daniel McAdams',
    attachedFile: 'Gastro_Endoscopy_Report.png'
  }
];

export const LabOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<LabOrder[]>(initialLabOrders);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  
  // Modal workflow states
  const [resultVal, setResultVal] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // AI analysis states
  const [isAIScanning, setIsAIScanning] = useState(false);
  const [isAIAnalyzed, setIsAIAnalyzed] = useState(false);
  
  // Risk warning alert state
  const [riskAlert, setRiskAlert] = useState<{ isRisk: boolean; message: string }>({ isRisk: false, message: '' });
  
  // Completion notification toast banner
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Auto-fill template when technician opens modal
  const handleOpenTestModal = (order: LabOrder) => {
    setSelectedOrder(order);
    
    // Default template values
    if (order.testName.includes('CBC') || order.testName.includes('máu')) {
      setResultVal(order.resultValue || 'WBC: 12.5 K/uL (Tăng cao), RBC: 4.8 M/uL, HGB: 9.8 g/dL (Thấp), PLT: 250 K/uL');
    } else if (order.testName.includes('X-quang') || order.testName.includes('X-Ray')) {
      setResultVal(order.resultValue || 'Hình ảnh lồng ngực: Vùng mờ thâm nhiễm thùy dưới phổi trái, cung động mạch chủ không phình.');
    } else {
      setResultVal(order.resultValue || 'Kết quả kiểm tra thông số kỹ thuật bình thường.');
    }
    
    setAttachedFileName(order.attachedFile || '');
    setIsAIAnalyzed(!!order.attachedFile);
    setRiskAlert({ isRisk: false, message: '' });
    setIsInputModalOpen(true);
  };

  // Simulate file upload process
  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      const fakeName = selectedOrder?.testName.includes('X-quang') ? 'Chest_XRay_Digital.png' : 'Blood_Analysis_Report.pdf';
      setAttachedFileName(fakeName);
    }, 1500);
  };

  // Simulate AI scanning and abnormal detection
  const handleActivateAI = () => {
    setIsAIScanning(true);
    setTimeout(() => {
      setIsAIScanning(false);
      setIsAIAnalyzed(true);
      
      // Determine if there are dangerous metrics/findings and trigger risk alerts
      if (selectedOrder?.testName.includes('X-quang') || selectedOrder?.testName.includes('X-Ray')) {
        setRiskAlert({
          isRisk: true,
          message: 'CẢNH BÁO RỦI RO (MỨC ĐỘ CAO): Phát hiện tổn thương đông đặc nhu mô phổi thùy dưới trái (nghi ngờ Viêm phổi thùy cấp tính).'
        });
      } else if (selectedOrder?.testName.includes('CBC') || selectedOrder?.testName.includes('máu')) {
        setRiskAlert({
          isRisk: true,
          message: 'CẢNH BÁO CHỈ SỐ NGUY HIỂM (MỨC ĐỘ TRUNG BÌNH): Bạch cầu WBC 12.5 K/uL vượt ngưỡng (Normal: 4.0 - 11.0 K/uL) và Huyết sắc tố HGB 9.8 g/dL giảm dưới ngưỡng an toàn.'
        });
      } else {
        setRiskAlert({ isRisk: false, message: '' });
      }
    }, 1800);
  };

  // Save lab result to EMR and send automatic notification to doctor and patient
  const handleSaveResult = () => {
    if (!selectedOrder) return;
    
    setOrders((prev) =>
      prev.map((o) => 
        o.id === selectedOrder.id 
          ? { 
              ...o, 
              status: 'Completed', 
              resultValue: resultVal, 
              attachedFile: attachedFileName,
              hasRiskAlert: riskAlert.isRisk,
              riskMessage: riskAlert.message
            } 
          : o
      )
    );

    setIsInputModalOpen(false);
    
    // Trigger completion notification toast
    setNotificationToast(
      `Đã tự động gửi thông báo kết quả xét nghiệm EMR hoàn tất tới Bác sĩ phụ trách (${selectedOrder.doctor}) và Bệnh nhân (${selectedOrder.patientName})!`
    );

    // Auto-clear toast after 6 seconds
    setTimeout(() => {
      setNotificationToast(null);
    }, 6000);
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
      header: 'Xét Nghiệm Chỉ Định',
      accessorKey: 'testName',
      cell: (row) => <span className="font-bold text-slate-700 whitespace-nowrap">{row.testName}</span>
    },
    {
      header: 'Bác Sĩ Chỉ Định',
      accessorKey: 'doctor',
      cell: (row) => <span className="font-semibold text-slate-500 whitespace-nowrap">{row.doctor}</span>
    },
    {
      header: 'Ràng buộc Thanh toán',
      cell: (row) => (
        <Badge variant={row.isPaid ? 'normal' : 'critical'} size="sm">
          {row.isPaid ? 'Đã hoàn tất thanh toán (Sẵn sàng)' : 'Chưa thanh toán (Chặn lab)'}
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
      cell: (row) => {
        const isCompleted = row.status === 'Completed';
        return (
          <button
            onClick={() => handleOpenTestModal(row)}
            disabled={!row.isPaid}
            className={`px-3 py-1.5 font-bold text-xs rounded-xl cursor-pointer border-none shadow-xs whitespace-nowrap flex items-center gap-1.5 ${
              !row.isPaid 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                : isCompleted 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-blue-700 hover:bg-blue-800 text-white'
            }`}
          >
            {!row.isPaid ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Bị khóa (Chờ thanh toán)</span>
              </>
            ) : isCompleted ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Xem & Cập nhật lại EMR</span>
              </>
            ) : (
              <>
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Thực hiện & Nhập kết quả</span>
              </>
            )}
          </button>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 animate-in fade-in duration-200">
      
      {/* Module Title Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Xét Nghiệm Phòng Lab & Kết Quả EMR
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tiếp nhận chỉ định, tự động xác thực thanh toán, đính kèm file chụp, quét AI & cảnh báo chỉ số nguy hiểm.
          </p>
        </div>
        <Badge variant="ai" size="sm">
          AI Scan & RiskAlert
        </Badge>
      </div>

      {/* Completion Notification Banner */}
      {notificationToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-start gap-2.5 text-xs font-bold shadow-md animate-in slide-in-from-top-3 duration-200">
          <Bell className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-grow">
            <span className="uppercase text-[10px] tracking-wider text-emerald-700 block mb-0.5">Thông báo hệ thống (Hoàn tất Xét nghiệm)</span>
            <span>{notificationToast}</span>
          </div>
          <button 
            onClick={() => setNotificationToast(null)}
            className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Orders Table */}
      <DataTable 
        columns={columns} 
        data={orders} 
        searchPlaceholder="Tìm kiếm theo tên bệnh nhân, mã chỉ định hoặc bác sĩ..." 
      />

      {/* MODAL: INPUT RESULT, ATTACH FILE, RUN AI SCAN & WARNINGS */}
      {selectedOrder && (
        <Modal
          isOpen={isInputModalOpen}
          onClose={() => setIsInputModalOpen(false)}
          title={`Nhập kết quả & Xử lý AI: ${selectedOrder.testName}`}
          subtitle={`Bệnh nhân: ${selectedOrder.patientName} (MRN: ${selectedOrder.mrn}) • Chỉ định bởi: ${selectedOrder.doctor}`}
          maxWidth="4xl"
          footer={
            <>
              <button
                onClick={() => setIsInputModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs md:text-sm hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveResult}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs md:text-sm shadow-sm flex items-center gap-1.5 cursor-pointer border-none"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu & Hoàn tất EMR (Gửi thông báo)</span>
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs text-slate-800">
            
            {/* Left Panel: Result details and File upload (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Vitals / administrative info reminder */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center text-[11px] font-bold">
                <div>
                  <span className="text-slate-400 block font-semibold leading-none uppercase text-[9px] mb-1">Ràng buộc thanh toán</span>
                  <Badge variant="normal" size="sm">Đã hoàn tất thanh toán</Badge>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-semibold leading-none uppercase text-[9px] mb-1">Phòng chuyên môn phụ trách</span>
                  <span className="text-[#0b3c8f]">Trung tâm Xét nghiệm lâm sàng</span>
                </div>
              </div>

              {/* Textarea for metrics */}
              <div className="space-y-1.5">
                <label className="block font-extrabold text-slate-700">Các chỉ số đo đạc & Kết quả kỹ thuật (*):</label>
                <textarea
                  rows={4}
                  value={resultVal}
                  onChange={(e) => setResultVal(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 font-mono outline-none focus:border-blue-600"
                />
              </div>

              {/* Simulated file attachment upload area */}
              <div className="space-y-2">
                <label className="block font-extrabold text-slate-700">Đính kèm tài liệu hình ảnh xét nghiệm (X-quang, MRI, Huyết đồ...):</label>
                
                {attachedFileName ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between font-bold text-[11px] text-blue-900">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>{attachedFileName}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setAttachedFileName('');
                        setIsAIAnalyzed(false);
                        setRiskAlert({ isRisk: false, message: '' });
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={handleSimulateUpload}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="font-bold text-slate-600">Đang tải file lên hệ thống (Simulated)...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400" />
                        <span className="font-bold text-slate-600">Nhấp vào đây để mô phỏng tải tệp tin xét nghiệm lên</span>
                        <span className="text-[10px] text-slate-400 font-medium">Hỗ trợ các định dạng: PNG, JPG, PDF, DICOM tối đa 50MB</span>
                      </>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Right Panel: AI Scanner and Risk Warnings (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* AI Auto Analysis trigger button */}
              <button
                type="button"
                onClick={handleActivateAI}
                disabled={!attachedFileName || isAIScanning}
                className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border-none cursor-pointer ${
                  !attachedFileName 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-gradient-to-r from-purple-900 to-indigo-950 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {isAIScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
                    <span>AI đang phân tích hình ảnh & số liệu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Kích hoạt AI02 quét tự động hình ảnh</span>
                  </>
                )}
              </button>

              {/* Simulated AI result graphic container */}
              {isAIAnalyzed ? (
                <BorderBeam size="md" colorVariant="colorful">
                  <div className="bg-slate-950 text-white border border-slate-900 rounded-2xl p-4 min-h-[160px] flex flex-col items-center justify-center relative overflow-hidden text-center">
                    <span className="text-[9px] font-extrabold text-slate-500 absolute top-2 left-2 uppercase font-mono">AI Visualizer</span>
                    
                    {isAIScanning && (
                      <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-10 flex-col gap-2">
                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                        <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">AI Scanning Pixel Data...</span>
                      </div>
                    )}

                    {selectedOrder.testName.includes('X-quang') || selectedOrder.testName.includes('X-Ray') ? (
                      <div className="space-y-3 w-full flex flex-col items-center">
                        <div className="relative w-28 h-28 border border-slate-800 rounded-lg flex items-center justify-center bg-slate-900">
                          {/* Lungs SVG schematic */}
                          <svg className="w-20 h-20 text-slate-500 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="8" cy="12" r="3" strokeWidth={1} />
                            <circle cx="16" cy="12" r="3" strokeWidth={1} />
                          </svg>
                          
                          {/* Glowing red AI overlay ring */}
                          <div className="absolute bottom-4 left-6 w-8 h-8 border-2 border-dashed border-rose-500 bg-rose-500/10 rounded-full animate-ping pointer-events-none" />
                          <div className="absolute bottom-4 left-6 w-8 h-8 border-2 border-rose-600 bg-rose-500/20 rounded-full flex items-center justify-center">
                            <span className="text-[6px] text-white font-extrabold">93.8%</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] bg-rose-950 border border-rose-900 text-rose-300 font-bold px-2 py-0.5 rounded-full">
                            AI: Phát hiện vùng đông đặc bất thường
                          </span>
                          <p className="text-[9px] text-slate-400 font-medium">Khoanh vùng thùy dưới phổi trái (Trùng khớp 93.8% mẫu bệnh phổi)</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 w-full text-left font-mono text-[10px]">
                        <span className="text-[9px] bg-amber-950 border border-amber-900 text-amber-300 font-bold px-2 py-0.5 rounded-full block w-fit mb-2">
                          AI: Phân tích chỉ số Huyết đồ
                        </span>
                        <p className="text-rose-400 font-bold">• WBC: 12.5 K/uL - Vượt ngưỡng (+14%)</p>
                        <p className="text-amber-400 font-bold">• HGB: 9.8 g/dL - Dưới ngưỡng (-18%)</p>
                        <p className="text-slate-400">• RBC: 4.8 M/uL - Bình thường</p>
                        <p className="text-slate-400">• PLT: 250 K/uL - Bình thường</p>
                      </div>
                    )}
                  </div>
                </BorderBeam>
              ) : (
                <div className="bg-slate-950 text-white border border-slate-900 rounded-2xl p-4 min-h-[160px] flex flex-col items-center justify-center relative overflow-hidden text-center">
                  <span className="text-[9px] font-extrabold text-slate-500 absolute top-2 left-2 uppercase font-mono">AI Visualizer</span>
                  
                  {isAIScanning && (
                    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-10 flex-col gap-2">
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                      <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">AI Scanning Pixel Data...</span>
                    </div>
                  )}

                  <div className="text-slate-400 space-y-1">
                    <FlaskConical className="w-8 h-8 mx-auto stroke-1" />
                    <p className="font-bold text-[11px]">Chưa thực hiện quét AI</p>
                    <p className="text-[9px] text-slate-500 max-w-xs font-medium">Đính kèm file hình ảnh kết quả trước, sau đó kích hoạt mô-đun AI để tự động khoanh vùng tổn thương.</p>
                  </div>
                </div>
              )}

              {/* Critical Vitals Risk Warning alert */}
              {riskAlert.isRisk && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl space-y-1.5 animate-in zoom-in-95 duration-150">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-red-700 uppercase tracking-wide">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-500 animate-pulse" />
                    <span>Cảnh báo chỉ số nguy hiểm (Risk Alert)</span>
                  </span>
                  <p className="text-[10px] leading-relaxed font-semibold text-slate-700">
                    {riskAlert.message}
                  </p>
                </div>
              )}

            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};
