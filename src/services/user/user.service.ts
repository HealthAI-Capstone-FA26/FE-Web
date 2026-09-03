import { apiFetch } from '../api';

export interface UserProfileResponse {
  profileId: string;
  userId: string;
  actorRole: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  additionalProfile?: Record<string, any>;
  fhirResourceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserItemResponse {
  userId: string;
  email: string;
  status: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  profileId?: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  actorRole: string;
  additionalProfile?: Record<string, any>;
}

export interface UserSearchQuery {
  search?: string;
  actorRole?: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phoneNumber?: string;
  actorRole?: string;
  additionalProfile?: Record<string, any>;
  avatarFile?: File;
}

export const userService = {
  // Lấy danh sách toàn bộ người dùng trong hệ thống (GET /users)
  async getUsers(params?: UserSearchQuery): Promise<UserItemResponse[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.actorRole && params.actorRole !== 'ALL') searchParams.append('actorRole', params.actorRole);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';
    return apiFetch<UserItemResponse[]>(endpoint, { method: 'GET' });
  },

  // Xem chi tiết hồ sơ tài khoản người dùng (GET /users/:userId)
  async getUserById(userId: string): Promise<UserItemResponse> {
    return apiFetch<UserItemResponse>(`/users/${userId}`, { method: 'GET' });
  },

  // Cập nhật thông tin profile của người dùng hiện tại (PATCH /users/me)
  async updateMyProfile(data: UpdateProfileData): Promise<UserProfileResponse> {
    const formData = new FormData();

    if (data.fullName !== undefined) {
      formData.append('fullName', data.fullName);
    }
    if (data.phoneNumber !== undefined) {
      formData.append('phoneNumber', data.phoneNumber);
    }
    if (data.actorRole !== undefined) {
      formData.append('actorRole', data.actorRole);
    }
    if (data.additionalProfile !== undefined) {
      formData.append('additionalProfile', JSON.stringify(data.additionalProfile));
    }
    if (data.avatarFile) {
      formData.append('file', data.avatarFile);
    }

    return apiFetch<UserProfileResponse>('/users/me', {
      method: 'PATCH',
      body: formData,
    });
  },

  // Admin cập nhật thông tin profile của người dùng khác (PATCH /users/:userId)
  async updateUserById(userId: string, data: UpdateProfileData): Promise<UserProfileResponse> {
    const formData = new FormData();

    if (data.fullName !== undefined) {
      formData.append('fullName', data.fullName);
    }
    if (data.phoneNumber !== undefined) {
      formData.append('phoneNumber', data.phoneNumber);
    }
    if (data.actorRole !== undefined) {
      formData.append('actorRole', data.actorRole);
    }
    if (data.additionalProfile !== undefined) {
      formData.append('additionalProfile', JSON.stringify(data.additionalProfile));
    }
    if (data.avatarFile) {
      formData.append('file', data.avatarFile);
    }

    return apiFetch<UserProfileResponse>(`/users/${userId}`, {
      method: 'PATCH',
      body: formData,
    });
  },
};
