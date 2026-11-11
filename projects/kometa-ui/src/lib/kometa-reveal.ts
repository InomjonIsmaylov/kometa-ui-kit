import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

const TICKS = 21;
const STEP = 100 / (TICKS - 1);

/**
 * A before and an after photo in one frame. A plain line crosses the photo; the control is a row of ticks beneath it,
 * the ticks up to the line are cream and the one under it is tall. Drag along the ticks
 * (or across the photo), or focus the ticks and use the arrow keys (Shift = 4 steps), Home and End. `position` is the
 * share of the frame, 0 to 100, in steps of 5, that shows the before photo; it is a model.
 * Spec: kometa-reveal.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-8.html (Ticks).
 */
@Component({
  selector: 'k-reveal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.--p]': "position() + '%'", '[style.--reveal-ratio]': 'aspectRatio()' },
  styles: `
    :host { display: flex; flex-direction: column; gap: 8px; }
    .frame { position: relative; aspect-ratio: var(--reveal-ratio, 1); overflow: hidden; border-radius: inherit; touch-action: pan-y; user-select: none; cursor: ew-resize; }
    .frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
    .after { clip-path: inset(0 0 0 var(--p)); }
    .line { position: absolute; top: 0; bottom: 0; left: var(--p); width: 1px; background: var(--display-ink, #fff); opacity: .8; pointer-events: none; }
    .ticks { display: flex; gap: 2px; height: var(--reveal-ticks-height, 30px); align-items: flex-end; cursor: pointer; touch-action: none; }
    .ticks:focus-visible { outline: 2px solid var(--amber); outline-offset: 4px; }
    .ticks i { flex: 1; height: 40%; border-radius: 1px; background: var(--glass-line); transition: background-color 160ms ease, height 240ms var(--ease-spring, ease); }
    .ticks i.on { height: 70%; background: var(--display-ink, var(--text)); }
    .ticks i.cur { height: 100%; }
    .ends { display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); }
    @media (pointer: coarse) { .ticks { height: 44px; } }
    @media (prefers-reduced-motion: reduce) { .ticks i { transition: none; } }
  `,
  template: `
    <div class="frame" (pointerdown)="down($event)" (pointermove)="move($event)" (pointerup)="up()" (pointercancel)="up()">
      <img [src]="before()" [attr.alt]="beforeLabel()" loading="lazy" />
      <img class="after" [src]="after()" [attr.alt]="afterLabel()" loading="lazy" />
      <span class="line"></span>
    </div>
    <div class="ticks" role="slider" tabindex="0" [attr.aria-label]="ariaLabel() || null" aria-valuemin="0" aria-valuemax="100"
         [attr.aria-valuenow]="position()" [attr.aria-valuetext]="valueText()"
         (pointerdown)="down($event)" (pointermove)="move($event)" (pointerup)="up()" (pointercancel)="up()" (keydown)="onKey($event)">
      @for (t of ticks; track t) { <i [class.on]="t <= index()" [class.cur]="t === index()"></i> }
    </div>
    @if (showLabels()) { <div class="ends"><span>{{ beforeLabel() }}</span><span>{{ afterLabel() }}</span></div> }
  `,
})
export class KometaReveal {
  readonly before = input.required<string>();
  readonly after = input.required<string>();
  readonly beforeLabel = input('Before');
  readonly afterLabel = input('After');
  readonly ariaLabel = input('');
  /** The frame's CSS aspect-ratio (`4 / 3`, `1`). */
  readonly aspectRatio = input('1');
  /** The Before / After words under the ticks. */
  readonly showLabels = input(true);
  readonly position = model(50);

  protected readonly ticks = Array.from({ length: TICKS }, (_, i) => i);
  protected readonly index = computed(() => Math.round(this.position() / STEP));
  protected readonly valueText = computed(() => `${this.beforeLabel()} ${this.position()}%, ${this.afterLabel()} ${100 - this.position()}%`);
  private readonly dragging = signal(false);

  private put(p: number): void {
    this.position.set(Math.round(Math.min(100, Math.max(0, p)) / STEP) * STEP);
  }

  private at(e: PointerEvent): number {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return r.width ? ((e.clientX - r.left) / r.width) * 100 : 50;
  }

  protected down(e: PointerEvent): void {
    this.dragging.set(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    this.put(this.at(e));
  }

  protected move(e: PointerEvent): void {
    if (this.dragging()) this.put(this.at(e));
  }

  protected up(): void {
    this.dragging.set(false);
  }

  protected onKey(e: KeyboardEvent): void {
    const by = (e.shiftKey ? 4 : 1) * STEP, v = this.position();
    const to = { ArrowLeft: v - by, ArrowDown: v - by, ArrowRight: v + by, ArrowUp: v + by, Home: 0, End: 100 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    this.put(to);
  }
}
