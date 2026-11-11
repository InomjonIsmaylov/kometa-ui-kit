import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaCode } from './kometa-code';
import { KometaConfirm } from './kometa-confirm';
import { KometaDrawer } from './kometa-drawer';
import { KometaLink } from './kometa-link';
import { KometaMenu } from './kometa-menu';
import { KometaMeter } from './kometa-meter';
import { KometaPop } from './kometa-pop';
import { KometaReveal } from './kometa-reveal';
import { KometaSlots } from './kometa-slots';
import { KometaStepper } from './kometa-stepper';
import { KometaTable } from './kometa-table';
import { KometaToggle } from './kometa-toggle';
import { KometaUpload } from './kometa-upload';
import { KometaWords } from './kometa-words';

// A bare attribute (`<k-table striped>`) arrives as '' and must read as true; "false" must read as false.
const cases: [Type<unknown>, string[]][] = [
  [KometaTable, ['striped', 'hoverable']],
  [KometaToggle, ['disabled']],
  [KometaStepper, ['disabled', 'readonly', 'touched']],
  [KometaCode, ['disabled']],
  [KometaMeter, ['showFigure']],
  [KometaSlots, ['clearable']],
  [KometaConfirm, ['asking']],
  [KometaUpload, ['showPercent']],
  [KometaReveal, ['showLabels']],
  [KometaMenu, ['disabled']],
  [KometaWords, ['disabled']],
  [KometaLink, ['flashValue']],
  [KometaDrawer, ['dismissible', 'closeOnEscape']],
  [KometaPop, ['focusOnShow']],
];

describe('boolean inputs accept a bare attribute', () => {
  for (const [type, names] of cases) {
    for (const name of names) {
      it(`${type.name}.${name}`, () => {
        const ref = TestBed.createComponent(type).componentRef;
        const read = () => (ref.instance as Record<string, () => unknown>)[name]();
        ref.setInput(name, '');
        expect(read()).toBe(true);
        ref.setInput(name, 'false');
        expect(read()).toBe(false);
      });
    }
  }
});
