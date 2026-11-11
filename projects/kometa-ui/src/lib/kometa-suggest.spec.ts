import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { KometaSuggest, type KometaSuggestion } from './kometa-suggest';

@Component({
  imports: [KometaSuggest],
  template: `<kometa-suggest inputId="s" [delay]="10" [(value)]="text" [suggestions]="rows()" (query)="asked.push($event)" (picked)="got.push($event.label)" />`,
})
class Host {
  text = signal('');
  rows = signal<KometaSuggestion[]>([]);
  asked: string[] = [];
  got: string[] = [];
}

const ROWS: KometaSuggestion[] = [{ label: 'Jasur', meta: '+998 90' }, { label: 'Jamshid' }];

async function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const input = el.querySelector('#s') as HTMLInputElement;
  const type = async (v: string) => {
    input.value = v;
    input.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 30));
    fixture.detectChanges();
  };
  const answer = async () => {
    fixture.componentInstance.rows.set(ROWS);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  return { fixture, el, input, type, answer, host: fixture.componentInstance };
}

describe('KometaSuggest', () => {
  it('asks from two letters, after the delay, and lists what comes back', async () => {
    const { fixture, el, type, answer, host } = await mount();
    await type('J');
    expect(host.asked).toEqual([]);
    await type('Ja');
    expect(host.asked).toEqual(['Ja']);
    await answer();
    expect(el.querySelectorAll('.opt').length).toBe(2);
    fixture.destroy();
  });

  it('Arrow Down then Enter picks a row and fills the field', async () => {
    const { fixture, el, input, type, answer, host } = await mount();
    await type('Ja');
    await answer();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(host.got).toEqual(['Jasur']);
    expect(host.text()).toBe('Jasur');
    expect(el.querySelectorAll('.opt').length).toBe(0);
    fixture.destroy();
  });

  it('a pointer down outside closes the list', async () => {
    const { fixture, el, type, answer } = await mount();
    await type('Ja');
    await answer();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelectorAll('.opt').length).toBe(0);
    fixture.destroy();
  });
});
