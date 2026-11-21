import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, signal } from '@angular/core';
import { KometaInView } from 'kometa-ui/motion';
import { KometaPoint, areaPath, chartColor, compactNumber, linePath, niceMax, niceScale, scale, sparseLabels, stack, ticks } from 'kometa-ui/scale';

/** One line of a `k-chart`. */
export interface KometaSeries {
  /** Shown in the legend, the readout and the hidden table. */
  name: string;
  /** One value per x label; a series shorter than the labels stops early (today so far against a full day). */
  values: readonly number[];
  /** Any CSS colour; a lone series takes `--chart-color` (amber), several take the chart palette in turn. */
  color?: string;
  /** Fill under the line. On by default for a lone series and for stacked areas, off otherwise. */
  area?: boolean;
  /** A thinner dashed line, for a comparison such as last year or a forecast. */
  dashed?: boolean;
}

/**
 * The y range of a chart and its gridlines: from 0 (or the lowest value when one is negative) to a round top, or fitted
 * to the data on round steps when `fit` is set (a band or a growth chart that should not start at 0). A given
 * `min` / `max` is kept exactly. Never flat, so no NaN for empty or all-equal data.
 */
export function chartDomain(values: readonly number[], min: number | null = null, max: number | null = null, fit = false): { min: number; max: number; ticks: number[] } {
  const lo0 = values.length ? Math.min(...values) : 0;
  const hi0 = values.length ? Math.max(...values) : 0;
  const lo = min ?? (fit ? lo0 : Math.min(0, lo0));
  const hi = fit ? hi0 : Math.max(0, hi0);
  if (max !== null) return { min: lo, max, ticks: ticks(lo, max, 4) };
  if (lo === 0) {
    const top = niceMax(hi);
    return { min: 0, max: top, ticks: ticks(0, top, 4) };
  }
  const nice = niceScale(lo, hi, 4);
  return min === null ? nice : { min, max: nice.max, ticks: [min, ...nice.ticks.filter((t) => t > min)] };
}

/**
 * A line or area chart over labelled points (days, hours, months): one series or several, optionally stacked, with a
 * shaded `band` (a normal range or a target), a dashed `limit` line (a capacity) and a pulsing `now` marker. It fills
 * its container's width and is `--chart-height` tall; the marks stretch, while the axis text, markers and readout are
 * HTML laid over them, so text never squashes. The line draws in and the areas rise the first time it is on screen.
 * Hovering, or the arrow keys (Home / End) once it has focus, move a crosshair whose readout gives the label and every
 * series' value. Screen readers get `label` and a hidden table of every value.
 *
 * CSS custom properties: `--chart-height` (220px), `--chart-color` (a lone series' colour, `--amber`), `--chart-axis`
 * (the y label gutter, 40px), `--chart-band` (`--green`), `--chart-limit` (`--red`), `--chart-area-opacity` (.16).
 *
 *     <k-chart label="Takings, last 7 days" [labels]="days" [series]="[{ name: 'Takings', values: takings }]" [format]="som" />
 */
