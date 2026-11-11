import {
  ChangeDetectionStrategy, Component, ComponentRef, DestroyRef, ViewContainerRef, computed, effect, inject, signal, untracked, viewChild,
} from '@angular/core';
import { KometaButton, KometaSelect } from 'kometa-ui';
import { Lang, highlight } from '../docs';
import { PlaySource, PlayStore } from './store';

const STARTERS: { label: string; value: string; src: PlaySource }[] = [
  {
    label: 'Visit card', value: 'card', src: {
      html: `<div class="card">
  <k-person name="Malika Karimova" meta="Haircut · today 14:00" />
  <k-tag [tone]="paid() ? 'done' : 'wait'">{{ paid() ? 'Paid' : 'Waiting' }}</k-tag>
  <k-button [label]="paid() ? 'Refund' : 'Charge 80 000'" [severity]="paid() ? 'secondary' : null"
            (clicked)="paid.set(!paid())" />
</div>`,
      ts: `import { signal } from '@angular/core';

export class Demo {
  readonly paid = signal(false);
}`,
      css: `.card {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
  padding: 16px; border: 1px solid var(--border); border-radius: 16px; background: var(--card);
}`,
    },
  },
  {
    label: 'Sign-up form', value: 'form', src: {
      html: `<form class="form" (submit)="$event.preventDefault(); send()">
  <k-field label="Name" [(value)]="name" placeholder="Your name" [error]="name().length ? '' : 'Tell us your name'" />
  <k-toggle [(checked)]="news" onLabel="Send me news" offLabel="No news, thanks" />
  <k-button type="submit" label="Create account" [loading]="busy()" />
</form>
<k-toast [items]="toasts()" (dismiss)="toasts.set([])" animation="spring" />`,
      ts: `import { signal } from '@angular/core';
import { KometaToastItem } from 'kometa-ui';

export class Demo {
  readonly name = signal('');
  readonly news = signal(true);
  readonly busy = signal(false);
  readonly toasts = signal<KometaToastItem[]>([]);

  send(): void {
    this.busy.set(true);
    setTimeout(() => {
      this.busy.set(false);
      this.toasts.set([{ id: Date.now(), kind: 'success', text: \`Welcome, \${this.name() || 'stranger'}!\`, life: 3000 }]);
    }, 900);
  }
}`,
      css: `.form { display: grid; gap: 14px; max-width: 360px; }`,
    },
  },
  {
    label: 'Motion lab', value: 'motion', src: {
      html: `<div class="lab">
  <k-select [options]="kinds" [(value)]="kind" pill prefix="Animation:" ariaLabel="Animation" />
  <k-button label="Open" severity="secondary" (clicked)="pop.toggle($event)" />
  <k-pop #pop ariaLabel="Demo" [width]="240" [animation]="kind()">
    <p style="margin: 12px">Arrived with {{ kind() }}.</p>
  </k-pop>
</div>
<div class="tiles">
  @for (k of kinds; track k.value; let i = $index) {
    <span class="tile" [kAnimate]="k.value" [kAnimateDelay]="i * 60">{{ k.label }}</span>
  }
</div>`,
      ts: `import { signal } from '@angular/core';
import { KOMETA_ANIMATIONS } from 'kometa-ui';

export class Demo {
  readonly kinds = KOMETA_ANIMATIONS.filter((a) => a !== 'none').map((a) => ({ label: a, value: a }));
  readonly kind = signal('flip');
}`,
      css: `.lab { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; }
.tile { padding: 18px 0; text-align: center; border: 1px solid var(--border); border-radius: 12px; background: var(--card); }`,
    },
  },
];

const LABELS = { html: 'HTML', ts: 'TypeScript', css: 'CSS' } as const;
type File = keyof typeof LABELS;
const LANG: Record<File, Lang> = { html: 'html', ts: 'ts', css: 'scss' };

