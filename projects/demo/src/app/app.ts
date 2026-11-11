import { Component, HostListener, Type, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  KometaAccordion, KometaAccordionItem, KometaAction, KometaActions, KometaBanner, KometaButton, KometaCheck, KometaChip,
  KometaCode, KometaConfirm, KometaConfirmationService, KometaDate, KometaDigits, KometaDrawer, KometaErase, KometaField,
  KometaFilm, KometaFilmDay, KometaFold, KometaFoldBody, KometaFoldMark, KometaFrame, KometaHalo, KometaHeading, KometaHint,
  KometaLink, KometaMarkDay, KometaMarks, KometaMenu, KometaMeter, KometaMulti, KometaNote, KometaNotes, KometaNumber,
  KometaPager, KometaPair, KometaPerson, KometaPhoto, KometaPhotos, KometaPicker, KometaPop, KometaQuiet, KometaRating,
  KometaReveal, KometaRow, KometaRows, KometaSearch, KometaSelect, KometaShare, KometaShareSegment, KometaSkeleton,
  KometaSlot, KometaSlots, KometaSort, KometaSortHeader, KometaSortOption, KometaSplit, KometaStars, KometaStep,
  KometaStepper, KometaSteps, KometaSuggest, KometaSuggestion, KometaTab, KometaTabbar, KometaTable, KometaTag, KometaTick,
  KometaTime, KometaTip, KometaToast, KometaToastItem, KometaToggle, KometaTrail, KometaTray, KometaUpload, KometaWait,
  KometaWord, KometaWordOption, KometaWords, ProviderLogo, ThemePreference, ThemeService, dateAt,
} from 'kometa-ui';
import { DocSection, Docs } from './docs';

/** The part of Angular's compiled component metadata the API tables read. */
interface ApiDef { inputs: Record<string, unknown>; outputs: Record<string, string>; selectors: string[][] }

