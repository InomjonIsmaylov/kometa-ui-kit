import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, model, signal } from '@angular/core';

/**
 * Two panes side by side with a hairline between them that you drag to resize. The line is a dot until you hover
 * it, then it grows to full height. With `snaps` (percentages of the width) the split only rests on those, and a
 * row of ticks above marks them, the current one standing tall; an empty `snaps` lets it go anywhere between
 * `min` and `max`. The line is a `role="separator"`: arrows step to the next snap (or by 5%), Home and End go to
 * the ends. Put `kStart` on the first pane; everything else is the second.
 *
 *     <k-panes [(size)]="split"><nav kStart>…</nav><article>…</article></k-panes>
 *
 * Give the host a height (`--panes-height`). Tests in kometa-panes.spec.ts.
 */
@Component({
  selector: 'k-panes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.dragging]': 'dragging()' },
  styles: `
    :host { display: flex; flex-direction: column; height: var(--panes-height, 240px); }
    .snaps { position: relative; height: 10px; margin: 0 0 4px; flex: none; }
    .snaps i {
      position: absolute;
      bottom: 0;
      width: 1px;
      height: 6px;
      background: var(--muted);
      opacity: .6;
      transition: height .3s var(--ease-spring, ease), opacity .3s;
    }
    .snaps i.on { height: 10px; opacity: 1; background: var(--display-ink, #f4efe6); }
    .frame {
      flex: 1;
      min-height: 0;
      display: flex;
      border: 1px solid var(--panes-line, var(--glass-line));
      border-radius: var(--panes-radius, 12px);
      overflow: hidden;
    }
    .pane { min-width: 0; overflow: auto; }
    .pane:last-child { flex: 1; }
    .grip { position: relative; flex: none; width: 11px; cursor: col-resize; touch-action: none; }
    .grip::before {
      content: '';
      position: absolute;
      left: 5px;
      top: 50%;
      bottom: 50%;
      width: 1px;
      background: var(--display-ink, #f4efe6);
      transition: top .35s var(--ease-spring, ease), bottom .35s var(--ease-spring, ease);
    }
    .grip::after { content: ''; position: absolute; left: 4px; top: calc(50% - 1.5px); width: 3px; height: 3px; border-radius: 50%; background: var(--display-ink, #f4efe6); }
    .grip:hover::before, .grip:focus-visible::before, :host(.dragging) .grip::before { top: 0; bottom: 0; }
    .grip:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; }
    :host(.dragging) { user-select: none; }
    @media (pointer: coarse) { .grip { width: 24px; } .grip::before { left: 11.5px; top: 0; bottom: 0; } .grip::after { left: 10.5px; } }
    @media (prefers-reduced-motion: reduce) { .snaps i, .grip::before { transition: none; } }
  `,
  template: `
    @if (snaps().length) {
      <div class="snaps" aria-hidden="true">
        @for (s of snaps(); track s) {<i [class.on]="s === size()" [style.left.%]="s"></i>}
      </div>
    }
    <div class="frame">
      <div class="pane" [style.width.%]="size()"><ng-content select="[kStart]" /></div>
      <div class="grip" role="separator" aria-orientation="vertical" tabindex="0" [attr.aria-label]="ariaLabel() || null"
           [attr.aria-valuenow]="size()" [attr.aria-valuemin]="lo()" [attr.aria-valuemax]="hi()"
           (keydown)="key($event)" (pointerdown)="down($event)" (pointermove)="move($event)"
           (pointerup)="dragging.set(false)" (pointercancel)="dragging.set(false)"></div>
      <div class="pane"><ng-content /></div>
    </div>
  `,
})
export class KometaPanes {
  /** Width of the first pane, in percent. */
  readonly size = model(50);
  /** Where the split may rest, in percent; empty for anywhere. */
  readonly snaps = input<number[]>([25, 33, 50, 66, 75]);
  readonly min = input(15);
  readonly max = input(85);
  readonly ariaLabel = input('Resize panes');

  protected readonly dragging = signal(false);
  private readonly stops = computed(() => [...this.snaps()].filter((s) => s >= this.min() && s <= this.max()).sort((a, b) => a - b));
  protected readonly lo = computed(() => this.stops()[0] ?? this.min());
  protected readonly hi = computed(() => this.stops().at(-1) ?? this.max());

  /** The allowed size nearest to a percentage. */
  private fit(v: number): number {
    const s = this.stops();
    if (s.length) return s.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
    return Math.round(Math.min(this.max(), Math.max(this.min(), v)));
  }

  protected key(e: KeyboardEvent): void {
    const s = this.stops(), now = this.size();
    let next: number;
    if (e.key === 'Home') next = this.lo();
    else if (e.key === 'End') next = this.hi();
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = s.length ? (s.filter((x) => x < now).at(-1) ?? now) : this.fit(now - 5);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = s.length ? (s.find((x) => x > now) ?? now) : this.fit(now + 5);
    else return;
    e.preventDefault();
    this.size.set(next);
  }

  protected down(e: PointerEvent): void {
    this.dragging.set(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  protected move(e: PointerEvent): void {
    if (!this.dragging()) return;
    const r = (e.currentTarget as HTMLElement).parentElement!.getBoundingClientRect();
    if (r.width) this.size.set(this.fit(((e.clientX - r.left) / r.width) * 100));
  }
}
