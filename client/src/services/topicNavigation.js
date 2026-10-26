export function findTopicEntry(value, registry = []) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
  return registry.find(topic => topic.id.toLowerCase() === normalized || topic.name.toLowerCase() === normalized || topic.aliases.some(alias => alias.toLowerCase().replace(/\s+/g, ' ') === normalized));
}

export function resolveTopicVisualizer(value, registry = [], choices = []) {
  const topic = findTopicEntry(value, registry);
  if (!topic) return undefined;
  return choices.find(choice => topic.visualizerIds.some(id => id.toLowerCase() === choice.id.toLowerCase()));
}
