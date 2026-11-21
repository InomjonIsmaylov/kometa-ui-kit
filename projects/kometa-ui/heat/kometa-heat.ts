import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, input } from '@angular/core';
import { KometaInView } from 'kometa-ui/motion';
import { compactNumber } from 'kometa-ui/scale';
import { KometaTip } from 'kometa-ui/tip';

/** One row of a heatmap: its name and one figure per column; null (or a missing figure) is a gap, e.g. "closed". */
export interface KometaHeatRow {
  label: string;
  values: readonly (number | null)[];
}

/** One day of a calendar heatmap. A day inside the range but not in the list is drawn as a gap. */
export interface KometaHeatDay {
  /** ISO `yyyy-mm-dd`. */
  date: string;
  value: number;
}

const DAY = 864e5;
/** Days since 1970-01-01 for an ISO date, or NaN. Whole UTC days, so no time zone shifts a cell. */
function dayNumber(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY : Number.NaN;
}

/** The legend's swatches, less to more; the first is the empty cell. */
const KEY = [0, 0.3, 0.55, 0.8, 1];

/**
 * A heatmap: cells shaded by value in one hue, from a faint empty cell to full `--heat-rgb`. Two layouts:
 * `rows` × `cols` (a real table a screen reader can walk, e.g. bookings per weekday and hour), or `days`, a GitHub-style
 * calendar of weekday rows × week columns with month labels (a hidden list reads it). Each cell has a tooltip with its
 * row, column and figure; a small less → more key sits under it. Wider than its box, it scrolls sideways inside it
 * instead of shrinking the cells. The cells fade in as a wave the first time it is on screen.
 *
 * CSS custom properties: `--heat-rgb` (an RGB triple, `--viz-heat`), `--heat-empty` (a zero cell, `--input`),
 * `--heat-cell-height` (matrix cell, 26px), `--heat-cell-min` (narrowest matrix cell before it scrolls, 28px),
 * `--heat-label-width` (row labels, 48px), `--heat-day` (narrowest calendar day, 11px), `--heat-radius` (5px).
 *
 *     <k-heat [rows]="[{ label: 'Mon', values: [2, 5, 0] }]" [cols]="['9', '10', '11']" unit="visits" label="Visits by hour" />
 *     <k-heat [days]="[{ date: '2026-03-02', value: 1 }]" unit="check-ins" label="Check-ins this year" />
 */
