import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  INITIAL_CLASSROOMS,
  INITIAL_TIMETABLE,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_RESOURCES,
  INITIAL_EVENTS,
} from './mockData';
import { ApiResponse, SpringPage } from '../types';

const BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8082';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Local storage persistent fallback store to support interactive CRUD operations
// when backend at http://localhost:8082 is unreachable.
const LOCAL_STORAGE_KEYS = {
  classrooms: 'scms_mock_classrooms',
  timetable: 'scms_mock_timetable',
  announcements: 'scms_mock_announcements',
  resources: 'scms_mock_resources',
  events: 'scms_mock_events',
};

function getStored<T>(key: string, initial: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(saved);
  } catch {
    return initial;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to persist mock data:', err);
  }
}

// Fallback Mock Response Dispatcher
function handleMockFallback(config: InternalAxiosRequestConfig): ApiResponse<any> {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  const now = new Date().toISOString();

  // 1. CLASSROOMS
  if (url.startsWith('/api/classrooms')) {
    let list = getStored(LOCAL_STORAGE_KEYS.classrooms, INITIAL_CLASSROOMS);

    // GET /api/classrooms/1/detail or /api/classrooms/:id
    const detailMatch = url.match(/\/api\/classrooms\/(\d+)(\/detail)?/);
    if (detailMatch && method === 'get') {
      const id = parseInt(detailMatch[1], 10);
      const found = list.find((c) => c.id === id) || list[0];
      return { success: true, message: 'OK', data: found, timestamp: now };
    }

    if (method === 'get') {
      const parsedUrl = new URL(url, 'http://localhost:8082');
      const dept = parsedUrl.searchParams.get('department');
      const filtered = dept ? list.filter((c) => c.department.toLowerCase() === dept.toLowerCase()) : list;
      return { success: true, message: 'OK', data: filtered, timestamp: now };
    }

    if (method === 'post') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const newClassroom = {
        ...body,
        id: Date.now(),
        capacity: 100,
        studentCount: 0,
        academicYear: '2024-2025',
        syllabusProgress: 0,
        totalLecturesToday: 0,
        pendingGrading: 0,
      };
      list = [newClassroom, ...list];
      setStored(LOCAL_STORAGE_KEYS.classrooms, list);
      return { success: true, message: 'Classroom created successfully', data: newClassroom, timestamp: now };
    }

    const idMatch = url.match(/\/api\/classrooms\/(\d+)/);
    if (idMatch && method === 'put') {
      const id = parseInt(idMatch[1], 10);
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      list = list.map((c) => (c.id === id ? { ...c, ...body } : c));
      setStored(LOCAL_STORAGE_KEYS.classrooms, list);
      const updated = list.find((c) => c.id === id);
      return { success: true, message: 'Classroom updated successfully', data: updated, timestamp: now };
    }

    if (idMatch && method === 'delete') {
      const id = parseInt(idMatch[1], 10);
      list = list.filter((c) => c.id !== id);
      setStored(LOCAL_STORAGE_KEYS.classrooms, list);
      return { success: true, message: 'Classroom deleted', data: null, timestamp: now };
    }
  }

  // 2. TIMETABLE
  if (url.startsWith('/api/timetable')) {
    let list = getStored(LOCAL_STORAGE_KEYS.timetable, INITIAL_TIMETABLE);

    if (url.includes('/weekly') || url.includes('/day/')) {
      const dayMatch = url.match(/\/day\/([A-Z]+)/);
      if (dayMatch) {
        const day = dayMatch[1];
        const daySlots = list.filter((s) => s.day === day);
        return { success: true, message: 'OK', data: daySlots, timestamp: now };
      }
      return { success: true, message: 'OK', data: list, timestamp: now };
    }

    if (method === 'post') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      // Conflict detection mock
      const conflict = list.find(
        (s) => s.day === body.day && s.startTime === body.startTime && s.roomNumber === body.roomNumber
      );
      if (conflict) {
        return {
          success: false,
          message: `Schedule Conflict: Room ${body.roomNumber} is already booked on ${body.day} at ${body.startTime}`,
          data: null,
          timestamp: now,
        };
      }
      const newSlot = {
        ...body,
        id: Date.now(),
        type: body.type || 'LECTURE',
        subjectCode: body.subjectCode || 'CS-300',
      };
      list = [...list, newSlot];
      setStored(LOCAL_STORAGE_KEYS.timetable, list);
      return { success: true, message: 'Timetable slot created', data: newSlot, timestamp: now };
    }

    const idMatch = url.match(/\/api\/timetable\/(\d+)/);
    if (idMatch && method === 'put') {
      const id = parseInt(idMatch[1], 10);
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      list = list.map((s) => (s.id === id ? { ...s, ...body } : s));
      setStored(LOCAL_STORAGE_KEYS.timetable, list);
      const updated = list.find((s) => s.id === id);
      return { success: true, message: 'Timetable slot updated', data: updated, timestamp: now };
    }

    if (idMatch && method === 'delete') {
      const id = parseInt(idMatch[1], 10);
      list = list.filter((s) => s.id !== id);
      setStored(LOCAL_STORAGE_KEYS.timetable, list);
      return { success: true, message: 'Timetable slot removed', data: null, timestamp: now };
    }
  }

  // 3. ANNOUNCEMENTS
  if (url.startsWith('/api/announcements')) {
    let list = getStored(LOCAL_STORAGE_KEYS.announcements, INITIAL_ANNOUNCEMENTS);

    if (method === 'get') {
      const idMatch = url.match(/\/api\/announcements\/(\d+)$/);
      if (idMatch) {
        const id = parseInt(idMatch[1], 10);
        const item = list.find((a) => a.id === id) || list[0];
        return { success: true, message: 'OK', data: item, timestamp: now };
      }

      // Spring Page structure for feed
      const pageResult: SpringPage<any> = {
        content: list,
        totalPages: Math.ceil(list.length / 20) || 1,
        totalElements: list.length,
        size: 20,
        number: 0,
        first: true,
        last: true,
      };
      return { success: true, message: 'OK', data: pageResult, timestamp: now };
    }

    if (method === 'post') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const newPost = {
        ...body,
        id: Date.now(),
        createdAt: now,
        postedBy: 'Dr. Sarah Müller',
        authorRole: 'Course Instructor',
        authorAvatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuChWb8trhqoMRQI66iS79xnX_Mx8Po1grc3Mb2t_G2Fw-CQA-_OrVl9OeZLbXe-95_dDYKr53tkcnmddiIQx1RfK9trdXYNE9S_5Nur-juJZ4S_-bqVDXe72pbgeVi9ZVIDq-NToMq2apDcC_dk0-ZuX0XfWRKbDUrK4pAaPVDMLzz3yrVo8fxxG5y-8BWUAojzRorjIUwykN_XVdMF6hgKYJ-roYAOtgLghGlhL8AcF3-o-3Tgx75S',
      };
      list = [newPost, ...list];
      setStored(LOCAL_STORAGE_KEYS.announcements, list);
      return { success: true, message: 'Announcement posted successfully', data: newPost, timestamp: now };
    }

    const idMatch = url.match(/\/api\/announcements\/(\d+)/);
    if (idMatch && method === 'put') {
      const id = parseInt(idMatch[1], 10);
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      list = list.map((a) => (a.id === id ? { ...a, ...body } : a));
      setStored(LOCAL_STORAGE_KEYS.announcements, list);
      const updated = list.find((a) => a.id === id);
      return { success: true, message: 'Announcement updated', data: updated, timestamp: now };
    }

    if (idMatch && method === 'delete') {
      const id = parseInt(idMatch[1], 10);
      list = list.filter((a) => a.id !== id);
      setStored(LOCAL_STORAGE_KEYS.announcements, list);
      return { success: true, message: 'Announcement deleted', data: null, timestamp: now };
    }
  }

  // 4. RESOURCES
  if (url.startsWith('/api/resources')) {
    let list = getStored(LOCAL_STORAGE_KEYS.resources, INITIAL_RESOURCES);

    if (method === 'get') {
      const idMatch = url.match(/\/api\/resources\/(\d+)$/);
      if (idMatch) {
        const id = parseInt(idMatch[1], 10);
        const item = list.find((r) => r.id === id) || list[0];
        return { success: true, message: 'OK', data: item, timestamp: now };
      }

      const parsedUrl = new URL(url, 'http://localhost:8082');
      const subject = parsedUrl.searchParams.get('subject');
      const type = parsedUrl.searchParams.get('type');

      let filtered = [...list];
      if (subject) {
        filtered = filtered.filter((r) => r.subject.toLowerCase().includes(subject.toLowerCase()));
      }
      if (type) {
        filtered = filtered.filter((r) => r.type.toUpperCase() === type.toUpperCase());
      }

      const pageResult: SpringPage<any> = {
        content: filtered,
        totalPages: Math.ceil(filtered.length / 20) || 1,
        totalElements: filtered.length,
        size: 20,
        number: 0,
        first: true,
        last: true,
      };

      return { success: true, message: 'OK', data: pageResult, timestamp: now };
    }

    if (method === 'post') {
      let meta: any = {};
      let fileName = 'Uploaded_Document.pdf';
      let fileSize = '2.8 MB';

      if (config.data instanceof FormData) {
        const metadataPart = config.data.get('metadata');
        if (metadataPart) {
          if (typeof metadataPart === 'string') meta = JSON.parse(metadataPart);
          else if (metadataPart instanceof Blob) {
            // will be handled synchronously in mock
          }
        }
        const filePart = config.data.get('file') as File | null;
        if (filePart && filePart.name) {
          fileName = filePart.name;
          fileSize = (filePart.size / (1024 * 1024)).toFixed(1) + ' MB';
        }
      } else if (config.data) {
        meta = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      }

      const newResource = {
        id: Date.now(),
        classroomId: meta.classroomId || 1,
        title: meta.title || 'Untitled Resource',
        description: meta.description || '',
        subject: meta.subject || 'CS-301',
        type: meta.type || 'NOTES',
        fileName: fileName,
        fileSize: fileSize,
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        uploadedBy: 'Dr. Sarah Müller',
        createdAt: now,
        updatedAt: now,
      };

      list = [newResource, ...list];
      setStored(LOCAL_STORAGE_KEYS.resources, list);
      return { success: true, message: 'Resource uploaded successfully', data: newResource, timestamp: now };
    }

    const idMatch = url.match(/\/api\/resources\/(\d+)/);
    if (idMatch && method === 'put') {
      const id = parseInt(idMatch[1], 10);
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      list = list.map((r) => (r.id === id ? { ...r, ...body, updatedAt: now } : r));
      setStored(LOCAL_STORAGE_KEYS.resources, list);
      const updated = list.find((r) => r.id === id);
      return { success: true, message: 'Resource updated', data: updated, timestamp: now };
    }

    if (idMatch && method === 'delete') {
      const id = parseInt(idMatch[1], 10);
      list = list.filter((r) => r.id !== id);
      setStored(LOCAL_STORAGE_KEYS.resources, list);
      return { success: true, message: 'Resource deleted', data: null, timestamp: now };
    }
  }

  // 5. EVENTS
  if (url.startsWith('/api/events')) {
    let list = getStored(LOCAL_STORAGE_KEYS.events, INITIAL_EVENTS);

    if (method === 'get') {
      if (url.includes('/upcoming')) {
        const upcoming = list.filter((e) => e.isUpcoming !== false);
        return { success: true, message: 'OK', data: upcoming, timestamp: now };
      }

      const idMatch = url.match(/\/api\/events\/(\d+)$/);
      if (idMatch) {
        const id = parseInt(idMatch[1], 10);
        const item = list.find((e) => e.id === id) || list[0];
        return { success: true, message: 'OK', data: item, timestamp: now };
      }

      const parsedUrl = new URL(url, 'http://localhost:8082');
      const type = parsedUrl.searchParams.get('type');
      let filtered = [...list];
      if (type && type !== 'ALL') {
        filtered = filtered.filter((e) => e.type.toUpperCase() === type.toUpperCase());
      }

      const pageResult: SpringPage<any> = {
        content: filtered,
        totalPages: Math.ceil(filtered.length / 20) || 1,
        totalElements: filtered.length,
        size: 20,
        number: 0,
        first: true,
        last: true,
      };
      return { success: true, message: 'OK', data: pageResult, timestamp: now };
    }

    if (method === 'post') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const newEvent = {
        ...body,
        id: Date.now(),
        isUpcoming: true,
      };
      list = [newEvent, ...list];
      setStored(LOCAL_STORAGE_KEYS.events, list);
      return { success: true, message: 'Academic event created', data: newEvent, timestamp: now };
    }

    const idMatch = url.match(/\/api\/events\/(\d+)/);
    if (idMatch && method === 'put') {
      const id = parseInt(idMatch[1], 10);
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      list = list.map((e) => (e.id === id ? { ...e, ...body } : e));
      setStored(LOCAL_STORAGE_KEYS.events, list);
      const updated = list.find((e) => e.id === id);
      return { success: true, message: 'Event updated', data: updated, timestamp: now };
    }

    if (idMatch && method === 'delete') {
      const id = parseInt(idMatch[1], 10);
      list = list.filter((e) => e.id !== id);
      setStored(LOCAL_STORAGE_KEYS.events, list);
      return { success: true, message: 'Event deleted', data: null, timestamp: now };
    }
  }

  return { success: true, message: 'OK', data: {}, timestamp: now };
}

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    // If backend connection fails (ERR_CONNECTION_REFUSED or timeout or network error),
    // serve fallback mock data so app remains fully interactive and testable.
    if (!error.response && error.config) {
      console.warn(`[SCMS API] Backend at ${BASE_URL} not reachable. Serving simulated fallback data.`);
      const mockResult = handleMockFallback(error.config);
      return {
        data: mockResult,
        status: 200,
        statusText: 'OK (Local Fallback)',
        headers: {},
        config: error.config,
      };
    }
    return Promise.reject(error);
  }
);

export default api;