@Component({
  selector: 'k-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [KometaInView],
  styles: `
    :host { position: relative; display: block; container-type: inline-size; font-variant-numeric: tabular-nums; }
    :where(.plot) {
      position: relative; height: var(--chart-height, 220px); margin: 18px 0 0 var(--chart-axis, 40px);
      border-radius: 4px; outline: none; touch-action: pan-y;
    }
    :where(.plot):focus-visible { outline: 2px solid var(--amber); outline-offset: 6px; }
    :where(svg) { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
    :where(.area) { opacity: var(--chart-area-opacity, .16); }
    :where(.band) {
      fill: color-mix(in srgb, var(--chart-band, var(--green)) 12%, transparent);
      stroke: color-mix(in srgb, var(--chart-band, var(--green)) 45%, transparent); stroke-width: 1px; stroke-dasharray: 3 3;
    }
    :where(.line) { fill: none; stroke-width: 2.25px; stroke-linejoin: round; stroke-linecap: round; }
    :where(.line.dashed) { stroke-width: 1.5px; stroke-dasharray: 5 4; opacity: .85; }

    :where(.grid) { position: absolute; left: 0; right: 0; height: 0; border-top: 1px dashed var(--border); pointer-events: none; }
    :where(.grid.base) { border-top-style: solid; }
    :where(.grid b) {
      position: absolute; right: calc(100% + 8px); top: 0; translate: 0 -50%;
      color: var(--muted); font: 500 11px/1 var(--font-sans, sans-serif); white-space: nowrap;
    }

    :where(.limit) { position: absolute; left: 0; right: 0; height: 0; border-top: 1.5px dashed var(--chart-limit, var(--red)); pointer-events: none; }
    :where(.limit b) {
      position: absolute; right: 0; bottom: 3px; padding: 2px 5px; border-radius: 4px; color: var(--chart-limit, var(--red));
      background: color-mix(in srgb, var(--chart-limit, var(--red)) 14%, transparent);
      font: 700 10px/1 var(--font-display, sans-serif); letter-spacing: .08em; text-transform: uppercase; white-space: nowrap;
    }

    :where(.now-line) { position: absolute; top: 0; bottom: 0; border-left: 1px dashed var(--text2); opacity: .6; pointer-events: none; }
    :where(.now) {
      position: absolute; width: 10px; height: 10px; margin: 0 0 -5px -5px; border-radius: 50%; pointer-events: none;
      background: var(--now-c); box-shadow: 0 0 0 3px var(--card);
    }
    :where(.now)::after { content: ''; position: absolute; inset: -6px; border: 2px solid var(--now-c); border-radius: 50%; opacity: 0; }
    :where(.now-tag) {
      position: absolute; top: -18px; translate: -50% 0; padding: 3px 6px; border-radius: 4px; pointer-events: none;
      background: var(--text); color: var(--card); font: 700 11px/1 var(--font-display, sans-serif); white-space: nowrap;
    }
    :where(.now-tag.first) { translate: 0 0; }
    :where(.now-tag.last) { translate: -100% 0; }

    :where(.cross) { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1px solid var(--border2, var(--border)); pointer-events: none; }
    :where(.dot) {
      position: absolute; width: 9px; height: 9px; margin: 0 0 -4.5px -4.5px; border-radius: 50%; pointer-events: none;
      box-shadow: 0 0 0 2px var(--card);
    }
    :where(.tip) {
      position: absolute; top: 0; z-index: 1; display: grid; gap: 4px; min-width: 96px; margin-left: 12px; padding: 7px 10px;
      border: 1px solid var(--border2, var(--border)); border-radius: 10px; background: var(--card); box-shadow: var(--shadow);
      color: var(--text); font-size: 12px; white-space: nowrap; pointer-events: none;
    }
    :where(.tip.flip) { translate: calc(-100% - 24px) 0; }
    :where(.tip small) { color: var(--muted); font-size: 11px; }
    :where(.tip span) { display: flex; align-items: center; gap: 6px; color: var(--text2); }
    :where(.tip span b) { margin-left: auto; padding-left: 10px; color: var(--text); }
    :where(.tip > b) { font: 700 15px/1.1 var(--font-display, sans-serif); }

    :where(.x) { position: relative; height: 14px; margin: 8px 0 0 var(--chart-axis, 40px); color: var(--muted); font: 500 11px/1 var(--font-sans, sans-serif); }
    :where(.x span) { position: absolute; top: 0; display: none; translate: -50% 0; white-space: nowrap; }
    :where(.x span.first) { translate: 0 0; }
    :where(.x span.last) { translate: -100% 0; }
    :where(.x span.w) { display: block; }
    @container (width < 420px) {
      :where(.x span.w) { display: none; }
      :where(.x span.n) { display: block; }
    }

    :where(.legend) {
      display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 12px 0 0; padding: 0; list-style: none;
      color: var(--text2); font-size: 12px;
    }
    :where(.legend li) { display: flex; align-items: center; gap: 6px; }
    :where(.legend i), :where(.tip i) { width: 14px; height: 0; border-top: 2.5px solid var(--c); border-radius: 2px; }
    :where(.legend i.dashed), :where(.tip i.dashed) { border-top-style: dashed; border-top-width: 2px; }

    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

    @media (prefers-reduced-motion: no-preference) {
      .lines { clip-path: inset(-12px -12px -12px -12px); transition: clip-path .9s cubic-bezier(.3, .7, .2, 1); }
      .areas { transform-origin: bottom; transition: opacity .6s .25s ease, transform .7s .25s var(--ease-spring, ease); }
      .limit, .now, .now-tag { transition: opacity .4s .8s ease; }
      :host(:not(.k-seen)) .lines { clip-path: inset(-12px 100% -12px -12px); }
      :host(:not(.k-seen)) .areas { opacity: 0; transform: scaleY(.6); }
      :host(:not(.k-seen)) :is(.limit, .now, .now-tag) { opacity: 0; }
      :host(.k-seen) .now::after { animation: k-chart-pulse 2s 1.2s ease-out infinite; }
    }
    @keyframes k-chart-pulse { from { opacity: .9; transform: scale(.5); } to { opacity: 0; transform: scale(2.2); } }
  `,
  template: `
    <div class="plot" tabindex="0" role="img" [attr.aria-label]="label()"
         (pointermove)="hover($event)" (pointerleave)="at.set(null)" (blur)="at.set(null)" (keydown)="key($event)">
      @for (t of domain().ticks; track $index) {
        <span class="grid" [class.base]="$first" [style.bottom.%]="pct()(t)" aria-hidden="true"><b>{{ format()(t) }}</b></span>
      }
      <svg class="areas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        @if (bandPath()) { <path class="band" [attr.d]="bandPath()" vector-effect="non-scaling-stroke" /> }
        @for (s of drawn(); track $index) {
          @if (s.area) { <path class="area" [attr.d]="s.area" [style.fill]="s.color" /> }
        }
      </svg>
      <svg class="lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        @for (s of drawn(); track $index) {
          <path class="line" [class.dashed]="s.dashed" [attr.d]="s.line" [style.stroke]="s.color" vector-effect="non-scaling-stroke" />
        }
      </svg>
      @if (limitAt(); as l) {
        <span class="limit" [style.bottom.%]="l.pct" aria-hidden="true"><b>{{ l.label }}</b></span>
      }
      @if (nowAt(); as nw) {
        <span class="now-line" [style.left.%]="nw.x" aria-hidden="true"></span>
        @if (nw.y !== null) { <span class="now" [style.left.%]="nw.x" [style.bottom.%]="nw.y" [style.--now-c]="nw.color" aria-hidden="true"></span> }
        <span class="now-tag" [class.first]="nw.x < 12" [class.last]="nw.x > 88" [style.left.%]="nw.x" aria-hidden="true">{{ nw.label }}</span>
      }
      @if (readout(); as r) {
        <span class="cross" [style.left.%]="r.x" aria-hidden="true"></span>
        @for (p of r.rows; track $index) {
          <i class="dot" [style.left.%]="r.x" [style.bottom.%]="p.y" [style.background]="p.color" aria-hidden="true"></i>
        }
        <div class="tip" [class.flip]="r.x > 60" [style.left.%]="r.x" aria-hidden="true">
          @if (r.label) { <small>{{ r.label }}</small> }
          @if (r.rows.length === 1 && series().length === 1) {
            <b>{{ r.rows[0].text }}</b>
          } @else {
            @for (p of r.rows; track $index) {
              <span><i [class.dashed]="p.dashed" [style.--c]="p.color"></i>{{ p.name }}<b>{{ p.text }}</b></span>
            }
          }
        </div>
      }
    </div>
    @if (xLabels().length) {
      <div class="x" aria-hidden="true">
        @for (t of xLabels(); track t.i) {
          <span [class.w]="t.w" [class.n]="t.n" [class.first]="t.left < 6" [class.last]="t.left > 94" [style.left.%]="t.left">{{ t.text }}</span>
        }
      </div>
    }
    @if (showLegend()) {
      <ul class="legend" aria-hidden="true">
        @for (s of drawn(); track $index) {
          <li><i [class.dashed]="s.dashed" [style.--c]="s.color"></i>{{ s.name }}</li>
        }
      </ul>
    }
    <table class="sr">
      <caption>{{ label() }}</caption>
      <thead><tr><td></td>@for (s of series(); track $index) { <th scope="col">{{ s.name }}</th> }</tr></thead>
      <tbody>
        @for (row of table(); track $index) {
          <tr><th scope="row">{{ row.label }}</th>@for (c of row.cells; track $index) { <td>{{ c }}</td> }</tr>
        }
      </tbody>
    </table>
    <span class="sr" aria-live="polite">{{ spoken() }}</span>
  `,
})
export class KometaChart {
  /** The lines to draw, bottom layer first when `stacked`. */
  readonly series = input.required<readonly KometaSeries[]>();
  /** One per point: the x axis (thinned so they never collide), the readout and the hidden table. */
  readonly labels = input<readonly string[]>([]);
  /** What the chart shows, read by a screen reader in place of the drawing and used as the hidden table's caption. */
  readonly label = input.required<string>();
  /** Stacks the series as areas, each on top of the one before it; the readout still gives each series' own value. */
  readonly stacked = input(false, { transform: booleanAttribute });
  /** The y axis bottom; 0 (or the lowest value when one is negative, or the data when there is a `band`) when null. */
  readonly min = input<number | null>(null);
  /** The y axis top; a round number above the data, the band and the limit when null. */
  readonly max = input<number | null>(null);
  /** A shaded `[low, high]` per point: a normal range or a target, which may change from point to point. */
  readonly band = input<readonly (readonly [number, number])[] | null>(null);
  /** A dashed horizontal line with its label, such as a capacity. */
  readonly limit = input<{ value: number; label: string } | null>(null);
  /** A vertical marker at a point index, with a pulsing dot on the first series and a label above it. */
  readonly now = input<{ index: number; label: string } | null>(null);
  /** Shows the series names under the chart; by default only when there are two or more series. */
  readonly legend = input<boolean | null>(null);
  /** How values print on the y axis, in the readout and in the table (`compactNumber` by default). */
  readonly format = input<(v: number) => string>(compactNumber);
  /** Added after each value in the readout and the table, as is: `' kg'`, `' min'`. */
  readonly unit = input('');

