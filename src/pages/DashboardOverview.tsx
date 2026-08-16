import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ROLE_NAV_CONFIG } from '../types/dashboard';

// Role View Modules
import { ReceptionCheckinView } from '../modules/reception/ReceptionCheckinView';
import { ReceptionWalkinBookingView } from '../modules/reception/ReceptionWalkinBookingView';
import { ReceptionBillingView } from '../modules/reception/ReceptionBillingView';

import { NurseQueueView } from '../modules/nurse/NurseQueueView';

import { DoctorEMRView } from '../modules/doctor/DoctorEMRView';
import { DoctorDiagnosisView } from '../modules/doctor/DoctorDiagnosisView';
import { DoctorPrescriptionView } from '../modules/doctor/DoctorPrescriptionView';

import { LabOrdersView } from '../modules/lab/LabOrdersView';

import { AdminRealtimeMonitorView } from '../modules/admin/AdminRealtimeMonitorView';

import { PatientPortalAppointmentsView } from '../modules/patient/PatientPortalAppointmentsView';

export const DashboardOverview: React.FC = () => {
  const { currentRole } = useAuth();
  const navGroups = ROLE_NAV_CONFIG[currentRole] || ROLE_NAV_CONFIG.DOCTOR;
  const initialDefaultTab = navGroups[0]?.items[0]?.id || 'doc_emr_ai';

  const [activeTabId, setActiveTabId] = useState<string>(initialDefaultTab);

  // Sync default tab when role changes
  useEffect(() => {
    const newDefault = navGroups[0]?.items[0]?.id || 'doc_emr_ai';
    setActiveTabId(newDefault);
  }, [currentRole]);

  const renderActiveView = () => {
    switch (activeTabId) {
      // RECEPTION TABS
      case 'rec_checkin':
      case 'rec_queue':
        return <ReceptionCheckinView />;
      case 'rec_booking':
        return <ReceptionWalkinBookingView />;
      case 'rec_billing':
      case 'rec_invoice':
        return <ReceptionBillingView />;

      // NURSE TABS
      case 'nurse_vitals_queue':
      case 'nurse_vitals_input':
      case 'nurse_alerts':
        return <NurseQueueView />;

      // DOCTOR TABS
      case 'doc_emr_ai':
      case 'doc_queue':
        return <DoctorEMRView />;
      case 'doc_icd10':
        return <DoctorDiagnosisView />;
      case 'doc_prescription':
        return <DoctorPrescriptionView />;

      // LAB TABS
      case 'lab_orders':
      case 'lab_upload':
      case 'lab_alerts':
        return <LabOrdersView />;

      // ADMIN TABS
      case 'admin_monitor':
      case 'admin_reports':
      case 'admin_audit':
      case 'admin_fhir':
        return <AdminRealtimeMonitorView />;

      // PATIENT TABS
      case 'pat_appointments':
      case 'pat_records':
      default:
        return <PatientPortalAppointmentsView />;
    }
  };

  return (
    <DashboardLayout activeTabId={activeTabId} onSelectTab={(tabId) => setActiveTabId(tabId)}>
      <div className="animate-in fade-in duration-150">
        {renderActiveView()}
      </div>
    </DashboardLayout>
  );
};
