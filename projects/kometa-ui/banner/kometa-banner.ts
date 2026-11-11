import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output, signal } from '@angular/core';
import { KometaWord } from 'kometa-ui/word';

export type KometaBannerTone = 'warn' | 'ok' | 'info' | 'error';

/**
 * A notice with no box: a 2px state-coloured hairline stands beside the sentence. With `dismissible`
 * a close word (`closeLabel`, supplied by the caller) collapses it (rows 1fr to 0fr, instant under
 * reduced motion) and emits `dismissed`. `ok` and `info` are `role="status"`, `warn` and `error`
 * `role="alert"`. `actionLabel` adds one word beside the sentence (`action` fires), replacing the old
 * inline-alert and load-error retry buttons. The sentence is projected: `<k-banner tone="warn">Internet yoq.</k-banner>`.
 * Spec: kometa-banner.spec.ts.
 */
@Component({
  selector: 'k-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KometaWord],
  host: {
    '[attr.role]': 'role()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-surface]': 'surface()',
    '[class.gone]': 'gone()',
  },
  styles: `
    :host {
      --c: var(--red);
      display: grid;
      grid-template-rows: 1fr;
      transition: grid-template-rows 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease;
    }
    :host([data-tone='ok']) { --c: var(--green); }
    :host([data-tone='info']) { --c: var(--blue); }
    :host([data-tone='error']) { --c: var(--error); }
    :host(.gone) { grid-template-rows: 0fr; opacity: 0; }
    /* glass: a slab for a busy surface; the tone moves from the hairline to an inset bar */
    :host([data-surface='glass']) .bn {
      margin-bottom: 0;
      padding: 10px 12px 10px 14px;
      border: 1px solid var(--glass-line);
      border-radius: var(--banner-radius, 12px);
      background: var(--glass);
      box-shadow: inset 3px 0 0 var(--c);
      -webkit-backdrop-filter: blur(12px) saturate(1.2);
      backdrop-filter: blur(12px) saturate(1.2);
    }
    @media (prefers-reduced-transparency: reduce) {
      :host([data-surface='glass']) .bn { -webkit-backdrop-filter: none; backdrop-filter: none; background: var(--card); }
    }
    .clip { min-height: 0; overflow: hidden; }
    .bn {
      display: flex;
      align-items: flex-start;
      gap: var(--banner-gap, 10px);
      margin-bottom: 10px;
      padding-left: 12px;
      border-left: 2px solid var(--c);
      color: var(--display-ink, var(--text));
      font-size: 14px;
      line-height: 1.4;
    }
    .icon { flex: none; color: var(--c); }
    .text { flex: 1; min-width: 0; overflow-wrap: anywhere; }
    .close {
      flex: none;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--display-ink, var(--text));
      font: inherit;
      font-size: 13px;
      box-shadow: inset 0 -1px 0 var(--glass-line);
      cursor: pointer;
    }
    .close:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    @media (pointer: coarse) { .close { min-height: 44px; padding: 0 4px; } }
    @media (prefers-reduced-motion: reduce) {
      :host { transition: none; }
    }
  `,
  template: `
    <div class="clip" [attr.inert]="gone() ? '' : null">
      <div class="bn">
        @if (icon()) { <span class="icon" aria-hidden="true">{{ icon() }}</span> }
        <div class="text"><ng-content /></div>
        @if (actionLabel()) {
          <button k-word type="button" (click)="action.emit()">{{ actionLabel() }}</button>
        }
        @if (dismissible()) {
          <button class="close" type="button" (click)="dismiss()">{{ closeLabel() }}</button>
        }
      </div>
    </div>
  `,
})
export class KometaBanner {
  readonly tone = input<KometaBannerTone>('info');
  /** `glass` draws a blurred slab with a hairline; the default is the boxless hairline. */
  readonly surface = input<'bare' | 'glass'>('bare');
  readonly dismissible = input(false, { transform: booleanAttribute });
  /** Overrides the live-region role the tone picks (a page-load notice may want `status` even when it warns). */
  readonly roleOverride = input<'status' | 'alert' | ''>('');
  /** The word on the close button; the caller owns the dictionary. */
  readonly closeLabel = input('');
  /** An action word after the sentence (a Retry); the caller owns the dictionary. */
  readonly actionLabel = input('');
  /** A leading glyph in the tone colour (decorative; the sentence carries the meaning). */
  readonly icon = input('');
  readonly action = output<void>();
  readonly dismissed = output<void>();

  protected readonly gone = signal(false);
  protected readonly role = computed(() => this.roleOverride() || (this.tone() === 'warn' || this.tone() === 'error' ? 'alert' : 'status'));

  protected dismiss(): void {
    this.gone.set(true);
    this.dismissed.emit();
  }
}
