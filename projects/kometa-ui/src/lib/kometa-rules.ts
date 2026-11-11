import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface KometaRule {
  label: string;
  /** Met when the pattern matches, or the function returns true. */
  test: RegExp | ((value: string) => boolean);
}

/**
 * What a value still needs, as a row of words that strike through as each rule is met, with the same
 * 1px line `k-check` draws through a done label. Put it under the field (`k-field type="password"`) and pass
 * that field's value. A met rule also carries `doneLabel` for a screen reader. Tests in kometa-rules.spec.ts.
 */
@Component({
  selector: 'k-rules',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    ul { display: flex; flex-wrap: wrap; gap: 2px 12px; margin: 0; padding: 0; list-style: none; }
    li { position: relative; color: var(--text2); font-size: var(--rules-size, 12px); transition: color .3s ease; }
    li::after {
      content: '';
      position: absolute;
      left: 0;
      top: 55%;
      width: 100%;
      height: 1px;
      background: var(--muted);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform .35s var(--ease-spring, ease);
    }
    li.ok { color: var(--muted); }
    li.ok::after { transform: none; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    @media (prefers-reduced-motion: reduce) { li, li::after { transition: none; } }
  `,
  template: `
    <ul [attr.aria-label]="ariaLabel() || null">
      @for (r of results(); track $index) {
        <li [class.ok]="r.ok">{{ r.label }}@if (r.ok) {<span class="sr">, {{ doneLabel() }}</span>}</li>
      }
    </ul>
  `,
})
export class KometaRules {
  readonly value = input('');
  readonly rules = input.required<KometaRule[]>();
  /** Read after a met rule. */
  readonly doneLabel = input('done');
  readonly ariaLabel = input('');

  protected readonly results = computed(() =>
    this.rules().map((r) => ({ label: r.label, ok: typeof r.test === 'function' ? r.test(this.value()) : this.value().search(r.test) >= 0 })));
}
