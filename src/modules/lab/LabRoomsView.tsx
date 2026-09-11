import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Users,
  UserPlus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Star,
  Layers,
  MapPin,
} from 'lucide-react';
import {
  labRoomService,
  type LabRoomItem,
  type LabStaffRoomAssignment,
} from '../../services/lab/lab-room.service';
import { userService, type UserItemResponse } from '../../services/user/user.service';

export const LabRoomsView: React.FC = () => {
  const [labRooms, setLabRooms] = useState<LabRoomItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Selected Lab Room for staff management modal
  const [selectedRoom, setSelectedRoom] = useState<LabRoomItem | null>(null);
  const [assignedStaff, setAssignedStaff] = useState<LabStaffRoomAssignment[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState<boolean>(false);

  // Available LAB_STAFF users for dropdown
  const [availableLabStaffUsers, setAvailableLabStaffUsers] = useState<UserItemResponse[]>([]);
  const [selectedStaffUserId, setSelectedStaffUserId] = useState<string>('');
  const [isPrimaryAssignment, setIsPrimaryAssignment] = useState<boolean>(true);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false);
  const [actionLoadingUserId, setActionLoadingUserId] = useState<string | null>(null);

  // Notification toast state
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch all active lab rooms
  const fetchLabRooms = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const rooms = await labRoomService.getLabRooms();
      setLabRooms(Array.isArray(rooms) ? rooms : []);
    } catch (err: any) {
      console.error('Lỗi tải danh mục phòng Lab:', err);
      showToast(err.message || 'Không thể tải danh mục phòng Lab từ server', 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabRooms();
  }, [fetchLabRooms]);

  // Fetch assigned staff when selecting a room
  const handleOpenStaffModal = async (room: LabRoomItem) => {
    setSelectedRoom(room);
    setIsLoadingStaff(true);
    try {
      const [staffList, labUsers] = await Promise.all([
        labRoomService.getLabRoomStaff(room.labRoomId),
        userService.getUsers({ actorRole: 'LAB_STAFF' }).catch(() => []),
      ]);
      setAssignedStaff(Array.isArray(staffList) ? staffList : []);
      setAvailableLabStaffUsers(Array.isArray(labUsers) ? labUsers : []);
      if (labUsers.length > 0) {
        setSelectedStaffUserId(labUsers[0].userId);
      }
    } catch (err: any) {
      console.error('Lỗi tải kỹ thuật viên phòng Lab:', err);
      showToast(err.message || 'Lỗi khi lấy danh sách kỹ thuật viên', 'error');
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedRoom || !selectedStaffUserId) {
      showToast('Vui lòng chọn kỹ thuật viên để phân công', 'error');
      return;
    }
    setIsSubmittingAssign(true);
    try {
      await labRoomService.assignStaffToLabRoom(selectedRoom.labRoomId, {
        userId: selectedStaffUserId,
        isPrimary: isPrimaryAssignment,
      });
      showToast('Phân công kỹ thuật viên vào phòng Lab thành công!', 'success');

      // Refresh staff list
      const staffList = await labRoomService.getLabRoomStaff(selectedRoom.labRoomId);
      setAssignedStaff(Array.isArray(staffList) ? staffList : []);
    } catch (err: any) {
      showToast(err.message || 'Không thể phân công kỹ thuật viên vào phòng này', 'error');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const handleRemoveStaff = async (userId: string) => {
    if (!selectedRoom) return;
    setActionLoadingUserId(userId);
    try {
      await labRoomService.removeStaffFromLabRoom(selectedRoom.labRoomId, userId);
      showToast('Đã gỡ phân công kỹ thuật viên khỏi phòng thành công!', 'success');

      setAssignedStaff((prev) => prev.filter((s) => s.userId !== userId));
    } catch (err: any) {
      showToast(err.message || 'Không thể gỡ kỹ thuật viên', 'error');
    } finally {
      setActionLoadingUserId(null);
    }
  };

  const filteredRooms = labRooms.filter((r) => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      r.labRoomName.toLowerCase().includes(kw) ||
      r.labRoomCode.toLowerCase().includes(kw) ||
      (r.location && r.location.toLowerCase().includes(kw)) ||
      (r.description && r.description.toLowerCase().includes(kw))
    );
  });

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-200 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium transition-all duration-300 ${notification.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : notification.type === 'error'
                ? 'bg-rose-600 text-white shadow-rose-500/20'
                : 'bg-slate-800 text-white shadow-slate-900/20'
            }`}
        >
          {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {notification.type === 'info' && <Building2 className="w-5 h-5 flex-shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Danh Mục & Phân Công Phòng Lab (Lab Rooms)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Quản lý các phòng xét nghiệm chuyên khoa (Huyết học, Sinh hóa, CĐHA, Vi sinh) và phân công Kỹ Thuật Viên phụ trách.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLabRooms(false)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
            <span>Tải Lại Danh Mục</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Tổng Phòng Lab Active</span>
            <p className="text-xl font-bold text-slate-800">{labRooms.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Phân Công Kỹ Thuật Viên</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Ràng Buộc Nghiệp Vụ</span>
            <p className="text-xs font-bold text-emerald-700">Gán LabTask theo Phòng</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên phòng, mã phòng (VD: Huyết học, LAB-01), vị trí..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Hiển thị {filteredRooms.length} / {labRooms.length} phòng Lab
        </span>
      </div>

      {/* Lab Rooms Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
          <p className="text-xs font-medium">Đang tải danh sách phòng Lab từ server...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-bold text-slate-600">Không tìm thấy phòng Lab nào phù hợp</p>
          <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bấm tải lại danh mục.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => (
            <div
              key={room.labRoomId}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    {room.labRoomCode}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Hoạt động</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors mb-1.5">
                  {room.labRoomName}
                </h3>

                <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                  {room.description || 'Chuyên khoa kiểm tra, xét nghiệm và chẩn đoán cận lâm sàng.'}
                </p>

                {room.location && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-4 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-semibold">{room.location}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Phân công KTV</span>
                </div>

                <button
                  onClick={() => handleOpenStaffModal(room)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Quản Lý KTV</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL QUẢN LÝ KỸ THUẬT VIÊN THEO PHÒNG LAB */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Phân Công KTV: {selectedRoom.labRoomName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Mã phòng: <span className="font-mono font-bold text-purple-700">{selectedRoom.labRoomCode}</span> • API `/api/v1/lab-rooms/{selectedRoom.labRoomId}/staff`
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Thêm KTV mới Form */}
            <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-purple-700" />
                <span>Thêm Kỹ Thuật Viên Vào Phòng</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-7 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Chọn Kỹ Thuật Viên (Role LAB_STAFF):
                  </label>
                  <select
                    value={selectedStaffUserId}
                    onChange={(e) => setSelectedStaffUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/30"
                  >
                    {availableLabStaffUsers.length === 0 ? (
                      <option value="">(Không có tài khoản KTV khả dụng)</option>
                    ) : (
                      availableLabStaffUsers.map((u) => (
                        <option key={u.userId} value={u.userId}>
                          {u.fullName || u.email} ({u.email})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="sm:col-span-3 flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="isPrimaryCheck"
                    checked={isPrimaryAssignment}
                    onChange={(e) => setIsPrimaryAssignment(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="isPrimaryCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Phòng chính
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <button
                    onClick={handleAssignStaff}
                    disabled={isSubmittingAssign || availableLabStaffUsers.length === 0}
                    className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAssign ? 'Đang lưu...' : '+ Thêm'}
                  </button>
                </div>
              </div>
            </div>

            {/* Danh sách KTV hiện tại */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Danh sách KTV đã được phân công ({assignedStaff.length}):
              </h4>

              {isLoadingStaff ? (
                <div className="py-8 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-purple-600" />
                  <span className="text-xs">Đang tải danh sách KTV thuộc phòng...</span>
                </div>
              ) : assignedStaff.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400">
                  <p className="text-xs font-medium">Chưa có kỹ thuật viên nào được phân công vào phòng này.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  {assignedStaff.map((staff) => {
                    const name = staff.user?.profile?.fullName || staff.user?.fullName || staff.user?.email || staff.userId;
                    const email = staff.user?.email || '';

                    return (
                      <div
                        key={staff.userId}
                        className="p-3 bg-white flex items-center justify-between hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center uppercase">
                            {name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">{name}</span>
                              {staff.isPrimary && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <span>Phòng Chính</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500">{email}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveStaff(staff.userId)}
                          disabled={actionLoadingUserId === staff.userId}
                          title="Gỡ khỏi phòng Lab"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedRoom(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
