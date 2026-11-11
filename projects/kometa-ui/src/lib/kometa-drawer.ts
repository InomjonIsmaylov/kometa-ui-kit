import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, OnDestroy, TemplateRef, ViewEncapsulation,
  afterNextRender, computed, contentChild, effect, inject, booleanAttribute, input, model, output, signal, untracked, viewChild,
} from '@angular/core';

import { KometaMotion } from './kometa-motion';

let nextDrawerToken = 0;

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A panel that slides in from the right (or up from the bottom) over a dimmed page, on the browser's own modal
 * `<dialog>`: the page behind goes inert, Escape and the dark area are the browser's, and the top layer keeps a
 * drawer above any card.
 *
 *     <k-drawer [visible]="open()" (visibleChange)="open.set($event)" [position]="…" styleClass="kometa-sheet">…
 *
 * `visible` is two-way. `dismissible` (default true) lets a click on the dark area close it; Escape has its own switch,
 * `closeOnEscape` (default true), so a sheet can refuse the dark area mid-save and still hand its save to the page on Escape. `opened` fires once it is open, `closing` as the close starts and `kometaSheetClosed` once the
 * leave slide has finished, so a page can drop the sheet without cutting the animation. A `<ng-template #headless>` child
 * replaces the plain content box (the staff drawers draw their own head). `ariaLabel` names a sheet whose heading cannot.
 *
 * A drawer with `styleClass="kometa-sheet"` is also a history entry: browser-back closes it instead of leaving the page,
 * and a programmatic close pops that entry only while it is still the current one. On show focus goes to the sheet's first
 * `h2` (made `tabindex="-1"`), else its first control, and the dialog is named by that heading; on close it returns to the
 * opener while focus is still in the sheet or lost. The heading, not the first field, so a phone's keyboard stays down.
 * Spec: kometa-drawer.spec.ts.
 */
@Component({
  selector: 'k-drawer',
  hostDirectives: [{ directive: KometaMotion, inputs: ['animation'] }],
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  styles: `
    :where(dialog.kdrawer) {
      position: fixed; inset: auto; margin: 0; padding: 0; border: 0; max-width: none; max-height: none; height: auto; overflow: hidden; /* UA dialog is height: fit-content */
      color: var(--text); background: var(--glass-drawer, var(--card));
    }
    :where(dialog.kdrawer[open]) { display: flex; flex-direction: column; }
    :where(dialog.kdrawer-right) { top: 0; right: 0; bottom: 0; width: min(var(--drawer-width, 460px), calc(100vw - 24px)); max-width: calc(100vw - 24px); }
    :where(dialog.kdrawer-left) { top: 0; left: 0; bottom: 0; width: min(var(--drawer-width, 460px), calc(100vw - 24px)); max-width: calc(100vw - 24px); }
    :where(dialog.kdrawer-bottom) { left: 0; right: 0; bottom: 0; width: 100%; max-height: var(--drawer-max-height, 90dvh); }
    :where(.kdrawer-content) { flex: 1; min-height: 0; overflow-y: auto; }
    .kdrawer:focus { outline: none; }
    .kdrawer::backdrop { background: var(--drawer-backdrop, rgba(0, 0, 0, .55)); }
    :root[data-theme='light'] .kdrawer::backdrop { background: var(--drawer-backdrop, rgba(26, 28, 28, .32)); }
    @media (prefers-color-scheme: light) { :root:not([data-theme='dark']) .kdrawer::backdrop { background: var(--drawer-backdrop, rgba(26, 28, 28, .32)); } }
    :root:has(dialog.kdrawer[open]) { overflow: hidden; }

    @keyframes kd-enter-right { from { transform: translateX(calc(100% + 24px)); } }
    @keyframes kd-leave-right { to { transform: translateX(calc(100% + 24px)); } }
    @keyframes kd-enter-left { from { transform: translateX(calc(-100% - 24px)); } }
    @keyframes kd-leave-left { to { transform: translateX(calc(-100% - 24px)); } }
    @keyframes kd-enter-bottom { from { transform: translateY(calc(100% + 24px)); } }
    @keyframes kd-leave-bottom { to { transform: translateY(calc(100% + 24px)); } }
    @keyframes kd-back-in { from { opacity: 0; } }
    @keyframes kd-back-out { to { opacity: 0; } }
    :where(dialog.kdrawer-right[open]) { animation: var(--k-anim, kd-enter-right) var(--drawer-dur, 480ms) var(--drawer-ease, ease); }
    :where(dialog.kdrawer-left[open]) { animation: var(--k-anim, kd-enter-left) var(--drawer-dur, 480ms) var(--drawer-ease, ease); }
    :where(dialog.kdrawer-bottom[open]) { animation: var(--k-anim, kd-enter-bottom) var(--drawer-dur, 480ms) var(--drawer-ease, ease); }
    :where(dialog.kdrawer-right.kdrawer-leaving) { animation: var(--k-anim-out, kd-leave-right) var(--drawer-dur, 480ms) cubic-bezier(.32, 0, .22, 1) var(--k-anim-dir, normal) forwards; }
    :where(dialog.kdrawer-left.kdrawer-leaving) { animation: var(--k-anim-out, kd-leave-left) var(--drawer-dur, 480ms) cubic-bezier(.32, 0, .22, 1) var(--k-anim-dir, normal) forwards; }
    :where(dialog.kdrawer-bottom.kdrawer-leaving) { animation: var(--k-anim-out, kd-leave-bottom) var(--drawer-dur, 480ms) cubic-bezier(.32, 0, .22, 1) var(--k-anim-dir, normal) forwards; }
    :where(dialog.kdrawer[open])::backdrop { animation: kd-back-in 240ms ease; }
    :where(dialog.kdrawer.kdrawer-leaving)::backdrop { animation: kd-back-out 240ms ease forwards; }
    @media (prefers-reduced-motion: reduce) {
      :where(dialog.kdrawer[open]), :where(dialog.kdrawer.kdrawer-leaving),
      :where(dialog.kdrawer[open])::backdrop, :where(dialog.kdrawer.kdrawer-leaving)::backdrop { animation: none; }
    }
  `,
  template: `
    @if (alive()) {
      <dialog #dlg class="kdrawer" [class.kdrawer-right]="position() === 'right'" [class.kdrawer-left]="position() === 'left'"
              [class.kdrawer-bottom]="position() === 'bottom'" [class.kdrawer-leaving]="leaving()" [class]="styleClass()"
              [attr.role]="headless() ? 'presentation' : 'dialog'" [attr.aria-label]="ariaLabel() || null"
              [style]="motion.vars()" [style.width]="style()?.width ?? null" (cancel)="onCancel($event)" (click)="onBackdrop($event)">
        <div class="kdrawer-content">
          @if (headless(); as tpl) {
            <ng-container [ngTemplateOutlet]="tpl" />
          } @else {
            <ng-content />
          }
        </div>
      </dialog>
    }
  `,
})
export class KometaDrawer implements OnDestroy {
  /** In place of the slide from its edge: a preset from KOMETA_ANIMATIONS or your own keyframes name, played in and reversed out. */
  protected readonly motion = inject(KometaMotion);
  readonly visible = model(false);
  readonly position = input<'right' | 'bottom' | 'left'>('right');
  readonly dismissible = input(true, { transform: booleanAttribute });
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly styleClass = input('');
  readonly style = input<{ width?: string } | null>(null);
  readonly ariaLabel = input('');
  readonly opened = output<void>();
  readonly closing = output<void>();
  /** Fires once the leave slide has finished. */
  readonly kometaSheetClosed = output<void>();

