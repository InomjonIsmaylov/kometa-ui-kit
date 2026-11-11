import { booleanAttribute, ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/**
 * A checkbox with no box: a row whose done state draws a 1px line through the label (it grows in from
 * the left over 420ms and the label turns muted). A real `<button role="checkbox" aria-checked>`, so
 * Space and Enter toggle natively. The label is the projected content and may wrap: the line is a
 * background on the inline text, so it runs through every wrapped line. `checked` and `disabled`
 * follow the Signal Forms checkbox contract. A group of them is just several siblings.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md; tests in kometa-check.spec.ts.
 *
 *
 */
@Component({
  selector: 'k-check',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    button {
      display: flex;
      align-items: center;
      width: 100%;
      min-height: 28px;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--display-ink, #f4efe6);
      font: inherit;
      font-size: var(--check-size, 15px);
      text-align: start;
      cursor: pointer;
    }
    button:disabled { cursor: default; opacity: 0.5; }
    button:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    @media (pointer: coarse) { button { min-height: 44px; } }
    .label {
      min-width: 0;
      overflow-wrap: break-word;
      background-image: linear-gradient(var(--check-line, var(--display-ink, #f4efe6)), var(--check-line, var(--display-ink, #f4efe6)));
      background-repeat: no-repeat;
      background-position: 0 55%;
      background-size: 0 1px;
      -webkit-box-decoration-break: slice;
      box-decoration-break: slice;
      transition:
        color 420ms,
        background-size 420ms var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1));
    }
    button[aria-checked='true'] .label { color: var(--muted); background-size: 100% 1px; }
    @media (prefers-reduced-motion: reduce) {
      .label { transition: none; }
    }
  `,
  template: `
    <button type="button" role="checkbox" [attr.aria-checked]="checked() ? 'true' : 'false'" [disabled]="disabled()" [attr.aria-label]="ariaLabel() || null" [attr.aria-readonly]="readonly() ? 'true' : null"
            (click)="readonly() || checked.set(!checked())"><span class="label"><ng-content /></span></button>
  `,
})
export class KometaCheck {
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Shows the state but ignores presses. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Overrides the projected label as the accessible name. */
  readonly ariaLabel = input('');
}
