import { useCallback, useEffect, useMemo, useState } from 'react';
import './ArrayAlgorithmPlayground.css';
import { ArrowDownUp, Pause, Play, RotateCcw, Search, SkipBack, SkipForward } from 'lucide-react';
import { clampStepIndex, makeSearchSteps, makeSortSteps, parseIntegerArray, SEARCH_ALGORITHMS, SORT_ALGORITHMS } from './algorithmSteps.js';

type Category = 'Searching'|'Sorting';
type PlaygroundProps = { embedded?: boolean; category?: Category; algorithm?: string };

const searchInfo: Record<string,{description:string;best:string;average:string;worst:string;space:string;note:string}> = {
 'Linear Search':{description:'Inspect elements one by one until the target is found or the array ends.',best:'O(1)',average:'O(n)',worst:'O(n)',space:'O(n) app copy',note:'Sequential scan; no ordering requirement.'},
 'Sentinel Linear Search':{description:'Append a temporary target sentinel so the loop needs fewer boundary checks.',best:'O(1)',average:'O(n)',worst:'O(n)',space:'O(n) app copy',note:'Sentinel is temporary and never changes the displayed input.'},
 'Binary Search':{description:'Repeatedly halve the sorted search interval.',best:'O(1)',average:'O(log n)',worst:'O(log n)',space:'O(n) sorted copy',note:'Stable sorted-copy preprocessing adds O(n log n) worst-case time and O(n) space; unsorted input is visibly flagged.'},
 'Recursive Binary Search':{description:'Use recursive range halving to locate the target.',best:'O(1)',average:'O(log n)',worst:'O(log n)',space:'O(n) copy + O(log n) stack',note:'Sorted-copy preprocessing adds O(n log n) worst-case time and O(n) space; recursion adds O(log n) average stack space.'},
 'Fibonacci Search':{description:'Probe positions using shrinking Fibonacci offsets.',best:'O(1)',average:'O(log n)',worst:'O(log n)',space:'O(n) sorted copy',note:'Sorted-copy preprocessing adds O(n log n) worst-case time and O(n) space.'},
};
const sortInfo: Record<string,{description:string;best:string;average:string;worst:string;space:string;note:string}> = {
 'Bubble Sort':{description:'Compare adjacent pairs and move large values toward the end.',best:'O(n) optimized',average:'O(n²)',worst:'O(n²)',space:'O(1)',note:'Stops early when a pass makes no swaps.'},
 'Selection Sort':{description:'Find the minimum in the unsorted suffix and place it next.',best:'O(n²)',average:'O(n²)',worst:'O(n²)',space:'O(1)',note:'At most one placement swap per pass.'},
 'Insertion Sort':{description:'Insert each key into its position in the sorted prefix.',best:'O(n)',average:'O(n²)',worst:'O(n²)',space:'O(1)',note:'In-place; shifts larger values to the right.'},
 'Shell Sort':{description:'Insertion-sort values separated by progressively smaller gaps.',best:'depends on gaps',average:'gap-dependent',worst:'O(n²) for halving gaps',space:'O(1)',note:'Gap sequence: floor(n/2), floor(gap/2), …, 1.'},
 'Merge Sort':{description:'Recursively divide the array, then merge sorted ranges.',best:'O(n log n)',average:'O(n log n)',worst:'O(n log n)',space:'O(n)',note:'Uses temporary left and right arrays during each merge.'},
 'Quick Sort':{description:'Partition around the last element, then sort each side recursively.',best:'O(n log n)',average:'O(n log n)',worst:'O(n²)',space:'O(log n) avg; O(n) worst',note:'Lomuto partition; recursion depth depends on pivot quality.'},
 'Heap Sort':{description:'Build a max heap and repeatedly move its root to the sorted suffix.',best:'O(n log n)',average:'O(n log n)',worst:'O(n log n)',space:'O(1) auxiliary',note:'Uses in-place max-heap construction and extraction.'},
 'Counting Sort':{description:'Count each non-negative integer, then reconstruct in order.',best:'O(n + k)',average:'O(n + k)',worst:'O(n + k)',space:'O(n + k)',note:'k is max value + 1; count and output arrays use O(n + k) space. Values are capped at 10,000.'},
 'Radix Sort':{description:'Stablely distribute values by each base-10 digit, least significant first.',best:'O(d(n + 10))',average:'O(d(n + 10))',worst:'O(d(n + 10))',space:'O(n + 10)',note:'Non-negative safe integers only; d is the number of decimal digits.'},
 'Bucket Sort':{description:'Distribute values across √n buckets, sort each bucket, then collect.',best:'O(n + b)',average:'O(n + b)',worst:'O(n²)',space:'O(n + b)',note:'Average assumes values distribute reasonably across b buckets.'},
};
const initialsSearch='5, 1, 4, 2, 8';

