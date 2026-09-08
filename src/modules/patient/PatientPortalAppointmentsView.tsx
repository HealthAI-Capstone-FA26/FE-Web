import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Building2,
  Stethoscope,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  XCircle,
  CalendarCheck,
  Filter,
  Loader2,
  Eye
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { PatientBookingForm } from './components/PatientBookingForm';
import { CancelAppointmentModal } from './components/CancelAppointmentModal';
import { AppointmentDetailModal } from './components/AppointmentDetailModal';
import { appointmentService, type AppointmentItem } from '../../services/appointment/appointment.service';
import { patientService, type PatientResponse } from '../../services/patient/patient.service';

export const PatientPortalAppointmentsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'booking' | 'my-appointments'>('my-appointments');
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [selectedFilterPatientId, setSelectedFilterPatientId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Detail Modal
  const [selectedDetailAppointmentId, setSelectedDetailAppointmentId] = useState<string | null>(null);

  // Cancel Modal
  const [cancellingAppointment, setCancellingAppointment] = useState<AppointmentItem | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [appList, patientList] = await Promise.all([
        appointmentService.getAppointments(),
        patientService.getMyPatients(),
      ]);
      setAppointments(appList);
      setPatients(patientList);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleBookingSuccess = () => {
    fetchAppointments();
    setActiveTab('my-appointments');
  };

  // Filtered appointments by selected patient
  const filteredAppointments = appointments.filter((app) => {
    if (selectedFilterPatientId === 'all') return true;
    return app.patientId === selectedFilterPatientId;
  });

  const getStatusBadge = (status: AppointmentItem['status']) => {
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
      case 'no_show':
        return <Badge variant="critical" size="sm">Vắng mặt</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER WITH TABS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-blue-600" />
            <span>Đăng Ký & Quản Lý Lịch Hẹn Khám</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Đặt lịch khám trực tuyến theo chuyên khoa/bác sĩ và xuất trình mã QR check-in tại viện.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('my-appointments')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'my-appointments'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Lịch hẹn của tôi ({appointments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'booking'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Đăng ký khám mới</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: BOOKING FORM */}
      {activeTab === 'booking' && (
        <div className="animate-in fade-in duration-200">
          <PatientBookingForm onSuccess={handleBookingSuccess} />
        </div>
      )}

      {/* TAB CONTENT 2: MY APPOINTMENTS LIST */}
      {activeTab === 'my-appointments' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedFilterPatientId}
                onChange={(e) => setSelectedFilterPatientId(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-full sm:w-64"
              >
                <option value="all">Tất cả hồ sơ ({appointments.length} lịch hẹn)</option>
                {patients.map((p) => (
                  <option key={p.patientId} value={p.patientId}>
                    {p.fullName} ({p.relationship === 'self' || !p.relationship ? 'Bản thân' : p.relationship})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchAppointments}
              disabled={loading}
              className="text-xs font-bold text-slate-600 hover:text-blue-600 p-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 self-end sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          {loading && appointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-xs flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Đang tải danh sách lịch khám của bạn...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-xs space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full mx-auto flex items-center justify-center">
                <Calendar className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">Chưa có lịch hẹn nào</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Bạn hiện chưa có lịch hẹn khám nào được đặt. Hãy bấm nút bên dưới để chọn bác sĩ và đăng ký khám ngay!
                </p>
              </div>
              <button
                onClick={() => setActiveTab('booking')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Đăng ký lịch khám ngay</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map((app) => {
                const isCancellable = app.status === 'pending' || app.status === 'confirmed';
                const patientInfo = app.patient || patients.find((p) => p.patientId === app.patientId);

                return (
                  <div
                    key={app.appointmentId}
                    className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top status bar */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                            {app.appointmentCode}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {app.bookingChannel === 'online' ? 'Trực tuyến' : 'Tại quầy'}
                          </span>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>

                      {/* Main appointment info */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-800">
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-slate-500">Người khám:</span>
                          <strong className="text-slate-900">{patientInfo?.fullName || 'Bệnh nhân'}</strong>
                          {patientInfo?.patientCode && (
                            <span className="text-[10px] text-slate-400 font-mono">({patientInfo.patientCode})</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-slate-800">
                          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="text-slate-500">Thời gian:</span>
                          <strong className="text-emerald-700">
                            {new Date(app.appointmentDate).toLocaleDateString('vi-VN', {
                              weekday: 'short',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}{' '}
                            — {new Date(app.appointmentTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                          </strong>
                        </div>

                        {app.department && (
                          <div className="flex items-center gap-2 text-slate-800">
                            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-slate-500">Chuyên khoa:</span>
                            <span className="font-semibold text-slate-800">{app.department.departmentName}</span>
                          </div>
                        )}

                        {app.doctor && (
                          <div className="flex items-center gap-2 text-slate-800">
                            <Stethoscope className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-slate-500">Bác sĩ:</span>
                            <span className="font-semibold text-blue-900">
                              {app.doctor.title ? `${app.doctor.title}. ` : app.doctor.academicRank ? `${app.doctor.academicRank}. ` : ''}
                              {app.doctor.fullName || app.doctor.user?.fullName || 'Bác sĩ phụ trách'}
                            </span>
                          </div>
                        )}

                        {app.reasonForVisit && (
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                            <span className="font-semibold text-slate-700">Lý do khám:</span> {app.reasonForVisit}
                          </div>
                        )}

                        {app.status === 'cancelled' && app.cancelReason && (
                          <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 text-[11px] text-rose-700">
                            <span className="font-semibold">Lý do hủy:</span> {app.cancelReason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedDetailAppointmentId(app.appointmentId)}
                        className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Xem chi tiết hồ sơ</span>
                      </button>

                      {isCancellable && (
                        <button
                          onClick={() => setCancellingAppointment(app)}
                          className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Hủy lịch</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* APPOINTMENT DETAIL MODAL */}
      {selectedDetailAppointmentId && (
        <AppointmentDetailModal
          appointmentId={selectedDetailAppointmentId}
          isOpen={Boolean(selectedDetailAppointmentId)}
          onClose={() => setSelectedDetailAppointmentId(null)}
          onCancelRequest={(app) => {
            setSelectedDetailAppointmentId(null);
            setCancellingAppointment(app);
          }}
        />
      )}

      {/* CANCEL MODAL */}
      {cancellingAppointment && (
        <CancelAppointmentModal
          appointment={cancellingAppointment}
          isOpen={Boolean(cancellingAppointment)}
          onClose={() => setCancellingAppointment(null)}
          onSuccess={() => {
            fetchAppointments();
            setCancellingAppointment(null);
          }}
        />
      )}
    </div>
  );
};
