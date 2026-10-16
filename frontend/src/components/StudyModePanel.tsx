import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import axios from 'axios';
import { BookOpenCheck, LoaderCircle, Sparkles, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiResponse } from '../types';
import { generateStudyMode, StudyModeResponse } from '../api/study';

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiResponse<unknown> & { detail?: string; error?: string }>(error)) {
    const data = error.response?.data;
    return data?.message || data?.detail || data?.error || error.message;
  }
  return error instanceof Error ? error.message : 'Could not generate study materials.';
}

export function StudyModePanel() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<StudyModeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    if (!chosen) return;
    if (chosen.type !== 'application/pdf' && !chosen.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Choose a PDF file.');
      event.target.value = '';
      return;
    }
    if (chosen.size > 15 * 1024 * 1024) {
      toast.error('PDFs must be 15 MB or smaller.');
      event.target.value = '';
      return;
    }
    setFile(chosen);
  };

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || loading) return;

    setLoading(true);
    setResult(null);
    try {
      const studyResult = await generateStudyMode(file);
      setResult(studyResult);
      setAnswers({});
      setRevealed({});
      toast.success('Study notes and quiz generated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="border-2 border-stone-900 bg-white p-5 shadow-[3px_3px_0_0_#1b1c19]">
        <h2 className="mb-1 flex items-center gap-2 text-base font-bold">
          <Sparkles className="h-4 w-4" /> Generate revision notes and a quiz
        </h2>
        <p className="mb-4 text-xs text-stone-600">
          The Ollama study assistant analyzes the PDF and creates source-grounded notes and practice questions.
        </p>
        <form onSubmit={handleGenerate} className="flex flex-col gap-3 sm:flex-row">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            disabled={loading}
            className="block min-w-0 flex-1 text-sm file:mr-3 file:border-2 file:border-stone-900 file:bg-[#faf9f4] file:px-3 file:py-2 file:text-xs file:font-bold"
          />
          <button
            type="submit"
            disabled={!file || loading}
            className="flex items-center justify-center gap-2 border-2 border-stone-900 bg-emerald-300 px-4 py-2 text-sm font-bold hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </form>
        {file && <p className="mt-2 truncate text-xs text-stone-500">{file.name}</p>}
        {loading && (
          <p className="mt-3 text-xs text-stone-600">
            Ollama may take a few minutes to summarize longer PDFs and create quiz questions.
          </p>
        )}
      </section>

      {result && (
        <>
          <section className="border-2 border-stone-900 bg-white p-5 shadow-[3px_3px_0_0_#1b1c19]">
            <div className="mb-4 flex items-center gap-3 border-b border-stone-200 pb-3">
              <BookOpenCheck className="h-5 w-5" />
              <div>
                <h2 className="font-bold">{result.filename}</h2>
                <p className="text-xs text-stone-600">
                  {result.pagesProcessed} pages · {result.sectionsProcessed} sections
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-serif-title text-xl font-bold">Revision summary</h3>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                {result.summary}
              </div>
            </div>
            {!!result.sectionSummaries?.length && (
              <div className="mt-5 space-y-3 border-t border-stone-200 pt-4">
                <h3 className="font-bold">Section notes</h3>
                {result.sectionSummaries.map((section) => (
                  <details
                    key={section.section}
                    className="border border-stone-200 bg-[#faf9f4] p-3"
                  >
                    <summary className="cursor-pointer text-sm font-semibold">
                      Section {section.section}
                      {!!section.source_pages?.length && (
                        <span className="ml-2 text-xs font-normal text-stone-500">
                          Pages {section.source_pages.join(', ')}
                        </span>
                      )}
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                      {section.summary}
                    </p>
                  </details>
                ))}
              </div>
            )}
          </section>

          {!!result.quiz?.length && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold">Practice quiz ({result.quiz.length})</h2>
              {result.quiz.map((item, index) => {
                const isCorrect = answers[index] === item.answer;
                return (
                  <article
                    key={`${index}-${item.question}`}
                    className="border-2 border-stone-900 bg-white p-5 shadow-[3px_3px_0_0_#1b1c19]"
                  >
                    <h3 className="font-semibold">
                      {index + 1}. {item.question}
                    </h3>
                    <div className="mt-3 space-y-2">
                      {item.options.map((option) => (
                        <label
                          key={option}
                          className={`flex cursor-pointer items-start gap-2 border p-2 text-sm ${
                            revealed[index] && option === item.answer
                              ? 'border-emerald-700 bg-emerald-50'
                              : answers[index] === option
                                ? 'border-stone-900 bg-stone-100'
                                : 'border-stone-200 hover:border-stone-500'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`quiz-${index}`}
                            value={option}
                            checked={answers[index] === option}
                            disabled={revealed[index]}
                            onChange={() =>
                              setAnswers((current) => ({ ...current, [index]: option }))
                            }
                            className="mt-0.5"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                    {!revealed[index] ? (
                      <button
                        type="button"
                        disabled={!answers[index]}
                        onClick={() =>
                          setRevealed((current) => ({ ...current, [index]: true }))
                        }
                        className="mt-3 border-2 border-stone-900 bg-stone-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-700 disabled:opacity-50"
                      >
                        Check answer
                      </button>
                    ) : (
                      <div
                        className={`mt-3 border p-3 text-sm ${
                          isCorrect
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-amber-300 bg-amber-50'
                        }`}
                      >
                        <p className="font-bold">
                          {isCorrect ? 'Correct' : `Correct answer: ${item.answer}`}
                        </p>
                        <p className="mt-1">{item.explanation}</p>
                        {!!item.source_pages?.length && (
                          <p className="mt-1 text-xs text-stone-600">
                            Source pages: {item.source_pages.join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}
          {result.notice && (
            <p className="text-xs text-stone-500">{result.notice}</p>
          )}
        </>
      )}
    </div>
  );
}
