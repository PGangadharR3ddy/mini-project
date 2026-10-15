import api from './axios';
import {
  ApiResponse,
  Project,
  ProjectJoinRequest,
  ProjectStatus,
  SpringPage,
} from '../types';

export interface ProjectPayload {
  title: string;
  description: string;
  techStack: string;
  repoUrl?: string;
  liveUrl?: string;
  teamSize: number;
  tags?: string;
  classroomId: number | null;
}

export interface ProjectUpdatePayload extends Partial<Omit<ProjectPayload, 'classroomId'>> {
  status?: ProjectStatus;
}

export async function getProjects(): Promise<Project[]> {
  const projects: Project[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const response = await api.get<ApiResponse<SpringPage<Project>>>('/api/projects', {
      params: { page, size: 100 },
    });
    const result = response.data.data;
    projects.push(...result.content);
    totalPages = result.totalPages;
    page += 1;
  }

  return projects;
}

export async function getMyProjects(): Promise<Project[]> {
  const response = await api.get<ApiResponse<Project[]>>('/api/projects/my');
  return response.data.data;
}

export async function getJoinedProjects(): Promise<Project[]> {
  const response = await api.get<ApiResponse<Project[]>>('/api/projects/joined');
  return response.data.data;
}

export async function getProjectById(id: number): Promise<Project> {
  const response = await api.get<ApiResponse<Project>>(`/api/projects/${id}`);
  return response.data.data;
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const response = await api.post<ApiResponse<Project>>('/api/projects', payload);
  return response.data.data;
}

export async function updateProject(
  id: number,
  payload: ProjectUpdatePayload
): Promise<Project> {
  const response = await api.put<ApiResponse<Project>>(`/api/projects/${id}`, payload);
  return response.data.data;
}

export async function deleteProject(id: number): Promise<void> {
  await api.delete<ApiResponse<null>>(`/api/projects/${id}`);
}

export async function getMyProjectRequests(): Promise<ProjectJoinRequest[]> {
  const response = await api.get<ApiResponse<ProjectJoinRequest[]>>('/api/projects/my-requests');
  return response.data.data;
}

export async function getProjectRequests(projectId: number): Promise<ProjectJoinRequest[]> {
  const response = await api.get<ApiResponse<ProjectJoinRequest[]>>(
    `/api/projects/${projectId}/requests`
  );
  return response.data.data;
}

export async function sendProjectJoinRequest(
  projectId: number,
  message: string
): Promise<ProjectJoinRequest> {
  const response = await api.post<ApiResponse<ProjectJoinRequest>>('/api/projects/join-request', {
    projectId,
    message,
  });
  return response.data.data;
}

export async function respondToProjectRequest(
  requestId: number,
  accept: boolean
): Promise<ProjectJoinRequest> {
  const action = accept ? 'accept' : 'reject';
  const response = await api.put<ApiResponse<ProjectJoinRequest>>(
    `/api/projects/requests/${requestId}/${action}`
  );
  return response.data.data;
}