import { axiosInstance, executeApi, getMockStore, saveMockStore } from './client';
import { AcademicEvent, ApiResponse, EventType } from '../types';

export async function getEvents(
  classroomId: string,
  type?: EventType | 'ALL',
  from?: string,
  to?: string
): Promise<AcademicEvent[]> {
  return executeApi<AcademicEvent[]>(
    () => {
      const params = new URLSearchParams();
      if (type && type !== 'ALL') params.append('type', type);
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      return axiosInstance.get<ApiResponse<AcademicEvent[]>>(
        `/api/events/classroom/${classroomId}?${params.toString()}`
      );
    },
    () => {
      const store = getMockStore();
      let list = store.events.filter((e: AcademicEvent) => !classroomId || e.classroomId === classroomId);

      if (type && type !== 'ALL') {
        list = list.filter((e: AcademicEvent) => e.type === type);
      }

      if (from) {
        const fromDate = new Date(from).getTime();
        list = list.filter((e: AcademicEvent) => new Date(e.dateTime).getTime() >= fromDate);
      }

      if (to) {
        const toDate = new Date(to).getTime();
        list = list.filter((e: AcademicEvent) => new Date(e.dateTime).getTime() <= toDate);
      }

      return list.sort(
        (a: AcademicEvent, b: AcademicEvent) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      );
    }
  );
}

export async function getUpcomingEvents(classroomId: string, limit = 3): Promise<AcademicEvent[]> {
  return executeApi<AcademicEvent[]>(
    () => axiosInstance.get<ApiResponse<AcademicEvent[]>>(`/api/events/classroom/${classroomId}/upcoming`),
    () => {
      const store = getMockStore();
      const now = new Date().getTime();
      return store.events
        .filter((e: AcademicEvent) => (!classroomId || e.classroomId === classroomId) && new Date(e.dateTime).getTime() >= now - 86400000)
        .sort((a: AcademicEvent, b: AcademicEvent) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
        .slice(0, limit);
    }
  );
}

export async function createEvent(
  data: Omit<AcademicEvent, 'id'>
): Promise<AcademicEvent> {
  return executeApi<AcademicEvent>(
    () => axiosInstance.post<ApiResponse<AcademicEvent>>('/api/events', data),
    () => {
      const store = getMockStore();
      const newEvent: AcademicEvent = {
        ...data,
        id: `evt_${Date.now()}`,
      };
      store.events.push(newEvent);
      saveMockStore({ events: store.events });
      return newEvent;
    }
  );
}

export async function updateEvent(
  id: string,
  data: Partial<AcademicEvent>
): Promise<AcademicEvent> {
  return executeApi<AcademicEvent>(
    () => axiosInstance.put<ApiResponse<AcademicEvent>>(`/api/events/${id}`, data),
    () => {
      const store = getMockStore();
      const index = store.events.findIndex((e: AcademicEvent) => e.id === id);
      if (index === -1) throw new Error('Event not found');
      store.events[index] = { ...store.events[index], ...data };
      saveMockStore({ events: store.events });
      return store.events[index];
    }
  );
}

export async function deleteEvent(id: string): Promise<{ success: boolean; id: string }> {
  return executeApi<{ success: boolean; id: string }>(
    () => axiosInstance.delete<ApiResponse<{ success: boolean; id: string }>>(`/api/events/${id}`),
    () => {
      const store = getMockStore();
      store.events = store.events.filter((e: AcademicEvent) => e.id !== id);
      saveMockStore({ events: store.events });
      return { success: true, id };
    }
  );
}
