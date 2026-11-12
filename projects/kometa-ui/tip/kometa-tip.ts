import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, Injectable, OnDestroy, effect, inject, input } from '@angular/core';
import { KometaAnimation, injectKometaMotion, kometaAnimationName } from 'kometa-ui/motion';

let nextId = 0;

const CSS = `
.kometa-tip {
  inset: auto; margin: 0; box-sizing: border-box; width: max-content; max-width: min(var(--tip-max-width, 260px), calc(100vw - 16px)); padding: 9px 14px 9px 13px;
  border: 1px solid var(--glass-line, rgba(244, 239, 230, .14)); border-left: 2px solid var(--display-ink, var(--text, #f4efe6)); border-radius: var(--tip-radius, 4px 12px 12px 4px);
  background: var(--tip-bg, var(--glass-drawer, var(--bg, #1c1a16))); color: var(--text, #e8e2d6); backdrop-filter: blur(14px);
  box-shadow: 0 10px 26px rgba(0, 0, 0, .4); font-size: var(--tip-font-size, 13px); line-height: 1.35; overflow: visible;
  animation: var(--k-anim, k-m-scale) var(--k-motion-dur, 240ms) var(--k-motion-ease, var(--ease-spring, ease)) backwards;
}
.kometa-tip b { display: block; color: var(--display-ink, var(--text, #f4efe6)); font-weight: 600; overflow-wrap: anywhere; }
.kometa-tip span { display: block; margin-top: 1px; color: var(--muted, #8e8678); font-size: 12.5px; overflow-wrap: anywhere; }
@media (prefers-reduced-motion: reduce) { .kometa-tip { animation: none; } }
`;

/** The one tooltip element, in the browser's top layer so no drawer, table or modal clips or covers it. */
@Injectable({ providedIn: 'root' })
export class KometaTipHost {
  private readonly doc = inject(DOCUMENT);
  private el: HTMLElement | null = null;
  private owner: HTMLElement | null = null;
  private lastHide = 0;
  private leaveTimer: ReturnType<typeof setTimeout> | undefined;

  /** Whether a tip was on screen a moment ago: moving between neighbours skips the pause. */
  get warm(): boolean {
    return !!this.owner || Date.now() - this.lastHide < 400;
  }

  show(host: HTMLElement, title: string, sub: string | null | undefined, animation?: string): void {
    const el = this.element();
    const anim = kometaAnimationName(animation);
    if (anim) el.style.setProperty('--k-anim', anim); else el.style.removeProperty('--k-anim');
    clearTimeout(this.leaveTimer);
    this.release();
    this.owner = host;
    const id = el.id;
    host.setAttribute('aria-describedby', [host.getAttribute('aria-describedby'), id].filter(Boolean).join(' '));
    el.replaceChildren();
    const b = this.doc.createElement('b');
    b.textContent = title;
    el.append(b);
    if (sub) {
      const s = this.doc.createElement('span');
      s.textContent = sub;
      el.append(s);
    }
    // ponytail: the Popover API is baseline since 2024; an older engine draws the tip in flow, unplaced.
    try { el.showPopover?.(); } catch { /* already open */ }
    this.place(host, el);
  }

  hide(host: HTMLElement): void {
    if (this.owner === host) this.close();
  }

  /** Hides after a moment, so the pointer can cross the gap onto the tip and stay there (WCAG 1.4.13). */
  hideSoon(host: HTMLElement): void {
    if (this.owner !== host) return;
    clearTimeout(this.leaveTimer);
    this.leaveTimer = setTimeout(() => this.hide(host), 150);
  }

  isShownFor(host: HTMLElement): boolean {
    return this.owner === host;
  }

  private close(): void {
    clearTimeout(this.leaveTimer);
    this.release();
    this.lastHide = Date.now();
    try { this.el?.hidePopover?.(); } catch { /* already closed */ }
  }

  /** Prefers the right of the host (the sidebar's rail), then the left, then below. */
  private place(host: HTMLElement, el: HTMLElement): void {
    const b = host.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const pad = 8;
    const vw = this.doc.defaultView?.innerWidth ?? 1024;
    const vh = this.doc.defaultView?.innerHeight ?? 768;
    let x = b.right + 10;
    let y = b.top + b.height / 2 - h / 2;
    if (x + w > vw - pad) x = b.left - 10 - w;
    if (x < pad) {
      x = Math.max(pad, Math.min(b.left + b.width / 2 - w / 2, vw - pad - w));
      y = b.bottom + 8;
      if (y + h > vh - pad) y = b.top - 8 - h;
    }
    el.style.left = `${Math.round(x)}px`;
    el.style.top = `${Math.round(Math.max(pad, Math.min(y, vh - pad - h)))}px`;
  }

