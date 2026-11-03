import { useState, useEffect, useCallback, useRef } from 'react';
import {
  notificationService,
  type NotificationItem,
} from '../services/notification/notification.service';
import { useAuth } from '../context/AuthContext';

export interface UseNotificationsOptions {
  /** Chu kỳ polling số thông báo chưa đọc (mặc định 30 giây) */
  pollIntervalMs?: number;
  /** Số lượng thông báo tải mỗi lần mở dropdown (mặc định 15) */
  limit?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { pollIntervalMs = 60000, limit = 15 } = options;
  const { isLoggedIn, user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const hasValidToken = useCallback(() => {
    return isLoggedIn && Boolean(localStorage.getItem('access_token'));
  }, [isLoggedIn]);

  /**
   * Lấy số lượng thông báo in-app chưa đọc
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!hasValidToken()) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await notificationService.getUnreadCount();
      if (isMountedRef.current && typeof res?.unread === 'number') {
        setUnreadCount(res.unread);
      }
    } catch {
      // Bỏ qua lỗi mạng/token tạm thời khi chạy ngầm
    }
  }, [hasValidToken]);

  /**
   * Lấy danh sách thông báo
   */
  const fetchNotifications = useCallback(
    async (filterUnread: boolean = unreadOnly) => {
      if (!hasValidToken()) {
        setNotifications([]);
        setTotal(0);
        return;
      }
      setIsLoading(true);
      try {
        const res = await notificationService.getList({
          channel: 'in_app',
          unreadOnly: filterUnread ? true : undefined,
          page: 1,
          limit,
        });
        if (isMountedRef.current) {
          setNotifications(Array.isArray(res?.items) ? res.items : []);
          setTotal(typeof res?.total === 'number' ? res.total : 0);
        }
      } catch {
        // Giữ nguyên danh sách cũ nếu lỗi tạm thời
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [hasValidToken, unreadOnly, limit]
  );

  /**
   * Đánh dấu 1 thông báo đã đọc
   */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!hasValidToken()) return;

      const target = notifications.find((n) => n.notificationId === notificationId);
      const wasUnread = target && !target.readAt;

      // Optimistic update trên UI
      const nowIso = new Date().toISOString();
      setNotifications((prev) => {
        if (unreadOnly) {
          return prev.filter((item) => item.notificationId !== notificationId);
        }
        return prev.map((item) =>
          item.notificationId === notificationId
            ? { ...item, readAt: item.readAt ?? nowIso }
            : item
        );
      });

      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await notificationService.markAsRead(notificationId);
      } catch {
        // Đồng bộ lại với server nếu thất bại
        fetchUnreadCount();
      }
    },
    [hasValidToken, notifications, unreadOnly, fetchUnreadCount]
  );

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  const markAllAsRead = useCallback(async () => {
    if (!hasValidToken()) return;

    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      unreadOnly ? [] : prev.map((item) => ({ ...item, readAt: item.readAt ?? nowIso }))
    );
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch {
      fetchUnreadCount();
    }
  }, [hasValidToken, unreadOnly, fetchUnreadCount]);

  // Tự động lấy số thông báo chưa đọc khi đăng nhập / đổi tài khoản và polling định kỳ
  useEffect(() => {
    if (!hasValidToken()) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    fetchUnreadCount();

    if (pollIntervalMs <= 0) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      fetchUnreadCount();
    }, pollIntervalMs);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [hasValidToken, user?.id, pollIntervalMs, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    total,
    isLoading,
    unreadOnly,
    setUnreadOnly,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}

