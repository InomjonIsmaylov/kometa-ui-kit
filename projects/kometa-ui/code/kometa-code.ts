import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  ElementRef,
  computed,
  input,
  model,
  viewChild,
  viewChildren,
} from '@angular/core';

/**
 * One cell per digit. A cream line sits under the cell being typed.
 * Length defaults to 6 — the product code, not the lab's 4.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 */
@Component({
  selector: 'k-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: inline-block; }
    .label {
      display: block;
      margin: 0 0 8px;
      color: var(--muted);
      font-size: 13px;
    }
    .cells {
      position: relative;
      display: flex;
      gap: var(--code-gap, 8px);
    }
    input {
      width: var(--code-cell-width, 2rem);
      margin: 0;
      padding: 8px 0;
      border: 0;
      border-bottom: 1px solid var(--border, rgba(244, 239, 230, .28));
      background: transparent;
      color: var(--text, inherit);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: var(--code-size, 1.25rem);
      font-weight: 700;
      text-align: center;
    }
    input::placeholder { color: var(--muted); opacity: .6; }
    input:focus-visible { outline: 2px solid var(--amber); }
    input:disabled { opacity: .5; cursor: not-allowed; }
    .underline {
      position: absolute;
      left: 0;
      bottom: 0;
      height: 2px;
      background: var(--display-ink, #f4efe6);
      pointer-events: none;
      transition: transform .2s var(--ease-spring, ease), width .2s var(--ease-spring, ease);
    }
    @media (prefers-reduced-motion: reduce) {
      .underline { transition: none; }
    }
  `,
  template: `
    @if (label()) {
      <span class="label">{{ label() }}</span>
    }
    <div class="cells" role="group" [attr.aria-label]="label() || null" (focusin)="onFocusIn($event)">
      @for (i of slots(); track i) {
        <input
          #cell
          [type]="mask() ? 'password' : 'text'"
          inputmode="numeric"
          maxlength="1"
          [attr.autocomplete]="i === 0 ? 'one-time-code' : null"
          [disabled]="disabled()"
          [placeholder]="placeholder()"
          [attr.aria-label]="cellLabel() ? cellLabel() + ' ' + (i + 1) : null"
          [value]="digit(i)"
          (input)="onInput(i, $event)"
          (keydown)="onKeydown(i, $event)"
          (paste)="onPaste(i, $event)"
        />
      }
      <span #underline class="underline"></span>
    </div>
  `,
})
export class KometaCode {
  readonly value = model('');
  readonly length = input(6);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly label = input('');
  /** Shown in each empty cell, e.g. `·`. */
  readonly placeholder = input('');
  /** Hides the digits (a PIN). */
  readonly mask = input(false, { transform: booleanAttribute });
  /** Names each cell "<cellLabel> 1", "<cellLabel> 2"…; the caller owns the language. */
  readonly cellLabel = input('Digit');

  private readonly cells = viewChildren<ElementRef<HTMLInputElement>>('cell');
  private readonly underline = viewChild<ElementRef<HTMLElement>>('underline');

  protected readonly slots = computed(() =>
    Array.from({ length: this.length() }, (_, index) => index),
  );

  protected digit(index: number): string {
    return this.digits()[index] ?? '';
  }

  protected onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1);
    input.value = digit;
    const next = this.digits();
    next[index] = digit;
    this.value.set(next.join(''));
    if (digit && index + 1 < next.length) this.focusAt(index + 1);
  }

  protected onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key !== 'Backspace' || this.digits()[index] !== '' || index === 0) return;
    event.preventDefault();
    const next = this.digits();
    next[index - 1] = '';
    this.value.set(next.join(''));
    this.focusAt(index - 1);
  }

  protected onPaste(index: number, event: ClipboardEvent): void {
    const data = event.clipboardData;
    if (!data) return;
    const text = data.getData('text/plain') || data.getData('text');
    event.preventDefault();
    const pasted = text.replace(/\D/g, '');
    if (!pasted) return;
    const next = this.digits();
    const count = Math.min(pasted.length, next.length - index);
    for (let i = 0; i < count; i++) next[index + i] = pasted[i];
    this.value.set(next.join(''));
    this.focusAt(Math.min(index + count, next.length - 1));
  }

  protected onFocusIn(event: FocusEvent): void {
    const target = event.target;
    const line = this.underline()?.nativeElement;
    if (!(target instanceof HTMLInputElement) || !line) return;
    line.style.transform = `translateX(${target.offsetLeft}px)`;
    line.style.width = `${target.offsetWidth}px`;
  }

  private digits(): string[] {
    const raw = this.value();
    return Array.from({ length: this.length() }, (_, index) => {
      const ch = raw[index] ?? '';
      return ch >= '0' && ch <= '9' ? ch : '';
    });
  }

  private focusAt(index: number): void {
    this.cells()[index]?.nativeElement.focus();
  }
}
