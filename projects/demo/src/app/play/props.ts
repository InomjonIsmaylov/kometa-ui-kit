import {
  ChangeDetectionStrategy, Component, ComponentRef, DOCUMENT, OutputEmitterRef, Type, ViewContainerRef, computed, effect, inject, input, signal,
  untracked, viewChild,
} from '@angular/core';
import {
  KometaBanner, KometaButton, KometaCheck, KometaChip, KometaField, KometaHeading, KometaMeter, KometaNumber, KometaPerson, KometaQuiet,
  KometaRating, KometaSearch, KometaSelect, KometaSkeleton, KometaStars, KometaStepper, KometaSteps, KometaTag, KometaToggle, KometaUpload,
  KometaWait, KometaWords, KometaSlider, KometaHue, KometaRules, KometaInplace, KometaBadge, KometaContext, KometaCrumbs, KometaAvatars,
  KometaTree, KometaKeys, KometaCountdown, KometaTally, KometaSwipe, KometaFab,
} from 'kometa-ui';
import { highlight } from '../docs';
import { PlayStore } from './store';

type Value = string | number | boolean | null | undefined | object;

/** How one component is played with: sample values for what it needs, the choices of its union inputs, its content. */
export interface PlayConfig {
  type: Type<unknown>;
  seed?: Record<string, Value>;
  choices?: Record<string, readonly (string | number | null)[]>;
  /** Text projected into the component, editable as "content". */
  content?: string;
  /** Inputs left out of the panel (plumbing such as ids and classes). */
  skip?: string[];
}

const CITIES = [{ label: 'Tashkent', value: 'tas' }, { label: 'Samarkand', value: 'skd' }, { label: 'Bukhara', value: 'bhk' }];
const ANIMATIONS = ['', 'fade', 'rise', 'drop', 'scale', 'zoom', 'spring', 'flip', 'blur'];
const ARIA = ['ariaLabel', 'ariaLabelledBy', 'ariaDescribedBy', 'styleClass', 'name', 'inputId', 'inputmode', 'autocomplete', 'headingId'];

export const PLAY: Record<string, PlayConfig> = {
  button: { type: KometaButton, seed: { label: 'Book a visit' }, choices: { severity: [null, 'secondary', 'danger'], size: [null, 'small'], iconPos: ['left', 'right'] }, skip: ['type'] },
  tag: { type: KometaTag, content: 'Paid', choices: { tone: ['now', 'wait', 'book', 'done', 'warn', 'error'] } },
  banner: { type: KometaBanner, content: 'Your shop is visible to clients again.', choices: { tone: ['info', 'ok', 'warn', 'error'], surface: ['bare', 'glass'], roleOverride: ['', 'status', 'alert'] } },
  meter: { type: KometaMeter, seed: { value: 12, label: 'Visits today' } },
  stars: { type: KometaStars, seed: { value: 4, label: 'Rating' } },
  rating: { type: KometaRating, seed: { value: 3, ariaLabel: 'Rate the visit' } },
  toggle: { type: KometaToggle, seed: { onLabel: 'Open today', offLabel: 'Closed today', ariaLabel: 'Open today' } },
  check: { type: KometaCheck, seed: { ariaLabel: 'Remember me' }, content: 'Remember me' },
  chip: { type: KometaChip, content: 'Paid' },
  person: { type: KometaPerson, seed: { name: 'Malika Karimova', meta: 'Haircut · today 14:00' }, choices: { size: ['sm', 'md', 'lg'], shape: ['disc', 'square'] } },
  quiet: { type: KometaQuiet, seed: { title: 'No visits yet', hint: 'Bookings for this day will show up here.' } },
  skeleton: { type: KometaSkeleton, choices: { shape: ['rows', 'card', 'line'] } },
  wait: { type: KometaWait, seed: { label: 'Loading visits' } },
  field: { type: KometaField, seed: { label: 'Name', placeholder: 'Your name' }, choices: { type: ['text', 'email', 'tel', 'url', 'password'], size: ['md', 'sm'] } },
  search: { type: KometaSearch, seed: { ariaLabel: 'Search clients', placeholder: 'Search clients' }, choices: { size: ['md', 'lg'] } },
  number: { type: KometaNumber, seed: { value: 80000, ariaLabel: 'Price' } },
  stepper: { type: KometaStepper, seed: { value: 2, ariaLabel: 'Guests' } },
  select: { type: KometaSelect, seed: { options: CITIES, placeholder: 'City', ariaLabel: 'City' }, skip: ['optionLabel', 'optionValue'], choices: { animation: ANIMATIONS } },
  words: { type: KometaWords, seed: { options: [{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }], value: 'day', ariaLabel: 'Period' } },
  steps: { type: KometaSteps, seed: { steps: ['Service', 'Day', 'Time', 'Done'], current: 2 } },
  upload: { type: KometaUpload, seed: { name: 'shop-photo.jpg', sizeLabel: '2.4 MB', progress: 40, state: 'running' }, choices: { state: ['idle', 'running', 'done', 'failed'] } },
  heading: { type: KometaHeading, seed: { title: 'Today' }, choices: { level: [2, 3, 4] } },
  slider: { type: KometaSlider, seed: { value: 12, unit: 'km', ariaLabel: 'Distance' } },
  hue: { type: KometaHue, seed: { ariaLabel: 'Shop colour' } },
  rules: {
    type: KometaRules,
    seed: { value: 'kometa1', rules: [{ label: '8 letters', test: '.{8}' }, { label: 'a number', test: '[0-9]' }, { label: 'a capital', test: '[A-Z]' }] },
  },
  inplace: { type: KometaInplace, seed: { value: 'Usta Barber', ariaLabel: 'Shop name' } },
  badge: { type: KometaBadge, seed: { count: 3 }, content: 'Inbox' },
  context: {
    type: KometaContext,
    seed: { items: [{ label: 'Reschedule', shortcut: 'R' }, { label: 'Duplicate', shortcut: 'Ctrl D' }, null, { label: 'Cancel visit', danger: true }] },
    content: 'Right-click here',
    choices: { animation: ANIMATIONS },
  },
  crumbs: { type: KometaCrumbs, seed: { items: [{ label: 'Shop' }, { label: 'Staff' }, { label: 'Anvar K.' }] } },
  avatars: { type: KometaAvatars, seed: { people: [{ name: 'Anvar K.' }, { name: 'Malika R.' }, { name: 'Aziz T.' }, { name: 'Dilnoza S.' }, { name: 'Bekzod U.' }] }, choices: { size: ['sm', 'md', 'lg'] } },
  tree: { type: KometaTree, seed: { nodes: [{ label: 'Hair', children: [{ label: 'Haircut' }, { label: 'Fade' }] }, { label: 'Beard', children: [{ label: 'Trim' }] }] } },
  keys: { type: KometaKeys, seed: { keys: 'Ctrl+Shift+P' }, choices: { play: ['hover', 'loop', 'off'] } },
  tally: { type: KometaTally, seed: { value: 1240, max: 2400, unit: 'visits' } },
  swipe: { type: KometaSwipe, seed: { rightLabel: 'Done', leftLabel: 'Cancel visit' }, content: 'Swipe this row' },
  fab: { type: KometaFab, seed: { actions: [{ label: 'New visit' }, { label: 'Block time' }, { label: 'Add client' }], fixed: false } },
  countdown: { type: KometaCountdown, seed: { duration: 30, label: 'to resend the code' } },
};

