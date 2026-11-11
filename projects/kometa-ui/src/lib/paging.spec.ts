import { signal, computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { listView, sortDate, sortNum, sortText } from './paging';

interface Row { name: string; n: number }
const rows = (n: number): Row[] => Array.from({ length: n }, (_, i) => ({ name: `r${i + 1}`, n: i + 1 }));

describe('listView', () => {
  function make(count = 25) {
    const source = signal<Row[]>(rows(count));
    const q = signal('');
    const view = TestBed.runInInjectionContext(() =>
      listView(source, {
        filter: computed(() => { const s = q(); return (r: Row) => r.name.includes(s); }),
        sorts: { n: (a, b) => a.n - b.n, name: (a, b) => sortText(a.name, b.name) },
        sort: 'n', pageSize: 10,
      }),
    );
    return { source, q, view };
  }

  it('slices the first page and counts the filtered total', () => {
    const { view } = make();
    expect(view.rows().map((r) => r.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(view.total()).toBe(25);
    expect(view.all()).toBe(25);
    expect(view.pageCount()).toBe(3);
  });

  it('goes to page 3 and holds the short last page', () => {
    const { view } = make();
    view.page.set(3);
    expect(view.rows().map((r) => r.n)).toEqual([21, 22, 23, 24, 25]);
  });

  it('resets to page 1 when the filter, the sort or the page size changes', () => {
    const { view, q } = make();
    view.page.set(2);
    q.set('r1');
    expect(view.page()).toBe(1);
    expect(view.total()).toBe(11);
    expect(view.all()).toBe(25);
    view.page.set(2);
    view.pickSort('name');
    expect(view.page()).toBe(1);
    view.page.set(2);
    view.pageSize.set(25);
    expect(view.page()).toBe(1);
  });

  it('clamps the page when the list shrinks and keeps it on a same-size reload', () => {
    const { view, source } = make();
    view.page.set(3);
    source.set(rows(25));
    expect(view.page()).toBe(3);
    source.set(rows(12));
    expect(view.page()).toBe(2);
    expect(view.rows().map((r) => r.n)).toEqual([11, 12]);
    source.set([]);
    expect(view.page()).toBe(1);
    expect(view.rows()).toEqual([]);
  });

  it('leaves the source order alone for an unknown sort key', () => {
    const source = signal(rows(3).reverse());
    const view = TestBed.runInInjectionContext(() => listView(source, { sorts: {}, sort: '', pageSize: 10 }));
    expect(view.rows().map((r) => r.n)).toEqual([3, 2, 1]);
  });
});

describe('listView directions', () => {
  it('starts in the initial key own direction and flips on a second pick', () => {
    const source = signal(rows(5));
    const view = TestBed.runInInjectionContext(() =>
      listView(source, { sorts: { n: (a, b) => a.n - b.n, name: (a, b) => sortText(a.name, b.name) }, sort: 'n', dirs: { n: 'desc' }, pageSize: 10 }),
    );
    expect(view.dir()).toBe('desc');
    expect(view.rows().map((r) => r.n)).toEqual([5, 4, 3, 2, 1]);
    view.pickSort('n');
    expect(view.dir()).toBe('asc');
    view.pickSort('name');
    expect(view.sort()).toBe('name');
    expect(view.dir()).toBe('asc');
    view.pickSort('n');
    expect(view.dir()).toBe('desc');
  });
});

describe('sort helpers', () => {
  afterEach(() => { document.documentElement.lang = ''; });

  it('sortText compares digits by value and treats null as empty', () => {
    expect(['a10', 'a2', 'a1'].sort(sortText)).toEqual(['a1', 'a2', 'a10']);
    expect(sortText(null, 'a')).toBeLessThan(0);
    expect(sortText(undefined, '')).toBe(0);
  });

  it('sortText follows the page language (Cyrillic order in ru)', () => {
    document.documentElement.lang = 'ru';
    expect(['Яна', 'Анна', 'Борис'].sort(sortText)).toEqual(['Анна', 'Борис', 'Яна']);
  });

  it('sortNum and sortDate treat a missing value as the lowest', () => {
    expect(sortNum(null, 1)).toBeLessThan(0);
    expect(sortNum(5, 2)).toBeGreaterThan(0);
    expect(sortDate('2026-10-02T10:00:00Z', '2026-10-01T10:00:00Z')).toBeGreaterThan(0);
    expect(sortDate(null, '2026-10-01T10:00:00Z')).toBeLessThan(0);
    expect(sortDate('nope', null)).toBe(0);
  });
});
