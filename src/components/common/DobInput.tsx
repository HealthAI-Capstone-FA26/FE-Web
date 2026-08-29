import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DobInputProps {
  value: string; // Expected format: YYYY-MM-DD or empty string
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export const DobInput: React.FC<DobInputProps> = ({
  value,
  onChange,
  required,
  className = '',
}) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  // Tracks the last value WE emitted so useEffect doesn't re-sync our own writes
  const lastEmittedRef = useRef<string>(value);

  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      if (!value) {
        setDay('');
        setMonth('');
        setYear('');
      } else {
        const parts = value.split('-');
        if (parts.length === 3) {
          const [y, m, d] = parts;
          setYear(y || '');
          setMonth(m ? m.padStart(2, '0') : '');
          setDay(d ? d.padStart(2, '0') : '');
        }
      }
    }
  }, [value]);

  const emit = (d: string, m: string, y: string) => {
    const numD = parseInt(d, 10);
    const numM = parseInt(m, 10);
    const numY = parseInt(y, 10);

    if (
      d.length === 2 && m.length === 2 && y.length === 4 &&
      numD >= 1 && numD <= 31 &&
      numM >= 1 && numM <= 12 &&
      numY >= 1900 && numY <= 2100
    ) {
      const result = `${y}-${m}-${d}`;
      lastEmittedRef.current = result;
      onChange(result);
    } else {
      lastEmittedRef.current = '';
      onChange('');
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    const num = parseInt(val, 10);
    if (val && !isNaN(num) && num > 31) return;
    setDay(val);
    emit(val, month, year);
    // Auto-focus month after 2 digits — use setTimeout to let setDay commit first
    // so handleBlurDay (fired by programmatic focus change) reads correct DOM value
    if (val.length === 2 && num >= 1) {
      setTimeout(() => monthRef.current?.focus(), 0);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    const num = parseInt(val, 10);
    if (val && !isNaN(num) && num > 12) return;
    setMonth(val);
    emit(day, val, year);
    if (val.length === 2 && num >= 1) {
      setTimeout(() => yearRef.current?.focus(), 0);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(val);
    emit(day, month, val);
  };

  // Use e.target.value (actual DOM value) instead of stale React state
  const handleBlurDay = (e: React.FocusEvent<HTMLInputElement>) => {
    const current = e.target.value;
    if (current && current.length === 1) {
      const padded = current.padStart(2, '0');
      setDay(padded);
      emit(padded, month, year);
    }
  };

  const handleBlurMonth = (e: React.FocusEvent<HTMLInputElement>) => {
    const current = e.target.value;
    if (current && current.length === 1) {
      const padded = current.padStart(2, '0');
      setMonth(padded);
      emit(day, padded, year);
    }
  };

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="Ngày (DD)"
          value={day}
          onChange={handleDayChange}
          onBlur={handleBlurDay}
          required={required}
          className="w-full px-3 py-2 text-xs text-center rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-medium"
        />
      </div>

      <div className="relative">
        <input
          ref={monthRef}
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="Tháng (MM)"
          value={month}
          onChange={handleMonthChange}
          onBlur={handleBlurMonth}
          required={required}
          className="w-full px-3 py-2 text-xs text-center rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-medium"
        />
      </div>

      <div className="relative">
        <input
          ref={yearRef}
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="Năm (YYYY)"
          value={year}
          onChange={handleYearChange}
          required={required}
          className="w-full px-3 py-2 text-xs text-center rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 pr-7 font-medium"
        />
        <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
      </div>
    </div>
  );
};
