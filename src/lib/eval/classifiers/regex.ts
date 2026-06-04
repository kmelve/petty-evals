// Regex-based classifiers. Registry keyed by classifier pattern name.
//
// Each classifier inspects a model's raw output and returns a label string,
// or 'unknown' if no signal is present.
//
// Be conservative: false positives are worse than abstentions.

import type { Label } from '../types.ts';

export type RegexClassifier = (output: string) => Label;

// --- helpers ----------------------------------------------------------------

/** Extract the first fenced code block (any language tag), or the whole text. */
function extractCode(output: string): string {
  const m = output.match(/\`\`\`[\w-]*\n([\s\S]*?)\`\`\`/);
  return m ? m[1] : output;
}

/** Extract all fenced code blocks concatenated, or the whole text if none. */
function extractAllCode(output: string): string {
  const re = /\`\`\`[\w-]*\n([\s\S]*?)\`\`\`/g;
  const parts: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(output)) !== null) parts.push(m[1]);
  return parts.length > 0 ? parts.join('\n') : output;
}

/** Extract the fenced block's language tag if present (lowercased). */
function fenceLang(output: string): string | null {
  const m = output.match(/\`\`\`([\w-]+)\n/);
  return m ? m[1].toLowerCase() : null;
}

/** Strip line + block comments and string literals from JS-ish code. Cheap, not perfect. */
function stripJsNoise(code: string): string {
  let s = code;
  // block comments
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  // line comments
  s = s.replace(/\/\/[^\n]*/g, '');
  // template literals (keep nothing inside)
  s = s.replace(/\`(?:[^\`\\]|\\.)*\`/g, '\`\`');
  // double-quoted strings
  s = s.replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
  // single-quoted strings
  s = s.replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
  return s;
}

/** Strip Python comments and string literals (best-effort). */
function stripPyNoise(code: string): string {
  let s = code;
  // triple-quoted strings
  s = s.replace(/"""[\s\S]*?"""/g, '""');
  s = s.replace(/'''[\s\S]*?'''/g, "''");
  // line comments
  s = s.replace(/#[^\n]*/g, '');
  // single-line strings
  s = s.replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
  s = s.replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
  return s;
}

/** First indented line's indent style. */
function firstIndentLabel(code: string): 'tabs' | 'two-space' | 'four-space' | 'spaces' | null {
  const lines = code.split('\n');
  for (const line of lines) {
    if (line.length === 0) continue;
    if (line[0] === '\t') return 'tabs';
    if (line[0] === ' ') {
      // count spaces
      let n = 0;
      while (n < line.length && line[n] === ' ') n++;
      if (n >= 4) return 'four-space';
      if (n >= 2) return 'two-space';
    }
  }
  return null;
}

// --- 0. exemplar ------------------------------------------------------------

const tabsVsSpacesPython: RegexClassifier = (output) => {
  const code = extractCode(output);
  const lines = code.split('\n');
  for (const line of lines) {
    if (line.length === 0) continue;
    const first = line[0];
    if (first === '\t') return 'tabs';
    if (first === ' ') {
      if (line.startsWith('  ')) return 'spaces';
    }
  }
  return 'unknown';
};

// --- 1. tabs-vs-spaces-go ---------------------------------------------------

const tabsVsSpacesGo: RegexClassifier = (output) => {
  const code = extractCode(output);
  const lines = code.split('\n');
  for (const line of lines) {
    if (line.length === 0) continue;
    if (line[0] === '\t') return 'tabs';
    if (line[0] === ' ' && line.startsWith('  ')) return 'spaces';
  }
  return 'unknown';
};

// --- 2. tabs-vs-spaces-js ---------------------------------------------------

const tabsVsSpacesJs: RegexClassifier = (output) => {
  const code = extractCode(output);
  const lines = code.split('\n');
  for (const line of lines) {
    if (line.length === 0) continue;
    if (line[0] === '\t') return 'tabs';
    if (line[0] === ' ' && line.startsWith('  ')) return 'spaces';
  }
  return 'unknown';
};

// --- 3. triple-equals-js ----------------------------------------------------

const tripleEqualsJs: RegexClassifier = (output) => {
  const code = stripJsNoise(extractCode(output));
  // Strip operators we don't want to confuse with == or ===.
  // Replace !==, !=, <=, >=, =>, == in arrow/compound contexts.
  let s = code;
  s = s.replace(/!==/g, '   ');
  s = s.replace(/!=/g, '  ');
  s = s.replace(/<=/g, '  ');
  s = s.replace(/>=/g, '  ');
  s = s.replace(/=>/g, '  ');
  // Count === first, then strip, then count ==.
  const tripleCount = (s.match(/===/g) || []).length;
  s = s.replace(/===/g, '   ');
  const doubleCount = (s.match(/==/g) || []).length;
  if (tripleCount === 0 && doubleCount === 0) return 'unknown';
  if (doubleCount === 0) return 'triple-equals';
  if (tripleCount === 0) return 'double-equals';
  return tripleCount >= doubleCount ? 'triple-equals' : 'double-equals';
};

// --- 4. let-vs-const-default ------------------------------------------------

const letVsConstDefault: RegexClassifier = (output) => {
  const code = stripJsNoise(extractCode(output));
  // Strip 'for (' headers to avoid counting loop decls.
  const sansForHeaders = code.replace(/for\s*\([^)]*\)/g, '');
  const letCount = (sansForHeaders.match(/\blet\s+[A-Za-z_$]/g) || []).length;
  const constCount = (sansForHeaders.match(/\bconst\s+[A-Za-z_$]/g) || []).length;
  if (letCount === 0 && constCount === 0) return 'unknown';
  if (letCount > 0 && constCount > 0) return 'mixed';
  return letCount > 0 ? 'let' : 'const';
};

// --- 5. quotes-js -----------------------------------------------------------

const quotesJs: RegexClassifier = (output) => {
  const code = extractCode(output);
  // Strip block + line comments only (we need to KEEP strings to count them).
  let s = code;
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/\/\/[^\n]*/g, '');
  // Strip template literals — they shouldn't count.
  s = s.replace(/\`(?:[^\`\\]|\\.)*\`/g, '');
  const single = (s.match(/'(?:[^'\\\n]|\\.)*'/g) || []).length;
  const double = (s.match(/"(?:[^"\\\n]|\\.)*"/g) || []).length;
  if (single === 0 && double === 0) return 'unknown';
  if (single > double) return 'single';
  if (double > single) return 'double';
  return 'unknown';
};

// --- 6. quotes-python -------------------------------------------------------

const quotesPython: RegexClassifier = (output) => {
  const code = extractCode(output);
  let s = code;
  // Drop triple-quoted strings; they're not the unit being decided.
  s = s.replace(/"""[\s\S]*?"""/g, '');
  s = s.replace(/'''[\s\S]*?'''/g, '');
  // Strip comments.
  s = s.replace(/#[^\n]*/g, '');
  // f-strings count as double if they use double quotes, single otherwise.
  const single = (s.match(/(?:[brfBRF]{0,2})'(?:[^'\\\n]|\\.)*'/g) || []).length;
  const double = (s.match(/(?:[brfBRF]{0,2})"(?:[^"\\\n]|\\.)*"/g) || []).length;
  if (single === 0 && double === 0) return 'unknown';
  if (single > double) return 'single';
  if (double > single) return 'double';
  return 'unknown';
};

// --- 7. semicolons-js -------------------------------------------------------

const semicolonsJs: RegexClassifier = (output) => {
  const code = stripJsNoise(extractCode(output));
  const lines = code.split('\n');
  let candidateLines = 0;
  let withSemi = 0;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.length === 0) continue;
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    // Skip lines that obviously aren't statements.
    const last = trimmed[trimmed.length - 1];
    if (last === '{' || last === '}' || last === '(' || last === ',' || last === ':' || last === '[' || last === ']') continue;
    // Skip lines that look like block headers
    if (/^(if|else|for|while|switch|case|default|try|catch|finally|do)\b/.test(trimmed)) continue;
    // Skip lines that are only an arrow header.
    if (/=>\s*$/.test(trimmed)) continue;
    candidateLines++;
    if (last === ';') withSemi++;
  }
  if (candidateLines < 3) return 'unknown';
  const ratio = withSemi / candidateLines;
  if (ratio > 0.7) return 'semicolons';
  if (ratio < 0.3) return 'no-semicolons';
  return 'mixed';
};

// --- 8. indent-width-js -----------------------------------------------------

const indentWidthJs: RegexClassifier = (output) => {
  const code = extractCode(output);
  const label = firstIndentLabel(code);
  if (label === 'tabs') return 'tabs';
  if (label === 'two-space') return 'two-space';
  if (label === 'four-space') return 'four-space';
  return 'unknown';
};

// --- 9. trailing-commas-js --------------------------------------------------

const trailingCommasJs: RegexClassifier = (output) => {
  const code = extractCode(output);
  // Look at every multi-line array or object literal in a rough sense:
  // any line that is *only* a closing ] or }. Check the previous non-empty
  // line for whether it ends in a comma.
  const lines = code.split('\n');
  let trailing = 0;
  let nontrailing = 0;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    // The closing line — first char must be ] or } (possibly followed by , ; ) etc).
    if (!/^[}\]]/.test(t)) continue;
    // Walk back to the previous non-empty line.
    let j = i - 1;
    while (j >= 0 && lines[j].trim().length === 0) j--;
    if (j < 0) continue;
    const prev = lines[j].trim();
    // Skip if previous line is itself a brace/bracket (empty literal).
    if (/^[{[]/.test(prev) || prev === '' || prev === '{' || prev === '[') continue;
    // Strip trailing line comments.
    const cleaned = prev.replace(/\/\/.*$/, '').trim();
    if (cleaned.length === 0) continue;
    if (cleaned.endsWith(',')) trailing++;
    else nontrailing++;
  }
  if (trailing === 0 && nontrailing === 0) return 'unknown';
  if (trailing > nontrailing) return 'trailing';
  if (nontrailing > trailing) return 'no-trailing';
  return 'unknown';
};

// --- 10. interface-vs-type-ts -----------------------------------------------

const interfaceVsTypeTs: RegexClassifier = (output) => {
  const code = stripJsNoise(extractCode(output));
  const interfaceCount = (code.match(/\binterface\s+[A-Z][A-Za-z0-9_]*/g) || []).length;
  const typeCount = (code.match(/\btype\s+[A-Z][A-Za-z0-9_]*\s*=/g) || []).length;
  if (interfaceCount === 0 && typeCount === 0) return 'unknown';
  if (interfaceCount > 0 && typeCount > 0) return 'mixed';
  return interfaceCount > 0 ? 'interface' : 'type';
};

// --- 11. arrow-vs-function --------------------------------------------------

const arrowVsFunction: RegexClassifier = (output) => {
  const code = stripJsNoise(extractCode(output));
  // function declarations: 'function foo(' (not anonymous expressions inside callbacks).
  const functionCount = (code.match(/\bfunction\s+[A-Za-z_$][A-Za-z0-9_$]*\s*\(/g) || []).length;
  // arrow named: 'const foo = (...) =>' or 'const foo = arg =>'
  const arrowCount =
    (code.match(/\b(?:const|let|var)\s+[A-Za-z_$][A-Za-z0-9_$]*\s*(?::[^=]+)?=\s*(?:async\s+)?\([^)]*\)\s*=>/g) || []).length +
    (code.match(/\b(?:const|let|var)\s+[A-Za-z_$][A-Za-z0-9_$]*\s*=\s*(?:async\s+)?[A-Za-z_$][A-Za-z0-9_$]*\s*=>/g) || []).length;
  if (functionCount === 0 && arrowCount === 0) return 'unknown';
  if (functionCount > 0 && arrowCount > 0) return 'mixed';
  return arrowCount > 0 ? 'arrow' : 'function';
};

// --- 12. async-await-vs-then ------------------------------------------------

const asyncAwaitVsThen: RegexClassifier = (output) => {
  const code = stripJsNoise(extractCode(output));
  const awaitCount = (code.match(/\bawait\s+/g) || []).length;
  const thenCount = (code.match(/\.then\s*\(/g) || []).length;
  if (awaitCount === 0 && thenCount === 0) return 'unknown';
  if (awaitCount > 0 && thenCount > 0) return 'mixed';
  return awaitCount > 0 ? 'async-await' : 'then-chain';
};

// --- 13. increment-style ----------------------------------------------------

const incrementStyle: RegexClassifier = (output) => {
  const code = stripJsNoise(extractCode(output));
  // Look for the conventional loop var i, j, k or n incrementing.
  const postfix = /\b([ijkn])\+\+/.test(code);
  const prefix = /\+\+([ijkn])\b/.test(code);
  const assign = /\b([ijkn])\s*\+=\s*1\b/.test(code);
  if (!postfix && !prefix && !assign) return 'unknown';
  // postfix > prefix > assign tiebreak
  if (postfix) return 'postfix';
  if (prefix) return 'prefix';
  return 'assign';
};

// --- 14. early-return-vs-nested ---------------------------------------------

const earlyReturnVsNested: RegexClassifier = (output) => {
  const code = stripJsNoise(extractCode(output));
  // Count one-line guard returns: 'if (...) return ...;' on the same line.
  const guardReturns = (code.match(/\bif\s*\([^)]*\)\s*(?:\{\s*)?return\b/g) || []).length;
  const allReturns = (code.match(/\breturn\b/g) || []).length;
  if (allReturns === 0) return 'unknown';
  if (guardReturns >= 2) return 'early-return';
  // Look for nested if/else with a single trailing return.
  const elseCount = (code.match(/\belse\b/g) || []).length;
  if (elseCount >= 1 && guardReturns <= 1 && allReturns >= 1) return 'nested-if';
  if (guardReturns >= 1) return 'early-return';
  return 'unknown';
};

// --- 15. python-string-format -----------------------------------------------

const pythonStringFormat: RegexClassifier = (output) => {
  const code = extractCode(output);
  const fstring = /\bf"|\bf'|\bf"""|\bf'''/.test(code);
  const formatMethod = /\.format\s*\(/.test(code);
  // % formatting: look for "...%s..." % or "...%d..." % style ops.
  const percent = /["'][^"'\n]*%[sdrfx][^"'\n]*["']\s*%/.test(code);
  const candidates: Array<['fstring' | 'format-method' | 'percent', boolean]> = [
    ['fstring', fstring],
    ['format-method', formatMethod],
    ['percent', percent],
  ];
  const hits = candidates.filter(([, v]) => v);
  if (hits.length === 0) return 'unknown';
  // First-match priority: fstring > format-method > percent.
  return hits[0][0];
};

// --- 16. list-comp-vs-for ---------------------------------------------------

const listCompVsFor: RegexClassifier = (output) => {
  const code = extractCode(output);
  const comp = /\[[^\[\]\n]*\bfor\b[^\[\]\n]*\bin\b[^\[\]\n]*\]/.test(code);
  // For-loop with mutation: 'for x in y:' followed (within a few lines) by .append(
  const forLoop = /\bfor\b[^\n:]+:\s*\n[\s\S]{0,200}\.append\s*\(/.test(code);
  if (!comp && !forLoop) return 'unknown';
  if (comp && forLoop) return 'mixed';
  return comp ? 'comprehension' : 'for-loop';
};

// --- 17. python-naming ------------------------------------------------------

const pythonNaming: RegexClassifier = (output) => {
  const code = stripPyNoise(extractCode(output));
  // Collect candidate names: assignments and def parameter names.
  const names = new Set<string>();
  for (const m of code.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g)) names.add(m[1]);
  for (const m of code.matchAll(/\bdef\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(([^)]*)\)/g)) {
    const params = m[1].split(',');
    for (const p of params) {
      const name = p.trim().split('=')[0].split(':')[0].replace(/^\*+/, '').trim();
      if (name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) && name !== 'self' && name !== 'cls') {
        names.add(name);
      }
    }
  }
  const camelRe = /^[a-z]+(?:[A-Z][a-z0-9]+)+$/;
  const snakeRe = /^[a-z]+(?:_[a-z0-9]+)+$/;
  let camel = 0;
  let snake = 0;
  let total = 0;
  for (const n of names) {
    if (n.length < 2) continue;
    if (camelRe.test(n)) {
      camel++;
      total++;
    } else if (snakeRe.test(n)) {
      snake++;
      total++;
    }
  }
  if (total === 0) return 'unknown';
  const camelRatio = camel / total;
  const snakeRatio = snake / total;
  if (camelRatio > 0.25 && snakeRatio > 0.25) return 'mixed';
  if (camel > snake) return 'camelCase';
  if (snake > camel) return 'snake_case';
  return 'unknown';
};

// --- 18. react-styling ------------------------------------------------------

const reactStyling: RegexClassifier = (output) => {
  const code = extractAllCode(output);
  const tailwind = /className\s*=\s*["`'][^"`']*\b(?:bg-|text-|p-|m-|flex|grid|rounded|hover:|shadow-|w-|h-)/.test(code);
  const cssInJs = /\bstyled\.[a-zA-Z]+|\bcss\`|\bmakeStyles\s*\(|@emotion|\bstyled\s*\(/.test(code);
  const cssFile = /import\s+[^;\n]*['"][^'"]+\.css['"]/.test(code);
  // Inline style: more than one style={{ ... }} occurrence
  const inlineCount = (code.match(/style\s*=\s*\{\{/g) || []).length;
  const inlineStyle = inlineCount >= 2;
  // Priority: tailwind > css-in-js > css-file > inline-style
  if (tailwind) return 'tailwind';
  if (cssInJs) return 'css-in-js';
  if (cssFile) return 'css-file';
  if (inlineStyle) return 'inline-style';
  return 'unknown';
};

// --- 19. package-manager ----------------------------------------------------

const packageManager: RegexClassifier = (output) => {
  const text = output;
  const pnpm = /\bpnpm\s+(?:add|install|create|dlx|i\b)|\bpnpm dlx\b/.test(text);
  const yarn = /\byarn\s+(?:add|install|create|dlx)\b|\byarn dlx\b/.test(text);
  const bun = /\bbun\s+(?:add|install|create|x)\b|\bbunx\b/.test(text);
  const npm = /\bnpm\s+(?:install|i|add|create|run)\b|\bnpx\b/.test(text);
  // Prefer the more specific manager when multiple present.
  if (pnpm) return 'pnpm';
  if (yarn) return 'yarn';
  if (bun) return 'bun';
  if (npm) return 'npm';
  return 'unknown';
};

// --- 20. test-file-location -------------------------------------------------

const testFileLocation: RegexClassifier = (output) => {
  const text = output;
  const testsFolder = /__tests__\//.test(text) || /\btests\/[A-Za-z0-9_\-./]+\.(?:test|spec)\./.test(text);
  const colocated =
    /[A-Za-z0-9_\-]+\.(?:test|spec)\.(?:ts|tsx|js|jsx|mjs|cjs)\b/.test(text) && !testsFolder;
  if (testsFolder) return 'tests-folder';
  if (colocated) return 'colocated';
  return 'unknown';
};

// --- 21. except-granularity -------------------------------------------------

const exceptGranularity: RegexClassifier = (output) => {
  const code = extractCode(output);
  // Broad: 'except:' or 'except Exception' or 'except BaseException'
  const broadMatches = (code.match(/\bexcept\s*(?::|Exception|BaseException)/g) || []).length;
  // Narrow: 'except SomeNamedError:' that is NOT Exception/BaseException.
  const allExcept = (code.match(/\bexcept\b[^\n:]*:/g) || []);
  let narrow = 0;
  for (const m of allExcept) {
    const tail = m.replace(/^except\s*/, '').replace(/:$/, '').trim();
    if (!tail) continue; // bare except
    if (/^Exception\b|^BaseException\b/.test(tail)) continue;
    narrow++;
  }
  if (broadMatches === 0 && narrow === 0) return 'unknown';
  if (broadMatches > narrow) return 'broad';
  if (narrow > broadMatches) return 'narrow';
  return 'unknown';
};

// --- 22. jsdoc-vs-types -----------------------------------------------------

const jsdocVsTypes: RegexClassifier = (output) => {
  const lang = fenceLang(output);
  const code = extractCode(output);
  const jsdocSignals =
    (code.match(/\/\*\*[\s\S]*?\*\//g) || []).filter((b) => /@param|@returns|@type/.test(b)).length;
  const tsSignals =
    (code.match(/\binterface\s+[A-Z]/g) || []).length +
    (code.match(/:\s*(?:string|number|boolean|void|any|unknown|never)\b/g) || []).length +
    (code.match(/\btype\s+[A-Z][A-Za-z0-9_]*\s*=/g) || []).length;
  const langIsTs = lang === 'ts' || lang === 'typescript' || lang === 'tsx';
  const langIsJs = lang === 'js' || lang === 'javascript' || lang === 'jsx';
  if (jsdocSignals === 0 && tsSignals === 0) return 'unknown';
  if (jsdocSignals >= 2 && tsSignals >= 2) return 'both';
  if (langIsTs && tsSignals > 0) return 'typescript';
  if (langIsJs && jsdocSignals > 0) return 'jsdoc';
  if (tsSignals > jsdocSignals) return 'typescript';
  if (jsdocSignals > tsSignals) return 'jsdoc';
  return 'unknown';
};

// --- 23. readme-emoji -------------------------------------------------------

const readmeEmoji: RegexClassifier = (output) => {
  // Strip code fences — emoji inside example blocks don't count.
  const text = output.replace(/\`\`\`[\s\S]*?\`\`\`/g, '');
  const lines = text.split('\n');
  const headings = lines.filter((l) => /^#{1,6}\s+/.test(l));
  if (headings.length === 0) return 'unknown';
  for (const h of headings) {
    // Check for any codepoint that is likely an emoji:
    // - surrogate pair (BMP > 0xFFFF)
    // - common emoji ranges (Misc Symbols, Dingbats, Misc Symbols & Pictographs, etc.)
    for (const ch of h) {
      const cp = ch.codePointAt(0);
      if (cp === undefined) continue;
      if (cp > 0xffff) return 'with-emoji'; // SMP — almost always emoji in headings
      if (cp >= 0x2600 && cp <= 0x27bf) return 'with-emoji'; // misc symbols + dingbats
      if (cp >= 0x2300 && cp <= 0x23ff) {
        // Misc technical — only count a handful that show up in headings (⏱ ⏰ etc.)
        if (cp >= 0x23e9 && cp <= 0x23fa) return 'with-emoji';
      }
    }
  }
  return 'no-emoji';
};

// --- registry ---------------------------------------------------------------

export const regexClassifiers: Record<string, RegexClassifier> = {
  'tabs-vs-spaces-python': tabsVsSpacesPython,
  'tabs-vs-spaces-go': tabsVsSpacesGo,
  'tabs-vs-spaces-js': tabsVsSpacesJs,
  'triple-equals-js': tripleEqualsJs,
  'let-vs-const-default': letVsConstDefault,
  'quotes-js': quotesJs,
  'quotes-python': quotesPython,
  'semicolons-js': semicolonsJs,
  'indent-width-js': indentWidthJs,
  'trailing-commas-js': trailingCommasJs,
  'interface-vs-type-ts': interfaceVsTypeTs,
  'arrow-vs-function': arrowVsFunction,
  'async-await-vs-then': asyncAwaitVsThen,
  'increment-style': incrementStyle,
  'early-return-vs-nested': earlyReturnVsNested,
  'python-string-format': pythonStringFormat,
  'list-comp-vs-for': listCompVsFor,
  'python-naming': pythonNaming,
  'react-styling': reactStyling,
  'package-manager': packageManager,
  'test-file-location': testFileLocation,
  'except-granularity': exceptGranularity,
  'jsdoc-vs-types': jsdocVsTypes,
  'readme-emoji': readmeEmoji,
};

export function classifyWithRegex(pattern: string, output: string): Label {
  const fn = regexClassifiers[pattern];
  if (!fn) throw new Error(`Unknown regex classifier: ${pattern}`);
  return fn(output);
}
