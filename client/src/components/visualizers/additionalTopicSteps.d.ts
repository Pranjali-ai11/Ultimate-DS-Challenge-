export type MatrixCell = { row: number; col: number; value: number };
export type TeachingStep = {
  state: any;
  message: string;
  stats: Record<string, number>;
  highlights: Record<string, any>;
  visual: Record<string, any>;
};
export function parseMatrixInput(text: string): number[][];
export function denseToTriplets(matrix: number[][]): MatrixCell[];
export function simpleTranspose(terms: MatrixCell[]): MatrixCell[];
export function fastTranspose(terms: MatrixCell[]): { terms: MatrixCell[]; counts: number[]; starts: number[]; nextPosition: number[]; steps: any[] };
export function makeMatrixSteps(operation: string, input: { matrix: number[][]; matrixB?: number[][]; baseAddress?: number; elementSize?: number; rowIndex?: number; colIndex?: number }): TeachingStep[];
export function parsePolynomial(text: string): Array<{ coefficient: number; exponent: number }>;
export function normalizePolynomial(terms: Array<{ coefficient: number; exponent: number }>): Array<{ coefficient: number; exponent: number }>;
export function formatPolynomial(terms: Array<{ coefficient: number; exponent: number }>): string;
export function makePolynomialSteps(operation: string, a: Array<{ coefficient: number; exponent: number }>, b: Array<{ coefficient: number; exponent: number }>): TeachingStep[];
export function tokenizeExpression(expression: string): string[];
export function makeExpressionSteps(operation: string, expression: string): TeachingStep[];
