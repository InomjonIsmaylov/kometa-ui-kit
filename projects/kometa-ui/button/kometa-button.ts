import { ChangeDetectionStrategy, Component, ElementRef, ViewEncapsulation, booleanAttribute, inject, input, output } from '@angular/core';

/**
 * The one button, put on a native element: `<button k-button>Save</button>`, or `<a k-button href="/book">Book</a>` for a
 * link that looks like one. The element stays the browser's own, so `type`, `disabled`, `aria-*`, `class`, `(click)`,
 * `form` and focus need no inputs. A `<button k-button>` with no `type` is `type="button"`, so it never submits a form
 * by accident; write `type="submit"` for the one that should.
 * Looks: the default is the amber main action; `severity` `secondary` is the quiet grey pill, `danger` the red one;
 * `outlined` draws it as a hairline, `text` as an underline-free word; `size="small"` is the compact one; `fluid` fills
 * the row. `loading` shows a spinner, sets `aria-busy` and swallows the click (and a link's navigation) but keeps the
 * focus where it is, so a keyboard user is not dropped mid-request. `icon` is a decorative glyph beside the content.
 * The look is written with `:where()` on `.kbtn`, so an app stylesheet's `.kbtn` floor (the 48px thumb height) wins without a fight.
 * Spec: kometa-button.spec.ts.
 */
@Component({
  selector: 'button[k-button], a[k-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'kbtn',
    '[class.secondary]': "severity() === 'secondary'",
    '[class.danger]': "severity() === 'danger'",
    '[class.outlined]': 'outlined()',
    '[class.text]': 'text()',
    '[class.sm]': "size() === 'small'",
    '[class.kbtn-fluid]': 'fluid()',
    '[attr.aria-busy]': "loading() ? 'true' : null",
    '[attr.aria-disabled]': "loading() ? 'true' : null",
  },
  styles: `
    :where(.kbtn) {
      display: inline-flex; align-items: center; justify-content: center; gap: var(--kbtn-gap, 8px); box-sizing: border-box; min-height: 48px; margin: 0; padding: 6px 20px; white-space: nowrap;
      border: 1px solid var(--amber); border-radius: var(--kbtn-radius, var(--r-pill, 9999px)); background: var(--amber); color: var(--on-amber, #121414);
      font: inherit; font-size: 14px; font-weight: 500; line-height: 21px; text-decoration: none; cursor: pointer;
      transition: background .2s, color .2s, border-color .2s, box-shadow .2s;
    }
    :where(.kbtn.kbtn-fluid, .kbtn-fluid .kbtn) { display: flex; width: 100%; }
    :where(.kbtn:hover:not(:disabled, [aria-disabled=true])) { background: color-mix(in srgb, var(--amber) 88%, black); border-color: color-mix(in srgb, var(--amber) 88%, black); }
    :where(.kbtn:active:not(:disabled, [aria-disabled=true])) { background: color-mix(in srgb, var(--amber) 78%, black); border-color: color-mix(in srgb, var(--amber) 78%, black); }
    :where(.kbtn:focus-visible) { outline: 2px solid var(--amber-ink, var(--amber)); outline-offset: 2px; }
    :where(.kbtn:disabled) { opacity: .5; cursor: default; }
    :where(.kbtn[aria-busy=true]) { cursor: progress; }
    :where(.kbtn.secondary) { background: var(--border); border-color: var(--border); color: var(--text2); }
    :where(.kbtn.secondary:hover:not(:disabled, [aria-disabled=true]), .kbtn.secondary:active:not(:disabled, [aria-disabled=true])) { background: var(--border); border-color: var(--border); color: var(--text); }
    :where(.kbtn.danger) { background: var(--red); border-color: var(--red); color: var(--on-red, #fff); }
    :where(.kbtn.danger:hover:not(:disabled, [aria-disabled=true]), .kbtn.danger:active:not(:disabled, [aria-disabled=true])) { background: var(--red); border-color: var(--red); }
    :where(.kbtn.outlined) { background: transparent; border-color: var(--amber); color: var(--amber-ink, var(--amber)); }
    :where(.kbtn.outlined:hover:not(:disabled, [aria-disabled=true])) { background: transparent; }
    :where(.kbtn.outlined.secondary) { border-color: var(--border); color: var(--text2); }
    :where(.kbtn.outlined.secondary:active:not(:disabled, [aria-disabled=true])) { background: var(--border); }
    :where(.kbtn.outlined.danger) { border-color: var(--red); color: var(--red); }
    :where(.kbtn.text) { background: transparent; border-color: transparent; color: var(--amber-ink, var(--amber)); }
    :where(.kbtn.text:hover:not(:disabled, [aria-disabled=true]), .kbtn.text:active:not(:disabled, [aria-disabled=true])) { background: transparent; border-color: transparent; }
    :where(.kbtn.text.secondary) { color: var(--text2); }
    :where(.kbtn.sm) { min-height: 36px; padding: 4px 14px; font-size: 13px; }
    :where(.kbtn .kbtn-spin) { flex: none; width: 14px; height: 14px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: kbtn-spin .7s linear infinite; }
    @keyframes kbtn-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { :where(.kbtn .kbtn-spin) { animation-duration: 2s; } }
  `,
  template: `
    @if (loading()) { <span class="kbtn-spin" aria-hidden="true"></span> }
    @if (icon() && iconPos() === 'left') { <span class="kbtn-icon" aria-hidden="true">{{ icon() }}</span> }
    <span class="kbtn-label"><ng-content /></span>
    @if (icon() && iconPos() === 'right') { <span class="kbtn-icon" aria-hidden="true">{{ icon() }}</span> }
  `,
})
export class KometaButton {
  readonly severity = input<'secondary' | 'danger' | null>(null);
  readonly size = input<'small' | null>(null);
  readonly outlined = input(false, { transform: booleanAttribute });
  readonly text = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  /** Spinner and `aria-busy`; the click is swallowed but the element stays focusable. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** A decorative glyph or emoji beside the content; an icon-only button still needs an `aria-label`. */
  readonly icon = input('');
  readonly iconPos = input<'left' | 'right'>('left');

