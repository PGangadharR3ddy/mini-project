import { axiosInstance, executeApi, getMockStore, saveMockStore } from './client';
import { ApiResponse, Classroom } from '../types';

export async function getClassrooms(department?: string): Promise<Classroom[]> {
  return executeApi<Classroom[]>(
    () => {
      const params = new URLSearchParams();
      if (department && department !== 'ALL') params.append('department', department);
      return axiosInstance.get<ApiResponse<Classroom[]>>(`/api/classrooms?${params.toString()}`);
    },
    () => {
      const store = getMockStore();
      if (!department || department === 'ALL') return store.classrooms;
      return store.classrooms.filter(
        (c: Classroom) => c.department.toLowerCase() === department.toLowerCase()
      );
    }
  );
}

export async function createClassroom(
  data: Omit<Classroom, 'id' | 'createdAt'>
): Promise<Classroom> {
  return executeApi<Classroom>(
    () => axiosInstance.post<ApiResponse<Classroom>>('/api/classrooms', data),
    () => {
      const store = getMockStore();
      const newClassroom: Classroom = {
        ...data,
        id: `cls_${Date.now()}`,
        createdAt: new Date().toISOString(),
        totalStudents: Number(data.totalStudents) || 0,
        totalSubjects: Number(data.totalSubjects) || 6,
      };
      store.classrooms.push(newClassroom);
      saveMockStore({ classrooms: store.classrooms });
      return newClassroom;
    }
  );
}

export async function updateClassroom(
  id: string,
  data: Partial<Classroom>
): Promise<Classroom> {
  return executeApi<Classroom>(
    () => axiosInstance.put<ApiResponse<Classroom>>(`/api/classrooms/${id}`, data),
    () => {
      const store = getMockStore();
      const index = store.classrooms.findIndex((c: Classroom) => c.id === id);
      if (index === -1) throw new Error('Classroom not found');
      store.classrooms[index] = { ...store.classrooms[index], ...data };
      saveMockStore({ classrooms: store.classrooms });
      return store.classrooms[index];
    }
  );
}

export async function deleteClassroom(id: string): Promise<{ success: boolean; id: string }> {
  return executeApi<{ success: boolean; id: string }>(
    () => axiosInstance.delete<ApiResponse<{ success: boolean; id: string }>>(`/api/classrooms/${id}`),
    () => {
      const store = getMockStore();
      store.classrooms = store.classrooms.filter((c: Classroom) => c.id !== id);
      saveMockStore({ classrooms: store.classrooms });
      return { success: true, id };
    }
  );
}
