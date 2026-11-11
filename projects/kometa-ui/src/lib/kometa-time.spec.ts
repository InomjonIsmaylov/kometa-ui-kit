import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { KometaTime } from './kometa-time';

@Component({
  imports: [FormsModule, KometaTime],
  template: `<kometa-time inputId="t" [clearable]="clearable()" clearLabel="Tozalash" [step]="step()" [ngModel]="value()" (ngModelChange)="value.set($event)" />`,
})
class Host {
  value = signal<Date | null>(new Date(2000, 0, 1, 9, 30));
  clearable = signal(false);
  step = signal(15);
}

async function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el, btn: el.querySelector('#t') as HTMLButtonElement };
}
const times = (el: HTMLElement) => [...el.querySelectorAll<HTMLButtonElement>('.t')];

describe('KometaTime', () => {
  it('shows the held time and lists the day in 15-minute steps with the held one pressed', async () => {
    const { fixture, el, btn } = await mount();
    expect(btn.textContent!.trim()).toBe('09:30');
    btn.click();
    fixture.detectChanges();
    expect(times(el).length).toBe(96);
    expect(times(el).find((t) => t.getAttribute('aria-pressed') === 'true')!.textContent!.trim()).toBe('09:30');
    fixture.destroy();
  });

  it('picking a time writes a Date and closes the list', async () => {
    const { fixture, el, btn } = await mount();
    btn.click();
    fixture.detectChanges();
    times(el).find((t) => t.textContent!.trim() === '14:45')!.click();
    await fixture.whenStable();
    const v = fixture.componentInstance.value()!;
    expect([v.getHours(), v.getMinutes()]).toEqual([14, 45]);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.textContent!.trim()).toBe('14:45');
    fixture.destroy();
  });

  it('keeps a held time that is off the grid, selected', async () => {
    const { fixture, el, btn } = await mount();
    fixture.componentInstance.value.set(new Date(2000, 0, 1, 9, 7));
    fixture.detectChanges();
    await fixture.whenStable();
    btn.click();
    fixture.detectChanges();
    expect(times(el).length).toBe(97);
    expect(times(el).find((t) => t.getAttribute('aria-pressed') === 'true')!.textContent!.trim()).toBe('09:07');
    fixture.destroy();
  });

  it('clearable offers the word that takes the time away, writing null', async () => {
    const { fixture, el, btn } = await mount();
    fixture.componentInstance.clearable.set(true);
    fixture.detectChanges();
    btn.click();
    fixture.detectChanges();
    const clear = el.querySelector<HTMLButtonElement>('.clear')!;
    expect(clear.textContent!.trim()).toBe('Tozalash');
    clear.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBeNull();
    expect(btn.textContent!.trim()).toBe('—');
    fixture.destroy();
  });

  it('arrow keys move over the list and Escape closes it', async () => {
    const { fixture, el, btn } = await mount();
    btn.click();
    fixture.detectChanges();
    const pop = el.querySelector<HTMLElement>('.pop')!;
    const at = times(el).findIndex((t) => t.getAttribute('aria-pressed') === 'true');
    times(el)[at].focus();
    pop.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(times(el)[at + 1]);
    pop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fixture.destroy();
  });
});
