import { apiFetch } from '../api';

export interface LabRoomItem {
  labRoomId: string;
  labRoomCode: string;
  labRoomName: string;
  description?: string | null;
  location?: string | null;
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

export const labRoomService = {
  /**
   * GET /api/v1/lab-rooms
   * Trả về danh sách các phòng Lab đang active
   */
  async getLabRooms(): Promise<LabRoomItem[]> {
    return apiFetch<LabRoomItem[]>('/lab-rooms', {
      method: 'GET',
    });
  },

  /**
   * GET /api/v1/lab-rooms/:id/staff
   * Trả về danh sách kỹ thuật viên thuộc phòng Lab tương ứng
   */
  async getLabRoomStaff(labRoomId: string): Promise<LabStaffRoomAssignment[]> {
    return apiFetch<LabStaffRoomAssignment[]>(`/lab-rooms/${labRoomId}/staff`, {
      method: 'GET',
    });
  },

  /**
   * POST /api/v1/lab-rooms/:id/staff
   * Phân công kỹ thuật viên vào phòng Lab
   */
  async assignStaffToLabRoom(labRoomId: string, data: AssignLabStaffDto): Promise<LabStaffRoomAssignment> {
    return apiFetch<LabStaffRoomAssignment>(`/lab-rooms/${labRoomId}/staff`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
};
