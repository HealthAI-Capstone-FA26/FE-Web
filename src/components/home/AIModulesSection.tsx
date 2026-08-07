import { Sparkles, BrainCircuit, ActivitySquare, MessageSquareText, Network } from 'lucide-react';

export const AIModulesSection = () => {
  return (
    <section id="ai-modules" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center space-x-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI Vệ Tinh</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Trí Tuệ Nhân Tạo Hỗ Trợ Lâm Sàng</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            3 module AI hoạt động độc lập nhưng tích hợp sâu vào hệ thống lõi thông qua API, 
            phân tích dữ liệu FHIR real-time để hỗ trợ y bác sĩ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Module 1 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group flex flex-col h-full">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-300">
              <BrainCircuit className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Tóm tắt Bệnh án & Timeline</h3>
            <p className="text-slate-600 mb-8 text-sm leading-relaxed flex-grow">
              Tự động tổng hợp dữ liệu từ các lần khám trước, tạo timeline điều trị trực quan giúp bác sĩ nắm bắt tình trạng bệnh nhân trong vòng 10 giây.
            </p>
            <div className="pt-5 border-t border-slate-100">
              <div className="flex items-center text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                <Network className="w-4 h-4 mr-2" /> Cơ chế tương tác FHIR
              </div>
              <div className="text-xs bg-slate-50 p-3 rounded-lg text-slate-700 font-mono border border-slate-100 space-y-1">
                <div><span className="text-blue-600 font-semibold">PULL:</span> Patient, Encounter, Condition</div>
                <div><span className="text-teal-600 font-semibold">PUSH:</span> DocumentReference</div>
              </div>
            </div>
          </div>

          {/* Module 2 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 group flex flex-col h-full">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
              <MessageSquareText className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Chatbot RAG Tra cứu</h3>
            <p className="text-slate-600 mb-8 text-sm leading-relaxed flex-grow">
              Trợ lý ảo cho phép bác sĩ truy vấn hồ sơ bệnh nhân bằng ngôn ngữ tự nhiên. Giới hạn chặt chẽ trong phạm vi dữ liệu được cấp quyền (RBAC).
            </p>
            <div className="pt-5 border-t border-slate-100">
              <div className="flex items-center text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                <Network className="w-4 h-4 mr-2" /> Cơ chế tương tác FHIR
              </div>
              <div className="text-xs bg-slate-50 p-3 rounded-lg text-slate-700 font-mono border border-slate-100 space-y-1">
                <div><span className="text-blue-600 font-semibold">PULL:</span> Vector Search on Resources</div>
                <div><span className="text-teal-600 font-semibold">PUSH:</span> AuditEvent (Log query)</div>
              </div>
            </div>
          </div>

          {/* Module 3 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:border-rose-100 transition-all duration-300 group flex flex-col h-full">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-rose-600 transition-all duration-300">
              <ActivitySquare className="w-8 h-8 text-rose-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Khuếch đại Bất thường</h3>
            <p className="text-slate-600 mb-8 text-sm leading-relaxed flex-grow">
              Tự động phân tích kết quả xét nghiệm (Observation), phát hiện chỉ số ngoài khoảng tham chiếu và gợi ý chẩn đoán sơ bộ cho bác sĩ.
            </p>
            <div className="pt-5 border-t border-slate-100">
              <div className="flex items-center text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                <Network className="w-4 h-4 mr-2" /> Cơ chế tương tác FHIR
              </div>
              <div className="text-xs bg-slate-50 p-3 rounded-lg text-slate-700 font-mono border border-slate-100 space-y-1">
                <div><span className="text-blue-600 font-semibold">PULL:</span> Observation, DiagnosticReport</div>
                <div><span className="text-teal-600 font-semibold">PUSH:</span> ClinicalImpression (Draft)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
