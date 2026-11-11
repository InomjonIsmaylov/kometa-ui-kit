import { ChangeDetectionStrategy, Component, ViewEncapsulation, booleanAttribute, input, output } from '@angular/core';

/**
 * The one button. A real `<button class="kbtn">` inside the
 * host, so type, disabled and click stay the browser's own. Looks: the default is the amber main action; `severity`
 * `secondary` is the quiet grey pill, `danger` the red one; `outlined` draws it as a hairline, `text` as an underline-free word;
 * `size="small"` is the compact one; `fluid` fills the row; `loading` shows a spinner and blocks the tap. `styleClass` lands on the
 * inner button, `(clicked)` carries the click.
 * The look is written with `:where()`, so an app stylesheet's `.kbtn` floor (the 48px thumb height) wins without a fight.
 * Spec: kometa-button.spec.ts.
 */
@Component({
  selector: 'k-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class.kbtn-fluid]': 'fluid()' },
  styles: `
    k-button { display: block; }
    k-button.kbtn-fluid { width: 100%; }
    :where(.kbtn) {
      display: inline-flex; align-items: center; justify-content: center; gap: var(--kbtn-gap, 8px); box-sizing: border-box; min-height: 48px; padding: 6px 20px; white-space: nowrap;
      border: 1px solid var(--amber); border-radius: var(--kbtn-radius, var(--r-pill, 9999px)); background: var(--amber); color: var(--on-amber, #121414);
      font: inherit; font-size: 14px; font-weight: 500; line-height: 21px; cursor: pointer;
      transition: background .2s, color .2s, border-color .2s, box-shadow .2s;
    }
    :where(.kbtn-fluid .kbtn) { width: 100%; }
    :where(.kbtn:hover:not(:disabled)) { background: color-mix(in srgb, var(--amber) 88%, black); border-color: color-mix(in srgb, var(--amber) 88%, black); }
    :where(.kbtn:active:not(:disabled)) { background: color-mix(in srgb, var(--amber) 78%, black); border-color: color-mix(in srgb, var(--amber) 78%, black); }
    :where(.kbtn:focus-visible) { outline: 2px solid var(--amber-ink, var(--amber)); outline-offset: 2px; }
    :where(.kbtn:disabled) { opacity: .5; cursor: default; }
    :where(.kbtn.secondary) { background: var(--border); border-color: var(--border); color: var(--text2); }
    :where(.kbtn.secondary:hover:not(:disabled), .kbtn.secondary:active:not(:disabled)) { background: var(--border); border-color: var(--border); color: var(--text); }
    :where(.kbtn.danger) { background: var(--red); border-color: var(--red); color: var(--on-red, #fff); }
    :where(.kbtn.danger:hover:not(:disabled), .kbtn.danger:active:not(:disabled)) { background: var(--red); border-color: var(--red); }
    :where(.kbtn.outlined) { background: transparent; border-color: var(--amber); color: var(--amber-ink, var(--amber)); }
    :where(.kbtn.outlined:hover:not(:disabled)) { background: transparent; }
    :where(.kbtn.outlined.secondary) { border-color: var(--border); color: var(--text2); }
    :where(.kbtn.outlined.secondary:active:not(:disabled)) { background: var(--border); }
    :where(.kbtn.outlined.danger) { border-color: var(--red); color: var(--red); }
    :where(.kbtn.text) { background: transparent; border-color: transparent; color: var(--amber-ink, var(--amber)); }
    :where(.kbtn.text:hover:not(:disabled), .kbtn.text:active:not(:disabled)) { background: transparent; border-color: transparent; }
    :where(.kbtn.text.secondary) { color: var(--text2); }
    :where(.kbtn.sm) { min-height: 36px; padding: 4px 14px; font-size: 13px; }
    :where(.kbtn .kbtn-spin) { flex: none; width: 14px; height: 14px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: kbtn-spin .7s linear infinite; }
    @keyframes kbtn-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { :where(.kbtn .kbtn-spin) { animation-duration: 2s; } }
  `,
  template: `
    <button [type]="type()" class="kbtn" [class.secondary]="severity() === 'secondary'" [class.danger]="severity() === 'danger'"
            [class.outlined]="outlined()" [class.text]="text()" [class.sm]="size() === 'small'" [class]="styleClass()"
            [disabled]="disabled() || loading()" [attr.aria-label]="ariaLabel() || null" [attr.aria-busy]="loading() ? 'true' : null"
            (click)="clicked.emit($event)">
      @if (loading()) { <span class="kbtn-spin" aria-hidden="true"></span> }
      @if (icon() && iconPos() === 'left') { <span class="kbtn-icon" aria-hidden="true">{{ icon() }}</span> }
      <span class="kbtn-label"><ng-content>{{ label() }}</ng-content></span>
      @if (icon() && iconPos() === 'right') { <span class="kbtn-icon" aria-hidden="true">{{ icon() }}</span> }
    </button>
  `,
})
export class KometaButton {
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
  /** A decorative glyph or emoji beside the label; name the button with `label` or `ariaLabel`. */
  readonly icon = input('');
  readonly iconPos = input<'left' | 'right'>('left');
  readonly clicked = output<MouseEvent>();
}
