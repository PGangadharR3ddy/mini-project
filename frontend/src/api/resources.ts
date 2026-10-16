import api from './axios';
import { Resource, ResourceType, ApiResponse, SpringPage } from '../types';

interface BackendResource extends Omit<Resource, 'fileSize' | 'uploadedBy' | 'createdAt'> {
  fileSizeBytes: number;
  uploadedBy: number;
  uploadedByName?: string;
  uploadedAt: string;
}

type ResourceResponse = Resource | BackendResource;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeResource(resource: ResourceResponse): Resource {
  if (!('fileSizeBytes' in resource)) return resource;
  return {
    ...resource,
    fileSize: formatFileSize(resource.fileSizeBytes),
    uploadedBy: resource.uploadedByName || String(resource.uploadedBy),
    createdAt: resource.uploadedAt,
  };
}

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
  const response = await api.get<ApiResponse<SpringPage<ResourceResponse>>>(
    `/api/resources/classroom/${classroomId}${queryString}`
  );
  return {
    ...response.data.data,
    content: response.data.data.content.map(normalizeResource),
  };
}

export async function getResourceById(id: number): Promise<Resource> {
  const response = await api.get<ApiResponse<ResourceResponse>>(`/api/resources/${id}`);
  return normalizeResource(response.data.data);
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
  const response = await api.post<ApiResponse<ResourceResponse>>('/api/resources', formData);
  return normalizeResource(response.data.data);
}

export async function updateResource(
  id: number,
  payload: Partial<Resource>
): Promise<Resource> {
  const response = await api.put<ApiResponse<ResourceResponse>>(`/api/resources/${id}`, {
    title: payload.title,
    description: payload.description,
    type: payload.type,
  });
  return normalizeResource(response.data.data);
}

export async function getResourceFile(id: number): Promise<Blob> {
  const response = await api.get<Blob>(`/api/resources/${id}/file`, {
    responseType: 'blob',
    timeout: 300000,
  });
  return response.data;
}

export async function deleteResource(id: number): Promise<void> {
  await api.delete(`/api/resources/${id}`);
}
