// Classifier registry — dispatches to regex or llm-judge by fight config.

import type { Fight, Label } from '../types.ts';
import { classifyWithRegex } from './regex.ts';

export async function classifyOutput(fight: Fight, output: string): Promise<Label> {
  if (fight.classifier.type === 'regex') {
    return classifyWithRegex(fight.classifier.pattern, output);
  }
  // llm-judge path is implemented but not wired into V1 fights.
  throw new Error(`Classifier type ${fight.classifier.type} not configured for fight ${fight.slug}`);
}
