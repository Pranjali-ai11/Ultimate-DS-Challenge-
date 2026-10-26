import type { TopicRegistryEntry } from '../types/learning';

export function findTopicEntry(value: unknown, registry?: TopicRegistryEntry[]): TopicRegistryEntry | undefined;
export function resolveTopicVisualizer<T extends { id: string }>(value: unknown, registry: TopicRegistryEntry[], choices: T[]): T | undefined;
