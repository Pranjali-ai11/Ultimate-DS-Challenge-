import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, GitBranch, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import type { SavedSubmissionReview } from '../types';

type RegistryLink = { id: string; name: string; visualizerIds: string[]; relatedLessonIds: string[] };

export const ResultsPage: React.FC<{ resultId: string; navigate: (path: string) => void }> = ({ resultId, navigate }) => {
  const [result, setResult] = useState<SavedSubmissionReview | null>(null);
  const [registry, setRegistry] = useState<RegistryLink[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.getSavedSubmission(resultId)
      .then(saved => { if (active) setResult(saved); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Saved review could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    api.getLearnCatalog().then(catalog => { if (active) setRegistry(catalog.topicRegistry || []); }).catch(() => undefined);
    return () => { active = false; };
  }, [resultId]);

  const topicById = useMemo(() => new Map(registry.map(topic => [topic.id, topic])), [registry]);

  return <main className="min-h-screen bg-[#070b14] text-slate-100 px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-5xl space-y-6">
      <button type="button" onClick={() => navigate('/challenges')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm font-semibold text-slate-200 hover:border-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"><ArrowLeft size={16} /> Challenge Arena</button>
      <header className="rounded-3xl border border-cyan-500/30 bg-[#0f172a] p-6 sm:p-8">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-cyan-300">Saved quiz review</span>
        <h1 className="mt-2 text-3xl font-black text-white">Question-by-question results</h1>
        <p className="mt-2 text-sm text-slate-300">Your answers and the server-calculated review are loaded from your saved attempts.</p>
        {result?.level && <p className="mt-3 font-mono text-xs text-cyan-200">Level {result.level} · {new Date(result.submittedAt).toLocaleString()}</p>}
      </header>
      {loading && <div role="status" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading saved review…</div>}
      {error && <div role="alert" className="rounded-2xl border border-rose-500/40 bg-rose-950/30 p-5 text-rose-200">{error}</div>}
      {result?.historical && <div role="status" className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-sm text-cyan-100">Some historical attempts predate detailed answer persistence. Their original selected and correct answers are not reconstructed.</div>}
      {result && <div className="space-y-4">
        {result.questions.map(question => {
          const topics = question.coverageTopics.map(id => topicById.get(id)).filter((topic): topic is RegistryLink => Boolean(topic));
          const selectedLabel = question.selectedAnswerLabel || (Array.isArray(question.selectedAnswer) ? question.selectedAnswer.join(', ') : question.selectedAnswer) || 'No answer recorded';
          return <article key={question.attemptId} className={`rounded-2xl border bg-[#0f172a] p-5 sm:p-6 ${question.correctness === 'correct' ? 'border-emerald-500/30' : question.correctness === 'partial' ? 'border-amber-500/30' : 'border-slate-700'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">{question.title}</h2>
              <span className={`rounded-lg px-3 py-1 font-mono text-xs font-bold ${question.correctness === 'correct' ? 'bg-emerald-950 text-emerald-200' : question.correctness === 'partial' ? 'bg-amber-950 text-amber-200' : question.correctness ? 'bg-rose-950 text-rose-200' : 'bg-slate-800 text-slate-300'}`}>{question.correctness?.toUpperCase() || 'HISTORICAL'} · {question.marksAwarded} marks</span>
            </div>
            {question.question && <p className="mt-4 leading-relaxed text-slate-200">{question.question}</p>}
            {question.answerDetailsAvailable ? <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4"><p className="text-xs font-mono uppercase text-slate-400">Your submitted answer</p><p className="mt-2 text-sm text-white">{selectedLabel}</p>{Array.isArray(question.selectedAnswer) && <p className="mt-1 break-all text-xs text-slate-500">Selected IDs: {question.selectedAnswer.join(', ') || 'none'}</p>}</div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4"><p className="text-xs font-mono uppercase text-emerald-300">Correct answer</p><p className="mt-2 text-sm text-emerald-100">{question.correctAnswer?.label || question.correctAnswer?.structures.join(', ') || 'Not available'}</p>{question.correctAnswer?.optionIds.length ? <p className="mt-1 break-all text-xs text-emerald-200/70">Answer IDs: {question.correctAnswer.optionIds.join(', ')}</p> : null}</div>
            </div> : <p className="mt-4 rounded-xl bg-slate-950/60 p-4 text-sm text-slate-400">Detailed answer data is unavailable for this historical attempt.</p>}
            {(question.explanation || question.correctExplanation) && <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4"><p className="text-xs font-mono uppercase text-indigo-200">Explanation</p><p className="mt-2 text-sm leading-relaxed text-slate-200">{question.correctExplanation || question.explanation}</p></div>}
            {topics.length > 0 && <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
              {topics.map(topic => {
                const lesson = topic.relatedLessonIds.find(id => id.startsWith('unit-'));
                const visualizer = topic.visualizerIds[0];
                return <div key={topic.id} className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-xs font-mono text-slate-400">{topic.name}{question.subtopic ? ` · ${question.subtopic}` : ''}</span>
                  {lesson && <button type="button" onClick={() => navigate(`/learn?topic=${encodeURIComponent(topic.id)}${question.subtopic ? `&subtopic=${encodeURIComponent(question.subtopic)}` : ''}`)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-cyan-500/30 px-3 text-xs font-semibold text-cyan-200 hover:bg-cyan-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"><BookOpen size={14} /> Review lesson</button>}
                  {visualizer && <button type="button" onClick={() => navigate(`/learn?tab=visualisation&topic=${encodeURIComponent(topic.id)}`)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-indigo-500/30 px-3 text-xs font-semibold text-indigo-200 hover:bg-indigo-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"><GitBranch size={14} /> Open visualizer</button>}
                  <button type="button" onClick={() => navigate(`/challenges?topic=${encodeURIComponent(topic.id)}`)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs font-semibold text-slate-200 hover:border-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"><RotateCcw size={14} /> Practice</button>
                </div>;
              })}
            </div>}
          </article>;
        })}
      </div>}
    </div>
  </main>;
};
