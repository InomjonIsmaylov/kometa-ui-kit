import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  KometaBanner, KometaCheck, KometaChip, KometaConfirmationService, KometaDigits, KometaField, KometaFilm, KometaFilmDay,
  KometaHalo, KometaHint, KometaLink, KometaNotes, KometaPair, KometaPerson, KometaPhoto, KometaPhotos, KometaRow,
  KometaRows, KometaSkeleton, KometaSlot, KometaSlots, KometaStars, KometaStep, KometaSteps, KometaTab, KometaTabbar,
  KometaTag, KometaTrail,
} from 'kometa-ui';

/** Kometa components this screen is built from, by docs page id, for its "Built with" list. */
export const USES: string[] = [
  'person', 'stars', 'tag', 'halo', 'photos', 'steps', 'chip', 'rows', 'film', 'slots', 'skeleton', 'field', 'digits',
  'notes', 'check', 'hint', 'banner', 'trail', 'link', 'pair', 'tabbar', 'confirm',
];

interface Service { id: string; name: string; category: string; minutes: number; price: number }
interface Master { id: string; name: string; role: string; rating: number; reviews: number; nextFree: string }

/** A gradient picture as an SVG data URL, so the demo loads nothing from the network. */
function picture(from: string, to: string, text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>`
    + `<rect width="640" height="400" fill="url(#g)"/><text x="320" y="230" font-family="sans-serif" font-size="120" fill="#fff" text-anchor="middle">${text}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const SERVICES: Service[] = [
  { id: 'cut', name: 'Classic haircut', category: 'Hair', minutes: 45, price: 80_000 },
  { id: 'fade', name: 'Skin fade', category: 'Hair', minutes: 60, price: 110_000 },
  { id: 'kids', name: 'Kids haircut (under 12)', category: 'Hair', minutes: 30, price: 60_000 },
  { id: 'beard', name: 'Beard trim & shape', category: 'Beard', minutes: 30, price: 50_000 },
  { id: 'shave', name: 'Hot towel shave', category: 'Beard', minutes: 40, price: 70_000 },
  { id: 'wash', name: 'Wash & styling', category: 'Care', minutes: 20, price: 35_000 },
  { id: 'mask', name: 'Charcoal face mask', category: 'Care', minutes: 25, price: 45_000 },
];

const MASTERS: Master[] = [
  { id: 'aziz', name: 'Aziz Rahimov', role: 'Senior barber · 9 years', rating: 4.9, reviews: 214, nextFree: '14:30' },
  { id: 'bekzod', name: 'Bekzod Aliyev', role: 'Fades & beards', rating: 4.8, reviews: 167, nextFree: '15:00' },
  { id: 'sardor', name: 'Sardor Tursunov', role: 'Barber', rating: 4.6, reviews: 58, nextFree: 'today 12:00' },
  { id: 'dilnoza', name: 'Dilnoza Karimova', role: 'Stylist · kids & styling', rating: 5, reviews: 96, nextFree: 'tomorrow 10:00' },
];

@Component({
  selector: 'app-booking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KometaBanner, KometaCheck, KometaChip, KometaDigits, KometaField, KometaFilm, KometaHalo, KometaHint, KometaLink,
    KometaNotes, KometaPair, KometaPerson, KometaPhotos, KometaRow, KometaRows, KometaSkeleton, KometaSlots, KometaStars,
    KometaStep, KometaSteps, KometaTabbar, KometaTag, KometaTrail,
  ],
  templateUrl: './booking.html',
  styleUrl: './booking.scss',
})
export class BookingScreen {
  private readonly confirmations = inject(KometaConfirmationService);

  // Shop header
  protected readonly logo = picture('#1c1a16', '#7a4b00', '✂');
  protected readonly photos: KometaPhoto[] = [
    ['#3b2a1a', '#a8692b', 'Hall'], ['#1d2b3a', '#4f7cac', 'Chairs'], ['#2e1f3d', '#8e5bb5', 'Tools'], ['#14332a', '#3fa37a', 'Lounge'],
  ].map(([from, to, name]) => ({ url: picture(from, to, name), thumbUrl: picture(from, to, name), alt: `Usta Barbershop: ${name}` }));
  protected readonly photosOpen = signal(false);
  protected readonly photoIndex = signal(0);
  protected readonly favourite = signal(false);

  protected readonly stepNames = ['Service', 'Master', 'Time', 'Details', 'Done'];
  protected readonly step = signal(1);

  // 1. Service: category chips filter the list, rows toggle a multi-select.
  protected readonly categories = ['Hair', 'Beard', 'Care'];
  protected readonly category = signal('');
  protected readonly services = computed(() => SERVICES.filter((s) => !this.category() || s.category === this.category()));
  protected readonly chosen = signal<string[]>(['cut']);
  protected readonly chosenServices = computed(() => SERVICES.filter((s) => this.chosen().includes(s.id)));
  protected readonly total = computed(() => this.chosenServices().reduce((sum, s) => sum + s.price, 0));
  protected readonly minutes = computed(() => this.chosenServices().reduce((sum, s) => sum + s.minutes, 0));

