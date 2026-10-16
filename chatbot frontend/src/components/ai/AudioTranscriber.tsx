import React, { useState, useRef, useEffect } from 'react';
import { transcribeAudio } from '../../api/aiService';
import { useToast } from '../../hooks/useToast';
import {
  Mic,
  Square,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  FileText,
  AlertCircle,
  Loader2,
  Share2,
} from 'lucide-react';

interface AudioTranscriberProps {
  id?: string;
  onTranscriptionComplete?: (text: string) => void;
  targetContext?: 'notes' | 'announcement' | 'project' | 'general';
}

export const AudioTranscriber: React.FC<AudioTranscriberProps> = ({
  id = 'audio-transcriber',
  onTranscriptionComplete,
  targetContext = 'general',
}) => {
  const { success, error: showError } = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(
    'Transcribe this classroom lecture / voice note clearly, structuring key points, concepts, and takeaways.'
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Start recording from microphone
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Prefer audio/webm if supported
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setAudioUrl(url);

        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // Collect data every 250ms
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Mic access error', err);
      showError('Microphone access denied or unavailable. Please grant mic permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Convert Blob to base64 string
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Transcribe recorded audio
  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    try {
      const base64 = await blobToBase64(audioBlob);
      const text = await transcribeAudio(base64, audioBlob.type, customPrompt);
      setTranscription(text);
      if (onTranscriptionComplete) {
        onTranscriptionComplete(text);
      }
      success('Audio transcribed successfully with gemini-3.5-transcribe!');
    } catch (err: any) {
      console.error(err);
      showError(err.message || 'Failed to transcribe audio recording');
    } finally {
      setIsTranscribing(false);
    }
  };

  const copyToClipboard = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    success('Transcription copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAll = () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setTranscription('');
    setRecordingDuration(0);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div
      id={id}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 md:p-8 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              Classroom Audio Dictation & Transcriber
              <span className="text-[10px] font-mono uppercase bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                gemini-3.5-transcribe
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Record lectures, viva voice notes, or project discussions to generate instant notes
            </p>
          </div>
        </div>

        {audioBlob && (
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Session
          </button>
        )}
      </div>

      {/* Recording Controls */}
      <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 flex flex-col items-center justify-center space-y-4 text-center">
        {isRecording ? (
          <div className="space-y-4 flex flex-col items-center">
            {/* Animated Pulsing Recording Indicator */}
            <div className="relative">
              <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-rose-400 opacity-75" />
              <button
                type="button"
                id="stop-recording-btn"
                onClick={stopRecording}
                className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-transform active:scale-95"
              >
                <Square className="w-6 h-6 fill-white" />
              </button>
            </div>
            <div>
              <p className="text-sm font-bold text-rose-600 flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                Recording in progress... {formatSeconds(recordingDuration)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Speak clearly into your microphone. Tap the square button to finish.
              </p>
            </div>
          </div>
        ) : !audioBlob ? (
          <div className="space-y-3 flex flex-col items-center py-4">
            <button
              type="button"
              id="start-recording-btn"
              onClick={startRecording}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-transform hover:scale-105 active:scale-95"
            >
              <Mic className="w-7 h-7" />
            </button>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Click microphone to record audio
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                Dictate study summaries, faculty lecture segments, or team meeting points
              </p>
            </div>
          </div>
        ) : (
          /* Playback & Transcribe Ready */
          <div className="w-full max-w-md space-y-4 py-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold px-1">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-600" />
                Recording Duration
              </span>
              <span>{formatSeconds(recordingDuration || 5)}</span>
            </div>

            {audioUrl && (
              <audio
                controls
                src={audioUrl}
                className="w-full h-10 rounded-xl bg-white border border-slate-200"
              />
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                id="transcribe-audio-btn"
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className="w-full flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Transcribing with gemini-3.5-transcribe...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    Transcribe Recording
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={startRecording}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
              >
                Re-record
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transcription Output View */}
      {transcription && (
        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Generated Transcription & Notes
            </h3>
            <button
              type="button"
              id="copy-transcription-btn"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans selection:bg-indigo-100">
            {transcription}
          </div>
        </div>
      )}
    </div>
  );
};
