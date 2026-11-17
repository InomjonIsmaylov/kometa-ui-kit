import {
  ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, Injectable, OnDestroy, OnInit, ViewEncapsulation, computed, inject, input,
  effect, signal, viewChild,
} from '@angular/core';
import { ThemeService } from 'kometa-ui/theme';
// The demo's own sources, as text: every code snippet is cut from them, so a snippet cannot drift from its demo.
import source from './app.html' with { loader: 'text' };
// @ts-ignore: the build reads it as text; TypeScript would resolve it as the module itself.
import tsSource from './app.ts' with { loader: 'text' };
import scssSource from './app.scss' with { loader: 'text' };
import globalScss from '../styles.scss' with { loader: 'text' };
/** Cuts the inner markup of every `<app-doc id="x">` out of the template, keyed `page/x` by the `@case` above it. */
export function parseSource(html: string): Map<string, string> {
  const snippets = new Map<string, string>();
  let page = '';
  // A self-closing <app-doc /> passes its code as an input and has no body, so it must not match.
  for (const m of html.matchAll(/@case \('([\w-]+)'\)|<app-doc\s[^>]*?\bid="([\w-]+)"[^>]*(?<!\/)>([\s\S]*?)<\/app-doc>/g)) {
    if (m[1]) page = m[1];
    else snippets.set(`${page}/${m[2]}`, dedent(m[3]));
  }
  return snippets;
}

/**
 * Cuts every `// #region page/id` … `// #endregion` block out of a TS or SCSS file; repeated keys join in order.
 * One region can serve several examples: `// #region pop/animation select/animation`.
 */
