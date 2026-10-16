import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Bot,
  CheckCircle2,
  FileText,
  LoaderCircle,
  MessageSquare,
  Send,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  askStudyDocumentQuestion,
  getMyStudyDocuments,
  getStudyHealth,
  StudyDocument,
  StudyHealth,
  uploadStudyDocument,
} from '../api/study';
import { useAuth } from '../hooks/useAuth';
import { ApiResponse } from '../types';
import { StudyModePanel } from '../components/StudyModePanel';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: number[];
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiResponse<unknown> & { detail?: string; error?: string }>(error)) {
    const data = error.response?.data;
    return data?.message || data?.detail || data?.error || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function StudyAssistantPage() {
  const { classroomId } = useAuth();
  const [health, setHealth] = useState<StudyHealth | null>(null);
  const [activeMode, setActiveMode] = useState<'qa' | 'study'>('qa');
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeDocument = documents.find((document) => document.documentId === activeDocumentId);

  const refreshDocuments = useCallback(async () => {
    const result = await getMyStudyDocuments();
    setDocuments(result);
    setActiveDocumentId((currentId) =>
      result.some((document) => document.documentId === currentId)
        ? currentId
        : result[0]?.documentId || ''
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([getStudyHealth(), getMyStudyDocuments()]).then(([healthResult, docsResult]) => {
      if (!mounted) return;
      if (healthResult.status === 'fulfilled') {
        setHealth(healthResult.value);
      }
      if (docsResult.status === 'fulfilled') {
        setDocuments(docsResult.value);
        setActiveDocumentId(docsResult.value[0]?.documentId || '');
      } else {
        toast.error(getErrorMessage(docsResult.reason, 'Could not load your documents.'));
      }
      setLoadingDocuments(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, asking]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Choose a PDF file.');
      event.target.value = '';
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('PDFs must be 15 MB or smaller.');
      event.target.value = '';
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile || uploading) return;

    setUploading(true);
    try {
      const uploaded = await uploadStudyDocument(selectedFile, classroomId);
      setDocuments((current) => [
        uploaded,
        ...current.filter((document) => document.documentId !== uploaded.documentId),
      ]);
      setActiveDocumentId(uploaded.documentId);
      setSelectedFile(null);
      setMessages([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success(`Indexed ${uploaded.filename} (${uploaded.chunksIndexed ?? 0} chunks).`);
      try {
        setDocuments(await getMyStudyDocuments());
      } catch (error) {
        toast.error(getErrorMessage(error, 'The PDF was indexed, but the document list could not refresh.'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'PDF upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!activeDocumentId || trimmedQuestion.length < 3 || asking) return;

    const documentId = activeDocumentId;
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: 'user', text: trimmedQuestion },
    ]);
    setQuestion('');
    setAsking(true);

    try {
      const result = await askStudyDocumentQuestion(documentId, trimmedQuestion);
      const answer =
        typeof result.answer === 'string'
          ? result.answer
          : result.answer.answer || 'The assistant could not find enough supported information.';
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: answer,
          sources: result.source_pages || [],
        },
      ]);
    } catch (error) {
      const message = getErrorMessage(error, 'Could not get an answer from the study service.');
      setMessages((current) => [
        ...current,
        { id: `error-${Date.now()}`, role: 'assistant', text: message },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const aiAvailable = health?.ollama_connected === true && health.model_installed === true;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 rounded-xl border-2 border-stone-900 bg-[#faf9f4] p-6 shadow-[4px_4px_0_0_#1b1c19] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center border-2 border-stone-900 bg-emerald-300">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-serif-title text-2xl font-bold">PDF Study Assistant</h1>
            <p className="mt-1 text-sm text-stone-600">
              Upload course notes and ask questions grounded in that document.
            </p>
          </div>
        </div>
        <div
          className={`inline-flex w-fit items-center gap-2 border-2 border-stone-900 px-3 py-2 text-xs font-bold uppercase ${
            aiAvailable ? 'bg-emerald-200' : 'bg-rose-200'
          }`}
          role="status"
        >
          {aiAvailable ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          {aiAvailable
            ? `Ollama ready · ${health?.model}`
            : health?.ollama_connected
              ? `Model unavailable · ${health.model}`
              : 'Ollama unavailable'}
        </div>
      </header>

      <div className="flex gap-2" role="tablist" aria-label="Study assistant mode">
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === 'qa'}
          onClick={() => setActiveMode('qa')}
          className={`border-2 border-stone-900 px-4 py-2 text-sm font-bold ${
            activeMode === 'qa' ? 'bg-stone-900 text-white' : 'bg-white hover:bg-stone-100'
          }`}
        >
          PDF Q&amp;A
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === 'study'}
          onClick={() => setActiveMode('study')}
          className={`border-2 border-stone-900 px-4 py-2 text-sm font-bold ${
            activeMode === 'study' ? 'bg-stone-900 text-white' : 'bg-white hover:bg-stone-100'
          }`}
        >
          Summary &amp; Quiz
        </button>
      </div>

      {activeMode === 'study' ? <StudyModePanel /> : (
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="border-2 border-stone-900 bg-white p-5 shadow-[3px_3px_0_0_#1b1c19]">
            <h2 className="mb-1 flex items-center gap-2 text-base font-bold">
              <Upload className="h-4 w-4" /> Upload a PDF
            </h2>
            <p className="mb-4 text-xs text-stone-600">PDF format, maximum 15 MB.</p>
            <form onSubmit={handleUpload} className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm file:mr-3 file:border-2 file:border-stone-900 file:bg-[#faf9f4] file:px-3 file:py-2 file:text-xs file:font-bold"
              />
              {selectedFile && (
                <p className="truncate text-xs text-stone-600" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
              )}
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="flex w-full items-center justify-center gap-2 border-2 border-stone-900 bg-emerald-300 px-4 py-2.5 text-sm font-bold hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {uploading ? 'Uploading and indexing…' : 'Upload and index'}
              </button>
            </form>
          </section>

          <section className="border-2 border-stone-900 bg-white p-5 shadow-[3px_3px_0_0_#1b1c19]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <FileText className="h-4 w-4" /> Your documents
              </h2>
              <span className="text-xs text-stone-500">{documents.length}</span>
            </div>
            {loadingDocuments ? (
              <p className="text-sm text-stone-500">Loading documents…</p>
            ) : documents.length === 0 ? (
              <p className="text-sm text-stone-500">Upload a PDF to start a document chat.</p>
            ) : (
              <ul className="max-h-[420px] space-y-2 overflow-y-auto">
                {documents.map((document) => (
                  <li key={document.documentId}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDocumentId(document.documentId);
                        setMessages([]);
                      }}
                      className={`w-full border-2 p-3 text-left transition-colors ${
                        activeDocumentId === document.documentId
                          ? 'border-stone-900 bg-emerald-100'
                          : 'border-stone-200 hover:border-stone-500'
                      }`}
                    >
                      <span className="block truncate text-sm font-bold" title={document.filename}>
                        {document.filename}
                      </span>
                      <span className="mt-1 block text-xs text-stone-600">
                        {document.chunksIndexed ?? 0} chunks ·{' '}
                        {new Date(document.uploadedAt).toLocaleDateString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <section className="flex min-h-[620px] flex-col border-2 border-stone-900 bg-white shadow-[3px_3px_0_0_#1b1c19]">
          <div className="flex items-center gap-3 border-b-2 border-stone-900 bg-[#faf9f4] p-4">
            <MessageSquare className="h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <h2 className="truncate font-bold">
                {activeDocument?.filename || 'Choose a document to chat'}
              </h2>
              <p className="text-xs text-stone-600">
                {activeDocument
                  ? 'Answers are retrieved from this PDF.'
                  : 'Upload a PDF or select one from your documents.'}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-stone-50 p-4 sm:p-6">
            {!activeDocument && (
              <div className="flex h-full min-h-64 flex-col items-center justify-center text-center text-stone-500">
                <Bot className="mb-3 h-10 w-10" />
                <p className="font-bold">Your document chat starts here</p>
              </div>
            )}
            {activeDocument && messages.length === 0 && (
              <div className="flex h-full min-h-64 flex-col items-center justify-center text-center text-stone-500">
                <MessageSquare className="mb-3 h-9 w-9" />
                <p className="font-bold">Ask a question about this PDF</p>
                <p className="mt-1 max-w-sm text-sm">
                  The assistant will search this document and include the matching source chunks.
                </p>
              </div>
            )}
            {messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[90%] border-2 border-stone-900 p-4 ${
                  message.role === 'user' ? 'ml-auto bg-emerald-100' : 'mr-auto bg-white'
                }`}
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  {message.role === 'user' ? 'You' : 'Study assistant'}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
                {!!message.sources?.length && (
                  <div className="mt-3 space-y-2 border-t border-stone-200 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Source pages
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((page) => (
                        <span
                          key={page}
                          className="border border-stone-300 bg-emerald-50 px-2 py-1 text-xs font-semibold"
                        >
                          Page {page}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
            {asking && (
              <div className="mr-auto flex items-center gap-2 border-2 border-stone-900 bg-white p-3 text-sm">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Searching the document…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleAsk} className="flex gap-2 border-t-2 border-stone-900 p-3 sm:p-4">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              disabled={!activeDocument || asking}
              minLength={3}
              placeholder={activeDocument ? 'Ask a question about this PDF…' : 'Select a document first'}
              className="min-w-0 flex-1 border-2 border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900 disabled:bg-stone-100"
            />
            <button
              type="submit"
              disabled={!activeDocument || question.trim().length < 3 || asking}
              aria-label="Send question"
              className="flex items-center justify-center gap-2 border-2 border-stone-900 bg-stone-900 px-4 py-2 text-sm font-bold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </section>
      </div>
      )}
    </div>
  );
}
