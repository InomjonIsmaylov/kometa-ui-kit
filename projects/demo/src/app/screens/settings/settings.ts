import { ChangeDetectionStrategy, Component, DestroyRef, WritableSignal, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  KometaAccordion, KometaAccordionItem, KometaAction, KometaActions, KometaBanner, KometaButton, KometaCheck, KometaCode,
  KometaConfirm, KometaConfirmationService, KometaErase, KometaField, KometaFold, KometaFrame, KometaHint, KometaMarkDay,
  KometaMarks, KometaMulti, KometaNotes, KometaNumber, KometaPair, KometaPerson, KometaPicker, KometaReveal, KometaRow,
  KometaRows, KometaSelect, KometaStepper, KometaSuggest, KometaSuggestion, KometaTime, KometaToast, KometaToastItem,
  KometaToggle, KometaUpload, KometaWord, KometaWordOption, KometaWords, ProviderLogo,
} from 'kometa-ui';

/** Kometa components this screen is built from, by docs page id, for its "Built with" list. */
export const USES: string[] = [
  'words', 'picker', 'upload', 'frame', 'field', 'select', 'suggest', 'notes', 'reveal', 'fold', 'toggle', 'time',
  'marks', 'stepper', 'rows', 'logo', 'number', 'hint', 'check', 'code', 'banner', 'accordion', 'person', 'multi',
  'actions', 'button', 'word', 'erase', 'confirm', 'pair', 'toast', 'tray',
];

