import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpenCheck,
  MessageSquare,
  GraduationCap,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { QAMode } from './QAMode';
import { StudyMode } from './StudyMode';
import { getStudyHealth, StudyHealthResponse } from '../../api/study';

type StudyTab = 'qa' | 'study';

export const StudyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudyTab>('qa');
  const [health, setHealth] = useState<StudyHealthResponse | null>(null);
  const [checkingHealth, setCheckingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<boolean>(false);

  const checkServiceHealth = useCallback(async () => {
    setCheckingHealth(true);
    try {
      const data = await getStudyHealth();
      setHealth(data);
      const isOnline = Boolean(data && data.ollamaConnected);
      setHealthError(!isOnline);
    } catch {
      setHealth(null);
      setHealthError(true);
    } finally {
      setCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    checkServiceHealth();
  }, [checkServiceHealth]);

  const isAiReady = !healthError && Boolean(health?.ollamaConnected);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Warning Banner if Health Check Fails */}
      {!checkingHealth && !isAiReady && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-rose-900">
                AI service is offline. Start Ollama and FastAPI to use this feature.
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Ensure Spring Boot (port 8082), FastAPI (port 8000), and Ollama are running locally.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={checkServiceHealth}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-100/60 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Top Page Header with Ollama Status Indicator in Top Right Corner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-sm shrink-0">
              <BookOpenCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  PDF Study Assistant
                </h1>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  RAG + Quiz
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Upload course PDFs to ask source-cited questions or generate structured summaries and practice quizzes
              </p>
            </div>
          </div>

          {/* Ollama Status Indicator in the top right corner */}
          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            <div
              onClick={checkServiceHealth}
              title={
                health?.model
                  ? `Model: ${health.model} (${health.modelInstalled ? 'Installed' : 'Not Installed'}) — Click to refresh`
                  : 'Click to refresh AI health status'
              }
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
                isAiReady
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900 hover:bg-emerald-100/70'
                  : 'bg-rose-50/90 border-rose-200 text-rose-900 hover:bg-rose-100/70'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isAiReady
                    ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                    : 'bg-rose-500 ring-4 ring-rose-500/20'
                }`}
              />
              <span>{isAiReady ? '🟢 AI Ready' : '🔴 AI Offline'}</span>
              {health?.model && isAiReady && (
                <span className="text-[11px] font-medium text-emerald-700 pl-1 border-l border-emerald-200">
                  {health.model}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Two Mode Tabs: Tab 1: Q&A Mode | Tab 2: Study Mode */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('qa')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'qa'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Q&amp;A Mode</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                activeTab === 'qa'
                  ? 'bg-indigo-700 text-indigo-100'
                  : 'bg-white text-slate-500'
              }`}
            >
              Ask PDF
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('study')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'study'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Study Mode</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                activeTab === 'study'
                  ? 'bg-indigo-700 text-indigo-100'
                  : 'bg-white text-slate-500'
              }`}
            >
              Summary + Quiz
            </span>
          </button>
        </div>
      </div>

      {/* Active Tab Content */}
      <div>{activeTab === 'qa' ? <QAMode /> : <StudyMode />}</div>
    </div>
  );
};
