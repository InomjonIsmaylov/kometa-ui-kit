import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, TemplateRef, afterNextRender, computed, contentChild, inject, input, model, output,
  signal, viewChildren,
} from '@angular/core';

/** What a screen reader hears while a row is moved with the keys. `{item}`, `{n}` and `{total}` are filled in. */
export interface KometaReorderMessages {
  grabbed: string;
  moved: string;
  dropped: string;
  cancelled: string;
}

const MESSAGES: KometaReorderMessages = {
  grabbed: '{item} grabbed, position {n} of {total}. Arrow keys move it, Space drops it, Escape cancels.',
  moved: '{item}, position {n} of {total}.',
  dropped: '{item} dropped at position {n} of {total}.',
  cancelled: '{item} put back at position {n} of {total}.',
};

/**
 * A list you put in order by dragging each row's grip. The row lifts off the page, tilts a little and casts a
 * shadow while the others slide aside to make room. Each row is drawn by the template you project, with the item
 * as `$implicit`. `items` is a model, so `[(items)]` gets the new order; `moved` says what went where.
 *
 *     <k-reorder [(items)]="queue" [labelOf]="nameOf"><ng-template let-c>{{ c.name }}</ng-template></k-reorder>
 *
 * From the keyboard: Space or Enter on a grip picks the row up, the arrows move it, Space drops it, Escape puts it
 * back; each step is announced. Rows are tracked by identity, so items must be distinct objects or values.
 * Tests in kometa-reorder.spec.ts.
 */
@Component({
  selector: 'k-reorder',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.dragging]': 'drag() !== null' },
  styles: `
    :host { display: block; }
    ul { display: grid; gap: var(--reorder-gap, 6px); margin: 0; padding: 0; list-style: none; }
    li {
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 44px;
      padding: 0 12px 0 4px;
      border: 1px solid var(--reorder-line, var(--glass-line));
      border-radius: var(--reorder-radius, 12px);
      background: var(--reorder-bg, var(--bg));
      transition: transform .35s var(--ease-spring, ease), box-shadow .25s, background .25s;
    }
    li.lift {
      z-index: 1;
      transform: scale(1.02);
      background: var(--reorder-lift-bg, var(--glass, var(--bg)));
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--display-ink, #f4efe6) 30%, transparent), 0 14px 30px rgba(0, 0, 0, .45);
    }
    :host(.dragging) li.lift { transition: box-shadow .25s, background .25s; }
    .body { flex: 1; min-width: 0; }
    .grip {
      flex: none;
      display: grid;
      place-items: center;
      width: 32px;
      height: 36px;
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: 8px;
      background: none;
      color: var(--muted);
      cursor: grab;
      touch-action: none;
    }
    .grip svg { width: 10px; height: 16px; fill: currentColor; }
    li.lift .grip { color: var(--display-ink, #f4efe6); cursor: grabbing; }
    .grip:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; }
    :host(.dragging) { user-select: none; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    @media (pointer: coarse) { .grip { width: 44px; height: 44px; } }
    @media (prefers-reduced-motion: reduce) { li { transition: none; } }
  `,
  template: `
    <ul [attr.aria-label]="ariaLabel() || null">
      @for (it of items(); track it; let i = $index) {
        <li [class.lift]="drag()?.from === i || held() === i" [style.transform]="shift(i)">
          <button #grip type="button" class="grip" [attr.aria-label]="grabLabel() + ' ' + labelOf()(it)" [attr.aria-pressed]="held() === i"
                  (pointerdown)="down($event, i)" (pointermove)="move($event)" (pointerup)="up()" (pointercancel)="cancelDrag()"
                  (keydown)="key($event, i)" (blur)="held() === i && drop(false)">
            <svg viewBox="0 0 10 16" aria-hidden="true"><circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" /><circle cx="2" cy="8" r="1.5" />
              <circle cx="8" cy="8" r="1.5" /><circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" /></svg>
          </button>
          <div class="body"><ng-container *ngTemplateOutlet="row(); context: { $implicit: it, index: i }" /></div>
        </li>
      }
    </ul>
    <div class="sr" aria-live="assertive">{{ said() }}</div>
  `,
})
export class KometaReorder<T = unknown> {
  readonly items = model.required<T[]>();
  /** How an item is named to a screen reader. */
  readonly labelOf = input<(item: T) => string>((item) => String(item));
  /** Read before the item's name on each grip. */
  readonly grabLabel = input('Move');
  readonly messages = input<Partial<KometaReorderMessages>>({});
  readonly ariaLabel = input('');
  /** A row went from one position to another. */
  readonly moved = output<{ from: number; to: number }>();

