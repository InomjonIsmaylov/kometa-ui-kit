import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  input,
  model,
  viewChild,
  viewChildren,
} from '@angular/core';

export interface KometaFilmDay {
  value: string;
  /** The big figure, e.g. "14". */
  label: string;
  /** The small weekday text under it. */
  sub?: string;
  /** Nothing in this day; still pressable. */
  muted?: boolean;
  /** Decorative amber point for "has something"; the caller puts the meaning in label/aria. */
  dot?: boolean;
}

/**
 * A week strip of days with one glass thumb sliding behind the pressed one.
 * Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md, "Day: film".
 */
@Component({
  selector: 'k-film',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-label]': 'ariaLabel() || null',
  },
  styles: `
    :host { display: block; }
    .film { position: relative; display: flex; }
    button {
      position: relative;
      z-index: 1;
      flex: 1;
      margin: 0;
      padding: 8px 0 10px;
      border: 0;
      border-radius: var(--film-radius, 14px);
      background: transparent;
      color: var(--muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }
    button small {
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 500;
    }
    button { min-width: 0; line-height: 1.2; }
    button:hover:not(:disabled):not([aria-pressed='true']) { color: var(--text); }
    button:disabled { cursor: default; opacity: .5; }
    button[data-muted] { opacity: .6; }
    button[aria-pressed='true'] { color: var(--display-ink, #f4efe6); opacity: 1; }
    button:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; }
    .dot {
      position: absolute;
      top: 6px;
      right: 8px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--amber);
      pointer-events: none;
    }
    .film-thumb {
      position: absolute;
      z-index: 0;
      top: 0;
      left: 0;
      width: 0;
      height: 100%;
      box-sizing: border-box;
      border-radius: var(--film-radius, 14px);
      background: var(--film-thumb, var(--glass, rgba(28, 26, 22, .82)));
      border: 1px solid var(--glass-line, rgba(244, 239, 230, .14));
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, .1);
      pointer-events: none;
      transition: transform 420ms var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1)),
        width 420ms var(--ease-spring, cubic-bezier(0.22, 1.15, 0.36, 1));
    }
    @media (prefers-reduced-motion: reduce) {
      .film-thumb { transition: none; }
    }
  `,
  template: `
    <div class="film">
      <span #thumb class="film-thumb"></span>
      @for (day of days(); track day.value) {
        <button #day type="button" [attr.aria-pressed]="value() === day.value ? 'true' : 'false'"
                [disabled]="disabled()" [attr.data-muted]="day.muted ? '' : null" (click)="choose(day.value, $event)">
          {{ day.label }}
          @if (day.sub) { <small>{{ day.sub }}</small> }
          @if (day.dot) { <span class="dot" aria-hidden="true"></span> }
        </button>
      }
    </div>
  `,
})
export class KometaFilm implements AfterViewChecked {
  readonly days = input.required<readonly KometaFilmDay[]>();
  readonly value = model('');
  readonly ariaLabel = input('');
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('day');
  private readonly thumb = viewChild<ElementRef<HTMLElement>>('thumb');

  ngAfterViewChecked(): void {
    const selected = this.value();
    const index = this.days().findIndex((day) => day.value === selected);
    const button = this.buttons()[index]?.nativeElement;
    if (button) this.moveThumb(button);
  }

  protected choose(next: string, event: Event): void {
    this.value.set(next);
    const button = event.currentTarget;
    if (button instanceof HTMLElement) this.moveThumb(button);
  }

  private moveThumb(button: HTMLElement): void {
    const thumb = this.thumb()?.nativeElement;
    if (!thumb) return;
    thumb.style.transform = `translateX(${button.offsetLeft}px)`;
    thumb.style.width = `${button.offsetWidth}px`;
  }
}
