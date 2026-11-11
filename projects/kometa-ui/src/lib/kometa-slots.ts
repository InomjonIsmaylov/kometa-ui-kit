import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface KometaSlot {
  value: string;
  label: string;
  note?: string;
  disabled?: boolean;
}

/**
 * Free times as glass chips; the chosen one gets an amber edge, never an amber fill.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md, "Time: slots".
 */
@Component({
  selector: 'kometa-slots',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-label]': 'ariaLabel() || null',
  },
  styles: `
    :host { display: flex; flex-wrap: wrap; gap: 8px; }
    button {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 72px;
      margin: 0;
      padding: 10px 12px;
      border: 1px solid var(--glass-line, rgba(244, 239, 230, .14));
      border-radius: 14px;
      background: var(--glass, rgba(28, 26, 22, .82));
      color: var(--text, inherit);
      font: inherit;
      text-align: left;
      cursor: pointer;
      transition: box-shadow .2s ease;
    }
    button small { color: var(--muted); font-size: 12px; }
    button.edge {
      box-shadow: inset 2px 0 0 var(--amber), inset 0 1px 0 rgba(255, 255, 255, .1);
    }
    button:disabled { opacity: .5; cursor: not-allowed; }
    button:focus-visible { outline: 2px solid var(--amber); }
    @media (prefers-reduced-motion: reduce) {
      button { transition: none; }
    }
  `,
  template: `
    @for (slot of slots(); track slot.value) {
      <button type="button" [class.edge]="value() === slot.value"
              [attr.aria-pressed]="value() === slot.value ? 'true' : 'false'"
              [disabled]="slot.disabled" (click)="choose(slot.value)">
        {{ slot.label }}
        @if (slot.note) { <small>{{ slot.note }}</small> }
      </button>
    }
  `,
})
export class KometaSlots {
  readonly slots = input.required<readonly KometaSlot[]>();
  readonly value = model('');
  readonly ariaLabel = input('');
  /** A second tap on the chosen chip clears it (`value` becomes ''), for a grid that holds a time before it commits. */
  readonly clearable = input(false);

  protected choose(next: string): void {
    this.value.set(this.clearable() && this.value() === next ? '' : next);
  }
}
