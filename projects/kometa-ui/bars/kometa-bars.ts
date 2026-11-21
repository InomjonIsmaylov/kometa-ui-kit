import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { KometaInView } from 'kometa-ui/motion';
import { chartColor, compactNumber, niceMax, niceScale, sparseLabels } from 'kometa-ui/scale';
import { KometaTip } from 'kometa-ui/tip';

/** One bar, or one group of bars when `value` is an array (one figure per series). */
export interface KometaBar {
  /** Under the bar; thinned out when there are many. */
  label: string;
  /** The figure; an array draws grouped bars, one per entry of `series`. A negative figure hangs below the zero line. */
  value: number | readonly number[];
  /** This bar's colour (single-series only), in place of `--bars-color`. */
  color?: string;
  /** A longer name for the tooltip and the data table in place of `label`, e.g. "17:00 – 17:15" under the tick "17:00". */
  note?: string;
}

/** A series of grouped bars: its name for the legend, tooltip and table, and its colour (the chart palette in turn when unset). */
export interface KometaBarSeries {
  name: string;
  color?: string;
}

const finite = (v: number) => (Number.isFinite(v) ? v : 0);
const figures = (b: KometaBar): readonly number[] => (typeof b.value === 'number' ? [finite(b.value)] : b.value.map(finite));

/**
 * A vertical bar chart in plain HTML boxes, so it fills any width: one bar per item, or a group per item when `value`
 * is an array. Bars grow from the baseline in turn the first time the chart is on screen. Round gridlines (`axis`), the
 * figure over each bar (`showValues`), a pinned "now" bar (`mark`, `markLabel`) and negative figures under a zero line.
 * Each column has a tooltip; the drawing is hidden from screen readers, which read a visually hidden table instead.
 *
 * CSS custom properties: `--bars-height` (plot height, 160px), `--bars-color` (single-series fill, `--amber`),
 * `--bars-gap` (between columns, 6px), `--bars-axis-width` (room for tick labels, 32px), `--bars-radius` (3px).
 *
 *     <k-bars [items]="[{ label: 'Mon', value: 12 }, { label: 'Tue', value: 18 }]" label="Visits per day" />
 */
