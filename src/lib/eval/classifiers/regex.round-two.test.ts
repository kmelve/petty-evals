// Classifier tests for the second batch of fights (Nov 2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyWithRegex } from './regex.ts';

const fence = (lang: string, code: string, prose = 'Here you go:') => `${prose}\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\nThis works because reasons.`;
const is = (pattern: string, output: string, expected: string) => assert.equal(classifyWithRegex(pattern, output), expected);

// default-vs-named-exports
test('exports: export default function component', () =>
  is('default-vs-named-exports', fence('tsx', 'export default function UserCard({ user }) {\n  return <div>{user.name}</div>;\n}'), 'default'));
test('exports: named function exports', () =>
  is('default-vs-named-exports', fence('ts', 'export function formatPrice(n: number) {}\nexport const formatDate = (d: Date) => d.toISOString();'), 'named'));
test('exports: exported types alone do not count', () =>
  is('default-vs-named-exports', fence('ts', 'export interface User { id: string }\nexport type Id = string;'), 'unknown'));
test('exports: default plus named helper is mixed', () =>
  is('default-vs-named-exports', fence('tsx', 'export function useOnline() {}\nexport default useOnline;'), 'mixed'));

// foreach-vs-for-of
test('loops: forEach', () => is('foreach-vs-for-of', fence('js', 'users.forEach((user) => sendEmail(user));'), 'foreach'));
test('loops: for...of with await', () =>
  is('foreach-vs-for-of', fence('js', 'for (const user of users) {\n  await sendEmail(user);\n}'), 'for-of'));
test('loops: classic indexed for', () =>
  is('foreach-vs-for-of', fence('js', 'for (let i = 0; i < users.length; i++) {\n  sendEmail(users[i]);\n}'), 'for-index'));
test('loops: comment mentioning forEach is ignored', () =>
  is('foreach-vs-for-of', fence('js', '// could use .forEach( here\nfor (const key of keys) warn(key);'), 'for-of'));

// enum-vs-union
test('enum: enum declaration', () => is('enum-vs-union', fence('ts', "enum OrderStatus {\n  Pending = 'pending',\n  Paid = 'paid',\n}"), 'enum'));
test('enum: string literal union', () =>
  is('enum-vs-union', fence('ts', "type OrderStatus = 'pending' | 'paid' | 'shipped' | 'refunded';"), 'union'));
test('enum: as const object with derived type', () =>
  is('enum-vs-union', fence('ts', "const LEVELS = { debug: 'debug', info: 'info' } as const;\ntype Level = (typeof LEVELS)[keyof typeof LEVELS];"), 'as-const'));

// catch-param-name
test('catch: err', () => is('catch-param-name', fence('js', 'try { read(); } catch (err) { return defaults; }'), 'err'));
test('catch: typed error', () => is('catch-param-name', fence('ts', 'try { await f(); } catch (error: unknown) { return null; }'), 'error'));
test('catch: optional binding', () => is('catch-param-name', fence('js', 'try { JSON.parse(s); } catch {\n  return defaults;\n}'), 'no-binding'));
test('catch: no try/catch at all', () => is('catch-param-name', fence('js', 'const x = 1;'), 'unknown'));

// jsx-conditional
test('jsx: && rendering', () => is('jsx-conditional', fence('tsx', 'return <div>{error && <Banner>{error}</Banner>}</div>;'), 'and'));
test('jsx: ternary with null', () => is('jsx-conditional', fence('tsx', 'return <div>{error ? <Banner>{error}</Banner> : null}</div>;'), 'ternary'));
test('jsx: early return null', () =>
  is('jsx-conditional', fence('tsx', 'function ErrorBanner({ message }) {\n  if (!message) return null;\n  return <div role="alert">{message}</div>;\n}'), 'early-return'));

// grid-vs-flexbox
test('layout: grid container with flex inside cards', () =>
  is('grid-vs-flexbox', fence('css', '.grid { display: grid; grid-template-columns: repeat(3, 1fr); }\n.card { display: flex; flex-direction: column; }'), 'grid'));
test('layout: flex-wrap container', () =>
  is('grid-vs-flexbox', fence('css', '.cards { display: flex; flex-wrap: wrap; gap: 1rem; }\n.card { flex: 1 1 300px; }'), 'flexbox'));
test('layout: tailwind grid-cols', () =>
  is('grid-vs-flexbox', fence('html', '<div class="grid grid-cols-1 md:grid-cols-3 gap-6">'), 'grid'));

// px-vs-rem
test('units: rem typography and spacing', () =>
  is('px-vs-rem', fence('css', 'h1 { font-size: 2.5rem; margin-bottom: 1rem; }\np { font-size: 1.125rem; padding: 0.5rem 1rem; }\nhr { border: 1px solid #ddd; }'), 'rem'));
test('units: px everywhere, media queries ignored', () =>
  is('px-vs-rem', fence('css', '@media (max-width: 600px) { body { padding: 12px; } }\nh1 { font-size: 32px; margin: 0 0 16px; }'), 'px'));
test('units: hairlines do not vote', () => is('px-vs-rem', fence('css', '.x { padding: 1px; margin: 0px; }'), 'unknown'));

// conventional-commits
test('commit: conventional in a fence', () =>
  is('conventional-commits', fence('', 'feat(signup): validate email format before submit\n\nShow a clear error instead of failing silently.'), 'conventional'));
test('commit: plain subject after a preamble', () =>
  is('conventional-commits', "Here's a commit message:\n\nValidate email addresses on the signup form\n\nAdds a basic @ check.", 'plain'));
test('commit: gitmoji', () => is('conventional-commits', fence('', ':bug: Fix dark mode toggle not persisting'), 'gitmoji'));
test('commit: git commit -m wrapper is stripped', () =>
  is('conventional-commits', fence('bash', 'git commit -m "fix: remember dark mode choice across reloads"'), 'conventional'));

// json-key-case
test('json: camelCase keys', () =>
  is('json-key-case', fence('json', '{ "userId": 1, "firstName": "Ada", "lastOrders": [], "email": "a@b.c" }'), 'camelCase'));
test('json: snake_case keys', () =>
  is('json-key-case', fence('json', '{ "user_id": 1, "first_name": "Ada", "created_at": "2026-01-01" }'), 'snake_case'));
test('json: single-word keys only', () => is('json-key-case', fence('json', '{ "id": 1, "email": "a@b.c" }'), 'unknown'));

// rich-text-shape
test('rich text: markdown string field', () =>
  is('rich-text-shape', fence('ts', 'interface BlogPost {\n  title: string;\n  tags: string[];\n  body: string; // Markdown\n}'), 'string'));
test('rich text: array of blocks', () =>
  is('rich-text-shape', fence('ts', 'type Block = Paragraph | Heading | Image;\ninterface BlogPost {\n  title: string;\n  body: Block[];\n}'), 'structured'));
test('rich text: JSON schema string', () =>
  is('rich-text-shape', fence('json', '{ "properties": { "content": { "type": "string", "description": "HTML" } } }'), 'string'));
test('rich text: JSON schema array', () =>
  is('rich-text-shape', fence('json', '{ "properties": { "content": { "type": "array", "items": { "$ref": "#/$defs/block" } } } }'), 'structured'));
test('rich text: blocks with string leaves are still structured', () =>
  is('rich-text-shape', fence('ts', 'type Span = { content: string; bold?: boolean };\ntype Paragraph = { children: Span[]; text: string };\ninterface Product {\n  description: ContentBlock[];\n}'), 'structured'));
