import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * An icon-only button with no drawn box: 44px, muted glyph, and a disc of light that appears on hover and focus.
 * `<button k-halo aria-label="Close">✕</button>`; the caller always supplies the `aria-label`, because the glyph
 * is the only content. One shape for the close, previous/next and more buttons that were each their own size.
 * Spec: kometa-halo.spec.ts. Lab: docs/superpowers/labs/2026-10-14-blend-ui-lab-round-11.html (E).
 *
 *
 */
@Component({
  selector: 'button[k-halo]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-grid; place-items: center; width: var(--halo-size, 44px); height: var(--halo-size, 44px); margin: 0; padding: 0; border: 0; border-radius: 50%;
      background: none; color: var(--halo-color, var(--muted)); font: inherit; font-size: var(--halo-font-size, 18px); line-height: 1; cursor: pointer;
      transition: background 200ms ease, color 200ms ease;
    }
    :host(:hover:not(:disabled)), :host(:focus-visible) { background: var(--halo-hover-bg, rgba(128, 128, 128, .18)); color: var(--halo-hover-color, var(--display-ink, var(--text))); }
    :host([data-size='sm']) { --halo-size: 32px; font-size: 15px; }
    :host([data-size='lg']) { --halo-size: 56px; font-size: 22px; }
    :host(:active:not(:disabled)) { background: rgba(128, 128, 128, .28); }
    :host(:focus-visible) { outline: 2px solid var(--amber-ink, var(--amber)); outline-offset: 0; }
    :host(:disabled) { opacity: .4; cursor: not-allowed; }
    @media (prefers-reduced-motion: reduce) { :host { transition: none; } }
  `,
  host: { '[attr.data-size]': 'size()' },
  template: `<ng-content />`,
})
export class KometaHalo {
  /** `sm` is 32px, `lg` 56px; `--halo-size` sets any other. */
  readonly size = input<'md' | 'sm' | 'lg'>('md');
}
