export interface LearningGuideOperation {
  operation: string;
  precondition: string;
  steps: string[];
  result: string;
  cost: string;
  boundary: string;
}

export interface LearningGuide {
  scope: 'core' | 'enrichment';
  syllabus: string;
  prerequisites: string[];
  mentalModel: string;
  representation: string;
  invariant: string;
  sandboxOperations: string[];
  operationWalkthroughs: LearningGuideOperation[];
  workedExample: { title: string; steps: string[]; result: string; trap: string };
  complexityReasoning: string[];
  commonMistakes: string[];
  checks: Array<{ question: string; answer: string; reasoning: string }>;
}

export interface CourseTopic {
  id?: string;
  unitId?: string;
  title: string;
  category: string;
  explanation: string;
  purpose: string;
  prerequisites: string[];
  workedSteps: string[];
  result: string;
  pseudocode?: string;
  complexity: string[];
  edgeCases: string[];
  pitfalls: string[];
  check: string;
  answer: string;
  practice: Array<{ question: string; answer: string; reasoning: string }>;
  summary: string;
  comparison?: Array<{ method: string; condition: string; best: string; average: string; worst: string; stable: string; extraSpace: string }>;
}

export interface TopicRegistryEntry {
  id: string;
  name: string;
  aliases: string[];
  subtopics: string[];
  relatedLessonIds: string[];
  visualizerIds: string[];
  questionIds: string[];
  syllabusUnits: number[];
}

export interface CourseUnit {
  id: string;
  title: string;
  outcome: string;
  topics: CourseTopic[];
}
