import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import {
  KometaAccordion, KometaAccordionItem, KometaAction, KometaActions, KometaButton, KometaChip, KometaConfirm,
  KometaConfirmationService, KometaDate, KometaDigits, KometaDrawer, KometaErase, KometaField, KometaLink, KometaMulti,
  KometaNotes, KometaPager, KometaPair, KometaPerson, KometaQuiet, KometaRow, KometaRows, KometaSearch, KometaSelect,
  KometaSkeleton, KometaSort, KometaSortOption, KometaSplit, KometaStars, KometaStep, KometaTable, KometaTag, KometaTagTone,
  KometaTick, KometaToast, KometaToastItem, KometaToggle, KometaTrail, KometaWord,
} from 'kometa-ui';

/** Kometa components this screen is built from, by docs page id, for its "Built with" list. */
export const USES: string[] = [
  'search', 'chip', 'select', 'sort', 'button', 'drawer', 'field', 'digits', 'date', 'multi', 'pair', 'table', 'tick',
  'person', 'tag', 'stars', 'pager', 'quiet', 'skeleton', 'actions', 'confirm', 'word', 'erase', 'rows', 'link', 'split',
  'trail', 'notes', 'toggle', 'accordion', 'tray', 'toast',
];

// ---------------------------------------------------------------- Mock data

interface Client {
  id: number;
  name: string;
  phone: string;
  master: string;
  services: string[];
  birthday: Date | null;
  firstSeen: Date;
  lastVisit: Date;
  visits: number;
  spent: number;
  owed: number;
  /** Stars the client gave after their visits; 0 when they never rated. */
  rating: number;
  reminders: boolean;
  note: string;
}

interface Visit {
  date: Date;
  service: string;
  master: string;
  price: number;
}

type Segment = 'vip' | 'new' | 'lapsed';
type Filter = 'all' | Segment | 'owes';
type SortKey = 'name' | 'last' | 'spent';

const DAY = 86_400_000;
const TODAY = new Date(new Date().setHours(12, 0, 0, 0));
const daysAgo = (n: number) => new Date(TODAY.getTime() - n * DAY);

const MASTERS = ['Dilnoza Karimova', 'Aziz Rahimov', 'Bekzod Aliyev', 'Malika Yusupova'];
const SERVICES = [
  { label: 'Haircut', value: 'cut', price: 80_000, dot: 'var(--amber)' },
  { label: 'Fade', value: 'fade', price: 100_000, dot: 'var(--blue)' },
  { label: 'Beard trim', value: 'beard', price: 40_000, dot: 'var(--green)' },
  { label: 'Hot shave', value: 'shave', price: 60_000, dot: 'var(--violet)' },
  { label: 'Colour', value: 'colour', price: 250_000, dot: 'var(--red)' },
  { label: 'Kids cut', value: 'kids', price: 50_000, dot: 'var(--muted)' },
];
const serviceLabel = (value: string) => SERVICES.find((s) => s.value === value)?.label ?? value;

/** A small seeded generator (an LCG), so the list is the same on every load. */
function seeded(seed: number): () => number {
  return () => (seed = (seed * 1_664_525 + 1_013_904_223) % 2 ** 32) / 2 ** 32;
}

/** `901234567` → `+998 90 123 45 67`. */
const phoneOf = (d: string) => `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`.trim();

