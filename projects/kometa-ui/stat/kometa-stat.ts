import { KometaSkeleton } from 'kometa-ui/skeleton';
import { KometaTally } from 'kometa-ui/tally';
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

/**
 * A KPI tile: an uppercase muted eyebrow, a big figure with its unit, an optional trend ("▲ 12% vs last week",
 * green when it moves the good way) and a muted sub line, on a card surface. A number counts up through
 * `k-tally`; a string shows as is; null shows no figure (put a `k-meter` or `k-split` in the content instead).
 * An element with the `k-stat-note` attribute (a `<k-note>`) sits beside the eyebrow; anything else (a
 * `k-spark`) goes under the sub line. `loading` holds the figure's place with a `k-skeleton`. A screen reader
 * hears the figure, its unit, then the trend as "+12% vs last week" (the arrow glyph is hidden).
 *
 *     <k-stat label="Revenue" [value]="48200000" unit="so'm" [trend]="12" trendLabel="vs last week" locale="ru-RU">
 *       <k-note k-stat-note label="About revenue">Closed checks, after discounts.</k-note>
 *       <k-spark [values]="run" label="Revenue, last 14 days" />
 *     </k-stat>
 *
 * CSS vars: `--stat-bg`, `--stat-border`, `--stat-radius`, `--stat-pad`, `--stat-gap`, `--stat-label-color`,
 * `--stat-figure-size`, `--stat-up` / `--stat-down` (the good and bad trend colours).
 * Tests in kometa-stat.spec.ts.
 */
@Component({
  selector: 'k-stat',
  imports: [KometaTally, KometaSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.bare]': 'bare()', '[attr.aria-busy]': 'loading() || null' },
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--stat-gap, 8px);
      min-width: 0;
      box-sizing: border-box;
      padding: var(--stat-pad, 20px);
      border: 1px solid var(--stat-border, var(--border));
      border-radius: var(--stat-radius, var(--r-card, 16px));
      background: var(--stat-bg, var(--card));
      color: var(--text);
    }
    :host(.bare) { padding: 0; border: 0; border-radius: 0; background: none; }
    .label {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      color: var(--stat-label-color, var(--muted));
      font-size: var(--t-xs, 12px);
      font-weight: var(--w-bold, 700);
      letter-spacing: var(--track-label, .08em);
      text-transform: uppercase;
    }
    .fig {
      display: flex;
      align-items: baseline;
      gap: 8px;
      min-height: 1.1em;
      margin: 0;
      color: var(--display-ink, var(--text));
      font: 700 var(--stat-figure-size, 30px) / 1.1 var(--font-display, 'Syne'), sans-serif;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.03em;
      overflow-wrap: anywhere;
    }
    .fig k-tally { --tally-size: var(--stat-figure-size, 30px); }
    .unit { color: var(--muted); font: 600 13px var(--font-sans, inherit); letter-spacing: 0; }
    .fig k-skeleton { flex: 1; align-self: center; }
    .trend { margin: 0; color: var(--muted); font-size: var(--t-xs, 12px); font-weight: 500; }
    .trend b { font-weight: 700; font-variant-numeric: tabular-nums; }
    .good b { color: var(--stat-up, var(--green)); }
    .bad b { color: var(--stat-down, var(--red)); }
    .sub { margin: 0; color: var(--text2); font-size: var(--t-xs, 12px); }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  `,
  template: `
    <p class="label"><span>{{ label() }}</span><ng-content select="[k-stat-note]" /></p>
    @if (loading()) {
      <div class="fig"><k-skeleton shape="line" width="60%" /></div>
    } @else if (count() !== null) {
      <div class="fig"><k-tally [value]="count()!" [unit]="unit()" [locale]="locale()" [duration]="duration()" /></div>
    } @else if (text()) {
      <p class="fig">{{ text() }}@if (unit()) {<span class="unit">{{ unit() }}</span>}</p>
    }
    @if (trendText(); as t) {
      <p class="trend" [class.good]="tone() === 'good'" [class.bad]="tone() === 'bad'">
        <b><span aria-hidden="true">{{ t.shown }}</span><span class="sr">{{ t.read }}</span></b>
        @if (trendLabel()) { {{ trendLabel() }} }
      </p>
    }
    @if (sub()) { <p class="sub">{{ sub() }}</p> }
    <ng-content />
  `,
})
export class KometaStat {
  /** The eyebrow over the figure, shown uppercase ("Revenue"). */
  readonly label = input.required<string>();
  /** The figure: a number counts up through k-tally, a string (`"4.8"`, `"—"`) shows as is, null shows none. */
  readonly value = input<number | string | null>(null);
  /** Words after the figure (`so'm`, `min`, `of 25`). */
  readonly unit = input('');
  /** The muted line under the figure ("12 checks closed"). */
  readonly sub = input('');
  /** The change, shown as "▲ 12%" / "▼ 4%" and read as "+12%" / "−4%"; null hides it, 0 shows "0%" uncoloured. */
  readonly trend = input<number | null>(null);
  /** Which way is good, and so green: `down` for no-shows, churn or wait time. */
  readonly trendGood = input<'up' | 'down'>('up');
  /** What the trend is after: `%` (the default), `''` for a plain count ("▲ 18"), or a word (" pts"). */
  readonly trendUnit = input('%');
  /** Words after the trend ("vs last week"), shown and read aloud. */
  readonly trendLabel = input('');
  /** The locale for grouping digits in the figure and trend (`ru-RU` writes 12 480); the browser's own when unset. */
  readonly locale = input<string | undefined>(undefined);
  /** How long a number takes to count up, in ms (k-tally's `duration`); 0 jumps. */
  readonly duration = input(900);
  /** Holds the figure's place with a k-skeleton hairline and sets `aria-busy`. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Drops the card surface (border, background, padding), for a tile inside another card. */
  readonly bare = input(false, { transform: booleanAttribute });

  protected readonly count = computed(() => {
    const v = this.value();
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  });
  protected readonly text = computed(() => {
    const v = this.value();
    return typeof v === 'string' ? v : '';
  });
  protected readonly tone = computed(() => {
    const t = this.trend();
    if (!t) return null;
    return (t > 0) === (this.trendGood() === 'up') ? 'good' : 'bad';
  });
  protected readonly trendText = computed(() => {
    const t = this.trend();
    if (t === null || !Number.isFinite(t)) return null;
    const n = Math.abs(t).toLocaleString(this.locale(), { maximumFractionDigits: 1 }) + this.trendUnit();
    // The glyph is hidden from a screen reader ("black up-pointing triangle"); the sign says the same in any language.
    return { shown: t > 0 ? `▲ ${n}` : t < 0 ? `▼ ${n}` : n, read: t > 0 ? `+${n}` : t < 0 ? `−${n}` : n };
  });
}