  protected readonly headless = contentChild('headless', { read: TemplateRef });
  protected readonly alive = signal(false);
  protected readonly leaving = signal(false);

  private readonly dlg = viewChild<ElementRef<HTMLDialogElement>>('dlg');
  private readonly injector = inject(Injector);
  private readonly sheet = computed(() => this.styleClass().split(/\s+/).includes('kometa-sheet'));
  private readonly token = ++nextDrawerToken;
  private wasOpen = false;
  private leaveSent = true;
  private leaveTimer = 0;
  /** True from the push until this drawer has closed or popped that entry. */
  private ownsEntry = false;
  /** What had focus when the sheet opened; it gets focus back on close. */
  private opener: HTMLElement | null = null;
  /** Watches a sheet that showed without its heading, until the heading arrives or the sheet closes. */
  private headingWatch: MutationObserver | null = null;

  constructor() {
    effect(() => {
      const open = this.visible();
      untracked(() => (open ? this.show() : this.hide()));
    });
    window.addEventListener('popstate', this.onPopState);
  }

  ngOnDestroy(): void {
    window.removeEventListener('popstate', this.onPopState);
    window.clearTimeout(this.leaveTimer);
    this.stopAwaiting();
    this.release();
    this.restoreFocus();
  }

  private show(): void {
    window.clearTimeout(this.leaveTimer);
    this.leaveSent = false;
    this.wasOpen = true;
    this.leaving.set(false);
    this.alive.set(true);
    const active = document.activeElement;
    this.opener ??= active instanceof HTMLElement && active !== document.body ? active : null;
    if (this.sheet() && !this.ownsEntry) {
      history.pushState({ kometaSheet: this.token }, '');
      this.ownsEntry = true;
    }
    afterNextRender(() => {
      const d = this.dlg()?.nativeElement;
      if (!d || !this.visible()) return;
      // ponytail: a DOM without showModal (the test one) gets the `open` attribute and no top layer.
      if (!d.open) d.showModal ? d.showModal() : d.setAttribute('open', '');
      this.opened.emit();
      this.focusIn();
    }, { injector: this.injector });
  }

  private hide(): void {
    if (!this.wasOpen) return;
    this.stopAwaiting();
    this.release();
    this.closing.emit();
    this.leaving.set(true);
    // The leave class is on the dialog only after this render, so look for the slide then.
    afterNextRender(() => this.afterLeave(), { injector: this.injector });
  }

