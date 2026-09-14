import React from 'react';

interface DepartmentIconProps {
  className?: string;
}

export const DepartmentIcon: React.FC<DepartmentIconProps> = ({ className = 'w-4 h-4 object-contain inline-block shrink-0' }) => {
  return (
    <img
      src="/images/department_icon.png"
      alt="Khoa / Chuyên khoa"
      className={className}
    />
  );
};
