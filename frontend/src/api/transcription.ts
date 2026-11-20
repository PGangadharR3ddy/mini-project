import axios from 'axios';

interface TranscriptionResponse {
  transcript: string;
  language?: string | null;
  duration_seconds?: number | null;
  file_name?: string;
  model_used?: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    speaker: string | null;
  }>;
}

interface SummarizeResponse {
  summary: string;
}

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';
export const MAX_TRANSCRIPTION_FILE_SIZE_BYTES = 200 * 1024 * 1024;
const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  'mp3', 'wav', 'm4a', 'mp4', 'mpeg', 'mpga', 'webm', 'ogg', 'flac',
]);

function getExtension(filename: string): string | undefined {
  const match = filename.match(/\.([^.]+)$/);
  return match?.[1].toLowerCase();
}

export function isSupportedAudioFile(file: File): boolean {
  const extension = getExtension(file.name);
  return Boolean(extension && SUPPORTED_AUDIO_EXTENSIONS.has(extension));
}

export async function transcribeAudio(audio: Blob): Promise<TranscriptionResponse> {
  const formData = new FormData();
  const file = audio instanceof File ? audio : null;
  const extensionByMimeType: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp4': 'mp4',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/x-wav': 'wav',
  };
  const extension = (file && getExtension(file.name))
    || extensionByMimeType[audio.type.split(';')[0].toLowerCase()];
  if (!extension || !SUPPORTED_AUDIO_EXTENSIONS.has(extension)) {
    throw new Error('Unsupported audio format. Use MP3, WAV, M4A, MP4, MPEG, OGG, FLAC, or WebM.');
  }
  if (audio.size === 0) {
    throw new Error('The audio file is empty.');
  }
  if (audio.size > MAX_TRANSCRIPTION_FILE_SIZE_BYTES) {
    throw new Error('Audio files must be 200 MB or smaller.');
  }
  formData.append('audio_file', audio, file?.name || `recording.${extension}`);

  try {
    const response = await axios.post<TranscriptionResponse>(
      `${AI_SERVICE_URL}/transcribe`,
      formData,
      { timeout: 600000 }
    );

    if (!response.data.transcript?.trim()) {
      throw new Error('The transcription service returned an empty transcript.');
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError<{ message?: string; detail?: string; error?: string }>(error)) {
      const data = error.response?.data;
      throw new Error(
        data?.message ||
          data?.detail ||
          data?.error ||
          (error.code === 'ECONNABORTED'
            ? 'Transcription timed out. Try a shorter recording.'
            : 'Could not transcribe audio. Check that the AI service is running.')
      );
    }

    throw error;
  }
}

export async function summarizeTranscript(transcript: string): Promise<SummarizeResponse> {
  try {
    const response = await axios.post<SummarizeResponse>(
      `${AI_SERVICE_URL}/summarize`,
      { transcript },
      { timeout: 300000 }
    );

    if (!response.data.summary?.trim()) {
      throw new Error('The summarization service returned an empty summary.');
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError<{ message?: string; detail?: string; error?: string }>(error)) {
      const data = error.response?.data;
      throw new Error(
        data?.message ||
          data?.detail ||
          data?.error ||
          (error.code === 'ECONNABORTED'
            ? 'Summarization timed out. Try a shorter transcript.'
            : 'Could not summarize the transcript. Check that the AI service is running.')
      );
    }

    throw error;
  }
}