/** The cover as a flat SVG data URL, so the demo needs no image files. */
function cover(from: string, to: string, text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>`
    + `<rect width="960" height="540" fill="url(#g)"/><text x="480" y="290" font-family="sans-serif" font-size="72" font-weight="700" fill="#fff" text-anchor="middle">${text}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A time of day on a fixed date, the value `k-time` works with. */
const at = (h: number, m = 0) => new Date(2026, 0, 5, h, m);
const hhmm = (d: Date) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

interface Day { label: string; name: string; open: boolean; from: Date; to: Date; }
interface Master { id: number; name: string; role: 'Master' | 'Admin'; since: string; services: string[]; }
type Payout = 'click' | 'payme';

const DISTRICTS: Record<string, string[]> = {
  tashkent: ['Chilonzor', 'Yunusobod', "Mirzo Ulug'bek", 'Yakkasaroy', 'Shayxontohur', 'Olmazor', 'Mirobod', 'Sergeli', 'Uchtepa', 'Yashnobod'],
  samarkand: ['Registon', 'Bogishamol', 'Sattepo', 'Kaftarxona'],
  bukhara: ['Gijduvon', 'Kogon', 'Vobkent', 'Romitan'],
  fergana: ['Kirgili', 'Marg‘ilon', 'Quvasoy'],
};

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, KometaAccordion, KometaAccordionItem, KometaActions, KometaBanner, KometaButton, KometaCheck, KometaCode,
    KometaConfirm, KometaErase, KometaField, KometaFold, KometaFrame, KometaHint, KometaMarks, KometaMulti, KometaNotes,
    KometaNumber, KometaPair, KometaPerson, KometaPicker, KometaReveal, KometaRow, KometaRows, KometaSelect, KometaStepper,
    KometaSuggest, KometaTime, KometaToast, KometaToggle, KometaUpload, KometaWord, KometaWords, ProviderLogo,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsScreen {
  private readonly confirmations = inject(KometaConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly section = signal('profile');

  // ---------------------------------------------------------------- Profile
  protected readonly name = signal('Barber Lab Chilonzor');
  protected readonly city = signal('tashkent');
  protected readonly district = signal('Chilonzor');
  protected readonly about = signal('Classic cuts, hot-towel shaves and beard work since 2019. Five chairs, free tea, parking behind the building.');
  protected readonly cover = signal(cover('#1c1c1c', '#a0712a', 'Barber Lab'));
  protected readonly cities = [
    { label: 'Tashkent', value: 'tashkent' }, { label: 'Samarkand', value: 'samarkand' },
    { label: 'Bukhara', value: 'bukhara' }, { label: 'Fergana', value: 'fergana' },
  ];
  protected readonly districts = signal<KometaSuggestion[]>([]);
  /** The upload in flight, if any; `progress` runs 0 to 1. */
  protected readonly upload = signal<{ name: string; size: string; progress: number } | null>(null);

  // ---------------------------------------------------------------- Hours
  protected readonly days = signal<Day[]>([
    ['Mon', 'Monday'], ['Tue', 'Tuesday'], ['Wed', 'Wednesday'], ['Thu', 'Thursday'], ['Fri', 'Friday'], ['Sat', 'Saturday'], ['Sun', 'Sunday'],
  ].map(([label, name], i) => ({ label, name, open: i < 6, from: at(i === 5 ? 10 : 9), to: at(i === 5 ? 18 : 20) })));
  protected readonly slot = signal(45);
  protected readonly buffer = signal(10);
  /** The week at a glance, read from the folds below it. */
  protected readonly week = computed<KometaMarkDay[]>(() =>
    this.days().map((d) => ({ label: d.label, mark: d.open ? `${hhmm(d.from)}\n${hhmm(d.to)}` : null })));

  // ---------------------------------------------------------------- Payments
  protected readonly payouts = signal<Record<Payout, boolean>>({ click: true, payme: false });
  /** The payout waiting for its SMS code. */
  protected readonly verifying = signal<Payout | null>(null);
  protected readonly code = signal('');
  protected readonly payoutNote = signal('');
  protected readonly deposit = signal<number | null>(50000);
  protected readonly depositNew = signal(true);
  protected readonly refund = signal(true);
  protected readonly receipts = signal(false);

  // ---------------------------------------------------------------- Team
  protected readonly serviceOptions = [
    { label: 'Haircut', value: 'cut', dot: 'var(--amber)' }, { label: 'Beard', value: 'beard', dot: 'var(--green)' },
    { label: 'Shave', value: 'shave', dot: 'var(--blue)' }, { label: 'Colour', value: 'colour', dot: 'var(--violet)' },
    { label: 'Kids', value: 'kids', dot: 'var(--red)' },
  ];
  protected readonly masters = signal<Master[]>([
    { id: 1, name: 'Aziz Rahimov', role: 'Admin', since: 'Since 2019', services: ['cut', 'beard', 'shave'] },
    { id: 2, name: 'Bekzod Aliyev', role: 'Master', since: 'Since 2021', services: ['cut', 'kids'] },
    { id: 3, name: 'Dilnoza Karimova', role: 'Master', since: 'Since 2022', services: ['cut', 'colour'] },
    { id: 4, name: 'Malika Yusupova', role: 'Master', since: 'Since 2024', services: ['colour'] },
  ]);
  /** People who will get an invite link, in order. */
  protected readonly invites = signal(['Sardor Tursunov', 'Jasur Nazarov']);
  protected readonly editing = signal<number | null>(null);
  /** Each master with their ⋯ menu, built once per change rather than on every render. */
  protected readonly team = computed(() => this.masters().map((m) => ({
    ...m,
    actions: [
      { label: 'Edit', run: () => this.editing.set(m.id) },
      { label: m.role === 'Admin' ? 'Make master' : 'Make admin', run: () => this.setMaster(m.id, { role: m.role === 'Admin' ? 'Master' : 'Admin' }) },
      { label: 'Remove', danger: true, run: () => this.remove(m) },
    ] satisfies KometaAction[],
  })));
  protected readonly tabs = computed<KometaWordOption[]>(() => [
    { value: 'profile', label: 'Profile' }, { value: 'hours', label: 'Hours' }, { value: 'payments', label: 'Payments' },
    { value: 'team', label: 'Team', count: this.masters().length }, { value: 'danger', label: 'Danger zone' },
  ]);

  // ---------------------------------------------------------------- Danger zone
  protected readonly asking = signal(false);
  protected readonly closed = signal(false);

  // ---------------------------------------------------------------- Save bar
  /** Every saved setting; Discard puts each back from the snapshot. */
  private readonly form = {
    name: this.name, city: this.city, district: this.district, about: this.about, cover: this.cover, days: this.days,
    slot: this.slot, buffer: this.buffer, payouts: this.payouts, deposit: this.deposit, depositNew: this.depositNew,
    refund: this.refund, receipts: this.receipts, masters: this.masters, invites: this.invites,
  };
  private readonly values = computed(() => Object.fromEntries(Object.entries(this.form).map(([k, s]) => [k, s()])));
  protected readonly saved = signal(this.values());
  /** The cover as last saved, the "Old" side of the compare. */
  protected readonly savedCover = computed(() => this.saved()['cover'] as string);
  protected readonly dirty = computed(() => JSON.stringify(this.values()) !== JSON.stringify(this.saved()));
  protected readonly saving = signal(false);
  protected readonly toasts = signal<KometaToastItem[]>([]);

  private uploadTimer?: ReturnType<typeof setTimeout>;
  private saveTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => { clearTimeout(this.uploadTimer); clearTimeout(this.saveTimer); });
  }

  protected findDistricts(text: string): void {
    const q = text.toLowerCase();
    this.districts.set((DISTRICTS[this.city()] ?? []).filter((d) => d.toLowerCase().includes(q)).map((label) => ({ label })));
  }

  /** Simulates sending the picked cover: the bar fills in steps, then the picture becomes the cover. */
  protected pickCover([file]: File[]): void {
    clearTimeout(this.uploadTimer);
    this.upload.set({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, progress: 0 });
    const step = () => {
      const u = this.upload()!;
      if (u.progress >= 1) { this.cover.set(URL.createObjectURL(file)); return; }
      this.upload.set({ ...u, progress: Math.min(1, u.progress + 0.12) });
      this.uploadTimer = setTimeout(step, 140);
    };
    step();
  }

  protected setDay(i: number, patch: Partial<Day>): void {
    this.days.update((days) => days.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  }

  /** Turning a payout on asks for the SMS code first; turning it off is immediate. */
  protected setPayout(which: Payout, on: boolean): void {
    this.payouts.update((p) => ({ ...p, [which]: on }));
    this.payoutNote.set('');
    this.code.set('');
    if (on) this.verifying.set(which);
    else if (this.verifying() === which) this.verifying.set(null);
  }

  protected enterCode(value: string): void {
    this.code.set(value);
    if (value.length < 6) return;
    this.payoutNote.set(`${this.verifying() === 'click' ? 'Click' : 'Payme'} payouts are on. Money arrives the next working day.`);
    this.verifying.set(null);
  }

  protected setMaster(id: number, patch: Partial<Master>): void {
    this.masters.update((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  private remove(m: Master): void {
    this.confirmations.confirm({
      header: `Remove ${m.name}?`,
      message: 'Their upcoming visits stay booked; clients can no longer pick them.',
      acceptLabel: 'Remove', rejectLabel: 'Keep', acceptButtonProps: { severity: 'danger' },
      accept: () => this.masters.update((ms) => ms.filter((x) => x.id !== m.id)),
    });
  }

  protected invite(): void {
    const [name, ...rest] = this.invites();
    this.invites.set(rest);
    this.masters.update((ms) => [...ms, { id: Date.now(), name, role: 'Master', since: 'Invite sent', services: ['cut'] }]);
  }

  protected discard(): void {
    const saved = this.saved();
    for (const [k, s] of Object.entries(this.form)) (s as WritableSignal<unknown>).set(saved[k]);
    clearTimeout(this.uploadTimer);
    this.verifying.set(null);
    this.upload.set(null);
  }

  /** Pretends to talk to the server for 900ms, then the current values become the snapshot. */
  protected save(): void {
    this.saving.set(true);
    this.saveTimer = setTimeout(() => {
      this.saving.set(false);
      this.saved.set(this.values());
      this.toasts.set([{ id: Date.now(), kind: 'success', text: 'Settings saved', life: 3000 }]);
    }, 900);
  }
}
