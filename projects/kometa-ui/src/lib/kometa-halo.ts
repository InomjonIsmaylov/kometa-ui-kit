import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * An icon-only button with no drawn box: 44px, muted glyph, and a disc of light that appears on hover and focus.
 * `<button kometa-halo aria-label="Close">✕</button>`; the caller always supplies the `aria-label`, because the glyph
 * is the only content. One shape for the close, previous/next and more buttons that were each their own size.
 * Spec: kometa-halo.spec.ts. Lab: docs/superpowers/labs/2026-10-14-blend-ui-lab-round-11.html (E).
 *
 *
 */
@Component({
  selector: 'button[kometa-halo]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-grid; place-items: center; width: 44px; height: 44px; margin: 0; padding: 0; border: 0; border-radius: 50%;
      background: none; color: var(--muted); font: inherit; font-size: 18px; line-height: 1; cursor: pointer;
      transition: background 200ms ease, color 200ms ease;
    }
    :host(:hover:not(:disabled)), :host(:focus-visible) { background: rgba(128, 128, 128, .18); color: var(--display-ink, var(--text)); }
    :host(:active:not(:disabled)) { background: rgba(128, 128, 128, .28); }
    :host(:focus-visible) { outline: 2px solid var(--amber-ink, var(--amber)); outline-offset: 0; }
    :host(:disabled) { opacity: .4; cursor: not-allowed; }
    @media (prefers-reduced-motion: reduce) { :host { transition: none; } }
  `,
  template: `<ng-content />`,
})
export class KometaHalo {}
