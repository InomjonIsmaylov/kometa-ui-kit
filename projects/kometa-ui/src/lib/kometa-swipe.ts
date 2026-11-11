import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';

/**
 * A row you swipe to act on. Swipe right and a row of ticks fills as you pull; let go with them all lit and
 * `swipedRight` fires (marking a visit done, say). Swipe left and a ring grows under the row, turns red past
 * halfway, and on release the row slides away and `swipedLeft` fires (cancel, delete): remove the item then, or
 * the row slides back. Each side is on when it has a label. The row's content is projected.
 *
 *     <k-swipe rightLabel="Done" leftLabel="Cancel visit" (swipedRight)="done(v)" (swipedLeft)="cancel(v)">…</k-swipe>
 *
 * Swiping is only a shortcut: each action is also a button under the row, reached with Tab (the row slides aside
 * to show it) and read by a screen reader by its label. Vertical scrolling is left to the page. Tests in kometa-swipe.spec.ts.
 */
@Component({
  selector: 'k-swipe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.dragging]': 'dragging()', '[class.gone]': 'gone()' },
  styles: `
    :host { position: relative; display: block; overflow: hidden; border-radius: var(--swipe-radius, 12px); }
    .under { position: absolute; inset: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; }
    .under button { display: flex; align-items: center; gap: 12px; margin: 0; padding: 0; border: 0; background: none; color: var(--muted); cursor: pointer; }
    .under button:focus-visible { outline: 2px solid var(--amber); outline-offset: 4px; border-radius: 6px; }
    .ticks { display: flex; align-items: flex-end; gap: 3px; height: 20px; }
    .ticks i { width: 2px; height: 8px; border-radius: 1px; background: var(--swipe-off, color-mix(in srgb, var(--muted) 45%, transparent)); transition: height .15s, background .15s; }
    .ticks i.on { height: 20px; background: var(--swipe-on, var(--display-ink, #f4efe6)); }
    .word { font: 700 14px var(--font-display, 'Syne'), sans-serif; transition: color .2s; }
    .right.go .word, .right:focus-visible .word { color: var(--display-ink, #f4efe6); }
    .halo {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border: 1px solid var(--display-ink, #f4efe6);
      border-radius: 50%;
      color: var(--display-ink, #f4efe6);
      font-size: 14px;
      transition: transform .15s, background .2s, color .2s, border-color .2s;
    }
    .left.go .halo { border-color: var(--swipe-danger, var(--red)); background: var(--swipe-danger, var(--red)); color: var(--bg); }
    .face {
      position: relative;
      background: var(--swipe-bg, var(--bg));
      touch-action: pan-y;
      transition: transform .5s var(--ease-spring, ease);
    }
    :host(.dragging) .face { transition: none; user-select: none; }
    :host(.gone) .face { transition: transform .3s ease-in; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    @media (prefers-reduced-motion: reduce) { .face, .ticks i, .halo { transition: none; } }
  `,
  template: `
    <div class="under">
      @if (rightLabel()) {
        <button type="button" class="right" [class.go]="lit() >= ticks()" (click)="fire('right')" (focus)="peek.set(1)" (blur)="peek.set(0)">
          <span class="ticks" aria-hidden="true">@for (t of tickList(); track $index) {<i [class.on]="$index < lit()"></i>}</span>
          <span class="word">{{ rightLabel() }}</span>
        </button>
      } @else {<span></span>}
      @if (leftLabel()) {
        <button type="button" class="left" [class.go]="leftGo()" [attr.aria-label]="leftLabel()" (click)="fire('left')" (focus)="peek.set(-1)" (blur)="peek.set(0)">
          <span class="halo" aria-hidden="true" [style.transform]="'scale(' + halo() + ')'">{{ leftIcon() }}</span>
        </button>
      }
    </div>
    <div class="face" [style.transform]="'translateX(' + x() + 'px)'" (pointerdown)="down($event)" (pointermove)="move($event)"
         (pointerup)="up()" (pointercancel)="reset()">
      <ng-content />
    </div>
  `,
})
export class KometaSwipe {
  /** The word for a swipe right, beside the ticks; empty turns that side off. */
  readonly rightLabel = input('');
  /** Names the swipe-left action for a screen reader; empty turns that side off. */
  readonly leftLabel = input('');
  /** Drawn in the ring under a swipe left. */
  readonly leftIcon = input('✕');
  /** How many ticks fill on the way to a swipe right. */
  readonly ticks = input(12);
  readonly swipedRight = output<void>();
  readonly swipedLeft = output<void>();

  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  protected readonly dragging = signal(false);
  protected readonly gone = signal(false);
  /** -1 or 1 while a button under the row has focus, sliding the row aside to show it. */
  protected readonly peek = signal(0);
  private readonly pull = signal(0);
  private start: { x: number; y: number } | null = null;
  private swiped = false;

  constructor() {
    // Capture, so it runs before the content's own click handlers.
    this.host.addEventListener('click', (e) => this.swallow(e), true);
  }

  private width(): number { return this.host.getBoundingClientRect().width || 300; }

  protected readonly x = computed(() => (this.dragging() || this.gone() || this.pull() ? this.pull() : this.peek() > 0 ? 120 : this.peek() < 0 ? -64 : 0));
  protected readonly tickList = computed(() => Array.from({ length: this.ticks() }));
  /** Ticks lit: full at half the row's width. */
  protected readonly lit = computed(() => Math.max(0, Math.min(this.ticks(), Math.round((this.pull() / (this.width() * .5)) * this.ticks()))));
  protected readonly leftGo = computed(() => -this.pull() > this.width() * .45);
  protected readonly halo = computed(() => (this.pull() < 0 ? Math.min(1.1, .4 - this.pull() / (this.width() * .45) * .7) : .4));

  protected down(e: PointerEvent): void {
    if (e.button > 0) return;
    this.start = { x: e.clientX, y: e.clientY };
    this.swiped = false;
  }

  protected move(e: PointerEvent): void {
    if (!this.start) return;
    const dx = e.clientX - this.start.x, dy = e.clientY - this.start.y;
    if (!this.dragging()) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      this.dragging.set(true);
      this.swiped = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    const w = this.width();
    const max = this.rightLabel() ? w * .7 : 0, min = this.leftLabel() ? -w * .85 : 0;
    this.pull.set(Math.max(min, Math.min(max, dx)));
  }

  protected up(): void {
    this.start = null;
    if (!this.dragging()) return;
    this.dragging.set(false);
    if (this.lit() >= this.ticks()) { this.pull.set(0); this.swipedRight.emit(); return; }
    if (this.leftGo()) { this.leave(); return; }
    this.pull.set(0);
  }

  protected reset(): void {
    this.start = null;
    this.dragging.set(false);
    this.pull.set(0);
  }

  /** A click that ends a swipe is not a click on the row's content. */
  private swallow(e: MouseEvent): void {
    if (this.swiped && !(e.target as HTMLElement).closest('.under')) { e.stopPropagation(); e.preventDefault(); this.swiped = false; }
  }

  protected fire(side: 'left' | 'right'): void {
    if (side === 'right') this.swipedRight.emit();
    else this.leave();
  }

  /** The row slides out, then says so; if the caller keeps the item, the row comes back. */
  private leave(): void {
    this.gone.set(true);
    this.pull.set(-this.width());
    setTimeout(() => {
      this.swipedLeft.emit();
      setTimeout(() => { this.gone.set(false); this.pull.set(0); }, 400);
    }, 300);
  }
}
