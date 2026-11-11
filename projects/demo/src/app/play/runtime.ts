// Loaded only by the playground: the JIT compiler and a TypeScript type-stripper are too heavy for every page.
import '@angular/compiler';
import * as core from '@angular/core';
import { Component, Type } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as kometa from 'kometa-ui';
import { transform } from 'sucrase';

/** Names the playground class can use without importing them: Angular's signal and DI functions, and all of kometa-ui. */
const SCOPE: Record<string, unknown> = {
  signal: core.signal, computed: core.computed, effect: core.effect, linkedSignal: core.linkedSignal, untracked: core.untracked,
  inject: core.inject, input: core.input, output: core.output, model: core.model, DestroyRef: core.DestroyRef,
  ...kometa,
};
const NAMES = Object.keys(SCOPE).filter((n) => /^[A-Za-z_$][\w$]*$/.test(n));
/** Every standalone component and directive of the kit, plus ngModel. */
const IMPORTS: Type<unknown>[] = [FormsModule, ...(Object.values(kometa) as unknown[]).filter((v): v is Type<unknown> => typeof v === 'function' && ('ɵcmp' in v || 'ɵdir' in v))];

let next = 0;

/**
 * Turns the three editors into a component class, compiled just in time. Import lines are dropped (everything in
 * SCOPE is already there), types are stripped, and the first class becomes the component. Throws on a TypeScript or
 * template error, with the compiler's message.
 */
export function compile(html: string, ts: string, css: string): Type<unknown> {
  const stripped = ts.replace(/^\s*import\s[\s\S]*?\sfrom\s*['"][^'"]+['"];?[ \t]*$/gm, '').replace(/^\s*import\s+['"][^'"]+['"];?[ \t]*$/gm, '');
  const js = transform(stripped, { transforms: ['typescript'], disableESTransforms: true }).code.replace(/\bexport\s+(default\s+)?/g, '');
  const name = /\bclass\s+([A-Za-z_$][\w$]*)/.exec(js)?.[1];
  // A fresh class every run: JIT compiles a class once, so an edit must not reuse the last one.
  const cls = name
    ? (new Function(...NAMES, `"use strict";\n${js}\nreturn ${name};`)(...NAMES.map((n) => SCOPE[n])) as Type<unknown>)
    : class Play {};
  const cmp = Component({ selector: `play-root-${++next}`, template: html, styles: css ? [css] : [], imports: IMPORTS })(cls) as Type<unknown>;
  void (cmp as unknown as { ɵcmp: unknown }).ɵcmp; // compiles now, so a template error surfaces here and not on render
  return cmp;
}
