import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

/**
 * A person row: a 36px (or 28px `sm`) glass disc of initials, then the name and an optional meta line; projected content sits at the end of the row.
 * It is also the one avatar. `size="lg"` is a 64px figure (`--person-disc` sets any other width), `shape="square"` a 12px-radius
 * tile for a shop, `image` draws a photo in place of the initials (`imageAlt` names it) and `bare` hides the name beside it.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 */
@Component({
  selector: 'kometa-person',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .disc {
      flex: none;
      width: var(--person-disc, 36px);
      height: var(--person-disc, 36px);
      overflow: hidden;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--glass, rgba(28, 26, 22, .82));
      color: var(--display-ink, #f4efe6);
      font-family: var(--font-display, 'Syne'), sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    :host([data-size='sm']) { --person-disc: 28px; }
    :host([data-size='sm']) .disc { font-size: 12px; }
    :host([data-size='lg']) { --person-disc: 64px; }
    :host([data-size='lg']) .disc { font-size: 22px; }
    :host([data-shape='square']) .disc { border-radius: 12px; border: 1px solid var(--glass-line, var(--border)); }
    .disc img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .name, .meta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .name { font-weight: 600; }
    .meta { color: var(--muted); font-size: 13px; }
  `,
  template: `
    <span class="disc" [attr.aria-hidden]="image() || bare() ? null : 'true'" [attr.role]="bare() && !image() ? 'img' : null"
          [attr.aria-label]="bare() && !image() ? name() : null">
      @if (image()) { <img [src]="image()" [attr.alt]="imageAlt()" loading="lazy" /> } @else {{{ initials() }}}
    </span>
    @if (!bare()) {
      <span class="text">
        <span class="name">{{ name() }}</span>
        @if (meta()) {
          <span class="meta">{{ meta() }}</span>
        }
      </span>
    }
    <ng-content />
  `,
  host: { '[attr.data-size]': 'size()', '[attr.data-shape]': 'shape()' },
})
export class KometaPerson {
  readonly name = input.required<string>();
  readonly meta = input('');
  /** `sm` is a 28px disc for dense table rows, `lg` a 64px figure. */
  readonly size = input<'md' | 'sm' | 'lg'>('md');
  readonly shape = input<'disc' | 'square'>('disc');
  /** A photo in place of the initials. */
  readonly image = input('');
  readonly imageAlt = input('');
  /** Only the figure, no name beside it (the name still names it to a screen reader). */
  readonly bare = input(false, { transform: booleanAttribute });

  protected readonly initials = computed(() => initialsOf(this.name()));
}

/** First letter of each of the first two words, uppercased. */
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}
