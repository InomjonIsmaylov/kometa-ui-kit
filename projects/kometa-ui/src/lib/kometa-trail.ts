import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A list of things in the order they happened, one `k-step` each. The time is a large figure; the content is
 * whatever the page projects; and the wait to the next step is written on the dashed line that joins them
 * (`gap`, e.g. "32 min"): the wait is the story. The steps rise in one after another when the trail appears.
 * Spec: kometa-trail.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-8.html (Gaps).
 */
@Component({
  selector: 'k-trail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'list' },
  styles: `:host { display: block; }`,
  template: `<ng-content />`,
})
export class KometaTrail {}

/** One step of a `k-trail`. Content is projected after the time; `gap` is drawn under the step. */
@Component({
  selector: 'k-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'listitem' },
  styles: `
    :host { display: block; animation: k-step-in 520ms var(--ease-spring, ease) backwards; }
    @keyframes k-step-in { from { opacity: 0; transform: translateY(8px); } }
    .row { display: grid; grid-template-columns: var(--trail-time-width, 64px) minmax(0, 1fr); column-gap: var(--trail-col-gap, 12px); align-items: baseline; }
    time { font-family: var(--font-display, inherit); font-size: var(--trail-time-size, 20px); letter-spacing: -.02em; color: var(--display-ink, var(--text)); font-variant-numeric: tabular-nums; }
    .body { min-width: 0; }
    .gap { display: flex; align-items: center; gap: 10px; height: var(--trail-gap-height, 30px); padding-left: 12px; color: var(--muted); font-size: var(--trail-gap-size, 12px); font-variant-numeric: tabular-nums; }
    .gap::before { content: ''; align-self: stretch; width: 1px; background: repeating-linear-gradient(var(--glass-line) 0 3px, transparent 3px 7px); }
    @media (prefers-reduced-motion: reduce) { :host { animation: none; } }
  `,
  template: `
    <div class="row">
      <time>{{ time() }}</time>
      <div class="body"><ng-content /></div>
    </div>
    @if (gap(); as g) { <div class="gap">{{ g }}</div> }
  `,
})
export class KometaStep {
  readonly time = input.required<string>();
  /** The wait before the next step, already in words ("32 min"); nothing when there is none to say. */
  readonly gap = input<string | null>(null);
}
