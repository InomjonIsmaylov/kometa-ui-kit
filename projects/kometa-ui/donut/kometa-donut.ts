import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, signal } from '@angular/core';
import { KometaInView } from 'kometa-ui/motion';
import { arcs, chartColor, compactNumber } from 'kometa-ui/scale';

/** One slice of a donut. */
export interface KometaDonutItem {
  label: string;
  /** Negative values count as 0. */
  value: number;
  /** The slice colour; the chart palette in turn when unset. */
  color?: string;
}

/**
 * A ring of shares with a legend that names every slice, so colour is never the only key. The middle shows the total
 * and `caption`, or whatever you project there; pointing at a slice or its legend row puts that slice's figure and
 * share in the middle and dims the rest. The arcs sweep in one after another the first time it is on screen. Under
 * 400px of width the legend moves under the ring.
 *
 * CSS custom properties: `--donut-size` (the ring's largest width, 168px), `--donut-stroke` (14, in a 120-unit box),
 * `--donut-gap` (between ring and legend, 20px), `--donut-total-size` (15px).
 *
 *     <k-donut [items]="[{ label: 'Haircut', value: 42 }, { label: 'Colour', value: 18 }]" label="Visits by service" caption="visits" />
 */
@Component({
  selector: 'k-donut',
  hostDirectives: [KometaInView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.no-legend]': '!legend()' },
  styles: `
    :host { display: block; min-width: 0; container-type: inline-size; font-variant-numeric: tabular-nums; }
    .wrap {
      display: grid; grid-template-columns: minmax(120px, var(--donut-size, 168px)) minmax(0, 1fr); gap: var(--donut-gap, 20px); align-items: center;
    }
    :host(.no-legend) .wrap { grid-template-columns: minmax(0, var(--donut-size, 168px)); justify-content: center; }
    .ring { position: relative; }
    svg { display: block; width: 100%; height: auto; rotate: -90deg; }
    circle { fill: none; stroke-width: var(--donut-stroke, 14); }
    .track { stroke: var(--input, var(--border)); }
    .seg { transition: opacity .2s, stroke-width .2s; }
    .seg.hot { stroke-width: calc(var(--donut-stroke, 14) + 3); }
    .dim { opacity: .35; }
    .mid { position: absolute; inset: 0; display: grid; place-content: center; gap: 2px; text-align: center; pointer-events: none; }
    .mid > * { grid-area: 1 / 1; }
    .mid [hidden] { display: block; visibility: hidden; }
    .sum { display: grid; gap: 2px; justify-items: center; }
    .sum b { font: 700 var(--donut-total-size, 15px)/1.1 var(--font-display, 'Syne', sans-serif); letter-spacing: -.02em; }
    .sum span { max-width: 96px; color: var(--muted); font-size: 10px; line-height: 1.25; }
    .legend { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; font-size: 13px; }
    .legend li { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto 38px; gap: 8px; align-items: center; transition: opacity .2s; }
    .legend i { width: 10px; height: 10px; border-radius: 3px; }
    .name { overflow: hidden; color: var(--text2, var(--text)); text-overflow: ellipsis; white-space: nowrap; }
    .val { white-space: nowrap; }
    .pct { color: var(--muted); text-align: right; }
    @container (width < 400px) {
      .wrap { grid-template-columns: minmax(0, 1fr); justify-items: center; }
      .ring { width: min(100%, var(--donut-size, 168px)); }
      .legend { width: 100%; }
    }
    @media (prefers-reduced-motion: no-preference) {
      /* !important: the final dash is an inline style. */
      :host(:not(.k-seen)) .seg { stroke-dasharray: 0 100 !important; }
      :host(.k-seen) .seg { animation: k-donut-sweep .55s cubic-bezier(.3, .7, .3, 1) backwards; }
    }
    @keyframes k-donut-sweep { from { stroke-dasharray: 0 100; } }
  `,
  template: `
    <div class="wrap">
      <div class="ring">
        <svg viewBox="0 0 120 120" role="img" [attr.aria-label]="label()">
          <circle class="track" cx="60" cy="60" r="48" />
          @for (s of slices(); track $index) {
            <circle class="seg" cx="60" cy="60" r="48" pathLength="100" [style.stroke]="s.color"
                    [style.stroke-dasharray]="s.size + ' ' + s.rest" [style.stroke-dashoffset]="-s.start"
                    [style.animation-delay.ms]="s.start * 7" [class.hot]="active() === $index" [class.dim]="active() !== null && active() !== $index"
                    (pointerenter)="active.set($index)" (pointerleave)="active.set(null)" />
          }
        </svg>
        <div class="mid" aria-hidden="true">
          @if (focus(); as f) { <div class="sum"><b>{{ format()(f.value) }}</b><span>{{ f.label }} · {{ f.pct }}%</span></div> }
          <div [hidden]="!!focus()">
            <ng-content><div class="sum"><b>{{ format()(total()) }}</b>@if (caption()) { <span>{{ caption() }}</span> }</div></ng-content>
          </div>
        </div>
      </div>
      @if (legend()) {
        <ul class="legend">
          @for (s of slices(); track $index) {
            <li [class.dim]="active() !== null && active() !== $index" (pointerenter)="active.set($index)" (pointerleave)="active.set(null)">
              <i [style.background]="s.color" aria-hidden="true"></i>
              <span class="name">{{ s.label }}</span>
              <span class="val">{{ format()(s.value) }}</span>
              <span class="pct">{{ s.pct }}%</span>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class KometaDonut {
  readonly items = input.required<readonly KometaDonutItem[]>();
  /** Names the chart for a screen reader ("Visits by service"); the legend gives the figures. */
  readonly label = input.required<string>();
  /** Under the total in the middle ("visits this week"). */
  readonly caption = input('');
  /** Turns a figure into text, for the middle and the legend. */
  readonly format = input<(v: number) => string>((v) => compactNumber(v));
  /** False hides the legend; then put the key somewhere else, as the colours alone name nothing. */
  readonly legend = input(true, { transform: booleanAttribute });

  protected readonly active = signal<number | null>(null);
  protected readonly total = computed(() => this.items().reduce((a, s) => a + Math.max(0, s.value || 0), 0));
  protected readonly slices = computed(() => {
    const values = this.items().map((s) => Math.max(0, s.value || 0));
    const geo = arcs(values, values.filter((v) => v > 0).length > 1 ? 0.8 : 0);
    const total = this.total();
    return this.items().map((s, i) => ({
      label: s.label, value: values[i], color: s.color ?? chartColor(i), start: geo[i].start, size: geo[i].size, rest: Math.round((100 - geo[i].size) * 100) / 100,
      pct: total ? Math.round((values[i] / total) * 100) : 0,
    }));
  });
  protected readonly focus = computed(() => {
    const i = this.active();
    return i === null ? null : this.slices()[i] ?? null;
  });
}
