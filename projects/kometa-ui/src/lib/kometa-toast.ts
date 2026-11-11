import { KometaMotion } from './kometa-motion';
import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, effect, inject, input, output, signal, viewChild,
} from '@angular/core';

export type KometaToastKind = 'success' | 'error' | 'info' | 'warn';

export interface KometaToastItem {
  id: number;
  kind: KometaToastKind;
  text: string;
  /** Milliseconds on screen. */
  life: number;
}

const LEAVE_MS = 300;
/** A toast that was held under the pointer lingers at least this long after it is let go. */
const RESUME_MS = 1500;

/**
 * The short word that confirms a save or reports a failure. A thread of glass pills stacks up from the foot of the
 * page, in the browser's top layer so no drawer covers it; a hairline under each drains with the time it has left, and a
 * toast under the pointer waits. The caller owns the list: it passes `items` and removes an item on `(dismiss)`, which
 * fires when the time is up (after the leave) or the pill is pressed. An error is `role="alert"`, the rest `status`.
 * A page with a bottom bar of its own sets `--kometa-toast-lift` to the bar's height so the thread rides above it.
 * Spec: kometa-toast.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-8.html (Thread).
 */
@Component({
  selector: 'k-toast',
  hostDirectives: [{ directive: KometaMotion, inputs: ['animation'] }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .thread {
      inset: auto; left: 50%; bottom: calc(16px + var(--kometa-toast-lift, 0px) + env(safe-area-inset-bottom, 0px)); translate: -50% 0; margin: 0; padding: 0;
      width: max-content; max-width: calc(100vw - 24px); border: 0; background: none; overflow: visible; pointer-events: none;
      flex-direction: column-reverse; align-items: center; gap: var(--toast-gap, 8px);
    }
    .thread:popover-open { display: flex; }
    .thread.top { bottom: auto; top: calc(16px + var(--kometa-toast-lift, 0px) + env(safe-area-inset-top, 0px)); flex-direction: column; }
    .t {
      position: relative; display: flex; align-items: center; gap: 10px; max-width: 100%; padding: 10px 14px 12px 12px; overflow: hidden;
      border: 1px solid var(--glass-line); border-radius: var(--toast-radius, 12px); background: var(--toast-bg, var(--glass)); backdrop-filter: blur(12px);
      color: var(--display-ink, var(--text)); font-size: var(--toast-font-size, 14px); line-height: 1.35; box-shadow: 0 8px 22px rgba(0, 0, 0, .35);
      pointer-events: auto; cursor: pointer; animation: k-ts-in 520ms var(--ease-spring, ease) backwards;
    }
    .t.out { animation: k-ts-out 300ms ease forwards; }
    /* animation set: the chosen keyframes in, and the same ones reversed out */
    .t.m { animation: var(--k-anim) var(--k-motion-dur, 520ms) var(--k-motion-ease, var(--ease-spring, ease)) backwards; }
    .t.m.out { animation: var(--k-anim-out) 300ms ease var(--k-anim-dir) forwards; }
    .bar { flex: none; align-self: stretch; width: 3px; border-radius: 2px; background: var(--blue, currentColor); }
    .t.success .bar { background: var(--green, currentColor); }
    .t.error .bar { background: var(--red); }
    .t.warn .bar { background: var(--amber); }
    .text { overflow-wrap: anywhere; }
    .drain {
      position: absolute; left: 0; bottom: 0; width: 100%; height: 2px; background: var(--display-ink, var(--text)); opacity: .6;
      transform-origin: left; animation: k-ts-drain var(--life, 4000ms) linear forwards;
    }
    .t.hold .drain { animation-play-state: paused; }
    @keyframes k-ts-in { from { opacity: 0; transform: translateY(14px); } }
    @keyframes k-ts-out { to { opacity: 0; transform: translateY(6px) scale(.97); } }
    @keyframes k-ts-drain { to { transform: scaleX(0); } }
    @media (prefers-reduced-motion: reduce) { .t, .t.out, .t.m, .t.m.out { animation: none; } .t.out { opacity: 0; } .drain { animation: none; } }
  `,
  template: `
    <div #thread class="thread" [style]="motion.vars()" [class.top]="position() === 'top'" popover="manual" aria-live="polite">
      @for (it of items(); track it.id) {
        <div class="t" [class]="'t ' + it.kind" [class.m]="!!motion.animation()" [class.out]="leaving().has(it.id)" [class.hold]="held().has(it.id)"
             [attr.role]="it.kind === 'error' ? 'alert' : 'status'" (pointerenter)="hold(it.id)" (pointerleave)="release(it.id)" (click)="leave(it.id)">
          <span class="bar"></span>
          <span class="text">{{ it.text }}</span>
          <i class="drain" [style.--life.ms]="it.life"></i>
        </div>
      }
    </div>
  `,
})
export class KometaToast {
  /** The motion toasts arrive with (and leave with, reversed): a preset from KOMETA_ANIMATIONS or your own keyframes name. */
  protected readonly motion = inject(KometaMotion);
  readonly items = input.required<KometaToastItem[]>();
  readonly dismiss = output<number>();
  /** Which edge the thread stacks from. */
  readonly position = input<'bottom' | 'top'>('bottom');

  protected readonly leaving = signal<ReadonlySet<number>>(new Set());
  protected readonly held = signal<ReadonlySet<number>>(new Set());
  private readonly thread = viewChild.required<ElementRef<HTMLElement>>('thread');
  private readonly timers = new Map<number, { timer: ReturnType<typeof setTimeout>; due: number }>();

  constructor() {
    effect(() => {
      const items = this.items();
      const el = this.thread().nativeElement;
      // ponytail: the Popover API is baseline since 2024; an older engine shows the thread in flow.
      try {
        if (items.length) el.showPopover?.(); else el.hidePopover?.();
      } catch { /* already in that state */ }
      const ids = new Set(items.map((i) => i.id));
      for (const it of items) if (!this.timers.has(it.id)) this.arm(it.id, it.life);
      for (const [id, t] of this.timers) if (!ids.has(id)) { clearTimeout(t.timer); this.timers.delete(id); }
    });
    inject(DestroyRef).onDestroy(() => this.timers.forEach((t) => clearTimeout(t.timer)));
  }

  private arm(id: number, ms: number): void {
    this.timers.set(id, { timer: setTimeout(() => this.leave(id), ms), due: Date.now() + ms });
  }

  protected hold(id: number): void {
    const t = this.timers.get(id);
    if (!t) return;
    clearTimeout(t.timer);
    this.held.update((s) => new Set(s).add(id));
  }

  protected release(id: number): void {
    const t = this.timers.get(id);
    if (!t || !this.held().has(id)) return;
    this.held.update((s) => { const n = new Set(s); n.delete(id); return n; });
    this.arm(id, Math.max(RESUME_MS, t.due - Date.now()));
  }

  /** Plays the leave, then asks the caller to drop the item. */
  protected leave(id: number): void {
    if (this.leaving().has(id)) return;
    const t = this.timers.get(id);
    if (t) clearTimeout(t.timer);
    this.timers.delete(id);
    this.leaving.update((s) => new Set(s).add(id));
    setTimeout(() => {
      this.leaving.update((s) => { const n = new Set(s); n.delete(id); return n; });
      this.dismiss.emit(id);
    }, LEAVE_MS);
  }
}
