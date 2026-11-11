import { ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, computed, input, model, output, viewChildren } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

/**
 * The rating, as the lab's "numerals" draws it: Syne 26px numerals in a radiogroup, the chosen one
 * cream with a 5px bead under it, the others muted, and the word for the score below in Syne 18px.
 * The caller supplies the words (Uzbek, Russian and English differ). `kometa-stars` still only
 * displays a score; this one is how a score is given.
 *
 * A Signal Forms number control (`FormValueControl<number>`): 0 is "nothing chosen yet".
 * Clicking the chosen numeral again leaves it chosen; a rating is not a toggle.
 *
 * Spec: kometa-rating.spec.ts, design in
 * docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 */
@Component({
  selector: 'kometa-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .rt { display: flex; flex-direction: column; gap: 12px; }
    .row { display: flex; flex-wrap: wrap; gap: var(--rating-gap, 20px); }
    button {
      position: relative;
      margin: 0;
      padding: 0 0 10px;
      border: 0;
      background: transparent;
      color: var(--muted);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-weight: 700;
      font-size: var(--rating-size, 26px);
      letter-spacing: -0.03em;
      line-height: 1.15;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      transition: color 420ms;
    }
    .rt:not(.ro) button:hover:not(:disabled) { color: var(--text); }
    button::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 0;
      width: 5px;
      height: 5px;
      margin-left: -2.5px;
      border-radius: 50%;
      background: var(--display-ink, var(--text));
      transform: scale(0);
      transition: transform 420ms var(--drawer-ease, cubic-bezier(0.22, 1.35, 0.32, 1));
    }
    button[aria-checked='true'] { color: var(--display-ink, var(--text)); }
    button[aria-checked='true']::after { transform: scale(1); }
    button:focus-visible { outline: 2px solid var(--amber); outline-offset: 4px; border-radius: 4px; }
    button:disabled { cursor: default; opacity: 0.5; }
    .ro button { cursor: default; }
    @media (pointer: coarse) { button { min-width: 44px; min-height: 44px; } }
    .word {
      margin: 0;
      min-height: 22px;
      color: var(--display-ink, var(--text));
      font-family: var(--font-display, 'Syne', sans-serif);
      font-weight: 700;
      font-size: var(--rating-word-size, 18px);
      letter-spacing: -0.02em;
    }
    @media (prefers-reduced-motion: reduce) {
      button, button::after { transition: none; }
    }
  `,
  template: `
    <div class="rt" [class.ro]="readonly()">
      <div
        class="row"
        role="radiogroup"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-disabled]="disabled() ? 'true' : null"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-invalid]="touched() && invalid() ? 'true' : null"
        (keydown)="onKey($event)"
      >
        @for (n of scale(); track n) {
          <button
            #numeral
            type="button"
            role="radio"
            [attr.aria-checked]="value() === n ? 'true' : 'false'"
            [attr.aria-label]="words()[n - 1] ? n + ', ' + words()[n - 1] : null"
            [attr.tabindex]="n === stop() ? 0 : -1"
            [disabled]="disabled()"
            (click)="choose(n)"
            (blur)="touch.emit()"
          >{{ n }}</button>
        }
      </div>
      @if (showWord()) { <p class="word" aria-hidden="true">{{ words()[value() - 1] ?? '' }}</p> }
    </div>
  `,
})
export class KometaRating implements FormValueControl<number> {
  /** 0 is nothing chosen; 1 to `max` is the score. */
  readonly value = model(0);
  /** The top score (default 5). The name is the Signal Forms contract's, so a `max()` rule on the field sets it. */
  readonly max = input<number | undefined>(undefined);
  /** One word per score, in order: `['Yomon', 'Past', 'Oʻrtacha', 'Yaxshi', 'Aʼlo']`. */
  readonly words = input<readonly string[]>([]);
  readonly ariaLabel = input('');
  /** The word for the score under the numerals. */
  readonly showWord = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Emitted on blur of a numeral, which is what marks a Signal Forms field touched. */
  readonly touch = output<void>();

  private readonly numerals = viewChildren<ElementRef<HTMLButtonElement>>('numeral');

  private readonly top = computed(() => Math.max(1, this.max() ?? 5));
  protected readonly scale = computed(() => Array.from({ length: this.top() }, (_, i) => i + 1));
  /** The one numeral in the tab order: the chosen one, or the first while nothing is chosen. */
  protected readonly stop = computed(() => (this.value() >= 1 && this.value() <= this.top() ? this.value() : 1));

  protected choose(n: number): void {
    if (this.disabled() || this.readonly()) return;
    this.value.set(n);
  }

  protected onKey(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const at = this.numerals().findIndex((b) => b.nativeElement === event.target);
    if (at < 0) return;
    const last = this.numerals().length - 1;
    const to =
      event.key === 'ArrowRight' || event.key === 'ArrowDown' ? Math.min(at + 1, last)
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? Math.max(at - 1, 0)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : -1;
    if (to < 0) return;
    event.preventDefault();
    this.numerals()[to].nativeElement.focus();
    this.choose(to + 1);
  }

  focus(options?: FocusOptions): void {
    const buttons = this.numerals();
    (buttons[this.stop() - 1] ?? buttons[0])?.nativeElement.focus(options);
  }
}
