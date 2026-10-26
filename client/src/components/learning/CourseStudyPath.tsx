import React, { useEffect, useMemo, useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { CourseTopic, TopicRegistryEntry } from '../../types/learning';

const CATEGORY_ORDER = [
  'Foundations & complexity',
  'Arrays, polynomials & sparse matrices',
  'Searching',
  'Sorting',
  'Linked lists & GLL',
  'Stacks, expressions & recursion',
  'Queues, deques & priority queues'
];

type TopicEntry = { topic: CourseTopic; category: string };

export const CourseStudyPath: React.FC<{ topics: CourseTopic[]; initialLessonId?: string; initialSubtopic?: string; topicRegistry?: TopicRegistryEntry[]; navigate?: (path: string) => void }> = ({ topics, initialLessonId, initialSubtopic, topicRegistry = [], navigate }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All topics');
  const [expandedTopicId, setExpandedTopicId] = useState(initialLessonId || '');
  const [deepLinkedSubtopic, setDeepLinkedSubtopic] = useState(initialSubtopic || '');

  useEffect(() => {
    const syncDeepLink = () => {
      const params = new URLSearchParams(window.location.search);
      setExpandedTopicId(params.get('lesson') || initialLessonId || '');
      setDeepLinkedSubtopic(params.get('subtopic') || initialSubtopic || '');
    };
    window.addEventListener('popstate', syncDeepLink);
    return () => window.removeEventListener('popstate', syncDeepLink);
  }, [initialLessonId, initialSubtopic]);

  const topicEntries = useMemo<TopicEntry[]>(() => topics.map(topic => ({ topic, category: topic.category })), [topics]);
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filtered = topicEntries.filter(({ topic, category }) => {
    const matchesCategory = activeCategory === 'All topics' || category === activeCategory;
    const searchableText = [topic.title, topic.explanation, topic.purpose, category, ...topic.prerequisites].join(' ').toLocaleLowerCase();
    return matchesCategory && (!normalizedSearch || searchableText.includes(normalizedSearch));
  });
  const visibleCategories = CATEGORY_ORDER.filter(category => filtered.some(entry => entry.category === category));

  return (
    <section className="space-y-6" aria-labelledby="course-path-title">
      <header className="rounded-3xl border border-cyan-500/30 bg-[#0f172a]/90 p-6 sm:p-8">
        <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300">FODS • TOPIC LIBRARY</span>
        <h2 id="course-path-title" className="text-2xl sm:text-3xl font-black text-white mt-2">Learn one idea at a time</h2>
        <p className="text-sm leading-relaxed text-slate-300 mt-3">Search lessons or browse by subject. Each lesson includes prerequisites, a worked example, complexity reasoning, edge cases, practice with explanations, and a revision summary.</p>
      </header>

      <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/90 p-4 sm:p-5 space-y-4">
        <label htmlFor="lesson-search" className="block text-xs font-mono font-bold text-slate-300">Search FODS topics</label>
        <div className="relative max-w-2xl">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input id="lesson-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Try “Fibonacci”, “sparse transpose”, or “recursion”" className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter topics by category">
          {['All topics', ...CATEGORY_ORDER].map(category => (
            <button key={category} type="button" aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)} className={activeCategory === category ? 'rounded-xl border border-cyan-300 bg-cyan-400 px-3 py-2 text-xs font-mono font-bold text-slate-950' : 'rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-slate-300 hover:border-cyan-500/60 hover:text-white'}>
              {category}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="text-xs text-slate-400">Showing {filtered.length} of {topicEntries.length} lessons</p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/90 p-8 text-center" role="status">
          <BookOpen aria-hidden="true" className="mx-auto mb-3 h-6 w-6 text-cyan-300" />
          <p className="font-semibold text-white">No lessons match those filters.</p>
          <p className="mt-1 text-sm text-slate-400">Try another search term or choose All topics.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleCategories.map(category => (
            <section key={category} className="space-y-3" aria-labelledby={`category-${CATEGORY_ORDER.indexOf(category)}`}>
              <div className="flex items-end justify-between gap-3 border-b border-slate-800 pb-2">
                <h3 id={`category-${CATEGORY_ORDER.indexOf(category)}`} className="text-lg font-black text-cyan-200">{category}</h3>
                <span className="text-xs font-mono text-slate-400">{filtered.filter(entry => entry.category === category).length} lessons</span>
              </div>
              <div className="space-y-3">
                {filtered.filter(entry => entry.category === category).map(({ topic }) => (
                  <article key={topic.title} className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a]/90">
                    <details open={expandedTopicId === topic.id} onToggle={event => {
                      const isOpen = (event.currentTarget as HTMLDetailsElement).open;
                      setExpandedTopicId(isOpen ? topic.id || '' : expandedTopicId === topic.id ? '' : expandedTopicId);
                      if (topic.id) {
                        const url = new URL(window.location.href);
                        const linkedTopic = topicRegistry.find(item => item.relatedLessonIds.includes(topic.id!));
                        if (isOpen) {
                          url.searchParams.set('lesson', topic.id);
                          if (linkedTopic) url.searchParams.set('topic', linkedTopic.id);
                        }
                        else if (url.searchParams.get('lesson') === topic.id) url.searchParams.delete('lesson');
                        window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
                      }
                    }}>
                      <summary className="cursor-pointer px-4 py-4 sm:px-5 flex flex-wrap items-center justify-between gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
                        <span className="font-semibold text-white">{topic.title}</span>
                        <span className="rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-[10px] font-mono text-cyan-200">Open lesson</span>
                      </summary>
                      <div className="border-t border-slate-800 px-4 py-5 sm:px-5 space-y-5">
                        {deepLinkedSubtopic && <p className="inline-flex rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-3 py-2 text-xs font-mono text-cyan-100">Deep-linked focus: {deepLinkedSubtopic}</p>}
                        {(() => {
                          const linkedTopic = topicRegistry.find(item => topic.id && item.relatedLessonIds.includes(topic.id));
                          const visualizerId = linkedTopic?.visualizerIds[0];
                          return linkedTopic && visualizerId && navigate ? <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => navigate(`/learn?tab=visualisation&topic=${encodeURIComponent(linkedTopic.id)}`)} className="rounded-xl border border-cyan-500/40 bg-cyan-950/30 px-4 py-2 text-xs font-mono font-bold text-cyan-200 hover:bg-cyan-900/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">Visualize this concept</button>
                          </div> : null;
                        })()}
                        <section>
                          <h4 className="mb-1 text-xs font-mono font-bold uppercase text-cyan-300">Definition and idea</h4>
                          <p className="text-sm leading-relaxed text-slate-300">{topic.explanation}</p>
                        </section>
                        <section>
                          <h4 className="mb-1 text-xs font-mono font-bold uppercase text-cyan-300">Why it is useful</h4>
                          <p className="text-sm leading-relaxed text-slate-300">{topic.purpose}</p>
                        </section>
                        <section>
                          <h4 className="mb-2 text-xs font-mono font-bold uppercase text-cyan-300">Before you begin</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">{topic.prerequisites.map((item, index) => <li key={index}>{item}</li>)}</ul>
                        </section>
                        <section className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4">
                          <h4 className="mb-2 text-xs font-mono font-bold uppercase text-indigo-200">Worked example: {topic.title}</h4>
                          <ol className="list-decimal pl-5 space-y-1 text-sm leading-relaxed text-slate-200">{topic.workedSteps.map((step, index) => <li key={index}>{step}</li>)}</ol>
                          <p className="mt-3 text-sm text-emerald-200"><strong>Result:</strong> {topic.result}</p>
                        </section>
                        {topic.pseudocode && <details className="rounded-xl border border-slate-800 bg-slate-950/70">
                          <summary className="cursor-pointer px-4 py-3 text-xs font-mono font-bold text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">Pseudocode / procedure</summary>
                          <pre className="overflow-x-auto whitespace-pre-wrap border-t border-slate-800 px-4 py-3 text-xs leading-relaxed text-slate-200"><code>{topic.pseudocode}</code></pre>
                        </details>}
                        {topic.comparison && <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="min-w-[760px] w-full text-left text-xs"><caption className="p-3 text-left font-mono font-bold text-cyan-200">Methods and assumptions</caption><thead className="bg-slate-900 text-slate-300"><tr>{['Method', 'Condition', 'Best', 'Average', 'Worst', 'Stable?', 'Extra space'].map(header => <th key={header} scope="col" className="px-3 py-2">{header}</th>)}</tr></thead><tbody>{topic.comparison.map(row => <tr key={row.method} className="border-t border-slate-800 text-slate-300"><th scope="row" className="px-3 py-2 font-semibold text-white">{row.method}</th><td className="px-3 py-2">{row.condition}</td><td className="px-3 py-2">{row.best}</td><td className="px-3 py-2">{row.average}</td><td className="px-3 py-2">{row.worst}</td><td className="px-3 py-2">{row.stable}</td><td className="px-3 py-2">{row.extraSpace}</td></tr>)}</tbody></table></div>}
                        <section>
                          <h4 className="mb-2 text-xs font-mono font-bold uppercase text-indigo-300">Complexity and why</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-slate-300">{topic.complexity.map((item, index) => <li key={index}>{item}</li>)}</ul>
                        </section>
                        <div className="grid gap-4 md:grid-cols-2">
                          <section>
                            <h4 className="mb-2 text-xs font-mono font-bold uppercase text-amber-200">Edge cases</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">{topic.edgeCases.map((item, index) => <li key={index}>{item}</li>)}</ul>
                          </section>
                          <section>
                            <h4 className="mb-2 text-xs font-mono font-bold uppercase text-rose-300">Common mistakes</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">{topic.pitfalls.map((item, index) => <li key={index}>{item}</li>)}</ul>
                          </section>
                        </div>
                        <section>
                          <h4 className="mb-2 text-xs font-mono font-bold uppercase text-emerald-300">Practice with explained answers</h4>
                          <div className="space-y-2">
                            {topic.practice.map(item => <details key={item.question} className="rounded-xl border border-slate-800 bg-slate-950/70"><summary className="cursor-pointer px-4 py-3 text-sm text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">{item.question}</summary><div className="border-t border-slate-800 px-4 py-3 text-sm leading-relaxed text-slate-300"><p><strong className="text-emerald-300">Answer:</strong> {item.answer}</p><p className="mt-1">{item.reasoning}</p></div></details>)}
                            <details className="rounded-xl border border-slate-800 bg-slate-950/70"><summary className="cursor-pointer px-4 py-3 text-sm text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">Self-check: {topic.check}</summary><p className="border-t border-slate-800 px-4 py-3 text-sm text-slate-300"><strong className="text-emerald-300">Answer:</strong> {topic.answer}</p></details>
                          </div>
                        </section>
                        <section className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
                          <h4 className="mb-1 text-xs font-mono font-bold uppercase text-cyan-200">Revision summary</h4>
                          <p className="text-sm leading-relaxed text-slate-200">{topic.summary}</p>
                        </section>
                      </div>
                    </details>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
};
