// Regex-based classifiers. Registry keyed by classifier pattern name.
//
// Each classifier inspects a model's raw output and returns a label string,
// or 'unknown' if no signal is present.

import type { Label } from '../types.ts';

export type RegexClassifier = (output: string) => Label;

/**
 * tabs-vs-spaces-python:
 * Strip code fences if present. Find the first line whose leading character
 * is whitespace (tab or space). If it starts with one or more tabs → 'tabs'.
 * If it starts with 2+ spaces → 'spaces'. Otherwise 'unknown'.
 *
 * We deliberately ignore the LANGUAGE of the fence — models sometimes label
 * Python as `python`, sometimes leave it bare. The first indented line is the
 * signal, full stop.
 */
const tabsVsSpacesPython: RegexClassifier = (output) => {
  // Pull out the largest fenced block if any; otherwise use the whole text.
  const fenceMatch = output.match(/```[\w-]*\n([\s\S]*?)```/);
  const code = fenceMatch ? fenceMatch[1] : output;
  const lines = code.split('\n');
  for (const line of lines) {
    if (line.length === 0) continue;
    const first = line[0];
    if (first === '\t') return 'tabs';
    if (first === ' ') {
      // require at least two spaces of indent to count — single space is almost
      // never indentation, it's wrapped prose or a stray leading space.
      if (line.startsWith('  ')) return 'spaces';
    }
  }
  return 'unknown';
};

export const regexClassifiers: Record<string, RegexClassifier> = {
  'tabs-vs-spaces-python': tabsVsSpacesPython,
};

export function classifyWithRegex(pattern: string, output: string): Label {
  const fn = regexClassifiers[pattern];
  if (!fn) throw new Error(`Unknown regex classifier: ${pattern}`);
  return fn(output);
}
