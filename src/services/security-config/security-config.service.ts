import { apiFetch } from '../api';

export interface SecurityConfig {
  accessTokenTtlMins: number;
  refreshTokenTtlHours: number;
  maxSessionHours: number;
  maxLoginAttempts: number;
  lockoutDurationMins: number;
  mfaRequired: boolean;
}

export interface UpdateSecurityConfigDto {
  accessTokenTtlMins?: number;
  refreshTokenTtlHours?: number;
  maxSessionHours?: number;
  maxLoginAttempts?: number;
  lockoutDurationMins?: number;
  mfaRequired?: boolean;
}

export const securityConfigService = {
  // Lấy các thông số bảo mật hiện tại (GET /admin/security-settings)
  async getConfig(): Promise<SecurityConfig> {
    return apiFetch<SecurityConfig>('/admin/security-settings', {
      method: 'GET',
    });
  },

  // Cập nhật (một phần) các thông số bảo mật (PATCH /admin/security-settings)
  async updateConfig(dto: UpdateSecurityConfigDto): Promise<SecurityConfig> {
    return apiFetch<SecurityConfig>('/admin/security-settings', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },
};
