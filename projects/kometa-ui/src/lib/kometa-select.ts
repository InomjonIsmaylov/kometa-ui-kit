import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, booleanAttribute, computed, effect, inject, input, model, signal, viewChild,
} from '@angular/core';

interface Item { label: string; value: unknown; i: number }
interface Block { heading: string | null; items: Item[] }

let nextId = 0;

/**
 * One choice from a list. The field is a line with the chosen word and a chevron; it opens a glass list in the
 * browser's top layer (so a drawer or a card cannot clip it), flips above when there is no room below and is kept
 * inside the viewport. The chosen row takes the 2px edge. Arrow keys, Home and End move, a letter jumps to the next
 * row that starts with it, Enter or Space picks, Escape closes (and does not reach a drawer behind it), Tab, a click
 * outside, resize and scroll elsewhere close it.
 *
 * `options` are objects read through `optionLabel` and `optionValue` (so a call site moves over
 * as it is). With `group`, each option is a group read through `optionGroupLabel` and `optionGroupChildren`.
 * `value` is matched with `===`; with no match the `placeholder` shows. `prefix` is a muted word before the
 * choice ("Role: Owner"), and `pill` draws the field as a bordered pill for a toolbar instead of a form line.
 * `inputId` lets a `<label for>` name the button; `ariaLabelledBy` names it by another element, and the choice is
 * read after that name either way.
 * Spec: kometa-select.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-9.html (Pane).
 */
