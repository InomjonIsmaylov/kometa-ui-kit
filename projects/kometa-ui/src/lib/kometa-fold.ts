import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  booleanAttribute,
  TemplateRef,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
} from '@angular/core';

/**
 * Blend expand and collapse, in three pieces so a table row, a card and a form reveal share one
 * behaviour: `k-fold-mark` (the plus that becomes a minus), `k-fold-body` (the 0fr to 1fr
 * spring) and `k-fold` (a real header button plus a body, for the plain disclosure).
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md; the global twin for a native
 * <details> is in styles/blend-fold.scss.
 *
 *
 */

/** Two 1.5px hairlines, 12px. The vertical one scales to nothing when open: a plus becomes a minus. */
@Component({
  selector: 'k-fold-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.open]': 'open()' },
  styles: `
    :host {
      position: relative;
      display: inline-block;
      flex: none;
      width: var(--fold-mark-size, 12px);
      height: var(--fold-mark-size, 12px);
      color: var(--muted);
      transition: color 280ms var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1));
    }
    :host(.open) { color: var(--display-ink, var(--text)); }
    :host::before, :host::after {
      content: '';
      position: absolute;
      background: currentColor;
      border-radius: 1px;
      transition: transform 280ms var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1));
    }
    :host::before { left: 0; right: 0; top: calc(50% - 0.75px); height: 1.5px; }
    :host::after { top: 0; bottom: 0; left: calc(50% - 0.75px); width: 1.5px; }
    :host(.open)::after { transform: scaleY(0); }
    @media (prefers-reduced-motion: reduce) {
      :host, :host::before, :host::after { transition: none; }
    }
  `,
  template: ``,
})
export class KometaFoldMark {
  readonly open = input(false);
}

type Phase = 'closed' | 'opening' | 'open' | 'closing';

const OPEN_MS = 420;
const CLOSE_MS = 260;

/**
 * The content half: rows animate 0fr to 1fr (420ms spring, the content fading up 4px in the last 60%),
 * and close faster (260ms). The template is created only while open or animating, so a page loads
 * what it always loaded. Give it `<ng-template>` as its content, or `[tpl]`.
 *
 * `appear`: animate in when it is created already open (a detail row that is only rendered while open).
 */
@Component({
  selector: 'k-fold-body',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-phase]': 'phase()' },
  styles: `
    :host { display: grid; grid-template-rows: 1fr; }
    :host([data-phase='closed']) { display: none; }
    :host([data-phase='opening']) { animation: k-fold-rows-in ${OPEN_MS}ms var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1)) both; }
    :host([data-phase='closing']) {
      grid-template-rows: 0fr;
      animation: k-fold-rows-out ${CLOSE_MS}ms cubic-bezier(0.32, 0, 0.22, 1) both;
    }
    .inner { min-height: 0; }
    :host([data-phase='opening']) .inner, :host([data-phase='closing']) .inner { overflow: hidden; }
    :host([data-phase='opening']) .inner { animation: k-fold-fade-in ${OPEN_MS}ms ease-out both; }
    :host([data-phase='closing']) .inner { animation: k-fold-fade-out ${CLOSE_MS}ms ease-out both; }
    @keyframes k-fold-rows-in { from { grid-template-rows: 0fr; } to { grid-template-rows: 1fr; } }
    @keyframes k-fold-rows-out { from { grid-template-rows: 1fr; } to { grid-template-rows: 0fr; } }
    @keyframes k-fold-fade-in { 0%, 40% { opacity: 0; transform: translateY(4px); } 100% { opacity: 1; transform: none; } }
    @keyframes k-fold-fade-out { from { opacity: 1; } 60%, 100% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) {
      :host, .inner { animation: none !important; }
    }
  `,
  template: `<div class="inner">@if (phase() !== 'closed' && template(); as t) {<ng-container [ngTemplateOutlet]="t" />}</div>`,
})
export class KometaFoldBody {
  readonly open = input(false);
  readonly appear = input(false);
  readonly tpl = input<TemplateRef<unknown> | null>(null);
  private readonly own = contentChild(TemplateRef);
  protected readonly template = computed(() => this.tpl() ?? this.own() ?? null);
  protected readonly phase = signal<Phase>('closed');

  private timer: ReturnType<typeof setTimeout> | undefined;
  private first = true;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    effect(() => {
      const open = this.open();
      untracked(() => this.go(open));
    });
  }

  private go(open: boolean): void {
    const first = this.first;
    this.first = false;
    clearTimeout(this.timer);
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animate = !reduced && (!first || this.appear());
    if (open) {
      this.phase.set(animate ? 'opening' : 'open');
      if (animate) this.settle('open', OPEN_MS);
    } else if (this.phase() !== 'closed') {
      this.phase.set(animate ? 'closing' : 'closed');
      if (animate) this.settle('closed', CLOSE_MS);
    }
  }

  private settle(to: Phase, ms: number): void {
    this.timer = setTimeout(() => this.phase.set(to), ms + 30);
  }
}

let nextId = 0;

/**
 * A disclosure: a real `<button aria-expanded aria-controls>` header (project the title as
 * `<span fold-title>`, any sibling controls as `[fold-aside]`) and a `role="region"` body (an
 * `<ng-template>` child, created only while open). `open` is a model: `[(open)]` or `[open]` and
 * `(openChange)`. The trigger's padding is `--fold-pad`, its hover fill `--fold-hover`.
 */
@Component({
  selector: 'k-fold',
  imports: [KometaFoldMark, KometaFoldBody],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .head { display: flex; align-items: center; }
    .trigger {
      flex: 1;
      min-width: 0;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: var(--fold-pad, 0);
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.12s ease;
    }
    .trigger:hover { background: var(--fold-hover, transparent); }
    .trigger:disabled { opacity: .5; cursor: default; }
    .trigger:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; }
    .title { flex: 1; min-width: 0; }
    @media (prefers-reduced-motion: reduce) { .trigger { transition: none; } }
  `,
  template: `
    <div class="head">
      <button type="button" class="trigger" [id]="id + '-h'" [attr.aria-expanded]="open()" [attr.aria-controls]="id" [disabled]="disabled()"
              (click)="open.set(!open())">
        <span class="title"><ng-content select="[fold-title]" /></span>
        <k-fold-mark [open]="open()" />
      </button>
      <ng-content select="[fold-aside]" />
    </div>
    <k-fold-body role="region" [id]="id" [attr.aria-labelledby]="id + '-h'" [open]="open()" [tpl]="body() ?? null" />
  `,
})
export class KometaFold {
  protected readonly id = `kometa-fold-${nextId++}`;
  readonly open = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  protected readonly body = contentChild(TemplateRef);
}
