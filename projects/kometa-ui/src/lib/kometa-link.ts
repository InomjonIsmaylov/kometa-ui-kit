import { ChangeDetectionStrategy, Component, ElementRef, inject, booleanAttribute, input, signal } from '@angular/core';

/** A cream band, a third of the animated size wide, swept left to right over the copied value. */
const BAND = 'linear-gradient(90deg, transparent 0 33.4%, color-mix(in srgb, var(--display-ink) 32%, transparent) 33.4% 66.6%, transparent 66.6%)';

/**
 * Copies `text` and reads `copiedLabel` for 900ms. A refused clipboard leaves `copyLabel`.
 * "Flash" (round 10): a cream band also sweeps over the element just before the link, which is
 * where every site shows the value it copies. Skipped for reduced motion and where the value has
 * no element to strike; the label swap alone still answers.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 *
 *
 */
@Component({
  selector: 'k-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: inline-flex; }
    button {
      background: none;
      border: 0;
      padding: 0;
      color: var(--link-color, inherit);
      font: inherit;
      cursor: pointer;
    }
    button:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; border-radius: 4px; }
    button:disabled { opacity: .5; cursor: not-allowed; }
    @media (pointer: coarse) { button { min-height: 44px; } }
  `,
  template: `
    <button type="button" [attr.aria-label]="ariaLabel() || null" [disabled]="disabled()" (click)="copy()">{{ copied() ? copiedLabel() : copyLabel() }}</button>
  `,
})
export class KometaLink {
  readonly text = input.required<string>();
  readonly copyLabel = input.required<string>();
  readonly copiedLabel = input.required<string>();
  /** Names what is copied when the visible word alone is ambiguous (one per table row). */
  readonly ariaLabel = input('');
  /** False where the element before the link is not the copied value (admin's poster button). */
  readonly flashValue = input(true, { transform: booleanAttribute });
  /** How long `copiedLabel` shows, in ms. */
  readonly copiedMs = input(900);
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly copied = signal(false);
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  protected copy(): void {
    const text = this.text();
    let pending: Promise<void>;
    try {
      pending = navigator.clipboard.writeText(text);
    } catch {
      this.copied.set(false);
      return;
    }
    void pending.then(
      () => {
        this.copied.set(true);
        this.flash();
        clearTimeout(this.resetTimer);
        this.resetTimer = setTimeout(() => this.copied.set(false), this.copiedMs());
      },
      () => this.copied.set(false),
    );
  }

  private flash(): void {
    const value = this.flashValue() ? this.host.previousElementSibling : null;
    if (!value?.animate || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    value.animate(
      [
        { backgroundImage: BAND, backgroundRepeat: 'no-repeat', backgroundSize: '300% 100%', backgroundPosition: '100% 0' },
        { backgroundImage: BAND, backgroundRepeat: 'no-repeat', backgroundSize: '300% 100%', backgroundPosition: '0% 0' },
      ],
      { duration: 700, easing: 'cubic-bezier(.3,.7,.2,1)' },
    );
  }
}
