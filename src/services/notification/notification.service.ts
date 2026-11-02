import { apiFetch } from '../api';

export type NotificationChannelCode = 'in_app' | 'email' | 'sms' | 'zalo_oa';

export type NotificationTypeCode =
  | 'registration_confirmed'
  | 'queue_called'
  | 'invoice_issued'
  | 'payment_success'
  | 'diagnostics_completed'
  | 'critical_value_alert'
  | 'ecg_anomaly_alert'
  | 'prescription_ready'
  | 'follow_up_reminder'
  | 'appointment_reminder';

export type NotificationStatus = 'queued' | 'sent' | 'failed' | 'cancelled';

export interface NotificationItem {
  notificationId: string;
  recipientUserId: string | null;
  recipientPatientId: string | null;
  notificationType: NotificationTypeCode | string;
  channel: NotificationChannelCode;
  referenceType: string | null;
  referenceId: string | null;
  title: string;
  content: string;
  status: NotificationStatus;
  scheduledAt: string | null;
  retryCount: number;
  errorMessage: string | null;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ListNotificationsParams {
  channel?: NotificationChannelCode;
  notificationType?: NotificationTypeCode | string;
  status?: NotificationStatus;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface ListNotificationsResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  unread: number;
}

export interface MarkAllReadResponse {
  updated: number;
}

export interface NotificationPreferenceItem {
  preferenceId?: string;
  userId?: string;
  channel: NotificationChannelCode;
  notificationType: NotificationTypeCode | '*';
  isEnabled: boolean;
  destination?: string | null;
  updatedAt?: string;
}

export interface NotificationPreferencesResponse {
  channels: NotificationChannelCode[];
  notificationTypes: Array<NotificationTypeCode | '*'>;
  preferences: NotificationPreferenceItem[];
}

export const notificationService = {
  /**
   * Lấy danh sách thông báo của người dùng đang đăng nhập
   */
  async getList(params: ListNotificationsParams = {}): Promise<ListNotificationsResponse> {
    const searchParams = new URLSearchParams();

    if (params.channel) searchParams.set('channel', params.channel);
    if (params.notificationType) searchParams.set('notificationType', params.notificationType);
    if (params.status) searchParams.set('status', params.status);
    if (params.unreadOnly !== undefined) searchParams.set('unreadOnly', String(params.unreadOnly));
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));

    const queryString = searchParams.toString();
    const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;

    return apiFetch<ListNotificationsResponse>(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Lấy số lượng thông báo in-app chưa đọc
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return apiFetch<UnreadCountResponse>('/notifications/unread-count', {
      method: 'GET',
    });
  },

  /**
   * Đánh dấu 1 thông báo đã đọc
   */
  async markAsRead(notificationId: string): Promise<NotificationItem> {
    return apiFetch<NotificationItem>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * Đánh dấu tất cả thông báo in-app đã đọc
   */
  async markAllAsRead(): Promise<MarkAllReadResponse> {
    return apiFetch<MarkAllReadResponse>('/notifications/read-all', {
      method: 'PATCH',
    });
  },

  /**
   * Lấy cài đặt nhận thông báo
   */
  async getPreferences(): Promise<NotificationPreferencesResponse> {
    return apiFetch<NotificationPreferencesResponse>('/notifications/preferences', {
      method: 'GET',
    });
  },

  /**
   * Cập nhật cài đặt nhận thông báo
   */
  async updatePreferences(
    preferences: Array<{
      channel: NotificationChannelCode;
      notificationType: NotificationTypeCode | '*';
      isEnabled: boolean;
      destination?: string;
    }>
  ): Promise<NotificationPreferencesResponse> {
    return apiFetch<NotificationPreferencesResponse>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    });
  },
};

