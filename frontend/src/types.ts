export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN';

export type AnnouncementType = 'SECTION' | 'DEPARTMENT' | 'GENERAL';

export type ResourceType = 'NOTES' | 'PPT' | 'ASSIGNMENT' | 'REFERENCE' | 'RECORDED_LECTURE';

export type EventType = 'TEST' | 'ASSIGNMENT' | 'PRESENTATION' | 'VIVA' | 'OTHER';

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';

export interface UserPayload {
  sub: string;
  name: string;
  role: Role;
  department: string;
  classroomId: number;
  exp: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface SpringPage<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface Classroom {
  id: number;
  name: string;
  section: string;
  department: string;
  year: number;
  semester: number;
  capacity?: number;
  studentCount?: number;
  academicYear?: string;
}

export interface ClassroomDetail extends Classroom {
  advisorName?: string;
  advisorEmail?: string;
  roomNumber?: string;
  syllabusProgress?: number;
  totalLecturesToday?: number;
  pendingGrading?: number;
}

export interface TimetableSlot {
  id: number;
  classroomId: number;
  day: DayOfWeek;
  startTime: string; // "09:00:00" or "09:00"
  endTime: string;   // "10:00:00" or "10:00"
  subject: string;
  subjectCode?: string;
  facultyId: number;
  facultyName: string;
  roomNumber: string;
  type?: 'LECTURE' | 'LAB' | 'SEMINAR' | 'TUTORIAL';
  isUpcoming?: boolean;
  hasConflict?: boolean;
}

export interface Announcement {
  id: number;
  classroomId: number | null;
  department: string;
  title: string;
  body: string;
  type: AnnouncementType;
  postedBy?: string;
  authorRole?: string;
  authorAvatar?: string;
  createdAt: string; // ISO 8601
  urgent?: boolean;
  attachmentName?: string;
  attachmentSize?: string;
  attachmentUrl?: string;
}

export interface Resource {
  id: number;
  classroomId: number;
  title: string;
  description: string;
  subject: string;
  type: ResourceType;
  fileName: string;
  fileSize: string;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AcademicEvent {
  id: number;
  classroomId: number;
  title: string;
  description: string;
  type: EventType;
  subject: string;
  eventDateTime: string; // ISO 8601
  durationMinutes: number;
  venue: string;
  syncToCalendar?: boolean;
  isUpcoming?: boolean;
  isUrgent?: boolean;
  status?: string;
}
