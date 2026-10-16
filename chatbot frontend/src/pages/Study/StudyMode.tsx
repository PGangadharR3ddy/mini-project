import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Award,
  FileText,
  HelpCircle,
  Info,
  RotateCcw,
} from 'lucide-react';
import { StudyModeResponse, generateStudyMode } from '../../api/study';
import { useToast } from '../../context/ToastContext';

export const StudyMode: React.FC = () => {
  const { success, error: showError } = useToast();

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Results state
  const [studyResult, setStudyResult] = useState<StudyModeResponse | null>(null);

  // Collapsible section summaries state
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});

  // Quiz state: selected option per question index & revealed state per question index
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});

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

  const handleGenerateStudyNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showError('Please select a PDF file first.');
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateStudyMode(selectedFile);
      setStudyResult(result);

      // Default open first section summary
      const initialOpen: Record<number, boolean> = {};
      if (result.sectionSummaries?.length > 0) {
        initialOpen[result.sectionSummaries[0].section] = true;
      }
      setOpenSections(initialOpen);
      setSelectedAnswers({});
      setRevealedQuestions({});

      success(`Generated study summary and ${result.quiz?.length || 0} quiz questions!`);
    } catch (err: any) {
      showError(
        err?.response?.data?.message ||
          'Failed to generate study notes. Please verify AI service is online.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSection = (sectionNum: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionNum]: !prev[sectionNum],
    }));
  };

  const expandAllSections = () => {
    if (!studyResult?.sectionSummaries) return;
    const allOpen: Record<number, boolean> = {};
    studyResult.sectionSummaries.forEach((sec) => {
      allOpen[sec.section] = true;
    });
    setOpenSections(allOpen);
  };

  const collapseAllSections = () => {
    setOpenSections({});
  };

  // Helper to check if an option matches the quiz answer
  const isOptionCorrect = (option: string, correctAnswer: string, optionIdx: number): boolean => {
    const cleanOpt = option.trim();
    const cleanAns = correctAnswer.trim();
    if (cleanOpt.toLowerCase() === cleanAns.toLowerCase()) return true;

    // Also support letter answers like "A", "B", "C", "D" matching index or prefix "A. " / "A) "
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const letter = letters[optionIdx];
    if (letter && cleanAns.toUpperCase() === letter) return true;
    if (cleanOpt.toUpperCase().startsWith(`${cleanAns.toUpperCase()}.`) || cleanOpt.toUpperCase().startsWith(`${cleanAns.toUpperCase()})`)) {
      return true;
    }
    return false;
  };

  const handleSelectOption = (qIndex: number, option: string) => {
    if (revealedQuestions[qIndex]) return; // Lock after checking answer
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIndex]: option,
    }));
  };

  const handleCheckAnswer = (qIndex: number) => {
    if (!selectedAnswers[qIndex]) {
      showError('Please select an option before checking the answer.');
      return;
    }
    setRevealedQuestions((prev) => ({
      ...prev,
      [qIndex]: true,
    }));
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setRevealedQuestions({});
  };

  // Compute score tracker metrics
  const totalQuestions = studyResult?.quiz?.length || 0;
  const answeredCount = Object.keys(revealedQuestions).length;
  const correctCount = studyResult?.quiz
    ? studyResult.quiz.reduce((acc, q, idx) => {
        if (!revealedQuestions[idx]) return acc;
        const chosen = selectedAnswers[idx];
        const chosenIdx = q.options.indexOf(chosen);
        return isOptionCorrect(chosen, q.answer, chosenIdx) ? acc + 1 : acc;
      }, 0)
    : 0;

  // Render markdown-style formatted summary while preserving whitespace-pre-wrap
  const renderFormattedSummary = (markdownText: string) => {
    if (!markdownText) return null;
    const lines = markdownText.split('\n');

    return (
      <div className="space-y-2 whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-sm">
        {lines.map((line, index) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('# ')) {
            return (
              <h3 key={index} className="text-lg font-extrabold text-slate-900 pt-2 pb-1 border-b border-slate-100">
                {trimmed.replace(/^#\s+/, '')}
              </h3>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h4 key={index} className="text-base font-bold text-indigo-950 pt-3 pb-0.5">
                {trimmed.replace(/^##\s+/, '')}
              </h4>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h5 key={index} className="text-sm font-bold text-slate-800 pt-2">
                {trimmed.replace(/^###\s+/, '')}
              </h5>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.replace(/^[-*]\s+/, '');
            const indentLevel = line.search(/\S|$/);
            return (
              <div
                key={index}
                className={`flex items-start gap-2 ${indentLevel >= 2 ? 'pl-5' : 'pl-1'}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
                <span className="flex-1">{renderBoldSegments(content)}</span>
              </div>
            );
          }
          if (trimmed === '') {
            return <div key={index} className="h-1.5" />;
          }
          return <p key={index}>{renderBoldSegments(line)}</p>;
        })}
      </div>
    );
  };

  const renderBoldSegments = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Generate Study Notes & Interactive Quiz
              </h2>
              <p className="text-xs text-slate-500">
                Upload a course PDF (max 15MB) to synthesize structured summaries, chunk breakdowns, and practice MCQs
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleGenerateStudyNotes} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8">
            <label
              htmlFor="study-mode-pdf-upload"
              className={`flex items-center justify-between border-2 border-dashed rounded-xl px-4 py-3.5 cursor-pointer transition-all ${
                selectedFile
                  ? 'border-indigo-400 bg-indigo-50/40'
                  : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Upload className={`w-5 h-5 shrink-0 ${selectedFile ? 'text-indigo-600' : 'text-slate-400'}`} />
                {selectedFile ? (
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-indigo-950 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-indigo-600">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Document
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Choose a PDF file to generate study guide & quiz
                    </p>
                    <p className="text-[11px] text-slate-400">PDF only • Max 15MB</p>
                  </div>
                )}
              </div>

              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shrink-0 ml-3 shadow-2xs">
                Browse PDF
              </span>

              <input
                ref={fileInputRef}
                id="study-mode-pdf-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={isGenerating}
                className="hidden"
              />
            </label>
          </div>

          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={!selectedFile || isGenerating}
              className="w-full h-full min-h-[52px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Generate Study Notes</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Slow LLM Progress Indicator */}
        {isGenerating && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-center gap-3 text-indigo-950">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-indigo-900">
                Generating summary and quiz... this may take several minutes
              </p>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Processing PDF sections, extracting key concepts, and building source-cited multiple choice questions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Results Panel */}
      {studyResult && !isGenerating && (
        <div className="space-y-6">
          {/* File Metadata & Notice Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{studyResult.filename}</h3>
                <p className="text-xs text-slate-500">
                  {studyResult.pagesProcessed} Pages Processed • {studyResult.sectionsProcessed} Sections Analyzed
                </p>
              </div>
            </div>

            {studyResult.notice && (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{studyResult.notice}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left / Main Column: Summary + Collapsible Section Summaries */}
            <div className="lg:col-span-7 space-y-6">
              {/* Full Summary Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-900">Executive Study Summary</h3>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    Full Document Synthesis
                  </span>
                </div>

                {renderFormattedSummary(studyResult.summary)}
              </div>

              {/* Collapsible Section Summaries per Chunk */}
              {studyResult.sectionSummaries && studyResult.sectionSummaries.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Section-by-Section Breakdown
                      </h3>
                      <p className="text-xs text-slate-500">
                        Collapsible chunk summaries with source page citations
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={expandAllSections}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Expand All
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={collapseAllSections}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        Collapse All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {studyResult.sectionSummaries.map((sec) => {
                      const isOpen = !!openSections[sec.section];
                      return (
                        <div
                          key={sec.section}
                          className="rounded-xl border border-slate-200/90 overflow-hidden transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => toggleSection(sec.section)}
                            className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                          >
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="text-xs font-bold text-slate-900">
                                Section {sec.section}
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {sec.source_pages?.map((page) => (
                                  <span
                                    key={page}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                                  >
                                    Page {page}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                          </button>

                          {isOpen && (
                            <div className="p-4 bg-white border-t border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {sec.summary}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Quiz Section with Score Tracker */}
            <div className="lg:col-span-5 space-y-4">
              {/* Score Tracker Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sticky top-4 z-10">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        Knowledge Check
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        Score: {correctCount} / {totalQuestions}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {answeredCount} of {totalQuestions} Checked
                    </span>
                    {answeredCount > 0 && (
                      <button
                        type="button"
                        onClick={handleResetQuiz}
                        title="Reset Quiz"
                        className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {totalQuestions > 0 && (
                  <div className="mt-3 w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.round((correctCount / totalQuestions) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* MCQ Cards */}
              {studyResult.quiz && studyResult.quiz.length > 0 ? (
                <div className="space-y-4">
                  {studyResult.quiz.map((q, qIdx) => {
                    const selectedOpt = selectedAnswers[qIdx];
                    const isRevealed = !!revealedQuestions[qIdx];
                    const selectedIdx = q.options.indexOf(selectedOpt);
                    const isUserCorrect =
                      isRevealed &&
                      selectedOpt !== undefined &&
                      isOptionCorrect(selectedOpt, q.answer, selectedIdx);

                    return (
                      <div
                        key={qIdx}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {qIdx + 1}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {q.question}
                            </h4>
                          </div>
                        </div>

                        {/* Source Pages per Question */}
                        {q.source_pages && q.source_pages.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pl-8">
                            {q.source_pages.map((page) => (
                              <span
                                key={page}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                              >
                                Page {page}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Radio Button Card Options */}
                        <div className="space-y-2 pt-1">
                          {q.options.map((option, optIdx) => {
                            const isSelected = selectedOpt === option;
                            const isThisOptionCorrect = isOptionCorrect(option, q.answer, optIdx);

                            let cardClasses =
                              'border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 text-slate-800';

                            if (isRevealed) {
                              if (isThisOptionCorrect) {
                                cardClasses =
                                  'border-emerald-500 bg-emerald-50/90 text-emerald-950 font-semibold ring-1 ring-emerald-500/30';
                              } else if (isSelected && !isThisOptionCorrect) {
                                cardClasses =
                                  'border-rose-500 bg-rose-50/90 text-rose-950 font-semibold ring-1 ring-rose-500/30';
                              } else {
                                cardClasses = 'border-slate-200/60 bg-slate-50/30 text-slate-400';
                              }
                            } else if (isSelected) {
                              cardClasses =
                                'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-semibold ring-1 ring-indigo-600/20';
                            }

                            return (
                              <label
                                key={optIdx}
                                onClick={() => handleSelectOption(qIdx, option)}
                                className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs transition-all ${
                                  isRevealed ? 'cursor-default' : 'cursor-pointer'
                                } ${cardClasses}`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <input
                                    type="radio"
                                    name={`quiz-question-${qIdx}`}
                                    checked={isSelected}
                                    disabled={isRevealed}
                                    onChange={() => handleSelectOption(qIdx, option)}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-default"
                                  />
                                  <span className="leading-relaxed">{option}</span>
                                </div>

                                {isRevealed && isThisOptionCorrect && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                                {isRevealed && isSelected && !isThisOptionCorrect && (
                                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                )}
                              </label>
                            );
                          })}
                        </div>

                        {/* Check Answer Button or Explanation Reveal */}
                        {!isRevealed ? (
                          <button
                            type="button"
                            onClick={() => handleCheckAnswer(qIdx)}
                            disabled={!selectedOpt}
                            className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                          >
                            Check Answer
                          </button>
                        ) : (
                          <div
                            className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                              isUserCorrect
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                : 'bg-rose-50/70 border-rose-200 text-rose-950'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold">
                              {isUserCorrect ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span className="text-emerald-800">Correct Answer!</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span className="text-rose-800">
                                    Incorrect — Correct Answer: {q.answer}
                                  </span>
                                </>
                              )}
                            </div>
                            {q.explanation && (
                              <p className="text-slate-700 leading-relaxed pt-0.5">
                                <strong className="font-semibold text-slate-900">Explanation:</strong>{' '}
                                {q.explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    No quiz questions generated for this document.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
