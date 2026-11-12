import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import {
  KometaButton, KometaLink, KometaMeter, KometaPerson, KometaRating, KometaShare, KometaShareSegment, KometaSlot, KometaSlots,
  KometaStars, KometaSteps, KometaTag, KometaToggle, KometaWords,
} from 'kometa-ui';

/** The welcome page: a comet over a starfield, live components, and the way in. */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KometaButton, KometaLink, KometaMeter, KometaPerson, KometaRating, KometaShare, KometaSlots, KometaStars, KometaSteps,
    KometaTag, KometaToggle, KometaWords,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  /** How many component pages the docs have, for the stats strip. */
  readonly count = input(0);
  readonly screens = input<{ id: string; label: string; about: string }[]>([]);

  protected readonly accents = [
    { name: 'Amber', value: '#FFBF00' }, { name: 'Mint', value: '#3ECF8E' }, { name: 'Sky', value: '#54A9EB' },
    { name: 'Iris', value: '#A78BFA' }, { name: 'Rose', value: '#F472B6' },
  ];
  protected readonly accent = signal(this.accents[0].value);

  protected readonly slots: KometaSlot[] = [
    { value: '10:00', label: '10:00' }, { value: '10:30', label: '10:30', disabled: true }, { value: '11:00', label: '11:00' },
    { value: '11:30', label: '11:30', note: 'last' },
  ];
  protected readonly slot = signal('11:00');
  protected readonly reminders = signal(true);
  protected readonly rating = signal(5);
  protected readonly range = signal('week');
  protected readonly share: KometaShareSegment[] = [
    { label: 'Haircut', value: 62, text: '62', color: 'var(--amber)' },
    { label: 'Colour', value: 31, text: '31', color: 'var(--violet)' },
    { label: 'Beard', value: 9, text: '9', color: 'var(--green)' },
  ];
  protected readonly principles = [
    { glyph: '◎', title: 'Standalone, OnPush, signals', text: 'Import one component and use it. No module, no zone, two-way models.',
      code: `<k-toggle [(checked)]="on" />` },
    { glyph: '◐', title: 'Light and dark from tokens', text: 'Every colour is a CSS custom property, with a light and a dark column.',
      code: `--amber: #7B93FF;` },
    { glyph: '◇', title: 'Restyle without a fight', text: 'Every component reads the tokens and its own custom properties, so you restyle it without !important.',
      code: `k-button { --kbtn-radius: 6px; }` },
    { glyph: '♿', title: 'Accessible by default', text: 'Real buttons, labelled inputs, roving focus and live regions, tested in specs.',
      code: `ariaLabel="Time slot"` },
  ];
}
