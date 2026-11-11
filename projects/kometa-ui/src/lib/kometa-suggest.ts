import {
  ChangeDetectionStrategy, Component, TemplateRef, DestroyRef, ElementRef, Injector, afterNextRender, booleanAttribute, effect, inject, input, model, output, signal, viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { KometaPerson } from './kometa-person';

export interface KometaSuggestion<T = unknown> {
  /** The name drawn, and what the field holds once picked. */
  label: string;
  /** The quiet line under it (a phone). */
  meta?: string;
  data?: T;
}

let nextId = 0;

/**
 * A text field that offers people while you type. The field is a plain `<input>` (the console's underlined field draws
 * it), free text always: a word nobody has is simply what was typed. From `minLength` letters, after `delay` ms of quiet,
 * `(query)` fires with the text and the page answers by setting `suggestions`; the list is a glass panel in the browser's
 * top layer under the field (so a sheet cannot clip it), flips above when there is no room, and the field keeps focus
 * (`aria-activedescendant`): Arrow keys move over the rows, Enter picks, Escape or a click outside closes. `(picked)` carries the
 * chosen row; the field then holds its label.
 * Spec: kometa-suggest.spec.ts.
 */
@Component({
  selector: 'kometa-suggest',
  imports: [KometaPerson, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'close()',
    '(window:scroll)': 'close()',
    '(document:pointerdown)': 'onOutside($event)',
  },
  styles: `
    :host { display: block; position: relative; }
    input { width: 100%; }
    .pop {
      inset: auto; margin: 0; padding: 6px; overflow-y: auto; overscroll-behavior: contain;
      min-width: 240px; max-width: calc(100vw - 16px); max-height: min(var(--suggest-max-height, 320px), calc(100vh - 16px));
      border: 1px solid var(--glass-line); border-radius: var(--suggest-radius, 18px); color: var(--text);
      background: var(--glass-drawer, var(--bg)); backdrop-filter: blur(24px) saturate(1.2); box-shadow: 0 12px 30px rgba(0, 0, 0, .35);
      transition: opacity 180ms ease, translate 320ms var(--ease-spring, ease);
    }
    @starting-style { .pop:popover-open { opacity: 0; translate: 0 -4px; } }
    .opt {
      display: flex; width: 100%; align-items: center; min-height: var(--suggest-row-height, 52px); padding: 0 10px; border: 0; border-radius: 12px;
      background: none; color: inherit; font: inherit; text-align: left; cursor: pointer;
    }
    .opt + .opt { margin-top: 2px; }
    .opt:hover, .opt.on { background: var(--glass-line); }
    @media (prefers-reduced-motion: reduce) { .pop { transition: none; } }
  `,
  template: `
    <input #field type="text" autocomplete="off" role="combobox" aria-autocomplete="list" [id]="inputId() || null" [placeholder]="placeholder()"
           [attr.aria-label]="ariaLabel() || null" [attr.aria-expanded]="open()" [attr.aria-controls]="id"
           [attr.aria-activedescendant]="open() && active() >= 0 ? id + '-' + active() : null" [value]="value()" [readOnly]="readonly()"
           (input)="onInput($any($event.target).value)" (keydown)="onKey($event)" />
    <div #pop class="pop" popover="manual" role="listbox" [id]="id" [style.left.px]="x()" [style.top.px]="y()" [style.width.px]="w()">
      @if (open()) {
        @for (s of suggestions(); track $index) {
          <button type="button" class="opt" role="option" tabindex="-1" [id]="id + '-' + $index" [class.on]="$index === active()"
                  [attr.aria-selected]="$index === active()" (mousedown)="$event.preventDefault()" (click)="pick(s)">
            @if (optionTemplate(); as tpl) {
              <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ $implicit: s }" />
            } @else {
              <kometa-person size="sm" [name]="s.label" [meta]="s.meta ?? ''" />
            }
          </button>
        }
      }
    </div>
  `,
})
export class KometaSuggest {
  protected readonly id = `kometa-suggest-${nextId++}`;
  readonly value = model('');
  readonly suggestions = input<KometaSuggestion[]>([]);
  readonly inputId = input('');
  readonly ariaLabel = input('');
  readonly placeholder = input('');
  readonly minLength = input(2);
  /** Milliseconds of quiet before `(query)` fires. */
  readonly delay = input(300);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Draws a row itself; the context's `$implicit` is the suggestion. */
  readonly optionTemplate = input<TemplateRef<{ $implicit: KometaSuggestion }> | null>(null);
  readonly query = output<string>();
  readonly picked = output<KometaSuggestion>();

  protected readonly active = signal(-1);
  protected readonly shown = signal(false);
  protected readonly x = signal(0);
  protected readonly y = signal(0);
  protected readonly w = signal(240);
  protected readonly open = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private readonly pop = viewChild.required<ElementRef<HTMLElement>>('pop');
  private readonly injector = inject(Injector);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    // The list is open while a query was asked and rows came back; a new list resets the row on the cursor.
    effect(() => {
      const rows = this.suggestions();
      this.active.set(-1);
      if (this.shown()) this.open.set(rows.length > 0);
    });
    effect(() => {
      const on = this.open();
      const pop = this.pop().nativeElement;
      // ponytail: the Popover API is baseline since 2024; an older engine shows the list in flow.
      try {
        if (on) pop.showPopover?.(); else pop.hidePopover?.();
      } catch { /* already in that state */ }
      if (on) afterNextRender(() => this.place(), { injector: this.injector });
    });
  }

  protected onInput(text: string): void {
    this.value.set(text);
    clearTimeout(this.timer);
    if (text.trim().length < this.minLength()) {
      this.shown.set(false);
      this.open.set(false);
      return;
    }
    this.timer = setTimeout(() => {
      this.shown.set(true);
      this.query.emit(text.trim());
    }, this.delay());
  }

  private place(): void {
    const b = this.field().nativeElement.getBoundingClientRect();
    const l = this.pop().nativeElement.getBoundingClientRect();
    const pad = 8;
    const below = b.bottom + 6 + l.height <= window.innerHeight - pad;
    this.w.set(Math.max(240, b.width));
    this.y.set(below ? b.bottom + 6 : Math.max(pad, b.top - 6 - l.height));
    this.x.set(Math.max(pad, Math.min(b.left, window.innerWidth - pad - Math.max(240, b.width))));
  }

  protected pick(s: KometaSuggestion): void {
    this.value.set(s.label);
    this.picked.emit(s);
    this.close();
  }

  protected close(): void {
    this.shown.set(false);
    this.open.set(false);
  }

  protected onOutside(e: Event): void {
    if (this.open() && !(e.target instanceof Node && (this.field().nativeElement.parentElement as HTMLElement).contains(e.target))) this.close();
  }

  protected onKey(e: KeyboardEvent): void {
    if (!this.open()) return;
    const n = this.suggestions().length;
    if (e.key === 'ArrowDown') { e.preventDefault(); this.active.set((this.active() + 1) % n); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.active.set((this.active() - 1 + n) % n); }
    else if (e.key === 'Enter' && this.active() >= 0) { e.preventDefault(); this.pick(this.suggestions()[this.active()]); }
    else if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
    else if (e.key === 'Tab') this.close();
  }
}
