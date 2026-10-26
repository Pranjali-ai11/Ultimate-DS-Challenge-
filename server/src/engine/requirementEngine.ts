export interface RequirementCheckResult {
  requirementId: string;
  label: string;
  satisfied: boolean;
  satisfyingStructures: string[];
  explanation: string;
}

// Capability matrix of all 9 core structures
export const STRUCTURE_CAPABILITIES: Record<string, {
  fastDirectLookup: boolean;
  fifoOrdering: boolean;
  lifoOrdering: boolean;
  priorityDispatch: boolean;
  sortedRangeScan: boolean;
  graphRelationships: boolean;
  constantPointerSplice: boolean;
  lowMemoryFootprint: boolean;
}> = {
  'array': {
    fastDirectLookup: true, // by index only
    fifoOrdering: false,
    lifoOrdering: false,
    priorityDispatch: false,
    sortedRangeScan: false, // unless sorted
    graphRelationships: false,
    constantPointerSplice: false,
    lowMemoryFootprint: true,
  },
  'linked-list': {
    fastDirectLookup: false,
    fifoOrdering: true,
    lifoOrdering: true,
    priorityDispatch: false,
    sortedRangeScan: false,
    graphRelationships: false,
    constantPointerSplice: true,
    lowMemoryFootprint: false,
  },
  'stack': {
    fastDirectLookup: false,
    fifoOrdering: false,
    lifoOrdering: true,
    priorityDispatch: false,
    sortedRangeScan: false,
    graphRelationships: false,
    constantPointerSplice: false,
    lowMemoryFootprint: true,
  },
  'queue': {
    fastDirectLookup: false,
    fifoOrdering: true,
    lifoOrdering: false,
    priorityDispatch: false,
    sortedRangeScan: false,
    graphRelationships: false,
    constantPointerSplice: false,
    lowMemoryFootprint: true,
  },
  'priority-queue': {
    fastDirectLookup: false,
    fifoOrdering: false,
    lifoOrdering: false,
    priorityDispatch: true,
    sortedRangeScan: false,
    graphRelationships: false,
    constantPointerSplice: false,
    lowMemoryFootprint: true,
  },
  'heap': {
    fastDirectLookup: false,
    fifoOrdering: false,
    lifoOrdering: false,
    priorityDispatch: true,
    sortedRangeScan: false,
    graphRelationships: false,
    constantPointerSplice: false,
    lowMemoryFootprint: true,
  },
  'bst': {
    fastDirectLookup: false, // O(log n)
    fifoOrdering: false,
    lifoOrdering: false,
    priorityDispatch: false,
    sortedRangeScan: true,
    graphRelationships: false,
    constantPointerSplice: false,
    lowMemoryFootprint: false,
  },
  'hash-table': {
    fastDirectLookup: true,
    fifoOrdering: false,
    lifoOrdering: false,
    priorityDispatch: false,
    sortedRangeScan: false,
    graphRelationships: false,
    constantPointerSplice: false,
    lowMemoryFootprint: false,
  },
  'graph': {
    fastDirectLookup: false,
    fifoOrdering: false,
    lifoOrdering: false,
    priorityDispatch: false,
    sortedRangeScan: false,
    graphRelationships: true,
    constantPointerSplice: false,
    lowMemoryFootprint: false,
  }
};

export class RequirementEngine {
  static getCorrectStructuresForChallenge(challenge: {
    requirements: Array<{ id: string; label: string; description: string; critical: boolean; satisfiedBy?: string[] }>;
    availableStructures: string[];
    optimalStructures: string[];
  }): string[] {
    const optimal = new Set(challenge.optimalStructures.filter(structure => challenge.availableStructures.includes(structure)));
    return challenge.availableStructures.filter(structure =>
      optimal.has(structure) || this.evaluateRequirements(challenge.requirements, [structure]).allCriticalSatisfied
    );
  }

  static evaluateRequirements(
    requirements: Array<{ id: string; label: string; description: string; critical: boolean; satisfiedBy?: string[] }>,
    selectedStructures: string[]
  ): {
    coverageList: RequirementCheckResult[];
    allCriticalSatisfied: boolean;
    satisfactionPercentage: number;
    satisfiedCount: number;
    totalCount: number;
  } {
    const coverageList: RequirementCheckResult[] = [];
    let satisfiedCount = 0;
    let allCriticalSatisfied = true;

    for (const req of requirements) {
      const allowedStructures = req.satisfiedBy || [];
      const matching = selectedStructures.filter(s => allowedStructures.includes(s));
      const isSatisfied = matching.length > 0;

      if (isSatisfied) {
        satisfiedCount++;
        coverageList.push({
          requirementId: req.id,
          label: req.label,
          satisfied: true,
          satisfyingStructures: matching,
          explanation: `Satisfied by ${matching.map(s => s.toUpperCase()).join(' & ')}. Matches algorithmic capabilities.`
        });
      } else {
        if (req.critical) {
          allCriticalSatisfied = false;
        }
        coverageList.push({
          requirementId: req.id,
          label: req.label,
          satisfied: false,
          satisfyingStructures: [],
          explanation: `Not satisfied. Requires a structure supporting: ${req.description} (e.g., ${allowedStructures.map(s => s.toUpperCase()).join(' or ')}).`
        });
      }
    }

    const totalCount = requirements.length;
    const satisfactionPercentage = totalCount === 0 ? 100 : Math.round((satisfiedCount / totalCount) * 100);

    return {
      coverageList,
      allCriticalSatisfied,
      satisfactionPercentage,
      satisfiedCount,
      totalCount
    };
  }

}
