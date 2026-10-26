import React from 'react';
import { LearningGuide } from '../../types/learning';

export const LearningGuidePanel: React.FC<{ guide?: LearningGuide }> = ({ guide }) => {
  if (!guide) return null;
  return (
    <section aria-labelledby="guided-lesson-heading" className="p-5 sm:p-6 rounded-3xl bg-[#0f172a]/90 border border-indigo-500/30 space-y-5">
      <div>
        <p className="text-xs text-slate-400 mb-2">{guide.syllabus}</p>
        <h3 id="guided-lesson-heading" className="font-mono text-sm font-bold uppercase tracking-wide text-indigo-300">Learn it step by step</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4">
          <h4 className="text-xs font-bold text-cyan-300 mb-2">Start with the mental model</h4>
          <p className="text-sm leading-relaxed text-slate-300">{guide.mentalModel}</p>
          <p className="text-xs leading-relaxed text-slate-400 mt-3"><strong className="text-slate-200">Before you begin:</strong> {guide.prerequisites.join(' ')}</p>
        </div>
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4">
          <h4 className="text-xs font-bold text-cyan-300 mb-2">Representation and invariant</h4>
          <p className="text-sm leading-relaxed text-slate-300">{guide.representation}</p>
          <p className="text-xs leading-relaxed text-slate-400 mt-3"><strong className="text-slate-200">Rule that must stay true:</strong> {guide.invariant}</p>
        </div>
      </div>
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
        <h4 className="font-mono text-xs font-bold text-cyan-200 uppercase mb-2">Guided Example</h4>
        {guide.scope === 'core' && guide.sandboxOperations[0] === 'Append to end' ? (
            <p className="text-sm leading-relaxed text-slate-300">This static example uses the starter array <code className="text-cyan-200">[12, 25, 42, 67, 89, 99]</code> to explain append, linear search, and tail deletion. Interactive demonstrations, where implemented, are available in the <strong>Visualisation</strong> tab. This reference example does not change state.</p>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-slate-300">This guided reference explains the model and operation steps without changing state. Interactive demonstrations, where implemented, are available in the <strong>Visualisation</strong> tab.</p>
            <p className="mt-3 text-xs text-slate-400">Operations covered in this guide:</p>
            <ul className="mt-3 flex flex-wrap gap-2">{guide.sandboxOperations.map(operation => <li key={operation} className="text-xs rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-300">{operation}</li>)}</ul>
          </>
        )}
      </div>
      <div className="space-y-3">
        <h4 className="font-mono text-xs font-bold text-white uppercase">Operation walkthroughs</h4>
        {guide.operationWalkthroughs.map(item => (
          <details key={item.operation} className="group rounded-xl bg-slate-950/80 border border-slate-800">
            <summary className="cursor-pointer list-none px-4 py-3 flex flex-wrap justify-between gap-2 text-sm font-semibold text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
              <span>{item.operation}</span><span className="text-xs text-indigo-300">{item.cost}</span>
            </summary>
            <div className="px-4 pb-4 space-y-2 text-xs leading-relaxed text-slate-300">
              <p><strong className="text-slate-100">Before:</strong> {item.precondition}</p>
              <ol className="list-decimal pl-5 space-y-1">{item.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
              <p><strong className="text-emerald-300">After:</strong> {item.result}</p>
              <p><strong className="text-amber-300">Boundary:</strong> {item.boundary}</p>
            </div>
          </details>
        ))}
      </div>
      <details className="rounded-xl bg-slate-950/80 border border-slate-800">
        <summary className="cursor-pointer px-4 py-3 font-mono text-xs font-bold text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">{guide.workedExample.title}</summary>
        <div className="px-4 pb-4 space-y-2 text-xs leading-relaxed text-slate-300">
          <ol className="list-decimal pl-5 space-y-1">{guide.workedExample.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
          <p><strong className="text-emerald-300">Result:</strong> {guide.workedExample.result}</p>
          <p><strong className="text-rose-300">Common trap:</strong> {guide.workedExample.trap}</p>
        </div>
      </details>
      <div className="grid md:grid-cols-2 gap-4">
        <div><h4 className="font-mono text-xs font-bold text-indigo-300 uppercase mb-2">Why the complexity looks this way</h4><ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed text-slate-300">{guide.complexityReasoning.map((item, index) => <li key={index}>{item}</li>)}</ul></div>
        <div><h4 className="font-mono text-xs font-bold text-rose-300 uppercase mb-2">Common mistakes</h4><ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed text-slate-300">{guide.commonMistakes.map((item, index) => <li key={index}>{item}</li>)}</ul></div>
      </div>
      <div className="space-y-2">
        <h4 className="font-mono text-xs font-bold text-emerald-300 uppercase">Check your understanding</h4>
        {guide.checks.map(item => <details key={item.question} className="rounded-xl bg-slate-950/70 border border-slate-800"><summary className="cursor-pointer px-4 py-3 text-xs text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">{item.question}</summary><div className="px-4 pb-3 text-xs leading-relaxed text-slate-300"><p><strong className="text-emerald-300">Answer:</strong> {item.answer}</p><p className="mt-1">{item.reasoning}</p></div></details>)}
      </div>
    </section>
  );
};
