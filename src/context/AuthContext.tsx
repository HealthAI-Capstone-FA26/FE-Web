import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types/auth';
import { authService } from '../services/auth/auth.service';
import { clearAuthStorage } from '../services/api';
import { doctorService } from '../services/doctor/doctor.service';
import { patientService } from '../services/patient/patient.service';
import { appointmentService } from '../services/appointment/appointment.service';

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  PATIENT: [
    'patient:read:own',
    'patient:update:own',
    'appointment:create:own',
    'appointment:read:own',
    'encounter:read:own',
    'observation:read:own',
    'observation:create:own',
  ],
  RECEPTIONIST: [
    'patient:read:all',
    'patient:create:all',
    'patient:update:all',
    'appointment:create:all',
    'appointment:read:all',
    'appointment:update:all',
    'queue-ticket:create:all',
    'queue-ticket:read:all',
    'claim:read:all',
  ],
  NURSE: [
    'patient:read:all',
    'observation:create:all',
    'observation:read:all',
    'queue-ticket:read:all',
    'queue-ticket:update:all',
  ],
  DOCTOR: [
    'patient:read:all',
    'encounter:create:all',
    'encounter:read:all',
    'encounter:update:all',
    'observation:read:all',
    'allergy:read:all',
    'condition:read:all',
    'medication:create:all',
  ],
  LAB: [
    'patient:read:all',
    'imaging-study:create:all',
    'imaging-study:read:all',
    'imaging-study:update:all',
    'observation:create:all',
  ],
  ADMIN: [
    'security-config:read:all',
    'security-config:update:all',
    'role:read:all',
    'role:update:all',
    'user:read:all',
    'user:create:all',
    'user:update:all',
    'patient:read:all',
    'doctor:read:all',
  ],
};

export const ROLE_TITLES: Record<UserRole, string> = {
  PATIENT: 'Bệnh nhân',
  RECEPTIONIST: 'Lễ tân / Thu ngân',
  NURSE: 'Điều dưỡng viên',
  DOCTOR: 'Bác sĩ Thăm khám & Chẩn đoán',
  LAB: 'Kỹ thuật viên Phòng Lab',
  ADMIN: 'System admin',
};

