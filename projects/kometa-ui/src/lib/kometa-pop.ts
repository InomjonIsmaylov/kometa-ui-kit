import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, effect, inject, input, model, output, signal, viewChild,
} from '@angular/core';

/**
 * A small panel hung off a button: a glass card in the browser's top layer (so a drawer or a card cannot clip it)
 * that scales in under the button, flips above when there is no room below and is kept inside the viewport.
 * The caller owns the button and the words; the panel is whatever is projected into it.
 *
 *     <button (click)="pop.toggle($event)">…</button>
 *     <k-pop #pop ariaLabel="Shop">…</k-pop>
 *
 * `toggle(event)` anchors to the element the event is on (`show(el)` and `hide()` do the same by hand); `open` is
 * two-way. Escape closes and hands focus back to the button, and does not reach a drawer behind it; a click outside,
 * resize, scroll elsewhere and focus moving out of the panel close it without moving focus. The panel is a named
 * dialog: `ariaLabel` or `ariaLabelledBy`. On open focus goes to the first control in it (`focusOnShow` false leaves
 * that to the caller, who hears `opened`). The panel is at most 70% of the screen tall and scrolls inside itself;
 * `width` fixes its width in pixels.
 * Spec: kometa-pop.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-9.html (Glass).
 */
@Component({
  selector: 'k-pop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'hide(false)',
    '(document:pointerdown)': 'onOutside($event)',
  },
  styles: `
    :host { display: contents; }
    .pop {
      inset: auto; margin: 0; padding: var(--pop-padding, 6px); max-width: calc(100vw - 16px); max-height: var(--pop-max-height, min(70vh, calc(100dvh - 24px))); overflow: auto;
      border: 1px solid var(--glass-line); border-radius: var(--pop-radius, 18px); color: var(--text);
      background: var(--glass-drawer, var(--bg)); backdrop-filter: blur(18px); box-shadow: var(--pop-shadow, 0 12px 30px rgba(0, 0, 0, .35));
      transition: opacity 180ms ease, translate 320ms var(--ease-spring, ease);
    }
    @starting-style { .pop:popover-open { opacity: 0; translate: 0 -4px; } }
    .pop:focus { outline: none; }
    @media (prefers-reduced-motion: reduce) { .pop { transition: none; } }
  `,
  template: `
    <div #pop class="pop" popover="manual" role="dialog" tabindex="-1" [attr.aria-label]="ariaLabel() || null"
         [attr.aria-labelledby]="ariaLabelledBy() || null" [style.left.px]="x()" [style.top.px]="y()" [style.width.px]="width()"
         (keydown)="onKey($event)" (focusout)="onFocusOut($event)">
      <ng-content />
    </div>
  `,
})
export class KometaPop {
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly width = input<number | null>(null);
  readonly focusOnShow = input(true);
  /** Gap in pixels between the button and the panel. */
  readonly offset = input(8);
  /** Which edge of the button the panel lines up with. */
  readonly align = input<'start' | 'end'>('start');
  readonly open = model(false);
  /** The panel is in place and visible. */
  readonly opened = output<void>();

  protected readonly x = signal(0);
  protected readonly y = signal(0);

  private anchor: HTMLElement | null = null;
  private readonly pop = viewChild.required<ElementRef<HTMLElement>>('pop');
  private readonly injector = inject(Injector);

  constructor() {
    effect((onCleanup) => {
      const on = this.open();
      const pop = this.pop().nativeElement;
      // ponytail: the Popover API is baseline since 2024; an older engine shows the panel in flow.
      try {
        if (on) pop.showPopover?.(); else pop.hidePopover?.();
      } catch { /* already in that state */ }
      if (!on) return;
      afterNextRender(() => this.place(), { injector: this.injector });
      const away = (e: Event) => { if (!(e.target instanceof Node && pop.contains(e.target))) this.hide(false); };
      document.addEventListener('scroll', away, true);
      onCleanup(() => document.removeEventListener('scroll', away, true));
    });
  }

  toggle(event: Event): void {
    const el = event.currentTarget as HTMLElement | null;
    if (this.open() && this.anchor === el) this.hide(false);
    else this.show(el);
  }

  show(anchor: HTMLElement | null): void {
    this.anchor = anchor;
    this.open.set(true);
  }

  hide(refocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (refocus) this.anchor?.focus();
  }

  /** The panel exists after the render that opened it, so it is measured then. */
  private place(): void {
    const pop = this.pop().nativeElement;
    const b = this.anchor?.getBoundingClientRect();
    if (b) {
      const l = pop.getBoundingClientRect();
      const pad = 8;
      const gap = this.offset();
      const below = b.bottom + gap + l.height <= window.innerHeight - pad;
      this.y.set(below ? b.bottom + gap : Math.max(pad, b.top - gap - l.height));
      const left = this.align() === 'end' ? b.right - l.width : b.left;
      this.x.set(Math.max(pad, Math.min(left, window.innerWidth - pad - l.width)));
    }
    if (this.focusOnShow()) {
      const first = pop.querySelector<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])');
      (first ?? pop).focus({ preventScroll: true });
    }
    this.opened.emit();
  }

  protected onOutside(e: Event): void {
    if (!this.open() || !(e.target instanceof Node)) return;
    if (this.pop().nativeElement.contains(e.target) || this.anchor?.contains(e.target)) return;
    this.hide(false);
  }

  protected onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') { e.stopPropagation(); this.hide(true); }
  }

  protected onFocusOut(e: FocusEvent): void {
    const to = e.relatedTarget;
    if (to instanceof Node && !this.pop().nativeElement.contains(to) && !this.anchor?.contains(to)) this.hide(false);
  }
}