function makeClients(count: number): Client[] {
  const r = seeded(7);
  const int = (min: number, max: number) => min + Math.floor(r() * (max - min + 1));
  const pick = <T>(list: readonly T[]) => list[int(0, list.length - 1)];
  const her = ['Nilufar', 'Madina', 'Shahnoza', 'Gulnora', 'Sevara', 'Kamola', 'Zarina', 'Feruza', 'Mohira', 'Dildora'];
  const him = ['Jasur', 'Sardor', 'Otabek', 'Rustam', 'Javohir', 'Sherzod', 'Timur', 'Akmal', 'Ulugbek', 'Doniyor'];
  const surnames = ['Tursunov', 'Nazarov', 'Abdullayev', 'Ismoilov', 'Qodirov', 'Saidov', 'Ergashev', 'Umarov', 'Xolmatov'];
  const notes = ['', '', 'Prefers a short fade, no product.', 'Comes with his son on Saturdays.', 'Allergic to some dyes, patch test first.', 'Likes the 9:00 slot.'];

  return Array.from({ length: count }, (_, i) => {
    const female = r() < 0.45;
    const fresh = i % 8 === 3; // a few joined this month
    const firstAgo = fresh ? int(0, TODAY.getDate() - 1) : int(45, 900);
    const lastAgo = fresh ? int(0, firstAgo) : Math.min(firstAgo, r() < 0.25 ? int(61, 220) : int(1, 55));
    const visits = fresh ? int(1, 2) : int(3, 38);
    return {
      id: i + 1,
      name: `${female ? pick(her) : pick(him)} ${pick(surnames)}${female ? 'a' : ''}`,
      phone: phoneOf(`${pick(['90', '91', '93', '94', '97', '99'])}${int(1_000_000, 9_999_999)}`),
      master: pick(MASTERS),
      services: [...new Set([pick(SERVICES).value, pick(SERVICES).value])],
      birthday: r() < 0.8 ? new Date(int(1975, 2006), int(0, 11), int(1, 28)) : null,
      firstSeen: daysAgo(firstAgo),
      lastVisit: daysAgo(lastAgo),
      visits,
      spent: visits * int(6, 18) * 10_000,
      owed: r() < 0.15 ? int(5, 30) * 10_000 : 0,
      rating: r() < 0.2 ? 0 : int(3, 5),
      reminders: r() < 0.8,
      note: pick(notes),
    };
  });
}

/** A client's past visits, newest first, rebuilt from their record. */
function historyOf(c: Client): Visit[] {
  const r = seeded(c.id);
  let date = c.lastVisit;
  return Array.from({ length: Math.min(c.visits, 9) }, (_, i) => {
    if (i) date = new Date(date.getTime() - (14 + Math.floor(r() * 30)) * DAY);
    const service = SERVICES.find((s) => s.value === c.services[i % c.services.length])!;
    return { date, service: service.label, master: c.master, price: service.price };
  });
}

const fmtDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtShort = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const daysBetween = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / DAY);

// ---------------------------------------------------------------- Screen

/** The CRM corner of the vendor console: find, filter and act on the shop's clients. */
@Component({
  selector: 'app-clients',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KometaAccordion, KometaAccordionItem, KometaActions, KometaButton, KometaChip, KometaConfirm, KometaDate, KometaDigits,
    KometaDrawer, KometaErase, KometaField, KometaLink, KometaMulti, KometaNotes, KometaPager, KometaPair, KometaPerson,
    KometaQuiet, KometaRow, KometaRows, KometaSearch, KometaSelect, KometaSkeleton, KometaSort, KometaSplit, KometaStars,
    KometaStep, KometaTable, KometaTag, KometaTick, KometaToast, KometaToggle, KometaTrail, KometaWord,
  ],
  templateUrl: './clients.html',
  styleUrl: './clients.scss',
})
export class ClientsScreen {
  private readonly confirmation = inject(KometaConfirmationService);

  protected readonly clients = signal(makeClients(40));
  /** True until the first (pretend) fetch lands. */
  protected readonly loading = signal(true);

  // Toolbar state
  protected readonly query = signal('');
  protected readonly filter = signal<Filter>('all');
  protected readonly master = signal('');
  protected readonly masters = [{ label: 'Any', value: '' }, ...MASTERS.map((m) => ({ label: m, value: m }))];
  protected readonly sortOptions: KometaSortOption[] = [
    { value: 'name', label: 'Name' }, { value: 'last', label: 'Last visit' }, { value: 'spent', label: 'Spent' },
  ];
  protected readonly sortKey = signal<SortKey>('last');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');

