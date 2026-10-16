import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types';
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_CLASSROOMS,
  INITIAL_EVENTS,
  INITIAL_JOIN_REQUESTS,
  INITIAL_PROJECTS,
  INITIAL_RESOURCES,
  INITIAL_TIMETABLE,
} from './mockData';

// Allow configurable API URL with default to http://localhost:8082
const getBaseUrl = () => {
  return localStorage.getItem('custom_api_url') || 'http://localhost:8082';
};

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Authorization Bearer token from localStorage
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Update baseURL in case it was modified in settings
    config.baseURL = getBaseUrl();
    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================================================================
   LOCAL REACTIVE MOCK STORE (Ensures seamless preview interactivity)
========================================================================= */

const STORAGE_KEYS = {
  CLASSROOMS: 'scm_mock_classrooms',
  TIMETABLE: 'scm_mock_timetable',
  ANNOUNCEMENTS: 'scm_mock_announcements',
  RESOURCES: 'scm_mock_resources',
  EVENTS: 'scm_mock_events',
  PROJECTS: 'scm_mock_projects',
  JOIN_REQUESTS: 'scm_mock_join_requests',
};

export const getMockStore = () => {
  const getItem = <T>(key: string, initial: T): T => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        localStorage.setItem(key, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(stored);
    } catch {
      return initial;
    }
  };

  return {
    classrooms: getItem(STORAGE_KEYS.CLASSROOMS, INITIAL_CLASSROOMS),
    timetable: getItem(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE),
    announcements: getItem(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS),
    resources: getItem(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES),
    events: getItem(STORAGE_KEYS.EVENTS, INITIAL_EVENTS),
    projects: getItem(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS),
    joinRequests: getItem(STORAGE_KEYS.JOIN_REQUESTS, INITIAL_JOIN_REQUESTS),
  };
};

export const saveMockStore = (store: {
  classrooms?: any[];
  timetable?: any[];
  announcements?: any[];
  resources?: any[];
  events?: any[];
  projects?: any[];
  joinRequests?: any[];
}) => {
  if (store.classrooms) localStorage.setItem(STORAGE_KEYS.CLASSROOMS, JSON.stringify(store.classrooms));
  if (store.timetable) localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(store.timetable));
  if (store.announcements) localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(store.announcements));
  if (store.resources) localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(store.resources));
  if (store.events) localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(store.events));
  if (store.projects) localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(store.projects));
  if (store.joinRequests) localStorage.setItem(STORAGE_KEYS.JOIN_REQUESTS, JSON.stringify(store.joinRequests));
};

export function resetMockData() {
  localStorage.setItem(STORAGE_KEYS.CLASSROOMS, JSON.stringify(INITIAL_CLASSROOMS));
  localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(INITIAL_TIMETABLE));
  localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
  localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(INITIAL_RESOURCES));
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
  localStorage.setItem(STORAGE_KEYS.JOIN_REQUESTS, JSON.stringify(INITIAL_JOIN_REQUESTS));
}

/**
 * Execute real axios request, falling back to mock store if backend is unreachable.
 * Always unwraps response.data.data as specified in user prompt.
 */
export async function executeApi<T>(
  requestFn: () => Promise<{ data: ApiResponse<T> }>,
  mockFallbackFn: () => T | Promise<T>
): Promise<T> {
  try {
    const response = await requestFn();
    // User specification: Always read from response.data.data
    if (response?.data && 'data' in response.data) {
      return response.data.data;
    }
    return (response as any).data;
  } catch (error) {
    const isNetworkError =
      axios.isAxiosError(error) &&
      (!error.response ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNREFUSED' ||
        error.message.includes('Network Error'));

    if (isNetworkError) {
      // Simulate minor network latency for realistic feel
      await new Promise((r) => setTimeout(r, 120));
      return await mockFallbackFn();
    }
    // If backend returned actual 4xx/5xx error, throw it so UI can show proper toast
    throw error;
  }
}
