import api from './axios';
import { TimetableSlot, DayOfWeek, ApiResponse } from '../types';

export async function getWeeklyTimetable(classroomId: number = 1): Promise<TimetableSlot[]> {
  const response = await api.get<ApiResponse<TimetableSlot[]>>(`/api/timetable/classroom/${classroomId}/weekly`);
  return response.data.data;
}

export async function getDayTimetable(classroomId: number = 1, day: DayOfWeek): Promise<TimetableSlot[]> {
  const response = await api.get<ApiResponse<TimetableSlot[]>>(`/api/timetable/classroom/${classroomId}/day/${day}`);
  return response.data.data;
}

export async function getFacultyWeeklyTimetable(facultyId: number = 101): Promise<TimetableSlot[]> {
  const response = await api.get<ApiResponse<TimetableSlot[]>>(`/api/timetable/faculty/${facultyId}/weekly`);
  return response.data.data;
}

export async function createTimetableSlot(payload: Omit<TimetableSlot, 'id'>): Promise<TimetableSlot> {
  const response = await api.post<ApiResponse<TimetableSlot>>('/api/timetable', payload);
  if (!response.data.success && response.data.message) {
    throw new Error(response.data.message);
  }
  return response.data.data;
}

export async function updateTimetableSlot(id: number, payload: Partial<TimetableSlot>): Promise<TimetableSlot> {
  const response = await api.put<ApiResponse<TimetableSlot>>(`/api/timetable/${id}`, payload);
  if (!response.data.success && response.data.message) {
    throw new Error(response.data.message);
  }
  return response.data.data;
}

export async function deleteTimetableSlot(id: number): Promise<void> {
  await api.delete(`/api/timetable/${id}`);
}
