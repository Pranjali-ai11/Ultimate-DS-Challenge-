export const PRACTICE_EXPOSURE_TOPICS = [
  'array',
  'linked-list',
  'stack',
  'queue',
  'deque',
  'priority-queue',
  'heap',
  'bst',
  'hash-table',
  'graph'
] as const;

export type PracticeExposureTopic = typeof PRACTICE_EXPOSURE_TOPICS[number];
export type PracticeExposureValue = { passed: number; total: number; percentage: number };
export type PracticeExposure = Record<PracticeExposureTopic, PracticeExposureValue>;

type ChallengeMetadata = { id: string; coverageTopics?: unknown; [key: string]: unknown };
type ChallengeAttempt = { challenge_id: string; status: string };

const aliases: Record<PracticeExposureTopic, string[]> = {
  array: ['array'],
  'linked-list': ['linked-list', 'singly-linked-list', 'circular-singly-linked-list', 'doubly-linked-list', 'doubly-circular-linked-list'],
  stack: ['stack', 'lifo'],
  queue: ['queue', 'fifo'],
  deque: ['deque', 'double-ended-queue'],
  'priority-queue': ['priority-queue', 'ascending-priority-queue', 'descending-priority-queue'],
  heap: ['heap', 'binary-heap'],
  bst: ['bst', 'binary-search-tree'],
  'hash-table': ['hash-table', 'hashtable'],
  graph: ['graph', 'graph-network']
};

const topicByAlias = new Map<string, PracticeExposureTopic>(
  Object.entries(aliases).flatMap(([topic, values]) => values.map(value => [value, topic as PracticeExposureTopic]))
);

function canonicalTopic(value: string): PracticeExposureTopic | undefined {
  const normalized = value.trim().toLowerCase().replace(/[\s_]+/g, '-');
  return topicByAlias.get(normalized);
}

function associatedTopics(challenge: ChallengeMetadata): Set<PracticeExposureTopic> {
  if (!Array.isArray(challenge.coverageTopics)) return new Set();
  return new Set(challenge.coverageTopics
    .filter((value): value is string => typeof value === 'string')
    .map(canonicalTopic)
    .filter((topic): topic is PracticeExposureTopic => topic !== undefined));
}

/**
 * Exposure is the share of catalog challenges whose curated coverage metadata
 * includes a topic that the user has passed at least once. Answer/scoring metadata
 * is intentionally kept separate from topical association.
 * Attempts and incidental wording are not used as topic associations.
 */
export function calculatePracticeExposure(
  challenges: ChallengeMetadata[],
  attempts: ChallengeAttempt[]
): PracticeExposure {
  const challengeTopics = new Map<string, Set<PracticeExposureTopic>>();
  for (const challenge of challenges) {
    if (!challengeTopics.has(challenge.id)) challengeTopics.set(challenge.id, associatedTopics(challenge));
  }

  const passedIds = new Set(attempts
    .filter(attempt => attempt.status === 'passed')
    .map(attempt => attempt.challenge_id));

  return Object.fromEntries(PRACTICE_EXPOSURE_TOPICS.map(topic => {
    const relevantIds = new Set([...challengeTopics]
      .filter(([, topics]) => topics.has(topic))
      .map(([id]) => id));
    const passed = [...passedIds].filter(id => relevantIds.has(id)).length;
    const total = relevantIds.size;
    return [topic, { passed, total, percentage: total === 0 ? 0 : Math.min(100, Math.round(passed / total * 100)) }];
  })) as PracticeExposure;
}
