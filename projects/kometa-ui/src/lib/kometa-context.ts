import { KometaMotion } from './kometa-motion';
import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, effect, inject, input, output, signal, viewChild,
} from '@angular/core';

export interface KometaContextItem {
  label: string;
  value?: string;
  /** Shown on the right in mono (`Ctrl D`); it only describes the key, it does not bind it. */
  shortcut?: string;
  /** Drawn red, for delete and the like. */
  danger?: boolean;
  disabled?: boolean;
}

/**
 * A right-click menu for whatever it wraps: a glass card in the top layer at the pointer, kept inside the screen,
 * with the shortcut of each action in mono and destructive ones in red. `null` in `items` draws a divider.
 * The ContextMenu key or Shift+F10 opens it under the focused element. Arrows, Home and End move, Enter picks,
 * Escape and Tab close; focus goes back to where it was. Picking emits `picked` with the item.
 *
 *     <k-context [items]="actions" (picked)="run($event)"><div class="row">…</div></k-context>
 *
 * Tests in kometa-context.spec.ts.
 */
@Component({
  selector: 'k-context',
  hostDirectives: [{ directive: KometaMotion, inputs: ['animation'] }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(contextmenu)': 'onContext($event)',
    '(keydown)': 'onHostKey($event)',
    '(document:pointerdown)': 'onOutside($event)',
    '(window:resize)': 'close(false)',
  },
  styles: `
    :host { display: block; }
    .menu {
      inset: auto; margin: 0; padding: 6px; min-width: var(--context-width, 180px); max-width: calc(100vw - 16px);
      border: 1px solid var(--glass-line); border-radius: var(--context-radius, 14px); color: var(--text);
      background: var(--glass, var(--bg)); backdrop-filter: blur(18px); box-shadow: 0 12px 30px rgba(0, 0, 0, .35);
      animation: var(--k-anim, k-m-drop) var(--k-motion-dur, 300ms) var(--k-motion-ease, var(--ease-spring, ease)) backwards;
    }
    .item {
      display: flex; align-items: center; justify-content: space-between; gap: 18px; width: 100%;
      margin: 0; padding: 7px 9px; border: 0; border-radius: 8px; background: none;
      color: var(--text); font-family: inherit; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer;
    }
    .item:hover:not(:disabled), .item:focus { background: color-mix(in srgb, var(--display-ink, #f4efe6) 8%, transparent); outline: none; }
    .item:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; }
    .item:disabled { opacity: .45; cursor: default; }
    .item.danger { color: var(--red); }
    .key { color: var(--muted); font: 500 10px var(--font-mono, monospace); }
    hr { margin: 4px 2px; border: 0; border-top: 1px solid var(--glass-line); }
    @media (pointer: coarse) { .item { min-height: 44px; } }
    @media (prefers-reduced-motion: reduce) { .menu { animation: none; } }
  `,
  template: `
    <ng-content />
    <div #menu class="menu" popover="manual" role="menu" [attr.aria-label]="ariaLabel() || null" [style]="motion.vars()"
         [style.left.px]="x()" [style.top.px]="y()" (keydown)="onMenuKey($event)" (focusout)="onFocusOut($event)">
      @if (open()) {
        @for (it of items(); track $index) {
          @if (it) {
            <button type="button" class="item" role="menuitem" tabindex="-1" [class.danger]="it.danger" [disabled]="it.disabled"
                    (click)="pick(it)">{{ it.label }}@if (it.shortcut) {<span class="key">{{ it.shortcut }}</span>}</button>
          } @else {
            <hr role="separator" />
          }
        }
      }
    </div>
  `,
})
export class KometaContext {
  protected readonly motion = inject(KometaMotion);
  readonly items = input.required<(KometaContextItem | null)[]>();
  readonly ariaLabel = input('Actions');
  readonly picked = output<KometaContextItem>();

  protected readonly open = signal(false);
  protected readonly x = signal(0);
  protected readonly y = signal(0);
  private back: HTMLElement | null = null;
  private readonly menu = viewChild.required<ElementRef<HTMLElement>>('menu');
  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      const on = this.open(), m = this.menu().nativeElement;
      // ponytail: the Popover API is baseline since 2024; an older engine shows the menu in flow.
      try { if (on) m.showPopover?.(); else m.hidePopover?.(); } catch { /* already in that state */ }
    });
  }

  /** Opens the menu with its top-left corner at a point on the screen. */
  openAt(x: number, y: number): void {
    this.back = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.x.set(x);
    this.y.set(y);
    this.open.set(true);
    afterNextRender(() => {
      const m = this.menu().nativeElement, r = m.getBoundingClientRect(), pad = 8;
      if (x + r.width > innerWidth - pad) this.x.set(Math.max(pad, innerWidth - pad - r.width));
      if (y + r.height > innerHeight - pad) this.y.set(Math.max(pad, y - r.height));
      this.buttons()[0]?.focus({ preventScroll: true });
    }, { injector: this.injector });
  }

  close(refocus = true): void {
    if (!this.open()) return;
    this.open.set(false);
    if (refocus) this.back?.focus({ preventScroll: true });
  }

  protected pick(it: KometaContextItem): void {
    this.close();
    this.picked.emit(it);
  }

  private buttons(): HTMLButtonElement[] {
    return Array.from(this.menu().nativeElement.querySelectorAll<HTMLButtonElement>('.item:not(:disabled)'));
  }

  protected onContext(e: MouseEvent): void {
    if (this.menu().nativeElement.contains(e.target as Node)) { e.preventDefault(); return; }
    e.preventDefault();
    this.openAt(e.clientX, e.clientY);
  }

  protected onHostKey(e: KeyboardEvent): void {
    if (this.open() || !(e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey))) return;
    e.preventDefault();
    const r = (e.target as HTMLElement).getBoundingClientRect();
    this.openAt(r.left, r.bottom);
  }

  protected onMenuKey(e: KeyboardEvent): void {
    const els = this.buttons(), at = els.indexOf(document.activeElement as HTMLButtonElement), n = els.length;
    const to: Record<string, number> = { ArrowDown: (at + 1) % n, ArrowUp: (at - 1 + n) % n, Home: 0, End: n - 1 };
    e.stopPropagation(); // the host's own keydown must not reopen it
    if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    else if (e.key === 'Tab') this.close(false);
    else if (e.key in to && n) { e.preventDefault(); els[to[e.key]].focus(); }
  }

  protected onOutside(e: Event): void {
    if (this.open() && !(e.target instanceof Node && this.menu().nativeElement.contains(e.target))) this.close(false);
  }

  protected onFocusOut(e: FocusEvent): void {
    const to = e.relatedTarget;
    if (to instanceof Node && !this.menu().nativeElement.contains(to)) this.close(false);
  }
}
