import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, booleanAttribute, computed, effect, inject, input, model, signal, viewChild,
} from '@angular/core';

interface Item { label: string; value: unknown; dot: string | null; i: number }

let nextId = 0;

/**
 * Several choices from a list. What is chosen sits in the field as words with a cross; the field is also an input,
 * so typing narrows the list (a glass list in the browser's top layer, which flips above when there is no room
 * below). Arrow keys move through the list, Enter toggles the row under the cursor, Backspace on an empty input
 * takes the last choice off, Escape closes (and does not reach a drawer behind it), Tab, a click outside, resize
 * and scroll elsewhere close it. The list stays open while you choose.
 *
 * `pill` is the toolbar form: no chips and no typing, a bordered button that shows the caller's `summary` ("Columns
 * 3/7", "Shops: 2 chosen") and the same list under it. `options` are objects read through `optionLabel` and
 * `optionValue`; `optionDot` names a field holding a colour, drawn as a dot before the label.
 * `value` is the array of chosen values, replaced (never changed in place) on every toggle.
 * Spec: kometa-multi.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-9.html (Chips).
 */
@Component({
  selector: 'k-multi',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.pill]': 'pill()',
    '(window:resize)': 'close()',
    '(document:pointerdown)': 'onOutside($event)',
  },
  styles: `
    :host { position: relative; display: block; min-width: 0; }
    :host(.pill) { display: inline-block; }
    .field {
      position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: var(--control-h, 40px); padding: 4px 0;
      border-bottom: 1px solid var(--glass-line); cursor: text;
    }
    .field::after {
      content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 1px; background: var(--display-ink, var(--text));
      transform: scaleX(.3); transform-origin: left; opacity: .5; transition: transform 420ms var(--ease-spring, ease), opacity 200ms ease;
    }
    .field:hover::after, .field:focus-within::after { transform: none; opacity: 1; }
    .field.off { opacity: .5; cursor: not-allowed; }
    .chip {
      display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px 0 12px; border: 1px solid var(--glass-line);
      border-radius: var(--multi-chip-radius, 999px); background: none; color: var(--display-ink, var(--text)); font: inherit; font-size: 14px; cursor: pointer;
    }
    .chip span { color: var(--muted); font-size: 16px; line-height: 1; }
    .chip:hover:not(:disabled) span { color: var(--display-ink, var(--text)); }
    .chip:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    input {
      flex: 1; min-width: 90px; height: 30px; padding: 0; border: 0; outline: 0; background: none; color: var(--display-ink, var(--text)); font: inherit;
    }
    input::placeholder { color: var(--muted); }
    .btn {
      display: flex; align-items: center; gap: 10px; min-height: 36px; padding: 0 12px; border: 1px solid var(--glass-line); border-radius: 999px;
      background: var(--glass); color: var(--display-ink, var(--text)); font: inherit; cursor: pointer;
    }
    .btn:hover:not(:disabled), .btn[aria-expanded='true'] { border-color: var(--display-ink, var(--text)); }
    .btn:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn { max-width: 100%; }
    .val { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-weight: 600; white-space: nowrap; }
    .val.empty { color: var(--muted); font-weight: 400; }
    .chev {
      flex: none; width: 7px; height: 7px; margin-top: -4px; border-right: 1px solid currentColor; border-bottom: 1px solid currentColor;
      color: var(--muted); transform: rotate(45deg); transition: transform 320ms var(--ease-spring, ease);
    }
    .btn[aria-expanded='true'] .chev { transform: rotate(225deg); margin-top: 4px; }
    @media (pointer: coarse) { .field, .btn { min-height: 44px; } }
    .pop {
      inset: auto; margin: 0; padding: 6px; min-width: 180px; max-width: calc(100vw - 16px); max-height: var(--multi-pop-max-height, 300px); overflow: auto;
      border: 1px solid var(--glass-line); border-radius: var(--multi-pop-radius, 16px); color: var(--text);
      background: var(--glass-drawer, var(--bg)); backdrop-filter: blur(18px); box-shadow: 0 12px 30px rgba(0, 0, 0, .35);
      transition: opacity 180ms ease, translate 320ms var(--ease-spring, ease);
    }
    @starting-style { .pop:popover-open { opacity: 0; translate: 0 -4px; } }
    .opt {
      display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; color: var(--text); font-size: 15px; cursor: pointer;
      overflow-wrap: anywhere; transition: background 160ms ease;
    }
    .opt:hover, .opt.act { background: var(--glass-line); }
    .opt[aria-selected='true'] { color: var(--display-ink, var(--text)); box-shadow: inset 2px 0 0 var(--display-ink, var(--text)); }
    .dot { flex: none; width: 8px; height: 8px; border-radius: 50%; }
    .none { margin: 0; padding: 8px 12px; color: var(--muted); font-size: 13.5px; }
    @media (pointer: coarse) { .opt { padding: 12px; } }
    @media (prefers-reduced-motion: reduce) { .field::after, .chev, .pop, .opt { transition: none; } }
  `,
  template: `
    @if (pill()) {
      <button #btn class="btn" type="button" role="combobox" aria-haspopup="listbox" [id]="inputId() || null" [disabled]="disabled()"
              [attr.aria-expanded]="open()" [attr.aria-controls]="id" [attr.aria-activedescendant]="activeId()"
              [attr.aria-label]="ariaLabel() || null" (click)="toggle()" (keydown)="onKey($event)">
        <span class="val" [class.empty]="!value().length">{{ summary() || placeholder() }}</span>
        <i class="chev" aria-hidden="true"></i>
      </button>
    } @else {
      <div #field class="field" [class.off]="disabled()" (click)="focusInput()">
        @for (it of chosen(); track it.i) {
          <button class="chip" type="button" tabindex="-1" [disabled]="disabled()" [attr.aria-label]="removeLabel() + ' ' + it.label" (click)="toggleItem(it, $event)">
            {{ it.label }}<span aria-hidden="true">&times;</span>
          </button>
        }
        <input #entry role="combobox" aria-autocomplete="list" autocomplete="off" [id]="inputId() || null" [disabled]="disabled()"
               [attr.aria-expanded]="open()" [attr.aria-controls]="id" [attr.aria-activedescendant]="activeId()" [attr.aria-label]="ariaLabel() || null"
               [placeholder]="value().length ? '' : placeholder()" [value]="query()"
               (input)="onInput($event)" (focus)="show()" (keydown)="onKey($event)" />
      </div>
    }
    <div #pop class="pop" popover="manual" [style.left.px]="x()" [style.top.px]="y()" [style.min-width.px]="w()">
      @if (open()) {
        <div role="listbox" aria-multiselectable="true" [id]="id" [attr.aria-label]="ariaLabel() || null">
          @for (it of shown(); track it.i; let n = $index) {
            <div class="opt" role="option" [id]="id + '-' + n" [class.act]="n === act()" [attr.aria-selected]="isChosen(it)"
                 (mousedown)="$event.preventDefault()" (click)="toggleItem(it)">
              @if (it.dot) { <i class="dot" [style.background]="it.dot" aria-hidden="true"></i> }{{ it.label }}
            </div>
          } @empty {
            <p class="none">{{ noMatch() }}</p>
          }
        </div>
      }
    </div>
  `,
})
export class KometaMulti {
  protected readonly id = `kometa-multi-${nextId++}`;
  readonly options = input<readonly unknown[] | null | undefined>([]);
  readonly optionLabel = input('label');
  readonly optionValue = input('value');
  readonly optionDot = input('');
  // The values are whatever the options hold; the call site types them.
  readonly value = model<readonly any[]>([]);
  readonly placeholder = input('');
  readonly summary = input('');
  readonly noMatch = input('');
  readonly removeLabel = input('Remove');
  readonly pill = input(false, { transform: booleanAttribute });
  /** The most choices allowed; null is no limit. A full set can still be reduced. */
  readonly max = input<number | null>(null);
  readonly ariaLabel = input('');
  readonly inputId = input('');
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly act = signal(0);
  protected readonly x = signal(0);
  protected readonly y = signal(0);
  protected readonly w = signal(180);

