import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, inject, input, model, output,
} from '@angular/core';

export interface KometaTreeNode {
  label: string;
  value?: unknown;
  children?: KometaTreeNode[];
}

/**
 * A tree drawn as columns: pick a word and its children slide in as the next column, each behind a hairline.
 * The chosen word in every column goes cream. `path` holds the chosen index per column.
 * Keys: Up/Down move in a column, Right opens a branch and steps into it, Left steps back.
 * Tests in kometa-tree.spec.ts.
 */
@Component({
  selector: 'k-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .cols { display: flex; gap: var(--tree-gap, 12px); overflow-x: auto; }
    ul {
      flex: none;
      min-width: var(--tree-col, 120px);
      margin: 0;
      padding: 0 0 0 10px;
      list-style: none;
      border-left: 1px solid var(--glass-line);
      animation: slide-in .4s var(--ease-spring, ease);
    }
    ul:first-child { border-left: 0; padding-left: 0; }
    button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      width: 100%;
      padding: 3px 0;
      border: 0;
      background: none;
      color: var(--muted);
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: var(--tree-size, 13px);
      font-weight: 700;
      text-align: left;
      cursor: pointer;
      transition: color .2s;
    }
    button:hover, button.on { color: var(--display-ink, #f4efe6); }
    button[aria-expanded]::after { content: '›'; color: var(--muted); }
    button:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; border-radius: 4px; }
    @media (pointer: coarse) { button { min-height: 44px; } }
    @keyframes slide-in { from { opacity: 0; transform: translateX(-10px); } }
    @media (prefers-reduced-motion: reduce) { ul { animation: none; } }
  `,
  template: `
    <div class="cols" role="group" [attr.aria-label]="ariaLabel() || null">
      @for (col of columns(); track col; let d = $index) {
        <ul>
          @for (n of col; track $index; let i = $index) {
            <li>
              <button type="button" [class.on]="path()[d] === i"
                      [attr.aria-expanded]="n.children?.length ? path()[d] === i : null"
                      [attr.aria-current]="!n.children?.length && path()[d] === i ? 'true' : null"
                      (click)="pick(d, i)" (keydown)="key($event, d, i)">{{ n.label }}</button>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class KometaTree {
  readonly nodes = input.required<KometaTreeNode[]>();
  /** The chosen index in each column, outermost first. */
  readonly path = model<number[]>([]);
  readonly ariaLabel = input('');
  /** A word was picked, branch or leaf. */
  readonly picked = output<KometaTreeNode>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);

  /** The root, then the children of each chosen branch. */
  protected readonly columns = computed(() => {
    const cols = [this.nodes()];
    for (const i of this.path()) {
      const kids = cols[cols.length - 1][i]?.children;
      if (!kids?.length) break;
      cols.push(kids);
    }
    return cols;
  });

  protected pick(d: number, i: number): void {
    this.path.set([...this.path().slice(0, d), i]);
    this.picked.emit(this.columns()[d][i]);
  }

  protected key(e: KeyboardEvent, d: number, i: number): void {
    const n = this.columns()[d][i];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') this.focus(d, i + (e.key === 'ArrowDown' ? 1 : -1));
    else if (e.key === 'ArrowRight' && n.children?.length) {
      this.pick(d, i);
      afterNextRender(() => this.focus(d + 1, 0), { injector: this.injector });
    } else if (e.key === 'ArrowLeft' && d > 0) this.focus(d - 1, this.path()[d - 1]);
    else return;
    e.preventDefault();
  }

  private focus(d: number, i: number): void {
    const col = this.host.nativeElement.querySelectorAll('ul')[d];
    (col?.querySelectorAll('button')[i] as HTMLElement | undefined)?.focus();
  }
}
