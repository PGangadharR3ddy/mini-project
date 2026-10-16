import axios from 'axios';

interface TranscriptionResponse {
  transcript: string;
  language?: string | null;
  duration_seconds?: number | null;
}

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

export async function transcribeAudio(audio: Blob): Promise<TranscriptionResponse> {
  const formData = new FormData();
  const extension = audio.type.includes('webm')
    ? 'webm'
    : audio.type.includes('ogg')
      ? 'ogg'
      : 'mp4';
  formData.append('audio_file', audio, `recording.${extension}`);

  try {
    const response = await axios.post<TranscriptionResponse>(
      `${AI_SERVICE_URL}/transcribe`,
      formData,
      { timeout: 300000 }
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
