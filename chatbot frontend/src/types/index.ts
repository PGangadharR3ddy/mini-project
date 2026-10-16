export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export type AnnouncementType = 'SECTION' | 'DEPARTMENT' | 'GENERAL';

export type ResourceType = 'NOTES' | 'PPT' | 'ASSIGNMENT' | 'REFERENCE' | 'RECORDED_LECTURE';

export type EventType = 'TEST' | 'ASSIGNMENT' | 'PRESENTATION' | 'VIVA' | 'OTHER';

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  classroomId?: string;
  classroomName?: string;
  department: string;
  avatar?: string;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  name: string;
  email: string;
  classroomId?: string;
  classroomName?: string;
  department: string;
  exp?: number;
  iat?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface Classroom {
  id: string;
  name: string;
  section: string;
  department: string;
  year: number | string;
  semester: number | string;
  totalStudents?: number;
  totalSubjects?: number;
  facultyAdvisor?: string;
  createdAt?: string;
}

export interface TimetableSlot {
  id: string;
  classroomId: string;
  classroomName?: string;
  day: DayOfWeek;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:00"
  subject: string;
  subjectCode?: string;
  facultyId: string;
  facultyName: string;
  room: string;
  type?: 'LECTURE' | 'LAB' | 'TUTORIAL';
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  classroomId?: string;
  classroomName?: string;
  department: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
  pinned?: boolean;
  attachments?: string[];
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  subject: string;
  type: ResourceType;
  classroomId: string;
  classroomName?: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedDate: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  downloadsCount?: number;
}

export interface AcademicEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  subject: string;
  dateTime: string; // ISO string
  durationMinutes: number;
  venue: string;
  classroomId: string;
  classroomName?: string;
  createdById: string;
  createdByName: string;
  syncToCalendar?: boolean;
}

export type ProjectStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';

export type JoinRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface ProjectMember {
  userId: string;
  name: string;
  department: string;
  role?: UserRole;
  joinedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string; // Comma-separated or display string
  tags?: string[];   // Array of tag strings
  repositoryUrl?: string;
  liveUrl?: string;
  teamSize: number;
  members: ProjectMember[];
  status: ProjectStatus;
  postedById: string;
  postedByName: string;
  postedByRole: UserRole;
  department: string;
  classroomId?: string | null;
  classroomName?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface JoinRequest {
  id: string;
  projectId: string;
  projectTitle?: string;
  userId: string;
  userName: string;
  userDepartment?: string;
  userRole?: UserRole;
  message: string;
  status: JoinRequestStatus;
  createdAt: string;
}

