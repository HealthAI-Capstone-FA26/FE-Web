import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Users, CheckCircle2, UserPlus, Search, Download, Eye, 
  MoreVertical, X, ShieldAlert, Heart, FileText,
  Calendar, Stethoscope, Clock, Loader2, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { patientService } from '../../services/patient/patient.service';
import { EditPatientModal } from './EditPatientModal';

/* 
 * DESIGN READ:
 * Component Kind: Patient Profile Management dashboard panel (Mô-đun 12)
 * Audience: ReceptionStaff / Admin managing hospital patient records.
 * Vibe: Premium medical SaaS dashboard layout, matching the screenshot exactly with search overlay,
 *       tabs (Patients, Medical Conditions, Care Programs), custom table columns, and duplicate check.
 *       Includes a timeline history view modal showing visit summaries and clinical reports.
 */

interface Visit {
  date: string;
  reason: string;
  diagnosis: string;
  doctor: string;
  specialty: string;
  prescription: string;
  notes?: string;
}

interface Patient {
  patientId: string;
  mrn: string;
  name: string;
  age: number;
  gender: 'Nam' | 'Nữ' | string;
  email: string;
  phone: string;
  cccd: string;
  bhyt: string;
  dob: string;
  recentAction: string;
  doctor: string;
  specialty: string;
  ssn: string; // SSN/CCCD for mockup matches
  visitHistory: Visit[];
}

const initialPatientsData: Patient[] = [];

