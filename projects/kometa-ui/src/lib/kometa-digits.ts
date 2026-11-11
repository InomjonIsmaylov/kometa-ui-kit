import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, model } from '@angular/core';

/**
 * A `+998` national number. The model is digits only, at most 9, shown as `90 123 45 67`.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 *
 *
 */
@Component({
  selector: 'kometa-digits',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-size]': 'size()' },
  styles: `
    :host { display: inline-flex; max-width: 100%; }
    .phone {
      display: inline-flex;
      min-width: 0;
      align-items: baseline;
      gap: 8px;
      font-family: var(--font-display, 'Syne'), sans-serif;
      font-weight: 600;
      font-size: var(--digits-size, 32px);
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.03em;
    }
    :host([data-size='sm']) .phone { font-size: var(--digits-size-sm, 16px); font-weight: 500; letter-spacing: 0; }
    .prefix { user-select: none; }
    input {
      border: 0;
      padding: 0;
      width: 11ch;
      min-width: 0; /* shrinks on narrow phones instead of widening the page */
      background: transparent;
      color: inherit;
      font: inherit;
      font-variant-numeric: tabular-nums;
    }
    input:disabled { opacity: .5; }
    input:focus-visible { outline: 2px solid var(--amber); }
  `,
  template: `
    <label class="phone">
      <span class="prefix">{{ prefix() }}</span>
      <input
        type="tel"
        inputmode="numeric"
        autocomplete="tel-national"
        [attr.aria-label]="ariaLabel() || null"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="grouped()"
        (input)="onInput($event)"
      />
    </label>
  `,
})
export class KometaDigits {
  /** Digits only. The `+998` prefix is display, never stored. */
  readonly value = model('');
  /** `sm` sits in a 44px form row; `md` is the big figure. */
  readonly size = input<'md' | 'sm'>('md');
  readonly ariaLabel = input('');
  /** The country prefix shown before the number (display only). */
  readonly prefix = input('+998');
  readonly placeholder = input('');
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly grouped = computed(() => groupNational(this.value()));

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 9);
    this.value.set(digits);
    input.value = groupNational(digits);
  }
}

/** `901234567` → `90 123 45 67`. Shorter input keeps the same cuts. */
function groupNational(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  const parts: string[] = [];
  for (const [start, end] of [[0, 2], [2, 5], [5, 7], [7, 9]] as const) {
    const part = digits.slice(start, end);
    if (!part) break;
    parts.push(part);
  }
  return parts.join(' ');
}