  /** The point under the crosshair, or null. */
  protected readonly at = signal<number | null>(null);
  /** True when the arrow keys moved the crosshair, so the live region reads it out. */
  private readonly keyed = signal(false);

  /** Points along x: the longest series or the labels. */
  protected readonly n = computed(() => Math.max(this.labels().length, ...this.series().map((s) => s.values.length)));
  private readonly x = computed(() => {
    const n = this.n();
    return (i: number) => (n > 1 ? (i * 100) / (n - 1) : 50);
  });
  /** Each series' plotted values: stacked tops, or the values themselves. */
  private readonly layers = computed(() => {
    const s = this.series();
    return this.stacked() ? stack(s.map((x) => x.values)) : s.map((x) => ({ top: [...x.values], floor: null as number[] | null }));
  });
  protected readonly domain = computed(() => {
    const all = [...this.layers().flatMap((l) => l.top), ...(this.band() ?? []).flat()];
    const limit = this.limit();
    if (limit) all.push(limit.value);
    return chartDomain(all, this.min(), this.max(), !!this.band()?.length);
  });
  /** Value → percent of the plot height from the bottom. */
  protected readonly pct = computed(() => scale(this.domain().min, this.domain().max, 0, 100));

  protected readonly drawn = computed(() => {
    const series = this.series();
    const x = this.x();
    const y = (v: number) => 100 - this.pct()(v);
    const { min, max } = this.domain();
    const base = y(Math.min(max, Math.max(min, 0)));
    return series.map((s, i) => {
      const layer = this.layers()[i];
      const top = layer.top.map((v, j): KometaPoint => [x(j), y(v)]);
      const area = s.area ?? (this.stacked() || series.length === 1);
      return {
        name: s.name,
        color: s.color ?? (series.length === 1 ? 'var(--chart-color, var(--amber))' : chartColor(i)),
        dashed: !!s.dashed,
        // A lone point gets a zero-length segment, which the round cap draws as a dot.
        line: linePath(top.length === 1 ? [top[0], top[0]] : top),
        area: area ? areaPath(top, layer.floor ? layer.floor.map((v, j): KometaPoint => [x(j), y(v)]) : base) : '',
        ys: layer.top.map((v) => this.pct()(v)),
      };
    });
  });