export function parseRegions(text: string): Map<string, string> {
  const regions = new Map<string, string>();
  for (const m of text.matchAll(/\/\/ #region ((?:[\w-]+\/[\w-]+ ?)+)\r?\n([\s\S]*?)\r?\n\s*\/\/ #endregion/g)) {
    for (const key of m[1].trim().split(' ')) {
      const prev = regions.get(key);
      regions.set(key, (prev ? prev + '\n\n' : '') + dedent(m[2]));
    }
  }
  return regions;
}

export function dedent(text: string): string {
  const lines = text.replace(/\r/g, '').replace(/^\s*\n|\n\s*$/g, '').split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  return lines.map((l) => l.slice(indent)).join('\n');
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TOKENS = {
  // comment | tag | string | interpolation | keyword | attribute name
  html: /(<!--.*?-->)|(<\/?[\w-]+|\/?>)|("[^"]*")|(\{\{.*?\}\})|(@\w+)|([\w.\-[\]()#*]+(?==))/g,
  sh: /(#.*)/g,
  ts: /(\/\/.*|\/\*.*?\*\/)|(\b[A-Z]\w*\b)|('[^']*'|"[^"]*"|`[^`]*`)|(\b\d+\b)|(\b(?:import|from|export|const|let|return|new|class|interface|function|protected|private|readonly|if|else|for|of|type)\b|@\w+)|(--[\w-]+|\b\w+(?=\s*:))/g,
  // comment | type | string | number | keyword | named argument
  kotlin: /(\/\/.*|\/\*.*?\*\/)|(\b[A-Z]\w*\b)|("[^"]*")|(\b\d+\b)|(\b(?:import|package|val|var|fun|return|if|else|when|in|is|private|internal|class|data|object|by|null|true|false)\b|@\w+)|(\b\w+(?= = ))/g,
  // comment | selector | string | number | at-rule | property
  scss: /(\/\/.*|\/\*.*?\*\/)|([.#&][\w-]*|:{1,2}[\w-]+(?=[\s,{(]))|('[^']*'|"[^"]*")|(\b\d+(?:\.\d+)?(?:px|rem|em|%|ms|s|fr|dvh|vw)?)|(@[\w-]+|!important|\$[\w-]+)|(--[\w-]+|[\w-]+(?=\s*:\s))/g,
};
export type Lang = keyof typeof TOKENS;
const KINDS = ['c', 't', 's', 'i', 'k', 'a'];

/** Escaped, coloured markup, one `<span class="line">` per line. Lines are coloured on their own, so no span crosses one. */
export function highlight(code: string, lang: Lang): string {
  return code.split('\n').map((line) => {
    let out = '';
    let last = 0;
    for (const m of line.matchAll(TOKENS[lang])) {
      out += esc(line.slice(last, m.index)) + `<span class="tk-${KINDS[m.slice(1).findIndex((g) => g !== undefined)]}">${esc(m[0])}</span>`;
      last = m.index + m[0].length;
    }
    return `<span class="line">${out + esc(line.slice(last))}</span>`;
  }).join(''); // the spans are blocks; a '\n' between them would draw an empty line inside <pre>
}

export interface DocEntry { id: string; title: string; el: HTMLElement }
/** The code shown under a demo, one tab per language that has any. */
export type DocFiles = Partial<Record<'html' | 'ts' | 'scss' | 'kotlin', string>>;
/** Which kit the docs show code for; under Compose, an example with no Kotlin keeps its Angular code. */
export type Platform = 'angular' | 'compose';
const PLATFORM_KEY = 'kometa-docs-platform';
function readPlatform(): Platform {
  try { return localStorage.getItem(PLATFORM_KEY) === 'compose' ? 'compose' : 'angular'; } catch { return 'angular'; }
}

@Injectable({ providedIn: 'root' })
export class Docs {
  readonly page = signal('');
  private readonly snippets = parseSource(source);
  private readonly ts = parseRegions(tsSource as unknown as string);
  private readonly scss = parseRegions(globalScss + '\n' + scssSource);
  private readonly kotlin = signal(new Map<string, string>());
  /** Each kit composable's overloads, from compose-api.json; empty until the lazy chunk arrives. */
  readonly composeApi = signal<Record<string, { doc: string; params: { name: string; type: string; default?: string }[] }[]>>({});
  // shortcut: until the chunk arrives a page shows no Angular/Compose switch; fine for a docs site.
  constructor() {
    void import('./kotlin').then((m) => {
      this.kotlin.set(parseRegions(m.kotlinSource));
      this.composeApi.set(m.composeApi);
    });
  }
  readonly platform = signal<Platform>(readPlatform());
  private readonly entries = signal<DocEntry[]>([]);
  /** The sections on screen, in page order, for the "On this page" list. */
  readonly sections = computed(() => [...this.entries()].sort((a, b) =>
    a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

  snippet(id: string): string {
    return this.snippets.get(`${this.page()}/${id}`) ?? '';
  }

  files(id: string): DocFiles {
    const key = `${this.page()}/${id}`;
    return { html: this.snippets.get(key), ts: this.ts.get(key), scss: this.scss.get(key), kotlin: this.kotlin().get(key) };
  }

  /** Whether any example on this page has a Compose version. */
  hasKotlin(page: string): boolean {
    return [...this.kotlin().keys()].some((k) => k.startsWith(page + '/'));
  }

  /** The kit composables this page's Kotlin examples call, in order of first use: the Compose API table. In-context examples are left out, they borrow other components. */
  composables(page: string): string[] {
    const code = [...this.kotlin()].filter(([k]) => k.startsWith(page + '/') && !k.endsWith('/in-context')).map(([, v]) => v).join('\n');
    return [...new Set([...code.matchAll(/\b(Kometa[A-Z]\w*)\s*\(/g)].map((m) => m[1]))];
  }

  setPlatform(p: Platform): void {
    this.platform.set(p);
    try { localStorage.setItem(PLATFORM_KEY, p); } catch { /* private window: keep it for this visit only */ }
  }

  add(entry: DocEntry): void {
    this.entries.update((e) => [...e, entry]);
  }

  remove(entry: DocEntry): void {
    this.entries.update((e) => e.filter((x) => x !== entry));
  }
}

/** What the Compose build (compose/sample.js, see compose/sample/src/wasmJsMain) puts on globalThis once it has started. */
interface ComposeApi { mount(id: string, key: string, dark: boolean): void; theme(dark: boolean): void; unmount(id: string): void }

/** Loads the Compose (Wasm) build once, on the first Compose preview, and draws docs examples with it. */
@Injectable({ providedIn: 'root' })
export class ComposePreviews {
  private readonly theme = inject(ThemeService);
  private api?: Promise<ComposeApi>;
  /** The build is missing (ng serve without it) or did not start: previews fall back to Angular. */
  readonly failed = signal(false);

  constructor() {
    effect(() => {
      const dark = this.theme.resolved() === 'dark';
      void this.api?.then((a) => a.theme(dark));
    });
  }

  /** Draws example `key` into the element with `id`; the returned function takes it down again. */
  mount(id: string, key: string): () => void {
    let gone = false;
    this.load().then((a) => { if (!gone) a.mount(id, key, this.theme.resolved() === 'dark'); }, () => this.failed.set(true));
    return () => {
      gone = true;
      void this.api?.then((a) => a.unmount(id), () => {});
    };
  }

  private load(): Promise<ComposeApi> {
    return this.api ??= new Promise((resolve, reject) => {
      addEventListener('kometa-compose', () => resolve((globalThis as unknown as { kometaCompose: ComposeApi }).kometaCompose), { once: true });
      const script = document.createElement('script');
      script.src = 'compose/sample.js';
      script.onerror = reject;
      document.head.append(script);
      // ng serve answers a missing file with index.html, which fails as a script without an error event.
      setTimeout(reject, 30_000);
    });
  }
}

let composeIds = 0;

const LABELS = { html: 'HTML', ts: 'TypeScript', scss: 'SCSS', kotlin: 'Kotlin' } as const;
type Tab = keyof typeof LABELS;

/**
 * One documented example: a heading with an anchor, a sentence, the live demo and its source.
 * The source is the projected markup itself plus any `// #region page/id` in app.ts and app.scss,
 * unless `code` (one snippet in `lang`, `null` for none) or `files` (whole files, for screens) is given.
 */
@Component({
  selector: 'app-doc',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './docs.scss',
  template: `
    @if (heading()) {
      <h2 class="doc-title"><a [href]="'#' + docs.page() + '/' + id()">{{ heading() }}</a></h2>
    }
    @if (about()) { <p class="doc-about">{{ about() }}</p> }
    <div class="doc-box">
      @if (demo()) {
        <div class="doc-stage" [attr.data-canvas]="canvas()">
          @if (composeKey()) {
            <div class="doc-phone" role="img" aria-label="Android phone">
              <div class="doc-phone-screen">
                <div class="doc-phone-status" aria-hidden="true"><span>9:41</span><span class="doc-phone-icons">▾ ◢ ▮</span></div>
                @if (!composeHeight()) { <span class="doc-note">Starting Compose…</span> }
                <div #compose class="doc-compose" [id]="composeId" [style.height.px]="composeHeight()"
                     (compose-size)="resize($any($event).detail)"></div>
                <div class="doc-phone-nav" aria-hidden="true"></div>
              </div>
            </div>
          } @else {
            <div class="doc-demo" [attr.data-width]="width()"><ng-content /></div>
          }
        </div>
      }
      @if (tabs().length) {
        <div class="doc-bar">
          @if (demo()) {
            <div class="doc-tools" role="group" aria-label="Preview">
              @for (c of canvases; track c) {
                <button type="button" class="doc-tool" [attr.aria-pressed]="canvas() === c" [attr.aria-label]="c + ' canvas'"
                        [title]="c + ' canvas'" (click)="canvas.set(c)"><span class="doc-swatch" [attr.data-canvas]="c"></span></button>
              }
              @if (!composeKey()) {
                <span class="doc-sep"></span>
                @for (w of widths; track w.id) {
                  <button type="button" class="doc-tool" [attr.aria-pressed]="width() === w.id" [title]="w.label"
                          [attr.aria-label]="w.label" (click)="width.set(w.id)">{{ w.glyph }}</button>
                }
              }
            </div>
          }
          <div class="doc-tabs" role="tablist" aria-label="Source">
            @for (t of tabs(); track t) {
              <button type="button" role="tab" [attr.aria-selected]="open() && tab() === t" (click)="pick(t)">{{ labels[t] }}</button>
            }
          </div>
          @if (angularOnly()) { <span class="doc-note">No Compose version</span> }
          <button type="button" class="doc-copy" (click)="copy()">{{ copied() ? 'Copied ✓' : 'Copy' }}</button>
        </div>
        @if (open()) { <pre class="doc-code"><code [innerHTML]="html()"></code></pre> }
      }
    </div>
  `,
})
export class DocSection implements OnInit, OnDestroy {
  protected readonly docs = inject(Docs);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly id = input.required<string>();
  readonly heading = input('');
  readonly about = input('');
  /** False for a code-only section, such as an install step. */
  readonly demo = input(true);
  readonly code = input<string | null | undefined>(undefined);
  readonly lang = input<Lang>('html');
  readonly files = input<DocFiles | undefined>(undefined);
  /** Leave the code folded until asked for: for long sources, such as whole screens. */
  readonly folded = input(false, { transform: booleanAttribute });
  protected readonly labels = LABELS;
  protected readonly canvases = ['plain', 'grid', 'dots'] as const;
  protected readonly widths = [
    { id: 'full', label: 'Full width', glyph: '▭' }, { id: 'tablet', label: 'Tablet width', glyph: '▯' }, { id: 'phone', label: 'Phone width', glyph: '▮' },
  ];
  protected readonly canvas = signal<string>('plain');
  protected readonly width = signal('full');
  protected readonly open = signal(true);
  protected readonly tab = signal<Tab | Lang>('html');
  /** Language → text, for the languages this section has. */
  private readonly sources = computed<Partial<Record<string, string>>>(() => {
    const code = this.code();
    if (code === null) return {};
    if (code !== undefined) return { [this.lang()]: code };
    return this.files() ?? this.docs.files(this.id());
  });
  private readonly all = computed(() => (Object.keys(this.sources()) as Tab[]).filter((t) => this.sources()[t]));
  /** Compose shows the Kotlin tab alone; Angular shows the rest. */
  protected readonly tabs = computed<Tab[]>(() => this.docs.platform() === 'compose' && this.all().includes('kotlin')
    ? ['kotlin'] : this.all().filter((t) => t !== 'kotlin'));
  private readonly previews = inject(ComposePreviews);
  /** The example drawn by the Compose build instead of the Angular demo, when Compose is picked and it has Kotlin. */
  protected readonly composeKey = computed(() => this.demo() && this.docs.platform() === 'compose' && this.all().includes('kotlin')
    && !this.previews.failed() ? `${this.docs.page()}/${this.id()}` : null);
  protected readonly composeId = `compose-preview-${++composeIds}`;
  protected readonly composeHeight = signal(0);
  private readonly composeEl = viewChild<ElementRef<HTMLElement>>('compose');

  constructor() {
    effect((onCleanup) => {
      const key = this.composeKey();
      if (!key || !this.composeEl()) return;
      this.composeHeight.set(0);
      onCleanup(this.previews.mount(this.composeId, key));
    });
  }

  /** Fits the box to the example. Only the clip changes, so no other preview redraws. */
  protected resize(px: number): void {
    this.composeHeight.set(px);
  }

  /** Compose is picked and the page has Compose examples, but not this one. */
  protected readonly angularOnly = computed(() => this.docs.platform() === 'compose' && this.code() === undefined && !this.files()
    && !this.all().includes('kotlin') && this.all().length > 0 && this.docs.hasKotlin(this.docs.page()));
  private readonly shown = computed(() => (this.tabs().includes(this.tab() as Tab) ? this.tab() : this.tabs()[0]) as Lang);
  protected readonly html = computed(() => highlight(this.sources()[this.shown()] ?? '', this.shown()));
  private entry?: DocEntry;

  ngOnInit(): void {
    this.open.set(!this.folded() || !this.demo());
    this.entry = { id: this.id(), title: this.heading(), el: this.host.nativeElement };
    if (this.heading()) this.docs.add(this.entry);
  }

  ngOnDestroy(): void {
    this.docs.remove(this.entry!);
  }

  /** The chosen tab again folds the code; with no demo there is nothing to fold to. */
  protected pick(t: Tab): void {
    if (this.open() && this.shown() === t && this.demo()) this.open.set(false);
    else {
      this.tab.set(t);
      this.open.set(true);
    }
  }

  protected async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.sources()[this.shown()] ?? '');
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }
  protected readonly copied = signal(false);
}