  constructor() {
    const el = inject<ElementRef<HTMLButtonElement | HTMLAnchorElement>>(ElementRef).nativeElement;
    // Static attributes are already on the element here; a bound [type] is applied later and still wins.
    if (el instanceof HTMLButtonElement && !el.hasAttribute('type')) el.type = 'button';
    // Registered before any (click) in the caller's template, so the caller's handler never sees a click while loading.
    el.addEventListener('click', (e) => {
      if (!this.loading()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    });
  }
}

/**
 * Deprecated: use `<button k-button>` (`KometaButton`). The old wrapper element, kept for one minor release: it draws a
 * `<button k-button>` inside itself and passes `label`, `type`, `disabled`, `ariaLabel`, `styleClass` and `(clicked)` on.
 * Unlike before, `loading` no longer disables the inner button (it keeps focus and swallows the click instead).
 * @deprecated Use `<button k-button>` (`KometaButton`).
 */
@Component({
  selector: 'k-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [KometaButton],
  host: { '[class.kbtn-fluid]': 'fluid()' },
  styles: `k-button { display: block; } k-button.kbtn-fluid { width: 100%; }`,
  template: `
    <button k-button [type]="type()" [severity]="severity()" [size]="size()" [outlined]="outlined()" [text]="text()" [loading]="loading()"
            [icon]="icon()" [iconPos]="iconPos()" [class]="styleClass()" [disabled]="disabled()" [attr.aria-label]="ariaLabel() || null"
            (click)="clicked.emit($event)"><ng-content>{{ label() }}</ng-content></button>
  `,
})
export class KometaButtonElement {
  readonly label = input('');
  readonly type = input<'button' | 'submit'>('button');
  readonly severity = input<'secondary' | 'danger' | null>(null);
  readonly size = input<'small' | null>(null);
  readonly outlined = input(false, { transform: booleanAttribute });
  readonly text = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('');
  readonly styleClass = input('');
  readonly icon = input('');
  readonly iconPos = input<'left' | 'right'>('left');
  readonly clicked = output<MouseEvent>();
}
