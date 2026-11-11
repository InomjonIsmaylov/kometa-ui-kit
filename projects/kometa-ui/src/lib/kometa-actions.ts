import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, booleanAttribute, effect, inject, input, model, signal, viewChild,
} from '@angular/core';

export interface KometaAction {
  label: string;
  run: () => void;
  /** A destructive action (Cancel, No-show): drawn in the error colour. */
  danger?: boolean;
  /** A small word after the label, e.g. the "PRO" a feature needs. */
  badge?: string;
  disabled?: boolean;
}

let nextId = 0;

/**
 * The "more" menu: a ⋯ button that opens a short list of actions. Not a value chooser (that is
 * `k-menu`): each row does something and the list closes. The list is words under a hairline, with a bar that
 * slides to the row you are on; it opens in the browser's top layer, so a card or table cell cannot clip it, flips
 * above the button when there is no room below and is kept inside the viewport.
 * Arrow keys, Home and End move between rows; Enter runs one; Escape, a click outside, Tab, resize and scroll close it.
 * Content projected into it replaces the ⋯ (the customer top bar puts the avatar glyph there). `label` is the button's accessible name ("More options") and the caller's word. `open` is a model.
 * Spec: kometa-actions.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-7.html (Rail).
 */
@Component({
  selector: 'k-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'close(false)',
    '(window:scroll)': 'close(false)',
    '(document:pointerdown)': 'onOutside($event)',
  },
  styles: `
    :host { display: inline-flex; }
    .more {
      display: inline-grid; place-items: center; width: var(--actions-size, 36px); height: var(--actions-size, 36px); padding: 0;
      border: 1px solid transparent; border-radius: var(--actions-radius, 50%); background: none;
      color: var(--display-ink, var(--text)); font: inherit; font-size: 20px; line-height: 1; cursor: pointer;
      transition: border-color 200ms ease;
    }
    .more:hover:not(:disabled), .more[aria-expanded='true'] { border-color: var(--glass-line); }
    .more:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    .more:disabled { opacity: .4; cursor: not-allowed; }
    @media (pointer: coarse) { .more { width: 44px; height: 44px; } }
    .list {
      inset: auto; width: max-content; min-width: var(--actions-min-width, 200px); max-width: calc(100vw - 16px); margin: 0; padding: 4px 0;
      border: 0; border-left: 1px solid var(--display-ink, var(--text)); border-radius: 0;
      background: var(--bg); color: var(--text); box-shadow: 0 10px 28px rgba(0, 0, 0, .35);
      transition: opacity 180ms ease, translate 320ms var(--ease-spring, ease);
    }
    @starting-style { .list:popover-open { opacity: 0; translate: 0 -4px; } }
    .row {
      position: relative; display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; padding: 0 16px;
      border: 0; background: none; color: inherit; font: inherit; font-size: 15px; text-align: left; cursor: pointer;
    }
    .row::before {
      content: ''; position: absolute; left: -1px; top: 8px; bottom: 8px; width: 3px; background: var(--display-ink, var(--text));
      transform: scaleY(0); transition: transform 280ms var(--ease-spring, ease);
    }
    .row:hover:not(:disabled)::before, .row:focus-visible::before { transform: scaleY(1); }
    .row:focus-visible { outline: 0; }
    .row:disabled { opacity: .4; cursor: not-allowed; }
    .row.danger { color: var(--red); }
    .badge { margin-left: auto; padding: 1px 6px; border: 1px solid currentColor; border-radius: 4px; color: var(--amber-ink, var(--amber)); font-size: 12px; letter-spacing: .06em; }
    @media (prefers-reduced-motion: reduce) { .more, .list, .row::before { transition: none; } }
  `,
  template: `
    <button #btn class="more" type="button" aria-haspopup="menu" [disabled]="disabled()" [attr.aria-label]="label()"
            [attr.aria-expanded]="open()" [attr.aria-controls]="id" (click)="toggle()"><ng-content>&#8943;</ng-content></button>
    <div #list class="list" popover="manual" role="menu" [id]="id" [attr.aria-label]="label()"
         [attr.data-align]="align()" [style.left.px]="x()" [style.top.px]="y()" (keydown)="onKey($event)">
      @if (open()) {
        @for (it of items(); track $index) {
          <button class="row" type="button" role="menuitem" tabindex="-1" [class.danger]="it.danger" [disabled]="it.disabled"
                  (click)="choose(it)">{{ it.label }}@if (it.badge) { <span class="badge">{{ it.badge }}</span> }</button>
        }
      }
    </div>
  `,
})
export class KometaActions {
  protected readonly id = `kometa-actions-${nextId++}`;
  readonly items = input.required<KometaAction[]>();
  /** The button's accessible name, in the caller's language. */
  readonly label = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly open = model(false);
  /** Which edge of the button the list lines up with. */
  readonly align = input<'end' | 'start'>('end');

  protected readonly x = signal(0);
  protected readonly y = signal(0);
  private readonly btn = viewChild.required<ElementRef<HTMLButtonElement>>('btn');
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');
  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      const on = this.open();
      const list = this.list().nativeElement;
      // ponytail: the Popover API is baseline since 2024; an older engine shows the list in flow.
      try {
        if (on) list.showPopover?.(); else list.hidePopover?.();
      } catch { /* already in that state */ }
      if (on) afterNextRender(() => this.place(), { injector: this.injector });
    });
  }

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  /** The rows exist after the render that opened the list, so the list is measured and focused then. */
  private place(): void {
    const b = this.btn().nativeElement.getBoundingClientRect();
    const list = this.list().nativeElement;
    const l = list.getBoundingClientRect();
    const pad = 8;
    const below = b.bottom + 6 + l.height <= window.innerHeight - pad;
    this.y.set(below ? b.bottom + 6 : Math.max(pad, b.top - 6 - l.height));
    this.x.set(Math.max(pad, Math.min(this.align() === 'start' ? b.left : b.right - l.width, window.innerWidth - pad - l.width)));
    this.rows()[0]?.focus({ preventScroll: true });
  }

  private rows(): HTMLButtonElement[] {
    return [...this.list().nativeElement.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')];
  }

  protected choose(it: KometaAction): void {
    this.close(true);
    it.run();
  }

  protected close(refocus: boolean): void {
    if (!this.open()) return;
    this.open.set(false);
    if (refocus) this.btn().nativeElement.focus();
  }

  protected onOutside(e: Event): void {
    if (this.open() && !(e.target instanceof Node && this.listHost().contains(e.target))) this.close(false);
  }

  private listHost(): HTMLElement {
    return this.btn().nativeElement.parentElement!;
  }

  protected onKey(e: KeyboardEvent): void {
    const rows = this.rows();
    const i = rows.indexOf(document.activeElement as HTMLButtonElement);
    const go = (n: number) => { e.preventDefault(); rows[(n + rows.length) % rows.length]?.focus(); };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(rows.length - 1);
    else if (e.key === 'Escape') { e.stopPropagation(); this.close(true); }
    else if (e.key === 'Tab') this.close(false);
  }
}
