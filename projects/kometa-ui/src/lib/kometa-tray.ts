import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injectable, inject, input, signal, viewChild } from '@angular/core';
import { Subject } from 'rxjs';

/** One question for the tray. A `key` marks it as another dialog's, which the tray ignores. */
export interface KometaConfirmation {
  key?: string;
  header?: string;
  message?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  acceptButtonProps?: { severity?: string };
  accept?: () => void;
  reject?: () => void;
}

/** Asks the page's `<k-tray>` a question. */
@Injectable({ providedIn: 'root' })
export class KometaConfirmationService {
  private readonly asks = new Subject<KometaConfirmation | null>();
  readonly requireConfirmation$ = this.asks.asObservable();

  confirm(confirmation: KometaConfirmation): this {
    this.asks.next(confirmation);
    return this;
  }
}

import { KometaMotion } from './kometa-motion';

let nextId = 0;

/**
 * The page's one confirm question, drawn as the lab's Tray: two wide answers rise from the bottom of the screen on a
 * phone and sit as a centred card on a desktop. It listens to
 * `KometaConfirmationService`, so every `confirm({ header, message, acceptLabel, rejectLabel, acceptButtonProps, accept,
 * reject })` call in the app is unchanged. A `danger` accept is red and goes first; the other answer is quiet under it.
 *
 * It is a native modal `<dialog>`: the browser makes the rest of the page inert, traps Tab, closes on Escape and draws
 * the top layer, and the exit is a CSS transition (an engine without `allow-discrete` simply closes at once). Escape,
 * a click on the dark area and the quiet answer all call `reject`. Focus goes to the heading, not to either answer.
 * A request carrying a `key` belongs to some other dialog and is ignored.
 * Spec: kometa-tray.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-10.html (Tray).
 *
 */
@Component({
  selector: 'k-tray',
  hostDirectives: [{ directive: KometaMotion, inputs: ['animation'] }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: contents; }
    dialog {
      box-sizing: border-box; width: min(var(--tray-width, 380px), calc(100vw - 20px)); margin: auto; padding: 22px 20px 18px;
      display: flex; flex-direction: column; gap: 10px;
      border: 1px solid var(--glass-line, var(--border)); border-radius: var(--tray-radius, 22px); color: var(--text);
      background: var(--glass-drawer, var(--bg)); backdrop-filter: blur(18px); box-shadow: 0 12px 30px rgba(0, 0, 0, .4);
      text-align: center; translate: 0 0; opacity: 1;
      transition: translate 420ms var(--ease-spring, ease), opacity 200ms ease, display 420ms allow-discrete, overlay 420ms allow-discrete;
    }
    /* The display: flex above beats the UA's display: none on a closed dialog; without this a closed tray sits
       invisible below the page and gives every screen a page scroll of its own. */
    dialog:not([open]) { translate: 0 24px; opacity: 0; display: none; }
    @starting-style { dialog[open] { translate: 0 24px; opacity: 0; } }
    /* animation set: it plays over the rise; the way out runs while the display transition still holds the box */
    dialog.m[open] { animation: var(--k-anim) var(--k-motion-dur, 420ms) var(--k-motion-ease, var(--ease-spring, ease)) backwards; }
    dialog.m:not([open]) { animation: var(--k-anim-out) 300ms ease var(--k-anim-dir) forwards; }
    dialog::backdrop { transition: opacity 280ms ease, display 280ms allow-discrete, overlay 280ms allow-discrete; }
    @media (max-width: 639px) {
      dialog { width: auto; max-width: 560px; margin: auto 10px 10px; }
      dialog:not([open]) { translate: 0 110%; }
      @starting-style { dialog[open] { translate: 0 110%; } }
    }
    h2 { margin: 0; color: var(--display-ink, var(--text)); font-family: var(--font-display, 'Syne', sans-serif); font-size: 20px; line-height: 1.25; letter-spacing: -0.02em; outline: 0; overflow-wrap: anywhere; }
    p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.45; overflow-wrap: anywhere; }
    .acts { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
    button {
      min-height: 50px; padding: 0 20px; border: 1px solid transparent; border-radius: var(--tray-button-radius, 16px); font: inherit; font-size: 15px; font-weight: 600; cursor: pointer;
      transition: transform 160ms var(--ease-spring, ease), background-color 160ms ease;
    }
    button:active { transform: scale(.98); }
    button:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    .go { background: var(--display-ink, var(--text)); color: var(--bg); }
    .go:not(.danger):hover { opacity: .88; }
    .go.danger { background: transparent; color: var(--error); border-color: var(--error); }
    .go.danger:hover { background: color-mix(in srgb, var(--error) 14%, transparent); }
    .stay { background: transparent; color: var(--text); border-color: var(--glass-line, var(--border)); }
    .stay:hover { border-color: var(--text); }
    @media (prefers-reduced-motion: reduce) { dialog, dialog::backdrop, button { transition: none; } dialog.m { animation: none !important; } }
  `,
  template: `
    <dialog #dlg class="k-tray" [class.m]="!!motion.animation()" [style]="motion.vars()" role="alertdialog" [attr.aria-labelledby]="id" (cancel)="onCancel($event)" (click)="onBackdrop($event)">
      @if (ask(); as c) {
        <h2 #head [id]="id" tabindex="-1">{{ c.header || c.message }}</h2>
        @if (c.header && c.message) { <p>{{ c.message }}</p> }
        <div class="acts">
          <button type="button" class="go" [class.danger]="c.acceptButtonProps?.severity === 'danger'" (click)="answer(true)">{{ c.acceptLabel }}</button>
          <button type="button" class="stay" (click)="answer(false)">{{ c.rejectLabel }}</button>
        </div>
      }
    </dialog>
  `,
})
export class KometaTray {
  /** The motion the card arrives with (and leaves with, reversed): a preset from KOMETA_ANIMATIONS or your own keyframes name. */
  protected readonly motion = inject(KometaMotion);
  /** `false` keeps the question open when the dark area is clicked (Escape and the quiet answer still reject). */
  readonly backdropClose = input(true);
  protected readonly id = `kometa-tray-${nextId++}`;
  protected readonly ask = signal<KometaConfirmation | null>(null);
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');
  private readonly head = viewChild<ElementRef<HTMLElement>>('head');

  constructor() {
    const sub = inject(KometaConfirmationService).requireConfirmation$.subscribe((c) => {
      if (c?.key) return;
      this.ask.set(c);
      const dlg = this.dlg().nativeElement;
      // ponytail: jsdom has no showModal; the attribute is what the specs read.
      if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
      queueMicrotask(() => setTimeout(() => this.head()?.nativeElement.focus({ preventScroll: true })));
    });
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }

  protected answer(accepted: boolean): void {
    const c = this.ask();
    this.hide();
    if (accepted) c?.accept?.();
    else c?.reject?.();
  }

  protected onCancel(e: Event): void {
    e.preventDefault();
    this.answer(false);
  }

  /** A click on the dialog box itself, outside its content, is the dark area. */
  protected onBackdrop(e: MouseEvent): void {
    if (this.backdropClose() && e.target === this.dlg().nativeElement) this.answer(false);
  }

  private hide(): void {
    const dlg = this.dlg().nativeElement;
    // The words stay until the next question, so the exit transition has something to draw.
    if (dlg.close) dlg.close(); else dlg.removeAttribute('open');
  }
}
