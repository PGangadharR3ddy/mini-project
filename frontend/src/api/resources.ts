import api from './axios';
import { Resource, ResourceType, ApiResponse, SpringPage } from '../types';

export interface GetResourcesParams {
  classroomId?: number;
  subject?: string;
  type?: ResourceType | string;
  page?: number;
  size?: number;
}

export async function getResources(params: GetResourcesParams = {}): Promise<SpringPage<Resource>> {
  const classroomId = params.classroomId || 1;
  const queryParams = new URLSearchParams();

  if (params.subject) queryParams.append('subject', params.subject);
  if (params.type && params.type !== 'ALL') queryParams.append('type', params.type);
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size !== undefined) queryParams.append('size', params.size.toString());

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const response = await api.get<ApiResponse<SpringPage<Resource>>>(
    `/api/resources/classroom/${classroomId}${queryString}`
  );
  return response.data.data;
}

export async function getResourceById(id: number): Promise<Resource> {
  const response = await api.get<ApiResponse<Resource>>(`/api/resources/${id}`);
  return response.data.data;
}

export async function uploadResource(
  file: File,
  metadata: {
    classroomId: number;
    title: string;
    description: string;
    subject: string;
    type: ResourceType;
  }
): Promise<Resource> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );

  // Do NOT set Content-Type header - browser sets it with multipart boundary
  const response = await api.post<ApiResponse<Resource>>('/api/resources', formData);
  return response.data.data;
}

export async function updateResource(
  id: number,
  payload: Partial<Resource>
): Promise<Resource> {
  const response = await api.put<ApiResponse<Resource>>(`/api/resources/${id}`, payload);
  return response.data.data;
}

export async function deleteResource(id: number): Promise<void> {
  await api.delete(`/api/resources/${id}`);
}
