import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaReorder } from './kometa-reorder';

@Component({
  imports: [KometaReorder],
  template: `<k-reorder [(items)]="items" (moved)="last = $event"><ng-template let-n>{{ n }}</ng-template></k-reorder>`,
})
class Host {
  items = signal(['Anvar', 'Dilnoza', 'Jasur', 'Madina']);
  last: { from: number; to: number } | null = null;
}

describe('KometaReorder', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-reorder') as HTMLElement;
    const grips = () => [...el.querySelectorAll<HTMLButtonElement>('.grip')];
    const texts = () => [...el.querySelectorAll('.body')].map((b) => b.textContent!.trim());
    const press = (i: number, key: string) => {
      grips()[i].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      f.detectChanges();
    };
    return { f, el, grips, texts, press };
  }

  it('draws a row per item with a named grip', () => {
    const { texts, grips } = render();
    expect(texts()).toEqual(['Anvar', 'Dilnoza', 'Jasur', 'Madina']);
    expect(grips()[1].getAttribute('aria-label')).toBe('Move Dilnoza');
  });

  it('moves a row with the keys and announces each step', () => {
    const { f, el, press } = render();
    press(0, ' ');
    expect(el.querySelector('[aria-live]')!.textContent).toContain('Anvar grabbed, position 1 of 4');
    press(0, 'ArrowDown');
    press(1, 'ArrowDown');
    expect(f.componentInstance.items()).toEqual(['Dilnoza', 'Jasur', 'Anvar', 'Madina']);
    expect(f.componentInstance.last).toEqual({ from: 1, to: 2 });
    press(2, ' ');
    expect(el.querySelector('[aria-live]')!.textContent).toBe('Anvar dropped at position 3 of 4.');
    expect(el.querySelector('li.lift')).toBeNull();
  });

  it('puts the row back on Escape', () => {
    const { f, press } = render();
    press(1, 'Enter');
    press(1, 'End');
    expect(f.componentInstance.items()).toEqual(['Anvar', 'Jasur', 'Madina', 'Dilnoza']);
    press(3, 'Escape');
    expect(f.componentInstance.items()).toEqual(['Anvar', 'Dilnoza', 'Jasur', 'Madina']);
  });

  it('ignores the arrows until a row is picked up', () => {
    const { f, press } = render();
    press(0, 'ArrowDown');
    expect(f.componentInstance.items()[0]).toBe('Anvar');
  });

  it('lifts the dragged row, slides the others and drops it where it lands', () => {
    const { f, el, grips } = render();
    el.querySelectorAll('li').forEach((li, i) => (li.getBoundingClientRect = () => ({ top: i * 50, bottom: i * 50 + 44, height: 44 }) as DOMRect));
    const fire = (type: string, y: number) => {
      grips()[0].dispatchEvent(Object.assign(new MouseEvent(type, { clientY: y, bubbles: true }), { pointerId: 1 }));
      f.detectChanges();
    };
    fire('pointerdown', 20);
    fire('pointermove', 125);
    const rows = el.querySelectorAll<HTMLElement>('li');
    expect(rows[0].classList).toContain('lift');
    expect(rows[0].style.transform).toBe('translateY(105px) rotate(-1deg) scale(1.03)');
    expect(rows[1].style.transform).toBe('translateY(-50px)');
    expect(rows[2].style.transform).toBe('translateY(-50px)');
    expect(rows[3].style.transform).toBe('');
    fire('pointerup', 125);
    expect(f.componentInstance.items()).toEqual(['Dilnoza', 'Jasur', 'Anvar', 'Madina']);
    expect(el.querySelector('li.lift')).toBeNull();
  });
});
