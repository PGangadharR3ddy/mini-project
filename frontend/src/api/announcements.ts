import api from './axios';
import { Announcement, ApiResponse, SpringPage } from '../types';

export interface GetAnnouncementsParams {
  classroomId?: number | null;
  department?: string;
  page?: number;
  size?: number;
}

export async function getAnnouncementFeed(
  classroomId: number = 1,
  department: string = 'CSE',
  page: number = 0,
  size: number = 20
): Promise<SpringPage<Announcement>> {
  const response = await api.get<ApiResponse<SpringPage<Announcement>>>(
    `/api/announcements/feed?classroomId=${classroomId}&department=${encodeURIComponent(department)}&page=${page}&size=${size}`
  );
  return response.data.data;
}

export async function getClassroomAnnouncements(classroomId: number = 1): Promise<Announcement[]> {
  const response = await api.get<ApiResponse<Announcement[]>>(`/api/announcements/classroom/${classroomId}`);
  return response.data.data;
}

export async function getAnnouncementById(id: number): Promise<Announcement> {
  const response = await api.get<ApiResponse<Announcement>>(`/api/announcements/${id}`);
  return response.data.data;
}

export async function createAnnouncement(payload: {
  classroomId: number | null;
  title: string;
  body: string;
  type: string;
  department?: string;
}): Promise<Announcement> {
  const response = await api.post<ApiResponse<Announcement>>('/api/announcements', payload);
  return response.data.data;
}

export async function updateAnnouncement(
  id: number,
  payload: Partial<Announcement>
): Promise<Announcement> {
  const response = await api.put<ApiResponse<Announcement>>(`/api/announcements/${id}`, payload);
  return response.data.data;
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await api.delete(`/api/announcements/${id}`);
}
