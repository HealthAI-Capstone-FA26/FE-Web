import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Outlet, Navigate } from 'react-router-dom';
import { doctorService } from '../services/doctor/doctor.service';
import { patientService } from '../services/patient/patient.service';
import { appointmentService } from '../services/appointment/appointment.service';

export const DashboardOverview: React.FC = () => {
  const { isLoggedIn, currentRole } = useAuth();

  useEffect(() => {
    if (isLoggedIn && (currentRole === 'RECEPTIONIST' || currentRole === 'ADMIN')) {
      // Proactively prefetch all data related to walk-in registration, patients and queue
      doctorService.prefetchDepartments().catch(() => {});
      patientService.prefetchPatients().catch(() => {});
      appointmentService.getAppointments().catch(() => {});
    }
  }, [isLoggedIn, currentRole]);

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout>
      <div className="animate-in fade-in duration-150">
        <Outlet />
      </div>
    </DashboardLayout>
  );
};