@Component({
  selector: 'k-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.pill]': 'pill()',
    '(window:resize)': 'close(false)',
    '(document:pointerdown)': 'onOutside($event)',
  },
  styles: `
    :host { position: relative; display: block; min-width: 0; }
    :host(.pill) { display: inline-block; }
    .btn {
      position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%;
      min-height: var(--control-h, 40px); padding: 0; border: 0; border-bottom: 1px solid var(--glass-line); border-radius: 0; background: none;
      color: var(--display-ink, var(--text)); font: inherit; text-align: left; cursor: pointer;
    }
    .btn::after {
      content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 1px; background: var(--display-ink, var(--text));
      transform: scaleX(.3); transform-origin: left; opacity: .5; transition: transform 420ms var(--ease-spring, ease), opacity 200ms ease;
    }
    .btn:hover:not(:disabled)::after, .btn[aria-expanded='true']::after, .btn:focus-visible::after { transform: none; opacity: 1; }
    .btn:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .val { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .val.empty { color: var(--muted); }
    .pre { color: var(--muted); }
    .chev {
      flex: none; width: 7px; height: 7px; margin-top: -4px; border-right: 1px solid currentColor; border-bottom: 1px solid currentColor;
      color: var(--muted); transform: rotate(45deg); transition: transform 320ms var(--ease-spring, ease);
    }
    .btn[aria-expanded='true'] .chev { transform: rotate(225deg); margin-top: 4px; }
    :host(.pill) .btn {
      width: auto; min-height: 36px; padding: 0 12px; border: 1px solid var(--glass-line); border-radius: var(--select-pill-radius, 999px); background: var(--glass);
    }
    :host(.pill) .btn::after { display: none; }
    :host(.pill) .btn:hover:not(:disabled), :host(.pill) .btn[aria-expanded='true'] { border-color: var(--display-ink, var(--text)); }
    :host(.pill) .val { font-weight: 600; }
    @media (pointer: coarse) { .btn { min-height: 44px; } }
    .pop {
      inset: auto; margin: 0; padding: 6px; min-width: 160px; max-width: calc(100vw - 16px); max-height: var(--select-max-height, 300px); overflow: auto;
      border: 1px solid var(--glass-line); border-radius: var(--select-radius, 16px); color: var(--text);
      background: var(--glass-drawer, var(--bg)); backdrop-filter: blur(18px); box-shadow: 0 12px 30px rgba(0, 0, 0, .35);
      transition: opacity 180ms ease, translate 320ms var(--ease-spring, ease);
    }
    @starting-style { .pop:popover-open { opacity: 0; translate: 0 -4px; } }
    .gh { padding: 8px 12px 4px; color: var(--muted); font-size: 12px; letter-spacing: .06em; text-transform: uppercase; }
    .opt {
      display: block; padding: 9px 12px; border-radius: var(--select-opt-radius, 10px); color: var(--text); font-size: var(--select-font-size, 15px); cursor: pointer;
      overflow-wrap: anywhere; transition: background 160ms ease;
    }
    .opt:hover { background: var(--glass-line); }
    .opt:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; }
    .opt[aria-selected='true'] { color: var(--display-ink, var(--text)); box-shadow: inset 2px 0 0 var(--display-ink, var(--text)); }
    @media (pointer: coarse) { .opt { padding: 12px; } }
    @media (prefers-reduced-motion: reduce) { .btn::after, .chev, .pop, .opt { transition: none; } }
  `,
  template: `
    <button #btn class="btn" type="button" aria-haspopup="listbox" [id]="btnId()" [disabled]="disabled()"
            [attr.aria-expanded]="open()" [attr.aria-controls]="id" [attr.aria-label]="ariaName()" [attr.aria-labelledby]="labelled()"
            (click)="toggle()" (keydown.arrowdown)="openByKey($event)" (keydown.arrowup)="openByKey($event)">
      <span class="val" [class.empty]="chosen() === null">
        @if (prefix() && chosen() !== null) { <span class="pre">{{ prefix() }}</span> }{{ shown() }}
      </span>
      <i class="chev" aria-hidden="true"></i>
    </button>
    <div #pop class="pop" popover="manual" [id]="id" [style.left.px]="x()" [style.top.px]="y()" [style.min-width.px]="w()" (keydown)="onKey($event)">
      @if (open()) {
        <div role="listbox" [attr.aria-label]="ariaLabel() || null" [attr.aria-labelledby]="ariaLabelledBy() || null">
          @if (emptyLabel() && !hasOptions()) { <div class="gh">{{ emptyLabel() }}</div> }
          @for (b of blocks(); track $index) {
            @if (b.heading !== null) {
              <div class="gh" aria-hidden="true">{{ b.heading }}</div>
            }
            @for (it of b.items; track it.i) {
              <div class="opt" role="option" tabindex="-1" [attr.aria-selected]="it === chosen()" [attr.data-i]="it.i" (click)="pick(it)">{{ it.label }}</div>
            }
          }
        </div>
      }
    </div>
  `,
})
export class KometaSelect {
  protected readonly id = `kometa-select-${nextId++}`;
  readonly options = input<readonly unknown[] | null | undefined>([]);
  readonly optionLabel = input('label');
  readonly optionValue = input('value');
  readonly group = input(false, { transform: booleanAttribute });
  readonly optionGroupLabel = input('label');
  readonly optionGroupChildren = input('items');
  // The model carries whatever the options' values are; the call site types it.
  readonly value = model<any>(null);
  readonly placeholder = input('');
  readonly prefix = input('');
  readonly pill = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly inputId = input('');
  /** A muted line in the list when there are no options ("No results"). */
  readonly emptyLabel = input('');
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly open = signal(false);
  protected readonly x = signal(0);
  protected readonly y = signal(0);
  protected readonly w = signal(160);

  protected readonly btnId = computed(() => this.inputId() || `${this.id}-btn`);
  protected readonly blocks = computed<Block[]>(() => {
    const opts = (this.options() ?? []) as readonly Record<string, unknown>[];
    const l = this.optionLabel(), v = this.optionValue();
    let i = 0;
    const item = (o: unknown): Item => {
      const rec = o !== null && typeof o === 'object' ? (o as Record<string, unknown>) : null;
      return { label: String(rec ? rec[l] : o), value: rec ? rec[v] : o, i: i++ };
    };
    if (!this.group()) return [{ heading: null, items: opts.map(item) }];
    const gl = this.optionGroupLabel(), gc = this.optionGroupChildren();
    return opts.map((g) => ({ heading: String(g[gl]), items: ((g[gc] as unknown[] | undefined) ?? []).map(item) }));
  });
  protected readonly hasOptions = computed(() => this.blocks().some((b) => b.items.length > 0));
  protected readonly chosen = computed(() => {
    const v = this.value();
    for (const b of this.blocks()) for (const it of b.items) if (it.value === v) return it;
    return null;
  });
  protected readonly shown = computed(() => this.chosen()?.label ?? this.placeholder());
  protected readonly ariaName = computed(() => (this.ariaLabel() ? `${this.ariaLabel()}, ${this.shown()}` : null));
  protected readonly labelled = computed(() => (this.ariaLabelledBy() ? `${this.ariaLabelledBy()} ${this.btnId()}` : null));

