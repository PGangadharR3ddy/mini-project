import { axiosInstance, executeApi, getMockStore, saveMockStore } from './client';
import { ApiResponse, Resource, ResourceType } from '../types';

export async function getResources(
  classroomId: string,
  subject?: string,
  type?: ResourceType | 'ALL'
): Promise<Resource[]> {
  return executeApi<Resource[]>(
    () => {
      const params = new URLSearchParams();
      if (subject && subject !== 'ALL') params.append('subject', subject);
      if (type && type !== 'ALL') params.append('type', type);
      return axiosInstance.get<ApiResponse<Resource[]>>(
        `/api/resources/classroom/${classroomId}?${params.toString()}`
      );
    },
    () => {
      const store = getMockStore();
      let list = store.resources.filter((r: Resource) => !classroomId || r.classroomId === classroomId);

      if (subject && subject !== 'ALL') {
        list = list.filter((r: Resource) => r.subject.toLowerCase() === subject.toLowerCase());
      }
      if (type && type !== 'ALL') {
        list = list.filter((r: Resource) => r.type === type);
      }

      return list.sort(
        (a: Resource, b: Resource) => new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime()
      );
    }
  );
}

export async function uploadResource(
  formData: FormData,
  metadataFallback?: Omit<Resource, 'id' | 'uploadedDate' | 'downloadsCount'>
): Promise<Resource> {
  return executeApi<Resource>(
    () =>
      axiosInstance.post<ApiResponse<Resource>>('/api/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    () => {
      const store = getMockStore();
      const newResource: Resource = {
        id: `res_${Date.now()}`,
        title: (formData.get('title') as string) || metadataFallback?.title || 'Lecture Document',
        description: (formData.get('description') as string) || metadataFallback?.description || '',
        subject: (formData.get('subject') as string) || metadataFallback?.subject || 'Computer Science',
        type: ((formData.get('type') as ResourceType) || metadataFallback?.type || 'NOTES') as ResourceType,
        classroomId: (formData.get('classroomId') as string) || metadataFallback?.classroomId || 'cls_cse_3a',
        classroomName: metadataFallback?.classroomName || 'CSE - 3rd Year (Section A)',
        uploadedById: metadataFallback?.uploadedById || 'usr_faculty_01',
        uploadedByName: metadataFallback?.uploadedByName || 'Dr. Ramesh Sharma',
        uploadedDate: new Date().toISOString(),
        fileUrl: '#',
        fileName: (formData.get('file') as File)?.name || metadataFallback?.fileName || 'document.pdf',
        fileSize: metadataFallback?.fileSize || '2.5 MB',
        downloadsCount: 0,
      };

      store.resources.unshift(newResource);
      saveMockStore({ resources: store.resources });
      return newResource;
    }
  );
}

export async function updateResource(
  id: string,
  data: Partial<Resource>
): Promise<Resource> {
  return executeApi<Resource>(
    () => axiosInstance.put<ApiResponse<Resource>>(`/api/resources/${id}`, data),
    () => {
      const store = getMockStore();
      const index = store.resources.findIndex((r: Resource) => r.id === id);
      if (index === -1) throw new Error('Resource not found');
      store.resources[index] = { ...store.resources[index], ...data };
      saveMockStore({ resources: store.resources });
      return store.resources[index];
    }
  );
}

export async function deleteResource(id: string): Promise<{ success: boolean; id: string }> {
  return executeApi<{ success: boolean; id: string }>(
    () => axiosInstance.delete<ApiResponse<{ success: boolean; id: string }>>(`/api/resources/${id}`),
    () => {
      const store = getMockStore();
      store.resources = store.resources.filter((r: Resource) => r.id !== id);
      saveMockStore({ resources: store.resources });
      return { success: true, id };
    }
  );
}
