import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';

/**
 * The footer of a confirm that destroys something: an equal pair, a quiet "keep it" beside a red "delete". The red is
 * the primary because the action removes data, so no amber appears on that screen. The caller supplies both words
 * (`keep`, `confirm`) in its language; the pair emits `kept` and `confirmed` and never decides anything. `busy` spins
 * the red button and locks both while the request runs. Use it in a dialog, tray or sheet footer; a non-destructive
 * save and cancel keeps the filled amber button.
 * Spec: kometa-pair.spec.ts. Lab: docs/superpowers/labs/2026-10-14-blend-ui-lab-round-11.html (B).
 *
 *
 */
@Component({
  selector: 'kometa-pair',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; gap: 10px; width: 100%; }
    button {
      position: relative; flex: 1; min-height: var(--pair-height, 48px); margin: 0; padding: 0 20px; border: 1px solid transparent; border-radius: var(--r-pill, 9999px);
      font: inherit; font-weight: 500; cursor: pointer; transition: transform 200ms var(--ease-spring, ease), background 200ms ease, filter 200ms ease;
    }
    .keep { border-color: var(--glass-line, rgba(128, 128, 128, .35)); background: none; color: var(--display-ink, var(--text)); }
    .keep:hover:not(:disabled) { background: rgba(128, 128, 128, .12); }
    .go { background: var(--pair-go-bg, var(--red)); color: var(--pair-go-color, #fff); font-weight: 600; }
    :host([data-tone='primary']) .go { background: var(--pair-go-bg, var(--amber)); color: var(--pair-go-color, var(--on-amber, #1a1408)); }
    .go:hover:not(:disabled) { filter: brightness(1.08); }
    button:active:not(:disabled) { transform: scale(.98); }
    button:focus-visible { outline: 2px solid var(--amber-ink, var(--amber)); outline-offset: 2px; }
    button:disabled { opacity: .45; cursor: not-allowed; }
    .go.busy { color: transparent; pointer-events: none; }
    .go.busy::after {
      content: ''; position: absolute; left: 50%; top: 50%; width: 17px; height: 17px; margin: -9px 0 0 -9px;
      border: 2px solid #fff; border-color: #fff transparent #fff transparent; border-radius: 50%; animation: kometa-pair-spin 700ms linear infinite;
    }
    @keyframes kometa-pair-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { button { transition: none; } .go.busy::after { animation: none; } }
  `,
  host: { '[attr.data-tone]': 'tone()' },
  template: `
    <button type="button" class="keep" [disabled]="busy() || disabled()" (click)="kept.emit()">{{ keep() }}</button>
    <button type="button" class="go" [class.busy]="busy()" [attr.aria-busy]="busy() ? 'true' : null" [disabled]="disabled()"
            (click)="confirmed.emit()">{{ confirm() }}</button>
  `,
})
export class KometaPair {
  /** The quiet side: "Keep it", "Cancel", in the caller's language. */
  readonly keep = input.required<string>();
  /** The red side: "Delete", "Remove". */
  readonly confirm = input.required<string>();
  readonly busy = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** `primary` draws the confirm side in amber, for a pair that does not destroy anything. */
  readonly tone = input<'danger' | 'primary'>('danger');
  readonly kept = output<void>();
  readonly confirmed = output<void>();
}
