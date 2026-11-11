import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

export type KometaTagTone = 'now' | 'wait' | 'book' | 'done' | 'warn' | 'error';

/**
 * A status mark: a state-coloured dot and a word, no container (round 14, S Dot and word: a column of them reads as words, not boxes). Not a button.
 * `now` is amber (a dot, never a fill), `wait` blue, `book` muted, `done` green, `warn` and `error` red.
 * The word is projected: `<kometa-tag tone="wait">Kutmoqda</kometa-tag>`.
 * Spec: kometa-tag.spec.ts.
 */
@Component({
  selector: 'kometa-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-tone]': 'tone()' },
  styles: `
    :host {
      --dot: var(--muted);
      --ink: var(--muted);
      display: inline-flex;
      align-items: center;
      gap: var(--tag-gap, 6px);
      padding: 0;
      color: var(--ink);
      font-size: var(--tag-font-size, 12px);
      font-weight: 600;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }
    :host([data-tone='now']) { --dot: var(--amber); --ink: var(--amber-ink, var(--amber)); }
    :host([data-tone='wait']) { --dot: var(--blue); --ink: var(--blue); }
    :host([data-tone='done']) { --dot: var(--green); --ink: var(--green); }
    :host([data-tone='warn']) { --dot: var(--red); --ink: var(--red); }
    :host([data-tone='error']) { --dot: var(--error); --ink: var(--error); }
    .dot {
      flex: none;
      width: var(--tag-dot-size, 6px);
      height: var(--tag-dot-size, 6px);
      border-radius: 50%;
      background: var(--dot);
    }
  `,
  template: `@if (dot()) { <span class="dot" aria-hidden="true"></span> }<ng-content />`,
})
export class KometaTag {
  readonly tone = input<KometaTagTone>('book');
  /** `false` leaves the word alone, coloured by its tone. */
  readonly dot = input(true, { transform: booleanAttribute });
}
