import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A framed picture. The caption sits under the frame when it is non-empty.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 *
 *
 */
@Component({
  selector: 'k-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .frame {
      position: relative;
      border-radius: var(--frame-radius, 16px);
      overflow: hidden;
      background:
        linear-gradient(180deg, var(--glass-line, rgba(244, 239, 230, .14)), transparent 32%),
        var(--glass, #1c1a16);
    }
    .frame::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      box-shadow: inset 0 1px 0 var(--glass-line, rgba(244, 239, 230, .28));
    }
    .caption { margin: 8px 0 0; color: var(--frame-caption-color, var(--muted)); font-size: var(--frame-caption-size, 13px); }
  `,
  template: `
    <div class="frame">
      <ng-content />
    </div>
    @if (caption()) {
      <p class="caption">{{ caption() }}</p>
    }
    <ng-content select="[caption]" />
  `,
})
export class KometaFrame {
  readonly caption = input('');
}
