import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Loading state: the label stays, and a short line travels under it.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 */
@Component({
  selector: 'k-wait',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status' },
  styles: `
    :host {
      display: inline-flex;
      flex-direction: column;
      align-items: stretch;
      gap: 6px;
      color: var(--wait-ink, var(--muted));
      font-size: var(--wait-font-size, 13px);
    }
    .label { margin: 0; }
    .track {
      position: relative;
      height: var(--wait-line-height, 2px);
      overflow: hidden;
    }
    .line {
      position: absolute;
      top: 0;
      left: 0;
      height: var(--wait-line-height, 2px);
      width: 28%;
      background: var(--wait-line, var(--display-ink, #f4efe6));
      animation: k-wait var(--wait-duration, 1.2s) ease-in-out infinite;
    }
    @keyframes k-wait {
      from { transform: translateX(0); }
      to { transform: translateX(257%); }
    }
    @media (prefers-reduced-motion: reduce) {
      .line { animation: none; }
    }
    :host(:focus-visible) { outline: 2px solid var(--amber); }
  `,
  template: `
    <p class="label">{{ label() }}</p>
    <span class="track" aria-hidden="true"><span class="line"></span></span>
  `,
})
export class KometaWait {
  readonly label = input.required<string>();
}
