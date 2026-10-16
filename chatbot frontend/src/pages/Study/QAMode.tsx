import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Send,
  Trash2,
  MessageSquare,
  CheckCircle2,
  Loader2,
  AlertCircle,
  BookOpen,
  Sparkles,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';
import {
  StudyDocument,
  uploadStudyDocument,
  getMyStudyDocuments,
  deleteStudyDocument,
  askStudyDocumentQuestion,
  getAnswerText,
} from '../../api/study';
import { getClassrooms } from '../../api/classrooms';
import { Classroom } from '../../types';
import { useToast } from '../../context/ToastContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sourcePages?: number[];
  isFallback?: boolean;
  timestamp: string;
}

export const QAMode: React.FC = () => {
  const { success, error: showError } = useToast();

  // Classrooms for optional dropdown
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUploadedDoc, setLastUploadedDoc] = useState<StudyDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Documents list state
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Active document & Chat state
  const [activeDocument, setActiveDocument] = useState<StudyDocument | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load classrooms and documents on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [clsList, docsList] = await Promise.all([
          getClassrooms(),
          getMyStudyDocuments(),
        ]);
        setClassrooms(clsList || []);
        setDocuments(docsList || []);
      } catch {
        // handled by fallback or toast
      } finally {
        setIsLoadingDocs(false);
      }
    };
    fetchInitialData();
  }, []);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistories, documentId, isAsking]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showError('Please select a valid PDF file (.pdf).');
      e.target.value = '';
      return;
    }

    const maxSizeBytes = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSizeBytes) {
      showError('File size exceeds the 15MB maximum limit.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadAndIndex = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showError('Please choose a PDF file first.');
      return;
    }

    setIsUploading(true);
    setLastUploadedDoc(null);

    try {
      const uploaded = await uploadStudyDocument(
        selectedFile,
        selectedClassroomId ? selectedClassroomId : undefined
      );

      setLastUploadedDoc(uploaded);
      setDocumentId(uploaded.documentId);
      setActiveDocument(uploaded);

      // Refresh documents list
      const updatedDocs = await getMyStudyDocuments();
      setDocuments(updatedDocs);

      // Clear file picker
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      success(`Indexed "${uploaded.filename}" (${uploaded.pagesProcessed} pages, ${uploaded.chunksIndexed} chunks)`);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to upload and index PDF.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectDocument = (doc: StudyDocument) => {
    setActiveDocument(doc);
    setDocumentId(doc.documentId);
  };

  const handleDeleteDocument = async (doc: StudyDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingDocId(doc.documentId);
    try {
      await deleteStudyDocument(doc.documentId);
      setDocuments((prev) => prev.filter((d) => d.documentId !== doc.documentId));
      if (documentId === doc.documentId) {
        setActiveDocument(null);
        setDocumentId('');
      }
      if (lastUploadedDoc?.documentId === doc.documentId) {
        setLastUploadedDoc(null);
      }
      success(`Deleted "${doc.filename}"`);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to delete document.');
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuestion = questionInput.trim();
    if (!trimmedQuestion || !documentId || isAsking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmedQuestion,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistories((prev) => ({
      ...prev,
      [documentId]: [...(prev[documentId] || []), userMsg],
    }));
    setQuestionInput('');
    setIsAsking(true);

    try {
      const response = await askStudyDocumentQuestion(documentId, trimmedQuestion);
      const rawAnswer = response.answer;
      const normalizedText = getAnswerText(rawAnswer);

      const isFallback =
        typeof rawAnswer !== 'string' &&
        (!rawAnswer || typeof rawAnswer.answer !== 'string') ||
        normalizedText.toLowerCase().includes("couldn't find enough information");

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: isFallback
          ? "Couldn't find enough information in this PDF"
          : normalizedText,
        sourcePages: Array.isArray(response.sourcePages) ? response.sourcePages : [],
        isFallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistories((prev) => ({
        ...prev,
        [documentId]: [...(prev[documentId] || []), aiMsg],
      }));
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text:
          err?.response?.data?.message ||
          "Couldn't find enough information in this PDF",
        sourcePages: [],
        isFallback: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistories((prev) => ({
        ...prev,
        [documentId]: [...(prev[documentId] || []), errorMsg],
      }));
    } finally {
      setIsAsking(false);
    }
  };

  const currentMessages = documentId ? chatHistories[documentId] || [] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Step 1 (Upload Panel) & Step 2 (My Documents Panel) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Step 1 — Upload Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload & Index PDF</h2>
              <p className="text-xs text-slate-500">Upload lecture notes or textbooks (PDF, max 15MB)</p>
            </div>
          </div>

          <form onSubmit={handleUploadAndIndex} className="space-y-4">
            {/* File Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select PDF Document <span className="text-rose-500">*</span>
              </label>
              <label
                htmlFor="qa-pdf-upload"
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-indigo-400 bg-indigo-50/40'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60'
                }`}
              >
                <Upload className={`w-6 h-6 mb-1.5 ${selectedFile ? 'text-indigo-600' : 'text-slate-400'}`} />
                {selectedFile ? (
                  <div className="text-center">
                    <p className="text-xs font-semibold text-indigo-950 truncate max-w-[260px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-indigo-600 mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to index
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xs font-medium text-slate-700">
                      Click to choose a PDF file
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">PDF only • Up to 15MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  id="qa-pdf-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Optional Classroom Dropdown */}
            <div>
              <label htmlFor="qa-classroom-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Link to Classroom <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="qa-classroom-select"
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  disabled={isUploading}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="">No specific classroom (Personal Study)</option>
                  {classrooms.map((cls, idx) => (
                    <option key={cls.id} value={idx + 1}>
                      {cls.name} ({cls.department} • Sem {cls.semester})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Upload & Index Button */}
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Indexing your PDF... this may take a moment</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Upload & Index</span>
                </>
              )}
            </button>
          </form>

          {/* Upload Success Stats Banner */}
          {lastUploadedDoc && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-emerald-900">PDF Successfully Indexed</p>
                  <p className="text-xs font-medium text-emerald-800 truncate mt-0.5">
                    {lastUploadedDoc.filename}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white text-emerald-700 border border-emerald-200">
                      <FileCheck className="w-3 h-3" />
                      {lastUploadedDoc.pagesProcessed} Pages Processed
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white text-emerald-700 border border-emerald-200">
                      <Layers className="w-3 h-3" />
                      {lastUploadedDoc.chunksIndexed} Chunks Indexed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2 — My Documents Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                2
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">My Documents</h2>
                <p className="text-xs text-slate-500">Select an indexed PDF to ask questions</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {documents.length} {documents.length === 1 ? 'PDF' : 'PDFs'}
            </span>
          </div>

          {isLoadingDocs ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <p className="text-xs">Loading your study documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No documents uploaded yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload a PDF above to start asking questions with page citations.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {documents.map((doc) => {
                const isSelected = documentId === doc.documentId;
                const formattedDate = doc.uploadedAt
                  ? new Date(doc.uploadedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recently';

                return (
                  <div
                    key={doc.documentId}
                    onClick={() => handleSelectDocument(doc)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-2xs'
                        : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/40 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200/70 text-slate-600'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-slate-900 truncate" title={doc.filename}>
                            {doc.filename}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                            <span className="font-medium text-slate-700">
                              {doc.pagesProcessed} pages
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {formattedDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDocument(doc);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
                          }`}
                        >
                          Ask Questions
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDocument(doc, e)}
                          disabled={deletingDocId === doc.documentId}
                          title="Delete document"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          {deletingDocId === doc.documentId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Step 3 — Chat Panel */}
      <div className="lg:col-span-7">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-[640px]">
          {/* Chat Header */}
          <div className="p-4 sm:px-6 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    Step 3 • Document Q&A
                  </span>
                </div>
                <h2 className="text-sm font-bold text-slate-900 truncate">
                  {activeDocument
                    ? activeDocument.filename
                    : 'Select a document to start asking questions'}
                </h2>
              </div>
            </div>

            {activeDocument && (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  {activeDocument.pagesProcessed} pages
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {activeDocument.chunksIndexed} chunks
                </span>
              </div>
            )}
          </div>

          {/* Chat Body */}
          {!activeDocument ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Active Document Selected</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
                Upload a new PDF in Step 1 or click <strong>&ldquo;Ask Questions&rdquo;</strong> on any document in Step 2 to open the interactive Q&A assistant.
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
                {currentMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <Sparkles className="w-8 h-8 text-indigo-500 mb-2" />
                    <p className="text-sm font-bold text-slate-800">
                      Ask anything about <span className="text-indigo-600">{activeDocument.filename}</span>
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Every answer is grounded in your PDF and includes exact source page chips.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {[
                        'What are the main concepts covered?',
                        'What is deadlock and its necessary conditions?',
                        'Summarize the key formulas or algorithms.',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setQuestionInput(suggestion)}
                          className="text-xs px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors cursor-pointer shadow-2xs"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                            : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-xs'
                        }`}
                      >
                        {msg.role === 'assistant' && msg.isFallback ? (
                          <div className="flex items-start gap-2 text-amber-800 bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium leading-relaxed">
                              Couldn&apos;t find enough information in this PDF
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.text}
                          </p>
                        )}

                        {/* Source Pages Chips */}
                        {msg.role === 'assistant' &&
                          msg.sourcePages &&
                          msg.sourcePages.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
                                Sources:
                              </span>
                              {msg.sourcePages.map((page) => (
                                <span
                                  key={page}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                                >
                                  Page {page}
                                </span>
                              ))}
                            </div>
                          )}

                        <div
                          className={`text-[10px] mt-1.5 ${
                            msg.role === 'user' ? 'text-blue-100 text-right' : 'text-slate-400'
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Loading State per question: "Thinking..." */}
                {isAsking && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200/90 rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs flex items-center gap-2.5">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span className="text-xs font-semibold text-slate-700">Thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Question Input at Bottom */}
              <form
                onSubmit={handleAskQuestion}
                className="p-3.5 sm:px-5 border-t border-slate-200 bg-white rounded-b-2xl flex items-center gap-2.5 shrink-0"
              >
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  disabled={isAsking}
                  placeholder={`Ask a question about ${activeDocument.filename}...`}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!questionInput.trim() || isAsking}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                  {isAsking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Ask</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
