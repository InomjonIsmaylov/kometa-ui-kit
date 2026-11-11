import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * A vertical rail of named steps with one cream bead that travels down to the current one. Read-only
 * progress, not navigation: an `<ol>`, `aria-current="step"` on the current row. `current` is 1-based.
 * The row height is `--steps-row` (default 30px); the bead's travel is that variable times the index,
 * so the two cannot drift. A long label scrolls the box sideways instead of wrapping (a wrapped row
 * would break the bead's arithmetic).
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md; tests in kometa-steps.spec.ts.
 *
 *
 */
@Component({
  selector: 'kometa-steps',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      --steps-row: 30px;
      position: relative;
      display: block;
      max-width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
    }
    :host::-webkit-scrollbar { display: none; }
    .rail { position: relative; width: max-content; min-width: 100%; margin: 0; padding: 0; list-style: none; }
    .rail::before {
      content: '';
      position: absolute;
      left: 4px;
      top: calc(var(--steps-row) / 2);
      bottom: calc(var(--steps-row) / 2);
      width: 1px;
      background: var(--muted);
      opacity: 0.4;
    }
    li {
      height: var(--steps-row);
      display: flex;
      align-items: center;
      padding-left: 28px;
      color: var(--muted);
      font-size: 15px;
      white-space: nowrap;
      transition: color 420ms var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1));
    }
    li.done { color: var(--muted); opacity: 0.6; }
    li.cur {
      color: var(--display-ink, #f4efe6);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-weight: 700;
      font-size: 17px;
    }
    .bead {
      position: absolute;
      left: 0;
      top: calc((var(--steps-row) - 9px) / 2);
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--display-ink, #f4efe6);
      transform: translateY(calc(var(--steps-cur, 0) * var(--steps-row)));
      transition: transform 680ms cubic-bezier(0.22, 1.35, 0.32, 1);
    }
    @media (prefers-reduced-motion: reduce) {
      li, .bead { transition: none; }
    }
  `,
  template: `
    @if (steps().length) {
      <span class="bead" aria-hidden="true" [style.--steps-cur]="at() - 1"></span>
    }
    <ol class="rail" [attr.aria-label]="ariaLabel() || null">
      @for (name of steps(); track $index) {
        <li [class.done]="$index < at() - 1" [class.cur]="$index === at() - 1"
            [attr.aria-current]="$index === at() - 1 ? 'step' : null">{{ name }}</li>
      }
    </ol>
  `,
})
export class KometaSteps {
  /** The step names, in order; the caller's words. */
  readonly steps = input.required<readonly string[]>();
  /** 1-based; clamped into the list. */
  readonly current = input(1);
  readonly ariaLabel = input('');

  protected readonly at = computed(() => Math.min(Math.max(Math.round(this.current()) || 1, 1), Math.max(this.steps().length, 1)));
}
