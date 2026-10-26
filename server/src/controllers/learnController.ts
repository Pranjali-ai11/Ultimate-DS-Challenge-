import { Request, Response } from 'express';
import { DATA_STRUCTURES_CATALOG } from '../data/seedData.js';
import { FODS_COURSE_TOPICS, FODS_COURSE_UNITS, STRUCTURE_LEARNING_GUIDES } from '../data/fodsLearningContent.js';
import { getCourseLessonId, TOPIC_REGISTRY } from '../data/topicRegistry.js';

export async function getLearnCatalog(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    total: DATA_STRUCTURES_CATALOG.length,
    structures: DATA_STRUCTURES_CATALOG.map(structure => ({
      ...structure,
      learningGuide: STRUCTURE_LEARNING_GUIDES[structure.id]
    })),
    courseTopics: FODS_COURSE_TOPICS.map(topic => {
      const unit = FODS_COURSE_UNITS.find(candidate => candidate.topics.some(item => item.title === topic.title));
      return { ...topic, id: unit ? getCourseLessonId(unit.id, topic.title) : undefined, unitId: unit?.id };
    }),
    topicRegistry: TOPIC_REGISTRY,
    // Keep the prior grouped field for any existing API consumers; the Hub uses the flat topic catalog.
    courseUnits: FODS_COURSE_UNITS
  });
}

export async function getStructureDetail(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const item = DATA_STRUCTURES_CATALOG.find(ds => ds.id.toLowerCase() === id?.toLowerCase());

  if (!item) {
    res.status(404).json({ success: false, message: 'Data structure not found in catalog.' });
    return;
  }

  res.json({
    success: true,
    structure: {
      ...item,
      learningGuide: STRUCTURE_LEARNING_GUIDES[item.id]
    }
  });
}