function Playback({index,count,playing,onPlay,onPause,onPrevious,onNext,onReset,speed,onSpeed}:{index:number;count:number;playing:boolean;onPlay:()=>void;onPause:()=>void;onPrevious:()=>void;onNext:()=>void;onReset:()=>void;speed:number;onSpeed:(v:number)=>void}) {
 return <div className="al-playback">
  <div className="al-buttons">
   <button className="al-control al-play" onClick={onPlay} disabled={playing||index>=count-1} aria-label="Play algorithm"><Play size={15}/>Play</button>
   <button className="al-control" onClick={onPause} disabled={!playing} aria-label="Pause algorithm"><Pause size={15}/>Pause</button>
   <button className="al-control" onClick={onPrevious} disabled={index===0} aria-label="Previous step"><SkipBack size={15}/>Previous</button>
   <button className="al-control al-next" onClick={onNext} disabled={index>=count-1} aria-label="Next step"><SkipForward size={15}/>Next</button>
   <button className="al-control" onClick={onReset} aria-label="Reset algorithm"><RotateCcw size={15}/>Reset</button>
  </div>
  <label className="al-speed">Speed <input type="range" min="150" max="1400" step="50" value={1550-speed} onChange={e=>onSpeed(1550-Number(e.target.value))} aria-label="Animation speed"/> <span>{speed<500?'Fast':speed<900?'Normal':'Slow'}</span></label>
 </div>;
}

