import axios from 'axios';
import { ApiResponse } from '../types';
import { addDemoIdentityHeaders } from './axios';

export interface StudyDocument {
  id: number;
  documentId: string;
  filename: string;
  pagesProcessed: number | null;
  chunksIndexed: number | null;
  classroomId: number | null;
  uploadedAt: string;
}

export interface StudyAnswer {
  documentId: string;
  filename: string;
  question: string;
  answer: string | { answer?: string };
  source_pages: number[];
}

export interface StudyHealth {
  ollama_connected: boolean;
  model: string;
  model_installed: boolean;
  available_models: string[];
  error?: string;
}

export interface StudyModeResponse {
  filename: string;
  pagesProcessed: number;
  sectionsProcessed: number;
  summary: string;
  sectionSummaries: Array<{
    section: number;
    source_pages: number[];
    summary: string;
  }>;
  quiz: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    source_pages: number[];
  }>;
  notice?: string;
}

const studyApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8082',
  timeout: 15000,
});

studyApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

studyApi.interceptors.request.use(addDemoIdentityHeaders);

export async function getStudyHealth(): Promise<StudyHealth> {
  const response = await studyApi.get<ApiResponse<StudyHealth>>('/api/study/health');
  return response.data.data;
}

export async function getMyStudyDocuments(): Promise<StudyDocument[]> {
  const response = await studyApi.get<ApiResponse<StudyDocument[]>>('/api/study/documents');
  return response.data.data;
}

export async function uploadStudyDocument(
  file: File,
  classroomId?: number
): Promise<StudyDocument> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await studyApi.post<ApiResponse<StudyDocument>>(
    '/api/study/documents',
    formData,
    {
      params: classroomId ? { classroomId } : undefined,
      timeout: 300000,
    }
  );
  return response.data.data;
}

export async function askStudyDocumentQuestion(
  documentId: string,
  question: string
): Promise<StudyAnswer> {
  const response = await studyApi.post<ApiResponse<StudyAnswer>>(
    `/api/study/documents/${encodeURIComponent(documentId)}/ask`,
    { question },
    { timeout: 300000 }
  );
  return response.data.data;
}

export async function generateStudyMode(file: File): Promise<StudyModeResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await studyApi.post<ApiResponse<StudyModeResponse>>(
    '/api/study/study-mode',
    formData,
    { timeout: 300000 }
  );
  return response.data.data;
}
