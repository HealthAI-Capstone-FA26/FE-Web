import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Activity,
  CreditCard,
  FlaskConical,
  Pill,
  CalendarClock,
  Megaphone,
  UserCheck,
  Loader2,
  Inbox,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';
import type { NotificationItem } from '../../services/notification/notification.service';
import type { UserRole } from '../../types/auth';
import { ROLE_DEFAULT_PATHS } from '../../types/dashboard';

/**
 * Định dạng thời gian tương đối tiếng Việt (vd: "Vừa xong", "5 phút trước", "2 giờ trước")
 */
function formatRelativeTime(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Vừa xong';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Lấy cấu hình icon và màu sắc tương ứng với từng loại notification_type
 */
function getNotificationVisual(notificationType: string) {
  switch (notificationType) {
    case 'critical_value_alert':
      return {
        icon: AlertTriangle,
        bgColor: 'bg-rose-100',
        iconColor: 'text-rose-600',
        badgeText: 'Khẩn cấp',
        badgeClass: 'bg-rose-100 text-rose-700 border-rose-200',
      };
    case 'ecg_anomaly_alert':
      return {
        icon: Activity,
        bgColor: 'bg-amber-100',
        iconColor: 'text-amber-600',
        badgeText: 'Cảnh báo ECG AI',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'diagnostics_completed':
      return {
        icon: FlaskConical,
        bgColor: 'bg-purple-100',
        iconColor: 'text-purple-600',
        badgeText: 'Cận lâm sàng',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    case 'invoice_issued':
    case 'payment_success':
      return {
        icon: CreditCard,
        bgColor: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        badgeText: 'Viện phí',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'prescription_ready':
      return {
        icon: Pill,
        bgColor: 'bg-teal-100',
        iconColor: 'text-teal-600',
        badgeText: 'Đơn thuốc',
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
      };
    case 'queue_called':
      return {
        icon: Megaphone,
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
        badgeText: 'Gọi số',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'registration_confirmed':
      return {
        icon: UserCheck,
        bgColor: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        badgeText: 'Tiếp nhận',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    case 'appointment_reminder':
    case 'follow_up_reminder':
    default:
      return {
        icon: CalendarClock,
        bgColor: 'bg-sky-100',
        iconColor: 'text-sky-600',
        badgeText: 'Lịch hẹn',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      };
  }
}

/**
 * Xác định đường dẫn điều hướng khi người dùng click vào thông báo theo Role
 */
function resolveTargetRoute(item: NotificationItem, role: UserRole): string {
  const type = item.notificationType;

  if (role === 'DOCTOR') {
    if (
      type === 'critical_value_alert' ||
      type === 'ecg_anomaly_alert' ||
      type === 'diagnostics_completed' ||
      type === 'queue_called'
    ) {
      return '/bac-si/danh-sach-kham';
    }
    return '/bac-si/danh-sach-kham';
  }

  if (role === 'NURSE') {
    if (type === 'critical_value_alert') {
      return '/dieu-duong/canh-bao';
    }
    return '/dieu-duong/hang-cho-sinh-hieu';
  }

  if (role === 'RECEPTIONIST') {
    if (type === 'invoice_issued' || type === 'payment_success') {
      return '/tiep-nhan/thu-phi';
    }
    if (type === 'queue_called') {
      return '/tiep-nhan/goi-so';
    }
    return '/tiep-nhan/danh-sach-cho';
  }

  if (role === 'LAB') {
    return '/xet-nghiem/hang-cho-xet-nghiem';
  }

  if (role === 'ADMIN') {
    return '/quan-tri/nhat-ky-he-thong';
  }

  // PATIENT
  switch (type) {
    case 'prescription_ready':
    case 'follow_up_reminder':
      return '/benh-nhan/ho-so-don-thuoc';
    case 'diagnostics_completed':
      return '/benh-nhan/ho-so-y-te';
    case 'appointment_reminder':
    case 'registration_confirmed':
    case 'queue_called':
    case 'invoice_issued':
    case 'payment_success':
      return '/benh-nhan/lich-hen';
    default:
      return ROLE_DEFAULT_PATHS[role] || '/benh-nhan/ho-so';
  }
}

export const NotificationDropdown: React.FC = () => {
  const { currentRole } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    unreadOnly,
    setUnreadOnly,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ pollIntervalMs: 30000, limit: 20 });

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Tải danh sách thông báo mỗi khi mở dropdown hoặc đổi tab lọc
  const handleToggleDropdown = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      fetchNotifications(unreadOnly);
      fetchUnreadCount();
    }
  };

  const handleTabChange = (filterUnread: boolean) => {
    setUnreadOnly(filterUnread);
    fetchNotifications(filterUnread);
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.readAt) {
      await markAsRead(item.notificationId);
    }
    setIsOpen(false);
    const targetPath = resolveTargetRoute(item, currentRole);
    navigate(targetPath);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Quả chuông */}
      <button
        type="button"
        onClick={handleToggleDropdown}
        title="Thông báo"
        className="relative p-2 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Khung Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-800">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-100 text-rose-700 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center space-x-1 text-xs font-medium text-blue-600 hover:text-blue-800 cursor-pointer bg-transparent border-none"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Tabs: Tất cả / Chưa đọc */}
          <div className="px-4 py-2 border-b border-slate-100 flex items-center space-x-2 bg-white">
            <button
              type="button"
              onClick={() => handleTabChange(false)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border-none ${
                !unreadOnly
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => handleTabChange(true)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border-none ${
                unreadOnly
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Chưa đọc
            </button>
          </div>

          {/* Danh sách thông báo */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mb-2 text-blue-600" />
                <span className="text-xs">Đang tải thông báo...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2 text-slate-400">
                  <Inbox className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-600">
                  {unreadOnly ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Các thông báo mới về lịch khám, xét nghiệm và viện phí sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const visual = getNotificationVisual(item.notificationType);
                const IconComponent = visual.icon;
                const isUnread = !item.readAt;

                return (
                  <button
                    key={item.notificationId}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left px-4 py-3 flex items-start space-x-3 transition-colors cursor-pointer border-none ${
                      isUnread
                        ? 'bg-blue-50/50 hover:bg-blue-50'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Icon phân loại */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${visual.bgColor} ${visual.iconColor}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Nội dung */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded border ${visual.badgeClass}`}
                        >
                          {visual.badgeText}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatRelativeTime(item.sentAt || item.createdAt)}
                        </span>
                      </div>

                      <p
                        className={`text-xs truncate ${
                          isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                        }`}
                      >
                        {item.title}
                      </p>

                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.content}
                      </p>
                    </div>

                    {/* Chấm xanh chưa đọc */}
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

