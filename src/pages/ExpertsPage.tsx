import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import {
  Search,
  Stethoscope,
  Calendar,
  ShieldCheck,
  Building2,
  X,
  User,
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { doctorService, type DoctorResponse, type DepartmentResponse } from '../services/doctor/doctor.service';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const ExpertsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [allDepartments, setAllDepartments] = useState<DepartmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [filterType, setFilterType] = useState<'specialization' | 'department'>('specialization');

  // Modal State for Doctor Detail (GET /doctors/:id)
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch all doctors from public API (GET /doctors)
  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.getDoctors();
      setDoctors(data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách bác sĩ:', err);
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    doctorService.getDepartments().then((depts) => setAllDepartments(depts || [])).catch(() => []);
  }, []);

  // Unique specializations list
  const specializationsList = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.specialization) set.add(d.specialization);
    });
    return Array.from(set);
  }, [doctors]);

  // Unique hospital departments list (with departmentCode and departmentName)
  const hospitalDepartmentsList = useMemo(() => {
    if (allDepartments.length > 0) {
      return allDepartments.map((dept) => ({
        code: dept.departmentCode,
        name: dept.departmentName,
      }));
    }
    const map = new Map<string, { code: string; name: string }>();
    doctors.forEach((d) => {
      d.doctorDepartments?.forEach((dd) => {
        if (dd.department?.departmentName && !map.has(dd.department.departmentName)) {
          map.set(dd.department.departmentName, {
            code: dd.department.departmentCode || '',
            name: dd.department.departmentName,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [doctors, allDepartments]);

  // Filtered doctors client-side
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSearch =
        !searchTerm.trim() ||
        doc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.specialization && doc.specialization.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.title && doc.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.doctorCode && doc.doctorCode.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesDept = true;
      if (selectedDept !== 'all') {
        if (filterType === 'specialization') {
          matchesDept = Boolean(doc.specialization && doc.specialization.toLowerCase() === selectedDept.toLowerCase());
        } else {
          matchesDept = Boolean(
            doc.doctorDepartments?.some(
              (dd) =>
                dd.department?.departmentName.toLowerCase() === selectedDept.toLowerCase() ||
                dd.department?.departmentCode.toLowerCase() === selectedDept.toLowerCase()
            )
          );
        }
      }

      return matchesSearch && matchesDept;
    });
  }, [doctors, searchTerm, selectedDept, filterType]);

  // Open Doctor Detail Modal (Calls GET /doctors/:id)
  const handleOpenDetail = async (doctorId: string) => {
    setIsModalOpen(true);
    setIsDetailLoading(true);
    setSelectedDoctor(null);

    try {
      const detailData = await doctorService.getDoctorById(doctorId);
      setSelectedDoctor(detailData);
    } catch (err) {
      console.error('Lỗi khi tải thông tin bác sĩ:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleBooking = (_doc: DoctorResponse) => {
    setIsModalOpen(false);
    if (!user) {
      // If guest user, navigate to login or registration
      navigate('/login');
    } else {
      // Patient user: Navigate to intake/booking workspace
      navigate('/benh-nhan/trieu-chung');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 font-sans flex flex-col">
      <Header />

      {/* Main Content Area */}
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <section className="text-center space-y-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Bệnh Viện 4AM Care • Đội Ngũ Y Bác Sĩ Chuyên Khoa</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Đội Ngũ Chuyên Gia
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto font-normal">
            Quy tụ các Giáo sư, Tiến sĩ, Bác sĩ Chuyên khoa giàu kinh nghiệm, tận tâm đồng hành mang lại giải pháp chăm sóc sức khỏe toàn diện và tiên tiến cho bạn.
          </p>

          {/* Search & Filter Controls */}
          <div className="pt-6 max-w-2xl mx-auto space-y-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm bác sĩ theo Họ tên, Chuyên khoa, Bằng cấp (ví dụ: Tim mạch, BS.CKII)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm shadow-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Mode Selector & Pills */}
            <div className="flex flex-col items-center space-y-3 pt-2">
              {/* Segmented Control Toggle */}
              <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80 text-xs font-bold shadow-xs">
                <button
                  onClick={() => {
                    setFilterType('specialization');
                    setSelectedDept('all');
                  }}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer border-none ${
                    filterType === 'specialization'
                      ? 'bg-white text-blue-700 shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Theo Chuyên khoa ({specializationsList.length})
                </button>
                <button
                  onClick={() => {
                    setFilterType('department');
                    setSelectedDept('all');
                  }}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer border-none ${
                    filterType === 'department'
                      ? 'bg-white text-blue-700 shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Theo Khoa công tác ({hospitalDepartmentsList.length})
                </button>
              </div>

              {/* Dynamic Filter Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto py-2">
                <button
                  onClick={() => setSelectedDept('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedDept === 'all'
                      ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {filterType === 'specialization' ? 'Tất cả chuyên khoa' : 'Tất cả khoa công tác'} ({doctors.length})
                </button>

                {filterType === 'specialization'
                  ? specializationsList.map((spec, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedDept(spec)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                          selectedDept === spec
                            ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {spec}
                      </button>
                    ))
                  : hospitalDepartmentsList.map((dept, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedDept(dept.name)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                          selectedDept === dept.name
                            ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {dept.code && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                              selectedDept === dept.name ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                            }`}
                          >
                            {dept.code}
                          </span>
                        )}
                        <span>{dept.name}</span>
                      </button>
                    ))}
              </div>
            </div>
          </div>
        </section>

        {/* Doctor Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-pulse">
                <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4 mx-auto"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto"></div>
                <div className="h-9 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Không tìm thấy bác sĩ phù hợp</h3>
              <p className="text-xs text-slate-500 mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc bấm nút để xem toàn bộ danh sách.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDept('all');
              }}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors border-none cursor-pointer"
            >
              Xem tất cả bác sĩ
            </button>
          </div>
        ) : (
          <div className="space-y-6 max-w-5xl mx-auto">
            {filteredDoctors.map((doc) => {
              const primaryDeptObj = doc.doctorDepartments?.find(d => d.isPrimary) || doc.doctorDepartments?.[0];
              const deptName = primaryDeptObj?.department?.departmentName || null;
              const specializationName = doc.specialization || null;
              const displayTitle = doc.title ? `${doc.title} ${doc.fullName}` : doc.fullName;

              return (
                <div
                  key={doc.doctorId}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col md:flex-row gap-6 items-start group"
                >
                  {/* Left Column: Doctor Portrait / Avatar */}
                  <div className="w-full md:w-44 lg:w-48 h-52 sm:h-56 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center relative shadow-xs">
                    <div className="w-full h-full bg-gradient-to-b from-blue-50/80 to-slate-100 flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-20 h-20 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center font-black text-3xl text-blue-700 shadow-sm mb-2 group-hover:scale-105 transition-transform duration-200">
                        {doc.fullName ? doc.fullName.charAt(0).toUpperCase() : <User className="w-10 h-10 text-slate-400" />}
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 bg-white/90 px-2.5 py-0.5 rounded-full border border-slate-200">
                        Mã BS: {doc.doctorCode}
                      </span>
                    </div>
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      Sẵn sàng
                    </span>
                  </div>

                  {/* Right Column: Information & Actions */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 w-full self-stretch space-y-3">
                    <div className="space-y-1.5">
                      {/* Doctor Full Name & Title */}
                      <h3 className="font-black text-lg sm:text-xl text-slate-900 tracking-tight uppercase group-hover:text-blue-700 transition-colors">
                        {displayTitle}
                      </h3>

                      {/* Specialization (Chuyên khoa phụ trách) */}
                      {specializationName && (
                        <p className="text-xs sm:text-sm italic font-semibold text-blue-700">
                          Chuyên khoa: {specializationName}
                        </p>
                      )}

                      {/* Department (Khoa công tác) */}
                      {deptName && (
                        <p className="text-xs sm:text-sm italic font-medium text-slate-600 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0 not-italic" />
                          <span>Khoa công tác: {deptName} — Bệnh viện 4AM Care</span>
                        </p>
                      )}

                      {/* Summary Description */}
                      <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mt-2 line-clamp-3">
                        {specializationName
                          ? `${doc.fullName} là chuyên gia giàu kinh nghiệm trong lĩnh vực ${specializationName}, luôn tận tâm đồng hành mang lại giải pháp chăm sóc sức khỏe tối ưu và hiệu quả nhất cho người bệnh.`
                          : `${doc.fullName} là chuyên gia y tế giàu kinh nghiệm công tác tại Bệnh viện 4AM Care, tận tâm tư vấn, chẩn đoán và điều trị chăm sóc sức khỏe toàn diện.`}
                      </p>
                    </div>

                    {/* Action Buttons (Bottom Right Aligned) */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 mt-auto">
                      <button
                        onClick={() => handleBooking(doc)}
                        className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer border-none shadow-xs flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>ĐẶT LỊCH HẸN</span>
                      </button>
                      <button
                        onClick={() => handleOpenDetail(doc.doctorId)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer border-none shadow-xs flex items-center gap-1.5"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>XEM CHI TIẾT</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Doctor Detail Modal (GET /doctors/:id) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-200" />
                  <h3 className="font-bold text-base">Thông Tin Chi Tiết Chuyên Gia</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer border-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {isDetailLoading || !selectedDoctor ? (
                  <div className="py-12 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Đang tải thông tin chi tiết bác sĩ...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                      <div className="w-24 h-24 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-3xl font-black text-blue-700 shrink-0">
                        {selectedDoctor.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border border-blue-200">
                            {selectedDoctor.title || 'BS.CKI'}
                          </span>
                          <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            Mã BS: {selectedDoctor.doctorCode}
                          </span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900">{selectedDoctor.fullName}</h2>
                        <p className="text-xs text-slate-500 font-medium">
                          {selectedDoctor.specialization || 'Bác sĩ chuyên khoa y tế hàng đầu tại Bệnh viện 4AM Care.'}
                        </p>
                      </div>
                    </div>

                    {/* Detailed Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Chức Danh / Học Hàm</span>
                        <p className="text-xs font-bold text-slate-800">{selectedDoctor.title || 'Bác sĩ Chuyên khoa'}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Chuyên Khoa Phụ Trách</span>
                        <p className="text-xs font-bold text-slate-800">{selectedDoctor.specialization || 'Tổng hợp'}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Danh Sách Khoa Công Tác</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedDoctor.doctorDepartments && selectedDoctor.doctorDepartments.length > 0 ? (
                            selectedDoctor.doctorDepartments.map((dd, idx) => (
                              <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                                {dd.department?.departmentName || 'Khoa Nội'} {dd.isPrimary ? '(Chính)' : ''}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">Khoa Khám Bệnh Tổng Hợp</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1 sm:col-span-2">
                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Lịch Khám & Tiếp Nhận</span>
                        <p className="text-xs font-medium text-emerald-800">
                          Bác sĩ có lịch tiếp nhận khám bệnh từ Thứ 2 đến Thứ 7 hàng tuần tại Bệnh viện 4AM.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => selectedDoctor && handleBooking(selectedDoctor)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer border-none flex items-center gap-2 shadow-sm"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Đặt Lịch Khám Ngay</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};
export default ExpertsPage;
