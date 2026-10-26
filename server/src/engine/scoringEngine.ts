export interface MultiSelectScoreOutput {
  score: number;
  status: 'correct' | 'partial' | 'incorrect';
  correctStructures: string[];
  selectedCorrectStructures: string[];
  invalidSelections: string[];
  missingStructures: string[];
}

export interface RequirementScoreOutput {
  score: number;
  coveragePercentage: number;
  coveredCriticalCount: number;
  totalCriticalCount: number;
  unnecessarySelections: string[];
  satisfiedRequirementIds: string[];
}

export class ScoringEngine {
  static evaluateMultiSelect(params: {
    correctStructures: string[];
    selectedStructures: string[];
  }): MultiSelectScoreOutput {
    const correctSet = new Set(params.correctStructures);
    const selectedSet = new Set(params.selectedStructures);
    const selectedCorrectStructures = params.correctStructures.filter(structure => selectedSet.has(structure));
    const invalidSelections = params.selectedStructures.filter(structure => !correctSet.has(structure));
    const missingStructures = params.correctStructures.filter(structure => !selectedSet.has(structure));
    const score = params.correctStructures.length === 0 || params.selectedStructures.length === 0 || invalidSelections.length > 0
      ? 0
      : Math.round((selectedCorrectStructures.length / params.correctStructures.length) * 10000) / 100;
    const status = score === 100 ? 'correct' : score > 0 ? 'partial' : 'incorrect';
    return { score, status, correctStructures: params.correctStructures, selectedCorrectStructures, invalidSelections, missingStructures };
  }

  /** Partial credit follows critical requirement coverage and reduces credit for selected structures that satisfy no stated requirement. */
  static evaluateRequirements(params: {
    requirements: Array<{ id: string; critical: boolean; satisfiedBy?: string[] }>;
    selectedStructures: string[];
  }): RequirementScoreOutput {
    const critical = params.requirements.filter(requirement => requirement.critical);
    const satisfied = params.requirements.filter(requirement =>
      (requirement.satisfiedBy || []).some(structure => params.selectedStructures.includes(structure))
    );
    const satisfiedIds = new Set(satisfied.map(requirement => requirement.id));
    const coveredCriticalCount = critical.filter(requirement => satisfiedIds.has(requirement.id)).length;
    const coveragePercentage = critical.length
      ? coveredCriticalCount / critical.length
      : (params.requirements.length ? satisfied.length / params.requirements.length : 1);
    const relevant = new Set(params.requirements.flatMap(requirement => requirement.satisfiedBy || []));
    const unnecessarySelections = params.selectedStructures.filter(structure => !relevant.has(structure));
    const precision = params.selectedStructures.length
      ? (params.selectedStructures.length - unnecessarySelections.length) / params.selectedStructures.length
      : 0;
    const score = Math.round(coveragePercentage * precision * 10000) / 100;
    return {
      score,
      coveragePercentage: Math.round(coveragePercentage * 10000) / 100,
      coveredCriticalCount,
      totalCriticalCount: critical.length,
      unnecessarySelections,
      satisfiedRequirementIds: Array.from(satisfiedIds)
    };
  }
}
