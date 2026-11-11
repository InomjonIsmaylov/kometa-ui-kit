import { ChangeDetectionStrategy, Component, ElementRef, effect, input, model, signal, viewChild } from '@angular/core';

let nextId = 0;

/**
 * An explanation that floats and moves nothing: a small ⓘ marker, and a cream tab with the sentence in
 * the browser's top layer, so a card with `overflow: hidden` or a container query cannot clip or trap it.
 * Hover (mouse), focus and a tap open it; blur, leaving with the mouse and Escape close it. The tab
 * sits above the marker, flips below near the top edge and is kept inside the viewport. `open` is a
 * model. The sentence is projected:
 * `<kometa-note label="Daromad">Davr uchun tushum, to'lovlargacha.</kometa-note>`.
 * `label` is the marker's accessible name; when it is empty the tab describes the marker instead.
 * Spec: kometa-note.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-6.html (Ink).
 */
@Component({
  selector: 'kometa-note',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(pointerenter)': 'onEnter($event)',
    '(pointerleave)': 'onLeave($event)',
    '(keydown.escape)': 'onEscape($event)',
    '(window:resize)': 'open.set(false)',
    '(window:scroll)': 'open.set(false)',
  },
  styles: `
    :host { display: inline-flex; }
    .mk { display: inline-flex; flex: none; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--muted); font: inherit; cursor: help; }
    .mk:hover, .mk[aria-expanded='true'], .mk:focus-visible { color: var(--display-ink, var(--text)); }
    .mk:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    @media (pointer: coarse) { .mk { box-sizing: content-box; padding: 15px; margin: -15px; } }
    .tip {
      /* the popover UA style centres it with inset 0 and margin auto; position is set from the marker */
      inset: auto; margin: 0; width: max-content; max-width: min(var(--note-max-width, 260px), calc(100vw - 16px));
      padding: 8px 12px; border: 0; border-radius: var(--note-radius, 8px);
      background: var(--note-bg, var(--display-ink, var(--text))); color: var(--note-color, var(--bg)); font-size: 13.5px; font-weight: 500; line-height: 1.45;
      overflow-wrap: anywhere; white-space: normal; text-align: left; pointer-events: none;
      transition: opacity 200ms ease, translate 320ms var(--ease-spring, ease);
    }
    @starting-style { .tip:popover-open { opacity: 0; translate: 0 4px; } }
    @media (prefers-reduced-motion: reduce) { .tip { transition: none; } }
  `,
  template: `
    <button #mk class="mk" type="button" [attr.aria-label]="label() || null" [attr.aria-expanded]="open()"
            [attr.aria-describedby]="label() ? null : id" (focus)="open.set(true)" (blur)="open.set(false)" (click)="open.set(true)">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.01" />
      </svg>
    </button>
    <span #tip class="tip" popover="manual" role="tooltip" [id]="id" [style.left.px]="x()" [style.top.px]="y()"><ng-content /></span>
  `,
})
export class KometaNote {
  protected readonly id = `kometa-note-${nextId++}`;
  /** The marker's accessible name. */
  readonly label = input('');
  readonly open = model(false);
  /** Where the tab sits; `auto` is above, flipping below near the top edge. */
  readonly placement = input<'auto' | 'above' | 'below'>('auto');

  protected readonly x = signal(0);
  protected readonly y = signal(0);
  private readonly mk = viewChild.required<ElementRef<HTMLButtonElement>>('mk');
  private readonly tip = viewChild.required<ElementRef<HTMLElement>>('tip');

  constructor() {
    effect(() => {
      const on = this.open();
      const tip = this.tip().nativeElement;
      // ponytail: the Popover API is baseline since 2024; an older engine just never shows the tab.
      try {
        if (on) tip.showPopover?.(); else tip.hidePopover?.();
      } catch { /* already in that state */ }
      if (!on) return;
      const m = this.mk().nativeElement.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      const pad = 8;
      const above = this.placement() === 'auto' ? m.top - t.height - pad >= pad : this.placement() === 'above';
      this.y.set(above ? m.top - t.height - pad : m.bottom + pad);
      this.x.set(Math.max(pad, Math.min(m.left + m.width / 2 - t.width / 2, window.innerWidth - pad - t.width)));
    });
  }

  protected onEnter(e: PointerEvent): void {
    if (e.pointerType === 'mouse') this.open.set(true);
  }

  protected onLeave(e: PointerEvent): void {
    if (e.pointerType === 'mouse' && document.activeElement !== this.mk().nativeElement) this.open.set(false);
  }

  protected onEscape(e: Event): void {
    if (!this.open()) return;
    e.stopPropagation();
    this.open.set(false);
  }
}
