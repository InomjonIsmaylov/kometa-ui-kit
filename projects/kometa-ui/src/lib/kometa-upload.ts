import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * The upload zone, as round 10's "Fill" draws it: a dashed box that fills from the bottom
 * (`scaleY(progress)`) behind the file's name and size, a Syne 44px tabular percentage, then the
 * status line and one quiet text button.
 *
 * It is a display. The page runs the real upload and feeds `progress` and `state`; the button only
 * says `(action)` (cancel while running, retry once failed: the page decides which).
 *
 * Spec: kometa-upload.spec.ts, design in
 * docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.
 */
@Component({
  selector: 'k-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-state]': 'state()' },
  styles: `
    /* Fill (round 10): the whole zone is the bar. It fills from the bottom under a big percentage. */
    :host {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-width: 0;
      min-height: var(--upload-min-height, 112px);
      padding: 12px;
      border: 1px dashed var(--glass-line, var(--border));
      border-radius: var(--upload-radius, 18px);
      overflow: hidden;
      text-align: center;
      color: var(--text);
    }
    :host > :not(.track) { position: relative; z-index: 1; }
    .file {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: center;
      gap: 4px 10px;
      max-width: 100%;
      margin: 0;
      font-size: 14px;
    }
    .file b { min-width: 0; font-weight: 700; overflow-wrap: anywhere; }
    .file span { color: var(--muted); font-variant-numeric: tabular-nums; }
    .fig {
      margin: 0;
      color: var(--display-ink, var(--text));
      font-family: var(--font-display, 'Syne', sans-serif);
      font-weight: 700;
      font-size: var(--upload-fig-size, 44px);
      line-height: 1;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
    }
    .fig span { color: var(--muted); font-size: 20px; }
    .track { position: absolute; inset: 0; pointer-events: none; }
    .track i {
      display: block;
      height: 100%;
      background: var(--upload-fill, var(--glass-drawer, var(--glass-line)));
      border-top: 1px solid var(--display-ink, var(--text));
      transform-origin: bottom;
      transition: transform 200ms linear;
    }
    :host([data-state='done']) { border-style: solid; }
    :host([data-state='failed']) { border-color: var(--error); }
    :host([data-state='failed']) .track i { border-top-color: var(--error); }
    .foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 4px 16px; }
    .status { margin: 0; min-width: 0; color: var(--muted); font-size: 12px; overflow-wrap: anywhere; }
    :host([data-state='failed']) .status { color: var(--error); }
    button {
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--display-ink, var(--text));
      font: inherit;
      font-size: 13px;
      cursor: pointer;
      box-shadow: inset 0 -1px 0 var(--glass-line, var(--border));
    }
    button:hover { box-shadow: inset 0 -1px 0 var(--display-ink, var(--text)); }
    button:focus-visible { outline: 2px solid var(--amber); outline-offset: 3px; border-radius: 2px; }
    @media (pointer: coarse) { button { min-height: 44px; min-width: 44px; } }
    @media (prefers-reduced-motion: reduce) { .track i { transition: none; } }
  `,
  template: `
    <p class="file">
      <b>{{ name() }}</b>
      @if (sizeLabel()) {
        <span>{{ sizeLabel() }}</span>
      }
    </p>
    @if (showPercent()) {
      <p class="fig" aria-hidden="true"><b>{{ percent() }}</b><span> %</span></p>
    }
    <div
      class="track"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-label]="ariaLabel() || name()"
      [attr.aria-valuenow]="percent()"
      [attr.aria-valuetext]="statusLabel() || percent() + ' %'"
      [attr.aria-busy]="state() === 'running' ? 'true' : null"
    >
      <i [style.transform]="'scaleY(' + shown() + ')'"></i>
    </div>
    @if (statusLabel() || actionLabel()) {
      <div class="foot">
        <p class="status" role="status">{{ statusLabel() }}</p>
        @if (actionLabel()) {
          <button type="button" (click)="action.emit()">{{ actionLabel() }}</button>
        }
      </div>
    }
  `,
})
export class KometaUpload {
  /** The file's name, shown bold. */
  readonly name = input.required<string>();
  /** Already formatted by the page ("1.8 MB"); the piece never formats a size. */
  readonly sizeLabel = input('');
  /** 0 to 1. A `done` upload always draws full. */
  readonly progress = input(0);
  readonly state = input<'idle' | 'running' | 'done' | 'failed'>('idle');
  /** The muted line ("Yuklandi"); in the error colour when `state` is `failed`. */
  readonly statusLabel = input('');
  /** The quiet text button ("Bekor qilish", "Qayta urinish"). Empty means no button. */
  readonly actionLabel = input('');
  /** The progressbar's accessible name; the file name when empty. */
  readonly ariaLabel = input('');
  /** `false` hides the big percentage (the fill and the progressbar remain). */
  readonly showPercent = input(true);
  /** The button was pressed. Cancel or retry is the page's decision. */
  readonly action = output<void>();

  protected readonly shown = computed(() => {
    if (this.state() === 'done') return 1;
    const p = this.progress();
    return Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
  });
  protected readonly percent = computed(() => Math.round(this.shown() * 100));
}
