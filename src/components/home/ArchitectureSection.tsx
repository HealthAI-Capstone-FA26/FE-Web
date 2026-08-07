import { Server, Brain, Lock, Network } from 'lucide-react';

export const ArchitectureSection = () => {
  return (
    <section id="ve-he-thong" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Kiến Trúc Hệ Thống Tích Hợp</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Mô hình Microservices với Module lõi trung tâm quản lý workflow, giao tiếp với các Module AI vệ tinh thông qua lớp API chuẩn dữ liệu FHIR R4 Y tế.
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-slate-50 rounded-[2.5rem] p-8 md:p-16 border border-slate-200 relative overflow-hidden shadow-sm">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between space-y-16 lg:space-y-0">
            
            {/* AI Modules (Left) */}
            <div className="w-full lg:w-1/3 flex flex-col space-y-6">
              <div className="bg-white text-slate-800 p-5 rounded-2xl shadow-md border-l-4 border-indigo-500 flex items-center space-x-4 transform transition-transform hover:-translate-y-1 hover:shadow-lg">
                <div className="bg-indigo-100 p-2.5 rounded-xl">
                  <Brain className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <span className="font-bold text-sm block mb-0.5">Tóm tắt Bệnh án</span>
                  <span className="text-xs text-slate-500">Timeline & Summarization</span>
                </div>
              </div>
              <div className="bg-white text-slate-800 p-5 rounded-2xl shadow-md border-l-4 border-blue-500 flex items-center space-x-4 transform transition-transform hover:-translate-y-1 hover:shadow-lg">
                <div className="bg-blue-100 p-2.5 rounded-xl">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <span className="font-bold text-sm block mb-0.5">Chatbot RAG</span>
                  <span className="text-xs text-slate-500">Natural Language Query</span>
                </div>
              </div>
              <div className="bg-white text-slate-800 p-5 rounded-2xl shadow-md border-l-4 border-rose-500 flex items-center space-x-4 transform transition-transform hover:-translate-y-1 hover:shadow-lg">
                <div className="bg-rose-100 p-2.5 rounded-xl">
                  <Brain className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <span className="font-bold text-sm block mb-0.5">Khuếch đại Bất thường</span>
                  <span className="text-xs text-slate-500">Anomaly Detection</span>
                </div>
              </div>
            </div>

            {/* Connection Layer */}
            <div className="flex lg:flex-col items-center justify-center w-full lg:w-1/6">
              <div className="hidden lg:flex w-full items-center justify-center space-x-2 text-slate-400">
                <div className="h-0.5 w-full bg-slate-300 border-dashed border-t-2 border-slate-300" />
              </div>
              <div className="bg-slate-800 text-white text-sm font-semibold py-3 px-6 rounded-xl my-4 shadow-lg flex items-center space-x-2 transform hover:scale-105 transition-transform z-20">
                <Network className="w-5 h-5 text-blue-300" />
                <span>FHIR API</span>
              </div>
              <div className="hidden lg:flex w-full items-center justify-center space-x-2 text-slate-400">
                <div className="h-0.5 w-full bg-slate-300 border-dashed border-t-2 border-slate-300" />
              </div>
              
              {/* Mobile connecting lines */}
              <div className="lg:hidden h-16 w-0.5 bg-slate-300 border-dashed border-l-2 border-slate-300 my-4" />
            </div>

            {/* Core Module (Right) */}
            <div className="w-full lg:w-5/12 bg-white p-8 rounded-3xl shadow-xl border-2 border-teal-500 relative">
              <div className="absolute -top-4 -right-4 bg-teal-500 text-white p-3 rounded-xl shadow-lg border-2 border-white">
                <Lock className="w-6 h-6" />
              </div>
              <div className="flex items-center space-x-4 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-teal-50 p-3 rounded-2xl">
                  <Server className="w-10 h-10 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">Core Module</h3>
                  <p className="text-sm text-slate-500">Patient Visit Workflow Management</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-teal-200 transition-colors">
                  <span className="font-medium text-slate-700 text-sm">Quản lý Workflow 9 Bước</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">Active</span>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-teal-200 transition-colors">
                  <span className="font-medium text-slate-700 text-sm">FHIR Repository Data</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">Active</span>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-teal-200 transition-colors">
                  <span className="font-medium text-slate-700 text-sm">RBAC & Audit Logging</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">Active</span>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};