/**
 * Edit a template, a class and its CSS and see it run: the code is compiled in the browser by Angular's JIT compiler,
 * which is loaded with this page only. Everything in kometa-ui is in scope.
 */
@Component({
  selector: 'app-playground',
  imports: [KometaButton, KometaSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './playground.scss',
  template: `
    <div class="pg-bar">
      <k-select [options]="starters" [value]="starter()" (valueChange)="load($event)" pill prefix="Start from:" ariaLabel="Starter" />
      <span class="pg-state" [class.bad]="error()" aria-live="polite">{{ status() }}</span>
      <k-button label="Reset" size="small" severity="secondary" (clicked)="load(starter())" />
    </div>
    <div class="pg">
      <section class="pg-edit" aria-label="Code">
        <div class="pg-tabs" role="tablist" aria-label="File">
          @for (f of files; track f) {
            <button type="button" role="tab" [attr.aria-selected]="file() === f" (click)="file.set(f)">{{ labels[f] }}</button>
          }
        </div>
        <div class="pg-code">
          <pre aria-hidden="true" #hl><code [innerHTML]="coloured()"></code></pre>
          <textarea spellcheck="false" autocapitalize="off" [attr.aria-label]="labels[file()] + ' source'" [value]="text()"
                    (input)="edit($any($event.target).value)" (scroll)="hl.scrollTop = $any($event.target).scrollTop; hl.scrollLeft = $any($event.target).scrollLeft"
                    (keydown)="key($event)"></textarea>
        </div>
      </section>
      <section class="pg-out" aria-label="Preview">
        <div class="pg-stage"><ng-container #slot /></div>
        @if (error(); as e) { <pre class="pg-error" role="alert">{{ e }}</pre> }
      </section>
    </div>
  `,
})
export class Playground {
  private readonly store = inject(PlayStore);
  private readonly slot = viewChild.required('slot', { read: ViewContainerRef });
  protected readonly starters = [...STARTERS.map(({ label, value }) => ({ label, value })), { label: 'your code', value: 'yours' }];
  protected readonly files = Object.keys(LABELS) as File[];
  protected readonly labels = LABELS;
  protected readonly file = signal<File>('html');
  protected readonly src = signal<PlaySource>(this.store.source() ?? STARTERS[0].src);
  protected readonly starter = signal(this.store.source() ? 'yours' : 'card');
  protected readonly text = computed(() => this.src()[this.file()]);
  protected readonly coloured = computed(() => highlight(this.text() + '\n', LANG[this.file()]));
  protected readonly error = signal('');
  protected readonly status = signal('Loading the compiler…');
  private ref?: ComponentRef<unknown>;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Re-run a moment after typing stops; the first run waits for the compiler chunk.
    effect(() => {
      const src = this.src();
      untracked(() => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.run(src), this.ref ? 450 : 0);
      });
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected load(value: string): void {
    const s = STARTERS.find((x) => x.value === value);
    this.starter.set(value);
    if (s) this.src.set(s.src);
    else if (this.store.source()) this.src.set(this.store.source()!);
  }

  protected edit(value: string): void {
    this.src.update((s) => ({ ...s, [this.file()]: value }));
    this.starter.set('yours');
    this.store.set(this.src());
  }

  /** Tab indents instead of leaving the editor; Shift+Tab still leaves it. */
  protected key(e: KeyboardEvent): void {
    if (e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    const t = e.target as HTMLTextAreaElement;
    t.setRangeText('  ', t.selectionStart, t.selectionEnd, 'end');
    this.edit(t.value);
  }

  private async run(src: PlaySource): Promise<void> {
    try {
      const { compile } = await import('./runtime');
      const cmp = compile(src.html, src.ts, src.css);
      this.ref?.destroy();
      this.slot().clear();
      this.ref = this.slot().createComponent(cmp);
      this.ref.changeDetectorRef.detectChanges();
      this.error.set('');
      this.status.set('Running ✓');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
      this.status.set('Error, showing the last good run');
    }
  }
}