  /** Search and master narrow the list; the chips then show how many of those fall in each group. */
  private readonly matching = computed(() => {
    const q = this.query().trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    return this.clients().filter((c) =>
      (!this.master() || c.master === this.master()) &&
      (!q || c.name.toLowerCase().includes(q) || (!!digits && c.phone.replace(/\D/g, '').includes(digits))));
  });

  protected readonly filters = computed(() => {
    const list = this.matching();
    const count = (f: Filter) => list.filter((c) => this.fits(c, f)).length;
    return ([
      ['all', 'All'], ['vip', 'VIP'], ['new', 'New this month'], ['lapsed', 'Lapsed 60+ days'], ['owes', 'Owes money'],
    ] as const).map(([id, label]) => ({ id, label, count: count(id) }));
  });

  protected readonly shown = computed(() => {
    const key = this.sortKey();
    const by = (c: Client) => (key === 'name' ? c.name : key === 'last' ? c.lastVisit.getTime() : c.spent);
    const list = this.matching().filter((c) => this.fits(c, this.filter()));
    list.sort((a, b) => (by(a) < by(b) ? -1 : by(a) > by(b) ? 1 : 0));
    return this.sortDir() === 'asc' ? list : list.reverse();
  });

  // Paging: back to page 1 whenever the question changes.
  protected readonly page = linkedSignal({ source: () => [this.query(), this.filter(), this.master()], computation: () => 1 });
  protected readonly pageSize = signal(10);
  protected readonly pageRows = computed(() => {
    const from = (this.page() - 1) * this.pageSize();
    return this.shown().slice(from, from + this.pageSize());
  });

  // Selection and the bulk bar
  protected readonly ticked = signal<ReadonlySet<number>>(new Set());
  protected readonly allTicked = computed(() => this.pageRows().length > 0 && this.pageRows().every((c) => this.ticked().has(c.id)));
  protected readonly askingDelete = signal(false);
  protected readonly bulkActions: KometaAction[] = [
    { label: 'Send SMS', run: () => this.say('info', `SMS queued for ${this.ticked().size} clients.`) },
    { label: 'Add tag', run: () => this.say('success', `Tagged ${this.ticked().size} clients.`) },
    { label: 'Export', badge: 'CSV', run: () => this.say('success', `Exported ${this.ticked().size} clients.`) },
  ];

  // Profile drawer
  private readonly profileId = signal<number | null>(null);
  protected readonly profileOpen = signal(false);
  protected readonly profile = computed(() => this.clients().find((c) => c.id === this.profileId()) ?? null);
  protected readonly history = computed(() => {
    const c = this.profile();
    return c ? historyOf(c) : [];
  });

  // Add-client drawer
  protected readonly addOpen = signal(false);
  protected readonly newName = signal('');
  protected readonly newPhone = signal('');
  protected readonly newBirthday = signal<Date | null>(null);
  protected readonly newServices = signal<string[]>([]);
  /** Set by the first Save, so errors show only after the user has tried. */
  protected readonly tried = signal(false);
  protected readonly nameError = computed(() => (this.tried() && this.newName().trim().length < 2 ? 'Enter a name.' : ''));
  protected readonly phoneError = computed(() => (this.tried() && this.newPhone().length < 9 ? 'Enter all 9 digits.' : ''));
  protected readonly services = SERVICES;
  protected readonly today = TODAY;

  protected readonly toasts = signal<KometaToastItem[]>([]);
  private toastId = 0;

  protected readonly fmtDate = fmtDate;
  protected readonly fmtShort = fmtShort;
  protected readonly serviceLabel = serviceLabel;

  constructor() {
    setTimeout(() => this.loading.set(false), 700);
  }

