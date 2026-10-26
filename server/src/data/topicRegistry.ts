import { FODS_REQUIRED_CHALLENGES } from './fodsQuestionBank.js';
import { DATA_STRUCTURES_CATALOG } from './seedData.js';
import { FODS_COURSE_UNITS } from './fodsLearningContent.js';

export type TopicRegistryEntry = {
  id: string;
  name: string;
  aliases: string[];
  subtopics: string[];
  relatedLessonIds: string[];
  visualizerIds: string[];
  questionIds: string[];
  syllabusUnits: number[];
};

const TOPICS: Array<Pick<TopicRegistryEntry, 'id' | 'name' | 'aliases' | 'visualizerIds'>> = [
  { id: 'array', name: 'Array', aliases: ['arrays'], visualizerIds: ['array'] },
  { id: 'linked-list', name: 'Linked List', aliases: ['linked list', 'lists'], visualizerIds: ['linked-list'] },
  { id: 'stack', name: 'Stack', aliases: ['stacks', 'lifo'], visualizerIds: ['stack'] },
  { id: 'queue', name: 'Queue', aliases: ['queues', 'fifo'], visualizerIds: ['queue'] },
  { id: 'deque', name: 'Deque', aliases: ['double ended queue', 'double-ended queue'], visualizerIds: ['deque'] },
  { id: 'priority-queue', name: 'Priority Queue', aliases: ['priority queue'], visualizerIds: ['priority-queue'] },
  { id: 'heap', name: 'Binary Heap', aliases: ['heap', 'heaps', 'binary heap', 'min heap', 'min-heap', 'max heap', 'max-heap'], visualizerIds: ['heap'] },
  { id: 'bst', name: 'Binary Search Tree', aliases: ['bst', 'binary tree search', 'tree'], visualizerIds: ['bst'] },
  { id: 'hash-table', name: 'Hash Table', aliases: ['hashing', 'hash table', 'hash tables'], visualizerIds: ['hash-table'] },
  { id: 'graph', name: 'Graph', aliases: ['graphs', 'graph network'], visualizerIds: ['graph'] },
  { id: 'searching', name: 'Searching', aliases: ['search', 'searching algorithms'], visualizerIds: ['Searching'] },
  { id: 'sorting', name: 'Sorting', aliases: ['sort', 'sorting algorithms'], visualizerIds: ['Sorting'] },
  { id: 'matrix-sparse-matrix', name: 'Matrix and Sparse Matrix', aliases: ['matrix', 'sparse matrix'], visualizerIds: ['matrix'] },
  { id: 'polynomial', name: 'Polynomial', aliases: ['polynomials'], visualizerIds: ['polynomial'] },
  { id: 'expressions', name: 'Expressions', aliases: ['expression', 'infix', 'postfix', 'prefix'], visualizerIds: ['expressions'] },
  { id: 'recursion-backtracking', name: 'Recursion and Backtracking', aliases: ['recursion', 'backtracking'], visualizerIds: ['recursion'] },
  { id: 'complexity', name: 'Complexity Analysis', aliases: ['time complexity', 'space complexity'], visualizerIds: [] },
  { id: 'algorithm-design', name: 'Algorithm Design', aliases: ['algorithm design'], visualizerIds: ['Searching', 'Sorting'] },
  { id: 'gll', name: 'Generalized Linked Lists', aliases: ['generalized linked list', 'generalized linked lists'], visualizerIds: [] },
  { id: 'flowchart-pseudocode', name: 'Flowcharts and Pseudocode', aliases: ['flowchart', 'flowcharts', 'pseudocode'], visualizerIds: [] },
  { id: 'external-sorting', name: 'External Sorting', aliases: ['external sort'], visualizerIds: [] }
];

