import React from 'react';
import { User, ChevronDown } from 'lucide-react';
import { getAvatarUrl } from '../../services/api';

export interface UserProfilePillProps {
  user?: {
    name?: string;
    avatar?: string;
    role?: string;
    roleTitle?: string;
    email?: string;
  } | null;
  roleLabel?: string;
  isOpen?: boolean;
  onClick?: () => void;
  className?: string;
  showChevron?: boolean;
  variant?: 'light' | 'glassmorphism';
  animatedBorder?: boolean;
}

export const getRoleDisplayText = (user?: UserProfilePillProps['user'], overrideLabel?: string): string => {
  if (overrideLabel) return overrideLabel;
  if (!user) return 'Khách hàng';

  switch (user.role) {
    case 'DOCTOR':
      return 'Bác sĩ';
    case 'NURSE':
      return 'Điều dưỡng';
    case 'LAB':
      return 'KTV Phòng Lab';
    case 'ADMIN':
      return 'Quản trị viên';
    case 'RECEPTIONIST':
      return 'Lễ tân / Thu ngân';
    case 'PATIENT':
      return 'Bệnh nhân';
    default:
      return user.roleTitle || user.role || 'Thành viên';
  }
};

export const UserProfilePill: React.FC<UserProfilePillProps> = ({
  user,
  roleLabel,
  isOpen = false,
  onClick,
  className = '',
  showChevron = true,
  variant = 'glassmorphism',
  animatedBorder = true,
}) => {
  const displayRole = getRoleDisplayText(user, roleLabel);

  if (variant === 'glassmorphism') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group relative flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-[#12141d] active:scale-[0.98] transition-all duration-200 cursor-pointer text-left ${className}`}
      >
        {/* Animated Multi-color Glowing Gradient Border Beam (Electric Blue to Purple/Magenta) */}
        {animatedBorder && (
          <div className="absolute -inset-[1.5px] rounded-full p-[1.5px] overflow-hidden pointer-events-none z-0">
            <div className="absolute -inset-[150%] bg-[conic-gradient(from_0deg_at_50%_50%,#0099ff_0%,#38bdf8_30%,#ec4899_65%,#a855f7_85%,#0099ff_100%)] animate-[spin_6s_linear_infinite] opacity-90 group-hover:opacity-100 group-hover:animate-[spin_3s_linear_infinite] transition-opacity" />
            <div className="absolute inset-[1.5px] rounded-full bg-[#12141d]" />
          </div>
        )}

        {/* Ambient Outer Soft Glow */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600/30 via-purple-600/20 to-pink-600/30 blur-md opacity-50 group-hover:opacity-90 transition-opacity pointer-events-none -z-10" />

        {/* 3D Dark Glossy Metallic Ring Avatar Frame */}
        <div className="relative z-10 shrink-0 w-9 h-9 rounded-full p-[2px] bg-gradient-to-b from-slate-600 via-slate-800 to-slate-950 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_3px_8px_rgba(0,0,0,0.8)] flex items-center justify-center">
          <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 flex items-center justify-center relative">
            {user?.avatar ? (
              <img
                src={getAvatarUrl(user.avatar)}
                alt={user?.name || 'User Avatar'}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-white flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4 text-slate-300" />}
              </div>
            )}
            {/* Glossy Reflection Arc */}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-full pointer-events-none" />
          </div>
        </div>

        {/* Text Section */}
        <div className="relative z-10 flex flex-col text-left min-w-0 pr-1">
          <span className="text-[13.5px] font-extrabold text-white leading-tight truncate tracking-tight group-hover:text-blue-100 transition-colors">
            {user?.name || 'Chưa đăng nhập'}
          </span>
          <span className="text-[11px] font-bold text-[#38bdf8] leading-tight truncate mt-0.5 tracking-wide">
            {displayRole}
          </span>
        </div>

        {/* Right Action Circle Button with Chevron */}
        {showChevron && (
          <div className="relative z-10 shrink-0 w-7 h-7 rounded-full bg-[#242634] group-hover:bg-[#2c2e3f] border border-white/10 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),0_2px_6px_rgba(0,0,0,0.4)] transition-all duration-200">
            <ChevronDown
              className={`w-3.5 h-3.5 text-white/90 group-hover:text-white transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#38bdf8]' : ''
              }`}
            />
          </div>
        )}
      </button>
    );
  }

  // Light theme fallback
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center space-x-2.5 px-3 py-1.5 rounded-[20px] bg-[#f0f4f9] hover:bg-[#e2ebf7] active:scale-[0.98] border border-slate-200/90 shadow-2xs transition-all duration-150 cursor-pointer text-left ${className}`}
    >
      {/* Animated Light Border Beam */}
      {animatedBorder && (
        <div className="absolute -inset-[1px] rounded-[21px] p-[1.5px] overflow-hidden pointer-events-none z-0">
          <div className="absolute -inset-[150%] bg-[conic-gradient(from_0deg_at_50%_50%,#2563eb_0%,#38bdf8_25%,#6366f1_50%,#3b82f6_75%,#2563eb_100%)] animate-[spin_6s_linear_infinite] opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-[1px] rounded-[19px] bg-[#f0f4f9]" />
        </div>
      )}

      {/* Avatar Container */}
      <div className="relative z-10 shrink-0">
        {user?.avatar ? (
          <img
            src={getAvatarUrl(user.avatar)}
            alt={user?.name || 'User Avatar'}
            className="w-9 h-9 rounded-full object-cover border border-slate-300/80 shadow-2xs group-hover:border-blue-400 transition-colors"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200 font-extrabold text-sm shadow-2xs group-hover:border-blue-400 transition-colors">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4.5 h-4.5 text-blue-600" />}
          </div>
        )}
      </div>

      {/* Name and Role text */}
      <div className="relative z-10 flex flex-col text-left min-w-0 pr-1">
        <span className="text-[13px] font-black text-slate-800 leading-tight truncate group-hover:text-blue-950 transition-colors">
          {user?.name || 'Chưa đăng nhập'}
        </span>
        <span className="text-[11px] font-bold text-[#2563eb] leading-tight truncate mt-0.5">
          {displayRole}
        </span>
      </div>

      {/* Down arrow indicator */}
      {showChevron && (
        <ChevronDown
          className={`relative z-10 w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      )}
    </button>
  );
};
