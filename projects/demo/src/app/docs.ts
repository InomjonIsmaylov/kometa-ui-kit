import {
  ChangeDetectionStrategy, Component, ElementRef, Injectable, OnDestroy, OnInit, ViewEncapsulation, computed, inject, input,
  signal,
} from '@angular/core';
// The demo's own template, as text: every code snippet is cut from it, so a snippet cannot drift from its demo.
import source from './app.html' with { loader: 'text' };

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

export function dedent(text: string): string {
  const lines = text.replace(/^\s*\n|\n\s*$/g, '').split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  return lines.map((l) => l.slice(indent)).join('\n');
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TOKENS = {
  // comment | tag | string | interpolation | keyword | attribute name
  html: /(<!--.*?-->)|(<\/?[\w-]+|\/?>)|("[^"]*")|(\{\{.*?\}\})|(@\w+)|([\w.\-[\]()#*]+(?==))/g,
  sh: /(#.*)/g,
  ts: /(\/\/.*|\/\*.*?\*\/)|(\b[A-Z]\w*\b)|('[^']*'|"[^"]*"|`[^`]*`)|(\b\d+\b)|(\b(?:import|from|export|const|let|return|new|class|interface|function)\b|@\w+)|(--[\w-]+|\b\w+(?=\s*:))/g,
};
const KINDS = ['c', 't', 's', 'i', 'k', 'a'];

/** Escaped, coloured markup, one `<span class="line">` per line. Lines are coloured on their own, so no span crosses one. */
export function highlight(code: string, lang: keyof typeof TOKENS): string {
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

@Injectable({ providedIn: 'root' })
export class Docs {
  readonly page = signal('');
  private readonly snippets = parseSource(source);
  private readonly entries = signal<DocEntry[]>([]);
  /** The sections on screen, in page order, for the "On this page" list. */
  readonly sections = computed(() => [...this.entries()].sort((a, b) =>
    a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

  snippet(id: string): string {
    return this.snippets.get(`${this.page()}/${id}`) ?? '';
  }

  add(entry: DocEntry): void {
    this.entries.update((e) => [...e, entry]);
  }

  remove(entry: DocEntry): void {
    this.entries.update((e) => e.filter((x) => x !== entry));
  }
}

/**
 * One documented example: a heading with an anchor, a sentence, the live demo and its source.
 * The source is the projected markup itself, unless `code` is given (`null` for no code at all).
 */
@Component({
  selector: 'app-doc',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './docs.scss',
  template: `
    <h2 class="doc-title"><a [href]="'#' + docs.page() + '/' + id()">{{ heading() }}</a></h2>
    @if (about()) { <p class="doc-about">{{ about() }}</p> }
    <div class="doc-box">
      @if (demo()) { <div class="doc-demo"><ng-content /></div> }
      @if (text()) {
        @if (demo()) {
          <div class="doc-bar">
            <button type="button" (click)="open.set(!open())" [attr.aria-expanded]="open()">{{ open() ? 'Hide code' : 'Show code' }}</button>
            <button type="button" (click)="copy()">{{ copied() ? 'Copied' : 'Copy' }}</button>
          </div>
        } @else {
          <button type="button" class="doc-copy" (click)="copy()">{{ copied() ? 'Copied' : 'Copy' }}</button>
        }
        @if (open() || !demo()) { <pre class="doc-code"><code [innerHTML]="html()"></code></pre> }
      }
    </div>
  `,
})
export class DocSection implements OnInit, OnDestroy {
  protected readonly docs = inject(Docs);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly id = input.required<string>();
  readonly heading = input.required<string>();
  readonly about = input('');
  /** False for a code-only section, such as an install step. */
  readonly demo = input(true);
  readonly code = input<string | null | undefined>(undefined);
  readonly lang = input<keyof typeof TOKENS>('html');
  protected readonly open = signal(true);
  protected readonly copied = signal(false);
  protected readonly text = computed(() => this.code() !== undefined ? this.code() : this.docs.snippet(this.id()));
  protected readonly html = computed(() => highlight(this.text() ?? '', this.lang()));
  private entry?: DocEntry;

  ngOnInit(): void {
    this.entry = { id: this.id(), title: this.heading(), el: this.host.nativeElement };
    this.docs.add(this.entry);
  }

  ngOnDestroy(): void {
    this.docs.remove(this.entry!);
  }

  protected async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.text() ?? '');
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }
}
