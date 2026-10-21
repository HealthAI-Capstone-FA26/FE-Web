import { apiFetch } from '../api';

export interface LabRoomItem {
  labRoomId: string;
  labRoomCode: string;
  labRoomName: string;
  description?: string | null;
  location?: string | null;
  roomLocation?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LabStaffRoomAssignmentUser {
  userId: string;
  email: string;
  fullName?: string;
  profile?: {
    fullName?: string;
    phoneNumber?: string;
    actorRole?: string;
  };
}

export interface LabStaffRoomAssignment {
  userId: string;
  labRoomId: string;
  isPrimary: boolean;
  createdAt?: string;
  user?: LabStaffRoomAssignmentUser;
}

export interface AssignLabStaffDto {
  userId: string;
  isPrimary?: boolean;
}

export function normalizeLabRoom(r: any): LabRoomItem {
  if (!r) return r;
  const id = r.diagnosticRoomId || r.labRoomId;
  const code = r.diagnosticRoomCode || r.labRoomCode;
  const name = r.diagnosticRoomName || r.labRoomName;
  const loc = r.location || r.roomLocation;
  return {
    ...r,
    labRoomId: id,
    diagnosticRoomId: id,
    labRoomCode: code,
    diagnosticRoomCode: code,
    labRoomName: name,
    diagnosticRoomName: name,
    location: loc,
    roomLocation: loc,
    isActive: r.isActive ?? true,
  };
}

export function normalizeLabAssignment(a: any): LabStaffRoomAssignment {
  if (!a) return a;
  const roomId = a.diagnosticRoomId || a.labRoomId;
  const rawRoom = a.diagnosticRoom || a.labRoom;
  const normalizedRoom = rawRoom ? normalizeLabRoom(rawRoom) : undefined;
  return {
    ...a,
    labRoomId: roomId,
    diagnosticRoomId: roomId,
    diagnosticRoom: normalizedRoom,
    labRoom: normalizedRoom,
  };
}

export const labRoomService = {
  /**
   * GET /api/v1/lab-rooms
   * Trả về danh sách các phòng Lab đang active
   */
  async getLabRooms(): Promise<LabRoomItem[]> {
    const rawList = await apiFetch<any[]>('/lab-rooms', {
      method: 'GET',
    });
    return Array.isArray(rawList) ? rawList.map(normalizeLabRoom) : [];
  },

  /**
   * GET /api/v1/lab-rooms/:id/staff
   * Trả về danh sách kỹ thuật viên thuộc phòng Lab tương ứng
   */
  async getLabRoomStaff(labRoomId: string): Promise<LabStaffRoomAssignment[]> {
    const rawList = await apiFetch<any[]>(`/lab-rooms/${labRoomId}/staff`, {
      method: 'GET',
    });
    return Array.isArray(rawList) ? rawList.map(normalizeLabAssignment) : [];
  },

  /**
   * POST /api/v1/lab-rooms/:id/staff
   * Phân công kỹ thuật viên vào phòng Lab
   */
  async assignStaffToLabRoom(labRoomId: string, data: AssignLabStaffDto): Promise<LabStaffRoomAssignment> {
    const raw = await apiFetch<any>(`/lab-rooms/${labRoomId}/staff`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeLabAssignment(raw);
  },

  /**
   * DELETE /api/v1/lab-rooms/:id/staff/:userId
   * Gỡ kỹ thuật viên khỏi phòng Lab
   */
  async removeStaffFromLabRoom(labRoomId: string, userId: string): Promise<void> {
    return apiFetch<void>(`/lab-rooms/${labRoomId}/staff/${userId}`, {
      method: 'DELETE',
    });
  },

  /**
   * GET /api/v1/lab-rooms/my-assignments
   * Trả về danh sách phòng Lab mà KTV hiện tại được phân công
   */
  async getMyAssignments(): Promise<LabStaffRoomAssignment[]> {
    const rawList = await apiFetch<any[]>('/lab-rooms/my-assignments', {
      method: 'GET',
    });
    return Array.isArray(rawList) ? rawList.map(normalizeLabAssignment) : [];
  },
};
