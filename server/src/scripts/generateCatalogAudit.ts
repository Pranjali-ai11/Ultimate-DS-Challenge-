import { writeFileSync } from 'node:fs';
import { FODS_REQUIRED_CHALLENGES } from '../data/fodsQuestionBank.js';

const escapeCell = (value: unknown) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
const headers = ['ID', 'Level / difficulty', 'Syllabus unit or category', 'Title', 'Prompt / tested concept', 'Answer key (separate from mapping)', 'Curated coverage topics'];
const rows = FODS_REQUIRED_CHALLENGES.map(item => [
  item.id,
  item.level + ' / ' + item.difficulty,
  item.syllabusUnit ? 'Unit ' + item.syllabusUnit : item.category,
  item.title,
  item.question,
  item.optimalStructures?.join(', '),
  item.coverageTopics?.join(', ')
]);
const markdown = [
  '# Complete active challenge inventory and topic audit',
  '',
  'Source: FODS_REQUIRED_CHALLENGES in server/src/data/fodsQuestionBank.ts. The answer-key column is separate because optimalStructures defines the challenge answer/scoring contract; it is not the topic mapping. Curated coverageTopics records the concept(s) actually tested, reviewed against the prompt, options/requirements, and explanation. A challenge may have multiple genuine topics. New c-l* IDs are additions; original challenge IDs were preserved.',
  '',
  '| ' + headers.join(' | ') + ' |',
  '| ' + headers.map(() => '---').join(' | ') + ' |',
  ...rows.map(row => '| ' + row.map(escapeCell).join(' | ') + ' |'),
  ''
].join('\n');

writeFileSync(new URL('../../docs/PHASE4C_CHALLENGE_INVENTORY.md', import.meta.url), markdown, 'utf8');
