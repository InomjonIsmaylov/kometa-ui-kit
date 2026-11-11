import { Signal, WritableSignal, computed, linkedSignal, signal } from '@angular/core';

/**
 * Client-side paging for a list the API returns whole: filter, sort, slice. Pure signals, no DOM
 * except the `lang` read in `sortText`.
 *
 *   const view = listView(this.store.rows, {
 *     filter: computed(() => { const q = this.q().toLowerCase(); return (r) => r.name.toLowerCase().includes(q); }),
 *     sorts: { name: (a, b) => sortText(a.name, b.name), date: (a, b) => sortNum(a.at, b.at) },
 *     sort: 'date', dirs: { date: 'desc' }, pageSize: 10,
 *   });
 *   // template: @for (r of view.rows(); ...)  <k-pager [total]="view.total()" [(page)]="view.page" [(pageSize)]="view.pageSize" />
 *   //           <k-sort [options]="..." [key]="view.sort()" [dir]="view.dir()" (pick)="view.pickSort($event)" />
 *
 * - `filter` is a Signal of a predicate (rebuild it in a `computed`); a new predicate resets to page 1.
 * - A changed sort, direction or page size resets to page 1. A shorter list clamps the page (a reload
 *   of the same data keeps the page).
 * - `pickSort(key)` flips the direction when `key` is already active, else switches (to `dirs[key]`, default asc).
 * - A key missing from `sorts` leaves the source order alone.
 * - For a list the SERVER pages, skip `listView`: hold `page`/`pageSize` signals yourself and feed
 *   `total` (the server's count) to `<k-pager>`.
 */
export type SortDir = 'asc' | 'desc';

export interface ListViewConfig<T> {
  filter?: Signal<(row: T) => boolean>;
  sorts: Record<string, (a: T, b: T) => number>;
  /** The initial sort key (what the list shows today). */
  sort: string;
  /** The direction a key starts in when it is picked; `asc` unless named here. The initial sort uses its own. */
  dirs?: Record<string, SortDir>;
  pageSize: number;
}

export interface ListView<T> {
  /** The visible slice. */
  readonly rows: Signal<T[]>;
  /** The filtered count (what the pager pages over). */
  readonly total: Signal<number>;
  /** The unfiltered count (to tell "nothing yet" from "nothing matches"). */
  readonly all: Signal<number>;
  readonly page: WritableSignal<number>;
  readonly pageSize: WritableSignal<number>;
  readonly pageCount: Signal<number>;
  readonly sort: WritableSignal<string>;
  readonly dir: WritableSignal<SortDir>;
  pickSort(key: string): void;
}

export function listView<T>(source: Signal<readonly T[]>, cfg: ListViewConfig<T>): ListView<T> {
  const sort = signal(cfg.sort);
  const dir = signal<SortDir>(cfg.dirs?.[cfg.sort] ?? 'asc');
  const pageSize = signal(cfg.pageSize);

  const filtered = computed(() => {
    const rows = source();
    const keep = cfg.filter?.();
    return keep ? rows.filter(keep) : rows.slice();
  });
  const ordered = computed(() => {
    const cmp = cfg.sorts[sort()];
    const rows = filtered();
    if (!cmp) return rows;
    const sign = dir() === 'desc' ? -1 : 1;
    return rows.slice().sort((a, b) => sign * cmp(a, b)); // Array#sort is stable, so equal rows keep source order
  });
  const total = computed(() => ordered().length);
  const pageCount = computed(() => Math.max(1, Math.ceil(total() / Math.max(1, pageSize()))));

  const page = linkedSignal<{ keep: readonly unknown[]; count: number }, number>({
    source: () => ({ keep: [cfg.filter?.(), sort(), dir(), pageSize()], count: pageCount() }),
    computation: (now, prev) =>
      prev && prev.source.keep.every((v, i) => v === now.keep[i]) ? Math.min(prev.value, now.count) : 1,
  });

  const rows = computed(() => {
    const size = Math.max(1, pageSize());
    const from = (Math.min(page(), pageCount()) - 1) * size;
    return ordered().slice(from, from + size);
  });

  return {
    rows, total, all: computed(() => source().length), page, pageSize, pageCount, sort, dir,
    pickSort(key: string) {
      if (key === sort()) dir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
      else { sort.set(key); dir.set(cfg.dirs?.[key] ?? 'asc'); }
    },
  };
}

/** The language the console is in (the app sets `<html lang>`); `en` when nothing is set. */
export function docLang(): 'uz' | 'ru' | 'en' {
  const l = typeof document === 'undefined' ? '' : document.documentElement.lang.slice(0, 2).toLowerCase();
  return l === 'uz' || l === 'ru' ? l : 'en';
}

const collators = new Map<string, Intl.Collator>();
function collator(): Intl.Collator {
  const lang = docLang();
  let c = collators.get(lang);
  if (!c) {
    try { c = new Intl.Collator(lang, { numeric: true, sensitivity: 'base' }); }
    catch { c = new Intl.Collator('en', { numeric: true, sensitivity: 'base' }); }
    collators.set(lang, c);
  }
  return c;
}

/** Text in the console's language, digits by value ("2" before "10"). null and undefined sort as "". */
export function sortText(a: string | null | undefined, b: string | null | undefined): number {
  return collator().compare(a ?? '', b ?? '');
}

/** Numbers; null and undefined count as 0. */
export function sortNum(a: number | null | undefined, b: number | null | undefined): number {
  return (a ?? 0) - (b ?? 0);
}

/** ISO date strings (or Dates) by instant; a missing or unparseable one is the oldest. */
export function sortDate(a: string | Date | null | undefined, b: string | Date | null | undefined): number {
  const t = (v: string | Date | null | undefined) => {
    const n = v == null ? NaN : new Date(v).getTime();
    return Number.isNaN(n) ? -Infinity : n;
  };
  const x = t(a), y = t(b);
  return x === y ? 0 : x < y ? -1 : 1;
}
