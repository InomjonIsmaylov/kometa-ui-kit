import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * An action that is only a word and an arrow, for the end of a row: `<button kometa-word>Nudge</button>`. No box,
 * so a column of them stays calm; the arrow leans on hover. Amber ink by default, `quiet` for a secondary word
 * beside it (muted until hovered). `lead` is the page's one call to action (the old `kometa-line`): ink, a hairline under
 * it and the arrow pushed to the end; `busy` swaps the rule for a marching one and the button ignores clicks until it
 * clears. Never a destructive one (that is `kometa-erase`). 44px tall on a touch screen, whatever it draws.
 * Spec: kometa-word.spec.ts. Lab: docs/superpowers/labs/2026-10-14-blend-ui-lab-round-11.html (C).
 *
 *
 */
@Component({
  selector: 'button[kometa-word]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.quiet]': 'quiet()', '[class.lead]': 'lead()', '[class.busy]': 'busy()', '[attr.aria-busy]': "busy() ? 'true' : null" },
  styles: `
    :host {
      display: inline-flex; align-items: center; gap: 6px; min-height: 34px; margin: 0; padding: 0 2px; border: 0; border-radius: 6px;
      background: none; color: var(--amber-ink, var(--amber)); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
      white-space: nowrap; transition: color 200ms ease, text-decoration-color 200ms ease;
      text-decoration: underline; text-underline-offset: 4px; text-decoration-color: var(--border2);
    }
    :host(.quiet) { color: var(--muted); font-weight: 500; }
    :host(.quiet:hover:not(:disabled)) { color: var(--text); }
    :host(:hover:not(:disabled)) { text-decoration-color: currentColor; }
    :host::after { content: '\\2192'; transition: transform 300ms var(--ease-spring, ease); }
    :host(:hover:not(:disabled))::after, :host(:focus-visible)::after { transform: translateX(4px); }
    :host(:focus-visible) { outline: 2px solid var(--amber-ink, var(--amber)); outline-offset: 2px; }
    :host(:disabled) { opacity: .4; cursor: not-allowed; }
    :host(.lead) {
      justify-content: space-between; gap: 14px; min-height: 48px; border-radius: 0; text-decoration: none;
      border-bottom: 1px solid var(--border2); color: var(--display-ink, var(--text));
    }
    :host(.lead:hover:not(:disabled)) { border-bottom-color: currentColor; }
    :host(.busy) {
      pointer-events: none; border-bottom-color: transparent;
      background: repeating-linear-gradient(90deg, var(--amber) 0 8px, transparent 8px 14px) 0 100% / 28px 2px repeat-x;
      animation: kometa-word-march 700ms linear infinite;
    }
    :host(.busy)::after { opacity: .35; }
    @keyframes kometa-word-march { to { background-position: 28px 100%; } }
    @media (pointer: coarse) { :host { min-height: 44px; } }
    @media (prefers-reduced-motion: reduce) { :host, :host::after { transition: none; } :host(.busy) { animation: none; } }
  `,
  template: `<ng-content />`,
})
export class KometaWord {
  readonly quiet = input(false, { transform: booleanAttribute });
  readonly lead = input(false, { transform: booleanAttribute });
  readonly busy = input(false, { transform: booleanAttribute });
}
