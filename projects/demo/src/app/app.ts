import { Component, ElementRef, HostListener, Type, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  KOMETA_ANIMATIONS, KometaAccordion, KometaAccordionItem, KometaAction, KometaActions, KometaAnimate, KometaAvatars, KometaCrumb, KometaCrumbs, KometaSlider, KometaCarousel, KometaCountdown, KometaKeys, KometaSlide, KometaTree, KometaTreeNode, KometaHue, KometaRule, KometaRules, KometaInplace, KometaBadge, KometaPanes, KometaContext, KometaContextItem, KometaReorder, KometaSwipe, KometaTally, KometaFab, KometaFabAction, KometaBanner, KometaButton, KometaCheck, KometaChip,
  KometaCode, KometaConfirm, KometaConfirmationService, KometaDate, KometaDigits, KometaDrawer, KometaErase, KometaField,
  KometaFilm, KometaFilmDay, KometaFold, KometaFoldBody, KometaFoldMark, KometaFrame, KometaHalo, KometaHeading, KometaHint,
  KometaLink, KometaMarkDay, KometaMarks, KometaMenu, KometaMeter, KometaMulti, KometaNote, KometaNotes, KometaNumber,
  KometaPager, KometaPair, KometaPerson, KometaPhoto, KometaPhotos, KometaPicker, KometaPop, KometaQuiet, KometaRating,
  KometaReveal, KometaRow, KometaRows, KometaSearch, KometaSelect, KometaShare, KometaShareSegment, KometaSkeleton,
  KometaSlot, KometaSlots, KometaSort, KometaSortHeader, KometaSortOption, KometaSplit, KometaSplitSide, KometaStars, KometaStep,
  KometaStepper, KometaSteps, KometaSuggest, KometaSuggestion, KometaTab, KometaTabbar, KometaTable, KometaTag, KometaTagTone, KometaTick,
  KometaTime, KometaTip, KometaToast, KometaToastItem, KometaToggle, KometaTrail, KometaTray, KometaUpload, KometaWait,
  KometaWord, KometaWordOption, KometaWords, ProviderLogo, ThemePreference, ThemeService, dateAt,
} from 'kometa-ui';
import { Cosmos } from './cosmos/cosmos';
import { DocSection, Docs } from './docs';
import { Home } from './home/home';
import { Playground } from './play/playground';
import { PLAY, PropsPanel } from './play/props';
import { BookingScreen, USES as bookingUses } from './screens/booking/booking';
import { ClientsScreen, USES as clientsUses } from './screens/clients/clients';
import { DashboardScreen, USES as dashboardUses } from './screens/dashboard/dashboard';
import { SettingsScreen, USES as settingsUses } from './screens/settings/settings';
import { SCREEN_FILES } from './screens/sources';
import apiMeta from './api.json';

/** The part of Angular's compiled component metadata the API tables read. */
interface ApiDef { inputs: Record<string, unknown>; outputs: Record<string, string>; selectors: string[][] }