  protected segmentOf(c: Client): { tone: KometaTagTone; label: string } | null {
    if (this.fits(c, 'vip')) return { tone: 'done', label: 'VIP' };
    if (this.fits(c, 'new')) return { tone: 'wait', label: 'New' };
    if (this.fits(c, 'lapsed')) return { tone: 'warn', label: 'Lapsed' };
    return null;
  }

  private fits(c: Client, f: Filter): boolean {
    switch (f) {
      case 'vip': return c.spent >= 3_000_000;
      case 'new': return c.firstSeen.getMonth() === TODAY.getMonth() && c.firstSeen.getFullYear() === TODAY.getFullYear();
      case 'lapsed': return daysBetween(TODAY, c.lastVisit) > 60;
      case 'owes': return c.owed > 0;
      default: return true;
    }
  }

  protected som(n: number): string {
    return `${n.toLocaleString('ru-RU')} so'm`;
  }

  protected ago(d: Date): string {
    const n = daysBetween(TODAY, d);
    return n === 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`;
  }

  protected gap(a: Date, b: Date): string {
    return `${daysBetween(a, b)} days`;
  }

  /** A chip pressed off goes back to All. */
  protected pickFilter(f: Filter, on: boolean): void {
    this.filter.set(on ? f : 'all');
  }

  protected sortBy(key: string): void {
    if (key === this.sortKey()) this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      this.sortKey.set(key as SortKey);
      this.sortDir.set(key === 'name' ? 'asc' : 'desc');
    }
  }

  protected tick(id: number, on: boolean): void {
    this.ticked.update((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  protected tickPage(on: boolean): void {
    for (const c of this.pageRows()) this.tick(c.id, on);
  }

  protected clearTicks(): void {
    this.ticked.set(new Set());
    this.askingDelete.set(false);
  }

  protected deleteTicked(): void {
    const n = this.ticked().size;
    this.clients.update((list) => list.filter((c) => !this.ticked().has(c.id)));
    this.clearTicks();
    this.say('success', `Deleted ${n} clients.`);
  }

  protected openProfile(c: Client): void {
    this.profileId.set(c.id);
    this.profileOpen.set(true);
  }

  /** Writes one field of the open profile back to the list. */
  protected patchProfile(patch: Partial<Client>): void {
    const id = this.profileId();
    this.clients.update((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  protected deleteProfile(c: Client): void {
    this.confirmation.confirm({
      header: `Delete ${c.name}?`,
      message: `${c.visits} visits and the private note go with them. This cannot be undone.`,
      acceptLabel: 'Delete client',
      rejectLabel: 'Keep',
      acceptButtonProps: { severity: 'danger' },
      accept: () => {
        this.profileOpen.set(false);
        this.clients.update((list) => list.filter((x) => x.id !== c.id));
        this.tick(c.id, false);
        this.say('success', `${c.name} deleted.`);
      },
    });
  }

  protected saveClient(): void {
    this.tried.set(true);
    if (this.nameError() || this.phoneError()) return;
    const client: Client = {
      id: Math.max(0, ...this.clients().map((c) => c.id)) + 1,
      name: this.newName().trim(),
      phone: phoneOf(this.newPhone()),
      master: MASTERS[0],
      services: this.newServices(),
      birthday: this.newBirthday(),
      firstSeen: TODAY,
      lastVisit: TODAY,
      visits: 0,
      spent: 0,
      owed: 0,
      rating: 0,
      reminders: true,
      note: '',
    };
    this.clients.update((list) => [client, ...list]);
    this.say('success', `${client.name} added.`);
    this.closeAdd();
  }

  protected closeAdd(): void {
    this.addOpen.set(false);
    this.newName.set('');
    this.newPhone.set('');
    this.newBirthday.set(null);
    this.newServices.set([]);
    this.tried.set(false);
  }

  protected say(kind: KometaToastItem['kind'], text: string): void {
    this.toasts.update((t) => [...t, { id: ++this.toastId, kind, text, life: 3500 }]);
  }

  protected dismiss(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}
