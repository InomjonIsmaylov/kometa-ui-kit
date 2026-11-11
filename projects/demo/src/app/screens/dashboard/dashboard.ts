import { ChangeDetectionStrategy, Component, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import {
  KometaAction, KometaActions, KometaBanner, KometaConfirmationService, KometaDate, KometaHeading, KometaMarkDay, KometaMarks,
  KometaMeter, KometaNote, KometaPager, KometaPerson, KometaQuiet, KometaSearch, KometaShare, KometaShareSegment, KometaSkeleton,
  KometaSortHeader, KometaSplit, KometaStars, KometaStep, KometaTable, KometaTag, KometaTagTone, KometaTip, KometaToast,
  KometaToastItem, KometaTrail, KometaWordOption, KometaWords, listView, sortNum, sortText,
} from 'kometa-ui';

/** Kometa components this screen is built from, by docs page id, for its "Built with" list. */
export const USES: string[] = [
  'heading', 'words', 'date', 'banner', 'note', 'split', 'meter', 'stars', 'marks', 'share', 'table', 'sort', 'person',
  'tag', 'actions', 'tray', 'pager', 'search', 'quiet', 'tip', 'trail', 'skeleton', 'toast',
];

type Range = 'day' | 'week' | 'month';
type Status = Extract<KometaTagTone, 'now' | 'wait' | 'book' | 'done' | 'error'>;

interface Visit { id: number; time: string; client: string; master: string; service: string; price: number; status: Status }

/** Everything the figures above the table are drawn from, for one range. */
interface Figures {
  takings: number;
  trend: string;
  cash: number;
  card: number;
  booked: number;
  capacity: number;
  rating: number;
  reviews: number;
  /** Visits per day (per week for a month); null is a closed day. */
  marks: KometaMarkDay[];
  /** Takings by service, in so'm. */
  services: Record<string, number>;
}

// The mock "today": Wednesday 11 November 2026, a little after 13:00.
const TODAY = new Date(2026, 10, 11);

const FIGURES: Record<Range, Figures> = {
  day: {
    takings: 3_840_000, trend: '+12% on last Wednesday', cash: 2_610_000, card: 1_230_000, booked: 31, capacity: 40, rating: 4.9, reviews: 9,
    marks: week([27, 33, 31, null, null, null, null]),
    services: { Haircut: 1_560_000, Fade: 900_000, 'Haircut + beard': 720_000, 'Beard trim': 420_000, 'Kids haircut': 240_000 },
  },
  week: {
    takings: 21_450_000, trend: '+6% on last week', cash: 13_900_000, card: 7_550_000, booked: 188, capacity: 240, rating: 4.8, reviews: 46,
    marks: week([27, 33, 31, 29, 38, 41, null]),
    services: { Haircut: 8_400_000, Fade: 5_250_000, 'Haircut + beard': 4_320_000, 'Beard trim': 2_280_000, 'Kids haircut': 1_200_000 },
  },
  month: {
    takings: 86_900_000, trend: '−3% on October', cash: 52_300_000, card: 34_600_000, booked: 742, capacity: 1040, rating: 4.7, reviews: 173,
    marks: [
      { label: '1–8', mark: '214' }, { label: '9–15', mark: '199' }, { label: '16–22', mark: '176' },
      { label: '23–29', mark: '153' }, { label: '30', mark: null },
    ],
    services: { Haircut: 33_600_000, Fade: 21_000_000, 'Haircut + beard': 17_280_000, 'Beard trim': 9_520_000, 'Kids haircut': 5_500_000 },
  },
};

const VISITS: Visit[] = [
  { id: 1, time: '09:00', client: 'Jasur Nazarov', master: 'Aziz Rahimov', service: 'Fade', price: 150_000, status: 'done' },
  { id: 2, time: '09:30', client: 'Otabek Mirzaev', master: 'Bekzod Aliyev', service: 'Haircut + beard', price: 180_000, status: 'done' },
  { id: 3, time: '10:00', client: 'Dilnoza Karimova', master: 'Malika Yusupova', service: 'Kids haircut', price: 80_000, status: 'done' },
  { id: 4, time: '10:30', client: 'Shahzod Qodirov', master: 'Sardor Tursunov', service: 'Haircut', price: 120_000, status: 'error' },
  { id: 5, time: '11:00', client: 'Ulugbek Hasanov', master: 'Aziz Rahimov', service: 'Beard trim', price: 70_000, status: 'done' },
  { id: 6, time: '11:30', client: 'Javohir Saidov', master: 'Bekzod Aliyev', service: 'Fade', price: 150_000, status: 'done' },
  { id: 7, time: '12:30', client: 'Timur Rashidov', master: 'Sardor Tursunov', service: 'Haircut', price: 120_000, status: 'done' },
  { id: 8, time: '13:00', client: 'Farrukh Ergashev', master: 'Aziz Rahimov', service: 'Haircut + beard', price: 180_000, status: 'now' },
  { id: 9, time: '13:00', client: 'Kamola Abdullayeva', master: 'Malika Yusupova', service: 'Haircut', price: 120_000, status: 'now' },
  { id: 10, time: '14:00', client: 'Sherzod Umarov', master: 'Bekzod Aliyev', service: 'Haircut', price: 120_000, status: 'book' },
  { id: 11, time: '14:30', client: 'Akmal Xolmatov', master: 'Sardor Tursunov', service: 'Fade', price: 150_000, status: 'wait' },
  { id: 12, time: '15:00', client: 'Nodira Ismoilova', master: 'Malika Yusupova', service: 'Kids haircut', price: 80_000, status: 'book' },
  { id: 13, time: '16:00', client: 'Rustam Yuldashev', master: 'Aziz Rahimov', service: 'Fade', price: 150_000, status: 'wait' },
  { id: 14, time: '17:30', client: 'Zarina Tosheva', master: 'Bekzod Aliyev', service: 'Beard trim', price: 70_000, status: 'book' },
];

const MASTERS = [
  { name: 'Aziz Rahimov', role: 'Senior barber', slots: 9, nextFree: '14:00' },
  { name: 'Bekzod Aliyev', role: 'Barber', slots: 9, nextFree: '15:00' },
  { name: 'Sardor Tursunov', role: 'Barber', slots: 9, nextFree: '13:30' },
  { name: 'Malika Yusupova', role: 'Stylist, kids', slots: 8, nextFree: '16:30' },
];

/** Newest first, as a feed reads. */
const ACTIVITY = [
  { time: '13:12', text: 'Farrukh Ergashev paid 180 000 so\'m by card' },
  { time: '12:58', text: 'Zarina Tosheva booked online for 17:30' },
  { time: '12:40', text: 'Bekzod Aliyev confirmed Sherzod Umarov' },
  { time: '11:05', text: 'Akmal Xolmatov booked online for 14:30' },
  { time: '10:42', text: 'Shahzod Qodirov did not come; marked as cancelled' },
];

const STATUS_LABEL: Record<Status, string> = { now: 'In chair', wait: 'Unconfirmed', book: 'Booked', done: 'Paid', error: 'Cancelled' };
const COLORS = ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)', 'var(--viz-4)', 'var(--viz-5)'];

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KometaActions, KometaBanner, KometaDate, KometaHeading, KometaMarks, KometaMeter, KometaNote, KometaPager, KometaPerson, KometaQuiet,
    KometaSearch, KometaShare, KometaSkeleton, KometaSortHeader, KometaSplit, KometaStars, KometaStep, KometaTable, KometaTag, KometaTip,
    KometaToast, KometaTrail, KometaWords,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardScreen {
  private readonly confirmations = inject(KometaConfirmationService);

  protected readonly ranges: KometaWordOption[] = [
    { value: 'day', label: 'Today' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' },
  ];
  protected readonly range = signal<Range>('day');
  /** The picker follows the range switch; a hand-picked span stays until the switch moves again. */
  protected readonly period = linkedSignal<(Date | null)[] | null>(() => periodOf(this.range()));
  /** True while the figures for a new range "load". */
  protected readonly loading = signal(true);

  // ---- Figures for the range
  protected readonly figures = computed(() => FIGURES[this.range()]);
  protected readonly takings = computed(() => som(this.figures().takings));
  protected readonly split = computed(() => ({
    cash: { amount: som(this.figures().cash), label: 'Cash' },
    card: { amount: som(this.figures().card), label: 'Card' },
  }));
  protected readonly share = computed<KometaShareSegment[]>(() =>
    Object.entries(this.figures().services).map(([label, value], i) => ({ label, value, text: som(value), color: COLORS[i] })),
  );

  // ---- Today's visits
  protected readonly visits = signal(VISITS);
  protected readonly query = signal('');
  protected readonly unconfirmedOnly = signal(false);
  protected readonly unconfirmed = computed(() => this.visits().filter((v) => v.status === 'wait').length);
  protected readonly view = listView(this.visits, {
    filter: computed(() => {
      const q = this.query().trim().toLowerCase();
      const only = this.unconfirmedOnly();
      return (v: Visit) => (!only || v.status === 'wait') && [v.client, v.service, v.master].some((s) => s.toLowerCase().includes(q));
    }),
    sorts: {
      time: (a, b) => sortText(a.time, b.time),
      client: (a, b) => sortText(a.client, b.client),
      service: (a, b) => sortText(a.service, b.service),
      price: (a, b) => sortNum(a.price, b.price),
    },
    sort: 'time',
    dirs: { price: 'desc' },
    pageSize: 6,
  });
  /** Each row's ⋯ menu, rebuilt only when a visit changes. */
  protected readonly menus = computed(() => new Map(this.visits().map((v) => [v.id, this.menuFor(v)])));
  protected readonly statusLabel: Record<string, string> = STATUS_LABEL; // table rows arrive untyped (`let-row`)
  protected readonly som = som;

  // ---- Side column
  protected readonly masters = computed(() =>
    MASTERS.map((m) => ({ ...m, booked: this.visits().filter((v) => v.master === m.name && v.status !== 'error').length })),
  );
  protected readonly activity = ACTIVITY.map((a, i) => ({ ...a, gap: i < ACTIVITY.length - 1 ? gap(ACTIVITY[i + 1].time, a.time) : null }));

  protected readonly toasts = signal<KometaToastItem[]>([]);
  private toastId = 0;

  constructor() {
    // Every range switch (the first render included) shows skeletons for a moment, as a real fetch would.
    effect((onCleanup) => {
      this.range();
      this.loading.set(true);
      const timer = setTimeout(() => this.loading.set(false), 600);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected pickRange(value: string): void {
    this.range.set(value as Range);
  }

  /** The banner's action: narrow the table to the unconfirmed visits, or back to all of them. */
  protected toggleUnconfirmed(table: HTMLElement): void {
    this.unconfirmedOnly.update((on) => !on);
    table.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected dismissToast(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }

  private menuFor(v: Visit): KometaAction[] {
    const closed = v.status === 'done' || v.status === 'error';
    return [
      { label: 'Confirm', disabled: v.status !== 'wait', run: () => this.update(v, { status: 'book' }, `${v.client} is confirmed.`) },
      {
        label: 'Move +30 min', disabled: closed,
        run: () => this.update(v, { time: later(v.time, 30) }, `${v.client} moved to ${later(v.time, 30)}.`),
      },
      { label: 'Mark paid', disabled: closed, run: () => this.update(v, { status: 'done' }, `${som(v.price)} taken from ${v.client}.`) },
      { label: 'Cancel', danger: true, disabled: closed, run: () => this.cancel(v) },
    ];
  }

  private cancel(v: Visit): void {
    this.confirmations.confirm({
      header: `Cancel ${v.client}'s ${v.time} visit?`,
      message: `${v.master} gets the slot back and the client is sent a message.`,
      acceptLabel: 'Cancel visit',
      rejectLabel: 'Keep it',
      acceptButtonProps: { severity: 'danger' },
      accept: () => this.update(v, { status: 'error' }, `${v.client}'s visit is cancelled.`, 'warn'),
    });
  }

  private update(v: Visit, change: Partial<Visit>, text: string, kind: KometaToastItem['kind'] = 'success'): void {
    this.visits.update((all) => all.map((x) => (x.id === v.id ? { ...x, ...change } : x)));
    this.toasts.update((t) => [...t, { id: ++this.toastId, kind, text, life: 4000 }]);
  }
}

/** "3 840 000 so'm": thousands are grouped with spaces, as in Uzbekistan. */
function som(n: number): string {
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;
}

/** A Monday-first week of marks from visit counts. */
function week(counts: (number | null)[]): KometaMarkDay[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return counts.map((c, i) => ({ label: days[i], mark: c === null ? null : String(c) }));
}

function periodOf(range: Range): Date[] {
  const y = TODAY.getFullYear(), m = TODAY.getMonth(), d = TODAY.getDate();
  if (range === 'day') return [TODAY, TODAY];
  if (range === 'month') return [new Date(y, m, 1), new Date(y, m + 1, 0)];
  const monday = d - ((TODAY.getDay() + 6) % 7);
  return [new Date(y, m, monday), new Date(y, m, monday + 6)];
}

function minutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function later(time: string, add: number): string {
  const t = minutes(time) + add;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

/** The wait between two feed entries, in words. */
function gap(from: string, to: string): string {
  const n = minutes(to) - minutes(from);
  return n < 60 ? `${n} min` : `${Math.floor(n / 60)} h ${n % 60} min`;
}
