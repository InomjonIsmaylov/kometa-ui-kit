import { ChangeDetectionStrategy, Component, computed, effect, input, model } from '@angular/core';
import { docLang } from './paging';

/**
 * The pager, in the Blend: a mono caption "1–25 / 134", page numbers as words with a 2px cream line under
 * the current one ("‹ 1 2 3 … 9 ›"), and a rows-per-page words group. Under 560px of its OWN width
 * (a container query, so a drawer counts) only "‹ 2 / 9 ›" and the caption stay. Hidden entirely when
 * `total` fits the smallest size, so a short list shows no pager at all.
 *
 *   <kometa-pager [total]="view.total()" [(page)]="view.page" [(pageSize)]="view.pageSize" />
 *
 * - `total`: rows in the whole (filtered) list. `page` is 1-based and `pageSize` a model; both are
 *   plain signals, so it pages a server list as well as `listView` (paging.ts) does a client one.
 * - `sizes` (default 10, 25, 50): the choices; the smallest is also the "hide below" threshold.
 *   Pass `[]` for no rows-per-page group (the threshold is then `pageSize`).
 * - Picking a size sets `page` to 1; a `page` beyond the last is pulled back.
 * - Words follow `<html lang>` (uz/ru/en); `labels` overrides any of them.
 * - Keyboard: every number and arrow is a button; the current one has `aria-current="page"`, the size
 *   in force `aria-pressed`. 44px targets on a coarse pointer, cream (never amber) line, no motion
 *   under `prefers-reduced-motion`, light theme through `--text`, `--muted`, `--display-ink`.
 */
export interface KometaPagerLabels {
  nav: string;
  prev: string;
  next: string;
  perPage: string;
}

const WORDS: Record<'uz' | 'ru' | 'en', KometaPagerLabels> = {
  uz: { nav: 'Sahifalar', prev: 'Oldingi sahifa', next: 'Keyingi sahifa', perPage: 'Sahifada' },
  ru: { nav: 'Страницы', prev: 'Предыдущая страница', next: 'Следующая страница', perPage: 'На странице' },
  en: { nav: 'Pages', prev: 'Previous page', next: 'Next page', perPage: 'Per page' },
};

/** 1, the current page and its neighbours, and the last, with `null` for each gap that hides two or more. */
export function pageWindow(page: number, count: number): (number | null)[] {
  const keep = new Set([1, count, page - 1, page, page + 1].filter((n) => n >= 1 && n <= count));
  const out: (number | null)[] = [];
  let last = 0;
  for (const n of [...keep].sort((a, b) => a - b)) {
    if (n - last === 2) out.push(last + 1);
    else if (n - last > 2) out.push(null);
    out.push(n);
    last = n;
  }
  return out;
}

@Component({
  selector: 'kometa-pager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[hidden]': '!visible()' },
  styles: `
    :host { display: block; container-type: inline-size; margin-top: 16px; }
    :host([hidden]) { display: none; }
    nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 4px 16px;
      color: var(--muted);
      font-size: var(--t-body, 13px);
    }
    .cap {
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: var(--t-xs, 11px);
      letter-spacing: .02em;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .pages, .sizes { display: flex; align-items: center; flex-wrap: wrap; }
    button {
      margin: 0;
      min-width: 32px;
      height: 36px;
      padding: 0 8px;
      border: 0;
      border-bottom: 2px solid transparent;
      border-radius: 0;
      background: transparent;
      color: var(--muted);
      font: inherit;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      transition: color .2s;
    }
    button:hover:not(:disabled) { color: var(--text); }
    button[aria-current='page'], button[aria-pressed='true'] {
      color: var(--text);
      border-bottom-color: var(--display-ink, #f4efe6);
    }
    button:disabled { opacity: .35; cursor: default; }
    button:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; }
    .gap { padding: 0 4px; opacity: .6; }
    .arrow { font-size: var(--t-lg, 16px); }
    .of {
      display: none;
      min-width: 56px;
      text-align: center;
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: var(--t-xs, 11px);
      font-variant-numeric: tabular-nums;
    }
    .sizes .lbl { margin-inline-end: 8px; font-size: var(--t-xs, 11px); }
    @container (max-width: 560px) {
      .num, .gap, .sizes { display: none; }
      .of { display: inline-block; }
      nav { justify-content: space-between; }
    }
    @media (pointer: coarse) { button { min-height: 44px; min-width: 44px; } }
    @media (prefers-reduced-motion: reduce) { button { transition: none; } }
    @media (forced-colors: active) {
      button[aria-current='page'], button[aria-pressed='true'] { border-bottom-color: Highlight; }
    }
  `,
  template: `
    <nav [attr.aria-label]="t().nav">
      <span class="cap">{{ from() }}–{{ to() }} / {{ total() }}</span>
      <div class="pages">
        <button type="button" class="arrow" [attr.aria-label]="t().prev" [disabled]="current() <= 1" (click)="go(current() - 1)">‹</button>
        @for (p of numbers(); track $index) {
          @if (p === null) {
            <span class="gap" aria-hidden="true">…</span>
          } @else {
            <button type="button" class="num" [attr.aria-current]="p === current() ? 'page' : null" (click)="go(p)">{{ p }}</button>
          }
        }
        <span class="of" aria-hidden="true">{{ current() }} / {{ count() }}</span>
        <button type="button" class="arrow" [attr.aria-label]="t().next" [disabled]="current() >= count()" (click)="go(current() + 1)">›</button>
      </div>
      @if (sizes().length > 1) {
        <div class="sizes" role="group" [attr.aria-label]="t().perPage">
          <span class="lbl" aria-hidden="true">{{ t().perPage }}</span>
          @for (s of sizes(); track s) {
            <button type="button" [attr.aria-pressed]="s === pageSize() ? 'true' : 'false'" (click)="size(s)">{{ s }}</button>
          }
        </div>
      }
    </nav>
  `,
})
export class KometaPager {
  readonly total = input.required<number>();
  readonly page = model(1);
  readonly pageSize = model(10);
  readonly sizes = input<readonly number[]>([10, 25, 50]);
  readonly labels = input<Partial<KometaPagerLabels>>({});

  protected readonly t = computed(() => ({ ...WORDS[docLang()], ...this.labels() }));
  protected readonly count = computed(() => Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))));
  protected readonly current = computed(() => Math.min(Math.max(1, this.page()), this.count()));
  protected readonly numbers = computed(() => pageWindow(this.current(), this.count()));
  protected readonly from = computed(() => (this.total() === 0 ? 0 : (this.current() - 1) * this.pageSize() + 1));
  protected readonly to = computed(() => Math.min(this.total(), this.current() * this.pageSize()));
  protected readonly visible = computed(() => {
    const floor = this.sizes().length > 0 ? Math.min(...this.sizes()) : this.pageSize();
    return this.total() > floor;
  });

  constructor() {
    // A list that shrank under the reader (a delete on the last page) pulls the page back.
    effect(() => { if (this.page() !== this.current()) this.page.set(this.current()); });
  }

  protected go(n: number): void {
    this.page.set(Math.min(Math.max(1, n), this.count()));
  }

  protected size(n: number): void {
    if (n === this.pageSize()) return;
    this.pageSize.set(n);
    this.page.set(1);
  }
}
