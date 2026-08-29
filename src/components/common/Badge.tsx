import React from 'react';
import { AlertTriangle, CheckCircle, Info, Sparkles, AlertCircle } from 'lucide-react';

export type BadgeVariant = 'normal' | 'success' | 'warning' | 'critical' | 'info' | 'ai' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'normal',
  children,
  icon = true,
  size = 'md',
  className = ''
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    normal: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse',
    critical: 'bg-rose-50 text-rose-700 border-rose-300 font-bold animate-pulse',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    ai: 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-purple-200 font-semibold',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded',
    md: 'text-xs px-2.5 py-1 rounded-md',
    lg: 'text-sm px-3 py-1.5 rounded-lg'
  };

  const renderIcon = () => {
    if (!icon) return null;
    const iconClass = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
    switch (variant) {
      case 'normal':
      case 'success':
        return <CheckCircle className={iconClass} />;
      case 'warning':
        return <AlertTriangle className={iconClass} />;
      case 'critical':
        return <AlertCircle className={iconClass} />;
      case 'info':
        return <Info className={iconClass} />;
      case 'ai':
        return <Sparkles className={`${iconClass} text-purple-600`} />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-medium transition-all ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {renderIcon()}
      <span>{children}</span>
    </span>
  );
};
