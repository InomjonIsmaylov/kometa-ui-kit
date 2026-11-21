import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, input, signal } from '@angular/core';

/** How `kometaTileColumns` lays out a row of tiles. */
export interface KometaTileLayout {
  /** Tiles in the widest row: the column count. */
  columns: number;
  /** Tiles per row, top to bottom. Rows differ by one tile at most, the longer ones first. */
  rows: number[];
  /** Grid tracks: the least common multiple of the row lengths, so every row fills the width exactly. */
  tracks: number;
  /** Tracks each tile spans, in order. */
  spans: number[];
}

/**
 * Lays out `count` tiles at least `min` px wide, `gap` px apart, in `width` px, never more than `max` per row
 * (null: no cap). Fits as many per row as the width allows, then spreads the tiles evenly over the rows that
 * takes, so no row holds a lone tile while the others hold three: 5 tiles go 5, then 3+2, then 2+2+1;
 * 7 go 4+3, then 3+2+2. Only at two columns (or one) can a row hold one tile, and then it spans the width.
 * Every row's tiles stretch to fill it.
 *
 *     kometaTileColumns(5, 700, 180, 16) // { columns: 3, rows: [3, 2], tracks: 6, spans: [2, 2, 2, 3, 3] }
 */
export function kometaTileColumns(count: number, width: number, min = 180, gap = 16, max: number | null = null): KometaTileLayout {
  const n = Math.max(0, Math.floor(count) || 0);
  if (!n) return { columns: 1, rows: [], tracks: 1, spans: [] };
  const fit = Math.max(1, Math.min(n, Math.floor((width + gap) / Math.max(1, min + gap)) || 1, max == null ? n : Math.floor(max) || 1));
  const lines = Math.ceil(n / fit);
  const short = Math.floor(n / lines), long = n % lines;
  const rows = Array.from({ length: lines }, (_, i) => short + (i < long ? 1 : 0));
  const tracks = long ? short * (short + 1) : short; // n and n + 1 share no factor, so this is their lcm
  return { columns: rows[0], rows, tracks, spans: rows.flatMap((r) => Array<number>(r).fill(tracks / r)) };
}

/**
 * A grid of projected tiles (KPI rows, cards) that never leaves one tile alone on a row: five tiles show as
 * 5, 3+2 or 2+2+1 (the last spanning both columns) as the width shrinks, and the last row's tiles stretch
 * to fill it. Measures its own width (ResizeObserver) and follows tiles being added or removed; the rule is
 * `kometaTileColumns`. Before the first measure (server render) it is a plain
 * `repeat(auto-fit, minmax(min, 1fr))` grid. It sets `grid-column` on each child, so do not set your own.
 *
 *     <k-tiles [min]="200"><k-stat label="Visits" [value]="412" /> … </k-tiles>
 *
 * Tests in kometa-tiles.spec.ts.
 */
@Component({
  selector: 'k-tiles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.grid-template-columns]': 'template()', '[style.gap.px]': 'gap()' },
  styles: `:host { display: grid; min-width: 0; }`,
  template: `<ng-content />`,
})
export class KometaTiles {
  /** The narrowest a tile may get, in px. */
  readonly min = input(180);
  /** The space between tiles, in px. */
  readonly gap = input(16);
  /** The most tiles on one row; null for as many as fit. */
  readonly max = input<number | null>(null);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly destroy = inject(DestroyRef);
  private readonly width = signal<number | null>(null);
  /** The projected tiles; a new array on every DOM change, so a swapped tile gets its span too. */
  private readonly kids = signal<HTMLElement[]>([]);
  protected readonly layout = computed(() => {
    const w = this.width();
    return w === null ? null : kometaTileColumns(this.kids().length, w, this.min(), this.gap(), this.max());
  });
  protected readonly template = computed(() => {
    const l = this.layout();
    return l ? `repeat(${l.tracks}, minmax(0, 1fr))` : `repeat(auto-fit, minmax(min(${this.min()}px, 100%), 1fr))`;
  });

  constructor() {
    effect(() => {
      const spans = this.layout()?.spans;
      this.kids().forEach((k, i) => (k.style.gridColumn = spans?.[i] ? `span ${spans[i]}` : ''));
    });
    afterNextRender(() => {
      const read = () => this.kids.set(Array.from(this.host.children) as HTMLElement[]);
      read();
      // Only childList: the spans written above are attribute changes, so they cannot retrigger this.
      const mo = typeof MutationObserver === 'function' ? new MutationObserver(read) : null;
      mo?.observe(this.host, { childList: true });
      // The host is a block, so its width comes from its parent, never from the columns set here: no loop.
      const ro = new ResizeObserver(([e]) => this.width.set(Math.round(e.contentRect.width)));
      ro.observe(this.host);
      this.destroy.onDestroy(() => (mo?.disconnect(), ro.disconnect()));
    });
  }
}
