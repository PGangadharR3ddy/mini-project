import { axiosInstance, executeApi, getMockStore, saveMockStore } from './client';
import { ApiResponse, JoinRequest, Project, ProjectMember, ProjectStatus } from '../types';

export interface CreateProjectPayload {
  title: string;
  description: string;
  techStack: string;
  tags?: string[];
  repositoryUrl?: string;
  liveUrl?: string;
  teamSize: number;
  classroomId?: string | null;
}

export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  techStack?: string;
  tags?: string[];
  repositoryUrl?: string;
  liveUrl?: string;
  teamSize?: number;
  status?: ProjectStatus;
  classroomId?: string | null;
}

/**
 * GET /api/projects
 * Retrieve all projects (cross-department)
 */
export async function getAllProjects(): Promise<Project[]> {
  return executeApi<Project[]>(
    () => axiosInstance.get<ApiResponse<Project[]>>('/api/projects'),
    () => {
      const store = getMockStore();
      return [...(store.projects || [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  );
}

/**
 * GET /api/projects/classroom/{classroomId}
 * Optionally filter by ?status=OPEN
 */
export async function getProjectsByClassroom(
  classroomId: string,
  status?: ProjectStatus
): Promise<Project[]> {
  return executeApi<Project[]>(
    () => {
      const params = status ? `?status=${status}` : '';
      return axiosInstance.get<ApiResponse<Project[]>>(`/api/projects/classroom/${classroomId}${params}`);
    },
    () => {
      const store = getMockStore();
      return (store.projects || []).filter((p: Project) => {
        const matchesClassroom = p.classroomId === classroomId;
        const matchesStatus = status ? p.status === status : true;
        return matchesClassroom && matchesStatus;
      });
    }
  );
}

/**
 * GET /api/projects/department/{department}
 * Optionally filter by ?status=OPEN
 */
export async function getProjectsByDepartment(
  department: string,
  status?: ProjectStatus
): Promise<Project[]> {
  return executeApi<Project[]>(
    () => {
      const params = status ? `?status=${status}` : '';
      return axiosInstance.get<ApiResponse<Project[]>>(
        `/api/projects/department/${encodeURIComponent(department)}${params}`
      );
    },
    () => {
      const store = getMockStore();
      return (store.projects || []).filter((p: Project) => {
        const matchesDept =
          p.department.trim().toLowerCase() === department.trim().toLowerCase();
        const matchesStatus = status ? p.status === status : true;
        return matchesDept && matchesStatus;
      });
    }
  );
}

/**
 * GET /api/projects/{id}
 * Retrieve single project by ID
 */
export async function getProjectById(id: string): Promise<Project> {
  return executeApi<Project>(
    () => axiosInstance.get<ApiResponse<Project>>(`/api/projects/${id}`),
    () => {
      const store = getMockStore();
      const found = (store.projects || []).find((p: Project) => p.id === id);
      if (!found) throw new Error('Project not found');
      return found;
    }
  );
}

/**
 * POST /api/projects
 * Post a new project
 */
export async function createProject(
  payload: CreateProjectPayload,
  currentUser: {
    userId: string;
    name: string;
    role: any;
    department: string;
    classroomName?: string;
  }
): Promise<Project> {
  return executeApi<Project>(
    () => axiosInstance.post<ApiResponse<Project>>('/api/projects', payload),
    () => {
      const store = getMockStore();
      const newProject: Project = {
        id: `prj_${Date.now()}`,
        title: payload.title,
        description: payload.description,
        techStack: payload.techStack,
        tags: payload.tags || [],
        repositoryUrl: payload.repositoryUrl || '',
        liveUrl: payload.liveUrl || '',
        teamSize: Number(payload.teamSize) || 1,
        members: [
          {
            userId: currentUser.userId,
            name: currentUser.name,
            department: currentUser.department,
            role: currentUser.role,
            joinedAt: new Date().toISOString(),
          },
        ],
        status: 'OPEN',
        postedById: currentUser.userId,
        postedByName: currentUser.name,
        postedByRole: currentUser.role,
        department: currentUser.department,
        classroomId: payload.classroomId || null,
        classroomName: payload.classroomId ? currentUser.classroomName || null : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const projects = [newProject, ...(store.projects || [])];
      saveMockStore({ projects });
      return newProject;
    }
  );
}

/**
 * PUT /api/projects/{id}
 * Update existing project
 */
export async function updateProject(
  id: string,
  payload: UpdateProjectPayload
): Promise<Project> {
  return executeApi<Project>(
    () => axiosInstance.put<ApiResponse<Project>>(`/api/projects/${id}`, payload),
    () => {
      const store = getMockStore();
      const index = (store.projects || []).findIndex((p: Project) => p.id === id);
      if (index === -1) throw new Error('Project not found');

      const updated = {
        ...store.projects[index],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      store.projects[index] = updated;
      saveMockStore({ projects: store.projects });
      return updated;
    }
  );
}

/**
 * DELETE /api/projects/{id}
 * Delete a project
 */
export async function deleteProject(id: string): Promise<{ success: boolean; id: string }> {
  return executeApi<{ success: boolean; id: string }>(
    () => axiosInstance.delete<ApiResponse<{ success: boolean; id: string }>>(`/api/projects/${id}`),
    () => {
      const store = getMockStore();
      const projects = (store.projects || []).filter((p: Project) => p.id !== id);
      const joinRequests = (store.joinRequests || []).filter((r: JoinRequest) => r.projectId !== id);
      saveMockStore({ projects, joinRequests });
      return { success: true, id };
    }
  );
}

/* =========================================================================
   JOIN REQUESTS
========================================================================= */

/**
 * POST /api/projects/{id}/join
 * Send join request with message: { message: string }
 */
export async function sendJoinRequest(
  projectId: string,
  message: string,
  currentUser: {
    userId: string;
    name: string;
    role?: any;
    department?: string;
  },
  projectTitle?: string
): Promise<JoinRequest> {
  return executeApi<JoinRequest>(
    () => axiosInstance.post<ApiResponse<JoinRequest>>(`/api/projects/${projectId}/join`, { message }),
    () => {
      const store = getMockStore();
      const existing = (store.joinRequests || []).find(
        (r: JoinRequest) => r.projectId === projectId && r.userId === currentUser.userId
      );
      if (existing) {
        throw new Error('You have already submitted a join request for this project');
      }

      const newReq: JoinRequest = {
        id: `req_${Date.now()}`,
        projectId,
        projectTitle: projectTitle || 'Project Collaboration',
        userId: currentUser.userId,
        userName: currentUser.name,
        userDepartment: currentUser.department,
        userRole: currentUser.role,
        message,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      const joinRequests = [newReq, ...(store.joinRequests || [])];
      saveMockStore({ joinRequests });
      return newReq;
    }
  );
}

/**
 * GET /api/projects/{id}/requests
 * Pending requests for project owner
 */
export async function getProjectJoinRequests(projectId: string): Promise<JoinRequest[]> {
  return executeApi<JoinRequest[]>(
    () => axiosInstance.get<ApiResponse<JoinRequest[]>>(`/api/projects/${projectId}/requests`),
    () => {
      const store = getMockStore();
      return (store.joinRequests || []).filter(
        (r: JoinRequest) => r.projectId === projectId
      );
    }
  );
}

/**
 * PUT /api/projects/requests/{requestId}/accept
 * Accept request -> adds student to team members
 */
export async function acceptJoinRequest(
  requestId: string,
  projectId: string
): Promise<{ success: boolean; member: ProjectMember }> {
  return executeApi<{ success: boolean; member: ProjectMember }>(
    () => axiosInstance.put<ApiResponse<{ success: boolean; member: ProjectMember }>>(`/api/projects/requests/${requestId}/accept`),
    () => {
      const store = getMockStore();
      const reqIndex = (store.joinRequests || []).findIndex((r: JoinRequest) => r.id === requestId);
      if (reqIndex === -1) throw new Error('Join request not found');

      const req = store.joinRequests[reqIndex];
      store.joinRequests[reqIndex] = { ...req, status: 'ACCEPTED' };

      // Add to project members if not already
      const prjIndex = (store.projects || []).findIndex((p: Project) => p.id === (projectId || req.projectId));
      let newMember: ProjectMember = {
        userId: req.userId,
        name: req.userName,
        department: req.userDepartment || 'General',
        role: req.userRole || 'STUDENT',
        joinedAt: new Date().toISOString(),
      };

      if (prjIndex !== -1) {
        const prj = store.projects[prjIndex];
        const alreadyMember = (prj.members || []).some((m: ProjectMember) => m.userId === req.userId);
        if (!alreadyMember) {
          const updatedMembers = [...(prj.members || []), newMember];
          // Check if reached max capacity
          const isFull = updatedMembers.length >= prj.teamSize;
          store.projects[prjIndex] = {
            ...prj,
            members: updatedMembers,
            status: isFull && prj.status === 'OPEN' ? 'IN_PROGRESS' : prj.status,
            updatedAt: new Date().toISOString(),
          };
        }
      }

      saveMockStore({
        joinRequests: store.joinRequests,
        projects: store.projects,
      });

      return { success: true, member: newMember };
    }
  );
}

/**
 * PUT /api/projects/requests/{requestId}/reject
 * Reject request
 */
export async function rejectJoinRequest(requestId: string): Promise<{ success: boolean; id: string }> {
  return executeApi<{ success: boolean; id: string }>(
    () => axiosInstance.put<ApiResponse<{ success: boolean; id: string }>>(`/api/projects/requests/${requestId}/reject`),
    () => {
      const store = getMockStore();
      const reqIndex = (store.joinRequests || []).findIndex((r: JoinRequest) => r.id === requestId);
      if (reqIndex === -1) throw new Error('Join request not found');

      store.joinRequests[reqIndex] = { ...store.joinRequests[reqIndex], status: 'REJECTED' };
      saveMockStore({ joinRequests: store.joinRequests });
      return { success: true, id: requestId };
    }
  );
}

/**
 * GET /api/projects/my-requests
 * Get join requests sent by the logged-in user
 */
export async function getMyJoinRequests(userId: string): Promise<JoinRequest[]> {
  return executeApi<JoinRequest[]>(
    () => axiosInstance.get<ApiResponse<JoinRequest[]>>('/api/projects/my-requests'),
    () => {
      const store = getMockStore();
      const userRequests = (store.joinRequests || []).filter((r: JoinRequest) => r.userId === userId);
      // Enrich with project titles if missing
      return userRequests.map((r: JoinRequest) => {
        if (!r.projectTitle) {
          const prj = (store.projects || []).find((p: Project) => p.id === r.projectId);
          return { ...r, projectTitle: prj?.title || 'Collaboration Project' };
        }
        return r;
      });
    }
  );
}
