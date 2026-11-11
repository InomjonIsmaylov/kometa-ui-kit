import { ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, input, model, viewChild } from '@angular/core';

let nextId = 0;

/**
 * An explanation that stays in the page. The term itself is the button (dotted underline); opened,
 * a 1px thread grows to 24px and the sentence fades in beside it. Escape closes it and returns focus
 * to the term. `open` is a model. The sentence is projected:
 * `<k-hint term="Lid tolovi">Qidiruvdan kelgan yangi mijozning birinchi tashrifidan 12%.</k-hint>`.
 * Spec: kometa-hint.spec.ts.
 */
@Component({
  selector: 'k-hint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'onEscape($event)' },
  styles: `
    :host { display: block; }
    .term {
      display: inline-flex;
      align-items: center;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--hint-term-color, var(--display-ink, var(--text)));
      font: inherit;
      letter-spacing: inherit;
      text-align: left;
      text-decoration: underline dotted;
      text-decoration-color: var(--muted);
      text-underline-offset: 4px;
      cursor: pointer;
    }
    .term:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    @media (pointer: coarse) { .term { min-height: 44px; } }
    .reveal {
      display: grid;
      grid-template-rows: 0fr;
      visibility: hidden;
      transition: grid-template-rows 420ms var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1)), visibility 0s linear 420ms;
    }
    .reveal.on { grid-template-rows: 1fr; visibility: visible; transition-delay: 0s; }
    .thread { display: flex; align-items: flex-start; gap: 10px; min-height: 0; overflow: hidden; }
    .line {
      flex: none;
      width: 0;
      height: 1px;
      margin-top: 11px;
      background: var(--display-ink, var(--text));
      transition: width 420ms var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1));
    }
    .on .line { width: var(--hint-thread-width, 24px); }
    .term:disabled { cursor: default; opacity: .5; }
    .sentence {
      margin: 0;
      padding-bottom: 2px;
      color: var(--hint-text-color, var(--muted));
      font-size: var(--hint-text-size, 14px);
      line-height: 1.45;
      opacity: 0;
      overflow-wrap: anywhere;
    }
    .on .sentence { opacity: 1; transition: opacity 280ms ease 140ms; }
    @media (prefers-reduced-motion: reduce) {
      .reveal, .line, .on .sentence { transition: none; }
    }
  `,
  template: `
    <button #btn class="term" type="button" [attr.aria-expanded]="open()" [attr.aria-controls]="id"
            [attr.aria-describedby]="id" [attr.aria-label]="ariaLabel() || null" [disabled]="disabled()"
            (click)="open.set(!open())">{{ term() }}</button>
    <div class="reveal" [class.on]="open()">
      <div class="thread">
        <i class="line" aria-hidden="true"></i>
        <p class="sentence" role="note" [id]="id"><ng-content /></p>
      </div>
    </div>
  `,
})
export class KometaHint {
  protected readonly id = `kometa-hint-${nextId++}`;
  readonly term = input.required<string>();
  readonly open = model(false);
  readonly ariaLabel = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  private readonly btn = viewChild.required<ElementRef<HTMLButtonElement>>('btn');

  protected onEscape(e: Event): void {
    if (!this.open()) return;
    e.stopPropagation();
    this.open.set(false);
    this.btn().nativeElement.focus();
  }
}
