import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, OnInit, afterNextRender, booleanAttribute, computed, effect, inject, input, model, signal, viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/** The words a date picker draws. `DATEPICKER_I18N[locale]` in the vendor console has this shape. */
export interface KometaDateNames {
  monthNames: readonly string[];
  monthNamesShort: readonly string[];
  /** Sunday first, as `Date.getDay()` counts; the week is drawn Monday first. */
  dayNamesMin: readonly string[];
  prev: string;
  next: string;
  /** The word for taking a value away; `kometa-time` uses it. */
  clear?: string;
}

const EN: KometaDateNames = {
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  prev: 'Previous month',
  next: 'Next month',
};

interface Cell { n: number; date: Date; off: boolean; selected: boolean; mid: boolean; today: boolean }

const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
let nextId = 0;

/**
 * One calendar day. The date is a figure with a hairline under it; it opens a glass month in the browser's top layer
 * (so a drawer or a card cannot clip it), flips above when there is no room below and is kept inside the viewport.
 * Days are bare figures: the chosen day takes the 2px edge, today a small line. The week starts on Monday.
 * Arrow keys move by day and week (across months), PageUp and PageDown by month; Enter picks; Escape, Tab, a click
 * outside, resize and scroll close it. `value` is local midnight (or `null`); `min` and `max` grey out the days beyond.
 * `names` is the caller's language (English when unset); `inputId` lets a `<label for>` name the button.
 * `range` turns it into a period picker: the first tap holds the start,
 * the second the end (an earlier second tap swaps them), the days between are tinted. `rangeValue` is `[start, null]`
 * after the first tap and `[start, end]` after the second. `inline` draws the month in place,
 * with no button and no popup, for a panel that already floats (the console's period picker).
 * Spec: kometa-date.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-8.html (Month).
 */
