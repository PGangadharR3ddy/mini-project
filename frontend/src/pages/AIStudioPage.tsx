import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  FileText,
  LoaderCircle,
  Mic,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { transcribeAudio } from '../api/transcription';

export function AIStudioPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [copied, setCopied] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast.error('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      setAudioBlob(null);
      setAudioUrl(null);
      setTranscription('');
      setCopied(false);

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start(250);
      setRecordingDuration(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordingDuration((duration) => duration + 1), 1000);
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      console.error('Could not start audio recording:', error);
      toast.error('Microphone access was denied or is unavailable.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRecording(false);
  };

  const handleTranscribe = async () => {
    if (!audioBlob || isTranscribing) return;

    setIsTranscribing(true);
    try {
      const result = await transcribeAudio(audioBlob);
      setTranscription(result.transcript);
      toast.success('Audio transcribed successfully.');
    } catch (error) {
      console.error('Audio transcription failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to transcribe audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const resetSession = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription('');
    setRecordingDuration(0);
    setCopied(false);
  };

  const copyTranscription = async () => {
    try {
      await navigator.clipboard.writeText(transcription);
      setCopied(true);
      toast.success('Transcription copied.');
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Could not copy transcription:', error);
      toast.error('Could not copy the transcription to the clipboard.');
    }
  };

  const formatDuration = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
              AI Studio
            </span>
            <span className="text-xs text-stone-500 font-medium">Audio tools for learning</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
            Audio Transcription
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Record a lecture or voice note and turn it into text.
          </p>
        </div>
        {audioBlob && (
          <button
            type="button"
            onClick={resetSession}
            disabled={isTranscribing}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset session
          </button>
        )}
      </header>

      <section className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900">Record audio</h2>
            <p className="text-xs text-stone-500">
              Your recording is transcribed by the classroom AI service.
            </p>
          </div>
        </div>

        <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200 flex flex-col items-center justify-center gap-4 text-center">
          {isRecording ? (
            <>
              <button
                type="button"
                onClick={stopRecording}
                aria-label="Stop recording"
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors"
              >
                <Square className="w-6 h-6 fill-white" />
              </button>
              <div>
                <p className="text-sm font-semibold text-rose-700">
                  Recording · {formatDuration(recordingDuration)}
                </p>
                <p className="text-xs text-stone-500 mt-1">Select stop when you are finished.</p>
              </div>
            </>
          ) : !audioBlob ? (
            <>
              <button
                type="button"
                onClick={startRecording}
                disabled={isTranscribing}
                aria-label="Start recording"
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-900 hover:bg-stone-800 text-white shadow-md transition-colors"
              >
                <Mic className="w-7 h-7" />
              </button>
              <div>
                <p className="text-sm font-semibold text-stone-800">Start a recording</p>
                <p className="text-xs text-stone-500 mt-1">
                  Allow microphone access when your browser asks.
                </p>
              </div>
            </>
          ) : (
            <div className="w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
                <span className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-indigo-700" />
                  Recorded audio
                </span>
                <span>{formatDuration(recordingDuration)}</span>
              </div>
              {audioUrl && <audio controls src={audioUrl} className="w-full" />}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleTranscribe}
                  disabled={isTranscribing}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                >
                  {isTranscribing ? (
                    <>
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Transcribe recording
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-4 py-2.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors"
                >
                  Record again
                </button>
              </div>
            </div>
          )}
        </div>

        {transcription && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-700" />
                Transcription
              </h3>
              <button
                type="button"
                onClick={copyTranscription}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy text'}
              </button>
            </div>
            <div className="p-5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
              {transcription}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
