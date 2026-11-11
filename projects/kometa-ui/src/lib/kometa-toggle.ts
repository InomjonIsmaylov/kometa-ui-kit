import { ChangeDetectionStrategy, Component, booleanAttribute, input, model } from '@angular/core';

/**
 * An on/off switch whose state is a word in Syne: the on word goes cream and a 1px cream line draws
 * under it. The caller supplies both words. A Signal Forms boolean control (`checked` model plus
 * `disabled` input), so `[formField]` binds it like a checkbox.
 * Spec: kometa-toggle.spec.ts.
 *
 *
 */
@Component({
  selector: 'k-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: inline-flex; }
    button {
      position: relative;
      margin: 0;
      padding: 0 0 4px;
      border: 0;
      background: transparent;
      color: var(--toggle-ink-off, var(--muted));
      font-family: var(--font-display, 'Syne', sans-serif);
      font-weight: 700;
      font-size: var(--toggle-font-size, 15px);
      cursor: pointer;
      transition: color 420ms;
    }
    button[aria-checked='true'] { color: var(--toggle-ink-on, var(--display-ink, #f4efe6)); }
    button::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 1px;
      background: var(--display-ink, #f4efe6);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 420ms var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1));
    }
    button[aria-checked='true']::after { transform: scaleX(1); }
    button:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    /* No words: draw a track and knob so the switch is still there. */
    button.bare { width: 36px; height: 20px; padding: 0; border-radius: 10px; background: var(--border2, var(--muted)); transition: background 220ms; }
    button.bare::before { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--bg, #fff); transition: transform 220ms; }
    button.bare::after { display: none; }
    button.bare[aria-checked='true'] { background: var(--display-ink, #f4efe6); }
    button.bare[aria-checked='true']::before { transform: translateX(16px); }
    button:disabled { cursor: default; opacity: .5; }
    @media (pointer: coarse) { button { min-height: 44px; min-width: 44px; } }
    @media (prefers-reduced-motion: reduce) { button, button::after { transition: none; } }
  `,
  template: `
    <button type="button" role="switch" [class.bare]="!onLabel() && !offLabel()" [attr.aria-checked]="checked() ? 'true' : 'false'"
            [attr.aria-label]="ariaLabel() || null" [attr.aria-labelledby]="ariaLabelledBy() || null" [attr.aria-describedby]="ariaDescribedBy() || null" [disabled]="disabled()" (click)="checked.set(!checked())">
      {{ checked() ? onLabel() : offLabel() }}
    </button>
  `,
})
export class KometaToggle {
  readonly checked = model(false);
  readonly onLabel = input('');
  readonly offLabel = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Names the switch for a screen reader; the visible word is only its state. */
  readonly ariaLabel = input('');
  /** The id of the element that explains the switch. */
  readonly ariaDescribedBy = input('');
  /** The id of the element that names the switch. */
  readonly ariaLabelledBy = input('');
}
