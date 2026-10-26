export const SEARCH_ALGORITHMS: string[];
export const SORT_ALGORITHMS: string[];
export interface LabStep {
 array: number[]; message: string; comparing: number[]; pivot: number[]; moving:number[]; sorted: number[]; eliminated: number[];
 pointers: Record<number,string>; stats: { comparisons:number; swaps:number; shifts:number; writes:number; pass:number };
 visual: { phase?:string; origins?:number[]; activeRange?:[number,number]; blocks?:Array<{start:number;end:number;boundary:number}>; selectedBlock?:number; blockSize?:number; sentinelIndex?:number; fibonacci?:number[]; offset?:number; gap?:number; counts?:number[]; output?:number[]; digitPlace?:number; buckets?:number[][]; heapSize?:number; pivotIndex?:number; left?:number[]; right?:number[]; mid?:number };
 done:boolean; foundIndex?:number|null; originalIndex?:number|null;
}
export function parseIntegerArray(text:string): {valid:boolean;values:number[];error:string|null};
export function clampStepIndex(index:number,delta:number,length:number):number;
export function prepareSortInput(values:number[],order:'Ascending'|'Descending'):number[];
export function restoreSortOrder(values:number[],order:'Ascending'|'Descending',original:number[]):number[];
export function makeSearchSteps(name:string,input:number[],target:number):LabStep[];
export function makeSortSteps(name:string,input:number[]):LabStep[];
export function makeBubbleSortSteps(input:number[]): Array<{values:number[];action:string;leftIndex:number|null;rightIndex:number|null;swapped:boolean;completedPasses:number;done:boolean;explanation:string}>;
export function makeBinarySearchSteps(values:number[],target:number): Array<{action:string;low:number;high:number;mid:number|null;target:number;comparison:string|null;foundIndex:number|null;done:boolean;explanation:string}>;