interface AuthContextType {
  user: UserProfile | null;
  currentRole: UserRole;
  isLoggedIn: boolean;
  permissions: string[];
  can: (permissionCode: string) => boolean;
  switchRole: (role: UserRole) => void;
  login: (email: string, role: UserRole) => void;
  loginWithTokens: (accessToken: string, refreshToken: string, backendUser: { userId: string; email: string; fullName: string; actorRole: string; avatarUrl?: string; phoneNumber?: string; permissions?: string[] }) => void;
  logout: () => void;
  updateUserProfile: (partial: { name?: string; phone?: string; avatar?: string }) => void;
  allRoles: { role: UserRole; label: string; desc: string }[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Dọn phiên đăng nhập cũ lưu trong localStorage (nếu có) để đóng tab/trình duyệt là tự đăng xuất
  useEffect(() => {
    for (const key of ['access_token', 'refresh_token', '4am_is_logged_in', '4am_active_role', '4am_user_data', '4am_user_name']) {
      localStorage.removeItem(key);
    }
  }, []);

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = sessionStorage.getItem('4am_active_role');
    return (saved as UserRole) || 'PATIENT';
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const savedLoggedIn = sessionStorage.getItem('4am_is_logged_in');
    return savedLoggedIn === 'true';
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = sessionStorage.getItem('4am_user_data');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        // Fallback
      }
    }
    const savedLoggedIn = sessionStorage.getItem('4am_is_logged_in');
    if (savedLoggedIn === 'true' && savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (isLoggedIn) {
      sessionStorage.setItem('4am_active_role', currentRole);
      sessionStorage.setItem('4am_is_logged_in', 'true');

      if (currentRole === 'RECEPTIONIST' || currentRole === 'ADMIN') {
        patientService.getAllPatients().catch(() => {});
        appointmentService.getAppointments().catch(() => {});
      }
    } else {
      setUser(null);
      clearAuthStorage();
    }
  }, [currentRole, isLoggedIn]);

  const switchRole = (role: UserRole) => {
    appointmentService.invalidateCache();
    setCurrentRole(role);
    sessionStorage.setItem('4am_active_role', role);

    if (role === 'RECEPTIONIST' || role === 'ADMIN') {
      patientService.getAllPatients(undefined, true).catch(() => {});
      appointmentService.getAppointments().catch(() => {});
    }
  };

  const login = (_email: string, role: UserRole) => {
    switchRole(role);
  };

  const userPermissions = user?.permissions || DEFAULT_ROLE_PERMISSIONS[currentRole] || [];

  const can = (permissionCode: string): boolean => {
    if (!isLoggedIn || !user) return false;
    if (user.role === 'ADMIN') return true;
    return userPermissions.includes(permissionCode);
  };

  const loginWithTokens = (
    accessToken: string,
    refreshToken: string,
    backendUser: { userId: string; email: string; fullName: string; actorRole: string; avatarUrl?: string; phoneNumber?: string; permissions?: string[] }
  ) => {
    sessionStorage.setItem('access_token', accessToken);
    sessionStorage.setItem('refresh_token', refreshToken);

    let mappedRole: UserRole = 'PATIENT';
    let rawRole = backendUser.actorRole?.toUpperCase();
    if (rawRole === 'RECEPTION') rawRole = 'RECEPTIONIST';
    if (rawRole === 'LAB_STAFF') rawRole = 'LAB';

    if (rawRole && rawRole in ROLE_TITLES) {
      mappedRole = rawRole as UserRole;
    } else if (backendUser.email && backendUser.email.toLowerCase().includes('admin')) {
      mappedRole = 'ADMIN';
    } else if (backendUser.email && backendUser.email.toLowerCase().includes('doctor')) {
      mappedRole = 'DOCTOR';
    } else if (backendUser.email && (backendUser.email.toLowerCase().includes('reception') || backendUser.email.toLowerCase().includes('letan'))) {
      mappedRole = 'RECEPTIONIST';
    } else if (backendUser.email && backendUser.email.toLowerCase().includes('nurse')) {
      mappedRole = 'NURSE';
    } else if (backendUser.email && backendUser.email.toLowerCase().includes('lab')) {
      mappedRole = 'LAB';
    }

    const userProfile: UserProfile = {
      id: backendUser.userId,
      name: backendUser.fullName || backendUser.email,
      email: backendUser.email,
      role: mappedRole,
      roleTitle: ROLE_TITLES[mappedRole] || 'Thành viên',
      phone: backendUser.phoneNumber,
      avatar: backendUser.avatarUrl || '',
      permissions: backendUser.permissions || DEFAULT_ROLE_PERMISSIONS[mappedRole] || [],
    };

    setCurrentRole(mappedRole);
    setUser(userProfile);
    setIsLoggedIn(true);
    appointmentService.invalidateCache();
    sessionStorage.setItem('4am_active_role', mappedRole);
    sessionStorage.setItem('4am_is_logged_in', 'true');
    sessionStorage.setItem('4am_user_data', JSON.stringify(userProfile));
    sessionStorage.setItem('4am_user_name', userProfile.name);

    if (mappedRole === 'RECEPTIONIST' || mappedRole === 'ADMIN') {
      patientService.getAllPatients(undefined, true).catch(() => {});
      appointmentService.getAppointments().catch(() => {});
    }

    // Nếu là Bác sĩ → tự động tra doctorId & hồ sơ bác sĩ từ userId và lưu vào profile + cache
    if (mappedRole === 'DOCTOR') {
      doctorService.getDoctorByUserId(backendUser.userId).then((doctor) => {
        if (doctor) {
          const updatedProfile = { ...userProfile, doctorId: doctor.doctorId };
          setUser(updatedProfile);
          sessionStorage.setItem('4am_user_data', JSON.stringify(updatedProfile));
          sessionStorage.setItem('4am_cached_doctor', JSON.stringify(doctor));
        }
      }).catch(() => {});
    }
  };

  const logout = () => {
    appointmentService.invalidateCache();
    authService.logout().catch(() => {});
    setIsLoggedIn(false);
    setUser(null);
    clearAuthStorage();
  };

  const updateUserProfile = (partial: { name?: string; phone?: string; avatar?: string }) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        ...(partial.name !== undefined && { name: partial.name }),
        ...(partial.phone !== undefined && { phone: partial.phone }),
        ...(partial.avatar !== undefined && { avatar: partial.avatar }),
      };
      sessionStorage.setItem('4am_user_data', JSON.stringify(updated));
      if (partial.name) {
        sessionStorage.setItem('4am_user_name', partial.name);
      }
      return updated;
    });
  };

  const allRoles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'PATIENT', label: 'Bệnh nhân', desc: 'Đặt lịch, xem EMR & tải đơn thuốc PDF' },
    { role: 'RECEPTIONIST', label: 'Lễ tân / Thu ngân', desc: 'Tiếp nhận, xếp hàng chờ & thu phí' },
    { role: 'NURSE', label: 'Điều dưỡng', desc: 'Đo & ghi nhận sinh hiệu, cảnh báo bất thường' },
    { role: 'DOCTOR', label: 'Bác sĩ khám', desc: 'Xem AI tóm tắt EMR, chỉ định, chẩn đoán ICD-10' },
    { role: 'LAB', label: 'KTV Phòng Lab', desc: 'Nhập kết quả xét nghiệm, upload ảnh DICOM' },
    { role: 'ADMIN', label: 'Quản trị viên', desc: 'Dashboard Realtime 7 bước, Audit log' }
  ];

  return (
    <AuthContext.Provider value={{ user, currentRole, isLoggedIn, permissions: userPermissions, can, switchRole, login, loginWithTokens, logout, updateUserProfile, allRoles }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
