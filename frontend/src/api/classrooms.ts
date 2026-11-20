import api from './axios';
import { Classroom, ClassroomDetail, ApiResponse } from '../types';

type BackendClassroomDetail = ClassroomDetail & {
  classroomNumber?: string;
};

function normalizeClassroomDetail(classroom: BackendClassroomDetail): ClassroomDetail {
  return {
    ...classroom,
    roomNumber: classroom.roomNumber ?? classroom.classroomNumber,
  };
}

export async function getClassroomDetail(classroomId: number = 1): Promise<ClassroomDetail> {
  const response = await api.get<ApiResponse<BackendClassroomDetail>>(
    `/api/classrooms/${classroomId}/detail`
  );
  return normalizeClassroomDetail(response.data.data);
}

export async function getClassrooms(department?: string): Promise<Classroom[]> {
  const url = department && department !== 'ALL' 
    ? `/api/classrooms?department=${encodeURIComponent(department)}` 
    : '/api/classrooms';
  const response = await api.get<ApiResponse<Classroom[]>>(url);
  return response.data.data;
}

export async function createClassroom(payload: Omit<Classroom, 'id'>): Promise<Classroom> {
  const response = await api.post<ApiResponse<Classroom>>('/api/classrooms', payload);
  return response.data.data;
}

export async function updateClassroom(id: number, payload: Partial<Classroom>): Promise<Classroom> {
  const response = await api.put<ApiResponse<Classroom>>(`/api/classrooms/${id}`, payload);
  return response.data.data;
}

export async function deleteClassroom(id: number): Promise<void> {
  await api.delete(`/api/classrooms/${id}`);
}