  private readonly items = computed<Item[]>(() => {
    const l = this.optionLabel(), v = this.optionValue(), d = this.optionDot();
    return ((this.options() ?? []) as readonly unknown[]).map((o, i) => {
      const rec = o !== null && typeof o === 'object' ? (o as Record<string, unknown>) : null;
      return { label: String(rec ? rec[l] : o), value: rec ? rec[v] : o, dot: rec && d ? (rec[d] as string | null) : null, i };
    });
  });
  protected readonly chosen = computed(() => {
    const items = this.items();
    // In the order they were chosen, as the value holds them.
    return this.value().map((v) => items.find((it) => it.value === v)).filter((it): it is Item => !!it);
  });
  protected readonly shown = computed(() => {
    const q = this.pill() ? '' : this.query().trim().toLowerCase();
    return q ? this.items().filter((it) => it.label.toLowerCase().includes(q)) : this.items();
  });
  protected readonly activeId = computed(() => (this.open() && this.shown().length ? `${this.id}-${Math.min(this.act(), this.shown().length - 1)}` : null));

  private readonly btn = viewChild<ElementRef<HTMLButtonElement>>('btn');
  private readonly entry = viewChild<ElementRef<HTMLInputElement>>('entry');
  private readonly field = viewChild<ElementRef<HTMLElement>>('field');
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
      const away = (e: Event) => { if (!(e.target instanceof Node && pop.contains(e.target))) this.close(); };
      document.addEventListener('scroll', away, true);
      onCleanup(() => document.removeEventListener('scroll', away, true));
    });
  }

  protected isChosen(it: Item): boolean {
    return this.value().includes(it.value);
  }

  protected focusInput(): void {
    this.entry()?.nativeElement.focus();
  }

  protected show(): void {
    if (this.disabled()) return;
    this.open.set(true);
  }

  protected toggle(): void {
    if (this.open()) this.close(); else this.show();
  }

  protected close(): void {
    this.open.set(false);
    this.act.set(0);
  }

  private place(): void {
    const anchor = (this.pill() ? this.btn() : this.field())?.nativeElement.getBoundingClientRect();
    if (!anchor) return;
    const l = this.pop().nativeElement.getBoundingClientRect();
    const pad = 8;
    const width = Math.max(anchor.width, l.width);
    const below = anchor.bottom + 6 + l.height <= window.innerHeight - pad;
    this.w.set(anchor.width);
    this.y.set(below ? anchor.bottom + 6 : Math.max(pad, anchor.top - 6 - l.height));
    this.x.set(Math.max(pad, Math.min(anchor.left, window.innerWidth - pad - width)));
  }

  protected toggleItem(it: Item, e?: Event): void {
    e?.stopPropagation();
    const v = this.value();
    const full = !v.includes(it.value) && this.max() !== null && v.length >= this.max()!;
    if (!full) this.value.set(v.includes(it.value) ? v.filter((x) => x !== it.value) : [...v, it.value]);
    if (!this.pill()) {
      this.query.set('');
      this.entry()?.nativeElement.focus();
    }
  }

  protected onInput(e: Event): void {
    this.query.set((e.target as HTMLInputElement).value);
    this.act.set(0);
    this.show();
  }

  protected onOutside(e: Event): void {
    if (this.open() && !(e.target instanceof Node && (this.btn()?.nativeElement.parentElement ?? this.field()?.nativeElement.parentElement)?.contains(e.target))) this.close();
  }

  protected onKey(e: KeyboardEvent): void {
    const shown = this.shown();
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!this.open()) { this.show(); return; }
      const n = Math.max(1, shown.length);
      this.act.update((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + n) % n);
      this.pop().nativeElement.querySelector('.act')?.scrollIntoView?.({ block: 'nearest' });
    } else if (e.key === 'Enter' || (this.pill() && e.key === ' ')) {
      if (!this.open()) { if (this.pill()) { e.preventDefault(); this.show(); } return; }
      e.preventDefault();
      const it = shown[Math.min(this.act(), shown.length - 1)];
      if (it) this.toggleItem(it);
    } else if (e.key === 'Backspace' && !this.pill() && !this.query() && this.value().length) {
      this.value.set(this.value().slice(0, -1));
    } else if (e.key === 'Escape' && this.open()) {
      e.stopPropagation();
      this.close();
    } else if (e.key === 'Tab') {
      this.close();
    }
  }
}
