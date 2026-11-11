import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { KometaButton } from './kometa-button';

@Component({
  imports: [KometaButton],
  template: `
    <kometa-button id="a" label="Save" [disabled]="off()" [loading]="busy()" (clicked)="hits.set(hits() + 1)" />
    <kometa-button id="b" label="Cancel" severity="secondary" [outlined]="true" size="small" styleClass="mine" />
    <kometa-button id="c" label="Delete" severity="danger" [fluid]="true" type="submit" ariaLabel="Delete it" />
  `,
})
class Host {
  off = signal(false);
  busy = signal(false);
  hits = signal(0);
}

describe('KometaButton', () => {
  const mount = () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const q = (id: string) => f.nativeElement.querySelector(`#${id} button`) as HTMLButtonElement;
    return { f, q };
  };

  it('is a real button that carries the label and emits the click', () => {
    const { f, q } = mount();
    expect(q('a').textContent!.trim()).toBe('Save');
    expect(q('a').type).toBe('button');
    q('a').click();
    expect(f.componentInstance.hits()).toBe(1);
  });

  it('draws the severity, outlined, small and the caller class on the inner button', () => {
    const { q } = mount();
    const b = q('b');
    expect(['kbtn', 'secondary', 'outlined', 'sm', 'mine'].every((c) => b.classList.contains(c))).toBe(true);
    expect(q('a').classList.contains('secondary')).toBe(false);
    expect(q('c').classList.contains('danger')).toBe(true);
    expect(q('c').type).toBe('submit');
    expect(q('c').getAttribute('aria-label')).toBe('Delete it');
  });

  it('disabled and loading both block the tap; loading shows the spinner and aria-busy', () => {
    const { f, q } = mount();
    f.componentInstance.off.set(true);
    f.detectChanges();
    expect(q('a').disabled).toBe(true);
    q('a').click();
    expect(f.componentInstance.hits()).toBe(0);
    f.componentInstance.off.set(false);
    f.componentInstance.busy.set(true);
    f.detectChanges();
    expect(q('a').disabled).toBe(true);
    expect(q('a').getAttribute('aria-busy')).toBe('true');
    expect(q('a').querySelector('.kbtn-spin')).not.toBeNull();
  });

  it('fluid puts the width on the host', () => {
    const { f } = mount();
    expect((f.nativeElement.querySelector('#c') as HTMLElement).classList.contains('kbtn-fluid')).toBe(true);
  });
});

@Component({
  imports: [KometaButton],
  template: `<kometa-button id="l" label="Go" icon="+" /><kometa-button id="r" label="Go" icon="→" iconPos="right" />`,
})
class IconHost {}

describe('KometaButton icon', () => {
  it('puts the icon before or after the label', () => {
    const f = TestBed.createComponent(IconHost);
    f.detectChanges();
    const kids = (id: string) => [...f.nativeElement.querySelector(`#${id} button`).children].map((c: HTMLElement) => c.className);
    expect(kids('l')).toEqual(['kbtn-icon', 'kbtn-label']);
    expect(kids('r')).toEqual(['kbtn-label', 'kbtn-icon']);
  });
});
