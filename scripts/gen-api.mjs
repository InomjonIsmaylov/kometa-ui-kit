// Reads every input()/model()/output() in the library with the TypeScript checker and writes the
// type, default and required flag the demo's API tables show (Angular's runtime metadata has none of them).
// It also writes the AI-agent reference: projects/kometa-ui/ai/components.md (shipped in the package) and
// the docs site's llms.txt / llms-full.txt (projects/demo/public, gitignored, rebuilt by `npm run api`).
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const cfgPath = resolve(root, 'projects/kometa-ui/tsconfig.lib.json');
const cfg = ts.getParsedCommandLineOfConfigFile(cfgPath, {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: (d) => { throw new Error(String(d.messageText)); } });
const program = ts.createProgram(cfg.fileNames, cfg.options);
const checker = program.getTypeChecker();
const KINDS = new Set(['input', 'model', 'output']);
const out = {};
const docs = []; // one entry per component/directive, in source order

const docOf = (name) => {
  const sym = checker.getSymbolAtLocation(name);
  return sym ? ts.displayPartsToString(sym.getDocumentationComment(checker)).replace(/\s+/g, ' ').trim() : '';
};

for (const sf of program.getSourceFiles()) {
  if (!sf.fileName.includes('/kometa-ui/src/lib/') || sf.fileName.endsWith('.spec.ts')) continue;
  ts.forEachChild(sf, function visit(node) {
    if (ts.isClassDeclaration(node) && node.name) {
      const members = [];
      for (const m of node.members) {
        if (!ts.isPropertyDeclaration(m) || !m.initializer || !ts.isCallExpression(m.initializer)) continue;
        let fn = m.initializer.expression, required = false;
        if (ts.isPropertyAccessExpression(fn) && fn.name.text === 'required') { required = true; fn = fn.expression; }
        if (!ts.isIdentifier(fn) || !KINDS.has(fn.text)) continue;
        const call = m.initializer;
        const t = checker.getTypeAtLocation(m);
        const arg = checker.getTypeArguments(t)?.[0];
        let type = arg ? checker.typeToString(arg, m, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope) : 'unknown';
        const first = call.arguments[0];
        // a two-way model also emits `<name>Change`; the table folds it into the model row
        const def = required || fn.text === 'output' || !first || ts.isObjectLiteralExpression(first) ? null : first.getText(sf).replace(/\s+/g, ' ');
        (out[node.name.text] ??= {})[m.name.getText(sf)] = { type, ...(def !== null && { default: def }), ...(required && { required: true }) };
        members.push({ name: m.name.getText(sf), kind: fn.text, type, def, required, doc: docOf(m.name) });
      }
      const deco = ts.getDecorators(node)?.map((d) => d.expression).find((e) => ts.isCallExpression(e) && ['Component', 'Directive'].includes(e.expression.getText(sf)));
      const meta = deco?.arguments[0];
      const sel = meta && ts.isObjectLiteralExpression(meta) && meta.properties.find((p) => p.name?.getText(sf) === 'selector');
      if (sel && ts.isPropertyAssignment(sel) && ts.isStringLiteralLike(sel.initializer)) {
        docs.push({ cls: node.name.text, selector: sel.initializer.text, cva: meta.getText(sf).includes('NG_VALUE_ACCESSOR'), signalForm: /\bForm(Value|Checkbox)Control\b/.test(node.heritageClauses?.map((h) => h.getText(sf)).join(' ') ?? ''), doc: docOf(node.name), members });
      }
    }
  });
}
writeFileSync(resolve(root, 'projects/demo/src/app/api.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`api.json: ${Object.keys(out).length} classes`);

const cell = (s) => (s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const BINDING = { input: 'input', model: 'model (two-way `[( )]`)', output: 'output' };
let md = `# kometa-ui component reference

Generated from the library source by \`npm run api\`; do not edit by hand. Read [usage.md](usage.md) first.
Every class below is standalone: add it to your component's \`imports\` and import it from \`'kometa-ui'\`.
Inputs are signal inputs; boolean inputs accept a bare attribute (\`<k-button outlined />\`).

`;
for (const d of docs) {
  md += `## \`${d.selector}\` — ${d.cls}\n\n`;
  if (d.doc) md += `${d.doc}\n\n`;
  if (d.signalForm) md += `A Signal Forms control: bind it with \`[formField]\`.\n\n`;
  if (d.cva) md += `Works with Angular forms (\`formControl\`, \`formControlName\`, \`ngModel\`).\n\n`;
  if (d.members.length) {
    md += `| Name | Binding | Type | Default | Notes |\n|---|---|---|---|---|\n`;
    for (const m of d.members) md += `| \`${m.name}\` | ${BINDING[m.kind]} | \`${cell(m.type)}\` | ${m.required ? '**required**' : m.def ? `\`${cell(m.def)}\`` : ''} | ${cell(m.doc)} |\n`;
    md += '\n';
  }
}
writeFileSync(resolve(root, 'projects/kometa-ui/ai/components.md'), md);
console.log(`ai/components.md: ${docs.length} components and directives`);

const usage = readFileSync(resolve(root, 'projects/kometa-ui/ai/usage.md'), 'utf8');
const site = 'https://inomjonismaylov.github.io/kometa-ui-kit';
writeFileSync(resolve(root, 'projects/demo/public/llms.txt'), `${usage}
## Docs

- [Full reference for agents](${site}/llms-full.txt): this guide plus every component's selector, inputs, outputs and defaults
- [Live docs and examples](${site}/): one page per component, e.g. ${site}/#button
- [Source](https://github.com/InomjonIsmaylov/kometa-ui-kit)
`);
writeFileSync(resolve(root, 'projects/demo/public/llms-full.txt'), `${usage}\n${md.replace('Read [usage.md](usage.md) first.', 'Read the guide above first.')}`);
