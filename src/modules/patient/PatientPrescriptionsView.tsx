import React, { useState, useEffect } from 'react';
import {
  Pill, Calendar, FileText, Download, Printer, Clock,
  Stethoscope, CheckCircle2, AlertCircle, RefreshCw,
  Award, ShieldCheck, ChevronRight, User
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Mascot } from 'page-mascot';
import { prescriptionService, type PrescriptionDetail } from '../../services/prescription/prescription.service';
import { appointmentService, type AppointmentItem } from '../../services/appointment/appointment.service';
import { patientService } from '../../services/patient/patient.service';
import { RescheduleAppointmentModal } from './components/RescheduleAppointmentModal';

export const PatientPrescriptionsView: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionDetail[]>([]);
  const [followupAppointments, setFollowupAppointments] = useState<AppointmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reschedule state
  const [reschedulingAppointment, setReschedulingAppointment] = useState<AppointmentItem | null>(null);

  // Active view tab: 'all' | 'prescriptions' | 'followup'
  const [subTab, setSubTab] = useState<'prescriptions' | 'followup'>('prescriptions');

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const myPatients = await patientService.getMyPatients();
      const patientId = myPatients[0]?.patientId;

      const [prescriptionsRes, appointmentsRes] = await Promise.allSettled([
        prescriptionService.findMany(patientId ? { patientId } : undefined),
        appointmentService.getAppointments(patientId ? { patientId } : undefined, true),
      ]);

      if (prescriptionsRes.status === 'fulfilled' && Array.isArray(prescriptionsRes.value)) {
        // Filter signed or active prescriptions
        setPrescriptions(prescriptionsRes.value);
      } else {
        setPrescriptions([]);
      }

      if (appointmentsRes.status === 'fulfilled' && Array.isArray(appointmentsRes.value)) {
        const followups = appointmentsRes.value.filter(
          (a) => a.appointmentType === 'follow_up' || a.bookingChannel === 'doctor_follow_up'
        );
        setFollowupAppointments(followups);
      } else {
        setFollowupAppointments([]);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tải dữ liệu đơn thuốc và lịch hẹn');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadPdf = async (prescriptionId: string) => {
    try {
      const res = await prescriptionService.exportPdf(prescriptionId);
      if (res?.pdfUrl) {
        window.open(res.pdfUrl, '_blank');
      } else {
        alert('Không tìm thấy tệp PDF đơn thuốc.');
      }
    } catch (err: any) {
      alert(`Lỗi khi tải PDF đơn thuốc: ${err?.message || 'Thao tác thất bại'}`);
    }
  };

  const handlePrintPrescription = async (prescriptionId: string) => {
    try {
      const res = await prescriptionService.exportPdf(prescriptionId);
      if (res?.pdfUrl) {
        const printWindow = window.open(res.pdfUrl, '_blank');
        if (printWindow) {
          printWindow.focus();
        }
      } else {
        alert('Không tìm thấy tệp PDF để in.');
      }
    } catch (err: any) {
      alert(`Lỗi khi in đơn thuốc: ${err?.message || 'Thao tác thất bại'}`);
    }
  };

  const getAppointmentStatusBadge = (status: AppointmentItem['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" size="sm">Chờ xác nhận</Badge>;
      case 'confirmed':
        return <Badge variant="info" size="sm">Đã xác nhận</Badge>;
      case 'checked_in':
        return <Badge variant="success" size="sm">Đã check-in</Badge>;
      case 'in_progress':
        return <Badge variant="info" size="sm">Đang khám</Badge>;
      case 'completed':
        return <Badge variant="success" size="sm">Đã hoàn thành</Badge>;
      case 'cancelled':
        return <Badge variant="neutral" size="sm">Đã hủy</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER BANNER */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Mascot
            directions="/mascots/mydoctor-directions.png"
            reactions="/mascots/mydoctor-reactions.png"
            size={100}
            className="shrink-0"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Đơn Thuốc Điện Tử & Lịch Hẹn Tái Khám
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi đơn thuốc đã được bác sĩ ký số pháp lý, phác đồ dùng thuốc và quản lý lịch hẹn tái khám.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={isLoading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-2xl shadow-2xs gap-4">
        <button
          type="button"
          onClick={() => setSubTab('prescriptions')}
          className={`py-3.5 px-3 text-xs font-black cursor-pointer border-none bg-transparent transition-all flex items-center gap-2 border-b-2 ${
            subTab === 'prescriptions'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Đơn Thuốc Điện Tử ({prescriptions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('followup')}
          className={`py-3.5 px-3 text-xs font-black cursor-pointer border-none bg-transparent transition-all flex items-center gap-2 border-b-2 ${
            subTab === 'followup'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Lịch Hẹn Tái Khám ({followupAppointments.length})</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CONTENT: PRESCRIPTIONS TAB */}
      {subTab === 'prescriptions' && (
        <div className="space-y-5">
          {isLoading ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/90 text-center text-xs text-slate-400">
              Đang tải danh sách đơn thuốc...
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Pill className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-700">Chưa có đơn thuốc nào</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Khi bác sĩ hoàn tất lượt khám và ký số đơn thuốc điện tử, đơn thuốc sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            prescriptions.map((p) => {
              const isSigned = p.status === 'signed';
              return (
                <div
                  key={p.prescriptionId}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-5 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-blue-900 bg-blue-100/80 px-2.5 py-0.5 rounded-lg">
                          {p.prescriptionCode}
                        </span>
                        {isSigned ? (
                          <Badge variant="success" size="sm">
                            Đã ký số CA
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            Đơn nháp
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Ngày tạo: {new Date(p.createdAt).toLocaleDateString('vi-VN')} {p.signedAt ? `• Ký lúc: ${new Date(p.signedAt).toLocaleDateString('vi-VN')} ${new Date(p.signedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePrintPrescription(p.prescriptionId)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>In đơn</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(p.prescriptionId)}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Tải PDF EMR</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 font-semibold">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Bác sĩ kê đơn:</span>
                        <span className="font-extrabold text-slate-800 text-xs">
                          {p.doctor ? `${p.doctor.title ? `${p.doctor.title}. ` : ''}${p.doctor.fullName}` : 'Bác sĩ phụ trách'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Chẩn đoán xác định (ICD-10):</span>
                        <span className="font-extrabold text-blue-900 text-xs">
                          {p.diagnosis?.icd10Code ? `[${p.diagnosis.icd10Code}] ` : ''}{p.diagnosis?.diagnosisName || 'Chẩn đoán lâm sàng'}
                        </span>
                      </div>
                    </div>

                    {/* Drugs table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                            <th className="py-2 px-3">Tên thuốc & Hàm lượng</th>
                            <th className="py-2 px-3">Đường dùng</th>
                            <th className="py-2 px-3">Liều dùng</th>
                            <th className="py-2 px-3 text-center">Số lượng</th>
                            <th className="py-2 px-3">Thời gian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {p.items && p.items.length > 0 ? (
                            p.items.map((item) => (
                              <tr key={item.prescriptionItemId} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3">
                                  <span className="font-extrabold text-slate-900 block">{item.drug.drugName}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold">{item.drug.genericName} • {item.drug.strength}</span>
                                </td>
                                <td className="py-2.5 px-3 font-semibold">{item.routeDisplay || item.drug.route}</td>
                                <td className="py-2.5 px-3">
                                  <span className="font-bold text-slate-800 block">{item.dosage}</span>
                                  {item.instruction && (
                                    <span className="text-[10px] text-blue-700 block italic leading-tight mt-0.5">
                                      Dặn dò: {item.instruction}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center font-black text-blue-900">
                                  {Number(item.quantity)} {item.drug.unit}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-600">
                                  {item.durationDays ? `${item.durationDays} ngày` : '--'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-slate-400">
                                Không có chi tiết dòng thuốc
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* CA Digital Stamp Footer */}
                    {isSigned && p.certificateSerial && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-[11px] text-emerald-900 font-semibold">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Chứng thực ký số hợp lệ: <strong className="font-mono text-emerald-950">{p.certificateSerial}</strong></span>
                        </div>
                        <span className="bg-emerald-200/60 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded">
                          Digital Verified
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CONTENT: FOLLOW-UP APPOINTMENTS TAB */}
      {subTab === 'followup' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/90 text-center text-xs text-slate-400">
              Đang tải danh sách lịch tái khám...
            </div>
          ) : followupAppointments.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-700">Chưa có lịch hẹn tái khám nào</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Khi bác sĩ hẹn tái khám trong đơn thuốc, lịch trình sẽ tự động hiển thị và gửi thông báo nhắc lịch cho bạn.
              </p>
            </div>
          ) : (
            followupAppointments.map((app) => {
              const isReschedulable = app.status === 'pending' || app.status === 'confirmed';
              return (
                <div
                  key={app.appointmentId}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 transition-all hover:border-blue-300"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-blue-900 text-xs bg-blue-50 px-2.5 py-1 rounded-lg">
                        {app.appointmentCode}
                      </span>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Tái khám điều trị
                      </span>
                      {getAppointmentStatusBadge(app.status)}
                    </div>

                    <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ngày khám: {new Date(app.appointmentDate).toLocaleDateString('vi-VN')} {app.appointmentTime ? `(${app.appointmentTime.slice(0, 5)})` : ''}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Bác sĩ phụ trách: <strong className="text-slate-900">{app.doctor?.fullName || 'Bác sĩ điều trị'}</strong></span>
                    </div>
                    {app.department && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Khoa:</span>
                        <strong className="text-slate-900">{app.department.departmentName}</strong>
                      </div>
                    )}
                  </div>

                  {app.reasonForVisit && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 font-medium">
                      <span className="font-bold text-slate-700">Yêu cầu / Lời dặn tái khám:</span> {app.reasonForVisit}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 flex justify-end gap-2">
                    {isReschedulable && (
                      <button
                        type="button"
                        onClick={() => setReschedulingAppointment(app)}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Đổi ngày tái khám</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {reschedulingAppointment && (
        <RescheduleAppointmentModal
          appointment={reschedulingAppointment}
          isOpen={Boolean(reschedulingAppointment)}
          onClose={() => setReschedulingAppointment(null)}
          onSuccess={() => {
            fetchData();
            setReschedulingAppointment(null);
            alert('Đổi ngày hẹn tái khám thành công!');
          }}
        />
      )}
    </div>
  );
};
