import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Empty state: a Syne title and one muted sentence. A picture, if any, is an element with the `art` attribute: it sits
 * above the title in a box at most `--quiet-art-size` wide (160px) and sizes itself; anything else projected goes under the hint, e.g. a button.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 */
@Component({
  selector: 'k-quiet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: var(--quiet-padding, 24px 0);
      text-align: center;
    }
    .title {
      margin: 0;
      color: var(--text, inherit);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: var(--quiet-title-size, 22px);
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .hint {
      margin: 0;
      max-width: var(--quiet-hint-width, 28rem);
      color: var(--muted);
      font-size: 13px;
    }
    .art { display: grid; place-items: center; max-width: var(--quiet-art-size, 160px); margin-bottom: 4px; }
    .art:empty { display: none; }
    :host(:focus-visible) { outline: 2px solid var(--amber); }
  `,
  template: `
    <div class="art"><ng-content select="[art]" /></div>
    <p class="title">{{ title() }}</p>
    @if (hint()) {
      <p class="hint">{{ hint() }}</p>
    }
    <ng-content />
  `,
})
export class KometaQuiet {
  readonly title = input.required<string>();
  readonly hint = input('');
}