@Component({
  selector: 'k-bars',
  imports: [KometaTip],
  hostDirectives: [KometaInView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.axis]': 'axis()', '[class.marked]': 'mark() >= 0' },
  styles: `
    :host { position: relative; display: block; min-width: 0; font-variant-numeric: tabular-nums; }
    .plot { position: relative; box-sizing: border-box; height: var(--bars-height, 160px); }
    :host(.axis) .plot, :host(.axis) .x { margin-left: var(--bars-axis-width, 32px); }
    .area { position: relative; height: 100%; }
    .grid { position: absolute; left: 0; right: 0; height: 0; border-top: 1px solid var(--border); }
    .grid.zero { border-top-color: var(--border2, var(--border)); }
    .grid b {
      position: absolute; right: calc(100% + 6px); top: -6px; color: var(--muted); font: 600 11px/1 var(--font-sans, sans-serif);
      white-space: nowrap;
    }
    .cols, .x { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: var(--bars-gap, 6px); }
    .cols { position: absolute; inset: 0; }
    .col { position: relative; display: flex; justify-content: center; gap: 2px; min-width: 0; }
    .grouped .col { padding: 0 8%; }
    .slot { position: relative; flex: 1; min-width: 0; max-width: var(--bars-max-width, 48px); }
    .bar {
      position: absolute; left: 0; right: 0; min-height: 2px; border-radius: var(--bars-radius, 3px) var(--bars-radius, 3px) 0 0;
      background: var(--bar-c, var(--bars-color, var(--amber))); transform-origin: bottom;
    }
    .bar.neg { border-radius: 0 0 var(--bars-radius, 3px) var(--bars-radius, 3px); transform-origin: top; }
    :host(.marked) .col:not(.mark) .bar { background: color-mix(in srgb, var(--bar-c, var(--bars-color, var(--amber))) 40%, transparent); }
    .cols:hover .col:not(:hover) .bar { opacity: .45; }
    .val {
      position: absolute; left: 50%; translate: -50% -4px; color: var(--text); font: 700 11px/1 var(--font-sans, sans-serif);
      white-space: nowrap;
    }
    .val.neg { translate: -50% calc(100% + 4px); }
    .mark::after {
      content: ''; position: absolute; inset: 0 auto 0 50%; border-left: 2px solid var(--red); opacity: .55; pointer-events: none;
    }
    /* --bg reads on --red in both schemes; a white pin did not in dark. */
    .pin {
      position: absolute; left: 50%; translate: -50% 0; z-index: 1; padding: 1px 6px; border-radius: 99px; background: var(--red);
      color: var(--bg); font: 700 10px/1.4 var(--font-sans, sans-serif); white-space: nowrap;
    }
    .x { margin-top: 6px; color: var(--muted); font: 600 11px/1 var(--font-sans, sans-serif); text-align: center; }
    .x span { min-width: 0; overflow: visible; white-space: nowrap; }
    .x .mark { color: var(--text); }
    .legend {
      display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 10px 0 0; padding: 0; list-style: none; color: var(--text2); font-size: 12px;
    }
    .legend li { display: flex; align-items: center; gap: 6px; }
    .legend i { width: 10px; height: 10px; border-radius: 2px; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

    @media (prefers-reduced-motion: no-preference) {
      .bar { transition: height .45s cubic-bezier(.22, 1, .36, 1), bottom .45s cubic-bezier(.22, 1, .36, 1), opacity .15s; }
      :host(:not(.k-seen)) .bar { transform: scaleY(0); }
      :host(:not(.k-seen)) :is(.val, .pin) { opacity: 0; }
      :host(.k-seen) .bar { animation: grow .6s calc(var(--i) * 40ms) cubic-bezier(.3, .8, .3, 1) both; }
      :host(.k-seen) :is(.val, .pin) { animation: fade .3s calc(var(--i) * 40ms + .4s) both; }
    }
    @keyframes grow { 0% { transform: scaleY(0); } 65% { transform: scaleY(1.06); } 100% { transform: scaleY(1); } }
    @keyframes fade { from { opacity: 0; } }
  `,
  template: `
    <div aria-hidden="true">
      <div class="plot" [style.padding-top.px]="room()">
        <div class="area">
          @if (axis()) {
            @for (g of grid(); track g.v) {
              <span class="grid" [class.zero]="!g.v" [style.bottom.%]="g.at"><b>{{ format()(g.v) }}</b></span>
            }
          } @else {
            <span class="grid zero" [style.bottom.%]="zero()"></span>
          }
          <div class="cols" [class.grouped]="grouped()" [style.--n]="groups().length">
            @for (g of groups(); track $index; let i = $index) {
              <div class="col" [class.mark]="i === mark()" [style.--i]="i" [kometaTip]="g.name" [kometaTipSub]="g.sub" [kometaTipDelay]="120">
                @for (b of g.bars; track $index) {
                  <span class="slot">
                    <i class="bar" [class.neg]="b.v < 0" [style.--bar-c]="b.color"
                       [style.bottom.%]="b.bottom" [style.height.%]="b.height"></i>
                    @if (showValues()) {
                      <b class="val" [class.neg]="b.v < 0" [style.bottom.%]="b.v < 0 ? b.bottom : b.bottom + b.height">{{ b.text }}</b>
                    }
                  </span>
                }
                @if (i === mark() && markLabel()) {
                  <span class="pin" [style.bottom]="'calc(100% + ' + (showValues() ? 18 : 2) + 'px)'">{{ markLabel() }}</span>
                }
              </div>
            }
          </div>
        </div>
      </div>
      <div class="x" [style.--n]="groups().length">
        @for (g of groups(); track $index) {
          <span [class.mark]="$index === mark()">{{ shown().has($index) ? g.label : '' }}</span>
        }
      </div>
      @if (grouped() && series().length > 1) {
        <ul class="legend">
          @for (s of legend(); track $index) { <li><i [style.background]="s.color"></i>{{ s.name }}</li> }
        </ul>
      }
    </div>
    <table class="sr">
      <caption>{{ label() }}</caption>
      @if (grouped()) {
        <thead><tr><td></td>@for (s of legend(); track $index) { <th scope="col">{{ s.name }}</th> }</tr></thead>
      }
      <tbody>
        @for (g of groups(); track $index) {
          <tr>
            <th scope="row">{{ g.name }}{{ $index === mark() && markLabel() ? ', ' + markLabel() : '' }}</th>
            @for (b of g.bars; track $index) { <td>{{ b.text }}</td> }
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class KometaBars {
  /** The bars, left to right. */
  readonly items = input.required<readonly KometaBar[]>();
  /** Names and colours for grouped bars (items whose `value` is an array), in the order of the figures. Shows a legend when there are two or more. */
  readonly series = input<readonly KometaBarSeries[]>([]);
  /** What the chart shows: the hidden table's caption, read by a screen reader in place of the drawing. */
  readonly label = input.required<string>();
  /** The top of the scale; a round number above the tallest bar when null. A bar over it is cut at the top. */
  readonly max = input<number | null>(null);
  /** Prints each figure over its bar (for a few bars; the tooltip has them otherwise). */
  readonly showValues = input(false, { transform: booleanAttribute });
  /** The index of a bar to highlight ("now"), or -1. The other bars turn dimmer. */
  readonly mark = input(-1);
  /** A small pin over the marked bar, e.g. "Now". */
  readonly markLabel = input('');
  /** Writes a figure for the axis, the bars, the tooltip and the table. Compact numbers ("1.2K") by default. */
  readonly format = input<(v: number) => string>((v) => compactNumber(v));
  /** Gridlines at round values with their labels on the left; false keeps only the baseline. */
  readonly axis = input(true, { transform: booleanAttribute });

  protected readonly grouped = computed(() => this.items().some((b) => typeof b.value !== 'number'));

  private readonly domain = computed(() => {
    const all = this.items().flatMap(figures);
    const top = Math.max(0, ...all);
    const bottom = Math.min(0, ...all);
    const max = this.max();
    return { lo: bottom < 0 ? -niceMax(-bottom) : 0, hi: max != null && max > 0 ? max : niceMax(top) };
  });

  /** Percent from the bottom of the plot, clamped to it. */
  private at(v: number): number {
    const { lo, hi } = this.domain();
    return ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100;
  }

  protected readonly zero = computed(() => this.at(0));

  protected readonly grid = computed(() => {
    const { lo, hi } = this.domain();
    const lines = niceScale(lo, hi, 4).ticks.filter((v) => v >= lo - 1e-9 && v <= hi + 1e-9);
    // The bottom of a negative scale is labelled even off-step, so hanging bars can be read.
    if (lo < 0 && lines[0] !== lo) lines.unshift(lo);
    return lines.map((v) => ({ v, at: this.at(v) }));
  });

  protected readonly legend = computed(() => {
    const n = Math.max(this.series().length, ...this.items().map((b) => figures(b).length));
    return Array.from({ length: this.grouped() ? n : 0 }, (_, i) => ({
      name: this.series()[i]?.name ?? '',
      color: this.series()[i]?.color ?? chartColor(i),
    }));
  });

  protected readonly groups = computed(() => {
    const f = this.format();
    const zero = this.zero();
    const grouped = this.grouped();
    const legend = this.legend();
    return this.items().map((item) => {
      const bars = figures(item).map((v, s) => {
        const p = this.at(v);
        return { v, text: f(v), bottom: Math.min(p, zero), height: Math.abs(p - zero), color: grouped ? legend[s]?.color : item.color };
      });
      const sub = grouped ? bars.map((b, s) => `${legend[s]?.name ? legend[s].name + ' ' : ''}${b.text}`).join(' · ') : bars[0].text;
      return { label: item.label, name: item.note || item.label, bars, sub };
    });
  });

  protected readonly shown = computed(() => sparseLabels(this.items().length, 7));

  /** Room above the plot for the figures and the pin. */
  protected readonly room = computed(() => 8 + (this.showValues() ? 16 : 0) + (this.mark() >= 0 && this.markLabel() ? 20 : 0));
}