  private release(): void {
    if (!this.owner || !this.el) return;
    const rest = (this.owner.getAttribute('aria-describedby') ?? '').split(' ').filter((t) => t && t !== this.el!.id);
    if (rest.length) this.owner.setAttribute('aria-describedby', rest.join(' '));
    else this.owner.removeAttribute('aria-describedby');
    this.owner = null;
  }

  private element(): HTMLElement {
    if (this.el) return this.el;
    const style = this.doc.createElement('style');
    style.textContent = CSS;
    this.doc.head.append(style);
    const el = this.doc.createElement('div');
    el.className = 'kometa-tip';
    el.id = `kometa-tip-${nextId++}`;
    el.setAttribute('role', 'tooltip');
    el.setAttribute('popover', 'manual');
    this.doc.body.append(el);
    // One listener for every tip on the page: anything scrolling moves the host out from under the tip.
    this.doc.addEventListener('scroll', () => { if (this.owner) this.close(); }, true);
    // The tip is hoverable: the pointer on it keeps it, leaving it hides it, and Escape hides it wherever focus is.
    el.addEventListener('pointerenter', () => clearTimeout(this.leaveTimer));
    el.addEventListener('pointerleave', () => { if (this.owner) this.close(); });
    this.doc.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.owner) this.close(); });
    return (this.el = el);
  }
}

/**
 * A tooltip in place of the browser's slow, unstyled `title` box. Put it on the element that carries the meaning:
 *
 *     <button [kometaTip]="S.delete" aria-label="…">…</button>
 *     <span [kometaTip]="shop.name" [kometaTipSub]="S.shopNameFull">…</span>
 *
 * It is the lab's Note: a small glass card beside the element, an ink rule on its edge, a name and an optional second
 * line. A hover shows it after a short pause (none when you are moving between neighbours), keyboard focus shows it
 * at once, and Escape, leaving, scrolling and pressing all hide it. The pointer can move onto the tip and it stays
 * while hovered (WCAG 1.4.13). A null or empty `kometaTip` shows nothing, so
 * `[kometaTip]="collapsed() ? name : null"` is a tooltip only while collapsed. The tip is described-by on the element
 * while it is up, but it does not name it: an icon-only control still needs its own `aria-label`. A phone shows it on a
 * tap of a plain element (a cell, a label); a button or link already does what it says, so a tap runs it and no tip appears.
 * Spec: kometa-tip.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-10.html (Note).
 *
 */
@Directive({
  selector: '[kometaTip]',
  host: {
    '(pointerenter)': 'onEnter($event)',
    '(pointerleave)': 'leave()',
    '(pointerdown)': 'onDown($event)',
    '(focusin)': 'onFocus($event)',
    '(focusout)': 'hide()',
    '(keydown.escape)': 'hide()',
    '[attr.data-tip]': 'kometaTip() || null',
  },
})
export class KometaTip implements OnDestroy {
  readonly kometaTip = input<string | null | undefined>('');
  readonly kometaTipSub = input<string | null | undefined>('');
  /** Milliseconds of hover before the tip shows (none when moving between neighbours). */
  readonly kometaTipDelay = input(380);
  /** The motion it appears with: a preset from KOMETA_ANIMATIONS or your own keyframes name. */
  readonly kometaTipAnimation = input<KometaAnimation | ''>('');

  private readonly host = inject(KometaTipHost);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    injectKometaMotion();
    // The words may change while the tip is up (a sort arrow turning over): follow them, or go if they went.
    effect(() => {
      const text = this.kometaTip();
      this.kometaTipSub();
      if (!this.host.isShownFor(this.el)) return;
      if (text) this.show();
      else this.hide();
    });
  }

  ngOnDestroy(): void {
    this.hide();
  }

  protected onEnter(e: PointerEvent): void {
    if (e.pointerType === 'touch' || !this.kometaTip()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.show(), this.host.warm ? 0 : this.kometaTipDelay());
  }

  protected onDown(e: PointerEvent): void {
    if (e.pointerType !== 'touch') { this.hide(); return; }
    if (!this.kometaTip() || this.el.closest('a, button')) return;
    this.show();
    this.timer = setTimeout(() => this.hide(), 2000);
  }

  protected onFocus(e: FocusEvent): void {
    // A mouse click focuses a button too; only the keyboard's focus is a request to explain it.
    if (!this.kometaTip() || !(e.target as HTMLElement).matches?.(':focus-visible')) return;
    this.show();
  }

  protected leave(): void {
    clearTimeout(this.timer);
    this.host.hideSoon(this.el);
  }

  protected hide(): void {
    clearTimeout(this.timer);
    this.host.hide(this.el);
  }

  private show(): void {
    const text = this.kometaTip();
    if (!text) return;
    this.host.show(this.el, text, this.kometaTipSub(), this.kometaTipAnimation());
  }
}
