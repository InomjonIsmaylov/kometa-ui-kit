import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, booleanAttribute, inject, input, model } from '@angular/core';

/**
 * The search, as the lab's "search: whisper" draws it: the question is the type. No box, no ring, no
 * fill, no magnifier. The placeholder is the question in Syne at 32% ink; under it a 1px hairline
 * that grows into a 2px cream line on focus. A quiet "×" appears only once there is text.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 *
 * It owns no handling of its own beyond `value`: the native `input`/`keydown`/`submit` events of the
 * inner input bubble to the host, so a page's `(keydown.enter)` or an enclosing `<form>` works as it
 * did on a bare `<input>`.
 *
 *
 */
@Component({
  selector: 'kometa-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-size]': 'size()' },
  styles: `
    :host { display: block; min-width: 0; }
    .whisper {
      position: relative;
      display: flex;
      align-items: center;
      min-height: 44px;
      color: var(--text);
    }
    input {
      flex: 1;
      min-width: 0;
      box-sizing: border-box;
      border: 0;
      border-radius: 0;
      outline: none;
      background: transparent;
      box-shadow: none;
      padding: 8px 0 10px;
      color: var(--display-ink, var(--text));
      font-family: var(--font-display, 'Syne'), sans-serif;
      font-weight: 700;
      font-size: var(--search-size, 22px);
      letter-spacing: -0.03em;
      line-height: 1.15;
      -webkit-appearance: none;
      appearance: none;
    }
    :host([data-size='lg']) input { font-size: var(--search-size-lg, 42px); line-height: 1; padding: 12px 0 14px; letter-spacing: -0.04em; }
    :host([data-size='lg']) .whisper { min-height: 64px; }
    input::placeholder { color: var(--text); opacity: var(--search-placeholder-opacity, 0.32); }
    input:disabled { opacity: .5; cursor: not-allowed; }
    input::-webkit-search-cancel-button,
    input::-webkit-search-decoration { -webkit-appearance: none; display: none; }
    .clear {
      flex: none;
      width: 44px;
      height: 44px;
      margin-inline: 0 -12px;
      display: grid;
      place-items: center;
      border: 0;
      background: transparent;
      color: var(--muted);
      font: 400 22px/1 var(--font-sans, sans-serif);
      cursor: pointer;
    }
    .clear:hover { color: var(--text); }
    .clear:focus-visible { outline: 2px solid var(--amber); outline-offset: -4px; border-radius: 8px; }
    .line {
      position: absolute;
      inset: auto 0 0;
      height: 1px;
      background: var(--glass-line, var(--border));
      pointer-events: none;
    }
    .line::after {
      content: '';
      position: absolute;
      inset: auto 0 0;
      height: 2px;
      border-radius: 2px;
      background: var(--display-ink, var(--text));
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 420ms var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1));
    }
    .whisper:focus-within .line::after { transform: scaleX(1); }
    @media (prefers-reduced-motion: reduce) { .line::after { transition: none; } }
    @media (forced-colors: active) { input:focus-visible { outline: 2px solid Highlight; } }
  `,
  template: `
    <div class="whisper">
      <input
        #field
        type="search"
        autocomplete="off"
        enterkeyhint="search"
        [attr.name]="name() || null"
        [attr.inputmode]="inputmode() || null"
        [attr.maxlength]="maxlength() || null"
        [disabled]="disabled()"
        [readOnly]="readonly()"
        [attr.aria-label]="ariaLabel()"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="value.set(field.value)"
      />
      @if (value() && clearable() && !disabled() && !readonly()) {
        <button
          type="button"
          class="clear"
          [attr.aria-label]="clearLabel() || null"
          [attr.aria-hidden]="clearLabel() ? null : 'true'"
          [attr.tabindex]="clearLabel() ? null : -1"
          (click)="clear(field)"
        >
          ×
        </button>
      }
      <span class="line" aria-hidden="true"></span>
    </div>
  `,
})
export class KometaSearch {
  readonly value = model('');
  readonly placeholder = input('');
  readonly ariaLabel = input.required<string>();
  /** The "×" button's accessible name; without one the button is hidden from assistive tech (Escape clears natively). */
  readonly clearLabel = input('');
  /** `md` is a page toolbar (22px); `lg` is the lab's 42px hero. */
  readonly size = input<'md' | 'lg'>('md');
  readonly name = input('');
  readonly inputmode = input('');
  readonly maxlength = input<number | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  /** The "×" button once there is text. */
  readonly clearable = input(true, { transform: booleanAttribute });
  /** The page that IS a search (`/search`) opens with the cursor in the question. */
  readonly autofocus = input(false, { transform: booleanAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // The `autofocus` attribute only counts when it is on the element as it enters the page; this one is bound, so focus it by hand.
    afterNextRender(() => { if (this.autofocus()) this.host.nativeElement.querySelector('input')?.focus(); });
  }

  protected clear(field: HTMLInputElement): void {
    this.value.set('');
    field.value = '';
    // A page that listens to the bubbling `input` event (a debounced search) hears the clear too.
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.focus();
  }
}
