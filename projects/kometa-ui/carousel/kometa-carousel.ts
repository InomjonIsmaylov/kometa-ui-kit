import {
  ChangeDetectionStrategy, Component, Directive, ViewEncapsulation, booleanAttribute, computed, contentChildren, inject, input, model,
  signal,
} from '@angular/core';

/** One slide of a `k-carousel`: `<div kSlide>…</div>`. Off-screen slides are inert. */
@Directive({
  selector: '[kSlide]',
  host: {
    role: 'group',
    'aria-roledescription': 'slide',
    '[attr.aria-label]': 'label()',
    '[attr.inert]': 'active() ? null : ""',
  },
})
export class KometaSlide {
  private readonly carousel = inject(KometaCarousel);
  private readonly at = computed(() => this.carousel.slides().indexOf(this));
  protected readonly label = computed(() => `${this.at() + 1} / ${this.carousel.slides().length}`);
  protected readonly active = computed(() => this.carousel.index() === this.at());
}

/**
 * Slides in a row, one in view, with a row of ticks under them as the pager: the current tick stands tall
 * and cream, like `k-meter`. With `edges` (on by default) a click on the left or right third of the slide
 * goes back or forward, and a thin chevron shows on that side while the pointer is there. Clicks on a link,
 * button or field inside a slide are left alone. Focused, the arrow keys move too.
 * Tests in kometa-carousel.spec.ts.
 */
@Component({
  selector: 'k-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // None, so the track can size the projected slides; :where() keeps it at zero specificity.
  encapsulation: ViewEncapsulation.None,
  styles: `
    :where(k-carousel) { display: block; }
    :where(k-carousel) .kc-view { position: relative; overflow: hidden; border-radius: var(--carousel-radius, 16px); }
    :where(k-carousel) .kc-track { display: flex; transition: transform .5s var(--ease-spring, ease); }
    :where(k-carousel) .kc-track > * { flex: 0 0 100%; min-width: 0; }
    :where(k-carousel) .kc-view[data-side] { cursor: pointer; }
    :where(k-carousel) .kc-view::before, :where(k-carousel) .kc-view::after {
      position: absolute;
      top: 50%;
      z-index: 1;
      color: var(--display-ink, #f4efe6);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
      opacity: 0;
      pointer-events: none;
      transition: opacity .25s, transform .35s var(--ease-spring, ease);
    }
    :where(k-carousel) .kc-view::before { content: '‹'; left: 12px; transform: translate(6px, -50%); }
    :where(k-carousel) .kc-view::after { content: '›'; right: 12px; transform: translate(-6px, -50%); }
    :where(k-carousel) .kc-view[data-side='prev']::before, :where(k-carousel) .kc-view[data-side='next']::after {
      opacity: 1;
      transform: translate(0, -50%);
    }
    :where(k-carousel) .kc-ticks { display: flex; align-items: flex-end; gap: 4px; height: 16px; margin-top: 10px; }
    :where(k-carousel) .kc-ticks button {
      width: var(--carousel-tick, 14px);
      height: 100%;
      padding: 0;
      border: 0;
      border-radius: 2px;
      background: var(--carousel-off, var(--glass-line));
      transform: scaleY(.3);
      transform-origin: bottom;
      cursor: pointer;
      transition: background .3s, transform .3s var(--ease-spring, ease);
    }
    :where(k-carousel) .kc-ticks button[aria-current] { background: var(--carousel-on, var(--display-ink, #f4efe6)); transform: none; }
    :where(k-carousel) .kc-ticks button:focus-visible, :where(k-carousel):focus-visible { outline: 2px solid var(--amber); outline-offset: 3px; }
    @media (prefers-reduced-motion: reduce) {
      :where(k-carousel) .kc-track, :where(k-carousel) .kc-ticks button, :where(k-carousel) .kc-view::before,
      :where(k-carousel) .kc-view::after { transition: none; }
    }
  `,
  template: `
    <div class="kc-view" [attr.data-side]="side() || null" (click)="edge($event)" (pointermove)="aim($event)" (pointerleave)="side.set('')">
      <div class="kc-track" [style.transform]="'translateX(' + index() * -100 + '%)'"><ng-content /></div>
    </div>
    @if (slides().length > 1) {
      <div class="kc-ticks">
        @for (s of slides(); track $index; let i = $index) {
          <button type="button" [attr.aria-label]="slideLabel() + ' ' + (i + 1)" [attr.aria-current]="i === index() || null"
                  (click)="go(i)"></button>
        }
      </div>
    }
  `,
  host: {
    role: 'region',
    'aria-roledescription': 'carousel',
    tabindex: '0',
    '[attr.aria-label]': 'ariaLabel() || null',
    '(keydown)': 'key($event)',
  },
})
export class KometaCarousel {
  /** The slide in view, from 0. */
  readonly index = model(0);
  /** Click the left or right third of the slide to go back or forward. */
  readonly edges = input(true, { transform: booleanAttribute });
  readonly ariaLabel = input('');
  /** Read before each tick's number: "Slide 2". */
  readonly slideLabel = input('Slide');

  readonly slides = contentChildren(KometaSlide);
  protected readonly side = signal<'' | 'prev' | 'next'>('');

  protected go(i: number): void {
    this.index.set(Math.min(this.slides().length - 1, Math.max(0, i)));
  }

  /** Which third the pointer is in, or '' where there is nothing to go to. */
  private sideAt(e: MouseEvent): '' | 'prev' | 'next' {
    if (!this.edges() || (e.target as Element).closest('a, button, input, select, textarea, label')) return '';
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (!r.width) return '';
    const p = (e.clientX - r.left) / r.width;
    if (p < 1 / 3 && this.index() > 0) return 'prev';
    if (p > 2 / 3 && this.index() < this.slides().length - 1) return 'next';
    return '';
  }

  protected aim(e: PointerEvent): void {
    this.side.set(this.sideAt(e));
  }

  protected edge(e: MouseEvent): void {
    const side = this.sideAt(e);
    if (side) this.go(this.index() + (side === 'next' ? 1 : -1));
    // The chevron moves with the pointer only; recheck it once the slide has moved.
    this.side.set(this.sideAt(e));
  }

  protected key(e: KeyboardEvent): void {
    if (e.target !== e.currentTarget && !(e.target as Element).closest('.kc-ticks')) return;
    if (e.key === 'ArrowLeft') this.go(this.index() - 1);
    else if (e.key === 'ArrowRight') this.go(this.index() + 1);
    else return;
    e.preventDefault();
  }
}
