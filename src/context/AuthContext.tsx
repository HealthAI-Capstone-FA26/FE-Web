import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types/auth';

const MOCK_USERS: Record<UserRole, UserProfile> = {
  PATIENT: {
    id: 'P-90234',
    name: 'Khưu Trọng Quân',
    email: 'quan.khuu@gmail.com',
    role: 'PATIENT',
    roleTitle: 'Bệnh nhân',
    phone: '0902 357 872',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
  },
  RECEPTION: {
    id: 'ST-101',
    name: 'Nguyễn Văn Minh',
    email: 'minh.reception@tamanh.vn',
    role: 'RECEPTION',
    roleTitle: 'Lễ tân / Thu ngân',
    staffCode: 'REC-001',
    department: 'Quầy Tiếp Nhận & Thu Ngân 01'
  },
  NURSE: {
    id: 'ST-102',
    name: 'Trần Thị Mai',
    email: 'mai.nurse@tamanh.vn',
    role: 'NURSE',
    roleTitle: 'Điều dưỡng viên',
    staffCode: 'NUR-005',
    department: 'Phòng Kiểm tra Sinh hiệu 102'
  },
  DOCTOR: {
    id: 'ST-103',
    name: 'BS. CKII. Nguyễn Quang Huy',
    email: 'huy.doctor@tamanh.vn',
    role: 'DOCTOR',
    roleTitle: 'Bác sĩ Thăm khám & Chẩn đoán',
    staffCode: 'DOC-088',
    department: 'Khoa Nội Tổng Hợp - Phòng 305'
  },
  LAB: {
    id: 'ST-104',
    name: 'KTV. Trương Lê Danh Thái',
    email: 'thai.lab@tamanh.vn',
    role: 'LAB',
    roleTitle: 'Kỹ thuật viên Phòng Lab',
    staffCode: 'LAB-012',
    department: 'Trung tâm Xét nghiệm & Cận Lâm Sàng'
  },
  ADMIN: {
    id: 'ST-999',
    name: 'Nguyễn Bá Anh Nguyên',
    email: 'nguyen.admin@tamanh.vn',
    role: 'ADMIN',
    roleTitle: 'Quản trị hệ thống (System Admin)',
    staffCode: 'ADM-001',
    department: 'Ban Điều Hành & Quản Trị Hệ Thống'
  }
};

interface AuthContextType {
  user: UserProfile | null;
  currentRole: UserRole;
  isLoggedIn: boolean;
  switchRole: (role: UserRole) => void;
  login: (email: string, role: UserRole) => void;
  loginWithTokens: (accessToken: string, refreshToken: string, backendUser: { userId: string; email: string; fullName: string; actorRole: string; avatarUrl?: string; phoneNumber?: string }) => void;
  logout: () => void;
  allRoles: { role: UserRole; label: string; desc: string }[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('4am_active_role');
    return (saved as UserRole) || 'PATIENT';
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const savedLoggedIn = localStorage.getItem('4am_is_logged_in');
    return savedLoggedIn === 'true';
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('4am_user_data');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        // Fallback
      }
    }
    const savedLoggedIn = localStorage.getItem('4am_is_logged_in');
    if (savedLoggedIn === 'true') {
      return MOCK_USERS[currentRole];
    }
    return null;
  });

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('4am_active_role', currentRole);
      localStorage.setItem('4am_is_logged_in', 'true');
    } else {
      setUser(null);
      localStorage.removeItem('4am_is_logged_in');
      localStorage.removeItem('4am_user_name');
      localStorage.removeItem('4am_user_data');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }, [currentRole, isLoggedIn]);

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    setIsLoggedIn(true);
    const mockUser = MOCK_USERS[role];
    setUser(mockUser);
    localStorage.setItem('4am_user_data', JSON.stringify(mockUser));
  };

  const login = (_email: string, role: UserRole) => {
    switchRole(role);
  };

  const loginWithTokens = (
    accessToken: string,
    refreshToken: string,
    backendUser: { userId: string; email: string; fullName: string; actorRole: string; avatarUrl?: string; phoneNumber?: string }
  ) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);

    const mappedRole: UserRole =
      (backendUser.actorRole?.toUpperCase() as UserRole) in MOCK_USERS
        ? (backendUser.actorRole.toUpperCase() as UserRole)
        : 'PATIENT';

    const userProfile: UserProfile = {
      id: backendUser.userId,
      name: backendUser.fullName || backendUser.email,
      email: backendUser.email,
      role: mappedRole,
      roleTitle: mappedRole === 'PATIENT' ? 'Bệnh nhân' : 'Nhân viên Y tế',
      phone: backendUser.phoneNumber,
      avatar: backendUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    };

    setCurrentRole(mappedRole);
    setUser(userProfile);
    setIsLoggedIn(true);
    localStorage.setItem('4am_user_data', JSON.stringify(userProfile));
    localStorage.setItem('4am_user_name', userProfile.name);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('4am_is_logged_in');
    localStorage.removeItem('4am_user_name');
    localStorage.removeItem('4am_user_data');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const allRoles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'PATIENT', label: 'Bệnh nhân', desc: 'Đặt lịch, xem EMR & tải đơn thuốc PDF' },
    { role: 'RECEPTION', label: 'Lễ tân / Thu ngân', desc: 'Tiếp nhận, xếp hàng chờ & thu phí' },
    { role: 'NURSE', label: 'Điều dưỡng', desc: 'Đo & ghi nhận sinh hiệu, cảnh báo bất thường' },
    { role: 'DOCTOR', label: 'Bác sĩ khám', desc: 'Xem AI tóm tắt EMR, chỉ định, chẩn đoán ICD-10' },
    { role: 'LAB', label: 'KTV Phòng Lab', desc: 'Nhập kết quả xét nghiệm, upload ảnh DICOM' },
    { role: 'ADMIN', label: 'Quản trị viên', desc: 'Dashboard Realtime 7 bước, Audit log' }
  ];

  return (
    <AuthContext.Provider value={{ user, currentRole, isLoggedIn, switchRole, login, loginWithTokens, logout, allRoles }}>
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
