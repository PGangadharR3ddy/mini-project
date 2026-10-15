/**
 * Client service to interact with server-side AI endpoints:
 * 1. Audio Transcription using gemini-3.5-transcribe
 * 2. Video Generation using veo-3.1-fast-generate-preview
 */

export interface TranscribeResult {
  transcription: string;
}

export interface VideoStartResponse {
  operationName: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
}

export interface VideoStatusResponse {
  done?: boolean;
  error?: any;
}

/**
 * Transcribe recorded audio (base64 string) via server-side gemini-3.5-transcribe
 */
export async function transcribeAudio(
  audioBase64: string,
  mimeType: string = 'audio/webm',
  customPrompt?: string
): Promise<string> {
  const response = await fetch('/api/ai/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audioData: audioBase64,
      mimeType,
      prompt: customPrompt,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to transcribe audio recording');
  }

  const data: TranscribeResult = await response.json();
  return data.transcription;
}

/**
 * Start video generation with veo-3.1-fast-generate-preview
 */
export async function startVideoGeneration(
  prompt: string,
  aspectRatio: '16:9' | '9:16' = '16:9',
  resolution: '720p' | '1080p' = '720p'
): Promise<VideoStartResponse> {
  const response = await fetch('/api/ai/generate-video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      aspectRatio,
      resolution,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to initialize video generation');
  }

  return response.json();
}

/**
 * Poll video generation status
 */
export async function checkVideoStatus(operationName: string): Promise<VideoStatusResponse> {
  const response = await fetch('/api/ai/video-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operationName,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to check video status');
  }

  return response.json();
}

/**
 * Download completed video as a playable Blob URL
 */
export async function fetchCompletedVideoBlob(operationName: string): Promise<string> {
  const response = await fetch('/api/ai/video-download', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operationName,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to download generated video stream');
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
