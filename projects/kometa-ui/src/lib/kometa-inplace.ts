import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, booleanAttribute, inject, input, model, signal, viewChild,
} from '@angular/core';

/**
 * A value you edit where it stands: a Syne word that turns into an input on click. While you type, the old value
 * sits above it struck through, so you can see what you are replacing. Enter or leaving the field saves (an empty
 * entry keeps the old value), Escape cancels, and a save flashes the word. Focus returns to the word either way.
 * `value` is a model and `disabled` an input, so `[formField]` binds it. Tests in kometa-inplace.spec.ts.
 */
@Component({
  selector: 'k-inplace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.editing]': 'editing()' },
  styles: `
    :host { display: inline-block; max-width: 100%; }
    .word, input {
      margin: 0;
      padding: 0 0 3px;
      border: 0;
      background: none;
      color: var(--display-ink, #f4efe6);
      font: 700 var(--inplace-size, 17px) var(--font-display, 'Syne'), sans-serif;
      letter-spacing: -0.02em;
      text-align: left;
    }
    .word { cursor: text; max-width: 100%; overflow-wrap: anywhere; }
    .word.empty { color: var(--muted); }
    .word:disabled { cursor: default; opacity: .5; }
    .word:focus-visible { outline: 2px solid var(--amber); outline-offset: 3px; border-radius: 2px; }
    .word.saved { animation: k-inplace-flash .7s ease; }
    @keyframes k-inplace-flash { from { background: var(--display-ink, #f4efe6); color: var(--bg); } }
    .old {
      display: block;
      margin-bottom: 2px;
      color: var(--muted);
      font: 700 calc(var(--inplace-size, 17px) * .76) var(--font-display, 'Syne'), sans-serif;
      text-decoration: line-through;
      overflow-wrap: anywhere;
    }
    input {
      width: 100%;
      min-width: 8ch;
      outline: 0;
      border-bottom: 1px solid var(--display-ink, #f4efe6);
      animation: k-inplace-line .35s var(--ease-spring, ease);
    }
    @keyframes k-inplace-line { from { border-bottom-color: transparent; } }
    @media (pointer: coarse) { .word { min-height: 44px; } }
    @media (prefers-reduced-motion: reduce) { .word.saved, input { animation: none; } }
  `,
  template: `
    @if (editing()) {
      <span class="old" aria-hidden="true">{{ value() }}</span>
      <input #box [value]="value()" [attr.aria-label]="ariaLabel() || null" [attr.placeholder]="placeholder() || null"
             (keydown)="key($event, box.value)" (blur)="save(box.value)" />
    } @else {
      <button #word type="button" class="word" [class.empty]="!value()" [class.saved]="flash()" [disabled]="disabled()"
              [attr.aria-label]="ariaLabel() ? ariaLabel() + ': ' + (value() || placeholder()) : null"
              (click)="edit()" (animationend)="flash.set(false)">{{ value() || placeholder() }}</button>
    }
  `,
})
export class KometaInplace {
  readonly value = model('');
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Shown, muted, while the value is empty. */
  readonly placeholder = input('');
  /** Names the field; the word reads as "label: value". */
  readonly ariaLabel = input('');

  protected readonly editing = signal(false);
  protected readonly flash = signal(false);
  private readonly box = viewChild<ElementRef<HTMLInputElement>>('box');
  private readonly word = viewChild<ElementRef<HTMLButtonElement>>('word');
  private readonly injector = inject(Injector);

  edit(): void {
    if (this.disabled()) return;
    this.editing.set(true);
    afterNextRender(() => { const i = this.box()?.nativeElement; i?.focus(); i?.select(); }, { injector: this.injector });
  }

  protected key(e: KeyboardEvent, text: string): void {
    if (e.key === 'Enter') { e.preventDefault(); this.save(text); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(false); }
  }

  protected save(text: string): void {
    if (!this.editing()) return; // the blur that follows Enter or Escape
    const next = text.trim();
    const changed = !!next && next !== this.value();
    if (changed) this.value.set(next);
    this.close(changed);
  }

  private close(saved: boolean): void {
    const hadFocus = this.box()?.nativeElement === document.activeElement;
    this.editing.set(false);
    this.flash.set(saved);
    if (hadFocus) afterNextRender(() => this.word()?.nativeElement.focus(), { injector: this.injector });
  }
}
