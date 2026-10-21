// Utility functions for booking, date/time calculation, and queue tickets

/**
 * Returns current date or specified date formatted as YYYY-MM-DD in local time
 * Avoids 1-day timezone discrepancy caused by toISOString() in UTC+7 (0h-7h AM)
 */
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats Queue Ticket into standard display code (e.g., A005, B012)
 */
export const formatTicketCode = (
  ticket?: { ticketPrefix?: string | null; ticketNumber?: number | string | null } | null
): string => {
  if (!ticket) return '';
  const prefix = ticket.ticketPrefix || '';
  const num = ticket.ticketNumber != null ? String(ticket.ticketNumber).padStart(3, '0') : '';
  return `${prefix}${num}`;
};

/**
 * Translates queue ticket status into friendly Vietnamese label
 */
export const getQueueStatusLabel = (status?: string | null): string => {
  switch (status) {
    case 'waiting':
      return 'Đang chờ';
    case 'called':
      return 'Đang gọi';
    case 'serving':
    case 'in_progress':
      return 'Đang tiếp đón';
    case 'skipped':
      return 'Bỏ qua';
    case 'done':
    case 'completed':
      return 'Hoàn thành';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status || 'Đang chờ';
  }
};

/**
 * Checks if a slot time has already passed on the specified date.
 * Accurately aligns with UTC wall-clock hours stored in backend (e.g. 07:30Z = 07:30 local).
 */
export const isSlotPassed = (
  slotStartTime?: string | null,
  selectedDate?: string | null,
  bufferMinutes: number = 0
): boolean => {
  if (!slotStartTime || !selectedDate) return false;

  const todayStr = getLocalDateString();
  if (selectedDate < todayStr) return true;
  if (selectedDate > todayStr) return false;

  try {
    const slotDate = new Date(slotStartTime);
    // Hours and minutes stored in slotStartTime (UTC wall-clock)
    const slotHours = slotDate.getUTCHours();
    const slotMinutes = slotDate.getUTCMinutes();
    const slotTotalMinutes = slotHours * 60 + slotMinutes;

    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    return slotTotalMinutes <= currentTotalMinutes + bufferMinutes;
  } catch {
    return false;
  }
};

/**
 * Filters out slots that have already passed if the selected date is today
 */
export const filterFutureSlots = <T extends { slotStartTime: string }>(
  slots: T[],
  selectedDate: string,
  bufferMinutes: number = 0
): T[] => {
  return slots.filter((slot) => !isSlotPassed(slot.slotStartTime, selectedDate, bufferMinutes));
};

/**
 * Helper to format slot range (HH:mm - HH:mm) from ISO strings
 */
export const formatSlotTimeRange = (startTime?: string, endTime?: string): string => {
  if (!startTime) return '';
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  };
  const start = formatTime(startTime);
  const end = endTime ? formatTime(endTime) : '';
  return end ? `${start} - ${end}` : start;
};
