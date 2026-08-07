import { UserPlus, Stethoscope, TestTube, FileText, ClipboardList, Pill, CreditCard, CheckCircle } from 'lucide-react';

const steps = [
  { id: 1, name: 'Tiếp đón & Cấp số', role: 'Lễ tân', resource: 'Patient, Encounter', icon: UserPlus },
  { id: 2, name: 'Khám lâm sàng', role: 'Bác sĩ', resource: 'Condition, Observation', icon: Stethoscope },
  { id: 3, name: 'Chỉ định CLS', role: 'Bác sĩ', resource: 'ServiceRequest', icon: ClipboardList },
  { id: 4, name: 'Thanh toán CLS', role: 'Thu ngân', resource: 'Invoice, PaymentNotice', icon: CreditCard },
  { id: 5, name: 'Thực hiện CLS', role: 'KTV', resource: 'DiagnosticReport', icon: TestTube },
  { id: 6, name: 'Kết luận', role: 'Bác sĩ', resource: 'ClinicalImpression', icon: FileText },
  { id: 7, name: 'Kê đơn', role: 'Bác sĩ', resource: 'MedicationRequest', icon: Pill },
  { id: 8, name: 'Thanh toán thuốc', role: 'Thu ngân', resource: 'Invoice', icon: CreditCard },
  { id: 9, name: 'Phát thuốc', role: 'Dược sĩ', resource: 'MedicationDispense', icon: CheckCircle },
];

export const WorkflowSection = () => {
  return (
    <section id="quy-trinh" className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Quy trình Khám bệnh 9 Bước Chuẩn</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Hệ thống quản lý xuyên suốt hành trình bệnh nhân từ lúc tiếp đón đến khi hoàn tất khám bệnh, 
            mọi dữ liệu đều được lưu trữ và luân chuyển dưới định dạng FHIR R4.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-10 left-8 right-8 h-1 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 z-0 rounded-full" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-y-12 lg:gap-y-0 gap-x-4 relative z-10">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex flex-col items-center group">
                  <div className="w-20 h-20 bg-white rounded-full border-4 border-blue-50 shadow-sm flex items-center justify-center mb-5 group-hover:border-blue-500 group-hover:shadow-lg transition-all duration-300 relative z-10">
                    <Icon className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                      {step.id}
                    </div>
                  </div>
                  
                  <div className="text-center px-1">
                    <h3 className="font-semibold text-slate-900 text-sm mb-2 h-10">{step.name}</h3>
                    <div className="inline-block bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full mb-3 font-medium">
                      {step.role}
                    </div>
                    <div className="mt-auto">
                      <p className="text-[10px] text-teal-700 font-mono bg-teal-50/50 border border-teal-100 py-1.5 px-2 rounded-md w-full break-words leading-tight">
                        {step.resource}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
