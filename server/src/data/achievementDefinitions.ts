export type AchievementRule =
  | { type: 'topic'; topic: string; target: number }
  | { type: 'distinct-passes'; target: number }
  | { type: 'perfect-level'; level: number }
  | { type: 'score-at-least'; score: number }
  | { type: 'streak'; target: number };

export interface AchievementDefinition {
  code: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  xpBonus: number;
  category: 'Structure' | 'Milestone';
  rule: AchievementRule;
}

/** Stable definitions and server-side earning rules. Topic rules use coverageTopics. */
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    code: 'first_blood', name: 'First Step',
    description: 'Pass one distinct challenge for the first time.',
    icon: 'Sparkles', requirement: 'Pass 1 distinct challenge', xpBonus: 50,
    category: 'Milestone', rule: { type: 'distinct-passes', target: 1 }
  },
  {
    code: 'array_ace', name: 'Array Ace',
    description: 'Pass 5 distinct challenges that cover Array concepts.',
    icon: 'Boxes', requirement: 'Pass 5 distinct Array challenges', xpBonus: 150,
    category: 'Structure', rule: { type: 'topic', topic: 'array', target: 5 }
  },
  {
    code: 'linked_list_navigator', name: 'Linked List Navigator',
    description: 'Pass 4 distinct challenges that cover Linked List concepts.',
    icon: 'GitBranch', requirement: 'Pass 4 distinct Linked List challenges', xpBonus: 150,
    category: 'Structure', rule: { type: 'topic', topic: 'linked-list', target: 4 }
  },
  {
    code: 'stack_master', name: 'Stack Master',
    description: 'Pass 3 distinct challenges that cover Stack concepts.',
    icon: 'Layers', requirement: 'Pass 3 distinct Stack challenges', xpBonus: 100,
    category: 'Structure', rule: { type: 'topic', topic: 'stack', target: 3 }
  },
  {
    code: 'queue_master', name: 'Queue Master',
    description: 'Pass 3 distinct challenges that cover Queue concepts.',
    icon: 'Clock', requirement: 'Pass 3 distinct Queue challenges', xpBonus: 100,
    category: 'Structure', rule: { type: 'topic', topic: 'queue', target: 3 }
  },
  {
    code: 'deque_specialist', name: 'Deque Specialist',
    description: 'Pass 3 distinct challenges that cover Deque concepts.',
    icon: 'ArrowLeftRight', requirement: 'Pass 3 distinct Deque challenges', xpBonus: 100,
    category: 'Structure', rule: { type: 'topic', topic: 'deque', target: 3 }
  },
  {
    code: 'priority_strategist', name: 'Priority Strategist',
    description: 'Pass 4 distinct challenges that cover Priority Queue concepts.',
    icon: 'ListOrdered', requirement: 'Pass 4 distinct Priority Queue challenges', xpBonus: 150,
    category: 'Structure', rule: { type: 'topic', topic: 'priority-queue', target: 4 }
  },
  {
    code: 'heap_engineer', name: 'Heap Engineer',
    description: 'Pass 3 distinct challenges that cover Binary Heap concepts.',
    icon: 'Network', requirement: 'Pass 3 distinct Binary Heap challenges', xpBonus: 150,
    category: 'Structure', rule: { type: 'topic', topic: 'heap', target: 3 }
  },
  {
    code: 'tree_architect', name: 'Tree Architect',
    description: 'Pass 3 distinct challenges that cover Binary Search Tree concepts.',
    icon: 'GitBranch', requirement: 'Pass 3 distinct Binary Search Tree challenges', xpBonus: 150,
    category: 'Structure', rule: { type: 'topic', topic: 'bst', target: 3 }
  },
  {
    code: 'hashing_expert', name: 'Hashing Expert',
    description: 'Pass 4 distinct challenges that cover Hash Table concepts.',
    icon: 'Hash', requirement: 'Pass 4 distinct Hash Table challenges', xpBonus: 150,
    category: 'Structure', rule: { type: 'topic', topic: 'hash-table', target: 4 }
  },
  {
    code: 'graph_explorer', name: 'Graph Explorer',
    description: 'Pass 3 distinct challenges that cover Graph concepts.',
    icon: 'Network', requirement: 'Pass 3 distinct Graph challenges', xpBonus: 150,
    category: 'Structure', rule: { type: 'topic', topic: 'graph', target: 3 }
  },
  {
    code: 'hybrid_designer', name: 'Hybrid Designer',
    description: 'Earn full credit on at least one Level 3 hybrid challenge.',
    icon: 'Boxes', requirement: 'Earn full credit on a Level 3 challenge', xpBonus: 200,
    category: 'Milestone', rule: { type: 'perfect-level', level: 3 }
  },
  {
    code: 'system_architect', name: 'Optimization Architect',
    description: 'Earn full credit on at least one Level 4 challenge.',
    icon: 'Crown', requirement: 'Earn full credit on a Level 4 challenge', xpBonus: 300,
    category: 'Milestone', rule: { type: 'perfect-level', level: 4 }
  },
  {
    code: 'complexity_master', name: 'Complexity Master',
    description: 'Pass at least one challenge with a score of 95% or higher.',
    icon: 'Zap', requirement: 'Pass a challenge with a score of at least 95%', xpBonus: 200,
    category: 'Milestone', rule: { type: 'score-at-least', score: 95 }
  },
  {
    code: 'streak_master', name: 'On Fire',
    description: 'Maintain a learning streak of 3 consecutive UTC calendar days.',
    icon: 'Flame', requirement: 'Reach a 3-day learning streak', xpBonus: 150,
    category: 'Milestone', rule: { type: 'streak', target: 3 }
  }
];

export const ACHIEVEMENT_DEFINITION_BY_CODE = new Map(ACHIEVEMENT_DEFINITIONS.map(item => [item.code, item]));
