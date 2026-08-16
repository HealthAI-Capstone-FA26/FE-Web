import React from 'react';
import { SEVEN_STEPS_WORKFLOW, type WorkflowStep } from '../../types/workflow';
import {
  UserCheck,
  Activity,
  Stethoscope,
  CreditCard,
  FlaskConical,
  FileText,
  Pill,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface StepProgressBarProps {
  currentStepNumber?: number;
  onStepClick?: (step: WorkflowStep) => void;
  interactive?: boolean;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStepNumber = 3,
  onStepClick,
  interactive = true
}) => {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'UserCheck':
        return <UserCheck className="w-4 h-4" />;
      case 'Activity':
        return <Activity className="w-4 h-4" />;
      case 'Stethoscope':
        return <Stethoscope className="w-4 h-4" />;
      case 'CreditCard':
        return <CreditCard className="w-4 h-4" />;
      case 'FlaskConical':
        return <FlaskConical className="w-4 h-4" />;
      case 'FileText':
        return <FileText className="w-4 h-4" />;
      case 'Pill':
        return <Pill className="w-4 h-4" />;
      default:
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const activeStep = SEVEN_STEPS_WORKFLOW.find((s) => s.stepNumber === currentStepNumber);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Quy trình chuẩn 7 bước
            </span>
            <span className="text-xs font-medium text-slate-500">
              (Theo mô hình Bệnh viện Đa khoa Tâm Anh)
            </span>
          </div>
          <h4 className="text-sm font-extrabold text-slate-800 mt-1">
            Tiến trình Khám & Chẩn đoán Bệnh án Điện tử
          </h4>
        </div>
        {activeStep && (
          <div className="flex items-center gap-2">
            <Badge variant="ai" size="sm">
              Tích hợp AI01 & AI02
            </Badge>
            <Badge variant="info" size="sm">
              Chuẩn FHIR HL7
            </Badge>
          </div>
        )}
      </div>

      {/* 7-Step Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {SEVEN_STEPS_WORKFLOW.map((step) => {
          const isDone = step.stepNumber < currentStepNumber;
          const isCurrent = step.stepNumber === currentStepNumber;

          return (
            <button
              key={step.stepNumber}
              onClick={() => interactive && onStepClick && onStepClick(step)}
              disabled={!interactive}
              className={`relative flex flex-col p-3 rounded-xl border text-left transition-all duration-200 group ${
                isCurrent
                  ? 'bg-gradient-to-b from-blue-600 to-indigo-700 text-white border-blue-700 shadow-md ring-2 ring-blue-400/40 scale-[1.02]'
                  : isDone
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:bg-emerald-100/70 cursor-pointer'
                  : 'bg-slate-50/80 border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer'
              }`}
            >
              {/* Step indicator badge */}
              <div className="flex items-center justify-between w-full mb-2">
                <span
                  className={`w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center ${
                    isCurrent
                      ? 'bg-white text-blue-700 shadow-xs'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.stepNumber}
                </span>

                <div
                  className={`p-1 rounded-md ${
                    isCurrent ? 'bg-white/20 text-white' : isDone ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {getIconComponent(step.icon)}
                </div>
              </div>

              {/* Step Title & Module */}
              <span className={`text-xs font-bold line-clamp-1 ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                {step.shortTitle}
              </span>
              <span
                className={`text-[10px] font-medium mt-0.5 line-clamp-1 ${
                  isCurrent ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {step.moduleName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Step Details */}
      {activeStep && (
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-800 shrink-0 mt-0.5">
              {getIconComponent(activeStep.icon)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-blue-900">
                  Bước {activeStep.stepNumber}: {activeStep.title}
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                  {activeStep.roleName}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{activeStep.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-blue-700 font-bold hover:underline cursor-pointer shrink-0">
            <span>Chi tiết mô-đun</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
};