export function ArrayAlgorithmPlayground({ embedded = false, category: controlledCategory, algorithm: controlledAlgorithm }: PlaygroundProps = {}) {
 const [localCategory,setLocalCategory]=useState<Category>('Searching');
 const [localAlgorithm,setLocalAlgorithm]=useState('Linear Search');
 const category=controlledCategory??localCategory;
 const algorithm=controlledAlgorithm??localAlgorithm;
 const [arrayText,setArrayText]=useState(initialsSearch);
 const [targetText,setTargetText]=useState('4');
 const [values,setValues]=useState([5,1,4,2,8]);
 const [target,setTarget]=useState(4);
 const [error,setError]=useState('');
 const selectionKey = `${category}:${algorithm}`;
 const [playbackState,setPlaybackState]=useState({selectionKey:'',index:0,playing:false});
 const selectionMatches=playbackState.selectionKey===selectionKey;
 const index=selectionMatches?playbackState.index:0;
 const playing=selectionMatches?playbackState.playing:false;
 const setIndex=useCallback((next:number|((current:number)=>number))=>setPlaybackState(previous=>{
  const current=previous.selectionKey===selectionKey?previous.index:0;
  return {selectionKey,index:typeof next==='function'?next(current):next,playing:previous.selectionKey===selectionKey?previous.playing:false};
 }),[selectionKey]);
 const setPlaying=useCallback((next:boolean|((current:boolean)=>boolean))=>setPlaybackState(previous=>{
  const current=previous.selectionKey===selectionKey?previous.playing:false;
  return {selectionKey,index:previous.selectionKey===selectionKey?previous.index:0,playing:typeof next==='function'?next(current):next};
 }),[selectionKey]);
 const [speed,setSpeed]=useState(650);
 const isSearch=category==='Searching';
 const algorithms=isSearch?SEARCH_ALGORITHMS:SORT_ALGORITHMS;
 const steps=useMemo(()=>isSearch?makeSearchSteps(algorithm,values,target):makeSortSteps(algorithm,values),[isSearch,algorithm,values,target]);
 const current=steps[Math.min(index,steps.length-1)];
 const setCategoryAndReset=(next:Category)=>{setPlaying(false);setIndex(0);setLocalCategory(next);setLocalAlgorithm(next==='Searching'?'Linear Search':'Bubble Sort');setError('');};
 const chooseAlgorithm=(name:string)=>{setPlaying(false);setIndex(0);setLocalAlgorithm(name);setError('');};
 const useInput=()=>{const parsed=parseIntegerArray(arrayText);if(!parsed.valid){setError(parsed.error||'Enter valid input.');return;}const nextTarget=Number(targetText.trim());if(isSearch&&(!/^-?\d+$/.test(targetText.trim())||!Number.isSafeInteger(nextTarget))){setError('Target must be a safe whole number.');return;}if(!isSearch&&(algorithm==='Counting Sort'||algorithm==='Radix Sort')&&parsed.values.some(v=>v<0)){setError(algorithm+' supports non-negative integers only.');return;}if(!isSearch&&algorithm==='Counting Sort'&&Math.max(...parsed.values)>10000){setError('Counting Sort demo supports values up to 10,000 to keep its count array bounded.');return;}setPlaying(false);setIndex(0);setValues(parsed.values);if(isSearch)setTarget(nextTarget);setError('');};
 useEffect(()=>{if(!playing||index>=steps.length-1||current?.done)return;const timer=window.setTimeout(()=>{const next=Math.min(index+1,steps.length-1);setIndex(next);if(next>=steps.length-1||steps[next]?.done)setPlaying(false);},speed);return()=>window.clearTimeout(timer);},[playing,index,steps,speed,current?.done,setIndex,setPlaying]);
 const reset=()=>{setPlaying(false);setIndex(0);};
 const searchInfoItem=searchInfo[algorithm],sortInfoItem=sortInfo[algorithm],info=isSearch?searchInfoItem:sortInfoItem;
 const workValues=current?.array??values;
 const minValue=Math.min(0,...workValues),maxValue=Math.max(0,...workValues),valueRange=Math.max(1,maxValue-minValue);
 const compare=new Set(current?.comparing??[]),pivot=new Set(current?.pivot??[]),moving=new Set(current?.moving??[]),sorted=new Set(current?.sorted??[]),eliminated=new Set(current?.eliminated??[]);
 const isSortedNotice=isSearch&&!['Linear Search','Sentinel Linear Search'].includes(algorithm)&&values.some((v,i)=>i>0&&values[i-1]>v);

 return <section className={embedded ? 'algorithm-lab al-embedded' : 'algorithm-lab'} aria-label="Searching and Sorting Algorithm Lab">
  <header className="al-heading"><span className="al-kicker">INTERACTIVE LEARNING LAB</span><h2>Searching &amp; Sorting</h2><p>{embedded?`Step through the real ${algorithm} execution using your own input.`:'Choose a learning path, select an algorithm, then step through its real execution.'}</p></header>
  {!embedded&&<div className="al-step">
   <div className="al-step-title"><span>1</span><h3>Choose a category</h3></div>
   <div className="al-categories">
    <button className={'al-category'+(isSearch?' selected':'')} aria-pressed={isSearch} onClick={()=>setCategoryAndReset('Searching')}><Search size={19}/><span>Searching</span></button>
    <button className={'al-category'+(!isSearch?' selected':'')} aria-pressed={!isSearch} onClick={()=>setCategoryAndReset('Sorting')}><ArrowDownUp size={19}/><span>Sorting</span></button>
   </div>
  </div>}
  {!embedded&&<div className="al-step">
   <div className="al-step-title"><span>2</span><h3>Choose an algorithm</h3></div>
   <div className="al-chips" role="group" aria-label={category+' algorithms'}>{algorithms.map(name=><button key={name} className={'al-chip'+(algorithm===name?' selected':'')} aria-pressed={algorithm===name} onClick={()=>chooseAlgorithm(name)}>{name}</button>)}</div>
  </div>}
  <div className="al-step al-run-step">
   <div className="al-step-title"><span>3</span><h3>Watch it run</h3></div>
   <article className="al-card">
    <div className="al-card-head"><div><h3>{algorithm}</h3><p>{info.description}</p></div><div className="al-complexity">{isSearch?<><span>Best <b>{info.best}</b></span><span>Average <b>{info.average}</b></span><span>Worst <b>{info.worst}</b></span></>:<><span>Best <b>{info.best}</b></span><span>Average <b>{info.average}</b></span><span>Worst <b>{info.worst}</b></span></>}<span>Auxiliary <b>{info.space}</b></span></div></div>
    <p className="al-note">{info.note} Playback retains complete snapshots for stepping, requiring O(n × steps) trace memory.</p>
    <div className="al-inputs">
     <label className="al-field">Array <span className="al-hint">comma-separated integers · 1–12 values</span><input value={arrayText} onChange={e=>setArrayText(e.target.value)} aria-label="Input array" placeholder="5, 1, 4, 2, 8"/></label>
     {isSearch&&<label className="al-field al-target-field">Target<input value={targetText} onChange={e=>setTargetText(e.target.value)} aria-label="Search target" inputMode="numeric"/></label>}
     <button className="al-use-input" onClick={useInput}>Use Input</button>
    </div>
    {error&&<p className="al-error" role="alert">{error}</p>}
    {isSortedNotice&&<p className="al-notice" role="status"><strong>ℹ Sorted working copy</strong><br />This algorithm requires ascending input. A sorted copy is visualised while each item retains its original input index.</p>}
    <div className="al-stage">
     {isSearch&&algorithm==='Sentinel Linear Search'&&current?.visual?.sentinelIndex!=null&&<p className="al-note">Temporary sentinel: target {target} is checked at virtual index {current.visual.sentinelIndex}; it is not part of the displayed input array.</p>}
     <div className={'al-array'+(!isSearch?' al-sort-bars':'')} role="img" aria-label={(isSearch?'Working search array ':'Current array ')+workValues.join(', ')}>
      {workValues.map((value,i)=>{const found=isSearch&&current?.foundIndex===i;const state=found?'found':sorted.has(i)?'sorted':pivot.has(i)?'pivot':moving.has(i)?'moving':compare.has(i)?'compare':eliminated.has(i)||current?.visual?.activeRange&&isSearch&&(i<current.visual.activeRange[0]||i>current.visual.activeRange[1])?'eliminated':'normal';const pointer=current?.pointers?.[i];return isSearch?<div className={'al-cell '+state} key={i}><div className="al-pointer">{pointer||' '}</div><div className="al-value">{value}</div><div className="al-index">[{i}]</div>{current?.visual?.origins&&<small className="al-origin">input {current.visual.origins[i]}</small>}</div>:<div className="al-bar-wrap" key={i}><div className="al-pointer">{pointer||' '}</div><div className={'al-bar '+state} style={{height:`${24+((value-minValue)/valueRange)*92}px`}}><span>{value}</span></div><div className="al-index">[{i}]</div></div>;})}
     </div>
     {!isSearch&&current?.visual?.counts&&<div className="al-extra"><strong>Counts</strong>{current.visual.counts.map((v:number,i:number)=><span key={i}>{i}: {v}</span>)}</div>}
     {!isSearch&&current?.visual?.output&&<div className="al-extra"><strong>Output</strong>{current.visual.output.map((v:number,i:number)=><span key={i}>{i}: {v}</span>)}</div>}
     {!isSearch&&current?.visual?.buckets&&<div className="al-extra"><strong>Buckets {current.visual.digitPlace?('· digit place '+current.visual.digitPlace):''}</strong>{current.visual.buckets.map((bucket:number[],i:number)=><span key={i}>B{i}: {bucket.join(', ')||'—'}</span>)}</div>}
     {isSearch&&current?.foundIndex!=null&&<p className="al-result al-success">Found {target} at working index {current.foundIndex}{current.originalIndex!=null&&current.originalIndex!==current.foundIndex?' · original input index '+current.originalIndex:''}.</p>}
     {current?.done&&isSearch&&current?.foundIndex==null&&<p className="al-result">Target {target} was not found.</p>}
    </div>
    <div className="al-legend">{(isSearch?[['compare','Comparing'],['found','Found'],['eliminated','Eliminated'],['normal','Remaining']]:[['compare','Comparing'],['pivot','Pivot / selected'],['moving','Swap / move'],['sorted','Sorted'],['normal','Unsorted']]).map(([cls,label])=><span key={cls}><i className={cls}/>{label}</span>)}</div>
    <div className="al-message" aria-live="polite" aria-atomic="true"><strong>Step {index+1} of {steps.length}</strong><p>{current?.message}</p></div>
    <div className="al-stats"><span>Comparisons <b>{current?.stats.comparisons??0}</b></span>{!isSearch&&<><span>Swaps <b>{current?.stats.swaps??0}</b></span><span>Shifts <b>{current?.stats.shifts??0}</b></span><span>Writes <b>{current?.stats.writes??0}</b></span><span>Pass <b>{current?.stats.pass??0}</b></span></>}{current?.visual?.gap&&<span>Gap <b>{current.visual.gap}</b></span>}</div>
    <Playback index={index} count={steps.length} playing={playing} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onPrevious={()=>{setPlaying(false);setIndex(i=>clampStepIndex(i,-1,steps.length));}} onNext={()=>{setPlaying(false);setIndex(i=>clampStepIndex(i,1,steps.length));}} onReset={reset} speed={speed} onSpeed={setSpeed}/>
   </article>
  </div>
 </section>;
}





