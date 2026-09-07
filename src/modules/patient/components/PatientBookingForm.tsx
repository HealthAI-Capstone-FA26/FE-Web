import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Stethoscope,
  Building2,
  ChevronRight,
  ShieldCheck,
  FileText,
  Sparkles,
  Check
} from 'lucide-react';
import { patientService, type PatientResponse } from '../../../services/patient/patient.service';
import { doctorService, type DepartmentResponse, type DoctorResponse } from '../../../services/doctor/doctor.service';
import { appointmentService, type AppointmentSlotResponse, type AppointmentItem } from '../../../services/appointment/appointment.service';

interface PatientBookingFormProps {
  onSuccess?: (newAppointment: AppointmentItem) => void;
}

export const PatientBookingForm: React.FC<PatientBookingFormProps> = ({ onSuccess }) => {
  // Data lists
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [slots, setSlots] = useState<AppointmentSlotResponse[]>([]);

  // Selected state
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [reasonForVisit, setReasonForVisit] = useState<string>('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');

  // Loading & error states
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<AppointmentItem | null>(null);

  // Load initial patients, departments, doctors
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        setLoadingInitial(true);
        const [patientList, deptList, docList] = await Promise.all([
          patientService.getMyPatients(),
          doctorService.getDepartments(),
          doctorService.getDoctors(),
        ]);

        setPatients(patientList);
        if (patientList.length > 0) {
          setSelectedPatientId(patientList[0].patientId);
        }

        const activeDepts = deptList.filter((d) => d.isActive);
        setDepartments(activeDepts);
        if (activeDepts.length > 0) {
          setSelectedDeptId(activeDepts[0].departmentId);
        }

        const activeDocs = docList.filter((d) => d.isActive);
        setDoctors(activeDocs);
      } catch (err: any) {
        setErrorMsg('Không thể tải dữ liệu ban đầu. Vui lòng thử lại sau.');
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchInitData();
  }, []);

  // Filter doctors by selected department
  const filteredDoctors = doctors.filter((doc) => {
    if (!selectedDeptId) return true;
    return doc.doctorDepartments?.some((dd) => dd.departmentId === selectedDeptId);
  });

  // Auto-select first doctor when department changes
  useEffect(() => {
    if (filteredDoctors.length > 0) {
      if (!filteredDoctors.some((d) => d.doctorId === selectedDoctorId)) {
        setSelectedDoctorId(filteredDoctors[0].doctorId);
      }
    } else {
      setSelectedDoctorId('');
      setSlots([]);
      setSelectedSlotId('');
    }
  }, [selectedDeptId, doctors]);

  // Load slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setSlots([]);
      setSelectedSlotId('');
      return;
    }

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setErrorMsg(null);
        setSelectedSlotId('');
        const freeSlots = await appointmentService.getFreeSlots(selectedDoctorId, selectedDate);
        setSlots(freeSlots);
        if (freeSlots.length > 0) {
          setSelectedSlotId(freeSlots[0].slotId);
        }
      } catch (err: any) {
        setSlots([]);
        setSelectedSlotId('');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  // Handle submit appointment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setErrorMsg('Vui lòng chọn hồ sơ bệnh nhân khám');
      return;
    }
    if (!selectedDeptId) {
      setErrorMsg('Vui lòng chọn chuyên khoa');
      return;
    }
    if (!selectedDoctorId) {
      setErrorMsg('Vui lòng chọn bác sĩ khám');
      return;
    }
    if (!selectedSlotId) {
      setErrorMsg('Vui lòng chọn khung giờ khám còn trống');
      return;
    }

    const patientObj = patients.find((p) => p.patientId === selectedPatientId);
    let rel = patientObj?.relationship || 'self';
    if (rel === 'Bản thân') rel = 'self';
    else if (rel === 'Con cái') rel = 'child';
    else if (rel === 'Bố/Mẹ' || rel === 'Cha mẹ') rel = 'parent';
    else if (rel === 'Vợ/Chồng') rel = 'spouse';

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await appointmentService.createOnlineAppointment({
        patientId: selectedPatientId,
        relationship: rel,
        departmentId: selectedDeptId,
        doctorId: selectedDoctorId,
        slotId: selectedSlotId,
        reasonForVisit: reasonForVisit.trim() || undefined,
        priority,
      });

      setSuccessBooking(res);
      if (onSuccess) onSuccess(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đặt lịch không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessBooking(null);
    setReasonForVisit('');
    setSelectedSlotId('');
  };

  if (loadingInitial) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-xs flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Đang tải biểu mẫu đặt lịch trực tuyến...</p>
      </div>
    );
  }

  // Selected objects for receipt preview
  const currentPatient = patients.find((p) => p.patientId === selectedPatientId);
  const currentDept = departments.find((d) => d.departmentId === selectedDeptId);
  const currentDoctor = doctors.find((d) => d.doctorId === selectedDoctorId);
  const currentSlot = slots.find((s) => s.slotId === selectedSlotId);

  // Success view
  if (successBooking) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-xl space-y-6 max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Đặt Lịch Khám Thành Công!</h3>
          <p className="text-xs text-slate-500">
            Hệ thống đã ghi nhận lịch hẹn của bạn và đang chờ xác nhận từ bộ phận tiếp đón.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Mã lịch hẹn:</span>
            <span className="font-mono font-bold text-sm text-blue-700">{successBooking.appointmentCode}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Bệnh nhân:</span>
            <span className="font-bold text-slate-800">{currentPatient?.fullName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Chuyên khoa:</span>
            <span className="font-semibold text-slate-700">{currentDept?.departmentName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Bác sĩ khám:</span>
            <span className="font-semibold text-slate-700">{currentDoctor?.fullName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Thời gian hẹn:</span>
            <span className="font-bold text-emerald-700">
              {currentSlot
                ? `${new Date(currentSlot.slotStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} - ${new Date(currentSlot.slotEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}, ${new Date(selectedDate).toLocaleDateString('vi-VN')}`
                : selectedDate}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-slate-500 font-medium">Kênh đặt:</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-semibold text-[11px]">
              Trực tuyến (Online)
            </span>
          </div>
        </div>

        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-bold">Hướng dẫn tiếp đón:</p>
            <p>
              Quý khách vui lòng đến trước giờ hẹn <strong>15 phút</strong> và xuất trình mã lịch hẹn tại quầy Lễ tân hoặc Kiosk để nhận số thứ tự ưu tiên (Prefix A).
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            Đặt thêm lịch khám mới
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      {/* STEP 1: CHỌN HỒ SƠ BỆNH NHÂN */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs">
              1
            </div>
            <h3 className="text-sm font-bold text-slate-800">Chọn Hồ Sơ Bệnh Nhân Khám</h3>
          </div>
          <span className="text-[11px] text-slate-400">Đặt cho bản thân hoặc người thân</span>
        </div>

        {patients.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
            Bạn chưa có hồ sơ bệnh nhân nào. Vui lòng tạo hồ sơ bệnh nhân trước khi đặt lịch khám.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {patients.map((p) => {
              const isSelected = selectedPatientId === p.patientId;
              const isSelf = p.relationship === 'self' || p.relationship === 'Bản thân' || !p.relationship;
              return (
                <div
                  key={p.patientId}
                  onClick={() => setSelectedPatientId(p.patientId)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Mã BN: {p.patientCode}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                    <span>{p.gender === 'male' ? 'Nam' : p.gender === 'female' ? 'Nữ' : 'Khác'}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                      {isSelf ? 'Bản thân' : p.relationship || 'Người thân'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STEP 2: CHỌN CHUYÊN KHOA & BÁC SĨ */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs">
              2
            </div>
            <h3 className="text-sm font-bold text-slate-800">Chọn Chuyên Khoa & Bác Sĩ</h3>
          </div>
          <span className="text-[11px] text-slate-400">Khám đúng chuyên môn y tế</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Select Department */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Chuyên khoa khám</span>
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium text-slate-800"
            >
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentName} ({d.departmentCode})
                </option>
              ))}
            </select>
            {currentDept?.roomLocation && (
              <p className="text-[11px] text-slate-400 mt-1">Vị trí: {currentDept.roomLocation}</p>
            )}
          </div>

          {/* Select Doctor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Bác sĩ phụ trách</span>
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              disabled={filteredDoctors.length === 0}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium text-slate-800 disabled:bg-slate-100"
            >
              {filteredDoctors.length === 0 ? (
                <option value="">Chưa có bác sĩ trong khoa này</option>
              ) : (
                filteredDoctors.map((doc) => (
                  <option key={doc.doctorId} value={doc.doctorId}>
                    {doc.title ? `${doc.title}. ` : ''}{doc.fullName} {doc.specialization ? `(${doc.specialization})` : ''}
                  </option>
                ))
              )}
            </select>
            {filteredDoctors.length === 0 && (
              <p className="text-[11px] text-rose-500 mt-1">Chưa có lịch trực của bác sĩ thuộc chuyên khoa này.</p>
            )}
          </div>
        </div>
      </div>

      {/* STEP 3: CHỌN NGÀY & KHUNG GIỜ KHÁM (SLOT) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs">
              3
            </div>
            <h3 className="text-sm font-bold text-slate-800">Chọn Ngày & Khung Giờ Khám</h3>
          </div>
          <span className="text-[11px] text-slate-400">Các slot 30 phút còn trống</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Ngày khám</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium text-slate-800"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Khung giờ khả dụng (Slot còn trống)</span>
              </span>
              {loadingSlots && <span className="text-[11px] text-blue-600 font-normal">Đang kiểm tra slot...</span>}
            </label>

            {loadingSlots ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Đang tải các khung giờ khả dụng...</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                Không có ca trực hoặc slot trống nào của bác sĩ trong ngày này. Vui lòng chọn ngày khác!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {slots.map((s) => {
                  const startTime = new Date(s.slotStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                  const endTime = new Date(s.slotEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                  const isSelected = selectedSlotId === s.slotId;
                  return (
                    <button
                      key={s.slotId}
                      type="button"
                      onClick={() => setSelectedSlotId(s.slotId)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <span>{startTime} - {endTime}</span>
                      <span className={`text-[10px] font-normal ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        Còn trống {s.capacity - s.bookedCount} chỗ
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STEP 4: LÝ DO KHÁM & XÁC NHẬN */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs">
              4
            </div>
            <h3 className="text-sm font-bold text-slate-800">Thông Tin Triệu Chứng & Đặt Lịch</h3>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Mô tả triệu chứng / Lý do đến khám</span>
            </label>
            <textarea
              rows={3}
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="VD: Đau họng, sốt nhẹ 2 ngày, ho khan nhiều về đêm..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white resize-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-700">Mức độ ưu tiên:</span>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="priority"
                value="normal"
                checked={priority === 'normal'}
                onChange={() => setPriority('normal')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Bình thường</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-amber-700 font-semibold cursor-pointer">
              <input
                type="radio"
                name="priority"
                value="urgent"
                checked={priority === 'urgent'}
                onChange={() => setPriority('urgent')}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span>Cần ưu tiên / Triệu chứng cấp</span>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={submitting || !selectedSlotId || !selectedPatientId}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý đặt lịch...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Xác Nhận Đăng Ký Khám</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
