import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, booleanAttribute, computed, effect, inject, input, model, signal, untracked, viewChild,
} from '@angular/core';

export interface KometaPhoto {
  url: string;
  thumbUrl: string;
  alt?: string;
}

/**
 * The full-screen photo viewer: a native modal `<dialog>` (top layer,
 * Escape and focus handling free) with a dark backdrop, the photo large, the count ("3 / 12"), a toolbar (rotate left and right, zoom out and in, download), a Close word, Arrow keys
 * and a swipe to move, and a strip of thumbnails when there is more than one. `open` is two-way; `index` says which photo.
 * Spec: kometa-photos.spec.ts.
 */
@Component({
  selector: 'kometa-photos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    dialog {
      width: 100vw; max-width: none; height: 100dvh; max-height: none; margin: 0; padding: 0; border: 0; overflow: hidden;
      background: var(--photos-bg, rgba(8, 8, 10, .94)); color: var(--photos-ink, #fff);
    }
    dialog[open] { display: flex; flex-direction: column; }
    dialog::backdrop { background: #000; }
    .top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 16px; }
    .count { font-variant-numeric: tabular-nums; opacity: .8; }
    .tools { display: flex; align-items: center; gap: 8px; }
    .close, .arrow, .tool {
      min-height: 44px; min-width: 44px; padding: 0 14px; border: 0; border-radius: 22px; background: rgba(255, 255, 255, .12);
      color: inherit; font: inherit; font-weight: 700; cursor: pointer;
    }
    .tool { display: inline-flex; align-items: center; justify-content: center; padding: 0; font-size: 20px; line-height: 1; text-decoration: none; }
    .tool[aria-disabled='true'] { opacity: .4; cursor: default; }
    .close:hover, .arrow:hover, .tool:hover { background: rgba(255, 255, 255, .22); }
    /* A definite track, so the photo's percentage height has something to resolve against: with an auto track a
       tall photo kept its own height and ran off the bottom of the stage. */
    .stage { position: relative; display: grid; grid-template: minmax(0, 1fr) / minmax(0, 1fr); flex: 1; min-height: 0; place-items: center; touch-action: pan-y; }
    /* Clipped, so a zoomed or turned photo stays inside the stage and never paints over the toolbar (Close
       included) or the strip. */
    .stage { container-type: size; overflow: hidden; }
    /* On its side the photo is laid out in the swapped box (the stage's height as its width), so once turned it
       fills the stage instead of standing 1.8x too tall for it. */
    .stage img.big.sideways { width: 100cqh; height: 100cqw; max-width: none; }
    .stage img.big { width: 100%; height: 100%; object-fit: contain; }
    .arrow { position: absolute; top: 50%; translate: 0 -50%; font-size: 24px; line-height: 1; }
    .arrow.prev { left: 12px; }
    .arrow.next { right: 12px; }
    .strip { display: flex; gap: 8px; justify-content: center; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); overflow-x: auto; }
    .th { flex: none; width: var(--photos-thumb, 56px); height: var(--photos-thumb, 56px); padding: 0; border: 2px solid transparent; border-radius: var(--photos-thumb-radius, 10px); overflow: hidden; opacity: .6; background: none; cursor: pointer; }
    .th.on { border-color: var(--photos-ink, #fff); opacity: 1; }
    .th img { width: 100%; height: 100%; object-fit: cover; display: block; }
    @media (max-width: 767.98px) { .arrow { display: none; } }
  `,
  template: `
    <dialog #dlg [attr.aria-label]="ariaLabel() || null" (cancel)="$event.preventDefault(); open.set(false)" (keydown)="onKey($event)">
      @if (open() && current(); as p) {
        <div class="top">
          <span class="count" aria-live="polite">{{ index() + 1 }} / {{ photos().length }}</span>
          <div class="tools">
            <button type="button" class="tool" [attr.aria-label]="rotateLeftLabel()" (click)="turn(-90)">&#8634;</button>
            <button type="button" class="tool" [attr.aria-label]="rotateRightLabel()" (click)="turn(90)">&#8635;</button>
            <button type="button" class="tool" [attr.aria-label]="zoomOutLabel()" [attr.aria-disabled]="zoom() <= MIN_ZOOM || null" (click)="zoomBy(-0.25)">&minus;</button>
            <button type="button" class="tool" [attr.aria-label]="zoomInLabel()" [attr.aria-disabled]="zoom() >= MAX_ZOOM || null" (click)="zoomBy(0.25)">+</button>
            @if (downloadable()) { <a class="tool" [href]="p.url" download target="_blank" rel="noopener" [attr.aria-label]="downloadLabel()">&#8595;</a> }
            <button type="button" class="close" (click)="open.set(false)">{{ closeLabel() }}</button>
          </div>
        </div>
        <div class="stage" (pointerdown)="down($event)" (pointerup)="up($event)">
          <img class="big" [class.sideways]="sideways()" [src]="p.url" [alt]="p.alt ?? ''" [style.transform]="'rotate(' + rotation() + 'deg) scale(' + zoom() + ')'" />
          @if (photos().length > 1) {
            <button type="button" class="arrow prev" [attr.aria-label]="prevLabel()" (click)="go(-1)">&#8249;</button>
            <button type="button" class="arrow next" [attr.aria-label]="nextLabel()" (click)="go(1)">&#8250;</button>
          }
        </div>
        @if (photos().length > 1 && thumbs()) {
          <div class="strip">
            @for (t of photos(); track $index) {
              <button type="button" class="th" [class.on]="$index === index()" [attr.aria-current]="$index === index()" (click)="index.set($index)">
                <img [src]="t.thumbUrl" [alt]="t.alt ?? ''" />
              </button>
            }
          </div>
        }
      }
    </dialog>
  `,
})
export class KometaPhotos {
  readonly photos = input<KometaPhoto[]>([]);
  readonly open = model(false);
  readonly index = model(0);
  readonly closeLabel = input('Close');
  readonly prevLabel = input('Previous');
  readonly nextLabel = input('Next');
  readonly ariaLabel = input('');
  readonly rotateLeftLabel = input('Rotate left');
  readonly rotateRightLabel = input('Rotate right');
  readonly zoomOutLabel = input('Zoom out');
  readonly zoomInLabel = input('Zoom in');
  readonly downloadLabel = input('Download');
  /** The download link in the toolbar. */
  readonly downloadable = input(true, { transform: booleanAttribute });
  /** The strip of thumbnails under the photo. */
  readonly thumbs = input(true, { transform: booleanAttribute });

  protected readonly MIN_ZOOM = 0.5;
  protected readonly MAX_ZOOM = 3;
  protected readonly zoom = signal(1);
  protected readonly rotation = signal(0);
  protected readonly sideways = computed(() => Math.abs(this.rotation() / 90) % 2 === 1);

  protected readonly current = computed(() => this.photos()[this.index()] ?? null);
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');
  private readonly injector = inject(Injector);
  private startX = 0;

  constructor() {
    // A new photo, or the viewer reopening, starts upright and at 1x.
    effect(() => {
      this.index();
      this.open();
      untracked(() => { this.zoom.set(1); this.rotation.set(0); });
    });
    effect(() => {
      const d = this.dlg().nativeElement;
      const on = this.open();
      // ponytail: a test DOM without showModal gets the plain `open` attribute.
      try {
        if (on && !d.open) d.showModal ? d.showModal() : d.setAttribute('open', '');
        else if (!on && d.open) d.close ? d.close() : d.removeAttribute('open');
      } catch { /* already in that state */ }
      if (on) afterNextRender(() => d.querySelector<HTMLElement>('.close')?.focus(), { injector: this.injector });
    });
  }

  protected turn(deg: number): void {
    this.rotation.update((r) => r + deg);
  }

  protected zoomBy(step: number): void {
    this.zoom.update((z) => Math.min(this.MAX_ZOOM, Math.max(this.MIN_ZOOM, z + step)));
  }

  protected go(step: number): void {
    const n = this.photos().length;
    if (n > 0) this.index.set((this.index() + step + n) % n);
  }

  protected onKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') { e.preventDefault(); this.go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); this.go(1); }
  }

  protected down(e: PointerEvent): void {
    this.startX = e.clientX;
  }

  protected up(e: PointerEvent): void {
    const dx = e.clientX - this.startX;
    if (Math.abs(dx) > 50) this.go(dx < 0 ? 1 : -1);
  }
}