const COURSE_LESSON_TOPICS: Record<string, string[]> = {
  array: ['unit-2:array-adt-and-ordered-operations'],
  'matrix-sparse-matrix': ['unit-2:row-major-column-major-address-calculations', 'unit-2:sparse-triplets-addition-and-transpose'],
  polynomial: ['unit-2:polynomial-array-structure-representation', 'unit-4:polynomial-lists-and-gll-polynomial-representation'],
  searching: ['unit-3:linear-sentinel-binary-fibonacci-indexed-sequential-search'],
  sorting: ['unit-3:bubble-insertion-selection', 'unit-3:quick-sort-and-shell-sort', 'unit-3:counting-radix-bucket-internal-external-sorting'],
  'linked-list': ['unit-4:allocation-node-model-list-variants-gll', 'unit-4:create-traverse-search-insert-delete-sort-concatenate'],
  gll: ['unit-4:allocation-node-model-list-variants-gll', 'unit-4:polynomial-lists-and-gll-polynomial-representation'],
  stack: ['unit-5:stack-implementations-and-multiple-stacks'],
  expressions: ['unit-5:infix-prefix-postfix-conversion-evaluation'],
  'recursion-backtracking': ['unit-5:direct-indirect-tail-and-tree-recursion', 'unit-5:balanced-delimiters-and-backtracking'],
  queue: ['unit-6:array-circular-linked-queues'],
  deque: ['unit-6:multiple-queues-and-restricted-deques'],
  'priority-queue': ['unit-6:ascending-descending-priority-queues'],
  complexity: ['unit-1:time-space-asymptotic-notation-step-counting'],
  'algorithm-design': ['unit-1:algorithm-design-pseudocode-flowcharts-correctness'],
  'flowchart-pseudocode': ['unit-1:algorithm-design-pseudocode-flowcharts-correctness'],
  'external-sorting': ['unit-3:counting-radix-bucket-internal-external-sorting']
};

const slug = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const getCourseLessonId = (unitId: string, title: string) => `${unitId}:${slug(title)}`;
const lessons = FODS_COURSE_UNITS.flatMap(unit => unit.topics.map(topic => ({ id: `${unit.id}:${slug(topic.title)}`, title: topic.title })));
const lessonIds = new Set(lessons.map(lesson => lesson.id));
const referenceIds = new Set(DATA_STRUCTURES_CATALOG.map(item => `reference:${item.id}`));
const visualizerIds = new Set(['array', 'linked-list', 'stack', 'queue', 'priority-queue', 'heap', 'bst', 'hash-table', 'graph', 'matrix', 'polynomial', 'expressions', 'recursion', 'deque', 'Searching', 'Sorting']);

export const TOPIC_REGISTRY: TopicRegistryEntry[] = TOPICS.map(topic => {
  const challenges = FODS_REQUIRED_CHALLENGES.filter(question => question.coverageTopics.includes(topic.id));
  const referenceId = referenceIds.has(`reference:${topic.id}`) ? [`reference:${topic.id}`] : [];
  const mappedLessons = (COURSE_LESSON_TOPICS[topic.id] || []).filter(id => lessonIds.has(id));
  return {
    ...topic,
    subtopics: [...new Set(challenges.map(question => question.syllabusTopic).filter((value): value is string => Boolean(value)))].sort(),
    relatedLessonIds: [...new Set([...referenceId, ...mappedLessons])],
    questionIds: challenges.map(question => question.id),
    syllabusUnits: [...new Set(challenges.map(question => question.syllabusUnit).filter((value): value is number => Number.isInteger(value)))].sort((a, b) => a - b)
  };
});

const aliasIndex = new Map<string, string>();
for (const topic of TOPIC_REGISTRY) {
  for (const alias of [topic.id, topic.name, ...topic.aliases]) aliasIndex.set(alias.trim().toLowerCase().replace(/\s+/g, ' '), topic.id);
}

export function normalizeTopicId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return aliasIndex.get(value.trim().toLowerCase().replace(/\s+/g, ' '));
}

export function getTopic(topicId: unknown): TopicRegistryEntry | undefined {
  const normalized = normalizeTopicId(topicId);
  return normalized ? TOPIC_REGISTRY.find(topic => topic.id === normalized) : undefined;
}

export function validateTopicRegistry(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const topic of TOPIC_REGISTRY) {
    if (ids.has(topic.id)) errors.push(`Duplicate topic ID: ${topic.id}`);
    ids.add(topic.id);
    if (!topic.name.trim()) errors.push(`Topic ${topic.id} has no name.`);
    if (topic.relatedLessonIds.some(id => !lessonIds.has(id) && !referenceIds.has(id))) errors.push(`Topic ${topic.id} references an unknown lesson.`);
    if (topic.visualizerIds.some(id => !visualizerIds.has(id))) errors.push(`Topic ${topic.id} references an unknown visualizer.`);
    if (topic.questionIds.some(id => !FODS_REQUIRED_CHALLENGES.some(question => question.id === id && question.coverageTopics.includes(topic.id)))) errors.push(`Topic ${topic.id} references an unrelated question.`);
  }
  return errors;
}
