import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, booleanAttribute, inject, input, output, signal, viewChild,
  viewChildren,
} from '@angular/core';

export interface KometaFabAction {
  label: string;
  value?: string;
  disabled?: boolean;
}

let nextId = 0;

/**
 * The page's main action, as a round cream button in the bottom corner. Pressing it dims the page and raises the
 * actions above it as big Syne words, no icons; the `+` turns into a `×`. Picking one emits `picked` with it.
 * By default it is fixed to the screen; `fixed` false pins it to the nearest positioned ancestor instead (a phone
 * frame, a card). The words are a menu: arrows, Home and End move, Escape and a click on the dimmed page close it
 * and hand focus back to the button. Tests in kometa-fab.spec.ts.
 */
@Component({
  selector: 'k-fab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.open]': 'open()', '[class.inline]': '!fixed()' },
  styles: `
    :host { position: fixed; inset: 0; z-index: var(--fab-z, 40); pointer-events: none; }
    :host(.inline) { position: absolute; }
    .scrim {
      position: absolute;
      inset: 0;
      background: var(--fab-scrim, color-mix(in srgb, var(--bg) 72%, transparent));
      opacity: 0;
      transition: opacity .3s;
    }
    :host(.open) .scrim { opacity: 1; pointer-events: auto; }
    .fab {
      position: absolute;
      right: var(--fab-right, 20px);
      bottom: var(--fab-bottom, 20px);
      display: grid;
      place-items: center;
      width: var(--fab-size, 52px);
      height: var(--fab-size, 52px);
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: var(--fab-bg, var(--display-ink, #f4efe6));
      color: var(--fab-ink, var(--bg));
      font: 600 26px/1 var(--font-sans, inherit);
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 10px 24px rgba(0, 0, 0, .35);
      transition: transform .45s var(--ease-spring, ease);
    }
    :host(.open) .fab { transform: rotate(45deg); }
    .fab:focus-visible { outline: 2px solid var(--amber); outline-offset: 3px; }
    .list {
      position: absolute;
      right: var(--fab-right, 20px);
      bottom: calc(var(--fab-bottom, 20px) + var(--fab-size, 52px) + 14px);
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      visibility: hidden;
      transition: visibility 0s linear .3s;
    }
    :host(.open) .list { visibility: visible; transition-delay: 0s; pointer-events: auto; }
    .word {
      margin: 0;
      padding: 4px 2px;
      border: 0;
      background: none;
      color: var(--display-ink, #f4efe6);
      font: 700 var(--fab-word-size, 22px) var(--font-display, 'Syne'), sans-serif;
      letter-spacing: -0.02em;
      text-align: right;
      cursor: pointer;
      opacity: 0;
      transform: translateY(14px);
      transition: transform .5s var(--ease-spring, ease), opacity .25s, color .2s;
      transition-delay: calc(var(--i) * 40ms);
    }
    :host(.open) .word { opacity: 1; transform: none; }
    .word:hover:not(:disabled), .word:focus-visible { color: var(--fab-hover, var(--amber)); outline: none; }
    .word:disabled { opacity: .4; cursor: default; }
    @media (pointer: coarse) { .word { min-height: 44px; } }
    @media (prefers-reduced-motion: reduce) { .scrim, .fab, .word { transition: none; } }
  `,
  template: `
    <div class="scrim" aria-hidden="true" (click)="close(true)"></div>
    <div class="list" role="menu" [id]="id" [attr.aria-label]="ariaLabel()" (keydown)="key($event)">
      @for (a of actions(); track $index) {
        <button #word type="button" class="word" role="menuitem" tabindex="-1" [disabled]="a.disabled" [style.--i]="actions().length - 1 - $index"
                (click)="pick(a)">{{ a.label }}</button>
      }
    </div>
    <button #fab type="button" class="fab" aria-haspopup="menu" [attr.aria-expanded]="open()" [attr.aria-controls]="id"
            [attr.aria-label]="ariaLabel()" (click)="open() ? close(false) : show()">{{ icon() }}</button>
  `,
})
export class KometaFab {
  protected readonly id = `kometa-fab-${nextId++}`;
  readonly actions = input.required<KometaFabAction[]>();
  /** Names the button and its menu. */
  readonly ariaLabel = input('Actions');
  readonly icon = input('+');
  /** False pins it to the nearest positioned ancestor instead of the screen. */
  readonly fixed = input(true, { transform: booleanAttribute });
  readonly picked = output<KometaFabAction>();

  protected readonly open = signal(false);
  private readonly fab = viewChild.required<ElementRef<HTMLButtonElement>>('fab');
  private readonly words = viewChildren<ElementRef<HTMLButtonElement>>('word');
  private readonly injector = inject(Injector);

  show(): void {
    this.open.set(true);
    afterNextRender(() => this.enabled()[this.enabled().length - 1]?.focus(), { injector: this.injector });
  }

  close(refocus: boolean): void {
    if (!this.open()) return;
    this.open.set(false);
    if (refocus) this.fab().nativeElement.focus();
  }

  protected pick(a: KometaFabAction): void {
    this.close(true);
    this.picked.emit(a);
  }

  private enabled(): HTMLButtonElement[] {
    return this.words().map((w) => w.nativeElement).filter((b) => !b.disabled);
  }

  protected key(e: KeyboardEvent): void {
    const els = this.enabled(), n = els.length, at = els.indexOf(document.activeElement as HTMLButtonElement);
    const to: Record<string, number> = { ArrowDown: (at + 1) % n, ArrowUp: (at - 1 + n) % n, Home: 0, End: n - 1 };
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(true); }
    else if (e.key === 'Tab') this.close(false);
    else if (e.key in to && n) { e.preventDefault(); els[to[e.key]].focus(); }
  }
}
