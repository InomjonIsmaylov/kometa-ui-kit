import { KometaMotion } from 'kometa-ui/motion';
import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, booleanAttribute, computed, effect, forwardRef, inject, input, signal, viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { dateAt } from 'kometa-ui/time-value';

const pad = (n: number) => String(n).padStart(2, '0');
let nextId = 0;

/**
 * A time of day. The time is a figure with a hairline under it, like `k-date`; it opens a glass list of times in
 * the browser's top layer (so a drawer cannot clip it), flips above when there is no room below and is kept in the
 * viewport. `step` is the minutes between the times listed (15 unless set); a time already held that is off the grid
 * (09:07) is listed too, so nothing is lost by opening it. Arrow keys move over the list, Enter picks, Escape, Tab, a
 * click outside, resize and scroll close it. With `clearable` a held time can be taken away again (the value is `null`).
 *
 * It holds a `Date` (only the hours and minutes matter, the date part is fixed by `dateAt`), so `[ngModel]`, `(ngModelChange)` and `[formControl]` replace it one for one.
 * Spec: kometa-time.spec.ts.
 *
 */
@Component({
  selector: 'k-time',
  hostDirectives: [{ directive: KometaMotion, inputs: ['animation'] }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => KometaTime), multi: true }],
  host: {
    '(window:resize)': 'close(false)',
    '(window:scroll)': 'close(false)',
    '(document:pointerdown)': 'onOutside($event)',
  },
  styles: `
    :host { position: relative; display: inline-block; }
    .btn {
      position: relative; display: inline-flex; align-items: baseline; padding: 0 0 6px; border: 0; background: none;
      color: var(--display-ink, var(--text)); font: inherit; cursor: pointer;
    }
    .btn::after {
      content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: var(--display-ink, var(--text));
      transform: scaleX(.3); transform-origin: left; opacity: .5; transition: transform 420ms var(--ease-spring, ease), opacity 200ms ease;
    }
    .btn:hover:not(:disabled)::after, .btn[aria-expanded='true']::after, .btn:focus-visible::after { transform: none; opacity: 1; }
    .btn:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    .btn:disabled { opacity: .4; cursor: not-allowed; }
    .fig { min-height: 28px; font-family: var(--font-display, inherit); font-size: 24px; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
    .fig.empty { color: var(--muted); }
    @media (pointer: coarse) { .btn { min-height: 44px; align-items: center; } }
    .pop {
      inset: auto; width: 272px; max-width: calc(100vw - 16px); max-height: min(340px, calc(100vh - 16px)); margin: 0; padding: 10px;
      overflow-y: auto; overscroll-behavior: contain;
      border: 1px solid var(--glass-line); border-radius: 18px; color: var(--text);
      background: var(--glass-drawer, var(--bg)); backdrop-filter: blur(24px) saturate(1.2); box-shadow: 0 12px 30px rgba(0, 0, 0, .35);
      animation: var(--k-anim, k-m-drop) var(--k-motion-dur, 320ms) var(--k-motion-ease, var(--ease-spring, ease)) backwards;
    }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; }
    .t {
      height: 38px; border: 0; border-radius: 10px; background: none; color: var(--text);
      font: inherit; font-size: 14px; font-variant-numeric: tabular-nums; cursor: pointer; transition: box-shadow 200ms ease;
    }
    @media (pointer: coarse) { .t { height: 44px; } }
    .t:hover { box-shadow: inset 0 0 0 1px var(--glass-line); }
    .t:focus-visible { outline: 2px solid var(--amber); outline-offset: -2px; }
    .t[aria-pressed='true'] { color: var(--display-ink, var(--text)); font-weight: 600; box-shadow: inset 0 0 0 2px var(--display-ink, var(--text)); }
    .clear {
      display: block; margin: 8px auto 0; padding: 6px 4px; border: 0; background: none; color: var(--muted); font: inherit; font-size: 13px;
      text-decoration: underline; text-decoration-color: var(--glass-line); text-underline-offset: 4px; cursor: pointer;
    }
    .clear:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) { .btn::after, .pop, .t { transition: none; } .pop { animation: none; } }
  `,
  template: `
    <button #btn class="btn" type="button" aria-haspopup="dialog" [attr.id]="inputId() || null" [disabled]="isDisabled()"
            [attr.aria-label]="ariaLabel() || null" [attr.aria-expanded]="open()" [attr.aria-controls]="id" (click)="toggle()">
      <span class="fig" [class.empty]="!value()">{{ shown() }}</span>
    </button>
    <div #pop class="pop" popover="manual" [style]="motion.vars()" role="dialog" [id]="id" [attr.aria-label]="ariaLabel() || null"
         [style.left.px]="x()" [style.top.px]="y()" (keydown)="onKey($event)">
      @if (open()) {
        <div class="grid" role="group">
          @for (t of times(); track t.key) {
            <button class="t" type="button" [attr.aria-pressed]="t.selected" (click)="pick(t)">{{ t.key }}</button>
          }
        </div>
        @if (clearable() && value()) {
          <button class="clear" type="button" (click)="clear()">{{ clearLabel() }}</button>
        }
      }
    </div>
  `,
})
export class KometaTime implements ControlValueAccessor {
  /** The open motion: a preset from KOMETA_ANIMATIONS or your own keyframes name (see KometaMotion). */
  protected readonly motion = inject(KometaMotion);
  protected readonly id = `kometa-time-${nextId++}`;
  readonly step = input(15);
  readonly ariaLabel = input('');
  readonly inputId = input('');
  /** Shown when there is no value. */
  readonly placeholder = input('—');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly value = signal<Date | null>(null);
  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly open = signal(false);
  protected readonly x = signal(0);
  protected readonly y = signal(0);
  protected readonly shown = computed(() => {
    const v = this.value();
    return v ? `${pad(v.getHours())}:${pad(v.getMinutes())}` : this.placeholder();
  });
  /** The day in steps; a held time that is off the grid is slotted in so it stays visible and selected. */
  protected readonly times = computed(() => {
    const step = Math.max(1, Math.floor(this.step()));
    const v = this.value();
    const held = v ? v.getHours() * 60 + v.getMinutes() : -1;
    const mins: number[] = [];
    for (let m = 0; m < 24 * 60; m += step) mins.push(m);
    if (held >= 0 && !mins.includes(held)) mins.push(held);
    mins.sort((a, b) => a - b);
    return mins.map((m) => ({ key: `${pad(Math.floor(m / 60))}:${pad(m % 60)}`, h: Math.floor(m / 60), min: m % 60, selected: m === held }));
  });

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  private readonly btn = viewChild.required<ElementRef<HTMLButtonElement>>('btn');
  private readonly pop = viewChild.required<ElementRef<HTMLElement>>('pop');
  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      const on = this.open();
      const pop = this.pop().nativeElement;
      // ponytail: the Popover API is baseline since 2024; an older engine shows the list in flow.
      try {
        if (on) pop.showPopover?.(); else pop.hidePopover?.();
      } catch { /* already in that state */ }
      if (on) afterNextRender(() => this.place(), { injector: this.injector });
    });
  }

  protected toggle(): void {
    this.open.update((o) => !o);
  }

  /** The list exists after the render that opened it, so it is measured, scrolled to the held time and focused then. */
  private place(): void {
    const b = this.btn().nativeElement.getBoundingClientRect();
    const pop = this.pop().nativeElement;
    const l = pop.getBoundingClientRect();
    const pad8 = 8;
    const below = b.bottom + 8 + l.height <= window.innerHeight - pad8;
    this.y.set(below ? b.bottom + 8 : Math.max(pad8, b.top - 8 - l.height));
    this.x.set(Math.max(pad8, Math.min(b.left, window.innerWidth - pad8 - l.width)));
    const all = this.buttons();
    const hit = all.find((t) => t.getAttribute('aria-pressed') === 'true') ?? all.find((t) => t.textContent!.trim() === '09:00') ?? all[0];
    hit?.focus({ preventScroll: true });
    // Not scrollIntoView: it would also scroll the drawer the field sits in, and the list is placed from the figure.
    if (hit) pop.scrollTop = hit.offsetTop - pop.clientHeight / 2 + hit.offsetHeight / 2;
  }

  private buttons(): HTMLButtonElement[] {
    return [...this.pop().nativeElement.querySelectorAll<HTMLButtonElement>('.t')];
  }

  protected pick(t: { h: number; min: number }): void {
    const next = dateAt(t.h, t.min);
    this.value.set(next);
    this.onChange(next);
    this.close(true);
  }

  protected clear(): void {
    this.value.set(null);
    this.onChange(null);
    this.close(true);
  }

  protected close(refocus: boolean): void {
    if (!this.open()) return;
    this.open.set(false);
    this.onTouched();
    if (refocus) this.btn().nativeElement.focus();
  }

  protected onOutside(e: Event): void {
    if (this.open() && !(e.target instanceof Node && this.btn().nativeElement.parentElement!.contains(e.target))) this.close(false);
  }

  protected onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') { e.stopPropagation(); this.close(true); return; }
    if (e.key === 'Tab') { this.close(false); return; }
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 }[e.key];
    if (step === undefined) return;
    const all = this.buttons();
    const at = all.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    e.preventDefault();
    all[Math.min(all.length - 1, Math.max(0, at + step))].focus();
  }

  writeValue(value: Date | null | undefined): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
