import { ChangeDetectionStrategy, Component, booleanAttribute, input, model } from '@angular/core';

/**
 * A checkbox: a hairline ring that fills with ink while the tick draws itself in. A real
 * `<button role="checkbox" aria-checked>`, so Space and Enter toggle natively. It has no label of its own: name
 * it with `ariaLabel`, `ariaLabelledBy` or a `<label for>` and `inputId`. For a row whose words
 * are the control, with no ring, see `k-check`.
 * Spec: kometa-tick.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-9.html (Ring).
 *
 *
 */
@Component({
  selector: 'k-tick',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: inline-block; vertical-align: middle; }
    .box {
      position: relative; display: inline-grid; place-items: center; width: var(--tick-size, 36px); height: var(--tick-size, 36px); margin: 0; padding: 0;
      border: 0; background: none; color: var(--display-ink, var(--text)); cursor: pointer;
    }
    .box::before {
      content: ''; width: var(--tick-ring, 20px); height: var(--tick-ring, 20px); border: 1px solid var(--tick-line, var(--muted)); border-radius: var(--tick-radius, 50%);
      transition: background 240ms ease, border-color 240ms ease;
    }
    .box:hover:not(:disabled)::before { border-color: var(--display-ink, var(--text)); }
    .box[aria-checked='true']::before { background: var(--tick-fill, var(--display-ink, var(--text))); border-color: var(--tick-fill, var(--display-ink, var(--text))); }
    .box[aria-invalid='true']::before { border-color: var(--error, #ff6b5e); }
    .box:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; border-radius: 8px; }
    .box:disabled { opacity: .5; cursor: default; }
    .box[aria-readonly='true'] { cursor: default; }
    svg {
      position: absolute; width: 16px; height: 16px; fill: none; stroke: var(--tick-mark, var(--bg, #1a1408)); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
      stroke-dasharray: 16; stroke-dashoffset: 16; transition: stroke-dashoffset 320ms var(--ease-spring, ease) 60ms;
    }
    .box[aria-checked='true'] svg { stroke-dashoffset: 0; }
    @media (pointer: coarse) { .box { width: 44px; height: 44px; } }
    @media (prefers-reduced-motion: reduce) { .box::before, svg { transition: none; } }
  `,
  template: `
    <button class="box" type="button" role="checkbox" [id]="inputId() || null" [disabled]="disabled()" [attr.aria-readonly]="readonly() ? 'true' : null"
            [attr.aria-checked]="checked()" [attr.aria-label]="ariaLabel() || null" [attr.aria-labelledby]="ariaLabelledBy() || null"
            [attr.aria-invalid]="invalid() ? 'true' : null" (click)="toggle()">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
    </button>
  `,
})
export class KometaTick {
  readonly checked = model(false);
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly inputId = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Shows the state but ignores presses. */
  readonly readonly = input(false, { transform: booleanAttribute });

  protected toggle(): void {
    if (!this.readonly()) this.checked.update((c) => !c);
  }
}
