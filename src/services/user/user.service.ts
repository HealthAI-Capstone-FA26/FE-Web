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

export interface UpdateProfileData {
  fullName?: string;
  phoneNumber?: string;
  actorRole?: string;
  additionalProfile?: Record<string, any>;
  avatarFile?: File;
}

export const userService = {
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
};
