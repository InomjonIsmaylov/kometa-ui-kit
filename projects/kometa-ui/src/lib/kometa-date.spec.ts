import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaDate, KometaDateNames } from './kometa-date';

const RU: KometaDateNames = {
  monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  monthNamesShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  dayNamesMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  prev: 'Прошлый месяц',
  next: 'Следующий месяц',
};

@Component({
  imports: [KometaDate],
  template: `<k-date ariaLabel="Start" inputId="start-id" [min]="min()" [max]="max()" [names]="names()" [disabled]="disabled()" [(value)]="value" />`,
})
class Host {
  value = signal<Date | null>(new Date(2026, 9, 13));
  min = signal<Date | null>(null);
  max = signal<Date | null>(null);
  names = signal<KometaDateNames | null>(null);
  disabled = signal(false);
}

describe('KometaDate', () => {
  async function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('k-date') as HTMLElement;
    const btn = root.querySelector('button.btn') as HTMLButtonElement;
    const settle = async () => { f.detectChanges(); await f.whenStable(); f.detectChanges(); };
    const open = async () => { btn.click(); await settle(); };
    const days = () => [...root.querySelectorAll<HTMLButtonElement>('button.d')];
    const day = (n: number) => days().find((b) => Number(b.textContent) === n)!;
    return { f, root, btn, settle, open, days, day, list: () => root.querySelector('.pop') as HTMLElement };
  }

  it('is a button named by the caller that shows the date as a figure, and takes an id for a label', async () => {
    const { btn } = await render();
    expect(btn.textContent?.trim()).toBe('13 Oct 2026');
    expect(btn.getAttribute('aria-label')).toBe('Start');
    expect(btn.id).toBe('start-id');
    expect(btn.getAttribute('aria-haspopup')).toBe('dialog');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('shows the placeholder when there is no value, and writes nothing until a day is picked', async () => {
    const { f, btn } = await render();
    f.componentInstance.value.set(null);
    f.detectChanges();
    expect(btn.textContent?.trim()).toBe('—');
  });

  it('opens a month with the 1st on its Monday-first weekday and marks the chosen day', async () => {
    const { btn, open, days, day, root } = await render();
    await open();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('.head b')?.textContent?.trim()).toBe('October 2026');
    expect(days().length).toBe(31);
    // 1 October 2026 is a Thursday: three blanks (Mon, Tue, Wed) come first.
    expect(root.querySelectorAll('.grid > span').length).toBe(3);
    expect(day(13).getAttribute('aria-pressed')).toBe('true');
    expect(day(12).getAttribute('aria-pressed')).toBe('false');
    expect([...root.querySelectorAll('.dow span')].map((s) => s.textContent)).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
  });

  it('picks a day as local midnight, closes and puts focus back on the button', async () => {
    const { f, btn, open, day, settle } = await render();
    await open();
    day(20).click();
    await settle();
    const v = f.componentInstance.value()!;
    expect([v.getFullYear(), v.getMonth(), v.getDate(), v.getHours(), v.getMinutes()]).toEqual([2026, 9, 20, 0, 0]);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(btn);
    expect(btn.textContent?.trim()).toBe('20 Oct 2026');
  });

  it('turns days outside min and max off and stops the month arrows at the edge', async () => {
    const { f, open, day, root, settle } = await render();
    f.componentInstance.min.set(new Date(2026, 9, 10));
    f.componentInstance.max.set(new Date(2026, 9, 20));
    f.detectChanges();
    await open();
    expect(day(9).disabled).toBe(true);
    expect(day(10).disabled).toBe(false);
    expect(day(20).disabled).toBe(false);
    expect(day(21).disabled).toBe(true);
    const [prev, next] = [...root.querySelectorAll<HTMLButtonElement>('.nav')];
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(true);
    await settle();
  });

  it('moves between months with the arrows and names them in the caller\'s language', async () => {
    const { f, open, root, settle } = await render();
    f.componentInstance.names.set(RU);
    f.detectChanges();
    await open();
    expect(root.querySelector('.head b')?.textContent?.trim()).toBe('Октябрь 2026');
    const [prev, next] = [...root.querySelectorAll<HTMLButtonElement>('.nav')];
    expect(prev.getAttribute('aria-label')).toBe('Прошлый месяц');
    next.click();
    await settle();
    expect(root.querySelector('.head b')?.textContent?.trim()).toBe('Ноябрь 2026');
    expect([...root.querySelectorAll('.dow span')][0].textContent).toBe('Пн');
    expect((root.querySelector('button.btn') as HTMLElement).textContent?.trim()).toBe('13 Окт 2026');
  });

  it('moves focus by day and week with the arrow keys, across the month edge', async () => {
    const { f, open, day, root, settle } = await render();
    f.componentInstance.value.set(new Date(2026, 9, 30));
    f.detectChanges();
    await open();
    day(30).focus();
    day(30).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await settle();
    expect(document.activeElement?.textContent?.trim()).toBe('31');
    (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await settle();
    expect(root.querySelector('.head b')?.textContent?.trim()).toBe('November 2026');
    expect(document.activeElement?.textContent?.trim()).toBe('1');
    (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
    await settle();
    expect(root.querySelector('.head b')?.textContent?.trim()).toBe('October 2026');
  });

  it('closes on Escape and refocuses the button, and closes on Tab without moving focus', async () => {
    const { btn, open, day, settle } = await render();
    await open();
    day(13).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(btn);
    await open();
    day(13).dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await settle();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on a press outside and can be disabled', async () => {
    const { f, btn, open, settle } = await render();
    await open();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await settle();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    f.componentInstance.disabled.set(true);
    f.detectChanges();
    expect(btn.disabled).toBe(true);
  });

  it('inline range: two taps hold a period (an earlier second tap swaps), the days between are tinted', async () => {
    const f = TestBed.createComponent(RangeHost);
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    const root = f.nativeElement as HTMLElement;
    const day = (n: number) => [...root.querySelectorAll<HTMLButtonElement>('button.d')].find((b) => Number(b.textContent) === n)!;
    expect(root.querySelector('button.btn')).toBeNull();
    day(20).click();
    f.detectChanges();
    expect(f.componentInstance.range()?.[1]).toBeNull();
    day(12).click();
    f.detectChanges();
    const [a, b] = f.componentInstance.range()!;
    expect([a!.getDate(), b!.getDate()]).toEqual([12, 20]);
    expect(root.querySelectorAll('button.d.mid').length).toBe(7);
    expect(day(12).getAttribute('aria-pressed')).toBe('true');
    expect(day(20).getAttribute('aria-pressed')).toBe('true');
  });
});

@Component({
  imports: [KometaDate],
  template: `<k-date inline range [(rangeValue)]="range" />`,
})
class RangeHost {
  range = signal<(Date | null)[] | null>([new Date(2026, 9, 13), new Date(2026, 9, 14)]);
}

@Component({
  imports: [KometaDate],
  template: `<k-date inline [weekStart]="0" />`,
})
class SundayHost {}

describe('KometaDate weekStart', () => {
  it('starts the week on Sunday when asked', () => {
    const f = TestBed.createComponent(SundayHost);
    f.detectChanges();
    const first = f.nativeElement.querySelector('.dow span') as HTMLElement;
    expect(first.textContent).toBe('Su');
  });
});
