import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FODS_REQUIRED_CHALLENGES } from '../data/fodsQuestionBank.js';
import { FODS_COURSE_UNITS, STRUCTURE_LEARNING_GUIDES } from '../data/fodsLearningContent.js';
import { DATA_STRUCTURES_CATALOG } from '../data/seedData.js';
import { getCourseLessonId, TOPIC_REGISTRY, validateTopicRegistry } from '../data/topicRegistry.js';

const registryErrors = validateTopicRegistry();
if (registryErrors.length) throw new Error(`Topic registry validation failed: ${registryErrors.join('; ')}`);

const lessonTitle = new Map(FODS_COURSE_UNITS.flatMap(unit => unit.topics.map(topic => [getCourseLessonId(unit.id, topic.title), `${unit.title}: ${topic.title}`] as const)));
const structureName = new Map<string, string>(DATA_STRUCTURES_CATALOG.map(structure => [`reference:${structure.id}`, `${structure.name} reference guide`]));
const lines = [
  '# Phase 1 Topic and Syllabus Coverage',
  '',
  `Generated from the authoritative question bank and topic registry. The active catalog contains **${FODS_REQUIRED_CHALLENGES.length} challenges** (${[1, 2, 3, 4].map(level => FODS_REQUIRED_CHALLENGES.filter(item => item.level === level).length).join(' / ')} in Levels 1–4).`,
  '',
  'Challenge tags are curated `coverageTopics`; they are not inferred from incidental prompt words, distractors, or explanations. Each topic is counted once per challenge. No questions or denominator counts are fabricated by this report.',
  '',
  '| Topic | Questions | L1 | L2 | L3 | L4 | Syllabus units | Lessons / reference material | Visualizers | Mapping notes |',
  '|---|---:|---:|---:|---:|---:|---|---|---|---|'
];

for (const topic of TOPIC_REGISTRY) {
  const questions = FODS_REQUIRED_CHALLENGES.filter(question => question.coverageTopics.includes(topic.id));
  const byLevel = [1, 2, 3, 4].map(level => questions.filter(question => question.level === level).length);
  const lessonNames = topic.relatedLessonIds.map(id => lessonTitle.get(id) || structureName.get(id) || id);
  const unitless = questions.filter(question => question.syllabusUnit === undefined).length;
  const notes = questions.length === 0 ? 'No mapped questions.' : unitless ? `${unitless} supplementary question(s) have no syllabus unit in source data.` : 'No missing unit metadata in mapped questions.';
  const cells = [topic.name, questions.length, ...byLevel, topic.syllabusUnits.join(', ') || '—', lessonNames.join('<br>') || '—', topic.visualizerIds.join(', ') || '—', notes];
  lines.push(`| ${cells.map(value => String(value).replaceAll('|', '\\|')).join(' | ')} |`);
}

lines.push(
  '',
  '## Mapping validation',
  '',
  '- Topic IDs are unique and every canonical challenge coverage tag resolves to one registry entry.',
  '- Question links are checked against the challenge’s explicit curated topic tags.',
  '- Lesson links are checked against actual course lesson IDs or existing structure reference IDs.',
  '- Visualizer links are checked against current Learn Hub visualizer choice IDs.',
  '- Unknown topic URLs are rejected by the challenge API and safely ignored by learning/visualization deep links.',
  '',
  'Regenerate with `npm run report:topics` from `server/` after changing the registry, syllabus lessons, or question coverage metadata.',
  ''
);

await writeFile(resolve(process.cwd(), 'docs/PHASE1_TOPIC_COVERAGE.md'), lines.join('\n'), 'utf8');
console.log(`Wrote docs/PHASE1_TOPIC_COVERAGE.md for ${TOPIC_REGISTRY.length} topics and ${FODS_REQUIRED_CHALLENGES.length} challenges.`);