  protected readonly row = contentChild.required(TemplateRef);
  private readonly grips = viewChildren<ElementRef<HTMLButtonElement>>('grip');
  private readonly injector = inject(Injector);

  /** A pointer drag in progress: who, where it would land, how far it has moved and how far the others shift. */
  protected readonly drag = signal<{ from: number; to: number; dy: number; step: number } | null>(null);
  /** The row picked up with the keys. */
  protected readonly held = signal<number | null>(null);
  protected readonly said = signal('');
  private y0 = 0;
  private centres: number[] = [];
  private before: T[] | null = null;
  private readonly text = computed(() => ({ ...MESSAGES, ...this.messages() }));

  protected shift(i: number): string | null {
    const d = this.drag();
    if (!d) return null;
    if (i === d.from) return `translateY(${d.dy}px) rotate(-1deg) scale(1.03)`;
    if (d.from < i && i <= d.to) return `translateY(${-d.step}px)`;
    if (d.to <= i && i < d.from) return `translateY(${d.step}px)`;
    return null;
  }

  protected down(e: PointerEvent, i: number): void {
    if (e.button > 0) return;
    const rows = this.grips().map((g) => g.nativeElement.closest('li')!.getBoundingClientRect());
    const gap = rows.length > 1 ? Math.max(0, rows[1].top - rows[0].bottom) : 0;
    this.centres = rows.map((r) => r.top + r.height / 2);
    this.y0 = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    this.drag.set({ from: i, to: i, dy: 0, step: rows[i].height + gap });
  }

  protected move(e: PointerEvent): void {
    const d = this.drag();
    if (!d) return;
    const dy = e.clientY - this.y0;
    const at = this.centres[d.from] + dy;
    // Where it lands: how many of the other rows have their middle above the dragged row's middle.
    const to = this.centres.filter((c, j) => j !== d.from && c < at).length;
    this.drag.set({ ...d, dy, to });
  }

  protected up(): void {
    const d = this.drag();
    this.drag.set(null);
    if (d && d.to !== d.from) this.place(d.from, d.to);
  }

  protected cancelDrag(): void {
    this.drag.set(null);
  }

  private place(from: number, to: number): void {
    const next = [...this.items()];
    next.splice(to, 0, ...next.splice(from, 1));
    this.items.set(next);
    this.moved.emit({ from, to });
  }

  private say(kind: keyof KometaReorderMessages, i: number): void {
    const item = this.labelOf()(this.items()[i]);
    this.said.set(this.text()[kind].replace('{item}', item).replace('{n}', `${i + 1}`).replace('{total}', `${this.items().length}`));
  }

  /** Focus follows the row it moved with, after the list redraws. */
  private focus(i: number): void {
    afterNextRender(() => this.grips()[i]?.nativeElement.focus(), { injector: this.injector });
  }

  protected key(e: KeyboardEvent, i: number): void {
    const held = this.held();
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (held === null) {
        this.held.set(i);
        this.before = this.items();
        this.say('grabbed', i);
      } else {
        this.drop(true);
      }
      return;
    }
    if (held === null) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      const item = this.items()[held];
      if (this.before) this.items.set(this.before);
      const back = this.items().indexOf(item);
      this.held.set(null);
      this.say('cancelled', back);
      this.focus(back);
      return;
    }
    const to = e.key === 'ArrowUp' ? held - 1 : e.key === 'ArrowDown' ? held + 1 : e.key === 'Home' ? 0 : e.key === 'End' ? this.items().length - 1 : -1;
    if (to < 0 || to >= this.items().length) return;
    e.preventDefault();
    if (to === held) return;
    this.place(held, to);
    this.held.set(to);
    this.say('moved', to);
    this.focus(to);
  }

  /** Leaves the held row where it is now. Called on Space, and on blur when focus leaves for good. */
  protected drop(announce: boolean): void {
    const held = this.held();
    if (held === null) return;
    // A grip loses focus for a moment while its row is moved in the list; that is not a drop.
    if (!announce && this.grips()[held]?.nativeElement === document.activeElement) return;
    if (!announce) { queueMicrotask(() => { if (this.held() !== null && !this.grips().some((g) => g.nativeElement === document.activeElement)) this.held.set(null); }); return; }
    this.held.set(null);
    this.before = null;
    this.say('dropped', held);
  }
}
