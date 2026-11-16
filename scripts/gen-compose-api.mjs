// The Compose kit's public composables, read from its Kotlin source for the docs site's API tables
// under Compose: compose-api.json maps each function name to its overloads ({ doc, params }).
// Run by `npm run api` after gen-api.mjs; commit the result.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dir = resolve(root, 'compose/kometa-ui/src/commonMain/kotlin/uz/kometa/ui');

/** Splits `text` at `sep` where no bracket is open; `->` is not a closing `>`. */
export function splitTop(text, sep) {
  const parts = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if ('([{<'.includes(c)) depth++;
    else if (')]}'.includes(c) || (c === '>' && text[i - 1] !== '-')) depth--;
    else if (depth === 0 && text.startsWith(sep, i)) {
      parts.push(text.slice(from, i));
      from = i + sep.length;
      i += sep.length - 1;
    }
  }
  parts.push(text.slice(from));
  return parts.map((p) => p.trim());
}

/** The KDoc right above `at` (annotations may sit between), as one paragraph. */
function kdocBefore(src, at) {
  const head = src.slice(0, at).replace(/(\s*(@\w+(\([^)]*\))?|\/\/[^\n]*))*\s*$/, '');
  if (!head.endsWith('*/')) return '';
  const body = head.slice(head.lastIndexOf('/**') + 3, -2);
  return body.split('\n').map((l) => l.replace(/^\s*\* ?/, '').trim()).filter(Boolean).join(' ').replace(/\[([\w.]+)\]/g, '$1');
}

export function parseKotlin(src) {
  const out = {};
  for (const m of src.matchAll(/^fun (?:<[^>]+> )?(Kometa\w+)\(/gm)) {
    const open = m.index + m[0].length - 1;
    let depth = 0;
    let close = open;
    for (; close < src.length; close++) {
      const c = src[close];
      if (c === '(') depth++;
      else if (c === ')' && --depth === 0) break;
    }
    // Comments inside the list (a `// shortcut:` note) are not parameters.
    const list = src.slice(open + 1, close).replace(/\/\/.*$/gm, '');
    const params = splitTop(list, ',').filter(Boolean).map((p) => {
      const [decl, ...def] = splitTop(p, ' = ');
      const [name, ...type] = splitTop(decl, ':');
      const param = { name: name.replace(/^vararg\s+/, ''), type: type.join(':').replace(/\s+/g, ' ') };
      if (def.length) param.default = def.join(' = ').replace(/\s+/g, ' ');
      return param;
    });
    (out[m[1]] ??= []).push({ doc: kdocBefore(src, m.index), params });
  }
  return out;
}

if (import.meta.main ?? process.argv[1]?.endsWith('gen-compose-api.mjs')) {
  const api = {};
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.kt')).sort()) Object.assign(api, parseKotlin(readFileSync(resolve(dir, f), 'utf8')));
  writeFileSync(resolve(root, 'projects/demo/src/app/compose-api.json'), JSON.stringify(api, null, 1) + '\n');
  console.log(`compose-api.json: ${Object.keys(api).length} functions`);
}