  protected readonly bandPath = computed(() => {
    const band = this.band();
    if (!band?.length) return '';
    const x = this.x();
    const y = (v: number) => 100 - this.pct()(v);
    return areaPath(band.map(([, hi], i): KometaPoint => [x(i), y(hi)]), band.map(([lo], i): KometaPoint => [x(i), y(lo)]));
  });

  protected readonly limitAt = computed(() => {
    const l = this.limit();
    return l ? { label: l.label, pct: Math.min(100, Math.max(0, this.pct()(l.value))) } : null;
  });

  protected readonly nowAt = computed(() => {
    const now = this.now();
    const n = this.n();
    if (!now || !n) return null;
    const i = Math.min(n - 1, Math.max(0, Math.round(now.index)));
    const s = this.drawn()[0];
    return { x: this.x()(i), y: s?.ys[i] ?? null, color: s?.color, label: now.label };
  });

  protected readonly readout = computed(() => {
    const i = this.at();
    if (i === null || i >= this.n()) return null;
    const f = this.format();
    return {
      x: this.x()(i),
      label: this.labels()[i] ?? '',
      rows: this.drawn()
        .map((s, k) => ({ ...s, value: this.series()[k].values[i] }))
        .filter((s) => s.value !== undefined)
        .map((s) => ({ name: s.name, color: s.color, dashed: s.dashed, y: s.ys[i], text: f(s.value) + this.unit() })),
    };
  });