  private readonly btn = viewChild.required<ElementRef<HTMLButtonElement>>('btn');
  private readonly pop = viewChild.required<ElementRef<HTMLElement>>('pop');
  private readonly injector = inject(Injector);

  constructor() {
    effect((onCleanup) => {
      const on = this.open();
      const pop = this.pop().nativeElement;
      // ponytail: the Popover API is baseline since 2024; an older engine shows the list in flow.
      try {
        if (on) pop.showPopover?.(); else pop.hidePopover?.();
      } catch { /* already in that state */ }
      if (!on) return;
      afterNextRender(() => this.place(), { injector: this.injector });
      // Scrolling anything but the list itself moves the field away from where the list hangs.
      const away = (e: Event) => { if (!(e.target instanceof Node && pop.contains(e.target))) this.close(false); };
      document.addEventListener('scroll', away, true);
      onCleanup(() => document.removeEventListener('scroll', away, true));
    });
  }

  protected toggle(): void {
    if (this.open()) this.close(true);
    else this.open.set(true);
  }

  protected openByKey(e: Event): void {
    if (this.open()) return;
    e.preventDefault();
    this.open.set(true);
  }

  /** The list exists after the render that opened it, so it is measured and the chosen row focused then. */
  private place(): void {
    const b = this.btn().nativeElement.getBoundingClientRect();
    const l = this.pop().nativeElement.getBoundingClientRect();
    const pad = 8;
    const width = Math.max(b.width, l.width);
    const below = b.bottom + 6 + l.height <= window.innerHeight - pad;
    this.w.set(b.width);
    this.y.set(below ? b.bottom + 6 : Math.max(pad, b.top - 6 - l.height));
    this.x.set(Math.max(pad, Math.min(b.left, window.innerWidth - pad - width)));
    const rows = this.rows();
    const hit = rows.find((r) => r.getAttribute('aria-selected') === 'true') ?? rows[0];
    hit?.focus({ preventScroll: true });
    hit?.scrollIntoView?.({ block: 'nearest' });
  }

  private rows(): HTMLElement[] {
    return [...this.pop().nativeElement.querySelectorAll<HTMLElement>('.opt')];
  }

  protected pick(it: Item): void {
    this.value.set(it.value);
    this.close(true);
  }

  protected close(refocus: boolean): void {
    if (!this.open()) return;
    this.open.set(false);
    if (refocus) this.btn().nativeElement.focus();
  }

  protected onOutside(e: Event): void {
    if (this.open() && !(e.target instanceof Node && this.btn().nativeElement.parentElement!.contains(e.target))) this.close(false);
  }

  protected onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') { e.stopPropagation(); this.close(true); return; }
    if (e.key === 'Tab') { this.close(false); return; }
    const rows = this.rows();
    const at = rows.indexOf(document.activeElement as HTMLElement);
    const to = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: rows.length - 1 }[e.key];
    if (to !== undefined) {
      e.preventDefault();
      const hit = rows[Math.max(0, Math.min(rows.length - 1, to))];
      hit?.focus({ preventScroll: true });
      hit?.scrollIntoView?.({ block: 'nearest' });
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && at >= 0) { e.preventDefault(); rows[at].click(); return; }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const k = e.key.toLowerCase();
      const next = [...rows.slice(at + 1), ...rows.slice(0, at + 1)].find((r) => r.textContent?.trim().toLowerCase().startsWith(k));
      next?.focus({ preventScroll: true });
      next?.scrollIntoView?.({ block: 'nearest' });
    }
  }
}
