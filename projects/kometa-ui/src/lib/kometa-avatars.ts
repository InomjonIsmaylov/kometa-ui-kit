import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { KometaPerson } from './kometa-person';

/**
 * A few people as overlapping glass discs (`k-person`, bare), then a "+N" disc for the rest. On hover or
 * focus inside, the discs fan apart so each face reads. Each disc names its person to a screen reader.
 * Tests in kometa-avatars.spec.ts.
 */
@Component({
  selector: 'k-avatars',
  imports: [KometaPerson],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: inline-flex; align-items: center; --person-bg: var(--avatars-bg, var(--input)); }
    k-person, .more {
      border-radius: 50%;
      /* A hairline edge so a disc reads on any card, then a cut-out ring that parts it from the one beneath. */
      box-shadow: 0 0 0 1px var(--glass-line), 0 0 0 3px var(--avatars-ring, var(--bg));
      transition: margin .35s var(--ease-spring, ease);
    }
    :host([data-size='sm']) { --person-disc: 28px; }
    :host([data-size='lg']) { --person-disc: 64px; }
    k-person + k-person, .more { margin-left: calc(var(--avatars-overlap, 10px) * -1); }
    :host(:hover) k-person + k-person, :host(:hover) .more,
    :host(:focus-within) k-person + k-person, :host(:focus-within) .more { margin-left: var(--avatars-gap, 4px); }
    .more {
      width: var(--person-disc, 36px);
      height: var(--person-disc, 36px);
      display: grid;
      place-items: center;
      background: var(--person-bg);
      color: var(--muted);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: 12px;
      font-weight: 700;
    }
    @media (prefers-reduced-motion: reduce) { k-person, .more { transition: none; } }
  `,
  template: `
    @for (p of shown(); track $index) {
      <k-person bare [name]="p.name" [image]="p.image ?? ''" [imageAlt]="p.name" [size]="size()" />
    }
    @if (rest()) {
      <span class="more" role="img" [attr.aria-label]="moreLabel().replace('{n}', '' + rest())">+{{ rest() }}</span>
    }
  `,
  host: { role: 'group', '[attr.aria-label]': 'ariaLabel() || null', '[attr.data-size]': 'size()' },
})
export class KometaAvatars {
  readonly people = input.required<{ name: string; image?: string }[]>();
  /** How many discs show before the "+N". */
  readonly max = input(4);
  readonly size = input<'md' | 'sm' | 'lg'>('md');
  /** What the "+N" disc says aloud; `{n}` is the count. */
  readonly moreLabel = input('{n} more');
  readonly ariaLabel = input('');

  protected readonly shown = computed(() => this.people().slice(0, this.max()));
  protected readonly rest = computed(() => Math.max(0, this.people().length - this.max()));
}
