import React from 'react';
import {
  Check,
  Copy,
  MoreHorizontal,
  TestTubeDiagonal,
  UserX,
  Wrench,
} from 'lucide-react';
import {
  LAB_TASK_EXCEPTION_REASONS,
  type LabTaskExceptionReason,
} from '../../types/lab-exception';
import { EXCEPTION_REASONS_CONFIG } from '../../utils/labTaskStatus';

interface ExceptionReasonCardsProps {
  selectedReason: LabTaskExceptionReason | null;
  onSelectReason: (reason: LabTaskExceptionReason) => void;
  onSelectChip?: (chipText: string) => void;
  disabled?: boolean;
}

export const ExceptionReasonCards: React.FC<ExceptionReasonCardsProps> = ({
  selectedReason,
  onSelectReason,
  onSelectChip,
  disabled = false,
}) => {
  const getIcon = (code: LabTaskExceptionReason) => {
    switch (code) {
      case 'specimen_rejected':
        return <TestTubeDiagonal className="w-5 h-5 text-red-600" />;
      case 'patient_unavailable':
        return <UserX className="w-5 h-5 text-amber-600" />;
      case 'duplicate_order':
        return <Copy className="w-5 h-5 text-blue-600" />;
      case 'equipment_failure':
        return <Wrench className="w-5 h-5 text-purple-600" />;
      case 'other':
      default:
        return <MoreHorizontal className="w-5 h-5 text-slate-600" />;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % LAB_TASK_EXCEPTION_REASONS.length;
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + LAB_TASK_EXCEPTION_REASONS.length) % LAB_TASK_EXCEPTION_REASONS.length;
      e.preventDefault();
    }
    if (nextIndex !== index) {
      onSelectReason(LAB_TASK_EXCEPTION_REASONS[nextIndex]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-800">
        Chọn lý do sự cố <span className="text-red-500">*</span>
      </label>

      <div
        role="radiogroup"
        aria-label="Lý do sự cố xét nghiệm"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
      >
        {LAB_TASK_EXCEPTION_REASONS.map((code, idx) => {
          const config = EXCEPTION_REASONS_CONFIG[code];
          const isSelected = selectedReason === code;

          return (
            <div
              key={code}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected || (!selectedReason && idx === 0) ? 0 : -1}
              onClick={() => !disabled && onSelectReason(code)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`relative p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 select-none ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-300 hover:shadow-xs'
              } ${
                isSelected
                  ? 'border-red-500 bg-red-50/80 ring-2 ring-red-400/30'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-red-100' : 'bg-slate-100'}`}>
                    {getIcon(code)}
                  </div>
                  <span className="font-semibold text-sm text-slate-900">{config.title}</span>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{config.description}</p>
            </div>
          );
        })}
      </div>

      {/* Quick suggest chips for the currently selected reason */}
      {selectedReason && onSelectChip && (
        <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
          <div className="text-xs font-medium text-slate-600 flex items-center justify-between">
            <span>Gợi ý mô tả nhanh (bấm để thêm):</span>
            <span className="text-[10px] text-slate-400">Tự động chèn vào ô chi tiết</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EXCEPTION_REASONS_CONFIG[selectedReason].quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={disabled}
                onClick={() => onSelectChip(chip)}
                className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer active:scale-95"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