/** Local midnight, n days from today. */
function dateIn(n: number): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** A flat SVG picture as a data URL, so the demo needs no image files. */
function picture(from: string, to: string, text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>`
    + `<rect width="640" height="400" fill="url(#g)"/><text x="320" y="215" font-family="sans-serif" font-size="56" fill="#fff" text-anchor="middle">${text}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

@Component({
  imports: [
    BookingScreen, ClientsScreen, Cosmos, DashboardScreen, DocSection, FormsModule, Home, Playground, PropsPanel, SettingsScreen,
    KometaAccordion, KometaAccordionItem, KometaActions, KometaAnimate, KometaAvatars, KometaCrumbs, KometaSlider, KometaCarousel, KometaCountdown, KometaKeys, KometaSlide, KometaTree, KometaHue, KometaRules, KometaInplace, KometaBadge, KometaPanes, KometaContext, KometaReorder, KometaSwipe, KometaTally, KometaFab, KometaBanner, KometaButton, KometaCheck, KometaChip, KometaCode,
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
    { label: 'Overview', items: [
      { id: 'home', label: 'Welcome', about: 'Kometa UI for Angular.' },
      { id: 'playground', label: 'Playground', about: 'Write a template, a class and some CSS, and watch them run. Everything in kometa-ui is in scope.' },
    ] },
    { label: 'Guides', items: [
      { id: 'start', label: 'Getting started', about: 'Install the kit, load its styles and use your first component.' },
      { id: 'theming', label: 'Theming', about: 'Colours and type are CSS custom properties: override them anywhere.' },
      { id: 'motion', label: 'Motion', about: 'Built-in and custom animations, on overlays and on any element.' },
    ] },
    { label: 'Screens', items: [
      { id: 'booking', label: 'Booking flow', about: 'A client books a haircut on a phone: service, day, time, details, done.' },
      { id: 'dashboard', label: 'Shop dashboard', about: "The owner's day at a glance: takings, load, ratings and today's visits." },
      { id: 'clients', label: 'Clients', about: 'Search, filter, select and open a client: the CRM corner of the console.' },
      { id: 'settings', label: 'Shop settings', about: 'Profile, hours, payments and team: long forms that stay calm.' },
    ] },
    { label: 'Form', items: [
      { id: 'field', label: 'Field', about: 'Labelled text input with error, count and sizes.' },
      { id: 'search', label: 'Search', about: 'Search box with a clear button.' },
      { id: 'notes', label: 'Notes', about: 'A multi-line note that grows with its text.' },
      { id: 'code', label: 'Code', about: 'One-time code entry, one box per character.' },
      { id: 'digits', label: 'Digits', about: 'PIN and phone digit entry.' },
      { id: 'number', label: 'Number', about: 'Formatted numbers and money.' },
      { id: 'slider', label: 'Slider', about: 'A value dragged along a row of ticks.' },
      { id: 'hue', label: 'Hue', about: 'A colour picked from a row of hue ticks.' },
      { id: 'rules', label: 'Rules', about: 'What a value still needs, struck through as it is met.' },
      { id: 'inplace', label: 'Inplace', about: 'A value edited where it stands, the old one struck above.' },
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
      { id: 'fab', label: 'Fab', about: 'The main action: a round button that raises words.' },
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
      { id: 'reorder', label: 'Reorder', about: 'A list put in order by lifting rows by their grip.' },
      { id: 'swipe', label: 'Swipe', about: 'Rows swiped right to finish or left to remove.' },
      { id: 'tree', label: 'Tree', about: 'A tree drawn as columns that slide in.' },
      { id: 'trail', label: 'Trail', about: 'Timeline of steps with gaps.' },
      { id: 'share', label: 'Share', about: 'A stacked share bar with a legend.' },
      { id: 'split', label: 'Split', about: 'Two amounts side by side.' },
    ] },
    { label: 'Panel', items: [
      { id: 'accordion', label: 'Accordion', about: 'Stacked questions that open one by one.' },
      { id: 'fold', label: 'Fold', about: 'A collapsible block, and its parts on their own.' },
      { id: 'heading', label: 'Heading', about: 'Section heading with an action.' },
      { id: 'panes', label: 'Panes', about: 'Two panes split by a line that snaps to ticks.' },
    ] },
    { label: 'Overlay', items: [
      { id: 'drawer', label: 'Drawer', about: 'Side drawer and bottom sheet.' },
      { id: 'pop', label: 'Pop', about: 'A panel anchored to its button.' },
      { id: 'tip', label: 'Tip', about: 'A tooltip directive.' },
      { id: 'hint', label: 'Hint', about: 'A term that explains itself.' },
      { id: 'note', label: 'Note', about: 'A small info button.' },
      { id: 'context', label: 'Context', about: 'A right-click menu on a glass card.' },
    ] },
    { label: 'Menu', items: [
      { id: 'tabbar', label: 'Tabbar', about: 'Bottom tab navigation.' },
      { id: 'crumbs', label: 'Crumbs', about: 'Where you are, as a path that walks down the page.' },
    ] },
    { label: 'Messages', items: [
      { id: 'tag', label: 'Tag', about: 'Status tags in every tone.' },
      { id: 'badge', label: 'Badge', about: 'A count on the corner of an icon.' },
      { id: 'banner', label: 'Banner', about: 'Inline messages, dismissible or with an action.' },
      { id: 'toast', label: 'Toast', about: 'Short-lived messages in a corner.' },
      { id: 'upload', label: 'Upload', about: 'Progress of a file upload.' },
    ] },
    { label: 'Media', items: [
      { id: 'photos', label: 'Photos', about: 'Full-screen photo viewer.' },
      { id: 'frame', label: 'Frame', about: 'Captioned picture with rounded corners.' },
      { id: 'carousel', label: 'Carousel', about: 'Slides with a tick pager and clickable edges.' },
      { id: 'reveal', label: 'Reveal', about: 'Before/after comparison slider.' },
      { id: 'person', label: 'Person', about: 'Avatars with initials or a picture.' },
      { id: 'avatars', label: 'Avatars', about: 'A few people as overlapping discs.' },
      { id: 'logo', label: 'Provider logo', about: 'Payment provider marks.' },
    ] },
    { label: 'Misc', items: [
      { id: 'meter', label: 'Meter', about: 'Progress toward a limit.' },
      { id: 'stars', label: 'Stars', about: 'A read-only score.' },
      { id: 'steps', label: 'Steps', about: 'Where the user is in a flow.' },
      { id: 'tally', label: 'Tally', about: 'A figure that counts up to its new value.' },
      { id: 'countdown', label: 'Countdown', about: 'Time running out, as draining ticks.' },
      { id: 'keys', label: 'Keys', about: 'A keyboard shortcut that presses itself.' },
      { id: 'wait', label: 'Wait', about: 'A spinner with a screen-reader label.' },
      { id: 'skeleton', label: 'Skeleton', about: 'Placeholder rows, cards and lines while data loads.' },
      { id: 'quiet', label: 'Quiet', about: 'An empty state with a title and a hint.' },
      { id: 'link', label: 'Link', about: 'A link with a copy button.' },
    ] },
  ];
  /** What each page documents: the import line and the API tables are made from these. */
  private readonly apis: Record<string, Record<string, Type<unknown>>> = {
    motion: { KometaAnimate },
    field: { KometaField }, search: { KometaSearch }, notes: { KometaNotes }, code: { KometaCode }, digits: { KometaDigits },
    number: { KometaNumber }, stepper: { KometaStepper }, slider: { KometaSlider }, hue: { KometaHue }, rules: { KometaRules }, inplace: { KometaInplace }, badge: { KometaBadge }, panes: { KometaPanes }, context: { KometaContext }, select: { KometaSelect }, multi: { KometaMulti }, menu: { KometaMenu },
    suggest: { KometaSuggest },
    toggle: { KometaToggle }, check: { KometaCheck }, tick: { KometaTick }, chip: { KometaChip },
    words: { KometaWords }, rating: { KometaRating },
    picker: { KometaPicker }, date: { KometaDate }, time: { KometaTime }, film: { KometaFilm }, slots: { KometaSlots }, marks: { KometaMarks },
    button: { KometaButton }, word: { KometaWord }, erase: { KometaErase }, halo: { KometaHalo }, fab: { KometaFab }, actions: { KometaActions },
    confirm: { KometaConfirm, KometaConfirmationService }, pair: { KometaPair }, tray: { KometaTray },
    table: { KometaTable }, sort: { KometaSort, KometaSortHeader }, pager: { KometaPager }, rows: { KometaRows, KometaRow },
    trail: { KometaTrail, KometaStep }, reorder: { KometaReorder }, swipe: { KometaSwipe }, tree: { KometaTree }, share: { KometaShare }, split: { KometaSplit },
    accordion: { KometaAccordion, KometaAccordionItem }, fold: { KometaFold, KometaFoldMark, KometaFoldBody },
    heading: { KometaHeading }, drawer: { KometaDrawer }, pop: { KometaPop }, tip: { KometaTip }, hint: { KometaHint }, note: { KometaNote },
    tabbar: { KometaTabbar }, crumbs: { KometaCrumbs }, tag: { KometaTag }, banner: { KometaBanner }, toast: { KometaToast },
    upload: { KometaUpload }, photos: { KometaPhotos }, frame: { KometaFrame }, reveal: { KometaReveal }, carousel: { KometaCarousel, KometaSlide },
    person: { KometaPerson }, avatars: { KometaAvatars }, logo: { ProviderLogo }, meter: { KometaMeter }, stars: { KometaStars }, steps: { KometaSteps },
    wait: { KometaWait }, tally: { KometaTally }, countdown: { KometaCountdown }, keys: { KometaKeys }, skeleton: { KometaSkeleton }, quiet: { KometaQuiet }, link: { KometaLink },
  };
  private readonly pages = this.nav.flatMap((g) => g.items);
  protected readonly screens = this.nav.find((g) => g.label === 'Screens')!.items;
  protected readonly screenFiles = SCREEN_FILES;
  /** Each screen's parts, as docs pages, for its "Built with" list. */
  protected readonly screenUses: Record<string, string[]> = {
    booking: bookingUses, dashboard: dashboardUses, clients: clientsUses, settings: settingsUses,
  };
  protected readonly componentCount = Object.keys(this.apis).length;
  /** The props panel of this page, for the components that have one. */
  protected readonly play = computed(() => PLAY[this.current().id]);
  /** The welcome page fills the window; screens drop the page outline to get the width. */
  protected readonly layout = computed(() => {
    const id = this.current().id;
    return id === 'home' ? 'home' : id in this.screenUses || id === 'playground' ? 'wide' : 'docs';
  });
  protected labelOf(id: string): string {
    return this.pages.find((p) => p.id === id)?.label ?? id;
  }
  private readonly hash = signal(location.hash.slice(1));
  protected readonly current = computed(() => this.pages.find((p) => p.id === this.hash().split('/')[0]) ?? this.pages[0]);
  protected readonly prev = computed(() => this.pages[this.pages.indexOf(this.current()) - 1]);
  protected readonly next = computed(() => this.pages[this.pages.indexOf(this.current()) + 1]);
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
    const meta = (apiMeta as Record<string, Record<string, { type: string; default?: string; required?: true }>>)[name] ?? {};
    const rows = [
      ...Object.keys(def.inputs).map((n) => ({ name: n, kind: outputs.includes(`${n}Change`) ? 'model' : 'input' })),
      ...outputs.filter((o) => !(o.endsWith('Change') && o.slice(0, -6) in def.inputs)).map((n) => ({ name: n, kind: 'output' })),
    ].map((r) => ({ ...r, ...meta[r.name] }));
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

  // Command palette: Ctrl+K or / opens it, arrows move, Enter goes.
  private readonly palette = viewChild<ElementRef<HTMLDialogElement>>('palette');
  private readonly cosmos = viewChild.required(Cosmos);
  protected readonly q = signal('');
  protected readonly hit = signal(0);
  protected readonly results = computed(() => {
    const q = this.q().trim().toLowerCase();
    return this.nav.flatMap((g) => g.items.map((p) => ({ ...p, group: g.label })))
      .filter((p) => !q || `${p.label} ${p.about} ${p.group}`.toLowerCase().includes(q)).slice(0, 12);
  });

  @HostListener('document:keydown', ['$event'])
  protected shortcut(e: KeyboardEvent): void {
    const typing = (e.target as HTMLElement).closest?.('input, textarea, [contenteditable]');
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
      e.preventDefault();
      this.openPalette();
    }
    else if (e.key.toLowerCase() === 'm' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !document.querySelector('dialog[open]')) {
      e.preventDefault();
      this.cosmos().open();
    }
  }

  protected openPalette(): void {
    this.q.set('');
    this.hit.set(0);
    const d = this.palette()?.nativeElement;
    if (!d || d.open) return;
    d.showModal();
    d.querySelector('input')?.focus();
  }

  protected paletteKey(e: KeyboardEvent): void {
    const n = this.results().length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.hit.set((this.hit() + (e.key === 'ArrowDown' ? 1 : n - 1)) % Math.max(n, 1));
    } else if (e.key === 'Enter' && n) {
      this.go(this.results()[this.hit()].id);
    }
  }

  protected go(id: string): void {
    this.palette()?.nativeElement.close();
    location.hash = id;
  }

  @HostListener('window:scroll')
  protected spy(): void {
    const passed = this.docs.sections().filter((s) => s.el.getBoundingClientRect().top < 120);
    this.active.set(passed.at(-1)?.id ?? '');
  }

  // Actions
  // #region button/severity
  protected readonly clicks = signal(0);
  // #endregion
  protected readonly log = signal('Nothing yet.');
  // #region actions/basic
  protected readonly actions: KometaAction[] = [
    { label: 'Edit', run: () => this.log.set('Edit chosen') },
    { label: 'Export', badge: 'PRO', run: () => this.log.set('Export chosen') },
    { label: 'Archive', disabled: true, run: () => {} },
    { label: 'Cancel visit', danger: true, run: () => this.log.set('Cancel chosen') },
  ];
  // #endregion
  // #region confirm/basic
  protected readonly asking = signal(false);
  // #endregion
  // #region pair/basic
  protected readonly pairBusy = signal(false);
  // #endregion

  // Status
  protected readonly tones = ['now', 'wait', 'book', 'done', 'warn', 'error'] as const;
  protected readonly banners = ['info', 'ok', 'warn', 'error'] as const;
  // #region toast/kinds
  protected readonly toasts = signal<KometaToastItem[]>([]);
  private toastId = 0;
  // #endregion
  protected readonly cWide = signal(false);
  protected readonly cTopToasts = signal<KometaToastItem[]>([]);

  // Form controls
  // #region field/basic
  protected readonly name = signal('Dilnoza');
  // #endregion
  // #region field/invalid
  protected readonly email = signal('');
  // #endregion
  // #region code/basic
  protected readonly code = signal('');
  // #endregion
  // #region digits/basic
  protected readonly digits = signal('');
  // #endregion
  // #region notes/basic
  protected readonly notes = signal('');
  // #endregion
  // #region search/basic
  protected readonly search = signal('');
  // #endregion
  // #region number/money
  protected readonly amount = signal<number | null>(150000);
  // #endregion
  // #region stepper/basic
  protected readonly seats = signal(2);
  protected readonly distance = signal(12);
  protected readonly stay = signal<(Date | null)[] | null>([dateIn(2), dateIn(8)]);
  protected readonly shopColour = signal('#E7C255');
  protected readonly shopName = signal('Usta Barber');
  protected readonly unread = signal(3);
  protected readonly paneSize = signal(33);
  protected readonly visitActions: (KometaContextItem | null)[] = [
    { label: 'Reschedule', shortcut: 'R' },
    { label: 'Duplicate', shortcut: 'Ctrl D' },
    { label: 'Send reminder' },
    null,
    { label: 'Cancel visit', shortcut: 'Del', danger: true },
  ];
  protected readonly password = signal('');
  protected readonly passwordRules: KometaRule[] = [
    { label: '8 letters', test: (v) => v.length >= 8 },
    { label: 'a number', test: /\d/ },
    { label: 'a capital', test: /[A-Z]/ },
    { label: 'a symbol', test: /[^\w\s]/ },
  ];
  protected readonly menuTree: KometaTreeNode[] = [
    { label: 'Services', children: [
      { label: 'Hair', children: [{ label: 'Haircut' }, { label: 'Fade' }, { label: 'Kids cut' }] },
      { label: 'Beard', children: [{ label: 'Trim' }, { label: 'Hot towel shave' }] },
    ] },
    { label: 'Team', children: [{ label: 'Masters' }, { label: 'Roles' }, { label: 'Schedule' }] },
    { label: 'Shop page' },
  ];
  protected readonly treePath = signal<number[]>([0, 0]);
  protected readonly slide = signal(0);
  protected readonly works = [
    { title: 'Low fade', by: 'Aziza · 40 min', image: picture('#3a2f22', '#14120e', 'Low fade') },
    { title: 'Beard trim', by: 'Dilshod · 25 min', image: picture('#22303a', '#0e1214', 'Beard trim') },
    { title: 'Kids cut', by: 'Malika · 30 min', image: picture('#2f3a22', '#11140e', 'Kids cut') },
    { title: 'Hot towel shave', by: 'Zafar · 35 min', image: picture('#3a2228', '#140e10', 'Shave') },
  ];
  protected readonly budget = signal(60000);
  protected readonly crumbs: KometaCrumb[] = [{ label: 'Shops' }, { label: 'Usta Barber' }, { label: 'Schedule' }];
  protected readonly guests = ['Aziza Karimova', 'Dilshod Saidov', 'Malika Rashidova', 'Zafar Tursunov', 'Nodira Bakirova', 'Umid Olimov']
    .map((name) => ({ name }));
  // #endregion
  // #region reorder/basic reorder/in-context reorder/customizing swipe/basic swipe/in-context swipe/swipe-one swipe/customizing tally/basic tally/in-context tally/tally-plain tally/customizing fab/basic fab/in-context fab/customizing
  protected readonly serviceOrder = signal(['Haircut', 'Fade', 'Beard trim', 'Hot towel shave', 'Kids cut']);
  protected readonly waitlist = signal([
    { name: 'Malika Rashidova', meta: 'Haircut · waiting 12 min' },
    { name: 'Aziz Tursunov', meta: 'Beard trim · waiting 8 min' },
    { name: 'Nodira Bakirova', meta: 'Fade · waiting 3 min' },
  ]);
  protected readonly nameOf = (c: { name: string }) => c.name;
  protected readonly swipeVisits = signal([
    { time: '10:00', name: 'Anvar K.', service: 'Haircut', done: false },
    { time: '11:30', name: 'Dilnoza S.', service: 'Fade', done: false },
    { time: '13:00', name: 'Jasur M.', service: 'Beard trim', done: false },
    { time: '15:00', name: 'Madina A.', service: 'Kids cut', done: false },
  ]);
  protected finishSwipe(time: string): void {
    this.swipeVisits.update((list) => list.map((v) => (v.time === time ? { ...v, done: !v.done } : v)));
  }
  protected dropSwipe(time: string): void {
    this.swipeVisits.update((list) => list.filter((v) => v.time !== time));
    this.log.set(`Visit at ${time} cancelled`);
  }
  protected readonly visitsDone = computed(() => this.swipeVisits().filter((v) => v.done).length);
  protected readonly monthVisits = signal(184);
  protected readonly monthTakings = signal(12480);
  protected addVisit(): void {
    this.monthVisits.update((n) => Math.min(240, n + 1 + Math.floor(Math.random() * 12)));
    this.monthTakings.update((n) => n + 60 + Math.floor(Math.random() * 400));
  }
  protected readonly fabActions: KometaFabAction[] = [
    { label: 'New visit', value: 'visit' },
    { label: 'Block time', value: 'block' },
    { label: 'Add client', value: 'client' },
  ];
  // #endregion
  // #region toggle/basic
  protected readonly on = signal(true);
  // #endregion
  // #region chip/basic
  protected readonly chip = signal(false);
  // #endregion
  // #region check/basic
  protected readonly checked = signal(true);
  // #endregion
  // #region tick/basic
  protected readonly ticked = signal(false);
  // #endregion
  // #region rating/basic
  protected readonly rating = signal(4);
  // #endregion
  // #region select/basic
  protected readonly city = signal<string | null>('tas');
  protected readonly cities = [
    { label: 'Tashkent', value: 'tas' }, { label: 'Samarkand', value: 'skd' }, { label: 'Bukhara', value: 'bhk' },
    { label: 'Khiva', value: 'khv' },
  ];
  // #endregion
  // #region multi/basic
  protected readonly services = signal<string[]>(['cut']);
  protected readonly serviceOptions = [
    { label: 'Haircut', value: 'cut', dot: 'var(--amber)' }, { label: 'Beard', value: 'beard', dot: 'var(--green)' },
    { label: 'Colour', value: 'colour', dot: 'var(--violet)' },
  ];
  // #endregion
  // #region words/basic
  protected readonly view = signal('day');
  protected readonly words: KometaWordOption[] = [
    { value: 'day', label: 'Day' }, { value: 'week', label: 'Week', count: 12 }, { value: 'month', label: 'Month', count: 3, hot: true },
  ];
  // #endregion
  // #region suggest/basic
  protected readonly client = signal('');
  protected readonly suggestions = signal<KometaSuggestion[]>([]);
  private readonly people: KometaSuggestion[] = [
    { label: 'Aziz Karimov', meta: '+998 90 123 45 67' }, { label: 'Aziza Rahimova', meta: '+998 91 765 43 21' },
    { label: 'Bekzod Aliyev', meta: '+998 93 555 00 11' },
  ];
  // #endregion
  protected readonly picked = signal('Nothing picked.');

  // Date and time
  // #region date/basic
  protected readonly day = signal<Date | null>(new Date());
  // #endregion
  // #region date/range
  protected readonly period = signal<(Date | null)[] | null>(null);
  // #endregion
  // #region time/basic
  protected readonly time = signal<Date | null>(dateAt(14, 30));
  // #endregion
  // #region film/basic
  protected readonly film: KometaFilmDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: d.toISOString().slice(0, 10), label: String(d.getDate()),
      sub: d.toLocaleDateString('en', { weekday: 'short' }), dot: i % 3 === 0, muted: i === 5,
    };
  });
  protected readonly filmDay = signal(this.film[0].value);
  // #endregion
  // #region slots/basic
  protected readonly slots: KometaSlot[] = [
    { value: '09:00', label: '09:00' }, { value: '09:30', label: '09:30', disabled: true }, { value: '10:00', label: '10:00' },
    { value: '10:30', label: '10:30', note: 'last' }, { value: '11:00', label: '11:00' },
  ];
  protected readonly slot = signal('');
  // #endregion
  // #region marks/basic
  protected readonly marks: KometaMarkDay[] = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => ({ label, mark: i % 2 ? null : '●' }));
  // #endregion

  // Navigation
  // #region tabbar/basic
  protected readonly tab = signal('a');
  protected readonly tabs: KometaTab[] = [{ value: 'a', label: 'First', icon: '' }, { value: 'b', label: 'Second', icon: '' }];
  // #endregion
  // #region pager/basic
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  // #endregion

  // Data
  // #region sort/basic
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
  // #endregion
  // #region share/basic
  protected readonly share: KometaShareSegment[] = [
    { label: 'Haircut', value: 6200000, text: "6 200 000 so'm", color: 'var(--viz-1, var(--amber))' },
    { label: 'Colour', value: 3100000, text: "3 100 000 so'm", color: 'var(--viz-2, var(--green))' },
    { label: 'Beard', value: 900000, text: "900 000 so'm", color: 'var(--viz-3, var(--violet))' },
  ];
  // #endregion

  // Overlays
  // #region drawer/basic
  protected readonly drawer = signal(false);
  protected readonly sheet = signal(false);
  // #endregion
  // #region photos/gallery
  protected readonly photosOpen = signal(false);
  protected readonly photoIndex = signal(0);
  protected readonly photos: KometaPhoto[] = [
    ['#7a4b00', '#ffbf00', '1'], ['#0b3d2e', '#2ecc71', '2'], ['#2d1b4e', '#9b59b6', '3'],
  ].map(([a, b, t]) => ({ url: picture(a, b, `Photo ${t}`), thumbUrl: picture(a, b, t), alt: `Photo ${t}` }));
  // #endregion
  protected readonly before = picture('#333', '#777', '');
  protected readonly after = picture('#7a4b00', '#ffbf00', '');
  protected readonly frame = picture('#0b3d2e', '#2ecc71', 'Frame');
  protected readonly avatar = picture('#2d1b4e', '#9b59b6', 'A');

  // Disclosure
  // #region fold/fold
  protected readonly fold = signal(false);
  // #endregion
  // #region fold/parts
  protected readonly bare = signal(false);
  // #endregion

  // #region pop/animation select/animation multi/animation date/animation time/animation actions/animation note/animation tip/animation toast/animation tray/animation drawer/animation
  /** Every built-in motion, the component's own (empty) and a custom pair of keyframes from styles.scss. */
  protected readonly animations = [
    { label: 'default', value: '' },
    ...KOMETA_ANIMATIONS.map((a) => ({ label: a, value: a })),
    { label: 'custom: swoosh', value: 'demo-swoosh-in demo-swoosh-out' },
  ];
  protected readonly anim = signal('');
  // #endregion
  // #region toast/animation
  protected readonly animToasts = signal<KometaToastItem[]>([]);
  protected animToast(): void {
    this.animToasts.update((t) => [...t, { id: ++this.toastId, kind: 'success', text: `Arrived with ${this.anim() || 'its own motion'}.`, life: 3000 }]);
  }
  protected dropAnimToast(id: number): void {
    this.animToasts.update((t) => t.filter((x) => x.id !== id));
  }
  // #endregion
  // #region drawer/animation
  protected readonly animDrawer = signal(false);
  // #endregion
  // #region motion/presets
  protected readonly presets = KOMETA_ANIMATIONS.filter((a) => a !== 'none');
  // #endregion
  // #region motion/view
  protected readonly feed = ['Aziz booked a beard trim', 'Malika left five stars', 'Payment of 120 000 received', 'Timur moved to 15:30',
    'New client: Dilnoza', 'Saturday is almost full', 'Rustam asked for a refund', 'Shop rating is now 4.9'];
  // #endregion
  // #region motion/custom
  protected readonly swoosh = signal(false);
  // #endregion

  protected setTheme(next: ThemePreference): void {
    this.theme.set(next);
  }

  // #region toast/kinds
  protected toast(kind: KometaToastItem['kind']): void {
    const item = { id: ++this.toastId, kind, text: `A ${kind} message.`, life: 4000 };
    this.toasts.update((t) => [...t, item]);
  }

  protected dismissToast(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
  // #endregion

  // #region tray/basic
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
  // #endregion

  // #region pair/basic
  protected confirmPair(): void {
    this.pairBusy.set(true);
    setTimeout(() => {
      this.pairBusy.set(false);
      this.log.set('Pair: confirmed');
    }, 1200);
  }
  // #endregion

  // #region suggest/basic
  protected query(q: string): void {
    const s = q.toLowerCase();
    this.suggestions.set(this.people.filter((p) => p.label.toLowerCase().includes(s)));
  }
  // #endregion

  // #region sort/basic
  protected sortBy(key: string): void {
    if (key === this.sortKey()) this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }
  // #endregion

  // #region photos/gallery
  protected openPhoto(i: number): void {
    this.photoIndex.set(i);
    this.photosOpen.set(true);
  }
  // #endregion

  protected filesPicked(files: File[]): void {
    this.picked.set(files.map((f) => f.name).join(', ') || 'Nothing picked.');
  }

  // ---------------- In context examples

  // #region field/in-context
  protected readonly signupName = signal('');
  protected readonly signupPhone = signal('');
  protected readonly signupTerms = signal(false);
  protected readonly signupTried = signal(false);
  protected readonly signupBusy = signal(false);
  protected readonly signupValid = computed(() =>
    this.signupName().trim().length > 1 && this.signupPhone().length === 9 && this.signupTerms());

  protected signUp(): void {
    this.signupTried.set(true);
    if (!this.signupValid()) return;
    this.signupBusy.set(true);
    setTimeout(() => {
      this.signupBusy.set(false);
      this.log.set(`Account created for ${this.signupName()}`);
    }, 900);
  }
  // #endregion

  // #region search/in-context
  protected readonly lookupQ = signal('');
  private readonly lookupClients: { name: string; phone: string; tag: string; tone: KometaTagTone }[] = [
    { name: 'Dilnoza Karimova', phone: '+998 90 123 45 67', tag: 'Regular', tone: 'done' },
    { name: 'Aziz Rahimov', phone: '+998 91 555 20 10', tag: 'New', tone: 'book' },
    { name: 'Malika Yusupova', phone: '+998 93 410 77 02', tag: 'VIP', tone: 'now' },
    { name: 'Sardor Tursunov', phone: '+998 97 300 11 45', tag: '2 no-shows', tone: 'warn' },
  ];
  protected readonly lookupHits = computed(() => {
    const q = this.lookupQ().toLowerCase().replace(/\s/g, '');
    return this.lookupClients.filter((c) => (c.name + c.phone).toLowerCase().replace(/\s/g, '').includes(q));
  });
  // #endregion

  // #region notes/in-context
  protected readonly memo = signal('');
  protected readonly memoPhrases = ['Short on the sides', 'Keep the length', 'Beard trim too', 'A quiet visit, please'];

  protected togglePhrase(phrase: string, on: boolean): void {
    const rest = this.memo().split('. ').filter((s) => s && s !== phrase);
    this.memo.set((on ? [...rest, phrase] : rest).join('. '));
  }
  // #endregion

  // #region code/in-context
  protected readonly otp = signal('');
  // #endregion

  // #region digits/in-context
  protected readonly callPhone = signal('');
  protected readonly callAsked = signal(false);
  // #endregion

  // #region number/in-context
  protected readonly priceList = signal<{ name: string; minutes: number; price: number | null }[]>([
    { name: 'Haircut', minutes: 40, price: 80000 },
    { name: 'Beard trim', minutes: 20, price: 40000 },
    { name: 'Haircut and beard', minutes: 60, price: 110000 },
    { name: 'Kids haircut', minutes: 30, price: 60000 },
  ]);
  protected readonly priceAverage = computed(() =>
    Math.round(this.priceList().reduce((sum, s) => sum + (s.price ?? 0), 0) / this.priceList().length));

  protected setPrice(i: number, price: number | null): void {
    this.priceList.update((list) => list.map((s, j) => (j === i ? { ...s, price } : s)));
  }
  // #endregion

  // #region slider/in-context hue/in-context rules/in-context inplace/in-context badge/in-context panes/in-context context/in-context crumbs/in-context tree/in-context carousel/in-context countdown/in-context
  protected readonly radius = signal(4);
  protected readonly nearby = computed(() => Math.round(this.radius() * 2.6));
  protected readonly brand = signal('#E7C255');
  protected readonly signupPassword = signal('');
  protected readonly signupReady = computed(() => this.passwordRules.every((r) =>
    typeof r.test === 'function' ? r.test(this.signupPassword()) : this.signupPassword().search(r.test) >= 0));
  protected readonly clientPhone = signal('+998 90 123 45 67');
  protected readonly clientUsual = signal('Low fade, no beard');
  protected readonly clientNote = signal('');
  protected readonly newBookings = signal(2);
  protected readonly newMessages = signal(5);
  protected readonly clientsSplit = signal(33);
  protected readonly paneClients = [
    { name: 'Anvar Karimov', meta: '12 visits · last 2 Nov', note: 'Prefers a fade, no beard trim. Pays by card.' },
    { name: 'Malika Rashidova', meta: '4 visits · last 28 Oct', note: 'Colour every six weeks; allergic to ammonia.' },
    { name: 'Zafar Tursunov', meta: '1 visit · last 30 Oct', note: 'Came from Instagram. Hot towel shave.' },
  ];
  protected readonly paneClient = signal(this.paneClients[0]);
  protected readonly dayVisits = signal<{ time: string; who: string; state: string; tone: KometaTagTone }[]>([
    { time: '10:00', who: 'Anvar K. · Haircut', state: 'Booked', tone: 'book' },
    { time: '11:30', who: 'Malika R. · Colour', state: 'Booked', tone: 'book' },
    { time: '13:00', who: 'Zafar T. · Shave', state: 'Booked', tone: 'book' },
  ]);
  protected actOnVisit(time: string, action: string): void {
    if (action === 'Cancel visit') this.dayVisits.update((vs) => vs.map((v) => (v.time === time ? { ...v, state: 'Cancelled', tone: 'warn' } : v)));
    this.log.set(`${action} · ${time}`);
  }
  /** Where the settings walk is: labels from the top of menuTree. */
  private readonly setPath = signal<string[]>(['Services']);
  protected readonly setCrumbs = computed<KometaCrumb[]>(() => ['Settings', ...this.setPath()].map((label) => ({ label })));
  protected readonly setHere = computed(() => this.setPath().reduce<KometaTreeNode[]>((nodes, l) => nodes.find((n) => n.label === l)?.children ?? [], this.menuTree));
  protected descend(label: string): void { this.setPath.update((p) => [...p, label]); }
  protected climb(c: KometaCrumb): void {
    const at = this.setCrumbs().findIndex((x) => x === c);
    if (at >= 0) this.setPath.set(this.setPath().slice(0, at));
  }
  protected readonly servicePath = signal<number[]>([]);
  protected readonly service = signal('');
  protected readonly profileSlide = signal(0);
  protected readonly smsCode = signal('');
  protected readonly canResend = signal(false);
  protected readonly resends = signal(0);
  protected resend(): void {
    this.canResend.set(false);
    this.resends.update((n) => n + 1);
    this.log.set('Code sent again');
  }
  // #endregion
  // #region stepper/in-context
  protected readonly groupSize = signal(3);
  protected readonly groupChairs = 6;
  protected readonly groupPrice = computed(() => this.groupSize() * 80000);
  // #endregion

  // #region select/in-context
  protected readonly teamBranch = signal('chilonzor');
  protected readonly teamRole = signal('any');
  protected readonly teamBranches = [
    { label: 'Chilonzor', value: 'chilonzor' }, { label: 'Yunusobod', value: 'yunusobod' }, { label: 'Mirzo Ulugbek', value: 'mirzo' },
  ];
  protected readonly teamRoles = [{ label: 'Anyone', value: 'any' }, { label: 'Barber', value: 'Barber' }, { label: 'Stylist', value: 'Stylist' }];
  private readonly team = [
    { name: 'Aziz Rahimov', role: 'Barber', branch: 'chilonzor' },
    { name: 'Dilnoza Karimova', role: 'Stylist', branch: 'chilonzor' },
    { name: 'Malika Yusupova', role: 'Stylist', branch: 'yunusobod' },
    { name: 'Jasur Nazarov', role: 'Barber', branch: 'yunusobod' },
    { name: 'Bekzod Aliyev', role: 'Barber', branch: 'mirzo' },
  ];
  protected readonly teamShown = computed(() =>
    this.team.filter((m) => m.branch === this.teamBranch() && (this.teamRole() === 'any' || m.role === this.teamRole())));
  // #endregion

  // #region multi/in-context
  protected readonly orderServices = signal<string[]>(['cut']);
  protected readonly orderOptions = [
    { label: 'Haircut', value: 'cut', dot: 'var(--amber)', price: 80000, minutes: 40 },
    { label: 'Beard trim', value: 'beard', dot: 'var(--green)', price: 40000, minutes: 20 },
    { label: 'Hair wash', value: 'wash', dot: 'var(--blue)', price: 20000, minutes: 10 },
    { label: 'Colour', value: 'colour', dot: 'var(--violet)', price: 250000, minutes: 90 },
  ];
  protected readonly orderTotal = computed(() => {
    const picked = this.orderOptions.filter((o) => this.orderServices().includes(o.value));
    return { price: picked.reduce((s, o) => s + o.price, 0), minutes: picked.reduce((s, o) => s + o.minutes, 0) };
  });
  // #endregion

  // #region menu/in-context
  protected readonly agendaView = signal('day');
  protected readonly agendaViews: KometaWordOption[] = [
    { value: 'day', label: 'Today', count: 4 }, { value: 'week', label: 'This week', count: 42 },
  ];
  protected readonly agendaSlots: KometaSlot[] = [
    { value: '10:00', label: '10:00', disabled: true }, { value: '11:30', label: '11:30' },
    { value: '13:00', label: '13:00', disabled: true }, { value: '15:30', label: '15:30', note: 'last' },
  ];
  protected readonly agendaWeek: KometaMarkDay[] = [
    { label: 'Mon', mark: '6' }, { label: 'Tue', mark: '5' }, { label: 'Wed', mark: '7' }, { label: 'Thu', mark: '4' },
    { label: 'Fri', mark: '9' }, { label: 'Sat', mark: '11' }, { label: 'Sun', mark: null },
  ];
  // #endregion

  // #region suggest/in-context
  protected readonly visitClient = signal('');
  protected readonly visitHits = signal<KometaSuggestion[]>([]);
  protected readonly visitPicked = signal<KometaSuggestion | null>(null);
  private readonly visitBook: KometaSuggestion<string>[] = [
    { label: 'Dilnoza Karimova', meta: '+998 90 123 45 67', data: '14 visits, last 2 weeks ago' },
    { label: 'Dilshod Ergashev', meta: '+998 94 222 81 30', data: '2 visits, last in March' },
    { label: 'Aziz Rahimov', meta: '+998 91 555 20 10', data: '6 visits, last yesterday' },
  ];

  protected findClient(q: string): void {
    const s = q.toLowerCase().replace(/\s/g, '');
    this.visitHits.set(this.visitBook.filter((c) => (c.label + c.meta).toLowerCase().replace(/\s/g, '').includes(s)));
  }
  // #endregion

  // #region toggle/in-context
  protected readonly alertSms = signal(true);
  protected readonly alertTelegram = signal(true);
  protected readonly alertBooking = signal(true);
  protected readonly alertReport = signal(false);
  // #endregion

  // #region check/in-context
  protected readonly prep = signal([
    { text: 'Patch test done 48 hours ago', done: true, required: true },
    { text: "Client agreed to the price, 250 000 so'm", done: false, required: true },
    { text: 'Before photo taken', done: false, required: false },
  ]);
  protected readonly prepDone = computed(() => this.prep().filter((p) => p.done).length);
  protected readonly prepReady = computed(() => this.prep().every((p) => p.done || !p.required));

  protected setPrep(i: number, done: boolean): void {
    this.prep.update((list) => list.map((p, j) => (j === i ? { ...p, done } : p)));
  }
  // #endregion

  // #region tick/in-context
  protected readonly remindList = [
    { name: 'Dilnoza Karimova', meta: 'Haircut · tomorrow 10:00' },
    { name: 'Aziz Rahimov', meta: 'Beard trim · tomorrow 11:30' },
    { name: 'Malika Yusupova', meta: 'Colour · tomorrow 14:00' },
    { name: 'Sardor Tursunov', meta: 'Haircut · tomorrow 17:30' },
  ];
  protected readonly remindPicked = signal<string[]>([]);
  protected readonly remindAll = computed(() => this.remindPicked().length === this.remindList.length);

  protected pickRemind(name: string, on: boolean): void {
    this.remindPicked.update((p) => (on ? [...p, name] : p.filter((n) => n !== name)));
  }

  protected pickAllRemind(on: boolean): void {
    this.remindPicked.set(on ? this.remindList.map((r) => r.name) : []);
  }
  // #endregion

  // #region chip/in-context
  protected readonly findOpen = signal(false);
  protected readonly findTop = signal(false);
  protected readonly findBeard = signal(false);
  private readonly findMasters = [
    { name: 'Aziz Rahimov', meta: 'Barber · Chilonzor', score: 4.9, open: true, beard: true },
    { name: 'Dilnoza Karimova', meta: 'Stylist · Chilonzor', score: 4.7, open: false, beard: false },
    { name: 'Jasur Nazarov', meta: 'Barber · Yunusobod', score: 4.3, open: true, beard: true },
    { name: 'Malika Yusupova', meta: 'Stylist · Yunusobod', score: 4.8, open: true, beard: false },
  ];
  protected readonly findCounts = {
    open: this.findMasters.filter((m) => m.open).length,
    top: this.findMasters.filter((m) => m.score >= 4.5).length,
    beard: this.findMasters.filter((m) => m.beard).length,
  };
  protected readonly findShown = computed(() => this.findMasters.filter((m) =>
    (!this.findOpen() || m.open) && (!this.findTop() || m.score >= 4.5) && (!this.findBeard() || m.beard)));
  // #endregion

  // #region words/in-context
  protected readonly takingsPeriod = signal('today');
  protected readonly takingsPeriods: KometaWordOption[] = [
    { value: 'today', label: 'Today' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' },
  ];
  private readonly takingsData: Record<string, [KometaSplitSide, KometaSplitSide]> = {
    today: [{ amount: '1 240 000', label: 'Cash' }, { amount: '860 000', label: 'Card' }],
    week: [{ amount: '7 900 000', label: 'Cash' }, { amount: '5 300 000', label: 'Card' }],
    month: [{ amount: '31 400 000', label: 'Cash' }, { amount: '24 100 000', label: 'Card' }],
  };
  protected readonly takings = computed(() => this.takingsData[this.takingsPeriod()]);
  // #endregion

  // #region rating/in-context
  protected readonly reviewScore = signal(0);
  protected readonly reviewText = signal('');
  protected readonly reviewSent = signal(false);
  // #endregion

  // #region picker/in-context
  protected readonly portfolio = signal<{ name: string; size: string; progress: number; state: 'running' | 'done' | 'failed' }[]>([]);

  protected addToPortfolio(files: File[]): void {
    for (const f of files) {
      const big = f.size > 5_000_000;
      const size = `${Math.max(1, Math.round(f.size / 1024))} KB`;
      this.portfolio.update((list) => [...list, { name: f.name, size, progress: 0, state: big ? 'failed' : 'running' }]);
      if (big) continue;
      const tick = setInterval(() => this.portfolio.update((list) => list.map((u) => {
        if (u.name !== f.name || u.state !== 'running') return u;
        const progress = Math.min(1, u.progress + 0.2);
        if (progress >= 1) clearInterval(tick);
        return { ...u, progress, state: progress >= 1 ? 'done' : 'running' };
      })), 300);
    }
  }
  // #endregion

  // #region date/in-context
  protected readonly leave = signal<(Date | null)[] | null>(null);
  protected readonly leaveNote = signal('');
  protected readonly leaveMin = new Date();
  protected readonly leaveDays = computed(() => {
    const [from, to] = this.leave() ?? [];
    return from && to ? Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1 : 0;
  });
  // #endregion

  // #region date/booking
  protected readonly bookDay = signal<Date | null>(null);
  protected readonly bookTime = signal('');
  protected readonly bookMin = new Date();
  protected readonly bookSlots = computed<KometaSlot[]>(() => {
    const d = this.bookDay();
    if (!d || d.getDay() === 0) return [];
    const busy = d.getDate() % 3;
    return ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30'].map((t, i) => ({ value: t, label: t, disabled: i % 3 === busy }));
  });
  // #endregion

  // #region time/in-context
  protected readonly workHours = [
    { day: 'Mon – Fri', open: signal(true), from: signal<Date | null>(dateAt(9, 0)), to: signal<Date | null>(dateAt(20, 0)) },
    { day: 'Saturday', open: signal(true), from: signal<Date | null>(dateAt(10, 0)), to: signal<Date | null>(dateAt(18, 0)) },
    { day: 'Sunday', open: signal(false), from: signal<Date | null>(dateAt(10, 0)), to: signal<Date | null>(dateAt(16, 0)) },
  ];
  // #endregion

  // #region film/in-context
  protected readonly shiftDays: KometaFilmDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { value: String(i), label: String(d.getDate()), sub: d.toLocaleDateString('en', { weekday: 'short' }), dot: i % 2 === 0, muted: i % 2 === 1 };
  });
  protected readonly shiftDay = signal('0');
  private readonly shiftPlans = [
    [
      { time: '10:00', who: 'Dilnoza Karimova · haircut', gap: '1 h 20 min' },
      { time: '11:20', who: 'Aziz Rahimov · beard trim', gap: '2 h' },
      { time: '13:20', who: 'Malika Yusupova · colour', gap: null },
    ],
    [
      { time: '09:30', who: 'Sardor Tursunov · haircut', gap: '50 min' },
      { time: '10:20', who: 'Jasur Nazarov · haircut and beard', gap: null },
    ],
  ];
  protected readonly shiftVisits = computed(() => {
    const i = Number(this.shiftDay());
    return i % 2 ? [] : this.shiftPlans[(i / 2) % 2];
  });
  // #endregion

  // #region slots/in-context
  protected readonly pickDays: KometaFilmDay[] = Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { value: String(i), label: String(d.getDate()), sub: d.toLocaleDateString('en', { weekday: 'short' }), muted: d.getDay() === 0 };
  });
  protected readonly pickDay = signal('0');
  protected readonly pickTime = signal('');
  protected readonly pickSlots = computed<KometaSlot[]>(() => {
    const i = Number(this.pickDay());
    if (this.pickDays[i].muted) return [];
    return ['10:00', '10:45', '11:30', '13:00', '14:15', '15:00', '16:30', '18:00'].map((t, j) => ({
      value: t, label: t, disabled: (i + j) % 3 === 0, note: j === 7 ? 'last' : undefined,
    }));
  });
  // #endregion

  // #region marks/in-context
  protected readonly rota = [
    { name: 'Aziz Rahimov', meta: 'Barber · 6 days', today: true, days: this.rotaWeek('xxxxxx-') },
    { name: 'Dilnoza Karimova', meta: 'Stylist · 4 days', today: false, days: this.rotaWeek('x-x-xx-') },
    { name: 'Jasur Nazarov', meta: 'Barber · part time', today: true, days: this.rotaWeek('--xxx--') },
  ];

  private rotaWeek(pattern: string): KometaMarkDay[] {
    return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => ({ label, mark: pattern[i] === 'x' ? '●' : null }));
  }
  // #endregion

  // #region button/in-context
  protected readonly cart = signal([
    { name: 'Haircut', price: 80000 }, { name: 'Beard trim', price: 40000 }, { name: 'Hot towel', price: 15000 },
  ]);
  protected readonly cartTotal = computed(() => this.cart().reduce((s, i) => s + i.price, 0));
  protected readonly payWith = signal('click');
  protected readonly paying = signal(false);
  protected readonly paid = signal(false);

  protected checkout(): void {
    this.paying.set(true);
    setTimeout(() => {
      this.paying.set(false);
      this.paid.set(true);
      this.log.set(`Paid ${this.cartTotal()} so'm by ${this.payWith()}`);
    }, 1200);
  }
  // #endregion

  // #region word/in-context
  protected readonly nextVisit = signal<'book' | 'now' | 'done'>('book');
  // #endregion

  // #region erase/in-context
  protected readonly menuItems = signal([
    { name: 'Haircut', price: "80 000 so'm" }, { name: 'Beard trim', price: "40 000 so'm" }, { name: 'Kids haircut', price: "60 000 so'm" },
  ]);

  protected removeService(name: string): void {
    this.confirmations.confirm({
      header: `Delete “${name}”?`,
      message: 'Clients can no longer book it. Past visits keep their records.',
      acceptLabel: 'Delete',
      rejectLabel: 'Keep it',
      acceptButtonProps: { severity: 'danger' },
      accept: () => {
        this.menuItems.update((list) => list.filter((s) => s.name !== name));
        this.log.set(`${name} deleted`);
      },
    });
  }
  // #endregion

  // #region actions/in-context
  protected readonly queueWords: Record<string, string> = { book: 'Booked', wait: 'Unconfirmed', now: 'In the chair', done: 'Done', error: 'Cancelled' };
  protected readonly queue = signal([
    { id: 1, time: '10:00', name: 'Dilnoza Karimova', service: 'Haircut', status: 'book' as KometaTagTone },
    { id: 2, time: '11:30', name: 'Aziz Rahimov', service: 'Beard trim', status: 'wait' as KometaTagTone },
    { id: 3, time: '13:00', name: 'Sardor Tursunov', service: 'Haircut and beard', status: 'book' as KometaTagTone },
  ].map((v) => ({ ...v, actions: this.queueActions(v.id) })));

  private queueActions(id: number): KometaAction[] {
    const set = (status: KometaTagTone) => () => {
      this.queue.update((q) => q.map((v) => (v.id === id ? { ...v, status } : v)));
      this.log.set(`Visit ${id}: ${this.queueWords[status]}`);
    };
    return [
      { label: 'Start visit', run: set('now') },
      { label: 'Mark done', run: set('done') },
      { label: 'Send reminder', badge: 'SMS', run: () => this.log.set(`Reminder sent for visit ${id}`) },
      { label: 'Cancel visit', danger: true, run: set('error') },
    ];
  }
  // #endregion

  // #region confirm/in-context
  protected readonly debts = signal([
    { id: 1, name: 'Aziz Rahimov', what: "Haircut · 80 000 so'm", paid: false },
    { id: 2, name: 'Malika Yusupova', what: "Colour · 250 000 so'm", paid: false },
    { id: 3, name: 'Sardor Tursunov', what: "Beard trim · 40 000 so'm", paid: true },
  ]);
  protected readonly debtAsking = signal<number | null>(null);

  protected markPaid(id: number): void {
    this.debts.update((list) => list.map((d) => (d.id === id ? { ...d, paid: true } : d)));
    this.debtAsking.set(null);
    this.log.set(`Visit ${id} paid in cash`);
  }
  // #endregion

  // #region pair/in-context
  protected readonly cancelBusy = signal(false);
  protected readonly cancelled = signal(false);

  protected cancelVisit(): void {
    this.cancelBusy.set(true);
    setTimeout(() => {
      this.cancelBusy.set(false);
      this.cancelled.set(true);
    }, 1000);
  }
  // #endregion

  // #region tray/in-context
  protected readonly blocked = signal(false);

  protected blockClient(): void {
    this.confirmations.confirm({
      header: 'Block Sardor Tursunov?',
      message: 'He missed 3 visits. He cannot book online until you unblock him.',
      acceptLabel: 'Block',
      rejectLabel: 'Not now',
      acceptButtonProps: { severity: 'danger' },
      accept: () => this.blocked.set(true),
    });
  }
  // #endregion

  // #region table/in-context
  protected readonly todayWords: Record<string, string> = { done: 'Done', now: 'In the chair', book: 'Booked', wait: 'Unconfirmed', error: 'Cancelled' };
  protected readonly todayVisits = signal([
    { id: 1, time: '09:30', name: 'Dilnoza Karimova', service: 'Haircut', price: 80000, status: 'done' as KometaTagTone },
    { id: 2, time: '10:30', name: 'Aziz Rahimov', service: 'Beard trim', price: 40000, status: 'now' as KometaTagTone },
    { id: 3, time: '12:00', name: 'Malika Yusupova', service: 'Colour', price: 250000, status: 'book' as KometaTagTone },
    { id: 4, time: '15:30', name: 'Sardor Tursunov', service: 'Haircut and beard', price: 110000, status: 'wait' as KometaTagTone },
  ]);
  protected readonly todayActions = new Map(this.todayVisits().map((v): [number, KometaAction[]] => [v.id, [
    { label: 'Mark done', run: () => this.setToday(v.id, 'done') },
    { label: 'Call client', run: () => this.log.set(`Calling ${v.name}`) },
    { label: 'Cancel visit', danger: true, run: () => this.setToday(v.id, 'error') },
  ]]));

  protected setToday(id: number, status: KometaTagTone): void {
    this.todayVisits.update((list) => list.map((v) => (v.id === id ? { ...v, status } : v)));
  }
  // #endregion

  // #region table/ledger
  protected readonly ledger = [
    { id: 1, master: 'Aziz Rahimov', time: '09:30', service: 'Haircut', cash: 80000, card: 0 },
    { id: 2, master: 'Aziz Rahimov', time: '11:00', service: 'Haircut and beard', cash: 0, card: 110000 },
    { id: 3, master: 'Dilnoza Karimova', time: '10:00', service: 'Colour', cash: 0, card: 250000 },
    { id: 4, master: 'Dilnoza Karimova', time: '13:30', service: 'Haircut', cash: 80000, card: 0 },
    { id: 5, master: 'Dilnoza Karimova', time: '16:00', service: 'Kids haircut', cash: 60000, card: 0 },
  ];

  protected ledgerTotal(master: string): number {
    return this.ledger.filter((r) => r.master === master).reduce((s, r) => s + r.cash + r.card, 0);
  }
  // #endregion

  // #region sort/in-context
  protected readonly boardBy = signal('rating');
  protected readonly boardDir = signal<'asc' | 'desc'>('desc');
  protected readonly boardOptions: KometaSortOption[] = [
    { value: 'rating', label: 'Rating' }, { value: 'visits', label: 'Visits' }, { value: 'name', label: 'Name' },
  ];
  private readonly board = [
    { name: 'Aziz Rahimov', role: 'Barber', rating: 4.9, visits: 212 },
    { name: 'Dilnoza Karimova', role: 'Stylist', rating: 4.7, visits: 168 },
    { name: 'Jasur Nazarov', role: 'Barber', rating: 4.3, visits: 240 },
    { name: 'Malika Yusupova', role: 'Stylist', rating: 4.8, visits: 131 },
  ];
  protected readonly boardRows = computed(() => {
    const k = this.boardBy() as 'rating' | 'visits' | 'name';
    const rows = [...this.board].sort((a, b) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0));
    return this.boardDir() === 'asc' ? rows : rows.reverse();
  });

  protected sortBoard(key: string): void {
    if (key === this.boardBy()) this.boardDir.set(this.boardDir() === 'asc' ? 'desc' : 'asc');
    else {
      this.boardBy.set(key);
      this.boardDir.set(key === 'name' ? 'asc' : 'desc');
    }
  }
  // #endregion

  // #region pager/in-context
  private readonly clientBook = Array.from({ length: 47 }, (_, i) => {
    const she = i % 2 === 0;
    const first = (she ? ['Dilnoza', 'Malika', 'Nodira', 'Gulnora', 'Kamola'] : ['Aziz', 'Sardor', 'Jasur', 'Bekzod', 'Otabek'])[i % 5];
    const last = (she ? ['Karimova', 'Yusupova', 'Saidova', 'Ergasheva'] : ['Rahimov', 'Tursunov', 'Nazarov', 'Aliyev'])[i % 4];
    const phone = `+998 9${i % 10} ${100 + ((i * 37) % 900)} ${10 + ((i * 7) % 90)} ${10 + ((i * 13) % 90)}`;
    return { id: i + 1, name: `${first} ${last}`, phone, visits: ((i * 7) % 23) + 1 };
  });
  protected readonly clientPage = signal(1);
  protected readonly clientPageSize = signal(5);
  protected readonly clientRows = computed(() =>
    this.clientBook.slice((this.clientPage() - 1) * this.clientPageSize(), this.clientPage() * this.clientPageSize()));
  // #endregion

  // #region share/in-context
  protected readonly mixBy = signal('services');
  protected readonly mixViews: KometaWordOption[] = [
    { value: 'services', label: 'Services' }, { value: 'masters', label: 'Masters' }, { value: 'pay', label: 'Payment' },
  ];
  private readonly mixData: Record<string, KometaShareSegment[]> = {
    services: [
      { label: 'Haircut', value: 14_200_000, text: "14 200 000 so'm", color: 'var(--viz-1)' },
      { label: 'Colour', value: 9_600_000, text: "9 600 000 so'm", color: 'var(--viz-2)' },
      { label: 'Beard', value: 3_100_000, text: "3 100 000 so'm", color: 'var(--viz-3)' },
      { label: 'Manicure', value: 2_400_000, text: "2 400 000 so'm", color: 'var(--viz-4)' },
    ],
    masters: [
      { label: 'Aziz Rahimov', value: 11_300_000, text: "11 300 000 so'm", color: 'var(--viz-1)' },
      { label: 'Dilnoza Karimova', value: 10_100_000, text: "10 100 000 so'm", color: 'var(--viz-2)' },
      { label: 'Malika Yusupova', value: 7_900_000, text: "7 900 000 so'm", color: 'var(--viz-3)' },
    ],
    pay: [
      { label: 'Cash', value: 15_800_000, text: "15 800 000 so'm", color: 'var(--viz-1)' },
      { label: 'Click', value: 8_200_000, text: "8 200 000 so'm", color: 'var(--viz-2)' },
      { label: 'Payme', value: 5_300_000, text: "5 300 000 so'm", color: 'var(--viz-3)' },
    ],
  };
  protected readonly mix = computed(() => this.mixData[this.mixBy()]);
  // #endregion

  // #region split/in-context
  protected readonly dayClosed = signal(false);
  // #endregion

  // #region fold/in-context
  protected readonly orderOpen = signal(true);
  // #endregion

  // #region drawer/in-context
  protected readonly bagOpen = signal(false);
  protected readonly bag = signal([
    { name: 'Haircut', who: 'Aziz Rahimov', price: 80000 },
    { name: 'Beard trim', who: 'Aziz Rahimov', price: 40000 },
    { name: 'Manicure', who: 'Malika Yusupova', price: 90000 },
  ]);
  protected readonly bagTotal = computed(() => this.bag().reduce((s, i) => s + i.price, 0));

  protected dropFromBag(name: string): void {
    this.bag.update((b) => b.filter((i) => i.name !== name));
  }
  // #endregion

  // #region drawer/filters
  protected readonly filtersOpen = signal(false);
  protected readonly filterDay = signal('any');
  protected readonly filterOpenNow = signal(false);
  protected readonly filterTop = signal(true);
  // #endregion

  // #region pop/in-context
  protected readonly shops = [
    { id: 'chilonzor', name: 'Kometa Chilonzor', meta: 'Bunyodkor avenue 12' },
    { id: 'yunusobod', name: 'Kometa Yunusobod', meta: 'Amir Temur street 108' },
    { id: 'samarkand', name: 'Kometa Samarkand', meta: 'Registan street 5' },
  ];
  protected readonly shop = signal(this.shops[0]);
  // #endregion

  // #region tip/in-context
  protected readonly load = [
    { day: 'Mon', visits: 14, sum: "1 120 000 so'm" }, { day: 'Tue', visits: 9, sum: "720 000 so'm" },
    { day: 'Wed', visits: 17, sum: "1 410 000 so'm" }, { day: 'Thu', visits: 12, sum: "950 000 so'm" },
    { day: 'Fri', visits: 21, sum: "1 830 000 so'm" }, { day: 'Sat', visits: 24, sum: "2 060 000 so'm" },
    { day: 'Sun', visits: 6, sum: "480 000 so'm" },
  ];
  // #endregion

  // #region tabbar/in-context
  protected readonly phoneTab = signal('today');
  protected readonly phoneTabs: KometaTab[] = [
    { value: 'today', label: 'Today', icon: '◷' }, { value: 'clients', label: 'Clients', icon: '☺' }, { value: 'money', label: 'Money', icon: '∑' },
  ];
  // #endregion

  // #region tag/in-context
  protected readonly visitsList: { time: string; name: string; service: string; tone: KometaTagTone; word: string }[] = [
    { time: '09:00', name: 'Dilnoza Karimova', service: 'Haircut', tone: 'done', word: 'Done' },
    { time: '10:30', name: 'Aziz Rahimov', service: 'Beard trim', tone: 'now', word: 'In the chair' },
    { time: '11:15', name: 'Sardor Tursunov', service: 'Haircut', tone: 'warn', word: 'Late 15 min' },
    { time: '13:00', name: 'Malika Yusupova', service: 'Colour', tone: 'book', word: 'Booked' },
    { time: '15:30', name: 'Nodira Saidova', service: 'Manicure', tone: 'wait', word: 'Unconfirmed' },
    { time: '17:00', name: 'Jasur Nazarov', service: 'Haircut and beard', tone: 'error', word: 'Cancelled' },
  ];
  // #endregion

  // #region banner/in-context
  protected readonly profileSteps = signal(3);
  protected readonly profileHidden = signal(false);
  // #endregion

  // #region toast/in-context
  protected notify(kind: KometaToastItem['kind'], text: string): void {
    this.toasts.update((t) => [...t, { id: ++this.toastId, kind, text, life: 4000 }]);
  }
  // #endregion

  // #region upload/in-context
  protected readonly importProgress = signal(0);
  protected readonly importState = signal<'idle' | 'running' | 'done' | 'failed'>('idle');

  protected runImport(): void {
    this.importState.set('running');
    this.importProgress.set(0);
    const tick = setInterval(() => {
      const next = Math.min(1, this.importProgress() + 0.15);
      this.importProgress.set(next);
      if (next >= 1) {
        clearInterval(tick);
        this.importState.set('done');
      }
    }, 250);
  }
  // #endregion

  // #region photos/in-context
  protected readonly workOpen = signal(false);
  protected readonly workIndex = signal(0);
  protected readonly work: KometaPhoto[] = [
    ['#3b2a1a', '#c08a4a', 'Fade'], ['#1d2b3a', '#5a8bbf', 'Crop'], ['#2a1a2e', '#a35fb0', 'Colour'], ['#1a2e22', '#4caf7a', 'Beard'],
  ].map(([a, b, t]) => ({ url: picture(a, b, t), thumbUrl: picture(a, b, t), alt: `${t} by Aziz Rahimov` }));

  protected openWork(i: number): void {
    this.workIndex.set(i);
    this.workOpen.set(true);
  }
  // #endregion

  // #region frame/in-context
  protected readonly feedA = picture('#3b2a1a', '#c08a4a', 'Skin fade');
  protected readonly feedB = picture('#2a1a2e', '#a35fb0', 'Balayage');
  // #endregion

  // #region reveal/in-context
  protected readonly lookBefore = picture('#3a3a3a', '#6b6b6b', '');
  protected readonly lookAfter = picture('#5a3a10', '#e0a040', '');
  // #endregion

  // #region person/in-context
  protected readonly crew = [
    { name: 'Any master', meta: 'First free chair', score: 0 },
    { name: 'Aziz Rahimov', meta: 'Barber · from 80 000', score: 4.9 },
    { name: 'Dilnoza Karimova', meta: 'Stylist · from 120 000', score: 4.7 },
    { name: 'Jasur Nazarov', meta: 'Barber · from 70 000', score: 4.3 },
  ];
  protected readonly crewPick = signal('Any master');
  // #endregion

  // #region logo/in-context
  protected readonly payBy = signal('Click');
  // #endregion

  // #region stars/in-context
  protected readonly reviews = [
    { name: 'Dilnoza Karimova', when: '2 days ago', score: 5, text: 'Aziz listened and did exactly what I asked. Booking took a minute.' },
    { name: 'Sardor Tursunov', when: 'last week', score: 4, text: 'Great fade. I waited ten minutes past my time.' },
    { name: 'Nodira Saidova', when: 'in October', score: 5, text: 'Clean, calm, and the green tea was good.' },
  ];
  protected readonly reviewAverage = this.reviews.reduce((s, r) => s + r.score, 0) / this.reviews.length;
  // #endregion

  // #region steps/in-context
  protected readonly wizardStep = signal(1);
  protected readonly wizardService = signal('cut');
  protected readonly wizardTime = signal('');
  protected readonly wizardName = signal('');
  protected readonly wizardSlots: KometaSlot[] = [
    { value: '10:00', label: '10:00' }, { value: '11:30', label: '11:30', disabled: true },
    { value: '14:00', label: '14:00' }, { value: '16:30', label: '16:30' },
  ];
  /** Whether the current step has what it needs, indexed by step (1 = service, 2 = time, 3 = details). */
  protected readonly wizardReady = computed(() =>
    [true, !!this.wizardService(), !!this.wizardTime(), this.wizardName().trim().length > 1][this.wizardStep()] ?? true);
  // #endregion

  // #region wait/in-context
  protected readonly syncing = signal(false);
  protected readonly syncedAt = signal('09:41');

  protected sync(): void {
    this.syncing.set(true);
    setTimeout(() => {
      this.syncing.set(false);
      this.syncedAt.set(new Date().toTimeString().slice(0, 5));
    }, 1500);
  }
  // #endregion

  // #region skeleton/in-context
  protected readonly cardLoading = signal(false);

  protected reloadCard(): void {
    this.cardLoading.set(true);
    setTimeout(() => this.cardLoading.set(false), 1400);
  }
  // #endregion

  // #region quiet/in-context
  protected readonly inboxTab = signal('cancelled');
  protected readonly inboxTabs: KometaWordOption[] = [
    { value: 'upcoming', label: 'Upcoming', count: 2 }, { value: 'cancelled', label: 'Cancelled', count: 0 },
  ];
  // #endregion

  // #region link/in-context
  protected readonly bookingOpen = signal(true);
  // #endregion
}
