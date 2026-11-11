import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * A keyboard shortcut as words in Syne, `Ctrl + Shift + P`, inside the nested `<kbd>` HTML asks for.
 * With `play` the keys light up one after another, as if being pressed: on hover and focus by default,
 * always with `loop`, never with `off` (and never under reduced motion). Tests in kometa-keys.spec.ts.
 */
@Component({
  selector: 'k-keys',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: inline-block; }
    kbd { font: inherit; }
    kbd kbd {
      color: var(--keys-ink, var(--display-ink, #f4efe6));
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: var(--keys-size, 15px);
      font-weight: 700;
    }
    .plus { color: var(--muted); margin: 0 .3em; }
    :host([data-play='loop']) kbd kbd, :host([data-play='hover']:hover) kbd kbd, :host([data-play='hover']:focus-within) kbd kbd {
      animation: press calc(var(--n) * var(--keys-step, 400ms) + 800ms) calc(var(--i) * var(--keys-step, 400ms)) infinite both;
    }
    @keyframes press {
      0% { color: var(--keys-dim, var(--muted)); }
      6%, 50% { color: var(--keys-ink, var(--display-ink, #f4efe6)); }
      70%, 100% { color: var(--keys-dim, var(--muted)); }
    }
    @media (prefers-reduced-motion: reduce) { kbd kbd { animation: none !important; } }
  `,
  template: `
    <kbd>
      @for (k of list(); track $index; let i = $index, last = $last) {
        <kbd [style.--i]="i">{{ k }}</kbd>
        @if (!last) {
          <span class="plus">{{ separator() }}</span>
        }
      }
    </kbd>
  `,
  host: { '[attr.data-play]': 'play()', '[style.--n]': 'list().length' },
})
export class KometaKeys {
  /** `"Ctrl+Shift+P"` or `['Ctrl', 'Shift', 'P']`. */
  readonly keys = input.required<string | string[]>();
  readonly play = input<'hover' | 'loop' | 'off'>('hover');
  /** Drawn between the keys. */
  readonly separator = input('+');

  protected readonly list = computed(() => {
    const k = this.keys();
    return (Array.isArray(k) ? k : k.split('+')).map((s) => s.trim()).filter(Boolean);
  });
}
