// Core Data Structure Identifiers
export type DataStructureType =
  | 'array'
  | 'linked-list'
  | 'stack'
  | 'queue'
  | 'priority-queue'
  | 'heap'
  | 'bst'
  | 'hash-table'
  | 'graph';

export interface DataStructureMetadata {
  id: DataStructureType;
  name: string;
  shortDesc: string;
  iconName: string;
  category: 'Linear' | 'Hierarchical' | 'Associative' | 'Network';
  timeComplexity: {
    search: string;
    insert: string;
    delete: string;
    space: string;
  };
  strengths: string[];
  weaknesses: string[];
  realWorldUse: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  title: string;
  bio: string;
  createdAt: string;
}

export interface NextLevelUnlockProgress {
  level: number;
  fromLevel: number;
  passed: number;
  required: number;
  percentage: number;
}

export interface ProgressionSummary {
  totalChallenges: number;
  levels: Array<{ level: number; totalChallenges: number; rewardXpValues: number[] }>;
  unlockRequirements: Array<{ targetLevel: number; previousLevel: number; requiredPassed: number }>;
}

export interface DashboardProgressSummary {
  overallCompletion: { passed: number; total: number; percentage: number };
  badgeSummary: {
    total: number;
    earned: number;
    nearest: null | { code: string; name: string; description: string; current: number; target: number; percentage: number; progressLabel: string };
  };
  currentLevelMissions: { passed: number; total: number };
  nextStep: { label: string; path?: string; completed: boolean };
}

export interface UserProgress {
  userId: string;
  level: number;
  unlockedLevel: number;
  xp: number;
  xpTotals?: { allTime: number; weekly: number; monthly: number };
  score: number;
  completedChallenges: number;
  completedChallengesByLevel?: Record<number, number>;
  accuracy: number;
  streak: number;
  lastActive: string | null;
  hasNextLevel?: boolean;
  nextUnlock?: NextLevelUnlockProgress | null;
}

export interface ChallengeRequirement {
  id: string;
  label: string;
  description: string;
  critical: boolean;
}

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: 1 | 2 | 3 | 4; // Foundation, Strategist, Hybrid Designer, Optimization Architect
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  category: string;
  missionBrief: string;
  syllabusUnit?: number;
  syllabusTopic?: string;
  coverageTopics?: string[];
  requirements: ChallengeRequirement[];
  availableStructures: string[];
  rewardXp: number;
  // For Level 1
  question?: string;
  options?: {
    id: string;
    text: string;
    structureId: string;
  }[];
  // For Level 2 Comparison
  comparisonCriteria?: {
    criterion: string;
    description: string;
  }[];
}

export interface RequirementCoverageStatus {
  requirementId: string;
  requirementLabel: string;
  satisfied: boolean;
  satisfyingStructures: DataStructureType[];
  explanation: string;
}

export interface LevelQuizAnswer {
  challengeId: string;
  selectedOptionId: string | null;
  selectedOptionText: string;
  structureId: string | null;
  structureName: string;
}

export interface LevelQuizReview extends LevelQuizAnswer {
  title: string;
  category: string;
  question: string;
  correctOptionId: string;
  correctOptionText: string;
  correctOptionIds: string[];
  correctOptionNames: string[];
  isCorrect: boolean;
  explanation: string;
  correctExplanation: string;
  relevantReasons: string[];
  scenario?: string;
  selectedStructures?: string[];
  correctStructures?: string[];
  missingStructures?: string[];
  invalidSelections?: string[];
  selectedCorrectStructures?: string[];
  correctRequiredCount?: number;
  selectedCorrectCount?: number;
  selectedIncorrectCount?: number;
  isPartial?: boolean;
  status?: 'correct' | 'partial' | 'incorrect';
  score?: number;
  optimizationRationale?: string;
  requirements?: ChallengeRequirement[];
  requirementCoverage?: RequirementCoverageStatus[];
}

export interface LevelQuizResult {
  success: boolean;
  submissionId?: string;
  level: number;
  score: number;
  totalQuestions: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  percentage: number;
  earnedXp: number;
  challengeXpEarned?: number;
  badgeBonusXp?: number;
  newlyUnlockedLevel: number | null;
  newAchievements: Achievement[];
  reviews: LevelQuizReview[];
  progress: UserProgress;
}

export interface SavedQuestionReview {
  attemptId: string;
  questionId: string;
  submissionId: string | null;
  title: string;
  question: string | null;
  selectedAnswer: string | string[] | null;
  selectedAnswerLabel: string | null;
  correctAnswer: null | { optionIds: string[]; label: string | null; structures: string[] };
  correctness: 'correct' | 'partial' | 'incorrect' | null;
  marksAwarded: number;
  explanation: string | null;
  correctExplanation: string | null;
  coverageTopics: string[];
  subtopic: string | null;
  completedAt: string;
  answerDetailsAvailable: boolean;
}

export interface SavedSubmissionReview {
  success: boolean;
  submissionId: string | null;
  level: number | null;
  submittedAt: string;
  historical: boolean;
  questions: SavedQuestionReview[];
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  title?: string;
  description: string;
  icon: string;
  requirement: string;
  xpBonus: number;
  xpReward?: number;
  category?: 'Structure' | 'Milestone' | string;
  topic?: string;
  unlocked: boolean;
  earned?: boolean;
  unlockedAt?: string;
  progressCurrent?: number;
  progressTarget?: number;
  progressPercent?: number;
  progressType?: 'count' | 'status';
  progressLabel?: string;
  eligible?: boolean;
  awardPending?: boolean;
  almostEarned?: boolean;
  newlyEarned?: boolean;
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  title: string;
  level: number;
  xp: number;
  isCurrentUser?: boolean;
}
