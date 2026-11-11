import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface KometaCrumb {
  label: string;
  /** A plain link. Without it the crumb is a button that emits `picked`. */
  href?: string;
}

/**
 * Where you are, as a path that walks down the page: each level sits a step further right and a size larger,
 * and the last one, the page itself, is a Syne title behind a "↳". A `<nav>` around an `<ol>`; the last item
 * carries `aria-current="page"` and is not a link. Tests in kometa-crumbs.spec.ts.
 */
@Component({
  selector: 'k-crumbs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    ol { list-style: none; margin: 0; padding: 0; line-height: 1.2; }
    li { padding-left: calc(var(--i) * var(--crumbs-indent, 10px)); }
    a, button {
      display: inline-block;
      padding: 1px 0;
      border: 0;
      background: none;
      color: var(--muted);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: color .2s;
    }
    li.near a, li.near button { color: var(--text2); font-size: 14px; }
    a:hover, button:hover { color: var(--display-ink, #f4efe6); }
    a:focus-visible, button:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; border-radius: 4px; }
    .here {
      color: var(--display-ink, #f4efe6);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: var(--crumbs-size, 18px);
      font-weight: 700;
    }
    .here::before { content: '↳ '; color: var(--muted); }
    @media (pointer: coarse) { a, button { min-height: 32px; } }
  `,
  template: `
    <nav [attr.aria-label]="ariaLabel()">
      <ol>
        @for (c of items(); track $index; let i = $index, last = $last) {
          <li [style.--i]="i" [class.near]="i === items().length - 2">
            @if (last) {
              <span class="here" aria-current="page">{{ c.label }}</span>
            } @else if (c.href) {
              <a [href]="c.href">{{ c.label }}</a>
            } @else {
              <button type="button" (click)="picked.emit(c)">{{ c.label }}</button>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class KometaCrumbs {
  /** Outermost first; the last one is the current page. */
  readonly items = input.required<KometaCrumb[]>();
  readonly ariaLabel = input('Breadcrumb');
  /** A crumb with no `href` was pressed. */
  readonly picked = output<KometaCrumb>();
}
