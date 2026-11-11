import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * A destructive action that lives inline: a red underlined word. `<button kometa-erase>Delete service</button>`.
 * It is deliberately quiet; the loud red button belongs to the confirm step (`kometa-pair`), so the list itself
 * never shouts. Not for the one thing a screen is for, and not for a row's everyday action.
 * Spec: kometa-erase.spec.ts. Lab: docs/superpowers/labs/2026-10-14-blend-ui-lab-round-11.html (D).
 *
 *
 */
@Component({
  selector: 'button[kometa-erase]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex; align-items: center; min-height: 36px; margin: 0; padding: 0 4px; border: 0; border-radius: 6px; background: none;
      color: var(--erase-color, var(--red)); font: inherit; font-size: 14px; cursor: pointer;
      text-decoration: underline; text-underline-offset: 4px; text-decoration-color: rgba(255, 107, 94, .4);
      transition: text-decoration-color 200ms ease;
    }
    :host(:hover:not(:disabled)) { text-decoration-color: currentColor; }
    :host(:focus-visible) { outline: 2px solid var(--amber-ink, var(--amber)); outline-offset: 2px; }
    :host(:disabled) { opacity: .4; cursor: not-allowed; }
    @media (pointer: coarse) { :host { min-height: 44px; } }
    @media (prefers-reduced-motion: reduce) { :host { transition: none; } }
  `,
  template: `<ng-content />`,
})
export class KometaErase {}
