// Reads every input()/model()/output() in the library with the TypeScript checker and writes the
// type, default and required flag the demo's API tables show (Angular's runtime metadata has none of them).
import ts from 'typescript';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const cfgPath = resolve(root, 'projects/kometa-ui/tsconfig.lib.json');
const cfg = ts.getParsedCommandLineOfConfigFile(cfgPath, {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: (d) => { throw new Error(String(d.messageText)); } });
const program = ts.createProgram(cfg.fileNames, cfg.options);
const checker = program.getTypeChecker();
const KINDS = new Set(['input', 'model', 'output']);
const out = {};

for (const sf of program.getSourceFiles()) {
  if (!sf.fileName.includes('/kometa-ui/src/lib/') || sf.fileName.endsWith('.spec.ts')) continue;
  ts.forEachChild(sf, function visit(node) {
    if (ts.isClassDeclaration(node) && node.name) {
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
      }
    }
  });
}
writeFileSync(resolve(root, 'projects/demo/src/app/api.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`api.json: ${Object.keys(out).length} classes`);
