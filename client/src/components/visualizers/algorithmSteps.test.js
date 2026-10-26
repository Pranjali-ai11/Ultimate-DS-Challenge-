import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clampStepIndex, makeBinarySearchSteps, makeBubbleSortSteps, makeSearchSteps, makeSortSteps, parseIntegerArray, prepareSortInput, restoreSortOrder, SEARCH_ALGORITHMS, SORT_ALGORITHMS } from './algorithmSteps.js';

describe('legacy playback helpers',()=>{
 it('keeps Bubble Sort comparison and swap states separate',()=>{const steps=makeBubbleSortSteps([3,2,2,1]);assert.deepEqual(steps.at(-1).values,[1,2,2,3]);assert.ok(steps.some(s=>s.action==='compare'));assert.ok(steps.some(s=>s.action==='swap'));});
 it('retains Binary Search empty, singleton and absent-target handling',()=>{assert.equal(makeBinarySearchSteps([],2).at(-1).foundIndex,null);assert.equal(makeBinarySearchSteps([3],3).at(-1).foundIndex,0);assert.equal(makeBinarySearchSteps([1,2,3],9).at(-1).foundIndex,null);});
 it('clamps playback navigation at both boundaries',()=>{assert.equal(clampStepIndex(0,-1,3),0);assert.equal(clampStepIndex(2,1,3),2);});
});

describe('all sorting generators',()=>{
 for(const name of SORT_ALGORITHMS) it(name+' sorts edge inputs and preserves snapshot lengths',()=>{
  for(const input of [[],[9],[1,2,3,4],[5,4,3,2,1],[3,1,3,2],[7,7,7],[0,-4,12,-1]]){
   if((name==='Counting Sort'||name==='Radix Sort')&&input.some(v=>v<0))continue;
   const steps=makeSortSteps(name,input);assert.ok(steps.length>0);assert.deepEqual(steps.at(-1).array,[...input].sort((a,b)=>a-b));
   for(const step of steps)assert.equal(step.array.length,input.length,name+' snapshot length');
   assert.ok(steps.at(-1).done);
  }
 });
 it('marks moved values with a dedicated movement highlight and exposes pass boundaries',()=>{const steps=makeSortSteps('Bubble Sort',[2,1]);const step=steps.find(s=>s.visual.phase==='swap');assert.deepEqual(step.moving,[0,1]);assert.ok(steps.some(s=>s.visual.phase==='pass'));});
 it('records algorithm-specific states rather than renaming one trace',()=>{
  assert.ok(makeSortSteps('Shell Sort',[5,1,3]).some(s=>s.visual.gap));
  assert.ok(makeSortSteps('Merge Sort',[3,1,2]).some(s=>s.visual.phase==='divide'||s.visual.phase==='merge-write'));
  assert.ok(makeSortSteps('Quick Sort',[3,1,2]).some(s=>s.visual.pivotIndex!==undefined));
  assert.ok(makeSortSteps('Heap Sort',[3,1,2]).some(s=>s.visual.heapSize!==undefined));
  assert.ok(makeSortSteps('Counting Sort',[3,1,2]).some(s=>s.visual.counts));
  assert.ok(makeSortSteps('Radix Sort',[31,2,12]).some(s=>s.visual.digitPlace));
  assert.ok(makeSortSteps('Bucket Sort',[3,1,2]).some(s=>s.visual.buckets));assert.ok(makeSortSteps('Bucket Sort',[3,1,2]).some(s=>s.visual.phase==='bucket-sort-compare'));
 });
 it('bounds Counting Sort range and rejects negative Counting and Radix inputs without altering the input',()=>{ assert.equal(makeSortSteps('Counting Sort',[0,10001]).at(-1).visual.phase,'invalid');
  for(const name of ['Counting Sort','Radix Sort']){const original=[-2,1];const result=makeSortSteps(name,original);assert.deepEqual(result.at(-1).array,original);assert.equal(result.at(-1).visual.phase,'invalid');}
 });
 it('prepares descending comparison input without producing negative values for Counting or Radix Sort',()=>{
  const input=[4,1,7,2];
  for(const name of ['Counting Sort','Radix Sort']){
   const encoded=prepareSortInput(input,'Descending');
   assert.ok(encoded.every(value=>value>=0));
   const trace=makeSortSteps(name,encoded);
   assert.equal(trace.at(-1).visual.phase,'complete');
   assert.deepEqual(restoreSortOrder(trace.at(-1).array,'Descending',input),[7,4,2,1]);
  }
 });
});

describe('all searching generators',()=>{
 for(const name of SEARCH_ALGORITHMS) it(name+' finds first, middle, last, absent and duplicate values',()=>{
  for(const [input,target,expected] of [[[1,3,5,7,9],1,0],[[1,3,5,7,9],5,2],[[1,3,5,7,9],9,4],[[1,3,5,7,9],6,-1],[[2,1,2,2],2,0],[[4],4,0],[[4],8,-1]]){
   const steps=makeSearchSteps(name,input,target);assert.ok(steps.length>0);const last=steps.at(-1);assert.equal(last.originalIndex??-1,expected,name+' '+input+' target '+target);assert.ok(steps.every(s=>s.array.length===steps[0].array.length));
  }
 });
 it('marks only visited rejections as eliminated until the search completes',()=>{const steps=makeSearchSteps('Linear Search',[2,4,8],8);assert.deepEqual(steps[0].eliminated,[]);const checked=steps.find(s=>s.comparing[0]===1);assert.deepEqual(checked.eliminated,[0]);assert.deepEqual(steps.at(-1).eliminated,[]);const absent=makeSearchSteps('Linear Search',[2,4,8],9);assert.deepEqual(absent.at(-1).eliminated,[0,1,2]);});
 it('sorts a working copy for ordered searches and retains the original index',()=>{
  for(const name of SEARCH_ALGORITHMS.filter(x=>!['Linear Search','Sentinel Linear Search'].includes(x))){const steps=makeSearchSteps(name,[9,2,7,2],2);assert.equal(steps.at(-1).originalIndex,1);assert.deepEqual(steps.at(-1).array,[2,2,7,9]);}
 });
 it('uses and restores the temporary sentinel without changing visible data',()=>{
  const steps=makeSearchSteps('Sentinel Linear Search',[5,2,8],7);assert.ok(steps.some(s=>s.visual.sentinelIndex===3));assert.deepEqual(steps.at(-1).array,[5,2,8]);assert.equal(steps.at(-1).foundIndex,null);
 });
});

describe('input validation',()=>{
 it('exposes only the searching and sorting options approved for the visualisation hub',()=>{
  assert.deepEqual(SEARCH_ALGORITHMS,['Linear Search','Sentinel Linear Search','Binary Search','Recursive Binary Search','Fibonacci Search']);
  assert.deepEqual(SORT_ALGORITHMS,['Bubble Sort','Selection Sort','Insertion Sort','Shell Sort','Merge Sort','Quick Sort','Heap Sort','Counting Sort','Radix Sort','Bucket Sort']);
 });
 it('accepts 1–12 safe integers and rejects empty, decimals and malformed input',()=>{
  assert.equal(parseIntegerArray('  ').valid,false);assert.deepEqual(parseIntegerArray('3, -1, 3').values,[3,-1,3]);assert.equal(parseIntegerArray('2, 1.5').valid,false);assert.equal(parseIntegerArray('2, nope').valid,false);assert.equal(parseIntegerArray(Array(13).fill('1').join(',')).valid,false);
 });
});


