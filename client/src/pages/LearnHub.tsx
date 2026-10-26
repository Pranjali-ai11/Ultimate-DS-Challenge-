import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  BookOpen,
  ArrowRight,
  Check,
  X,
  Play,
} from 'lucide-react';
import { DataStructureType } from '../types';
import { api } from '../services/api';
const VisualisationHub = lazy(() => import('../components/visualizers/VisualisationHub').then(module => ({ default: module.VisualisationHub })));
import { LearningGuidePanel } from '../components/learning/LearningGuidePanel';
import { CourseStudyPath } from '../components/learning/CourseStudyPath';
import { CourseTopic, LearningGuide, TopicRegistryEntry } from '../types/learning';
import { findTopicEntry } from '../services/topicNavigation.js';

export const LearnHub: React.FC<{
  initialStructure?: string;
  navigate: (path: string) => void;
}> = ({ initialStructure, navigate }) => {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [courseTopics, setCourseTopics] = useState<CourseTopic[]>([]);
  const [topicRegistry, setTopicRegistry] = useState<TopicRegistryEntry[]>([]);
  const [deepLinkTopic, setDeepLinkTopic] = useState(() => new URLSearchParams(window.location.search).get('topic') || '');
  const [viewMode, setViewMode] = useState<'structures' | 'course' | 'visualisation'>(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'visualisation') return 'visualisation';
    if (tab === 'structures') return 'structures';
    return initialStructure ? 'structures' : 'course';
  });
  const [activeStructureId, setActiveStructureId] = useState<DataStructureType>(
    (initialStructure as DataStructureType) || 'array'
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getLearnCatalog();
        setCatalog(data.structures || []);
        setCourseTopics(data.courseTopics || data.courseUnits?.flatMap(unit => unit.topics) || []);
        setTopicRegistry(data.topicRegistry || []);
      } catch {
        setLoadError('Learning catalog could not be loaded. Check your connection and retry.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const syncTab = () => {
      const tab = new URLSearchParams(window.location.search).get('tab');
      setDeepLinkTopic(new URLSearchParams(window.location.search).get('topic') || '');
      setViewMode(tab === 'visualisation' ? 'visualisation' : tab === 'structures' ? 'structures' : 'course');
    };
    window.addEventListener('popstate', syncTab);
    return () => window.removeEventListener('popstate', syncTab);
  }, []);

  const selectViewMode = (next: 'course' | 'structures' | 'visualisation') => {
    setViewMode(next);
    const url = new URL(window.location.href);
    setDeepLinkTopic(url.searchParams.get('topic') || '');
    if (next === 'course') url.searchParams.delete('tab');
    else url.searchParams.set('tab', next);
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const selectStructure = (id: DataStructureType) => {
    setActiveStructureId(id);
    const topic = topicRegistry.find(entry => entry.visualizerIds.includes(id) || entry.relatedLessonIds.includes(`reference:${id}`));
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'structures');
    if (topic) url.searchParams.set('topic', topic.id);
    else url.searchParams.delete('topic');
    url.searchParams.delete('lesson');
    url.searchParams.delete('subtopic');
    setDeepLinkTopic(topic?.id || '');
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const topicEntry = findTopicEntry(deepLinkTopic, topicRegistry);
  const deepStructureId = topicEntry?.visualizerIds.find(id => catalog.some(structure => structure.id === id))
    || topicEntry?.relatedLessonIds.find(id => id.startsWith('reference:'))?.slice('reference:'.length);
  const resolvedStructureId = viewMode === 'structures' && deepStructureId && catalog.some(structure => structure.id === deepStructureId)
    ? deepStructureId as DataStructureType
    : activeStructureId;
  const activeStructure = catalog.find(s => s.id === resolvedStructureId) || catalog[0];
  const learningGuide = activeStructure?.learningGuide as LearningGuide | undefined;
  const activeStructureTopic = topicRegistry.find(topic => topic.visualizerIds.includes(resolvedStructureId) && topic.relatedLessonIds.some(id => id.startsWith('unit-')));
  const initialLessonId = new URLSearchParams(window.location.search).get('lesson') || topicEntry?.relatedLessonIds.find(id => id.startsWith('unit-'));

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold mb-2">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Architectural Encyclopedia</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              DATA STRUCTURE KNOWLEDGE HUB
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Search syllabus lessons by topic, review structure reference material, or open the separate Visualisation workspace for supported interactive demonstrations.
            </p>
          </div>

          <button
            onClick={() => navigate('/challenges')}
            className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-glow-cyan flex items-center gap-2"
          >
            <span>Jump to Challenges</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loadError && <div role="alert" className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-200 text-sm">{loadError} <button className="underline ml-2" onClick={() => window.location.reload()}>Retry</button></div>}

        {loading && <div role="status" className="rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center text-sm text-slate-300">Loading learning catalog and syllabus lessons…</div>}

        {!loading && !loadError && <nav aria-label="Learning areas" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={viewMode === 'course'} onClick={() => selectViewMode('course')} className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold border ${viewMode === 'course' ? 'bg-cyan-400 text-slate-950 border-cyan-300' : 'bg-slate-900 text-slate-300 border-slate-700'}`}>Learning topics</button>
          <button type="button" aria-pressed={viewMode === 'structures'} onClick={() => selectViewMode('structures')} className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold border ${viewMode === 'structures' ? 'bg-cyan-400 text-slate-950 border-cyan-300' : 'bg-slate-900 text-slate-300 border-slate-700'}`}>Explore structures</button>
          <button type="button" aria-pressed={viewMode === 'visualisation'} onClick={() => selectViewMode('visualisation')} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold border ${viewMode === 'visualisation' ? 'bg-cyan-400 text-slate-950 border-cyan-300' : 'bg-slate-900 text-slate-300 border-slate-700'}`}><Play aria-hidden="true" className="w-3.5 h-3.5" />Visualisation</button>
        </nav>}

        {!loading && !loadError && viewMode === 'course' && <CourseStudyPath key={`${deepLinkTopic}:${initialLessonId || ''}`} topics={courseTopics} initialLessonId={initialLessonId} initialSubtopic={new URLSearchParams(window.location.search).get('subtopic') || undefined} topicRegistry={topicRegistry} navigate={navigate} />}
        {!loading && !loadError && viewMode === 'visualisation' && <Suspense fallback={<div className="rounded-2xl border border-cyan-500/20 bg-[#0f172a] p-8 text-center text-sm text-slate-400" role="status" aria-live="polite">Loading visualisation tools…</div>}><VisualisationHub initialTopic={deepLinkTopic} topicRegistry={topicRegistry} navigate={navigate} /></Suspense>}

        {/* Structure Selector Pill Navigation */}
        {!loading && !loadError && viewMode === 'structures' && <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none font-mono text-xs" aria-label="Data structures">
          {catalog.map(ds => {
            const isActive = ds.id === activeStructureId;
            return (
              <button
                key={ds.id}
                onClick={() => selectStructure(ds.id)}
                aria-pressed={isActive}
                className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-black shadow-glow-cyan'
                    : 'bg-[#0f172a] text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {ds.name}
              </button>
            );
          })}
        </div>}

        {/* Explore Structures: reference and lesson content only */}
        {!loading && !loadError && viewMode === 'structures' && activeStructure && (
          <div className="mx-auto w-full max-w-5xl space-y-6">
              {/* Overview Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#0f172a]/90 border border-cyan-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    Category: {activeStructure.category}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {activeStructure.name}
                </h2>

                {activeStructureTopic && <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => navigate(`/learn?tab=visualisation&topic=${encodeURIComponent(activeStructureTopic.id)}`)} className="rounded-xl border border-cyan-500/40 bg-cyan-950/30 px-4 py-2 text-xs font-mono font-bold text-cyan-200 hover:bg-cyan-900/40">Visualize this concept</button>
                  <button type="button" onClick={() => navigate(`/challenges?topic=${encodeURIComponent(activeStructureTopic.id)}`)} className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-mono font-bold text-slate-200 hover:border-cyan-400">Practice related questions</button>
                </div>}

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {activeStructure.description}
                </p>

                <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-1">
                  <p className="font-mono text-xs text-cyan-400 font-bold uppercase">How It Works Under the Hood:</p>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{activeStructure.howItWorks}</p>
                </div>
              </div>

              <LearningGuidePanel guide={learningGuide} />

              {/* Complexity Table */}
              <div className="p-6 rounded-3xl bg-[#0f172a]/90 border border-slate-800 space-y-4">
                <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                  Complexity at a glance
                </h3>
                <p className="text-xs text-slate-400">Typical bounds depend on the operation and representation. Read the guided lesson for assumptions, best/worst cases, and auxiliary-space reasoning.</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">SEARCH</span>
                    <span className="text-cyan-400 font-bold">{activeStructure.timeComplexity.search}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">INSERTION</span>
                    <span className="text-cyan-400 font-bold">{activeStructure.timeComplexity.insert}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">DELETION</span>
                    <span className="text-cyan-400 font-bold">{activeStructure.timeComplexity.delete}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">SPACE MEMORY</span>
                    <span className="text-indigo-400 font-bold">{activeStructure.timeComplexity.space}</span>
                  </div>
                </div>
              </div>

              {/* Advantages vs Disadvantages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-[#0f172a]/90 border border-emerald-500/20 space-y-3">
                  <h4 className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Core Advantages
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {activeStructure.advantages.map((adv: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 rounded-3xl bg-[#0f172a]/90 border border-rose-500/20 space-y-3">
                  <h4 className="font-mono text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <X className="w-4 h-4" /> Trade-offs & Limitations
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {activeStructure.disadvantages.map((dis: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">✗</span>
                        <span>{dis}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Real World Use Cases */}
              <div className="p-6 rounded-3xl bg-[#0f172a]/90 border border-slate-800 space-y-2">
                <h4 className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Real-World Production Deployments
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {activeStructure.realWorldUse}
                </p>
              </div>
            {/* Practice remains a navigation action, not an embedded demonstration. */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-mono text-cyan-400 font-bold">Ready to test your intuition?</p>
                <p className="text-[11px] text-slate-300">Solve missions featuring {activeStructure.name}.</p>
              </div>
              <button
                onClick={() => navigate('/challenges')}
                className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-mono font-bold shadow-glow-cyan"
              >
                Solve Challenges →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