export const ReceptionPatientsView: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeSearchTab, setActiveSearchTab] = useState<'patients' | 'conditions' | 'programs'>('patients');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formGender, setFormGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [formPhone, setFormPhone] = useState('');
  const [formCccd, setFormCccd] = useState('');
  const [formBhyt, setFormBhyt] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAction, setFormAction] = useState('Khám sức khỏe');
  const [formDoctor, setFormDoctor] = useState('BS. Daniel McAdams');
  
  // Validation errors
  const [validationError, setValidationError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch real patient list from Backend API (GET /patients)
  useEffect(() => {
    let isMounted = true;
    const loadPatients = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const data = await patientService.getAllPatients(searchTerm || undefined);
        if (isMounted) {
          if (Array.isArray(data)) {
            const mapped: Patient[] = data.map((p: any) => {
              const birthYear = p.dateOfBirth ? new Date(p.dateOfBirth).getFullYear() : 1995;
              const computedAge = isNaN(birthYear) ? 30 : new Date().getFullYear() - birthYear;
              return {
                patientId: p.patientId || p.patientCode,
                mrn: p.patientCode || p.patientId || '',
                name: p.fullName || 'Chưa đặt tên',
                age: computedAge,
                gender: p.gender === 'male' || p.gender === 'Nam' ? 'Nam' : 'Nữ',
                email: p.email || 'Chưa cập nhật',
                phone: p.phoneNumber || 'Chưa cập nhật',
                cccd: p.identityNumber || 'Chưa cập nhật',
                ssn: p.identityNumber || 'Chưa cập nhật',
                bhyt: p.insuranceNumber || 'Chưa cập nhật',
                dob: p.dateOfBirth ? String(p.dateOfBirth).split('T')[0] : '1995-01-01',
                recentAction: 'Hồ sơ tiếp nhận',
                doctor: 'Chưa chỉ định',
                specialty: 'Khoa Tiếp Nhận',
                visitHistory: []
              };
            });
            setPatients(mapped);
          } else {
            setPatients([]);
          }
        }
      } catch (err: any) {
        console.log('Lỗi tải danh sách bệnh nhân từ Backend:', err);
        if (isMounted) {
          setPatients([]);
          setFetchError(err?.message || 'Không thể kết nối đến máy chủ Backend.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadPatients();
    return () => {
      isMounted = false;
    };
  }, [searchTerm, reloadTrigger]);

  // Filter patients based on search input
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const term = searchTerm.toLowerCase().trim();
    return patients.filter(p => 
      (p.name || '').toLowerCase().includes(term) ||
      (p.mrn || '').toLowerCase().includes(term) ||
      (p.cccd || '').toLowerCase().includes(term) ||
      (p.phone || '').toLowerCase().includes(term)
    );
  }, [patients, searchTerm]);

  // Dropdown list matching search (from backend patients)
  const mockupDropdownMatches = useMemo(() => {
    return filteredPatients.map(p => ({
      name: p.name,
      mrn: p.mrn,
      ssn: p.cccd,
      patient: p,
    }));
  }, [filteredPatients]);

  // Handle adding new patient with strict duplicate checks
  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMsg('');

    // 1. Mandatory Fields Check
    if (!formName.trim()) {
      setValidationError('Họ và tên là bắt buộc.');
      return;
    }
    if (!formDob) {
      setValidationError('Ngày sinh là bắt buộc.');
      return;
    }
    if (!formPhone.trim()) {
      setValidationError('Số điện thoại là bắt buộc.');
      return;
    }
    if (!formCccd.trim()) {
      setValidationError('Số CCCD/SSN là bắt buộc.');
      return;
    }

    // 2. Duplicate Check by CCCD
    const duplicateCccd = patients.find(p => p.cccd === formCccd.trim());
    if (duplicateCccd) {
      setValidationError(`Trùng lặp hồ sơ! Số CCCD này đã được đăng ký cho bệnh nhân ${duplicateCccd.name} (MRN: ${duplicateCccd.mrn}).`);
      return;
    }

    // 3. Duplicate Check by BHYT (if entered)
    if (formBhyt.trim()) {
      const duplicateBhyt = patients.find(p => p.bhyt === formBhyt.trim());
      if (duplicateBhyt) {
        setValidationError(`Trùng lặp hồ sơ! Mã BHYT này đã được đăng ký cho bệnh nhân ${duplicateBhyt.name} (MRN: ${duplicateBhyt.mrn}).`);
        return;
      }
    }

    // Calculate age roughly
    const birthYear = new Date(formDob).getFullYear();
    const currentYear = new Date().getFullYear();
    const calculatedAge = currentYear - birthYear;

    // Create new patient MRN
    const newMrn = Math.floor(1000000 + Math.random() * 9000000).toString();

    // Initialize first visit from form entry
    const initialVisit: Visit = {
      date: new Date().toISOString().split('T')[0],
      reason: formAction,
      diagnosis: `Tiếp nhận yêu cầu khám: ${formAction}`,
      doctor: formDoctor,
      specialty: formDoctor === 'BS. Emily Johnson' ? 'Khoa Tim mạch' : 'Khoa Tiêu hóa',
      prescription: "Chưa có kê đơn (chờ khám sàng lọc)",
      notes: "Bệnh nhân đăng ký khám tại quầy trực tiếp."
    };

    const newPatient: Patient = {
      mrn: newMrn,
      name: formName,
      age: calculatedAge,
      gender: formGender,
      email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      phone: formPhone,
      cccd: formCccd,
      ssn: formCccd,
      bhyt: formBhyt || 'Không có',
      dob: formDob,
      recentAction: formAction,
      doctor: formDoctor,
      specialty: formDoctor === 'BS. Emily Johnson' ? 'Khoa Tim mạch' : 'Khoa Tiêu hóa',
      visitHistory: [initialVisit]
    };

    setPatients([newPatient, ...patients]);
    setSuccessMsg(`Tiếp nhận thành công! Tạo hồ sơ mới cho bệnh nhân ${formName} (MRN: ${newMrn})`);
    
    // Clear form
    setTimeout(() => {
      setIsAddModalOpen(false);
      setFormName('');
      setFormDob('');
      setFormGender('Nam');
      setFormPhone('');
      setFormCccd('');
      setFormBhyt('');
      setFormEmail('');
      setValidationError('');
      setSuccessMsg('');
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 animate-in fade-in duration-200">
      
      {/* 1. Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Quản Lý Hồ Sơ Bệnh Nhân
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tìm kiếm, tra cứu hồ sơ bệnh án và quản lý thông tin hành chính.
          </p>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 px-4 py-2.5 rounded-xl shadow hover:shadow-md transition-all cursor-pointer border-none"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Bệnh Nhân Mới</span>
        </button>
      </div>

      {/* 2. Search and Filter Box */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 relative">
        
        {/* Left: Input Search Box */}
        <div ref={searchRef} className="relative w-full max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm tên bệnh nhân, mã MRN..."
              value={searchTerm}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchFocused(true);
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-xs md:text-sm font-semibold outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all shadow-xs"
            />
          </div>

          {/* Search Dropdown Overlay */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-45 p-4 max-h-[360px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Dropdown Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveSearchTab('patients')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer ${
                    activeSearchTab === 'patients' ? 'bg-[#0b3c8f] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Bệnh nhân</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSearchTab('conditions')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer ${
                    activeSearchTab === 'conditions' ? 'bg-[#0b3c8f] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Bệnh lý</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSearchTab('programs')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer ${
                    activeSearchTab === 'programs' ? 'bg-[#0b3c8f] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Chương trình chăm sóc</span>
                </button>
              </div>

              {/* Matches List */}
              {activeSearchTab === 'patients' ? (
                <div className="space-y-2">
                  {mockupDropdownMatches.length > 0 ? (
                    mockupDropdownMatches.map((item) => (
                      <button
                        key={item.mrn}
                        type="button"
                        onClick={() => {
                          setSearchTerm(item.name);
                          setIsSearchFocused(false);
                          if (item.patient) setSelectedPatient(item.patient);
                        }}
                        className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-all text-left border-none bg-transparent cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            Mã MRN: {item.mrn} • CCCD/SSN: {item.ssn}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-[11px] font-medium">
                      Không tìm thấy bệnh nhân phù hợp.
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-[11px] font-medium">
                  Tính năng tìm kiếm đang được kết nối AI...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Download list button */}
        <button className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-xs cursor-pointer ml-auto">
          <Download className="w-4 h-4" />
          <span>Tải danh sách</span>
        </button>
      </div>

      {/* 3. Grid Table of Patients */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs flex flex-col min-w-0">
        <div className="overflow-x-auto min-w-0">
          <table className="w-full border-collapse text-left text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] h-12">
                <th className="px-6 py-4 w-12 text-center">
                  <input type="checkbox" className="rounded border-slate-300 focus:ring-blue-500" />
                </th>
                <th className="px-6 py-4">Bệnh nhân</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4">Số CCCD / BHYT</th>
                <th className="px-6 py-4">Hoạt động khám gần nhất</th>
                <th className="px-6 py-4">Bác sĩ phụ trách</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                      <span className="text-slate-600 font-bold text-xs">Đang tải danh sách hồ sơ bệnh nhân từ hệ thống...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr key={patient.mrn} className="hover:bg-slate-50/50 transition-all">
                    {/* Checkbox */}
                    <td className="px-6 py-4 text-center">
                      <input type="checkbox" className="rounded border-slate-300 focus:ring-blue-500" />
                    </td>
                    {/* Name, Age, Gender */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs uppercase overflow-hidden shrink-0">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-800 text-xs md:text-sm">{patient.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                            {patient.age} Tuổi, {patient.gender}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Contact info */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{patient.email}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{patient.phone}</div>
                      </div>
                    </td>
                    {/* CCCD / BHYT */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-xs text-slate-800 font-semibold">CCCD: <span className="font-mono">{patient.cccd}</span></div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">BHYT: <span className="font-mono">{patient.bhyt}</span></div>
                      </div>
                    </td>
                    {/* Action Pill Tag */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                        patient.recentAction.includes('gãy') || patient.recentAction.includes('Fracture')
                          ? 'bg-red-50 text-red-700 border border-red-100'
                          : patient.recentAction.includes('thai') || patient.recentAction.includes('Prenatal')
                          ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : patient.recentAction.includes('tâm lý') || patient.recentAction.includes('CBT')
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {patient.recentAction}
                      </span>
                    </td>
                    {/* Assigned Doctor */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-800">{patient.doctor}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{patient.specialty}</div>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Eye icon to view detail and medical history */}
                        <button 
                          onClick={() => setSelectedPatient(patient)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent"
                          title="Xem lịch sử bệnh án"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Edit icon to update patient profile */}
                        <button 
                          onClick={() => setEditingPatient(patient)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent"
                          title="Chỉnh sửa / Cập nhật hồ sơ"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    {fetchError ? (
                      <div className="space-y-1">
                        <p className="text-rose-500 text-xs font-mono">Lỗi kết nối API: {fetchError}</p>
                        <h4 className="font-bold text-rose-700 uppercase text-xs mt-1">Không thể tải dữ liệu bệnh nhân (Vui lòng kiểm tra lại đăng nhập)</h4>
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-400 text-xs font-mono">0 kết quả</p>
                        <h4 className="font-bold text-slate-600 uppercase text-xs mt-1">Không tìm thấy hồ sơ bệnh nhân</h4>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination Footer */}
        <div className="h-16 border-t border-slate-200 px-6 flex justify-between items-center bg-slate-50 shrink-0">
          <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-all shadow-xs cursor-pointer">
            &lt; Trước
          </button>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg bg-[#0b3c8f] text-white font-bold text-xs shadow-xs">1</button>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all border-none bg-transparent cursor-pointer">2</button>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all border-none bg-transparent cursor-pointer">3</button>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all border-none bg-transparent cursor-pointer">4</button>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all border-none bg-transparent cursor-pointer">5</button>
            <span className="text-slate-400 text-xs px-1">...</span>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all border-none bg-transparent cursor-pointer">9</button>
            <button className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all border-none bg-transparent cursor-pointer">10</button>
          </div>
          <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-all shadow-xs cursor-pointer">
            Sau &gt;
          </button>
        </div>
      </div>

      {/* 5. POPUP MODAL: VIEW DETAILED RECORD & PATIENT VISIT HISTORY TIMELINE */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatient(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-0"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col text-slate-800 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPatient(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0b3c8f]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-tight">Hồ Sơ Chi Tiết & Lịch Sử Khám Bệnh</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Bệnh nhân: {selectedPatient.name} • Mã bệnh án MRN: {selectedPatient.mrn}
                  </p>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                
                {/* Left Column: Administrative Information Summary */}
                <div className="lg:col-span-1 space-y-4 border-r border-slate-100 pr-0 lg:pr-6">
                  <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-3.5">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide border-b border-slate-200 pb-1.5">
                      Thông tin hành chính
                    </h4>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400 block font-medium">Họ và tên</span>
                        <span className="font-extrabold text-slate-800">{selectedPatient.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Tuổi / Giới tính</span>
                        <span className="font-bold text-slate-800">{selectedPatient.age} tuổi, {selectedPatient.gender}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Ngày sinh</span>
                        <span className="font-semibold text-slate-800">{selectedPatient.dob}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Số điện thoại</span>
                        <span className="font-semibold text-slate-800 font-mono">{selectedPatient.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Địa chỉ Email</span>
                        <span className="font-semibold text-slate-800">{selectedPatient.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Số CCCD / CMND</span>
                        <span className="font-semibold text-slate-800 font-mono">{selectedPatient.cccd}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Mã thẻ BHYT</span>
                        <span className="font-semibold text-slate-800 font-mono">{selectedPatient.bhyt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visited Times Card */}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5 text-center shadow-xs">
                    <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block mb-1">
                      Tổng số lượt khám tích lũy
                    </span>
                    <div className="text-4xl font-black text-[#0b3c8f] font-mono leading-none tracking-tight">
                      {String(selectedPatient.visitHistory.length).padStart(2, '0')}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">Lượt khám tại Bệnh viện 4AM</span>
                  </div>
                </div>

                {/* Right Column: Medical Record Visit History Timeline */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Lịch sử khám bệnh những lần trước</span>
                  </h4>

                  {/* Vertical Timeline Container */}
                  <div className="relative pl-6 border-l-2 border-indigo-100 space-y-6 max-h-[420px] overflow-y-auto pr-2 py-2">
                    {selectedPatient.visitHistory && selectedPatient.visitHistory.map((visit, index) => (
                      <div key={index} className="relative group">
                        
                        {/* Timeline Node Dot */}
                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 flex items-center justify-center group-hover:scale-125 transition-all shadow-xs" />
                        
                        {/* Visit Card */}
                        <div className="bg-white hover:bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 shadow-xs transition-all space-y-2">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-700">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{visit.date}</span>
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                              Lần khám {selectedPatient.visitHistory.length - index}
                            </span>
                          </div>

                          <div className="space-y-1 text-slate-700">
                            <p>
                              <strong className="text-slate-800">Lý do khám:</strong> {visit.reason}
                            </p>
                            <p>
                              <strong className="text-slate-800">Chẩn đoán lâm sàng:</strong> <span className="text-[#0b3c8f] font-semibold">{visit.diagnosis}</span>
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                              <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                              <span>Bác sĩ phụ trách: {visit.doctor} ({visit.specialty})</span>
                            </p>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1 text-[11px]">
                            <p>
                              <strong className="text-slate-800 block">Đơn thuốc được kê:</strong>
                              <span className="text-slate-600 font-mono leading-relaxed">{visit.prescription}</span>
                            </p>
                            {visit.notes && (
                              <p className="text-slate-500 italic mt-1 text-[10px]">
                                * Lời dặn: {visit.notes}
                              </p>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-4 mt-6 border-t border-slate-100">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs md:text-sm shadow-xs transition-all cursor-pointer border-none"
                >
                  Đóng hồ sơ
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. POPUP MODAL: NEW PATIENT REGISTRATION WITH DUPLICATE CHECKS */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-0"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-[540px] bg-white rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col text-slate-800"
            >
              
              {/* Close button */}
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal header */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0b3c8f]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm md:text-base text-slate-800 uppercase tracking-tight">Tiếp Nhận Bệnh Nhân Mới</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Tạo hồ sơ bệnh án mới (MRN)</p>
                </div>
              </div>

              {/* Success Notification */}
              {successMsg ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-emerald-50/50 border border-emerald-100 rounded-xl p-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                  <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Tiếp Nhận Thành Công</h4>
                  <p className="text-slate-600 text-xs mt-1.5 leading-relaxed max-w-sm">{successMsg}</p>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleAddPatient} className="space-y-4">
                  
                  {/* Họ tên (Required) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập họ và tên bệnh nhân (Ví dụ: Lê Hoài Nam)"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className={`w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 ${validationError && !formName ? 'border-red-400' : 'border-slate-200'
                        }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Ngày sinh (Required) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Ngày sinh <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formDob}
                        onChange={(e) => setFormDob(e.target.value)}
                        className={`w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 ${validationError && !formDob ? 'border-red-400' : 'border-slate-200'
                          }`}
                      />
                    </div>

                    {/* Giới tính (Required) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Giới tính <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formGender}
                        onChange={(e) => setFormGender(e.target.value as 'Nam' | 'Nữ')}
                        className="w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border border-slate-200 text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Số điện thoại (Required) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập số điện thoại"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className={`w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 ${validationError && !formPhone ? 'border-red-400' : 'border-slate-200'
                          }`}
                      />
                    </div>

                    {/* Email (Optional) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Địa chỉ Email
                      </label>
                      <input
                        type="email"
                        placeholder="Nhập email (Tùy chọn)"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border border-slate-200 text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* CCCD (Required + Duplicate Checked) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Số CCCD / SSN <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập số CCCD bệnh nhân"
                        value={formCccd}
                        onChange={(e) => setFormCccd(e.target.value)}
                        className={`w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 ${validationError && !formCccd ? 'border-red-400' : 'border-slate-200'
                          }`}
                      />
                    </div>

                    {/* BHYT (Optional + Duplicate Checked) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Mã thẻ BHYT
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập mã thẻ BHYT (Tùy chọn)"
                        value={formBhyt}
                        onChange={(e) => setFormBhyt(e.target.value)}
                        className="w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border border-slate-200 text-xs md:text-sm outline-none focus:ring-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Action pill */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Triệu chứng / Chỉ định
                      </label>
                      <input
                        type="text"
                        value={formAction}
                        onChange={(e) => setFormAction(e.target.value)}
                        className="w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border border-slate-200 text-xs md:text-sm outline-none focus:ring-2"
                      />
                    </div>

                    {/* Assigned doctor */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Bác sĩ đảm nhận
                      </label>
                      <select
                        value={formDoctor}
                        onChange={(e) => setFormDoctor(e.target.value)}
                        className="w-full bg-white text-slate-800 font-semibold py-2 px-3.5 rounded-xl border border-slate-200 text-xs md:text-sm outline-none focus:ring-2"
                      >
                        <option value="BS. Daniel McAdams">BS. Daniel McAdams (Tiêu hóa)</option>
                        <option value="BS. Emily Johnson">BS. Emily Johnson (Tim mạch)</option>
                        <option value="BS. Michael Lee">BS. Michael Lee (Chấn thương)</option>
                      </select>
                    </div>
                  </div>

                  {/* Validation Error Display */}
                  {validationError && (
                    <div className="text-xs text-red-500 font-semibold flex items-start gap-1.5 bg-red-50 p-3 rounded-xl border border-red-100 leading-normal">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs md:text-sm hover:bg-slate-50 cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs md:text-sm shadow hover:shadow-md cursor-pointer border-none"
                    >
                      Tiếp nhận
                    </button>
                  </div>

                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. POPUP MODAL: EDIT PATIENT PROFILE */}
      <EditPatientModal
        isOpen={!!editingPatient}
        onClose={() => setEditingPatient(null)}
        patient={editingPatient}
        onSuccess={(msg) => {
          setSuccessMsg(msg || 'Cập nhật hồ sơ bệnh nhân thành công!');
          setReloadTrigger((prev) => prev + 1);
        }}
      />

    </div>
  );
};
