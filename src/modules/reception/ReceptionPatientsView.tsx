import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users, CheckCircle2, UserPlus, Search, Download, Eye,
  MoreVertical, X, ShieldAlert, Heart, FileText,
  Calendar, Stethoscope, Clock, Loader2, Edit3, RefreshCw, Mail, Phone, Shield, AlertCircle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
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

  // Filter & Pagination States
  const [selectedFilterTab, setSelectedFilterTab] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

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

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilterTab, pageSize]);

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

  const loadPatients = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await patientService.getAllPatients(searchTerm || undefined);
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
    } catch (err: any) {
      console.log('Lỗi tải danh sách bệnh nhân từ Backend:', err);
      setPatients([]);
      setFetchError(err?.message || 'Không thể kết nối đến máy chủ Backend.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real patient list from Backend API (GET /patients)
  useEffect(() => {
    loadPatients();
  }, [searchTerm, reloadTrigger]);

  // Filter patients based on search input & selected tab
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (p.name || '').toLowerCase().includes(term) ||
        (p.mrn || '').toLowerCase().includes(term) ||
        (p.cccd || '').toLowerCase().includes(term) ||
        (p.phone || '').toLowerCase().includes(term);

      const matchesTab =
        selectedFilterTab === 'ALL' ||
        (selectedFilterTab === 'MALE' && p.gender === 'Nam') ||
        (selectedFilterTab === 'FEMALE' && p.gender === 'Nữ') ||
        (selectedFilterTab === 'BHYT' && p.bhyt && p.bhyt !== 'Không có' && p.bhyt !== 'Chưa cập nhật');

      return matchesSearch && matchesTab;
    });
  }, [patients, searchTerm, selectedFilterTab]);

  // Pagination calculation
  const totalPatients = filteredPatients.length;
  const totalPages = Math.max(1, Math.ceil(totalPatients / pageSize));

  const paginatedPatients = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredPatients.slice(startIdx, startIdx + pageSize);
  }, [filteredPatients, currentPage, pageSize]);

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
      patientId: newMrn,
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-700" />
            <span>Quản Lý Hồ Sơ Bệnh Nhân & Bệnh Án</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị danh sách bệnh nhân, tra cứu thông tin hành chính, số CCCD/BHYT và lịch sử khám bệnh
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer border-none"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Bệnh Nhân Mới</span>
          </button>

          <button
            onClick={loadPatients}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 border-none cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'ALL', label: 'Tổng bệnh nhân', count: patients.length, icon: Users, color: 'text-blue-700 bg-blue-50' },
          { key: 'MALE', label: 'Bệnh nhân Nam', count: patients.filter(p => p.gender === 'Nam').length, icon: Users, color: 'text-indigo-700 bg-indigo-50' },
          { key: 'FEMALE', label: 'Bệnh nhân Nữ', count: patients.filter(p => p.gender === 'Nữ').length, icon: Users, color: 'text-rose-700 bg-rose-50' },
          { key: 'BHYT', label: 'Có thẻ BHYT', count: patients.filter(p => p.bhyt && p.bhyt !== 'Không có' && p.bhyt !== 'Chưa cập nhật').length, icon: Shield, color: 'text-emerald-700 bg-emerald-50' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setSelectedFilterTab(item.key)}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${selectedFilterTab === item.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10'
                : 'bg-white text-slate-800 border-slate-200/90 hover:border-blue-200 hover:bg-slate-50/50'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold ${selectedFilterTab === item.key ? 'text-blue-100' : 'text-slate-500'}`}>
                {item.label}
              </span>
              <div
                className={`p-1.5 rounded-lg ${selectedFilterTab === item.key ? 'bg-white/20 text-white' : item.color}`}
              >
                <item.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className={`text-xl font-black mt-2 ${selectedFilterTab === item.key ? 'text-white' : 'text-slate-900'}`}>
              {item.count}
            </div>
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Search Bar & Gender/BHYT Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50/30">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, mã MRN, CCCD, SĐT..."
              className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'MALE', label: 'Nam' },
              { id: 'FEMALE', label: 'Nữ' },
              { id: 'BHYT', label: 'Có BHYT' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilterTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 border cursor-pointer ${selectedFilterTab === tab.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Đang tải danh sách hồ sơ bệnh nhân...</span>
          </div>
        ) : fetchError ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3 text-rose-600">
            <AlertCircle className="w-8 h-8" />
            <span className="text-xs font-bold">{fetchError}</span>
            <button
              onClick={loadPatients}
              className="mt-2 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-xl cursor-pointer border-none"
            >
              Thử lại
            </button>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <div className="text-xs font-bold text-slate-700">Không tìm thấy hồ sơ bệnh nhân nào</div>
            <p className="text-[11px] text-slate-400">Hãy thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Bệnh nhân</th>
                  <th className="py-3 px-4">Liên hệ</th>
                  <th className="py-3 px-4">Số CCCD / BHYT</th>
                  <th className="py-3 px-4">Hoạt động khám</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPatients.map((patient) => (
                  <tr key={patient.mrn} className="hover:bg-slate-50/60 transition-colors">
                    {/* Patient Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-black text-xs shrink-0">
                          {patient.name ? patient.name.charAt(0).toUpperCase() : <Users className="w-5 h-5 text-slate-400" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate">{patient.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Mã BN: <span className="font-mono text-blue-700 font-bold">{patient.mrn}</span> • {patient.age} tuổi ({patient.gender})
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                      {patient.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{patient.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* CCCD / BHYT */}
                    <td className="py-3.5 px-4 space-y-0.5 font-mono text-slate-700">
                      <div><span className="text-[10px] text-slate-400 font-sans">CCCD:</span> {patient.cccd}</div>
                      <div><span className="text-[10px] text-slate-400 font-sans">BHYT:</span> {patient.bhyt}</div>
                    </td>

                    {/* Recent Action */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {patient.recentAction}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Hoạt động
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedPatient(patient)}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Xem chi tiết & lịch sử khám"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </button>
                        <button
                          onClick={() => setEditingPatient(patient)}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Chỉnh sửa hồ sơ"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && totalPatients > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Hiển thị</span>
              <span className="font-bold text-slate-800">
                {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalPatients)}
              </span>
              <span>trên tổng số</span>
              <span className="font-bold text-slate-800">{totalPatients} bệnh nhân</span>

              <span className="mx-2 text-slate-300 hidden sm:inline">|</span>

              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Số dòng/trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value={5}>5 bệnh nhân</option>
                  <option value={8}>8 bệnh nhân</option>
                  <option value={10}>10 bệnh nhân</option>
                  <option value={15}>15 bệnh nhân</option>
                  <option value={20}>20 bệnh nhân</option>
                  <option value={9999}>Tất cả</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="Trang đầu"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Trang trước"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, idx, array) => {
                    const prevPage = array[idx - 1];
                    const hasGap = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {hasGap && <span className="px-1 text-slate-400 text-xs">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors border cursor-pointer ${currentPage === page
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="Trang sau"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Trang cuối"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
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
