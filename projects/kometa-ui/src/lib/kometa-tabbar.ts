import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  computed,
  input,
  model,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface KometaTab {
  value: string;
  label: string;
  /** Handed to `iconTemplate`; with no template it is a CSS class string on an `<i>` (an icon font). */
  icon: string;
  /** Set it and the tab is an `<a routerLink>`; leave it off and the tab is a `<button>`. */
  link?: string | readonly unknown[];
}

/**
 * A floating glass capsule of icon tabs; the chosen one opens to show its word.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md, "Tab bar: glass".
 */
@Component({
  selector: 'k-tabbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink],
  host: { '(keydown)': 'onKey($event)' },
  styles: `
    :host { display: block; width: fit-content; max-width: 100%; }
    .bar {
      display: flex;
      gap: 2px;
      padding: var(--tabbar-pad, 6px);
      border-radius: var(--tabbar-radius, var(--r-pill, 999px));
      background: var(--glass, var(--card));
      border: 1px solid var(--glass-line, var(--border));
      box-shadow: inset 0 1px 0 var(--glass-hi, rgba(255, 255, 255, .1));
      -webkit-backdrop-filter: blur(8px) saturate(1.2);
      backdrop-filter: blur(8px) saturate(1.2);
    }
    .tab {
      margin: 0;
      padding: 10px 12px;
      border: 0;
      border-radius: var(--tabbar-tab-radius, var(--r-pill, 999px));
      background: transparent;
      color: var(--muted);
      font: inherit;
      text-decoration: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: color 420ms;
    }
    .tab:hover { color: var(--text, inherit); }
    .tab.on { color: var(--tabbar-ink-on, var(--display-ink, var(--text))); }
    .tab:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; }
    .ico { display: inline-flex; font-size: var(--tabbar-icon-size, 22px); line-height: 1; }
    .word {
      max-width: 0;
      margin-left: 0;
      overflow: hidden;
      opacity: 0;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 13px;
      font-weight: 600;
      transition: max-width 680ms var(--ease-spring, ease), opacity 280ms, margin 420ms;
    }
    .on .word, .bar.all .word { max-width: var(--tabbar-word-max, 70px); margin-left: 8px; opacity: 1; }
    @media (pointer: coarse) { .tab { min-height: 44px; min-width: 44px; justify-content: center; } }
    @media (prefers-reduced-motion: reduce) {
      .tab, .word { transition: none; }
    }
    @media (prefers-reduced-transparency: reduce) {
      .bar { background: var(--card); -webkit-backdrop-filter: none; backdrop-filter: none; }
    }
  `,
  template: `
    <div class="bar" [class.all]="labels() === 'all'" [attr.role]="linked() ? 'navigation' : 'tablist'" [attr.aria-label]="ariaLabel() || null">
      @for (tab of tabs(); track tab.value) {
        @if (tab.link) {
          <a #item class="tab" [class.on]="tab.value === value()" [routerLink]="tab.link"
             [attr.aria-current]="tab.value === value() ? 'page' : null" (click)="value.set(tab.value)">
            <ng-container *ngTemplateOutlet="inner; context: { $implicit: tab }" />
          </a>
        } @else {
          <button #item class="tab" type="button" role="tab" [class.on]="tab.value === value()"
                  [attr.aria-selected]="tab.value === value() ? 'true' : 'false'"
                  [attr.tabindex]="tab.value === value() ? null : -1" (click)="value.set(tab.value)">
            <ng-container *ngTemplateOutlet="inner; context: { $implicit: tab }" />
          </button>
        }
      }
    </div>
    <ng-template #inner let-tab>
      <span class="ico" aria-hidden="true">
        @if (iconTemplate(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl; context: { $implicit: tab }" />
        } @else {
          <i [class]="tab.icon"></i>
        }
      </span>
      <span class="word">{{ tab.label }}</span>
    </ng-template>
  `,
})
export class KometaTabbar {
  readonly tabs = input.required<readonly KometaTab[]>();
  /** The chosen tab's `value`. A link bar is driven by the router: the caller sets this from the URL. */
  readonly value = model('');
  readonly ariaLabel = input('');
  /** `active` opens only the chosen tab's word; `all` keeps every word open. */
  readonly labels = input<'active' | 'all'>('active');
  /** Draws a tab's icon (the customer's `app-icon`, say); the context's `$implicit` is the tab. */
  readonly iconTemplate = input<TemplateRef<{ $implicit: KometaTab }> | null>(null);

  protected readonly linked = computed(() => this.tabs().some((t) => !!t.link));
  private readonly items = viewChildren<ElementRef<HTMLElement>>('item');

  /** Arrows, Home and End move the tab strip. Links keep Tab and Enter only. */
  protected onKey(event: KeyboardEvent): void {
    if (this.linked()) return;
    const items = this.items().map((i) => i.nativeElement);
    const at = items.findIndex((i) => i === event.target);
    if (at < 0) return;
    const to =
      event.key === 'ArrowRight' ? (at + 1) % items.length
      : event.key === 'ArrowLeft' ? (at - 1 + items.length) % items.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? items.length - 1
      : -1;
    if (to < 0) return;
    event.preventDefault();
    items[to].focus();
    this.value.set(this.tabs()[to].value);
  }
}