  /** Wait for the slide, then tell the page. No slide to wait for (the test DOM, reduced motion) answers at once; the timeout is the net. */
  private afterLeave(): void {
    if (this.leaveSent) return;
    const el = this.dlg()?.nativeElement;
    // The leave is the side's kd-leave-* slide, or the chosen motion reversed (--k-anim-out).
    const out = el ? getComputedStyle(el).getPropertyValue('--k-anim-out').trim() : '';
    const isLeave = (name: string) => name.toLowerCase().includes('leave') || (!!out && name === out);
    const sliding = el?.getAnimations?.().some((a) => isLeave((a as CSSAnimation).animationName ?? '')) ?? false;
    if (!sliding || !el) {
      this.finishLeave();
      return;
    }
    const finish = (event?: AnimationEvent) => {
      if (event && (event.target !== el || !isLeave(event.animationName))) return;
      el.removeEventListener('animationend', finish);
      this.finishLeave();
    };
    el.addEventListener('animationend', finish);
    this.leaveTimer = window.setTimeout(() => finish(), 800);
  }

  private finishLeave(): void {
    if (this.leaveSent) return;
    this.leaveSent = true;
    window.clearTimeout(this.leaveTimer);
    if (this.visible()) return;
    const d = this.dlg()?.nativeElement;
    if (d?.open) d.close ? d.close() : d.removeAttribute('open');
    this.alive.set(false);
    this.leaving.set(false);
    this.kometaSheetClosed.emit();
    // After the close and after the page has reacted to it: behind an open modal the page is inert, and an opener
    // that is disabled while its sheet is up (Add service) only takes focus once the page has re-enabled it.
    afterNextRender(() => this.restoreFocus(), { injector: this.injector });
  }

  /** Escape: the browser would close the dialog at once, cutting the slide, so it is refused and answered here. */
  protected onCancel(event: Event): void {
    event.preventDefault();
    if (this.closeOnEscape()) this.visible.set(false);
  }

  /** A click that lands on the dialog itself is on the dark area: the content box fills the panel. */
  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dlg()?.nativeElement && this.dismissible()) this.visible.set(false);
  }

  private focusIn(): void {
    const d = this.dlg()?.nativeElement;
    const content = d?.querySelector<HTMLElement>('.kdrawer-content');
    if (!d || !content) return;
    const heading = content.querySelector<HTMLElement>('h2');
    this.nameDialog(d, heading);
    if (!heading) this.awaitHeading(content);
    // showModal may park focus on the scrolling box itself; that is not a choice anyone made.
    const at = document.activeElement;
    if (content.contains(at) && at !== content) return;
    if (heading && !heading.hasAttribute('tabindex')) heading.tabIndex = -1;
    (heading ?? content.querySelector<HTMLElement>(FOCUSABLE))?.focus();
  }

  /** Named by its heading, done before focus moves in so a screen reader announces the name. A name the sheet already has stays. */
  private nameDialog(root: HTMLElement, heading: HTMLElement | null): void {
    if (this.headless()) return;
    root.setAttribute('aria-modal', 'true');
    if (!heading || root.hasAttribute('aria-labelledby')) return;
    heading.id ||= `kometa-sheet-title-${this.token}`;
    root.setAttribute('aria-labelledby', heading.id);
  }

  /** A sheet that shows before its heading (the pay drawer's "loading", then its QR) is named and focused once the `h2` arrives. */
  private awaitHeading(content: HTMLElement): void {
    this.stopAwaiting();
    this.headingWatch = new MutationObserver(() => {
      if (!content.querySelector('h2')) return;
      this.stopAwaiting();
      this.focusIn();
    });
    this.headingWatch.observe(content, { childList: true, subtree: true });
  }

  private stopAwaiting(): void {
    this.headingWatch?.disconnect();
    this.headingWatch = null;
  }

  /** Only while focus is in the sheet or lost to `<body>`: a click outside may have put it elsewhere. */
  private restoreFocus(): void {
    const opener = this.opener;
    this.opener = null;
    const active = document.activeElement;
    // A sheet destroyed with its dialog open (the parent drops it on close) leaves focus on the page's `main`, which is not a choice either.
    const lost = !active || active === document.body || !!active.closest('.kdrawer') || !active.matches(FOCUSABLE);
    if (opener?.isConnected && lost) opener.focus();
  }

  /** Pops the entry this sheet pushed, and only when that entry is still current. */
  private release(): void {
    if (!this.ownsEntry) return;
    const state = history.state as { kometaSheet?: number } | null;
    this.ownsEntry = false;
    if (state?.kometaSheet === this.token) history.back();
  }

  private readonly onPopState = (): void => {
    if (!this.ownsEntry) return;
    // The browser already removed the entry. Closing must not call history.back() again.
    this.ownsEntry = false;
    this.visible.set(false);
  };
}