  // 2. Master
  protected readonly masters = MASTERS;
  protected readonly masterId = signal('');
  protected readonly master = computed(() => MASTERS.find((m) => m.id === this.masterId()));

  // 3. Time: the next 14 days; Sunday is a short day, a dot marks a day that is nearly full.
  protected readonly days: KometaFilmDay[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const sunday = d.getDay() === 0;
    return {
      value: isoDay(d),
      label: i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' }),
      sub: String(d.getDate()),
      muted: sunday,
      dot: !sunday && i % 4 === 1,
    };
  });
  protected readonly day = signal(this.days[0].value);
  protected readonly slot = signal('');
  protected readonly loadingSlots = signal(false);
  protected readonly slots = computed<KometaSlot[]>(() => {
    const at = this.days.findIndex((d) => d.value === this.day());
    const day = this.days[at];
    const now = new Date().getHours();
    const seed = at * 7 + this.masterId().length;
    const out: KometaSlot[] = [];
    for (let h = 10; h < (day.muted ? 16 : 21); h++) {
      for (const m of [0, 30]) {
        const n = h * 2 + m / 30;
        const busy = (seed + n * 3) % 5 < (day.dot ? 3 : 1);
        out.push({ value: `${pad(h)}:${pad(m)}`, label: `${pad(h)}:${pad(m)}`, disabled: busy || (at === 0 && h <= now) });
      }
    }
    return out;
  });
  protected readonly dayLabel = computed(() => {
    const d = new Date(`${this.day()}T00:00`);
    return d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' });
  });

  // 4. Details
  protected readonly name = signal('');
  protected readonly phone = signal('');
  protected readonly comment = signal('');
  protected readonly remind = signal(true);
  protected readonly nameError = computed(() => (this.name().trim().length === 1 ? 'Write your full first name' : ''));

  // 5. Done
  protected readonly booking = signal(false);
  protected readonly bookedAt = signal(new Date());
  protected readonly bookingUrl = 'https://kometa.uz/b/K7Q2X';

  /** Whether the footer's main button can move on from the current step. */
  protected readonly canNext = computed(() => {
    switch (this.step()) {
      case 1: return this.chosen().length > 0;
      case 2: return !!this.master();
      case 3: return !!this.slot() && !this.loadingSlots();
      case 4: return this.name().trim().length > 1 && this.phone().length === 9;
      default: return true;
    }
  });
  /** Until the step is complete the main button says what is missing (disabling k-pair would lock Back too). */
  protected readonly nextLabel = computed(() => {
    if (!this.canNext()) return ['Pick a service', 'Pick a master', 'Pick a time', 'Add name and phone'][this.step() - 1];
    return this.step() === 4 ? `Book · ${this.som(this.total())}` : 'Next';
  });

  protected readonly tabs: KometaTab[] = [
    { value: 'home', label: 'Home', icon: '⌂' },
    { value: 'bookings', label: 'Bookings', icon: '▦' },
    { value: 'profile', label: 'Profile', icon: '◉' },
  ];
  protected readonly tab = signal('home');

  protected som(amount: number): string {
    return `${amount.toLocaleString('ru-RU')} so'm`;
  }

  protected duration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    return h ? `${h} h ${minutes % 60 ? `${minutes % 60} min` : ''}`.trim() : `${minutes} min`;
  }

  /** The reminder goes out two hours before the visit. */
  protected reminderTime(): string {
    const [h, m] = this.slot().split(':').map(Number);
    return `${pad(h - 2)}:${pad(m)}`;
  }

  protected confirmedAt(): string {
    return hhmm(new Date(this.bookedAt().getTime() + 2 * 60_000));
  }

  protected bookedTime(): string {
    return hhmm(this.bookedAt());
  }

  protected openPhoto(index: number): void {
    this.photoIndex.set(index);
    this.photosOpen.set(true);
  }

  protected toggleService(id: string): void {
    this.chosen.update((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  /** A new day loads its free times from the shop; the skeleton covers the wait. */
  protected pickDay(value: string): void {
    this.day.set(value);
    this.slot.set('');
    this.loadingSlots.set(true);
    setTimeout(() => this.loadingSlots.set(false), 500);
  }

  protected back(): void {
    if (this.step() === 1) this.chosen.set([]);
    else this.step.update((s) => s - 1);
  }

  protected next(): void {
    if (!this.canNext() || this.booking()) return;
    if (this.step() < 4) {
      this.step.update((s) => s + 1);
      return;
    }
    // Step 4 books: the button spins while the shop answers.
    this.booking.set(true);
    setTimeout(() => {
      this.bookedAt.set(new Date());
      this.booking.set(false);
      this.step.set(5);
    }, 900);
  }

  protected cancelVisit(): void {
    this.confirmations.confirm({
      header: 'Cancel this visit?',
      message: `${this.master()?.name} keeps the time free for someone else. Cancelling more than 3 hours ahead is free.`,
      acceptLabel: 'Cancel visit',
      rejectLabel: 'Keep it',
      acceptButtonProps: { severity: 'danger' },
      accept: () => this.restart(),
    });
  }

  protected restart(): void {
    this.chosen.set([]);
    this.masterId.set('');
    this.slot.set('');
    this.comment.set('');
    this.step.set(1);
  }
}
