import { ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, computed, input, model, output, viewChild } from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';

let nextId = 0;

/**
 * The text field, as the lab's "whisper" draws it: no box, the placeholder is the label (Syne 700),
 * one 1px hairline under it, and on focus a cream line draws in from the left. Under it an optional
 * "4 / 40" counter and a muted-red error line (`role="alert"`).
 *
 * A Signal Forms custom control (`FormValueControl<string>`): `<kometa-field [formField]="f.name" label="…" />`
 * binds value, disabled, readonly, required, name, touched, invalid, errors and maxLength by itself.
 * Outside Signal Forms it is a plain control: `[(value)]` and an explicit `error` string.
 *
 * Spec: kometa-field.spec.ts, design in
 * docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 */
@Component({
  selector: 'kometa-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-size]': 'size()' },
  styles: `
    :host { display: block; min-width: 0; }
    .field { display: flex; flex-direction: column; gap: 6px; color: var(--text); }
    input {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      border: 0;
      border-radius: 0;
      outline: none;
      background: transparent;
      box-shadow: none;
      padding: 6px 0 8px;
      color: var(--display-ink, var(--text));
      font-family: var(--font-display, 'Syne', sans-serif);
      font-weight: 700;
      font-size: 24px;
      letter-spacing: -0.03em;
      line-height: 1.15;
      -webkit-appearance: none;
      appearance: none;
    }
    :host([data-size='sm']) input { font-size: 18px; padding: 4px 0 6px; }
    @media (pointer: coarse) { input { min-height: 44px; } }
    input::placeholder { color: var(--muted); opacity: 0.7; }
    input:disabled { opacity: 0.5; cursor: default; }
    .rule {
      position: relative;
      height: 1px;
      background: var(--glass-line, var(--border));
      pointer-events: none;
    }
    .rule i {
      position: absolute;
      inset: auto 0 0;
      height: 2px;
      border-radius: 2px;
      background: var(--display-ink, var(--text));
      transform: scaleX(0);
      transform-origin: left;
      transition: transform var(--drawer-dur, 680ms) var(--drawer-ease, cubic-bezier(0.22, 1.35, 0.32, 1));
    }
    .field:focus-within .rule i { transform: scaleX(1); }
    .field.is-bad .rule i { background: var(--error); transform: scaleX(1); }
    .count {
      align-self: flex-end;
      color: var(--muted);
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
    .err {
      min-height: 16px;
      color: var(--error);
      font-size: 12px;
      opacity: 0;
      transform: translateY(-4px);
      transition: opacity 280ms ease, transform 420ms var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1));
    }
    .field.is-bad .err { opacity: 1; transform: none; }
    @media (prefers-reduced-motion: reduce) {
      .rule i, .err { transition: none; }
    }
    @media (forced-colors: active) { input:focus-visible { outline: 2px solid Highlight; } }
  `,
  template: `
    <div class="field" [class.is-bad]="bad()">
      <input
        #field
        [type]="type()"
        [attr.name]="name() || null"
        [attr.inputmode]="inputmode() || null"
        [attr.autocomplete]="autocomplete() || null"
        [attr.maxlength]="maxLength() ?? null"
        [attr.aria-label]="label()"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-invalid]="bad() ? 'true' : null"
        [attr.aria-describedby]="message() ? errId : null"
        [placeholder]="label()"
        [value]="value()"
        [disabled]="disabled()"
        [readOnly]="readonly()"
        (input)="value.set(field.value)"
        (blur)="touch.emit()"
      />
      <div class="rule" aria-hidden="true"><i></i></div>
      @if (showCount()) {
        <span class="count">{{ count() }}</span>
      }
      <span class="err" role="alert" [id]="errId">{{ message() }}</span>
    </div>
  `,
})
export class KometaField implements FormValueControl<string> {
  readonly value = model('');
  /** The placeholder AND the accessible name: the field has no other label. */
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'tel' | 'url' | 'password'>('text');
  /** `md` is Syne 24px; `sm` is 18px for a form row 24px does not fit. */
  readonly size = input<'md' | 'sm'>('md');
  readonly inputmode = input('');
  readonly autocomplete = input('');
  readonly name = input('');
  /** Camel-cased because the Signal Forms contract binds `maxLength` by that name. */
  readonly maxLength = input<number | undefined>(undefined);
  /** "4 / 40" under the line (just "4" when there is no maxLength). */
  readonly showCount = input(false, { transform: booleanAttribute });
  /** A message of the page's own. Non-empty means the field is in error. */
  readonly error = input('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Signal Forms state; a message from `errors` shows only once the field is touched. */
  readonly touched = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  /** Emitted on blur, which is what marks a Signal Forms field touched. */
  readonly touch = output<void>();

  protected readonly errId = `kometa-field-err-${nextId++}`;
  private readonly inner = viewChild.required<ElementRef<HTMLInputElement>>('field');

  protected readonly message = computed(
    () => this.error() || (this.touched() ? (this.errors().find((e) => e.message)?.message ?? '') : ''),
  );
  protected readonly bad = computed(() => !!this.message() || (this.touched() && this.invalid()));
  protected readonly count = computed(() => {
    const max = this.maxLength();
    return max ? `${this.value().length} / ${max}` : String(this.value().length);
  });

  focus(options?: FocusOptions): void {
    this.inner().nativeElement.focus(options);
  }
}
