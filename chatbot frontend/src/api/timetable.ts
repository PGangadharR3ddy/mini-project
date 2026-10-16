import { axiosInstance, executeApi, getMockStore, saveMockStore } from './client';
import { ApiResponse, DayOfWeek, TimetableSlot } from '../types';

export async function getClassroomWeeklyTimetable(classroomId: string): Promise<TimetableSlot[]> {
  return executeApi<TimetableSlot[]>(
    () => axiosInstance.get<ApiResponse<TimetableSlot[]>>(`/api/timetable/classroom/${classroomId}/weekly`),
    () => {
      const store = getMockStore();
      return store.timetable.filter((slot: TimetableSlot) => !classroomId || slot.classroomId === classroomId);
    }
  );
}

export async function getClassroomDayTimetable(classroomId: string, day: DayOfWeek): Promise<TimetableSlot[]> {
  return executeApi<TimetableSlot[]>(
    () => axiosInstance.get<ApiResponse<TimetableSlot[]>>(`/api/timetable/classroom/${classroomId}/day/${day}`),
    () => {
      const store = getMockStore();
      return store.timetable.filter(
        (slot: TimetableSlot) => (!classroomId || slot.classroomId === classroomId) && slot.day === day
      );
    }
  );
}

export async function getFacultyWeeklyTimetable(facultyId: string): Promise<TimetableSlot[]> {
  return executeApi<TimetableSlot[]>(
    () => axiosInstance.get<ApiResponse<TimetableSlot[]>>(`/api/timetable/faculty/${facultyId}/weekly`),
    () => {
      const store = getMockStore();
      return store.timetable.filter(
        (slot: TimetableSlot) => slot.facultyId === facultyId || slot.facultyName.includes('Sharma')
      );
    }
  );
}

export async function createTimetableSlot(
  data: Omit<TimetableSlot, 'id'>
): Promise<TimetableSlot> {
  return executeApi<TimetableSlot>(
    () => axiosInstance.post<ApiResponse<TimetableSlot>>('/api/timetable', data),
    () => {
      const store = getMockStore();
      const newSlot: TimetableSlot = {
        ...data,
        id: `slot_${Date.now()}`,
      };
      store.timetable.push(newSlot);
      saveMockStore({ timetable: store.timetable });
      return newSlot;
    }
  );
}

export async function updateTimetableSlot(
  id: string,
  data: Partial<TimetableSlot>
): Promise<TimetableSlot> {
  return executeApi<TimetableSlot>(
    () => axiosInstance.put<ApiResponse<TimetableSlot>>(`/api/timetable/${id}`, data),
    () => {
      const store = getMockStore();
      const index = store.timetable.findIndex((s: TimetableSlot) => s.id === id);
      if (index === -1) throw new Error('Slot not found');
      store.timetable[index] = { ...store.timetable[index], ...data };
      saveMockStore({ timetable: store.timetable });
      return store.timetable[index];
    }
  );
}

export async function deleteTimetableSlot(id: string): Promise<{ success: boolean; id: string }> {
  return executeApi<{ success: boolean; id: string }>(
    () => axiosInstance.delete<ApiResponse<{ success: boolean; id: string }>>(`/api/timetable/${id}`),
    () => {
      const store = getMockStore();
      store.timetable = store.timetable.filter((s: TimetableSlot) => s.id !== id);
      saveMockStore({ timetable: store.timetable });
      return { success: true, id };
    }
  );
}