  protected readonly spoken = computed(() => {
    const r = this.readout();
    if (!r || !this.keyed()) return '';
    return [r.label, r.rows.map((p) => (this.series().length > 1 ? `${p.name} ${p.text}` : p.text)).join(', ')].filter(Boolean).join(': ');
  });

  protected readonly xLabels = computed(() => {
    const labels = this.labels();
    const wide = sparseLabels(labels.length, 6);
    const narrow = sparseLabels(labels.length, 4);
    return [...new Set([...wide, ...narrow])].sort((a, b) => a - b)
      .map((i) => ({ i, text: labels[i], left: this.x()(i), w: wide.has(i), n: narrow.has(i) }));
  });

  protected readonly showLegend = computed(() => this.legend() ?? this.series().length > 1);

  protected readonly table = computed(() => {
    const f = this.format();
    return Array.from({ length: this.n() }, (_, i) => ({
      label: this.labels()[i] ?? String(i + 1),
      cells: this.series().map((s) => (s.values[i] === undefined ? '' : f(s.values[i]) + this.unit())),
    }));
  });

  protected hover(event: PointerEvent): void {
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const n = this.n();
    if (!n || !box.width) return;
    this.keyed.set(false);
    this.at.set(Math.min(n - 1, Math.max(0, Math.round(((event.clientX - box.left) / box.width) * (n - 1)))));
  }

  protected key(event: KeyboardEvent): void {
    const n = this.n();
    const i = this.at();
    const next = { ArrowRight: i === null ? 0 : i + 1, ArrowLeft: i === null ? n - 1 : i - 1, Home: 0, End: n - 1 }[event.key];
    if (!n || next === undefined) return;
    event.preventDefault();
    this.keyed.set(true);
    this.at.set(Math.min(n - 1, Math.max(0, next)));
  }
}
