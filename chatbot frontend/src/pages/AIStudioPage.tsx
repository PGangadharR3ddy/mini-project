import React, { useState } from 'react';
import { AudioTranscriber } from '../components/ai/AudioTranscriber';
import { VideoGenerator } from '../components/ai/VideoGenerator';
import {
  Sparkles,
  Mic,
  Video,
  BookOpen,
  Film,
  Layers,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';

type StudioTab = 'TRANSCRIBE' | 'VIDEO';

export const AIStudioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudioTab>('TRANSCRIBE');

  return (
    <div id="ai-studio-page" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Classroom AI Studio
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Advanced speech-to-text dictation with gemini-3.5-transcribe & educational video synthesis with Veo 3
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          id="tab-transcribe"
          onClick={() => setActiveTab('TRANSCRIBE')}
          className={`px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'TRANSCRIBE'
              ? 'border-indigo-600 text-indigo-600 bg-white/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mic className="w-4 h-4" />
          Audio Dictation & Transcription
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono">
            gemini-3.5-transcribe
          </span>
        </button>

        <button
          type="button"
          id="tab-video"
          onClick={() => setActiveTab('VIDEO')}
          className={`px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'VIDEO'
              ? 'border-indigo-600 text-indigo-600 bg-white/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Video className="w-4 h-4" />
          Veo 3 Video Generator
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono">
            veo-3.1-fast-generate-preview
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'TRANSCRIBE' ? (
          <AudioTranscriber />
        ) : (
          <VideoGenerator />
        )}
      </div>
    </div>
  );
};
