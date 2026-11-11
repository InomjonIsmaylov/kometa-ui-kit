import {
  ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, booleanAttribute, computed, input, model, viewChild,
} from '@angular/core';

/**
 * Free text, several lines. No box: a hairline under the text draws itself on focus, and the field grows with what is
 * written (never shorter than `rows`). With a `maxlength` the count shows only in the last 30 characters, amber and then
 * red at the limit; a page that draws its own counter passes `[count]="false"`. `value` is a model:
 * `<kometa-notes [rows]="4" [maxlength]="300" [(value)]="draft" ariaLabel="Reply" />`.
 * Spec: kometa-notes.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-8.html (Whisper).
 */
@Component({
  selector: 'kometa-notes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .area { position: relative; padding-bottom: 8px; }
    .area::after {
      content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: var(--notes-line, var(--display-ink, var(--text)));
      transform: scaleX(.3); transform-origin: left; opacity: .5; transition: transform 420ms var(--ease-spring, ease), opacity 200ms ease;
    }
    .area:focus-within::after { transform: none; opacity: 1; }
    textarea {
      display: block; box-sizing: border-box; width: 100%; resize: none; overflow: hidden; margin: 0; padding: 0; border: 0; border-radius: 0; outline: 0;
      background: transparent; color: var(--text); font: inherit; line-height: 1.5;
    }
    textarea::placeholder { color: var(--muted); }
    textarea:disabled { opacity: .4; cursor: not-allowed; }
    @media (pointer: coarse) { textarea { font-size: 16px; } }
    .count { display: block; margin-top: 2px; text-align: right; font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
    .count.warn { color: var(--notes-warn, var(--amber)); }
    .count.over { color: var(--red); }
    @media (prefers-reduced-motion: reduce) { .area::after { transition: none; } }
  `,
  template: `
    <div class="area">
      <textarea #ta [id]="inputId() || null" [rows]="rows()" [value]="value()" [attr.maxlength]="maxlength()" [placeholder]="placeholder()"
                [attr.aria-label]="ariaLabel() || null" [disabled]="disabled()" [readOnly]="readonly()" (input)="onInput($event)"></textarea>
    </div>
    @if (counting()) {
      <span class="count" [class.warn]="left() <= 30 && left() > 0" [class.over]="left() <= 0" aria-live="polite">{{ value().length }} / {{ maxlength() }}</span>
    }
  `,
})
export class KometaNotes {
  readonly value = model('');
  readonly rows = input(2);
  readonly maxlength = input<number | null>(null);
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly inputId = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Draw the near-the-limit count. Off for a page that has its own counter. */
  readonly count = input(true, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });

  protected readonly left = computed(() => (this.maxlength() ?? Infinity) - this.value().length);
  protected readonly counting = computed(() => this.count() && this.maxlength() !== null && this.left() <= 30);
  private readonly ta = viewChild.required<ElementRef<HTMLTextAreaElement>>('ta');

  constructor() {
    // The model can change from outside (a draft that arrives written), so the height follows the value, not the keys.
    afterRenderEffect(() => {
      this.value();
      this.rows();
      const el = this.ta().nativeElement;
      el.style.height = 'auto';
      if (el.scrollHeight > 0) el.style.height = `${el.scrollHeight}px`;
    });
  }

  protected onInput(e: Event): void {
    this.value.set((e.target as HTMLTextAreaElement).value);
  }
}
