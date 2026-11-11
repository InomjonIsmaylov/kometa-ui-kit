import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, input, output, viewChild } from '@angular/core';

/**
 * The "choose a file" half of an upload: it opens the OS chooser and reports the files, nothing more
 * (progress is `kometa-upload`'s, the presigned PUT is the page's). Two shapes, one frame language:
 * `zone` is a corner-marked frame with a title and a hint, `button` is a small framed chip.
 * The label wraps a real file input, so keyboard, focus and the accessible name are the browser's.
 * The input is emptied after every pick, so choosing the same file twice still fires `picked`.
 * Drops are the page's: it passes `over` while a file is dragged over its own drop target.
 * Spec: kometa-picker.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-6.html (Frame).
 */
@Component({
  selector: 'kometa-picker',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.zone]': "variant() === 'zone'", '[class.over]': 'over()', '[class.off]': 'disabled()' },
  styles: `
    :host { display: inline-block; position: relative; color: var(--display-ink, var(--text)); }
    :host(.zone) { display: block; }
    .pk { position: relative; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; font: inherit; }
    .pk input { position: absolute; inline-size: 1px; block-size: 1px; opacity: 0; pointer-events: none; }
    .pk:has(input:focus-visible) { outline: 2px solid var(--amber); outline-offset: 2px; }
    :host(.off) .pk { opacity: .4; cursor: not-allowed; }

    /* button: a small framed chip */
    .pk { min-height: 40px; padding: 0 16px; border: 1px solid var(--picker-line, var(--glass-line)); border-radius: var(--picker-radius, 6px); font-size: 14px; transition: border-color 280ms ease; }
    @media (pointer: coarse) { .pk { min-height: 44px; } }
    .pk:hover, :host(.over) .pk { border-color: var(--display-ink, var(--text)); }
    :host(.off) .pk:hover { border-color: var(--glass-line); }
    .plus { font-family: var(--font-display, inherit); line-height: 1; }

    /* zone: four corner marks that close in, and a veil that fills from the bottom while a file is over */
    :host(.zone) .pk { display: grid; place-items: center; width: 100%; min-height: var(--picker-zone-height, 148px); padding: 22px; border: 0; border-radius: var(--picker-radius, 6px); text-align: center; overflow: hidden; }
    .c { position: absolute; width: 18px; height: 18px; border: 0 solid var(--display-ink, var(--text)); opacity: .7; transition: transform 420ms var(--ease-spring, ease); }
    .c1 { left: 0; top: 0; border-width: 1px 0 0 1px; }
    .c2 { right: 0; top: 0; border-width: 1px 1px 0 0; }
    .c3 { left: 0; bottom: 0; border-width: 0 0 1px 1px; }
    .c4 { right: 0; bottom: 0; border-width: 0 1px 1px 0; }
    :host(:not(.off)) .pk:hover .c1, :host(.over) .c1 { transform: translate(6px, 6px); }
    :host(:not(.off)) .pk:hover .c2, :host(.over) .c2 { transform: translate(-6px, 6px); }
    :host(:not(.off)) .pk:hover .c3, :host(.over) .c3 { transform: translate(6px, -6px); }
    :host(:not(.off)) .pk:hover .c4, :host(.over) .c4 { transform: translate(-6px, -6px); }
    .veil { position: absolute; inset: 0; background: var(--display-ink, var(--text)); opacity: .07; transform: scaleY(0); transform-origin: bottom; transition: transform 520ms var(--ease-spring, ease); }
    :host(.over) .veil { transform: scaleY(1); }
    .body { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .t { font-family: var(--font-display, inherit); font-size: 18px; letter-spacing: -.02em; }
    .h { color: var(--muted); font-size: 13px; }
    @media (prefers-reduced-motion: reduce) { .pk, .c, .veil { transition: none; } }
  `,
  template: `
    <label class="pk">
      <input #file type="file" [attr.aria-label]="ariaLabel() || null" [attr.name]="name() || null" [accept]="accept()" [multiple]="multiple()" [disabled]="disabled()" (change)="onChange()" />
      @if (variant() === 'zone') {
        <i class="c c1" aria-hidden="true"></i><i class="c c2" aria-hidden="true"></i>
        <i class="c c3" aria-hidden="true"></i><i class="c c4" aria-hidden="true"></i>
        <i class="veil" aria-hidden="true"></i>
        <span class="body">
          <span class="t">{{ label() }}</span>
          @if (hint()) { <span class="h">{{ hint() }}</span> }
          <ng-container *ngTemplateOutlet="extra" />
        </span>
      } @else {
        @if (plus()) { <span class="plus" aria-hidden="true">+</span> }
        <span>{{ label() }}</span>
        <ng-container *ngTemplateOutlet="extra" />
      }
    </label>
    <ng-template #extra><ng-content /></ng-template>
  `,
})
export class KometaPicker {
  /** The title of the zone, or the word on the button ("Rasm qo'shish"). */
  readonly label = input.required<string>();
  /** The muted line under a zone's title; the button has none. */
  readonly hint = input('');
  readonly variant = input<'zone' | 'button'>('button');
  readonly accept = input('');
  /** Overrides the accessible name (default: the visible label text). */
  readonly ariaLabel = input('');
  /** The file input's `name`, for a surrounding form. */
  readonly name = input('');
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** A "+" before the button's word, for the pickers that add to a list. */
  readonly plus = input(false, { transform: booleanAttribute });
  /** The page's own drop target has a file over it: the frame closes in and fills. */
  readonly over = input(false, { transform: booleanAttribute });
  /** Exactly what the OS chooser returned (no type check: a non-image is still the page's to refuse). */
  readonly picked = output<File[]>();

  private readonly file = viewChild.required<ElementRef<HTMLInputElement>>('file');

  protected onChange(): void {
    const input = this.file().nativeElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length) this.picked.emit(files);
  }
}