/** A flat SVG picture as a data URL, so the demo needs no image files. */
function picture(from: string, to: string, text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>`
    + `<rect width="640" height="400" fill="url(#g)"/><text x="320" y="215" font-family="sans-serif" font-size="56" fill="#fff" text-anchor="middle">${text}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

@Component({
  imports: [
    DocSection, FormsModule,
    KometaAccordion, KometaAccordionItem, KometaActions, KometaBanner, KometaButton, KometaCheck, KometaChip, KometaCode,
    KometaConfirm, KometaDate, KometaDigits, KometaDrawer, KometaErase, KometaField, KometaFilm, KometaFold, KometaFoldBody,
    KometaFoldMark, KometaFrame, KometaHalo, KometaHeading, KometaHint, KometaLink, KometaMarks, KometaMenu, KometaMeter,
    KometaMulti, KometaNote, KometaNotes, KometaNumber, KometaPager, KometaPair, KometaPerson, KometaPhotos, KometaPicker,
    KometaPop, KometaQuiet, KometaRating, KometaReveal, KometaRow, KometaRows, KometaSearch, KometaSelect, KometaShare,
    KometaSkeleton, KometaSlots, KometaSort, KometaSortHeader, KometaSplit, KometaStars, KometaStep, KometaStepper,
    KometaSteps, KometaSuggest, KometaTabbar, KometaTable, KometaTag, KometaTick, KometaTime, KometaTip, KometaToast,
    KometaToggle, KometaTrail, KometaTray, KometaUpload, KometaWait, KometaWord, KometaWords, ProviderLogo,
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly theme = inject(ThemeService);
  private readonly confirmations = inject(KometaConfirmationService);
  protected readonly themes: ThemePreference[] = ['system', 'dark', 'light'];

  // Showcase navigation: one component page at a time, kept in the URL hash so reload and back work.
  protected readonly nav: { label: string; items: { id: string; label: string; about: string }[] }[] = [
    { label: 'Guides', items: [
      { id: 'start', label: 'Getting started', about: 'Install the kit, load its styles and use your first component.' },
      { id: 'theming', label: 'Theming', about: 'Colours and type are CSS custom properties: override them anywhere.' },
    ] },
    { label: 'Form', items: [
      { id: 'field', label: 'Field', about: 'Labelled text input with error, count and sizes.' },
      { id: 'search', label: 'Search', about: 'Search box with a clear button.' },
      { id: 'notes', label: 'Notes', about: 'A multi-line note that grows with its text.' },
      { id: 'code', label: 'Code', about: 'One-time code entry, one box per character.' },
      { id: 'digits', label: 'Digits', about: 'PIN and phone digit entry.' },
      { id: 'number', label: 'Number', about: 'Formatted numbers and money.' },
      { id: 'stepper', label: 'Stepper', about: 'A large +/- stepper for small counts.' },
      { id: 'select', label: 'Select', about: 'Single choice dropdown.' },
      { id: 'multi', label: 'Multi', about: 'Multiple choice dropdown with chips.' },
      { id: 'menu', label: 'Menu', about: 'Text-like trigger that opens a list of options.' },
      { id: 'suggest', label: 'Suggest', about: 'Autocomplete over a bare input the host styles.' },
      { id: 'toggle', label: 'Toggle', about: 'An on/off switch.' },
      { id: 'check', label: 'Check', about: 'A labelled checkbox.' },
      { id: 'tick', label: 'Tick', about: 'A bare tick for selecting rows.' },
      { id: 'chip', label: 'Chip', about: 'A selectable filter chip with a count.' },
      { id: 'words', label: 'Words', about: 'Segmented choice, or underlined tabs.' },
      { id: 'rating', label: 'Rating', about: 'A word-labelled star rating.' },
      { id: 'picker', label: 'Picker', about: 'File picker as a drop zone or a button.' },
    ] },
    { label: 'Date and time', items: [
      { id: 'date', label: 'Date', about: 'Date, range and inline calendar.' },
      { id: 'time', label: 'Time', about: 'Time of day input, works with ngModel.' },
      { id: 'film', label: 'Film', about: 'A strip of days to scroll through.' },
      { id: 'slots', label: 'Slots', about: 'Bookable time slots.' },
      { id: 'marks', label: 'Marks', about: 'A week at a glance, one mark per day.' },
    ] },
    { label: 'Button', items: [
      { id: 'button', label: 'Button', about: 'Severities, variants, sizes and states.' },
      { id: 'word', label: 'Word', about: 'A text-like button, quiet or leading.' },
      { id: 'erase', label: 'Erase', about: 'A destructive text button.' },
      { id: 'halo', label: 'Halo', about: 'A round icon button.' },
      { id: 'actions', label: 'Actions menu', about: 'A button that opens a list of actions.' },
      { id: 'confirm', label: 'Confirm', about: 'A row that turns into a question in place.' },
      { id: 'pair', label: 'Pair', about: 'Keep and confirm side by side.' },
      { id: 'tray', label: 'Tray', about: 'An app-wide confirmation dialog.' },
    ] },
    { label: 'Data', items: [
      { id: 'table', label: 'Table', about: 'Grouped, striped table driven by templates.' },
      { id: 'sort', label: 'Sort', about: 'Sort choices and sortable table headers.' },
      { id: 'pager', label: 'Pager', about: 'Page and page size control.' },
      { id: 'rows', label: 'Rows', about: 'Label/value and clickable list rows.' },
      { id: 'trail', label: 'Trail', about: 'Timeline of steps with gaps.' },
      { id: 'share', label: 'Share', about: 'A stacked share bar with a legend.' },
      { id: 'split', label: 'Split', about: 'Two amounts side by side.' },
    ] },
    { label: 'Panel', items: [
      { id: 'accordion', label: 'Accordion', about: 'Stacked questions that open one by one.' },
      { id: 'fold', label: 'Fold', about: 'A collapsible block, and its parts on their own.' },
      { id: 'heading', label: 'Heading', about: 'Section heading with an action.' },
    ] },
    { label: 'Overlay', items: [
      { id: 'drawer', label: 'Drawer', about: 'Side drawer and bottom sheet.' },
      { id: 'pop', label: 'Pop', about: 'A panel anchored to its button.' },
      { id: 'tip', label: 'Tip', about: 'A tooltip directive.' },
      { id: 'hint', label: 'Hint', about: 'A term that explains itself.' },
      { id: 'note', label: 'Note', about: 'A small info button.' },
    ] },
    { label: 'Menu', items: [
      { id: 'tabbar', label: 'Tabbar', about: 'Bottom tab navigation.' },
    ] },
    { label: 'Messages', items: [
      { id: 'tag', label: 'Tag', about: 'Status tags in every tone.' },
      { id: 'banner', label: 'Banner', about: 'Inline messages, dismissible or with an action.' },
      { id: 'toast', label: 'Toast', about: 'Short-lived messages in a corner.' },
      { id: 'upload', label: 'Upload', about: 'Progress of a file upload.' },
    ] },
    { label: 'Media', items: [
      { id: 'photos', label: 'Photos', about: 'Full-screen photo viewer.' },
      { id: 'frame', label: 'Frame', about: 'Captioned picture with rounded corners.' },
      { id: 'reveal', label: 'Reveal', about: 'Before/after comparison slider.' },
      { id: 'person', label: 'Person', about: 'Avatars with initials or a picture.' },
      { id: 'logo', label: 'Provider logo', about: 'Payment provider marks.' },
    ] },
    { label: 'Misc', items: [
      { id: 'meter', label: 'Meter', about: 'Progress toward a limit.' },
      { id: 'stars', label: 'Stars', about: 'A read-only score.' },
      { id: 'steps', label: 'Steps', about: 'Where the user is in a flow.' },
      { id: 'wait', label: 'Wait', about: 'A spinner with a screen-reader label.' },
      { id: 'skeleton', label: 'Skeleton', about: 'Placeholder rows, cards and lines while data loads.' },
      { id: 'quiet', label: 'Quiet', about: 'An empty state with a title and a hint.' },
      { id: 'link', label: 'Link', about: 'A link with a copy button.' },
    ] },
  ];
  /** What each page documents: the import line and the API tables are made from these. */
  private readonly apis: Record<string, Record<string, Type<unknown>>> = {
    field: { KometaField }, search: { KometaSearch }, notes: { KometaNotes }, code: { KometaCode }, digits: { KometaDigits },
    number: { KometaNumber }, stepper: { KometaStepper }, select: { KometaSelect }, multi: { KometaMulti }, menu: { KometaMenu },
    suggest: { KometaSuggest },
    toggle: { KometaToggle }, check: { KometaCheck }, tick: { KometaTick }, chip: { KometaChip },
    words: { KometaWords }, rating: { KometaRating },
    picker: { KometaPicker }, date: { KometaDate }, time: { KometaTime }, film: { KometaFilm }, slots: { KometaSlots }, marks: { KometaMarks },
    button: { KometaButton }, word: { KometaWord }, erase: { KometaErase }, halo: { KometaHalo }, actions: { KometaActions },
    confirm: { KometaConfirm, KometaConfirmationService }, pair: { KometaPair }, tray: { KometaTray },
    table: { KometaTable }, sort: { KometaSort, KometaSortHeader }, pager: { KometaPager }, rows: { KometaRows, KometaRow },
    trail: { KometaTrail, KometaStep }, share: { KometaShare }, split: { KometaSplit },
    accordion: { KometaAccordion, KometaAccordionItem }, fold: { KometaFold, KometaFoldMark, KometaFoldBody },
    heading: { KometaHeading }, drawer: { KometaDrawer }, pop: { KometaPop }, tip: { KometaTip }, hint: { KometaHint }, note: { KometaNote },
    tabbar: { KometaTabbar }, tag: { KometaTag }, banner: { KometaBanner }, toast: { KometaToast },
    upload: { KometaUpload }, photos: { KometaPhotos }, frame: { KometaFrame }, reveal: { KometaReveal },
    person: { KometaPerson }, logo: { ProviderLogo }, meter: { KometaMeter }, stars: { KometaStars }, steps: { KometaSteps },
    wait: { KometaWait }, skeleton: { KometaSkeleton }, quiet: { KometaQuiet }, link: { KometaLink },
  };
  private readonly pages = this.nav.flatMap((g) => g.items);
  private readonly hash = signal(location.hash.slice(1));
  protected readonly current = computed(() => this.pages.find((p) => p.id === this.hash().split('/')[0]) ?? this.pages[0]);
  protected readonly prev = computed(() => this.pages[this.pages.indexOf(this.current()) - 1]);
  protected readonly next = computed(() => this.pages[this.pages.indexOf(this.current()) + 1]);
  protected readonly menuOpen = signal(false);
  protected readonly filter = signal('');
  protected readonly filtered = computed(() => {
    const q = this.filter().trim().toLowerCase();
    return this.nav.map((g) => ({ ...g, items: g.items.filter((p) => p.label.toLowerCase().includes(q)) })).filter((g) => g.items.length);
  });
  protected readonly docs = inject(Docs);
  protected readonly active = signal('');
  protected readonly group = computed(() => this.nav.find((g) => g.items.includes(this.current()))?.label);
  protected readonly tokens = ['bg', 'card', 'input', 'border', 'text', 'text2', 'muted', 'amber', 'green', 'red', 'error', 'blue', 'violet'];
  protected readonly stylesCode = `// styles.scss: the layer order has to come first
@use 'kometa-ui/styles/layers';
@use 'kometa-ui/styles/base';`;
  protected readonly provideCode = `// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideKometaUi } from 'kometa-ui';

export const appConfig: ApplicationConfig = {
  providers: [provideKometaUi()],
};`;
  protected readonly importLine = computed(() => {
    const api = this.apis[this.current().id];
    return api ? `import { ${Object.keys(api).join(', ')} } from 'kometa-ui';` : null;
  });
  /** Inputs, two-way models and outputs, read from Angular's own component metadata, so the tables cannot go stale. */
  protected readonly api = computed(() => Object.entries(this.apis[this.current().id] ?? {}).flatMap(([name, type]) => {
    const def = (type as { ɵcmp?: ApiDef; ɵdir?: ApiDef }).ɵcmp ?? (type as { ɵdir?: ApiDef }).ɵdir;
    if (!def) return [];
    const outputs = Object.keys(def.outputs);
    const rows = [
      ...Object.keys(def.inputs).map((n) => ({ name: n, kind: outputs.includes(`${n}Change`) ? 'model' : 'input' })),
      ...outputs.filter((o) => !(o.endsWith('Change') && o.slice(0, -6) in def.inputs)).map((n) => ({ name: n, kind: 'output' })),
    ];
    const selector = def.selectors.map(([tag, ...attrs]) =>
      tag + attrs.reduce((s, a, i) => (i % 2 ? s + (a ? `=${a}]` : ']') : `${s}[${a}`), '')).join(', ');
    return [{ name, selector, rows }];
  }));

  constructor() {
    this.docs.page.set(this.current().id);
    this.revealSection();
  }

  @HostListener('window:hashchange')
  protected hashChanged(): void {
    const page = this.current().id;
    this.hash.set(location.hash.slice(1));
    this.menuOpen.set(false);
    if (page !== this.current().id) this.docs.page.set(this.current().id);
    this.revealSection();
  }

  /** `#page/section` scrolls to the section, a bare `#page` to the top. */
  private revealSection(): void {
    const section = this.hash().split('/')[1];
    // shortcut: two frames are enough for zoneless change detection to draw the new page; upgrade to afterNextRender if it ever lags.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = section && document.getElementById(section);
      if (el) el.scrollIntoView();
      else scrollTo(0, 0);
    }));
  }

  @HostListener('window:scroll')
  protected spy(): void {
    const passed = this.docs.sections().filter((s) => s.el.getBoundingClientRect().top < 120);
    this.active.set(passed.at(-1)?.id ?? '');
  }

  // Actions
  protected readonly clicks = signal(0);
  protected readonly log = signal('Nothing yet.');
  protected readonly actions: KometaAction[] = [
    { label: 'Edit', run: () => this.log.set('Edit chosen') },
    { label: 'Export', badge: 'PRO', run: () => this.log.set('Export chosen') },
    { label: 'Archive', disabled: true, run: () => {} },
    { label: 'Cancel visit', danger: true, run: () => this.log.set('Cancel chosen') },
  ];
  protected readonly asking = signal(false);
  protected readonly pairBusy = signal(false);

  // Status
  protected readonly tones = ['now', 'wait', 'book', 'done', 'warn', 'error'] as const;
  protected readonly banners = ['info', 'ok', 'warn', 'error'] as const;
  protected readonly toasts = signal<KometaToastItem[]>([]);
  private toastId = 0;
  protected readonly cWide = signal(false);
  protected readonly cTopToasts = signal<KometaToastItem[]>([]);

  // Form controls
  protected readonly name = signal('Dilnoza');
  protected readonly email = signal('');
  protected readonly code = signal('');
  protected readonly digits = signal('');
  protected readonly notes = signal('');
  protected readonly search = signal('');
  protected readonly amount = signal<number | null>(150000);
  protected readonly seats = signal(2);
  protected readonly on = signal(true);
  protected readonly chip = signal(false);
  protected readonly checked = signal(true);
  protected readonly ticked = signal(false);
  protected readonly rating = signal(4);
  protected readonly city = signal<string | null>('tas');
  protected readonly cities = [
    { label: 'Tashkent', value: 'tas' }, { label: 'Samarkand', value: 'skd' }, { label: 'Bukhara', value: 'bhk' },
    { label: 'Khiva', value: 'khv' },
  ];
  protected readonly services = signal<string[]>(['cut']);
  protected readonly serviceOptions = [
    { label: 'Haircut', value: 'cut', dot: 'var(--amber)' }, { label: 'Beard', value: 'beard', dot: 'var(--green)' },
    { label: 'Colour', value: 'colour', dot: 'var(--violet)' },
  ];
  protected readonly view = signal('day');
  protected readonly words: KometaWordOption[] = [
    { value: 'day', label: 'Day' }, { value: 'week', label: 'Week', count: 12 }, { value: 'month', label: 'Month', count: 3, hot: true },
  ];
  protected readonly client = signal('');
  protected readonly suggestions = signal<KometaSuggestion[]>([]);
  private readonly people: KometaSuggestion[] = [
    { label: 'Aziz Karimov', meta: '+998 90 123 45 67' }, { label: 'Aziza Rahimova', meta: '+998 91 765 43 21' },
    { label: 'Bekzod Aliyev', meta: '+998 93 555 00 11' },
  ];
  protected readonly picked = signal('Nothing picked.');

  // Date and time
  protected readonly day = signal<Date | null>(new Date());
  protected readonly period = signal<(Date | null)[] | null>(null);
  protected readonly time = signal<Date | null>(dateAt(14, 30));
  protected readonly film: KometaFilmDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: d.toISOString().slice(0, 10), label: String(d.getDate()),
      sub: d.toLocaleDateString('en', { weekday: 'short' }), dot: i % 3 === 0, muted: i === 5,
    };
  });
  protected readonly filmDay = signal(this.film[0].value);
  protected readonly slots: KometaSlot[] = [
    { value: '09:00', label: '09:00' }, { value: '09:30', label: '09:30', disabled: true }, { value: '10:00', label: '10:00' },
    { value: '10:30', label: '10:30', note: 'last' }, { value: '11:00', label: '11:00' },
  ];
  protected readonly slot = signal('');
  protected readonly marks: KometaMarkDay[] = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => ({ label, mark: i % 2 ? null : '●' }));

  // Navigation
  protected readonly tab = signal('a');
  protected readonly tabs: KometaTab[] = [{ value: 'a', label: 'First', icon: '' }, { value: 'b', label: 'Second', icon: '' }];
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  // Data
  protected readonly sortOptions: KometaSortOption[] = [{ value: 'name', label: 'Name' }, { value: 'price', label: 'Price' }];
  protected readonly sortKey = signal('name');
  protected readonly sortDir = signal<'asc' | 'desc'>('asc');
  private readonly rowsData = [
    { id: 1, name: 'Haircut', price: 80000, group: 'Hair' }, { id: 2, name: 'Colour', price: 250000, group: 'Hair' },
    { id: 3, name: 'Beard trim', price: 40000, group: 'Beard' },
  ];
  protected readonly sorted = computed(() => {
    const k = this.sortKey() as 'name' | 'price';
    const s = [...this.rowsData].sort((a, b) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0));
    return this.sortDir() === 'asc' ? s : s.reverse();
  });
  protected readonly share: KometaShareSegment[] = [
    { label: 'Haircut', value: 6200000, text: "6 200 000 so'm", color: 'var(--viz-1, var(--amber))' },
    { label: 'Colour', value: 3100000, text: "3 100 000 so'm", color: 'var(--viz-2, var(--green))' },
    { label: 'Beard', value: 900000, text: "900 000 so'm", color: 'var(--viz-3, var(--violet))' },
  ];

  // Overlays
  protected readonly drawer = signal(false);
  protected readonly sheet = signal(false);
  protected readonly photosOpen = signal(false);
  protected readonly photoIndex = signal(0);
  protected readonly photos: KometaPhoto[] = [
    ['#7a4b00', '#ffbf00', '1'], ['#0b3d2e', '#2ecc71', '2'], ['#2d1b4e', '#9b59b6', '3'],
  ].map(([a, b, t]) => ({ url: picture(a, b, `Photo ${t}`), thumbUrl: picture(a, b, t), alt: `Photo ${t}` }));
  protected readonly before = picture('#333', '#777', '');
  protected readonly after = picture('#7a4b00', '#ffbf00', '');
  protected readonly frame = picture('#0b3d2e', '#2ecc71', 'Frame');
  protected readonly avatar = picture('#2d1b4e', '#9b59b6', 'A');

  // Disclosure
  protected readonly fold = signal(false);
  protected readonly bare = signal(false);

  protected setTheme(next: ThemePreference): void {
    this.theme.set(next);
  }

  protected toast(kind: KometaToastItem['kind']): void {
    const item = { id: ++this.toastId, kind, text: `A ${kind} message.`, life: 4000 };
    this.toasts.update((t) => [...t, item]);
  }

  protected dismissToast(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }

  protected ask(danger: boolean): void {
    this.confirmations.confirm({
      header: danger ? 'Delete service?' : 'Leave without saving?',
      message: danger ? 'It is gone for good.' : '',
      acceptLabel: danger ? 'Delete' : 'Leave',
      rejectLabel: danger ? 'Keep it' : 'Stay',
      acceptButtonProps: danger ? { severity: 'danger' } : undefined,
      accept: () => this.log.set('Tray: accepted'),
      reject: () => this.log.set('Tray: rejected'),
    });
  }

  protected confirmPair(): void {
    this.pairBusy.set(true);
    setTimeout(() => {
      this.pairBusy.set(false);
      this.log.set('Pair: confirmed');
    }, 1200);
  }

  protected query(q: string): void {
    const s = q.toLowerCase();
    this.suggestions.set(this.people.filter((p) => p.label.toLowerCase().includes(s)));
  }

  protected sortBy(key: string): void {
    if (key === this.sortKey()) this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  protected openPhoto(i: number): void {
    this.photoIndex.set(i);
    this.photosOpen.set(true);
  }

  protected filesPicked(files: File[]): void {
    this.picked.set(files.map((f) => f.name).join(', ') || 'Nothing picked.');
  }
}