@Component({
  selector: 'kometa-date',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    '(window:resize)': 'close(false)',
    '(window:scroll)': 'close(false)',
    '(document:pointerdown)': 'onOutside($event)',
  },
  styles: `
    :host { position: relative; display: inline-block; }
    :host([inline]) { display: block; }
    .inline { width: 296px; max-width: 100%; }
    .btn {
      position: relative; display: inline-flex; align-items: baseline; padding: 0 0 6px; border: 0; background: none;
      color: var(--display-ink, var(--text)); font: inherit; cursor: pointer;
    }
    .btn::after {
      content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: var(--display-ink, var(--text));
      transform: scaleX(.3); transform-origin: left; opacity: .5; transition: transform 420ms var(--ease-spring, ease), opacity 200ms ease;
    }
    .btn:hover:not(:disabled)::after, .btn[aria-expanded='true']::after, .btn:focus-visible::after { transform: none; opacity: 1; }
    .btn:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    .btn:disabled { opacity: .4; cursor: not-allowed; }
    .fig { min-height: 28px; font-family: var(--font-display, inherit); font-size: 24px; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
    .fig.empty { color: var(--muted); }
    @media (pointer: coarse) { .btn { min-height: 44px; align-items: center; } }
    .pop {
      inset: auto; width: 296px; max-width: calc(100vw - 16px); margin: 0; padding: 12px;
      border: 1px solid var(--glass-line); border-radius: 18px; color: var(--text);
      background: var(--glass-drawer, var(--bg)); backdrop-filter: blur(18px); box-shadow: 0 12px 30px rgba(0, 0, 0, .35);
      transition: opacity 180ms ease, translate 320ms var(--ease-spring, ease);
    }
    @starting-style { .pop:popover-open { opacity: 0; translate: 0 -4px; } }
    .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .head b { font-family: var(--font-display, inherit); font-size: 15px; font-weight: 600; color: var(--display-ink, var(--text)); }
    .nav {
      display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border: 0; border-radius: 50%; background: none;
      color: var(--display-ink, var(--text)); font-size: 18px; cursor: pointer;
    }
    .nav:hover:not(:disabled) { background: var(--glass-line); }
    .nav:focus-visible { outline: 2px solid var(--amber); outline-offset: 1px; }
    .nav:disabled { opacity: .3; cursor: default; }
    .dow, .grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    .dow span { padding: 4px 0; text-align: center; font-size: 12px; letter-spacing: .06em; color: var(--muted); }
    .d {
      position: relative; height: 38px; border: 0; border-radius: 10px; background: none; color: var(--text);
      font: inherit; font-size: 14px; font-variant-numeric: tabular-nums; cursor: pointer; transition: box-shadow 200ms ease;
    }
    @media (pointer: coarse) { .d { height: 44px; } }
    .d:hover:not(:disabled) { box-shadow: inset 0 0 0 1px var(--glass-line); }
    .d:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; }
    .d[aria-pressed='true'] { color: var(--display-ink, var(--text)); font-weight: 600; box-shadow: inset 0 0 0 2px var(--display-ink, var(--text)); }
    .d.today::after { content: ''; position: absolute; left: 50%; bottom: 5px; width: 12px; height: 1px; margin-left: -6px; background: var(--display-ink, var(--text)); }
    .d.mid { background: var(--amber-tint, var(--glass-line)); border-radius: 0; }
    .d:disabled { opacity: .3; cursor: default; }
    @media (prefers-reduced-motion: reduce) { .btn::after, .pop, .d { transition: none; } }
  `,
  template: `
    <ng-template #panel>
      <div class="head">
        <button class="nav" type="button" tabindex="-1" [attr.aria-label]="n().prev" [disabled]="!canPrev()" (click)="go(-1)">&#8249;</button>
        <b aria-live="polite">{{ n().monthNames[view().getMonth()] }} {{ view().getFullYear() }}</b>
        <button class="nav" type="button" tabindex="-1" [attr.aria-label]="n().next" [disabled]="!canNext()" (click)="go(1)">&#8250;</button>
      </div>
      <div class="dow" aria-hidden="true">
        @for (w of weekdays(); track $index) { <span>{{ w }}</span> }
      </div>
      <div class="grid" role="group" [attr.aria-label]="ariaLabel() || null">
        @for (c of cells(); track $index) {
          @if (c) {
            <button class="d" type="button" [class.today]="c.today" [class.mid]="c.mid" [disabled]="c.off" [attr.aria-pressed]="c.selected"
                    [attr.aria-current]="c.today ? 'date' : null" [attr.aria-label]="c.n + ' ' + n().monthNames[c.date.getMonth()] + ' ' + c.date.getFullYear()"
                    (click)="pick(c)">{{ c.n }}</button>
          } @else { <span></span> }
        }
      </div>
    </ng-template>
    @if (inline()) {
      <div class="inline" (keydown)="onKey($event)"><ng-container [ngTemplateOutlet]="panel" /></div>
    } @else {
      <button #btn class="btn" type="button" aria-haspopup="dialog" [id]="inputId() || null" [disabled]="disabled()"
              [attr.aria-label]="ariaLabel() || null" [attr.aria-expanded]="open()" [attr.aria-controls]="id" (click)="toggle()">
        <span class="fig" [class.empty]="!hasValue()">{{ shown() }}</span>
      </button>
      <div #pop class="pop" popover="manual" role="dialog" [id]="id" [attr.aria-label]="ariaLabel() || null"
           [style.left.px]="x()" [style.top.px]="y()" (keydown)="onKey($event)">
        @if (open()) { <ng-container [ngTemplateOutlet]="panel" /> }
      </div>
    }
  `,
})
export class KometaDate implements OnInit {
  protected readonly id = `kometa-date-${nextId++}`;
  readonly value = model<Date | null>(null);
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly names = input<KometaDateNames | null>(null);
  readonly ariaLabel = input('');
  readonly inputId = input('');
  /** Shown when there is no value. */
  readonly placeholder = input('—');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly open = model(false);
  /** A period, not a day: see the class note. */
  readonly range = input(false, { transform: booleanAttribute });
  readonly inline = input(false, { transform: booleanAttribute });
  readonly rangeValue = model<(Date | null)[] | null>(null);

  protected readonly x = signal(0);
  protected readonly y = signal(0);
  protected readonly n = computed(() => this.names() ?? EN);
  protected readonly view = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  protected readonly hasValue = computed(() => (this.range() ? !!this.rangeValue()?.[0] : !!this.value()));
  private fmt(v: Date): string {
    return `${v.getDate()} ${this.n().monthNamesShort[v.getMonth()]} ${v.getFullYear()}`;
  }
  protected readonly shown = computed(() => {
    if (this.range()) {
      const [a, b] = this.rangeValue() ?? [];
      return a ? (b ? `${this.fmt(a)} – ${this.fmt(b)}` : this.fmt(a)) : this.placeholder();
    }
    const v = this.value();
    return v ? this.fmt(v) : this.placeholder();
  });
  protected readonly weekdays = computed(() => [1, 2, 3, 4, 5, 6, 0].map((i) => this.n().dayNamesMin[i]));
  protected readonly canPrev = computed(() => {
    const min = this.min(), v = this.view();
    return !min || day(new Date(v.getFullYear(), v.getMonth(), 0)) >= day(min);
  });
  protected readonly canNext = computed(() => {
    const max = this.max(), v = this.view();
    return !max || day(new Date(v.getFullYear(), v.getMonth() + 1, 1)) <= day(max);
  });
  /** Blanks before the 1st (Monday first) are `null`. */
  protected readonly cells = computed<(Cell | null)[]>(() => {
    const v = this.view(), min = this.min(), max = this.max(), today = day(new Date());
    const rng = this.range();
    const [r0, r1] = this.rangeValue() ?? [];
    const sel = rng ? null : this.value();
    const out: (Cell | null)[] = Array.from({ length: (v.getDay() + 6) % 7 }, () => null);
    for (let i = 1, last = new Date(v.getFullYear(), v.getMonth() + 1, 0).getDate(); i <= last; i++) {
      const date = new Date(v.getFullYear(), v.getMonth(), i), t = day(date);
      out.push({ n: i, date, off: (!!min && t < day(min)) || (!!max && t > day(max)), selected: rng ? (!!r0 && t === day(r0)) || (!!r1 && t === day(r1)) : !!sel && t === day(sel),
        mid: rng && !!r0 && !!r1 && t > day(r0) && t < day(r1), today: t === today });
    }
    return out;
  });