interface Def { inputs: Record<string, string | [string, ...unknown[]]>; outputs: Record<string, string>; selectors: string[][] }
interface Prop { name: string; prop: string; kind: 'bool' | 'num' | 'text' | 'choice' | 'data'; value: Value; initial: Value }

const attr = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * A live instance of one component with a control per input. Controls are made from the component's own metadata
 * and default values, so a new input shows up here by itself; union inputs get their choices from PLAY.
 */
@Component({
  selector: 'app-props',
  imports: [KometaButton, KometaField, KometaNumber, KometaSelect, KometaToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './props.scss',
  template: `
    <div class="pp">
      <div class="pp-stage" aria-label="Live component"><ng-container #slot /></div>
      <form class="pp-controls" aria-label="Inputs" (submit)="$event.preventDefault()">
        @if (config().content !== undefined) {
          <k-field label="content" size="sm" [value]="content()" (valueChange)="content.set($event)" />
        }
        @for (p of props(); track p.name) {
          @switch (p.kind) {
            @case ('bool') {
              <label class="pp-bool"><k-toggle [checked]="!!p.value" (checkedChange)="set(p, $event)" [ariaLabel]="p.name" /><code>{{ p.name }}</code></label>
            }
            @case ('num') {
              <label class="pp-row"><code>{{ p.name }}</code><k-number [value]="$any(p.value)" (valueChange)="set(p, $event ?? 0)" [ariaLabel]="p.name" buttons /></label>
            }
            @case ('choice') {
              <label class="pp-row"><code>{{ p.name }}</code>
                <k-select [options]="choiceOptions(p)" [value]="key(p.value)" (valueChange)="set(p, unkey($event))" [ariaLabel]="p.name" pill /></label>
            }
            @case ('text') {
              <k-field [label]="p.name" size="sm" [value]="$any(p.value) ?? ''" (valueChange)="set(p, $event)" />
            }
          }
        }
      </form>
    </div>
    <div class="pp-foot">
      <pre class="pp-code"><code [innerHTML]="coloured()"></code></pre>
      <div class="pp-acts">
        <k-button label="Copy" size="small" severity="secondary" (clicked)="copy()" />
        <k-button label="Open in playground" size="small" icon="→" iconPos="right" (clicked)="openPlayground()" />
      </div>
    </div>
  `,
})
export class PropsPanel {
  readonly config = input.required<PlayConfig>();
  private readonly slot = viewChild.required('slot', { read: ViewContainerRef });
  private readonly doc = inject(DOCUMENT);
  private readonly store = inject(PlayStore);
  protected readonly props = signal<Prop[]>([]);
  protected readonly content = signal('');
  private ref?: ComponentRef<unknown>;
  private text?: Text;
  private tag = '';

  constructor() {
    effect((onCleanup) => {
      const config = this.config();
      untracked(() => this.mount(config));
      onCleanup(() => this.ref?.destroy());
    });
    effect(() => { const c = this.content(); if (this.text) this.text.data = c; });
  }

  private mount(config: PlayConfig): void {
    const def = (config.type as unknown as { ɵcmp: Def }).ɵcmp;
    this.tag = def.selectors[0][0];
    this.content.set(config.content ?? '');
    this.text = this.doc.createTextNode(config.content ?? '');
    this.slot().clear();
    // Nothing projected unless there is content: an empty projection would hide a component's fallback (k-button's label).
    const ref = this.slot().createComponent(config.type, { projectableNodes: config.content !== undefined ? [[this.text]] : undefined });
    this.ref = ref;
    const inst = ref.instance as Record<string, unknown>;
    // Defaults first (a required input with nothing set throws when read), then the seed on top.
    const read = (prop: string): Value => { try { return (inst[prop] as () => Value)(); } catch { return undefined; } };
    const all = Object.entries(def.inputs).map(([name, d]) => ({ name, prop: Array.isArray(d) ? d[0] : d }));
    const defaults = new Map(all.map((i) => [i.name, read(i.prop)]));
    // Inputs a host directive brings (animation from KometaMotion) are not in the component's own metadata: a choice names them.
    for (const [name, opts] of Object.entries(config.choices ?? {})) {
      if (!defaults.has(name)) { all.push({ name, prop: name }); defaults.set(name, opts[0]); }
    }
    for (const [k, v] of Object.entries(config.seed ?? {})) ref.setInput(k, v);
    const skip = new Set([...(config.skip ?? []), ...ARIA.filter((a) => !(config.seed && a in config.seed))]);
    this.props.set(all.filter((i) => !skip.has(i.name)).map((i) => {
      const value = config.seed && i.name in config.seed ? config.seed[i.name] : defaults.get(i.name);
      const kind: Prop['kind'] = config.choices?.[i.name] ? 'choice'
        : typeof value === 'boolean' ? 'bool' : typeof value === 'number' ? 'num' : typeof value === 'string' ? 'text' : 'data';
      return { ...i, kind, value, initial: defaults.get(i.name) };
    }).filter((p) => p.kind !== 'data' || (config.seed && p.name in config.seed)));
    // A two-way input moved by the component itself (a toggle clicked) moves its control too.
    for (const [name, prop] of Object.entries(def.outputs)) {
      const out = inst[prop] as OutputEmitterRef<unknown>;
      if (name.endsWith('Change') && defaults.has(name.slice(0, -6))) {
        out.subscribe((v) => this.props.update((ps) => ps.map((p) => (p.name === name.slice(0, -6) ? { ...p, value: v as Value } : p))));
      }
    }
    ref.changeDetectorRef.detectChanges();
  }

  protected set(p: Prop, value: Value): void {
    this.ref?.setInput(p.name, value);
    this.props.update((ps) => ps.map((x) => (x === p ? { ...x, value } : x)));
  }

  protected choiceOptions(p: Prop): { label: string; value: string }[] {
    return this.config().choices![p.name].map((c) => ({ label: c === null ? 'null' : c === '' ? '(none)' : String(c), value: this.key(c) }));
  }
  /** k-select values are strings; null and numbers ride along as JSON. */
  protected key(v: Value): string { return JSON.stringify(v ?? null); }
  protected unkey(v: string): Value { return JSON.parse(v); }

  /** The usage, only with the inputs that differ from the defaults, plus the data it needs as class fields. */
  private readonly source = computed(() => {
    const data: string[] = [];
    const attrs = this.props().filter((p) => p.value !== p.initial && !(p.value === '' && p.initial === undefined)).map((p) => {
      if (p.kind === 'data') { data.push(`  readonly ${p.name} = ${JSON.stringify(p.value, null, 2).replace(/\n/g, '\n  ')};`); return `[${p.name}]="${p.name}"`; }
      if (p.value === true) return p.name;
      if (typeof p.value === 'string') return `${p.name}="${attr(p.value)}"`;
      return `[${p.name}]="${JSON.stringify(p.value)?.replace(/"/g, "'")}"`;
    });
    const open = `<${this.tag}${attrs.map((a) => (attrs.join(' ').length > 60 ? `\n  ${a}` : ` ${a}`)).join('')}`;
    const content = this.content();
    const html = content ? `${open}>${content}</${this.tag}>` : `${open} />`;
    const ts = `export class Demo {\n${data.join('\n')}\n}`;
    return { html, ts };
  });
  protected readonly coloured = computed(() => highlight(this.source().html, 'html'));

  protected async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.source().html);
  }

  protected openPlayground(): void {
    this.store.open({ ...this.source(), css: '' });
  }
}
