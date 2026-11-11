import { ChangeDetectionStrategy, Component, booleanAttribute, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * The one number field: a whole number typed into a bare figure, with a hairline under it that draws itself on
 * focus. Digits only; ArrowUp and ArrowDown step by `step` (Shift by ten times it) and stop at `min` and `max`.
 * Typing never leaves the range in `value`: it is held at the nearest end while the box keeps what was typed, and
 * the box catches up when focus leaves. An empty box is `null`, never 0: a price or a count nobody has typed yet
 * must not be saved as zero. A pasted fraction is cut (whole numbers only).
 *
 * `money` groups the figure with a no-break space (ru-RU), floors it at 0 unless `min` says otherwise and fills its
 * row; `suffix` is a unit word after it. `buttons` draws the minus and plus circles either side (a small count).
 * It is a model (`[(value)]`) and a `ControlValueAccessor`, so `[(ngModel)]` and `[formControl]` work too.
 * Spec: kometa-number.spec.ts.
 */
@Component({
  selector: 'k-number',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => KometaNumber), multi: true }],
  styles: `
    :host { position: relative; display: inline-flex; align-items: center; gap: 10px; padding-bottom: 6px; vertical-align: bottom; }
    :host(.money) { display: flex; width: 100%; }
    :host(.money) input { flex: 1; width: auto; min-width: 0; }
    .nfield { position: relative; display: inline-flex; align-items: baseline; gap: 8px; flex: 1 1 auto; min-width: 0; }
    :host(:not(.money)) .nfield { flex: none; }
    .nfield::after {
      content: ''; position: absolute; left: 0; right: 0; bottom: -6px; height: 1px; background: var(--display-ink, var(--text));
      transform: scaleX(.3); transform-origin: left; opacity: .5;
      transition: transform 420ms var(--ease-spring, ease), opacity 200ms ease;
    }
    :host(:focus-within) .nfield::after { transform: none; opacity: 1; }
    :host(.bad) .nfield::after { background: var(--red); transform: none; opacity: 1; }
    input {
      box-sizing: content-box; width: 3ch; min-height: 28px; padding: 0; border: 0; border-radius: 0; outline: 0; background: transparent;
      color: var(--number-color, var(--display-ink, var(--text))); font-family: var(--font-display, inherit); font-size: var(--number-size, 24px); letter-spacing: -.02em;
      font-variant-numeric: tabular-nums;
    }
    input:disabled { opacity: .4; cursor: not-allowed; }
    .suf { color: var(--muted); font-size: 13px; white-space: nowrap; }
    .step {
      flex: none; width: 32px; height: 32px; padding: 0; border-radius: 50%; border: 1px solid var(--border2); background: transparent;
      color: var(--text); font: inherit; cursor: pointer; display: grid; place-items: center; transition: opacity 200ms ease;
    }
    .step:disabled { opacity: .35; cursor: not-allowed; }
    @media (pointer: coarse) { input { min-height: 36px; } .step { width: 40px; height: 40px; } }
    @media (prefers-reduced-motion: reduce) { .nfield::after, .step { transition: none; } }
  `,
  host: { '[class.bad]': 'bad()', '[class.money]': 'money()' },
  template: `
    @if (buttons()) {
      <button type="button" class="step" tabindex="-1" aria-hidden="true" [disabled]="isDisabled() || readonly() || atMin()" (click)="nudge(-1)">&minus;</button>
    }
    <span class="nfield">
      <input type="text" inputmode="numeric" autocomplete="off" role="spinbutton" [id]="inputId() || null"
             [attr.aria-label]="ariaLabel() || null" [placeholder]="placeholder()"
             [attr.aria-valuemin]="ariaMin()" [attr.aria-valuemax]="ariaMax()"
             [attr.aria-valuenow]="value()" [attr.aria-invalid]="bad() || null"
             [style.width.ch]="width()" [disabled]="isDisabled()" [readOnly]="readonly()" [value]="shown()"
             (input)="onInput($event)" (blur)="onBlur()" (keydown)="onKey($event)" />
      @if (suffix()) { <span class="suf">{{ suffix() }}</span> }
    </span>
    @if (buttons()) {
      <button type="button" class="step" tabindex="-1" aria-hidden="true" [disabled]="isDisabled() || readonly() || atMax()" (click)="nudge(1)">+</button>
    }
  `,
})
export class KometaNumber implements ControlValueAccessor {
  readonly value = model<number | null>(null);
  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  readonly step = input(1);
  readonly suffix = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly inputId = input('');
  readonly money = input(false, { transform: booleanAttribute });
  /** Draws the minus and plus circles either side of the figure. */
  readonly buttons = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  /** The locale `money` groups digits by. */
  readonly locale = input('ru-RU');

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly lo = computed(() => this.min() ?? (this.money() ? 0 : -Infinity));
  protected readonly hi = computed(() => this.max() ?? Infinity);
  protected readonly ariaMin = computed(() => (Number.isFinite(this.lo()) ? this.lo() : null));
  protected readonly ariaMax = computed(() => (Number.isFinite(this.hi()) ? this.hi() : null));

  /** What was typed, while the box has focus; null otherwise, so the box shows the model. */
  protected readonly draft = signal<string | null>(null);
  protected readonly shown = computed(() => {
    const d = this.draft();
    if (d !== null) return d;
    const v = this.value();
    if (v === null) return '';
    return this.money() ? new Intl.NumberFormat(this.locale()).format(v) : String(v);
  });
  protected readonly width = computed(() => Math.max(3, this.shown().length + 1));
  /** The typed number is outside the range (the model holds the nearest end meanwhile). */
  protected readonly bad = computed(() => {
    const d = this.draft();
    if (!d) return false;
    const n = Number(d);
    return n < this.lo() || n > this.hi();
  });
  protected readonly atMin = computed(() => this.value() !== null && this.value()! <= this.lo());
  protected readonly atMax = computed(() => this.value() !== null && this.value()! >= this.hi());

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  private clamp(n: number): number {
    return Math.min(this.hi(), Math.max(this.lo(), n));
  }

  private commit(next: number | null): void {
    this.value.set(next);
    this.onChange(next);
  }

  protected onInput(e: Event): void {
    const el = e.target as HTMLInputElement;
    const whole = el.value.split(/[.,]/)[0].replace(/\D/g, '');
    const digits = whole.slice(0, this.hi() === Infinity ? 12 : String(this.hi()).length + 1);
    if (el.value !== digits) el.value = digits;
    this.draft.set(digits);
    this.commit(digits === '' ? null : this.clamp(Number(digits)));
  }

  protected onBlur(): void {
    this.draft.set(null);
    this.onTouched();
  }

  protected onKey(e: KeyboardEvent): void {
    if ((e.key !== 'ArrowUp' && e.key !== 'ArrowDown') || this.readonly()) return;
    e.preventDefault();
    this.nudge(e.key === 'ArrowUp' ? 1 : -1, e.shiftKey ? 10 : 1);
  }

  protected nudge(dir: 1 | -1, times = 1): void {
    const lo = this.lo() === -Infinity ? 0 : this.lo();
    const from = this.value() ?? (dir > 0 ? lo - this.step() : lo + this.step());
    this.draft.set(null);
    this.commit(this.clamp(from + dir * this.step() * times));
  }

  writeValue(value: number | null | undefined): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
