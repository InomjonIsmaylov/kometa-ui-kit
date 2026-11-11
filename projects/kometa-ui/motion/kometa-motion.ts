import { CSP_NONCE, Directive, DOCUMENT, ElementRef, OnDestroy, afterNextRender, computed, inject, input, numberAttribute } from '@angular/core';

/** The built-in motions. Each is one `@keyframes k-m-<name>` that describes the hidden state, so it plays in forwards and out in reverse. */
export const KOMETA_ANIMATIONS = ['none', 'fade', 'rise', 'drop', 'left', 'right', 'scale', 'zoom', 'spring', 'flip', 'blur'] as const;
export type KometaAnimationPreset = (typeof KOMETA_ANIMATIONS)[number];
/** A preset, or the name of your own global `@keyframes` (written as its hidden state, `from { … }`). */
export type KometaAnimation = KometaAnimationPreset | (string & {});

const D = 'var(--k-motion-distance, 12px)';
const FRAMES: Record<Exclude<KometaAnimationPreset, 'none'>, string> = {
  fade: 'from { opacity: 0; }',
  rise: `from { opacity: 0; translate: 0 ${D}; }`,
  drop: `from { opacity: 0; translate: 0 calc(${D} * -1); }`,
  left: `from { opacity: 0; translate: calc(${D} * -2) 0; }`,
  right: `from { opacity: 0; translate: calc(${D} * 2) 0; }`,
  scale: 'from { opacity: 0; scale: .92; }',
  zoom: 'from { opacity: 0; scale: .5; }',
  spring: '0% { opacity: 0; scale: .6; } 60% { opacity: 1; scale: 1.06; } 100% { scale: 1; }',
  flip: 'from { opacity: 0; transform: perspective(700px) rotateX(-65deg); transform-origin: top; }',
  blur: 'from { opacity: 0; filter: blur(14px); scale: 1.04; }',
};
// Each preset twice: a browser does not restart an animation whose name did not change, so the way out needs its own name.
const KEYFRAMES = `@layer components {\n${Object.entries(FRAMES)
  .map(([n, f]) => `@keyframes k-m-${n} { ${f} }\n@keyframes k-m-${n}-out { ${f} }`).join('\n')}\n}`;

/** `'fade'` → `'k-m-fade'`; your own keyframes name passes through; empty → null (keep the component's own motion). */
export function kometaAnimationName(a: string | null | undefined): string | null {
  if (!a) return null;
  return a === 'none' ? 'none' : (KOMETA_ANIMATIONS as readonly string[]).includes(a) ? `k-m-${a}` : a;
}

/**
 * The custom properties a component reads. A preset plays in, and its `-out` twin plays reversed on the way out.
 * Your own keyframes: `'my-in'` plays in only; `'my-in my-out'` names a second keyframes (written forwards) for the way out.
 */
export function kometaMotionVars(a: string | null | undefined): Record<string, string> {
  const [enter, leave] = (a ?? '').trim().split(/\s+/);
  const n = kometaAnimationName(enter);
  if (!n) return {};
  if (n === 'none' || n.startsWith('k-m-')) return { '--k-anim': n, '--k-anim-out': n === 'none' ? 'none' : `${n}-out`, '--k-anim-dir': 'reverse' };
  return { '--k-anim': n, '--k-anim-out': leave ?? 'none', '--k-anim-dir': 'normal' };
}

/** Puts the preset keyframes in the document once; component styles are scoped, so shared keyframes must be global. */
export function injectKometaMotion(): void {
  const doc = inject(DOCUMENT);
  if (doc.getElementById('kometa-motion')) return;
  const style = doc.createElement('style');
  style.id = 'kometa-motion';
  const nonce = inject(CSP_NONCE, { optional: true });
  if (nonce) style.nonce = nonce;
  style.textContent = KEYFRAMES;
  doc.head.appendChild(style);
}

/**
 * The `animation` input of every animated component (a host directive). It does not touch the host: the component
 * binds `vars()` (see kometaMotionVars) on the element that moves, which reads `--k-anim` (in) and `--k-anim-out` with `--k-anim-dir` (out).
 * Left empty, the component keeps its own motion; `--k-anim` set in your CSS (say on `:root`) changes it app-wide.
 * Duration and easing are `--k-motion-dur` and `--k-motion-ease`, the travel of the sliding presets `--k-motion-distance`.
 */
@Directive({ selector: '[kometaMotion]' })
export class KometaMotion {
  readonly animation = input<KometaAnimation | ''>('');
  readonly vars = computed<Record<string, string>>(() => kometaMotionVars(this.animation()));

  constructor() {
    injectKometaMotion();
  }
}

/**
 * Plays a motion on any element, once: as it renders (`kAnimateOn="enter"`, the default) or the first time it scrolls
 * into view (`"view"`). `kAnimate` takes a preset or your own keyframes name; `kAnimateDelay` and `kAnimateDuration`
 * are milliseconds, so a list can stagger with `[kAnimateDelay]="$index * 60"`. `replay()` (exported as `kAnimate`)
 * plays it again. Reduced motion skips it.
 *
 *     <section kAnimate="rise" kAnimateOn="view">…</section>
 */
@Directive({
  selector: '[kAnimate]',
  exportAs: 'kAnimate',
  host: {
    '[style.animation-name]': 'name()',
    '[style.animation-duration.ms]': 'duration()',
    '[style.animation-delay.ms]': 'delay()',
    '[style.animation-timing-function]': '"var(--k-motion-ease, cubic-bezier(.22, 1, .36, 1))"',
    '[style.animation-fill-mode]': '"backwards"',
  },
})
export class KometaAnimate implements OnDestroy {
  readonly kAnimate = input<KometaAnimation | ''>('');
  readonly kAnimateOn = input<'enter' | 'view'>('enter');
  readonly kAnimateDelay = input(0, { transform: numberAttribute });
  readonly kAnimateDuration = input(600, { transform: numberAttribute });
  protected readonly name = computed(() => kometaAnimationName((this.kAnimate() || 'rise').trim().split(/\s+/)[0]));
  protected readonly delay = computed(() => this.kAnimateDelay());
  protected readonly duration = computed(() => this.kAnimateDuration());
  private readonly el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private io?: IntersectionObserver;

  constructor() {
    injectKometaMotion();
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) this.el.style.setProperty('animation', 'none', 'important');
    afterNextRender(() => {
      if (this.kAnimateOn() !== 'view' || typeof IntersectionObserver === 'undefined') return;
      // Held on its first frame (the hidden state, thanks to the backwards fill) until it is seen.
      this.el.style.animationPlayState = 'paused';
      this.io = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        this.el.style.animationPlayState = '';
        this.io?.disconnect();
      }, { threshold: 0.15 });
      this.io.observe(this.el);
    });
  }

  replay(): void {
    for (const a of this.el.getAnimations?.() ?? []) if (a instanceof CSSAnimation) { a.cancel(); a.play(); }
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
  }
}
