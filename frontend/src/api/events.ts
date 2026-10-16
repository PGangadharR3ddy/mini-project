import api from './axios';
import { AcademicEvent, EventType, ApiResponse } from '../types';

export interface GetEventsParams {
  classroomId?: number;
  type?: EventType | string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

function normalizeEvent(event: AcademicEvent): AcademicEvent {
  return {
    ...event,
    syncedToCalendar: event.syncedToCalendar ?? false,
  };
}

export async function getEvents(params: GetEventsParams = {}): Promise<AcademicEvent[]> {
  const classroomId = params.classroomId || 1;
  const queryParams = new URLSearchParams();

  if (params.type && params.type !== 'ALL') queryParams.append('type', params.type);
  if (params.from) queryParams.append('from', params.from);
  if (params.to) queryParams.append('to', params.to);
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size !== undefined) queryParams.append('size', params.size.toString());

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const response = await api.get<ApiResponse<AcademicEvent[]>>(
    `/api/events/classroom/${classroomId}${queryString}`
  );
  return response.data.data.map(normalizeEvent);
}

export async function getUpcomingEvents(classroomId: number = 1): Promise<AcademicEvent[]> {
  const response = await api.get<ApiResponse<AcademicEvent[]>>(
    `/api/events/classroom/${classroomId}/upcoming`
  );
  return response.data.data.map(normalizeEvent);
}

export async function getEventById(id: number): Promise<AcademicEvent> {
  const response = await api.get<ApiResponse<AcademicEvent>>(`/api/events/${id}`);
  return normalizeEvent(response.data.data);
}

export async function createEvent(payload: {
  classroomId: number;
  title: string;
  description: string;
  type: EventType;
  subject: string;
  eventDateTime: string;
  durationMinutes: number;
  venue: string;
}): Promise<AcademicEvent> {
  const response = await api.post<ApiResponse<AcademicEvent>>('/api/events', payload);
  return normalizeEvent(response.data.data);
}

export async function updateEvent(
  id: number,
  payload: Partial<AcademicEvent>
): Promise<AcademicEvent> {
  const response = await api.put<ApiResponse<AcademicEvent>>(`/api/events/${id}`, payload);
  return normalizeEvent(response.data.data);
}

export async function deleteEvent(id: number): Promise<void> {
  await api.delete(`/api/events/${id}`);
}
