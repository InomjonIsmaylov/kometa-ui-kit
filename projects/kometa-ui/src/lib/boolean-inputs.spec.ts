import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaCode } from 'kometa-ui/code';
import { KometaConfirm } from 'kometa-ui/confirm';
import { KometaDrawer } from 'kometa-ui/drawer';
import { KometaLink } from 'kometa-ui/link';
import { KometaMenu } from 'kometa-ui/menu';
import { KometaMeter } from 'kometa-ui/meter';
import { KometaPop } from 'kometa-ui/pop';
import { KometaReveal } from 'kometa-ui/reveal';
import { KometaSlots } from 'kometa-ui/slots';
import { KometaStepper } from 'kometa-ui/stepper';
import { KometaTable } from 'kometa-ui/table';
import { KometaToggle } from 'kometa-ui/toggle';
import { KometaUpload } from 'kometa-ui/upload';
import { KometaWords } from 'kometa-ui/words';

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
