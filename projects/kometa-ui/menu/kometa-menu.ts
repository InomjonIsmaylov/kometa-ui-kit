import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  booleanAttribute, input,
  model,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import type { KometaWordOption } from 'kometa-ui/words';

let nextId = 0;

/**
 * A chooser with no floating sheet: a trigger line (a muted prefix word, the chosen value in Syne, a
 * caret) opens the option list in the page as big Syne words and pushes the content below it down
 * (rows 0fr to 1fr, 420ms). The chosen word is cream with a trailing bead. `value` is a model and
 * `disabled` an input, so `[formField]` binds it like the other shared value controls.
 * Spec: kometa-menu.spec.ts.
 *
 *
 */
@Component({
  selector: 'k-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.open]': 'open()', '(keydown)': 'onKey($event)' },
  styles: `
    :host { display: block; }
    .trigger {
      margin: 0;
      padding: 0;
      max-width: 100%;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 0;
      background: transparent;
      color: var(--muted);
      font: inherit;
      font-size: 14px;
      text-align: left;
      cursor: pointer;
    }
    .trigger:disabled { cursor: default; opacity: .5; }
    .trigger:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    /* Inside the list's overflow:hidden, so the ring must not poke out and be clipped. */
    .option:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; border-radius: 6px; }
    .option:hover:not([aria-selected='true']) { color: var(--text2); }
    .chosen {
      color: var(--display-ink, #f4efe6);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: var(--menu-chosen-size, 18px);
      font-weight: 700;
      letter-spacing: -0.02em;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .caret {
      flex: none;
      width: 12px;
      height: 12px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: transform 420ms var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1));
    }
    :host(.open) .caret { transform: rotate(180deg); }
    /* Closed: no height and not focusable (visibility waits for the close to finish). */
    .stack {
      display: grid;
      grid-template-rows: 0fr;
      visibility: hidden;
      transition: grid-template-rows 420ms cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 420ms;
    }
    :host(.open) .stack { grid-template-rows: 1fr; visibility: visible; transition-delay: 0s; }
    .list { min-height: 0; overflow: hidden; display: flex; flex-direction: column; align-items: flex-start; }
    .option {
      margin: 0;
      padding: 8px 0;
      max-width: 100%;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      border: 0;
      background: transparent;
      color: var(--muted);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: var(--menu-option-size, 22px);
      font-weight: 700;
      letter-spacing: -0.03em;
      text-align: left;
      cursor: pointer;
      transition: color 420ms;
    }
    .option[aria-selected='true'] { color: var(--menu-active-color, var(--display-ink, #f4efe6)); }
    .option[aria-selected='true']::after {
      content: '';
      flex: none;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    @media (pointer: coarse) { .trigger { min-height: 44px; } .option { min-height: 44px; } }
    @media (prefers-reduced-motion: reduce) {
      .caret, .stack, .option { transition: none; }
    }
  `,
  template: `
    <button #trigger type="button" class="trigger" aria-haspopup="listbox" [attr.aria-expanded]="open() ? 'true' : 'false'"
            [attr.aria-controls]="id" [attr.aria-label]="ariaLabel() || null" [disabled]="disabled()"
            (click)="open.set(!open())">
      <span class="prefix">{{ label() }}</span>
      <b class="chosen">{{ chosenLabel() || placeholder() }}</b>
      <svg class="caret" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6l5 5 5-5" /></svg>
    </button>
    <div class="stack">
      <div class="list" role="listbox" [id]="id" [attr.aria-label]="ariaLabel() || label() || null">
        @for (opt of options(); track opt.value) {
          <button #option type="button" class="option" role="option" [attr.aria-selected]="value() === opt.value ? 'true' : 'false'"
                  [attr.tabindex]="opt.value === tabStop() ? 0 : -1" (click)="choose(opt.value)">
            {{ opt.label }}
          </button>
        }
      </div>
    </div>
  `,
})
export class KometaMenu {
  protected readonly id = `kometa-menu-${nextId++}`;
  readonly options = input.required<readonly KometaWordOption[]>();
  readonly value = model('');
  /** The muted word before the chosen value (`Saralash`). */
  readonly label = input('');
  /** Names the control for a screen reader when the prefix word alone is not enough. */
  readonly ariaLabel = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Shown as the chosen word while nothing is chosen. */
  readonly placeholder = input('');

  protected readonly open = signal(false);
  protected readonly chosenLabel = computed(() => this.options().find((o) => o.value === this.value())?.label ?? '');
  /** The one option in the tab order: the chosen one, else the first. */
  protected readonly tabStop = computed(() => this.options().find((o) => o.value === this.value())?.value ?? this.options()[0]?.value);

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly optionEls = viewChildren<ElementRef<HTMLButtonElement>>('option');
  private readonly injector = inject(Injector);

  protected choose(next: string): void {
    this.value.set(next);
    this.open.set(false);
    this.trigger().nativeElement.focus();
  }

  protected onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (event.key === 'Escape') {
      if (!this.open()) return;
      event.preventDefault();
      this.open.set(false);
      this.trigger().nativeElement.focus();
      return;
    }
    const down = event.key === 'ArrowDown';
    if (target === this.trigger().nativeElement) {
      if (this.disabled() || (!down && event.key !== 'ArrowUp')) return;
      event.preventDefault();
      this.open.set(true);
      afterNextRender(() => this.focusOption(down ? 'selected' : 'last'), { injector: this.injector });
      return;
    }
    const els = this.optionEls().map((e) => e.nativeElement);
    const at = els.indexOf(target as HTMLButtonElement);
    if (at < 0) return;
    const to =
      down ? Math.min(at + 1, els.length - 1)
      : event.key === 'ArrowUp' ? Math.max(at - 1, 0)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? els.length - 1
      : -1;
    if (to < 0) return;
    event.preventDefault();
    els[to].focus();
  }

  private focusOption(which: 'selected' | 'last'): void {
    const els = this.optionEls().map((e) => e.nativeElement);
    const chosen = els.find((el) => el.getAttribute('aria-selected') === 'true');
    (which === 'last' ? els[els.length - 1] : (chosen ?? els[0]))?.focus();
  }
}
