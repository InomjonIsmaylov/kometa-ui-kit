import {
  AfterViewChecked,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  input,
  model,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export interface KometaWordOption {
  value: string;
  label: string;
  /** Round 14, B Tabs: the count follows the word, muted; `hot` (something to do) makes it an amber superscript. */
  count?: number | string | null;
  hot?: boolean;
}

/**
 * A handful of words with a cream line under the pressed one.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 */
@Component({
  selector: 'k-words',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    '[attr.role]': "tabs() ? 'tablist' : 'group'",
    '[attr.aria-label]': 'ariaLabel() || null',
    '(keydown)': 'onKey($event)',
  },
  styles: `
    /* A long Russian or Uzbek row scrolls sideways inside its own box; it never wraps or widens the page. */
    :host { display: inline-block; max-width: 100%; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
    :host::-webkit-scrollbar { display: none; }
    .row {
      position: relative;
      display: flex;
      gap: var(--words-gap, 16px);
      width: max-content;
      min-width: 100%;
    }
    button {
      margin: 0;
      padding: var(--words-pad, 8px 0 10px);
      border: 0;
      background: transparent;
      color: var(--muted);
      font: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .cnt { font-size: 11.5px; font-weight: 500; color: var(--muted); }
    .cnt.hot { align-self: flex-start; margin-top: 4px; margin-left: -3px; font-size: 10.5px; font-weight: 700; color: var(--amber-ink, var(--amber)); }
    button:hover:not(:disabled) { color: var(--text, inherit); }
    button[aria-pressed='true'], button[aria-selected='true'] { color: var(--words-ink-on, var(--text, inherit)); }
    button:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; }
    button:disabled { cursor: default; opacity: .5; }
    @media (pointer: coarse) { button { min-height: 44px; } }
    .line {
      position: absolute;
      left: 0;
      bottom: 0;
      height: var(--words-line-height, 2px);
      background: var(--words-line, var(--display-ink, #f4efe6));
      pointer-events: none;
      transition: transform .28s var(--ease-spring, ease), width .28s var(--ease-spring, ease);
    }
    @media (prefers-reduced-motion: reduce) {
      .line { transition: none; }
    }
  `,
  template: `
    <div class="row">
      @for (opt of options(); track opt.value) {
        <button #word type="button" [attr.role]="tabs() ? 'tab' : null"
                [attr.aria-pressed]="tabs() ? null : value() === opt.value ? 'true' : 'false'"
                [attr.aria-selected]="tabs() ? (value() === opt.value ? 'true' : 'false') : null"
                [attr.tabindex]="tabs() && value() !== opt.value ? -1 : null" [disabled]="disabled()"
                (click)="choose(opt.value, $event)">
          @if (optionTemplate(); as tpl) {
            <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ $implicit: opt }" />
          } @else {
            {{ opt.label }}&ngsp;@if (opt.count !== undefined && opt.count !== null) { <span class="cnt num" [class.hot]="opt.hot">{{ opt.count }}</span> }
          }
        </button>
      }
      <span #line class="line"></span>
    </div>
  `,
})
export class KometaWords implements AfterViewChecked {
  readonly options = input.required<readonly KometaWordOption[]>();
  readonly value = model('');
  readonly ariaLabel = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Draws each word itself (an icon beside the label, say); the context's `$implicit` is the option. */
  /** A real tab strip (its words switch panels): tablist/tab roles, aria-selected, one tab stop, arrow keys. */
  readonly tabs = input(false, { transform: booleanAttribute });
  readonly optionTemplate = input<TemplateRef<{ $implicit: KometaWordOption }> | null>(null);

  private readonly words = viewChildren<ElementRef<HTMLButtonElement>>('word');
  private readonly line = viewChild<ElementRef<HTMLElement>>('line');

  ngAfterViewChecked(): void {
    const selected = this.value();
    const index = this.options().findIndex((option) => option.value === selected);
    const word = this.words()[index]?.nativeElement;
    if (word) this.moveLine(word);
  }

  protected onKey(event: KeyboardEvent): void {
    if (!this.tabs()) return;
    const words = this.words().map((w) => w.nativeElement);
    const at = words.findIndex((w) => w === event.target);
    if (at < 0) return;
    const to =
      event.key === 'ArrowRight' ? (at + 1) % words.length
      : event.key === 'ArrowLeft' ? (at - 1 + words.length) % words.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? words.length - 1
      : -1;
    if (to < 0) return;
    event.preventDefault();
    words[to].focus();
    this.value.set(this.options()[to].value);
  }

  protected choose(next: string, event: Event): void {
    this.value.set(next);
    const word = event.currentTarget;
    if (word instanceof HTMLElement) this.moveLine(word);
  }

  private moveLine(word: HTMLElement): void {
    const line = this.line()?.nativeElement;
    if (!line) return;
    line.style.transform = `translateX(${word.offsetLeft}px)`;
    line.style.width = `${word.offsetWidth}px`;
  }
}
