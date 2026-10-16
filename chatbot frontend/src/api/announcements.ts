import { axiosInstance, executeApi, getMockStore, saveMockStore } from './client';
import { Announcement, AnnouncementType, ApiResponse } from '../types';

export async function getAnnouncementsFeed(
  classroomId?: string,
  department?: string,
  type?: AnnouncementType | 'ALL'
): Promise<Announcement[]> {
  return executeApi<Announcement[]>(
    () => {
      const params = new URLSearchParams();
      if (classroomId) params.append('classroomId', classroomId);
      if (department) params.append('department', department);
      if (type && type !== 'ALL') params.append('type', type);
      return axiosInstance.get<ApiResponse<Announcement[]>>(`/api/announcements/feed?${params.toString()}`);
    },
    () => {
      const store = getMockStore();
      let list = [...store.announcements];

      // Filter by type if provided
      if (type && type !== 'ALL') {
        list = list.filter((a: Announcement) => a.type === type);
      }

      // Filter by classroom or general or department
      if (classroomId || department) {
        list = list.filter((a: Announcement) => {
          if (a.type === 'GENERAL') return true;
          if (a.type === 'DEPARTMENT' && department && a.department.toLowerCase() === department.toLowerCase()) {
            return true;
          }
          if (a.type === 'SECTION' && classroomId && a.classroomId === classroomId) {
            return true;
          }
          return !classroomId && !department;
        });
      }

      // Sort by pinned first, then date descending
      return list.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
  );
}

export async function getClassroomAnnouncements(classroomId: string): Promise<Announcement[]> {
  return executeApi<Announcement[]>(
    () => axiosInstance.get<ApiResponse<Announcement[]>>(`/api/announcements/classroom/${classroomId}`),
    () => {
      const store = getMockStore();
      return store.announcements.filter((a: Announcement) => a.classroomId === classroomId);
    }
  );
}

export async function createAnnouncement(
  data: Omit<Announcement, 'id' | 'createdAt'>
): Promise<Announcement> {
  return executeApi<Announcement>(
    () => axiosInstance.post<ApiResponse<Announcement>>('/api/announcements', data),
    () => {
      const store = getMockStore();
      const newAnnouncement: Announcement = {
        ...data,
        id: `anc_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      store.announcements.unshift(newAnnouncement);
      saveMockStore({ announcements: store.announcements });
      return newAnnouncement;
    }
  );
}

export async function updateAnnouncement(
  id: string,
  data: Partial<Announcement>
): Promise<Announcement> {
  return executeApi<Announcement>(
    () => axiosInstance.put<ApiResponse<Announcement>>(`/api/announcements/${id}`, data),
    () => {
      const store = getMockStore();
      const index = store.announcements.findIndex((a: Announcement) => a.id === id);
      if (index === -1) throw new Error('Announcement not found');
      store.announcements[index] = { ...store.announcements[index], ...data };
      saveMockStore({ announcements: store.announcements });
      return store.announcements[index];
    }
  );
}

export async function deleteAnnouncement(id: string): Promise<{ success: boolean; id: string }> {
  return executeApi<{ success: boolean; id: string }>(
    () => axiosInstance.delete<ApiResponse<{ success: boolean; id: string }>>(`/api/announcements/${id}`),
    () => {
      const store = getMockStore();
      store.announcements = store.announcements.filter((a: Announcement) => a.id !== id);
      saveMockStore({ announcements: store.announcements });
      return { success: true, id };
    }
  );
}
