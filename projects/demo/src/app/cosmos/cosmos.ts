import {
  ChangeDetectionStrategy, Component, ComponentRef, ElementRef, ViewContainerRef, computed, effect, input, signal, untracked, viewChild,
} from '@angular/core';
import { PLAY } from '../play/props';

export interface MapPage { id: string; label: string; about: string }
export interface MapGroup { label: string; items: MapPage[] }

/** A small number from a string, the same every visit: it places and sizes the stars. */
function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

const COLS = 3;
const ROW = 62;

/** A live, inert instance of a component for the map's preview card, built from its props-panel sample. */
@Component({
  selector: 'app-mini',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container #slot />`,
  host: { inert: '' },
})
export class MiniPreview {
  readonly page = input.required<string>();
  private readonly slot = viewChild.required('slot', { read: ViewContainerRef });

  constructor() {
    effect((onCleanup) => {
      const c = PLAY[this.page()];
      let ref: ComponentRef<unknown> | undefined;
      untracked(() => {
        this.slot().clear();
        if (!c) return;
        // Nothing projected unless there is content: an empty projection would hide a component's fallback (k-button's label).
        const nodes = c.content !== undefined ? [[document.createTextNode(c.content)]] : undefined;
        ref = this.slot().createComponent(c.type, { projectableNodes: nodes });
        for (const [k, v] of Object.entries(c.seed ?? {})) ref.setInput(k, v);
        ref.changeDetectorRef.detectChanges();
      });
      onCleanup(() => ref?.destroy());
    });
  }
}

/**
 * The docs as a night sky: each group is a constellation, each page a star joined to the next. Hover or focus a star
 * for its card (with the component itself, live, when it has a props panel); click to fly there. Type to dim every
 * star that does not match, Enter to go to the first that does.
 */
@Component({
  selector: 'app-cosmos',
  imports: [MiniPreview],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './cosmos.scss',
  template: `
    <dialog #dlg class="cz" aria-label="Map of the docs" (close)="q.set('')" (click)="$event.target === dlg && dlg.close()">
      <div class="cz-field" [class.warp]="warp()" [style.transform-origin]="origin()">
        <header class="cz-head">
          <h2><span class="cz-mark" aria-hidden="true">✦</span> The Kometa sky</h2>
          <input #search type="search" class="cz-q" placeholder="Find a star…" aria-label="Find a page" [value]="q()"
                 (input)="q.set($any($event.target).value)" (keydown.enter)="first() && fly($event, first()!.id)" />
          <span class="cz-count">{{ shown() }} of {{ total() }} stars</span>
          <button type="button" class="cz-close" aria-label="Close the map" (click)="dlg.close()">✕</button>
        </header>
        <div class="cz-sky">
          @for (g of layout(); track g.label; let gi = $index) {
            <section class="cz-cluster" [attr.aria-label]="g.label" [style.--hue]="g.hue">
              <h3>{{ g.label }} <small>{{ g.items.length }}</small></h3>
              <div class="cz-plot" [style.height.px]="g.height">
                <svg class="cz-lines" [attr.viewBox]="'0 0 100 ' + g.height" preserveAspectRatio="none" aria-hidden="true">
                  <polyline [attr.points]="g.line" />
                </svg>
                @for (s of g.items; track s.id) {
                  <a class="cz-star" [href]="'#' + s.id" [style.left.%]="s.x" [style.top.px]="s.y" [style.--s.px]="s.size" [style.--d.s]="s.delay"
                     [attr.aria-current]="s.id === current() ? 'page' : null" [class.dim]="!s.match"
                     (mouseenter)="hover.set(s)" (focus)="hover.set(s)" (click)="fly($event, s.id)">
                    <span class="cz-dot" aria-hidden="true"></span><span class="cz-name">{{ s.label }}</span>
                  </a>
                }
              </div>
            </section>
          }
        </div>
        @if (hover(); as h) {
          <aside class="cz-card" aria-live="polite">
            <small>{{ h.group }}</small>
            <b>{{ h.label }}</b>
            <p>{{ h.about }}</p>
            @if (h.live) { <div class="cz-live"><app-mini [page]="h.id" /></div> }
          </aside>
        }
      </div>
    </dialog>
  `,
})
export class Cosmos {
  readonly groups = input.required<MapGroup[]>();
  readonly current = input('');
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');
  private readonly search = viewChild.required<ElementRef<HTMLInputElement>>('search');
  protected readonly q = signal('');
  protected readonly warp = signal(false);
  protected readonly origin = signal('50% 50%');
  protected readonly hover = signal<{ id: string; label: string; about: string; group: string; live: boolean } | null>(null);

  /** Stars in a snake, three to a row, nudged off the grid so the lines look drawn by hand. */
  protected readonly layout = computed(() => {
    const q = this.q().trim().toLowerCase();
    return this.groups().map((g, gi) => {
      const items = g.items.map((p, i) => {
        const row = Math.floor(i / COLS);
        const col = row % 2 ? COLS - 1 - (i % COLS) : i % COLS;
        const r = hash(p.id);
        return {
          ...p, group: g.label, live: p.id in PLAY,
          x: 20 + col * 30 + (r - 0.5) * 8, y: 22 + row * ROW + (hash(p.id + '~') - 0.5) * 18,
          size: 5 + r * 5, delay: -r * 4, match: !q || `${p.label} ${p.about} ${g.label}`.toLowerCase().includes(q),
        };
      });
      const height = 22 + Math.ceil(items.length / COLS) * ROW;
      return { label: g.label, hue: (gi * 47) % 360, items, height, line: items.map((s) => `${s.x},${s.y}`).join(' ') };
    });
  });
  private readonly all = computed(() => this.layout().flatMap((g) => g.items));
  protected readonly total = computed(() => this.all().length);
  protected readonly shown = computed(() => this.all().filter((s) => s.match).length);
  protected readonly first = computed(() => (this.q().trim() ? this.all().find((s) => s.match) : undefined));

  constructor() {
    effect(() => { this.current(); untracked(() => this.hover.set(null)); });
  }

  open(): void {
    const d = this.dlg().nativeElement;
    this.warp.set(false);
    if (!d.open) d.showModal();
    this.search().nativeElement.focus();
  }

  /** Zooms into the star, then goes there. */
  protected fly(e: Event, id: string): void {
    e.preventDefault();
    const star = this.dlg().nativeElement.querySelector<HTMLElement>(`a[href="#${id}"]`);
    const field = star?.closest('.cz-field') as HTMLElement | null;
    const go = () => { location.hash = id; this.dlg().nativeElement.close(); this.warp.set(false); };
    if (!star || !field || matchMedia('(prefers-reduced-motion: reduce)').matches) return go();
    const s = star.getBoundingClientRect();
    const f = field.getBoundingClientRect();
    this.origin.set(`${s.left - f.left + 6}px ${s.top - f.top + field.scrollTop + 6}px`);
    this.warp.set(true);
    setTimeout(go, 420);
  }
}