  private readonly btn = viewChild<ElementRef<HTMLButtonElement>>('btn');
  private readonly pop = viewChild<ElementRef<HTMLElement>>('pop');
  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      const on = this.open();
      const pop = this.pop()?.nativeElement;
      if (!pop) return;
      // ponytail: the Popover API is baseline since 2024; an older engine shows the month in flow.
      try {
        if (on) pop.showPopover?.(); else pop.hidePopover?.();
      } catch { /* already in that state */ }
      if (on) afterNextRender(() => this.place(), { injector: this.injector });
    });
  }

  ngOnInit(): void {
    if (this.inline()) this.showMonthOf();
  }

  private showMonthOf(): void {
    const v = (this.range() ? this.rangeValue()?.[1] ?? this.rangeValue()?.[0] : this.value()) ?? new Date();
    this.view.set(new Date(v.getFullYear(), v.getMonth(), 1));
  }

  protected toggle(): void {
    if (!this.open()) {
      const v = (this.range() ? this.rangeValue()?.[0] : this.value()) ?? new Date();
      this.view.set(new Date(v.getFullYear(), v.getMonth(), 1));
    }
    this.open.update((o) => !o);
  }

  /** The month exists after the render that opened it, so it is measured and the day focused then. */
  private place(): void {
    const b = this.btn()!.nativeElement.getBoundingClientRect();
    const l = this.pop()!.nativeElement.getBoundingClientRect();
    const pad = 8;
    const below = b.bottom + 8 + l.height <= window.innerHeight - pad;
    this.y.set(below ? b.bottom + 8 : Math.max(pad, b.top - 8 - l.height));
    this.x.set(Math.max(pad, Math.min(b.left, window.innerWidth - pad - l.width)));
    this.focusDay();
  }

  private days(): HTMLButtonElement[] {
    return [...(this.pop()?.nativeElement ?? this.host).querySelectorAll<HTMLButtonElement>('.d:not(:disabled)')];
  }

  private focusDay(n?: number): void {
    const all = this.days();
    const hit = n === undefined
      ? all.find((b) => b.getAttribute('aria-pressed') === 'true') ?? all.find((b) => b.classList.contains('today')) ?? all[0]
      : all.find((b) => Number(b.textContent) === n) ?? all[0];
    hit?.focus({ preventScroll: true });
  }

  protected go(by: number): void {
    const v = this.view();
    this.view.set(new Date(v.getFullYear(), v.getMonth() + by, 1));
  }

  protected pick(c: Cell): void {
    if (this.range()) {
      const [a, b] = this.rangeValue() ?? [];
      if (!a || b) this.rangeValue.set([c.date, null]);
      else {
        this.rangeValue.set(day(c.date) < day(a) ? [c.date, a] : [a, c.date]);
        this.close(true);
      }
      return;
    }
    this.value.set(c.date);
    this.close(true);
  }

  protected close(refocus: boolean): void {
    if (!this.open()) return;
    this.open.set(false);
    if (refocus) this.btn()?.nativeElement.focus();
  }

  protected onOutside(e: Event): void {
    if (!this.inline() && this.open() && !(e.target instanceof Node && this.host.contains(e.target))) this.close(false);
  }

  private get host(): HTMLElement {
    return (this.btn()?.nativeElement.parentElement ?? this.pop()?.nativeElement.parentElement) as HTMLElement;
  }

  protected onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') { e.stopPropagation(); this.close(true); return; }
    if (e.key === 'Tab') { this.close(false); return; }
    const cur = document.activeElement as HTMLElement | null;
    if (!cur?.classList.contains('d')) return;
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    const month = { PageUp: -1, PageDown: 1 }[e.key];
    if (step === undefined && month === undefined) return;
    e.preventDefault();
    const v = this.view();
    const to = step !== undefined
      ? new Date(v.getFullYear(), v.getMonth(), Number(cur.textContent) + step)
      : new Date(v.getFullYear(), v.getMonth() + month!, Math.min(Number(cur.textContent), new Date(v.getFullYear(), v.getMonth() + month! + 1, 0).getDate()));
    this.view.set(new Date(to.getFullYear(), to.getMonth(), 1));
    afterNextRender(() => this.focusDay(to.getDate()), { injector: this.injector });
  }
}
