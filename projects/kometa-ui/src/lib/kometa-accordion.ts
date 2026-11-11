import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  contentChildren,
  effect,
  inject,
  input,
  model,
  untracked,
  viewChild,
} from '@angular/core';
import { KometaFoldBody } from './kometa-fold';

let nextId = 0;

/**
 * One question and its answer: a real `<button aria-expanded aria-controls>` in Syne, a hairline under
 * it that stretches to full width while open (680ms spring), and the answer in a `role="region"` that
 * opens on `grid-template-rows` 0fr to 1fr through `k-fold-body` (so its 420ms spring, its close
 * and its reduced-motion handling are the fold's own). The answer is the projected content and is
 * created only while open. `open` is a model. The question wraps; it is never cut.
 * Named `heading`, not `title`, so no native tooltip rides on the host.
 */
@Component({
  selector: 'k-accordion-item',
  imports: [KometaFoldBody],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.open]': 'open()' },
  styles: `
    :host { position: relative; display: block; }
    :host::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 1px;
      background: var(--display-ink, #f4efe6);
      transform: scaleX(0.18);
      transform-origin: left;
      opacity: 0.3;
      pointer-events: none;
      transition:
        transform 680ms cubic-bezier(0.22, 1.35, 0.32, 1),
        opacity 420ms;
    }
    :host(.open)::after { transform: scaleX(1); opacity: 1; }
    .h { margin: 0; font: inherit; }
    .q {
      display: flex;
      align-items: center;
      width: 100%;
      min-height: 44px;
      margin: 0;
      padding: var(--accordion-pad, 14px 0);
      border: 0;
      background: transparent;
      color: var(--display-ink, #f4efe6);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-weight: 700;
      font-size: var(--accordion-size, 16px);
      letter-spacing: -0.02em;
      text-align: start;
      overflow-wrap: break-word;
      cursor: pointer;
    }
    .t { flex: 1; min-width: 0; }
    .q:disabled { opacity: 0.5; cursor: default; }
    .q:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; }
    .a { padding: var(--accordion-body-pad, 0 0 14px); color: var(--accordion-body-ink, var(--muted)); font-size: 14px; line-height: 1.45; }
    @media (prefers-reduced-motion: reduce) {
      :host::after { transition: none; }
    }
  `,
  template: `
    <div class="h" role="heading" [attr.aria-level]="level()">
      <button #q type="button" class="q" [id]="id + '-h'" [attr.aria-expanded]="open()" [attr.aria-controls]="id" [disabled]="disabled()"
              (click)="open.set(!open())"><span class="t">{{ heading() }}</span></button>
    </div>
    <k-fold-body role="region" [id]="id" [attr.aria-labelledby]="id + '-h'" [open]="open()" [tpl]="body" />
    <ng-template #body><div class="a"><ng-content /></div></ng-template>
  `,
})
export class KometaAccordionItem {
  protected readonly id = `kometa-accordion-${nextId++}`;
  private readonly parent = inject(KometaAccordion, { optional: true });
  private readonly button = viewChild.required<ElementRef<HTMLButtonElement>>('q');

  /** The question, in the caller's words. */
  readonly heading = input.required<string>();
  readonly open = model(false);
  /** The `aria-level` of the question's heading. */
  readonly level = input(3);
  /** The question cannot be pressed. */
  readonly disabled = input(false, { transform: booleanAttribute });

  constructor() {
    effect(() => {
      if (this.open()) untracked(() => this.parent?.opened(this));
    });
  }

  focus(): void {
    this.button().nativeElement.focus();
  }

  hasFocus(): boolean {
    return document.activeElement === this.button().nativeElement;
  }
}

/**
 * A stack of `k-accordion-item`s. One open at a time unless `multiple`; ArrowUp, ArrowDown, Home
 * and End move focus between the questions. Spec: kometa-accordion.spec.ts.
 *
 *
 */
@Component({
  selector: 'k-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown)': 'onKey($event)' },
  styles: `:host { display: flex; flex-direction: column; }`,
  template: `<ng-content />`,
})
export class KometaAccordion {
  readonly multiple = input(false, { transform: booleanAttribute });
  private readonly items = contentChildren(KometaAccordionItem, { descendants: true });

  /** An item opened: unless several may stay open, close the rest. */
  opened(item: KometaAccordionItem): void {
    if (this.multiple()) return;
    for (const other of this.items()) if (other !== item && other.open()) other.open.set(false);
  }

  protected onKey(event: KeyboardEvent): void {
    const items = this.items();
    const at = items.findIndex((i) => i.hasFocus());
    if (at < 0) return;
    const to =
      event.key === 'ArrowDown' ? (at + 1) % items.length
      : event.key === 'ArrowUp' ? (at - 1 + items.length) % items.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? items.length - 1
      : -1;
    if (to < 0) return;
    event.preventDefault();
    items[to].focus();
  }
}
