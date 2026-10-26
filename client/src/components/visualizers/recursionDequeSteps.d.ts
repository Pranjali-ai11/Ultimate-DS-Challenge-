import type { TeachingStep } from './additionalTopicSteps.js';
export function makeRecursionSteps(operation: string, n: number): TeachingStep[];
export function makeNQueensSteps(n: number): TeachingStep[];
export function makeMazeSteps(maze: number[][]): TeachingStep[];
export type DequeState = { slots: Array<string | null>; front: number; size: number; lastResult: string | null };
export function createDeque(capacity?: number): DequeState;
export function dequeValues(deque: DequeState): Array<string | null>;
export function runDequeOperation(deque: DequeState, mode: string, operation: string, value?: string): { steps: TeachingStep[]; state: DequeState };