@Component({
  selector: 'k-heat',
  imports: [KometaTip],
  hostDirectives: [KometaInView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: grid; gap: 10px; min-width: 0; font-variant-numeric: tabular-nums; }
    /* Positioned so the hidden caption stays inside the scroller and cannot widen the page. */
    .scroll { position: relative; overflow-x: auto; border-radius: 6px; }
    .scroll:focus-visible { outline: 2px solid var(--amber-ink, var(--amber)); outline-offset: 2px; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    table {
      width: 100%; min-width: calc(var(--heat-label-width, 48px) + var(--n) * (var(--heat-cell-min, 28px) + 3px));
      border-collapse: separate; border-spacing: 3px; table-layout: fixed;
    }
    thead td { width: var(--heat-label-width, 48px); }
    th, .wd, .months { color: var(--muted); font: 600 11px/1.2 var(--font-sans, sans-serif); }
    th { overflow: hidden; white-space: nowrap; text-overflow: clip; }
    th[scope='row'] { padding-right: 4px; text-align: left; }
    .cell {
      height: var(--heat-cell-height, 26px); padding: 0; border-radius: var(--heat-radius, 5px);
      background: rgba(var(--heat-rgb, var(--viz-heat)), var(--a));
    }
    .cell.empty { background: var(--heat-empty, var(--input)); }
    .cell.none { background: transparent; box-shadow: inset 0 0 0 1px var(--border); }
    .cell.pad { visibility: hidden; }
    .cell:not(.none):hover { outline: 1px solid var(--text); outline-offset: 1px; }
    .cal {
      display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 6px;
      min-width: calc(var(--weeks) * (var(--heat-day, 11px) + 3px) + 32px);
    }
    .months, .days { grid-column: 2; display: grid; grid-template-columns: repeat(var(--weeks), minmax(0, 1fr)); gap: 3px; }
    .months { white-space: nowrap; }
    .wd, .days { grid-template-rows: repeat(7, minmax(0, 1fr)); }
    .wd { display: grid; gap: 3px; font-size: 10px; }
    .wd span { display: flex; align-items: center; }
    .days { grid-auto-flow: column; }
    .days .cell { display: block; height: auto; aspect-ratio: 1; border-radius: min(var(--heat-radius, 5px), 3px); }
    .key { display: flex; align-items: center; justify-content: flex-end; gap: 3px; margin: 0; color: var(--muted); font-size: 11px; }
    .key .cell { display: block; width: 11px; height: 11px; border-radius: 2px; }
    .key span:first-child { margin-right: 4px; }
    .key span:last-child { margin-left: 4px; }

    @media (prefers-reduced-motion: no-preference) {
      :host(:not(.k-seen)) .scroll .cell { opacity: 0; }
      :host(.k-seen) .scroll .cell { animation: appear .4s calc(var(--d) * 22ms) cubic-bezier(.22, 1, .36, 1) both; }
    }
    @keyframes appear { from { opacity: 0; scale: .6; } }
  `,
  template: `
    <div class="scroll" tabindex="0" role="region" [attr.aria-label]="label()">
      @if (calendar(); as c) {
        <div class="cal" aria-hidden="true" [style.--weeks]="c.weeks">
          <div class="months">
            @for (m of c.months; track m.w) { <span [style.grid-column]="m.w + 1">{{ m.label }}</span> }
          </div>
          <div class="wd">
            @for (w of c.weekdays; track $index) { <span>{{ w }}</span> }
          </div>
          <div class="days">
            @for (d of c.cells; track $index) {
              <i class="cell" [class]="d.kind" [style.--a]="d.a" [style.--d]="d.w"
                 [kometaTip]="d.tip" [kometaTipSub]="d.sub" [kometaTipDelay]="80"></i>
            }
          </div>
        </div>
        <ul class="sr">
          @for (d of c.list; track $index) { <li>{{ d }}</li> }
        </ul>
      } @else {
        <table [style.--n]="cols().length">
          <caption class="sr">{{ label() }}</caption>
          <thead>
            <tr><td></td>@for (c of cols(); track $index) { <th scope="col">{{ c }}</th> }</tr>
          </thead>
          <tbody>
            @for (r of matrix(); track $index; let ri = $index) {
              <tr>
                <th scope="row">{{ r.label }}</th>
                @for (c of r.cells; track $index) {
                  <td class="cell" [class]="c.kind" [style.--a]="c.a" [style.--d]="ri + $index"
                      [kometaTip]="c.tip" [kometaTipSub]="c.sub" [kometaTipDelay]="80"><span class="sr">{{ c.sub }}</span></td>
                }
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
    <p class="key" aria-hidden="true">
      <span>{{ lessLabel() }}</span>
      @for (a of key; track a) { <i class="cell" [class.empty]="!a" [style.--a]="a"></i> }
      <span>{{ moreLabel() }}</span>
    </p>
  `,
})
export class KometaHeat {
  /** Matrix mode: one row per entry, one figure per column of `cols`. */
  readonly rows = input<readonly KometaHeatRow[]>([]);
  /** Matrix mode: the column headings, e.g. hours. */
  readonly cols = input<readonly string[]>([]);
  /** Calendar mode, used when not empty: the days to shade, in any order; the calendar spans the first to the last. */
  readonly days = input<readonly KometaHeatDay[]>([]);
  /** Calendar mode: the weekday on the top row, 1 for Monday or 0 for Sunday. */
  readonly weekStart = input<0 | 1>(1);
  /** What the heatmap shows: the table's caption and the scroll region's name. */
  readonly label = input.required<string>();
  /** The figure that gets the full colour; the largest one when null. */
  readonly max = input<number | null>(null);
  /** Words after each figure in its tooltip and for a screen reader, e.g. "visits". */
  readonly unit = input('');
  /** Writes a figure. Compact numbers ("1.2K") by default. */
  readonly format = input<(v: number) => string>((v) => compactNumber(v));
  /** The key's low end, e.g. "Quiet". */
  readonly lessLabel = input('Less');
  /** The key's high end, e.g. "Busy". */
  readonly moreLabel = input('More');

  private readonly locale = inject(LOCALE_ID);
  protected readonly key = KEY;

  /** Shading for a figure: α from 0.15 to 1, with zero an empty cell and null a gap. */
  private shade(v: number | null | undefined, top: number): { kind: string; a: number; sub: string | null } {
    if (v == null || !Number.isFinite(v)) return { kind: 'none', a: 0, sub: null };
    const sub = `${this.format()(v)}${this.unit() ? ' ' + this.unit() : ''}`;
    if (v <= 0) return { kind: 'empty', a: 0, sub };
    return { kind: '', a: Math.round((0.15 + 0.85 * Math.min(1, v / top)) * 100) / 100, sub };
  }

  private top(values: readonly (number | null | undefined)[]): number {
    const max = this.max();
    if (max != null && max > 0) return max;
    return Math.max(0, ...values.map((v) => (v != null && Number.isFinite(v) ? v : 0))) || 1;
  }

  protected readonly matrix = computed(() => {
    const cols = this.cols();
    const top = this.top(this.rows().flatMap((r) => r.values));
    return this.rows().map((r) => ({
      label: r.label,
      cells: cols.map((c, i) => {
        const s = this.shade(r.values[i], top);
        return { ...s, tip: s.sub == null ? null : `${r.label} ${c}` };
      }),
    }));
  });

  protected readonly calendar = computed(() => {
    const given = new Map<number, number>();
    for (const d of this.days()) {
      const n = dayNumber(d.date);
      if (!Number.isNaN(n)) given.set(n, d.value);
    }
    if (!given.size) return null;
    const nums = [...given.keys()].sort((a, b) => a - b);
    const first = nums[0];
    const last = nums[nums.length - 1];
    const ws = this.weekStart();
    // 1970-01-01 was a Thursday (4).
    const weekday = (n: number) => (((n + 4) % 7) + 7) % 7;
    const start = first - ((weekday(first) - ws + 7) % 7);
    const weeks = Math.ceil((last - start + 1) / 7);
    const top = this.top([...given.values()]);
    const utc = { timeZone: 'UTC' } as const;
    const month = new Intl.DateTimeFormat(this.locale, { ...utc, month: 'short' });
    const long = new Intl.DateTimeFormat(this.locale, { ...utc, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const wday = new Intl.DateTimeFormat(this.locale, { ...utc, weekday: 'short' });

    const cells = Array.from({ length: weeks * 7 }, (_, i) => {
      const n = start + i;
      const w = Math.floor(i / 7);
      if (n < first || n > last) return { kind: 'pad', a: 0, w, tip: null, sub: null };
      const s = this.shade(given.get(n), top);
      return { ...s, w, tip: s.sub == null ? null : long.format(n * DAY) };
    });

    // A month's name over the first week that starts in it, when there are two weeks for it before the next one.
    const starts: { w: number; label: string }[] = [];
    for (let w = 0; w < weeks; w++) {
      const m = new Date((start + w * 7) * DAY).getUTCMonth();
      if (!w || m !== new Date((start + w * 7 - 7) * DAY).getUTCMonth()) starts.push({ w, label: month.format((start + w * 7) * DAY) });
    }
    const months = starts.filter((m, i) => (starts[i + 1]?.w ?? weeks) - m.w >= 2);

    // Mon, Wed and Fri are named, as on GitHub; the other rows stay blank.
    const weekdays = Array.from({ length: 7 }, (_, r) => ((r + ws) % 7) % 2 ? wday.format((r + ws + 3) * DAY) : '');
    const list = nums.map((n) => `${long.format(n * DAY)}: ${this.shade(given.get(n), top).sub}`);
    return { weeks, cells, months, weekdays, list };
  });
}
