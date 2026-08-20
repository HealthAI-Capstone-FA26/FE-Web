import React from "react";

export interface BorderBeamProps {
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  colorVariant?: string;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({ children, className = '' }) => {
  return <div className={`relative ${className}`}>{children}</div>;
};

export default BorderBeam;
