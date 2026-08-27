import { apiFetch } from '../api';

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthUserResponse {
  userId: string;
  email: string;
  fullName: string;
  actorRole: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface LoginSuccessResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
}

export const authService = {
  // Bước 1 đăng ký: Gửi thông tin -> Nhận thông báo đã gửi OTP
  async register(data: RegisterDto): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Bước 2 đăng ký: Nhập OTP -> Tạo tài khoản thật
  async verifyRegisterOtp(data: VerifyOtpDto): Promise<{ message: string; user: AuthUserResponse }> {
    return apiFetch<{ message: string; user: AuthUserResponse }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Đăng nhập: Nhập Email/Password -> Nhận cặp JWT Token + Thông tin User
  async login(data: LoginDto): Promise<LoginSuccessResponse> {
    return apiFetch<LoginSuccessResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Cấp lại Access Token
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    return apiFetch<{ accessToken: string }>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  // Đăng xuất
  async logout(): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  // Quên mật khẩu - Bước 1: Gửi OTP
  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Quên mật khẩu - Bước 2: Xác thực OTP -> Nhận resetToken
  async verifyForgotPasswordOtp(email: string, otp: string): Promise<{ message: string; resetToken: string }> {
    return apiFetch<{ message: string; resetToken: string }>('/auth/forgot-password/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  // Quên mật khẩu - Bước 3: Đặt mật khẩu mới
  async resetPassword(resetToken: string, newPassword: string, confirmNewPassword?: string): Promise<{ message: string }> {
    const confirm = confirmNewPassword && confirmNewPassword.trim() ? confirmNewPassword : newPassword;
    return apiFetch<{ message: string }>('/auth/forgot-password/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        resetToken,
        newPassword,
        confirmNewPassword: confirm,
      }),
    });
  },

  // Đổi mật khẩu (khi đã đăng nhập)
  async changePassword(oldPassword: string, newPassword: string, confirmNewPassword?: string): Promise<{ message: string }> {
    const confirm = confirmNewPassword && confirmNewPassword.trim() ? confirmNewPassword : newPassword;
    return apiFetch<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        oldPassword,
        newPassword,
        confirmNewPassword: confirm,
      }),
    });
  },
};
