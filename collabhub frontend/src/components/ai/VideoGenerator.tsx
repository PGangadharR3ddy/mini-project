import React, { useState, useEffect, useRef } from 'react';
import {
  startVideoGeneration,
  checkVideoStatus,
  fetchCompletedVideoBlob,
} from '../../api/aiService';
import { useToast } from '../../hooks/useToast';
import {
  Video,
  Sparkles,
  Loader2,
  Download,
  Film,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sliders,
  Laptop,
  Smartphone,
} from 'lucide-react';

interface VideoGeneratorProps {
  id?: string;
}

const SAMPLE_PROMPTS = [
  'A cinematic 3D animation explaining Dijkstra shortest path algorithm with glowing graph nodes and routing packets',
  'A microscopic medical simulation of CRISPR-Cas9 genome editing cutting viral DNA in a science laboratory',
  'An aerial orbital flythrough of an eco-friendly futuristic university campus with solar canopies and automated electric shuttles',
  'A time-lapse robotics simulation of an industrial robotic arm assembling satellite circuit boards with precision laser welding',
];

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ id = 'video-generator' }) => {
  const { success, error: showError, info } = useToast();

  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [operationName, setOperationName] = useState<string | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
    };
  }, [videoBlobUrl]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      showError('Please enter a descriptive prompt for the classroom video.');
      return;
    }

    setIsGenerating(true);
    setGenerationStage('Submitting request to Veo 3 video engine...');
    setElapsedSeconds(0);
    setVideoBlobUrl(null);

    // Timer for elapsed seconds
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    try {
      // Step 1: Start video operation
      const startRes = await startVideoGeneration(prompt.trim(), aspectRatio, resolution);
      setOperationName(startRes.operationName);
      setGenerationStage('Synthesizing frames and rendering neural visuals...');
      info('Video generation initiated. Veo 3 is processing your prompt...');

      // Step 2: Poll operation status every 5 seconds
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await checkVideoStatus(startRes.operationName);
          if (statusRes.done) {
            clearInterval(pollIntervalRef.current);
            setGenerationStage('Finalizing render & streaming video to browser...');

            // Step 3: Download video stream
            const url = await fetchCompletedVideoBlob(startRes.operationName);
            setVideoBlobUrl(url);
            setIsGenerating(false);
            setGenerationStage('');
            if (timerRef.current) clearInterval(timerRef.current);
            success('Video generation complete! Play or download your video below.');
          } else {
            // Reassuring dynamic progress stage message
            setGenerationStage((prev) => {
              if (prev.includes('Synthesizing')) return 'Generating lighting, raytracing & fluid motion...';
              if (prev.includes('lighting')) return 'Assembling video frames & encoding high-res MP4...';
              return 'Synthesizing frames and rendering neural visuals...';
            });
          }
        } catch (pollErr: any) {
          console.error('Polling error', pollErr);
        }
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setIsGenerating(false);
      setGenerationStage('');
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      showError(err.message || 'Failed to start video generation.');
    }
  };

  const handleReset = () => {
    setIsGenerating(false);
    setGenerationStage('');
    setElapsedSeconds(0);
    setOperationName(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
    setVideoBlobUrl(null);
  };

  return (
    <div
      id={id}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 md:p-8 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              Veo 3 AI Video Generator
              <span className="text-[10px] font-mono uppercase bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                veo-3.1-fast-generate-preview
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Create educational simulations, project demonstration clips, or research visualizations
            </p>
          </div>
        </div>

        {videoBlobUrl && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Create Another Video
          </button>
        )}
      </div>

      {/* Generation Form */}
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label htmlFor={`${id}-prompt`} className="block text-xs font-bold text-slate-700 mb-1.5">
            Video Generation Prompt <span className="text-rose-500">*</span>
          </label>
          <textarea
            id={`${id}-prompt`}
            rows={3}
            required
            value={prompt}
            disabled={isGenerating}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what happens in the video with style, actions, camera angles, and subject details..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 resize-none disabled:opacity-60"
          />
        </div>

        {/* Aspect Ratio & Resolution Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Aspect Ratio Selector (Mandatory 16:9 or 9:16) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Aspect Ratio <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="aspect-16-9-btn"
                disabled={isGenerating}
                onClick={() => setAspectRatio('16:9')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  aspectRatio === '16:9'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Laptop className="w-4 h-4" />
                16:9 Landscape
              </button>

              <button
                type="button"
                id="aspect-9-16-btn"
                disabled={isGenerating}
                onClick={() => setAspectRatio('9:16')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  aspectRatio === '9:16'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                9:16 Portrait
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports 16:9 for classroom displays or 9:16 for mobile/shorts
            </p>
          </div>

          {/* Resolution */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Resolution
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => setResolution('720p')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                  resolution === '720p'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                720p HD (Fast)
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => setResolution('1080p')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                  resolution === '1080p'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                1080p FHD
              </button>
            </div>
          </div>
        </div>

        {/* Sample Prompt Inspiration Pills */}
        {!isGenerating && !videoBlobUrl && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Try an educational prompt:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="text-left text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg transition-colors border border-slate-200/70"
                >
                  "{p.slice(0, 50)}..."
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        {!videoBlobUrl && (
          <div className="pt-2">
            <button
              type="submit"
              id="generate-video-submit-btn"
              disabled={isGenerating || !prompt.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Veo 3 Video ({elapsedSeconds}s)...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Video with Veo 3
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* In-Progress Loading State */}
      {isGenerating && (
        <div className="p-8 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-indigo-100 text-indigo-700 animate-bounce">
            <Film className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Generating High-Quality Classroom Video
            </h3>
            <p className="text-xs text-indigo-700 font-medium">
              {generationStage}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Neural video synthesis takes 1-2 minutes. Please keep this tab open while Veo 3 renders.
            </p>
          </div>

          <div className="w-full max-w-xs mx-auto bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full w-2/3 animate-pulse" />
          </div>

          <span className="inline-block text-xs font-mono font-bold text-slate-500">
            Elapsed time: {elapsedSeconds} seconds
          </span>
        </div>
      )}

      {/* Video Result Preview */}
      {videoBlobUrl && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Generated Classroom Video
            </h3>

            <a
              href={videoBlobUrl}
              download="classroom_simulation.mp4"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download MP4
            </a>
          </div>

          <div
            className={`mx-auto bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-900 flex items-center justify-center ${
              aspectRatio === '9:16' ? 'max-w-xs aspect-[9/16]' : 'max-w-2xl aspect-[16/9]'
            }`}
          >
            <video
              controls
              autoPlay
              loop
              src={videoBlobUrl}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
