import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

export interface KometaShareSegment {
  label: string;
  /** The amount in whatever unit the caller counts in; a negative one is listed but not drawn. */
  value: number;
  /** The amount as the caller writes it ("6 200 000 so'm"). The component formats nothing. */
  text: string;
  /** Any CSS colour, normally a token: `var(--viz-1)`. */
  color: string;
}

const TICKS = 48;

/**
 * One bar of how a whole divides, drawn as ticks: every slice is a run of ticks in its own colour, as
 * `kometa-meter` draws its units. A legend under it lists every slice with its share and amount, so a
 * slice too thin to see and a negative one the bar cannot draw are both still read. The legend is the
 * truth, the colour is decoration. Hovering a legend row steps the other rows back.
 * Read-only. `label` is the bar's accessible name.
 * Spec: kometa-share.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-7.html (Ticks).
 */
@Component({
  selector: 'kometa-share',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .ticks { display: flex; gap: var(--share-gap, 2px); height: var(--share-height, 22px); }
    .ticks i { flex: 1; border-radius: 1px; background: var(--k, var(--glass-line)); opacity: .85; }
    .ticks.none i { opacity: 1; }
    .legend { display: flex; flex-direction: column; gap: 2px; margin: 8px 0 0; }
    .legend > div { display: flex; align-items: baseline; gap: 8px; padding: 4px 0; transition: opacity 200ms ease; }
    .legend:has(> div:hover) > div:not(:hover) { opacity: .45; }
    .legend .zero { opacity: .6; }
    dt { display: flex; align-items: baseline; gap: 8px; color: var(--muted); font-size: var(--t-sm, 14px); }
    dt i { flex: none; width: 8px; height: 8px; border-radius: 2px; background: var(--k); }
    dt em { min-width: 3ch; font-size: 12px; font-style: normal; text-align: right; }
    dd { margin: 0 0 0 auto; color: var(--display-ink, var(--text)); font-weight: var(--w-semi, 600); font-variant-numeric: tabular-nums; }
    dd.negative { color: var(--red); }
    @media (prefers-reduced-motion: reduce) { .legend > div { transition: none; } }
  `,
  template: `
    <div class="ticks" [class.none]="none()" role="img" [attr.aria-label]="label()">
      @for (c of ticks(); track $index) {
        <i [style.--k]="c"></i>
      }
    </div>
    @if (legend()) {
    <dl class="legend">
      @for (s of segments(); track s.label) {
        <div [class.zero]="s.value === 0">
          <dt><i [style.--k]="s.color" aria-hidden="true"></i>{{ s.label }}@if (percents()) { <em>{{ percent(s) }}</em> }</dt>
          <dd [class.negative]="s.value < 0">{{ s.text }}</dd>
        </div>
      }
    </dl>
    }
  `,
})
export class KometaShare {
  readonly segments = input.required<KometaShareSegment[]>();
  readonly label = input.required<string>();
  /** The list of slices under the bar. */
  readonly legend = input(true, { transform: booleanAttribute });
  /** The share ("42%") in each legend row. */
  readonly percents = input(true, { transform: booleanAttribute });
  /** How many ticks the bar is made of. */
  readonly tickCount = input(TICKS);

  private readonly total = computed(() => this.segments().reduce((sum, s) => sum + Math.max(0, s.value), 0));
  protected readonly none = computed(() => this.total() === 0);
  /** One colour per tick; a slice above zero always gets at least one, so a thin one is still a mark. */
  protected readonly ticks = computed(() => {
    const total = this.total();
    const n = Math.max(1, Math.floor(this.tickCount()));
    if (total === 0) return Array.from({ length: n }, () => '');
    return this.segments().flatMap((s) => {
      if (s.value <= 0) return [];
      return Array.from({ length: Math.max(1, Math.round((s.value / total) * n)) }, () => s.color);
    });
  });

  protected percent(s: KometaShareSegment): string {
    const total = this.total();
    return total > 0 && s.value > 0 ? `${Math.round((s.value / total) * 100)}%` : '';
  }
}
