import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

export const PatientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};
